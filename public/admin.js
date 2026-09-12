/* ============================================================
   XDD吧 · 管理后台逻辑
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
  const TOPICS = ['闲聊', '社团活动', '食堂', '宿舍', '学习', '吃瓜', '失物招领'];

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
    const all = [
      { key: 'dashboard', label: '看板' },
      { key: 'posts', label: '帖子管理' },
      { key: 'review', label: '吃瓜审核', perm: 'can_review' },
      { key: 'reports', label: '举报', requiresAny: ['can_report', 'can_block'] },
      { key: 'trash', label: '回收站', perm: 'can_block' },
      { key: 'pinned', label: '顶置管理', perm: 'can_pin' },
      { key: 'audit', label: '审计日志', perm: 'can_view_audit' },
      { key: 'blacklist', label: '黑名单', requiresAny: ['can_blacklist', 'can_block', 'can_ban'] },
      { key: 'userMgmt', label: '用户统一管理', perm: 'can_user_mgmt' },
      { key: 'site', label: '站点开关' },
      { key: 'popups', label: '弹窗公告' },
      { key: 'announces', label: '公告栏', perm: 'can_notice' },
      { key: 'bugs', label: 'Bug反馈', perm: 'can_bug' },
      { key: 'topics', label: '自定义话题', perm: 'can_topic' }
    ];
    if (profile?.isFounder) {
      all.push({ key: 'admins', label: '管理员' });
    } else {
      const filtered = all.filter((t) => {
        if (t.perm) return hasPerm(t.perm);
        if (t.requiresAny) return t.requiresAny.some((p) => hasPerm(p));
        return true;
      });
      all.length = 0; all.push(...filtered);
    }
    const nav = $('tabs');
    nav.innerHTML = '';
    all.forEach((t) => {
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
    if (key === 'review') loadReview();
    if (key === 'reports') loadReports();
    if (key === 'trash') loadTrash();
    if (key === 'pinned') loadPinned();
    if (key === 'audit') loadAudit();
    if (key === 'userMgmt') loadUserMgmt();
    if (key === 'blacklist') {
      if (!hasPerm('can_blacklist') && !hasPerm('can_block') && hasPerm('can_ban')) {
        $('blacklistView').value = 'users';
      }
      loadBlacklistPanel();
    }
    if (key === 'site') loadSite();
    if (key === 'popups') loadPopups();
    if (key === 'announces') loadAnnounces();
    if (key === 'bugs') loadBugs();
    if (key === 'topics') loadTopicsAdmin();
    if (key === 'admins') loadAdmins();
  }

  // ---------- 数据看板 ----------
  async function loadDashboard() {
    const box = $('dashStats');
    box.innerHTML = '<div class="empty">加载中…</div>';
    try {
      const s = await callEdge('dashboard_stats');
      const grid = document.createElement('div');
      grid.style.display = 'grid';
      grid.style.gridTemplateColumns = 'repeat(auto-fill,minmax(150px,1fr))';
      grid.style.gap = '10px';
      const cells = [
        ['今日发帖', s.today_posts], ['今日评论', s.today_comments], ['今日新增用户', s.today_users],
        ['帖子总数', s.total_posts], ['评论总数', s.total_comments], ['用户总数', s.total_users],
        ['待审核吃瓜', s.open_review], ['待处理举报', s.open_reports],
        ['黑名单/敏感词拦截次数', s.interceptions]
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
  async function showAuditSource(id) {
    let r;
    try { r = await callEdge('audit_source', { id }); }
    catch (e) { alert(e.message); return; }
    $('auditSrcTitle').textContent = (r.type === 'comment' ? '评论原文' : '帖子原文') + (r.from === 'snapshot' ? '（快照）' : '（现查）');
    let body = '';
    if (r.nickname) {
      body += `<div style="color:var(--muted);margin-bottom:10px"><strong>${escapeHtml(r.nickname)}</strong>` +
        (r.topic ? ` · ${escapeHtml(r.topic)}` : '') +
        (r.blocked ? ' <span class="badge" style="color:#fff;background:var(--danger)">已屏蔽</span>' : '') + '</div>';
    }
    body += `<div style="white-space:pre-wrap;color:var(--text)">${escapeHtml(r.content)}</div>`;
    $('auditSrcBody').innerHTML = body;
    $('auditSrcModal').classList.remove('hidden');
  }
  function closeAuditSrc() { $('auditSrcModal').classList.add('hidden'); }
  $('auditSrcClose').addEventListener('click', closeAuditSrc);
  $('auditSrcModal').addEventListener('click', (e) => { if (e.target === $('auditSrcModal')) closeAuditSrc(); });

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
          <span style="float:right;color:var(--faint);font-size:12px">${formatTime(a.created_at)}</span>
          ${a.target_type ? `<div style="margin-top:6px"><button class="btn sm ghost" data-src="${a.id}" data-type="${escapeHtml(a.target_type)}">查看${a.target_type === 'comment' ? '评论' : '帖子'}原文</button></div>` : ''}`;
        c.querySelector('[data-src]')?.addEventListener('click', (b) => showAuditSource(a.id));
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

  // 黑名单 / 拦截记录 视图切换
  function loadBlacklistPanel() {
    const view = $('blacklistView').value;
    const isRecords = view === 'records';
    const isUsers = view === 'users';
    $('blkEditor').style.display = isUsers || isRecords ? 'none' : 'flex';
    $('banEditor').style.display = isUsers ? 'flex' : 'none';
    $('blacklistHint').textContent = isUsers
      ? '注册用户管理与封禁：按用户名/昵称检索；可封禁（自定义天数）、提前解封或永久注销（注销后该用户名禁止再次登录）。'
      : isRecords
        ? '发帖/评论被敏感词或黑名单关键词拦截时即时记录（同一用户同一内容重复发送不重复记录），最多保留最近 750 条。'
        : '关键词黑名单：内容命中即禁止发布；昵称黑名单：昵称/账号精确匹配即拦截。可在发布/评论/注册时生效。';
    if (isUsers) { $('blacklistList').innerHTML = ''; loadBanUsers(); }
    else if (isRecords) { $('banUserList').innerHTML = ''; loadInterceptions(); }
    else { $('banUserList').innerHTML = ''; loadBlacklist(); }
  }
  $('blacklistView').addEventListener('change', loadBlacklistPanel);
  $('blacklistRefresh').addEventListener('click', loadBlacklistPanel);

  // ---------- 封禁用户（can_ban） ----------
  let banSearchQ = '';
  async function loadBanUsers() {
    const list = $('banUserList');
    list.innerHTML = '<div class="empty">加载中…</div>';
    let data;
    try { data = await callEdge('admin_user_search', { q: banSearchQ }); }
    catch (e) { list.innerHTML = `<div class="empty">加载失败：${escapeHtml(e.message)}</div>`; return; }
    if (!data.length) { list.innerHTML = '<div class="empty">暂无匹配的用户</div>'; return; }
    list.innerHTML = '';
    data.forEach((u) => {
      const c = document.createElement('div');
      c.className = 'panel fade-in-up';
      c.style.padding = '10px 14px'; c.style.boxShadow = 'none'; c.style.marginBottom = '8px';
      const statusBadge = u.permanent
        ? '<span class="badge" style="color:#fff;background:var(--danger)">永久封禁</span>'
        : u.banned
          ? `<span class="badge" style="color:#fff;background:#c26">封禁至 ${formatTime(u.until)}</span>`
          : '<span class="badge" style="color:#fff;background:#2e8b57">正常</span>';
      c.innerHTML = `
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:6px">
          <span><strong>@${escapeHtml(u.username)}</strong></span>
          <span style="color:var(--faint);font-size:12px">${escapeHtml(u.nickname || '')} · 注册于 ${formatTime(u.created_at)}</span>
          <span style="margin-left:auto">${statusBadge}</span>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <input type="number" min="1" max="3650" value="7" data-days="${u.id}" style="width:76px;padding:4px 6px;border:1px solid var(--line);border-radius:8px;background:var(--input-bg);color:var(--text)" />
          <button class="btn sm danger" data-ban="${u.id}">封禁 N 天</button>
          <button class="btn sm ghost" data-unban="${u.id}" ${u.banned ? '' : 'disabled'}>提前解封</button>
          <button class="btn sm danger" data-term="${u.id}">永久注销</button>
        </div>`;
      list.appendChild(c);
      c.querySelector('[data-ban]').addEventListener('click', async (el) => {
        const days = Number(c.querySelector(`[data-days="${u.id}"]`).value || 7);
        if (!confirm(`确认封禁 @${u.username} ${days} 天？\n封禁期间其无法发帖、点赞、评论、创建话题。`)) return;
        el.currentTarget.disabled = true;
        try { await callEdge('admin_user_ban', { user_id: u.id, days }); loadBanUsers(); }
        catch (err) { alert(err.message); el.currentTarget.disabled = false; }
      });
      c.querySelector('[data-unban]').addEventListener('click', async (el) => {
        if (!confirm(`确认提前解封 @${u.username}？`)) return;
        el.currentTarget.disabled = true;
        try { await callEdge('admin_user_unban', { user_id: u.id }); loadBanUsers(); }
        catch (err) { alert(err.message); el.currentTarget.disabled = false; }
      });
      c.querySelector('[data-term]').addEventListener('click', async (el) => {
        if (!confirm(`确认永久注销 @${u.username}？\n此操作将删除该账号，且该用户名将永久无法再次登录，不可恢复！`)) return;
        el.currentTarget.disabled = true;
        try { await callEdge('admin_user_terminate', { user_id: u.id }); loadBanUsers(); }
        catch (err) { alert(err.message); el.currentTarget.disabled = false; }
      });
    });
  }
  $('banUserSearch').addEventListener('click', () => {
    banSearchQ = $('banUserQ').value.trim();
    loadBanUsers();
  });
  $('banUserQ').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('banUserSearch').click(); });

  // ---------- 用户统一管理（can_user_mgmt / 列用户·看信息·编辑等级） ----------
  const LEVEL_TIERS = [[10,'初来乍到'],[20,'校园萌新'],[35,'校园百事通'],[45,'风云学长'],[54,'校园传说'],[60,'校史留名']];
  let userMgmtQ = '';
  function levelNameMgmt(lv) { for (const t of LEVEL_TIERS) if (lv <= t[0]) return lv + ' · ' + t[1]; return '60 · 校史留名'; }
  async function loadUserMgmt() {
    const list = $('userMgmtList');
    list.innerHTML = '<div class="empty">加载中…</div>';
    let data;
    try { data = await callEdge('admin_user_mgmt_list', { q: userMgmtQ }); }
    catch (e) { list.innerHTML = `<div class="empty">加载失败：${escapeHtml(e.message)}</div>`; return; }
    if (!data.length) { list.innerHTML = '<div class="empty">暂无注册用户</div>'; return; }
    list.innerHTML = '';
    data.forEach((u) => {
      const c = document.createElement('div');
      c.className = 'panel fade-in-up';
      c.style.padding = '12px 14px'; c.style.boxShadow = 'none'; c.style.marginBottom = '10px';
      const manual = u.fixed_level > 0 ? ' <span class="badge" style="background:#2e8b57">手动设定</span>' : '';
      const statusBadge = u.banned
        ? (u.permanent ? '<span class="badge" style="color:#fff;background:var(--danger)">已注销</span>' : '<span class="badge" style="color:#fff;background:#c26">封禁中</span>')
        : '<span class="badge" style="color:#fff;background:#2e8b57">正常</span>';
      const initials = escapeHtml((u.nickname || u.username).charAt(0).toUpperCase());
      c.innerHTML = `
        <div style="display:flex;gap:10px;align-items:flex-start;flex-wrap:wrap">
          <span class="avatar" style="width:36px;height:36px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-weight:700;color:#fff;flex-shrink:0;background:${u.avatar_color || '#e07a5f'}">${initials}</span>
          <div style="min-width:180px;flex:1">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              <strong>@${escapeHtml(u.username)}</strong>
              <span style="color:var(--faint);font-size:12px">${escapeHtml(u.nickname || '未设置昵称')}</span>
              <span style="margin-left:auto">${statusBadge}</span>
            </div>
            <div style="font-size:12px;color:var(--muted);margin-top:4px;line-height:1.7">
              注册于 ${formatTime(u.created_at)} ｜ 帖子 ${u.post_count} ｜ 评论 ${u.comment_count} ｜ 获赞 ${u.like_received}<br>
              经验 ${u.xp} ｜ 自动等级 Lv.${u.auto_level} ｜ 当前等级 <b style="color:var(--accent,#e07a5f)">Lv.${u.level}</b>${manual}
            </div>
            <div style="display:flex;gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap">
              <input type="number" min="0" max="60" value="${u.fixed_level}" data-lv="${u.id}" style="width:76px;padding:4px 6px;border:1px solid var(--line);border-radius:8px;background:var(--input-bg);color:var(--text)" title="0=按经验自动，1-60=固定等级" />
              <button class="btn sm" data-setlv="${u.id}">修改等级</button>
              <button class="btn sm" data-viewprof="${u.id}" data-name="${escapeHtml(u.nickname || u.username)}">👁 查看主页</button>
            </div>
            <div style="font-size:12px;color:var(--faint);margin-top:4px">当前将显示：${escapeHtml(levelNameMgmt(u.level))}</div>
          </div>
        </div>`;
      list.appendChild(c);
      const vp = c.querySelector(`[data-viewprof="${u.id}"]`);
      if (vp) vp.addEventListener('click', () => viewUserProfile(u.id, vp.dataset.name));
      c.querySelector(`[data-setlv="${u.id}"]`).addEventListener('click', async (el) => {
        const lv = Math.max(0, Math.min(60, Math.floor(Number(c.querySelector(`[data-lv="${u.id}"]`).value || 0))));
        const tag = lv === 0 ? '自动（按经验计算）' : `Lv.${lv}`;
        if (!confirm(`确认将 @${u.username} 的等级设为「${tag}」？`)) return;
        el.currentTarget.disabled = true;
        try { await callEdge('admin_user_set_level', { user_id: u.id, level: lv }); loadUserMgmt(); }
        catch (err) { alert(err.message); el.currentTarget.disabled = false; }
      });
    });
  }
  $('userMgmtSearch').addEventListener('click', () => { userMgmtQ = $('userMgmtQ').value.trim(); loadUserMgmt(); });
  $('userMgmtQ').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('userMgmtSearch').click(); });
  $('userMgmtRefresh').addEventListener('click', () => loadUserMgmt());

  // 管理员查看用户个人主页（含隐私字段，后端按管理员身份返回全部）
  async function viewUserProfile(userId, name) {
    const mask = document.createElement('div');
    mask.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(10,12,25,.6);display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(3px)';
    mask.innerHTML = `<div style="width:min(540px,96vw);max-height:86vh;overflow:auto;background:var(--card,#fff);border:1px solid var(--line);border-radius:16px;padding:20px 22px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
        <span style="font-weight:800;color:var(--text);font-size:17px">👤 ${escapeHtml(name)} 的个人主页</span>
        <span style="font-size:11px;color:var(--accent,#e07a5f)">管理员视角（可查看全部字段）</span>
        <button id="vpm-close" style="margin-left:auto;background:none;border:none;font-size:22px;color:var(--muted);cursor:pointer">×</button>
      </div>
      <div id="vpm-body" style="color:var(--muted);font-size:13px">加载中…</div>
    </div>`;
    mask.querySelector('#vpm-close').addEventListener('click', () => mask.remove());
    mask.addEventListener('mousedown', (e) => { if (e.target === mask) mask.remove(); });
    document.body.appendChild(mask);
    const body = mask.querySelector('#vpm-body');
    let data;
    try { data = await callEdge('profile_get', { token, user_id: userId }); }
    catch (e) { body.innerHTML = `<div style="color:#e05e5e">加载失败：${escapeHtml(e.message)}</div>`; return; }
    if (!data) { body.innerHTML = '<div>无主页数据</div>'; return; }
    const p = data.profile || {};
    const flagLabel = (k) => (p.flags && p.flags[k] === false ? '<span style="color:#c26;font-size:11px">（对他人私密）</span>' : '<span style="color:var(--faint);font-size:11px">（公开）</span>');
    const fields = [
      ['联系方式', p.contact], ['性别', p.gender], ['班级', p.class_name],
      ['姓名', p.real_name], ['个性签名', p.signature], ['简介', p.bio]
    ];
    const rows = fields.map(([label, val]) =>
      `<div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px dashed var(--line)">
        <span style="flex:0 0 74px;color:var(--faint)">${label} ${flagLabel(label === '姓名' ? 'real_name' : label === '联系方式' ? 'contact' : label === '性别' ? 'gender' : label === '班级' ? 'class_name' : label === '个性签名' ? 'signature' : 'bio')}</span>
        <span style="flex:1;white-space:pre-wrap;word-break:break-word">${escapeHtml(val || '（未填写）')}</span>
      </div>`).join('');
    const tags = (Array.isArray(p.tags) && p.tags.length)
      ? p.tags.map((t) => `<span style="background:var(--card-soft,#eee);border:1px solid var(--line);color:var(--accent,#e07a5f);border-radius:999px;padding:1px 9px;font-size:12px;margin-right:4px">${escapeHtml(t)}</span>`).join('')
      : '<span class="empty">（无标签）</span>';
    body.innerHTML = `
      ${p.page_open === false ? '<div style="margin-bottom:10px;padding:8px 12px;border-radius:8px;background:rgba(194,102,0,.12);color:#c2600a;font-size:12px">🔒 该用户已将主页设为「不对访客开放」（管理员仍可见）</div>' : ''}
      ${tags.length ? `<div style="margin-bottom:6px">标签：${tags}</div>` : ''}
      ${rows || '<div>该用户尚未填写个人主页资料</div>'}`;
  }

  async function loadInterceptions() {
    const list = $('blacklistList');
    list.innerHTML = '<div class="empty">加载中…</div>';
    let data;
    try { data = await callEdge('interceptions_list'); }
    catch (e) { list.innerHTML = `<div class="empty">加载失败：${escapeHtml(e.message)}</div>`; return; }
    if (!data.length) { list.innerHTML = '<div class="empty">暂无拦截记录 ✅</div>'; return; }
    const KIND_LABEL = { post: '发帖', comment: '评论', nickname: '昵称', keyword: '关键词', topic: '话题' };
    list.innerHTML = '';
    data.forEach((r) => {
      const c = document.createElement('div');
      c.className = 'panel fade-in-up';
      c.style.padding = '10px 14px'; c.style.boxShadow = 'none'; c.style.marginBottom = '8px';
      c.innerHTML = `
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:4px">
          <span class="badge topic">${escapeHtml(KIND_LABEL[r.kind] || r.kind)}</span>
          <span style="font-size:13px;color:var(--accent,#e07a5f)">@${escapeHtml(r.user_key)}</span>
          ${r.topic ? `<span class="badge" style="color:#fff;background:#5a7184">话题：${escapeHtml(r.topic)}</span>` : ''}
          ${r.words ? `<span class="badge" style="color:#fff;background:#6a6a8a">命中：${escapeHtml(r.words)}</span>` : ''}
          <span style="margin-left:auto;color:var(--faint);font-size:12px">${formatTime(r.created_at)}</span>
        </div>
        <div style="color:var(--muted);font-size:13px;white-space:pre-wrap;border-left:3px solid var(--line);padding-left:10px">${escapeHtml(r.content)}</div>`;
      list.appendChild(c);
    });
  }

  function renderWhoami() {
    $('whoami').textContent = profile?.isFounder ? '创始人' : `${profile?.className || ''} ${profile?.name || '管理员'}`;
    const tags = [];
    const m = [
      ['can_block', '屏蔽/删除'], ['can_review', '吃瓜审核'], ['can_pin', '顶置'], ['can_popup', '弹窗'],
      ['can_report', '举报管理'], ['can_view_audit', '审计查看'], ['can_blacklist', '黑名单管理'],
      ['can_notice', '公告管理'], ['can_bug', 'Bug回复'], ['can_topic', '话题管理'],
      ['can_ban', '用户封禁'], ['can_user_mgmt', '用户统一管理'], ['can_column', '专栏管理']
    ];
    tags.push(...m.filter(([k]) => hasPerm(k)).map(([, l]) => `<span class="badge">${l}</span>`));
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
    if (!data || !data.length) list.innerHTML = '<div class="empty">没有帖子</div>';
    (data || []).forEach((p) => {
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
        buttons.push(`<button class="btn sm ghost" data-a="comments" data-id="${p.id}">💬 评论 (${Number(p.comment_count) || 0})</button>`);
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
        <div style="display:flex;gap:8px;flex-wrap:wrap">${buttons.join('')}</div>
        <div class="pc-comments" data-cid="${p.id}" style="display:none;margin-top:10px;border-top:1px dashed var(--line);padding-top:6px"></div>`;
      card.addEventListener('click', onPostAction);
      list.appendChild(card);
    });
    renderColAdminSection();
  }
  async function toggleInlineComments(postId, box) {
    if (box.style.display !== 'none') { box.style.display = 'none'; return; }
    box.style.display = 'block';
    loadInlineComments(postId, box);
  }
  async function loadInlineComments(postId, box) {
    box.innerHTML = '<div class="empty" style="padding:8px">加载评论…</div>';
    try {
      const cs = await callEdge('admin_post_comments', { post_id: postId });
      if (!cs.length) { box.innerHTML = '<div class="empty" style="padding:8px">暂无评论</div>'; return; }
      box.innerHTML = '';
      cs.forEach((c) => {
        const cc = document.createElement('div');
        cc.style.cssText = 'border-left:3px solid var(--line);padding:8px 10px;margin-top:8px;background:var(--card-soft);border-radius:8px';
        const state = c.blocked ? '<span class="badge" style="color:#fff;background:#e05e5e">已屏蔽</span>' : '<span class="badge topic">正常</span>';
        cc.innerHTML = `
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
            <strong style="font-size:13px">${escapeHtml(c.nickname || '匿名')}</strong>
            ${c.parent_id ? '<span style="color:var(--accent,#e07a5f);font-size:12px">（回复）</span>' : ''} ${state}
            <span style="margin-left:auto;color:var(--faint);font-size:12px">${formatTime(c.created_at)}</span>
          </div>
          <div style="font-size:13px;line-height:1.6;word-break:break-word;margin-bottom:8px">${escapeHtml(c.content)}</div>
          <div style="display:flex;gap:8px">
            <button class="btn sm ghost" data-cb="${c.id}" data-to="${c.blocked ? 'false' : 'true'}">${c.blocked ? '解除屏蔽' : '屏蔽'}</button>
            <button class="btn sm danger" data-cd="${c.id}">删除</button>
          </div>`;
        cc.querySelector('[data-cb]').addEventListener('click', async (b) => {
          b.currentTarget.disabled = true;
          try { await callEdge('comment_toggle_block', { id: c.id, blocked: b.currentTarget.dataset.to === 'true' }); loadInlineComments(postId, box); }
          catch (err) { alert(err.message); b.currentTarget.disabled = false; }
        });
        cc.querySelector('[data-cd]').addEventListener('click', async (b) => {
          if (!confirm('确定删除该评论？（不可恢复）')) return;
          b.currentTarget.disabled = true;
          try { await callEdge('comment_delete', { id: c.id }); loadInlineComments(postId, box); }
          catch (err) { alert(err.message); b.currentTarget.disabled = false; }
        });
        box.appendChild(cc);
      });
    } catch (e) { box.innerHTML = `<div class="empty" style="padding:8px">加载失败：${escapeHtml(e.message)}</div>`; }
  }
  async function onPostAction(e) {
    const btn = e.target.closest('button[data-a]');
    if (!btn) return;
    const { a, id, v } = btn.dataset;
    if (a === 'comments') {
      const card = btn.closest('.panel');
      toggleInlineComments(id, card.querySelector('.pc-comments'));
      return;
    }
    if (a === 'del' && !confirm('删除后该帖将进入回收站（可恢复），确定删除？')) return;
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

  // ---------- 专栏管理（并入帖子管理；can_column） ----------
  let colMgtStatus = '';
  function renderColAdminSection() {
    const box = $('columnMgmt');
    if (!box) return;
    if (!hasPerm('can_column')) { box.classList.add('hidden'); return; }
    box.classList.remove('hidden');
    loadColAdminMgmt();
  }
  async function loadColAdminMgmt() {
    const list = $('colAdminList');
    list.innerHTML = '<div class="empty">加载中…</div>';
    try {
      const rows = await callEdge('column_admin_list', { status: colMgtStatus });
      if (!rows.length) { list.innerHTML = '<div class="empty">暂无专栏记录</div>'; return; }
      const stMap = { pending: '待审核', open: '已开通', closed: '已关闭' };
      const stC = { pending: '#e0a030', open: '#3fae6b', closed: '#888' };
      const html = rows.map((c) => {
        const btns = [];
        btns.push(`<button class="btn sm ghost" data-ca="detail" data-id="${c.id}">管理内容</button>`);
        if (c.status === 'pending') {
          btns.push(`<button class="btn sm" data-ca="approve" data-id="${c.id}">开通</button>`);
          btns.push(`<button class="btn sm danger" data-ca="reject" data-id="${c.id}">驳回</button>`);
        } else if (c.status === 'open') {
          btns.push(`<button class="btn sm ghost" data-ca="close" data-id="${c.id}">关闭</button>`);
        } else {
          btns.push(`<button class="btn sm" data-ca="close" data-id="${c.id}">重新开通</button>`);
        }
        return `<div class="panel fade-in-up" style="padding:12px 14px;box-shadow:none;margin-bottom:10px">
          <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:6px">
            <strong style="font-size:14px">${escapeHtml(c.name)}</strong>
            <span class="badge" style="color:#fff;background:${stC[c.status] || '#888'}">${stMap[c.status] || c.status}</span>
            <span style="margin-left:auto;color:var(--faint);font-size:12px">${formatTime(c.created_at)}</span>
          </div>
          <div style="color:var(--muted);font-size:13px;margin-bottom:6px">创始人 <b>${escapeHtml(c.founder_name || '匿名')}</b> · Lv.${c.founder_level}
            ${c.contact ? ` · 联系 <span style="color:var(--text)">${escapeHtml(c.contact)}</span>` : ''}</div>
          ${c.intro ? `<div style="color:var(--text);font-size:13px;line-height:1.6;white-space:pre-wrap;border-left:3px solid var(--line);padding-left:10px;margin-bottom:8px">${escapeHtml(truncate(c.intro, 200))}</div>` : ''}
          <div style="font-size:12px;color:var(--faint);margin-bottom:8px">${Number(c.post_count) || 0} 帖 · ${Number(c.comment_count) || 0} 评论</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">${btns.join('')}</div>
          <div class="col-inline-detail" data-colid="${c.id}" style="display:none;margin-top:10px"></div>
        </div>`;
      }).join('');
      list.innerHTML = html;
      document.querySelectorAll('#colAdminList [data-ca]').forEach((b) => {
        b.addEventListener('click', colAdminAction);
      });
    } catch (e) { list.innerHTML = `<div class="empty">加载失败：${escapeHtml(e.message)}</div>`; }
  }
  async function colAdminAction(e) {
    const btn = e.target.closest('button[data-ca]');
    if (!btn) return;
    const { ca, id } = btn.dataset;
    if (ca === 'detail') {
      const box = document.querySelector(`#colAdminList .col-inline-detail[data-colid="${id}"]`);
      if (!box) return;
      if (box.style.display !== 'none') { box.style.display = 'none'; return; }
      box.style.display = 'block';
      loadColDetailPosts(id, box);
      return;
    }
    if (ca === 'reject' && !confirm('确定驳回该专栏申请？该申请将被删除。')) return;
    if (ca === 'close' && !confirm('确定切换该专栏的开通状态？（帖子将由创始人运营）')) return;
    btn.disabled = true;
    try {
      if (ca === 'approve') await callEdge('column_approve', { column_id: id });
      else if (ca === 'reject') await callEdge('column_reject', { column_id: id });
      else if (ca === 'close') await callEdge('column_close', { column_id: id });
      loadColAdminMgmt();
    } catch (err) { alert(err.message); btn.disabled = false; }
  }
  async function loadColDetailPosts(colId, box) {
    box.innerHTML = '<div class="empty" style="padding:8px">加载帖子…</div>';
    try {
      const posts = await callEdge('col_feed', { column_id: colId, page: 1, page_size: 50 });
      if (!posts.length) { box.innerHTML = '<div class="empty" style="padding:8px">暂无帖子</div>'; return; }
      box.innerHTML = '<div style="font-size:12px;color:var(--faint);margin-bottom:8px">本专栏帖子（置顶在前）：</div>' +
        posts.map((p) => `
        <div style="border:1px solid var(--line);border-radius:10px;padding:10px 12px;margin-bottom:8px;background:var(--card-soft)">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <strong style="font-size:13px">${escapeHtml(p.nickname || '匿名')}</strong>
            ${p.pinned ? '<span class="badge pinned">置顶</span>' : ''}
            <span style="margin-left:auto;color:var(--faint);font-size:12px">${formatTime(p.created_at)} · 👍 ${Number(p.like_count) || 0}</span>
          </div>
          <div style="font-size:13px;line-height:1.6;color:var(--text);white-space:pre-wrap;margin:6px 0 8px">${escapeHtml(truncate(p.content, 140))}</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn sm ghost" data-cpin="${p.id}" data-v="${p.pinned ? 'false' : 'true'}">${p.pinned ? '取消置顶' : '置顶'}</button>
            <button class="btn sm ghost" data-cima="show" data-post="${p.id}" data-title="评论">💬 评论 (${Number(p.comment_count) || 0})</button>
            <button class="btn sm danger" data-cdel="${p.id}">删除帖子</button>
          </div>
          <div class="col-comments-inline" data-post="${p.id}" style="display:none;margin-top:8px"></div>
        </div>`).join('');
      box.querySelectorAll('[data-cpin]').forEach((b) => b.addEventListener('click', async () => {
        b.disabled = true;
        try { await callEdge('col_post_pin', { post_id: b.dataset.cpin, pinned: b.dataset.v === 'true' }); loadColDetailPosts(colId, box); }
        catch (err) { alert(err.message); b.disabled = false; }
      }));
      box.querySelectorAll('[data-cdel]').forEach((b) => b.addEventListener('click', async () => {
        if (!confirm('删除该专栏帖及其评论（软删，计入回退经验）？')) return;
        b.disabled = true;
        try { await callEdge('col_post_delete', { post_id: b.dataset.cdel }); loadColDetailPosts(colId, box); }
        catch (err) { alert(err.message); b.disabled = false; }
      }));
      box.querySelectorAll('[data-cima="show"]').forEach((b) => {
        b.addEventListener('click', async () => {
          const cbox = box.querySelector(`.col-comments-inline[data-post="${b.dataset.post}"]`);
          if (!cbox) return;
          if (cbox.style.display !== 'none') { cbox.style.display = 'none'; return; }
          cbox.style.display = 'block';
          cbox.innerHTML = '<div class="empty" style="padding:8px">加载评论…</div>';
          try {
            const cs = await callEdge('col_comment_list', { post_id: b.dataset.post });
            if (!cs.length) { cbox.innerHTML = '<div class="empty" style="padding:8px">暂无评论</div>'; return; }
            cbox.innerHTML = '';
            cs.forEach((c) => {
              const cc = document.createElement('div');
              cc.style.cssText = 'border-top:1px dashed var(--line);padding:6px 0';
              cc.innerHTML = `<div style="font-size:12px;color:var(--muted)">${escapeHtml(c.nickname || '匿名')} ${c.parent_id ? '<span style="color:var(--accent,#e07a5f)">（回复）</span>' : ''} · ${formatTime(c.created_at)}</div>
                <div style="font-size:13px;color:var(--text);margin:2px 0 4px">${escapeHtml(c.content)}</div>
                <button class="btn sm danger" data-cdelc="${c.id}">删除评论</button>`;
              cc.querySelector('[data-cdelc]').addEventListener('click', async (ccb) => { ccb.disabled = true; try { await callEdge('col_comment_delete', { comment_id: c.id }); b.click(); } catch (err) { alert(err.message); ccb.disabled = false; } });
              cbox.appendChild(cc);
            });
          } catch (err) { cbox.innerHTML = `<div class="empty" style="padding:8px">加载失败：${escapeHtml(err.message)}</div>`; }
        });
      });
    } catch (e) { box.innerHTML = `<div class="empty" style="padding:8px">加载失败：${escapeHtml(e.message)}</div>`; }
  }
  $('colStatusFilter').addEventListener('change', () => { colMgtStatus = $('colStatusFilter').value; loadColAdminMgmt(); });
  $('colMgmtRefresh').addEventListener('click', loadColAdminMgmt);

  // ---------- 回收站 ----------
  async function loadTrash() {
    const list = $('trashList');
    list.innerHTML = '<div class="empty">加载中…</div>';
    try {
      const data = await callEdge('trash_list');
      if (!data.length) { list.innerHTML = '<div class="empty">回收站为空 ✅</div>'; return; }
      list.innerHTML = '';
      data.forEach((t) => {
        const c = document.createElement('div');
        c.className = 'panel fade-in-up';
        c.style.padding = '12px 14px';
        c.style.boxShadow = 'none';
        c.style.marginBottom = '10px';
        c.innerHTML = `
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:6px">
            <strong style="font-size:13px">被删除帖子</strong>
            <span class="badge">${escapeHtml(t.deleted_by || '管理员')}</span>
            ${t.reason ? `<span style="color:var(--faint);font-size:12px">${escapeHtml(t.reason)}</span>` : ''}
            <span style="margin-left:auto;color:var(--faint);font-size:12px">${formatTime(t.created_at)}</span>
          </div>
          <div style="color:var(--faint);font-size:12px;margin-bottom:10px">${t.expires_at ? `将于 ${formatTime(t.expires_at)} 自动清理` : ''} · ${t.original_id ? '原始 id: ' + escapeHtml(t.original_id) : ''}</div>
          <div style="display:flex;gap:8px">
            <button class="btn sm" data-tr="restore" data-id="${t.id}">恢复帖子</button>
            <button class="btn sm danger" data-tr="purge" data-id="${t.id}">彻底删除</button>
          </div>`;
        c.querySelectorAll('[data-tr]').forEach((b) => {
          b.addEventListener('click', async () => {
            const act = b.dataset.tr;
            if (act === 'purge' && !confirm('彻底删除后无法恢复，确定？')) return;
            if (act === 'restore' && !confirm('恢复将把帖子和评论还原为未屏蔽状态，确定？')) return;
            b.disabled = true;
            try { await callEdge(act === 'restore' ? 'trash_restore' : 'trash_purge', { id: t.id }); loadTrash(); }
            catch (err) { alert(err.message); b.disabled = false; }
          });
        });
        list.appendChild(c);
      });
    } catch (e) { list.innerHTML = `<div class="empty">加载失败：${escapeHtml(e.message)}</div>`; }
  }
  $('trashRefresh').addEventListener('click', loadTrash);
  $('trashPurgeAll').addEventListener('click', async () => {
    if (!confirm('确定清空全部回收站？（每条立即彻底删除，无法恢复）')) return;
    try {
      const data = await callEdge('trash_list');
      for (const t of data) await callEdge('trash_purge', { id: t.id });
      loadTrash();
    } catch (e) { alert(e.message); }
  });

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

  // ---------- 公告栏管理（can_notice） ----------
  let announceEditingId = null;
  function announceResetForm() {
    announceEditingId = null;
    $('annTitle').value = '';
    $('annContent').value = '';
    $('annSort').value = '0';
    $('annFormTitle').textContent = '新建公告';
    $('annCreate').textContent = '发布公告';
    $('annCreate').classList.remove('ghost');
    $('annCancel').classList.add('hidden');
  }
  function announceStartEdit(a) {
    announceEditingId = a.id;
    $('annTitle').value = a.title;
    $('annContent').value = a.content;
    $('annSort').value = a.sort_order || 0;
    $('annFormTitle').textContent = '编辑公告';
    $('annCreate').textContent = '保存修改';
    $('annCreate').classList.add('ghost');
    $('annCancel').classList.remove('hidden');
    $('annFormTitle').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  async function loadAnnounces() {
    const data = await callEdge('announce_list');
    const list = $('announceList');
    list.innerHTML = '';
    if (!data.length) { list.innerHTML = '<div class="empty">暂无公告，请先发布一条。</div>'; return; }
    data.forEach((a) => {
      const card = document.createElement('div');
      card.className = 'panel fade-in-up';
      card.style.padding = '14px 16px';
      card.style.boxShadow = 'none';
      card.style.marginBottom = '10px';
      card.innerHTML = `
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;flex-wrap:wrap">
          <span class="badge topic">${escapeHtml(a.created_by || '')}</span>
          <strong>${escapeHtml(a.title)}</strong>
          ${a.enabled ? '<span class="badge topic">已启用</span>' : '<span class="badge" style="color:#fff;background:var(--faint)">已停用</span>'}
          <span style="font-size:12px;color:var(--faint)">排序 ${a.sort_order || 0}</span>
          <button class="btn sm ghost" data-edit="${a.id}">编辑</button>
          <button class="btn sm ghost" data-toggle="${a.id}" data-en="${a.enabled ? 'false' : 'true'}">${a.enabled ? '停用' : '启用'}</button>
          <button class="btn sm danger" data-del="${a.id}">删除</button>
        </div>
        <div style="color:var(--muted);font-size:13px;white-space:pre-wrap">${escapeHtml(a.content)}</div>`;
      card.querySelector('[data-del]').addEventListener('click', async (b) => {
        if (!confirm('删除该公告？')) return;
        b.currentTarget.disabled = true;
        try { await callEdge('announce_delete', { id: a.id }); if (announceEditingId === a.id) announceResetForm(); loadAnnounces(); }
        catch (err) { alert(err.message); }
      });
      card.querySelector('[data-toggle]').addEventListener('click', async (b) => {
        b.currentTarget.disabled = true;
        try { await callEdge('announce_toggle', { id: a.id, enabled: b.currentTarget.dataset.en === 'true' }); loadAnnounces(); }
        catch (err) { alert(err.message); }
      });
      card.querySelector('[data-edit]').addEventListener('click', () => announceStartEdit(a));
      list.appendChild(card);
    });
  }
  $('annCreate').addEventListener('click', async () => {
    const title = $('annTitle').value.trim();
    const content = $('annContent').value.trim();
    const sort_order = parseInt($('annSort').value, 10) || 0;
    if (!title || !content) { alert('请填写标题和内容'); return; }
    $('annCreate').disabled = true;
    try {
      if (announceEditingId) await callEdge('announce_update', { id: announceEditingId, title, content, sort_order });
      else await callEdge('announce_create', { title, content, sort_order, enabled: true });
      announceResetForm();
      loadAnnounces();
    } catch (err) { alert(err.message); }
    $('annCreate').disabled = false;
  });
  $('annCancel').addEventListener('click', announceResetForm);

  // ---------- Bug 反馈管理（can_bug） ----------
  const BUG_LABEL = {
    '发帖/收藏/点赞/浏览历史bug': '发帖/收藏/点赞/浏览历史',
    '关键词误屏蔽': '关键词误屏蔽', '使用bug': '使用 bug', '其他': '其他'
  };
  const BUG_STATUS = { new: '待处理', replied: '已回复', resolved: '已解决' };
  async function loadBugs() {
    const data = await callEdge('bug_feedback_list');
    const list = $('bugList');
    list.innerHTML = '';
    if (!data.length) { list.innerHTML = '<div class="empty">暂无用户反馈 ✅</div>'; return; }
    data.forEach((b) => {
      const card = document.createElement('div');
      card.className = 'panel fade-in-up';
      card.style.padding = '14px 16px';
      card.style.boxShadow = 'none';
      card.style.marginBottom = '10px';
      card.innerHTML = `
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;flex-wrap:wrap">
          <span class="badge topic">${escapeHtml(BUG_LABEL[b.category] || b.category)}</span>
          <span class="badge" style="background:${b.status === 'resolved' ? '#2e8b57' : (b.status === 'replied' ? 'var(--warn)' : 'var(--danger)')};">${BUG_STATUS[b.status] || b.status}</span>
          <span style="font-size:12px;color:var(--faint)">${escapeHtml(b.user_name)} · ${escapeHtml(b.created_at || '').slice(0, 16).replace('T', ' ')}</span>
        </div>
        <div style="color:var(--text);font-size:13px;white-space:pre-wrap;margin-bottom:8px;border-left:3px solid var(--line);padding-left:10px">${escapeHtml(b.content)}</div>
        ${b.admin_reply ? `<div style="background:var(--card-soft);border:1px dashed var(--line);border-radius:8px;padding:8px 10px;margin-bottom:8px;font-size:13px;color:var(--accent,#e07a5f)">管理员（${escapeHtml(b.replied_by || '')}）：${escapeHtml(b.admin_reply)}</div>` : ''}
        <div style="display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap">
          <textarea data-replybox class="input" rows="2" maxlength="2000" placeholder="留言给用户…" style="flex:1;min-width:220px;resize:vertical">${escapeHtml(b.admin_reply)}</textarea>
          <button class="btn sm" data-reply="${b.id}">保存并回复</button>
          <button class="btn sm ghost" data-status="${b.id}" data-s="${b.status === 'resolved' ? 'new' : 'resolved'}">${b.status === 'resolved' ? '重新打开' : '标记已解决'}</button>
          <button class="btn sm danger" data-del="${b.id}">删除</button>
        </div>`;
      card.querySelector('[data-reply]').addEventListener('click', async (el) => {
        const box = card.querySelector('[data-replybox]');
        const reply = box.value.trim();
        if (!reply) { alert('请先填写回复内容'); return; }
        el.currentTarget.disabled = true;
        try { await callEdge('bug_feedback_reply', { id: b.id, reply }); loadBugs(); }
        catch (err) { alert(err.message); }
      });
      card.querySelector('[data-status]').addEventListener('click', async (el) => {
        el.currentTarget.disabled = true;
        try { await callEdge('bug_feedback_status', { id: b.id, status: el.currentTarget.dataset.s }); loadBugs(); }
        catch (err) { alert(err.message); }
      });
      card.querySelector('[data-del]').addEventListener('click', async (el) => {
        if (!confirm('删除该反馈？')) return;
        el.currentTarget.disabled = true;
        try { await callEdge('bug_feedback_delete', { id: b.id }); loadBugs(); }
        catch (err) { alert(err.message); }
      });
      list.appendChild(card);
    });
  }
  $('bugRefresh').addEventListener('click', loadBugs);

  // ---------- 自定义话题管理（can_topic） ----------
  async function loadTopicsAdmin() {
    const list = $('topicList');
    list.innerHTML = '<div class="empty">加载中…</div>';
    let data;
    try { data = await callEdge('topic_admin_list'); }
    catch (e) { list.innerHTML = `<div class="empty">加载失败：${escapeHtml(e.message)}</div>`; return; }
    if (!data.length) { list.innerHTML = '<div class="empty">暂无自定义话题</div>'; return; }
    list.innerHTML = '';
    data.forEach((t) => {
      const c = document.createElement('div');
      c.className = 'panel fade-in-up';
      c.style.padding = '10px 14px'; c.style.boxShadow = 'none'; c.style.marginBottom = '8px';
      c.innerHTML = `
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:4px">
          <span class="badge topic">${escapeHtml(t.display_name)}</span>
          ${t.is_permanent ? '<span class="badge" style="color:#fff;background:#2e8b57">永久</span>' : ''}
          <span style="font-size:13px;color:var(--muted)">${t.post_count} 帖</span>
          <span style="font-size:12px;color:var(--faint)">创建者：${escapeHtml(t.created_by)}</span>
          ${t.is_permanent ? '' : `<span style="font-size:12px;color:var(--faint)">到期：${formatTime(t.expires_at)}</span>`}
          <button class="btn sm danger" data-del="${t.id}" style="margin-left:auto">删除</button>
        </div>
        <div style="font-size:12px;color:var(--faint)">删除后，该话题下的全部帖子（含顶置）及其附属评论将一并转入「闲聊」话题。</div>`;
      list.appendChild(c);
      c.querySelector('[data-del]').addEventListener('click', async (el) => {
        if (!confirm(`确认删除「${t.display_name}」话题？\n该话题下所有帖子 + 评论将转入「闲聊」。即使已是永久话题也会被删除。`)) return;
        el.currentTarget.disabled = true;
        try { await callEdge('topic_delete', { topic_id: t.id }); loadTopicsAdmin(); }
        catch (err) { alert(err.message); el.currentTarget.disabled = false; }
      });
    });
  }
  $('topicRefresh').addEventListener('click', loadTopicsAdmin);

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
        ['can_block', '屏蔽/删除'], ['can_review', '吃瓜审核'], ['can_pin', '顶置'], ['can_popup', '弹窗'],
        ['can_report', '举报管理'], ['can_view_audit', '审计查看'], ['can_blacklist', '黑名单管理'],
      ['can_notice', '公告管理'], ['can_bug', 'Bug回复'], ['can_topic', '话题管理'],
        ['can_ban', '用户封禁'], ['can_user_mgmt', '用户统一管理'], ['can_column', '专栏管理']
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