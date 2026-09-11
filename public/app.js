/* ============================================================
   新哲吧 · 前端逻辑（主页 / 发布 / 筛选 / 分页 / 拦截页 / 弹窗 / 管理入口）
   ============================================================ */
(function () {
  'use strict';

  const SUPABASE_URL = 'https://jgezpvmlnhycxslqbwcx.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_B29ClgwZagW32Ow5x6VdKQ_IL65F7dl';
  const EDGE_URL = `${SUPABASE_URL}/functions/v1/newtheba`;

  const TOPICS = ['闲聊', '社团活动', '食堂', '宿舍', '学习', '吃瓜'];
  const PAGE_SIZE = 25;
  const TOKEN_KEY = 'nzb_admin_token';
  const PROFILE_KEY = 'nzb_admin_profile';

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  const state = {
    activeTopic: '',              // '' = 全部
    page: 1,
    totalPages: 1,
    totalCount: 0,
    session: { token: null, profile: null }
  };

  // ---------------- DOM ----------------
  const $ = (id) => document.getElementById(id);
  const els = {
    feed: $('feed'), pinnedFeed: $('pinnedFeed'), pinnedSection: $('pinnedSection'),
    emptyState: $('emptyState'), pager: $('pager'), pageNum: $('pageNum'),
    topicSelect: $('topicSelect'), filterBar: $('filterBar'),
    content: $('contentInput'), nickname: $('nicknameInput'), charCount: $('charCount'),
    publish: $('publishBtn'), composeWarn: $('composeWarn'), composeHint: $('composeHint'),
    haltPage: $('haltPage'), haltTitle: $('haltTitle'), haltSubtitle: $('haltSubtitle'),
    popupHost: $('popupHost'),
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

  // 敏感词检测（词库由站长在 sensitive-words.js 维护）
  function sensitiveHit(text) {
    if (!text) return null;
    const words = window.NEWTHEBA_SENSITIVE_WORDS || [];
    for (const w of words) {
      const s = String(w || '').trim();
      if (s && text.toLowerCase().includes(s.toLowerCase())) return s;
    }
    return null;
  }

  async function callEdge(action, payload, token) {
    const res = await fetch(EDGE_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        apikey: SUPABASE_KEY
      },
      body: JSON.stringify({ action, token, ...payload })
    });
    let data = {};
    try { data = await res.json(); } catch (_e) {}
    if (!res.ok || data.ok === false) {
      throw new Error(data.error || ('请求失败 ' + res.status));
    }
    return data.data;
  }

  function readSession() {
    try {
      state.session.token = localStorage.getItem(TOKEN_KEY) || null;
      state.session.profile = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
    } catch (_e) { /* ignore */ }
  }
  function clearSession() {
    state.session = { token: null, profile: null };
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PROFILE_KEY);
  }

  // ---------------- 站点运行状态 ----------------
  async function loadSiteStatus() {
    try {
      const { data } = await supabase.from('forum_site').select('open, halt_title, halt_subtitle').eq('id', 1).maybeSingle();
      if (data && data.open === false) showHalt(data);
    } catch (_e) { /* 网络异常则按正常访问 */ }
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
        .from('forum_popups')
        .select('id, title, content')
        .eq('enabled', true)
        .order('created_at', { ascending: false })
        .limit(5);
      if (!data || !data.length) return;
      const target = data[0];
      let shown = '';
      try { shown = localStorage.getItem('nzb_popup_shown') || ''; } catch (_e) {}
      if (shown === target.id) return;
      try { localStorage.setItem('nzb_popup_shown', target.id); } catch (_e) {}
      renderPopup(target);
    } catch (_e) { /* ignore */ }
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

  // ---------------- 卡片渲染与渐入渐出 ----------------
  function makeCard(post, { pinned = false } = {}) {
    const card = document.createElement('article');
    card.className = 'post-card' + (pinned ? ' pinned-post' : '');
    const isAnon = !post.nickname;
    const nickHtml = isAnon
      ? '<span class="anonymous">匿名</span>'
      : escapeHtml(post.nickname);
    let badges = pinned
      ? '<span class="badge pinned">置顶</span>'
      : '<span class="badge topic">' + escapeHtml(post.topic) + '</span>';
    card.innerHTML = `
      <div class="post-head">
        <span class="nickname">${nickHtml}</span>
        ${badges}
        <span class="badge seen">新</span>
        <span class="post-time">${formatTime(post.created_at)}</span>
      </div>
      <div class="post-content">${escapeHtml(post.content)}</div>`;
    return card;
  }

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
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.06 });
    root.querySelectorAll('.post-card').forEach((c) => io.observe(c));
  }

  // ---------------- 数据加载 ----------------
  async function countTotal() {
    let q = supabase.from('forum_posts').select('*', { count: 'exact', head: true })
      .eq('reviewed', true).eq('blocked', false);
    if (state.activeTopic) q = q.eq('topic', state.activeTopic);
    const { count, error } = await q;
    if (error) return 0;
    return count || 0;
  }

  async function loadPinned() {
    try {
      let q = supabase.from('forum_pinned_posts')
        .select('*').eq('blocked', false).order('pinned_at', { ascending: false });
      if (state.activeTopic) q = q.eq('topic', state.activeTopic);
      const { data } = await q;
      els.pinnedFeed.innerHTML = '';
      const cards = (data || []).map((p) => makeCard(p, { pinned: true }));
      cards.forEach((c) => els.pinnedFeed.appendChild(c));
      els.pinnedSection.classList.toggle('hidden', !cards.length);
      observeReveal(els.pinnedFeed);
    } catch (_e) { /* ignore */ }
  }

  async function loadFeed() {
    els.emptyState.classList.add('hidden');
    const start = (state.page - 1) * PAGE_SIZE;
    let q = supabase.from('forum_posts').select('*')
      .eq('reviewed', true).eq('blocked', false)
      .order('created_at', { ascending: false })
      .range(start, start + PAGE_SIZE - 1);
    if (state.activeTopic) q = q.eq('topic', state.activeTopic);

    // 同时取总数做分页
    const [listResult, totalCount] = await Promise.all([
      q,
      countTotal()
    ]);

    const rows = listResult.data || [];
    state.totalCount = totalCount;
    state.totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

    els.feed.innerHTML = '';
    if (!rows.length) {
      els.emptyState.classList.remove('hidden');
      els.pager.classList.add('hidden');
    } else {
      rows.forEach((p) => els.feed.appendChild(makeCard(p)));
      observeReveal(els.feed);
      els.pager.classList.remove('hidden');
    }

    els.pageNum.textContent = `第 ${state.page} / ${state.totalPages} 页 · 共 ${totalCount} 条`;
    $('prevPage').disabled = state.page <= 1;
    $('nextPage').disabled = state.page >= state.totalPages;
  }

  // ---------------- 筛选 ----------------
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

  // ---------------- 发布 ----------------
  async function publish() {
    const topic = els.topicSelect.value;
    const content = els.content.value.trim();
    const nickname = els.nickname.value.trim().slice(0, 24);
    const limit = topicLimit(topic);
    const warn = els.composeWarn;

    els.composeHint.textContent = '';
    if (!content) { warn.textContent = '内容不能为空'; return; }
    if (content.length > limit) { warn.textContent = `内容超出${limit}字上限`; return; }

    const hit = sensitiveHit(content) || sensitiveHit(nickname);
    if (hit) {
      warn.textContent = '⚠️ 发布内容存在敏感词，不得发布。';
      els.content.classList.add('bad');
      return;
    }
    els.content.classList.remove('bad');

    els.publish.disabled = true;
    warn.textContent = '';
    try {
      const { error } = await supabase.from('forum_posts').insert({ topic, nickname, content });
      if (error) throw error;
      els.content.value = '';
      updateCharCount();
      if (topic === '吃瓜') {
        els.composeHint.textContent = '✅ 已在「吃瓜」板块发布，内容提交成功后将由管理员审核后公开展示。';
      } else {
        els.composeHint.textContent = '✅ 发布成功';
      }
      if (state.activeTopic && state.activeTopic !== topic) {
        state.activeTopic = '';
        renderFilterBar();
      }
      state.page = 1;
      await Promise.all([loadPinned(), loadFeed()]);
    } catch (e) {
      warn.textContent = '发布失败：' + (e.message || '未知错误');
    } finally {
      els.publish.disabled = false;
    }
  }

  // ---------------- 管理员登录 / 注册 ----------------
  function openModal(mode) {
    els.adminModal.classList.remove('hidden');
    els.loginError.textContent = '';
    els.regError.textContent = '';
    els.adminFormLogin.classList.toggle('hidden', mode !== 'login');
    els.adminFormRegister.classList.toggle('hidden', mode !== 'register');
    els.adminModalTitle.textContent = mode === 'login' ? '管理员登录' : '注册管理员';
  }
  $('openAdmin').addEventListener('click', () => openModal('login'));
  $('closeModal').addEventListener('click', () => els.adminModal.classList.add('hidden'));
  $('closeModal2').addEventListener('click', () => els.adminModal.classList.add('hidden'));
  $('switchToRegister').addEventListener('click', () => openModal('register'));
  $('switchToLogin').addEventListener('click', () => openModal('login'));
  els.adminModal.addEventListener('click', (e) => { if (e.target === els.adminModal) els.adminModal.classList.add('hidden'); });

  async function doLogin() {
    const username = els.loginUser.value.trim();
    const password = els.loginPass.value;
    els.loginError.textContent = '';
    if (!username || !password) { els.loginError.textContent = '请输入账号和密码'; return; }
    els.loginBtn.disabled = true;
    try {
      const data = await callEdge('admin_login', { username, password });
      state.session = { token: data.token, profile: data };
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(PROFILE_KEY, JSON.stringify(data));
      location.href = 'admin.html';
    } catch (e) {
      els.loginError.textContent = e.message;
      els.loginBtn.disabled = false;
    }
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
      els.regFormSuccess(true);
    } catch (e) {
      els.regError.textContent = e.message;
      els.registerBtn.disabled = false;
    }
  }
  els.loginBtn.addEventListener('click', doLogin);
  els.registerBtn.addEventListener('click', doRegister);
  els.loginPass.addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });
  els.loginUser.addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });

  // 注册成功后提示
  els.regFormSuccess = (ok) => {
    els.regError.textContent = '✅ 申请已提交，请等待创始人审核通过后即可登录。';
    els.registerBtn.disabled = true;
  };

  // ---------------- 事件绑定 ----------------
  els.topicSelect.addEventListener('change', updateCharCount);
  els.content.addEventListener('input', () => {
    updateCharCount();
    els.composeWarn.textContent = '';
    els.content.classList.remove('bad');
  });
  els.publish.addEventListener('click', publish);
  $('prevPage').addEventListener('click', () => {
    if (state.page > 1) { state.page--; loadFeed(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  });
  $('nextPage').addEventListener('click', () => {
    if (state.page < state.totalPages) { state.page++; loadFeed(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  });

  // ---------------- 启动 ----------------
  function init() {
    readSession();
    renderTopicSelect();
    renderFilterBar();
    loadSiteStatus();
    loadPopups();
    loadPinned();
    loadFeed();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();