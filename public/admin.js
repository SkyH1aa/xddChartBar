/* ============================================================
   新哲吧 · 管理后台逻辑
   权限：permissions(can_block/can_review/can_pin/can_popup) + isFounder
   所有敏感操作经 Edge Function（newtheba）鉴权执行。
   ============================================================ */
(function () {
  'use strict';

  const SUPABASE_URL = 'https://jgezpvmlnhycxslqbwcx.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_B29ClgwZagW32Ow5x6VdKQ_IL65F7dl';
  const EDGE_URL = `${SUPABASE_URL}/functions/v1/newtheba`;
  const TOKEN_KEY = 'nzb_admin_token';
  const PROFILE_KEY = 'nzb_admin_profile';
  const TOPICS = ['闲聊', '社团活动', '食堂', '宿舍', '学习', '吃瓜'];

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const $ = (id) => document.getElementById(id);

  let token = null;
  let profile = null;
  let activeTab = 'posts';

  // ---------- 工具 ----------
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function formatTime(iso) {
    const d = new Date(iso); const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  }
  function truncate(s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n) + '…' : s; }

  async function callEdge(action, payload) {
    const res = await fetch(EDGE_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', apikey: SUPABASE_KEY },
      body: JSON.stringify({ action, token, ...payload })
    });
    let data = {};
    try { data = await res.json(); } catch (_e) {}
    if (!res.ok || data.ok === false) throw new Error(data.error || ('请求失败 ' + res.status));
    return data.data;
  }

  function readSession() {
    try {
      token = localStorage.getItem(TOKEN_KEY);
      profile = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
    } catch (_e) { token = null; profile = null; }
  }
  function persist(t, p) {
    token = t; profile = p;
    localStorage.setItem(TOKEN_KEY, t);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  }
  function hasPerm(p) { return profile?.isFounder || !!profile?.perms?.[p]; }

  // ---------- 登录 ----------
  async function doLogin() {
    const user = $('loginUser').value.trim();
    const pass = $('loginPass').value;
    $('loginError').textContent = '';
    if (!user || !pass) { $('loginError').textContent = '请输入账号和密码'; return; }
    $('loginBtn').disabled = true;
    try {
      const data = await callEdge('admin_login', { username: user, password: pass });
      persist(data.token, data);
      boot();
    } catch (e) {
      $('loginError').textContent = e.message;
    } finally { $('loginBtn').disabled = false; }
  }
  $('loginBtn').addEventListener('click', doLogin);
  $('loginPass').addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });

  // ---------- 渲染布局 ----------
  function renderTabs() {
    const tabs = [
      { key: 'dashboard', label: '看板' },
      { key: 'posts', label: '帖子管理' },
      { key: 'comments', label: '评论管理' },
      { key: 'review', label: '吃瓜审核' },
      { key: 'reports', label: '举报', can_block: true },
      { key: 'pinned', label: '顶置管理' },
      { key: 'audit', label: '审计日志' },
      { key: 'blacklist', label: '黑名单', can_block: true },
      { key: 'site', label: '站点开关' },
      { key: 'popups', label: '弹窗公告' }
    ];
    if (profile?.isFounder) tabs.push({ key: 'admins', label: '管理员' });
    else {
      const filtered = tabs.filter((t) => !t.can_block || hasPerm('can_block'));
      filtered.splice(filtered.findIndex((t) => t.key === 'comments'), 1);
      filtered.splice(filtered.findIndex((t) => t.key === 'posts'), 1);
      filtered.splice(filtered.findIndex((t) => t.key === 'reports'), 0, { key: 'reports', label: '举报' });
      tabs.length = 0; tabs.push(...filtered);
    }
    const nav = $('tabs');
    nav.innerHTML = '';
    tabs.forEach((t) => {
      const b = document.createElement('button');
      b.className = 'chip' + (activeTab === t.key ? ' active' : '');
      b.dataset.tabkey = t.key;
      b.innerHTML = t.label + '<span class="tab-badge" data-badgetab="' + t.key + '"></span>';
      b.addEventListener('click', () => switchTab(t.key));
      nav.appendChild(b);
    });
    refreshQueueBadges();
  }
  async function refreshQueueBadges() {
    try {
      const q = await callEdge('queue_unread', {});
      document.querySelectorAll('[data-badgetab]').forEach((s) => {
        let n = 0;
        if (s.dataset.badgetab === 'review') n = q.review || 0;
        if (s.dataset.badgetab === 'reports') n = q.reports || 0;
        s.textContent = n > 0 ? n : '';
        s.style.display = n > 0 ? 'inline-block' : 'none';
      });
    } catch (_e) {}
  }
  function switchTab(key) {
    activeTab = key;
    document.querySelectorAll('[id^="tab-"]').forEach((s) => s.classList.add('hidden'));
    $('tab-' + key).classList.remove('hidden');
    renderTabs();
    if (key === 'dashboard') loadDashboard();
    if (key === 'posts') loadPosts();
    if (key === 'comments') loadComments();
    if (key === 'review') loadReview();
    if (key === 'reports') loadReports();
    if (key === 'pinned') loadPinned();
    if (key === 'audit') loadAudit();
    if (key === 'blacklist') loadBlacklist();
    if (key === 'site') loadSite();
    if (key === 'popups') loadPopups();
    if (key === 'admins') loadAdmins();
  }

  // ---------- 数据看板 ----------
  async function loadDashboard() {
    const box = $('dashStats');
    box.innerHTML = '<div class="empty">加载中…</div>';
    try {
      const s = await callEdge('dashboard_stats', { sensitive_words: window.NEWTHEBA_SENSITIVE_WORDS || [] });
      const grid = document.createElement('div');
      grid.style.display = 'grid';
      grid.style.gridTemplateColumns = 'repeat(auto-fill,minmax(150px,1fr))';
      grid.style.gap = '10px';
      const cells = [
        ['今日发帖', s.today_posts], ['今日评论', s.today_comments], ['今日新增用户', s.today_users],
        ['帖子总数', s.total_posts], ['评论总数', s.total_comments], ['用户总数', s.total_users],
        ['待审核吃瓜', s.open_review], ['待处理举报', s.open_reports],
        ['敏感词命中帖', s.sensitive_posts], ['敏感词命中评论', s.sensitive_comments]
      ];
      cells.forEach(([label, v]) => {
        grid.insertAdjacentHTML('beforeend', `<div style="background:var(--card-soft);border:1px solid var(--line);border-radius:12px;padding:14px;text-align:center">
          <div style="font-size:24px;font-weight:700;color:var(--accent,#e07a5f)">${v}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:4px">${label}</div></div>`);
      });
      box.innerHTML = '';
      box.appendChild(grid);
      const dist = s.topic_dist || [];
      if (dist.length) {
        const p = document.createElement('div');
        p.className = 'panel';
        p.style.boxShadow = 'none';
        p.style.marginTop = '14px';
        p.innerHTML = '<h4 style="margin:0 0 10px">话题分布（全站可见帖）</h4>' +
          dist.map((d) => `<div class="topicact-link"><span>${escapeHtml(d.topic)}</span><span class="topicact-count">${d.count} 帖</span></div>`).join('');
        box.appendChild(p);
      }
    } catch (e) { box.innerHTML = `<div class="empty">加载失败：${escapeHtml(e.message)}</div>`; }
  }
  $('dashRefresh').addEventListener('click', loadDashboard);

  // ---------- 举报队列 ----------
  async function loadReports() {
    const list = $('reportList');
    list.innerHTML = '<div class="empty">加载中…</div>';
    try {
      const items = await callEdge('report_list', {});
      if (!items.length) { list.innerHTML = '<div class="empty">暂无待处理举报 ✅</div>'; return; }
      list.innerHTML = '';
      items.forEach(({ report, content }) => {
        const card = document.createElement('div');
        card.className = 'panel fade-in-up';
        card.style.padding = '12px 14px';
        card.style.boxShadow = 'none';
        card.style.marginBottom = '10px';
        const src = content ? `
          <div style="border-left:3px solid var(--line);padding-left:10px;margin:8px 0;color:var(--text);font-size:13px;white-space:pre-wrap">
            ${content.blocked ? '<span class="badge" style="color:#fff;background:var(--danger)">已屏蔽</span> ' : ''}
            <strong>${escapeHtml(content.nickname || '匿名')}</strong> · ${escapeHtml(content.topic || '评论')} ：
            ${escapeHtml(truncate(content.content, 120))}
          </div>` : '<div class="empty" style="padding:6px">（目标内容已被删除）</div>';
        card.innerHTML = `
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <strong style="font-size:13px">${report.target_type === 'post' ? '帖子' : '评论'}举报</strong>
            <span class="badge topic">${escapeHtml(report.reason.slice(0, 20))}</span>
            <span style="margin-left:auto;color:var(--faint);font-size:12px">${formatTime(report.created_at)}</span>
          </div>
          ${src}
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn sm" data-verdict="ignore" data-rid="${report.id}">忽略</button>
            <button class="btn sm ghost" data-verdict="block" data-rid="${report.id}">屏蔽目标</button>
            <button class="btn sm danger" data-verdict="delete" data-rid="${report.id}">删除目标</button>
          </div>`;
        card.querySelectorAll('[data-verdict]').forEach((b) => {
          b.addEventListener('click', async () => {
            if (b.dataset.verdict === 'delete' && !confirm('确定删除该目标及其关联内容？')) return;
            b.disabled = true;
            try { await callEdge('report_resolve', { report_id: b.dataset.rid, verdict: b.dataset.verdict }); loadReports(); refreshQueueBadges(); }
            catch (err) { alert(err.message); b.disabled = false; }
          });
        });
        list.appendChild(card);
      });
    } catch (e) { list.innerHTML = `<div class="empty">加载失败：${escapeHtml(e.message)}</div>`; }
  }
  $('reportRefresh').addEventListener('click', loadReports);

  // ---------- 审计日志 ----------
  async function loadAudit() {
    const list = $('auditList');
    list.innerHTML = '<div class="empty">加载中…</div>';
    try {
      const data = await callEdge('audit_list', {});
      if (!data.length) { list.innerHTML = '<div class="empty">暂无审计日志</div>'; return; }
      list.innerHTML = '';
      data.forEach((a) => {
        const c = document.createElement('div');
        c.className = 'panel fade-in-up';
        c.style.padding = '10px 14px';
        c.style.boxShadow = 'none';
        c.style.marginBottom = '8px';
        c.style.fontSize = '13px';
        c.innerHTML = `<span style="color:var(--accent,#e07a5f);font-weight:600">${escapeHtml(a.admin_name)}</span>
          <span style="margin:0 8px;color:var(--muted)">${escapeHtml(a.action)}</span>
          <span style="color:var(--faint)">${escapeHtml(a.detail)}</span>
          <span style="float:right;color:var(--faint);font-size:12px">${formatTime(a.created_at)}</span>`;
        list.appendChild(c);
      });
    } catch (e) { list.innerHTML = `<div class="empty">加载失败：${escapeHtml(e.message)}</div>`; }
  }
  $('auditRefresh').addEventListener('click', loadAudit);

  // ---------- 发布/昵称黑名单 ----------
  async function loadBlacklist() {
    const list = $('blacklistList');
    list.innerHTML = '<div class="empty">加载中…</div>';
    try {
      const data = await callEdge('blacklist_list');
      if (!data.length) { list.innerHTML = '<div class="empty">暂无黑名单条目</div>'; return; }
      list.innerHTML = '';
      data.forEach((b) => {
        const c = document.createElement('div');
        c.className = 'panel fade-in-up';
        c.style.padding = '10px 14px'; c.style.boxShadow = 'none'; c.style.marginBottom = '8px';
        c.style.display = 'flex'; c.style.alignItems = 'center'; c.style.gap = '10px'; c.style.flexWrap = 'wrap';
        const kindTag = b.kind === 'nickname'
          ? '<span class="badge topic">昵称</span>' : '<span class="badge" style="color:#fff;background:#6a6a8a">关键词</span>';
        c.innerHTML = `
          <strong style="font-size:13px">${escapeHtml(b.value)}</strong> ${kindTag}
          ${b.note ? `<span style="color:var(--faint);font-size:12px">${escapeHtml(b.note)}</span>` : ''}
          <span style="margin-left:auto;color:var(--faint);font-size:12px">${formatTime(b.created_at)}</span>
          <button class="btn sm danger" data-blkdel="${b.id}">移除</button>`;
        c.querySelector('[data-blkdel]').addEventListener('click', async (btn) => {
          if (!confirm(`确定移除「${b.value}」？`)) return;
          btn.currentTarget.disabled = true;
          try { await callEdge('blacklist_remove', { id: b.id }); loadBlacklist(); }
          catch (err) { alert(err.message); btn.currentTarget.disabled = false; }
        });
        list.appendChild(c);
      });
    } catch (e) { list.innerHTML = `<div class="empty">加载失败：${escapeHtml(e.message)}</div>`; }
  }
  function blkAdd() {
    const kind = $('blkKind').value;
    const value = $('blkValue').value.trim();
    if (!value) { alert('请填写内容'); return; }
    $('blkAdd').disabled = true;
    callEdge('blacklist_add', { kind, value })
      .then(() => { $('blkValue').value = ''; loadBlacklist(); })
      .catch((err) => alert(err.message))
      .finally(() => { $('blkAdd').disabled = false; });
  }
  $('blkAdd').addEventListener('click', blkAdd);
  $('blkValue').addEventListener('keydown', (e) => { if (e.key === 'Enter') blkAdd(); });

  function renderWhoami() {
    $('whoami').textContent = profile?.isFounder ? '创始人' : `${profile?.className || ''} ${profile?.name || '管理员'}`;
    const tags = [];
    const m = [
      ['can_block', '屏蔽/删除'], ['can_review', '吃瓜审核'], ['can_pin', '顶置'], ['can_popup', '弹窗']
    ];
    (profile?.isFounder ? m : m.filter(([k]) => profile?.perms?.[k])).forEach(([k, label]) => {
      tags.push(`<span class="badge topic">${label}</span>`);
    });
    $('permTags').innerHTML = tags.join(' ');
  }

  // ---------- 帖子管理 ----------
  function postFilterOptions() {
    $('postFilter').innerHTML = '<option value="">全部话题</option>' +
      TOPICS.map((t) => `<option>${t}</option>`).join('');
  }
  async function loadPosts() {
    const topic = $('postFilter').value || null;
    const data = await callEdge('list_posts', { topic, page: 1, pageSize: 200 });
    const list = $('postList');
    list.innerHTML = '';
    if (!data.length) { list.innerHTML = '<div class="empty">没有帖子</div>'; return; }
    data.forEach((p) => {
      const card = document.createElement('div');
      card.className = 'panel fade-in-up';
      card.style.padding = '14px 16px';
      card.style.boxShadow = 'none';
      card.style.marginBottom = '10px';
      let tag = `<span class="badge topic">${escapeHtml(p.topic)}</span>`;
      if (p.blocked) tag += ' <span class="badge" style="color:#fff;background:var(--danger)">已屏蔽</span>';
      if (!p.reviewed) tag += ' <span class="badge" style="color:#fff;background:var(--warn)">待审核</span>';
      const buttons = [];
      if (hasPerm('can_block')) {
        buttons.push(`<button class="btn sm ghost" data-a="block" data-id="${p.id}" data-v="${p.blocked ? 'false' : 'true'}">${p.blocked ? '解除屏蔽' : '屏蔽'}</button>`);
        buttons.push(`<button class="btn sm danger" data-a="del" data-id="${p.id}">删除</button>`);
      }
      if (hasPerm('can_review') && !p.reviewed && !p.blocked) {
        buttons.push(`<button class="btn sm" data-a="review" data-id="${p.id}" data-v="true">审核通过</button>`);
      }
      if (hasPerm('can_pin')) {
        buttons.push(`<button class="btn sm ghost" data-a="pin" data-id="${p.id}">置顶</button>`);
      }
      card.innerHTML = `
        <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:6px">
          <strong>${escapeHtml(p.nickname || '匿名')}</strong> ${tag}
          <span style="margin-left:auto;color:var(--faint);font-size:12px">${formatTime(p.created_at)}</span>
        </div>
        <div style="color:var(--text);font-size:14px;line-height:1.7;white-space:pre-wrap;margin-bottom:10px">${escapeHtml(p.content)}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">${buttons.join('')}</div>`;
      card.addEventListener('click', onPostAction);
      list.appendChild(card);
    });
  }
  async function onPostAction(e) {
    const btn = e.target.closest('button[data-a]');
    if (!btn) return;
    const { a, id, v } = btn.dataset;
    if (a === 'del' && !confirm('确定删除该帖子？（不可恢复）')) return;
    btn.disabled = true;
    try {
      if (a === 'block') await callEdge('block_post', { id, blocked: v === 'true' });
      else if (a === 'del') await callEdge('delete_post', { id });
      else if (a === 'review') await callEdge('review_post', { id, reviewed: true });
      else if (a === 'pin') await callEdge('pin_post', { id, pinned: true });
      loadPosts();
    } catch (err) { alert(err.message); btn.disabled = false; }
  }
  $('postFilter').addEventListener('change', loadPosts);
  $('postRefresh').addEventListener('click', loadPosts);

  // ---------- 评论管理 ----------
  let commentTimer = null;
  $('commentRefresh').addEventListener('click', loadComments);
  $('commentTopic').addEventListener('change', () => {
    clearTimeout(commentTimer);
    commentTimer = setTimeout(loadComments, 150);
  });
  async function loadComments() {
    const topic = $('commentTopic').value || '';
    const list = $('commentList');
    list.innerHTML = '<div class="empty">加载中…</div>';
    try {
      const data = await callEdge('comment_admin_list', { topic, limit: 300 });
      if (!data.length) { list.innerHTML = '<div class="empty">暂无评论</div>'; return; }
      list.innerHTML = '';
      data.forEach((c) => {
        const card = document.createElement('div');
        card.className = 'panel fade-in-up';
        card.style.padding = '12px 14px';
        card.style.boxShadow = 'none';
        card.style.marginBottom = '10px';
        const name = c.nickname ? escapeHtml(c.nickname) : '<span style="color:var(--faint)">匿名</span>';
        const topicTag = c.topic ? `<span class="badge topic">${escapeHtml(c.topic)}</span>` : '';
        const stateTag = c.blocked
          ? '<span class="badge" style="color:#fff;background:#e05e5e">已屏蔽</span>'
          : '<span class="badge topic">正常</span>';
        const replyTag = c.parent_id ? '<span style="color:var(--accent,#e07a5f);font-size:12px">（回复）</span>' : '';
        card.innerHTML = `
          <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;flex-wrap:wrap">
            <strong style="font-size:13px">${name}</strong> ${replyTag} ${topicTag} ${stateTag}
            <span style="margin-left:auto;color:var(--faint);font-size:12px">${formatTime(c.created_at)}</span>
          </div>
          <div style="color:var(--text);font-size:14px;line-height:1.7;word-break:break-word;margin-bottom:10px">${escapeHtml(c.content)}</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn sm ${c.blocked ? 'ghost' : ''}" data-block="${c.id}" data-to="${c.blocked ? 'false' : 'true'}">
              ${c.blocked ? '解除屏蔽' : '屏蔽'}
            </button>
            <button class="btn sm danger" data-del="${c.id}">删除</button>
          </div>`;
        card.querySelector('[data-block]').addEventListener('click', async (b) => {
          b.currentTarget.disabled = true;
          try { await callEdge('comment_toggle_block', { id: c.id, blocked: b.currentTarget.dataset.to === 'true' }); loadComments(); }
          catch (err) { alert(err.message); b.currentTarget.disabled = false; }
        });
        card.querySelector('[data-del]').addEventListener('click', async (b) => {
          if (!confirm('确定删除该评论？（不可恢复）')) return;
          b.currentTarget.disabled = true;
          try { await callEdge('comment_delete', { id: c.id }); loadComments(); }
          catch (err) { alert(err.message); b.currentTarget.disabled = false; }
        });
        list.appendChild(card);
      });
    } catch (err) {
      list.innerHTML = `<div class="empty">加载失败：${escapeHtml(err.message)}</div>`;
    }
  }

  // ---------- 吃瓜审核 ----------
  async function loadReview() {
    const data = await callEdge('list_posts', { topic: '吃瓜', page: 1, pageSize: 200 });
    const pending = data.filter((p) => !p.blocked);   // 已通过 / 已屏蔽的都不在待审列表
    const list = $('reviewList');
    list.innerHTML = '';
    if (!pending.length) { list.innerHTML = '<div class="empty">暂无待审核的吃瓜帖</div>'; return; }
    pending.forEach((p) => {
      const stateTag = p.reviewed
        ? '<span class="badge topic">已通过</span>'
        : '<span class="badge" style="color:#fff;background:var(--warn)">待审核</span>';
      const card = document.createElement('div');
      card.className = 'panel fade-in-up';
      card.style.padding = '14px 16px';
      card.style.boxShadow = 'none';
      card.style.marginBottom = '10px';
      const actions = (hasPerm('can_review')) ? `
        <button class="btn sm" data-a="pass" data-id="${p.id}">通过并展示</button>
        <button class="btn sm ghost" data-a="block" data-id="${p.id}">不通过且屏蔽（仅管理员可见）</button>
        <button class="btn sm danger" data-a="del" data-id="${p.id}">删除</button>` : '<span class="badge">无审核权限</span>';
      card.innerHTML = `
        <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px;flex-wrap:wrap">
          <strong>${escapeHtml(p.nickname || '匿名')}</strong> ${stateTag}
          <span style="margin-left:auto;color:var(--faint);font-size:12px">${formatTime(p.created_at)}</span>
        </div>
        <div style="color:var(--text);font-size:14px;line-height:1.7;white-space:pre-wrap;margin-bottom:10px">${escapeHtml(p.content)}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">${actions}</div>`;
      card.querySelectorAll('[data-a]').forEach((b) => {
        b.addEventListener('click', async () => {
          if (b.dataset.a === 'del' && !confirm('确定删除该帖？（不可恢复）')) return;
          b.disabled = true;
          try {
            if (b.dataset.a === 'pass') await callEdge('review_pass_post', { id: p.id });
            else if (b.dataset.a === 'block') await callEdge('review_block_post', { id: p.id });
            else await callEdge('review_delete_post', { id: p.id });
            loadReview();
          } catch (err) { alert(err.message); b.disabled = false; }
        });
      });
      list.appendChild(card);
    });
  }
  $('reviewRefresh').addEventListener('click', loadReview);

  // ---------- 顶置管理 ----------
  async function loadPinned() {
    const data = await callEdge('pin_list');
    const count = (data || []).length;
    const list = $('pinList');
    const title = list.closest('section').querySelector('h3');
    title.textContent = `顶置管理（${count} / 200 条）`;
    list.innerHTML = '';
    if (!data.length) { list.innerHTML = '<div class="empty">暂无顶置帖</div>'; return; }
    data.forEach((p) => {
      const card = document.createElement('div');
      card.className = 'panel fade-in-up';
      card.style.padding = '14px 16px';
      card.style.boxShadow = 'none';
      card.style.marginBottom = '10px';
      card.innerHTML = `
        <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px;flex-wrap:wrap">
          <strong>${escapeHtml(p.nickname || '匿名')}</strong>
          <span class="badge topic">${escapeHtml(p.topic)}</span>
          ${p.blocked ? '<span class="badge" style="color:#fff;background:var(--danger)">已屏蔽</span>' : ''}
          <span style="margin-left:auto;color:var(--faint);font-size:12px">顶置于 ${formatTime(p.pinned_at)}</span>
        </div>
        <div style="color:var(--text);font-size:14px;line-height:1.7;white-space:pre-wrap;margin-bottom:10px">${escapeHtml(p.content)}</div>
        ${hasPerm('can_pin') ? `<button class="btn sm ghost" data-pin="${p.id}">取消顶置（移回普通帖）</button>` : ''}`;
      card.querySelectorAll('[data-pin]').forEach((b) => {
        b.addEventListener('click', async () => {
          b.disabled = true;
          try { await callEdge('pin_post', { id: p.id, pinned: false }); loadPinned(); }
          catch (err) { alert(err.message); b.disabled = false; }
        });
      });
      list.appendChild(card);
    });
  }
  $('pinRefresh').addEventListener('click', loadPinned);

  // ---------- 站点开关 ----------
  async function loadSite() {
    const data = await callEdge('site_get');
    $('siteOpen').checked = !!data.open;
    $('haltTitle').value = data.halt_title || '';
    $('haltSubtitle').value = data.halt_subtitle || '';
  }
  $('siteSave').addEventListener('click', async () => {
    const open = $('siteOpen').checked;
    const halt_title = $('haltTitle').value.trim();
    const halt_subtitle = $('haltSubtitle').value.trim();
    $('siteError').textContent = '';
    try {
      await callEdge('site_set', { open, halt_title, halt_subtitle });
      $('siteError').textContent = '✅ 已保存';
    } catch (err) { $('siteError').textContent = err.message; }
  });

  // ---------- 弹窗公告 ----------
  let popupEditingId = null;
  function popupResetForm() {
    popupEditingId = null;
    $('popTitle').value = '';
    $('popContent').value = '';
    $('popFormTitle').textContent = '新建公告';
    $('popCreate').textContent = '发布公告';
    $('popCreate').classList.remove('ghost');
    $('popCancel').classList.add('hidden');
  }
  function popupStartEdit(p) {
    popupEditingId = p.id;
    $('popTitle').value = p.title;
    $('popContent').value = p.content;
    $('popFormTitle').textContent = '编辑公告';
    $('popCreate').textContent = '保存修改';
    $('popCreate').classList.add('ghost');
    $('popCancel').classList.remove('hidden');
    $('popFormTitle').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  async function loadPopups() {
    const data = await callEdge('popup_list');
    const list = $('popupList');
    list.innerHTML = '';
    if (!data.length) { list.innerHTML = '<div class="empty">暂无公告</div>'; return; }
    data.forEach((p) => {
      const card = document.createElement('div');
      card.className = 'panel fade-in-up';
      card.style.padding = '14px 16px';
      card.style.boxShadow = 'none';
      card.style.marginBottom = '10px';
      card.innerHTML = `
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;flex-wrap:wrap">
          <strong>${escapeHtml(p.title)}</strong>
          ${p.enabled ? '<span class="badge topic">已启用</span>' : '<span class="badge" style="color:#fff;background:var(--faint)">已停用</span>'}
          <button class="btn sm ghost" data-edit="${p.id}">编辑</button>
          <button class="btn sm ghost" data-push="${p.id}">再次推送</button>
          <button class="btn sm ghost" data-toggle="${p.id}" data-en="${p.enabled ? 'false' : 'true'}">${p.enabled ? '停用' : '启用'}</button>
          <button class="btn sm danger" data-del="${p.id}">删除</button>
        </div>
        <div style="color:var(--muted);font-size:13px;white-space:pre-wrap">${escapeHtml(p.content)}</div>`;
      card.querySelector('[data-del]').addEventListener('click', async (b) => {
        if (!confirm('删除该公告？')) return;
        b.currentTarget.disabled = true;
        try { await callEdge('popup_delete', { id: p.id }); if (popupEditingId === p.id) popupResetForm(); loadPopups(); }
        catch (err) { alert(err.message); }
      });
      card.querySelector('[data-toggle]').addEventListener('click', async (b) => {
        b.currentTarget.disabled = true;
        try { await callEdge('popup_toggle', { id: p.id, enabled: b.currentTarget.dataset.en === 'true' }); loadPopups(); }
        catch (err) { alert(err.message); }
      });
      card.querySelector('[data-edit]').addEventListener('click', () => popupStartEdit(p));
      card.querySelector('[data-push]').addEventListener('click', async (b) => {
        if (!confirm('将把这条公告再次推送给所有用户（未看过新版本的可再次收到弹窗）？')) return;
        b.currentTarget.disabled = true;
        try { await callEdge('popup_push', { id: p.id }); alert('已再次推送'); loadPopups(); }
        catch (err) { alert(err.message); b.currentTarget.disabled = false; }
      });
      list.appendChild(card);
    });
  }
  $('popCreate').addEventListener('click', async () => {
    const title = $('popTitle').value.trim();
    const content = $('popContent').value.trim();
    if (!title || !content) { alert('请填写标题和内容'); return; }
    $('popCreate').disabled = true;
    try {
      if (popupEditingId) await callEdge('popup_update', { id: popupEditingId, title, content });
      else await callEdge('popup_create', { title, content, enabled: true });
      popupResetForm();
      loadPopups();
    } catch (err) { alert(err.message); }
    $('popCreate').disabled = false;
  });
  $('popCancel').addEventListener('click', popupResetForm);

  // ---------- 管理员管理（创始人） ----------
  async function loadAdmins() {
    if (!profile?.isFounder) return;
    // 待审核
    const pending = await callEdge('founder_list_pending');
    const pl = $('pendingList');
    pl.innerHTML = '';
    if (!pending.length) { pl.innerHTML = '<div class="empty" style="padding:14px">暂无待审核申请</div>'; }
    pending.forEach((a) => {
      const c = document.createElement('div');
      c.className = 'panel fade-in-up';
      c.style.padding = '12px 14px'; c.style.boxShadow = 'none'; c.style.marginBottom = '8px';
      c.innerHTML = `
        <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center">
          <span><strong>${escapeHtml(a.name)}</strong> · ${escapeHtml(a.class_name)} · @${escapeHtml(a.username)}</span>
          <span style="margin-left:auto;color:var(--faint);font-size:12px">申请于 ${formatTime(a.created_at)}</span>
          <button class="btn sm" data-approve="${a.id}">通过</button>
          <button class="btn sm danger" data-reject="${a.id}">拒绝</button>
        </div>`;
      c.querySelector('[data-approve]').addEventListener('click', async (b) => {
        b.currentTarget.disabled = true;
        try { await callEdge('founder_approve', { id: a.id }); loadAdmins(); } catch (err) { alert(err.message); }
      });
      c.querySelector('[data-reject]').addEventListener('click', async (b) => {
        if (!confirm('拒绝并删除该申请？')) return;
        b.currentTarget.disabled = true;
        try { await callEdge('founder_reject', { id: a.id }); loadAdmins(); } catch (err) { alert(err.message); }
      });
      pl.appendChild(c);
    });

    // 在职管理员
    const admins = await callEdge('founder_list_admins');
    const al = $('adminList');
    al.innerHTML = '';
    if (!admins.length) { al.innerHTML = '<div class="empty" style="padding:14px">暂无在职管理员（创始人除外）</div>'; }
    admins.forEach((a) => {
      const c = document.createElement('div');
      c.className = 'panel fade-in-up';
      c.style.padding = '12px 14px'; c.style.boxShadow = 'none'; c.style.marginBottom = '8px';
      const perms = [
        ['can_block', '屏蔽/删除'], ['can_review', '吃瓜审核'], ['can_pin', '顶置'], ['can_popup', '弹窗']
      ];
      const toggles = perms.map(([k, label]) => {
        const on = !!a[k];
        return `<label style="display:inline-flex;align-items:center;gap:4px;margin-right:10px;font-size:13px;color:var(--muted)">
          <input type="checkbox" data-perm="${k}" data-id="${a.id}" ${on ? 'checked' : ''} /> ${label}</label>`;
      }).join('');
      c.innerHTML = `
        <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:8px">
          <span><strong>${escapeHtml(a.name)}</strong> · ${escapeHtml(a.class_name)} · @${escapeHtml(a.username)}</span>
          <button class="btn sm danger" data-deladmin="${a.id}" style="margin-left:auto">删除管理员</button>
        </div>
        <div style="display:flex;flex-wrap:wrap">${toggles}</div>`;
      c.querySelectorAll('input[data-perm]').forEach((cb) => {
        cb.addEventListener('change', async () => {
          cb.disabled = true;
          try {
            const cur = {};
            c.querySelectorAll('input[data-perm]').forEach((x) => { cur[x.dataset.perm] = x.checked; });
            await callEdge('founder_set_perms', { id: a.id, perms: cur });
          } catch (err) { alert(err.message); cb.checked = !cb.checked; }
          cb.disabled = false;
        });
      });
      c.querySelector('[data-deladmin]').addEventListener('click', async (b) => {
        if (!confirm(`确定删除管理员 ${a.name}？`)) return;
        b.currentTarget.disabled = true;
        try { await callEdge('founder_delete_admin', { id: a.id }); loadAdmins(); } catch (err) { alert(err.message); }
      });
      al.appendChild(c);
    });
  }

  // ---------- 启动 ----------
  function boot() {
    readSession();
    if (!token) {
      $('loginScreen').classList.remove('hidden');
      $('dashboard').classList.add('hidden');
      return;
    }
    $('loginScreen').classList.add('hidden');
    $('dashboard').classList.remove('hidden');
    renderWhoami();
    postFilterOptions();
    renderTabs();
    switchTab(activeTab);
  }
  $('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PROFILE_KEY);
    location.href = 'index.html';
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();