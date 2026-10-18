// ==============================================================================
// KaderGo - Tax Gov UA Turnover Excel Downloader (Direct .xlsx with 1:1 format)
// Only registered and activated on: https://cabinet.tax.gov.ua/cashregs/zreports
// ==============================================================================

(function () {
  'use strict';

  const TARGET_URL_PREFIX = 'https://cabinet.tax.gov.ua/cashregs/zreports';

  function isTargetPage() {
    try {
      const href = window.location.href;
      return href.startsWith(TARGET_URL_PREFIX);
    } catch (e) {
      return false;
    }
  }

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

  let wrapperEl = null;
  let btnEl = null;
  let spinnerEl = null;
  let labelEl = null;
  let btnAllEl = null;
  let spinnerAllEl = null;
  let labelAllEl = null;
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

  function uint8ToBase64(uint8) {
    let binary = '';
    const len = uint8.byteLength;
    const chunkSize = 0x8000;
    for (let i = 0; i < len; i += chunkSize) {
      binary += String.fromCharCode.apply(null, uint8.subarray(i, Math.min(i + chunkSize, len)));
    }
    return btoa(binary);
  }

  // ----------------------------------------------------------------------------
  // 2. Створення файлу Excel (.xlsx) з точними параметрами KaderGo
  // ----------------------------------------------------------------------------
  function buildXlsxData(data) {
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
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`);

    // 2. _rels/.rels
    zip.addFile('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`);

    // 3. docProps/core.xml
    const nowIso = new Date().toISOString();
    zip.addFile('docProps/core.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:creator>KaderGo</dc:creator>
  <cp:lastModifiedBy>KaderGo</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${nowIso}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${nowIso}</dcterms:modified>
</cp:coreProperties>`);

    // 4. docProps/app.xml
    zip.addFile('docProps/app.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Microsoft Excel</Application>
  <DocSecurity>0</DocSecurity>
  <ScaleCrop>false</ScaleCrop>
  <HeadingPairs>
    <vt:vector size="2" baseType="variant">
      <vt:variant><vt:lpstr>Worksheets</vt:lpstr></vt:variant>
      <vt:variant><vt:i4>1</vt:i4></vt:variant>
    </vt:vector>
  </HeadingPairs>
  <TitlesOfParts>
    <vt:vector size="1" baseType="lpstr">
      <vt:lpstr>Оборот</vt:lpstr>
    </vt:vector>
  </TitlesOfParts>
  <Company>KaderGo</Company>
  <LinksUpToDate>false</LinksUpToDate>
  <SharedDoc>false</SharedDoc>
  <HyperlinksChanged>false</HyperlinksChanged>
  <AppVersion>16.0300</AppVersion>
</Properties>`);

    // 5. xl/_rels/workbook.xml.rels
    zip.addFile('xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`);

    // 6. xl/workbook.xml
    zip.addFile('xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <workbookPr defaultThemeVersion="166925"/>
  <bookViews>
    <workbookView xWindow="0" yWindow="0" windowWidth="28800" windowHeight="14400"/>
  </bookViews>
  <sheets>
    <sheet name="Оборот" sheetId="1" r:id="rId1"/>
  </sheets>
  <calcPr calcId="191029"/>
</workbook>`);

    // 7. xl/styles.xml
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
      <left style="thin"><color auto="1"/></left>
      <right style="thin"><color auto="1"/></right>
      <top style="thin"><color auto="1"/></top>
      <bottom style="thin"><color auto="1"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="7">
    <!-- 0: Default Normal -->
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <!-- 1: Header (bold, center, center, wrapText, border) -->
    <xf numFmtId="0" fontId="1" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center" wrapText="1"/>
    </xf>
    <!-- 2: Data Col A (text, left, center, border) -->
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1">
      <alignment horizontal="left" vertical="center"/>
    </xf>
    <!-- 3: Data Col B..D (center, center, border) -->
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center"/>
    </xf>
    <!-- 4: Data Col E.. (number, right, center, border) -->
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1">
      <alignment horizontal="right" vertical="center"/>
    </xf>
    <!-- 5: Summary merged A..D (bold, center, center, border) -->
    <xf numFmtId="0" fontId="1" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center"/>
    </xf>
    <!-- 6: Summary formulas E.. (bold, right, center, border) -->
    <xf numFmtId="0" fontId="1" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="right" vertical="center"/>
    </xf>
  </cellXfs>
  <cellStyles count="1">
    <cellStyle name="Normal" xfId="0" builtinId="0"/>
  </cellStyles>
</styleSheet>`);

    // 6. Точні параметри ширини стовпців:
    // A: 27.86 (200 px)
    // B: 17.86 (130 px)
    // C: 17.86 (130 px)
    // D-F: 15.00 (110 px)
    // G (та H-J якщо є повернення): 17.86 (130 px)
    const colWidths = [
      { min: 1, max: 1, width: 27.86 }, // A: Фіскальний номер документа (200 px)
      { min: 2, max: 2, width: 17.86 }, // B: Дата і час документа (130 px)
      { min: 3, max: 3, width: 17.86 }, // C: Фіскальний номер РРО/ПРРО (130 px)
      { min: 4, max: 4, width: 15.00 }, // D: Реалізація - Кількість чеків (110 px)
      { min: 5, max: 5, width: 15.00 }, // E: Реалізація - Загальна сума (110 px)
      { min: 6, max: 6, width: 15.00 }, // F: Реалізація - Готівкова сума (110 px)
      { min: 7, max: 7, width: 17.86 }, // G: Реалізація - Безготівкова сума (130 px)
      { min: 8, max: 8, width: 17.86 }, // H: Повернення - Загальна сума (130 px)
      { min: 9, max: 9, width: 17.86 }, // I: Повернення - Готівкова сума (130 px)
      { min: 10, max: 10, width: 17.86 } // J: Повернення - Безготівкова сума (130 px)
    ];

    let colsXml = '<cols>\n';
    for (let i = 0; i < headers.length; i++) {
      const w = (colWidths[i] && colWidths[i].width) || 17.86;
      colsXml += `  <col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>\n`;
    }
    colsXml += '</cols>';

    let sheetDataXml = '<sheetData>\n';

    // Рядок 1: Заголовки (ht="45" customHeight="1")
    sheetDataXml += `  <row r="1" ht="45" customHeight="1">\n`;
    for (let c = 0; c < headers.length; c++) {
      const colLetter = String.fromCharCode(65 + c);
      sheetDataXml += `    <c r="${colLetter}1" s="1" t="inlineStr"><is><t>${escapeXml(headers[c])}</t></is></c>\n`;
    }
    sheetDataXml += `  </row>\n`;

    // Рядки даних (ht="15" customHeight="1", тонка межа)
    for (let i = 0; i < rows.length; i++) {
      const rNum = i + 2;
      const r = rows[i];
      sheetDataXml += `  <row r="${rNum}" ht="15" customHeight="1">\n`;
      for (let c = 0; c < r.length; c++) {
        const colLetter = String.fromCharCode(65 + c);
        const val = r[c];
        if (c === 0) {
          sheetDataXml += `    <c r="${colLetter}${rNum}" s="2" t="inlineStr"><is><t>${escapeXml(val)}</t></is></c>\n`;
        } else if (c >= 1 && c <= 3) {
          if (typeof val === 'number') {
            sheetDataXml += `    <c r="${colLetter}${rNum}" s="3" t="n"><v>${val}</v></c>\n`;
          } else {
            sheetDataXml += `    <c r="${colLetter}${rNum}" s="3" t="inlineStr"><is><t>${escapeXml(val)}</t></is></c>\n`;
          }
        } else {
          const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/\s+/g, '').replace(',', '.'));
          if (!isNaN(num)) {
            sheetDataXml += `    <c r="${colLetter}${rNum}" s="4" t="n"><v>${num}</v></c>\n`;
          } else {
            sheetDataXml += `    <c r="${colLetter}${rNum}" s="4" t="inlineStr"><is><t>${escapeXml(val)}</t></is></c>\n`;
          }
        }
      }
      sheetDataXml += `  </row>\n`;
    }

    // Підсумковий рядок (A:D об'єднані, формула SUM)
    sheetDataXml += `  <row r="${summaryRowIndex}" ht="15" customHeight="1">\n`;
    sheetDataXml += `    <c r="A${summaryRowIndex}" s="5" t="inlineStr"><is><t>${escapeXml(periodLabel)}</t></is></c>\n`;
    sheetDataXml += `    <c r="B${summaryRowIndex}" s="5"/>\n`;
    sheetDataXml += `    <c r="C${summaryRowIndex}" s="5"/>\n`;
    sheetDataXml += `    <c r="D${summaryRowIndex}" s="5"/>\n`;

    for (let c = 4; c < headers.length; c++) {
      const colLetter = String.fromCharCode(65 + c);
      if (numRows > 0) {
        sheetDataXml += `    <c r="${colLetter}${summaryRowIndex}" s="6"><f>SUM(${colLetter}2:${colLetter}${lastRow})</f></c>\n`;
      } else {
        sheetDataXml += `    <c r="${colLetter}${summaryRowIndex}" s="6" t="n"><v>0</v></c>\n`;
      }
    }
    sheetDataXml += `  </row>\n`;
    sheetDataXml += `</sheetData>`;

    const mergeXml = `<mergeCells count="1">
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
    const blob = new Blob([uint8], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    return { uint8, blob };
  }

  // ----------------------------------------------------------------------------
  // 3. Завантаження файлу та запуск відкриття (з діалогом вибору папки)
  // ----------------------------------------------------------------------------
  async function performDownload(uint8Data, defaultFileName) {
    // 1. Спроба завантаження через background service worker (saveAs: true відкриває вибір папки)
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      try {
        const base64Data = uint8ToBase64(uint8Data);
        const res = await new Promise((resolve) => {
          chrome.runtime.sendMessage({
            action: 'DOWNLOAD_EXCEL',
            base64Data,
            fileName: defaultFileName
          }, (response) => {
            if (chrome.runtime.lastError) {
              resolve(null);
            } else {
              resolve(response);
            }
          });
        });

        if (res) {
          if (res.cancelled) {
            return { fileName: null, downloadId: null, cancelled: true };
          }
          if (res.success && res.downloadId) {
            return { fileName: res.fileName || defaultFileName, downloadId: res.downloadId };
          }
        }
      } catch (e) {
        console.warn('Background download error, falling back:', e);
      }
    }

    // 2. Резервний спосіб збереження (File System Access - відкриває вибір папки)
    const blob = new Blob([uint8Data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

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
        return { fileName: handle.name || defaultFileName, downloadId: null };
      } catch (err) {
        if (err && err.name === 'AbortError') {
          return { fileName: null, downloadId: null, cancelled: true };
        }
      }
    }

    // 3. Крайній випадок: стандартне завантаження браузера через <a>
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultFileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      a.remove();
      URL.revokeObjectURL(url);
    }, 1000);

    return { fileName: defaultFileName, downloadId: null };
  }

  // ----------------------------------------------------------------------------
  // 4. Пошук та вилучення даних з таблиці
  // ----------------------------------------------------------------------------
  function parseNumeric(val, isReturn) {
    if (val === undefined || val === null) return 0;
    const str = String(val).replace(/\u00A0/g, ' ').replace(/\s+/g, '').replace(',', '.').trim();
    if (str === '' || str.toLowerCase() === 'false') return 0;
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  }

  function findTable() {
    const container = document.querySelector('app-eltype-z-sod');
    if (container) {
      const table = container.querySelector('table.p-datatable-table, table');
      if (table) return table;
    }
    return document.querySelector('table.p-datatable-table') || document.querySelector('table');
  }

  function getRowCount(table) {
    if (!table) return 0;
    const tbody = table.querySelector('tbody');
    if (!tbody) return 0;
    let count = 0;
    const trs = tbody.children;
    for (let i = 0; i < trs.length; i++) {
      const tr = trs[i];
      if (tr.cells && tr.cells.length > 3 && !tr.classList.contains('p-datatable-emptymessage')) {
        count++;
      }
    }
    return count;
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

  function getPeriodInputs() {
    const fromInput = document.querySelector('p-datepicker[formcontrolname="tsFrom"] input') ||
                      document.querySelector('input[placeholder="з"]') ||
                      document.querySelector('p-calendar[formcontrolname="tsFrom"] input');
    const toInput = document.querySelector('p-datepicker[formcontrolname="tsTo"] input') ||
                    document.querySelector('input[placeholder="по"]') ||
                    document.querySelector('p-calendar[formcontrolname="tsTo"] input');
    return { fromInput, toInput };
  }

  function hasValidPeriod() {
    const { fromInput, toInput } = getPeriodInputs();
    if (!fromInput || !toInput) return false;
    const fromVal = (fromInput.value || '').trim();
    const toVal = (toInput.value || '').trim();
    if (!fromVal || !toVal) return false;
    const dateRegex = /^\d{1,2}\.\d{1,2}\.\d{2,4}$/;
    return dateRegex.test(fromVal) && dateRegex.test(toVal);
  }

  function getPeriodInfoFromForm() {
    const { fromInput, toInput } = getPeriodInputs();
    if (!fromInput || !toInput) return null;
    const fromVal = (fromInput.value || '').trim();
    const toVal = (toInput.value || '').trim();
    if (!fromVal || !toVal) return null;

    const m = fromVal.match(/\b(\d{1,2})\.(\d{2})\.(\d{4})\b/);
    if (m) {
      const monthNum = parseInt(m[2], 10);
      const year = m[3];
      if (monthNum >= 1 && monthNum <= 12) {
        const mName = UKRAINIAN_MONTHS[monthNum - 1];
        return {
          monthName: mName,
          periodLabel: `оборот за ${mName} ${year}`
        };
      }
    }
    return {
      monthName: 'оборот',
      periodLabel: `оборот з ${fromVal} по ${toVal}`
    };
  }

  function detectPeriodInfo(rows, dateColIdx) {
    if (rows && rows.length > 0 && dateColIdx !== undefined) {
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
    }
    const formPeriod = getPeriodInfoFromForm();
    if (formPeriod) return formPeriod;
    return { periodLabel: 'оборот', monthName: 'оборот' };
  }

  function parseDateStr(str) {
    if (!str) return null;
    const m = String(str).trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (!m) return null;
    const day = parseInt(m[1], 10);
    const month = parseInt(m[2], 10) - 1;
    const year = parseInt(m[3], 10);
    return new Date(year, month, day);
  }

  function formatDateStr(date) {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}.${m}.${y}`;
  }

  function splitDateRangeIntoMonthlyIntervals(startStr, endStr) {
    const startDate = parseDateStr(startStr);
    const endDate = parseDateStr(endStr);
    if (!startDate || !endDate || startDate > endDate) {
      return [];
    }

    const intervals = [];
    let currStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const finalEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    while (currStart <= finalEnd) {
      const year = currStart.getFullYear();
      const month = currStart.getMonth();

      // Останній день поточного календарного місяця
      const endOfMonth = new Date(year, month + 1, 0);

      // Кінцева дата цього підінтервалу
      const currEnd = endOfMonth < finalEnd ? endOfMonth : finalEnd;

      const monthName = UKRAINIAN_MONTHS[month];
      intervals.push({
        startStr: formatDateStr(currStart),
        endStr: formatDateStr(currEnd),
        year,
        monthNum: month + 1,
        monthName,
        periodLabel: `оборот за ${monthName} ${year}`
      });

      // Переходимо на 1-е число наступного місяця
      currStart = new Date(year, month + 1, 1);
    }

    const hasMultipleYears = intervals.some(it => it.year !== intervals[0].year);
    for (const it of intervals) {
      it.defaultFileName = hasMultipleYears ? `${it.monthName} ${it.year}.xlsx` : `${it.monthName}.xlsx`;
    }

    return intervals;
  }

  async function setDatepickerValue(input, dateStr) {
    if (!input || !dateStr) return;

    input.focus();
    if (typeof input.select === 'function') {
      input.select();
    }

    let inserted = false;
    try {
      inserted = document.execCommand('insertText', false, dateStr);
    } catch (e) {
      inserted = false;
    }

    const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
    if (!inserted || input.value !== dateStr) {
      if (descriptor && descriptor.set) {
        descriptor.set.call(input, dateStr);
      } else {
        input.value = dateStr;
      }
    }

    input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    input.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));

    // Закриваємо оверлей PrimeNG без виклику document.body.click() (який спричиняв скидання дати)
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true }));

    input.blur();
    input.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));

    // Якщо PrimeNG на blur спробував скинути значення — примусово фіксуємо потрібну дату
    if (input.value !== dateStr) {
      if (descriptor && descriptor.set) {
        descriptor.set.call(input, dateStr);
      } else {
        input.value = dateStr;
      }
      input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
      input.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    }
    await delay(80);
  }

  async function applyDateRangeToForm(startStr, endStr) {
    const { fromInput, toInput } = getPeriodInputs();
    if (fromInput && fromInput.value !== startStr) {
      await setDatepickerValue(fromInput, startStr);
    }
    if (toInput && toInput.value !== endStr) {
      await setDatepickerValue(toInput, endStr);
    }
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    await delay(150);
  }

  function getCurrentlySelectedFiscalNumber() {
    const auto = findAutocompleteElements();
    if (auto && auto.input && auto.input.value) {
      const val = auto.input.value.trim();
      // '400' сама по собі не є номером
      if (val !== '400') {
        const match = val.match(/\b(400\d{5,})\b/) || val.match(/\b(400\d{3,})\b/);
        if (match) return match[1];
      }
    }

    const table = findTable();
    if (table) {
      const tds = table.querySelectorAll('tbody td');
      for (const td of tds) {
        const text = (td.textContent || '').trim();
        const match = text.match(/\b(400\d{5,})\b/) || text.match(/\b(400\d{3,})\b/);
        if (match) return match[1];
      }
    }

    return null;
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
      throw new Error('У таблиці наразі немає даних для експорту.');
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
  // 5. Автоматизований збір даних по всіх РРО (400...)
  // ----------------------------------------------------------------------------
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function setInputValue(input, value) {
    if (!input) return;
    input.focus();
    const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
    if (descriptor && descriptor.set) {
      descriptor.set.call(input, value);
    } else {
      input.value = value;
    }
    input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    input.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
  }

  async function simulateTypeIntoInput(input, text) {
    if (!input) return;

    input.focus();
    input.dispatchEvent(new FocusEvent('focus', { bubbles: true }));

    // Спочатку очищаємо поле, щоб Angular відстежив зміну
    const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
    if (descriptor && descriptor.set) {
      descriptor.set.call(input, '');
    } else {
      input.value = '';
    }
    input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    input.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    await delay(60);

    let currentVal = '';
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      currentVal += ch;

      input.dispatchEvent(new KeyboardEvent('keydown', {
        key: ch,
        code: `Digit${ch}`,
        bubbles: true,
        cancelable: true
      }));

      if (descriptor && descriptor.set) {
        descriptor.set.call(input, currentVal);
      } else {
        input.value = currentVal;
      }

      input.dispatchEvent(new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        data: ch,
        inputType: 'insertText'
      }));

      input.dispatchEvent(new KeyboardEvent('keyup', {
        key: ch,
        code: `Digit${ch}`,
        bubbles: true,
        cancelable: true
      }));

      await delay(40);
    }

    input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    input.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
  }

  function findAutocompleteElements() {
    const comp = document.querySelector('p-autocomplete[formcontrolname="fn"]') ||
                 document.querySelector('p-autocomplete');
    if (!comp) return null;

    const input = comp.querySelector('input.p-autocomplete-input') || comp.querySelector('input');
    const dropdownBtn = comp.querySelector('button.p-autocomplete-dropdown') || comp.querySelector('button');

    return { comp, input, dropdownBtn };
  }

  function isAutocompleteLoading() {
    const comp = document.querySelector('p-autocomplete[formcontrolname="fn"]') ||
                 document.querySelector('p-autocomplete');
    if (!comp) return false;
    const spinner = comp.querySelector('spinnericon, .p-autocomplete-loader, .p-icon-spin');
    return !!(spinner && window.getComputedStyle(spinner).display !== 'none');
  }

  function getAutocompleteListItems() {
    const selectors = [
      'li.p-autocomplete-option',
      'li.p-autocomplete-item',
      '[data-pc-section="option"]',
      '[data-pc-section="item"]',
      'ul.p-autocomplete-list > li',
      'ul.p-autocomplete-items > li',
      'ul[role="listbox"] > li',
      'li[role="option"]',
      '.p-autocomplete-panel li',
      '.p-autocomplete-overlay li',
      'p-overlay li',
      '.p-overlay-content li',
      '.p-overlay li'
    ];

    for (const sel of selectors) {
      const elements = document.querySelectorAll(sel);
      if (elements && elements.length > 0) {
        const validLis = Array.from(elements).filter(el => {
          const txt = (el.textContent || '').trim();
          return txt.length > 0 &&
                 !el.classList.contains('p-autocomplete-empty-message') &&
                 !el.classList.contains('p-autocomplete-loader');
        });
        if (validLis.length > 0) {
          return validLis;
        }
      }
    }

    return [];
  }

  async function openAutocompleteSuggestions(query = '400') {
    const auto = findAutocompleteElements();
    if (!auto || !auto.input) return [];

    const { input } = auto;
    const cleanQuery = query ? String(query).trim() : '400';

    // 1. Якщо список вже відкритий і в ньому є елементи
    let items = getAutocompleteListItems();
    if (items.length > 0) {
      return items;
    }

    // 2. Вводимо запит '400' у поле з повною емуляцією для PrimeNG
    await simulateTypeIntoInput(input, cleanQuery);

    // 3. Чекаємо відповіді сервера та появи списку пропозицій
    const start = Date.now();
    const maxWaitMs = 9500;

    while (Date.now() - start < maxWaitMs) {
      items = getAutocompleteListItems();
      if (items.length > 0) {
        return items;
      }

      // Якщо спінер завантаження ще активний — терпляче чекаємо і в жодному разі не клікаємо кнопку
      if (isAutocompleteLoading()) {
        await delay(150);
        continue;
      }

      // Якщо минуло понад 3 секунди, спінера немає, але й список ще не з'явився — спробуємо ArrowDown
      if (Date.now() - start > 3000 && Date.now() - start < 3200) {
        input.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'ArrowDown',
          code: 'ArrowDown',
          keyCode: 40,
          which: 40,
          bubbles: true,
          cancelable: true
        }));
      }

      await delay(100);
    }

    await delay(200);
    return getAutocompleteListItems();
  }

  function closeAutocompletePanel() {
    const auto = findAutocompleteElements();
    if (auto && auto.input) {
      auto.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true }));
      auto.input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true }));
    }
    const panels = document.querySelectorAll('.p-autocomplete-panel, .p-autocomplete-overlay');
    panels.forEach(p => {
      if (p && p.style && window.getComputedStyle(p).display !== 'none') {
        p.style.display = 'none';
      }
    });
  }

  async function discoverAllFiscalNumbers() {
    const foundMap = new Map();

    // 1. Фіскальні номери в уже завантаженій таблиці (якщо є)
    const table = findTable();
    if (table) {
      const tds = table.querySelectorAll('tbody td');
      for (const td of tds) {
        const text = (td.textContent || '').trim();
        const match = text.match(/\b(400\d{5,})\b/) || text.match(/\b(400\d{3,})\b/);
        if (match && !foundMap.has(match[1])) {
          foundMap.set(match[1], { fn: match[1], label: match[1] });
        }
      }
    }

    // 2. ЗАВЖДИ запитуємо список пропозицій по '400', щоб знайти всі РРО
    const items = await openAutocompleteSuggestions('400');
    console.log(`[KaderGo] Отримано ${items.length} пропозицій для '400'`);

    for (const item of items) {
      const text = (item.textContent || '').trim();
      const match = text.match(/\b(400\d{5,})\b/) || text.match(/\b(400\d{3,})\b/) || text.match(/\b(\d{7,12})\b/);
      if (match) {
        foundMap.set(match[1], { fn: match[1], label: text });
      } else if (text.startsWith('400')) {
        const fn = text.split(/\s+/)[0];
        if (fn.length >= 6) {
          foundMap.set(fn, { fn, label: text });
        }
      }
    }

    // Якщо все ще нічого не знайдено, але в полі вводу було значення (не просто 400)
    const auto = findAutocompleteElements();
    if (foundMap.size === 0 && auto && auto.input && auto.input.value) {
      const val = auto.input.value.trim();
      if (val !== '400') {
        const m = val.match(/\b(400\d{3,})\b/) || val.match(/\b(\d{7,12})\b/);
        if (m) {
          foundMap.set(m[1], { fn: m[1], label: val });
        }
      }
    }

    closeAutocompletePanel();
    return Array.from(foundMap.values());
  }

  async function selectFiscalNumber(targetFn) {
    if (!targetFn) return false;
    const auto = findAutocompleteElements();
    if (!auto || !auto.input) return false;

    const cleanFn = String(targetFn).trim();

    // 1. Якщо цей номер вже повноцінно стоїть у полі — нічого не чіпаємо
    if (auto.input.value && auto.input.value.includes(cleanFn) && auto.input.value.trim() !== '400') {
      closeAutocompletePanel();
      return true;
    }

    // 2. Отримуємо список пропозицій по '400'
    let items = getAutocompleteListItems();
    if (items.length === 0) {
      items = await openAutocompleteSuggestions('400');
    }

    // 3. Шукаємо відповідний пункт у списку
    let targetLi = null;
    if (items && items.length > 0) {
      targetLi = items.find(el => (el.textContent || '').includes(cleanFn));
    }

    // 4. Якщо знайдено пункт у списку — емулюємо клік по ньому для фіксації в Angular
    if (targetLi) {
      targetLi.scrollIntoView({ block: 'nearest' });
      await delay(80);

      const opts = { bubbles: true, cancelable: true, view: window, composed: true, buttons: 1 };
      targetLi.dispatchEvent(new PointerEvent('pointerdown', opts));
      targetLi.dispatchEvent(new MouseEvent('mousedown', opts));
      targetLi.dispatchEvent(new PointerEvent('pointerup', opts));
      targetLi.dispatchEvent(new MouseEvent('mouseup', opts));
      targetLi.dispatchEvent(new MouseEvent('click', opts));
      targetLi.click();
      if (targetLi.firstElementChild) {
        targetLi.firstElementChild.click();
      }
      await delay(200);
    }

    // 5. Вставляємо (paste) чистий повний номер безпосередньо у поле, якщо залишилось '400' або не повний номер
    if (!auto.input.value || !auto.input.value.includes(cleanFn) || auto.input.value.trim() === '400') {
      auto.input.focus();
      if (typeof auto.input.select === 'function') {
        auto.input.select();
      }

      let inserted = false;
      try {
        inserted = document.execCommand('insertText', false, cleanFn);
      } catch (e) {
        inserted = false;
      }

      const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
      if (!inserted || auto.input.value !== cleanFn) {
        if (descriptor && descriptor.set) {
          descriptor.set.call(auto.input, cleanFn);
        } else {
          auto.input.value = cleanFn;
        }
      }

      auto.input.dispatchEvent(new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        data: cleanFn,
        inputType: 'insertFromPaste'
      }));
      auto.input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
      auto.input.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));

      // Enter для фіксації вибору
      auto.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
      auto.input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
    }

    closeAutocompletePanel();
    await delay(120);
    return true;
  }

  function findSearchButton() {
    const buttons = document.querySelectorAll('button');
    for (const b of buttons) {
      const txt = (b.textContent || '').trim();
      if (txt === 'Пошук' || b.querySelector('.pi-search')) {
        return b;
      }
    }
    return document.querySelector('button[type="submit"]');
  }

  async function triggerSearch() {
    const searchBtn = findSearchButton();
    if (!searchBtn) return false;

    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    await delay(100);

    searchBtn.scrollIntoView({ block: 'nearest' });
    searchBtn.focus();

    const opts = { bubbles: true, cancelable: true, view: window };
    searchBtn.dispatchEvent(new MouseEvent('mousedown', opts));
    searchBtn.dispatchEvent(new MouseEvent('mouseup', opts));
    searchBtn.dispatchEvent(new MouseEvent('click', opts));
    searchBtn.click();

    return true;
  }

  async function waitForTableReady(targetFn, oldFingerprint, maxWaitMs = 10000) {
    const start = Date.now();
    await delay(400);

    while (Date.now() - start < maxWaitMs) {
      const mask = document.querySelector('.p-datatable-mask, .p-datatable-loading-overlay, .p-datatable-loading-icon');
      if (mask && window.getComputedStyle(mask).display !== 'none') {
        await delay(120);
        continue;
      }

      const table = findTable();
      if (table) {
        const tbody = table.querySelector('tbody');
        if (tbody) {
          if (tbody.querySelector('.p-datatable-emptymessage')) {
            await delay(250);
            return true;
          }

          const currentFingerprint = tbody.innerText || '';
          if (oldFingerprint) {
            // Якщо таблиця вже містила попередні дані — обов'язково чекаємо зміни тексту/рядків!
            if (currentFingerprint !== oldFingerprint && currentFingerprint.length > 0) {
              await delay(250);
              return true;
            }
          } else {
            // Якщо таблиця спочатку була пустою — чекаємо появи рядків із потрібним РРО
            const rows = tbody.querySelectorAll('tr');
            for (const row of rows) {
              if (row.cells && row.cells.length > 3 && (row.textContent || '').includes(targetFn)) {
                await delay(250);
                return true;
              }
            }
          }
        }
      }

      await delay(120);
    }

    return false;
  }

  function extractTableRowsOnly(table) {
    if (!table) return [];
    const tbody = table.querySelector('tbody');
    if (!tbody) return [];

    const trs = tbody.children;
    const validRows = [];
    for (let i = 0; i < trs.length; i++) {
      const tr = trs[i];
      if (tr.cells && tr.cells.length > 3 && !tr.classList.contains('p-datatable-emptymessage')) {
        validRows.push(tr);
      }
    }
    return validRows;
  }

  async function extractAllPagesForTable() {
    const allTrs = [];
    let page = 1;

    while (page <= 25) {
      const table = findTable();
      if (!table) break;

      const trs = extractTableRowsOnly(table);
      allTrs.push(...trs);

      const nextBtn = document.querySelector('button.p-paginator-next:not(.p-disabled):not([disabled])');
      if (!nextBtn) break;

      const oldTableText = table.querySelector('tbody')?.innerText || '';
      nextBtn.click();
      await delay(350);

      const start = Date.now();
      while (Date.now() - start < 3000) {
        const newTableText = findTable()?.querySelector('tbody')?.innerText || '';
        if (newTableText !== oldTableText) break;
        await delay(100);
      }
      page++;
    }

    return allTrs;
  }

  function parseTrElementsToDataRows(validTrs, table) {
    if (!validTrs || validTrs.length === 0) {
      return { rowObjects: [], hasReturns: false };
    }

    const headers = getTableHeaders(table || findTable());
    const colIndexMap = {};
    for (let i = 0; i < headers.length; i++) {
      colIndexMap[headers[i]] = i;
    }

    let hasReturns = false;
    for (let i = 0; i < validTrs.length; i++) {
      const cells = validTrs[i].cells;
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

    const rowObjects = [];
    for (let i = 0; i < validTrs.length; i++) {
      const cells = validTrs[i].cells;
      const rowMap = {};
      for (const colName of [...BASE_COLUMNS, ...RETURN_COLUMNS]) {
        const colIdx = colIndexMap[colName];
        const isReturn = RETURN_COLUMNS.includes(colName);
        const isNum = colName.includes('сума') || colName.includes('Кількість');

        if (colIdx === undefined || !cells[colIdx]) {
          rowMap[colName] = isNum ? 0 : '';
        } else {
          const raw = (cells[colIdx].textContent || '').trim();
          rowMap[colName] = isNum ? parseNumeric(raw, isReturn) : raw;
        }
      }
      rowObjects.push(rowMap);
    }

    return { rowObjects, hasReturns };
  }

  // ----------------------------------------------------------------------------
  // 6. Експорт даних: помісячний експорт для одного або всіх РРО
  // ----------------------------------------------------------------------------
  async function downloadSingleFiscalReports() {
    if (isDownloading) return;

    if (!hasValidPeriod()) {
      alert('Будь ласка, вкажіть період (дати «з» та «по») перед завантаженням.');
      return;
    }

    const { fromInput, toInput } = getPeriodInputs();
    const origFrom = (fromInput.value || '').trim();
    const origTo = (toInput.value || '').trim();

    const intervals = splitDateRangeIntoMonthlyIntervals(origFrom, origTo);
    if (!intervals || intervals.length === 0) {
      alert('Не вдалося розпізнати дати періоду.');
      return;
    }

    // ВАЖЛИВО: Одразу при натисканні кнопки, якщо обрано великий період — оновлюємо дати форми під перший місяць!
    if (intervals.length > 1) {
      await applyDateRangeToForm(intervals[0].startStr, intervals[0].endStr);
    }

    let targetFn = getCurrentlySelectedFiscalNumber();
    if (!targetFn) {
      const fns = await discoverAllFiscalNumbers();
      if (fns && fns.length === 1) {
        targetFn = fns[0].fn;
      } else if (fns && fns.length > 1) {
        alert('У кабінеті знайдено кілька РРО. Будь ласка, оберіть потрібний РРО у списку для завантаження, або скористайтесь кнопкою «Всі РРО в Excel».');
        return;
      } else {
        alert('Не знайдено жодного РРО на сторінці.');
        return;
      }
    }

    isDownloading = true;
    btnEl.disabled = true;
    btnAllEl.disabled = true;
    btnEl.classList.add('loading');

    const spinnerSvg = '<svg class="kadergo-loading-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f8a44c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/></svg>';
    spinnerEl.innerHTML = spinnerSvg;
    spinnerEl.style.display = 'inline-flex';
    labelEl.textContent = 'Підготовка...';

    try {
      for (let m = 0; m < intervals.length; m++) {
        const interval = intervals[m];
        labelEl.textContent = intervals.length > 1
          ? `[${m + 1}/${intervals.length}] ${interval.monthName}...`
          : 'Формування...';

        // 1. Встановлюємо дати цього місяця
        await applyDateRangeToForm(interval.startStr, interval.endStr);

        // 2. Обираємо РРО (якщо вже обрано — завершується миттєво без змін у DOM)
        await selectFiscalNumber(targetFn);

        // 3. Ініціюємо пошук
        const currentTable = findTable();
        const oldFingerprint = currentTable?.querySelector('tbody')?.innerText || '';
        await triggerSearch();
        await waitForTableReady(targetFn, oldFingerprint, 8500);

        // 4. Витягуємо всі рядки за цей місяць
        const table = findTable();
        let validTrs = [];
        if (table) {
          validTrs = await extractAllPagesForTable();
        }

        const { rowObjects, hasReturns } = parseTrElementsToDataRows(validTrs, table);
        const finalCols = hasReturns ? [...BASE_COLUMNS, ...RETURN_COLUMNS] : [...BASE_COLUMNS];
        const finalRows = rowObjects.map(obj => finalCols.map(col => obj[col] !== undefined ? obj[col] : (col.includes('сума') || col.includes('Кількість') ? 0 : '')));

        // 5. Формуємо та зберігаємо Excel
        const defaultFileName = interval.defaultFileName;
        const { uint8 } = buildXlsxData({
          headers: finalCols,
          rows: finalRows,
          periodLabel: interval.periodLabel,
          monthName: interval.monthName
        });

        const { fileName: savedName, downloadId, cancelled } = await performDownload(uint8, defaultFileName);
        if (cancelled) {
          console.log('[KaderGo] Завантаження скасовано користувачем.');
          break;
        }

        await delay(300);
      }
    } catch (err) {
      console.error('[KaderGo] Помилка експорту РРО:', err);
      alert(err.message || 'Не вдалося створити файл Excel');
    } finally {
      try {
        await applyDateRangeToForm(origFrom, origTo);
        if (targetFn) {
          await selectFiscalNumber(targetFn);
        }
      } catch (e) {}

      btnEl.classList.remove('loading');
      spinnerEl.innerHTML = '';
      spinnerEl.style.display = 'none';
      labelEl.textContent = 'Завантажити в Excel';
      isDownloading = false;
      updateUI();
    }
  }

  async function downloadAllFiscalReports() {
    if (isDownloading) return;

    if (!hasValidPeriod()) {
      alert('Будь ласка, вкажіть період (дати «з» та «по») перед завантаженням.');
      return;
    }

    const { fromInput, toInput } = getPeriodInputs();
    const origFrom = (fromInput.value || '').trim();
    const origTo = (toInput.value || '').trim();

    const intervals = splitDateRangeIntoMonthlyIntervals(origFrom, origTo);
    if (!intervals || intervals.length === 0) {
      alert('Не вдалося розпізнати дати періоду.');
      return;
    }

    // ВАЖЛИВО: Одразу при натисканні кнопки, якщо обрано великий період — оновлюємо дати форми під перший місяць!
    if (intervals.length > 1) {
      await applyDateRangeToForm(intervals[0].startStr, intervals[0].endStr);
    }

    isDownloading = true;
    btnEl.disabled = true;
    btnAllEl.disabled = true;
    btnAllEl.classList.add('loading');

    const spinnerSvg = '<svg class="kadergo-loading-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f8a44c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/></svg>';
    spinnerAllEl.innerHTML = spinnerSvg;
    spinnerAllEl.style.display = 'inline-flex';
    labelAllEl.textContent = 'Пошук РРО (400...)...';

    try {
      const fns = await discoverAllFiscalNumbers();
      if (!fns || fns.length === 0) {
        alert('Не знайдено жодного фіскального номера РРО (що починається на 400). Перевірте наявність РРО у кабінеті.');
        return;
      }

      console.log(`[KaderGo] Знайдено ${fns.length} РРО:`, fns.map(f => f.fn));

      for (let m = 0; m < intervals.length; m++) {
        const interval = intervals[m];

        // 1. Встановлюємо дати цього місяця
        await applyDateRangeToForm(interval.startStr, interval.endStr);

        const allRowObjects = [];
        let overallHasReturns = false;

        // 2. Проходимо по кожному РРО для цього місяця
        for (let i = 0; i < fns.length; i++) {
          const item = fns[i];
          const fn = item.fn;
          labelAllEl.textContent = intervals.length > 1
            ? `[${m + 1}/${intervals.length}] ${interval.monthName} (${i + 1}/${fns.length})...`
            : `${i + 1}/${fns.length}: ${fn}...`;

          try {
            const selected = await selectFiscalNumber(fn);
            if (!selected) {
              console.warn(`[KaderGo] Не вдалося обрати РРО ${fn}`);
              continue;
            }

            const currentTable = findTable();
            const oldFingerprint = currentTable?.querySelector('tbody')?.innerText || '';
            const searchTriggered = await triggerSearch();
            if (!searchTriggered) {
              console.warn('[KaderGo] Не вдалося ініціювати пошук для РРО', fn);
              continue;
            }

            await waitForTableReady(fn, oldFingerprint, 8500);

            const table = findTable();
            if (table) {
              const validTrs = await extractAllPagesForTable();
              if (validTrs.length > 0) {
                const { rowObjects, hasReturns } = parseTrElementsToDataRows(validTrs, table);
                allRowObjects.push(...rowObjects);
                if (hasReturns) overallHasReturns = true;
              }
            }
          } catch (iterErr) {
            console.warn(`[KaderGo] Помилка обробки РРО ${fn}:`, iterErr);
          }

          await delay(200);
        }

        // 3. Формуємо та зберігаємо окремий Excel файл за цей місяць
        const finalCols = overallHasReturns ? [...BASE_COLUMNS, ...RETURN_COLUMNS] : [...BASE_COLUMNS];
        const finalRows = allRowObjects.map(obj => finalCols.map(col => obj[col] !== undefined ? obj[col] : (col.includes('сума') || col.includes('Кількість') ? 0 : '')));

        const defaultFileName = interval.defaultFileName;
        const { uint8 } = buildXlsxData({
          headers: finalCols,
          rows: finalRows,
          periodLabel: interval.periodLabel,
          monthName: interval.monthName
        });

        const { fileName: savedName, downloadId, cancelled } = await performDownload(uint8, defaultFileName);
        if (cancelled) {
          console.log('[KaderGo] Завантаження скасовано користувачем.');
          break;
        }

        await delay(300);
      }
    } catch (err) {
      console.error('[KaderGo] Помилка пакетного експорту:', err);
      alert(`Помилка експорту: ${err.message || 'Не вдалося створити файл Excel'}`);
    } finally {
      try {
        await applyDateRangeToForm(origFrom, origTo);
      } catch (e) {}

      btnAllEl.classList.remove('loading');
      spinnerAllEl.innerHTML = '';
      spinnerAllEl.style.display = 'none';
      labelAllEl.textContent = 'Всі РРО в Excel';
      isDownloading = false;
      updateUI();
    }
  }

  // ----------------------------------------------------------------------------
  // 7. Пошук контейнера кнопок Пошук, Очистити, Експорт в Excel
  // ----------------------------------------------------------------------------
  function findActionButtonsPlacement() {
    const buttons = document.querySelectorAll('button');

    for (const b of buttons) {
      const text = (b.textContent || '').trim();
      if (text.includes('Експорт в Excel') || text.includes('Експорт в excel')) {
        const pBtn = b.closest('p-button') || b;
        if (pBtn && pBtn.parentElement) {
          return { container: pBtn.parentElement, targetSibling: pBtn };
        }
      }
    }

    for (const b of buttons) {
      const text = (b.textContent || '').trim();
      if (text === 'Очистити' || text === 'Пошук') {
        const pBtn = b.closest('p-button') || b;
        if (pBtn && pBtn.parentElement) {
          return { container: pBtn.parentElement, targetSibling: pBtn.parentElement.lastElementChild };
        }
      }
    }

    const formFlex = document.querySelector('app-eltype-z-sod form .p-d-flex, form .p-d-flex');
    if (formFlex) {
      return { container: formFlex, targetSibling: formFlex.lastElementChild };
    }

    return null;
  }

  // ----------------------------------------------------------------------------
  // 8. Створення та відображення кнопок
  // ----------------------------------------------------------------------------
  function ensureButtonCreated() {
    if (btnEl) return;

    wrapperEl = document.createElement('div');
    wrapperEl.id = 'tax-gov-kadergo-btn-wrapper';
    wrapperEl.className = 'p-mb-2 p-mr-2';

    // Heroicons SVG
    const downloadIconSvg = '<svg class="kadergo-btn-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>';
    const allIconSvg = '<svg class="kadergo-btn-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"/></svg>';

    // 1. Кнопка "Завантажити в Excel" (поточна таблиця)
    btnEl = document.createElement('button');
    btnEl.id = 'tax-gov-download-excel-btn';
    btnEl.className = 'kadergo-app-btn';
    btnEl.type = 'button';
    btnEl.disabled = true;
    btnEl.setAttribute('title', 'Виконайте пошук в кабінеті, щоб відобразити дані');

    const iconSpan = document.createElement('span');
    iconSpan.className = 'kadergo-icon-wrapper';
    iconSpan.innerHTML = downloadIconSvg;

    spinnerEl = document.createElement('span');
    spinnerEl.className = 'kadergo-spinner-wrapper';
    spinnerEl.style.display = 'none';

    labelEl = document.createElement('span');
    labelEl.className = 'kadergo-app-label';
    labelEl.textContent = 'Завантажити в Excel';

    btnEl.appendChild(iconSpan);
    btnEl.appendChild(spinnerEl);
    btnEl.appendChild(labelEl);

    // 2. Кнопка "Всі РРО в Excel" (автоматичний збір по всіх 400..)
    btnAllEl = document.createElement('button');
    btnAllEl.id = 'tax-gov-download-all-btn';
    btnAllEl.className = 'kadergo-app-btn kadergo-all-btn';
    btnAllEl.type = 'button';
    btnAllEl.disabled = true;
    btnAllEl.setAttribute('title', 'Завантажити весь оборот по всіх РРО (400...) в один файл Excel');

    const iconAllSpan = document.createElement('span');
    iconAllSpan.className = 'kadergo-icon-wrapper';
    iconAllSpan.innerHTML = allIconSvg;

    spinnerAllEl = document.createElement('span');
    spinnerAllEl.className = 'kadergo-spinner-wrapper';
    spinnerAllEl.style.display = 'none';

    labelAllEl = document.createElement('span');
    labelAllEl.className = 'kadergo-app-label';
    labelAllEl.textContent = 'Всі РРО в Excel';

    btnAllEl.appendChild(iconAllSpan);
    btnAllEl.appendChild(spinnerAllEl);
    btnAllEl.appendChild(labelAllEl);

    btnEl.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await downloadSingleFiscalReports();
    });

    btnAllEl.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await downloadAllFiscalReports();
    });

    wrapperEl.appendChild(btnEl);
    wrapperEl.appendChild(btnAllEl);
  }

  function updateUI() {
    if (!isTargetPage()) {
      if (wrapperEl && wrapperEl.parentNode) {
        wrapperEl.remove();
      }
      return;
    }

    ensureButtonCreated();

    const placement = findActionButtonsPlacement();
    if (placement && placement.container) {
      if (!wrapperEl.isConnected || wrapperEl.parentElement !== placement.container) {
        if (placement.targetSibling && placement.targetSibling.nextSibling) {
          placement.container.insertBefore(wrapperEl, placement.targetSibling.nextSibling);
        } else {
          placement.container.appendChild(wrapperEl);
        }
      }
    }

    if (isDownloading) return;

    const validPeriod = hasValidPeriod();

    // Стан кнопки одного РРО
    if (!validPeriod) {
      btnEl.disabled = true;
      btnEl.setAttribute('title', 'Вкажіть період (дати «з» та «по»)');
    } else {
      btnEl.disabled = false;
      btnEl.setAttribute('title', 'Завантажити оборот по обраному РРО помісячно в окремі файли Excel');
    }

    // Стан кнопки всіх РРО
    const auto = findAutocompleteElements();
    if (!validPeriod) {
      btnAllEl.disabled = true;
      btnAllEl.setAttribute('title', 'Вкажіть період (дати «з» та «по»)');
    } else if (auto && auto.input) {
      btnAllEl.disabled = false;
      btnAllEl.setAttribute('title', 'Завантажити оборот по всіх РРО (400...) помісячно в окремі файли Excel');
    } else {
      btnAllEl.disabled = true;
      btnAllEl.setAttribute('title', 'Поле вибору РРО не знайдено');
    }
  }

  // ----------------------------------------------------------------------------
  // 8. Відстеження SPA переходів та періодичне опитування
  // ----------------------------------------------------------------------------
  let pollInterval = null;

  function startObserverAndPolling() {
    updateUI();

    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(updateUI, 900);

    const observer = new MutationObserver(() => {
      updateUI();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    window.addEventListener('popstate', updateUI);
    window.addEventListener('hashchange', updateUI);

    const originalPushState = history.pushState;
    if (originalPushState) {
      history.pushState = function () {
        originalPushState.apply(this, arguments);
        setTimeout(updateUI, 100);
      };
    }

    const originalReplaceState = history.replaceState;
    if (originalReplaceState) {
      history.replaceState = function () {
        originalReplaceState.apply(this, arguments);
        setTimeout(updateUI, 100);
      };
    }
  }

  // ----------------------------------------------------------------------------
  // 9. Обробка повідомлень від Popup
  // ----------------------------------------------------------------------------
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (!isTargetPage()) {
        sendResponse({ found: false, count: 0, defaultName: 'оборот.xlsx' });
        return true;
      }

      if (request.action === 'GET_STATUS') {
        const validPeriod = hasValidPeriod();
        const table = findTable();
        const count = getRowCount(table);
        let monthName = 'оборот';
        try {
          const data = extractTableData();
          monthName = data.monthName;
        } catch (e) {
          const formPeriod = getPeriodInfoFromForm();
          if (formPeriod) monthName = formPeriod.monthName;
        }

        sendResponse({
          found: count > 0 && validPeriod,
          hasPeriod: validPeriod,
          count,
          defaultName: `${monthName}.xlsx`
        });
        return true;
      }

      if (request.action === 'TRIGGER_DOWNLOAD') {
        if (!hasValidPeriod()) {
          sendResponse({ success: false, error: 'Вкажіть період (дати «з» та «по») перед завантаженням.' });
          return true;
        }

        downloadSingleFiscalReports().then(() => {
          sendResponse({ success: true });
        }).catch((err) => {
          sendResponse({ success: false, error: err.message });
        });
        return true;
      }

      if (request.action === 'TRIGGER_DOWNLOAD_ALL') {
        if (!hasValidPeriod()) {
          sendResponse({ success: false, error: 'Вкажіть період (дати «з» та «по») перед завантаженням.' });
          return true;
        }

        downloadAllFiscalReports().then(() => {
          sendResponse({ success: true });
        }).catch((err) => {
          sendResponse({ success: false, error: err.message });
        });
        return true;
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserverAndPolling);
  } else {
    startObserverAndPolling();
  }
})();
