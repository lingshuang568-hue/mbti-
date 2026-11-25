// ============== MBTI 数据 ==============
const ALL_TYPES = ['ESTJ','ESTP','ESFJ','ESFP','ENTJ','ENTP','ENFJ','ENFP','ISTJ','ISTP','ISFJ','ISFP','INTJ','INTP','INFJ','INFP'];
const RARE_TYPE = 'ISFP';
const RARITY = 1 / 144;

const NORMAL_TYPES = ALL_TYPES.filter(t => t !== RARE_TYPE);

const MBTI_NAMES = {
  ESTJ:'总经理', ESTP:'企业家', ESFJ:'执政官', ESFP:'表演者',
  ENTJ:'指挥官', ENTP:'辩论家', ENFJ:'主人公', ENFP:'竞选者',
  ISTJ:'物流师', ISTP:'鉴赏家', ISFJ:'守卫者', ISFP:'探险家',
  INTJ:'建筑师', INTP:'逻辑学家', INFJ:'提倡者', INFP:'调停者',
};

const MATRIX_LAYOUT = [
  ['ESTJ','ENTJ','ESFJ','ENFJ'],
  ['ESTP','ENTP','ESFP','ENFP'],
  ['ISTJ','INTJ','ISFJ','INFJ'],
  ['ISTP','INTP','ISFP','INFP'],
];

// ============== 概率函数 ==============
function drawCard() {
  const roll = Math.random();
  if (roll < RARITY) {
    return { type: RARE_TYPE, isRare: true };
  }
  const t = NORMAL_TYPES[Math.floor(Math.random() * NORMAL_TYPES.length)];
  return { type: t, isRare: false };
}

// ============== localStorage ==============
const STORAGE_KEY = 'mbti-card-draw-data';
const INITIAL_DRAWS = 3;

function genId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random()*16|0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (d && typeof d.deviceId === 'string') return d;
    }
  } catch(e) {}

  const data = {
    deviceId: genId(),
    drawsRemaining: INITIAL_DRAWS,
    totalDraws: 0,
    totalShares: 0,
    draws: [],
    createdAt: Date.now(),
  };

  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');
  if (ref) data.refFrom = ref;

  saveData(data);
  return data;
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

let state = loadData();

// ============== 时间格式化 ==============
function timeAgo(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return '刚刚';
  if (m < 60) return `${m} 分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  return `${d} 天前`;
}

// ============== Toast ==============
function showToast(msg) {
  let t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2000);
}

// ============== Modal ==============
function showEmptyModal() {
  const overlay = document.getElementById('empty-modal');
  if (!overlay) return;
  overlay.classList.add('show');
}

function hideEmptyModal() {
  const overlay = document.getElementById('empty-modal');
  if (overlay) overlay.classList.remove('show');
}

function showISFPModal() {
  const overlay = document.getElementById('isfp-modal');
  if (overlay) overlay.classList.add('show');
}

function hideISFPModal() {
  const overlay = document.getElementById('isfp-modal');
  if (overlay) overlay.classList.remove('show');
}

function bindModalClicks() {
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('show');
    });
  });
}

// ============== 更新顶部次数显示 ==============
function updateRemainingUI() {
  const el = document.getElementById('remaining-count');
  if (el) el.textContent = state.drawsRemaining;
}

// ============== 抽卡首页逻辑 ==============
let isDrawing = false;

function handleDraw() {
  if (isDrawing || state.drawsRemaining <= 0) return;

  isDrawing = true;
  const btn = document.getElementById('draw-btn');
  const cardInner = document.getElementById('card-inner');
  const revealInfo = document.getElementById('reveal-info');
  const particleLayer = document.getElementById('particle-layer');

  btn.disabled = true;
  btn.innerHTML = '<span class="btn-spinner"></span>翻牌中...';
  revealInfo.classList.remove('show');
  cardInner.classList.remove('flipped');

  setTimeout(() => {
    const result = drawCard();
    const record = {
      id: genId(),
      type: result.type,
      isRare: result.isRare,
      drawnAt: Date.now(),
    };

    state.drawsRemaining -= 1;
    state.totalDraws += 1;
    state.draws.unshift(record);
    saveData(state);
    updateRemainingUI();

    const cardFront = document.getElementById('card-front');
    cardFront.innerHTML = '';
    const img = document.createElement('img');
    img.src = `cards/${result.type}.png`;
    img.alt = result.type;
    cardFront.appendChild(img);

    cardFront.classList.toggle('rare', result.isRare);

    if (result.isRare) {
      const badge = document.createElement('div');
      badge.className = 'rare-badge';
      badge.textContent = '⭐ 稀有';
      cardFront.appendChild(badge);
    }

    cardInner.classList.add('flipped');

    setTimeout(() => {
      const typeLabel = document.getElementById('reveal-type');
      const nameLabel = document.getElementById('reveal-name');
      typeLabel.textContent = result.type;
      typeLabel.classList.toggle('rare', result.isRare);
      nameLabel.textContent = MBTI_NAMES[result.type];
      revealInfo.classList.add('show');

      btn.disabled = false;
      isDrawing = false;

      if (state.drawsRemaining > 0) {
        btn.innerHTML = '🎴 开始抽卡';
      } else {
        btn.innerHTML = '次数已用完';
        showEmptyModal();
      }

      if (result.isRare) {
        triggerISFPEffect(particleLayer);
        setTimeout(showISFPModal, 500);
      }
    }, 800);
  }, 800);
}

function triggerISFPEffect(layer) {
  if (!layer) return;
  layer.innerHTML = '';
  const COUNT = 60;

  for (let i = 0; i < COUNT; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const angle = (Math.PI * 2 * i) / COUNT + Math.random() * 0.3;
    const dist = 150 + Math.random() * 200;
    p.style.setProperty('--tx', `${Math.cos(angle)*dist}px`);
    p.style.setProperty('--ty', `${Math.sin(angle)*dist}px`);
    p.style.width = `${4 + Math.random()*10}px`;
    p.style.height = p.style.width;
    p.style.animationDelay = `${Math.random()*0.3}s`;
    p.style.animationDuration = `${1.5 + Math.random()*1}s`;
    layer.appendChild(p);
  }

  const flash = document.createElement('div');
  flash.className = 'flash-overlay';
  layer.appendChild(flash);

  setTimeout(() => { layer.innerHTML = ''; }, 2500);
}

// ============== 分享 ==============
function handleShare() {
  state.drawsRemaining += 1;
  state.totalShares += 1;
  saveData(state);
  updateRemainingUI();

  const url = `${window.location.origin}${window.location.pathname}?ref=${state.deviceId}`;

  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => {
      showToast('分享成功！获得 1 次抽奖机会 🎉');
    }).catch(() => {
      fallbackCopy(url);
    });
  } else {
    fallbackCopy(url);
  }

  if (document.getElementById('empty-modal')) hideEmptyModal();
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); showToast('分享成功！获得 1 次抽奖机会 🎉'); }
  catch(e) { showToast('已获得抽奖机会'); }
  document.body.removeChild(ta);
}

// ============== 邀请提示 ==============
function showInviteBanner() {
  const banner = document.getElementById('invite-banner');
  if (!banner || !state.refFrom) return;
  banner.classList.add('show');
  setTimeout(() => banner.classList.remove('show'), 4000);
}

// ============== 初始化首页 ==============
function initHome() {
  updateRemainingUI();
  bindModalClicks();
  showInviteBanner();

  const btn = document.getElementById('draw-btn');
  if (btn) btn.addEventListener('click', handleDraw);

  document.querySelectorAll('[data-share]').forEach(el => {
    el.addEventListener('click', handleShare);
  });

  const emptyHint = document.getElementById('empty-hint');
  if (emptyHint) {
    emptyHint.addEventListener('click', showEmptyModal);
  }

  if (state.drawsRemaining <= 0) {
    if (btn) {
      btn.disabled = true;
      btn.textContent = '次数已用完';
    }
  }
}

// ============== 我的卡牌页 ==============
function buildCollectedMap() {
  const map = {};
  for (const d of state.draws) {
    if (!map[d.type]) {
      map[d.type] = { count: 0, lastDrawnAt: d.drawnAt, isRare: d.isRare };
    }
    map[d.type].count += 1;
    if (d.drawnAt > map[d.type].lastDrawnAt) map[d.type].lastDrawnAt = d.drawnAt;
  }
  return map;
}

function renderMatrix() {
  const collected = buildCollectedMap();
  const container = document.getElementById('mbt-matrix');
  if (!container) return;

  const totalCollected = Object.keys(collected).length;
  const pct = Math.round((totalCollected / 16) * 100);

  document.getElementById('collected-count').textContent = totalCollected;
  document.getElementById('progress-pct').textContent = `${pct}%`;
  const bar = document.getElementById('progress-bar-fill');
  if (bar) bar.style.width = `${(totalCollected/16)*100}%`;

  container.innerHTML = '';
  for (const row of MATRIX_LAYOUT) {
    for (const type of row) {
      const isCollected = !!collected[type];
      const isRare = type === RARE_TYPE;
      const cell = document.createElement('div');
      cell.className = 'matrix-cell';
      if (isCollected) cell.classList.add('collected');
      if (isCollected && isRare) cell.classList.add('rare');
      if (!isCollected) cell.classList.add('locked');

      if (isCollected) {
        const img = document.createElement('img');
        img.src = `cards/${type}.png`;
        img.alt = type;
        cell.appendChild(img);

        const label = document.createElement('div');
        label.className = 'matrix-cell-label';
        label.textContent = type;
        cell.appendChild(label);

        if (isRare) {
          const star = document.createElement('div');
          star.className = 'star';
          star.textContent = '⭐';
          cell.appendChild(star);
        }

        cell.title = `${type} · 抽到 ${collected[type].count} 次 · ${timeAgo(collected[type].lastDrawnAt)}`;
      } else {
        const q = document.createElement('div');
        q.className = 'q';
        q.textContent = '?';
        cell.appendChild(q);
        const t = document.createElement('div');
        t.className = 't';
        t.textContent = type;
        cell.appendChild(t);
        if (isRare) {
          const rt = document.createElement('div');
          rt.className = 'rare-tag';
          rt.textContent = '稀有';
          cell.appendChild(rt);
        }
      }
      container.appendChild(cell);
    }
  }
}

function renderHistory() {
  const container = document.getElementById('history-list');
  const empty = document.getElementById('history-empty');
  const toggle = document.getElementById('history-toggle');

  if (!container || !empty) return;

  const draws = state.draws;
  document.getElementById('history-count').textContent = draws.length;

  if (draws.length === 0) {
    container.style.display = 'none';
    empty.style.display = 'block';
    return;
  }

  container.style.display = 'block';
  empty.style.display = 'none';

  container.innerHTML = '';
  const visible = draws.slice(0, 50);
  for (const d of visible) {
    const item = document.createElement('div');
    item.className = 'history-item';
    if (d.isRare) item.classList.add('rare');

    const thumb = document.createElement('div');
    thumb.className = 'history-thumb';
    const img = document.createElement('img');
    img.src = `cards/${d.type}.png`;
    img.alt = d.type;
    thumb.appendChild(img);
    item.appendChild(thumb);

    const info = document.createElement('div');
    info.className = 'history-info';
    const htype = document.createElement('div');
    htype.className = 'history-type';
    htype.textContent = d.type;
    if (d.isRare) {
      const star = document.createElement('span');
      star.textContent = '⭐';
      htype.appendChild(star);
    }
    info.appendChild(htype);
    const hname = document.createElement('div');
    hname.className = 'history-name';
    hname.textContent = MBTI_NAMES[d.type];
    info.appendChild(hname);
    item.appendChild(info);

    const time = document.createElement('div');
    time.className = 'history-time';
    time.textContent = timeAgo(d.drawnAt);
    item.appendChild(time);

    container.appendChild(item);
  }

  if (toggle) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('open');
      container.classList.toggle('open');
    });
  }
}

function initCards() {
  updateRemainingUI();
  document.getElementById('total-draws').textContent = state.totalDraws;
  document.getElementById('total-shares').textContent = state.totalShares;

  renderMatrix();
  renderHistory();
}

// ============== 入口 ==============
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  if (path.endsWith('cards.html') || path.endsWith('/cards')) {
    initCards();
  } else {
    initHome();
  }
});
