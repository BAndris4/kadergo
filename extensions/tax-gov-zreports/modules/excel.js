// ==============================================================================
// KaderGo - Direct Excel (.xlsx) Generator with 1:1 KaderGo Formatting Standard
// ==============================================================================

window.KaderGo = window.KaderGo || {};

(function () {
  'use strict';

  function escapeXml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  function colIndexToLetter(idx) {
    let letter = '';
    let temp = idx;
    while (temp >= 0) {
      letter = String.fromCharCode((temp % 26) + 65) + letter;
      temp = Math.floor(temp / 26) - 1;
    }
    return letter;
  }

  function buildXlsxData(data) {
    const { SimpleZip } = window.KaderGo.Zip;
    const { COL_WIDTHS } = window.KaderGo.Config;

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

    // 8. Точні параметри ширини стовпців
    let colsXml = '<cols>\n';
    for (let i = 0; i < headers.length; i++) {
      const w = (COL_WIDTHS[i] && COL_WIDTHS[i].width) || 17.86;
      colsXml += `  <col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>\n`;
    }
    colsXml += '</cols>';

    let sheetDataXml = '<sheetData>\n';

    // Рядок 1: Заголовки (ht="45" customHeight="1")
    sheetDataXml += `  <row r="1" ht="45" customHeight="1">\n`;
    for (let c = 0; c < headers.length; c++) {
      const colLetter = colIndexToLetter(c);
      sheetDataXml += `    <c r="${colLetter}1" s="1" t="inlineStr"><is><t>${escapeXml(headers[c])}</t></is></c>\n`;
    }
    sheetDataXml += `  </row>\n`;

    // Рядки даних (ht="15" customHeight="1", тонка межа)
    for (let i = 0; i < rows.length; i++) {
      const rNum = i + 2;
      const r = rows[i];
      sheetDataXml += `  <row r="${rNum}" ht="15" customHeight="1">\n`;
      for (let c = 0; c < r.length; c++) {
        const colLetter = colIndexToLetter(c);
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
      const colLetter = colIndexToLetter(c);
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

    // Tájolás: ha több mint 30 sor van, akkor álló (portrait), ha 30 vagy kevesebb, akkor fekvő (landscape)
    const orientation = numRows > 30 ? 'portrait' : 'landscape';

    zip.addFile('xl/worksheets/sheet1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetPr>
    <pageSetUpPr fitToPage="1"/>
  </sheetPr>
  <sheetFormatPr defaultRowHeight="15"/>
  ${colsXml}
  ${sheetDataXml}
  ${mergeXml}
  <pageMargins left="0.25" right="0.25" top="0.5" bottom="0.5" header="0.3" footer="0.3"/>
  <pageSetup orientation="${orientation}" paperSize="9" fitToWidth="1" fitToHeight="1"/>
</worksheet>`);

    const uint8 = zip.toUint8Array();
    const blob = new Blob([uint8], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    return { uint8, blob };
  }

  window.KaderGo.Excel = {
    escapeXml,
    buildXlsxData
  };
})();
