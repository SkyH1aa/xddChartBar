/* ============================================================
   XDD吧 · 徽章墙（badges.html 专用）
   形态：展示全部在架徽章 + 我的达成进度 + 佩戴/卸下 + 隐藏/恢复展示。
   权限：浏览无需登录；佩戴、隐藏需登录（服务端再次校验）。
   ============================================================ */
(function () {
  'use strict';

  const SUPABASE_URL = 'https://jgezpvmlnhycxslqbwcx.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_B29ClgwZagW32Ow5x6VdKQ_IL65F7dl';
  const EDGE_URL = `${SUPABASE_URL}/functions/v1/newtheba`;
  const USER_TOKEN_KEY = 'nzb_user_token';
  const USER_PROFILE_KEY = 'nzb_user_profile';

  const RULE_LABEL = {
    post: '发帖', comment: '发表评论', like_received: '获得点赞', digest: '帖子加精',
    legend: '成为风云学长', best_answer: '被采纳最佳答案', checkin_streak: '连续签到', event_win: '活动获奖'
  };
  const STATUS_TEXT = { none: '未获得', active: '已获得', expired: '已过期', revoked: '已收回' };
  const SCOPE_LABEL = { none: '都不展示', profile: '仅主页', post: '仅帖子头部', both: '主页+帖子' };
  const SCOPE_ORDER = ['profile', 'post', 'both', 'none'];

  const $ = (id) => document.getElementById(id);
  let me = null;
  let all = [];
  let summary = { total: 0, obtained: 0 };

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function loggedIn() { return !!(me && me.token); }
  function needLogin() {
    if (loggedIn()) return false;
    alert('请先返回首页登录后再佩戴徽章');
    return true;
  }

  // ---------------- 会话与顶栏 ----------------
  function readSession() {
    try {
      const tk = localStorage.getItem(USER_TOKEN_KEY);
      const pf = JSON.parse(localStorage.getItem(USER_PROFILE_KEY) || 'null');
      me = tk ? { token: tk, profile: pf } : null;
    } catch (_e) { me = null; }
  }
  function renderBar() {
    const host = $('userBar');
    if (!host) return;
    host.innerHTML = loggedIn()
      ? '<a class="btn ghost sm" href="index.html">返回主页</a>'
      : '<a href="index.html" class="btn ghost sm">登录 / 注册</a>';
  }

  async function callEdge(action, payload) {
    const res = await fetch(EDGE_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', apikey: SUPABASE_KEY },
      body: JSON.stringify({ action, token: me ? me.token : '', ...(payload || {}) })
    });
    let data = {};
    try { data = await res.json(); } catch (_e) {}
    if (!res.ok || data.ok === false) throw new Error(data.error || ('请求失败 ' + res.status));
    return data.data;
  }

  // ---------------- 徽章渲染（内置特效，不使用图片） ----------------
  const F = () => (window.XddFx || null);
  function badgeIco(effect, name, iconUrl) {
    const fx = F();
    if (fx && effect) {
      try { const c = fx.normalize('badge', effect); c.name = name || ''; return fx.badgeHtml(c, 'lg'); }
      catch (_e) { /* 降级到图片/emoji */ }
    }
    if (iconUrl) return `<img src="${escapeHtml(iconUrl)}" alt="" style="max-width:56px;max-height:56px" />`;
    return '<i>🏅</i>';
  }

  // ---------------- 渲染 ----------------
  function passes(b) {
    const f = $('bdgFilter').value;
    if (f === 'obtained' && !b.obtained) return false;
    if (f === 'locked' && b.obtained) return false;
    if (f === 'auto' && b.source !== 'auto') return false;
    if (f === 'manual' && b.source !== 'manual') return false;
    return true;
  }
  function render() {
    const box = $('bdgList');
    const kw = $('bdgKw').value.trim();
    const list = all.filter((b) => passes(b) && (!kw || String(b.name || '').includes(kw)));
    $('bdgObtained').textContent = `${summary.obtained} / ${summary.total}`;
    $('bdgSummary').textContent = loggedIn() ? '已获得 / 全部' : '登录后查看我的进度';
    $('bdgTip').textContent = loggedIn() ? '' : '当前未登录，仅展示全部徽章与达成条件。';
    if (!list.length) { box.innerHTML = '<div class="p4-empty" style="grid-column:1/-1">没有符合条件的徽章</div>'; return; }
    box.innerHTML = list.map((b) => {
      const isAuto = b.source === 'auto' && b.rule_type;
      const cond = isAuto
        ? `${RULE_LABEL[b.rule_type] || b.rule_type} ${b.need} 次`
        : (b.obtain_hint || '由管理员手动授予');
      const pct = isAuto && b.need ? Math.min(100, Math.round((b.current / b.need) * 100)) : 0;
      const bar = (isAuto && loggedIn())
        ? `<div class="bdg-bar"><i style="width:${pct}%"></i></div>
           <div class="bdg-bar-txt">进度 ${Math.min(b.current, b.need)} / ${b.need}${b.obtained ? '（已达成）' : ''}</div>`
        : '';
      const scope = b.show_scope || (b.hidden ? 'none' : (b.worn ? 'both' : 'profile'));
      const state = b.obtained
        ? (b.worn ? '帖子头部展示中' : (scope === 'none' ? '已获得，未展示' : '已获得'))
        : (STATUS_TEXT[b.status] || '未获得');
      const sel = (b.obtained && b.record_id)
        ? `<select class="input bdg-scope" data-scope="${escapeHtml(b.record_id)}" title="选择这枚徽章的展示位置">
             ${SCOPE_ORDER.map((k) => `<option value="${k}"${scope === k ? ' selected' : ''}>${SCOPE_LABEL[k]}</option>`).join('')}
           </select>`
        : '';
      return `<div class="bdg-card${b.obtained ? '' : ' locked'}">
        <div class="bdg-ico">${badgeIco(b.effect, b.name, b.icon_url)}</div>
        <div class="bdg-name">${escapeHtml(b.name)}
          <span class="bdg-src">${b.source === 'auto' ? '自动授予' : '手动授予'}</span>
        </div>
        <div class="bdg-desc">${escapeHtml(b.description || '')}</div>
        <div class="bdg-hint">达成条件：${escapeHtml(cond)}</div>
        ${bar}
        <div class="bdg-foot">
          <span class="bdg-state">${escapeHtml(state)}</span>
          ${sel}
        </div>
      </div>`;
    }).join('');
    box.querySelectorAll('[data-scope]').forEach((sel) => sel.addEventListener('change', async () => {
      if (needLogin()) { await load(); return; }
      sel.disabled = true;
      try { await callEdge('badge_set_scope', { id: sel.dataset.scope, scope: sel.value }); await load(); }
      catch (e) { alert(e.message); sel.disabled = false; await load(); }
    }));
  }

  async function load() {
    const box = $('bdgList');
    box.innerHTML = '<div class="p4-empty" style="grid-column:1/-1">加载中…</div>';
    try {
      const r = (await callEdge('badge_catalog', {})) || {};
      all = Array.isArray(r.badges) ? r.badges : [];
      summary = { total: Number(r.total) || all.length, obtained: Number(r.obtained) || 0 };
    } catch (e) {
      box.innerHTML = `<div class="p4-empty" style="grid-column:1/-1">加载失败：${escapeHtml(e.message)}</div>`;
      return;
    }
    render();
  }

  // ---------------- 启动 ----------------
  readSession();
  renderBar();
  $('bdgFilter').addEventListener('change', render);
  $('bdgKw').addEventListener('input', render);
  $('bdgRefresh').addEventListener('click', () => load().catch((e) => alert(e.message)));
  load().catch((e) => alert(e.message));
})();
