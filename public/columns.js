/* ============================================================
   XDD吧 · 校友专栏模块（columns.html 专用）
   形态：每个专栏即一个独立小论坛（发帖/评论楼层回复/点赞/顶置/删改/禁言/公告）
   权限：管理员(可全局管理审批) / 创始人(管理自己专栏) / 作者(编辑删除自帖)
   经验：专栏发帖/评论/获赞计入主论坛总经验
   ============================================================ */
(function () {
  'use strict';

  const SUPABASE_URL = 'https://jgezpvmlnhycxslqbwcx.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_B29ClgwZagW32Ow5x6VdKQ_IL65F7dl';
  const EDGE_URL = `${SUPABASE_URL}/functions/v1/newtheba`;
  const USER_TOKEN_KEY = 'nzb_user_token';
  const USER_PROFILE_KEY = 'nzb_user_profile';
  const PAGE_SIZE = 20;

  const $ = (id) => document.getElementById(id);
  const viewEl = $('view');

  let me = null; // 登录用户（token + profile）
  let colState = { page: 1, total: 0, posts: [] };
  let activeCol = null;    // 当前专栏详情
  let activeColRole = { founder: false, admin: false, muted: false };
  let openComments = {};   // post_id -> {list, loaded}

  // ---------------- 工具 ----------------
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function formatTime(iso) {
    if (!iso) return '';
    const d = new Date(iso); const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  }
  function formatShort(iso) {
    if (!iso) return '';
    const d = new Date(iso); const p = (n) => String(n).padStart(2, '0');
    return `${d.getMonth() + 1}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }
  function formatCount(n) { n = Number(n) || 0; return n > 9999 ? '9999+' : String(n); }
  const SAFE_WORDS = ['牛奶', '奶茶', '奶酪', '奶牛', '酸奶', '奶粉', '奶昔', '奶嘴', '奶奶', '奶油', '蜜奶'] // 误伤豁免词，可按需增删
  function sensitiveHits(text) {
    if (!text) return [];
    const words = window.NEWTHEBA_SENSITIVE_WORDS || [];
    const found = []; const lower = String(text).toLowerCase();
    for (const w of words) {
      const s = String(w || '').trim();
      if (!s) continue;
      const sl = s.toLowerCase();
      if (!lower.includes(sl)) continue;
      // 命中词被某个“更长”的豁免词完整包裹则不算违规（如单字“奶”被“牛奶”豁免）
      if (SAFE_WORDS.some((sw) => sw.length > s.length && sw.includes(s) && lower.includes(sw.toLowerCase()))) continue;
      if (found.indexOf(s) === -1) found.push(s);
    }
    return found;
  }
  const LEVEL_TIERS = [
    { max: 10, name: '初来乍到' }, { max: 20, name: '校园萌新' }, { max: 35, name: '校园百事通' },
    { max: 45, name: '风云学长' }, { max: 54, name: '校园传说' }, { max: 60, name: '校史留名' }
  ];
  function levelName(lv) { for (const t of LEVEL_TIERS) if (lv <= t.max) return t.name; return '校史留名'; }
  const PRIV_TIER_RULE = [
    { max: 10, priv: {} }, { max: 20, priv: {} }, { max: 35, priv: { topic96: true } },
    { max: 45, priv: { sched: true, lightfx: true, lvlgate: true, pinComment: 2 } },
    { max: 54, priv: { sched: true, lightfx: true, lvlgate: true, pinComment: 2, recommend: 3 } },
    { max: 60, priv: { sched: true, lightfx: true, lvlgate: true, pinComment: 2, recommend: 3, elite: true } }
  ];
  function privOf(lv) { for (const t of PRIV_TIER_RULE) if (lv <= t.max) return t.priv; return PRIV_TIER_RULE[5].priv; }
  function levelBadgeHtml(lv) {
    if (!lv) return '';
    return `<span class="author-level" title="Lv.${lv} · ${escapeHtml(levelName(lv))}">${escapeHtml(levelName(lv))}</span>`;
  }
  function userDisplay(u) { return u && u.nickname ? u.nickname : (u && u.username ? u.username : '匿名'); }

  function readSession() {
    try {
      const tk = localStorage.getItem(USER_TOKEN_KEY);
      const pf = JSON.parse(localStorage.getItem(USER_PROFILE_KEY) || 'null');
      me = tk ? { token: tk, profile: pf } : null;
    } catch (_e) { me = null; }
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

  // ---------------- 全局刷新轮询 ----------------
  // 管理员在后台点击“强制刷新所有其他端”时，服务端 client_epoch +1；
  // 各端定时探测序号变化，发现变更则整页刷新以清空缓存。
  function startClientEpochPoll() {
    const KEY = 'client_epoch_seen';
    let lastSeen = 0;
    try { lastSeen = Number(localStorage.getItem(KEY)) || 0; } catch (_e) {}
    async function tick() {
      let epoch = lastSeen;
      try { const d = await callEdge('client_epoch', {}); epoch = Number(d && d.epoch) || 0; }
      catch (_e) { return; }
      if (epoch <= 0) return;
      if (lastSeen !== 0 && epoch !== lastSeen) {
        try { localStorage.setItem(KEY, String(epoch)); } catch (_e) {}
        location.reload();
        return;
      }
      if (lastSeen === 0) { lastSeen = epoch; try { localStorage.setItem(KEY, String(epoch)); } catch (_e) {} }
    }
    setInterval(tick, 30000);
  }

  // ---------------- 顶栏 ----------------
  function renderBar() {
    const host = $('userBar');
    if (!host) return;
    if (me && me.profile) {
      host.innerHTML = `<span class="u-chip" title="点击进入我的专栏">
        <span class="avatar">${escapeHtml(String(userDisplay(me.profile)).slice(0, 1))}</span>
        <span class="u-name">${escapeHtml(userDisplay(me.profile))}</span>
        <span class="author-level">Lv.${myLevel()}</span>
      </span>
      <button class="btn ghost sm" id="myColBtn">我的专栏</button>`;
      const mc = $('myColBtn');
      if (mc) mc.addEventListener('click', openMyColumns);
    } else {
      host.innerHTML = `<a href="index.html" class="btn ghost sm">登录 / 注册</a>`;
    }
  }
  function myLevel() {
    if (!me || !me.profile) return 1;
    const f = Number(me.profile.level) || 0;
    if (f > 0) return Math.min(60, f);
    const u = me.profile;
    const xp = (Number(u && u.post_count) || 0) * 2 + (Number(u && u.comment_count) || 0) + (Number(u && u.like_received) || 0)
      + (Number(u && u.col_post_count) || 0) * 2 + (Number(u && u.col_comment_count) || 0) + (Number(u && u.col_like_received) || 0)
      + (Number(u && u.bonus_xp) || 0) + (Number(u && u.checkin_xp) || 0);
    if (xp <= 0) return 1;
    return Math.min(60, Math.floor((1 + Math.sqrt(1 + xp / 3)) / 2));
  }

  function logout() {
    localStorage.removeItem(USER_TOKEN_KEY);
    localStorage.removeItem(USER_PROFILE_KEY);
    me = null;
    renderBar();
    boot();
  }

  // ---------------- 视图切换 ----------------
  function parseHash() {
    const h = location.hash || '#/';
    if (h.indexOf('#/col/') === 0) return { view: 'col', id: h.slice('#/col/'.length) };
    return { view: 'list' };
  }
  function boot() {
    readSession();
    renderBar();
    startClientEpochPoll();
    const r = parseHash();
    if (r.view === 'col' && r.id) loadColumn(r.id);
    else renderList();
  }

  // ================= 列表视图 =================
  async function renderList() {
    activeCol = null;
    colState = { page: 1, total: 0, posts: [] };
    openComments = {};
    viewEl.innerHTML = `
      <div class="col-hero">
        <div>
          <div class="col-hero-title">🎓 校友专栏</div>
          <div class="col-hero-sub">每个专栏是一方独立的校友小社区，由「校史留名」校友运营，独立发帖、评论、置顶。</div>
        </div>
        <div class="col-hero-acts">
          <button class="btn" id="applyColBtn">+ 申请开通专栏</button>
        </div>
      </div>
      <div class="col-legend">
        <span>📖 专栏内容与经验计入主论坛总经验</span>
        <button class="btn ghost sm" id="openMyFromList">我的专栏</button>
      </div>
      <div class="col-search"><input id="colKeyword" class="input" placeholder="搜索专栏名称 / 简介…" /><button class="btn ghost sm" id="colSearchBtn">搜索</button></div>
      <div id="colList" class="col-grid"></div>
      <div id="colEmpty" class="empty hidden"><div class="emoji">🏛️</div>还没有已开通的专栏</div>`;

    $('applyColBtn').addEventListener('click', async (e) => { e.preventDefault(); await openApply(); });
    $('openMyFromList').addEventListener('click', openMyColumns);
    const kw = $('colKeyword');
    const go = async () => { kw.value = kw.value.trim(); await loadColList(); };
    $('colSearchBtn').addEventListener('click', go);
    kw.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
    await loadColList();
  }

  async function loadColList() {
    const box = $('colList'); const empty = $('colEmpty');
    box.innerHTML = '<div class="empty" style="grid-column:1/-1">加载中…</div>';
    try {
      const list = await callEdge('column_list', { keyword: $('colKeyword').value });
      if (!list.length) { box.innerHTML = ''; empty.classList.remove('hidden'); return; }
      empty.classList.add('hidden');
      box.innerHTML = list.map((c) => `
        <div class="col-card fade-in-up" data-id="${escapeHtml(c.id)}">
          <div class="col-card-head">
            <span class="col-card-name">${escapeHtml(c.name)}</span>
            <span class="badge topic">${formatCount(c.post_count)} 帖</span>
          </div>
          <div class="col-card-intro">${escapeHtml(c.intro || '暂无简介')}</div>
          <div class="col-card-foot">
            <span>创始人 <b>${escapeHtml(c.founder_name || '匿名')}</b> ${levelBadgeHtml(c.founder_level)}</span>
            <span>${formatShort(c.created_at)}</span>
          </div>
          <button class="btn sm col-card-enter">进入 »</button>
        </div>`).join('');
      box.querySelectorAll('.col-card').forEach((el) => {
        el.addEventListener('click', () => { location.hash = '#/col/' + encodeURIComponent(el.dataset.id); });
        el.querySelector('.col-card-enter').addEventListener('click', (e) => { e.stopPropagation(); location.hash = '#/col/' + encodeURIComponent(el.dataset.id); });
      });
    } catch (e) { box.innerHTML = `<div class="empty" style="grid-column:1/-1">加载失败：${escapeHtml(e.message)}</div>`; }
  }

  // ================= 专栏内视图 =================
  async function loadColumn(id) {
    viewEl.innerHTML = '<div class="empty" style="padding:60px">加载中…</div>';
    openComments = {};
    colState = { page: 1, total: 0, posts: [] };
    try {
      const r = await callEdge('column_get', { column_id: id });
      activeCol = r.column;
      activeColRole = { founder: r.is_founder, admin: r.is_admin, muted: r.muted };
      if (activeCol.status !== 'open' && !activeColRole.founder && !activeColRole.admin) {
        viewEl.innerHTML = `<div class="empty"><div class="emoji">🔒</div>该专栏未公开访问<br><a href="#/" class="btn ghost sm" style="margin-top:12px">返回专栏列表</a></div>`;
        return;
      }
      renderColShell();
      await loadColFeed();
    } catch (e) {
      viewEl.innerHTML = `<div class="empty">加载失败：${escapeHtml(e.message)}<br><a href="#/" class="btn ghost sm" style="margin-top:12px">返回专栏列表</a></div>`;
    }
  }

  function colIsOpen() { return activeCol && activeCol.status === 'open'; }
  function canManageCol() { return activeColRole.founder || activeColRole.admin; }

  function renderColShell() {
    const col = activeCol;
    const statusTag = col.status === 'open'
      ? '<span class="badge" style="color:#fff;background:#3fae6b">已开通</span>'
      : col.status === 'pending'
        ? '<span class="badge" style="color:#fff;background:#e0a030">待审核</span>'
        : '<span class="badge" style="color:#fff;background:#888">已关闭</span>';
    const acts = [];
    acts.push(`<a href="#/" class="btn ghost sm">← 返回列表</a>`);
    if (canManageCol()) {
      acts.push(`<button class="btn ghost sm" id="editColBtn">⚙ 管理专栏</button>`);
      acts.push(`<button class="btn ghost sm" id="muteColBtn">🔇 禁言管理</button>`);
    }
    viewEl.innerHTML = `
      <div class="col-detail">
        <div class="col-detail-top">
          <div class="col-detail-title">${escapeHtml(col.name)} ${statusTag}</div>
          <div class="col-detail-acts">${acts.join('')}</div>
        </div>
        ${col.notice ? `<div class="col-notice">📢 ${escapeHtml(col.notice)}</div>` : ''}
        ${col.intro ? `<div class="col-detail-intro">${escapeHtml(col.intro)}</div>` : ''}
        <div class="col-detail-meta">
          <span>创始人 <b>${escapeHtml(col.founder_name || '匿名')}</b></span>
          <span>${formatCount(col.post_count)} 帖 · ${formatCount(col.comment_count)} 评论</span>
          <span>成立于 ${formatShort(col.created_at)}</span>
        </div>
      </div>
      ${colIsOpen() ? `
      <div id="colComposer" class="panel composer col-composer">
        <textarea id="colContent" maxlength="2000" placeholder="${activeColRole.muted ? '你已被本专栏禁言' : '分享到本专栏…'}"></textarea>
        <div class="composer-row">
          <span class="char-count" id="colChar">0 / 2000</span>
          <button class="btn" id="colPublish" ${activeColRole.muted ? 'disabled' : ''}>发布</button>
        </div>
        <div class="hint-line" id="colComposeHint"></div>
      </div>` : ''}
      <section class="panel" style="margin-top:16px">
        <div class="sortbar"><div class="c-title">📌 专栏动态 [<span id="colCount">0</span> 帖]</div></div>
        <div class="feed" id="colFeed"></div>
        <div id="colEmptyFeed" class="empty hidden" style="padding:26px"><div class="emoji">🍃</div>还没有内容，来发第一条吧</div>
        <div class="pager hidden" id="colPager">
          <button class="btn ghost sm" id="colPrev">上一页</button>
          <span class="page-num" id="colPageNum">第 1 页</span>
          <button class="btn ghost sm" id="colNext">下一页</button>
        </div>
      </section>`;

    if (canManageCol()) {
      const eb = $('editColBtn'); if (eb) eb.addEventListener('click', (e) => { e.preventDefault(); openEditColumn(); });
      const mb = $('muteColBtn'); if (mb) mb.addEventListener('click', (e) => { e.preventDefault(); openMutePanel(); });
    }
    if (colIsOpen()) wireComposer();
    $('colPrev').addEventListener('click', () => { if (colState.page > 1) { colState.page--; loadColFeed(); } });
    $('colNext').addEventListener('click', () => { if (colState.page < Math.ceil(colState.total / PAGE_SIZE) || (colState.total > PAGE_SIZE * (colState.page - 1) && colState.posts.length === PAGE_SIZE)) { colState.page++; loadColFeed(); } });
  }

  function wireComposer() {
    const ta = $('colContent'); if (!ta) return;
    ta.addEventListener('input', () => {
      const n = ta.value.length;
      const cc = $('colChar'); if (cc) { cc.textContent = `${n} / 2000`; cc.classList.toggle('warn', n >= 1900); }
      $('colComposeHint').textContent = '';
    });
    $('colPublish').addEventListener('click', publishColPost);
    ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) publishColPost(); });
  }

  async function publishColPost() {
    if (!requireLogin()) return;
    const ta = $('colContent');
    const content = (ta.value || '').trim();
    if (!content) { $('colComposeHint').textContent = '内容不能为空'; return; }
    if (content.length > 2000) { $('colComposeHint').textContent = '内容超出 2000 字上限'; return; }
    const hits = sensitiveHits(content);
    if (hits.length) { $('colComposeHint').textContent = '⚠️ 发布内容存在敏感词（' + hits.map((x) => '“' + x + '”').join('、') + '），不得发布。'; return; }
    const btn = $('colPublish'); btn.disabled = true;
    try {
      await callEdge('col_post_create', { column_id: activeCol.id, content });
      ta.value = ''; $('colChar').textContent = '0 / 2000'; $('colComposeHint').textContent = '✅ 已发布';
      colState.page = 1; await loadColFeed();
    } catch (e) { $('colComposeHint').textContent = e.message; }
    btn.disabled = false;
  }

  async function loadColFeed() {
    const feed = $('colFeed');
    if (!feed) return;
    feed.innerHTML = '<div class="empty" style="padding:20px">加载中…</div>';
    try {
      const posts = await callEdge('col_feed', { column_id: activeCol.id, page: colState.page, page_size: PAGE_SIZE });
      colState.posts = posts;
      $('colCount').textContent = formatCount(activeCol.post_count);
      const emptyEl = $('colEmptyFeed'); const pager = $('colPager');
      if (!posts.length) {
        feed.innerHTML = ''; emptyEl.classList.remove('hidden');
        pager.classList.add('hidden');
      } else {
        emptyEl.classList.add('hidden');
        feed.innerHTML = posts.map(renderColPost).join('');
        const totalPages = Math.max(1, Math.ceil(activeCol.post_count / PAGE_SIZE));
        $('colPageNum').textContent = `第 ${colState.page} / ${totalPages} 页`;
        pager.classList.remove('hidden');
        $('colPrev').disabled = colState.page <= 1;
        wirePostHandlers();
      }
    } catch (e) { feed.innerHTML = `<div class="empty">加载失败：${escapeHtml(e.message)}</div>`; }
  }

  function renderColPost(p) {
    const light = (Number(p.author_level) || 0) >= 45 ? ' lightfx-card' : '';
    const muted = activeColRole.muted;
    const pin = p.pinned ? '<span class="badge pinned">置顶</span> ' : '';
    const own = p.is_owner;
    const mgmt = canManageCol() || own ? `
      <div class="own-acts">${canManageCol() ? `<button class="tiny-btn" data-pin="${p.id}" data-toggle="${p.pinned ? 0 : 1}" title="置顶/取消置顶">${p.pinned ? '取消顶置' : '顶置'}</button>` : ''}
        ${own ? `<button class="tiny-btn" data-ep="${p.id}">编辑</button>` : ''}
        ${canManageCol() || own ? `<button class="tiny-btn danger" data-dp="${p.id}">删除</button>` : ''}</div>` : '';
    return `
      <div class="post-card${p.pinned ? ' pinned-post' : ''}${light}" data-post="${p.id}">
        ${pin}<span class="badge topic">专栏帖</span>
        <div class="post-head">
          <span class="nickname" data-openprofile="${p.author_id || ''}">${escapeHtml(p.nickname || '匿名')}</span>
          ${levelBadgeHtml(p.author_level)}
          <span class="post-time">${formatTime(p.created_at)}</span>
        </div>
        <div class="post-content">${escapeHtml(p.content)}</div>
        ${mgmt}
        <div class="post-actions">
          <button class="act-btn like-btn${p.liked ? ' active' : ''}" data-like="${p.id}" data-state="${p.liked ? 1 : 0}">👍 ${formatCount(p.like_count)}</button>
          <button class="act-btn cmt-toggle" data-cmt="${p.id}">💬 <span class="cmt-num">${formatCount(p.comment_count)}</span></button>
        </div>
        <div class="post-comments hidden" data-cmtbox="${p.id}"></div>
      </div>`;
  }

  function wirePostHandlers() {
    document.querySelectorAll('#colFeed .nickname[data-openprofile]').forEach((el) => {
      el.addEventListener('click', (e) => { e.stopPropagation(); openProfile(el.dataset.openprofile); });
    });
    document.querySelectorAll('#colFeed [data-like]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!requireLogin()) return;
        btn.disabled = true;
        try {
          const r = await callEdge('col_like', { post_id: btn.dataset.like });
          const pid = btn.dataset.like;
          const post = colState.posts.find((p) => p.id === pid);
          if (post) { post.liked = r.liked; post.like_count += r.liked ? 1 : -1; }
          btn.classList.toggle('active', r.liked);
          btn.dataset.state = r.liked ? 1 : 0;
          btn.innerHTML = `👍 ${formatCount((post && post.like_count) || 0)}`;
        } catch (e) { alert(e.message); }
        btn.disabled = false;
      });
    });
    document.querySelectorAll('#colFeed [data-cmt]').forEach((btn) => {
      btn.addEventListener('click', () => toggleComments(btn.dataset.cmt));
    });
    document.querySelectorAll('#colFeed [data-pin]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!requireLogin()) return;
        const pin = btn.dataset.toggle === '1';
        btn.disabled = true;
        try { await callEdge('col_post_pin', { post_id: btn.dataset.pin, pinned: pin }); btn.disabled = false; await loadColFeed(); }
        catch (e) { alert(e.message); btn.disabled = false; }
      });
    });
    document.querySelectorAll('#colFeed [data-ep]').forEach((btn) => {
      btn.addEventListener('click', () => editColPost(btn.dataset.ep));
    });
    document.querySelectorAll('#colFeed [data-dp]').forEach((btn) => {
      btn.addEventListener('click', () => deleteColPost(btn.dataset.dp));
    });
  }

  async function toggleComments(postId) {
    const box = document.querySelector(`#colFeed [data-cmtbox="${postId}"]`);
    if (!box) return;
    if (box.classList.contains('hidden')) {
      box.classList.remove('hidden');
      if (!openComments[postId] || !openComments[postId].loaded) await loadComments(postId);
    } else {
      box.classList.add('hidden');
    }
  }

  async function loadComments(postId) {
    const box = document.querySelector(`#colFeed [data-cmtbox="${postId}"]`);
    if (!box) return;
    box.innerHTML = '<div class="empty" style="padding:10px">加载中…</div>';
    try {
      const list = await callEdge('col_comment_list', { post_id: postId });
      openComments[postId] = { list, loaded: true };
      const post = colState.posts.find((p) => p.id === postId);
      renderCommentsBox(postId, box, list, post);
    } catch (e) { box.innerHTML = `<div class="empty">加载失败：${escapeHtml(e.message)}</div>`; }
  }

  function renderCommentsBox(postId, box, list, post) {
    if (!list.length) box.innerHTML = '<div class="cmt-empty">还没有评论</div>';
    else {
      const byId = {}; list.forEach((c) => byId[c.id] = c);
      box.innerHTML = list.map((c) => {
        const parent = c.parent_id ? byId[c.parent_id] : null;
        const own = c.is_owner;
        const mgmt = (own || canManageCol()) ? `
          <div class="own-acts">${own ? `<button class="tiny-btn" data-ec="${c.id}">编辑</button>` : ''}
          <button class="tiny-btn danger" data-dc="${c.id}">删除</button></div>` : '';
        return `<div class="cmt-item" data-comment="${c.id}">
          <div class="cmt-head">
            <span class="nickname" data-openprofile="${c.author_id || ''}">${escapeHtml(c.nickname || '匿名')}</span>
            ${levelBadgeHtml(c.author_level)}
            ${parent ? `<span class="cmt-replyto">回复 @${escapeHtml(parent.nickname || '匿名')}</span>` : ''}
            <span class="cmt-time">${formatTime(c.created_at)}</span>
            ${mgmt}
          </div>
          <div class="cmt-text">${escapeHtml(c.content)}</div>
          <button class="cmt-reply" data-reply="${c.id}" data-nick="${escapeHtml(c.nickname || '匿名')}">回复</button>
        </div>`;
      }).join('');
    }
    box.insertAdjacentHTML('beforeend', `
      <div class="cmt-compose">
        <textarea class="cmt-input" data-cmtinput="${postId}" maxlength="500" placeholder="写下你的评论…"></textarea>
        <div class="cmt-bar"><span class="cmt-target" data-cmttarget="${postId}">回复: —</span>
          <span class="cmt-count">${formatCount(post ? post.comment_count : 0)} 评论</span></div>
        <div class="cmt-warn" data-cmtwarn="${postId}"></div>
        <button class="btn sm" data-cmtsend="${postId}">发布评论</button>
      </div>`);
    let replyTo = null;
    box.querySelectorAll('[data-reply]').forEach((b) => {
      b.addEventListener('click', () => {
        replyTo = b.dataset.reply;
        const t = box.querySelector(`[data-cmttarget="${postId}"]`);
        if (t) { t.textContent = '回复 @' + b.dataset.nick; t.classList.add('on'); }
        const inp = box.querySelector(`[data-cmtinput="${postId}"]`);
        if (inp) inp.focus();
      });
    });
    box.querySelectorAll('[data-cmtsend]').forEach((b) => {
      b.addEventListener('click', async () => {
        if (!requireLogin()) return;
        const inp = box.querySelector(`[data-cmtinput="${postId}"]`);
        const warn = box.querySelector(`[data-cmtwarn="${postId}"]`);
        const content = (inp.value || '').trim();
        if (!content) { warn.textContent = '评论内容不能为空'; return; }
        if (content.length > 500) { warn.textContent = '评论超出 500 字上限'; return; }
        const hits = sensitiveHits(content);
        if (hits.length) { warn.textContent = '⚠️ 存在敏感词（' + hits.map((x) => '“' + x + '”').join('、') + '），不得发布。'; return; }
        b.disabled = true;
        try {
          await callEdge('col_comment_create', { post_id: postId, parent_id: replyTo || '', content });
          inp.value = ''; warn.textContent = ''; replyTo = null;
          const t = box.querySelector(`[data-cmttarget="${postId}"]`); if (t) { t.textContent = '回复: —'; t.classList.remove('on'); }
          await loadComments(postId);
        } catch (e) { warn.textContent = e.message; }
        b.disabled = false;
      });
    });
    box.querySelectorAll('[data-ec]').forEach((b) => {
      b.addEventListener('click', () => {
        const cmt = list.find((c) => c.id === b.dataset.ec);
        if (!cmt) return;
        const nv = prompt('编辑评论内容：', cmt.content);
        if (nv == null) return; const content = String(nv).trim();
        if (!content) return;
        (async () => { try { await callEdge('col_comment_edit', { comment_id: cmt.id, content }); await loadComments(postId); } catch (e) { alert(e.message); } })();
      });
    });
    box.querySelectorAll('[data-dc]').forEach((b) => {
      b.addEventListener('click', async () => {
        if (!confirm('确定删除该评论？')) return;
        b.disabled = true;
        try { await callEdge('col_comment_delete', { comment_id: b.dataset.dc }); await loadComments(postId); }
        catch (e) { alert(e.message); b.disabled = false; }
      });
    });
    box.querySelectorAll('[data-cmtinput]').forEach((inp) => {
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { const s = box.querySelector('[data-cmtsend]'); if (s) s.click(); } });
    });
    box.querySelectorAll('#colFeed .nickname[data-openprofile]').forEach((el) => {
      el.addEventListener('click', (e) => { e.stopPropagation(); openProfile(el.dataset.openprofile); });
    });
  }

  async function editColPost(postId) {
    const post = colState.posts.find((p) => p.id === postId);
    if (!post) return;
    const nv = prompt('编辑帖子内容：', post.content);
    if (nv == null) return; const content = String(nv).trim();
    if (!content) return;
    const hits = sensitiveHits(content);
    if (hits.length) { alert('⚠️ 存在敏感词（' + hits.map((x) => '“' + x + '”').join('、') + '），不得发布。'); return; }
    try { await callEdge('col_post_edit', { post_id: postId, content }); await loadColFeed(); }
    catch (e) { alert(e.message); }
  }
  async function deleteColPost(postId) {
    if (!confirm('确定删除该帖子及其评论吗？')) return;
    try { await callEdge('col_post_delete', { post_id: postId }); await loadColFeed(); }
    catch (e) { alert(e.message); }
  }

  // ---------------- 通用：打开个人主页 ----------------
  function openProfile(id) {
    try { localStorage.setItem('nzb_view_profile', id); location.href = 'index.html#profile-' + encodeURIComponent(id); }
    catch (_e) {}
  }

  // ---------------- 我的专栏 / 申请 ----------------
  function requireLogin() {
    if (me && me.token) return true;
    alert('请先登录（返回主页登录后再来）。');
    location.href = 'index.html';
    return false;
  }

  async function openMyColumns() {
    if (!requireLogin()) return;
    openModal(`<h3>我的专栏</h3>
      <div id="myColBody"><div class="empty">加载中…</div></div>
      <div style="margin-top:8px;display:flex;justify-content:flex-end;gap:8px">
        <button class="btn ghost sm" id="myColApply">+ 申请开通专栏</button>
        <button class="btn ghost sm" data-close>关闭</button>
      </div>`);
    bindModalClose();
    const apply = $('myColApply'); if (apply) apply.addEventListener('click', () => { closeModal(); openApply(); });
    const body = $('myColBody');
    try {
      const r = await callEdge('column_my', {});
      if (!r.columns.length) { body.innerHTML = `<div class="empty">你还没有申请过专栏</div>`; return; }
      const stMap = { pending: '待审核', open: '已开通', closed: '已关闭' };
      const stC = { pending: '#e0a030', open: '#3fae6b', closed: '#888' };
      body.innerHTML = r.columns.map((c) => `
        <div class="mycol-row">
          <div class="mycol-name">${escapeHtml(c.name)}<span class="badge" style="color:#fff;background:${stC[c.status] || '#888'}">${stMap[c.status] || c.status}</span></div>
          <div class="mycol-sub">${formatCount(c.post_count)} 帖 · ${formatCount(c.comment_count)} 评论 · ${formatShort(c.created_at)}</div>
          ${c.intro ? `<div class="mycol-intro">${escapeHtml(c.intro)}</div>` : ''}
          ${c.status === 'open' ? `<button class="btn sm ghost mycol-enter" data-id="${escapeHtml(c.id)}">进入管理 »</button>` : ''}
        </div>`).join('');
      body.querySelectorAll('.mycol-enter').forEach((b) => { b.addEventListener('click', () => { closeModal(); location.hash = '#/col/' + encodeURIComponent(b.dataset.id); }); });
    } catch (e) { body.innerHTML = `<div class="empty">加载失败：${escapeHtml(e.message)}</div>`; }
  }

  async function openApply() {
    if (!requireLogin()) return;
    openModal(`<h3>申请开通校友专栏</h3>
      <div class="form-field"><label>专栏名（自动以「校友专栏」结尾，2~30 字）</label><input id="apName" class="input" maxlength="30" placeholder="例如：XX 计算机系校友专栏" /></div>
      <div class="form-field"><label>简介（300 字内）</label><textarea id="apIntro" class="input" rows="2" maxlength="300" style="resize:vertical"></textarea></div>
      <div class="form-field"><label>公告（可选，500 字内）</label><textarea id="apNotice" class="input" rows="2" maxlength="500" style="resize:vertical"></textarea></div>
      <div class="form-field"><label>联系方式（可选，管理端可见）</label><input id="apContact" class="input" maxlength="60" placeholder="微信 / QQ / 邮箱" /></div>
      <div class="form-error" id="apError"></div>
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button class="btn ghost sm" data-close>取消</button>
        <button class="btn" id="apSubmit">提交申请</button>
      </div>`);
    bindModalClose();
    $('apSubmit').addEventListener('click', async () => {
      const name = $('apName').value.trim();
      const intro = $('apIntro').value.trim();
      const notice = $('apNotice').value.trim();
      const contact = $('apContact').value.trim();
      $('apError').textContent = '';
      if (!name) { $('apError').textContent = '请填写专栏名'; return; }
      const hits = sensitiveHits([name, intro, notice, contact].join(' '));
      if (hits.length) { $('apError').textContent = '⚠️ 存在敏感词（' + hits.map((x) => '“' + x + '”').join('、') + '），不得提交。'; return; }
      $('apSubmit').disabled = true;
      try {
        const r = await callEdge('column_request', { name, intro, notice, contact });
        alert(r.message || '申请已提交');
        closeModal();
      } catch (e) { $('apError').textContent = e.message; $('apSubmit').disabled = false; }
    });
  }

  // ---------------- 专栏管理（创始人/管理员） ----------------
  async function openEditColumn() {
    const col = activeCol;
    openModal(`<h3>管理专栏：${escapeHtml(col.name)}</h3>
      <div class="form-field"><label>专栏名（2~30 字）</label><input id="edName" class="input" maxlength="30" value="${escapeHtml(col.name)}" /></div>
      <div class="form-field"><label>简介（300 字内）</label><textarea id="edIntro" class="input" rows="2" maxlength="300" style="resize:vertical">${escapeHtml(col.intro || '')}</textarea></div>
      <div class="form-field"><label>公告（500 字内）</label><textarea id="edNotice" class="input" rows="2" maxlength="500" style="resize:vertical">${escapeHtml(col.notice || '')}</textarea></div>
      <div class="form-error" id="edError"></div>
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button class="btn ghost sm" data-close>取消</button>
        <button class="btn" id="edSave">保存</button>
      </div>`);
    bindModalClose();
    $('edSave').addEventListener('click', async () => {
      const name = $('edName').value.trim(); const intro = $('edIntro').value.trim(); const notice = $('edNotice').value.trim();
      const hits = sensitiveHits([name, intro, notice].join(' '));
      if (hits.length) { $('edError').textContent = '⚠️ 存在敏感词（' + hits.map((x) => '“' + x + '”').join('、') + '），不得保存。'; return; }
      $('edSave').disabled = true;
      try { await callEdge('column_edit', { column_id: col.id, name, intro, notice }); alert('已保存'); closeModal(); await loadColumn(col.id); }
      catch (e) { $('edError').textContent = e.message; $('edSave').disabled = false; }
    });
  }

  async function openMutePanel() {
    const col = activeCol;
    openModal(`<h3>禁言管理：${escapeHtml(col.name)}</h3>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">
        <input id="mtUser" class="input" style="flex:1;min-width:140px" placeholder="输入用户名禁言" />
        <input id="mtDays" class="input" style="width:70px" placeholder="天数" />
        <button class="btn sm" id="mtAdd">禁言</button>
      </div>
      <div class="form-field"><label>原因（可选）</label><input id="mtReason" class="input" maxlength="200" /></div>
      <div id="mtList"><div class="empty">加载中…</div></div>
      <div style="margin-top:8px;display:flex;justify-content:flex-end"><button class="btn ghost sm" data-close>关闭</button></div>`);
    bindModalClose();
    function renderMutes(list) {
      const box = $('mtList'); if (!box) return;
      if (!list.length) { box.innerHTML = '<div class="empty">暂无禁言用户</div>'; return; }
      box.innerHTML = list.map((m) => `
        <div class="mt-row">
          <div><b>${escapeHtml(m.display_name || '用户')}</b>
            <span class="mt-reason">${m.until ? `至 ${formatTime(m.until)}` : '永久'}</span>
            <span class="mt-reason">${escapeHtml(m.reason || '')}</span></div>
          <button class="tiny-btn danger" data-mt-rm="${m.user_id}">解除</button>
        </div>`).join('');
      box.querySelectorAll('[data-mt-rm]').forEach((b) => {
        b.addEventListener('click', async () => {
          b.disabled = true;
          try { await callEdge('col_mute_remove', { column_id: col.id, user_id: b.dataset.mtRm }); await loadMutes(); }
          catch (e) { alert(e.message); b.disabled = false; }
        });
      });
    }
    async function loadMutes() {
      try { const list = await callEdge('col_mutes_list', { column_id: col.id }); renderMutes(list); }
      catch (e) { const box = $('mtList'); if (box) box.innerHTML = `<div class="empty">加载失败：${escapeHtml(e.message)}</div>`; }
    }
    loadMutes();
    $('mtAdd').addEventListener('click', async () => {
      const username = $('mtUser').value.trim();
      const days = $('mtDays').value;
      const reason = $('mtReason').value.trim();
      if (!username) { alert('请输入用户名'); return; }
      $('mtAdd').disabled = true;
      try { await callEdge('col_mute_add', { column_id: col.id, username, days, reason }); $('mtUser').value = ''; $('mtDays').value = ''; $('mtReason').value = ''; await loadMutes(); }
      catch (e) { alert(e.message); }
      $('mtAdd').disabled = false;
    });
  }

  // ---------------- Modal ----------------
  function openModal(html) {
    let bd = $('colModal');
    if (!bd) { bd = document.createElement('div'); bd.className = 'modal-backdrop hidden'; bd.id = 'colModal'; document.body.appendChild(bd); }
    bd.classList.remove('hidden');
    bd.innerHTML = `<div class="modal-card">${html}</div>`;
  }
  function closeModal() { const bd = $('colModal'); if (bd) bd.classList.add('hidden'); }
  function bindModalClose() {
    const bd = $('colModal');
    const closers = bd.querySelectorAll('[data-close]');
    closers.forEach((c) => c.addEventListener('click', closeModal));
    bd.addEventListener('click', (e) => { if (e.target === bd) closeModal(); });
  }

  // ---------------- 事件 ----------------
  window.addEventListener('hashchange', () => {
    readSession(); renderBar();
    const r = parseHash();
    if (r.view === 'col' && r.id) loadColumn(r.id); else renderList();
  });

  boot();
})();