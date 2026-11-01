function generateExportName(tableName) {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `扫码记录_${yyyy}${mm}${dd}_${tableName}`;
}

function recordsToCSV(records, batchName) {
  const BOM = '\uFEFF';
  const header = '序号,扫描时间,扫描内容,码类型,所属表格\n';
  const rows = records.map(r => {
    const safeContent = '"' + (r.content || '').replace(/"/g, '""') + '"';
    const safeTime = '"' + (r.time || '') + '"';
    const safeBatch = '"' + (batchName || '') + '"';
    return `${r.idx},${safeTime},${safeContent},${r.type || ''},${safeBatch}`;
  }).join('\n');
  return BOM + header + rows;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportSingle(batchIdx) {
  const b = batches[batchIdx];
  if (!b || b.records.length === 0) { alert('该表没有数据'); return; }
  const csv = recordsToCSV(b.records, b.name);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, generateExportName(b.name) + '.csv');
}

function exportCurrent() {
  const idx = batches.findIndex(b => !b.sealed);
  if (idx === -1) { alert('没有当前表'); return; }
  exportSingle(idx);
}

function exportAll() {
  const allRecords = batches.flatMap(b => b.records.map(r => ({ ...r })));
  if (allRecords.length === 0) { alert('没有数据'); return; }
  // 多表合一：每个表一个 sheet 区域，用分隔行区分
  let csv = '\uFEFF';
  batches.forEach(b => {
    csv += `=== ${b.name} ===\n`;
    csv += '序号,扫描时间,扫描内容,码类型\n';
    b.records.forEach(r => {
      const safeContent = '"' + (r.content || '').replace(/"/g, '""') + '"';
      csv += `${r.idx},"${r.time || ''}",${safeContent},${r.type || ''}\n`;
    });
    csv += '\n';
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, generateExportName('全部表格') + '.csv');
}

// 返回 blob 供分享用
function exportAllBlob() {
  return new Promise((resolve) => {
    const allRecords = batches.flatMap(b => b.records.map(r => ({ ...r })));
    let csv = '\uFEFF';
    batches.forEach(b => {
      csv += `=== ${b.name} ===\n`;
      csv += '序号,扫描时间,扫描内容,码类型\n';
      b.records.forEach(r => {
        const safeContent = '"' + (r.content || '').replace(/"/g, '""') + '"';
        csv += `${r.idx},"${r.time || ''}",${safeContent},${r.type || ''}\n`;
      });
      csv += '\n';
    });
    resolve(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  });
}
