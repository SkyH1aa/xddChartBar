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
  const DEVICE_KEY = 'nzb_device_key';

  // ---------------- 设备指纹（多设备登录控制用） ----------------
  // 每台浏览器/设备一个持久随机标识：同一设备重复登录复用槽位，不同的设备在服务端计数。
  function getDeviceKey() {
    try {
      let k = localStorage.getItem(DEVICE_KEY);
      if (!k) { k = crypto.randomUUID ? crypto.randomUUID() : ('d' + Date.now() + Math.random().toString(36).slice(2)); localStorage.setItem(DEVICE_KEY, k); }
      return k;
    } catch (_e) { return 'd' + Date.now() + Math.random().toString(36).slice(2); }
  }
  function getDeviceName() {
    try {
      const ua = navigator.userAgent || '';
      const uaData = navigator.userAgentData || null;
      const osMatches = ua.match(/Windows NT (\d+\.\d+)/);
      let os = '未知系统';
      if (osMatches && osMatches[1] >= '10.0') os = 'Windows 10/11';
      else if (osMatches) os = 'Windows';
      else if (/iPhone OS (\d+)_/.test(ua)) os = 'iOS ' + (ua.match(/iPhone OS (\d+)_/)[1]);
      else if (/CPU OS (\d+)_/.test(ua) || /iPad OS (\d+)_/.test(ua)) os = 'iOS';
      else if (/Android (\d+[\d.]*)/.test(ua)) os = 'Android ' + (ua.match(/Android (\d+[\d.]*)/)[1]);
      else if (/Mac OS X/.test(ua)) os = 'macOS';
      else if (/Linux/.test(ua)) os = 'Linux';
      // 设备型号：优先取安卓 UA 里的型号，其次用 userAgentData.platform
      let model = '';
      const mob = ua.match(/\(([^;]+);[^)]*;\s*([^;]+)\s+Build\//);
      if (mob && mob[2]) { model = mob[2].replace(/;/g, '').trim(); }
      else if (uaData && uaData.platform && /Android/.test(uaData.platform)) model = model || '';
      const br = /Edg\//.test(ua) ? 'Edge' : /CriOS\//.test(ua) ? 'Chrome' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari/.test(ua) ? 'Safari' : '浏览器';
      return [br, model, os].filter(Boolean).join(' · ');
    } catch (_e) { return ''; }
  }

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
    pollBuilder: $('pollBuilder'), pollQtype: $('pollQtype'), quizQuestions: $('quizQuestions'), quizTypeNote: $('quizTypeNote'), addQuestionBtn: $('addQuestionBtn'),
    seriesBox: $('seriesBox'), seriesOn: $('seriesOn'), seriesFields: $('seriesFields'), seriesTitle: $('seriesTitle'), seriesSelect: $('seriesSelect'), seriesPartTitle: $('seriesPartTitle'),
    spPanel: $('spPanel'), spPreview: $('spPreview'),
    draftBar: $('draftBar'), draftUse: $('draftUse'), draftClear: $('draftClear'),
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
    if (window.ClubTime) { const s = window.ClubTime.str(iso); if (s) return s; }
    const d = new Date(iso);
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ` +
           `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  }
  function topicLimit(t) {
    if (t === '吃瓜') return 5000;
    const lv = loggedIn() ? (myLevelNow() || 0) : 0;
    return lv >= 21 ? 700 : lv >= 11 ? 600 : 500;
  }
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
  // 等级：经验 = 发帖*3 + 评论 + 获赞 + 收藏*2 + 事件 + 奖金 + 签到；线性升级：升到下一级需 10×当前等级 经验，上限 60
  const LEVEL_TIERS = [
    { max: 10, name: '初来乍到' }, { max: 20, name: '校园萌新' }, { max: 35, name: '校园百事通' },
    { max: 45, name: '风云学长' }, { max: 54, name: '校园传说' }, { max: 60, name: '校史留名' }
  ];
  function xpOf(u) {
    // 与后端 xpOfUser 完全一致：发帖/评论走每日封顶通道 xp_post_comment；点赞/收藏/事件/签到不设上限
    return (Number(u && u.xp_post_comment) || 0)
      + (Number(u && u.like_received) || 0) + (Number(u && u.col_like_received) || 0)
      + (Number(u && u.fav_received) || 0) * 2
      + (Number(u && u.xp_event) || 0)
      + (Number(u && u.bonus_xp) || 0) + (Number(u && u.checkin_xp) || 0);
  }
  function cumMin(L) { return 5 * L * (L - 1); } // 达到 L 级所需累计经验（累加 10*i）
  function levelOf(u) {
    const xp = xpOf(u);
    if (xp <= 0) return 1;
    return Math.min(60, Math.floor((1 + Math.sqrt(1 + (4 * xp) / 5)) / 2));
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
      const span = 10 * level; // 升到下一级需 10×当前等级 经验
      const inLevel = xp - cumMin(level);
      progress = Math.min(1, Math.max(0, inLevel / span));
      nextNeed = Math.max(0, span - inLevel);
    }
    return { level, name: levelName(level), xp, progress, nextNeed, hi: xp, fixed, maxed };
  }
  function userDisplay(u) { return u && (u.nickname || u.username) ? (u.nickname || u.username) : '匿名'; }
  // 发帖/评论旁展示称号徽标（按等级分段呈现 6 种形态）
  function badgeTierOf(lv) {
    if (lv <= 10) return 1;       // 普通扁平
    if (lv <= 20) return 2;       // 彩色+轻微描边
    if (lv <= 35) return 3;       // 彩色+动态微光
    if (lv <= 45) return 4;       // 金属质感+呼吸
    if (lv <= 54) return 5;       // 水晶/琉璃+粒子
    return 6;                     // 3D立体+专属配色+唯一编号
  }
  const BADGE_TIER_CLS = ['', 't-flat', 't-color', 't-glow', 't-metal', 't-crystal', 't-3d'];
  function levelBadgeHtml(author) {
    const lv = author && author.level ? Number(author.level) || 0 : 0;
    if (!lv) return '';
    const tier = badgeTierOf(lv);
    const name = levelName(lv);
    const no = (tier === 6 && author && author.legend_no) ? Number(author.legend_no) : 0;
    const noHtml = no ? `<i class="badge-no">No.${no}</i>` : '';
    return `<span class="author-level badge-x ${BADGE_TIER_CLS[tier]}" data-tier="${tier}" data-lv="${lv}" title="Lv.${lv} · ${escapeHtml(name)}${no ? ` · No.${no}` : ''}">${escapeHtml(name)}${noHtml}</span>`;
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
    // 被其他设备挤掉/会话失效：后端返回 401 → 立即清理本地会话，回到未登录态，避免残留昵称
    // 排除登录/注册接口自身可能返回的 401（如密码错误），以及管理员校验 whoami
    // （admin 令牌失效只代表管理会话过期，绝不等于用户会话失效，不能清空用户登录态）
    if (res.status === 401 && state.user && state.user.token
      && action !== 'user_login' && action !== 'user_register' && action !== 'admin_login' && action !== 'whoami') {
      sessionMonitorReset();
    }
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
  // 手动退出：先通知服务端删除该会话（释放一个设备槽位），再清理本地会话
  function logoutUser() {
    const tok = state.user.token;
    state.user = { token: null, profile: null };
    try {
      localStorage.removeItem(USER_TOKEN_KEY);
      localStorage.removeItem(USER_PROFILE_KEY);
    } catch (_e) {}
    if (tok) callEdge('logout', { token: tok }).catch(() => {});
    renderUserBar();
    applyLoginGate();
  }
  // 会话监控：定时校验本端令牌是否仍有效。
  // 若已被其他设备挤掉（普通用户超 5 台挤最旧 / 管理员新登录顶掉旧登录）或已过期，
  // user_whoami 会返回 401/403 → 清除本地会话，回到未登录态。
  const sessionMonitorReset = () => {
    state.user = { token: null, profile: null };
    try { localStorage.removeItem(USER_TOKEN_KEY); localStorage.removeItem(USER_PROFILE_KEY); } catch (_e) {}
    renderUserBar();
    loadAdminPerms();
    applyLoginGate();
  };
  function startSessionMonitor() {
    // 返回当前会话是否仍有效；失效则清理本地会话（被挤掉/过期）
    async function probe() {
      const tok = state.user.token;
      if (!tok) return;
      try {
        const r = await fetch(EDGE_URL, {
          method: 'POST', headers: { 'content-type': 'application/json', apikey: SUPABASE_KEY },
          body: JSON.stringify({ action: 'user_whoami', token: tok })
        });
        if (r.status === 401) sessionMonitorReset(); // 会话真被踢掉/失效才清理；5xx 为临时故障，保持登录态下轮再试
      } catch (_e) { /* 网络异常保持现状，下轮再试 */ }
    }
    // 定时探活（缩短到 20s，被踢后更快回到未登录态）
    setInterval(probe, 20000);
    // 切回本标签页时立即探活一次，让“刚被其他设备踢掉”能立刻表现为未登录
    document.addEventListener('visibilitychange', () => { if (!document.hidden) probe(); });
    window.addEventListener('focus', probe);
  }

  // ----------------- 未登录强制登录门禁 -----------------
  // 未登录用户无法查看/使用论坛内容：显示覆盖层并引导登录
  let gateBound = false;
  function applyLoginGate() {
    const gate = $('loginGate');
    if (!gate) return;
    if (loggedIn()) {
      gate.classList.add('hidden');
    } else {
      gate.classList.remove('hidden');
      const btn = $('loginGateBtn');
      if (btn && !gateBound) { btn.addEventListener('click', openUserModal); gateBound = true; }
    }
  }

  // 邀请码注册状态：创始人开启后，注册页显示必填邀请码输入框
  async function refreshInviteState() {
    try {
      const d = await callEdge('invite_status', {});
      state.inviteOn = !!(d && d.invite_on);
    } catch (_e) { state.inviteOn = false; }
    const inv = $('inviteField');
    if (inv) inv.classList.toggle('hidden', !state.inviteOn);
  }

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
        <button class="icon-btn" id="bellBtn" title="通知中心">🔔<span class="dot-badge notif-badge" id="notifBadge"></span></button>
        <button class="user-chip" id="userChip">
          <span class="avatar-wrap">
            <span class="avatar" style="background:${p.avatar_color || '#e07a5f'}">${escapeHtml(initials)}</span>
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
      else if (act === 'logout') { logoutUser(); }
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
    profileOverlay = overlay;
    overlay.className = 'profile-mask';
    overlay.innerHTML = `<div class="profile-card" data-pid="pcard">
      <div class="profile-card-head"><span class="profile-loading">正在加载主页…</span><button class="profile-close">×</button></div>
      <div class="profile-card-body">加载中…</div>
    </div>`;
    overlay.querySelector('.profile-close').addEventListener('click', () => closeProfileModal());
    overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) closeProfileModal(); });
    document.body.appendChild(overlay);
    let data = null;
    try { data = await callEdge('profile_get', { token: state.user.token || '', user_id: targetId }); }
    catch (_e) { /* ignore */ }
    const body = overlay.querySelector('.profile-card-body');
    if (!data) { body.innerHTML = '<div style="padding:30px;text-align:center;color:var(--muted)">主页加载失败</div>'; return; }
    body.innerHTML = renderProfile(data);
    body.querySelectorAll('[data-pact]').forEach((b) => b.addEventListener('click', () => { const ps = state.user.profile; renderProfileInto(body, data); }));
    if (data.canEdit) { bindProfileEdit(body, data, overlay); renderPrivilegeCenter(body); }
    const pcbox = body.querySelector('[data-pcoll-box]');
    if (pcbox && !data.canEdit && targetId) {
      (async () => {
        try {
          const plist = (await callEdge('collection_public', { token: state.user.token || '', owner_id: targetId })) || [];
          pcbox.innerHTML = plist.length
            ? plist.map((c) => `<div class="pc-row"><span style="flex:1;min-width:0"><b>📁 ${escapeHtml(c.title)}</b><br><span style="color:var(--faint);font-size:11px">${escapeHtml(c.intro || '')}</span></span><button class="profile-editbtn sm" data-copen="${c.id}">查看</button></div>`).join('')
            : '<span style="color:var(--faint)">暂无公开合集</span>';
          pcbox.querySelectorAll('[data-copen]').forEach((b) => b.addEventListener('click', () => { closeProfileModal(); openCollectionModal(b.getAttribute('data-copen')); }));
        } catch (_e) { pcbox.innerHTML = '<span style="color:var(--faint)">加载失败</span>'; }
      })();
    }
  }
  let profileModalOpenId = null;
  let profileOverlay = null;
  function closeProfileModal() { if (profileOverlay) { profileOverlay.remove(); profileOverlay = null; } }
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
      return `<div class="profile-row"><span class="profile-row-label">${escapeHtml(f.label)}</span><span class="profile-row-val">${multiLine(escapeHtml(val))}</span></div>`;
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
      ${data.canEdit ? `<div class="prof-sessions">
        <div class="pf-vis-title">📱 已登录设备（普通账号最多 5 台）</div>
        <div data-login-policy style="color:var(--faint);font-size:11px;margin:5px 0">登录策略加载中…</div>
        <div data-devices><span style="color:var(--faint);font-size:12px">加载中…</span></div>
        <button class="profile-editbtn" data-logout-others style="font-size:11px">🚪 退出其他所有设备</button>
      </div>` : ''}
      ${data.canEdit ? `<div style="margin-top:8px;font-size:11px;color:var(--faint)">只能在个人中心（右上角头像 → 我的主页）编辑自己的信息。提示：敏感词会在提交前本地拦截。</div>` : ''}
      ${!data.canEdit && u.id ? `<div class="pcol-section" data-public-coll style="margin-top:14px;border-top:1px solid var(--line-soft);padding-top:12px">
        <div class="pf-vis-title">📁 公开帖子合集</div>
        <div data-pcoll-box style="font-size:12px;margin-top:6px"><span style="color:var(--faint)">加载中…</span></div>
      </div>` : ''}
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
          .map((x) => `[${x.topic}]${x.nickname ? ' @' + x.nickname : ''} ${x.created_at ? formatTime(x.created_at) : ''}\n${x.content}`)
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
    const lo = body.querySelector('[data-logout-others]');
    if (lo) lo.addEventListener('click', async () => {
      if (!confirm('确认退出其他所有设备？仅保留当前设备在线，其他设备的登录会立即失效。')) return;
      lo.disabled = true;
      try { await callEdge('logout_others', { token: state.user.token }); await loadDevices(body); }
      catch (e) { window.alert(e.message); }
      finally { lo.disabled = false; }
    });
    loadDevices(body);
  }
  function fmtTime(iso) {
    if (window.ClubTime) { const s = window.ClubTime.str(iso); if (s) return s; }
    if (!iso) return '';
    try { return new Date(iso).toLocaleString(); } catch (_e) { return ''; }
  }
  function formatSessionRemaining(sec) {
    const n = Math.max(0, Number(sec) || 0);
    if (!n) return '已过期';
    const h = Math.floor(n / 3600);
    const m = Math.floor((n % 3600) / 60);
    return h ? `${h}小时${m ? ` ${m}分钟` : ''}` : `${Math.max(1, m)}分钟`;
  }
  // 加载并渲染“已登录设备”列表（仅自己主页可见）→ 可踢出任意其他设备
  async function loadDevices(body) {
    const host = body.querySelector('[data-devices]');
    if (!host || !state.user.token) return;
    try {
      const d = await callEdge('list_sessions', { token: state.user.token });
      const policy = d.login_policy || {};
      const policyHost = body.querySelector('[data-login-policy]');
      if (policyHost) {
        const renewal = policy.renew_on_login === false ? '关闭登录续期' : '开启登录续期';
        policyHost.textContent = `有效期 ${policy.ttl_hours || 24} 小时 · ${renewal}${policy.effective_at ? ` · 生效于 ${fmtTime(policy.effective_at)}` : ''}`;
      }
      const list = d.sessions || [];
      if (!list.length) { host.innerHTML = '<div style="color:var(--faint);font-size:12px;padding:4px 0">当前没有其他已登录设备（本设备不计）</div>'; return; }
      host.innerHTML = list.map((s) => `
        <div style="display:flex;align-items:center;gap:8px;padding:7px 2px;border-top:1px solid var(--line-soft)">
          <span style="font-size:16px">${s.current ? '💻' : '📱'}</span>
          <span style="flex:1;min-width:0;font-size:12px;color:var(--text)">${escapeHtml(s.device_name)}
            <div style="color:var(--faint);font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">登录于 ${fmtTime(s.created_at)}${s.ip ? ` · IP ${escapeHtml(s.ip)}` : ''}<br>到期于 ${fmtTime(s.expires_at)} · 剩余 ${formatSessionRemaining(s.remaining_seconds)}</div>
          </span>
          ${s.current ? '<span style="color:var(--ok);font-size:11px;white-space:nowrap">当前设备</span>'
            : `<button class="profile-editbtn" data-revokesid="${s.sid}" style="font-size:11px;white-space:nowrap">踢出</button>`}
        </div>`).join('');
      host.querySelectorAll('[data-revokesid]').forEach((b) => b.addEventListener('click', async () => {
        const sid = b.getAttribute('data-revokesid');
        if (!sid || !confirm('确认将该设备踢下线？该设备上的登录会立即失效。')) return;
        b.disabled = true;
        try { await callEdge('revoke_session', { token: state.user.token, sid }); await loadDevices(body); }
        catch (e) { window.alert(e.message); b.disabled = false; }
      }));
    } catch (_e) { host.innerHTML = '<div style="color:var(--faint);font-size:12px">设备列表加载失败</div>'; }
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
      <div style="margin:14px 0 4px;border-top:1px solid var(--line);padding-top:12px">
        <div style="font-weight:700;color:var(--text);font-size:13px">登录有效期</div>
        <div style="color:var(--faint);font-size:11px;margin:4px 0 8px">每台设备分别计算，保存后立即生效；范围为 1-720 小时（最长 30 天）。</div>
        <label class="pf-label">有效期（小时）<input class="pf-input" type="number" min="1" max="720" step="1" data-login-ttl value="24"></label>
        <label style="display:flex;align-items:center;gap:6px;color:var(--muted);font-size:12px;margin-top:7px"><input type="checkbox" data-login-renew checked> 开启登录续期：同一设备再次登录时重新计算有效期</label>
        <div style="color:var(--faint);font-size:11px;margin-top:5px">关闭后，期间再次登录不会改变该设备原有到期时间。</div>
      </div>
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
    callEdge('user_login_policy_get', { token: state.user.token }).then((policy) => {
      const ttl = body.querySelector('[data-login-ttl]');
      const renew = body.querySelector('[data-login-renew]');
      if (ttl) ttl.value = String(policy.ttl_hours || 24);
      if (renew) renew.checked = policy.renew_on_login !== false;
    }).catch((e) => {
      const err = body.querySelector('[data-pf-error]');
      if (err) {
        err.textContent = '登录策略加载失败：' + (e && e.message ? e.message : '请稍后重试');
        err.style.color = '#e05e5e';
      }
    });
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
      const ttlEl = body.querySelector('[data-login-ttl]');
      const ttlHours = Number(ttlEl ? ttlEl.value : 24);
      const renewOnLogin = !!body.querySelector('[data-login-renew]')?.checked;
      if (!Number.isInteger(ttlHours) || ttlHours < 1 || ttlHours > 720) {
        errEl.textContent = '登录有效期必须是 1-720 小时的整数';
        errEl.style.color = '#e05e5e';
        return;
      }
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
        try {
          const policyResult = await callEdge('user_login_policy_save', { token: state.user.token, ttl_hours: ttlHours, renew_on_login: renewOnLogin });
          if (policyResult && policyResult.token) {
            state.user.token = policyResult.token;
            saveUserSession();
          }
        } catch (policyError) {
          throw new Error('个人资料已保存，但登录策略保存失败：' + policyError.message);
        }
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
  async function scrollToPost(pid) {
    // 统一定位到「全部话题 · 最新」视图；页码由后端按与 feed 完全一致的规则估算，并配合扫描兜底
    const sel = `article[data-id="${pid}"], .post-card[data-id="${pid}"]`;
    const findInDom = () => document.querySelector(sel);
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const onPost = (el) => {
      const tgl = el.querySelector('.cmt-toggle');
      const box = el.querySelector('[data-cmtbox]');
      if (tgl && box && box.classList.contains('hidden')) tgl.click();   // 自动展开评论区
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 350); // 评论异步加载后再对齐一次
    };

    state.mode = 'feed'; state.activeTopic = ''; state.sort = 'latest';

    // 1) 当前 DOM 已渲染该帖（本页已展示）→ 直接定位
    let el = findInDom();
    if (el) { onPost(el); return; }

    // 已翻到后面页则先回第 1 页，保证后续页码与 feed 一致
    if (state.page > 1) { state.page = 1; await loadFeed(); el = findInDom(); }

    // 2) 用后端按「最新·全部话题」流估算页码（等级与前端 feed 完全一致，杜绝错位）
    let hint = 1;
    if (!el && state.user && state.user.token) {
      try {
        const r = await callEdge('find_post_page', {
          token: state.user.token, post_id: pid,
          view_level: viewerViewLevel()
        });
        if (r && r.visible) hint = Math.max(1, Number(r.page) || 1);
      } catch (_e) { hint = 1; }
    }

    // 3) 依次尝试：预判页及之后 2 页（覆盖同毫秒并列/临界）→ 从第 1 页全书目扫描 → 顶置区异步等待
    const tried = new Set();
    for (let i = 0; i < 3 && !el; i++) {
      const p = hint + i;
      if (p > state.totalPages) break;
      if (tried.has(p)) continue; tried.add(p);
      if (p !== state.page) { state.page = p; await loadFeed(); }
      el = findInDom();
    }
    if (!el) { // 全书目顺序扫描兜底（覆盖预判页失灵/微偏移，最终一定能定位）
      state.page = 1;
      let guard = 0;
      while (!el && state.page < state.totalPages && guard < 400) {
        state.page += 1;
        await loadFeed();
        el = findInDom();
        guard++;
      }
    }
    let wait = 0; // 置顶/推流帖由 loadPinned 异步挂载，稍候重试
    while (!el && wait < 12) { await sleep(150); el = findInDom(); wait++; }

    if (el) onPost(el);
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
    refreshInviteState(); // 进入注册页时同步邀请码开放状态
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
        username: $('userLoginName').value.trim(), password: $('userLoginPass').value,
        device_key: getDeviceKey(), device_name: getDeviceName()
      });
      state.user = { token: data.token, profile: data.user };
      saveUserSession();
      // 强制登录：登录成功后整页刷新，改为按登录态加载论坛内容
      window.location.reload();
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
      const data = await callEdge('user_register', { username, password, device_key: getDeviceKey(), device_name: getDeviceName(), invite_code: $('userRegInvite')?.value.trim().toUpperCase() || '' });
      state.user = { token: data.token, profile: data.user };
      saveUserSession(); renderUserBar(); closeUserModal();
      // 强制登录：注册后整页刷新，改为按登录态加载论坛内容
      window.location.reload();
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
  async function toggleFav(postId, btn, post) {
    if (!loggedIn()) { window.alert('请先登录后收藏'); openUserModal(); return; }
    const has = state.favSet.has(postId);
    const add = !has;
    try {
      await callEdge(has ? 'favorite_remove' : 'favorite_add', { token: state.user.token, post_id: postId });
      if (has) state.favSet.delete(postId); else state.favSet.add(postId);
      if (btn) btn.classList.toggle('active', add);
      // 风云学长(36级)+：作者的帖子被收藏时，收藏者收到专属提示
      if (add && post) {
        const au = post.author_id && post._author ? post._author : null;
        const lv = au ? finalLevel(au) : (post.author_level || 0);
        if (lv >= 36) {
          const nm = au ? (au.nickname || au.username || '学长') : (post.nickname || '学长');
          const tier = lv <= 45 ? '风云学长' : (lv <= 54 ? '校园传说' : '校史留名');
          window.alert('⭐ 你收藏了【' + tier + '】' + nm + ' 的帖子');
        }
      }
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
            <div class="a-meta">${escapeHtml(formatTime(a.created_at))}</div>
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
  // 合作咨询弹窗
  const coopModal = $('coopModal');
  function openCoopModal() { coopModal.classList.remove('hidden'); }
  function copyTextFallback(text) {
    const ta = document.createElement('textarea'); ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta);
    ta.select(); try { document.execCommand('copy'); } catch (_e) {} document.body.removeChild(ta);
  }
  $('openCoopBtn').addEventListener('click', openCoopModal);
  $('closeCoopModal').addEventListener('click', () => coopModal.classList.add('hidden'));
  coopModal.addEventListener('click', (e) => { if (e.target === coopModal) coopModal.classList.add('hidden'); });
  $('coopWechat').addEventListener('click', () => {
    const code = $('coopWechat');
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText('Jay_DouHao').then(() => alert('微信号已复制：Jay_DouHao')).catch(() => { copyTextFallback('Jay_DouHao'); alert('请长按复制：Jay_DouHao'); });
    else { copyTextFallback('Jay_DouHao'); alert('请长按复制微信号：Jay_DouHao'); }
  });
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

  // 查看我的反馈记录（含管理员回应）
  $('myFeedbackBtn').addEventListener('click', loadMyFeedback);
  async function loadMyFeedback() {
    const listEl = $('myFeedbackList');
    listEl.classList.toggle('hidden');
    if (listEl.classList.contains('hidden')) { listEl.innerHTML = ''; return; }
    if (!loggedIn()) { listEl.innerHTML = '<div class="poll-hint">请先登录，登录后才能查看你的反馈记录。</div>'; return; }
    listEl.innerHTML = '<div class="poll-hint">加载中…</div>';
    try {
      const rows = (await callEdge('bug_feedback_my', { token: state.user.token })) || [];
      if (!rows.length) { listEl.innerHTML = '<div class="poll-hint">你还没有提交过反馈，提交后可以在这里跟踪管理员回复。</div>'; return; }
      listEl.innerHTML = rows.map(myFeedbackCard).join('');
    } catch (e) { listEl.innerHTML = `<div class="poll-hint">${escapeHtml(e.message)}</div>`; }
  }
  function myFeedbackCard(r) {
    const stMap = { new: ['待处理', '#9ca3af'], replied: ['已回复', '#3b82f6'], resolved: ['已解决', '#22c55e'] };
    const st = stMap[r.status] || ['待处理', '#9ca3af'];
    const replyAt = (r.status === 'replied' && r.updated_at) ? ` · ${formatTime(r.updated_at)}` : '';
    return `<div style="padding:9px 0;border-bottom:1px dashed var(--line)">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <span class="badge" style="background:${st[1]};color:#fff;font-size:11px">${st[0]}</span>
        <b style="font-size:13px">${escapeHtml(r.category || '')}</b>
        <span style="margin-left:auto;font-size:11px;color:var(--faint)">${formatTime(r.created_at)}</span>
      </div>
      <div style="margin-top:5px;font-size:12px;color:var(--text);white-space:pre-wrap;word-break:break-word">${escapeHtml(r.content || '')}</div>
      ${r.admin_reply
        ? `<div style="margin-top:8px;font-size:12px;background:var(--card);border-left:3px solid var(--accent);padding:8px 10px;border-radius:6px">
            <div style="color:var(--faint);font-size:11px">管理员 ${escapeHtml(r.replied_by || '')} 回复${escapeHtml(replyAt)}</div>
            <div style="margin-top:3px;color:var(--text);white-space:pre-wrap;word-break:break-word">${escapeHtml(r.admin_reply)}</div>
          </div>`
        : '<div style="margin-top:6px;font-size:12px;color:var(--faint)">⏳ 管理员尚未回复，请耐心等待。</div>'}
    </div>`;
  }

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
        .select('id, nickname, post_count, comment_count, like_received, level, bonus_xp, checkin_xp, col_post_count, col_comment_count, col_like_received, xp_post_comment, fav_received, xp_event, legend_no').in('id', ids);
      (data || []).forEach((u) => { map[u.id] = { nickname: u.nickname || u.username || '', level: finalLevel(u), legend_no: u.legend_no || null }; });
    }
    return map;
  }

  // ---------------- 卡片渲染 ----------------
  function makeCard(post, ctx = {}) {
    const cardLv = post.author_id && ctx.authorMap && ctx.authorMap[post.author_id]
      ? Number(ctx.authorMap[post.author_id].level) || 0 : 0;
    // 缓存作者信息，供「收藏风云学长帖」等提示读取
    if (post.author_id && ctx.authorMap && ctx.authorMap[post.author_id]) post._author = ctx.authorMap[post.author_id];
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
    if (post.resolve_post) {
      badges += '<span class="badge" style="background:rgba(63,136,197,.14);color:var(--accent,#4a90c4);border:1px solid rgba(63,136,197,.4)">🧑‍🏫 学长答疑帖</span>';
    }
    if (post.ask_mentor_id) {
      badges += '<span class="badge" style="background:rgba(168,130,255,.14);color:#9b6bff;border:1px solid rgba(168,130,255,.4)">🙋 向学长提问</span>';
    }
    // 连载：Lv21+ 系列帖徽标（点击打开连载目录）
    badges += post.series_id
      ? `<span class="badge series-badge" data-series="${post.series_id}" data-part="${post.series_part || ''}" style="cursor:pointer;background:rgba(34,197,94,.14);color:#22c55e;border:1px solid rgba(34,197,94,.4)" title="查看连载目录">📚 连载${post.series_part ? ' 第' + post.series_part + '章' : ''}</span>`
      : '';
    const seriesPartTitle = (post.part_title && post.series_id)
      ? `<div class="series-part-title" style="font-weight:700;color:var(--text);margin-bottom:4px">📖 ${escapeHtml(post.part_title)}</div>` : '';
    // 校史留名自定义信纸：按 card_style 预设组合生成卡片样式类（全站可见）
    const cs = post.card_style || {};
    const contentFx = (cs.frame || cs.font_effect || cs.glow_color || cs.font_color)
      ? ' cs-style cs-' + (cs.frame || 'none') + ' fx-' + (cs.font_effect || 'none') + ' gc-' + (cs.glow_color || 'none') + ' fc-' + (cs.font_color || 'none')
      : '';
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
      <div class="post-content${contentFx}">${seriesPartTitle}${escapeHtml(post.content)}${ownActs}</div>
      <div class="poll-box" data-pollbox style="display:none"></div>
      <div class="quiz-box" data-quizbox style="display:none"></div>
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
        ${loggedIn() && myLevelNow() >= 36 ? `<button class="act-btn col-btn" data-id="${post.id}" title="加入你的个人帖子合集（风云学长+）">📁 收藏合集</button>` : ''}
        <button class="act-btn rep-btn" data-type="post" data-id="${post.id}" title="举报">🚩</button>
        ${adminActs}
      </div>
      <div class="post-comments hidden" data-cmtbox></div>`;
    card.querySelector('.like-btn').addEventListener('click', (e) => { likePost(post, e.currentTarget); });
    card.querySelector('.cmt-toggle').addEventListener('click', () => toggleComments(card, post));
    card.querySelector('.fav-btn').addEventListener('click', (e) => toggleFav(post.id, e.currentTarget, post));
    card.querySelector('.rep-btn').addEventListener('click', (e) => {
      openReport(e.currentTarget.dataset.type, e.currentTarget.dataset.id);
    });
    const colBtn = card.querySelector('.col-btn');
    if (colBtn) colBtn.addEventListener('click', () => addToCollection(post));
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
    const sbadge = card.querySelector('.series-badge');
    if (sbadge) sbadge.addEventListener('click', (e) => { e.stopPropagation(); openSeriesModal(sbadge.dataset.series); });
    // 作者编辑/删除/推流
    if (isOwn) {
      const bBoost = card.querySelector('[data-act="boost"]');
      if (bBoost) bBoost.addEventListener('click', () => boostOwnPost(post, bBoost));
      card.querySelector('[data-act="edit"]').addEventListener('click', () => editOwnPost(card, post));
      card.querySelector('[data-act="del"]').addEventListener('click', () => deleteOwnPost(post));
    }
    return card;
  }

  // ---------------- 投票 / 问卷渲染（Lv11+ 发帖特权） ----------------
  function renderPollBox(box, poll) {
    if (!poll) return;
    box.style.display = '';
    const voted = poll.myPicks.length > 0 || !!poll.myFill;
    let optsHtml = '';
    if (poll.qtype !== 'fill') {
      const t = poll.qtype === 'multi' ? 'checkbox' : 'radio';
      (poll.options || []).forEach((o, i) => {
        const pct = poll.total ? Math.round((poll.counts[i] || 0) / poll.total * 100) : 0;
        optsHtml += `<label class="poll-opt${voted ? ' voted' : ''}">
          <input type="${t}" name="pollpick${poll.id}" data-i="${i}" ${voted && poll.myPicks.indexOf(i) >= 0 ? 'checked' : ''} ${voted ? 'disabled' : ''}/>
          <span class="poll-otext">${escapeHtml(o)}</span>
          ${voted ? `<span class="poll-bar"><i style="width:${pct}%"></i></span><span class="poll-pct">${poll.counts[i] || 0} (${pct}%)</span>` : ''}
        </label>`;
      });
    }
    const fillHtml = poll.qtype === 'fill'
      ? `<textarea class="poll-fill" ${voted ? 'disabled' : ''} placeholder="填写你的回答">${escapeHtml(poll.myFill || '')}</textarea>` : '';
    const foot = voted
      ? `<div class="poll-total">已有 ${poll.total} 人参与</div>`
      : loggedIn()
        ? `<button class="btn poll-vote" data-poll="${poll.id}">投票</button>
           ${poll.qtype === 'multi' ? '<span class="poll-hint" style="font-size:11px;color:var(--faint)">（可多选）</span>' : ''}`
        : `<span class="poll-hint" style="font-size:11px;color:var(--faint)">登录后可投票</span>`;
    box.innerHTML = `<div class="poll-wrap">
      <div class="poll-q">🗳 ${escapeHtml(poll.question || '投票')}</div>
      ${poll.qtype === 'fill' ? fillHtml : optsHtml}
      ${poll.qtype === 'fill' && voted && poll.fills && poll.fills.length
        ? '<div class="poll-fills">' + poll.fills.slice(0, 20).map((f) => '<div class="poll-fillitem">' + escapeHtml(f) + '</div>').join('') + '</div>' : ''}
      <div class="poll-foot">${foot}</div>
    </div>`;
    const btn = box.querySelector('.poll-vote');
    if (btn) btn.addEventListener('click', async () => {
      const qtype = poll.qtype;
      if (qtype === 'fill') {
        const fv = box.querySelector('.poll-fill');
        if (!fv || !fv.value.trim()) { window.alert('请填写回答内容'); return; }
        try { await callEdge('poll_vote', { token: state.user.token, poll_id: btn.dataset.poll, fill: fv.value.trim() }); }
        catch (e) { window.alert(e.message); return; }
      } else {
        const picks = Array.from(box.querySelectorAll('input:checked')).map((c) => Number(c.dataset.i));
        if (!picks.length) { window.alert(qtype === 'single' ? '请选择一个选项' : '请至少选择一个选项'); return; }
        if (qtype === 'single' && picks.length > 1) { window.alert('单选投票只能选一个'); return; }
        try { await callEdge('poll_vote', { token: state.user.token, poll_id: btn.dataset.poll, picks }); }
        catch (e) { window.alert(e.message); return; }
      }
      await autoRefreshPoll(box);
    });
  }
  async function autoRefreshPoll(box) {
    const card = box.closest('.post-card');
    const pid = card ? card.dataset.id : '';
    if (!pid) return;
    try {
      const list = await callEdge('poll_stats_batch', { token: state.user.token, ids: [pid] });
      const np = (list || []).find((p) => p.post_id === pid);
      if (np) renderPollBox(box, np); else box.style.display = 'none';
    } catch (_e) {}
  }
  async function attachPolls(root) {
    const boxes = Array.from((root || document).querySelectorAll('[data-pollbox]'));
    if (!boxes.length) return;
    const ids = [...new Set(boxes.map((b) => { const c = b.closest('.post-card'); return c ? c.dataset.id : ''; }).filter(Boolean))].slice(0, 60);
    if (!ids.length) return;
    try {
      const list = await callEdge('poll_stats_batch', { token: loggedIn() ? state.user.token : '', ids });
      if (!Array.isArray(list)) return;
      boxes.forEach((box) => {
        const c = box.closest('.post-card');
        const pid = c ? c.dataset.id : '';
        const np = list.find((p) => p.post_id === pid);
        if (np) renderPollBox(box, np);
      });
    } catch (_e) {}
  }
  // ---------------- 问卷/投票（统一多题模型）渲染 ----------------
  function renderQuizBox(box, quiz) {
    if (!quiz) return;
    box.style.display = '';
    const my = (Array.isArray(quiz.my) ? quiz.my : []);
    const voted = !!(Array.isArray(my) && my.some((a) => (Array.isArray(a) ? a.length > 0 : (a !== null && a !== undefined && String(a).length > 0))));
    const typeLabel = quiz.quiz_type === 'poll' ? '投票' : '问卷';
    const qsHtml = (quiz.questions || []).map((qq, qi) => {
      const tag = qq.type === 'fill' ? '·填空' : (qq.type === 'multi' ? '·多选' : '·单选');
      const title = `<div class="poll-q">${escapeHtml((qq.q || '题') + ' ' + tag)}</div>`;
      if (qq.type === 'fill') {
        const myv = Array.isArray(my) ? (my[qq.index] || '') : '';
        return title + `<textarea class="poll-fill" data-q="${qq.index}" ${voted ? 'disabled' : ''} placeholder="填写你的回答">${escapeHtml(String(myv || ''))}</textarea>`;
      }
      const t = qq.type === 'multi' ? 'checkbox' : 'radio';
      const mySel = my && Array.isArray(my[qq.index]) ? my[qq.index] : (typeof my[qq.index] === 'number' ? [my[qq.index]] : []);
      const showRes = voted || quiz.closed;
      const opts = (qq.options || []).map((o, oi) => {
        if (showRes) {
          const c = qq.counts[oi] || 0;
          const pct = quiz.total ? Math.round(c / quiz.total * 100) : 0;
          const checked = voted && mySel.indexOf(oi) >= 0;
          return `<label class="poll-opt voted"><input type="${t}" name="quizq${quiz.id}_${qq.index}" data-q="${qq.index}" data-i="${oi}" ${checked ? 'checked' : ''} disabled/><span class="poll-otext">${escapeHtml(o)}</span><span class="poll-bar"><i style="width:${pct}%"></i></span><span class="poll-pct">${c} (${pct}%)</span></label>`;
        }
        return `<label class="poll-opt"><input type="${t}" name="quizq${quiz.id}_${qq.index}" data-q="${qq.index}" data-i="${oi}"/><span class="poll-otext">${escapeHtml(o)}</span></label>`;
      }).join('');
      return title + opts;
    }).join('');

    let foot = '';
    if (voted) foot = `<div class="poll-total">已有 ${quiz.total} 人参与${quiz.closed ? ' · 已结束' : ''}</div>`;
    else if (quiz.closed) foot = `<div class="poll-total">已结束 · 共 ${quiz.total} 人参与</div>`;
    else if (loggedIn()) foot = `<button class="btn poll-vote" data-quiz="${quiz.post_id}">提交</button>`;
    else foot = `<span class="poll-hint" style="font-size:11px;color:var(--faint)">登录后可作答</span>`;

    const ownerActs = quiz.is_owner
      ? `<div class="quiz-owner-acts">
          <button class="tiny-btn" data-act="quiz-detail" data-pid="${quiz.post_id}">👁 查看明细</button>
          <button class="tiny-btn" data-act="quiz-export" data-pid="${quiz.post_id}" ${quiz.feedback_available ? '' : 'disabled'}>⬇ 下载反馈${quiz.feedback_available ? '' : '（已过期）'}</button>
        </div>` : '';
    const dateNote = (quiz.expires_at && !quiz.closed)
      ? `<div class="poll-hint" style="font-size:11px;color:var(--faint)">${typeLabel === '投票' ? '🗳' : '📝'} ${typeLabel}有效期至 ${formatTime(quiz.expires_at)}</div>` : '';
    box.innerHTML = `<div class="poll-wrap">
      <div class="poll-q">${typeLabel === '投票' ? '🗳' : '📝'} ${typeLabel}${quiz.closed ? '（已结束）' : ''}</div>
      ${qsHtml}
      <div class="poll-foot">${foot}</div>
      ${ownerActs}
      ${dateNote}
      <div class="quiz-detail" data-qd="${quiz.post_id}"></div>
    </div>`;
    const sb = box.querySelector('.poll-vote');
    if (sb) sb.addEventListener('click', async () => {
      const answers = (quiz.questions || []).map((qq) => {
        if (qq.type === 'fill') {
          const ta = box.querySelector(`.poll-fill[data-q="${qq.index}"]`);
          return ta ? ta.value.trim() : '';
        }
        const sel = Array.from(box.querySelectorAll(`input[data-q="${qq.index}"]:checked`)).map((c) => Number(c.dataset.i));
        return qq.type === 'multi' ? sel : (sel.length ? sel[0] : null);
      });
      for (let i = 0; i < (quiz.questions || []).length; i++) {
        const qq = quiz.questions[i];
        if (qq.type === 'single' && (answers[i] === null || answers[i] === undefined)) { window.alert(`第 ${i + 1} 题请选择一个选项`); return; }
        if (qq.type === 'multi' && (!Array.isArray(answers[i]) || !answers[i].length)) { window.alert(`第 ${i + 1} 题请至少选择一个选项`); return; }
      }
      try { await callEdge('quiz_answer', { token: state.user.token, post_id: sb.dataset.quiz, answers }); }
      catch (e) { window.alert(e.message); return; }
      window.alert('已提交，感谢参与');
      await autoRefreshQuiz(box);
    });
    const dBtn = box.querySelector('[data-act="quiz-detail"]');
    if (dBtn) dBtn.addEventListener('click', async () => {
      const dv = box.querySelector('.quiz-detail[data-qd]');
      try {
        const st = await callEdge('quiz_stats', { token: state.user.token, post_id: dBtn.dataset.pid });
        dv.innerHTML = renderQuizDetail(st);
      } catch (e) { dv.innerHTML = `<div class="poll-hint" style="color:var(--danger)">${escapeHtml(e.message)}</div>`; }
    });
    const eBtn = box.querySelector('[data-act="quiz-export"]');
    if (eBtn) eBtn.addEventListener('click', async (ev) => {
      try {
        const r = await callEdge('quiz_export', { token: state.user.token, post_id: ev.currentTarget.dataset.pid });
        if (!r || !r.csv) { window.alert('暂无反馈数据'); return; }
        const blob = new Blob([r.csv], { type: 'text/csv;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = r.filename || '反馈数据.csv';
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      } catch (e) { window.alert(e.message); }
    });
  }
  function renderQuizDetail(st) {
    if (!st || !st.detail || !st.detail.length) return `<div class="poll-hint">暂无反馈明细</div>`;
    const qs = st.questions || [];
    let html = `<div class="quiz-detail-title">📊 详细反馈（共 ${st.detail.length} 人，仅你可见）</div><table class="quiz-detail-table"><thead><tr><th>#</th><th>用户</th>${qs.map((qq) => `<th>${escapeHtml(qq.q || ('题' + (qq.index + 1)))}</th>`).join('')}<th>提交时间</th></tr></thead><tbody>`;
    st.detail.forEach((row, ri) => {
      const a = Array.isArray(row.answers) ? row.answers : [];
      html += `<tr><td>${ri + 1}</td><td>${escapeHtml(String(row.user_nick || '').slice(0, 24) || String(row.user_id || '').slice(0, 8))}</td>`;
      qs.forEach((qq, i) => {
        const av = a[i];
        let c = '';
        const pctText = (oi) => {
          const cnt = (qq.counts && qq.counts[oi]) || 0;
          const pct = st.total ? Math.round(cnt / st.total * 100) : 0;
          return cnt ? `（${cnt}人 · ${pct}%）` : '（0%）';
        };
        if (qq.type === 'fill') c = String(av == null ? '' : av);
        else if (qq.type === 'multi') {
          c = (Array.isArray(av) ? av : []).map((k) => {
            const oi = Number(k);
            return (Number.isInteger(oi) && qq.options[oi] != null) ? qq.options[oi] + pctText(oi) : '';
          }).filter(Boolean).join(' / ');
        } else {
          const k = Number(av);
          c = (Number.isInteger(k) && qq.options[k] != null) ? qq.options[k] + pctText(k) : '';
        }
        html += `<td>${escapeHtml(c)}</td>`;
      });
      html += `<td>${formatTime(row.created_at).slice(5, 16)}</td></tr>`;
    });
    html += '</tbody></table>';
    return html;
  }
  async function autoRefreshQuiz(box) {
    const card = box.closest('.post-card');
    const pid = card ? card.dataset.id : '';
    if (!pid) return;
    try {
      const list = await callEdge('quiz_stats_batch', { token: state.user.token, ids: [pid] });
      const nq = (list || []).find((q) => q.post_id === pid);
      if (nq) renderQuizBox(box, nq); else box.style.display = 'none';
    } catch (_e) {}
  }
  async function attachQuizzes(root) {
    const boxes = Array.from((root || document).querySelectorAll('[data-quizbox]'));
    if (!boxes.length) return;
    const ids = [...new Set(boxes.map((b) => { const c = b.closest('.post-card'); return c ? c.dataset.id : ''; }).filter(Boolean))].slice(0, 60);
    if (!ids.length) return;
    try {
      const list = await callEdge('quiz_stats_batch', { token: loggedIn() ? state.user.token : '', ids });
      if (!Array.isArray(list)) return;
      boxes.forEach((box) => {
        const c = box.closest('.post-card');
        const pid = c ? c.dataset.id : '';
        const nq = list.find((q) => q.post_id === pid);
        if (nq) renderQuizBox(box, nq);
      });
    } catch (_e) {}
  }
  async function openSeriesModal(sid) {
    if (!sid) return;
    let data;
    try { data = await callEdge('series_parts', { token: loggedIn() ? state.user.token : '', series_id: sid }); } catch (_e) { return; }
    if (!data || !data.series) { window.alert('连载不存在'); return; }
    const parts = data.parts || [];
    const partsHtml = parts.map((pt) => `<div class="series-partrow" data-post="${pt.id}" style="cursor:pointer;padding:8px 10px;border-bottom:1px solid var(--line-soft)">
        📚 第 ${pt.series_part} 章 ${escapeHtml(pt.part_title || '')}
        <span style="color:var(--faint);font-size:11px">${formatTime(pt.created_at)}</span>
      </div>`).join('') || '<div style="color:var(--faint);padding:8px">暂无内容</div>';
    const ov = document.createElement('div');
    ov.className = 'modal-overlay';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px';
    ov.innerHTML = `<div style="background:var(--card,#fff);color:var(--text);border-radius:14px;max-width:520px;width:100%;max-height:80vh;overflow:auto;padding:18px;border:1px solid var(--line)">
      <div style="font-size:16px;font-weight:700;margin-bottom:4px">📚 ${escapeHtml(data.series.title || '连载')}</div>
      <div style="font-size:12px;color:var(--faint);margin-bottom:10px">作者：${escapeHtml(data.series.owner_nick)} · 共 ${parts.length} 章</div>
      ${partsHtml}
      <div style="margin-top:12px;text-align:right"><button class="btn" data-close>关闭</button></div>
    </div>`;
    document.body.appendChild(ov);
    ov.querySelector('[data-close]').addEventListener('click', () => ov.remove());
    ov.addEventListener('click', (e) => { if (e.target === ov) ov.remove(); });
    ov.querySelectorAll('.series-partrow').forEach((r) => r.addEventListener('click', () => {
      ov.remove();
      location.hash = '#post-' + r.dataset.post;
      setTimeout(() => scrollToPost(r.dataset.post), 300);
    }));
  }

  // 帖子合集详情（Lv36+）：展示合集内的帖子/连载，可移除
  async function openCollectionModal(cid) {
    if (!cid || !loggedIn()) return;
    let d;
    try { d = await callEdge('collection_detail', { token: state.user.token, collection_id: cid }); } catch (e) { window.alert(e.message); return; }
    if (!d) { window.alert('合集不存在'); return; }
    const items = d.items || [];
    const rows = items.map((it) => {
      const isSeries = !it.post_id && !!it.series_id;
      const label = isSeries ? '📚 连载' + it.series_id.slice(0, 8) : '📝 帖子' + it.post_id.slice(0, 8);
      const goto = isSeries ? it.series_id : it.post_id;
      return `<div class="col-item"><span style="flex:1;min-width:0">${label}<br><span style="color:var(--faint);font-size:11px">${formatTime(it.added_at)} 加入</span></span>
        <button class="profile-editbtn sm" data-goto="${goto}" data-gtype="${isSeries ? 'series' : 'post'}">打开</button>
        <button class="profile-editbtn sm" data-rmitem="${it.id}">移除</button></div>`;
    }).join('') || '<div style="color:var(--faint);padding:8px">合集内暂无内容</div>';
    const ov = document.createElement('div');
    ov.className = 'modal-overlay';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px';
    ov.innerHTML = `<div style="background:var(--card,#fff);color:var(--text);border-radius:14px;max-width:520px;width:100%;max-height:80vh;overflow:auto;padding:18px;border:1px solid var(--line)">
      <div style="font-size:16px;font-weight:700;margin-bottom:4px">📁 ${escapeHtml(d.title || '合集')}</div>
      <div style="font-size:12px;color:var(--faint);margin-bottom:10px">${escapeHtml(d.intro || '')} · 共 ${items.length} 项</div>
      ${rows}
      <div style="margin-top:12px;text-align:right"><button class="btn" data-close>关闭</button></div>
    </div>`;
    document.body.appendChild(ov);
    ov.querySelector('[data-close]').addEventListener('click', () => ov.remove());
    ov.addEventListener('click', (e) => { if (e.target === ov) ov.remove(); });
    ov.querySelectorAll('[data-goto]').forEach((b) => b.addEventListener('click', () => {
      const v = b.getAttribute('data-goto');
      if (b.getAttribute('data-gtype') === 'series') { ov.remove(); openSeriesModal(v); return; }
      ov.remove();
      location.hash = '#post-' + v;
      setTimeout(() => scrollToPost(v), 300);
    }));
    ov.querySelectorAll('[data-rmitem]').forEach((b) => b.addEventListener('click', async () => {
      if (!confirm('从合集中移除该项？')) return;
      try { await callEdge('collection_remove', { token: state.user.token, collection_id: cid, item_id: b.getAttribute('data-rmitem') }); ov.remove(); openCollectionModal(cid); }
      catch (e) { window.alert(e.message); }
    }));
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
      window.alert(`🪙 金牌认证成功！该帖已顶置 ${r.hours} 小时，至 ${formatTime(r.until)}。`);
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
    const lv = loggedIn() ? myLevelNow() : 0;
    // 校园萌新(11级)+：删除走「误删恢复」回收池（每月限额，24h 内可在特权中心找回）
    if (lv >= 11) {
      if (!window.confirm('删除后 24 小时内可在「特权中心 → 误删恢复」找回（每月有次数限制），确定删除？')) return;
      try {
        await callEdge('post_delete_self', { token: state.user.token, post_id: post.id });
        state.likedSet.delete(post.id); state.favSet.delete(post.id); saveLikedSet();
        const card = document.querySelector(`article[data-id="${post.id}"]`);
        if (card) card.remove();
        window.alert('✅ 已删除。24 小时内可在「特权中心 → 误删恢复」找回。');
      } catch (e) { window.alert(e.message); }
      return;
    }
    if (!window.confirm('确定删除这条帖子及其评论吗？该操作不可恢复。')) return;
    try {
      await callEdge('user_delete_post', { token: state.user.token, id: post.id });
      state.likedSet.delete(post.id); state.favSet.delete(post.id);
      const card = document.querySelector(`article[data-id="${post.id}"]`);
      if (card) card.remove();
    } catch (e) { window.alert(e.message); }
  }

  // ---------------- 加入个人帖子合集（Lv36+ 特权） ----------------
  async function addToCollection(post) {
    if (!loggedIn()) { window.alert('请先登录'); openUserModal(); return; }
    let cols = [];
    try { cols = (await callEdge('collection_list', { token: state.user.token })) || []; } catch (e) { cols = []; }
    const listTxt = cols.length ? cols.map((c, i) => (i + 1) + '. ' + c.title).join('\n') : '（暂无合集，输入 new 新建）';
    const choice = window.prompt('加入个人合集：\n输入序号加入已有合集，或输入 new 新建\n\n' + listTxt);
    if (choice == null) return;
    const v = String(choice).trim().toLowerCase();
    let cid = '';
    if (v === 'new') {
      const title = window.prompt('新建合集标题：');
      if (!title || !title.trim()) return;
      const intro = window.prompt('合集简介（可留空）：');
      try { const c = await callEdge('collection_create', { token: state.user.token, title: title.trim(), intro: (intro || '').trim() }); cid = c.id; }
      catch (e) { window.alert(e.message); return; }
    } else {
      const col = cols[parseInt(v, 10) - 1];
      if (!col) { window.alert('未找到该合集'); return; }
      cid = col.id;
    }
    try { await callEdge('collection_add', { token: state.user.token, collection_id: cid, post_id: post.id }); window.alert('✅ 已加入合集'); }
    catch (e) { window.alert(e.message); }
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
      // 经 Edge Function（service-role，绕过 RLS）拉取「我赞过的帖子」，跨设备也一致
      const list = await callEdge('user_liked_posts', { token: state.user.token });
      state.likedSet = new Set(list || []);
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
    // 用 onclick 整体覆盖避免每次重渲染叠加监听（否则编辑/置顶/删除会触发多次）
    box.onclick = (e) => {
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
    };
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
      <div class="cmt-text"><span class="cmt-content">${escapeHtml(c.content)}</span>${ownActs}</div>
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
    const txt = (item.querySelector('.cmt-content') || item.querySelector('.cmt-text')).textContent;
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
      const now = new Date().toISOString();
      let pinnedQ = supabase.from('forum_pinned_posts').select('*').eq('reviewed', true).eq('blocked', false)
        .or(`min_view_level.is.null,min_view_level.lte.${viewerViewLevel()}`)
        .or(`scheduled_for.is.null,scheduled_for.lte.${now}`)
        .order('pinned_at', { ascending: false });
      let normalBoostQ = supabase.from('forum_posts').select('*').eq('reviewed', true).eq('blocked', false)
        .or(`gold_until.gt.${now},boost_until.gt.${now},recommend_until.gt.${now}`)
        .or(`min_view_level.is.null,min_view_level.lte.${viewerViewLevel()}`)
        .or(`scheduled_for.is.null,scheduled_for.lte.${now}`)
        .order('pinned_at', { ascending: true });
      let pinnedBoostQ = supabase.from('forum_pinned_posts').select('*').eq('reviewed', true).eq('blocked', false)
        .or(`gold_until.gt.${now},boost_until.gt.${now},recommend_until.gt.${now}`)
        .or(`min_view_level.is.null,min_view_level.lte.${viewerViewLevel()}`)
        .or(`scheduled_for.is.null,scheduled_for.lte.${now}`)
        .order('pinned_at', { ascending: true });
      if (state.activeTopic) {
        pinnedQ = pinnedQ.eq('topic', state.activeTopic);
        normalBoostQ = normalBoostQ.eq('topic', state.activeTopic);
        pinnedBoostQ = pinnedBoostQ.eq('topic', state.activeTopic);
      }
      const [pinnedResult, normalBoostResult, pinnedBoostResult] = await Promise.all([
        pinnedQ,
        normalBoostQ.limit(30),
        pinnedBoostQ.limit(30)
      ]);
      const basePinned = pinnedResult.data || [];
      const boosted = [...(normalBoostResult.data || []), ...(pinnedBoostResult.data || [])];
      // 同一帖子可能同时存在于“普通状态流”和“管理员顶置表”，按 id 去重，避免重复展示。
      const byId = new Map();
      [...boosted, ...basePinned].forEach((p) => {
        if (!byId.has(p.id)) byId.set(p.id, p);
      });
      const rows = [...byId.values()];
      rows.sort((a, b) => {
        const ag = a.gold_until && new Date(a.gold_until).getTime() > Date.now();
        const bg = b.gold_until && new Date(b.gold_until).getTime() > Date.now();
        if (ag !== bg) return ag ? -1 : 1;
        const at = new Date(a.pinned_at || a.created_at || 0).getTime();
        const bt = new Date(b.pinned_at || b.created_at || 0).getTime();
        return bt - at;
      });
      els.pinnedFeed.innerHTML = '';
      const authorMap = await resolveAuthors(rows);
      const cards = rows.map((p) => makeCard(p, { pinned: true, boosted: !!p.boost_until, authorMap }));
      cards.forEach((c) => els.pinnedFeed.appendChild(c));
      attachPolls(els.pinnedFeed); attachQuizzes(els.pinnedFeed);
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
    attachPolls(els.feed); attachQuizzes(els.feed);
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
    const lv = myLevelNow();
    const priv = myPriv();
    const canPoll = lv >= 11, canSeries = lv >= 21, canSp = lv >= 55;
    const canSched = !!priv.sched, canLvlgate = !!priv.lvlgate;
    const any = canPoll || canSeries || canSp || canSched || canLvlgate;
    wrap.classList.toggle('hidden', !any);
    if (!any) return;
    const lvSel = els.minViewLevel;
    if (lvSel) {
      lvSel.style.display = canLvlgate ? '' : 'none';
      if (lvSel.dataset.lv !== String(lv)) {
        const prev = lvSel.value;
        lvSel.innerHTML = '<option value="0">所有等级可见</option>' +
          (lv > 1 ? Array.from({ length: lv - 1 }, (_, i) => i + 2)
            .map((n) => `<option value="${n}">仅 Lv.${n} 以上可见</option>`).join('') : '');
        lvSel.dataset.lv = String(lv);
        if (lvSel.querySelector('option[value="' + prev + '"]')) lvSel.value = prev;
      }
    }
    if (els.scheduleAt) els.scheduleAt.style.display = canSched ? '' : 'none';
    if (els.pollBuilder) els.pollBuilder.classList.toggle('hidden', !canPoll);
    if (els.seriesBox) els.seriesBox.classList.toggle('hidden', !canSeries);
    if (els.spPanel) { els.spPanel.classList.toggle('hidden', !canSp); if (canSp) { renderStationeryPalette(); updateSpPreview(); } }
    updateDraftBar();
    if (els.privHint) {
      const parts = [];
      if (canPoll) parts.push('可插入投票/问卷');
      if (canSeries) parts.push('可发连载帖');
      if (canSp) parts.push('自定义信纸');
      if (canSched) parts.push('可定时发布');
      if (canLvlgate) parts.push('可设等级可见');
      if (priv.recommend) parts.push('可推荐他人帖子');
      els.privHint.textContent = '我的发帖特权：' + parts.join(' · ');
    }
  }

  // ---------------- 投票 / 问卷构建器（Lv11+）：投票=单题单选至多10选项；问卷=至多20题 单选/多选/填空 单选多选至多6选项 ----------------
  let quizItems = [];     // { type:'single'|'multi'|'fill', q:'', opts:[] }
  let quizBuilderType = '';   // '' | 'poll' | 'quiz'
  const QUIZ_MAX_QUESTIONS = 20;
  const QUIZ_MAX_OPTS = 10;
  const QUIZ_MAX_QOPTS = 6;
  function quizCardTypeLabel(t) { return t === 'single' ? '单选' : (t === 'multi' ? '多选' : '填空'); }
  function renderQuizEditor() {
    const area = els.quizQuestions; const note = els.quizTypeNote;
    if (!area) return;
    const t = quizBuilderType;
    if (note) note.textContent = t === 'poll'
      ? '投票：单个问题、单选，至多 10 个选项。发布后投票功能保留 30 天，之后仅发帖者可下载反馈数据（保留 7 天）。'
      : t === 'quiz'
        ? '问卷：至多 20 题，每题可设单选/多选/填空；单选/多选每题至多 6 个选项。发布后保留 30 天，之后仅发帖者可下载反馈（保留 7 天）。'
        : '';
    if (t === 'poll') {
      if (quizItems.length !== 1) quizItems = [{ type: 'single', q: '', opts: [] }];
      area.innerHTML = renderQuizCard(0, true);
      bindQuizEditor(area);
      if (els.addQuestionBtn) els.addQuestionBtn.style.display = 'none';
      return;
    }
    if (t === 'quiz') {
      if (!quizItems.length) quizItems = [{ type: 'single', q: '', opts: [] }];
      area.innerHTML = quizItems.map((it, i) => renderQuizCard(i, false)).join('');
      bindQuizEditor(area);
      if (els.addQuestionBtn) { els.addQuestionBtn.style.display = ''; els.addQuestionBtn.textContent = '＋ 添加题目（' + quizItems.length + '/' + QUIZ_MAX_QUESTIONS + '）'; }
      return;
    }
    area.innerHTML = '';
    if (els.addQuestionBtn) els.addQuestionBtn.style.display = 'none';
  }
  function escapeAttr(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function renderQuizCard(i, isPoll) {
    const it = quizItems[i]; const opts = it.opts || [];
    const maxOpts = isPoll ? QUIZ_MAX_OPTS : QUIZ_MAX_QOPTS;
    const isFill = it.type === 'fill';
    const typeCell = isPoll
      ? '<span class="quiz-card-num" style="font-weight:700;color:var(--accent,#e07a5f)">🗳 单选</span>'
      : '<select class="quiz-qtype" data-i="' + i + '">' +
          ['single', 'multi', 'fill'].map((t) => '<option value="' + t + '"' + (it.type === t ? ' selected' : '') + '>' + quizCardTypeLabel(t) + '</option>').join('') +
        '</select>';
    return '<div class="quiz-card" data-i="' + i + '">' +
      '<div class="quiz-card-head"><span class="quiz-card-num">' + (isPoll ? '投票' : '第 ' + (i + 1) + ' 题') + '</span>' + typeCell +
      (isPoll ? '' : '<button type="button" class="pb-del quiz-del" data-i="' + i + '" title="删除此题">✕</button>') + '</div>' +
      '<input class="quiz-q" type="text" maxlength="60" data-i="' + i + '" placeholder="' + (isPoll ? '投票问题（例如：你最喜欢的季节？）' : '请输入题目内容') + '" value="' + escapeAttr(it.q || '') + '" />' +
      (isFill ? '<div class="quiz-fill-hint">· 填空题：回答者自由填写文字，无需选项</div>' :
        '<div class="quiz-opts">' +
          opts.map((o, k) => '<div class="pb-opt"><input type="text" maxlength="40" data-q="' + i + '" data-o="' + k + '" class="quiz-opt" placeholder="选项' + (k + 1) + '" value="' + escapeAttr(o || '') + '" /><button type="button" class="pb-del quiz-opt-del" data-i="' + i + '" data-k="' + k + '">✕</button></div>').join('') +
          '<button type="button" class="btn-ds pb-add quiz-add-opt" data-i="' + i + '">＋ 添加选项（' + opts.length + '/' + maxOpts + '）</button>' +
        '</div>') +
      '</div>';
  }
  function bindQuizEditor(area) {
    area.querySelectorAll('.quiz-qtype').forEach((s) => s.addEventListener('change', () => { const i = +s.dataset.i; quizItems[i].type = s.value; quizItems[i].opts = []; renderQuizEditor(); }));
    area.querySelectorAll('.quiz-q').forEach((inp) => inp.addEventListener('input', () => { const i = +inp.dataset.i; quizItems[i].q = inp.value.trim(); }));
    area.querySelectorAll('.quiz-opt').forEach((inp) => inp.addEventListener('input', () => { quizItems[+inp.dataset.q].opts[+inp.dataset.o] = inp.value.trim(); }));
    area.querySelectorAll('.quiz-opt-del').forEach((b) => b.addEventListener('click', () => { const i = +b.dataset.i, k = +b.dataset.k; quizItems[i].opts.splice(k, 1); renderQuizEditor(); }));
    area.querySelectorAll('.quiz-add-opt').forEach((b) => b.addEventListener('click', () => {
      const i = +b.dataset.i; const maxOpts = (quizBuilderType === 'poll' ? QUIZ_MAX_OPTS : QUIZ_MAX_QOPTS);
      if (quizItems[i].opts.length >= maxOpts) { window.alert('该题选项最多 ' + maxOpts + ' 个'); return; }
      quizItems[i].opts.push(''); renderQuizEditor();
    }));
    area.querySelectorAll('.quiz-del').forEach((b) => b.addEventListener('click', () => { quizItems.splice(+b.dataset.i, 1); renderQuizEditor(); }));
  }
  function quizPayload() {
    const t = quizBuilderType; if (!t) return null;
    if (!els.pollQtype || els.pollQtype.value !== t) return null;
    if (t === 'poll') {
      const it = quizItems[0] || {};
      const q = (it.q || '').trim(); const opts = (it.opts || []).map((o) => String(o || '').trim()).filter(Boolean);
      if (!q) { window.alert('请填写投票问题'); return '::invalid'; }
      if (opts.length < 2) { window.alert('投票至少需要 2 个选项'); return '::invalid'; }
      if (opts.length > QUIZ_MAX_OPTS) { window.alert('投票选项最多 ' + QUIZ_MAX_OPTS + ' 个'); return '::invalid'; }
      return { quiz_type: 'poll', quiz_questions: [{ type: 'single', q, options: opts }] };
    }
    if (!quizItems.length) { window.alert('请至少添加一个题目'); return '::invalid'; }
    const clean = [];
    for (let i = 0; i < quizItems.length; i++) {
      const it = quizItems[i]; const q = (it.q || '').trim();
      if (!q) { window.alert('第 ' + (i + 1) + ' 题缺少题目内容'); return '::invalid'; }
      if (it.type === 'fill') { clean.push({ type: 'fill', q, options: [] }); continue; }
      const opts = (it.opts || []).map((o) => String(o || '').trim()).filter(Boolean);
      if (opts.length < 2) { window.alert('第 ' + (i + 1) + ' 题（' + quizCardTypeLabel(it.type) + '）至少需要 2 个选项'); return '::invalid'; }
      if (opts.length > QUIZ_MAX_QOPTS) { window.alert('第 ' + (i + 1) + ' 题选项最多 ' + QUIZ_MAX_QOPTS + ' 个'); return '::invalid'; }
      clean.push({ type: it.type, q, options: opts });
    }
    return { quiz_type: 'quiz', quiz_questions: clean };
  }

  // ---------------- 连载模式（Lv21+） ----------------
  async function refreshSeriesSelect() {
    const sel = els.seriesSelect;
    if (!sel) return;
    const cur = sel.value;
    let list = [];
    try { list = (await callEdge('series_my', { token: state.user.token })) || []; } catch (_e) {}
    sel.innerHTML = '<option value="__new__">＋ 创建新的连载</option>' +
      '<option value="" disabled>—— 追加到已有连载 ——</option>' +
      list.map((s) => '<option value="' + escapeHtml(s.id) + '">📚 ' + escapeHtml(s.title || '未命名') + '</option>').join('');
    if (cur && sel.querySelector('option[value="' + cur + '"]')) sel.value = cur;
    else sel.value = '__new__';
  }
  function seriesPayload() {
    if (!els.seriesOn || !els.seriesOn.checked) return {};
    const raw = els.seriesSelect ? els.seriesSelect.value : '';
    const existing = raw === '__new__' ? '' : raw;
    const newTitle = els.seriesTitle ? els.seriesTitle.value.trim() : '';
    const partTitle = els.seriesPartTitle ? els.seriesPartTitle.value.trim() : '';
    if (!existing && !newTitle) { window.alert('请填写连载大标题（新建时），或选择要追加的已有连载'); return '::invalid'; }
    const p = { part_title: partTitle };
    if (existing) p.series_id = existing;
    else p.series_new_title = newTitle;
    return p;
  }

  // ---------------- 校史留名专属信纸（Lv55+） ----------------
  const STATIONERY_FRAMES = [['none', '无'], ['gold-line', '淡金线框'], ['ink-border', '墨色描边'], ['gradient', '渐变底'], ['double', '双重框'], ['neon', '霓虹'], ['shadow', '深影']];
  const STATIONERY_EFFECTS = [['none', '无'], ['glow', '光晕'], ['3d', '立体'], ['gradient', '渐变字'], ['glitter', '闪烁'], ['sparkle', '星闪']];
  const STATIONERY_GLOWS = [['none', '无'], ['gold', '鎏金'], ['amber', '琥珀'], ['blue', '幽蓝'], ['purple', '幻紫'], ['pink', '樱粉'], ['green', '青翠']];
  const STATIONERY_FONTCOLORS = [['none', '默认'], ['gold', '鎏金'], ['white', '雪白'], ['red', '赤红'], ['blue', '湛蓝'], ['purple', '贵紫'], ['teal', '青碧'], ['rainbow', '虹彩']];
  const spState = { frame: 'none', effect: 'none', glow: 'none', fontcolor: 'none' };
  function renderStationeryPalette() {
    if (!els.spPanel) return;
    const sets = { frame: STATIONERY_FRAMES, effect: STATIONERY_EFFECTS, glow: STATIONERY_GLOWS, fontcolor: STATIONERY_FONTCOLORS };
    els.spPanel.querySelectorAll('[data-sp]').forEach((h) => {
      const key = h.getAttribute('data-sp');
      const map = sets[key] || [];
      h.innerHTML = map.map(([v, label]) =>
        '<button type="button" class="sp-swatch" data-val="' + v + '"' + (v === spState[key] ? ' data-on' : '') + '>' + label + '</button>').join('');
      h.querySelectorAll('.sp-swatch').forEach((b) => b.addEventListener('click', () => {
        spState[key] = b.getAttribute('data-val');
        renderStationeryPalette();
        updateSpPreview();
      }));
    });
  }
  function updateSpPreview() {
    if (!els.spPreview) return;
    els.spPreview.className = 'sp-preview cs-style cs-' + spState.frame + ' fx-' + spState.effect + ' gc-' + spState.glow + ' fc-' + spState.fontcolor;
    els.spPreview.textContent = '信纸预览：' + (spState.frame !== 'none' ? '边框·' : '') + (spState.effect !== 'none' ? '字体·' : '') + (spState.glow !== 'none' ? '光晕·' : '') + (spState.fontcolor !== 'none' ? '配色·' : '') + '这是你的专属信纸';
  }
  function cardStylePayload() {
    if (myLevelNow() < 55) return null;
    const cs = spState;
    if (cs.frame === 'none' && cs.effect === 'none' && cs.glow === 'none' && cs.fontcolor === 'none') return null;
    return { card_style: { frame: cs.frame, font_effect: cs.effect, glow_color: cs.glow, font_color: cs.fontcolor } };
  }

  // ---------------- 草稿本地自动保存（Lv11+） ----------------
  const DRAFT_KEY = 'nzb_draft_v1';
  function saveDraft() {
    if (!loggedIn() || myLevelNow() < 11) return;
    let obj = { content: els.content.value, topic: els.topicSelect.value };
    if (!loggedIn()) obj.nickname = els.nickname.value;
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(obj)); } catch (_e) {}
    updateDraftBar();
  }
  function loadDraft() {
    if (!loggedIn() || myLevelNow() < 11) return;
    let d; try { d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); } catch (_e) { return; }
    if (!d || !d.content) return;
    els.content.value = d.content;
    if (d.topic && els.topicSelect && els.topicSelect.querySelector('option[value="' + d.topic + '"]')) els.topicSelect.value = d.topic;
    if (d.nickname && !loggedIn()) els.nickname.value = d.nickname;
    updateCharCount();
    updateDraftBar();
    if (els.composeHint) els.composeHint.textContent = '已载入上次保存的草稿，可直接发布或继续编辑。';
  }
  function clearDraft() { try { localStorage.removeItem(DRAFT_KEY); } catch (_e) {} updateDraftBar(); }
  function hasDraft() { try { const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); return !!(d && d.content); } catch (_e) { return false; } }
  function updateDraftBar() {
    if (!els.draftBar) return;
    const on = loggedIn() && myLevelNow() >= 11;
    els.draftBar.style.display = on ? '' : 'none';
    const tag = els.draftBar.querySelector('span');
    if (tag) tag.textContent = on ? (hasDraft() ? '💾 已保存并缓冲本地草稿' : '💾 草稿会自动保存在本机') : '';
  }
  function clearComposerExtras() {
    if (els.pollQtype) els.pollQtype.value = '';
    quizBuilderType = ''; quizItems = [];
    if (els.quizQuestions) els.quizQuestions.innerHTML = '';
    if (els.quizTypeNote) els.quizTypeNote.textContent = '';
    if (els.addQuestionBtn) els.addQuestionBtn.style.display = 'none';
    if (els.seriesOn) els.seriesOn.checked = false;
    if (els.seriesFields) els.seriesFields.classList.add('hidden');
    if (els.seriesTitle) els.seriesTitle.value = '';
    if (els.seriesSelect) els.seriesSelect.value = '';
    if (els.seriesPartTitle) els.seriesPartTitle.value = '';
    spState.frame = 'none'; spState.effect = 'none'; spState.glow = 'none'; spState.fontcolor = 'none';
    renderStationeryPalette(); updateSpPreview();
  }

  // ---------------- 向认证答主提问 + 学长答疑帖（新增，仅登录用户可见） ----------------
  let myMentorApps = []; // 当前用户的历史认证申请
  async function loadMyMentorApps() {
    if (!loggedIn()) { myMentorApps = []; return; }
    try { myMentorApps = (await callEdge('mentor_my', { token: state.user.token })) || []; }
    catch (_e) { myMentorApps = []; }
  }
  function isApprovedMentorFor(topic) {
    return myMentorApps.some((r) => r.status === 'approved' && r.topic === topic);
  }
  function setupMentorComposer() {
    if (els.composerMentorWrap) return;
    const wrap = document.createElement('div');
    wrap.id = 'composerMentorWrap';
    wrap.className = 'composer-priv hidden';
    wrap.innerHTML = `
      <label>🙋 向认证答主提问
        <select id="postAskMentor"><option value="">不提问</option></select>
      </label>
      <label id="postResolveLabel" style="display:none;align-items:center;gap:6px;cursor:pointer"><input type="checkbox" id="postResolve" /> 🧑‍🏫 学长答疑帖</label>
      <span id="composerMentorHint" class="hint-line" style="font-size:11px;color:var(--faint)"></span>`;
    if (els.composeWarn && els.composeWarn.parentNode) {
      els.composeWarn.parentNode.insertBefore(wrap, els.composeWarn);
    }
    els.composerMentorWrap = wrap;
    els.postAskMentor = $('postAskMentor');
    els.postResolve = $('postResolve');
    if (els.topicSelect) els.topicSelect.addEventListener('change', () => { refreshMentorComposer(); });
    loadMyMentorApps().then(refreshMentorComposer, refreshMentorComposer);
  }
  async function refreshMentorComposer() {
    if (!loggedIn() || !els.postAskMentor) {
      if (els.composerMentorWrap) els.composerMentorWrap.classList.add('hidden');
      return;
    }
    els.composerMentorWrap.classList.remove('hidden');
    const topic = els.topicSelect.value;
    const cur = els.postAskMentor.value;
    let options = '<option value="">不提问</option>';
    try {
      const list = (await callEdge('mentor_list', { topic })) || [];
      options += list.map((m) => `<option value="${m.id}">${escapeHtml(m.ask_title)}（${escapeHtml(m.nickname)}）</option>`).join('');
    } catch (_e) { /* 离线也可正常发帖 */ }
    els.postAskMentor.innerHTML = options;
    if (els.postAskMentor.querySelector('option[value="' + cur + '"]')) els.postAskMentor.value = cur; else els.postAskMentor.value = '';
    const showResolve = isApprovedMentorFor(topic);
    if (els.postResolve && els.postResolve.parentNode) els.postResolve.parentNode.style.display = showResolve ? 'inline-flex' : 'none';
  }
  // ---------------- 全站广播弹窗（新增） ----------------
  async function loadBroadcasts() {
    try {
      const list = (await callEdge('broadcast_list', {})) || [];
      for (const b of list) {
        const id = b.id;
        if (!id) continue;
        const key = 'seen_broadcast_' + id;
        let seen = false;
        try { seen = !!localStorage.getItem(key); } catch (_e) { seen = false; }
        if (seen) continue;
        try { localStorage.setItem(key, '1'); } catch (_e) {}
        const head = (b.nickname ? b.nickname + ' · ' : '') + (b.title || '全站广播');
        const stamp = b.created_at ? ('\n\n' + formatTime(b.created_at)) : '';
        renderPopup({ title: head, content: (b.content || '') + stamp });
        return;
      }
    } catch (_e) { /* 不打断登录/初始化流程 */ }
  }
  // ---------------- 个人中心「特权中心」面板（新增，仅当前登录用户） ----------------
  function mentorStatusBadge(status) {
    const s = String(status || '').toLowerCase();
    if (s === 'pending' || s === 'reviewing' || s === '0' || s === 'waiting') return '<span style="color:var(--warn);font-weight:700">待审核</span>';
    if (s === 'approved' || s === '1' || s === 'passed') return '<span style="color:var(--ok);font-weight:700">已通过</span>';
    if (s === 'rejected' || s === '2') return '<span style="color:var(--bad,var(--danger));font-weight:700">未通过</span>';
    if (s === 'closed' || s === '3') return '<span style="color:var(--faint);font-weight:700">已关闭</span>';
    return '<span style="color:var(--muted)">' + escapeHtml(status) + '</span>';
  }
  async function renderPrivilegeCenter(body) {
    if (!body) return;
    // renderPrivilegeCenter 仅在 openProfile 中调用，且只对当前登录用户（data.canEdit 为真）插入面板
    const anchor = body.querySelector('.profile-cview');
    if (!anchor) return;
    const host = document.createElement('div');
    host.className = 'prof-privcenter';
    host.style.cssText = 'border:1px solid var(--line-soft);border-radius:12px;padding:14px;margin-top:14px';
    const lv = myLevelNow();
    host.innerHTML = `
      <div class="pf-vis-title">⭐ 特权中心（仅自己可见）</div>
      <div style="margin-bottom:14px;border-top:1px solid var(--line-soft);padding-top:12px">
        <div class="pf-vis-title">🎓 认证答主申请</div>
        <label class="pf-label">领域 <select id="pcTopic"></select></label>
        <label class="pf-label">擅长标题/简介 <input class="pf-input" id="pcAskTitle" placeholder="一句话说明你擅长的领域（将展示给提问者）" /></label>
        <button class="profile-editbtn" data-pcapplybtn>✅ 申请答主</button>
        <div style="font-size:11px;color:var(--faint);margin-top:4px">认证答主数量不限；同一账号最多同时担任 <b>3</b> 个话题的认证答主（待审核+已通过均占名额）。</div>
        <div data-pcmyapps style="margin-top:8px;font-size:12px"><span style="color:var(--faint)">加载中…</span></div>
      </div>
      ${lv >= 21 ? `<div style="margin-bottom:14px;border-top:1px solid var(--line-soft);padding-top:12px">
        <div class="pf-vis-title">👀 谁看过我的帖子（校园百事通+）</div>
        <button class="profile-editbtn" data-statsbtn>查看统计</button>
        <div data-statsbox style="margin-top:8px"></div>
      </div>` : ''}
      ${lv >= 36 ? `<div style="margin-bottom:14px;border-top:1px solid var(--line-soft);padding-top:12px">
        <div class="pf-vis-title">⭐ 特别关注管理（风云学长+）</div>
        <div data-followlist style="font-size:12px;margin-bottom:8px"><span style="color:var(--faint)">加载中…</span></div>
        <label class="pf-label">添加特别关注 <input class="pf-input" id="pcFollowId" placeholder="输入目标用户 ID" /></label>
        <button class="profile-editbtn" data-followbtn>添加关注</button>
      </div>` : ''}
      ${lv >= 11 ? `<div style="margin-bottom:14px;border-top:1px solid var(--line-soft);padding-top:12px">
        <div class="pf-vis-title">♻️ 误删恢复（校园萌新+，删除后 24h 内可找回）</div>
        <div data-recyclebox style="font-size:12px;margin-top:6px"><span style="color:var(--faint)">加载中…</span></div>
      </div>` : ''}
      ${lv >= 36 ? `<div style="margin-bottom:14px;border-top:1px solid var(--line-soft);padding-top:12px">
        <div class="pf-vis-title">🚩 我被举报的历史记录（风云学长+）</div>
        <div data-reportbox style="font-size:12px;margin-top:6px"><span style="color:var(--faint)">加载中…</span></div>
      </div>` : ''}
      ${lv >= 36 ? `<div style="margin-bottom:14px;border-top:1px solid var(--line-soft);padding-top:12px">
        <div class="pf-vis-title">📁 帖子合集管理（风云学长+）</div>
        <label class="pf-label">新建合集标题 <input class="pf-input" id="pcColTitle" placeholder="合集标题" /></label>
        <button class="profile-editbtn" data-colcreatebtn>创建合集</button>
        <div data-colbox style="font-size:12px;margin-top:8px"><span style="color:var(--faint)">加载中…</span></div>
      </div>` : ''}
      <div style="margin-bottom:14px;border-top:1px solid var(--line-soft);padding-top:12px">
        <div class="pf-vis-title">📚 我的连载（点击「查看目录」查看连载内的全部帖子）</div>
        <div data-serialsbox style="font-size:12px;margin-top:8px"><span style="color:var(--faint)">加载中…</span></div>
      </div>
      ${lv >= 46 ? `<div style="margin-bottom:14px;border-top:1px solid var(--line-soft);padding-top:12px">
        <div class="pf-vis-title">🏆 我的等级排名（校园传说+）</div>
        <div data-rankbox style="font-size:12px;margin-top:6px"></div>
      </div>` : ''}
      ${lv >= 46 ? `<div style="border-top:1px solid var(--line-soft);padding-top:12px">
        <div class="pf-vis-title">📢 全站广播（校园传说+，每周 1 条）</div>
        <label class="pf-label">标题 <input class="pf-input" id="pcBcTitle" placeholder="广播标题" /></label>
        <label class="pf-label">内容 <textarea class="pf-input" id="pcBcContent" placeholder="广播内容（全站用户可见）"></textarea></label>
        <button class="profile-editbtn" data-bcbtn>发送全站广播</button>
        <div data-bcmsg style="margin-top:6px;font-size:12px"></div>
      </div>` : ''}`;
    if (anchor.nextSibling) anchor.parentNode.insertBefore(host, anchor.nextSibling); else anchor.parentNode.appendChild(host);

    // 认证答主申请
    const topicSel = host.querySelector('#pcTopic');
    if (topicSel) {
      const opts = [];
      TOPICS.forEach((t) => opts.push('<option value="' + escapeHtml(t) + '">' + escapeHtml(t) + '</option>'));
      (customTopics || []).forEach((ct) => { if (ct && ct.display_name) opts.push('<option value="' + escapeHtml(ct.display_name) + '">' + escapeHtml(ct.display_name) + '（自建）</option>'); });
      topicSel.innerHTML = opts.join('');
    }
    const myappsHost = host.querySelector('[data-pcmyapps]');
    async function updateMyApps() {
      try {
        const apps = (await callEdge('mentor_my', { token: state.user.token })) || [];
        myMentorApps = apps;
        if (myappsHost) myappsHost.innerHTML = apps.length
          ? apps.map((a) => `<div style="padding:6px 0;border-bottom:1px solid var(--line-soft)"><span style="font-weight:700">${escapeHtml(a.topic)}</span> · ${mentorStatusBadge(a.status)}<div style="color:var(--faint)">${escapeHtml(a.ask_title || '')}</div></div>`).join('')
          : '<span style="color:var(--faint)">暂无申请记录</span>';
      } catch (_e) { if (myappsHost) myappsHost.innerHTML = '<span style="color:var(--faint)">加载失败</span>'; }
    }
    updateMyApps();
    const applyBtn = host.querySelector('[data-pcapplybtn]');
    if (applyBtn) applyBtn.addEventListener('click', async () => {
      const topic = topicSel ? topicSel.value : '';
      const ask_title = (host.querySelector('#pcAskTitle') || {}).value || '';
      if (!topic) { window.alert('请选择认证领域'); return; }
      if (!ask_title.trim()) { window.alert('请填写擅长描述'); return; }
      applyBtn.disabled = true;
      try {
        await callEdge('mentor_apply', { token: state.user.token, topic, ask_title });
        window.alert('✅ 认证答主申请已提交，等待审核。');
        updateMyApps();
      } catch (e) { window.alert(e.message || '申请失败'); }
      applyBtn.disabled = false;
    });

    // 谁看过我的帖子
    const statsBtn = host.querySelector('[data-statsbtn]');
    const statsBox = host.querySelector('[data-statsbox]');
    if (statsBtn && statsBox) statsBtn.addEventListener('click', async () => {
      statsBtn.disabled = true;
      try {
        const st = (await callEdge('view_stats', { token: state.user.token })) || {};
        const hours = st.hours || [];
        const max = Math.max(1, ...hours.map(Number).filter((n) => Number.isFinite(n)));
        const bar = hours.map((h, i) => {
          const c = Math.max(0, Math.round((Number(h) || 0) / max * 30));
          return `${String(i).padStart(2, '0')}时 █`.padEnd(6, ' ') + '█'.repeat(c) + (Number(h) ? ' ' + h : '');
        }).join('<br>');
        statsBox.innerHTML = `<div>📊 总浏览量：<b>${st.total_views || 0}</b> ／ 访客数：<b>${st.total_viewers || 0}</b></div><div style="margin-top:8px;font-size:12px;line-height:1.7">${bar}</div>`;
      } catch (e) { statsBox.innerHTML = '<span style="color:var(--bad,var(--danger))">' + escapeHtml(e.message || '统计失败') + '</span>'; }
      statsBtn.disabled = false;
    });

    // 特别关注管理
    const followList = host.querySelector('[data-followlist]');
    async function updateFollows() {
      try {
        const follows = (await callEdge('follow_list', { token: state.user.token })) || [];
        if (followList) followList.innerHTML = follows.length
          ? follows.map((f) => `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--line-soft)">${escapeHtml(f.nickname)}（Lv.${f.level || '?'}）<button class="profile-editbtn" data-followrm="${f.user_id}" style="font-size:11px">移除</button></div>`).join('')
          : '<span style="color:var(--faint)">暂无特别关注</span>';
        if (followList) followList.querySelectorAll('[data-followrm]').forEach((b) => b.addEventListener('click', async () => {
          const tid = b.getAttribute('data-followrm');
          if (!tid || !confirm('确认取消特别关注该用户？')) return;
          try { await callEdge('follow_remove', { token: state.user.token, target_id: tid }); updateFollows(); } catch (e) { window.alert(e.message); }
        }));
      } catch (_e) { if (followList) followList.innerHTML = '<span style="color:var(--faint)">加载失败</span>'; }
    }
    if (followList) updateFollows();
    const followBtn = host.querySelector('[data-followbtn]');
    if (followBtn) followBtn.addEventListener('click', async () => {
      const id = (host.querySelector('#pcFollowId') || {}).value || '';
      if (!id) { window.alert('请输入要特别关注的用户 ID'); return; }
      followBtn.disabled = true;
      try {
        await callEdge('follow_add', { token: state.user.token, target_id: id });
        window.alert('✅ 已添加特别关注。');
        updateFollows();
        if (host.querySelector('#pcFollowId')) host.querySelector('#pcFollowId').value = '';
      } catch (e) { window.alert(e.message || '添加失败'); }
      followBtn.disabled = false;
    });

    // 全站广播
    const bcBtn = host.querySelector('[data-bcbtn]');
    const bcMsg = host.querySelector('[data-bcmsg]');
    if (bcBtn && bcMsg) bcBtn.addEventListener('click', async () => {
      const title = (host.querySelector('#pcBcTitle') || {}).value || '';
      const content = (host.querySelector('#pcBcContent') || {}).value || '';
      if (!title.trim() || !content.trim()) { window.alert('请填写广播标题和内容'); return; }
      bcBtn.disabled = true;
      bcMsg.innerHTML = '';
      try {
        await callEdge('broadcast_send', { token: state.user.token, title, content });
        bcMsg.innerHTML = '<span style="color:var(--ok)">✅ 全站广播已发送（每周限 1 条）。</span>';
      } catch (e) { bcMsg.innerHTML = '<span style="color:var(--bad,var(--danger))">' + escapeHtml(e.message || '发送失败') + '</span>'; }
      bcBtn.disabled = false;
    });

    // 误删恢复（Lv11+）
    const recycleBox = host.querySelector('[data-recyclebox]');
    if (recycleBox) {
      async function showRecycle() {
        try {
          const rows = (await callEdge('recycle_mine', { token: state.user.token })) || [];
          recycleBox.innerHTML = rows.length
            ? rows.map((r) => `<div class="pc-row"><span style="flex:1;min-width:0"><b>${escapeHtml(r.topic)}</b> · ${escapeHtml((r.content || '').slice(0, 20))}…<br><span style="color:var(--faint);font-size:11px">${formatTime(r.deleted_at)} 删</span></span><button class="profile-editbtn sm" data-restore="${r.id}">↩️ 找回</button></div>`).join('')
            : '<span style="color:var(--faint)">回收站为空，暂无 24h 内可恢复的帖子</span>';
          recycleBox.querySelectorAll('[data-restore]').forEach((b) => b.addEventListener('click', async () => {
            if (!confirm('确认恢复这篇帖子？')) return;
            try { await callEdge('restore_self_post', { token: state.user.token, post_id: b.getAttribute('data-restore') }); window.alert('✅ 已恢复（消耗 1 次本月恢复额度）。'); showRecycle(); refreshProfile(); }
            catch (e) { window.alert(e.message); }
          }));
        } catch (_e) { recycleBox.innerHTML = '<span style="color:var(--faint)">加载失败</span>'; }
      }
      showRecycle();
    }

    // 被举报历史（Lv36+）
    const reportBox = host.querySelector('[data-reportbox]');
    if (reportBox) {
      (async () => {
        try {
          const rows = (await callEdge('report_mine', { token: state.user.token })) || [];
          reportBox.innerHTML = rows.length
            ? rows.map((r) => `<div class="pc-row"><span style="flex:1;min-width:0"><b>${escapeHtml(r.target_type)}</b> · ${escapeHtml(r.reason || '')}<br><span style="color:var(--faint);font-size:11px">${formatTime(r.created_at)} · 状态：${r.status || ''} ${r.result ? '· 结果：' + escapeHtml(r.result) : ''}</span></span></div>`).join('')
            : '<span style="color:var(--faint)">暂无被举报记录</span>';
        } catch (_e) { reportBox.innerHTML = '<span style="color:var(--faint)">加载失败</span>'; }
      })();
    }

    // 帖子合集管理（Lv36+）
    const colBox = host.querySelector('[data-colbox]');
    const colCreateBtn = host.querySelector('[data-colcreatebtn]');
    if (colBox) {
      async function showCollections() {
        try {
          const list = (await callEdge('collection_list', { token: state.user.token })) || [];
          colBox.innerHTML = list.length
            ? list.map((c) => {
              const pubLabel = c.is_public
                ? '<span style="color:var(--ok);font-size:11px;margin-left:6px">🌍 公开</span>'
                : '<span style="color:var(--faint);font-size:11px;margin-left:6px">🔒 私密</span>';
              return `<div class="pc-row"><span style="flex:1;min-width:0"><b>📁 ${escapeHtml(c.title)}</b>${pubLabel}<br><span style="color:var(--faint);font-size:11px">${escapeHtml(c.intro || '')}</span></span>
                <button class="profile-editbtn sm" data-colopen="${c.id}" title="查看合集内容（关闭个人中心）">查看</button>
                <button class="profile-editbtn sm" data-colpub="${c.id}" data-on="${c.is_public ? 1 : 0}">${c.is_public ? '设为私密' : '设为公开'}</button>
                <button class="profile-editbtn sm" data-colrm="${c.id}">删除</button></div>`;
            }).join('')
            : '<span style="color:var(--faint)">暂无合集，创建第一个吧</span>';
          colBox.querySelectorAll('[data-colopen]').forEach((b) => b.addEventListener('click', () => { closeProfileModal(); openCollectionModal(b.getAttribute('data-colopen')); }));
          colBox.querySelectorAll('[data-colpub]').forEach((b) => b.addEventListener('click', async () => {
            const cid = b.getAttribute('data-colpub'); const on = b.getAttribute('data-on') === '1';
            try { await callEdge('collection_update', { token: state.user.token, collection_id: cid, is_public: !on }); showCollections(); }
            catch (e) { window.alert(e.message); }
          }));
          colBox.querySelectorAll('[data-colrm]').forEach((b) => b.addEventListener('click', async () => {
            if (!confirm('确认删除该合集？（不影响合集内帖子本身）')) return;
            try { await callEdge('collection_delete', { token: state.user.token, collection_id: b.getAttribute('data-colrm') }); showCollections(); }
            catch (e) { window.alert(e.message); }
          }));
        } catch (_e) { colBox.innerHTML = '<span style="color:var(--faint)">加载失败</span>'; }
      }
      showCollections();
      if (colCreateBtn) colCreateBtn.addEventListener('click', async () => {
        const title = (host.querySelector('#pcColTitle') || {}).value || '';
        if (!title.trim()) { window.alert('请填写合集标题'); return; }
        colCreateBtn.disabled = true;
        try { await callEdge('collection_create', { token: state.user.token, title: title.trim() }); if (host.querySelector('#pcColTitle')) host.querySelector('#pcColTitle').value = ''; showCollections(); }
        catch (e) { window.alert(e.message); }
        colCreateBtn.disabled = false;
      });
    }

    // 我的连载（点击「查看目录」→ 列出该连载内全部帖子，点击跳转对应帖子）
    const serialsBox = host.querySelector('[data-serialsbox]');
    if (serialsBox) {
      (async () => {
        try {
          const list = (await callEdge('series_my', { token: state.user.token })) || [];
          serialsBox.innerHTML = list.length
            ? list.map((s) => `<div class="pc-row"><span style="flex:1;min-width:0"><b>📚 ${escapeHtml(s.title)}</b><br><span style="color:var(--faint);font-size:11px">${formatTime(s.created_at)}${s.intro ? ' · ' + escapeHtml(s.intro) : ''}</span></span>
              <button class="profile-editbtn sm" data-serialopen="${s.id}" title="查看连载内全部帖子（关闭个人中心）">查看目录</button></div>`).join('')
            : '<span style="color:var(--faint)">暂无连载</span>';
          serialsBox.querySelectorAll('[data-serialopen]').forEach((b) => b.addEventListener('click', () => { closeProfileModal(); openSeriesModal(b.getAttribute('data-serialopen')); }));
        } catch (_e) { serialsBox.innerHTML = '<span style="color:var(--faint)">加载失败</span>'; }
      })();
    }

    // 等级排名（Lv46+）
    const rankBox = host.querySelector('[data-rankbox]');
    if (rankBox) {
      (async () => {
        try {
          const r = (await callEdge('my_rank', { token: state.user.token })) || {};
          const around = (r.around || []).map((x) => {
            const mark = x.id === (state.user.profile || {}).id ? '（我）' : '';
            return `<div class="pc-row">Lv.${x.lv} · 经验 ${x.xp} ${mark}</div>`;
          }).join('');
          rankBox.innerHTML = `<div class="pc-rank"><span class="rank-big">#${r.rank || '—'}</span><span>共 <b>${r.total || 0}</b> 人 · 你当前 Lv.${r.level || 0}（经验 ${r.xp || 0}）</span></div><div>排名前后：</div>${around}`;
        } catch (e) { rankBox.innerHTML = '<span style="color:var(--faint)">' + escapeHtml(e.message || '加载失败') + '</span>'; }
      })();
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
    // 等级特权发布项：认证答主提问 / 答疑 / 投票问卷(Lv11+) / 连载(Lv21+) / 信纸(Lv55+)
    if (!loggedIn() || myLevelNow() < 11) { quizItems = []; quizBuilderType = ''; if (els.pollQtype) els.pollQtype.value = ''; }
    const quizData = (loggedIn() && myLevelNow() >= 11) ? quizPayload() : null;
    if (quizData === '::invalid') return;
    const seriesData = (loggedIn() && myLevelNow() >= 21 && els.seriesOn && els.seriesOn.checked) ? seriesPayload() : {};
    if (seriesData === '::invalid') return;
    const styleData = (myLevelNow() >= 55) ? cardStylePayload() : null;
    const basePayload = () => ({
      token: state.user.token || '', topic, nickname, content,
      ...(schedTs > 0 ? { schedule_at: new Date(schedTs).toISOString() } : {}),
      ...(loggedIn() && minView > 0 ? { min_view_level: minView } : {}),
      ...(loggedIn() && els.postAskMentor && els.postAskMentor.value ? { ask_mentor_id: els.postAskMentor.value } : {}),
      ...(loggedIn() && els.postResolve && els.postResolve.checked ? { resolve_post: true } : {}),
      ...(quizData || {}),
      ...seriesData,
      ...(styleData || {})
    });
    const onSuccess = async (msg) => {
      els.content.value = '';
      if (els.nickname && !loggedIn()) els.nickname.value = '';
      if (els.scheduleAt) els.scheduleAt.value = '';
      if (els.minViewLevel) els.minViewLevel.value = '0';
      if (els.postAskMentor) els.postAskMentor.value = '';
      if (els.postResolve) els.postResolve.checked = false;
      clearComposerExtras();
      schedTs = 0;
      try { localStorage.removeItem(DRAFT_KEY); } catch (_e) {}
      updateCharCount();
      updateDraftBar();
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
    const quizText = (quizData && Array.isArray(quizData.quiz_questions))
      ? quizData.quiz_questions.map((qq) => [qq.q, ...(qq.options || [])].filter((x) => x != null).join(' ')).join(' ')
      : '';
    const hitWords = sensitiveHits(content).concat(sensitiveHits(nickname), quizText ? sensitiveHits(quizText) : []);
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
  // ---------------- 实时推送：新帖 / 新评论·回复（其余走静默轮询） ----------------
  function subscribeRealtime() {
    if (state.channel) return;
    state.channelDown = true;
    let everSubscribed = false;
    const ch = supabase.channel('public-forum')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'forum_posts' }, (payload) => {
        if (payload.new && payload.new.id) onRealtimeNewPost(payload.new);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'forum_posts' }, (payload) => {
        if (payload.old) onRealtimeRemovePost(payload.old.id);
      })
      // 管理员屏蔽/取消审核（blocked 置 true 或 reviewed 置 false）→ 视为失效，立即静默移除卡片
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'forum_posts' }, (payload) => {
        const row = payload.new;
        if (row && row.id && (row.blocked === true || row.reviewed !== true)) onRealtimeRemovePost(row.id);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'forum_comments' }, (payload) => {
        if (payload.new) onRealtimeNewComment(payload.new);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'forum_comments' }, (payload) => {
        if (payload.old && payload.old.post_id) onRealtimeCommentGone(payload.old.post_id);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'forum_comments' }, (payload) => {
        const row = payload.new;
        if (row && row.post_id && row.blocked === true) onRealtimeCommentGone(row.post_id);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') { everSubscribed = true; state.channelDown = false; }
        else if (everSubscribed) state.channelDown = true; // 订阅后掉线，也降级补充轮询
      });
    state.channel = ch;
    // realtime 一直没就绪（很可能触发免费版并发上限/网络受限）→ 降级为新帖轮询兜底
    setTimeout(() => { if (!everSubscribed) realtimeFallback(); }, 5000);
  }
  function realtimeFallback() {
    if (state.pollFallbackOn) return;
    state.pollFallbackOn = true;
    startSilentPoll(true);
  }

  // 新帖：在当前 feed 视图、话题/等级/定时可见性匹配时，静默置顶插入，不整页刷新
  async function onRealtimeNewPost(row) {
    if (state.mode !== 'feed' || !els.feed) return;
    if (state.activeTopic && state.activeTopic !== row.topic) return;
    if (row.reviewed !== true || row.blocked === true) return;
    if (row.min_view_level && Number(row.min_view_level) > viewerViewLevel()) return;
    if (row.scheduled_for && new Date(row.scheduled_for).getTime() > Date.now()) return;
    if (els.feed.querySelector(`[data-id="${row.id}"]`)) return; // 已在列表，避免重复
    try {
      const authorMap = await resolveAuthors([row]);
      els.feed.prepend(makeCard(row, { authorMap, live: true }));
      attachPolls(els.feed); attachQuizzes(els.feed);
      observeReveal(els.feed);
    } catch (_e) {}
  }
  // 删帖/屏蔽帖：静默移除对应主列表卡片与顶置卡片，任何视图下都立刻让该内容消失
  function onRealtimeRemovePost(id) {
    if (!id) return;
    const card = els.feed && els.feed.querySelector(`[data-id="${id}"]`);
    if (card) card.remove();
    if (els.pinnedFeed) {
      const pin = els.pinnedFeed.querySelector(`[data-id="${id}"]`);
      if (pin) pin.remove();
    }
    // 若个人中心/合集等面板里正好展示该帖快照，一并从 DOM 移除
    document.querySelectorAll(`.post-card[data-id="${id}"], article[data-id="${id}"]`)
      .forEach((el) => el.remove());
  }
  // 评论被删/被屏蔽：若该帖评论区已在展开，则重载该帖评论，移除被清掉的内容
  function onRealtimeCommentGone(postId) {
    if (!postId) return;
    const card = document.querySelector(`article[data-id="${postId}"], .post-card[data-id="${postId}"]`);
    if (!card) return;
    const box = card.querySelector('[data-cmtbox]');
    if (box && !box.classList.contains('hidden') && box.dataset.loaded) {
      loadComments(box, { id: postId });
    }
  }
  // 新评论 / 新回复：更新该帖评论数；若评论已展开则仅重载该帖评论（不影响其他卡片）
  function onRealtimeNewComment(row) {
    if (!row || !row.post_id) return;
    const card = document.querySelector(`article[data-id="${row.post_id}"], .post-card[data-id="${row.post_id}"]`);
    if (!card) return;
    const num = card.querySelector('.cmt-toggle .cmt-num');
    if (num) num.textContent = formatCount((parseInt((num.textContent || '0').replace('+', ''), 10) || 0) + 1);
    const box = card.querySelector('[data-cmtbox]');
    if (box && !box.classList.contains('hidden') && box.dataset.loaded) {
      loadComments(box, { id: row.post_id });
    }
  }

  // ---------------- 静默轮询：赞/收藏/未读同步；realtime 掉线时为新帖兜底 ----------------
  let silentPollTimer = null;
  let fallbackPollTimer = null;
  function startSilentPoll(isFallback) {
    if (silentPollTimer) return;
    // 无论 realtime 是否可用，都静默同步赞态/收藏/未读（只更新按钮与角标，不重建列表、不整页刷新）
    silentPollTimer = setInterval(() => { silentReconcile(); }, 5000);
    if (isFallback) {
      fallbackPollTimer = setInterval(() => { silentPollNewPosts(); }, 7000);
    }
  }
  let reconcileLock = false;
  async function silentReconcile() {
    if (reconcileLock || !loggedIn()) return;
    reconcileLock = true;
    try {
      await refreshUnread();
      await syncLikedFromServer();
      if (typeof loadFavIds === 'function') await loadFavIds();
      await quietRemoveBlockedPosts();
    } catch (_e) {}
    reconcileLock = false;
  }
  // 轻量兜底：5s 轮询时对“当前已渲染”的帖子做实时核对，发现已被管理员屏蔽/删除的立即移出 DOM，
  // 防止不刷新页面的人滞留并保存已封禁内容（realtime 未就绪/被丢帧时的兜底；只建子集查询，不重建列表）
  let blockedCheckLock = false;
  async function quietRemoveBlockedPosts() {
    if (blockedCheckLock) return;
    const ids = new Set();
    const nodes = [];
    if (els.feed) nodes.push(...els.feed.querySelectorAll('article[data-id], .post-card[data-id]'));
    if (els.pinnedFeed) nodes.push(...els.pinnedFeed.querySelectorAll('article[data-id], .post-card[data-id]'));
    for (const n of nodes) {
      const id = n.dataset.id;
      if (id) ids.add(id);
    }
    if (!ids.size) return;
    blockedCheckLock = true;
    try {
      const arr = [...ids];
      const live = new Set();
      for (let i = 0; i < arr.length; i += 40) {
        const { data } = await supabase.from('forum_posts').select('id, blocked').in('id', arr.slice(i, i + 40));
        // 只把“仍可见”的（未被屏蔽、未被硬删——硬删行不会被查出）视为活着；屏蔽行不加入 live 即被移除
        for (const r of (data || [])) if (r && r.id && r.blocked !== true) live.add(r.id);
      }
      for (const n of nodes) {
        const id = n.dataset.id;
        if (id && !live.has(id)) n.remove();
      }
    } catch (_e) {}
    blockedCheckLock = false;
  }
  let newPostPollLock = false;
  async function silentPollNewPosts() {
    if (newPostPollLock || !loggedIn() || state.mode !== 'feed' || !els.feed) return;
    newPostPollLock = true;
    try {
      const now = new Date().toISOString();
      const { data } = await supabase.from('forum_posts')
        .select('id')
        .eq('reviewed', true).eq('blocked', false)
        .or(`scheduled_for.is.null,scheduled_for.lte.${now}`)
        .order('created_at', { ascending: false }).limit(1);
      const top = data && data[0];
      if (!top || els.feed.querySelector(`[data-id="${top.id}"]`)) return;
      const { data: full } = await supabase.from('forum_posts').select('*').eq('id', top.id).maybeSingle();
      if (full) await onRealtimeNewPost(full);
    } catch (_e) {}
    newPostPollLock = false;
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
      const data = await callEdge('admin_login', { username, password, device_key: getDeviceKey(), device_name: getDeviceName() });
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
  els.content.addEventListener('input', () => { updateCharCount(); els.composeWarn.textContent = ''; els.content.classList.remove('bad'); saveDraft(); });
  // 等级特权发布项绑定：投票问卷/连载/信纸/草稿
  if (els.pollQtype) els.pollQtype.addEventListener('change', () => {
    const v = els.pollQtype.value;
    if (v === 'poll' || v === 'quiz') { quizBuilderType = v; if (quizBuilderType === 'poll') quizItems = []; renderQuizEditor(); }
    else { quizBuilderType = ''; quizItems = []; renderQuizEditor(); }
  });
  if (els.addQuestionBtn) els.addQuestionBtn.addEventListener('click', () => {
    const maxQ = (quizBuilderType === 'poll' ? 1 : QUIZ_MAX_QUESTIONS);
    if (quizItems.length >= maxQ) { window.alert('最多 ' + maxQ + ' 个题目'); return; }
    quizItems.push({ type: 'single', q: '', opts: [] }); renderQuizEditor();
  });
  if (els.seriesOn) els.seriesOn.addEventListener('change', () => {
    if (els.seriesFields) els.seriesFields.classList.toggle('hidden', !els.seriesOn.checked);
    if (els.seriesOn.checked) refreshSeriesSelect();
  });
  if (els.draftUse) els.draftUse.addEventListener('click', loadDraft);
  if (els.draftClear) els.draftClear.addEventListener('click', clearDraft);
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
    renderUserBar();
    applyLoginGate(); // 未登录用户被门禁拦截，无法查看/使用论坛内容
    refreshInviteState();
    loadSiteStatus();
    loadPopups();
    loadAnnouncements();
    loadBroadcasts();
    if (!loggedIn()) return; // 未登录：不加载任何论坛内容，仅显示门禁覆盖层
    loadTopics();
    bindSort();
    setupMentorComposer();
    loadPinned();
    loadFeed();
    loadLeaderboard();
    loadFavIds(); syncLikedFromServer(); refreshProfile(); checkBanStatus();
    subscribeRealtime();
    startSilentPoll(false);
    startClientEpochPoll();
    startSessionMonitor();
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