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

  // 标签定义（含权限位）；供 renderTabs 与权限同步刷新共用
  const TAB_DEFS = [
    { key: 'dashboard', label: '看板' },
    { key: 'posts', label: '帖子管理' },
    { key: 'review', label: '吃瓜审核', perm: 'can_review' },
    { key: 'reports', label: '举报', perm: 'can_report' },
    { key: 'trash', label: '回收站', perm: 'can_delete' },
    { key: 'pinned', label: '顶置管理', perm: 'can_pin' },
    { key: 'audit', label: '审计日志', perm: 'can_view_audit' },
    { key: 'blacklist', label: '黑名单', perm: 'can_blacklist' },
    { key: 'userMgmt', label: '用户统一管理', perm: 'can_user_mgmt' },
    { key: 'digests', label: '精华聚合', perm: 'can_digest' },
    { key: 'popups', label: '弹窗公告', perm: 'can_popup' },
    { key: 'announces', label: '公告栏', perm: 'can_notice' },
    { key: 'bugs', label: 'Bug反馈', perm: 'can_bug' },
    { key: 'topics', label: '自定义话题', perm: 'can_topic' },
    { key: 'mentor', label: '🎓 学长认证', perm: 'can_mentor' },
    { key: 'invite', label: '🔑 邀请码', perm: 'can_invite' },
    { key: 'udellog', label: '用户删除日志', perm: 'can_del_log' },
    { key: 'archive', label: '留档日志', perm: 'can_archive' },
    { key: 'deviceban', label: '设备封禁', perm: 'can_deviceban' }
  ];
  const FOUNDER_ONLY_TABS = ['admins', 'resetPwd', 'site', 'legends'];

  // ---------- 工具 ----------
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function formatTime(iso) {
    if (window.ClubTime) { const s = window.ClubTime.str(iso); if (s) return s; }
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
    if (!res.ok || data.ok === false) {
      const msg = data.error || ('请求失败 ' + res.status);
      if (/登录已过期|会话已过期|令牌已失效|请先登录/.test(msg) && token) sessionExpired();
      throw new Error(msg);
    }
    return data.data;
  }
  // 会话失效：清空凭据并退回登录屏（用于管理员每 N 分钟重新登录）
  function sessionExpired() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PROFILE_KEY);
    token = null; profile = null;
    $('loginError').textContent = '登录已过期，请重新登录。';
    $('loginScreen').classList.remove('hidden');
    $('dashboard').classList.add('hidden');
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
  // 当前标签在该权限下是否仍可用（供权限变化后判断是否需要跳走）
  function tabAllowed(key) {
    if (profile?.isFounder) return true;
    if (FOUNDER_ONLY_TABS.indexOf(key) >= 0) return false;
    const t = TAB_DEFS.find((x) => x.key === key);
    if (!t) return false;
    if (t.perm) return hasPerm(t.perm);
    if (t.requiresAny) return t.requiresAny.some((p) => hasPerm(p));
    return true;
  }
  // 定期同步后端最新权限：创始人删权限/停用账号后，本端界面无需重登立即生效
  let permSyncTimer = null;
  async function refreshAdminPerms() {
    if (!token) return;
    try {
      const p = await callEdge('whoami', {});
      if (!p) return;
      const wasFounder = !!profile?.isFounder;
      const oldPerms = wasFounder ? null : JSON.stringify(profile?.perms || {});
      profile = { ...(profile || {}), ...p };
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      const newFounder = !!profile?.isFounder;
      const newPerms = newFounder ? null : JSON.stringify(profile?.perms || {});
      const changed = newFounder !== wasFounder || (newPerms !== oldPerms);
      if (changed) {
        renderWhoami(); renderTabs();
        if (activeTab && !tabAllowed(activeTab)) {
          const fb = TAB_DEFS.find((t) => tabAllowed(t.key));
          enterTab(fb ? fb.key : 'dashboard');
        }
      }
    } catch (e) {
      const msg = String((e && e.message) || '');
      if (/账号已停用|未通过审核|登录已过期|请先登录/.test(msg)) sessionExpired();
      // 其余错误（网络抖动/限流等）静默忽略，等待下次同步
    }
  }
  function startPermSync() {
    if (permSyncTimer) return;
    refreshAdminPerms();
    permSyncTimer = setInterval(refreshAdminPerms, 5000);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) refreshAdminPerms();
    });
    window.addEventListener('focus', refreshAdminPerms);
  }

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
    const all = TAB_DEFS.slice();
    if (profile?.isFounder) {
      all.push({ key: 'admins', label: '管理员' }, { key: 'resetPwd', label: '重置密码' }, { key: 'site', label: '站点开关' }, { key: 'legends', label: '🏯 校史编号' });
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
    _enterTabGuarded(key);
  }
  // 点击标签切换：先实时读一次最新权限，无权限则退回首个可用页面
  async function _enterTabGuarded(key) {
    if (token) await refreshAdminPerms();
    if (!token || !tabAllowed(key)) {
      if (!token) return; // 已登出：登录屏已显示
      alert(`你已被收回「${tabTitle(key)}」的访问权限`);
      const fb = TAB_DEFS.find((t) => tabAllowed(t.key));
      enterTab(fb ? fb.key : 'dashboard');
      return;
    }
    enterTab(key);
  }
  function tabTitle(key) {
    const t = TAB_DEFS.find((x) => x.key === key);
    return t ? t.label : key;
  }
  function enterTab(key) {
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
    if (key === 'digests') loadDigests();
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
    if (key === 'resetPwd') loadResetPwd();
    if (key === 'legends') loadLegends();
    if (key === 'mentor') loadMentorAdmin();
    if (key === 'invite') loadInvites();
    if (key === 'udellog') loadUdelLog();
    if (key === 'archive') loadArchive();
    if (key === 'deviceban') loadDeviceBan();
  }

  // ---------- 邀请码管理（can_invite） ----------
  let inviteBound = false;
  async function loadInvites() {
    const statusHint = $('inviteStatusHint');
    const toggleRow = $('inviteToggleRow');
    const panelOpen = $('invitePanelOpen');
    const panelOff = $('invitePanelOff');
    const toggleCb = $('founderInviteOn');
    if (!statusHint) return;

    let inviteOn = false;
    try { const d = await callEdge('invite_status', {}); inviteOn = !!(d && d.invite_on); } catch (_e) {}

    // 创始人专享的开关注
    if (toggleRow && profile?.isFounder) {
      toggleRow.style.display = 'block';
      if (toggleCb) toggleCb.checked = inviteOn;
    } else if (toggleRow) {
      toggleRow.style.display = 'none';
    }
    if (statusHint) statusHint.textContent = inviteOn
      ? '✅ 当前已开启邀请码注册：新账号注册须凭未使用的邀请码。'
      : '⏸️ 当前未开启邀请码注册：所有人可免邀请码注册。';

    if (!inviteBound) {
      inviteBound = true;
      if (toggleCb) toggleCb.addEventListener('change', async () => {
        toggleCb.disabled = true;
        try {
          await callEdge('founder_set_invite', { invite_on: toggleCb.checked });
          loadInvites();
        } catch (err) { alert(err.message); toggleCb.checked = !toggleCb.checked; }
        toggleCb.disabled = false;
      });
      const createBtn = $('inviteCreateBtn');
      if (createBtn) createBtn.addEventListener('click', async () => {
        const n = Math.max(1, Math.min(100, parseInt(String($('inviteCount').value || '1'), 10) || 1));
        createBtn.disabled = true;
        try {
          const d = await callEdge('admin_invite_create', { count: n });
          pushClipboard(((d && d.codes) || []).join('\n'), `已生成 ${n} 个邀请码`);
          loadInvites();
        } catch (err) { alert(err.message); }
        createBtn.disabled = false;
      });
      const copyAll = $('inviteCopyAllBtn');
      if (copyAll) copyAll.addEventListener('click', async () => {
        try { const d = await callEdge('admin_invite_list', {}); }
        catch (_e) {}
        const listEl = $('inviteList');
        const codes = Array.from(listEl ? listEl.querySelectorAll('[data-copycode]') : [])
          .map((el) => el.textContent).filter(Boolean);
        if (codes.length) pushClipboard(codes.join('\n'), `已复制全部 ${codes.length} 个未使用邀请码`);
        else alert('当前没有可复制的未使用邀请码');
      });
    }

    if (inviteOn) {
      if (panelOpen) panelOpen.classList.remove('hidden');
      if (panelOff) panelOff.classList.add('hidden');
      await renderInviteList();
    } else {
      if (panelOpen) panelOpen.classList.add('hidden');
      if (panelOff) panelOff.classList.remove('hidden');
    }
  }

  async function renderInviteList() {
    const box = $('inviteList');
    const summary = $('inviteSummary');
    if (!box) return;
    box.innerHTML = '<div class="empty" style="padding:12px">加载中…</div>';
    let rows = [];
    try { const d = await callEdge('admin_invite_list', {}); rows = d || []; } catch (err) { box.innerHTML = '<div class="empty" style="padding:12px">加载失败：' + escapeHtml(err.message) + '</div>'; return; }
    const used = rows.filter((r) => r.used_at || r.used_by).length;
    if (summary) summary.textContent = `共 ${rows.length} 条 · 未使用 ${rows.length - used} · 已使用 ${used}`;
    if (!rows.length) { box.innerHTML = '<div class="empty" style="padding:12px">暂无邀请码，请先点击「生成邀请码」。</div>'; return; }
    box.innerHTML = rows.map((r) => {
      const usedFlag = r.used_at || r.used_by;
      return `<div style="display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:9px 12px;border:1px solid var(--line);border-radius:10px">
        <code style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:14px;letter-spacing:1px;color:${usedFlag ? 'var(--faint,#777)' : 'var(--accent,#e07a5f)'}">${escapeHtml(r.code)}</code>
        <span style="font-size:12px;color:var(--muted)">👤 ${escapeHtml(r.created_by_name || '未知管理员')}</span>
        ${usedFlag
          ? `<span class="badge" style="color:#fff;background:#2e8b57">已使用 · 用户 ${escapeHtml(r.used_username || '?')} · ${formatTime(r.used_at)}</span>`
          : `<span class="badge" style="color:var(--text);background:rgba(232,142,74,.15)">未使用</span>
             <button class="btn sm ghost" data-copycode="${escapeHtml(r.code)}" style="margin-left:auto">📋 复制</button>
             <span class="badge" style="color:var(--faint)">${r.created_at ? '创建于 ' + formatTime(r.created_at) : ''}</span>`}
      </div>`;
    }).join('');
    box.querySelectorAll('[data-copycode]').forEach((b) => b.addEventListener('click', () => pushClipboard(b.dataset.copycode, '已复制邀请码 ' + b.dataset.copycode)));
  }

  function pushClipboard(text, msg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => alert(msg)).catch(() => alert(msg + '\n' + text));
    } else { alert(msg + '\n' + text); }
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
            ${hasPerm('can_ban') ? `<button class="btn sm danger ghost" data-ban7="${report.id}">⛔ 快捷封号7天</button>` : ''}
          </div>`;
        card.querySelectorAll('[data-ban7]').forEach((b) => {
          b.addEventListener('click', async () => {
            if (!confirm('确定对本次被举报内容的作者封号 7 天吗？封禁期间其无法发帖、点赞、评论或创建话题。')) return;
            b.disabled = true;
            try { await callEdge('report_ban_user', { report_id: b.dataset.ban7 }); loadReports(); refreshQueueBadges(); }
            catch (err) { alert(err.message); b.disabled = false; }
          });
        });
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
        c.innerHTML = `<span style="color:var(--accent,#e07a5f);font-weight:600">${escapeHtml(a.admin_name || '未知')}</span>
          <span style="margin:0 8px;color:var(--muted)">${escapeHtml(a.action)}</span>
          <span style="color:var(--faint)">${escapeHtml(a.detail)}</span>
          <span style="float:right;color:var(--faint);font-size:12px">${formatTime(a.created_at)}</span>
          ${a.target_type ? `<div style="margin-top:6px"><button class="btn sm ghost" data-src="${a.id}" data-type="${escapeHtml(a.target_type)}">查看${a.target_type === 'comment' ? '评论' : '帖子'}原文</button></div>` : ''}
          <div style="margin-top:6px"><button class="btn sm ghost" data-archaudit="${a.id}">📌 加入留档</button></div>`;
        c.querySelector('[data-src]')?.addEventListener('click', (b) => showAuditSource(a.id));
        c.querySelector('[data-archaudit]')?.addEventListener('click', async () => {
          const intro = prompt('加入留档（可填简介/重要说明，留空则无）：', '');
          if (intro === null) return;
          try { await callEdge('audit_archive', { id: a.id, intro }); alert('✅ 已加入留档日志（永久保存）'); }
          catch (err) { alert(err.message); }
        });
        list.appendChild(c);
      });
    } catch (e) { list.innerHTML = `<div class="empty">加载失败：${escapeHtml(e.message)}</div>`; }
  }
  $('auditRefresh').addEventListener('click', loadAudit);

  // ---------- 用户删除日志（can_del_log：查看/彻底删除；留档对全部管理员开放） ----------
  async function loadUdelLog() {
    const list = $('udelList');
    if (!list) return;
    list.innerHTML = '<div class="empty">加载中…</div>';
    const payload = {
      q: $('udelQ')?.value.trim() || '',
      from: $('udelFrom')?.value ? new Date($('udelFrom').value + 'T00:00:00+08:00').toISOString() : '',
      to: $('udelTo')?.value ? new Date($('udelTo').value + 'T23:59:59+08:00').toISOString() : ''
    };
    try {
      const data = await callEdge('udel_log_list', payload);
      if (!data.length) { list.innerHTML = '<div class="empty">暂无用户删除日志</div>'; return; }
      list.innerHTML = '';
      data.forEach((d) => {
        const c = document.createElement('div');
        c.className = 'panel fade-in-up';
        c.style.padding = '12px 14px'; c.style.boxShadow = 'none'; c.style.marginBottom = '10px';
        c.innerHTML = `
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:6px">
            <strong style="font-size:13px">${escapeHtml(d.nickname || '匿名')}</strong>
            <span class="badge topic">${escapeHtml(d.topic || '闲聊')}</span>
            <span style="color:var(--faint);font-size:12px">发布 ${formatTime(d.created_at)}</span>
            <span style="color:var(--danger,#e05e5e);font-size:12px">删除 ${formatTime(d.deleted_at)}</span>
          </div>
          <div style="background:var(--card-soft,#eee);border:1px solid var(--line);border-radius:10px;padding:9px 12px;margin-bottom:8px">
            <div style="font-size:13px;color:var(--text);white-space:pre-wrap;word-break:break-word">${escapeHtml(d.content)}${d.content.length >= 200 ? '…' : ''}</div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn sm ghost" data-udel="archive" data-id="${d.id}">📌 加入留档</button>
            <button class="btn sm danger" data-udel="purge" data-id="${d.id}">彻底删除</button>
          </div>`;
        c.querySelectorAll('[data-udel]').forEach((b) => {
          b.addEventListener('click', async () => {
            const act = b.dataset.udel;
            if (act === 'archive') {
              const intro = prompt('加入留档（可填简介/重要说明，留空则无）：', '');
              if (intro === null) return;
              try { await callEdge('udel_log_archive', { id: d.id, intro }); alert('✅ 已加入留档日志（永久保存）'); loadUdelLog(); }
              catch (err) { alert(err.message); }
              return;
            }
            if (!confirm('彻底删除该条删除日志记录（仅移除日志，原帖已由用户自行删除，无法恢复），确定？')) return;
            b.disabled = true;
            try { await callEdge('udel_log_purge', { id: d.id }); loadUdelLog(); }
            catch (err) { alert(err.message); b.disabled = false; }
          });
        });
        list.appendChild(c);
      });
    } catch (e) { list.innerHTML = `<div class="empty">加载失败：${escapeHtml(e.message)}</div>`; }
  }
  $('udelRefresh')?.addEventListener('click', loadUdelLog);
  $('udelSearch')?.addEventListener('click', loadUdelLog);
  $('udelQ')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') loadUdelLog(); });

  // ---------- 留档日志（can_archive：查看/删除；全管理员可新增） ----------
  const ARCH_SRC = { trash: '回收站', user_del: '用户删除日志', audit: '审计日志', manual: '手动新增' };
  async function loadArchive() {
    const list = $('archList');
    if (!list) return;
    if (!hasPerm('can_archive')) {
      list.innerHTML = '<div class="empty">🔒 你没有「留档日志」查看权限。仅可将回收站/用户删除日志/审计日志内容或手动新增留档，无法浏览、查看或删除。</div>';
      const fbar = $('archFilterBar'); if (fbar) fbar.style.display = 'none';
      const hint = $('archHint'); if (hint) hint.style.display = 'none';
      return;
    }
    list.innerHTML = '<div class="empty">加载中…</div>';
    const payload = {
      q: $('archQ')?.value.trim() || '',
      source: $('archSource')?.value || '',
      from: '', to: ''
    };
    try {
      const data = await callEdge('archive_list', payload);
      if (!data.length) { list.innerHTML = '<div class="empty">暂无留档记录</div>'; return; }
      list.innerHTML = '';
      data.forEach((r) => {
        const c = document.createElement('div');
        c.className = 'panel fade-in-up';
        c.style.padding = '12px 14px'; c.style.boxShadow = 'none'; c.style.marginBottom = '10px';
        const srcTag = `<span class="badge">${escapeHtml(ARCH_SRC[r.source] || r.source || '留档')}</span>`;
        c.innerHTML = `
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:6px">
            <strong style="font-size:13px">${escapeHtml(r.title || '（无标题）')}</strong> ${srcTag}
            <span style="color:var(--faint);font-size:12px">留档 ${formatTime(r.created_at)} · 归档人 ${escapeHtml(r.archived_by || '—')}</span>
          </div>
          ${r.intro ? `<div style="color:var(--accent,#e07a5f);font-size:12px;margin-bottom:4px">📝 ${escapeHtml(r.intro)}</div>` : ''}
          <div style="font-size:12px;color:var(--muted);margin-bottom:6px;line-height:1.6">
            ${r.author_name ? `作者 ${escapeHtml(r.author_name)} · ` : ''}
            ${r.actor_name ? `删除/操作人 ${escapeHtml(r.actor_name)} · ` : ''}
            ${r.post_time ? `发帖 ${formatTime(r.post_time)} · ` : ''}
            ${r.del_time ? `删除/屏蔽 ${formatTime(r.del_time)}` : ''}
          </div>
          <div style="background:var(--card-soft,#eee);border:1px solid var(--line);border-radius:10px;padding:9px 12px;margin-bottom:8px">
            <div style="font-size:13px;color:var(--text);white-space:pre-wrap;word-break:break-word;max-height:120px;overflow:auto">${escapeHtml(r.body || '（无正文）')}</div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn sm ghost" data-arch="view" data-id="${r.id}">查看全文</button>
            <button class="btn sm danger" data-arch="del" data-id="${r.id}">删除留档</button>
          </div>`;
        c.querySelectorAll('[data-arch]').forEach((b) => {
          b.addEventListener('click', async () => {
            const act = b.dataset.arch;
            if (act === 'view') { openArchive(r.id); return; }
            if (!confirm(`确认删除这条留档记录「${r.title || '（无标题）'}」？删除后不可恢复。`)) return;
            b.disabled = true;
            try { await callEdge('archive_delete', { id: r.id }); loadArchive(); }
            catch (err) { alert(err.message); b.disabled = false; }
          });
        });
        list.appendChild(c);
      });
    } catch (e) { list.innerHTML = `<div class="empty">加载失败：${escapeHtml(e.message)}</div>`; }
  }
  async function openArchive(id) {
    let r;
    try { r = await callEdge('archive_get', { id }); }
    catch (e) { alert(e.message); return; }
    // 若该留档带原帖全量快照，拼一段“原帖快照 + 全部评论”区块
    let snapHtml = '';
    const sp = r.snapshot;
    if (sp && sp.post) {
      const p = sp.post;
      snapHtml += `<div style="margin-top:14px;border:1px solid var(--accent,#e07a5f);border-radius:10px;padding:10px 12px;background:var(--card-soft,#f5f6f8)">
        <div style="font-size:12px;color:var(--accent,#e07a5f);font-weight:600;margin-bottom:6px">📸 原帖完整快照</div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:6px">${p.topic ? '话题：' + escapeHtml(p.topic) : ''}${p.nickname ? ' · 作者：' + escapeHtml(p.nickname) : ''}${p.created_at ? ' · 发帖：' + formatTime(p.created_at) : ''}</div>
        <div style="color:var(--text);white-space:pre-wrap;word-break:break-word;line-height:1.7">${escapeHtml(p.content || '（无正文）')}</div>
      </div>`;
      const cs = sp.comments || [];
      if (cs.length) {
        snapHtml += `<div style="margin-top:10px;border:1px solid var(--line);border-radius:10px;padding:10px 12px">`;
        snapHtml += `<div style="font-size:12px;color:var(--muted);font-weight:600;margin-bottom:8px">💬 原帖评论（${cs.length}）</div>`;
        cs.forEach((cm) => {
          snapHtml += `<div style="font-size:12.5px;margin-bottom:8px;border-left:2px solid var(--line);padding-left:8px"><strong>${escapeHtml(cm.nickname || '匿名')}</strong> <span style="color:var(--faint);font-size:11px">${formatTime(cm.created_at)}</span><div style="white-space:pre-wrap;word-break:break-word;color:var(--text)">${escapeHtml(cm.content || '')}</div></div>`;
        });
        snapHtml += `</div>`;
      }
    }
    const mask = document.createElement('div');
    mask.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(10,12,25,.6);display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(3px)';
    mask.innerHTML = `<div style="width:min(640px,96vw);max-height:86vh;overflow:auto;background:var(--card,#fff);border:1px solid var(--line);border-radius:16px;padding:20px 22px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
        <span style="font-weight:800;color:var(--text);font-size:17px">📌 留档详情</span>
        <span class="badge">${escapeHtml(ARCH_SRC[r.source] || r.source || '留档')}</span>
        <button id="arch-close" style="margin-left:auto;background:none;border:none;font-size:22px;color:var(--muted);cursor:pointer">×</button>
      </div>
      <div style="font-weight:700;color:var(--text);font-size:15px;margin-bottom:8px">${escapeHtml(r.title || '（无标题）')}</div>
      ${r.intro ? `<div style="color:var(--accent,#e07a5f);font-size:13px;margin-bottom:8px">📝 ${escapeHtml(r.intro)}</div>` : ''}
      <div style="font-size:12px;color:var(--muted);margin-bottom:10px;line-height:1.7">
        ${r.author_name ? `作者：${escapeHtml(r.author_name)}<br>` : ''}
        ${r.actor_name ? `删除/操作人：${escapeHtml(r.actor_name)}<br>` : ''}
        ${r.post_time ? `发帖时间：${formatTime(r.post_time)}<br>` : ''}
        ${r.del_time ? `删除/屏蔽时间：${formatTime(r.del_time)}<br>` : ''}
        留档时间：${formatTime(r.created_at)} · 归档人：${escapeHtml(r.archived_by || '—')}
      </div>
      <div style="border:1px solid var(--line);border-radius:10px;padding:10px 12px;background:var(--card-soft,#f5f6f8)">
        <div style="color:var(--text);white-space:pre-wrap;word-break:break-word;line-height:1.7">${escapeHtml(r.body || '（无正文）')}</div>
      </div>
      ${snapHtml}
    </div>`;
    mask.querySelector('#arch-close').addEventListener('click', () => mask.remove());
    mask.addEventListener('mousedown', (e) => { if (e.target === mask) mask.remove(); });
    document.body.appendChild(mask);
  }
  $('archRefresh')?.addEventListener('click', loadArchive);
  $('archSearch')?.addEventListener('click', loadArchive);
  $('archQ')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') loadArchive(); });
  $('archAddBtn')?.addEventListener('click', async () => {
    const title = $('archAddTitle').value.trim();
    const intro = $('archAddIntro').value.trim();
    const body = $('archAddBody').value.trim();
    if (!title && !body) { alert('请至少填写标题或正文内容'); return; }
    $('archAddBtn').disabled = true;
    try {
      await callEdge('archive_add', { title, intro, body });
      alert('✅ 已新增留档记录（永久保存）');
      $('archAddTitle').value = ''; $('archAddIntro').value = ''; $('archAddBody').value = '';
      loadArchive();
    } catch (err) { alert(err.message); } finally { $('archAddBtn').disabled = false; }
  });

  // ---------- 设备封禁（can_deviceban） ----------
  async function loadDeviceBan() {
    const list = $('deviceBanList');
    if (!list) return;
    list.innerHTML = '<div class="empty">加载中…</div>';
    const q = $('deviceBanQ')?.value.trim() || '';
    try {
      const d = await callEdge('admin_deviceban_list', { q });
      list.innerHTML = '';
      if ((!d.banned || !d.banned.length) && (!d.terminated || !d.terminated.length)) {
        list.innerHTML = '<div class="empty">暂无已封禁设备。用户被永久注销后这里会列出其设备，可一键封禁。</div>';
        return;
      }
      if (d.banned && d.banned.length) {
        list.appendChild(blockTitle('已封禁设备（这些设备无法再登录 / 创建账号）'));
        d.banned.forEach((b) => {
          const c = document.createElement('div');
          c.className = 'panel fade-in-up';
          c.style.padding = '10px 14px'; c.style.boxShadow = 'none'; c.style.marginBottom = '8px'; c.style.fontSize = '12.5px';
          c.innerHTML = `<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <code style="font-family:monospace;background:var(--card-soft,#eee);padding:2px 6px;border-radius:6px;font-size:12px;word-break:break-all">${escapeHtml(b.device_id)}</code>
            ${b.username ? `<span class="badge topic">${escapeHtml(b.username)}</span>` : ''}
            <span style="color:var(--muted)">${escapeHtml(b.reason || '')}</span>
            <span style="margin-left:auto;color:var(--faint);font-size:11px">${formatTime(b.created_at)} · 由 ${escapeHtml(b.banned_by || '—')}</span>
            <button class="btn sm ghost" data-devunban="${escapeHtml(b.device_id)}">解封</button>
          </div>`;
          c.querySelector('[data-devunban]')?.addEventListener('click', async () => {
            if (!confirm('确认解除该设备的封禁？此设备将可再次登录/注册。')) return;
            try { await callEdge('admin_deviceban_remove', { device_id: b.device_id }); alert('✅ 已解除设备封禁'); loadDeviceBan(); }
            catch (err) { alert(err.message); }
          });
          list.appendChild(c);
        });
      }
      if (d.terminated && d.terminated.length) {
        list.appendChild(blockTitle('已注销账号的设备（可一键封禁）'));
        d.terminated.forEach((t) => {
          const c = document.createElement('div');
          c.className = 'panel fade-in-up';
          c.style.padding = '10px 14px'; c.style.boxShadow = 'none'; c.style.marginBottom = '8px'; c.style.fontSize = '12.5px';
          c.innerHTML = `<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <strong>@${escapeHtml(t.username)}</strong>
            <code style="font-family:monospace;background:var(--card-soft,#eee);padding:2px 6px;border-radius:6px;font-size:12px;word-break:break-all">${escapeHtml(t.device_id)}</code>
            <span style="margin-left:auto;color:var(--faint);font-size:11px">注销于 ${formatTime(t.created_at)} · ${escapeHtml(t.terminated_by || '—')}</span>
            <button class="btn sm danger" data-devban="${escapeHtml(t.device_id)}">封禁该设备</button>
          </div>`;
          c.querySelector('[data-devban]')?.addEventListener('click', async () => {
            if (!confirm(`确认封禁「@${t.username}」所在的这台设备？封禁后该设备无法再登录/创建账号。`)) return;
            try { await callEdge('admin_deviceban_add', { device_id: t.device_id, username: t.username, reason: '随账号 ' + t.username + ' 永久注销一并封禁' }); alert('✅ 已封禁该设备'); loadDeviceBan(); }
            catch (err) { alert(err.message); }
          });
          list.appendChild(c);
        });
      }
    } catch (e) { list.innerHTML = `<div class="empty">加载失败：${escapeHtml(e.message)}</div>`; }
  }
  function blockTitle(t) {
    const el = document.createElement('h4');
    el.style.cssText = 'margin:14px 0 8px;font-size:13px;color:var(--text)';
    el.textContent = t;
    return el;
  }
  $('deviceBanRefresh')?.addEventListener('click', loadDeviceBan);
  $('deviceBanSearch')?.addEventListener('click', loadDeviceBan);
  $('deviceBanQ')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') loadDeviceBan(); });
  $('deviceBanAddBtn')?.addEventListener('click', async () => {
    const d = $('deviceBanInput')?.value.trim();
    const reason = $('deviceBanReason')?.value.trim();
    const uname = $('deviceBanUser')?.value.trim();
    if (!d) { alert('请填写设备指纹'); return; }
    try {
      await callEdge('admin_deviceban_add', { device_id: d, reason, username: uname });
      alert('✅ 已封禁该设备');
      if ($('deviceBanInput')) $('deviceBanInput').value = '';
      if ($('deviceBanReason')) $('deviceBanReason').value = '';
      if ($('deviceBanUser')) $('deviceBanUser').value = '';
      loadDeviceBan();
    } catch (err) { alert(err.message); }
  });

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

  // ---------- 重置他人账号密码（仅创始人；忘记密码时使用） ----------
  let resetQ = '';
  async function loadResetPwd() {
    const list = $('resetList');
    list.innerHTML = '<div class="empty">加载中…</div>';
    let data;
    try { data = await callEdge('admin_user_mgmt_list', { q: resetQ }); }
    catch (e) { list.innerHTML = `<div class="empty">加载失败：${escapeHtml(e.message)}</div>`; return; }
    if (!data.length) { list.innerHTML = '<div class="empty">暂无注册账号</div>'; return; }
    list.innerHTML = '';
    data.forEach((u) => {
      const c = document.createElement('div');
      c.className = 'panel fade-in-up';
      c.style.padding = '12px 14px'; c.style.boxShadow = 'none'; c.style.marginBottom = '10px';
      const statusBadge = u.banned
        ? (u.permanent ? '<span class="badge" style="color:#fff;background:var(--danger)">已注销</span>' : '<span class="badge" style="color:#fff;background:#c26">封禁中</span>')
        : '<span class="badge" style="color:#fff;background:#2e8b57">正常</span>';
      const initials = escapeHtml((u.nickname || u.username).charAt(0).toUpperCase());
      c.innerHTML = `
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <span class="avatar" style="width:36px;height:36px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-weight:700;color:#fff;flex-shrink:0;background:${escapeHtml(u.avatar_color || '#e07a5f')}">${initials}</span>
          <div style="min-width:160px;flex:1">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              <strong>@${escapeHtml(u.username)}</strong>
              <span style="color:var(--faint);font-size:12px">${escapeHtml(u.nickname || '未设置昵称')}</span>
              ${statusBadge}
            </div>
            <div style="font-size:12px;color:var(--muted);margin-top:3px">注册于 ${formatTime(u.created_at)} ｜ Lv.${u.level} ｜ 帖子 ${u.post_count} ｜ 评论 ${u.comment_count}</div>
          </div>
          <button class="btn sm" data-reset="${u.id}" style="flex-shrink:0">🔑 重置密码</button>
        </div>`;
      list.appendChild(c);
      c.querySelector(`[data-reset="${u.id}"]`).addEventListener('click', () => openResetPwd(u));
    });
  }
  function openResetPwd(user) {
    const mask = document.createElement('div');
    mask.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(10,12,25,.6);display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(3px)';
    mask.innerHTML = `<div style="width:min(420px,94vw);background:var(--card,#fff);border:1px solid var(--line);border-radius:16px;padding:20px 22px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
        <span style="font-weight:800;color:var(--text);font-size:17px">🔑 重置密码</span>
        <button id="rp-close" style="margin-left:auto;background:none;border:none;font-size:22px;color:var(--muted);cursor:pointer">×</button>
      </div>
      <div style="font-size:13px;color:var(--muted);margin-bottom:12px;line-height:1.7">
        账号：<b style="color:var(--text)">@${escapeHtml(user.username)}</b>
        ${user.nickname ? `<span style="color:var(--faint)">（${escapeHtml(user.nickname)}）</span>` : ''}<br>
        请为 「${escapeHtml(user.username)}」 设置新密码（至少 6 位）。
      </div>
      <input id="rp-new" type="password" class="input" placeholder="输入新密码" autocomplete="new-password" style="width:100%;margin-bottom:8px" />
      <input id="rp-confirm" type="password" class="input" placeholder="再次输入新密码" autocomplete="new-password" style="width:100%" />
      <div id="rp-err" style="color:#e05e5e;font-size:12px;margin:8px 0;min-height:16px"></div>
      <button id="rp-do" class="btn" style="width:100%">确认重置密码</button>
    </div>`;
    mask.querySelector('#rp-close').addEventListener('click', () => mask.remove());
    mask.addEventListener('mousedown', (e) => { if (e.target === mask) mask.remove(); });
    document.body.appendChild(mask);
    const newIn = mask.querySelector('#rp-new');
    const cfIn = mask.querySelector('#rp-confirm');
    const err = mask.querySelector('#rp-err');
    newIn.focus();
    mask.querySelector('#rp-do').addEventListener('click', async () => {
      const np = newIn.value, cf = cfIn.value;
      if (!np) { err.textContent = '请输入新密码'; return; }
      if (np.length < 6) { err.textContent = '新密码至少 6 位'; return; }
      if (np.length > 72) { err.textContent = '新密码过长（最多 72 位）'; return; }
      if (np !== cf) { err.textContent = '两次输入的密码不一致'; return; }
      if (!confirm(`确认将账号 @${user.username} 的登录密码重置为刚才输入的新密码？重置后对方将无法用旧密码登录。`)) return;
      const btn = mask.querySelector('#rp-do');
      btn.disabled = true; btn.textContent = '重置中…';
      try {
        await callEdge('founder_reset_user_password', { username: user.username, new_password: np });
        alert(`✅ 账号 @${user.username} 的密码已成功重置，请及时通知对方用新密码登录。`);
        mask.remove();
        loadResetPwd();
      } catch (e) { err.textContent = e.message; btn.disabled = false; btn.textContent = '确认重置密码'; }
    });
  }
  $('resetSearch').addEventListener('click', () => { resetQ = $('resetQ').value.trim(); loadResetPwd(); });
  $('resetQ').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('resetSearch').click(); });
  $('resetRefresh').addEventListener('click', () => loadResetPwd());

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
      ['can_block', '屏蔽'], ['can_delete', '删除/回收站'], ['can_gold', '金牌认证'], ['can_review', '吃瓜审核'], ['can_pin', '顶置'], ['can_popup', '弹窗'],
      ['can_report', '举报管理'], ['can_view_audit', '审计查看'], ['can_blacklist', '黑名单管理'],
      ['can_notice', '公告管理'], ['can_bug', 'Bug回复'], ['can_topic', '话题管理'],
      ['can_ban', '用户封禁'], ['can_user_mgmt', '用户统一管理'], ['can_column', '专栏管理'], ['can_digest', '精华聚合'], ['can_mentor', '学长认证'], ['can_invite', '管理论坛邀请码'], ['can_del_log', '用户删除日志'], ['can_archive', '留档日志'], ['can_deviceban', '设备封禁']
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
    // 当前已在精华聚合的帖子 id 集合（供后台显示“移出精华/加入精华”状态）
    let digSet = new Set();
    if (hasPerm('can_digest')) {
      try { const d = await callEdge('digest_list', {}); digSet = new Set((d || []).map((x) => x.id)); } catch (_e) {}
    }
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
      if (hasPerm('can_block') || hasPerm('can_delete')) {
        buttons.push(`<button class="btn sm ghost" data-a="comments" data-id="${p.id}">💬 评论 (${Number(p.comment_count) || 0})</button>`);
      }
      if (hasPerm('can_block')) {
        buttons.push(`<button class="btn sm ghost" data-a="block" data-id="${p.id}" data-v="${p.blocked ? 'false' : 'true'}">${p.blocked ? '解除屏蔽' : '屏蔽'}</button>`);
      }
      if (hasPerm('can_delete')) {
        buttons.push(`<button class="btn sm danger" data-a="del" data-id="${p.id}">删除</button>`);
      }
      if (hasPerm('can_review') && !p.reviewed && !p.blocked) {
        buttons.push(`<button class="btn sm" data-a="review" data-id="${p.id}" data-v="true">审核通过</button>`);
      }
      if (hasPerm('can_pin')) {
        buttons.push(`<button class="btn sm ghost" data-a="pin" data-id="${p.id}">置顶</button>`);
      }
      if (hasPerm('can_digest')) {
        const digested = digSet.has(p.id);
        buttons.push(`<button class="btn sm ghost" data-a="digest" data-id="${p.id}" data-digest="${digested ? '1' : '0'}">${digested ? '💎 移出精华' : '💎 加入精华'}</button>`);
      }
      if (hasPerm('can_topic')) {
        buttons.push(`<button class="btn sm ghost" data-a="settopic" data-id="${p.id}">📂 更换话题</button>`);
      }
      if (hasPerm('can_gold')) {
        const goldNow = !!p.gold_until && new Date(p.gold_until).getTime() > Date.now();
        buttons.push(`<button class="btn sm ghost" data-a="gold" data-id="${p.id}">🪙 ${goldNow ? `续期认证` : '金牌认证'}</button>`);
      }
      // 快捷留档=「帖子管理」操作：拥有 can_delete 或 can_block 之一即可（查看/删除留档日志才需 can_archive）
      if (hasPerm('can_delete') || hasPerm('can_block')) {
        buttons.push(`<button class="btn sm ghost" data-a="archive" data-id="${p.id}">📌 直接留档</button>`);
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
    if (a === 'digest' && v === '1' && !confirm('把帖子移出精华聚合？原帖保留在主论坛，不受影响。')) return;
    if (a === 'gold') {
      const raw = prompt('🪙 金牌认证\n请输入自定义顶置时长（小时）：\n范围 1-96，超出会自动按 96 处理', '24');
      if (raw === null) return;
      const gh = parseInt(raw, 10);
      if (isNaN(gh) || gh < 1) { alert('时长需为 1-96 的整数小时'); return; }
      const hours = Math.min(gh, 96);
      if (!confirm(`确认对该帖金牌认证并顶置 ${hours} 小时？`)) return;
      btn.disabled = true;
      try {
        const r = await callEdge('gold_set', { post_id: id, hours });
        alert(`🪙 金牌认证成功！该帖已顶置 ${r.hours} 小时，至 ${formatTime(r.until)}。`);
        loadPosts();
      } catch (err) { alert(err.message); btn.disabled = false; }
      return;
    }
    if (a === 'settopic') { onSetPostTopic(id, btn); return; }
    if (a === 'archive') { onArchivePostDirect(id, btn); return; }
    btn.disabled = true;
    try {
      if (a === 'block') await callEdge('block_post', { id, blocked: v === 'true' });
      else if (a === 'del') await callEdge('delete_post', { id });
      else if (a === 'review') await callEdge('review_post', { id, reviewed: true });
      else if (a === 'pin') await callEdge('pin_post', { id, pinned: true });
      else if (a === 'digest') await callEdge(v === '1' ? 'digest_remove' : 'digest_add', { post_id: id });
      loadPosts();
    } catch (err) { alert(err.message); btn.disabled = false; }
  }
  async function adminTopicNames() {
    const fixed = TOPICS.slice();
    let custom = [];
    try { custom = (await callEdge('topic_admin_list', {})) || []; } catch (_e) {}
    return fixed.concat(custom.map((c) => c.display_name).filter(Boolean));
  }
  async function onArchivePostDirect(id, btn) {
    if (!confirm('把该帖（含全部评论）快照加入留档日志？原帖不会被屏蔽或删除，仅保存一份永久副本。')) return;
    btn.disabled = true;
    try {
      await callEdge('archive_post_direct', { post_id: id });
      alert('📌 已把该帖直接留档（原始帖子保持不变）。');
      loadPosts();
    } catch (err) { alert(err.message); btn.disabled = false; }
  }
  async function onSetPostTopic(id, btn) {
    const names = await adminTopicNames();
    const choice = prompt('更换该帖所属话题：\n输入序号选择新的话题\n\n' + names.map((n, i) => (i + 1) + '. ' + n).join('\n'));
    if (choice == null) return;
    const idx = parseInt(String(choice).trim(), 10) - 1;
    const target = names[idx];
    if (!target) { alert('无效的序号，请重新选择'); return; }
    if (!confirm(`把该帖移动到话题「${target}」？`)) return;
    btn.disabled = true;
    try { await callEdge('post_set_topic', { post_id: id, topic: target }); alert('✅ 已把该帖移动到「' + target + '」'); loadPosts(); }
    catch (err) { alert(err.message); btn.disabled = false; }
  }
  // 精华聚合管理：展示已收录的精华帖，支持移出
  function loadDigests() {
    const list = $('digestList');
    if (!list) return;
    list.innerHTML = '加载中…';
    callEdge('digest_list', {}).then((data) => {
      if (!data || !data.length) { list.innerHTML = '<div class="empty">暂无精华帖，可到「帖子管理」里点「加入精华」</div>'; return; }
      list.innerHTML = '';
      (data || []).forEach((p) => {
        const card = document.createElement('div');
        card.className = 'panel';
        card.style.marginBottom = '10px';
        card.innerHTML = `
        <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:6px">
          <strong>${escapeHtml(p.nickname || '匿名')}</strong>
          <span class="badge">${escapeHtml(p.topic)}</span>
          <span style="margin-left:auto;color:var(--faint);font-size:12px">${formatTime(p.created_at)}</span>
          <button class="btn sm ghost" data-digid="${p.id}">💎 移出精华</button>
        </div>
        <div class="post-content">${escapeHtml(p.content)}</div>`;
        card.querySelector('[data-digid]').addEventListener('click', async () => {
          if (!confirm('把该帖移出精华聚合？原帖保留在主论坛。')) return;
          try { await callEdge('digest_remove', { post_id: p.id }); loadDigests(); }
          catch (err) { alert(err.message); }
        });
        list.appendChild(card);
      });
    }).catch((err) => {
      list.innerHTML = '<div class="empty">加载失败：' + escapeHtml(err.message) + '</div>';
    });
  }
  $('digestRefresh').addEventListener('click', loadDigests);
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
            <span class="badge">操作人：${escapeHtml(t.deleted_by || '未知')}</span>
            ${t.reason ? `<span style="color:var(--faint);font-size:12px">${escapeHtml(t.reason)}</span>` : ''}
            <span style="margin-left:auto;color:var(--faint);font-size:12px">${formatTime(t.created_at)}</span>
          </div>
          ${t.preview && t.preview.content
            ? `<div style="background:var(--card-soft,#eee);border:1px solid var(--line);border-radius:10px;padding:10px 12px;margin-bottom:8px">
                <div style="font-size:11px;color:var(--faint);margin-bottom:4px">话题：${escapeHtml(t.preview.topic || '—')} · 作者：${escapeHtml(t.preview.nickname || '匿名')}${t.original_id ? ' · 原始 id: ' + escapeHtml(t.original_id) : ''}</div>
                <div style="font-size:13px;color:var(--text);white-space:pre-wrap;word-break:break-word">${escapeHtml(t.preview.content)}${escapeHtml(t.preview.content.length >= 80 ? '…' : '')}</div>
              </div>`
            : `<div style="color:var(--faint);font-size:12px;margin-bottom:10px">${t.expires_at ? `将于 ${formatTime(t.expires_at)} 自动清理` : ''} · ${t.original_id ? '原始 id: ' + escapeHtml(t.original_id) : '（无快照）'}</div>`}
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn sm" data-tr="view" data-id="${t.id}" ${t.has_snapshot ? '' : 'disabled'}>👁 查看快照</button>
            <button class="btn sm" data-tr="restore" data-id="${t.id}">恢复帖子</button>
            <button class="btn sm danger" data-tr="purge" data-id="${t.id}">彻底删除</button>
            <button class="btn sm ghost" data-tr="archive" data-id="${t.id}">📌 加入留档</button>
          </div>`;
        c.querySelectorAll('[data-tr]').forEach((b) => {
          b.addEventListener('click', async () => {
            const act = b.dataset.tr;
            if (act === 'view') { openTrashSnapshot(t.id); return; }
            if (act === 'archive') {
              const intro = prompt('加入留档（可填简介/重要说明，留空则无）：', '');
              if (intro === null) return;
              try { await callEdge('trash_archive', { id: t.id, intro }); alert('✅ 已加入留档日志（永久保存）'); loadTrash(); }
              catch (err) { alert(err.message); }
              return;
            }
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
  async function openTrashSnapshot(id) {
    const mask = document.createElement('div');
    mask.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(10,12,25,.6);display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(3px)';
    mask.innerHTML = `<div style="width:min(600px,96vw);max-height:86vh;overflow:auto;background:var(--card,#fff);border:1px solid var(--line);border-radius:16px;padding:20px 22px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
        <span style="font-weight:800;color:var(--text);font-size:17px">👁 帖子快照</span>
        <span style="font-size:11px;color:var(--accent,#e07a5f)">回收站 · 删除时备份内容</span>
        <button id="ts-close" style="margin-left:auto;background:none;border:none;font-size:22px;color:var(--muted);cursor:pointer">×</button>
      </div>
      <div id="ts-body" style="color:var(--muted);font-size:14px">加载中…</div>
    </div>`;
    mask.querySelector('#ts-close').addEventListener('click', () => mask.remove());
    mask.addEventListener('mousedown', (e) => { if (e.target === mask) mask.remove(); });
    document.body.appendChild(mask);
    const body = mask.querySelector('#ts-body');
    let data;
    try { data = await callEdge('trash_view', { id }); }
    catch (e) { body.innerHTML = `<div style="color:#e05e5e">加载失败：${escapeHtml(e.message)}</div>`; return; }
    const post = data.post || {};
    const comments = data.comments || [];
    const meta = [
      `删除人：${escapeHtml(data.deleted_by || '管理员')}`,
      `删除时间：${formatTime(data.created_at)}`,
      data.expires_at ? `自动清理：${formatTime(data.expires_at)}` : '',
      `原始 id：${escapeHtml(data.original_id || '-')}`,
      data.reason ? `删除原因：${escapeHtml(data.reason)}` : ''
    ].filter(Boolean).map((s) => `<div style="padding:3px 0">${s}</div>`).join('');
    const postHtml = post.id
      ? `<div style="border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin-top:10px">
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:6px">
            <strong>${escapeHtml(post.nickname || '匿名')}</strong>
            <span class="badge topic">${escapeHtml(post.topic || '闲聊')}</span>
            ${post.created_at ? `<span style="color:var(--faint);font-size:12px">${formatTime(post.created_at)}</span>` : ''}
          </div>
          <div style="color:var(--text);white-space:pre-wrap;word-break:break-word;line-height:1.7;margin-top:6px">${escapeHtml(post.content || '（无正文）')}</div>
          <div style="font-size:12px;color:var(--faint);margin-top:10px">原 id: ${escapeHtml(post.id)} ｜ 点赞 ${Number(post.like_count) || data.like_users?.length || 0} ｜ 评论 ${comments.length}</div>
        </div>`
      : '<div class="empty" style="margin-top:10px">该帖子没有保存正文快照</div>';
    const commentsHtml = comments.length
      ? comments.map((c) => `
        <div style="padding:8px 0;border-bottom:1px dashed var(--line)">
          <div style="font-size:12px;color:var(--faint);margin-bottom:3px">${escapeHtml(c.nickname || '匿名')} · ${formatTime(c.created_at)}${c.parent_id ? ' · 回复楼层 ' + escapeHtml(String(c.parent_id).slice(0, 8)) : ''}</div>
          <div style="color:var(--text);font-size:13px;white-space:pre-wrap;word-break:break-word;line-height:1.6">${escapeHtml(c.content || '')}</div>
        </div>`).join('')
      : '<div class="empty">（该帖删除时无评论）</div>';
    body.innerHTML = `
      <div style="background:var(--card-soft,#eee);border:1px dashed var(--line);border-radius:10px;padding:10px 12px;font-size:13px;line-height:1.7">${meta}</div>
      ${postHtml}
      <div style="font-weight:700;color:var(--text);margin:16px 0 6px">💬 评论（${comments.length}）</div>
      ${commentsHtml}`;
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
    const box = $('adminControlBox');
    if (box && hasPerm('can_user_mgmt')) {
      box.style.display = 'block';
      const ra = $('adminReauth');
      if (ra) ra.checked = (Number(data.admin_ttl_min) || 0) > 0;
    }
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
  // 管理员重新登录策略开关
  $('adminReauthSave').addEventListener('click', async () => {
    if (!hasPerm('can_user_mgmt')) { alert('无权限执行此操作'); return; }
    $('siteError').textContent = '';
    try {
      await callEdge('admin_ttl_set', { minutes: $('adminReauth').checked ? 10 : 0 });
      $('siteError').textContent = '✅ 已更新管理员重新登录策略';
    } catch (err) { $('siteError').textContent = err.message; }
  });
  // 强制刷新所有其他端
  $('forceRefresh').addEventListener('click', async () => {
    if (!hasPerm('can_user_mgmt')) { alert('无权限执行此操作'); return; }
    if (!confirm('确认强制刷新所有其他浏览器端？所有在线页面将自动整页刷新以清空缓存。')) return;
    $('forceRefresh').disabled = true;
    $('siteError').textContent = '';
    try {
      await callEdge('admin_force_refresh');
      $('siteError').textContent = '✅ 已广播刷新，各端将在数秒内自动整页刷新';
      setTimeout(() => location.reload(), 700);
    } catch (err) { $('siteError').textContent = err.message; $('forceRefresh').disabled = false; }
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
          <span style="font-size:12px;color:var(--faint)">${escapeHtml(b.user_name)} · ${escapeHtml(formatTime(b.created_at))}</span>
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
          <span style="margin-left:auto;display:flex;gap:6px">
            ${t.is_permanent ? '' : `<button class="btn sm ghost" data-prom="${t.id}">⬆️ 立刻转正</button>`}
            <button class="btn sm danger" data-del="${t.id}">删除</button>
          </span>
        </div>
        <div style="font-size:12px;color:var(--faint)">删除后，该话题下的全部帖子（含顶置）及其附属评论将一并转入「闲聊」话题。</div>`;
      list.appendChild(c);
      c.querySelector('[data-del]').addEventListener('click', async (el) => {
        if (!confirm(`确认删除「${t.display_name}」话题？\n该话题下所有帖子 + 评论将转入「闲聊」。即使已是永久话题也会被删除。`)) return;
        el.currentTarget.disabled = true;
        try { await callEdge('topic_delete', { topic_id: t.id }); loadTopicsAdmin(); }
        catch (err) { alert(err.message); el.currentTarget.disabled = false; }
      });
      c.querySelector('[data-prom]')?.addEventListener('click', async (el) => {
        if (!confirm(`确认将话题「${t.display_name}」立刻转正为永久话题？转正后不再过期、可被用作认证话题。`)) return;
        el.currentTarget.disabled = true;
        try { await callEdge('topic_promote', { topic_id: t.id }); loadTopicsAdmin(); }
        catch (err) { alert(err.message); el.currentTarget.disabled = false; }
      });
    });
  }
  $('topicRefresh').addEventListener('click', loadTopicsAdmin);

  // ---------- 管理员管理（创始人） ----------
  async function loadAdmins() {
    if (!profile?.isFounder) return;
    try {
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
        ['can_block', '屏蔽'], ['can_delete', '删除/回收站'], ['can_gold', '金牌认证'], ['can_review', '吃瓜审核'], ['can_pin', '顶置'], ['can_popup', '弹窗'],
        ['can_report', '举报管理'], ['can_view_audit', '审计查看'], ['can_blacklist', '黑名单管理'],
      ['can_notice', '公告管理'], ['can_bug', 'Bug回复'], ['can_topic', '话题管理'],
        ['can_ban', '用户封禁'], ['can_user_mgmt', '用户统一管理'], ['can_column', '专栏管理'], ['can_digest', '精华聚合'], ['can_mentor', '学长认证'], ['can_invite', '管理论坛邀请码'], ['can_del_log', '用户删除日志'], ['can_archive', '留档日志'], ['can_deviceban', '设备封禁']
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
    } catch (err) {
      const pl = $('pendingList'); if (pl) pl.innerHTML = '';
      const al = $('adminList'); if (al) al.innerHTML = '<div class="empty" style="padding:14px">加载失败：' + escapeHtml(err.message) + '</div>';
    }
  }

  // ---------- 校史留名编号管理（仅创始人） ----------
  async function loadLegends() {
    if (!profile?.isFounder) return;
    const assigned = $('legendAssigned');
    const pending = $('legendPending');
    const nextBox = $('legendNext');
    assigned.innerHTML = '<div class="empty">加载中…</div>';
    pending.innerHTML = '';
    try {
      const data = await callEdge('legend_list', {});
      nextBox.innerHTML = `下一个自动编号 <b style="color:var(--accent,#e07a5f)">No.${escapeHtml(data.next)}</b> `;
      // 已编号列表
      assigned.innerHTML = '';
      if (!data.assigned.length) assigned.innerHTML = '<div class="empty">暂无已编号用户</div>';
      data.assigned.forEach((u) => {
        const c = document.createElement('div');
        c.className = 'panel fade-in-up';
        c.style.padding = '10px 14px'; c.style.boxShadow = 'none'; c.style.marginBottom = '8px';
        c.innerHTML = `
        <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center">
          <span><strong>${escapeHtml(u.nickname || u.username)}</strong> <span style="color:var(--faint)">@${escapeHtml(u.username)}</span></span>
          <span style="font-size:12px;color:var(--muted)">Lv.${escapeHtml(u.level)} · 经验 ${escapeHtml(u.xp)}</span>
          <input type="number" min="1" value="${escapeHtml(u.legend_no)}" data-lno="${u.id}" style="width:80px;margin-left:auto;padding:4px 6px;border:1px solid var(--line);border-radius:8px;background:var(--input-bg);color:var(--text)" />
          <button class="btn sm" data-lsave="${u.id}">保存</button>
        </div>`;
        c.querySelector(`[data-lsave="${u.id}"]`).addEventListener('click', async (b) => {
          const val = c.querySelector(`[data-lno="${u.id}"]`).value.trim();
          if (!val || isNaN(Number(val)) || Number(val) < 1) { alert('编号需为正整数'); return; }
          b.disabled = true;
          try {
            await callEdge('legend_set', { user_id: u.id, legend_no: Number(val) });
            alert('✅ 编号已更新');
            loadLegends();
          } catch (err) { alert(err.message); b.disabled = false; }
        });
        assigned.appendChild(c);
      });
      // 待编号列表
      pending.innerHTML = '';
      if (!data.pending.length) pending.innerHTML = '<div class="empty">暂无待编号用户 ✅</div>';
      data.pending.forEach((u) => {
        const c = document.createElement('div');
        c.className = 'panel fade-in-up';
        c.style.padding = '10px 14px'; c.style.boxShadow = 'none'; c.style.marginBottom = '8px';
        c.innerHTML = `
        <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center">
          <span><strong>${escapeHtml(u.nickname || u.username)}</strong></span>
          <span style="font-size:12px;color:var(--muted)">Lv.${escapeHtml(u.level)} · 经验 ${escapeHtml(u.xp)}</span>
          <button class="btn sm" data-lset="${u.id}" style="margin-left:auto">设为编号</button>
        </div>`;
        c.querySelector(`[data-lset="${u.id}"]`).addEventListener('click', async (b) => {
          const raw = prompt(`为「${u.nickname || u.username}」设置校史编号（正整数）：`, String(Number(data.next) || 1));
          if (raw === null) return;
          const val = parseInt(raw, 10);
          if (isNaN(val) || val < 1) { alert('编号需为正整数'); return; }
          b.disabled = true;
          try {
            await callEdge('legend_set', { user_id: u.id, legend_no: val });
            alert('✅ 已设置编号');
            loadLegends();
          } catch (err) { alert(err.message); b.disabled = false; }
        });
        pending.appendChild(c);
      });
    } catch (e) { assigned.innerHTML = `<div class="empty">加载失败：${escapeHtml(e.message)}</div>`; }
  }
  $('legendRefresh').addEventListener('click', loadLegends);

  // ---------- 认证答主审核 ----------
  const MENTOR_STATUS = { pending: '待审核', approved: '已通过', rejected: '已驳回', closed: '已取消' };
  const MENTOR_STATUS_C = { pending: 'var(--warn)', approved: '#2e8b57', rejected: '#c26', closed: '#888' };
  async function loadMentorAdmin() {
    if (!hasPerm('can_mentor')) { $('mentorList').innerHTML = '<div class="empty">无学长认证管理权限</div>'; return; }
    faWireOnce();
    renderFounderMentorAssign();
    const list = $('mentorList');
    list.innerHTML = '<div class="empty">加载中…</div>';
    try {
      const rows = await callEdge('mentor_admin_list', {});
      if (!rows.length) { list.innerHTML = '<div class="empty">暂无认证答主申请</div>'; return; }
      list.innerHTML = '';
      rows.forEach((m) => {
        const c = document.createElement('div');
        c.className = 'panel fade-in-up';
        c.style.padding = '12px 14px'; c.style.boxShadow = 'none'; c.style.marginBottom = '10px';
        const stBadge = `<span class="badge" style="color:#fff;background:${MENTOR_STATUS_C[m.status] || '#888'}">${MENTOR_STATUS[m.status] || escapeHtml(m.status)}</span>`;
        const btns = [];
        if (m.status === 'pending') {
          btns.push(`<button class="btn sm" data-ma="approve" data-id="${m.id}">通过</button>`);
          btns.push(`<button class="btn sm danger" data-ma="reject" data-id="${m.id}">驳回</button>`);
        } else if (m.status === 'approved') {
          btns.push(`<button class="btn sm ghost" data-ma="revoke" data-id="${m.id}">取消认证</button>`);
        }
        c.innerHTML = `
        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:6px">
          <strong style="font-size:14px">${escapeHtml(m.nickname)}</strong>
          <span class="badge topic">${escapeHtml(m.topic || '—')}</span>
          <span class="badge">称号：${escapeHtml(m.ask_title || '—')}</span>
          <span style="font-size:13px;color:var(--muted)">申请等级 <b style="color:var(--accent,#e07a5f)">${escapeHtml(m.mentor_level ?? '—')}</b></span>
          ${stBadge}
          <span style="margin-left:auto;color:var(--faint);font-size:12px">申请于 ${formatTime(m.apply_at)}</span>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          ${m.reviewed_by ? `<span style="font-size:12px;color:var(--faint)">审核人：${escapeHtml(m.reviewed_by)}${m.reviewed_at ? ' · ' + formatTime(m.reviewed_at) : ''}</span>` : ''}
          <span style="flex:1"></span>
          ${btns.join('')}
        </div>`;
        c.querySelectorAll('[data-ma]').forEach((b) => {
          b.addEventListener('click', async () => {
            const ma = b.dataset.ma;
            if (ma === 'reject' && !confirm(`确认驳回「${m.nickname}」的认证申请？`)) return;
            if (ma === 'revoke' && !confirm(`确认取消「${m.nickname}」的学长认证？`)) return;
            b.disabled = true;
            try {
              if (ma === 'approve') await callEdge('mentor_review', { id: m.id, status: 'approved' });
              else if (ma === 'reject') await callEdge('mentor_review', { id: m.id, status: 'rejected' });
              else await callEdge('mentor_revoke', { id: m.id });
              alert('✅ 操作成功');
              loadMentorAdmin();
            } catch (err) { alert(err.message); b.disabled = false; }
          });
        });
        list.appendChild(c);
      });
    } catch (e) { list.innerHTML = `<div class="empty">加载失败：${escapeHtml(e.message)}</div>`; }
  }
  $('mentorRefresh').addEventListener('click', loadMentorAdmin);

  // ---------- 创始人直接指派认证答主（仅创始人，带账号/话题过滤） ----------
  let faInit = false;
  function renderFounderMentorAssign() {
    const box = $('founderMentorAssign');
    if (!box) return;
    if (!profile?.isFounder) { box.classList.add('hidden'); return; }
    box.classList.remove('hidden');
    faLoadUsers($('faUserQ').value.trim());
    faLoadTopics($('faTopicQ').value.trim());
  }
  async function faLoadUsers(q) {
    const sel = $('faUserSel');
    sel.innerHTML = '<option value="">加载账号…</option>';
    try {
      const items = await callEdge('admin_user_search', { q });
      sel.innerHTML = '';
      if (!items || !items.length) { sel.innerHTML = '<option value="">无匹配账号（试试其他关键词）</option>'; return; }
      items.forEach((u) => {
        const opt = document.createElement('option');
        opt.value = u.id;
        opt.textContent = `${u.nickname || u.username} @${u.username}${u.banned ? '（已封禁）' : ''}`;
        sel.appendChild(opt);
      });
    } catch (e) {
      sel.innerHTML = `<option value="">加载失败：${escapeHtml(e.message)}</option>`;
    }
  }
  async function faLoadTopics(q) {
    const sel = $('faTopicSel');
    sel.innerHTML = '<option value="">加载话题…</option>';
    try {
      const data = await callEdge('topics_list', {});
      const fixed = (data && data.fixed) || [];
      const custom = (data && data.custom) || [];
      const names = new Set([...fixed, ...custom.filter((t) => t.is_permanent).map((t) => t.display_name)]);
      const kw = String(q || '').trim();
      const list = Array.from(names).filter((n) => !kw || n.indexOf(kw) >= 0).sort();
      sel.innerHTML = '';
      if (!list.length) { sel.innerHTML = '<option value="">无匹配话题</option>'; return; }
      list.forEach((n) => {
        const opt = document.createElement('option');
        opt.value = n;
        opt.textContent = n;
        sel.appendChild(opt);
      });
    } catch (e) {
      sel.innerHTML = `<option value="">加载失败：${escapeHtml(e.message)}</option>`;
    }
  }
  function faWireOnce() {
    if (faInit) return;
    faInit = true;
    let ut = null;
    $('faUserQ').addEventListener('input', () => {
      clearTimeout(ut);
      const v = $('faUserQ').value.trim();
      ut = setTimeout(() => faLoadUsers(v), 250);
    });
    let tt = null;
    $('faTopicQ').addEventListener('input', () => {
      clearTimeout(tt);
      const v = $('faTopicQ').value.trim();
      tt = setTimeout(() => faLoadTopics(v), 250);
    });
    $('faAssign').addEventListener('click', async () => {
      const uid = $('faUserSel').value;
      const topic = $('faTopicSel').value;
      const askTitle = $('faAskTitle').value.trim();
      const msg = $('faMsg');
      if (!uid) { msg.style.color = 'var(--danger)'; msg.textContent = '请先选择一个账号（列表为空时请在上方输入关键词检索）'; return; }
      if (!topic) { msg.style.color = 'var(--danger)'; msg.textContent = '请先选择一个话题'; return; }
      $('faAssign').disabled = true;
      msg.style.color = 'var(--faint)';
      msg.textContent = '正在指派…';
      try {
        await callEdge('mentor_founder_assign', { user_id: uid, topic, ask_title: askTitle });
        msg.style.color = '#2e8b57';
        msg.textContent = '✅ 已指派为认证答主，并已站内通知该用户。';
        $('faAskTitle').value = '';
        loadMentorAdmin();
      } catch (e) {
        msg.style.color = 'var(--danger)';
        msg.textContent = '指派失败：' + e.message;
        $('faAssign').disabled = false;
      }
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
    startPermSync();
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