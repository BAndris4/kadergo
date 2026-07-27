const XLSX = require('xlsx');
const fs = require('fs');

function compareExcelFiles(refPath, genPath) {
  console.log(`\n==================================================`);
  console.log(`COMPARING:`);
  console.log(`Reference: ${refPath}`);
  console.log(`Generated: ${genPath}`);
  console.log(`==================================================\n`);

  if (!fs.existsSync(refPath)) {
    console.error(`ERROR: Reference file ${refPath} does not exist!`);
    return;
  }
  if (!fs.existsSync(genPath)) {
    console.error(`ERROR: Generated file ${genPath} does not exist!`);
    return;
  }

  const refWb = XLSX.readFile(refPath, { cellStyles: true, cellFormulas: true });
  const genWb = XLSX.readFile(genPath, { cellStyles: true, cellFormulas: true });

  const refWs = refWb.Sheets[refWb.SheetNames[0]];
  const genWs = genWb.Sheets[genWb.SheetNames[0]];

  let diffCount = 0;

  // 1. Compare Range
  console.log(`Reference Ref: ${refWs['!ref']}, Generated Ref: ${genWs['!ref']}`);
  if (refWs['!ref'] !== genWs['!ref']) {
    console.log(`[DIFF] Ref range mismatch: ref=${refWs['!ref']} vs gen=${genWs['!ref']}`);
    diffCount++;
  }

  // 2. Compare Merges
  const refMerges = (refWs['!merges'] || []).map(m => XLSX.utils.encode_cell(m.s) + ':' + XLSX.utils.encode_cell(m.e)).sort();
  const genMerges = (genWs['!merges'] || []).map(m => XLSX.utils.encode_cell(m.s) + ':' + XLSX.utils.encode_cell(m.e)).sort();

  console.log(`Reference merges count: ${refMerges.length}, Generated merges count: ${genMerges.length}`);

  const missingMerges = refMerges.filter(m => !genMerges.includes(m));
  const extraMerges = genMerges.filter(m => !refMerges.includes(m));

  if (missingMerges.length > 0) {
    console.log(`[DIFF] Missing merges in generated (${missingMerges.length}):`, missingMerges.slice(0, 15).join(', '));
    diffCount += missingMerges.length;
  }
  if (extraMerges.length > 0) {
    console.log(`[DIFF] Extra merges in generated (${extraMerges.length}):`, extraMerges.slice(0, 15).join(', '));
    diffCount += extraMerges.length;
  }

  // 3. Compare Column Widths
  const maxCol = 41; // A to AP
  for (let c = 0; c <= maxCol; c++) {
    const colName = XLSX.utils.encode_col(c);
    const refCol = refWs['!cols'] ? refWs['!cols'][c] : null;
    const genCol = genWs['!cols'] ? genWs['!cols'][c] : null;

    const refWch = refCol ? refCol.wch : undefined;
    const genWch = genCol ? genCol.wch : undefined;

    if (refWch !== undefined && genWch !== undefined) {
      if (Math.abs(refWch - genWch) > 0.1) {
        console.log(`[DIFF] Col ${colName} (${c}) width mismatch: ref.wch=${refWch} vs gen.wch=${genWch}`);
        diffCount++;
      }
    }
  }

  // 4. Compare Cells Content & Formulas
  const refRange = XLSX.utils.decode_range(refWs['!ref'] || 'A1:AP52');
  const genRange = XLSX.utils.decode_range(genWs['!ref'] || 'A1:AP52');

  const maxR = Math.max(refRange.e.r, genRange.e.r);
  const maxC = Math.max(refRange.e.c, genRange.e.c);

  for (let r = 0; r <= maxR; r++) {
    for (let c = 0; c <= maxC; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const refCell = refWs[addr];
      const genCell = genWs[addr];

      const refVal = refCell && refCell.v !== undefined && refCell.v !== null ? String(refCell.v).trim() : '';
      const genVal = genCell && genCell.v !== undefined && genCell.v !== null ? String(genCell.v).trim() : '';

      const refForm = refCell ? (refCell.f || null) : null;
      const genForm = genCell ? (genCell.f || null) : null;

      // Normalize line breaks in values
      const normRefVal = refVal.replace(/\r\n/g, '\n');
      const normGenVal = genVal.replace(/\r\n/g, '\n');

      if (normRefVal !== normGenVal) {
        console.log(`[DIFF] Cell ${addr} (Row ${r+1} Col ${XLSX.utils.encode_col(c)}):`);
        console.log(`   REF: "${normRefVal}"`);
        console.log(`   GEN: "${normGenVal}"`);
        diffCount++;
      }

      if (refForm !== genForm && refForm !== null) {
        console.log(`[DIFF] Cell ${addr} (Row ${r+1} Col ${XLSX.utils.encode_col(c)}) Formula:`);
        console.log(`   REF Formula: "${refForm}"`);
        console.log(`   GEN Formula: "${genForm}"`);
        diffCount++;
      }
    }
  }

  console.log(`\n==================================================`);
  console.log(`TOTAL DIFFERENCES FOUND: ${diffCount}`);
  console.log(`==================================================\n`);
}

const args = process.argv.slice(2);
if (args.length >= 2) {
  compareExcelFiles(args[0], args[1]);
} else {
  console.log("Usage: node compare_sheets.cjs <reference_file.xlsx> <generated_file.xlsx>");
}
