/* ============================================================
   新哲吧 · 前端逻辑（公共级论坛）
   功能：发布/话题筛选/排序/搜索/榜单 / 普通用户注册登录 / 作者内容管理 /
        收藏 / 通知中心 / 举报 / 评论楼层·只看楼主 / 实时更新 / 管理入口 / 主题
   ============================================================ */
(function () {
  'use strict';

  const SUPABASE_URL = 'https://jgezpvmlnhycxslqbwcx.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_B29ClgwZagW32Ow5x6VdKQ_IL65F7dl';
  const EDGE_URL = `${SUPABASE_URL}/functions/v1/newtheba`;

  const TOPICS = ['闲聊', '社团活动', '食堂', '宿舍', '学习', '吃瓜'];
  const PAGE_SIZE = 25;
  const ADMIN_TOKEN_KEY = 'nzb_admin_token';
  const ADMIN_PROFILE_KEY = 'nzb_admin_profile';
  const USER_TOKEN_KEY = 'nzb_user_token';
  const USER_PROFILE_KEY = 'nzb_user_profile';

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  const state = {
    activeTopic: '', page: 1, totalPages: 1, totalCount: 0,
    sort: 'latest', mode: 'feed', keyword: '',
    user: { token: null, profile: null },
    likedSet: new Set(),
    favSet: new Set(),
    channel: null
  };

  // ---------------- DOM ----------------
  const $ = (id) => document.getElementById(id);
  const els = {
    feed: $('feed'), pinnedFeed: $('pinnedFeed'), pinnedSection: $('pinnedSection'),
    emptyState: $('emptyState'), pager: $('pager'), pageNum: $('pageNum'),
    topicSelect: $('topicSelect'), filterBar: $('filterBar'), sortTabs: $('sortTabs'),
    content: $('contentInput'), nickname: $('nicknameInput'), charCount: $('charCount'),
    publish: $('publishBtn'), composeWarn: $('composeWarn'), composeHint: $('composeHint'),
    haltPage: $('haltPage'), haltTitle: $('haltTitle'), haltSubtitle: $('haltSubtitle'),
    popupHost: $('popupHost'),
    searchInput: $('searchInput'), searchClear: $('searchClear'), searchBanner: $('searchBanner'),
    userBar: $('userBar'), viewTitle: $('viewTitle'),
    weekHot: $('weekHot'), topicAct: $('topicAct'),
    notifPanel: $('notifPanel'), notifList: $('notifList'), notifClear: $('notifClear'),
    userModal: $('userModal'),
    reportModal: $('reportModal'), reportReason: $('reportReason'), reportError: $('reportError'), reportSubmitBtn: $('reportSubmitBtn'),
    adminModal: $('adminModal'), adminModalTitle: $('adminModalTitle'),
    adminFormLogin: $('adminFormLogin'), adminFormRegister: $('adminFormRegister'),
    loginUser: $('loginUser'), loginPass: $('loginPass'), loginError: $('loginError'),
    loginBtn: $('loginBtn'), registerBtn: $('registerBtn'),
    regClass: $('regClass'), regName: $('regName'), regUser: $('regUser'), regPass: $('regPass'),
    regError: $('regError'), openAdmin: $('openAdmin')
  };

  // ---------------- 工具 ----------------
  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function formatTime(iso) {
    const d = new Date(iso);
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ` +
           `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  }
  function topicLimit(t) { return t === '吃瓜' ? 5000 : 500; }
  function sensitiveHits(text) {
    if (!text) return [];
    const words = window.NEWTHEBA_SENSITIVE_WORDS || [];
    const found = [];
    const lower = String(text).toLowerCase();
    for (const w of words) {
      const s = String(w || '').trim();
      if (s && lower.includes(s.toLowerCase()) && found.indexOf(s) === -1) found.push(s);
    }
    return found;
  }
  function formatCount(n) {
    n = Number(n) || 0;
    return n > 9999 ? '9999+' : String(n);
  }
  // 等级：经验 = 发帖*2 + 评论 + 获赞
  function levelOf(u) {
    if (!u) return 1;
    const xp = (Number(u.post_count) || 0) * 2 + (Number(u.comment_count) || 0) + (Number(u.like_received) || 0);
    if (xp <= 0) return 1;
    return Math.min(60, 1 + Math.floor(Math.log2(xp + 1)));
  }
  function userDisplay(u) { return u && (u.nickname || u.username) ? (u.nickname || u.username) : '匿名'; }

  // ---------------- Edge 调用 ----------------
  async function callEdge(action, payload) {
    const res = await fetch(EDGE_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', apikey: SUPABASE_KEY },
      body: JSON.stringify({ action, ...payload })
    });
    let data = {};
    try { data = await res.json(); } catch (_e) {}
    if (!res.ok || data.ok === false) throw new Error(data.error || ('请求失败 ' + res.status));
    return data.data;
  }

  // ---------------- 会话 ----------------
  function readAdminSession() {
    try { state.session = { token: localStorage.getItem(ADMIN_TOKEN_KEY) }; } catch (_e) {}
  }
  function readUserSession() {
    try {
      state.user.token = localStorage.getItem(USER_TOKEN_KEY) || null;
      state.user.profile = JSON.parse(localStorage.getItem(USER_PROFILE_KEY) || 'null');
    } catch (_e) { state.user.profile = null; }
  }
  function saveUserSession() {
    try {
      if (state.user.token) localStorage.setItem(USER_TOKEN_KEY, state.user.token);
      else localStorage.removeItem(USER_TOKEN_KEY);
      if (state.user.profile) localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(state.user.profile));
      else localStorage.removeItem(USER_PROFILE_KEY);
    } catch (_e) {}
  }
  function clearUserSession() {
    state.user = { token: null, profile: null };
    try {
      localStorage.removeItem(USER_TOKEN_KEY);
      localStorage.removeItem(USER_PROFILE_KEY);
    } catch (_e) {}
    renderUserBar();
  }
  const loggedIn = () => !!(state.user.token && state.user.profile);
  function myId() { return loggedIn() ? state.user.profile.id : null; }

  // ---------------- 顶栏：用户栏 ----------------
  function renderUserBar() {
    const host = els.userBar;
    if (!host) return;
    if (!loggedIn()) {
      host.innerHTML = `<button class="btn ghost sm" id="userLoginBtn2">登录 / 注册</button>`;
      host.querySelector('#userLoginBtn2').addEventListener('click', openUserModal);
      return;
    }
    const p = state.user.profile;
    const lv = levelOf(p);
    const initials = userDisplay(p).charAt(0).toUpperCase();
    host.innerHTML = `
      <div class="user-area">
        <button class="icon-btn" id="bellBtn" title="通知">🔔<span class="dot-badge" id="notifBadge"></span></button>
        <button class="user-chip" id="userChip">
          <span class="avatar" style="background:${p.avatar_color || '#e07a5f'}">${escapeHtml(initials)}</span>
          <span class="u-name">${escapeHtml(p.nickname || p.username)}</span>
          <span class="u-level">Lv.${lv}</span>
        </button>
        <div class="user-pop" id="userPop">
          <button class="pop-item" data-act="fav">⭐ 我的收藏</button>
          <button class="pop-item" data-act="mine">📄 我的帖子</button>
          <button class="pop-item" data-act="history">🕘 浏览历史</button>
          <button class="pop-item" data-act="notif">🔔 通知中心</button>
          <div class="pop-sep"></div>
          <button class="pop-item" data-act="logout">🚪 退出登录</button>
        </div>
      </div>`;
    host.querySelector('#bellBtn').addEventListener('click', (e) => { e.stopPropagation(); toggleNotif(); });
    host.querySelector('#userChip').addEventListener('click', (e) => { e.stopPropagation(); toggleUserPop(); });
    host.querySelector('#userPop').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-act]');
      if (!btn) return;
      const act = btn.dataset.act;
      if (act === 'fav') showFavorites();
      else if (act === 'mine') showMyPosts();
      else if (act === 'history') showHistory();
      else if (act === 'notif') toggleNotif();
      else if (act === 'logout') clearUserSession();
      closePops();
    });
    // 点击外部关闭
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.user-area') && !e.target.closest('.notif-panel')) closePops();
    }, { once: false });
    refreshUnread();
  }
  function toggleUserPop() { document.querySelector('#userPop')?.classList.toggle('open'); }
  function toggleNotif() {
    const open = els.notifPanel.classList.toggle('open');
    if (open) { loadNotifs(); hideUnreadBadge(); }
  }
  function closePops() {
    document.querySelector('#userPop')?.classList.remove('open');
    els.notifPanel.classList.remove('open');
  }

  // ---------------- 通知中心 ----------------
  let unreadTimer = null;
  async function refreshUnread() {
    if (!loggedIn() || !document.querySelector('#notifBadge')) return;
    try {
      const n = await callEdge('notifications_unread', { token: state.user.token });
      const badge = document.querySelector('#notifBadge');
      if (badge) {
        badge.classList.toggle('on', n > 0);
        badge.textContent = n > 99 ? '99+' : n;
      }
    } catch (_e) {}
  }
  function hideUnreadBadge() { const b = document.querySelector('#notifBadge'); if (b) b.classList.remove('on'); }
  async function loadNotifs() {
    const box = els.notifList;
    if (!box) return;
    box.innerHTML = '<div class="notif-empty">加载中…</div>';
    try {
      const list = await callEdge('notifications_list', { token: state.user.token });
      if (!list.length) { box.innerHTML = '<div class="notif-empty">暂无通知</div>'; return; }
      box.innerHTML = list.map((n) => `
        <div class="notif-item${n.read ? '' : ' unread'}" data-pid="${n.post_id || ''}">
          <div class="n-msg">${escapeHtml(n.message)}</div>
          <div class="n-time">${formatTime(n.created_at)}</div>
        </div>`).join('');
      box.querySelectorAll('.notif-item').forEach((el) => {
        el.addEventListener('click', () => {
          const pid = el.dataset.pid;
          if (pid) scrollToPost(pid);
          closePops();
        });
      });
      // 打开即标记已读
      try { await callEdge('notifications_mark_read', { token: state.user.token }); } catch (_e) {}
    } catch (e) {
      box.innerHTML = `<div class="notif-empty">加载失败：${escapeHtml(e.message)}</div>`;
    }
  }
  function scrollToPost(pid) {
    // 切到 feed 视图定位（若在 feed 且可见则滚动）
    if (state.mode !== 'feed') { state.mode = 'feed'; state.page = 1; loadFeed(); }
    const known = [`post-card[data-id="${pid}"]`, `article[data-id="${pid}"]`];
    let el = null;
    for (const sel of known) { el = document.querySelector(sel); if (el) break; }
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  els.notifClear.addEventListener('click', async () => {
    try { await callEdge('notifications_mark_read', { token: state.user.token }); loadNotifs(); } catch (_e) {}
  });

  // ---------------- 用户登录 / 注册 ----------------
  function openUserModal() { els.userModal.classList.remove('hidden'); }
  function closeUserModal() { els.userModal.classList.add('hidden'); }
  els.userModal.addEventListener('click', (e) => { if (e.target === els.userModal) closeUserModal(); });
  $('closeUserModal').addEventListener('click', closeUserModal);
  $('closeUserModal2').addEventListener('click', closeUserModal);
  $('switchToUserReg').addEventListener('click', () => {
    $('userFormLogin').classList.add('hidden');
    $('userFormRegister').classList.remove('hidden');
  });
  $('switchToUserLogin').addEventListener('click', () => {
    $('userFormRegister').classList.add('hidden');
    $('userFormLogin').classList.remove('hidden');
  });
  $('userLoginBtn').addEventListener('click', async () => {
    const err = $('userLoginError');
    err.textContent = '';
    try {
      const data = await callEdge('user_login', {
        username: $('userLoginName').value.trim(), password: $('userLoginPass').value
      });
      state.user = { token: data.token, profile: data.user };
      saveUserSession(); renderUserBar(); closeUserModal(); loadFavIds();
    } catch (e) { err.textContent = e.message; }
  });
  $('userRegBtn').addEventListener('click', async () => {
    const err = $('userRegError');
    err.textContent = '';
    const password = $('userRegPass').value;
    if (password.length < 6) { err.textContent = '密码至少 6 位'; return; }
    try {
      const data = await callEdge('user_register', {
        username: $('userRegName').value.trim(),
        nickname: $('userRegNick').value.trim(),
        password
      });
      state.user = { token: data.token, profile: data.user };
      saveUserSession(); renderUserBar(); closeUserModal(); loadFavIds();
    } catch (e) { err.textContent = e.message; }
  });

  // ---------------- 收藏 ----------------
  async function loadFavIds() {
    if (!loggedIn()) return;
    try {
      const list = await callEdge('favorite_list', { token: state.user.token });
      state.favSet = new Set((list || []).map((f) => f.post.id));
      markFavButtons();
    } catch (_e) {}
  }
  function markFavButtons() {
    document.querySelectorAll('.fav-btn').forEach((b) => {
      const pid = b.dataset.pid;
      b.classList.toggle('active', state.favSet.has(pid));
    });
  }
  async function toggleFav(postId, btn) {
    if (!loggedIn()) { window.alert('请先登录后收藏'); openUserModal(); return; }
    const has = state.favSet.has(postId);
    try {
      await callEdge(has ? 'favorite_remove' : 'favorite_add', { token: state.user.token, post_id: postId });
      if (has) state.favSet.delete(postId); else state.favSet.add(postId);
      if (btn) btn.classList.toggle('active', !has);
    } catch (e) { window.alert(e.message); }
  }

  // ---------------- 举报 ----------------
  let reportTarget = null;
  function openReport(type, id) {
    reportTarget = { type, id };
    $('reportReason').value = '';
    $('reportError').textContent = '';
    els.reportModal.classList.remove('hidden');
  }
  $('closeReportModal').addEventListener('click', () => els.reportModal.classList.add('hidden'));
  els.reportModal.addEventListener('click', (e) => { if (e.target === els.reportModal) els.reportModal.classList.add('hidden'); });
  els.reportSubmitBtn.addEventListener('click', async () => {
    const reason = els.reportReason.value.trim();
    const err = $('reportError');
    err.textContent = '';
    if (!reportTarget) return;
    if (!reason) { err.textContent = '请填写举报理由'; return; }
    els.reportSubmitBtn.disabled = true;
    try {
      await callEdge('report_submit', { target_type: reportTarget.type, target_id: reportTarget.id, reason });
      els.reportModal.classList.add('hidden');
      window.alert('✅ 举报已提交，管理员会尽快处理。');
    } catch (e) { err.textContent = e.message; }
    els.reportSubmitBtn.disabled = false;
  });

  // ---------------- 站点运行状态 ----------------
  async function loadSiteStatus() {
    try {
      const { data } = await supabase.from('forum_site').select('open, halt_title, halt_subtitle').eq('id', 1).maybeSingle();
      if (data && data.open === false) showHalt(data);
    } catch (_e) {}
  }
  function showHalt(site) {
    els.haltTitle.textContent = site.halt_title || '新哲吧维护中';
    els.haltSubtitle.textContent = site.halt_subtitle || '网站当前暂停服务，请稍后再来。';
    els.haltPage.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  // ---------------- 弹窗公告 ----------------
  async function loadPopups() {
    try {
      const { data } = await supabase
        .from('forum_popups').select('id, title, content, push_seq')
        .eq('enabled', true).order('created_at', { ascending: false }).limit(20);
      if (!data || !data.length) return;
      let seen = {};
      try { seen = JSON.parse(localStorage.getItem('nzb_popup_seen') || '{}'); } catch (_e) { seen = {}; }
      for (const target of data) {
        const ver = seen[target.id] || 0;
        if (ver !== (target.push_seq || 0)) {
          seen[target.id] = target.push_seq || 0;
          try { localStorage.setItem('nzb_popup_seen', JSON.stringify(seen)); } catch (_e) {}
          renderPopup(target);
          return;
        }
      }
    } catch (_e) {}
  }
  function renderPopup(p) {
    const bd = document.createElement('div');
    bd.className = 'popup-backdrop fade-in-up';
    bd.innerHTML = `
      <div class="popup-card">
        <button class="popup-x" aria-label="关闭">×</button>
        <h3>${escapeHtml(p.title)}</h3>
        <div class="popup-body">${escapeHtml(p.content)}</div>
      </div>`;
    bd.querySelector('.popup-x').addEventListener('click', () => bd.remove());
    bd.addEventListener('click', (e) => { if (e.target === bd) bd.remove(); });
    els.popupHost.appendChild(bd);
  }

  // ---------------- 作者信息解析（id → {level}） ----------------
  async function resolveAuthors(rows) {
    const ids = Array.from(new Set((rows || []).map((p) => p.author_id).filter(Boolean)));
    const map = {};
    if (ids.length) {
      const { data } = await supabase.from('forum_users')
        .select('id, nickname, post_count, comment_count, like_received').in('id', ids);
      (data || []).forEach((u) => { map[u.id] = { nickname: u.nickname || u.username || '', level: levelOf(u) }; });
    }
    return map;
  }

  // ---------------- 卡片渲染 ----------------
  function makeCard(post, ctx = {}) {
    const card = document.createElement('article');
    card.className = 'post-card' + (ctx.pinned ? ' pinned-post' : '');
    card.dataset.id = post.id;
    const isAnon = !post.nickname;
    const nickHtml = isAnon ? '<span class="anonymous">匿名</span>' : escapeHtml(post.nickname);
    let badges = ctx.pinned
      ? '<span class="badge pinned">置顶</span>'
      : '<span class="badge topic">' + escapeHtml(post.topic) + '</span>';
    const liked = state.likedSet.has(post.id);
    const isOwn = myId() && post.author_id === myId();
    const favOn = state.favSet.has(post.id);
    const floor = ctx.floor != null ? `<span class="post-floor">#${ctx.floor ? ctx.floor : ''}</span>` : '';
    const levelTag = post.author_id && ctx.authorMap && ctx.authorMap[post.author_id]
      ? `<span class="author-level">Lv.${ctx.authorMap[post.author_id].level}</span>` : '';
    const ownActs = isOwn
      ? `<span class="own-acts">
           <button class="tiny-btn" data-act="edit">编辑</button>
           <button class="tiny-btn danger" data-act="del">删除</button>
         </span>` : '';
    card.innerHTML = `
      <div class="post-head">
        <span class="nickname">${nickHtml}${levelTag}</span>
        ${badges}
        <span class="badge seen">新</span>
        ${isOwn ? '<span class="badge pinned" style="color:#4dabf7">自己</span>' : ''}
        <span class="post-time">${formatTime(post.created_at)}</span>
        ${floor}
      </div>
      <div class="post-content">${escapeHtml(post.content)}${ownActs}</div>
      <div class="post-actions">
        <button class="act-btn like-btn${liked ? ' active' : ''}" title="点赞">
          <span class="like-ico">👍</span><span class="like-num">${formatCount(post.like_count)}</span>
        </button>
        <button class="act-btn cmt-toggle" title="评论">
          <span>💬</span><span class="cmt-num">${formatCount(post.comment_count)}</span>
          <span class="cmt-label">展开评论</span>
        </button>
        <button class="act-btn fav-btn${favOn ? ' active' : ''}" data-pid="${post.id}" title="收藏">⭐</button>
        <button class="act-btn rep-btn" data-type="post" data-id="${post.id}" title="举报">🚩</button>
      </div>
      <div class="post-comments hidden" data-cmtbox></div>`;
    card.querySelector('.like-btn').addEventListener('click', (e) => { likePost(post, e.currentTarget); });
    card.querySelector('.cmt-toggle').addEventListener('click', () => toggleComments(card, post));
    card.querySelector('.fav-btn').addEventListener('click', (e) => toggleFav(post.id, e.currentTarget));
    card.querySelector('.rep-btn').addEventListener('click', (e) => {
      openReport(e.currentTarget.dataset.type, e.currentTarget.dataset.id);
    });
    // 作者编辑/删除
    if (isOwn) {
      card.querySelector('[data-act="edit"]').addEventListener('click', () => editOwnPost(card, post));
      card.querySelector('[data-act="del"]').addEventListener('click', () => deleteOwnPost(post));
    }
    return card;
  }

  async function editOwnPost(card, post) {
    const box = card.querySelector('.post-content');
    const old = post.content;
    const text = window.prompt('编辑帖子内容（发布后可见）：', old);
    if (text == null || text.trim() === old) return;
    const content = text.trim();
    const limit = topicLimit(post.topic);
    if (!content) { window.alert('内容不能为空'); return; }
    if (content.length > limit) { window.alert(`内容超出${limit}字上限`); return; }
    const hits = sensitiveHits(content);
    if (hits.length) { window.alert('⚠️ 存在敏感词：' + hits.map((x) => '“' + x + '”').join('、')); return; }
    try {
      await callEdge('user_edit_post', { token: state.user.token, id: post.id, content });
      post.content = content;
      box.textContent = content;
      if (post.topic === '吃瓜') window.alert('✅ 已更新，吃瓜内容需重新过审后展示。');
    } catch (e) { window.alert(e.message); }
  }
  async function deleteOwnPost(post) {
    if (!window.confirm('确定删除这条帖子及其评论吗？该操作不可恢复。')) return;
    try {
      await callEdge('user_delete_post', { token: state.user.token, id: post.id });
      state.likedSet.delete(post.id); state.favSet.delete(post.id);
      const card = document.querySelector(`article[data-id="${post.id}"]`);
      if (card) card.remove();
    } catch (e) { window.alert(e.message); }
  }

  // ---------------- 点赞 ----------------
  function getLikedSet() {
    try { return new Set(JSON.parse(localStorage.getItem('nzb_liked_posts') || '[]')); } catch (_e) { return new Set(); }
  }
  function saveLikedSet() {
    try { localStorage.setItem('nzb_liked_posts', JSON.stringify([...state.likedSet]).slice(0, 20000)); } catch (_e) {}
  }
  async function likePost(post, btn) {
    const on = state.likedSet.has(post.id);
    btn.disabled = true;
    try {
      await callEdge('set_like', { token: state.user.token || '', post_id: post.id, liked: !on });
      if (on) state.likedSet.delete(post.id); else state.likedSet.add(post.id);
      saveLikedSet();
      btn.classList.toggle('active', !on);
      const num = btn.querySelector('.like-num');
      if (num) num.textContent = formatCount(Math.max(0, Number(post.like_count) + (on ? -1 : 1)));
    } catch (e) { window.alert(e.message); }
    btn.disabled = false;
  }

  // ---------------- 评论 ----------------
  function toggleComments(card, post) {
    const box = card.querySelector('[data-cmtbox]');
    const label = card.querySelector('.cmt-label');
    if (!box.classList.contains('hidden')) {
      box.classList.add('hidden'); label.textContent = '展开评论'; return;
    }
    box.classList.remove('hidden');
    label.textContent = '收起评论';
    recordHistory(post.id);
    if (!box.dataset.loaded) { box.dataset.loaded = '1'; loadComments(box, post); }
  }
  async function loadComments(box, post) {
    box.innerHTML = '<div class="cmt-empty">加载中…</div>';
    try {
      const { data, error } = await supabase.from('forum_comments')
        .select('*').eq('post_id', post.id).order('created_at', { ascending: true }).limit(1000);
      if (error) throw error;
      renderComments(box, data || [], post);
    } catch (_e) { box.innerHTML = '<div class="cmt-empty">评论加载失败</div>'; delete box.dataset.loaded; }
  }
  async function renderComments(box, list, post) {
    const authorMap = await resolveAuthors(list);
    const onlyAuthor = !!post.author_id && post.author_id !== 'anonymized';
    box.dataset.loaded = '1';
    box.innerHTML = `
      <div class="cmt-items"></div>
      <div class="cmt-more-wrap hidden"><button class="cmt-more" type="button">加载更多评论</button></div>
      <div class="cmt-bar2">
        ${onlyAuthor ? `<button class="filter-author" data-oa="1">只看楼主</button>` : ''}
        <span class="cmt-floor"></span>
      </div>
      <div class="cmt-compose">
        <input class="cmt-input" maxlength="250" placeholder="写下你的评论…（250字内）">
        <div class="cmt-row">
          <input class="cmt-nick" maxlength="24" placeholder="${loggedIn() ? '将使用你的账号昵称' : '昵称（不填显示匿名，最多24字）'}">
          <button class="btn sm cmt-submit">发表</button>
        </div>
        <div class="cmt-bar"><span class="cmt-target"></span><span class="cmt-count">0/250</span></div>
        <div class="cmt-warn"></div>
      </div>`;
    box._comments = list;
    box._authorMap = authorMap;
    box._shown = 0;
    if (!list.length) {
      const items = box.querySelector('.cmt-items');
      if (items) items.innerHTML = '<div class="cmt-empty">暂无评论，来抢沙发吧</div>';
    }
    const tinput = box.querySelector('.cmt-input');
    tinput.addEventListener('input', () => { box.querySelector('.cmt-count').textContent = tinput.value.length + '/250'; });
    if (loggedIn()) {
      box.querySelector('.cmt-nick').value = userDisplay(state.user.profile);
      box.querySelector('.cmt-nick').readOnly = true;
    }
    appendCommentChunk(box, post);
    // 事件委托：回复/举报/编辑/删除/只看楼主/加载更多
    box.addEventListener('click', (e) => {
      if (e.target.closest('.cmt-more')) { appendCommentChunk(box, post); return; }
      const reply = e.target.closest('[data-reply]');
      if (reply) {
        box._replyTo = reply.dataset.reply;
        const t = box.querySelector('.cmt-target');
        t.textContent = '正在回复 @' + reply.dataset.rname;
        t.classList.add('on');
        tinput.focus();
        return;
      }
      const rep = e.target.closest('[data-rep]');
      if (rep) { openReport('comment', rep.dataset.rep); return; }
      const edit = e.target.closest('[data-edit]');
      if (edit) { editOwnComment(box, edit.dataset.edit, post); return; }
      const del = e.target.closest('[data-del]');
      if (del) { doDeleteOwnComment(box, del.dataset.del, post); return; }
      const flt = e.target.closest('.filter-author');
      if (flt) {
        const on = flt.classList.toggle('on');
        if (on) {
          const filtered = (box._comments || []).filter((c) => c.author_id === post.author_id);
          renderComments(box, filtered, post);
          const back = box.querySelector('.filter-author');
          if (back) back.classList.add('on');
        } else {
          loadComments(box, post);
        }
      }
    });
    box.querySelector('.cmt-submit').addEventListener('click', () => postComment(box, post));
  }
  // 单条评论 HTML（楼层号按全量索引）
  function commentItemHtml(c, i, list, authorMap, post) {
    const map = {};
    list.forEach((x) => { map[x.id] = x; });
    const parent = c.parent_id ? map[c.parent_id] : null;
    const name = c.nickname ? escapeHtml(c.nickname) : '<span class="anonymous">匿名</span>';
    const lv = c.author_id && authorMap[c.author_id] ? `<span class="author-level">Lv.${authorMap[c.author_id].level}</span>` : '';
    const isOwn = myId() && c.author_id === myId();
    const ownActs = isOwn
      ? `<span class="own-acts"><button class="tiny-btn" data-edit="${c.id}">编辑</button><button class="tiny-btn danger" data-del="${c.id}">删除</button></span>` : '';
    const replyTag = parent
      ? ' <span class="cmt-replyto">回复 @' + (parent.nickname ? escapeHtml(parent.nickname) : '匿名') + '</span>' : '';
    const rname = c.nickname ? c.nickname : '匿名';
    return `<div class="cmt-item" data-cid="${c.id}">
      <div class="cmt-head">${name}${lv}${replyTag}<span class="cmt-time">#${i + 1} · ${formatTime(c.created_at)}</span></div>
      <div class="cmt-text">${escapeHtml(c.content)}${ownActs}</div>
      <button class="cmt-reply" data-reply="${c.id}" data-rname="${escapeHtml(rname)}">回复</button>
      <button class="cmt-reply" style="margin-left:10px" data-rep="${c.id}">举报</button>
    </div>`;
  }
  const COMMENT_CHUNK = 40;
  function appendCommentChunk(box, post) {
    const list = box._comments || [];
    const authorMap = box._authorMap || {};
    const end = Math.min(box._shown + COMMENT_CHUNK, list.length);
    const items = box.querySelector('.cmt-items');
    if (items) {
      for (let i = box._shown; i < end; i++) {
        items.insertAdjacentHTML('beforeend', commentItemHtml(list[i], i, list, authorMap, post));
      }
    }
    box._shown = end;
    const floor = box.querySelector('.cmt-floor');
    if (floor) floor.textContent = `共 ${list.length} 条`;
    const wrap = box.querySelector('.cmt-more-wrap');
    if (wrap) {
      if (end >= list.length) wrap.classList.add('hidden');
      else { wrap.classList.remove('hidden'); wrap.querySelector('.cmt-more').textContent = `加载更多评论（${list.length - end} 条）`; }
    }
  }
  async function doDeleteOwnComment(box, id, post) {
    if (!window.confirm('确定删除这条评论及其回复吗？')) return;
    try {
      await callEdge('user_delete_comment', { token: state.user.token, id });
      loadComments(box, post);
    } catch (e) { window.alert(e.message); }
  }
  async function editOwnComment(box, id, post) {
    const item = box.querySelector(`.cmt-item[data-cid="${id}"]`);
    if (!item) return;
    const txt = item.querySelector('.cmt-text').textContent;
    const next = window.prompt('编辑评论内容：', txt);
    if (next == null || next.trim() === txt) return;
    const content = next.trim();
    if (!content) return;
    if (content.length > 250) { window.alert('评论最多 250 字'); return; }
    const hits = sensitiveHits(content);
    if (hits.length) { window.alert('⚠️ 存在敏感词：' + hits.map((x) => '“' + x + '”').join('、')); return; }
    try {
      await callEdge('user_edit_comment', { token: state.user.token, id, content });
      loadComments(box, post);
    } catch (e) { window.alert(e.message); }
  }

  async function postComment(box, post) {
    const w = box.querySelector('.cmt-warn');
    w.textContent = '';
    const content = box.querySelector('.cmt-input').value.trim();
    const nickname = box.querySelector('.cmt-nick').value.trim().slice(0, 24);
    if (!content) { w.textContent = '评论内容不能为空'; return; }
    if (content.length > 250) { w.textContent = '评论最多 250 字'; return; }
    const hitWords = sensitiveHits(content).concat(sensitiveHits(nickname));
    if (hitWords.length) {
      w.textContent = '⚠️ 评论存在敏感词（' + hitWords.map((x) => '“' + x + '”').join('、') + '），不得发布。';
      return;
    }
    const btn = box.querySelector('.cmt-submit');
    btn.disabled = true;
    try {
      await callEdge('comment_create', {
        token: state.user.token || '', post_id: post.id, parent_id: box._replyTo || null, nickname, content
      });
      box._replyTo = null;
      box.querySelector('.cmt-target').textContent = '';
      box.querySelector('.cmt-target').classList.remove('on');
      box.querySelector('.cmt-input').value = '';
      box.querySelector('.cmt-count').textContent = '0/250';
      await loadComments(box, post);
      const toggle = box.closest('.post-card').querySelector('.cmt-toggle');
      const num = toggle.querySelector('.cmt-num');
      num.textContent = formatCount((parseInt(num.textContent.replace('+', ''), 10) || 0) + 1);
    } catch (e) {
      w.textContent = '发布失败：' + e.message;
    }
    btn.disabled = false;
  }

  // ---------------- 渐入渐出 ----------------
  function observeReveal(root) {
    if (!('IntersectionObserver' in window)) {
      root.querySelectorAll('.post-card').forEach((c, i) => {
        c.style.transitionDelay = Math.min(i * 45, 300) + 'ms';
        setTimeout(() => c.classList.add('in'), 20);
      });
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.06 });
    root.querySelectorAll('.post-card').forEach((c) => io.observe(c));
  }

  // ---------------- 数据加载 ----------------
  function currentQueryBase() {
    let q = supabase.from('forum_posts')
      .eq('reviewed', true).eq('blocked', false);
    if (state.activeTopic) q = q.eq('topic', state.activeTopic);
    return q;
  }
  let floorCounter = 0;
  async function countTotal() {
    const q = currentQueryBase();
    const { count, error } = await q.select('*', { count: 'exact', head: true });
    if (error) return 0;
    return count || 0;
  }
  async function loadPinned() {
    try {
      let q = supabase.from('forum_pinned_posts').select('*').eq('blocked', false)
        .order('pinned_at', { ascending: false });
      if (state.activeTopic) q = q.eq('topic', state.activeTopic);
      const { data } = await q;
      els.pinnedFeed.innerHTML = '';
      const authorMap = await resolveAuthors(data || []);
      const cards = (data || []).map((p) => makeCard(p, { pinned: true, authorMap }));
      cards.forEach((c) => els.pinnedFeed.appendChild(c));
      els.pinnedSection.classList.toggle('hidden', !cards.length);
      observeReveal(els.pinnedFeed);
    } catch (_e) { /* ignore */ }
  }

  async function loadFeed() {
    els.viewTitle.style.display = 'none';
    els.searchBanner.classList.add('hidden');
    els.emptyState.classList.add('hidden');

    let rows = [];
    if (state.mode === 'search') {
      els.viewTitle.style.display = '';
      els.viewTitle.textContent = `🔍 搜索：“${state.keyword}”`;
      if (state.activeTopic) { els.viewTitle.textContent += ` · ${state.activeTopic}`; }
      els.pager.classList.add('hidden');
      try { rows = await callEdge('search_posts', { keyword: state.keyword }); }
      catch (_e) { rows = []; }
    } else if (state.mode === 'favorites') {
      els.viewTitle.style.display = '';
      els.viewTitle.textContent = '⭐ 我的收藏';
      els.pager.classList.add('hidden');
      try {
        const list = await callEdge('favorite_list', { token: state.user.token });
        rows = (list || []).map((f) => f.post);
      } catch (_e) { rows = []; }
    } else if (state.mode === 'mine') {
      els.viewTitle.style.display = '';
      els.viewTitle.textContent = '📄 我的帖子';
      els.pager.classList.add('hidden');
      try {
        const { data } = await supabase.from('forum_posts')
          .select('*').eq('author_id', myId()).eq('reviewed', true).eq('blocked', false)
          .order('created_at', { ascending: false }).limit(100);
        rows = data || [];
      } catch (_e) { rows = []; }
    } else if (state.mode === 'history') {
      els.viewTitle.style.display = '';
      els.viewTitle.textContent = '🕘 我的浏览历史';
      els.pager.classList.add('hidden');
      try {
        const list = await callEdge('history_list', { token: state.user.token });
        rows = (list || []).map((h) => h.post);
      } catch (_e) { rows = []; }
      if (!rows.length) {
        els.emptyState.classList.remove('hidden');
        els.emptyState.innerHTML = `<div class="emoji">🕘</div>还没有浏览历史，打开一条帖子的评论就会记录`;
        return;
      }
    } else {
      // feed（最新 / 最热）
      const start = (state.page - 1) * PAGE_SIZE;
      let q = currentQueryBase();
      if (state.sort === 'hot') q = q.order('hot_score', { ascending: false });
      else q = q.order('created_at', { ascending: false });
      q = q.range(start, start + PAGE_SIZE - 1);
      const [listResult, totalCount] = await Promise.all([q, countTotal()]);
      rows = listResult.data || [];
      state.totalCount = totalCount;
      state.totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
      els.pager.classList.remove('hidden');
      els.pageNum.textContent = `第 ${state.page} / ${state.totalPages} 页 · 共 ${totalCount} 条`;
      $('prevPage').disabled = state.page <= 1;
      $('nextPage').disabled = state.page >= state.totalPages;
    }

    els.feed.innerHTML = '';
    if (!rows.length) {
      els.emptyState.classList.remove('hidden');
      if (state.mode === 'search') {
        els.emptyState.innerHTML = `<div class="emoji">🔍</div>没有找到“${escapeHtml(state.keyword)}”相关的内容`;
      }
      els.pager.classList.add('hidden');
      return;
    }
    const authorMap = await resolveAuthors(rows);
    floorCounter = 0;
    rows.forEach((p) => { floorCounter++; els.feed.appendChild(makeCard(p, { authorMap, floor: floorCounter })); });
    observeReveal(els.feed);
  }

  // ---------------- 筛选 / 排序 ----------------
  function renderFilterBar() {
    const chips = ['全部', ...TOPICS];
    els.filterBar.innerHTML = '';
    chips.forEach((t) => {
      const b = document.createElement('button');
      b.className = 'chip' + ((state.activeTopic === t || (t === '全部' && !state.activeTopic)) ? ' active' : '');
      b.textContent = t;
      b.addEventListener('click', () => {
        state.activeTopic = t === '全部' ? '' : t;
        state.page = 1;
        renderFilterBar();
        loadPinned();
        loadFeed();
      });
      els.filterBar.appendChild(b);
    });
  }
  function bindSort() {
    els.sortTabs.querySelectorAll('.chip').forEach((b) => {
      b.addEventListener('click', () => {
        els.sortTabs.querySelectorAll('.chip').forEach((x) => x.classList.remove('active'));
        b.classList.add('active');
        state.sort = b.dataset.sort;
        state.page = 1;
        loadFeed();
      });
    });
  }

  // ---------------- 搜索 ----------------
  function runSearch() {
    const kw = els.searchInput.value.trim();
    if (!kw) return;
    state.keyword = kw;
    state.mode = 'search';
    els.searchBanner.classList.remove('hidden');
    els.searchBanner.innerHTML = `
      <span>正在浏览「${escapeHtml(kw)}」的搜索结果</span>
      <button class="kill" id="backToAll">返回全部</button>`;
    els.searchBanner.querySelector('#backToAll').addEventListener('click', backToAll);
    loadFeed();
  }
  function backToAll() {
    state.mode = 'feed'; state.keyword = ''; state.page = 1;
    els.searchInput.value = '';
    els.searchClear.style.display = 'none';
    els.searchBanner.classList.add('hidden');
    loadPinned(); loadFeed();
  }
  els.searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') runSearch();
    els.searchClear.style.display = els.searchInput.value ? 'block' : 'none';
  });
  els.searchInput.addEventListener('input', () => {
    els.searchClear.style.display = els.searchInput.value ? 'block' : 'none';
  });
  els.searchClear.addEventListener('click', () => { els.searchInput.value = ''; els.searchClear.style.display = 'none'; });

  // ---------------- 收藏 / 我的 视图 ----------------
  function showFavorites() {
    if (!loggedIn()) { openUserModal(); return; }
    state.mode = 'favorites'; state.page = 1; loadFeed();
  }
  function showMyPosts() {
    if (!loggedIn()) { openUserModal(); return; }
    state.mode = 'mine'; state.page = 1; loadFeed();
  }
  function showHistory() {
    if (!loggedIn()) { openUserModal(); return; }
    state.mode = 'history'; state.page = 1; loadFeed();
  }
  // 记录浏览历史（登录用户点开某条帖子的评论/跳转时）
  async function recordHistory(postId) {
    if (!loggedIn() || !postId) return;
    try { await callEdge('history_add', { token: state.user.token, post_id: postId }); } catch (_e) {}
  }

  // ---------------- 榜单 ----------------
  async function loadLeaderboard() {
    try {
      const list = await callEdge('leaderboard_week', {});
      if (!list || !list.length) { els.weekHot.innerHTML = '<div class="notif-empty">本周暂无热帖</div>'; }
      else {
        els.weekHot.innerHTML = list.map((p, i) => `
          <div class="leader-item" data-id="${p.id}">
            <span class="leader-rank">${i + 1}</span>
            <div class="leader-main">
              <div class="leader-title">${escapeHtml(p.content.slice(0, 28))}${p.content.length > 28 ? '…' : ''}</div>
              <div class="leader-meta">${escapeHtml(p.nickname || '匿名')} · ${formatCount(p.like_count)} 👍 · ${formatCount(p.comment_count)} 💬</div>
            </div>
          </div>`).join('');
        els.weekHot.querySelectorAll('.leader-item').forEach((el) => {
          el.addEventListener('click', () => scrollToPost(el.dataset.id));
        });
      }
    } catch (_e) { els.weekHot.innerHTML = '<div class="notif-empty">暂无数据</div>'; }
    try {
      const dist = await callEdge('leaderboard_topic', {});
      els.topicAct.innerHTML = (dist || []).map((d) => `
        <div class="topicact-link"><span>${escapeHtml(d.topic)}</span><span class="topicact-count">${d.count} 帖</span></div>`
      ).join('') || '<div class="notif-empty">本周暂无话题</div>';
    } catch (_e) { /* ignore */ }
  }

  // ---------------- 发布 ----------------
  function renderTopicSelect() {
    els.topicSelect.innerHTML = '';
    TOPICS.forEach((t) => {
      const o = document.createElement('option');
      o.value = t; o.textContent = t + (t === '吃瓜' ? '（最多5000字·需审核）' : '');
      els.topicSelect.appendChild(o);
    });
    updateCharCount();
  }
  function updateCharCount() {
    const limit = topicLimit(els.topicSelect.value);
    const len = els.content.value.length;
    const cl = els.charCount;
    cl.textContent = `${len} / ${limit}`;
    cl.classList.toggle('warn', len > limit * 0.85 && len <= limit);
    cl.classList.toggle('full', len > limit);
    return limit;
  }

  async function publish() {
    const topic = els.topicSelect.value;
    const content = els.content.value.trim();
    const nickname = els.nickname.value.trim().slice(0, 24);
    const limit = topicLimit(topic);
    const warn = els.composeWarn;
    const basePayload = () => ({ token: state.user.token || '', topic, nickname, content });
    const onSuccess = async (msg) => {
      els.content.value = '';
      if (els.nickname && !loggedIn()) els.nickname.value = '';
      updateCharCount();
      els.composeHint.textContent = msg;
      if (state.activeTopic && state.activeTopic !== topic) { state.activeTopic = ''; renderFilterBar(); }
      state.page = 1;
      await Promise.all([loadPinned(), loadFeed()]);
      if (state.mode === 'mine') loadFeed();
    };

    els.composeHint.textContent = '';
    if (!content) { warn.textContent = '内容不能为空'; return; }
    if (content.length > limit) { warn.textContent = `内容超出${limit}字上限`; return; }
    const hitWords = sensitiveHits(content).concat(sensitiveHits(nickname));
    if (hitWords.length) {
      warn.textContent = '⚠️ 发布内容存在敏感词（' + hitWords.map((x) => '“' + x + '”').join('、') + '），不得发布。';
      els.content.classList.add('bad');
      return;
    }
    els.content.classList.remove('bad');

    // 匿名发布：走防刷验证码（登录用户跳过）
    if (!loggedIn()) {
      let cap;
      try { cap = await callEdge('captcha_new', {}); } catch (_e) {}
      if (cap && cap.id) {
        const ans = window.prompt('防刷验证：请输入计算结果\n' + cap.question + '\n（匿名发布需要，登录后可免）');
        if (ans == null) { warn.textContent = '已取消防刷验证，未发布'; return; }
        const num = parseInt(String(ans).trim(), 10);
        if (!Number.isFinite(num)) { warn.textContent = '请输入正确的数字'; return; }
        els.publish.disabled = true;
        warn.textContent = '';
        try {
          await callEdge('post_create', { ...basePayload(), captcha_id: cap.id, captcha_ans: num });
          await onSuccess(topic === '吃瓜'
            ? '✅ 已在「吃瓜」板块发布，内容提交成功后将由管理员审核后公开展示。' : '✅ 发布成功');
        } catch (e) {
          warn.textContent = '发布失败：' + (e.message || '未知错误');
        } finally { els.publish.disabled = false; }
        return;
      }
    }

    els.publish.disabled = true;
    warn.textContent = '';
    try {
      const res = await callEdge('post_create', basePayload());
      if (res && res.need_captcha) { warn.textContent = '防刷验证暂不可用，请刷新后重试'; els.publish.disabled = false; return; }
      await onSuccess(topic === '吃瓜'
        ? '✅ 已在「吃瓜」板块发布，内容提交成功后将由管理员审核后公开展示。' : '✅ 发布成功');
    } catch (e) {
      warn.textContent = '发布失败：' + (e.message || '未知错误');
    } finally {
      els.publish.disabled = false;
    }
  }

  // ---------------- 实时更新 ----------------
  let reloading = false;
  function scheduleReload() {
    if (reloading) return;
    reloading = true;
    setTimeout(() => { reloading = false; loadPinned(); loadFeed(); }, 2000);
  }
  function subscribeRealtime() {
    if (state.channel) return;
    const ch = supabase.channel('public-forum')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'forum_posts' }, () => { scheduleReload(); })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'forum_comments' }, (payload) => {
        const row = payload.new;
        const card = document.querySelector(`article[data-id="${row.post_id}"]`);
        if (!card) return;
        const num = card.querySelector('.cmt-toggle .cmt-num');
        if (num) num.textContent = formatCount((parseInt(num.textContent.replace('+', ''), 10) || 0) + 1);
        const box = card.querySelector('[data-cmtbox]');
        if (box && !box.classList.contains('hidden') && box.dataset.loaded) {
          const post = { id: row.post_id };
          loadComments(box, post);
        }
      })
      .subscribe();
    state.channel = ch;
  }

  // ---------------- 管理员登录 / 注册 ----------------
  function openAdminModal(mode) {
    els.adminModal.classList.remove('hidden');
    els.loginError.textContent = '';
    els.regError.textContent = '';
    els.adminFormLogin.classList.toggle('hidden', mode !== 'login');
    els.adminFormRegister.classList.toggle('hidden', mode !== 'register');
    els.adminModalTitle.textContent = mode === 'login' ? '管理员登录' : '注册管理员';
  }
  function onOpenAdmin() {
    try { if (localStorage.getItem(ADMIN_TOKEN_KEY)) { location.href = 'admin.html'; return; } } catch (_e) {}
    openAdminModal('login');
  }
  $('openAdmin').addEventListener('click', onOpenAdmin);
  $('closeModal').addEventListener('click', () => els.adminModal.classList.add('hidden'));
  $('closeModal2').addEventListener('click', () => els.adminModal.classList.add('hidden'));
  $('switchToRegister').addEventListener('click', () => openAdminModal('register'));
  $('switchToLogin').addEventListener('click', () => openAdminModal('login'));
  els.adminModal.addEventListener('click', (e) => { if (e.target === els.adminModal) els.adminModal.classList.add('hidden'); });
  async function doLogin() {
    const username = els.loginUser.value.trim();
    const password = els.loginPass.value;
    els.loginError.textContent = '';
    if (!username || !password) { els.loginError.textContent = '请输入账号和密码'; return; }
    els.loginBtn.disabled = true;
    try {
      const data = await callEdge('admin_login', { username, password });
      localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
      localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(data));
      location.href = 'admin.html';
    } catch (e) { els.loginError.textContent = e.message; els.loginBtn.disabled = false; }
  }
  async function doRegister() {
    const class_name = els.regClass.value.trim();
    const name = els.regName.value.trim();
    const username = els.regUser.value.trim();
    const password = els.regPass.value;
    els.regError.textContent = '';
    if (!class_name || !name || !username) { els.regError.textContent = '请填写班级、姓名、账号'; return; }
    if (password.length < 6) { els.regError.textContent = '密码至少 6 位'; return; }
    els.registerBtn.disabled = true;
    try {
      await callEdge('admin_register', { class_name, name, username, password });
      els.regError.textContent = '✅ 申请已提交，请等待创始人审核通过后即可登录。';
    } catch (e) { els.regError.textContent = e.message; els.registerBtn.disabled = false; }
  }
  els.loginBtn.addEventListener('click', doLogin);
  els.registerBtn.addEventListener('click', doRegister);
  els.loginPass.addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });
  els.loginUser.addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });

  // ---------------- 事件绑定 ----------------
  els.topicSelect.addEventListener('change', updateCharCount);
  els.content.addEventListener('input', () => { updateCharCount(); els.composeWarn.textContent = ''; els.content.classList.remove('bad'); });
  els.publish.addEventListener('click', publish);
  $('prevPage').addEventListener('click', () => {
    if (state.page > 1) { state.page--; loadFeed(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  });
  $('nextPage').addEventListener('click', () => {
    if (state.page < state.totalPages) { state.page++; loadFeed(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  });

  // ---------------- 启动 ----------------
  function init() {
    readAdminSession();
    readUserSession();
    state.likedSet = getLikedSet();
    renderTopicSelect();
    renderFilterBar();
    bindSort();
    renderUserBar();
    loadSiteStatus();
    loadPopups();
    loadPinned();
    loadFeed();
    loadLeaderboard();
    if (loggedIn()) loadFavIds();
    subscribeRealtime();
    if (unreadTimer) clearInterval(unreadTimer);
    unreadTimer = setInterval(refreshUnread, 60000);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();