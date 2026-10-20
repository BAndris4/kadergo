// ==============================================================================
// KaderGo - Income Book (.xlsx) Generator (Книга обліку доходів єдиний)
// 1:1 Replica of official Ukrainian single tax income ledger
// ==============================================================================

window.KaderGo = window.KaderGo || {};

(function () {
  'use strict';

  const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable="x14ac x16r2 xr" xmlns:x14ac="http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac" xmlns:x16r2="http://schemas.microsoft.com/office/spreadsheetml/2015/02/main" xmlns:xr="http://schemas.microsoft.com/office/spreadsheetml/2014/revision"><numFmts count="2"><numFmt numFmtId="43" formatCode="_-* #,##0.00_-;\\-* #,##0.00_-;_-* &quot;-&quot;??_-;_-@_-"/><numFmt numFmtId="168" formatCode="_-* #,##0.00\\ _₴_-;\\-* #,##0.00\\ _₴_-;_-* &quot;-&quot;??\\ _₴_-;_-@_-"/></numFmts><fonts count="7" x14ac:knownFonts="1"><font><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/><scheme val="minor"/></font><font><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/><charset val="238"/><scheme val="minor"/></font><font><b/><sz val="10"/><color rgb="FF000000"/><name val="Arial"/><family val="2"/><charset val="204"/></font><font><sz val="10"/><color rgb="FF000000"/><name val="Arial"/><family val="2"/><charset val="204"/></font><font><b/><sz val="14"/><color theme="1"/><name val="Calibri"/><family val="2"/><charset val="204"/><scheme val="minor"/></font><font><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/><scheme val="minor"/></font><font><b/><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/><charset val="238"/><scheme val="minor"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFFF00"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFC000"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="10"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color indexed="64"/></left><right style="thin"><color indexed="64"/></right><top style="thin"><color indexed="64"/></top><bottom style="thin"><color indexed="64"/></bottom><diagonal/></border><border><left/><right style="thin"><color indexed="64"/></right><top style="thin"><color indexed="64"/></top><bottom/><diagonal/></border><border><left/><right style="thin"><color indexed="64"/></right><top/><bottom/><diagonal/></border><border><left/><right style="thin"><color indexed="64"/></right><top/><bottom style="thin"><color indexed="64"/></bottom><diagonal/></border><border><left style="thin"><color indexed="64"/></left><right style="thin"><color indexed="64"/></right><top style="thin"><color indexed="64"/></top><bottom/><diagonal/></border><border><left style="thin"><color indexed="64"/></left><right style="thin"><color indexed="64"/></right><top/><bottom/><diagonal/></border><border><left style="thin"><color indexed="64"/></left><right style="thin"><color indexed="64"/></right><top/><bottom style="thin"><color indexed="64"/></bottom><diagonal/></border><border><left style="thin"><color indexed="64"/></left><right/><top style="thin"><color indexed="64"/></top><bottom style="thin"><color indexed="64"/></bottom><diagonal/></border><border><left/><right style="thin"><color indexed="64"/></right><top style="thin"><color indexed="64"/></top><bottom style="thin"><color indexed="64"/></bottom><diagonal/></border></borders><cellStyleXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/><xf numFmtId="43" fontId="5" fillId="0" borderId="0" applyFont="0" applyFill="0" applyBorder="0" applyAlignment="0" applyProtection="0"/><xf numFmtId="168" fontId="5" fillId="0" borderId="0" applyFont="0" applyFill="0" applyBorder="0" applyAlignment="0" applyProtection="0"/></cellStyleXfs><cellXfs count="27"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="2" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="2" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/><xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="top" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="5" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="top"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="6" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="top"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="7" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="top"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="3" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="top" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="top" wrapText="1"/></xf><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center"/></xf><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="top"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="2" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="top"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="3" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="top"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="4" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="top"/></xf><xf numFmtId="0" fontId="3" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="top"/></xf><xf numFmtId="0" fontId="3" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" wrapText="1"/></xf><xf numFmtId="43" fontId="4" fillId="3" borderId="8" xfId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf><xf numFmtId="43" fontId="4" fillId="3" borderId="9" xfId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf><xf numFmtId="0" fontId="6" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="2" fontId="6" fillId="2" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="2" fontId="1" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment wrapText="1"/></xf><xf numFmtId="2" fontId="1" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1"/><xf numFmtId="0" fontId="4" fillId="0" borderId="6" xfId="0" applyFont="1" applyBorder="1"/></cellXfs><cellStyles count="3"><cellStyle name="Ezres" xfId="1" builtinId="3"/><cellStyle name="Ezres 2" xfId="2" xr:uid="{5BA5C384-C1DE-4E8B-B9DA-999DE3DA848C}"/><cellStyle name="Normál" xfId="0" builtinId="0"/></cellStyles><dxfs count="0"/><tableStyles count="0" defaultTableStyle="TableStyleMedium2" defaultPivotStyle="PivotStyleLight16"/><extLst><ext uri="{EB79DEF2-80B8-43e5-95BD-54CBDDF9020C}" xmlns:x14="http://schemas.microsoft.com/office/spreadsheetml/2009/9/main"><x14:slicerStyles defaultSlicerStyle="SlicerStyleLight1"/></ext><ext uri="{9260A510-F301-46a8-8635-F512D64BE5F5}" xmlns:x15="http://schemas.microsoft.com/office/spreadsheetml/2010/11/main"><x15:timelineStyles defaultTimelineStyle="TimeSlicerStyleLight1"/></ext></extLst></styleSheet>`;

  /**
   * Generates a 1:1 replica of "Книга обліку доходів єдиний за {year} рік.xlsx"
   * @param {Object} params
   * @param {number|string} params.year - e.g. 2026
   * @param {Object} params.monthlyData - Map of month number (1..12) to { sales: number, returns: number }
   * @returns {{ uint8: Uint8Array, blob: Blob, fileName: string }}
   */
  function buildIncomeBookXlsxData({ year, monthlyData = {} }) {
    const { SimpleZip } = window.KaderGo.Zip;
    const zip = new SimpleZip();
    const strYear = String(year);

    // 1. [Content_Types].xml
    zip.addFile('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
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
      <vt:lpstr>${strYear}</vt:lpstr>
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
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
</Relationships>`);

    // 6. xl/workbook.xml
    zip.addFile('xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <workbookPr defaultThemeVersion="166925"/>
  <sheets>
    <sheet name="${strYear}" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`);

    // 7. xl/styles.xml
    zip.addFile('xl/styles.xml', STYLES_XML);

    // 8. xl/sharedStrings.xml
    const sharedStrings = [
      'Книга обліку доходів', // 0
      'Дата запису', // 1
      'Дохід від провадження діяльності*', // 2
      'Дохід, що оподатковується за ставкою 15 %', // 3
      'вартість проданих товарів, виконаних робіт, наданих послуг', // 4
      'всього, грн, коп.', // 5
      'вид доходу**', // 6
      'сума повернутих коштів за товар (роботи, послуги) та/або передплати, грн, коп.', // 7
      'ЗАТВЕРДЖЕНО', // 8
      'Наказ Міністерства фінансів України', // 9
      '19 червня 2015 року N 579', // 10
      '(для платників єдиного податку першої, другої та третьої груп, які не є платниками податку на додану вартість', // 11
      '№', // 12
      'По банку', // 13
      'вартість безоплатно отриманих товарів (робіт, послуг), грн, коп', // 14
      'сума,\nгрн, коп.', // 15
      'скоригована сума доходу, грн, коп.\n(гр. 2 - гр. 3)', // 16
      'сума, грн, коп', // 17
      'Січень', // 18
      'в тому ч. готівка', // 19
      'в тому ч.  без готівка', // 20
      'Лютий', // 21
      'Березень', // 22
      'Квітень', // 23
      'Травень', // 24
      'Червень', // 25
      'Липень', // 26
      'Серпень', // 27
      'Вересень', // 28
      'Жовтень', // 29
      'Листопад', // 30
      'Грудень', // 31
      `Оборот за ${strYear} рік` // 32
    ];

    let ssXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="100" uniqueCount="${sharedStrings.length}">\n`;
    for (const str of sharedStrings) {
      const esc = String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      ssXml += `  <si><t xml:space="preserve">${esc}</t></si>\n`;
    }
    ssXml += `</sst>`;
    zip.addFile('xl/sharedStrings.xml', ssXml);

    // 9. xl/worksheets/sheet1.xml
    let sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable="x14ac" xmlns:x14ac="http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac">
  <sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>
  <dimension ref="A1:J48"/>
  <sheetViews><sheetView tabSelected="1" workbookViewId="0"/></sheetViews>
  <sheetFormatPr defaultRowHeight="15"/>
  <cols>
    <col min="1" max="1" width="5" customWidth="1"/>
    <col min="2" max="2" width="23.5703125" bestFit="1" customWidth="1"/>
    <col min="3" max="3" width="10.5703125" bestFit="1" customWidth="1"/>
    <col min="4" max="4" width="12" customWidth="1"/>
    <col min="5" max="5" width="10.5703125" bestFit="1" customWidth="1"/>
    <col min="6" max="6" width="9.5703125" customWidth="1"/>
    <col min="7" max="7" width="9.5703125" bestFit="1" customWidth="1"/>
    <col min="8" max="8" width="11" customWidth="1"/>
    <col min="9" max="9" width="9.5703125" customWidth="1"/>
    <col min="10" max="10" width="9.5703125" bestFit="1" customWidth="1"/>
  </cols>
  <sheetData>
    <row r="1" spans="1:10"><c r="F1" s="4" t="s"><v>8</v></c></row>
    <row r="2" spans="1:10"><c r="F2" s="4" t="s"><v>9</v></c></row>
    <row r="3" spans="1:10"><c r="F3" s="4" t="s"><v>10</v></c></row>
    <row r="5" spans="1:10"><c r="B5" s="12" t="s"><v>0</v></c><c r="C5" s="12"/><c r="D5" s="12"/><c r="E5" s="12"/><c r="F5" s="12"/><c r="G5" s="12"/><c r="H5" s="12"/><c r="I5" s="12"/></row>
    <row r="6" spans="1:10" ht="30.75" customHeight="1"><c r="B6" s="13" t="s"><v>11</v></c><c r="C6" s="13"/><c r="D6" s="13"/><c r="E6" s="13"/><c r="F6" s="13"/><c r="G6" s="13"/><c r="H6" s="13"/><c r="I6" s="13"/></row>
    <row r="7" spans="1:10"><c r="A7" s="14" t="s"><v>12</v></c><c r="B7" s="15" t="s"><v>1</v></c><c r="C7" s="18" t="s"><v>2</v></c><c r="D7" s="18"/><c r="E7" s="18"/><c r="F7" s="18"/><c r="G7" s="18"/><c r="H7" s="19" t="s"><v>3</v></c><c r="I7" s="19"/><c r="J7" s="9" t="s"><v>13</v></c></row>
    <row r="8" spans="1:10"><c r="A8" s="14"/><c r="B8" s="16"/><c r="C8" s="10" t="s"><v>4</v></c><c r="D8" s="10"/><c r="E8" s="10"/><c r="F8" s="11" t="s"><v>14</v></c><c r="G8" s="10" t="s"><v>5</v></c><c r="H8" s="10" t="s"><v>3</v></c><c r="I8" s="10"/><c r="J8" s="9"/></row>
    <row r="9" spans="1:10" ht="135" customHeight="1"><c r="A9" s="14"/><c r="B9" s="17"/><c r="C9" s="5" t="s"><v>15</v></c><c r="D9" s="5" t="s"><v>7</v></c><c r="E9" s="5" t="s"><v>16</v></c><c r="F9" s="11"/><c r="G9" s="10"/><c r="H9" s="5" t="s"><v>6</v></c><c r="I9" s="5" t="s"><v>17</v></c><c r="J9" s="9"/></row>
`;

    let totalEVal = 0;
    let totalCashVal = 0;

    for (let m = 1; m <= 12; m++) {
      const R = 10 + (m - 1) * 3;
      const monthStrIdx = m === 1 ? 18 : (m + 19);

      const mData = monthlyData[m] || { sales: 0, returns: 0 };
      const sales = Math.round((Number(mData.sales) || 0) * 100) / 100;
      const returns = Math.round((Number(mData.returns) || 0) * 100) / 100;
      const net = Math.round((sales - returns) * 100) / 100;

      totalEVal = Math.round((totalEVal + net) * 100) / 100;
      totalCashVal = Math.round((totalCashVal + net) * 100) / 100;

      // Header row of month (yellow fill, row height 15)
      sheetXml += `    <row r="${R}" spans="1:10">`;
      sheetXml += `<c r="A${R}" s="6"><v>${m}</v></c>`;
      sheetXml += `<c r="B${R}" s="22" t="s"><v>${monthStrIdx}</v></c>`;
      sheetXml += `<c r="C${R}" s="23"><f>C${R + 1}+C${R + 2}</f><v>${sales}</v></c>`;
      sheetXml += `<c r="D${R}" s="23"><f>D${R + 1}+D${R + 2}</f><v>${returns}</v></c>`;
      sheetXml += `<c r="E${R}" s="23"><f>C${R}-D${R}</f><v>${net}</v></c>`;
      sheetXml += `<c r="F${R}" s="23"/>`;
      sheetXml += `<c r="G${R}" s="23"><f>E${R}</f><v>${net}</v></c>`;
      sheetXml += `<c r="H${R}" s="23"/><c r="I${R}" s="23"/><c r="J${R}" s="23"/>`;
      sheetXml += `</row>\n`;

      // Cash row
      sheetXml += `    <row r="${R + 1}" spans="1:10">`;
      sheetXml += `<c r="A${R + 1}" s="7"/>`;
      sheetXml += `<c r="B${R + 1}" s="3" t="s"><v>19</v></c>`;
      sheetXml += `<c r="C${R + 1}" s="2"><v>${sales}</v></c>`;
      sheetXml += `<c r="D${R + 1}" s="2">${returns > 0 ? `<v>${returns}</v>` : ''}</c>`;
      sheetXml += `<c r="E${R + 1}" s="2"><f>C${R + 1}-D${R + 1}</f><v>${net}</v></c>`;
      sheetXml += `<c r="F${R + 1}" s="2"/>`;
      sheetXml += `<c r="G${R + 1}" s="2"><f>E${R + 1}</f><v>${net}</v></c>`;
      sheetXml += `<c r="H${R + 1}" s="2"/><c r="I${R + 1}" s="2"/><c r="J${R + 1}" s="2"/>`;
      sheetXml += `</row>\n`;

      // Cashless row
      sheetXml += `    <row r="${R + 2}" spans="1:10">`;
      sheetXml += `<c r="A${R + 2}" s="8"/>`;
      sheetXml += `<c r="B${R + 2}" s="3" t="s"><v>20</v></c>`;
      sheetXml += `<c r="C${R + 2}" s="2"><v>0</v></c>`;
      sheetXml += `<c r="D${R + 2}" s="2"/>`;
      sheetXml += `<c r="E${R + 2}" s="2"><f>C${R + 2}-D${R + 2}</f><v>0</v></c>`;
      sheetXml += `<c r="F${R + 2}" s="2"/>`;
      sheetXml += `<c r="G${R + 2}" s="2"><f>E${R + 2}</f><v>0</v></c>`;
      sheetXml += `<c r="H${R + 2}" s="2"/><c r="I${R + 2}" s="2"/><c r="J${R + 2}" s="2"/>`;
      sheetXml += `</row>\n`;
    }

    // Row 46: Оборот за рік (merged C46:D46, amber highlight)
    sheetXml += `    <row r="46" spans="1:10" ht="18.75" customHeight="1">`;
    sheetXml += `<c r="B46" s="26" t="s"><v>32</v></c>`;
    sheetXml += `<c r="C46" s="20"><f>E10+E13+E16+E19+E22+E25+E28+E31+E34+E37+E40+E43</f><v>${totalEVal}</v></c>`;
    sheetXml += `<c r="D46" s="21"/>`;
    sheetXml += `</row>\n`;

    // Row 47: в тому ч. готівка
    sheetXml += `    <row r="47" spans="1:10">`;
    sheetXml += `<c r="B47" s="3" t="s"><v>19</v></c>`;
    sheetXml += `<c r="C47" s="1"><f>E44+E41+E38+E35+E32+E29+E26+E23+E20+E17+E14+E11</f><v>${totalCashVal}</v></c>`;
    sheetXml += `</row>\n`;

    // Row 48: в тому ч. без готівка
    sheetXml += `    <row r="48" spans="1:10">`;
    sheetXml += `<c r="B48" s="3" t="s"><v>20</v></c>`;
    sheetXml += `<c r="C48" s="1"><f>E45+E42+E39+E36+E33+E30+E27+E24+E21+E18+E15+E12</f><v>0</v></c>`;
    sheetXml += `</row>\n`;

    sheetXml += `  </sheetData>
  <mergeCells count="24">
    <mergeCell ref="A10:A12"/>
    <mergeCell ref="B5:I5"/>
    <mergeCell ref="B6:I6"/>
    <mergeCell ref="A7:A9"/>
    <mergeCell ref="B7:B9"/>
    <mergeCell ref="C7:G7"/>
    <mergeCell ref="H7:I7"/>
    <mergeCell ref="J7:J9"/>
    <mergeCell ref="C8:E8"/>
    <mergeCell ref="F8:F9"/>
    <mergeCell ref="G8:G9"/>
    <mergeCell ref="H8:I8"/>
    <mergeCell ref="C46:D46"/>
    <mergeCell ref="A13:A15"/>
    <mergeCell ref="A16:A18"/>
    <mergeCell ref="A19:A21"/>
    <mergeCell ref="A22:A24"/>
    <mergeCell ref="A25:A27"/>
    <mergeCell ref="A28:A30"/>
    <mergeCell ref="A31:A33"/>
    <mergeCell ref="A34:A36"/>
    <mergeCell ref="A37:A39"/>
    <mergeCell ref="A40:A42"/>
    <mergeCell ref="A43:A45"/>
  </mergeCells>
  <pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>
  <pageSetup paperSize="9" scale="76" orientation="portrait" verticalDpi="0"/>
</worksheet>`;

    zip.addFile('xl/worksheets/sheet1.xml', sheetXml);

    const uint8 = zip.toUint8Array();
    const blob = new Blob([uint8], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const fileName = `Книга обліку доходів єдиний за ${strYear} рік.xlsx`;

    return { uint8, blob, fileName };
  }

  window.KaderGo.IncomeBookExcel = {
    buildIncomeBookXlsxData
  };
})();
