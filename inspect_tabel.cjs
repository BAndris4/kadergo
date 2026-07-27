const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const wb = XLSX.readFile(path.join(__dirname, 'ТАБЕЛЬ березень.xls'), { cellStyles: true, cellFormulas: true });
const ws = wb.Sheets[wb.SheetNames[0]];

const output = [];

output.push('=== SHEET SUMMARY ===');
output.push(`Sheet Name: ${wb.SheetNames[0]}`);
output.push(`Ref Range: ${ws['!ref']}`);

const range = XLSX.utils.decode_range(ws['!ref']);

output.push('\n=== MERGED RANGES ===');
if (ws['!merges']) {
  ws['!merges'].forEach((m, idx) => {
    const s = XLSX.utils.encode_cell(m.s);
    const e = XLSX.utils.encode_cell(m.e);
    output.push(`Merge #${idx}: ${s}:${e} (r${m.s.r}:c${m.s.c} to r${m.e.r}:c${m.e.c})`);
  });
}

output.push('\n=== COLUMN WIDTHS ===');
if (ws['!cols']) {
  ws['!cols'].forEach((c, idx) => {
    if (c) {
      output.push(`Col ${idx} (${XLSX.utils.encode_col(idx)}): wch=${c.wch}, wpx=${c.wpx}, width=${c.width}`);
    }
  });
}

output.push('\n=== ROW HEIGHTS ===');
if (ws['!rows']) {
  ws['!rows'].forEach((r, idx) => {
    if (r) {
      output.push(`Row ${idx+1}: hpt=${r.hpt}, hpx=${r.hpx}`);
    }
  });
}

output.push('\n=== CELLS CONTENT & TYPES ===');
for (let r = range.s.r; r <= range.e.r; r++) {
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cellAddr = XLSX.utils.encode_cell({ r, c });
    const cell = ws[cellAddr];
    if (cell && cell.v !== undefined && cell.v !== null && String(cell.v).trim() !== '') {
      output.push(`Cell ${cellAddr} (r${r+1},c${XLSX.utils.encode_col(c)}[${c}]): v="${String(cell.v).replace(/\n/g, '\\n')}" w="${cell.w || ''}" f="${cell.f || ''}" t="${cell.t}"`);
    }
  }
}

fs.writeFileSync('tabel_structure_analysis.txt', output.join('\n'), 'utf-8');
console.log('Analysis written to tabel_structure_analysis.txt');
