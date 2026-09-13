/* ============================================================
   XDD吧 · 前端逻辑（公共级论坛）
   功能：发布/话题筛选/排序/搜索/榜单 / 普通用户注册登录 / 作者内容管理 /
        收藏 / 通知中心 / 举报 / 评论楼层·只看楼主 / 实时更新 / 管理入口 / 主题
   ============================================================ */
(function () {
  'use strict';

  const SUPABASE_URL = 'https://jgezpvmlnhycxslqbwcx.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_B29ClgwZagW32Ow5x6VdKQ_IL65F7dl';
  const EDGE_URL = `${SUPABASE_URL}/functions/v1/newtheba`;

  const TOPICS = ['闲聊', '社团活动', '食堂', '宿舍', '学习', '吃瓜', '失物招领'];
  // 用户自建话题（加载自后端 topics_list）：{display_name, is_permanent, ...}
  let customTopics = [];
  const NEW_TOPIC = '__new_topic__';
  let lbPeriod = 'week'; // 热榜档位：today | week | month
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
    composerPriv: $('composerPriv'), scheduleAt: $('scheduleAt'), minViewLevel: $('minViewLevel'), privHint: $('privHint'),
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
  // 敏感词命中：只有内容中出现与词库“整个词条”完全一致的连续子串才命中（不做字符级/局部匹配）。
  // 若命中词被 SAFE_WORDS 里的某个豁免词完整包含（如单字“奶”被“牛奶”包含），则不算命中，避免误伤正常词。
  const SAFE_WORDS = ['牛奶', '奶茶', '奶酪', '奶牛', '酸奶', '奶粉', '奶昔', '奶嘴', '奶妈', '奶奶', '奶油', '蜜奶'] // 可按需增删
  function sensitiveHits(text) {
    if (!text) return [];
    const words = window.NEWTHEBA_SENSITIVE_WORDS || [];
    const found = [];
    const lower = String(text).toLowerCase();
    for (const w of words) {
      const s = String(w || '').trim();
      if (!s) continue;
      const sl = s.toLowerCase();
      if (!lower.includes(sl)) continue;
      // 若该命中词被某个“更长”的豁免词完整包裹，则认为属于正常用词，不判定违规
      // （如单字“奶”被“牛奶”包含则豁免；但敏感词若本身是“牛奶”，不会被豁免）
      if (SAFE_WORDS.some((sw) => sw.length > s.length && sw.includes(s) && lower.includes(sw.toLowerCase()))) continue;
      if (found.indexOf(s) === -1) found.push(s);
    }
    return found;
  }
  function formatCount(n) {
    n = Number(n) || 0;
    return n > 9999 ? '9999+' : String(n);
  }
  // 等级：经验 = 发帖*2 + 评论 + 获赞 + 助推 + 签到；线性升级：升到下一级需 24×当前等级 经验，上限 60
  const LEVEL_TIERS = [
    { max: 10, name: '初来乍到' }, { max: 20, name: '校园萌新' }, { max: 35, name: '校园百事通' },
    { max: 45, name: '风云学长' }, { max: 54, name: '校园传说' }, { max: 60, name: '校史留名' }
  ];
  function xpOf(u) {
    return (Number(u && u.post_count) || 0) * 2 + (Number(u && u.comment_count) || 0) + (Number(u && u.like_received) || 0)
      + (Number(u && u.col_post_count) || 0) * 2 + (Number(u && u.col_comment_count) || 0) + (Number(u && u.col_like_received) || 0)
      + (Number(u && u.bonus_xp) || 0) + (Number(u && u.checkin_xp) || 0);
  }
  function cumMin(L) { return 12 * L * (L - 1); } // 达到 L 级所需累计经验（累加 24*i）
  function levelOf(u) {
    const xp = xpOf(u);
    if (xp <= 0) return 1;
    return Math.min(60, Math.floor((1 + Math.sqrt(1 + xp / 3)) / 2));
  }
  // 管理员设定了固定等级(level>0)时优先采用，否则按经验自动计算
  function finalLevel(u) {
    const f = Number(u && u.level) || 0;
    return f > 0 ? Math.min(60, f) : levelOf(u);
  }
  function levelName(lv) {
    for (const t of LEVEL_TIERS) if (lv <= t.max) return t.name;
    return '校史留名';
  }
  // 等级特权前端镜像（与后端 PRIV_TIERS 一致，用于决定是否展示特权 UI）
  const PRIV_TIER_RULE = [
    { max: 10, priv: {} },
    { max: 20, priv: {} },
    { max: 35, priv: { topic96: true } },
    { max: 45, priv: { sched: true, lightfx: true, lvlgate: true, pinComment: 2 } },
    { max: 54, priv: { sched: true, lightfx: true, lvlgate: true, pinComment: 2, recommend: 3 } },
    { max: 60, priv: { sched: true, lightfx: true, lvlgate: true, pinComment: 2, recommend: 3, elite: true } }
  ];
  function privOf(lv) { for (const t of PRIV_TIER_RULE) if (lv <= t.max) return t.priv; return PRIV_TIER_RULE[5].priv; }
  function myPriv() { return loggedIn() ? privOf(finalLevel(state.user.profile)) : {}; }
  function myLevelNow() { return loggedIn() ? finalLevel(state.user.profile) : 1; }
  function levelInfo(u) {
    const fixed = Number(u && u.level) > 0;
    const level = finalLevel(u);
    const xp = xpOf(u);
    const maxed = level >= 60;
    let progress, nextNeed;
    if (fixed || maxed) { progress = 1; nextNeed = 0; }
    else {
      const span = 24 * level; // 升到下一级需 24×当前等级 经验
      const inLevel = xp - cumMin(level);
      progress = Math.min(1, Math.max(0, inLevel / span));
      nextNeed = Math.max(0, span - inLevel);
    }
    return { level, name: levelName(level), xp, progress, nextNeed, hi: xp, fixed, maxed };
  }
  function userDisplay(u) { return u && (u.nickname || u.username) ? (u.nickname || u.username) : '匿名'; }
  // 发帖/评论旁展示用户称号徽标
  function levelBadgeHtml(author) {
    const lv = author && author.level ? Number(author.level) || 0 : 0;
    if (!lv) return '';
    const name = levelName(lv);
    return `<span class="author-level" title="Lv.${lv} · ${escapeHtml(name)}">${escapeHtml(name)}</span>`;
  }

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
      catch (_e) { return; } // 网络异常静默，下轮再试，避免打扰浏览
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

  // ---------------- 会话 ----------------
  function readAdminSession() {
    try { state.session = { token: localStorage.getItem(ADMIN_TOKEN_KEY) }; } catch (_e) {}
  }
  // 若浏览器存有管理员会话，则拉取其权限，用于主页展示快捷管理按钮
  async function loadAdminPerms() {
    state.adminPerms = null;
    try {
      const tok = state.session && state.session.token;
      if (!tok) return;
      const p = await callEdge('whoami', { token: tok });
      if (p && p.perms) state.adminPerms = p.perms;
    } catch (_e) { state.adminPerms = null; }
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

  // 登录用户不允许自定义昵称：直接显示/使用用户名，隐藏匿名昵称框
  function updateComposerIdentity() {
    const nick = els.nickname;
    if (!nick) return;
    if (loggedIn()) {
      nick.style.display = 'none';
    } else {
      nick.style.display = '';
    }
  }

  // ---------------- 顶栏：用户栏 ----------------
  function renderUserBar() {
    const host = els.userBar;
    if (!host) return;
    if (!loggedIn()) {
      host.innerHTML = `<button class="btn ghost sm" id="userLoginBtn2">登录 / 注册</button>`;
      host.querySelector('#userLoginBtn2').addEventListener('click', openUserModal);
      updateComposerIdentity();
      updateComposerPrivileges();
      return;
    }
    const p = state.user.profile;
    const li = levelInfo(p);
    const lv = li.level;
    const initials = userDisplay(p).charAt(0).toUpperCase();
    host.innerHTML = `
      <div class="user-area">
        <button class="icon-btn" id="bellBtn" title="通知中心">🔔</button>
        <button class="user-chip" id="userChip">
          <span class="avatar-wrap">
            <span class="avatar" style="background:${p.avatar_color || '#e07a5f'}">${escapeHtml(initials)}</span>
            <span class="dot-badge notif-badge" id="notifBadge"></span>
          </span>
          <span class="u-name">${escapeHtml(p.nickname || p.username)}</span>
          <span class="u-level" title="经验 ${li.xp}">Lv.${lv}</span>
        </button>
        <div class="user-pop" id="userPop">
          <div class="pop-level" style="padding:12px 14px;border-bottom:1px solid var(--line,#e5e5e5);margin-bottom:6px">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
              <span style="font-weight:800;color:var(--accent,#e07a5f);font-size:17px">Lv.${li.level}</span>
              <span style="font-weight:600;font-size:14px">${escapeHtml(li.name)}</span>
              <span style="margin-left:auto;color:var(--faint,#999);font-size:12px">${li.xp} 经验</span>
            </div>
            <div style="height:6px;border-radius:99px;background:var(--line,#e5e5e5);overflow:hidden">
              <div style="height:100%;width:${Math.round(li.progress * 100)}%;background:linear-gradient(90deg,#e07a5f,#f2cc8f);border-radius:99px"></div>
            </div>
            <div style="margin-top:6px;color:var(--muted,#888);font-size:12px">${li.fixed ? '已达到管理员设定等级' : (li.maxed ? '已达最高等级 Lv.60' : `距 Lv.${li.level + 1} 还需 ${li.nextNeed} 经验`)}</div>
          </div>
          <button class="pop-item" data-act="fav">⭐ 我的收藏</button>
          <button class="pop-item" data-act="mine">📄 我的帖子</button>
          <button class="pop-item" data-act="history">🕘 浏览历史</button>
          <button class="pop-item" data-act="profile">👤 我的主页</button>
          <button class="pop-item" data-act="checkin">📅 每日签到 <span class="checkin-state" data-extra="checkin">…</span></button>
          <button class="pop-item" data-act="notif">🔔 通知中心</button>
          <div class="pop-sep"></div>
          <button class="pop-item" data-act="logout">🚪 退出登录</button>
        </div>
      </div>`;
    host.querySelector('#bellBtn').addEventListener('click', (e) => { e.stopPropagation(); location.href = 'notifications.html'; });
    host.querySelector('#userChip').addEventListener('click', (e) => { e.stopPropagation(); toggleUserPop(); });
    host.querySelector('#userPop').addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-act]');
      if (!btn) return;
      const act = btn.dataset.act;
      if (act === 'fav') showFavorites();
      else if (act === 'mine') showMyPosts();
      else if (act === 'history') showHistory();
      else if (act === 'profile') openProfile(myId());
      else if (act === 'checkin') { closePops(); await doCheckin(true); }
      else if (act === 'notif') { closePops(); location.href = 'notifications.html'; }
      else if (act === 'logout') clearUserSession();
      closePops();
    });
    renderPopExtras();
    // 点击外部关闭
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.user-area') && !e.target.closest('.notif-panel')) closePops();
    }, { once: false });
    refreshUnread();
    updateComposerIdentity();
    updateComposerPrivileges();
  }
  function toggleUserPop() { document.querySelector('#userPop')?.classList.toggle('open'); }
  function closePops() {
    document.querySelector('#userPop')?.classList.remove('open');
    if (els.notifPanel) els.notifPanel.classList.remove('open');
  }

  // ---------------- 每日签到 ----------------
  async function renderPopExtras() {
    if (!loggedIn()) return;
    const el = document.querySelector('[data-extra="checkin"]');
    let s = null;
    try { s = await callEdge('checkin_status', { token: state.user.token }); } catch (_e) { s = null; }
    if (!el) return;
    if (!s) { el.textContent = ''; return; }
    el.textContent = s.checkedToday
      ? `已签到 · 连签 ${s.checkedStreak || s.streak || 0} 天`
      : (s.checkedStreak > 0 ? `签到 +${s.rewardToday}（连签中）` : `今日可签到 +1`);
  }
  async function doCheckin(showAlert) {
    if (!loggedIn()) { openUserModal(); return; }
    let s = null;
    try { s = await callEdge('checkin_status', { token: state.user.token }); } catch (_e) { s = null; }
    if (s && s.checkedToday) {
      if (showAlert) window.alert(`今日已签到，连签 ${s.checkedStreak || s.streak || 0} 天。`);
      return;
    }
    try {
      const r = await callEdge('checkin', { token: state.user.token });
      renderUserBar(); refreshUnread();
      if (showAlert) window.alert(`签到成功！连续签到 ${r.streak} 天，获得 ${r.gained} 点经验。`);
    } catch (e) { if (showAlert) window.alert(e.message); }
  }

  // ---------------- 个人主页 ----------------
  const PROFILE_FIELDS = [
    { key: 'contact', label: '联系方式' }, { key: 'gender', label: '性别' },
    { key: 'class_name', label: '班级' }, { key: 'real_name', label: '姓名' },
    { key: 'signature', label: '个性签名' }, { key: 'bio', label: '简介' }
  ];
  async function openProfile(targetId) {
    if (!targetId) { if (loggedIn()) targetId = myId(); else { openUserModal(); return; } }
    profileModalOpenId = targetId;
    const overlay = document.createElement('div');
    overlay.className = 'profile-mask';
    overlay.innerHTML = `<div class="profile-card" data-pid="pcard">
      <div class="profile-card-head"><span class="profile-loading">正在加载主页…</span><button class="profile-close">×</button></div>
      <div class="profile-card-body">加载中…</div>
    </div>`;
    overlay.querySelector('.profile-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
    let data = null;
    try { data = await callEdge('profile_get', { token: state.user.token || '', user_id: targetId }); }
    catch (_e) { /* ignore */ }
    const body = overlay.querySelector('.profile-card-body');
    if (!data) { body.innerHTML = '<div style="padding:30px;text-align:center;color:var(--muted)">主页加载失败</div>'; return; }
    body.innerHTML = renderProfile(data);
    body.querySelectorAll('[data-pact]').forEach((b) => b.addEventListener('click', () => { const ps = state.user.profile; renderProfileInto(body, data); }));
    if (data.canEdit) bindProfileEdit(body, data, overlay);
  }
  let profileModalOpenId = null;
  function renderProfile(data) {
    if (data.locked) {
      return `<div style="padding:34px 24px;text-align:center">
        <div style="font-size:40px">🔒</div>
        <div style="margin:10px 0 4px;font-weight:700;color:var(--text)">${escapeHtml(data.user.nickname)}</div>
        <div style="color:var(--muted)">TA 的主页暂不对访客开放</div>
      </div>`;
    }
    const u = data.user || {};
    const p = data.profile || {};
    const nick = u.nickname || u.username || '';
    const title = levelName(u.level);
    const tagChips = (p.tags && p.tags.length)
      ? p.tags.map((t) => `<span class="profile-tag">${escapeHtml(t)}</span>`).join('')
      : '<span style="color:var(--faint)">暂无标签</span>';
    const rows = PROFILE_FIELDS.map((f) => {
      const showIt = data.canEdit || data.isAdmin || p.flags[f.key] !== false;
      const val = p[f.key];
      if (!data.canEdit && !data.isAdmin && !showIt) return '';
      if (!val) return '';
      return `<div class="profile-row"><span class="profile-row-label">${f.label}</span><span class="profile-row-val">${multiLine(val)}</span></div>`;
    }).join('');
    return `<div class="profile-cview">
      <div class="profile-avatar" style="background:${(state.user.profile && myId() === u.id) ? (state.user.profile.avatar_color || '#e07a5f') : '#e07a5f'}">${escapeHtml((nick || '?').charAt(0).toUpperCase())}</div>
      <div class="profile-mid">
        <div class="profile-nick">${escapeHtml(nick)}<span class="author-level" style="vertical-align:middle">${escapeHtml(title)} Lv.${u.level}</span></div>
        ${u.post_count != null ? `<div class="profile-stats">📄 ${u.post_count} 帖 · 💬 ${u.comment_count} 评论 · 👍 ${u.like_received} 赞</div>` : ''}
      </div>
      ${data.canEdit ? `<button class="profile-editbtn" data-act="edit">✏️ 编辑主页</button>` : ''}
      <div class="profile-tags">${tagChips}</div>
      <div class="profile-rows">${rows || '<div style="color:var(--faint);font-size:12px;padding:8px 0">TA 还没有填写可见的公开资料</div>'}</div>
      ${data.canEdit && myPriv().elite ? `<div class="prof-elite">
        <div class="pf-vis-title">🎓 校史留名特权</div>
        <button class="profile-editbtn" data-act="export">⬇️ 导出我的帖子数据</button>
        <button class="profile-editbtn" data-act="column">📚 申请个人专栏</button>
        <button class="profile-editbtn" data-act="cert">🎓 毕业纪念证书</button>
      </div>` : ''}
      ${data.canEdit ? `<div style="margin-top:8px;font-size:11px;color:var(--faint)">只能在个人中心（右上角头像 → 我的主页）编辑自己的信息。提示：敏感词会在提交前本地拦截。</div>` : ''}
    </div>`;
  }
  function visibilityFor(p, label, val, data) { void p; void label; void val; void data; return ''; }
  function multiLine(s) { return String(s || '').replace(/\n/g, '<br>'); }
  function renderProfileInto(body, data) { body.innerHTML = renderProfile(data); }
  function profileFieldHtml(p) {
    return PROFILE_FIELDS.map((f) => {
      const val = p ? (p[f.key] || '') : '';
      return `<label class="pf-label">${f.label}<input class="pf-input" data-pf="${f.key}" value="${escapeHtml(String(val).replace(/"/g, '&quot;'))}"></label>`;
    }).join('');
  }
  function bindProfileEdit(body, data, overlay) {
    const editBtn = body.querySelector('[data-act="edit"]');
    if (editBtn) editBtn.addEventListener('click', () => { renderProfileEdit(body, data); });
    const exp = body.querySelector('[data-act="export"]');
    if (exp) exp.addEventListener('click', async () => {
      try {
        const d = await callEdge('export_posts', { token: state.user.token });
        const rows = [...(d.posts || []), ...(d.pinned || [])]
          .map((x) => `[${x.topic}]${x.nickname ? ' @' + x.nickname : ''} ${x.created_at ? new Date(x.created_at).toLocaleString() : ''}\n${x.content}`)
          .join('\n\n────────────────────────\n\n');
        const blob = new Blob([rows || '暂无帖子数据'], { type: 'text/plain;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = '我的帖子数据导出.txt';
        a.click();
        URL.revokeObjectURL(a.href);
      } catch (e) { window.alert(e.message); }
    });
    const col = body.querySelector('[data-act="column"]');
    if (col) col.addEventListener('click', async () => {
      try { const r = await callEdge('column_request', { token: state.user.token }); window.alert(r.message); }
      catch (e) { window.alert(e.message); }
    });
    const cert = body.querySelector('[data-act="cert"]');
    if (cert) cert.addEventListener('click', async () => {
      try {
        const r = await callEdge('certificate', { token: state.user.token });
        const w = window.open('', '_blank');
        if (w) { w.document.write(r.cert); w.document.close(); }
      } catch (e) { window.alert(e.message); }
    });
  }
  function renderProfileEdit(body, data) {
    const p = data.profile || {};
    const currentTags = Array.isArray(p.tags) ? p.tags : [];
    body.innerHTML = `<div class="profedit">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
        <span style="font-weight:700;color:var(--text)">编辑个人主页</span>
        <label style="display:flex;align-items:center;gap:4px;color:var(--muted);font-size:12px">
          <input type="checkbox" data-pf="page_open" ${p.page_open !== false ? 'checked' : ''}> 允许他人访问
        </label>
      </div>
      <label class="pf-label">昵称（改名后历史帖子/评论同步生效）<input class="pf-input" data-nick maxlength="24" value="${escapeHtml((data.user && data.user.nickname) || '')}"></label>
      <div class="pf-grid">
        ${profileFieldHtml(p)}
      </div>
      <label class="pf-label">标签（最多 7 个，用逗号分隔）<input class="pf-input" data-pf="tags" value="${escapeHtml(currentTags.join('，'))}"></label>
      <div style="margin:16px 0 4px;border-top:1px solid var(--line);padding-top:12px">
        <div style="font-weight:700;color:var(--text);font-size:13px">修改登录密码</div>
        <div style="color:var(--faint);font-size:11px;margin:4px 0 8px">改名后登录账号已变为你的昵称，请妥善保管新密码</div>
        <label class="pf-label">原密码<input class="pf-input" type="password" data-pwd-old></label>
        <label class="pf-label">新密码（至少 6 位）<input class="pf-input" type="password" data-pwd-new></label>
        <label class="pf-label">确认新密码<input class="pf-input" type="password" data-pwd-confirm></label>
        <div class="pf-err" data-pwd-error></div>
        <button class="profile-editbtn" data-pwd-save>修改密码</button>
      </div>
      <div class="pf-vis">
        <div class="pf-vis-title">每一项是否对他人可见</div>
        ${(['contact', 'gender', 'class_name', 'real_name', 'signature', 'bio', 'tags']).map((k) => {
          const label = { contact: '联系方式', gender: '性别', class_name: '班级', real_name: '姓名', signature: '个性签名', bio: '简介', tags: '标签' }[k];
          const val = p && p.flags ? p.flags[k] : true;
          return `<label style="display:flex;align-items:center;gap:4px;color:var(--muted);font-size:12px"><input type="checkbox" data-pf="show_${k}" ${val === false ? '' : 'checked'}> ${label}</label>`;
        }).join('')}
      </div>
      <div style="display:flex;gap:8px;margin-top:14px">
        <button class="profile-editbtn" data-save>保存</button>
        <button class="profile-editbtn" data-back>返回</button>
      </div>
      <div class="pf-err" data-pf-error></div>
    </div>`;
    body.querySelector('[data-back]').addEventListener('click', () => renderProfileInto(body, data));
    const pwdErr = body.querySelector('[data-pwd-error]');
    const pwdBtn = body.querySelector('[data-pwd-save]');
    if (pwdBtn) pwdBtn.addEventListener('click', async () => {
      const oldP = (body.querySelector('[data-pwd-old]')?.value || '').trim();
      const newP = body.querySelector('[data-pwd-new]')?.value || '';
      const cf = body.querySelector('[data-pwd-confirm]')?.value || '';
      pwdErr.textContent = ''; pwdErr.style.color = '#e05e5e';
      if (!oldP || !newP) { pwdErr.textContent = '请填写原密码和新密码'; return; }
      if (newP.length < 6) { pwdErr.textContent = '新密码至少 6 位'; return; }
      if (newP !== cf) { pwdErr.textContent = '两次输入的新密码不一致'; return; }
      pwdBtn.disabled = true;
      try {
        await callEdge('user_change_password', { token: state.user.token, old_password: oldP, new_password: newP });
        pwdErr.style.color = '#2e9e63'; pwdErr.textContent = '✅ 密码已修改，下次登录请使用新密码';
        ['data-pwd-old', 'data-pwd-new', 'data-pwd-confirm'].forEach((k) => { const el = body.querySelector('[' + k + ']'); if (el) el.value = ''; });
      } catch (e) { pwdErr.textContent = e.message; }
      finally { pwdBtn.disabled = false; }
    });
    body.querySelector('[data-save]').addEventListener('click', async () => {
      const errEl = body.querySelector('[data-pf-error]');
      const collect = () => {
        const obj = { page_open: body.querySelector('[data-pf="page_open"]').checked };
        PROFILE_FIELDS.forEach((f) => { const el = body.querySelector(`[data-pf="${f.key}"]`); if (el) obj[f.key] = el.value; });
        const tagsRaw = (body.querySelector('[data-pf="tags"]')?.value || '').split(/[,，]/).map((s) => s.trim()).filter(Boolean);
        obj.tags = tagsRaw.slice(0, 7);
        ['contact', 'gender', 'class_name', 'real_name', 'signature', 'bio', 'tags'].forEach((k) => {
          const el = body.querySelector(`[data-pf="show_${k}"]`);
          if (el) obj['show_' + k] = el.checked;
        });
        return obj;
      };
      // 本地敏感词 + 黑名单检测（不上传服务器判定）
      const payload = collect();
      const nickEl = body.querySelector('[data-nick]');
      const newNick = nickEl ? nickEl.value.trim() : '';
      const combined = Object.entries(payload).map(([k, v]) => String(v)).join(' ') + payload.tags.join(' ');
      const hits = sensitiveHits(combined).concat(newNick ? sensitiveHits(newNick) : []);
      if (hits.length) {
        errEl.textContent = `⚠️ 主页内容存在敏感词（${hits.map((h) => '"' + h + '"').join('')}），请修改后保存。`;
        errEl.style.color = '#e05e5e'; return;
      }
      try {
        const oldNick = (data.user && data.user.nickname) || '';
        if (newNick && newNick !== oldNick) {
          await callEdge('user_rename', { token: state.user.token, nickname: newNick });
          // 全局同步：本地会话、顶部用户名、帖子/评论昵称（重拉渲染，历史内容同步改名）
          if (state.user.profile) state.user.profile.nickname = newNick;
          if (state.user.profile) state.user.profile.username = newNick;
          saveUserSession();
          renderUserBar();
          await loadFeed();
          await loadPinned();
        }
        await callEdge('profile_save', { token: state.user.token, ...payload });
        window.alert('保存成功' + (newNick && newNick !== oldNick ? `（新的昵称 = 你的登录账号名：${newNick}，此后请用「${newNick}」登录；历史帖子/评论已同步）` : ''));
        openProfile(myId());
      }
      catch (e) { errEl.textContent = e.message; errEl.style.color = '#e05e5e'; }
    });
  }

  // ---------------- 通知中心（头像红点数字角标） ----------------
  let unreadTimer = null;
  async function refreshUnread() {
    if (!loggedIn()) return;
    const badge = document.querySelector('#notifBadge');
    if (!badge) return;
    try {
      const n = await callEdge('notifications_unread', { token: state.user.token });
      badge.classList.toggle('on', n > 0);
      badge.textContent = n > 99 ? '99+' : n;
    } catch (_e) {}
  }
  function scrollToPost(pid) {
    // 统一切回 feed 视图并重载（顶置帖也被 makeCard 渲染为 article，可被查找到）
    if (state.mode !== 'feed' || document.readyState !== 'complete') {
      state.mode = 'feed'; state.page = 1;
    }
    loadFeed();
    const find = () => document.querySelector(`article[data-id="${pid}"], .post-card[data-id="${pid}"]`);
    // feed 是异步加载，需等渲染后再定位；顶置帖可能延迟挂载，多次尝试
    let tried = 0;
    const t = setInterval(() => {
      tried++;
      const el = find();
      if (el) {
        // 自动展开该帖评论（相当于打开帖子页面）
        const tgl = el.querySelector('.cmt-toggle');
        const box = el.querySelector('[data-cmtbox]');
        if (tgl && box && box.classList.contains('hidden')) tgl.click();
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        clearInterval(t);
      } else if (tried > 8) {
        clearInterval(t);
      }
    }, 150);
  }
  if (els.notifClear) els.notifClear.addEventListener('click', async (e) => {
    e.preventDefault();
    try { await callEdge('notifications_mark_read', { token: state.user.token }); refreshUnread(); } catch (_e) {}
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
      saveUserSession(); renderUserBar(); closeUserModal(); loadFavIds(); syncLikedFromServer();
    } catch (e) { err.textContent = e.message; }
  });
  $('userRegBtn').addEventListener('click', async () => {
    const err = $('userRegError');
    err.textContent = '';
    const username = $('userRegName').value.trim();
    const password = $('userRegPass').value;
    if (!username) { err.textContent = '请填写用户名'; return; }
    if (password.length < 6) { err.textContent = '密码至少 6 位'; return; }
    // 注册用户名同样做敏感词检测（与发帖/昵称一致）
    const regHits = sensitiveHits(username);
    if (regHits.length) { err.textContent = '⚠️ 注册用户名存在敏感词（' + regHits.map((x) => '“' + x + '”').join('、') + '），不能使用。'; return; }
    try {
      const data = await callEdge('user_register', { username, password });
      state.user = { token: data.token, profile: data.user };
      saveUserSession(); renderUserBar(); closeUserModal(); loadFavIds(); syncLikedFromServer();
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
    els.haltTitle.textContent = site.halt_title || 'XDD吧维护中';
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

  // ---------------- 封禁状态轮询（仅提示当前登录用户） ----------------
  async function checkBanStatus() {
    if (!loggedIn()) return;
    const myIdv = myId();
    const key = 'nzb_user_ban_' + myIdv;
    let last = { seq: 0, term: false };
    try { last = JSON.parse(localStorage.getItem(key) || '{"seq":0,"term":false}'); } catch (_e) { last = { seq: 0, term: false }; }
    let st;
    try { st = await callEdge('user_ban_status', { token: state.user.token }); }
    catch (_e) { return; }
    if (st.terminated) {
      const msg = st.message || '你的账号已被永久封禁，无法使用本功能。';
      if (!last.term) {
        try { localStorage.setItem(key, JSON.stringify({ seq: st.seq || 0, term: true })); } catch (_e) {}
        renderPopup({ title: '账号已永久封禁', content: msg });
      }
      return;
    }
    const seq = st.seq || 0;
    const saved = { seq, term: false };
    if (seq !== last.seq) {
      try { localStorage.setItem(key, JSON.stringify(saved)); } catch (_e) {}
      if (st.banned) renderPopup({ title: '账号封禁提示', content: st.message || '你的账号当前被封禁，无法发帖、点赞、评论或创建话题。' });
      else renderPopup({ title: '账号已解封', content: st.message || '你的账号已解封，可正常使用各项功能。' });
    }
  }

  // ---------------- 公告栏 ----------------
  async function loadAnnouncements() {
    const panel = $('announcePanel');
    panel.innerHTML = '';
    let items = [];
    try { items = await callEdge('announce_public', {}); } catch (_e) { items = []; }
    if (!items || !items.length) { panel.classList.add('hidden'); return; }
    panel.classList.remove('hidden');
    panel.innerHTML = `
      <div class="announce-head">
        <span class="bell">📢</span>
        <span class="title">公告栏</span>
        <span class="count">${items.length} 条</span>
        <span class="caret">▼</span>
      </div>
      <div class="announce-body">
        ${items.map((a) => `
          <div class="announce-item">
            <div class="a-title">${escapeHtml(a.title)}</div>
            <div class="a-meta">${escapeHtml(a.created_at || '').slice(0, 16).replace('T', ' ')}</div>
            <div class="a-content">${escapeHtml(a.content)}</div>
          </div>`).join('')}
      </div>`;
    const head = panel.querySelector('.announce-head');
    const body = panel.querySelector('.announce-body');
    head.addEventListener('click', () => {
      const closed = head.classList.toggle('closed');
      body.classList.toggle('hidden', closed);
    });
  }

  // ---------------- Bug 反馈 ----------------
  const bugModal = $('bugModal');
  function openBugModal(focusOnMiss = false) {
    $('bugError').textContent = '';
    if (focusOnMiss) $('bugCategory').value = '关键词误屏蔽';
    bugModal.classList.remove('hidden');
    setTimeout(() => $('bugContent').focus(), 30);
  }
  $('openBugBtn').addEventListener('click', () => openBugModal(false));
  $('closeBugModal').addEventListener('click', () => bugModal.classList.add('hidden'));
  bugModal.addEventListener('click', (e) => { if (e.target === bugModal) bugModal.classList.add('hidden'); });
  $('bugSubmitBtn').addEventListener('click', async () => {
    const category = $('bugCategory').value;
    const content = $('bugContent').value.trim();
    const err = $('bugError');
    err.textContent = '';
    if (!content) { err.textContent = '请填写具体问题描述'; return; }
    $('bugSubmitBtn').disabled = true;
    try {
      await callEdge('bug_feedback_submit', { token: state.user.token || '', category, content });
      bugModal.classList.add('hidden');
      $('bugContent').value = '';
      window.alert('✅ 反馈已提交，管理员会尽快处理。感谢你的反馈！');
    } catch (e) { err.textContent = e.message; }
    $('bugSubmitBtn').disabled = false;
  });

  // 敏感词误屏蔽通用提示
  const MISBLOCK_HINT = ' 如果你认为我们误屏蔽了关键词，请在「🐞 反馈」中选「关键词误屏蔽」粘贴你的原文！';

  // 上报一次拦截记录（发帖/评论被敏感词或黑名单拦截时调用；后端按「同用户同内容」去重）
  function reportInterception(kind, content, words, nicknameVal) {
    const user = loggedIn()
      ? (state.user.profile && (state.user.profile.nickname || state.user.profile.username)) || '登录用户'
      : (nicknameVal && nicknameVal.trim()) || '匿名';
    const arr = Array.isArray(words) ? words : (words ? [String(words)] : []);
    callEdge('interception_log', { kind, user_key: user, content, words: arr }).catch(() => {});
  }

  // ---------------- 作者信息解析（id → {level}） ----------------
  async function resolveAuthors(rows) {
    const ids = Array.from(new Set((rows || []).map((p) => p.author_id).filter(Boolean)));
    const map = {};
    if (ids.length) {
      const { data } = await supabase.from('forum_users')
        .select('id, nickname, post_count, comment_count, like_received, level, bonus_xp, checkin_xp, col_post_count, col_comment_count, col_like_received').in('id', ids);
      (data || []).forEach((u) => { map[u.id] = { nickname: u.nickname || u.username || '', level: finalLevel(u) }; });
    }
    return map;
  }

  // ---------------- 卡片渲染 ----------------
  function makeCard(post, ctx = {}) {
    const cardLv = post.author_id && ctx.authorMap && ctx.authorMap[post.author_id]
      ? Number(ctx.authorMap[post.author_id].level) || 0 : 0;
    // 风云学长(36级)+ 动态光效作用于整个帖子卡片块（背景扫光）
    const lightfxCard = cardLv >= 36;
    const card = document.createElement('article');
    card.className = 'post-card' + (ctx.pinned ? ' pinned-post' : '');
    card.dataset.id = post.id;
    const isAnon = !post.nickname;
    const nickHtml = isAnon ? '<span class="anonymous">匿名</span>' : escapeHtml(post.nickname);
    let badges = ctx.pinned
      ? (ctx.boosted
        ? '<span class="badge pinned" style="background:rgba(189,147,249,.2);color:#bd93f9">推流</span>'
        : '<span class="badge pinned">置顶</span>')
      : '<span class="badge topic">' + escapeHtml(post.topic) + '</span>';
    const liked = state.likedSet.has(post.id);
    const isOwn = myId() && post.author_id === myId();
    const favOn = state.favSet.has(post.id);
    const floor = ctx.floor != null ? `<span class="post-floor">#${ctx.floor ? ctx.floor : ''}</span>` : '';
    const levelTag = cardLv ? levelBadgeHtml(ctx.authorMap[post.author_id]) : '';
    const isBoosted = !!post.boost_until && new Date(post.boost_until).getTime() > Date.now();
    const isRecommended = !!post.recommend_until && new Date(post.recommend_until).getTime() > Date.now();
    const isGold = !!post.gold_until && new Date(post.gold_until).getTime() > Date.now();
    if (isRecommended) {
      badges += '<span class="badge recommend">🏆 传说推荐</span>';
    }
    if (isGold) {
      badges += '<span class="badge" style="background:linear-gradient(135deg,#ffd76a,#cb9a2b);color:#3a2500;font-weight:700;border:1px solid rgba(255,215,120,.65);box-shadow:0 0 8px rgba(255,210,110,.45)">🪙 金牌认证</span>';
    }
    // 校史留名(55-60级)特权：淡金发光环绕边框；推荐/推流中的帖子升级为更柔和的流动高光
    const legendGold = cardLv >= 55 ? ' legend-gold-card' : '';
    const legendPrestige = cardLv >= 55 && (ctx.boosted || isBoosted || isRecommended) ? ' legend-prestige' : '';
    // 金牌认证：更高级的旋转流光边框 + 暖金辉光（区别于校史留名的呼吸辉光）
    const goldFx = isGold ? ' gold-cert-card' : '';
    card.className = 'post-card' + (ctx.pinned ? ' pinned-post' : '') + (lightfxCard ? ' lightfx-card' : '') + legendGold + legendPrestige + goldFx;
    const ownActs = isOwn
      ? `<span class="own-acts">
           ${isBoosted ? `<span class="tiny-btn" style="color:#bd93f9">推流中至${formatTime(post.boost_until).slice(5, 16)}</span>` : ''}
           ${!isBoosted ? '<button class="tiny-btn" data-act="boost" title="推流：临时顶置你的帖子">🚀 推流</button>' : ''}
           <button class="tiny-btn" data-act="edit">编辑</button>
           <button class="tiny-btn danger" data-act="del">删除</button>
         </span>` : '';
    // 已登录且有对应权限的管理员：主页快捷 屏蔽/删除/封禁
    const adminActs = state.adminPerms
      ? `<span class="admin-actions">
           ${state.adminPerms.can_block ? '<button class="act-btn adm" data-act="block" title="屏蔽帖子（首页不再显示）">🚫 屏蔽</button>' : ''}
           ${state.adminPerms.can_delete ? '<button class="act-btn adm" data-act="adm-del" title="删除帖子（移入回收站）">🗑 删除</button>' : ''}
           ${state.adminPerms.can_ban && post.author_id ? '<button class="act-btn adm" data-act="ban" title="封禁该作者 7 天">⛔ 封禁7天</button>' : ''}
           ${state.adminPerms.can_digest ? `<button class="act-btn adm" data-act="digest" data-digest="${post.digest ? 'y' : 'n'}" data-id="${post.id}" title="${post.digest ? '把帖子移出精华聚合（原帖保留在主论坛）' : '把帖子加入精华聚合'}">💎 ${post.digest ? '移出精华' : '加入精华'}</button>` : ''}
           ${state.adminPerms.can_gold ? `<button class="act-btn adm" data-act="gold" title="金牌认证：自定义顶置该帖（1-96 小时）">🪙 ${isGold ? '续期认证' : '金牌认证'}</button>` : ''}
         </span>`
      : '';
    card.innerHTML = `
      <div class="post-head">
        <span class="nickname">${isAnon ? nickHtml : `<span class="nickname-link" data-open-profile="${post.author_id || ''}">${nickHtml}${levelTag}</span>`}</span>
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
        ${!isOwn && loggedIn() && myPriv().recommend ? `<button class="act-btn rec-btn" data-act="recommend" data-id="${post.id}" title="传说推荐（顶置1h，每日${myPriv().recommend}次）">🏆 推荐</button>` : ''}
        <button class="act-btn rep-btn" data-type="post" data-id="${post.id}" title="举报">🚩</button>
        ${adminActs}
      </div>
      <div class="post-comments hidden" data-cmtbox></div>`;
    card.querySelector('.like-btn').addEventListener('click', (e) => { likePost(post, e.currentTarget); });
    card.querySelector('.cmt-toggle').addEventListener('click', () => toggleComments(card, post));
    card.querySelector('.fav-btn').addEventListener('click', (e) => toggleFav(post.id, e.currentTarget));
    card.querySelector('.rep-btn').addEventListener('click', (e) => {
      openReport(e.currentTarget.dataset.type, e.currentTarget.dataset.id);
    });
    const recBtn = card.querySelector('[data-act="recommend"]');
    if (recBtn) recBtn.addEventListener('click', () => recommendPost(post, recBtn));
    // 管理员快捷操作
    if (state.adminPerms && state.adminPerms.can_block) {
      const abk = card.querySelector('[data-act="block"]');
      if (abk) abk.addEventListener('click', () => adminBlockPost(post, abk));
    }
    if (state.adminPerms && state.adminPerms.can_delete) {
      const adel = card.querySelector('[data-act="adm-del"]');
      if (adel) adel.addEventListener('click', () => adminDeletePost(post));
    }
    if (state.adminPerms && state.adminPerms.can_ban) {
      const aban = card.querySelector('[data-act="ban"]');
      if (aban) aban.addEventListener('click', () => adminBanUser(post, aban));
    }
    if (state.adminPerms && state.adminPerms.can_digest) {
      const adig = card.querySelector('[data-act="digest"]');
      if (adig) adig.addEventListener('click', () => adminDigestToggle(post, adig));
    }
    if (state.adminPerms && state.adminPerms.can_gold) {
      const agold = card.querySelector('[data-act="gold"]');
      if (agold) agold.addEventListener('click', () => adminGoldPost(post, agold));
    }
    const profLink = card.querySelector('[data-open-profile]');
    if (profLink) profLink.addEventListener('click', () => { if (profLink.dataset.openProfile) openProfile(profLink.dataset.openProfile); else window.alert('该用户为匿名用户，无法访问个人主页'); });
    // 作者编辑/删除/推流
    if (isOwn) {
      const bBoost = card.querySelector('[data-act="boost"]');
      if (bBoost) bBoost.addEventListener('click', () => boostOwnPost(post, bBoost));
      card.querySelector('[data-act="edit"]').addEventListener('click', () => editOwnPost(card, post));
      card.querySelector('[data-act="del"]').addEventListener('click', () => deleteOwnPost(post));
    }
    return card;
  }

  // ---------------- 管理员主页快捷操作：屏蔽 / 删除 / 封禁7天 ----------------
  // 管理员快捷操作：把帖子加入/移出精华聚合
  async function adminDigestToggle(post, btn) {
    const removing = post.digest;
    if (!confirm(removing ? '把帖子移出精华聚合？原帖保留在主论坛，不受影响。' : '把帖子加入精华聚合？其评论、点赞、收藏等将与主论坛完全同步。')) return;
    btn.disabled = true;
    try {
      await callEdge(removing ? 'digest_remove' : 'digest_add', { token: state.session.token, post_id: post.id });
      loadFeed();
    } catch (err) { alert(err.message); btn.disabled = false; }
  }
  async function adminBlockPost(post, btn) {
    if (!confirm('屏蔽该帖子？原作者仍可看到，但首页不再公开显示。')) return;
    btn.disabled = true;
    try {
      await callEdge('block_post', { token: state.session.token, id: post.id, blocked: true });
      loadFeed(); loadPinned();
    } catch (e) { window.alert(e.message); btn.disabled = false; }
  }
  async function adminDeletePost(post) {
    if (!confirm('确认删除该帖子？帖子将移入回收站，可在后台恢复。')) return;
    try {
      await callEdge('delete_post', { token: state.session.token, id: post.id });
      loadFeed(); loadPinned();
    } catch (e) { window.alert(e.message); }
  }
  async function adminBanUser(post, btn) {
    if (!post.author_id) return;
    if (!confirm('确认封禁该作者 7 天？封禁期间其无法发帖/点赞/评论/创建话题。')) return;
    btn.disabled = true;
    try {
      await callEdge('admin_user_ban', { token: state.session.token, user_id: post.author_id, days: 7 });
      window.alert('已封禁该作者 7 天。');
    } catch (e) { window.alert(e.message); }
    finally { btn.disabled = false; }
  }

  // ---------------- 管理员：金牌认证（可自定义顶置 1-96 小时） ----------------
  async function adminGoldPost(post, btn) {
    const raw = window.prompt('🪙 金牌认证\n请输入自定义顶置时长（小时）：\n范围 1-96，超出会自动按 96 处理', '24');
    if (raw === null) return;
    const n = parseInt(raw, 10);
    if (isNaN(n) || n < 1) { window.alert('时长需为 1-96 的整数小时'); return; }
    const hours = Math.min(n, 96);
    if (!confirm(`确认对「${post.topic || ''}」帖子金牌认证并顶置 ${hours} 小时？`)) return;
    btn.disabled = true;
    try {
      const r = await callEdge('gold_set', { token: state.session.token, post_id: post.id, hours });
      window.alert(`🪙 金牌认证成功！该帖已顶置 ${r.hours} 小时，至 ${new Date(r.until).toLocaleString()}。`);
      loadFeed(); loadPinned();
    } catch (e) { window.alert(e.message || '操作失败'); btn.disabled = false; }
  }

  // ---------------- 等级特权：推流 / 助推 ----------------
  async function loadBoostQuota() {
    if (!loggedIn()) return null;
    try { return await callEdge('my_boosts', { token: state.user.token }); }
    catch (_e) { return null; }
  }
  async function boostOwnPost(post, btn) {
    if (!loggedIn()) { openUserModal(); return; }
    btn.disabled = true;
    try {
      const r = await callEdge('post_boost', { token: state.user.token, post_id: post.id });
      window.alert(`🚀 推流成功！你的帖子已临时顶置至 ${formatTime(r.until)}，本月剩余 ${r.remaining} 次推流。`);
      loadFeed(); loadPinned();
    } catch (e) { window.alert(e.message); }
    finally { btn.disabled = false; }
  }
  async function assistNow() {
    if (!loggedIn()) { openUserModal(); return; }
    try {
      const r = await callEdge('post_assist', { token: state.user.token });
      window.alert(`✨ 助推成功！立刻获得 ${r.gained} 点经验。`);
      loadFeed(); loadPinned(); renderUserBar();
    } catch (e) { window.alert(e.message); }
  }
  // 校园传说+：推荐他人帖子（带「传说推荐」标签，顶置1h）
  async function recommendPost(post, btn) {
    if (!loggedIn()) { openUserModal(); return; }
    if (myId() === post.author_id) { window.alert('不能推荐自己发布的帖子'); return; }
    if (btn) btn.disabled = true;
    try {
      const r = await callEdge('post_recommend', { token: state.user.token, post_id: post.id });
      window.alert(`🏆 已推荐该帖（传说推荐·顶置 1 小时）！今日剩余 ${r.remainingRecommend} 次推荐。`);
      loadPinned(); loadFeed();
    } catch (e) { window.alert(e.message); }
    finally { if (btn) btn.disabled = false; }
  }
  // 「我的帖子」顶部等级特权面板
  function renderBoostPanel(bq) {
    const tier = bq.tier || {};
    const boostTotal = Number(tier.boosts) || 0;
    const assistTotal = Number(tier.assist ? 1 : 0) || 0;
    const boostRemain = Number(bq.remaining && bq.remaining.boost) || 0;
    const assistRemain = Number(bq.remaining && bq.remaining.assist) || 0;
    const bar = (remain, total) => (!total ? 0 : Math.round((remain / total) * 100));
    const div = document.createElement('div');
    div.className = 'boost-panel';
    div.innerHTML = `
      <div class="boost-head">
        <span class="boost-tier">${escapeHtml(tier.name || '')} · Lv.${bq.level}</span>
        <span class="boost-xp">经验 ${bq.xp} · 本月剩余额度</span>
      </div>
      <div class="boost-metro">
        <div class="boost-cell">
          <div class="boost-cell-name">🚀 推流</div>
          <div class="boost-bar"><i style="width:${bar(boostRemain, boostTotal)}%"></i></div>
          <div class="boost-num">剩余 ${boostRemain} / ${boostTotal} 次</div>
          <div class="boost-hint">顶置自己的帖子 ${tier.hours ? tier.hours + 'h' : '—'}</div>
        </div>
        <div class="boost-cell">
          <div class="boost-cell-name">✨ 助推</div>
          <div class="boost-bar"><i style="width:${bar(assistRemain, assistTotal)}%"></i></div>
          <div class="boost-num">剩余 ${assistRemain} / ${assistTotal} 次</div>
          <div class="boost-hint">${tier.assistXp ? '立即 +' + tier.assistXp + ' 经验' : '当前等级暂无'}</div>
          ${assistRemain > 0 ? '<button class="tiny-btn boost-go" data-act="assist">✨ 立刻助推</button>' : ''}
        </div>
      </div>`;
    const go = div.querySelector('[data-act="assist"]');
    if (go) go.addEventListener('click', () => assistNow());
    return div;
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
    if (hits.length) { reportInterception(post.topic ? 'post' : 'comment', content, hits, null); window.alert('⚠️ 存在敏感词：' + hits.map((x) => '“' + x + '”').join('、') + MISBLOCK_HINT); return; }
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
    if (!loggedIn()) { window.alert('请先登录后点赞'); openUserModal(); return; }
    const on = state.likedSet.has(post.id);
    btn.disabled = true;
    try {
      await callEdge('set_like', { token: state.user.token, post_id: post.id, liked: !on });
      const newCount = Math.max(0, Number(post.like_count) + (on ? -1 : 1));
      const num = btn.querySelector('.like-num');
      if (num) num.textContent = formatCount(newCount);
      if (on) state.likedSet.delete(post.id); else state.likedSet.add(post.id);
      saveLikedSet();
      btn.classList.toggle('active', !on);
      refreshProfile();
    } catch (e) { window.alert(e.message); }
    btn.disabled = false;
  }
  // 端到端刷新个人资料（含经验计数），保证顶栏/等级与页面一致
  async function refreshProfile() {
    if (!loggedIn()) return;
    try {
      const p = await callEdge('user_whoami', { token: state.user.token });
      if (p && p.id) { state.user.profile = p; saveUserSession(); renderUserBar(); }
    } catch (_e) {}
  }
  // 登录后从服务端同步「已点赞」集合，保证一个账号对一帖只赞一次
  async function syncLikedFromServer() {
    if (!loggedIn()) return;
    try {
      const { data, error } = await supabase.from('forum_like_users')
        .select('post_id').eq('user_id', myId());
      if (error) return;
      const newSet = new Set((data || []).map((r) => r.post_id));
      state.likedSet = newSet;
      saveLikedSet();
      // 修复：点赞按钮在卡片上，按卡片 data-id 反查
      document.querySelectorAll('article.post-card').forEach((card) => {
        const btn = card.querySelector('.like-btn');
        if (btn) btn.classList.toggle('active', state.likedSet.has(card.dataset.id));
      });
    } catch (_e) {}
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
      const prof = e.target.closest('[data-open-profile]');
      if (prof && prof.dataset.openProfile) { openProfile(prof.dataset.openProfile); return; }
      const pin = e.target.closest('[data-pin]');
      if (pin) { pinOwnComment(box, pin.dataset.pin, post); return; }
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
    const name = c.nickname
      ? (c.author_id ? `<span class="nickname-link" data-open-profile="${c.author_id}">${escapeHtml(c.nickname)}</span>` : escapeHtml(c.nickname))
      : '<span class="anonymous">匿名</span>';
    const cLv = c.author_id && authorMap[c.author_id] ? Number(authorMap[c.author_id].level) || 0 : 0;
    const lv = cLv ? levelBadgeHtml(authorMap[c.author_id]) : '';
    const isOwn = myId() && c.author_id === myId();
    const pinable = isOwn && !!myPriv().pinComment && !c.is_pinned;
    const pinnedTag = c.is_pinned ? '<span class="badge recommend" style="margin-left:4px">📌 已置顶</span>' : '';
    const ownActs = isOwn
      ? `<span class="own-acts">${pinable ? `<button class="tiny-btn pin-cell" data-pin="${c.id}">📌 置顶</button>` : ''}<button class="tiny-btn" data-edit="${c.id}">编辑</button><button class="tiny-btn danger" data-del="${c.id}">删除</button></span>` : '';
    const replyTag = parent
      ? ' <span class="cmt-replyto">回复 @' + (parent.nickname ? escapeHtml(parent.nickname) : '匿名') + '</span>' : '';
    const rname = c.nickname ? c.nickname : '匿名';
    return `<div class="cmt-item${cLv >= 36 ? ' lightfx' : ''}" data-cid="${c.id}">
      <div class="cmt-head">${name}${lv}${pinnedTag}${replyTag}<span class="cmt-time">#${i + 1} · ${formatTime(c.created_at)}</span></div>
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
  async function pinOwnComment(box, id, post) {
    if (!loggedIn()) return;
    try {
      const r = await callEdge('comment_pin', { token: state.user.token, comment_id: id });
      window.alert(`✅ 评论已置顶，今日剩余 ${r.remainingPin} 次。`);
      loadComments(box, post);
    } catch (e) { window.alert(e.message); }
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
    if (hits.length) { reportInterception('comment', content, hits, null); window.alert('⚠️ 存在敏感词：' + hits.map((x) => '“' + x + '”').join('、') + MISBLOCK_HINT); return; }
    try {
      await callEdge('user_edit_comment', { token: state.user.token, id, content });
      loadComments(box, post);
    } catch (e) { window.alert(e.message); }
  }

  async function postComment(box, post) {
    if (!loggedIn()) { window.alert('请先登录后评论'); openUserModal(); return; }
    const w = box.querySelector('.cmt-warn');
    w.textContent = '';
    const content = box.querySelector('.cmt-input').value.trim();
    const nickname = box.querySelector('.cmt-nick').value.trim().slice(0, 24);
    if (!content) { w.textContent = '评论内容不能为空'; return; }
    if (content.length > 250) { w.textContent = '评论最多 250 字'; return; }
    const hitWords = sensitiveHits(content).concat(sensitiveHits(nickname));
    if (hitWords.length) {
      w.textContent = '⚠️ 评论存在敏感词（' + hitWords.map((x) => '“' + x + '”').join('、') + '），不得发布。' + MISBLOCK_HINT;
      reportInterception('comment', content, hitWords, nickname);
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
      refreshProfile();
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
    let q = supabase.from('forum_posts').select('*').eq('reviewed', true).eq('blocked', false);
    // 等级可见门禁：仅展示 min_view_level ≤ 我等级 的帖子（匿名视为 0）
    q = q.or(`min_view_level.is.null,min_view_level.lte.${viewerViewLevel()}`);
    // 定时发布：未到发布时间的帖子暂不对外展示
    q = q.or(`scheduled_for.is.null,scheduled_for.lte.${new Date().toISOString()}`);
    if (state.activeTopic) q = q.eq('topic', state.activeTopic);
    return q;
  }
  // 查看者等级（未登录视为 0，只可见全等级公开帖）
  function viewerViewLevel() { return loggedIn() ? myLevelNow() : 0; }
  let floorCounter = 0;
  async function countTotal() {
    // 单独构建计数查询：select 只调用一次（head+exact 仅取数量），
    // 避免在已带 select('*') 的列表查询上二次 select 触发 PostgREST 报错、导致总数为 0
    let q = supabase.from('forum_posts')
      .select('id', { count: 'exact', head: true })
      .eq('reviewed', true).eq('blocked', false);
    q = q.or(`min_view_level.is.null,min_view_level.lte.${viewerViewLevel()}`);
    q = q.or(`scheduled_for.is.null,scheduled_for.lte.${new Date().toISOString()}`);
    if (state.activeTopic) q = q.eq('topic', state.activeTopic);
    const { count, error } = await q;
    if (error) return 0;
    return count || 0;
  }
  async function loadPinned() {
    try {
      let q = supabase.from('forum_pinned_posts').select('*').eq('blocked', false)
        .order('pinned_at', { ascending: false });
      if (state.activeTopic) q = q.eq('topic', state.activeTopic);
      const { data } = await q;
      // 推流/传说推荐/金牌认证的帖子也临时顶置展示（金牌认证最优先置顶）
      let boosted = [];
      try {
        const now = new Date().toISOString();
        const bq = supabase.from('forum_posts').select('*').eq('reviewed', true).eq('blocked', false)
          .or(`gold_until.gt.${now},boost_until.gt.${now},recommend_until.gt.${now}`)
          .or(`min_view_level.is.null,min_view_level.lte.${viewerViewLevel()}`)
          .or(`scheduled_for.is.null,scheduled_for.lte.${now}`)
          .order('pinned_at', { ascending: true });
        if (state.activeTopic) bq = bq.eq('topic', state.activeTopic);
        boosted = (await bq.limit(30)).data || [];
      } catch (_e) { boosted = []; }
      const activeGold = boosted.filter((p) => p.gold_until && new Date(p.gold_until).getTime() > Date.now());
      const restBoost = boosted.filter((p) => !(p.gold_until && new Date(p.gold_until).getTime() > Date.now()));
      const rows = [...activeGold, ...restBoost, ...(data || [])];
      els.pinnedFeed.innerHTML = '';
      const authorMap = await resolveAuthors(rows);
      const cards = rows.map((p) => makeCard(p, { pinned: true, boosted: !!p.boost_until, authorMap }));
      cards.forEach((c) => els.pinnedFeed.appendChild(c));
      els.pinnedSection.classList.toggle('hidden', !cards.length);
      observeReveal(els.pinnedFeed);
    } catch (_e) { /* ignore */ }
  }

  async function loadFeed() {
    els.viewTitle.style.display = 'none';
    els.searchBanner.classList.add('hidden');
    els.emptyState.classList.add('hidden');
    // 每次加载前清空主列表和空态文案，避免残留上一次视图的内容
    els.feed.innerHTML = '';
    els.emptyState.innerHTML = '';

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
    } else if (state.mode === 'digest') {
      els.viewTitle.style.display = '';
      els.viewTitle.textContent = '💎 精华聚合';
      els.pager.classList.add('hidden');
      els.pinnedSection.classList.add('hidden');
      try { rows = await callEdge('digest_list', { token: state.user.token || '' }); }
      catch (_e) { rows = []; }
      if (!rows.length) {
        els.emptyState.classList.remove('hidden');
        els.emptyState.innerHTML = `<div class="emoji">💎</div>暂无精华帖，管理员可在帖子下方「加入精华」`;
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
    if (state.mode === 'mine') {
      const bq = await loadBoostQuota();
      if (bq) els.feed.appendChild(renderBoostPanel(bq));
    }
    if (!rows.length) {
      els.emptyState.classList.remove('hidden');
      if (state.mode === 'search') {
        els.emptyState.innerHTML = `<div class="emoji">🔍</div>没有找到“${escapeHtml(state.keyword)}”相关的内容`;
      } else if (state.mode === 'favorites') {
        els.emptyState.innerHTML = `<div class="emoji">⭐</div>还没有收藏，点击帖子下方的 ⭐ 即可收藏`;
      } else if (state.mode === 'mine') {
        els.emptyState.innerHTML = `<div class="emoji">📄</div>你还没有发布任何帖子`;
      } else {
        els.emptyState.innerHTML = state.activeTopic
          ? `<div class="emoji">🍃</div>「${escapeHtml(state.activeTopic)}」暂无帖子，来发布第一条吧`
          : `<div class="emoji">🍃</div>这里还空空如也，来发布第一条吧`;
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
    const chips = ['💎 精华', '全部', ...TOPICS, ...customTopics.map((c) => c.display_name)];
    els.filterBar.innerHTML = '';
    chips.forEach((t) => {
      const b = document.createElement('button');
      const isDigest = t === '💎 精华';
      const active =
        (isDigest && state.mode === 'digest') ||
        (!isDigest && state.mode !== 'digest' && (state.activeTopic === t || (t === '全部' && !state.activeTopic)));
      b.className = 'chip' + (active ? ' active' : '');
      b.textContent = t;
      b.addEventListener('click', () => {
        if (isDigest) { state.mode = 'digest'; state.activeTopic = ''; }
        else { state.mode = 'feed'; state.activeTopic = t === '全部' ? '' : t; }
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
    const lbLabels = { today: '今日', week: '本周', month: '本月' };
    const lbTabs = ['today', 'week', 'month'].map((p) =>
      `<button class="chip" data-p="${p}" style="flex:1">${lbLabels[p]}</button>`).join('');
    const wrapHead = `<div class="lb-tabs" style="display:flex;gap:4px;margin-bottom:10px">${lbTabs}</div>`;
    try {
      const list = await callEdge('leaderboard', { period: lbPeriod });
      if (!list || !list.length) {
        els.weekHot.innerHTML = wrapHead + `<div class="notif-empty">${lbLabels[lbPeriod]}暂无热帖</div>`;
      }
      else {
        els.weekHot.innerHTML = wrapHead + list.map((p, i) => `
          <div class="leader-item" data-id="${p.id}">
            <span class="leader-rank">${i + 1}</span>
            <div class="leader-main">
              <div class="leader-title">${escapeHtml(p.content.slice(0, 28))}${p.content.length > 28 ? '…' : ''}</div>
              <div class="leader-meta">${escapeHtml(p.nickname || '匿名')} · ${p.hot || 0} 👍 · ${formatCount(p.comment_count)} 💬</div>
            </div>
          </div>`).join('');
        els.weekHot.querySelectorAll('.leader-item').forEach((el) => {
          el.addEventListener('click', () => scrollToPost(el.dataset.id));
        });
      }
    } catch (_e) { els.weekHot.innerHTML = wrapHead + '<div class="notif-empty">暂无数据</div>'; }
    els.weekHot.querySelectorAll('[data-p]').forEach((b) => {
      const isActive = b.dataset.p === lbPeriod;
      b.classList.toggle('active', isActive);
      if (b.dataset.p === lbPeriod) return;
      b.addEventListener('click', () => { lbPeriod = b.dataset.p; loadLeaderboard(); });
    });
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
    [...TOPICS].forEach((t) => {
      const o = document.createElement('option');
      o.value = t; o.textContent = t + (t === '吃瓜' ? '（最多5000字·需审核）' : '');
      els.topicSelect.appendChild(o);
    });
    if (customTopics.length) {
      const g = document.createElement('optgroup');
      g.label = '用户自建话题';
      customTopics.forEach((ct) => {
        const o = document.createElement('option');
        o.value = ct.display_name;
        o.textContent = ct.display_name + (ct.is_permanent ? '（永久）' : '');
        g.appendChild(o);
      });
      els.topicSelect.appendChild(g);
    }
    const n = document.createElement('option');
    n.value = NEW_TOPIC; n.textContent = '＋ 新建自定义话题…';
    els.topicSelect.appendChild(n);
    updateCharCount();
  }

  // 从后端加载自定义话题并刷新下拉/筛选
  async function loadTopics() {
    try {
      const data = await callEdge('topics_list', {});
      customTopics = (data && data.custom) ? data.custom : [];
    } catch (_e) { customTopics = []; }
    renderTopicSelect();
    renderFilterBar();
  }

  // 新建自定义话题：去空格去符号非空、敏感词/黑名单检查，验重后创建并选中
  async function handleNewTopic() {
    const raw = (window.prompt('输入新话题名称（2~30 字，将自动去除空格和符号）：') || '').trim();
    if (!raw) { els.topicSelect.value = TOPICS[0]; updateCharCount(); return; }
    const normjs = raw.replace(/\s+/g, '').replace(/[^\p{N}\p{L}_\-\u4e00-\u9fa5]/gu, '');
    if (!normjs) { window.alert('话题名称无效：需包含文字或数字'); els.topicSelect.value = TOPICS[0]; updateCharCount(); return; }
    if (normjs.length > 30) { window.alert('话题名称最多 30 字'); els.topicSelect.value = TOPICS[0]; updateCharCount(); return; }
    // 敏感词检查（词库在前端）
    const hitsjs = sensitiveHits(normjs);
    if (hitsjs.length) {
      window.alert('⚠️ 话题名存在敏感词（' + hitsjs.map((x) => '“' + x + '”').join('、') + '），不得创建。' + MISBLOCK_HINT);
      reportInterception('topic', normjs, hitsjs, null);
      els.topicSelect.value = TOPICS[0]; updateCharCount();
      return;
    }
    // 与固定话题撞名检查
    if (TOPICS.some((t) => t.replace(/\s+/g, '').replace(/[^\p{N}\p{L}_\-\u4e00-\u9fa5]/gu, '') === normjs)) {
      window.alert('该话题与系统固定话题重复，请换个名称');
      els.topicSelect.value = TOPICS[0]; updateCharCount();
      return;
    }
    try {
      const created = await callEdge('topic_create', { display: normjs, token: state.user.token || '' });
      await loadTopics();
      els.topicSelect.value = created && created.display_name ? created.display_name : normjs;
      updateCharCount();
    } catch (e) {
      window.alert(e.message || '话题创建失败');
      els.topicSelect.value = TOPICS[0]; updateCharCount();
    }
  }
  els.topicSelect.addEventListener('change', () => {
    if (els.topicSelect.value === NEW_TOPIC) handleNewTopic();
    else updateCharCount();
  });
  function updateCharCount() {
    const limit = topicLimit(els.topicSelect.value);
    const len = els.content.value.length;
    const cl = els.charCount;
    cl.textContent = `${len} / ${limit}`;
    cl.classList.toggle('warn', len > limit * 0.85 && len <= limit);
    cl.classList.toggle('full', len > limit);
    return limit;
  }

  function updateComposerPrivileges() {
    const wrap = els.composerPriv;
    if (!wrap) return;
    const priv = myPriv();
    if (!priv.sched && !priv.lvlgate) { wrap.classList.add('hidden'); return; }
    wrap.classList.remove('hidden');
    const lv = myLevelNow();
    const lvSel = els.minViewLevel;
    if (lvSel) {
      lvSel.style.display = priv.lvlgate ? '' : 'none';
      if (lvSel.dataset.lv !== String(lv)) {
        const prev = lvSel.value;
        lvSel.innerHTML = '<option value="0">所有等级可见</option>' +
          (lv > 1 ? Array.from({ length: lv - 1 }, (_, i) => i + 2)
            .map((n) => `<option value="${n}">仅 Lv.${n} 以上可见</option>`).join('') : '');
        lvSel.dataset.lv = String(lv);
        if (lvSel.querySelector('option[value="' + prev + '"]')) lvSel.value = prev;
      }
    }
    if (els.scheduleAt) els.scheduleAt.style.display = priv.sched ? '' : 'none';
    if (els.privHint) {
      const parts = [];
      if (priv.sched) parts.push('可定时发布');
      if (priv.lvlgate) parts.push('可设等级可见');
      if (priv.recommend) parts.push('可推荐他人帖子');
      els.privHint.textContent = '风云学长+ 特权：' + parts.join(' · ');
    }
  }

  async function publish() {
    const topic = els.topicSelect.value;
    const content = els.content.value.trim();
    // 登录用户直接使用用户名（后端强制），不采用自定义昵称
    const nickname = loggedIn() ? '' : els.nickname.value.trim().slice(0, 24);
    const limit = topicLimit(topic);
    const warn = els.composeWarn;
    // 风云学长+：定时发布 / 等级可见（未登录时字段隐藏且不传）
    let schedTs = 0;
    if (loggedIn() && els.scheduleAt && els.scheduleAt.value) {
      const _t = new Date(els.scheduleAt.value).getTime();
      if (Number.isFinite(_t) && _t > 0) schedTs = _t;
    }
    const minView = (loggedIn() && els.minViewLevel) ? (Number(els.minViewLevel.value) || 0) : 0;
    const basePayload = () => ({
      token: state.user.token || '', topic, nickname, content,
      ...(schedTs > 0 ? { schedule_at: new Date(schedTs).toISOString() } : {}),
      ...(loggedIn() && minView > 0 ? { min_view_level: minView } : {})
    });
    const onSuccess = async (msg) => {
      els.content.value = '';
      if (els.nickname && !loggedIn()) els.nickname.value = '';
      if (els.scheduleAt) els.scheduleAt.value = '';
      if (els.minViewLevel) els.minViewLevel.value = '0';
      schedTs = 0;
      updateCharCount();
      els.composeHint.textContent = msg;
      if (state.activeTopic && state.activeTopic !== topic) { state.activeTopic = ''; renderFilterBar(); }
      state.page = 1;
      await Promise.all([loadPinned(), loadFeed()]);
      if (state.mode === 'mine') loadFeed();
      armScheduledTimer();
      refreshProfile();
      loadTopics();
    };

    els.composeHint.textContent = '';
    if (!content) { warn.textContent = '内容不能为空'; return; }
    if (content.length > limit) { warn.textContent = `内容超出${limit}字上限`; return; }
    const hitWords = sensitiveHits(content).concat(sensitiveHits(nickname));
    if (hitWords.length) {
      warn.textContent = '⚠️ 发布内容存在敏感词（' + hitWords.map((x) => '“' + x + '”').join('、') + '），不得发布。' + MISBLOCK_HINT;
      els.content.classList.add('bad');
      reportInterception('post', content, hitWords, nickname);
      return;
    }
    els.content.classList.remove('bad');

    els.composeHint.textContent = '';
    const succMsg = () => {
      if (schedTs > 0) return '✅ 定时发布成功：将于 ' + (els.scheduleAt ? els.scheduleAt.value.replace('T', ' ') : '') + ' 自动公开展示。';
      return topic === '吃瓜'
        ? '✅ 已在「吃瓜」板块发布，内容提交成功后将由管理员审核后公开展示。' : '✅ 发布成功';
    };

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
          await callEdge('post_create', { ...basePayload(), captcha_id: cap.id, captcha_ans: num, captcha_sig: cap.sig, captcha_exp: cap.exp });
          await onSuccess(succMsg());
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
      await onSuccess(succMsg());
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
    setTimeout(() => { reloading = false; loadPinned(); loadFeed(); armScheduledTimer(); }, 2000);
  }
  // 定时帖：查询最近一条尚未到点的帖子，设定时器在到点时自动刷新刷出（适用于定时发布与实时频道无事件的场景）
  let schedTimer = null;
  async function armScheduledTimer() {
    if (schedTimer) { clearTimeout(schedTimer); schedTimer = null; }
    try {
      const res = await callEdge('scheduled_next', { token: state.user.token || '' });
      const t = new Date(res.next).getTime();
      if (!Number.isFinite(t) || t <= Date.now()) return;
      const delay = Math.min(t - Date.now() + 1500, 2147483647);
      schedTimer = setTimeout(() => { schedTimer = null; loadPinned(); loadFeed(); armScheduledTimer(); }, delay);
    } catch (_e) { /* 内部错误不影响主流程 */ }
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
// 维护页“管理员登录后台”：直接进入独立的 admin 后台页（后台不受停机拦截，可登录后重新开放站点）
const haltAdminBtn = document.querySelector('#haltAdmin');
if (haltAdminBtn) haltAdminBtn.addEventListener('click', () => { location.href = 'admin.html'; });
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
  async function init() {
    readAdminSession();
    await loadAdminPerms();
    readUserSession();
    state.likedSet = getLikedSet();
    loadTopics();
    bindSort();
    renderUserBar();
    loadSiteStatus();
    loadPopups();
    loadAnnouncements();
    loadPinned();
    loadFeed();
    loadLeaderboard();
    if (loggedIn()) { loadFavIds(); syncLikedFromServer(); refreshProfile(); checkBanStatus(); }
    subscribeRealtime();
    startClientEpochPoll();
    armScheduledTimer();
    if (unreadTimer) clearInterval(unreadTimer);
    unreadTimer = setInterval(() => { refreshUnread(); checkBanStatus(); }, 60000);
    // 从通知中心跳转过来的「帖子页面」：index.html#post-<pid>
    const m = location.hash.match(/^#post-(.+)$/);
    if (m) setTimeout(() => scrollToPost(decodeURIComponent(m[1])), 400);
    // 从专栏页等跳转过来的「个人主页」：index.html#profile-<uid>
    const pm = location.hash.match(/^#profile-(.+)$/);
    if (pm) setTimeout(() => openProfile(decodeURIComponent(pm[1])), 300);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();