/* ============================================================
   XDD吧 · 活动中心（events.html 专用）
   形态：活动列表（进行中 / 已结束）/ 详情 / 报名 / 参与发帖 / 排行 / 作品列表 / 抽奖 / 我的奖励。
   权限：所有内容需登录；报名、抽奖、参与发帖、查看我的奖励需登录（服务端再次校验）。
   ============================================================ */
(function () {
  'use strict';

  const SUPABASE_URL = 'https://jgezpvmlnhycxslqbwcx.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_B29ClgwZagW32Ow5x6VdKQ_IL65F7dl';
  const EDGE_URL = `${SUPABASE_URL}/functions/v1/newtheba`;
  const USER_TOKEN_KEY = 'nzb_user_token';
  const USER_PROFILE_KEY = 'nzb_user_profile';

  const MODE_LABEL = { lottery: '抽奖', likes: '点赞排行', favorites: '收藏排行', comments: '评论排行' };
  const MODE_ICON = { lottery: '🎁', likes: '👍', favorites: '⭐', comments: '💬' };
  const STATUS_LABEL = {
    draft: '草稿', ongoing: '进行中', ended: '已结束',
    pending_confirm: '待创始人确认', settled: '已结算'
  };
  const SCORE_LABEL = { likes: '赞', favorites: '收藏', comments: '评论' };

  const $ = (id) => document.getElementById(id);

  let me = null;
  let ongoing = [];
  let ended = [];
  const state = { tab: 'ongoing', keyword: '' };

  // ---------------- 工具 ----------------
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function formatTime(iso) {
    if (!iso) return '';
    if (window.ClubTime) { const s = window.ClubTime.str(iso); if (s) return s; }
    const d = new Date(iso); const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }
  function timeRange(a, b) {
    if (!a && !b) return '未设置时间';
    return `${a ? formatTime(a) : '未设开始'} ~ ${b ? formatTime(b) : '未设结束'}`;
  }
  function loggedIn() { return !!(me && me.token); }

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
    if (loggedIn() && me.profile) host.innerHTML = '<a class="btn ghost sm" href="index.html">返回主页</a>';
    else host.innerHTML = '<a href="index.html" class="btn ghost sm">登录 / 注册</a>';
  }

  // ---------------- Edge 调用 ----------------
  async function callEdge(action, payload) {
    const res = await fetch(EDGE_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', apikey: SUPABASE_KEY },
      body: JSON.stringify({ action, token: me ? me.token : '', ...(payload || {}) })
    });
    let data = {};
    try { data = await res.json(); } catch (_e) {}
    if (!res.ok || data.ok === false) {
      const err = new Error(data.error || ('请求失败 ' + res.status));
      err.need_captcha = !!data.need_captcha;
      err.captcha = data.captcha;
      throw err;
    }
    return data.data;
  }

  // ---------------- 列表 ----------------
  function cardHtml(e) {
    const mode = MODE_LABEL[e.mode] || e.mode;
    const icon = MODE_ICON[e.mode] || '🎉';
    const st = e.display_status || e.status;
    const cover = e.cover_url
      ? `<img src="${escapeHtml(e.cover_url)}" alt="" loading="lazy" />`
      : icon;
    const stCls = st === 'ongoing' ? 'ok' : st === 'settled' ? 'accent' : 'off';
    return `<div class="p4-card" data-ev="${e.id}">
      <div class="p4-ev-cover">${cover}</div>
      <div class="p4-card-body">
        <div class="p4-card-title">${escapeHtml(e.title)}</div>
        <div class="p4-card-desc">${escapeHtml((e.intro || '').slice(0, 110))}</div>
        <div class="p4-card-foot">
          <span class="p4-tag accent">${escapeHtml(mode)}</span>
          <span class="p4-tag ${stCls}">${escapeHtml(STATUS_LABEL[st] || st)}</span>
          ${e.require_signup ? '<span class="p4-tag">需报名</span>' : ''}
          ${e.anonymous_allowed ? '<span class="p4-tag">可匿名</span>' : ''}
        </div>
        <div class="p4-card-foot">
          <span class="p4-meta">${escapeHtml(timeRange(e.start_at, e.end_at))}</span>
        </div>
        <div class="p4-card-foot">
          <span class="p4-meta">报名 ${e.signup_count || 0} · 作品 ${e.post_count || 0}</span>
          <button class="btn sm" data-open="${e.id}" style="margin-left:auto">查看详情</button>
        </div>
      </div>
    </div>`;
  }

  function bindCards(box) {
    box.querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => openDetail(b.dataset.open)));
  }

  async function loadEvents() {
    const ob = $('ongoingList'); const eb = $('endedList');
    ob.innerHTML = '<div class="p4-empty" style="grid-column:1/-1">加载中…</div>';
    eb.innerHTML = '<div class="p4-empty" style="grid-column:1/-1">加载中…</div>';
    let res;
    try {
      res = (await callEdge('events_list', { keyword: state.keyword })) || {};
    } catch (e) {
      ob.innerHTML = `<div class="p4-empty" style="grid-column:1/-1">加载失败：${escapeHtml(e.message)}</div>`;
      eb.innerHTML = '';
      return;
    }
    ongoing = res.ongoing || [];
    ended = res.ended || [];
    ob.innerHTML = ongoing.length
      ? ongoing.map(cardHtml).join('')
      : '<div class="p4-empty" style="grid-column:1/-1"><div class="emoji">🎈</div>暂无进行中的活动</div>';
    eb.innerHTML = ended.length
      ? ended.map(cardHtml).join('')
      : '<div class="p4-empty" style="grid-column:1/-1"><div class="emoji">🏁</div>暂无已结束的活动</div>';
    bindCards(ob); bindCards(eb);
  }

  // ---------------- 详情 ----------------
  async function openDetail(id) {
    let d;
    try { d = await callEdge('event_detail', { id }); }
    catch (e) { window.alert(e.message); return; }
    if (!d || !d.event) { window.alert('活动不存在或未发布'); return; }
    const e = d.event;
    const st = e.status === 'ongoing' && e.end_at && new Date(e.end_at).getTime() < Date.now() ? 'ended' : e.status;
    const isOngoing = st === 'ongoing';
    const mode = MODE_LABEL[e.mode] || e.mode;
    const needSignup = !!e.require_signup;
    const signed = !!d.signed_up;
    const myLot = d.my_lottery;

    const mask = document.createElement('div');
    mask.className = 'ev-mask';

    const actionBtns = [];
    if (isOngoing) {
      if (needSignup && !signed) actionBtns.push('<button class="btn sm" data-signup>报名参与</button>');
      if (needSignup && signed) actionBtns.push('<span class="p4-tag ok" style="align-self:center">已报名</span>');
      if (e.mode === 'lottery') {
        if (myLot) actionBtns.push(`<span class="p4-tag accent" style="align-self:center">已抽奖：${escapeHtml((myLot.prize && myLot.prize.name) || '谢谢参与')}</span>`);
        else if (!needSignup || signed) actionBtns.push('<button class="btn sm" data-draw>立即抽奖</button>');
        else actionBtns.push('<span class="p4-tag off" style="align-self:center">报名后可抽奖</span>');
      } else {
        actionBtns.push('<button class="btn sm" data-gopost>参与发帖</button>');
      }
    } else if (st === 'pending_confirm') {
      actionBtns.push('<span class="p4-tag warn" style="align-self:center">结算确认中</span>');
    } else {
      actionBtns.push('<span class="p4-tag off" style="align-self:center">活动已结束</span>');
    }

    mask.innerHTML = `<div class="ev-modal">
      <div class="ev-modal-head"><h3>${escapeHtml(e.title)}</h3><button class="ev-modal-close" data-close>×</button></div>
      ${e.cover_url ? `<div class="p4-ev-cover" style="border-radius:12px;margin-bottom:10px"><img src="${escapeHtml(e.cover_url)}" alt="" /></div>` : ''}
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
        <span class="p4-tag accent">${escapeHtml(mode)}</span>
        <span class="p4-tag ${isOngoing ? 'ok' : 'off'}">${escapeHtml(STATUS_LABEL[st] || st)}</span>
        ${needSignup ? '<span class="p4-tag">需报名</span>' : ''}
        ${e.anonymous_allowed ? '<span class="p4-tag">允许匿名</span>' : ''}
      </div>
      <div class="ev-count">
        <span>🗓 <b>${escapeHtml(timeRange(e.start_at, e.end_at))}</b></span>
        <span>报名 <b>${d.signup_count || 0}</b></span>
        <span>作品 <b>${d.post_count || 0}</b></span>
      </div>
      <div class="p4-sec"><div class="p4-sec-title">📖 活动简介</div><div class="p4-pre">${escapeHtml(e.intro || '暂无简介')}</div></div>
      ${e.rules ? `<div class="p4-sec"><div class="p4-sec-title">📜 活动规则</div><div class="p4-pre">${escapeHtml(e.rules)}</div></div>` : ''}
      ${(e.rule_config_enabled && e.rule_config && Array.isArray(e.rule_config.items) && e.rule_config.items.length)
        ? `<div class="p4-sec"><div class="p4-sec-title">🧭 玩法细则</div><div class="p4-pre">${e.rule_config.items.map((it) => `· ${escapeHtml(it.label || '细则')}${it.value ? '：' + escapeHtml(it.value) : ''}`).join('\n')}</div></div>`
        : ''}
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px">${actionBtns.join('')}</div>
      <div class="ev-subtabs">
        ${e.mode !== 'lottery' ? '<button class="chip" data-view="rank">🏅 参与排行</button>' : ''}
        <button class="chip active" data-view="posts">📝 参与作品</button>
      </div>
      <div id="evSubBody"><div class="p4-empty">加载中…</div></div>
    </div>`;

    mask.addEventListener('click', (ev) => { if (ev.target === mask || ev.target.closest('[data-close]')) mask.remove(); });
    document.body.appendChild(mask);

    const sub = mask.querySelector('#evSubBody');

    async function loadPosts() {
      sub.innerHTML = '<div class="p4-empty">加载中…</div>';
      let rows = [];
      try { rows = (await callEdge('event_posts', { id })) || []; }
      catch (err) { sub.innerHTML = `<div class="p4-empty">加载失败：${escapeHtml(err.message)}</div>`; return; }
      if (!rows.length) { sub.innerHTML = '<div class="p4-empty">还没有参与作品</div>'; return; }
      sub.innerHTML = rows.map((p) => `<div class="ev-work">
        <div class="ev-work-head">
          <b>${escapeHtml(p.anonymous ? '匿名用户' : (p.nickname || '匿名'))}</b>
          <span class="p4-tag">${escapeHtml(p.topic || '')}</span>
          <span class="p4-meta">👍 ${p.like_count || 0} · 💬 ${p.comment_count || 0} · ${formatTime(p.created_at)}</span>
        </div>
        <div class="ev-work-body">${escapeHtml(String(p.content || '').slice(0, 240))}</div>
      </div>`).join('');
    }

    async function loadRank() {
      sub.innerHTML = '<div class="p4-empty">加载中…</div>';
      let r;
      try { r = await callEdge('event_ranking', { id }); }
      catch (err) { sub.innerHTML = `<div class="p4-empty">加载失败：${escapeHtml(err.message)}</div>`; return; }
      const list = (r && r.list) || [];
      if (!list.length) { sub.innerHTML = '<div class="p4-empty">暂无排行数据</div>'; return; }
      const unit = SCORE_LABEL[(r && r.mode) || e.mode] || '分';
      sub.innerHTML = list.map((x) => `<div class="p4-rank-row">
        <span class="p4-rank-no">${x.rank}</span>
        <span style="flex:1;min-width:0">
          <b>${escapeHtml(x.nickname || '匿名')}</b>
          <span class="p4-tag" style="margin-left:6px">${x.score} ${escapeHtml(unit)}</span>
          <div class="p4-meta" style="margin-top:2px">${escapeHtml(x.excerpt || '')}</div>
        </span>
      </div>`).join('');
    }

    mask.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => {
      mask.querySelectorAll('[data-view]').forEach((x) => x.classList.toggle('active', x === b));
      if (b.dataset.view === 'rank') loadRank(); else loadPosts();
    }));

    const signBtn = mask.querySelector('[data-signup]');
    if (signBtn) signBtn.addEventListener('click', async () => {
      if (!loggedIn()) { window.alert('请先登录后再报名'); return; }
      signBtn.disabled = true;
      try {
        await callEdge('event_signup', { id });
        window.alert('✅ 报名成功');
        mask.remove();
        await loadEvents();
        await openDetail(id);
      } catch (err) { window.alert(err.message); signBtn.disabled = false; }
    });

    const drawBtn = mask.querySelector('[data-draw]');
    if (drawBtn) drawBtn.addEventListener('click', async () => {
      if (!loggedIn()) { window.alert('请先登录后再抽奖'); return; }
      if (!window.confirm('确认使用抽奖机会？每人每活动仅限一次。')) return;
      drawBtn.disabled = true;
      try {
        const r = await callEdge('event_lottery_draw', { id });
        const prize = (r && r.prize) || {};
        window.alert(`🎉 抽奖结果：${prize.name || '谢谢参与'}${prize.coins ? `（+${prize.coins} 积分）` : ''}${prize.xp ? `（+${prize.xp} 经验）` : ''}`);
        mask.remove();
        await loadEvents();
        await openDetail(id);
        await loadRewards();
      } catch (err) { window.alert(err.message); drawBtn.disabled = false; }
    });

    const goBtn = mask.querySelector('[data-gopost]');
    if (goBtn) goBtn.addEventListener('click', () => { window.location.href = 'index.html?event=' + encodeURIComponent(id); });

    loadPosts();
  }

  // ---------------- 我的奖励 ----------------
  async function loadRewards() {
    const box = $('rewardList');
    if (!loggedIn()) {
      box.innerHTML = '<div class="p4-empty"><div class="emoji">🔒</div>登录后查看我的活动奖励</div>';
      $('rewardCount').textContent = '—';
      return;
    }
    box.innerHTML = '<div class="p4-empty">加载中…</div>';
    let rows = [];
    try { rows = (await callEdge('my_event_rewards', {})) || []; }
    catch (e) { box.innerHTML = `<div class="p4-empty">加载失败：${escapeHtml(e.message)}</div>`; return; }
    $('rewardCount').textContent = rows.length;
    if (!rows.length) { box.innerHTML = '<div class="p4-empty"><div class="emoji">🏆</div>还没有获奖记录，快去参加活动吧</div>'; return; }
    box.innerHTML = rows.map((r) => `<div class="p4-row">
      <span style="flex:1;min-width:180px">
        <b>${escapeHtml(r.event_title || '活动')}</b>
        <span class="p4-tag accent">第 ${r.rank} 名</span>
        <br /><span class="p4-meta">${r.coins ? `+${r.coins} 积分` : ''}${r.xp ? ` · +${r.xp} 经验` : ''}${r.badge_id ? ' · 含徽章奖励' : ''} · ${formatTime(r.granted_at)}</span>
      </span>
    </div>`).join('');
  }

  // ---------------- 页签 ----------------
  function switchTab(tab) {
    state.tab = tab;
    document.querySelectorAll('.p4-tabs .chip').forEach((c) => c.classList.toggle('active', c.dataset.tab === tab));
    $('paneOngoing').classList.toggle('hidden', tab !== 'ongoing');
    $('paneEnded').classList.toggle('hidden', tab !== 'ended');
    $('paneRewards').classList.toggle('hidden', tab !== 'rewards');
    if (tab === 'rewards') loadRewards();
    else if (tab === 'ended') { /* 已由 loadEvents 渲染 */ }
    else { /* ongoing 已渲染 */ }
  }

  function init() {
    readSession();
    renderBar();
    if (window.XddContentGate && !XddContentGate.allow()) return;
    document.querySelectorAll('.p4-tabs .chip').forEach((c) => c.addEventListener('click', () => switchTab(c.dataset.tab)));
    $('evSearch').addEventListener('click', () => { state.keyword = $('evKw').value.trim(); loadEvents(); });
    $('evKw').addEventListener('keydown', (e) => { if (e.key === 'Enter') { state.keyword = $('evKw').value.trim(); loadEvents(); } });
    $('evRefresh').addEventListener('click', () => { loadEvents(); loadRewards(); });
    loadEvents();
    loadRewards();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
