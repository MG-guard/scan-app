const BATCH_SIZE = 5000;
const STORAGE_KEY = 'scan_records_v4';
const TODAY_KEY = 'scan_today_v4';
const TODAY_DATE_KEY = 'scan_today_date_v4';

let batches = [];
let todayCount = 0;

function loadData() {
  batches = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  todayCount = parseInt(localStorage.getItem(TODAY_KEY) || '0');
  const savedDate = localStorage.getItem(TODAY_DATE_KEY) || '';
  const nowDate = new Date().toLocaleDateString();
  if (savedDate !== nowDate) {
    todayCount = 0;
    localStorage.setItem(TODAY_DATE_KEY, nowDate);
    localStorage.setItem(TODAY_KEY, '0');
  }
  if (batches.length === 0) {
    batches.push({ id: 1, name: '表格1', records: [], sealed: false, sealedAt: null, createdAt: Date.now() });
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(batches));
  localStorage.setItem(TODAY_KEY, todayCount.toString());
}

function updateStats() {
  let currentBatch = batches.find(b => !b.sealed);
  if (!currentBatch) currentBatch = batches[batches.length - 1];
  const currentIdx = batches.indexOf(currentBatch) + 1;
  const currentCount = currentBatch ? currentBatch.records.length : 0;
  const totalCount = batches.reduce((s, b) => s + b.records.length, 0);
  const left = BATCH_SIZE - currentCount;

  document.getElementById('statTotal').textContent = `累计: ${totalCount}条`;
  document.getElementById('statToday').textContent = `今日: ${todayCount}条`;
  document.getElementById('statCurrent').textContent = `当前表: 第${currentIdx}表`;
  document.getElementById('statLeft').textContent = `距满表: ${left}条`;
  const pct = Math.min((currentCount / BATCH_SIZE) * 100, 100);
  document.getElementById('progressFill').style.width = pct + '%';
}

function addRecord(content, type) {
  let currentBatch = batches.find(b => !b.sealed);
  if (!currentBatch) {
    currentBatch = { id: batches.length + 1, name: `表格${batches.length + 1}`, records: [], sealed: false, sealedAt: null, createdAt: Date.now() };
    batches.push(currentBatch);
  }

  const globalIdx = batches.reduce((s, b) => s + b.records.length, 0) + 1;
  currentBatch.records.push({
    idx: globalIdx,
    content: content,
    type: type,
    time: new Date().toLocaleString('zh-CN'),
    timestamp: Date.now()
  });

  todayCount++;
  if (currentBatch.records.length >= BATCH_SIZE) {
    currentBatch.sealed = true;
    currentBatch.sealedAt = new Date().toLocaleString('zh-CN');
    setTimeout(() => alert(`🎉 第${currentBatch.id}表已满 ${BATCH_SIZE} 条，已自动生成「表格${currentBatch.id + 1}」`), 100);
  }

  saveData();
  updateStats();
  renderBatches();
}

function renderBatches() {
  const area = document.getElementById('recordsArea');
  area.innerHTML = batches.map((b, i) => {
    const isExpanded = window._expanded && window._expanded[i];
    const recent = b.records.slice(-10).reverse();
    return `<div class="batch-card">
      <div class="batch-header ${!b.sealed ? 'active-batch' : 'sealed-batch'}" onclick="toggleBatch(${i})">
        <div>
          <div class="batch-title">${b.sealed ? '🔒' : '●'} ${b.name}（${b.records.length}条）</div>
          <div class="batch-info">${b.sealed ? '已封存 ' + b.sealedAt : '当前正在写入'}</div>
        </div>
        <div class="batch-actions">
          <button class="btn-export" onclick="event.stopPropagation();exportSingle(${i})">导出</button>
        </div>
      </div>
      <div class="record-list ${isExpanded ? 'expanded' : ''}" id="list-${i}">
        ${recent.map(r => `<div class="record-item">
          <span class="idx">#${r.idx}</span>
          <span class="content">${escapeHtml(r.content)}</span>
          <span class="time">${r.time}</span>
          <button class="del" onclick="delRecord(${i},${r.idx})">×</button>
        </div>`).join('')}
        ${b.records.length > 10 ? '<div style="padding:6px 14px;color:#999;font-size:11px">...仅显示最近10条</div>' : ''}
      </div>
    </div>`;
  }).join('');
}

window._expanded = {};
function toggleBatch(i) { window._expanded[i] = !window._expanded[i]; renderBatches(); }

function delRecord(batchIdx, recordIdx) {
  batches[batchIdx].records = batches[batchIdx].records.filter(r => r.idx !== recordIdx);
  saveData(); updateStats(); renderBatches();
}

function clearAll() {
  if (confirm('确定清空所有数据？不可恢复！')) {
    batches = [{ id: 1, name: '表格1', records: [], sealed: false, sealedAt: null, createdAt: Date.now() }];
    todayCount = 0;
    saveData(); updateStats(); renderBatches();
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 初始化
loadData();
updateStats();
renderBatches();
