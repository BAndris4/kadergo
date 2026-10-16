// ==============================================================================
// KaderGo - Tax Gov UA Z-Reports Excel Downloader (Direct .xlsx with 1:1 format)
// ==============================================================================

(function () {
  'use strict';

  const BASE_COLUMNS = [
    'Фіскальний номер документа',
    'Дата і час документа',
    'Фіскальний номер РРО/ПРРО',
    'Реалізація - Кількість чеків',
    'Реалізація - Загальна сума',
    'Реалізація - Готівкова сума',
    'Реалізація - Безготівкова сума'
  ];

  const RETURN_COLUMNS = [
    'Повернення - Загальна сума',
    'Повернення - Готівкова сума',
    'Повернення - Безготівкова сума'
  ];

  const ALL_RETURN_INDICATOR_KEYWORDS = [
    'Повернення - Кількість чеків',
    'Повернення - Загальна сума',
    'Повернення - Готівкова сума',
    'Повернення - Безготівкова сума',
    'Повернення - Вихідна сума'
  ];

  const UKRAINIAN_MONTHS = [
    'січень', 'лютий', 'березень', 'квітень', 'травень', 'червень',
    'липень', 'серпень', 'вересень', 'жовтень', 'листопад', 'грудень'
  ];

  let btnEl = null;
  let iconEl = null;
  let labelEl = null;
  let badgeEl = null;
  let lastCount = -1;
  let isDownloading = false;

  // ----------------------------------------------------------------------------
  // 1. Вбудований генератор ZIP (без зовнішніх бібліотек)
  // ----------------------------------------------------------------------------
  const crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[i] = c;
  }

  function crc32(buf) {
    let crc = 0 ^ (-1);
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
  }

  const textEncoder = new TextEncoder();

  class SimpleZip {
    constructor() {
      this.files = [];
    }

    addFile(name, content) {
      const data = typeof content === 'string' ? textEncoder.encode(content) : content;
      const nameBuf = textEncoder.encode(name);
      const crc = crc32(data);
      this.files.push({
        name,
        nameBuf,
        data,
        crc,
        size: data.length
      });
    }

    toUint8Array() {
      let totalSize = 22; // EOCD size
      for (const f of this.files) {
        totalSize += 30 + f.nameBuf.length + f.size; // Local header + data
        totalSize += 46 + f.nameBuf.length;          // Central header
      }

      const out = new Uint8Array(totalSize);
      const view = new DataView(out.buffer);

      let offset = 0;
      const centralOffsets = [];

      // Local headers + data
      for (const f of this.files) {
        centralOffsets.push(offset);

        view.setUint32(offset, 0x04034b50, true);
        view.setUint16(offset + 4, 20, true);
        view.setUint16(offset + 6, 0x0800, true); // UTF-8
        view.setUint16(offset + 8, 0, true);      // stored
        view.setUint16(offset + 10, 0x4000, true);
        view.setUint16(offset + 12, 0x5600, true);
        view.setUint32(offset + 14, f.crc, true);
        view.setUint32(offset + 18, f.size, true);
        view.setUint32(offset + 22, f.size, true);
        view.setUint16(offset + 26, f.nameBuf.length, true);
        view.setUint16(offset + 28, 0, true);

        out.set(f.nameBuf, offset + 30);
        out.set(f.data, offset + 30 + f.nameBuf.length);

        offset += 30 + f.nameBuf.length + f.size;
      }

      const centralDirOffset = offset;

      // Central directory headers
      for (let i = 0; i < this.files.length; i++) {
        const f = this.files[i];
        const localOffset = centralOffsets[i];

        view.setUint32(offset, 0x02014b50, true);
        view.setUint16(offset + 4, 20, true);
        view.setUint16(offset + 6, 20, true);
        view.setUint16(offset + 8, 0x0800, true);
        view.setUint16(offset + 10, 0, true);
        view.setUint16(offset + 12, 0x4000, true);
        view.setUint16(offset + 14, 0x5600, true);
        view.setUint32(offset + 16, f.crc, true);
        view.setUint32(offset + 20, f.size, true);
        view.setUint32(offset + 24, f.size, true);
        view.setUint16(offset + 28, f.nameBuf.length, true);
        view.setUint16(offset + 30, 0, true);
        view.setUint16(offset + 32, 0, true);
        view.setUint16(offset + 34, 0, true);
        view.setUint16(offset + 36, 0, true);
        view.setUint32(offset + 38, 0, true);
        view.setUint32(offset + 42, localOffset, true);

        out.set(f.nameBuf, offset + 46);
        offset += 46 + f.nameBuf.length;
      }

      const centralDirSize = offset - centralDirOffset;

      // End of central directory record
      view.setUint32(offset, 0x06054b50, true);
      view.setUint16(offset + 4, 0, true);
      view.setUint16(offset + 6, 0, true);
      view.setUint16(offset + 8, this.files.length, true);
      view.setUint16(offset + 10, this.files.length, true);
      view.setUint32(offset + 12, centralDirSize, true);
      view.setUint32(offset + 16, centralDirOffset, true);
      view.setUint16(offset + 20, 0, true);

      return out;
    }
  }

  function escapeXml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  // ----------------------------------------------------------------------------
  // 2. Створення файлу Excel (.xlsx) з точним 1:1 форматуванням з excel.xlsx
  // ----------------------------------------------------------------------------
  function buildXlsxBlob(data) {
    const { headers, rows, periodLabel } = data;
    const numRows = rows.length;
    const lastRow = numRows + 1;
    const summaryRowIndex = numRows + 2;

    const zip = new SimpleZip();

    // 1. [Content_Types].xml
    zip.addFile('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`);

    // 2. _rels/.rels
    zip.addFile('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`);

    // 3. xl/_rels/workbook.xml.rels
    zip.addFile('xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`);

    // 4. xl/workbook.xml
    zip.addFile('xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Z-Звіти" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`);

    // 5. xl/styles.xml (Точні стилі: тонка межа borderId=1, Calibri 11, bold, wrapText)
    zip.addFile('xl/styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font>
      <sz val="11"/>
      <color theme="1"/>
      <name val="Calibri"/>
      <family val="2"/>
    </font>
    <font>
      <b/>
      <sz val="11"/>
      <color theme="1"/>
      <name val="Calibri"/>
      <family val="2"/>
    </font>
  </fonts>
  <fills count="2">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color indexed="64"/></left>
      <right style="thin"><color indexed="64"/></right>
      <top style="thin"><color indexed="64"/></top>
      <bottom style="thin"><color indexed="64"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="7">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center" wrapText="1"/>
    </xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="left" vertical="center"/>
    </xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center"/>
    </xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="right" vertical="center"/>
    </xf>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center"/>
    </xf>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="right" vertical="center"/>
    </xf>
  </cellXfs>
</styleSheet>`);

    // 6. xl/worksheets/sheet1.xml (Точні розміри: 18, 18, 17.43, 14.43, 14, 14.57, 17.71)
    let colsXml = `<cols>
    <col min="1" max="2" width="18" bestFit="1" customWidth="1"/>
    <col min="3" max="3" width="17.42578125" bestFit="1" customWidth="1"/>
    <col min="4" max="4" width="14.42578125" bestFit="1" customWidth="1"/>
    <col min="5" max="5" width="14" bestFit="1" customWidth="1"/>
    <col min="6" max="6" width="14.5703125" bestFit="1" customWidth="1"/>
    <col min="7" max="7" width="17.7109375" bestFit="1" customWidth="1"/>`;
    if (headers.length > 7) {
      colsXml += `
    <col min="8" max="8" width="14" bestFit="1" customWidth="1"/>
    <col min="9" max="9" width="14.5703125" bestFit="1" customWidth="1"/>
    <col min="10" max="10" width="17.7109375" bestFit="1" customWidth="1"/>`;
    }
    colsXml += `\n  </cols>`;

    let sheetDataXml = `<sheetData>\n`;

    // Рядок 1: Заголовки (ht="30.75" customHeight="1", s="1" - центрований, жирний, з переносом слів)
    sheetDataXml += `    <row r="1" ht="30.75" customHeight="1">\n`;
    for (let c = 0; c < headers.length; c++) {
      const colLetter = String.fromCharCode(65 + c);
      sheetDataXml += `      <c r="${colLetter}1" s="1" t="inlineStr"><is><t>${escapeXml(headers[c])}</t></is></c>\n`;
    }
    sheetDataXml += `    </row>\n`;

    // Рядки даних (ht="15" customHeight="1", тонка межа)
    for (let i = 0; i < rows.length; i++) {
      const rNum = i + 2;
      const r = rows[i];
      sheetDataXml += `    <row r="${rNum}" ht="15" customHeight="1">\n`;
      for (let c = 0; c < r.length; c++) {
        const colLetter = String.fromCharCode(65 + c);
        const val = r[c];
        if (c === 0) {
          sheetDataXml += `      <c r="${colLetter}${rNum}" s="2" t="inlineStr"><is><t>${escapeXml(val)}</t></is></c>\n`;
        } else if (c >= 1 && c <= 3) {
          if (typeof val === 'number') {
            sheetDataXml += `      <c r="${colLetter}${rNum}" s="3" t="n"><v>${val}</v></c>\n`;
          } else {
            sheetDataXml += `      <c r="${colLetter}${rNum}" s="3" t="inlineStr"><is><t>${escapeXml(val)}</t></is></c>\n`;
          }
        } else {
          const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/\s+/g, '').replace(',', '.'));
          if (!isNaN(num)) {
            sheetDataXml += `      <c r="${colLetter}${rNum}" s="4" t="n"><v>${num}</v></c>\n`;
          } else {
            sheetDataXml += `      <c r="${colLetter}${rNum}" s="4" t="inlineStr"><is><t>${escapeXml(val)}</t></is></c>\n`;
          }
        }
      }
      sheetDataXml += `    </row>\n`;
    }

    // Підсумковий рядок (A:D об'єднані, формула SUM)
    sheetDataXml += `    <row r="${summaryRowIndex}" ht="15" customHeight="1">\n`;
    sheetDataXml += `      <c r="A${summaryRowIndex}" s="5" t="inlineStr"><is><t>${escapeXml(periodLabel)}</t></is></c>\n`;
    sheetDataXml += `      <c r="B${summaryRowIndex}" s="5"/>\n`;
    sheetDataXml += `      <c r="C${summaryRowIndex}" s="5"/>\n`;
    sheetDataXml += `      <c r="D${summaryRowIndex}" s="5"/>\n`;

    for (let c = 4; c < headers.length; c++) {
      const colLetter = String.fromCharCode(65 + c);
      sheetDataXml += `      <c r="${colLetter}${summaryRowIndex}" s="6"><f>SUM(${colLetter}2:${colLetter}${lastRow})</f></c>\n`;
    }
    sheetDataXml += `    </row>\n`;
    sheetDataXml += `  </sheetData>`;

    const mergeXml = `  <mergeCells count="1">
    <mergeCell ref="A${summaryRowIndex}:D${summaryRowIndex}"/>
  </mergeCells>`;

    zip.addFile('xl/worksheets/sheet1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetFormatPr defaultRowHeight="15"/>
  ${colsXml}
  ${sheetDataXml}
  ${mergeXml}
</worksheet>`);

    const uint8 = zip.toUint8Array();
    return new Blob([uint8], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
  }

  // ----------------------------------------------------------------------------
  // 3. Збереження файлу з діалогом вибору папки (Save As)
  // ----------------------------------------------------------------------------
  async function promptAndSaveFile(blob, defaultFileName) {
    // 1. Спроба через File System Access API (відкриває нативний діалог "Зберегти як")
    if (typeof window.showSaveFilePicker === 'function') {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: defaultFileName,
          types: [
            {
              description: 'Книга Excel (*.xlsx)',
              accept: {
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
              }
            }
          ]
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return handle.name || defaultFileName;
      } catch (err) {
        if (err && err.name === 'AbortError') {
          // Користувач натиснув «Скасувати»
          return null;
        }
      }
    }

    // 2. Резервний спосіб через <a> download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultFileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
    return defaultFileName;
  }

  // ----------------------------------------------------------------------------
  // 4. Пошук та вилучення даних
  // ----------------------------------------------------------------------------
  function parseNumeric(val, isReturn) {
    if (val === undefined || val === null) return isReturn ? 0 : 0;
    const str = String(val).replace(/\u00A0/g, ' ').replace(/\s+/g, '').replace(',', '.').trim();
    if (str === '' || str.toLowerCase() === 'false') return isReturn ? 0 : 0;
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  }

  function findTable() {
    const byId = document.getElementById('pn_id_4-table');
    if (byId) return byId;

    const tables = document.getElementsByTagName('table');
    for (let i = 0; i < tables.length; i++) {
      if (tables[i].classList.contains('p-datatable-table')) {
        return tables[i];
      }
    }
    return null;
  }

  function getTableHeaders(table) {
    let ths = table.querySelectorAll('thead th');
    if (ths.length === 0) {
      const parent = table.closest('.p-datatable');
      if (parent) ths = parent.querySelectorAll('.p-datatable-thead th');
    }
    const headers = [];
    for (let i = 0; i < ths.length; i++) {
      headers.push((ths[i].textContent || '').replace(/\s+/g, ' ').trim());
    }
    return headers;
  }

  function detectPeriodInfo(rows, dateColIdx) {
    if (!rows || rows.length === 0 || dateColIdx === undefined) {
      return { periodLabel: 'оборот', monthName: 'звіт' };
    }
    for (let i = 0; i < rows.length; i++) {
      const dateStr = rows[i][dateColIdx];
      const match = dateStr && String(dateStr).match(/\b(\d{2})\.(\d{2})\.(\d{4})\b/);
      if (match) {
        const monthNum = parseInt(match[2], 10);
        const year = match[3];
        if (monthNum >= 1 && monthNum <= 12) {
          const mName = UKRAINIAN_MONTHS[monthNum - 1];
          return {
            periodLabel: `оборот за ${mName} ${year}`,
            monthName: mName
          };
        }
      }
    }
    return { periodLabel: 'оборот', monthName: 'звіт' };
  }

  function extractTableData() {
    const table = findTable();
    if (!table) {
      throw new Error('Таблицю не знайдено на сторінці.');
    }

    const headers = getTableHeaders(table);
    const colIndexMap = {};
    for (let i = 0; i < headers.length; i++) {
      colIndexMap[headers[i]] = i;
    }

    const tbody = table.querySelector('tbody');
    if (!tbody) {
      throw new Error('Тіло таблиці не знайдено.');
    }

    const trs = tbody.children;
    const validRows = [];
    for (let i = 0; i < trs.length; i++) {
      const tr = trs[i];
      if (tr.cells && tr.cells.length > 3 && !tr.classList.contains('p-datatable-emptymessage')) {
        validRows.push(tr);
      }
    }

    if (validRows.length === 0) {
      throw new Error('У таблиці наразі немає рядків для експорту.');
    }

    let hasReturns = false;
    for (let i = 0; i < validRows.length; i++) {
      const cells = validRows[i].cells;
      for (let k = 0; k < ALL_RETURN_INDICATOR_KEYWORDS.length; k++) {
        const idx = colIndexMap[ALL_RETURN_INDICATOR_KEYWORDS[k]];
        if (idx !== undefined && cells[idx]) {
          const txt = (cells[idx].textContent || '').trim().replace(',', '.').replace(/\s+/g, '');
          const num = parseFloat(txt);
          if (!isNaN(num) && num > 0) {
            hasReturns = true;
            break;
          }
        }
      }
      if (hasReturns) break;
    }

    const finalCols = [...BASE_COLUMNS];
    if (hasReturns) {
      finalCols.push(...RETURN_COLUMNS);
    }

    const exportRows = [];
    for (let i = 0; i < validRows.length; i++) {
      const cells = validRows[i].cells;
      const rowData = [];
      for (let c = 0; c < finalCols.length; c++) {
        const colName = finalCols[c];
        const colIdx = colIndexMap[colName];
        const isReturn = RETURN_COLUMNS.includes(colName);
        const isNum = colName.includes('сума') || colName.includes('Кількість');

        if (colIdx === undefined || !cells[colIdx]) {
          rowData.push(isNum ? 0 : '');
        } else {
          const raw = (cells[colIdx].textContent || '').trim();
          if (isNum) {
            rowData.push(parseNumeric(raw, isReturn));
          } else {
            rowData.push(raw);
          }
        }
      }
      exportRows.push(rowData);
    }

    const dateColIdx = finalCols.indexOf('Дата і час документа');
    const { periodLabel, monthName } = detectPeriodInfo(exportRows, dateColIdx);

    return {
      headers: finalCols,
      rows: exportRows,
      rowCount: exportRows.length,
      hasReturns,
      periodLabel,
      monthName
    };
  }

  // ----------------------------------------------------------------------------
  // 5. Toast сповіщення (стиль KaderGo)
  // ----------------------------------------------------------------------------
  function showToast(title, type, subtitle) {
    const prev = document.getElementById('tax-gov-toast');
    if (prev) prev.remove();

    const toast = document.createElement('div');
    toast.id = 'tax-gov-toast';
    toast.className = `tax-gov-toast ${type}`;

    const icon = document.createElement('div');
    icon.className = 'toast-icon';
    icon.textContent = type === 'success' ? '✓' : '!';

    const body = document.createElement('div');
    body.className = 'toast-body';

    const titleEl = document.createElement('div');
    titleEl.className = 'toast-title';
    titleEl.textContent = title;
    body.appendChild(titleEl);

    if (subtitle) {
      const subEl = document.createElement('div');
      subEl.className = 'toast-sub';
      subEl.textContent = subtitle;
      body.appendChild(subEl);
    }

    toast.appendChild(icon);
    toast.appendChild(body);

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }

  // ----------------------------------------------------------------------------
  // 6. Створення стильної фірмової кнопки над таблицею
  // ----------------------------------------------------------------------------
  function updateDownloadButton(table) {
    const tbody = table.querySelector('tbody');
    let rowCount = 0;
    if (tbody) {
      const trs = tbody.children;
      for (let i = 0; i < trs.length; i++) {
        const tr = trs[i];
        if (tr.cells && tr.cells.length > 3 && !tr.classList.contains('p-datatable-emptymessage')) {
          rowCount++;
        }
      }
    }

    if (!btnEl) {
      btnEl = document.createElement('button');
      btnEl.id = 'tax-gov-download-excel-btn';
      btnEl.className = 'tax-gov-kadergo-btn';
      btnEl.type = 'button';
      btnEl.setAttribute('title', 'Завантажити Z-звіти у файлі Excel (.xlsx) з точним форматуванням 1:1');

      // Елегантна іконка Excel зі стрілкою
      iconEl = document.createElement('span');
      iconEl.className = 'btn-icon';
      iconEl.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><polyline points="9 15 12 18 15 15"></polyline></svg>`;

      labelEl = document.createElement('span');
      labelEl.className = 'btn-label';
      labelEl.textContent = 'Завантажити Excel (.xlsx)';

      badgeEl = document.createElement('span');
      badgeEl.className = 'btn-badge';

      btnEl.appendChild(iconEl);
      btnEl.appendChild(labelEl);
      btnEl.appendChild(badgeEl);

      btnEl.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (isDownloading) return;
        isDownloading = true;
        btnEl.classList.add('loading');
        labelEl.textContent = 'Формування Excel...';

        try {
          const data = extractTableData();
          const defaultFileName = `${data.monthName}.xlsx`;
          const blob = buildXlsxBlob(data);

          const savedName = await promptAndSaveFile(blob, defaultFileName);
          if (savedName) {
            showToast('Файл збережено!', 'success', `${savedName} (${data.rowCount} рядків) успішно завантажено.`);
            labelEl.textContent = '✓ Збережено!';
            btnEl.classList.add('success');
          } else {
            // Скасовано користувачем
            labelEl.textContent = 'Завантажити Excel (.xlsx)';
          }

          setTimeout(() => {
            btnEl.classList.remove('success', 'loading');
            labelEl.textContent = 'Завантажити Excel (.xlsx)';
            isDownloading = false;
          }, 1800);
        } catch (err) {
          showToast('Помилка', 'error', err.message || 'Не вдалося створити файл Excel');
          btnEl.classList.remove('loading');
          labelEl.textContent = 'Помилка!';
          setTimeout(() => {
            labelEl.textContent = 'Завантажити Excel (.xlsx)';
            isDownloading = false;
          }, 2000);
        }
      });

      const container = document.createElement('div');
      container.id = 'tax-gov-btn-container';
      container.appendChild(btnEl);

      const tableWrapper = table.closest('.p-datatable') || table.parentElement;
      if (tableWrapper && tableWrapper.parentElement) {
        tableWrapper.parentElement.insertBefore(container, tableWrapper);
      } else {
        document.body.appendChild(container);
      }
    }

    if (rowCount !== lastCount) {
      lastCount = rowCount;
      if (rowCount > 0) {
        badgeEl.textContent = `${rowCount}`;
        badgeEl.style.display = 'inline-flex';
        btnEl.disabled = false;
      } else {
        badgeEl.style.display = 'none';
        btnEl.disabled = true;
      }
    }
  }

  // ----------------------------------------------------------------------------
  // 7. Легкий опитувач
  // ----------------------------------------------------------------------------
  let pollInterval = null;

  function checkTablePresence() {
    const table = findTable();
    if (table) {
      updateDownloadButton(table);
    } else {
      if (btnEl) {
        btnEl.remove();
        btnEl = null;
        lastCount = -1;
      }
    }
  }

  function startLightweightPolling() {
    if (pollInterval) clearInterval(pollInterval);
    checkTablePresence();
    pollInterval = setInterval(checkTablePresence, 1200);
  }

  // ----------------------------------------------------------------------------
  // 8. Обробка повідомлень від Popup
  // ----------------------------------------------------------------------------
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'GET_STATUS') {
        const table = findTable();
        if (!table) {
          sendResponse({ found: false, count: 0, defaultName: 'звіт.xlsx' });
          return true;
        }
        let count = 0;
        const tbody = table.querySelector('tbody');
        if (tbody) {
          const trs = tbody.children;
          for (let i = 0; i < trs.length; i++) {
            if (trs[i].cells && trs[i].cells.length > 3 && !trs[i].classList.contains('p-datatable-emptymessage')) {
              count++;
            }
          }
        }
        let monthName = 'звіт';
        try {
          const data = extractTableData();
          monthName = data.monthName;
        } catch (e) {}

        sendResponse({ found: true, count, defaultName: `${monthName}.xlsx` });
        return true;
      }

      if (request.action === 'TRIGGER_DOWNLOAD') {
        try {
          const data = extractTableData();
          const defaultFileName = `${data.monthName}.xlsx`;
          const blob = buildXlsxBlob(data);

          promptAndSaveFile(blob, defaultFileName).then((savedName) => {
            if (savedName) {
              showToast('Файл збережено!', 'success', `${savedName} завантажено.`);
              sendResponse({ success: true, count: data.rowCount, fileName: savedName });
            } else {
              sendResponse({ success: false, cancelled: true });
            }
          }).catch((err) => {
            sendResponse({ success: false, error: err.message });
          });
        } catch (err) {
          sendResponse({ success: false, error: err.message });
        }
        return true;
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startLightweightPolling);
  } else {
    startLightweightPolling();
  }
})();
