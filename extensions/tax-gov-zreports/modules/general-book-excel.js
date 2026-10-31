// ==============================================================================
// KaderGo - General Tax System Book (.xlsx) Generator
// (Книга обліку доходів і витрат - Загальна система оподаткування)
// 1:1 Replica of official form: Наказ Мінфіну України від 13.05.2021 № 261
// ==============================================================================

window.KaderGo = window.KaderGo || {};

(function () {
  'use strict';

  // 1:1 exact styles from official template
  const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>

<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable="x14ac x16r2 xr" xmlns:x14ac="http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac" xmlns:x16r2="http://schemas.microsoft.com/office/spreadsheetml/2015/02/main" xmlns:xr="http://schemas.microsoft.com/office/spreadsheetml/2014/revision"><numFmts count="2"><numFmt numFmtId="164" formatCode="0.00_ "/><numFmt numFmtId="165" formatCode="0.00000"/></numFmts><fonts count="17"><font><sz val="11"/><color theme="1"/><name val="Calibri"/><charset val="134"/><scheme val="minor"/></font><font><b/><sz val="11"/><color theme="1"/><name val="Calibri"/><charset val="134"/><scheme val="minor"/></font><font><sz val="10"/><name val="Arial"/><charset val="204"/></font><font><b/><sz val="14"/><name val="Arial"/><charset val="204"/></font><font><sz val="12"/><name val="Arial"/><charset val="204"/></font><font><u/><sz val="12"/><name val="Arial"/><charset val="204"/></font><font><sz val="11"/><name val="Arial"/><charset val="134"/></font><font><b/><sz val="10"/><name val="Arial"/><charset val="204"/></font><font><b/><sz val="11"/><name val="Arial"/><charset val="134"/></font><font><sz val="12"/><color theme="1"/><name val="Times New Roman"/><charset val="204"/></font><font><vertAlign val="superscript"/><sz val="12"/><color theme="1"/><name val="Times New Roman"/><charset val="204"/></font><font><sz val="9"/><color theme="1"/><name val="Times New Roman"/><charset val="204"/></font><font><vertAlign val="superscript"/><sz val="10"/><name val="Arial"/><charset val="204"/></font><font><u/><sz val="12"/><name val="Arial"/><family val="2"/><charset val="204"/></font><font><sz val="10"/><name val="Arial"/><family val="2"/><charset val="204"/></font><font><b/><sz val="10"/><name val="Arial"/><family val="2"/><charset val="204"/></font><font><b/><sz val="10"/><name val="Arial"/><family val="2"/><charset val="238"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFFF00"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor theme="0"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="19"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="medium"><color auto="1"/></left><right style="medium"><color auto="1"/></right><top style="medium"><color auto="1"/></top><bottom/><diagonal/></border><border><left/><right style="medium"><color auto="1"/></right><top style="medium"><color auto="1"/></top><bottom/><diagonal/></border><border><left style="medium"><color auto="1"/></left><right/><top style="medium"><color auto="1"/></top><bottom/><diagonal/></border><border><left/><right/><top style="medium"><color auto="1"/></top><bottom/><diagonal/></border><border><left style="medium"><color auto="1"/></left><right style="medium"><color auto="1"/></right><top/><bottom/><diagonal/></border><border><left/><right style="medium"><color auto="1"/></right><top/><bottom/><diagonal/></border><border><left style="medium"><color auto="1"/></left><right/><top/><bottom style="medium"><color auto="1"/></bottom><diagonal/></border><border><left/><right/><top/><bottom style="medium"><color auto="1"/></bottom><diagonal/></border><border><left style="medium"><color auto="1"/></left><right style="medium"><color auto="1"/></right><top style="medium"><color auto="1"/></top><bottom style="medium"><color auto="1"/></bottom><diagonal/></border><border><left/><right style="thin"><color auto="1"/></right><top style="medium"><color auto="1"/></top><bottom style="medium"><color auto="1"/></bottom><diagonal/></border><border><left/><right style="medium"><color auto="1"/></right><top style="medium"><color auto="1"/></top><bottom style="medium"><color auto="1"/></bottom><diagonal/></border><border><left style="thin"><color auto="1"/></left><right style="thin"><color auto="1"/></right><top style="thin"><color auto="1"/></top><bottom style="thin"><color auto="1"/></bottom><diagonal/></border><border><left style="thin"><color auto="1"/></left><right style="thin"><color auto="1"/></right><top/><bottom style="thin"><color auto="1"/></bottom><diagonal/></border><border><left style="thin"><color auto="1"/></left><right style="thin"><color auto="1"/></right><top/><bottom/><diagonal/></border><border><left style="thin"><color auto="1"/></left><right style="thin"><color auto="1"/></right><top style="thin"><color auto="1"/></top><bottom/><diagonal/></border><border><left/><right style="medium"><color auto="1"/></right><top/><bottom style="medium"><color auto="1"/></bottom><diagonal/></border><border><left style="thin"><color auto="1"/></left><right style="thin"><color auto="1"/></right><top style="thin"><color auto="1"/></top><bottom style="medium"><color auto="1"/></bottom><diagonal/></border><border><left style="thin"><color auto="1"/></left><right style="thin"><color auto="1"/></right><top style="medium"><color auto="1"/></top><bottom style="thin"><color auto="1"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="58"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="right" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="2" fillId="0" borderId="2" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="top" wrapText="1"/></xf><xf numFmtId="0" fontId="2" fillId="0" borderId="6" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="6" fillId="0" borderId="6" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="0" fontId="2" fillId="0" borderId="6" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" wrapText="1"/></xf><xf numFmtId="0" fontId="2" fillId="0" borderId="6" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="top" wrapText="1"/></xf><xf numFmtId="0" fontId="2" fillId="0" borderId="9" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="2" fillId="0" borderId="10" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="2" fillId="0" borderId="11" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="14" fontId="2" fillId="0" borderId="12" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="2" fontId="2" fillId="0" borderId="12" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="14" fontId="7" fillId="2" borderId="12" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="2" fontId="7" fillId="2" borderId="12" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="14" fontId="2" fillId="0" borderId="13" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="2" fontId="2" fillId="0" borderId="13" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="14" fontId="2" fillId="0" borderId="14" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="14" fontId="2" fillId="0" borderId="15" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="7" fillId="2" borderId="12" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="164" fontId="2" fillId="0" borderId="13" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="2" fontId="2" fillId="2" borderId="12" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="164" fontId="7" fillId="2" borderId="12" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="6" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="2" fontId="8" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/><xf numFmtId="0" fontId="8" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="14" fontId="7" fillId="2" borderId="17" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="2" fontId="7" fillId="2" borderId="17" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="14" fontId="7" fillId="3" borderId="18" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="2" fontId="7" fillId="3" borderId="18" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="2" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="2" fontId="14" fillId="0" borderId="12" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="2" fontId="6" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/><xf numFmtId="165" fontId="2" fillId="0" borderId="12" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="2" fontId="15" fillId="2" borderId="12" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="2" fontId="15" fillId="0" borderId="12" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="2" fontId="15" fillId="0" borderId="13" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="2" fontId="14" fillId="0" borderId="13" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="right" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="13" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="5" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="9" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="justify" vertical="center"/></xf><xf numFmtId="0" fontId="10" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="justify" vertical="center"/></xf><xf numFmtId="0" fontId="2" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="top" wrapText="1"/></xf><xf numFmtId="0" fontId="2" fillId="0" borderId="5" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="top" wrapText="1"/></xf><xf numFmtId="0" fontId="2" fillId="0" borderId="3" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="2" fillId="0" borderId="4" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="2" fillId="0" borderId="2" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="2" fillId="0" borderId="7" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="2" fillId="0" borderId="8" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="2" fillId="0" borderId="16" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="14" fontId="16" fillId="0" borderId="12" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normál" xfId="0" builtinId="0"/></cellStyles><dxfs count="0"/><tableStyles count="0" defaultTableStyle="TableStyleMedium2" defaultPivotStyle="PivotStyleLight16"/><extLst><ext uri="{EB79DEF2-80B8-43e5-95BD-54CBDDF9020C}" xmlns:x14="http://schemas.microsoft.com/office/spreadsheetml/2009/9/main"><x14:slicerStyles defaultSlicerStyle="SlicerStyleLight1"/></ext><ext uri="{9260A510-F301-46a8-8635-F512D64BE5F5}" xmlns:x15="http://schemas.microsoft.com/office/spreadsheetml/2010/11/main"><x15:timelineStyles defaultTimelineStyle="TimeSlicerStyleLight1"/></ext></extLst></styleSheet>`;

  // Theme definition matching Excel template
  const THEME_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>

<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Office Theme"><a:themeElements><a:clrScheme name="Office"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="44546A"/></a:dk2><a:lt2><a:srgbClr val="E7E6E6"/></a:lt2><a:accent1><a:srgbClr val="5B9BD5"/></a:accent1><a:accent2><a:srgbClr val="ED7D31"/></a:accent2><a:accent3><a:srgbClr val="A5A5A5"/></a:accent3><a:accent4><a:srgbClr val="FFC000"/></a:accent4><a:accent5><a:srgbClr val="4472C4"/></a:accent5><a:accent6><a:srgbClr val="70AD47"/></a:accent6><a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink></a:clrScheme><a:fontScheme name="Office"><a:majorFont><a:latin typeface="Calibri Light"/><a:ea typeface=""/><a:cs typeface=""/><a:font script="Jpan" typeface="Yu Gothic Light"/><a:font script="Hang" typeface="맑은 고딕"/><a:font script="Hans" typeface="等线 Light"/><a:font script="Hant" typeface="新細明體"/><a:font script="Arab" typeface="Times New Roman"/><a:font script="Hebr" typeface="Times New Roman"/><a:font script="Thai" typeface="Tahoma"/><a:font script="Ethi" typeface="Nyala"/><a:font script="Beng" typeface="Vrinda"/><a:font script="Gujr" typeface="Shruti"/><a:font script="Khmr" typeface="MoolBoran"/><a:font script="Knda" typeface="Tunga"/><a:font script="Guru" typeface="Raavi"/><a:font script="Cans" typeface="Euphemia"/><a:font script="Cher" typeface="Plantagenet Cherokee"/><a:font script="Yiii" typeface="Microsoft Yi Baiti"/><a:font script="Tibt" typeface="Microsoft Himalaya"/><a:font script="Thaa" typeface="MV Boli"/><a:font script="Deva" typeface="Mangal"/><a:font script="Telu" typeface="Gautami"/><a:font script="Taml" typeface="Latha"/><a:font script="Syrc" typeface="Estrangelo Edessa"/><a:font script="Orya" typeface="Kalinga"/><a:font script="Mlym" typeface="Kartika"/><a:font script="Laoo" typeface="DokChampa"/><a:font script="Sinh" typeface="Iskoola Pota"/><a:font script="Mong" typeface="Mongolian Baiti"/><a:font script="Viet" typeface="Times New Roman"/><a:font script="Uigh" typeface="Microsoft Uighur"/><a:font script="Geor" typeface="Sylfaen"/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/><a:font script="Jpan" typeface="Yu Gothic"/><a:font script="Hang" typeface="맑은 고딕"/><a:font script="Hans" typeface="等线"/><a:font script="Hant" typeface="新細明體"/><a:font script="Arab" typeface="Arial"/><a:font script="Hebr" typeface="Arial"/><a:font script="Thai" typeface="Tahoma"/><a:font script="Ethi" typeface="Nyala"/><a:font script="Beng" typeface="Vrinda"/><a:font script="Gujr" typeface="Shruti"/><a:font script="Khmr" typeface="DaunPenh"/><a:font script="Knda" typeface="Tunga"/><a:font script="Guru" typeface="Raavi"/><a:font script="Cans" typeface="Euphemia"/><a:font script="Cher" typeface="Plantagenet Cherokee"/><a:font script="Yiii" typeface="Microsoft Yi Baiti"/><a:font script="Tibt" typeface="Microsoft Himalaya"/><a:font script="Thaa" typeface="MV Boli"/><a:font script="Deva" typeface="Mangal"/><a:font script="Telu" typeface="Gautami"/><a:font script="Taml" typeface="Latha"/><a:font script="Syrc" typeface="Estrangelo Edessa"/><a:font script="Orya" typeface="Kalinga"/><a:font script="Mlym" typeface="Kartika"/><a:font script="Laoo" typeface="DokChampa"/><a:font script="Sinh" typeface="Iskoola Pota"/><a:font script="Mong" typeface="Mongolian Baiti"/><a:font script="Viet" typeface="Arial"/><a:font script="Uigh" typeface="Microsoft Uighur"/><a:font script="Geor" typeface="Sylfaen"/></a:minorFont></a:fontScheme><a:fmtScheme name="Office"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:gradFill rotWithShape="1"><a:gsLst><a:gs pos="0"><a:schemeClr val="phClr"><a:lumMod val="110000"/><a:satMod val="105000"/><a:tint val="67000"/></a:schemeClr></a:gs><a:gs pos="50000"><a:schemeClr val="phClr"><a:lumMod val="105000"/><a:satMod val="103000"/><a:tint val="73000"/></a:schemeClr></a:gs><a:gs pos="100000"><a:schemeClr val="phClr"><a:lumMod val="105000"/><a:satMod val="109000"/><a:tint val="81000"/></a:schemeClr></a:gs></a:gsLst><a:lin ang="5400000" scaled="0"/></a:gradFill><a:gradFill rotWithShape="1"><a:gsLst><a:gs pos="0"><a:schemeClr val="phClr"><a:satMod val="103000"/><a:lumMod val="102000"/><a:tint val="94000"/></a:schemeClr></a:gs><a:gs pos="50000"><a:schemeClr val="phClr"><a:satMod val="110000"/><a:lumMod val="100000"/><a:shade val="100000"/></a:schemeClr></a:gs><a:gs pos="100000"><a:schemeClr val="phClr"><a:lumMod val="99000"/><a:satMod val="120000"/><a:shade val="78000"/></a:schemeClr></a:gs></a:gsLst><a:lin ang="5400000" scaled="0"/></a:gradFill></a:fillStyleLst><a:lnStyleLst><a:ln w="6350" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln><a:ln w="12700" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln><a:ln w="19050" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst><a:outerShdw blurRad="57150" dist="19050" dir="5400000" algn="ctr" rotWithShape="0"><a:srgbClr val="000000"><a:alpha val="63000"/></a:srgbClr></a:outerShdw></a:effectLst></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"><a:tint val="95000"/><a:satMod val="170000"/></a:schemeClr></a:solidFill><a:gradFill rotWithShape="1"><a:gsLst><a:gs pos="0"><a:schemeClr val="phClr"><a:tint val="93000"/><a:satMod val="150000"/><a:shade val="98000"/><a:lumMod val="102000"/></a:schemeClr></a:gs><a:gs pos="50000"><a:schemeClr val="phClr"><a:tint val="98000"/><a:satMod val="130000"/><a:shade val="90000"/><a:lumMod val="103000"/></a:schemeClr></a:gs><a:gs pos="100000"><a:schemeClr val="phClr"><a:shade val="63000"/><a:satMod val="120000"/></a:schemeClr></a:gs></a:gsLst><a:lin ang="5400000" scaled="0"/></a:gradFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/></a:theme>`;

  const MONTHS = [
    { num: 1, name: 'січень', days: 31, startRow: 14, endRow: 44, exciseRow: 45, totalRow: 46 },
    { num: 2, name: 'лютий', days: 29, startRow: 47, endRow: 75, exciseRow: 76, totalRow: 77 },
    { num: 3, name: 'березень', days: 31, startRow: 78, endRow: 108, exciseRow: 109, totalRow: 110 },
    { num: 4, name: 'квітень', days: 30, startRow: 111, endRow: 140, exciseRow: 141, totalRow: 142 },
    { num: 5, name: 'травень', days: 31, startRow: 143, endRow: 173, exciseRow: 174, totalRow: 175 },
    { num: 6, name: 'червень', days: 30, startRow: 176, endRow: 205, exciseRow: 206, totalRow: 207 },
    { num: 7, name: 'липень', days: 31, startRow: 208, endRow: 238, exciseRow: 239, totalRow: 240 },
    { num: 8, name: 'серпень', days: 31, startRow: 241, endRow: 271, exciseRow: 272, totalRow: 273 },
    { num: 9, name: 'вересень', days: 30, startRow: 274, endRow: 303, exciseRow: 304, totalRow: 305 },
    { num: 10, name: 'жовтень', days: 31, startRow: 306, endRow: 336, exciseRow: 337, totalRow: 338 },
    { num: 11, name: 'листопад', days: 30, startRow: 339, endRow: 368, exciseRow: 369, totalRow: 370 },
    { num: 12, name: 'грудень', days: 31, startRow: 371, endRow: 401, exciseRow: 402, totalRow: 403 }
  ];

  function getExcelDateSerial(y, m, d) {
    const utcDate = Date.UTC(y, m - 1, d);
    const excelBase = Date.UTC(1899, 11, 30);
    return Math.round((utcDate - excelBase) / (24 * 60 * 60 * 1000));
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

  /**
   * Generates a 1:1 replica of General Tax System Book
   * "Книга доходів і витрат (загальна система) за {year} рік.xlsx"
   *
   * @param {Object} params
   * @param {number|string} params.year - e.g. 2026
   * @param {Object} params.dailyData - Map of date key ('YYYY-MM-DD' or 'DD.MM.YYYY') to { sales: number, returns: number }
   * @param {string} [params.taxpayerName] - e.g. "АЛЕКСАНДРОВА ДАРИНА БОРИСІВНА"
   * @param {string} [params.taxpayerCode] - e.g. "3254413922"
   * @returns {{ uint8: Uint8Array, blob: Blob, fileName: string }}
   */
  function buildGeneralBookXlsxData({ year, dailyData = {}, taxpayerName = '', taxpayerCode = '', workerSalaries = [], taxPayments = [] }) {
    const { SimpleZip } = window.KaderGo.Zip;
    const zip = new SimpleZip();
    const numYear = parseInt(year, 10) || new Date().getFullYear();

    // 1. Shared Strings Table Builder
    const strings = [];
    const stringMap = new Map();

    function addString(s) {
      if (stringMap.has(s)) return stringMap.get(s);
      const idx = strings.length;
      strings.push(s);
      stringMap.set(s, idx);
      return idx;
    }

    // Strings 0..24: Official Static Form Texts
    const sstApproved = addString('                                                                                                                                      ЗАТВЕРДЖЕНО');
    const sstOrder1 = addString('Наказ Міністерства фінансів України');
    const sstOrder2 = addString('13 травня 2021 року № 261');
    const sstTitle = addString('Типова форма, за якою здійснюється облік доходів і витрат фізичними особами - підприємцями і фізичними особами, які провадять незалежну професійну діяльність');
    const sstNameSub = addString("(прізвище, ім'я, по батькові (за наявності)");
    const sstCodeSub = addString('(податковий номер1 або серія (за наявності) та номер паспорта2 платника)');

    const sstCol1 = addString('Дата (день, місяць, рік)');
    const sstCol2 = addString('Сума доходу, отриманого від здійснення господарської діяльності або незалежної професійної діяльності (грн, коп.)');
    const sstCol3_top = addString('Сума повернутих покупцям (замовникам) коштів та/або передплати за товари (роботи, послуги)');
    const sstCol4_top = addString('Загальна сума отриманого доходу, яка підлягає декларуванню (грн, коп.)');
    const sstCol5_10 = addString("Витрати, пов'язані з господарською діяльністю або провадженням незалежної професійної діяльності, які документально підтверджені (грн, коп.)");
    const sstCol11 = addString('Сума чистого оподаткованого доходу        (грн,коп.)           (гр. 4, 6, 7, 8, 9, 10) ');
    const sstCol3_sub = addString('(грн, коп.)');
    const sstCol4_sub = addString('(гр. 2 - гр. 3 )');
    const sstCol5_sub = addString('реквізити документа, що підтверджує понесені витрати');
    const sstCol6_top = addString('витрати на придбання товарно-');
    const sstCol7 = addString('витрати на оплату праці фізичних осіб, що перебувають у трудових відносинах / за виконання робіт, послуг згідно з договорами цивільно-правового характеру');
    const sstCol8 = addString("витрати зі сплати податків, зборів, єдиного внеску на загальнообов'язкове державне соціальне страхування, платежів, за одержання ліцензій, дозволів");
    const sstCol9 = addString("інші витрати, пов'язані з одержанням доходу / провадженням незалежної професійної діяльності");
    const sstCol10 = addString('амортизаційні відрахування');
    const sstCol6_sub = addString('матеріальних цінностей, що реалізовані/ використані у виробництві продукції, товарів (наданні робіт, послуг), або для використання під час провадження незалежної професійної діяльності');

    const sstFootUnderline = addString('____________');
    const sstFoot1 = addString('1 Зазначається реєстраційний (обліковий) номер платника податків, який присвоюється контролюючими органами, або реєстраційний номер облікової картки платника податків - фізичної особи.');
    const sstFoot2 = addString('2 Серію (за наявності) та номер паспорта зазначають фізичні особи, які через свої релігійні переконання відмовляються від прийняття реєстраційного номера облікової картки платника податків та офіційно повідомили про це відповідний контролюючий орган і мають відмітку у паспорті.');
    const sstFoot3 = addString('3 У графі 10 вказується підсумкове значення колонки 11 додатка до типової форми, що заповнюється за бажанням платника');

    // String 25: Excise label
    const sstExcise = addString('Акцизний податок');

    // String 26: Taxpayer Name
    const sstNameHeader = addString(taxpayerName ? `Платник податків: ${taxpayerName.trim()}` : 'Платник податків: ________________________________________');

    // Month strings
    const sstMonthSummaries = [];
    for (let m = 0; m < 12; m++) {
      sstMonthSummaries.push(addString(`Всього за ${MONTHS[m].name} ${numYear} року`));
    }

    // Feb 29 string (for non-leap years)
    const sstFeb29 = addString(`29.02.${numYear}`);

    // Year total string
    const sstYearSummary = addString(`Всього ${numYear}`);

    // 2. Merges (exact 21 merges)
    const merges = [
      'A1:I1',
      'A2:I2',
      'A3:I3',
      'A4:K4',
      'A5:O5',
      'A6:O6',
      'A7:O7',
      'A8:O8',
      'A9:A12',
      'B9:B12',
      'E9:J10',
      'E11:E12',
      'G11:G12',
      'H11:H12',
      'I11:I12',
      'J11:J12',
      'K9:K12',
      'A406:K406',
      'A407:K407',
      'A408:K408',
      'A409:K409'
    ];

    // 3. Build Sheet Rows
    const rowsXml = [];

    // Rows 1-3: Approval header
    rowsXml.push(`<row r="1" ht="22.5" customHeight="1"><c r="A1" s="40" t="s"><v>${sstApproved}</v></c><c r="B1" s="40"/><c r="C1" s="40"/><c r="D1" s="40"/><c r="E1" s="40"/><c r="F1" s="40"/><c r="G1" s="40"/><c r="H1" s="40"/><c r="I1" s="40"/><c r="J1" s="13"/><c r="K1" s="13"/><c r="L1" s="13"/><c r="M1" s="2"/><c r="N1" s="2"/><c r="O1" s="2"/></row>`);
    rowsXml.push(`<row r="2" ht="15" customHeight="1"><c r="A2" s="40" t="s"><v>${sstOrder1}</v></c><c r="B2" s="40"/><c r="C2" s="40"/><c r="D2" s="40"/><c r="E2" s="40"/><c r="F2" s="40"/><c r="G2" s="40"/><c r="H2" s="40"/><c r="I2" s="40"/><c r="J2" s="13"/><c r="K2" s="13"/><c r="L2" s="13"/><c r="M2" s="2"/><c r="N2" s="2"/><c r="O2" s="2"/></row>`);
    rowsXml.push(`<row r="3" ht="17.25" customHeight="1"><c r="A3" s="40" t="s"><v>${sstOrder2}</v></c><c r="B3" s="40"/><c r="C3" s="40"/><c r="D3" s="40"/><c r="E3" s="40"/><c r="F3" s="40"/><c r="G3" s="40"/><c r="H3" s="40"/><c r="I3" s="40"/><c r="J3" s="13"/><c r="K3" s="13"/><c r="L3" s="13"/><c r="M3" s="2"/><c r="N3" s="2"/><c r="O3" s="2"/></row>`);

    // Row 4: Form Title
    rowsXml.push(`<row r="4" ht="38.25" customHeight="1"><c r="A4" s="41" t="s"><v>${sstTitle}</v></c><c r="B4" s="41"/><c r="C4" s="41"/><c r="D4" s="41"/><c r="E4" s="41"/><c r="F4" s="41"/><c r="G4" s="41"/><c r="H4" s="41"/><c r="I4" s="41"/><c r="J4" s="41"/><c r="K4" s="41"/><c r="L4" s="3"/><c r="M4" s="3"/><c r="N4" s="3"/><c r="O4" s="3"/></row>`);

    // Row 5: Taxpayer Name
    rowsXml.push(`<row r="5" ht="24" customHeight="1"><c r="A5" s="42" t="s"><v>${sstNameHeader}</v></c><c r="B5" s="43"/><c r="C5" s="43"/><c r="D5" s="43"/><c r="E5" s="43"/><c r="F5" s="43"/><c r="G5" s="43"/><c r="H5" s="43"/><c r="I5" s="43"/><c r="J5" s="43"/><c r="K5" s="43"/><c r="L5" s="43"/><c r="M5" s="43"/><c r="N5" s="43"/><c r="O5" s="43"/></row>`);

    // Row 6: Name Label
    rowsXml.push(`<row r="6"><c r="A6" s="44" t="s"><v>${sstNameSub}</v></c><c r="B6" s="44"/><c r="C6" s="44"/><c r="D6" s="44"/><c r="E6" s="44"/><c r="F6" s="44"/><c r="G6" s="44"/><c r="H6" s="44"/><c r="I6" s="44"/><c r="J6" s="44"/><c r="K6" s="44"/><c r="L6" s="44"/><c r="M6" s="44"/><c r="N6" s="44"/><c r="O6" s="44"/></row>`);

    // Row 7: Taxpayer IPN/Code
    const cleanCode = (taxpayerCode || '').trim();
    const cellCodeVal = cleanCode ? `<v>${escapeXml(cleanCode)}</v>` : '';
    rowsXml.push(`<row r="7" ht="18.75" customHeight="1"><c r="A7" s="45">${cellCodeVal}</c><c r="B7" s="46"/><c r="C7" s="46"/><c r="D7" s="46"/><c r="E7" s="46"/><c r="F7" s="46"/><c r="G7" s="46"/><c r="H7" s="46"/><c r="I7" s="46"/><c r="J7" s="46"/><c r="K7" s="46"/><c r="L7" s="46"/><c r="M7" s="46"/><c r="N7" s="46"/><c r="O7" s="46"/></row>`);

    // Row 8: Code Label
    rowsXml.push(`<row r="8" ht="15.75" customHeight="1"><c r="A8" s="44" t="s"><v>${sstCodeSub}</v></c><c r="B8" s="44"/><c r="C8" s="44"/><c r="D8" s="44"/><c r="E8" s="44"/><c r="F8" s="44"/><c r="G8" s="44"/><c r="H8" s="44"/><c r="I8" s="44"/><c r="J8" s="44"/><c r="K8" s="44"/><c r="L8" s="44"/><c r="M8" s="44"/><c r="N8" s="44"/><c r="O8" s="44"/></row>`);

    // Table Header Rows 9-13
    rowsXml.push(`<row r="9" ht="102" customHeight="1"><c r="A9" s="49" t="s"><v>${sstCol1}</v></c><c r="B9" s="49" t="s"><v>${sstCol2}</v></c><c r="C9" s="4" t="s"><v>${sstCol3_top}</v></c><c r="D9" s="4" t="s"><v>${sstCol4_top}</v></c><c r="E9" s="51" t="s"><v>${sstCol5_10}</v></c><c r="F9" s="52"/><c r="G9" s="52"/><c r="H9" s="52"/><c r="I9" s="52"/><c r="J9" s="53"/><c r="K9" s="49" t="s"><v>${sstCol11}</v></c><c r="L9" s="25"/><c r="M9" s="25"/><c r="N9" s="25"/><c r="O9" s="25"/></row>`);

    rowsXml.push(`<row r="10"><c r="A10" s="50"/><c r="B10" s="50"/><c r="C10" s="5" t="s"><v>${sstCol3_sub}</v></c><c r="D10" s="5" t="s"><v>${sstCol4_sub}</v></c><c r="E10" s="54"/><c r="F10" s="55"/><c r="G10" s="55"/><c r="H10" s="55"/><c r="I10" s="55"/><c r="J10" s="56"/><c r="K10" s="50"/><c r="L10" s="25"/><c r="M10" s="25"/><c r="N10" s="25"/><c r="O10" s="25"/></row>`);

    rowsXml.push(`<row r="11" ht="39.75" customHeight="1"><c r="A11" s="50"/><c r="B11" s="50"/><c r="C11" s="6"/><c r="D11" s="6"/><c r="E11" s="49" t="s"><v>${sstCol5_sub}</v></c><c r="F11" s="7" t="s"><v>${sstCol6_top}</v></c><c r="G11" s="49" t="s"><v>${sstCol7}</v></c><c r="H11" s="49" t="s"><v>${sstCol8}</v></c><c r="I11" s="49" t="s"><v>${sstCol9}</v></c><c r="J11" s="49" t="s"><v>${sstCol10}</v></c><c r="K11" s="50"/><c r="L11" s="25"/><c r="M11" s="25"/><c r="N11" s="25"/><c r="O11" s="25"/></row>`);

    rowsXml.push(`<row r="12" ht="204" customHeight="1"><c r="A12" s="50"/><c r="B12" s="50"/><c r="C12" s="6"/><c r="D12" s="6"/><c r="E12" s="50"/><c r="F12" s="8" t="s"><v>${sstCol6_sub}</v></c><c r="G12" s="50"/><c r="H12" s="50"/><c r="I12" s="50"/><c r="J12" s="50"/><c r="K12" s="50"/><c r="L12" s="25"/><c r="M12" s="25"/><c r="N12" s="25"/><c r="O12" s="25"/></row>`);

    rowsXml.push(`<row r="13"><c r="A13" s="9"><v>1</v></c><c r="B13" s="10"><v>2</v></c><c r="C13" s="11"><v>3</v></c><c r="D13" s="11"><v>4</v></c><c r="E13" s="11"><v>5</v></c><c r="F13" s="11"><v>6</v></c><c r="G13" s="11"><v>7</v></c><c r="H13" s="11"><v>8</v></c><c r="I13" s="11"><v>9</v></c><c r="J13" s="11"><v>10</v></c><c r="K13" s="11"><v>11</v></c><c r="L13" s="25"/><c r="M13" s="25"/><c r="N13" s="25"/><c r="O13" s="25"/></row>`);

    // Helper to retrieve daily turnover
    function getDayData(y, m, d) {
      const padM = String(m).padStart(2, '0');
      const padD = String(d).padStart(2, '0');
      const keyIso = `${y}-${padM}-${padD}`;
      const keyUa = `${padD}.${padM}.${y}`;

      const item = dailyData[keyIso] || dailyData[keyUa];
      if (!item) return { sales: 0, returns: 0 };
      const s = typeof item.sales === 'number' ? item.sales : parseFloat(item.sales) || 0;
      const r = typeof item.returns === 'number' ? item.returns : parseFloat(item.returns) || 0;
      return { sales: Math.round(s * 100) / 100, returns: Math.round(r * 100) / 100 };
    }

    const isLeapYear = (numYear % 4 === 0 && numYear % 100 !== 0) || (numYear % 400 === 0);

    // Build Daily Expenses Map (Column E: Doc, Column G: Labor/CPH, Column H: Taxes/Licenses)
    const dailyExpenses = {};
    function getExpenseEntry(y, m, d) {
      const k = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      if (!dailyExpenses[k]) {
        dailyExpenses[k] = { g: 0, h: 0, doc: [] };
      }
      return dailyExpenses[k];
    }

    // A) Process Tax Account Payments (License, ESV self, ESV workers/CPH)
    // ONLY the 3 approved tax codes: 71010000, 71040000, 22011100
    // And worker salary is ONLY added when ESV for workers (71010000) was actually paid!
    let totalMonthlyWorkerSalary = 0;
    if (Array.isArray(workerSalaries)) {
      totalMonthlyWorkerSalary = workerSalaries.reduce((sum, w) => sum + (parseFloat(w.amount) || 0), 0);
    } else if (typeof workerSalaries === 'number') {
      totalMonthlyWorkerSalary = workerSalaries;
    }
    totalMonthlyWorkerSalary = Math.round(totalMonthlyWorkerSalary * 100) / 100;

    const monthsWithWorkerSalaryAdded = new Set();

    if (Array.isArray(taxPayments)) {
      // Sort payments chronologically
      const sortedPayments = [...taxPayments].sort((a, b) => {
        return (a.year || numYear) - (b.year || numYear) || (a.month - b.month) || (a.day - b.day);
      });

      sortedPayments.forEach((p) => {
        if (!p || !p.month || !p.day || !p.amount || p.amount <= 0) return;
        const rawCode = String(p.taxCode || p.code || p.rawCode || '').trim();
        let normalizedCode = '';
        if (rawCode.includes('7071040000') || rawCode.includes('71040000')) {
          normalizedCode = '71040000';
        } else if (rawCode.includes('71010000')) {
          normalizedCode = '71010000';
        } else if (rawCode.includes('22011100')) {
          normalizedCode = '22011100';
        } else {
          return; // Ignore other taxes
        }

        const payYear = parseInt(p.year, 10) || numYear;
        const entry = getExpenseEntry(payYear, p.month, p.day);

        if (normalizedCode === '71010000') {
          // ЄСВ за найманих працівників / ЦПХ -> Col G
          // Csak akkor van munkásfizu, amikor neki van єсв befizetve!
          // "G oszlop munkás fizu (13k) + цпх", "irjam egybe a єсвvel a цпх-ssal"
          let salaryToAdd = 0;
          if (totalMonthlyWorkerSalary > 0 && !monthsWithWorkerSalaryAdded.has(p.month)) {
            salaryToAdd = totalMonthlyWorkerSalary;
            monthsWithWorkerSalaryAdded.add(p.month);
          }

          const combinedAmount = Math.round((p.amount + salaryToAdd) * 100) / 100;
          entry.g = Math.round((entry.g + combinedAmount) * 100) / 100;

          if (salaryToAdd > 0) {
            entry.doc.push(`${p.docInfo || p.opName || 'Сплата ЄСВ'} (ЄСВ: ${p.amount} грн + з/п: ${salaryToAdd} грн)`);
          } else {
            entry.doc.push(p.docInfo || p.opName || 'Сплата ЄСВ за працівників');
          }
        } else if (normalizedCode === '71040000' || normalizedCode === '22011100') {
          // Ліцензії (22011100) + ЄСВ за себе (71040000 / 7071040000) -> Col H
          entry.h = Math.round((entry.h + p.amount) * 100) / 100;
          entry.doc.push(p.docInfo || p.opName || (normalizedCode === '22011100' ? 'Плата за ліцензію' : 'Сплата ЄСВ за себе'));
        }
      });
    }

    let totalYearSales = 0;
    let totalYearReturns = 0;
    let totalYearNet = 0;
    let totalYearG = 0;
    let totalYearH = 0;

    // Generate All 12 Months
    for (let mi = 0; mi < 12; mi++) {
      const m = MONTHS[mi];
      let monthSales = 0;
      let monthReturns = 0;
      let monthNet = 0;
      let monthG = 0;
      let monthH = 0;

      for (let r = m.startRow; r <= m.endRow; r++) {
        const day = r - m.startRow + 1;
        let cellA = '';

        if (m.num === 2 && day === 29 && !isLeapYear) {
          // Non-leap year Feb 29: exact string "29.02.{year}" with style 12
          cellA = `<c r="A${r}" s="12" t="s"><v>${sstFeb29}</v></c>`;
        } else {
          const dateSerial = getExcelDateSerial(numYear, m.num, day);
          cellA = `<c r="A${r}" s="12"><v>${dateSerial}</v></c>`;
        }

        const { sales, returns } = (m.num === 2 && day === 29 && !isLeapYear)
          ? { sales: 0, returns: 0 }
          : getDayData(numYear, m.num, day);

        monthSales += sales;
        monthReturns += returns;

        const cellB = sales > 0 ? `<c r="B${r}" s="14"><v>${sales}</v></c>` : `<c r="B${r}" s="14"/>`;
        const cellC = returns > 0 ? `<c r="C${r}" s="14"><v>${returns}</v></c>` : `<c r="C${r}" s="14"/>`;

        // Col D formula: =(B{r}-C{r})/1.05
        const netDailyVal = (sales > 0 || returns > 0)
          ? Math.round(((sales - returns) / 1.05) * 100) / 100
          : 0;
        monthNet += netDailyVal;

        // Daily expenses from tax payments or worker salary
        const exp = getExpenseEntry(numYear, m.num, day);
        const dayG = Math.round(exp.g * 100) / 100;
        const dayH = Math.round(exp.h * 100) / 100;
        monthG += dayG;
        monthH += dayH;

        const docStr = exp.doc.length > 0 ? exp.doc.join('; ') : '';
        const cellE = docStr ? `<c r="E${r}" s="14" t="s"><v>${addString(docStr)}</v></c>` : `<c r="E${r}" s="14"/>`;
        const cellG = dayG > 0 ? `<c r="G${r}" s="14"><v>${dayG}</v></c>` : `<c r="G${r}" s="14"/>`;
        const cellH = dayH > 0 ? `<c r="H${r}" s="14"><v>${dayH}</v></c>` : `<c r="H${r}" s="14"/>`;

        const netDailyProfit = Math.round((netDailyVal - dayG - dayH) * 100) / 100;
        const cellD = `<c r="D${r}" s="14"><f>(B${r}-C${r})/1.05</f><v>${netDailyVal}</v></c>`;
        const cellK = `<c r="K${r}" s="14"><f>D${r}-F${r}-G${r}-H${r}-I${r}-J${r}</f><v>${netDailyProfit}</v></c>`;

        rowsXml.push(`<row r="${r}">${cellA}${cellB}${cellC}${cellD}${cellE}<c r="F${r}" s="14"/>${cellG}${cellH}<c r="I${r}" s="14"/><c r="J${r}" s="14"/>${cellK}<c r="L${r}" s="25"/><c r="M${r}" s="25"/><c r="N${r}" s="25"/><c r="O${r}" s="25"/></row>`);
      }

      monthSales = Math.round(monthSales * 100) / 100;
      monthReturns = Math.round(monthReturns * 100) / 100;
      monthNet = Math.round(monthNet * 100) / 100;
      monthG = Math.round(monthG * 100) / 100;
      monthH = Math.round(monthH * 100) / 100;
      const monthProfit = Math.round((monthNet - monthG - monthH) * 100) / 100;

      totalYearSales += monthSales;
      totalYearReturns += monthReturns;
      totalYearNet += monthNet;
      totalYearG += monthG;
      totalYearH += monthH;

      // 1. Excise Row (before month total): B = D{totalRow}*0.05
      const exciseVal = Math.round(monthNet * 0.05 * 100) / 100;
      rowsXml.push(`<row r="${m.exciseRow}"><c r="A${m.exciseRow}" s="57" t="s"><v>${sstExcise}</v></c><c r="B${m.exciseRow}" s="37"><f>D${m.totalRow}*0.05</f><v>${exciseVal}</v></c><c r="C${m.exciseRow}" s="35"/><c r="D${m.exciseRow}" s="14"/><c r="E${m.exciseRow}" s="14"/><c r="F${m.exciseRow}" s="14"/><c r="G${m.exciseRow}" s="14"/><c r="H${m.exciseRow}" s="14"/><c r="I${m.exciseRow}" s="14"/><c r="J${m.exciseRow}" s="14"/><c r="K${m.exciseRow}" s="14"/><c r="L${m.exciseRow}" s="25"/><c r="M${m.exciseRow}" s="25"/><c r="N${m.exciseRow}" s="25"/><c r="O${m.exciseRow}" s="25"/></row>`);

      // 2. Month Total Row
      const isDec = m.num === 12;
      const totStyleA = isDec ? 28 : 21;
      const totStyleB = isDec ? 29 : 36;
      const totStyleRest = isDec ? 29 : 24;
      const totStyleLO = isDec ? 27 : 25;
      const totHt = isDec ? '33' : '33.75';

      rowsXml.push(`<row r="${m.totalRow}" ht="${totHt}" customHeight="1"><c r="A${m.totalRow}" s="${totStyleA}" t="s"><v>${sstMonthSummaries[mi]}</v></c><c r="B${m.totalRow}" s="${totStyleB}"><f>SUM(B${m.startRow}:B${m.endRow})</f><v>${monthSales}</v></c><c r="C${m.totalRow}" s="${totStyleRest}"><f>SUM(C${m.startRow}:C${m.endRow})</f><v>${monthReturns}</v></c><c r="D${m.totalRow}" s="${totStyleRest}"><f>SUM(D${m.startRow}:D${m.endRow})</f><v>${monthNet}</v></c><c r="E${m.totalRow}" s="${totStyleRest}"><f>SUM(E${m.startRow}:E${m.endRow})</f><v>0</v></c><c r="F${m.totalRow}" s="${totStyleRest}"><f>SUM(F${m.startRow}:F${m.endRow})</f><v>0</v></c><c r="G${m.totalRow}" s="${totStyleRest}"><f>SUM(G${m.startRow}:G${m.endRow})</f><v>${monthG}</v></c><c r="H${m.totalRow}" s="${totStyleRest}"><f>SUM(H${m.startRow}:H${m.endRow})</f><v>${monthH}</v></c><c r="I${m.totalRow}" s="${totStyleRest}"><f>SUM(I${m.startRow}:I${m.endRow})</f><v>0</v></c><c r="J${m.totalRow}" s="${totStyleRest}"><f>SUM(J${m.startRow}:J${m.endRow})</f><v>0</v></c><c r="K${m.totalRow}" s="${totStyleRest}"><f>D${m.totalRow}-F${m.totalRow}-G${m.totalRow}-H${m.totalRow}</f><v>${monthProfit}</v></c><c r="L${m.totalRow}" s="${totStyleLO}"/><c r="M${m.totalRow}" s="${totStyleLO}"/><c r="N${m.totalRow}" s="${totStyleLO}"/><c r="O${m.totalRow}" s="${totStyleLO}"/></row>`);
    }

    totalYearSales = Math.round(totalYearSales * 100) / 100;
    totalYearReturns = Math.round(totalYearReturns * 100) / 100;
    totalYearNet = Math.round(totalYearNet * 100) / 100;
    totalYearG = Math.round(totalYearG * 100) / 100;
    totalYearH = Math.round(totalYearH * 100) / 100;
    const totalYearProfit = Math.round((totalYearNet - totalYearG - totalYearH) * 100) / 100;

    // Row 404: Year Total (summing all 12 monthly totals)
    const monthTotals = [46, 77, 110, 142, 175, 207, 240, 273, 305, 338, 370, 403];
    const sumTotalFormula = (col) => monthTotals.map(r => `${col}${r}`).join('+');

    rowsXml.push(`<row r="404"><c r="A404" s="30" t="s"><v>${sstYearSummary}</v></c><c r="B404" s="31"><f>${sumTotalFormula('B')}</f><v>${totalYearSales}</v></c><c r="C404" s="31"><f>${sumTotalFormula('C')}</f><v>${totalYearReturns}</v></c><c r="D404" s="31"><f>${sumTotalFormula('D')}</f><v>${totalYearNet}</v></c><c r="E404" s="31"><f>${sumTotalFormula('E')}</f><v>0</v></c><c r="F404" s="31"><f>${sumTotalFormula('F')}</f><v>0</v></c><c r="G404" s="31"><f>${sumTotalFormula('G')}</f><v>${totalYearG}</v></c><c r="H404" s="31"><f>${sumTotalFormula('H')}</f><v>${totalYearH}</v></c><c r="I404" s="31"><f>${sumTotalFormula('I')}</f><v>0</v></c><c r="J404" s="31"><f>${sumTotalFormula('J')}</f><v>0</v></c><c r="K404" s="31"><f>D404-F404-G404-H404</f><v>${totalYearProfit}</v></c><c r="L404" s="27"/><c r="M404" s="27"/><c r="N404" s="27"/><c r="O404" s="27"/></row>`);

    // Footnotes (Rows 406..409)
    rowsXml.push(`<row r="406" ht="15.75"><c r="A406" s="47" t="s"><v>${sstFootUnderline}</v></c><c r="B406" s="47"/><c r="C406" s="47"/><c r="D406" s="47"/><c r="E406" s="47"/><c r="F406" s="47"/><c r="G406" s="47"/><c r="H406" s="47"/><c r="I406" s="47"/><c r="J406" s="47"/><c r="K406" s="47"/></row>`);
    rowsXml.push(`<row r="407" ht="18.75"><c r="A407" s="48" t="s"><v>${sstFoot1}</v></c><c r="B407" s="48"/><c r="C407" s="48"/><c r="D407" s="48"/><c r="E407" s="48"/><c r="F407" s="48"/><c r="G407" s="48"/><c r="H407" s="48"/><c r="I407" s="48"/><c r="J407" s="48"/><c r="K407" s="48"/></row>`);
    rowsXml.push(`<row r="408" ht="18.75"><c r="A408" s="48" t="s"><v>${sstFoot2}</v></c><c r="B408" s="48"/><c r="C408" s="48"/><c r="D408" s="48"/><c r="E408" s="48"/><c r="F408" s="48"/><c r="G408" s="48"/><c r="H408" s="48"/><c r="I408" s="48"/><c r="J408" s="48"/><c r="K408" s="48"/></row>`);
    rowsXml.push(`<row r="409" ht="18.75"><c r="A409" s="48" t="s"><v>${sstFoot3}</v></c><c r="B409" s="48"/><c r="C409" s="48"/><c r="D409" s="48"/><c r="E409" s="48"/><c r="F409" s="48"/><c r="G409" s="48"/><c r="H409" s="48"/><c r="I409" s="48"/><c r="J409" s="48"/><c r="K409" s="48"/></row>`);

    // 4. Assemble package files
    // [Content_Types].xml
    zip.addFile('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`);

    // _rels/.rels
    zip.addFile('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`);

    // docProps/core.xml
    const nowIso = new Date().toISOString();
    zip.addFile('docProps/core.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:creator>KaderGo</dc:creator>
  <cp:lastModifiedBy>KaderGo</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${nowIso}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${nowIso}</dcterms:modified>
</cp:coreProperties>`);

    // docProps/app.xml
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
      <vt:lpstr>Лист1</vt:lpstr>
    </vt:vector>
  </TitlesOfParts>
  <Company>KaderGo</Company>
  <LinksUpToDate>false</LinksUpToDate>
  <SharedDoc>false</SharedDoc>
  <HyperlinksChanged>false</HyperlinksChanged>
  <AppVersion>16.0300</AppVersion>
</Properties>`);

    // xl/_rels/workbook.xml.rels
    zip.addFile('xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
</Relationships>`);

    // xl/workbook.xml
    zip.addFile('xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <workbookPr defaultThemeVersion="166925"/>
  <sheets>
    <sheet name="Лист1" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`);

    // xl/styles.xml
    zip.addFile('xl/styles.xml', STYLES_XML);

    // xl/theme/theme1.xml
    zip.addFile('xl/theme/theme1.xml', THEME_XML);

    // xl/sharedStrings.xml
    const sstItemsXml = strings.map(s => `<si><t xml:space="preserve">${escapeXml(s)}</t></si>`).join('');
    zip.addFile('xl/sharedStrings.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${strings.length}" uniqueCount="${strings.length}">
  ${sstItemsXml}
</sst>`);

    // xl/worksheets/sheet1.xml
    const mergeCellsXml = merges.map(m => `<mergeCell ref="${m}"/>`).join('');
    const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable="x14ac xr xr2 xr3" xmlns:x14ac="http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac" xmlns:xr="http://schemas.microsoft.com/office/spreadsheetml/2014/revision" xmlns:xr2="http://schemas.microsoft.com/office/spreadsheetml/2015/revision2" xmlns:xr3="http://schemas.microsoft.com/office/spreadsheetml/2016/revision3">
  <dimension ref="A1:O409"/>
  <sheetViews>
    <sheetView tabSelected="1" zoomScaleNormal="100" workbookViewId="0">
      <selection activeCell="A1" sqref="A1"/>
    </sheetView>
  </sheetViews>
  <sheetFormatPr defaultColWidth="9" defaultRowHeight="15"/>
  <cols>
    <col min="1" max="1" width="26.140625" customWidth="1"/>
    <col min="2" max="4" width="14.7109375" customWidth="1"/>
    <col min="5" max="5" width="19.5703125" customWidth="1"/>
    <col min="6" max="11" width="14.7109375" customWidth="1"/>
    <col min="12" max="12" width="9.140625"/>
    <col min="14" max="14" width="10.7109375" bestFit="1" customWidth="1"/>
  </cols>
  <sheetData>
    ${rowsXml.join('\n    ')}
  </sheetData>
  <mergeCells count="${merges.length}">
    ${mergeCellsXml}
  </mergeCells>
  <pageMargins left="0.25" right="0.25" top="0.75" bottom="0.75" header="0.29861111111111099" footer="0.29861111111111099"/>
  <pageSetup paperSize="9" scale="75" orientation="landscape" horizontalDpi="300" verticalDpi="300"/>
</worksheet>`;

    zip.addFile('xl/worksheets/sheet1.xml', sheetXml);

    const uint8 = zip.toUint8Array();
    const surname = extractTaxpayerSurname(taxpayerName);
    const fileName = surname
      ? `Книга загальна система ${surname} ${numYear}.xlsx`
      : `Книга загальна система ${numYear}.xlsx`;
    const blob = (typeof Blob !== 'undefined')
      ? new Blob([uint8], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      : null;

    return { uint8, blob, fileName, surname };
  }

  function extractTaxpayerSurname(taxpayerName) {
    if (!taxpayerName || typeof taxpayerName !== 'string') return '';
    const clean = taxpayerName
      .replace(/ФОП|ФЛП/gi, '')
      .replace(/[«»"'0-9]/g, '')
      .trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';
    const rawSurname = parts[0];
    return rawSurname.charAt(0).toUpperCase() + rawSurname.slice(1).toLowerCase();
  }

  window.KaderGo.GeneralBookExcel = {
    buildGeneralBookXlsxData,
    extractTaxpayerSurname
  };
})();
