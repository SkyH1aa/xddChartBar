/* ============================================================
   XDD吧 · 学习资料区（study.html 专用）
   形态：按学科聚合资料帖，支持「最新 / 精选」切换与分页；
        卡片内直接点赞、展开评论，样式与主论坛保持一致。
   可见性：服务端只返回已审核未屏蔽的资料帖；作者本人额外看到自己的待审帖（带「待审核」标识）。
   权限：所有内容需登录；点赞与评论需登录（复用主论坛 set_like / comment_create）。
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
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  let me = null;
  let subjects = [];
  let likedSet = new Set();
  const state = { subjectId: '', sort: 'latest', page: 1, hasMore: false, loading: false };

  // ---------------- 工具 ----------------
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function formatTime(iso) {
    if (window.ClubTime) { const s = window.ClubTime.str(iso); if (s) return s; }
    if (!iso) return '';
    const d = new Date(iso); const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }
  function formatCount(n) { n = Number(n) || 0; return n > 9999 ? '9999+' : String(n); }
  function xpOf(u) {
    return (Number(u && u.xp_post_comment) || 0) + (Number(u && u.like_received) || 0)
      + (Number(u && u.col_like_received) || 0) + (Number(u && u.fav_received) || 0) * 2
      + (Number(u && u.xp_event) || 0) + (Number(u && u.bonus_xp) || 0) + (Number(u && u.checkin_xp) || 0);
  }
  function finalLevel(u) {
    const f = Number(u && u.level) || 0;
    if (f > 0) return Math.min(60, f);
    const xp = xpOf(u);
    if (xp <= 0) return 1;
    return Math.min(60, Math.floor((1 + Math.sqrt(1 + (4 * xp) / 5)) / 2));
  }
  function subjectName(id) {
    const s = subjects.find((x) => x.id === id);
    return s ? (s.display_name || s.name || '') : '';
  }
  function loggedIn() { return !!(me && me.token); }

  // ---------------- 内置特效引擎桥接（public/effects.js） ----------------
  // 称号 / 昵称样式 / 帖子背景 / 徽章 全部由内置网页特效渲染（不使用图片）
  const FX = () => (window.XddFx || null);
  function fxTitleHtml(cfg) {
    const F = FX(); if (!F || !cfg) return '';
    try { return F.titleHtml(cfg); } catch (_e) { return ''; }
  }
  function fxNickInner(cfg, innerHtml) {
    const F = FX(); if (!F || !cfg) return innerHtml;
    try {
      const c = F.normalize('nickname_style', cfg);
      return `<span class="${F.classes('nickname_style', c).join(' ')}" style="${escapeHtml(F.styleAttr('nickname_style', c))}">${innerHtml}</span>`;
    } catch (_e) { return innerHtml; }
  }
  function fxBadgeHtml(cfg, name) {
    const F = FX(); if (!F || !cfg) return '';
    try { const c = F.normalize('badge', cfg); c.name = name || ''; return F.badgeHtml(c); } catch (_e) { return ''; }
  }
  function fxApplyBg(el, cfg) {
    const F = FX(); if (!F || !el || !cfg) return;
    try { F.applyBg(el, cfg); } catch (_e) { /* 特效失败不影响资料帖渲染 */ }
  }

  // ---------------- 会话与顶栏 ----------------
  function readSession() {
    try {
      const tk = localStorage.getItem(USER_TOKEN_KEY);
      const pf = JSON.parse(localStorage.getItem(USER_PROFILE_KEY) || 'null');
      me = tk ? { token: tk, profile: pf } : null;
    } catch (_e) { me = null; }
  }
  function displayName(p) { return (p && (p.nickname || p.username)) || '同学'; }
  function renderBar() {
    const host = $('userBar');
    if (!host) return;
    if (me && me.profile) {
      const nm = displayName(me.profile);
      host.innerHTML = `<button class="icon-btn" id="dmBtn" title="私信">✉️<span class="dot-badge" id="dmBadge"></span></button>
        <span class="u-chip" title="${escapeHtml(nm)}">
          <span class="avatar">${escapeHtml(String(nm).slice(0, 1))}</span>
          <span class="u-name">${escapeHtml(nm)}</span>
          <span class="author-level">Lv.${finalLevel(me.profile)}</span>
        </span>`;
      const db = $('dmBtn');
      if (db) db.addEventListener('click', () => { if (window.XddLive) XddLive.openPanel(); });
      if (window.XddLive) XddLive.start();
    } else {
      host.innerHTML = '<a href="index.html" class="btn ghost sm">登录 / 注册</a>';
      if (window.XddLive) XddLive.stop();
    }
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
      err.need_captcha = !!data.need_captcha;   // 触发人机验证时给出可读提示
      err.captcha = data.captcha;
      throw err;
    }
    return data.data;
  }

  // ---------------- 作者信息（等级标识；失败不影响资料展示） ----------------
  async function resolveAuthors(rows) {
    const ids = Array.from(new Set((rows || []).map((p) => p.author_id).filter(Boolean)));
    const map = {};
    if (!ids.length) return map;
    try {
      const { data } = await supabase.from('forum_users')
        .select('id, nickname, username, level, xp_post_comment, like_received, col_like_received, fav_received, xp_event, bonus_xp, checkin_xp')
        .in('id', ids);
      (data || []).forEach((u) => { map[u.id] = { nickname: u.nickname || u.username || '', level: finalLevel(u) }; });
    } catch (_e) { /* ignore */ }
    // 作者已装备的装扮（称号 / 昵称样式 / 帖子背景）与已佩戴徽章；失败不影响资料展示
    try {
      const [wear, badges] = await Promise.all([
        callEdge('wear_showcase', { user_ids: ids }),
        callEdge('badge_showcase', { user_ids: ids, limit: 3 })
      ]);
      ids.forEach((id) => {
        if (!map[id]) return;
        map[id].wear = (wear && wear[id]) || null;
        map[id].badges = (badges && badges[id]) || [];
      });
    } catch (_e) { /* ignore */ }
    return map;
  }

  // 登录后同步「我赞过的帖子」，保证一个账号对一帖只赞一次（跨设备一致）
  async function syncLiked() {
    if (!loggedIn()) { likedSet = new Set(); return; }
    try {
      const list = await callEdge('user_liked_posts', { token: me.token });
      likedSet = new Set(list || []);
    } catch (_e) { likedSet = new Set(); }
  }

  // ---------------- 点赞 ----------------
  async function likePost(post, btn) {
    if (!loggedIn()) { window.alert('请先登录后点赞'); location.href = 'index.html'; return; }
    const on = likedSet.has(post.id);
    btn.disabled = true;
    try {
      await callEdge('set_like', { token: me.token, post_id: post.id, liked: !on });
      const next = Math.max(0, (Number(post.like_count) || 0) + (on ? -1 : 1));
      post.like_count = next;
      const num = btn.querySelector('.like-num');
      if (num) num.textContent = formatCount(next);
      if (on) likedSet.delete(post.id); else likedSet.add(post.id);
      btn.classList.toggle('active', !on);
    } catch (e) { window.alert(e.message); }
    btn.disabled = false;
  }

  // ---------------- 评论（与主论坛同款交互与样式） ----------------
  function toggleComments(card, post) {
    const box = card.querySelector('[data-cmtbox]');
    const label = card.querySelector('.cmt-label');
    if (!box.classList.contains('hidden')) {
      box.classList.add('hidden');
      if (label) label.textContent = '展开评论';
      return;
    }
    box.classList.remove('hidden');
    if (label) label.textContent = '收起评论';
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
  function commentItemHtml(c, authorMap) {
    const au = c.author_id ? authorMap[c.author_id] : null;
    const nick = c.nickname || (au && au.nickname) || '匿名';
    const lvTag = au && au.level ? `<span class="author-level">Lv.${au.level}</span>` : '';
    return `<div class="cmt-item">
      <div class="cmt-head"><span class="nickname">${escapeHtml(nick)}</span>${lvTag}<span class="cmt-time">${formatTime(c.created_at)}</span></div>
      <div class="cmt-text">${escapeHtml(c.content || '')}</div>
    </div>`;
  }
  async function renderComments(box, list, post) {
    const visible = (list || []).filter((c) => !c.blocked);
    const authorMap = await resolveAuthors(visible);
    box.innerHTML = `
      <div class="cmt-items"></div>
      <div class="cmt-compose">
        <textarea class="cmt-input" maxlength="250" placeholder="${loggedIn() ? '写下你的评论…（250字内）' : '登录后可评论…（250字内）'}"></textarea>
        <div class="cmt-row"><button class="btn sm cmt-submit">发表</button></div>
        <div class="cmt-bar"><span class="cmt-count">0/250</span></div>
        <div class="cmt-warn"></div>
      </div>`;
    const items = box.querySelector('.cmt-items');
    items.innerHTML = visible.length
      ? visible.map((c) => commentItemHtml(c, authorMap)).join('')
      : '<div class="cmt-empty">暂无评论，来抢沙发吧</div>';
    const input = box.querySelector('.cmt-input');
    const cnt = box.querySelector('.cmt-count');
    input.addEventListener('input', () => { cnt.textContent = input.value.length + '/250'; });
    if (window.XddMentions) XddMentions.attach(input, { getToken: () => (me ? me.token : '') });
    box.querySelector('.cmt-submit').addEventListener('click', () => postComment(box, post));
  }
  async function postComment(box, post) {
    const warn = box.querySelector('.cmt-warn');
    warn.textContent = '';
    if (!loggedIn()) { warn.textContent = '请先登录后评论'; return; }
    const input = box.querySelector('.cmt-input');
    const content = input.value.trim();
    if (!content) { warn.textContent = '评论内容不能为空'; return; }
    if (content.length > 250) { warn.textContent = '评论最多 250 字'; return; }
    const btn = box.querySelector('.cmt-submit');
    btn.disabled = true;
    try {
      const mentions = window.XddMentions ? XddMentions.collect(input) : [];
      await callEdge('comment_create', {
        token: me.token, post_id: post.id, parent_id: null,
        nickname: displayName(me.profile), content, mentions
      });
      input.value = '';
      box.querySelector('.cmt-count').textContent = '0/250';
      if (window.XddMentions) XddMentions.reset(input);
      await loadComments(box, post);
      bumpCommentCount(box.closest('.post-card'));
    } catch (e) {
      warn.textContent = e.need_captcha ? '今日评论次数已达上限，请完成人机验证后再试' : ('发布失败：' + e.message);
    }
    btn.disabled = false;
  }
  function bumpCommentCount(card) {
    if (!card) return;
    const num = card.querySelector('.cmt-toggle .cmt-num');
    if (!num) return;
    const cur = parseInt(String(num.textContent).replace('+', ''), 10) || 0;
    num.textContent = formatCount(cur + 1);
  }

  // ---------------- 学科筛选项 ----------------
  async function loadSubjects() {
    try { subjects = (await callEdge('subject_list', {})) || []; } catch (_e) { subjects = []; }
    const sel = $('subjectFilter');
    if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = '<option value="">全部学科</option>' + subjects
      .map((s) => `<option value="${escapeHtml(s.id)}">${escapeHtml(s.display_name || s.name)}</option>`).join('');
    if (cur && sel.querySelector(`option[value="${cur}"]`)) sel.value = cur;
  }

  // ---------------- 卡片 ----------------
  function makeCard(post, authorMap) {
    const au = post.author_id ? authorMap[post.author_id] : null;
    const lv = au ? au.level : 0;
    const liked = likedSet.has(post.id);
    const isAnon = !post.nickname;
    // 作者已装备的装扮（购买的帖子背景 / 称号 / 昵称样式）
    const wear = (!isAnon && au) ? au.wear : null;
    const hasBg = !!(wear && wear.background);
    const card = document.createElement('article');
    // 风云学长(36+)/校史留名(55+) 光效作用于整块卡片；装备购买的帖子背景后自动让位（互斥）
    const lvFx = lv >= 55 ? ' legend-gold-card' : (lv >= 36 ? ' lightfx-card' : '');
    card.className = 'post-card' + (post.digest ? ' lightfx-card' : '') + (hasBg ? '' : lvFx);
    card.dataset.id = post.id;
    const nickHtml = isAnon ? '<span class="anonymous">匿名</span>' : '<span class="nick-txt">' + escapeHtml(post.nickname) + '</span>';
    // 昵称样式：作用于昵称文字本身
    const nickRendered = (!isAnon && wear && wear.nickname_style) ? fxNickInner(wear.nickname_style, nickHtml) : nickHtml;
    const lvTag = lv ? `<span class="author-level">Lv.${lv}</span>` : '';
    // 称号（最多 3 个）与已佩戴徽章（最多 3 枚）：全部由内置特效渲染
    const titleChips = (!isAnon && wear && Array.isArray(wear.titles))
      ? wear.titles.slice(0, 3).map((t) => fxTitleHtml(t)).join('') : '';
    const authorBadges = (!isAnon && au && Array.isArray(au.badges)) ? au.badges : [];
    const badgeChips = authorBadges.map((b) => {
      const fx = fxBadgeHtml(b.effect, b.name);
      return `<span class="badge-chip" title="${escapeHtml(b.name || '')}">${fx || (b.icon_url
        ? `<img src="${escapeHtml(b.icon_url)}" alt="" />` : '<i>🏅</i>')}</span>`;
    }).join('');
    const subName = subjectName(post.subject_id);
    const subBadge = subName
      ? `<span class="badge subject" data-subject="${escapeHtml(post.subject_id)}" title="只看该学科">📚 ${escapeHtml(subName)}</span>` : '';
    const digestBadge = post.digest ? '<span class="badge digest">💎 精选</span>' : '';
    const pendingBadge = post.pending_review ? '<span class="badge pending-review">⏳ 待审核</span>' : '';
    card.innerHTML = `
      <div class="post-head">
        <span class="nickname">${isAnon ? nickHtml : `<span class="nickname-link" data-uid="${escapeHtml(post.author_id || '')}">${nickHtml}</span>`}${lvTag}</span>
        ${subBadge}
        ${digestBadge}
        ${pendingBadge}
        <span class="post-time">${formatTime(post.created_at)}</span>
      </div>
      <div class="post-content">${escapeHtml(post.content || '')}</div>
      <div class="post-actions">
        <button class="act-btn like-btn${liked ? ' active' : ''}" title="点赞">
          <span class="like-ico">👍</span><span class="like-num">${formatCount(post.like_count)}</span>
        </button>
        <button class="act-btn cmt-toggle" title="评论">
          <span>💬</span><span class="cmt-num">${formatCount(post.comment_count)}</span>
          <span class="cmt-label">展开评论</span>
        </button>
        <a class="act-btn act-link" href="index.html#post-${encodeURIComponent(post.id)}" title="到主论坛查看完整讨论（含回复与最佳答案）">🔗 去主论坛</a>
      </div>
      <div class="post-comments hidden" data-cmtbox></div>`;
    card.querySelector('.like-btn').addEventListener('click', (e) => { likePost(post, e.currentTarget); });
    card.querySelector('.cmt-toggle').addEventListener('click', () => toggleComments(card, post));
    const nl = card.querySelector('.nickname-link');
    if (nl && nl.dataset.uid) {
      nl.addEventListener('click', () => { location.href = 'index.html#profile-' + encodeURIComponent(nl.dataset.uid); });
    }
    const sb = card.querySelector('[data-subject]');
    if (sb) {
      sb.addEventListener('click', () => {
        state.subjectId = sb.dataset.subject; state.page = 1;
        const sel = $('subjectFilter');
        if (sel) sel.value = state.subjectId;
        loadFeed();
      });
    }
    return card;
  }

  // ---------------- 列表与分页 ----------------
  function setPager() {
    const pager = $('studyPager');
    if (!pager) return;
    pager.classList.toggle('hidden', !(state.page > 1 || state.hasMore));
    const num = $('studyPageNum');
    if (num) num.textContent = `第 ${state.page} 页`;
    const prev = $('studyPrev'); const next = $('studyNext');
    if (prev) prev.disabled = state.loading || state.page <= 1;
    if (next) next.disabled = state.loading || !state.hasMore;
  }
  function renderEmpty(msg) {
    const feed = $('studyFeed');
    if (feed) feed.innerHTML = `<div class="empty"><div class="emoji">📭</div>${escapeHtml(msg)}</div>`;
  }
  async function loadFeed() {
    if (state.loading) return;
    state.loading = true;
    setPager();
    const feed = $('studyFeed');
    if (feed) feed.innerHTML = '<div class="empty">正在加载…</div>';
    try {
      const r = await callEdge('study_list', {
        subject_id: state.subjectId, sort: state.sort, page: state.page, pageSize: PAGE_SIZE
      });
      const list = (r && r.list) || [];
      state.hasMore = !!(r && r.has_more);
      const authorMap = await resolveAuthors(list);
      if (!feed) return;
      feed.innerHTML = '';
      if (!list.length) {
        renderEmpty(state.subjectId ? '该学科下暂无资料' : '还没有资料，快去发布第一份吧');
      } else {
        list.forEach((p) => feed.appendChild(makeCard(p, authorMap)));
      }
      const cnt = $('studyCount');
      if (cnt) cnt.textContent = `本页 ${list.length} 篇${state.sort === 'digest' ? ' · 精选' : ''}`;
    } catch (e) {
      state.hasMore = false;
      renderEmpty('加载失败：' + (e.message || '请稍后重试'));
    } finally {
      state.loading = false;
      setPager();
    }
  }

  // ---------------- 事件 ----------------
  function bindEvents() {
    const sel = $('subjectFilter');
    if (sel) sel.addEventListener('change', () => { state.subjectId = sel.value; state.page = 1; loadFeed(); });
    document.querySelectorAll('[data-sort]').forEach((b) => b.addEventListener('click', () => {
      if (state.sort === b.dataset.sort) return;
      state.sort = b.dataset.sort; state.page = 1;
      document.querySelectorAll('[data-sort]').forEach((x) => x.classList.toggle('active', x === b));
      loadFeed();
    }));
    const prev = $('studyPrev'); const next = $('studyNext');
    if (prev) prev.addEventListener('click', () => {
      if (state.page <= 1) return;
      state.page -= 1; loadFeed(); window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    if (next) next.addEventListener('click', () => {
      if (!state.hasMore) return;
      state.page += 1; loadFeed(); window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ---------------- 启动 ----------------
  async function boot() {
    readSession();
    renderBar();
    if (window.XddContentGate && !XddContentGate.allow()) return;
    bindEvents();
    await syncLiked();
    await loadSubjects();
    await loadFeed();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
