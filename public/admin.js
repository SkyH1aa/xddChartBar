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
  const TOPICS = ['闲聊', '社团活动', '食堂', '宿舍', '学习', '吃瓜', '失物招领', '学习资料'];

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const $ = (id) => document.getElementById(id);

  let token = null;
  let profile = null;
  let activeTab = 'posts';

  // 标签定义（含权限位）；供 renderTabs 与权限同步刷新共用
  const TAB_DEFS = [
    { key: 'dashboard', label: '看板' },
    { key: 'posts', label: '帖子管理' },
    { key: 'review', label: '内容审核', perm: 'can_review' },
    { key: 'qa', label: '❓ 问答管理', perm: 'can_qa' },
    { key: 'study', label: '📖 学习资料', perm: 'can_digest' },
    { key: 'trade', label: '🔎 失物招领', perm: 'can_trade' },
    { key: 'reports', label: '举报', perm: 'can_report' },
    { key: 'trash', label: '回收站', perm: 'can_delete' },
    { key: 'columns', label: '🎓 专栏管理', perm: 'can_column' },
    { key: 'pinned', label: '顶置管理', perm: 'can_pin' },
    { key: 'audit', label: '审计日志', perm: 'can_view_audit' },
    { key: 'blacklist', label: '黑名单', perm: 'can_blacklist' },
    { key: 'userMgmt', label: '用户统一管理', perm: 'can_user_mgmt' },
    { key: 'dm', label: '✉️ 私信管理', perm: 'can_dm' },
    { key: 'digests', label: '精华聚合', perm: 'can_digest' },
    { key: 'popups', label: '弹窗公告', perm: 'can_popup' },
    { key: 'announces', label: '公告栏', perm: 'can_notice' },
    { key: 'bugs', label: 'Bug反馈', perm: 'can_bug' },
    { key: 'topics', label: '自定义话题', perm: 'can_topic' },
    { key: 'mentor', label: '🎓 学长认证', perm: 'can_mentor' },
    { key: 'invite', label: '🔑 邀请码', perm: 'can_invite' },
    { key: 'udellog', label: '用户删除日志', perm: 'can_del_log' },
    { key: 'archive', label: '留档日志', perm: 'can_archive' },
    { key: 'deviceban', label: '设备封禁', perm: 'can_deviceban' },
    { key: 'daily', label: '每日运营', perm: 'can_daily' },
    { key: 'badge', label: '🏅 成就徽章', perm: 'can_badge' },
    { key: 'shop', label: '🛒 积分商城', perm: 'can_shop' },
    { key: 'event', label: '🎉 活动中心', perm: 'can_event' }
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

  // ---------- 修改密码（仅非创始人） ----------
  function toggleChangePwd(show) {
    $('changePwdPanel').classList.toggle('hidden', !show);
    $('changePwdError').textContent = '';
    if (show) { $('cpOld').value = ''; $('cpNew').value = ''; $('cpNew2').value = ''; }
  }
  $('changePwdBtn').addEventListener('click', () => toggleChangePwd($('changePwdPanel').classList.contains('hidden')));
  $('changePwdCancel').addEventListener('click', () => toggleChangePwd(false));
  $('changePwdSave').addEventListener('click', async () => {
    const oldP = $('cpOld').value;
    const newP = $('cpNew').value;
    const newP2 = $('cpNew2').value;
    $('changePwdError').textContent = '';
    if (!oldP || !newP) { $('changePwdError').textContent = '请输入原密码和新密码'; return; }
    if (newP.length < 6) { $('changePwdError').textContent = '新密码至少 6 位'; return; }
    if (newP !== newP2) { $('changePwdError').textContent = '两次输入的新密码不一致'; return; }
    $('changePwdSave').disabled = true;
    try {
      await callEdge('admin_change_password', { old_password: oldP, new_password: newP });
      $('changePwdError').textContent = '';
      toggleChangePwd(false);
      window.alert('✅ 密码修改成功，下次登录请使用新密码。');
    } catch (e) {
      $('changePwdError').textContent = e.message;
    } finally { $('changePwdSave').disabled = false; }
  });

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
    if (key === 'columns') loadColAdminMgmt();
    if (key === 'review') loadReview();
    if (key === 'qa') loadQa();
    if (key === 'study') loadStudy();
    if (key === 'trade') loadTrade();
    if (key === 'reports') loadReports();
    if (key === 'trash') loadTrash();
    if (key === 'pinned') loadPinned();
    if (key === 'audit') loadAudit();
    if (key === 'userMgmt') loadUserMgmt();
    if (key === 'dm') loadDmAdmin();
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
    if (key === 'daily') loadDailyOps();
    if (key === 'badge') { badgeResetForm(); loadBadgeAdmin(); }
    if (key === 'shop') { shopResetForm(); loadShopAdmin(); }
    if (key === 'event') loadEventAdmin();
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
      items.forEach(({ report, content, need_can_dm }) => {
        const isDm = report.target_type === 'dm';
        const card = document.createElement('div');
        card.className = 'panel fade-in-up';
        card.style.padding = '12px 14px';
        card.style.boxShadow = 'none';
        card.style.marginBottom = '10px';
        const typeLabel = isDm ? '私信举报' : (report.target_type === 'post' ? '帖子举报' : '评论举报');
        let src;
        if (isDm) {
          if (need_can_dm) src = '<div class="empty" style="padding:6px">需要「私信管理」权限才能查看被举报的私信内容</div>';
          else if (!content) src = '<div class="empty" style="padding:6px">（被举报私信已不存在）</div>';
          else src = `<div style="border-left:3px solid var(--line);padding-left:10px;margin:8px 0;font-size:13px">
            ${(content.context || []).map((c) => {
              const isTarget = c.id === content.id;
              return `<div style="margin:3px 0;color:${isTarget ? 'var(--text)' : 'var(--faint)'}">
                ${isTarget ? '<span class="badge" style="color:#fff;background:var(--danger)">被举报</span> ' : ''}
                <strong>${escapeHtml(c.sender_name || '已注销用户')}</strong>：<span style="white-space:pre-wrap">${escapeHtml(truncate(c.body, 160))}</span>
                ${c.recalled ? ' <span style="color:var(--warn)">[已撤回]</span>' : ''}
              </div>`;
            }).join('')}
          </div>`;
        } else {
          src = content ? `
          <div style="border-left:3px solid var(--line);padding-left:10px;margin:8px 0;color:var(--text);font-size:13px;white-space:pre-wrap">
            ${content.blocked ? '<span class="badge" style="color:#fff;background:var(--danger)">已屏蔽</span> ' : ''}
            <strong>${escapeHtml(content.nickname || '匿名')}</strong> · ${escapeHtml(content.topic || '评论')} ：
            ${escapeHtml(truncate(content.content, 120))}
          </div>` : '<div class="empty" style="padding:6px">（目标内容已被删除）</div>';
        }
        card.innerHTML = `
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <strong style="font-size:13px">${typeLabel}</strong>
            <span class="badge topic">${escapeHtml(report.reason.slice(0, 20))}</span>
            <span style="margin-left:auto;color:var(--faint);font-size:12px">${formatTime(report.created_at)}</span>
          </div>
          ${src}
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn sm" data-verdict="ignore" data-rid="${report.id}">忽略</button>
            <button class="btn sm ghost" data-verdict="block" data-rid="${report.id}">屏蔽目标</button>
            <button class="btn sm danger" data-verdict="delete" data-rid="${report.id}">${isDm ? '屏蔽并保留原文' : '删除目标'}</button>
            ${isDm && content && content.thread_id ? `<button class="btn sm ghost" data-dmctx="${content.thread_id}">👁 查看会话全文</button>` : ''}
            ${hasPerm('can_ban') ? `<button class="btn sm danger ghost" data-ban7="${report.id}">⛔ 快捷封号7天</button>` : ''}
          </div>`;
        card.querySelectorAll('[data-dmctx]').forEach((b) => {
          b.addEventListener('click', () => openDmThread(b.dataset.dmctx));
        });
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
            const v = b.dataset.verdict;
            const tip = isDm
              ? (v === 'delete' ? '确定屏蔽该私信并保留原文备查？' : v === 'block' ? '确定屏蔽该私信？' : '确定忽略该举报？')
              : (v === 'delete' ? '确定删除该目标及其关联内容？' : null);
            if (tip && !confirm(tip)) return;
            b.disabled = true;
            try { await callEdge('report_resolve', { report_id: b.dataset.rid, verdict: v }); loadReports(); refreshQueueBadges(); }
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
              UUID：<code style="user-select:all;word-break:break-all">${escapeHtml(u.id)}</code><br>
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

  // ---------- 私信管理（can_dm） ----------
  let dmKeyword = '';

  async function loadDmAdmin() {
    const statsEl = $('dmStats');
    statsEl.innerHTML = '<div class="empty">加载中…</div>';
    try {
      const s = await callEdge('dm_admin_stats', {});
      statsEl.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(132px,1fr));gap:10px">
        ${dmStatCard('会话总数', s.threads)}
        ${dmStatCard('已封禁会话', s.blocked, s.blocked > 0 ? 'var(--danger)' : '')}
        ${dmStatCard('消息总数', s.messages)}
        ${dmStatCard('近 24h 消息', s.messages_24h)}
        ${dmStatCard('已关闭私信用户', s.dm_disabled_users, s.dm_disabled_users > 0 ? 'var(--warn)' : '')}
      </div>`;
    } catch (e) { statsEl.innerHTML = `<div class="empty">统计加载失败：${escapeHtml(e.message)}</div>`; }
    loadDmThreads();
  }
  function dmStatCard(label, val, color) {
    return `<div class="panel" style="padding:12px 14px;box-shadow:none;text-align:center">
      <div style="font-size:22px;font-weight:800;color:${color || 'var(--text)'}">${Number(val) || 0}</div>
      <div style="font-size:12px;color:var(--muted);margin-top:2px">${label}</div></div>`;
  }

  async function loadDmThreads() {
    const list = $('dmThreadList');
    list.innerHTML = '<div class="empty">加载中…</div>';
    let data;
    try { data = await callEdge('dm_admin_threads', { keyword: dmKeyword }); }
    catch (e) { list.innerHTML = `<div class="empty">加载失败：${escapeHtml(e.message)}</div>`; return; }
    if (!data.length) {
      list.innerHTML = dmKeyword
        ? '<div class="empty">没有匹配的私信会话</div>'
        : '<div class="empty">暂无任何私信会话</div>';
      return;
    }
    list.innerHTML = '';
    data.forEach((t) => list.appendChild(dmThreadRow(t)));
  }

  function dmSideChip(u) {
    const name = u.gone ? '已注销用户' : (u.nickname || u.username || '未知');
    const dis = u.dm_disabled ? ' <span class="badge" style="color:#fff;background:var(--warn)">已禁私信</span>' : '';
    const btn = (!u.gone && u.id)
      ? `<button class="btn sm ghost" data-dmuser="${u.id}" data-disabled="${u.dm_disabled ? '1' : '0'}">${u.dm_disabled ? '✅ 恢复私信' : '🚫 禁用私信'}</button>`
      : '';
    return `<span style="display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap">
      <strong>${escapeHtml(name)}</strong>${u.gone ? '' : `<span style="color:var(--faint);font-size:12px">@${escapeHtml(u.username)}</span>`}${dis}${btn}</span>`;
  }

  function dmThreadRow(t) {
    const c = document.createElement('div');
    c.className = 'panel fade-in-up';
    c.style.padding = '12px 14px'; c.style.boxShadow = 'none'; c.style.marginBottom = '10px';
    const unread = (Number(t.unread_a) || 0) + (Number(t.unread_b) || 0);
    c.innerHTML = `
      <div style="display:flex;gap:10px;align-items:flex-start;flex-wrap:wrap">
        <div style="flex:1;min-width:200px">
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            ${dmSideChip(t.a)}<span style="color:var(--faint)">↔</span>${dmSideChip(t.b)}
            ${t.blocked ? '<span class="badge" style="color:#fff;background:var(--danger)">已封禁</span>' : ''}
          </div>
          <div style="font-size:12.5px;color:var(--muted);margin-top:6px;word-break:break-word">${escapeHtml(truncate(t.last_preview || '（暂无消息）', 80))}</div>
          <div style="font-size:12px;color:var(--faint);margin-top:4px">
            最近消息 ${formatTime(t.last_message_at)} ｜ 未读 ${unread}${t.blocked && t.blocked_reason ? ' ｜ 封禁原因：' + escapeHtml(t.blocked_reason) : ''}
          </div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:6px">
            <span style="font-size:12px;color:var(--muted)">💞 续缘</span>
            ${t.bond
              ? (t.bond.tier
                ? `<span class="dm-bond bond-${escapeHtml(t.bond.tier)}"${/^#[0-9a-f]{6}$/i.test(t.bond.color || '') ? ` style="--bond-c:${t.bond.color}"` : ''}>${escapeHtml(t.bond.name)} ${t.bond.days} 天</span>`
                : `<span class="dm-bond bond-pending">未形成续缘</span><span style="font-size:12px;color:var(--faint)">已互聊 ${t.bond.days} 天 · 还差 ${t.bond.need} 天形成续缘</span>`)
              : '<span style="font-size:12px;color:var(--faint)">还没有互聊记录</span>'}
            <span style="display:inline-flex;gap:4px;align-items:center">
              <input class="input" data-bondnum="${t.id}" type="number" min="1" max="100000" step="1" value="30" title="要增加 / 减少的天数" style="width:76px">
              <button class="btn sm ghost" data-bondbump="${t.id}" data-sign="-1">− 减少</button>
              <button class="btn sm ghost" data-bondbump="${t.id}" data-sign="1">+ 增加</button>
            </span>
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <button class="btn sm" data-viewdm="${t.id}">👁 查看全文</button>
          ${t.blocked
            ? `<button class="btn sm ghost" data-unblockdm="${t.id}">🔓 解除封禁</button>`
            : `<button class="btn sm" style="background:var(--danger);border-color:var(--danger)" data-blockdm="${t.id}">🚫 封禁会话</button>`}
        </div>
      </div>`;
    c.querySelector(`[data-viewdm="${t.id}"]`).addEventListener('click', () => openDmThread(t.id));
    const bl = c.querySelector(`[data-blockdm="${t.id}"]`);
    if (bl) bl.addEventListener('click', async () => {
      const reason = prompt('请输入封禁原因（会展示给会话双方，必填）：', '');
      if (reason === null) return;
      if (!reason.trim()) { alert('封禁原因不能为空'); return; }
      bl.disabled = true;
      try { await callEdge('dm_admin_block', { thread_id: t.id, blocked: true, reason: reason.trim() }); loadDmAdmin(); }
      catch (e) { alert(e.message); bl.disabled = false; }
    });
    const ub = c.querySelector(`[data-unblockdm="${t.id}"]`);
    if (ub) ub.addEventListener('click', async () => {
      if (!confirm('确认解除该会话的封禁？')) return;
      ub.disabled = true;
      try { await callEdge('dm_admin_block', { thread_id: t.id, blocked: false }); loadDmAdmin(); }
      catch (e) { alert(e.message); ub.disabled = false; }
    });
    c.querySelectorAll('[data-dmuser]').forEach((b) => {
      b.addEventListener('click', async () => {
        const disabled = b.dataset.disabled === '1';
        if (!confirm(`确认${disabled ? '恢复' : '禁用'}该用户的私信功能？\n\n禁用后该用户既不能收发新私信，也不能在已有会话里发送。`)) return;
        b.disabled = true;
        try { await callEdge('dm_admin_user_dm', { user_id: b.dataset.dmuser, disabled: !disabled }); loadDmAdmin(); }
        catch (e) { alert(e.message); b.disabled = false; }
      });
    });
    // 续缘一键增减：先填天数再点「增加 / 减少」，留档会写明「给谁和谁加/减了多少天」
    const bondNum = c.querySelector('[data-bondnum]');
    c.querySelectorAll('[data-bondbump]').forEach((b) => {
      b.addEventListener('click', async () => {
        const n = Number(bondNum ? bondNum.value : 0);
        if (!Number.isInteger(n) || n <= 0 || n > 100000) {
          alert('请先填写要增加 / 减少的天数（1～100000 之间的整数）');
          if (bondNum) bondNum.focus();
          return;
        }
        const delta = (Number(b.dataset.sign) || 0) * n;
        const label = !t.bond
          ? '还没有互聊记录'
          : (t.bond.tier ? `${t.bond.name} ${t.bond.days} 天` : `未形成续缘（已互聊 ${t.bond.days} 天，还差 ${t.bond.need} 天）`);
        if (!confirm(`确认${delta > 0 ? '增加' : '减少'}这对用户的续缘 ${n} 天？\n\n当前：${label}\n减少到 0 天会退回到「未形成续缘」。`)) return;
        b.disabled = true;
        try { await callEdge('bond_admin_bump', { thread_id: b.dataset.bondbump, delta }); loadDmAdmin(); }
        catch (e) { alert(e.message); b.disabled = false; }
      });
    });
    return c;
  }

  // 会话全文（含已撤回消息的原文，仅管理员可见）
  // 默认载入最新一页，可「加载更早」一直翻到最早一条；每条消息都能单独删除
  let dmThreadState = { id: '', msgs: [], hasMore: false, oldest: '', users: null, loading: false };
  function dmThreadNameOf(u) { return (u && (u.nickname || u.username)) || '已注销用户'; }
  function renderDmThread() {
    const body = $('dmThreadBody');
    const st = dmThreadState;
    $('dmThreadTitle').textContent = `${dmThreadNameOf(st.users && st.users.a)} ↔ ${dmThreadNameOf(st.users && st.users.b)}（已载入 ${st.msgs.length} 条）`;
    if (!st.msgs.length) { body.innerHTML = '<div class="empty">该会话还没有消息</div>'; return; }
    const head = st.hasMore
      ? '<button class="btn sm ghost" data-dmmore style="margin:4px auto 10px;display:block">↑ 加载更早的消息</button>'
      : '<div style="text-align:center;color:var(--faint);font-size:12px;margin:4px 0 10px">已到最早一条</div>';
    body.innerHTML = head + st.msgs.map((m) => `
      <div style="padding:8px 0;border-bottom:1px dashed var(--line)">
        <div style="display:flex;gap:8px;align-items:center;font-size:12px;color:var(--muted);flex-wrap:wrap">
          <strong style="color:var(--text)">${escapeHtml(m.sender_nickname || '已注销用户')}</strong>
          ${m.recalled ? '<span class="badge" style="color:#fff;background:var(--warn)">已撤回</span>' : ''}
          ${m.blocked ? '<span class="badge" style="color:#fff;background:var(--danger)">已屏蔽</span>' : ''}
          <span style="margin-left:auto">${formatTime(m.created_at)}</span>
          <button class="btn sm ghost" data-dmdel="${m.id}" style="color:var(--danger)" title="删除这条私信">🗑 删除</button>
        </div>
        <div style="font-size:13.5px;line-height:1.65;white-space:pre-wrap;word-break:break-word;margin-top:3px;color:${m.recalled ? 'var(--faint)' : 'var(--text)'}">${escapeHtml(m.body || '（无正文）')}</div>
        ${m.recalled ? '<div style="font-size:11px;color:var(--faint);margin-top:2px">上方为撤回前原文，仅管理员可见</div>' : ''}
      </div>`).join('');
    const mb = body.querySelector('[data-dmmore]');
    if (mb) mb.addEventListener('click', () => loadDmThreadPage(true));
    body.querySelectorAll('[data-dmdel]').forEach((b) => b.addEventListener('click', () => delDmMessage(b.dataset.dmdel, b)));
  }
  async function loadDmThreadPage(older) {
    const st = dmThreadState;
    if (st.loading) return;
    st.loading = true;
    const mb = $('dmThreadBody').querySelector('[data-dmmore]');
    if (mb) { mb.disabled = true; mb.textContent = '加载中…'; }
    let d;
    try { d = await callEdge('dm_admin_messages', { thread_id: st.id, before: older ? st.oldest : '' }); }
    catch (e) { alert('加载失败：' + e.message); st.loading = false; renderDmThread(); return; }
    st.users = d.users || st.users;
    st.msgs = older ? [...(d.messages || []), ...st.msgs] : (d.messages || []);
    st.hasMore = !!d.has_more;
    st.oldest = d.oldest_at || st.oldest;
    st.loading = false;
    renderDmThread();
  }
  async function delDmMessage(id, btn) {
    if (!confirm('确认删除这条私信？\n\n删除后不可恢复，会话双方都看不到；留档会记录删除人与被删内容。')) return;
    btn.disabled = true;
    try { await callEdge('dm_admin_delete_message', { message_id: id }); }
    catch (e) { alert(e.message); btn.disabled = false; return; }
    dmThreadState.msgs = dmThreadState.msgs.filter((m) => m.id !== id);
    renderDmThread();
    loadDmAdmin();
  }
  async function openDmThread(threadId) {
    dmThreadState = { id: threadId, msgs: [], hasMore: false, oldest: '', users: null, loading: false };
    $('dmThreadTitle').textContent = '会话全文';
    $('dmThreadBody').innerHTML = '<div class="empty">加载中…</div>';
    $('dmThreadModal').classList.remove('hidden');
    await loadDmThreadPage(false);
  }

  $('dmSearchBtn').addEventListener('click', () => { dmKeyword = $('dmSearchQ').value.trim(); loadDmThreads(); });
  $('dmSearchQ').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('dmSearchBtn').click(); });
  $('dmRefresh').addEventListener('click', () => loadDmAdmin());
  $('dmThreadClose').addEventListener('click', () => $('dmThreadModal').classList.add('hidden'));

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
    $('changePwdBtn').style.display = profile?.isFounder ? 'none' : '';
    $('changePwdBtn').title = '修改自己的登录密码';
    const tags = [];
    const m = [
      ['can_block', '屏蔽'], ['can_delete', '删除/回收站'], ['can_gold', '金牌认证'], ['can_review', '内容审核'], ['can_pin', '顶置'], ['can_popup', '弹窗'],
      ['can_report', '举报管理'], ['can_view_audit', '审计查看'], ['can_blacklist', '黑名单管理'],
      ['can_notice', '公告管理'], ['can_bug', 'Bug回复'], ['can_topic', '话题管理'],
      ['can_ban', '用户封禁'], ['can_user_mgmt', '用户统一管理'], ['can_column', '专栏管理'], ['can_digest', '精华聚合'], ['can_mentor', '学长认证'], ['can_invite', '管理论坛邀请码'], ['can_del_log', '用户删除日志'], ['can_archive', '留档日志'], ['can_deviceban', '设备封禁'], ['can_daily', '每日运营'], ['can_dm', '私信管理'], ['can_qa', '问答管理'], ['can_trade', '失物招领'], ['can_badge', '成就徽章'], ['can_shop', '积分商城'], ['can_event', '活动中心']
    ];
    tags.push(...m.filter(([k]) => hasPerm(k)).map(([, l]) => `<span class="badge">${l}</span>`));
    $('permTags').innerHTML = tags.join(' ');
  }

  // ---------- 帖子管理 ----------
  function postFilterOptions() {
    $('postFilter').innerHTML = '<option value="">全部话题</option>' +
      TOPICS.map((t) => `<option>${t}</option>`).join('');
    if ($('qaTopic')) $('qaTopic').innerHTML = '<option value="">全部话题</option>' +
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

  // ---------- 专栏管理（独立标签页；can_column） ----------
  let colMgtStatus = '';
  let colMgtKeyword = '';
  async function loadColAdminMgmt() {
    const list = $('colAdminList');
    if (!list) return;
    list.innerHTML = '<div class="empty">加载中…</div>';
    try {
      const rows = await callEdge('column_admin_list', { status: colMgtStatus, keyword: colMgtKeyword });
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
  $('colKeyword').addEventListener('input', () => { colMgtKeyword = $('colKeyword').value.trim(); loadColAdminMgmt(); });
  $('colMgmtRefresh').addEventListener('click', loadColAdminMgmt);
  $('colAssignBtn').addEventListener('click', async () => {
    const uname = ($('colAssignUser').value || '').trim();
    if (!uname) { alert('请输入要指派的用户账号或昵称'); return; }
    if (!confirm(`确定为「${uname}」直接开通一个默认模板专栏吗？他将立即获得该专栏（不受等级限制）。`)) return;
    const btn = $('colAssignBtn'); btn.disabled = true;
    try {
      const r = await callEdge('column_assign', { username: uname });
      alert(r.message || '指派开通成功。');
      $('colAssignUser').value = '';
      loadColAdminMgmt();
    } catch (err) { alert(err.message); }
    finally { btn.disabled = false; }
  });

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

  // ---------- 内容审核（吃瓜 + 学习资料；can_review） ----------
  async function loadReview() {
    const data = await callEdge('list_posts', { topics: ['吃瓜', '学习资料'], page: 1, pageSize: 200 });
    const pending = (data || []).filter((p) => !p.blocked);   // 已屏蔽的不在列表内
    const list = $('reviewList');
    list.innerHTML = '';
    if (!pending.length) { list.innerHTML = '<div class="empty">暂无待审核内容</div>'; return; }
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
          <strong>${escapeHtml(p.nickname || '匿名')}</strong>
          <span class="badge topic">${escapeHtml(p.topic || '')}</span>
          ${stateTag}
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

  // ---------- 问答管理（can_qa） ----------
  //   管理员可强制结贴（代设最佳答案）与撤销最佳答案；撤销会扣回答主 15 经验，全部写审计。
  async function loadQa() {
    const scope = $('qaScope').value;
    const keyword = $('qaKeyword').value.trim();
    const payload = { page: 1, pageSize: 200, ask_only: true };
    if (scope === 'unresolved') payload.unresolved_only = true;
    else if (scope === 'resolved') payload.resolved = true;
    const topic = $('qaTopic').value; if (topic) payload.topic = topic;
    const from = $('qaFrom').value; if (from) payload.from = from;
    const to = $('qaTo').value; if (to) payload.to = to + 'T23:59:59';
    if (keyword) payload.keyword = keyword;
    const list = $('qaList');
    list.innerHTML = '<div class="empty">加载中…</div>';
    let data = [];
    try { data = await callEdge('list_posts', payload) || []; }
    catch (e) { list.innerHTML = `<div class="empty">加载失败：${escapeHtml(e.message)}</div>`; return; }
    list.innerHTML = '';
    if (!data.length) { list.innerHTML = '<div class="empty">没有符合条件的求助帖</div>'; return; }
    data.forEach((p) => list.appendChild(qaCard(p)));
  }
  function qaCard(p) {
    const resolved = !!p.resolved;
    const card = document.createElement('div');
    card.className = 'panel fade-in-up';
    card.style.padding = '14px 16px';
    card.style.boxShadow = 'none';
    card.style.marginBottom = '10px';
    card.innerHTML = `
      <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px;flex-wrap:wrap">
        <strong>${escapeHtml(p.nickname || '匿名')}</strong>
        <span class="badge topic">${escapeHtml(p.topic || '')}</span>
        ${resolved
          ? '<span class="badge" style="color:#fff;background:#22c55e">已解决</span>'
          : '<span class="badge" style="color:#fff;background:var(--warn)">求助中</span>'}
        <span style="margin-left:auto;color:var(--faint);font-size:12px">${formatTime(p.created_at)}</span>
      </div>
      <div style="color:var(--text);font-size:14px;line-height:1.7;white-space:pre-wrap;margin-bottom:8px">${escapeHtml(truncate(p.content, 400))}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn sm ghost" data-qa="answers">查看答案</button>
        ${resolved ? '<button class="btn sm danger" data-qa="unset">撤销最佳答案</button>' : ''}
      </div>
      <div data-qa-answers class="hidden" style="border-top:1px dashed var(--line);margin-top:10px;padding-top:8px"></div>`;
    const box = card.querySelector('[data-qa-answers]');
    card.querySelector('[data-qa="answers"]').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      if (!box.classList.contains('hidden')) { box.classList.add('hidden'); btn.textContent = '查看答案'; return; }
      box.classList.remove('hidden');
      btn.textContent = '收起答案';
      box.innerHTML = '<div class="empty" style="padding:8px">加载中…</div>';
      let cmts = [];
      try { cmts = await callEdge('admin_post_comments', { post_id: p.id }) || []; }
      catch (err) { box.innerHTML = `<div class="empty" style="padding:8px">加载失败：${escapeHtml(err.message)}</div>`; return; }
      if (!cmts.length) { box.innerHTML = '<div class="empty" style="padding:8px">该帖暂无评论</div>'; return; }
      box.innerHTML = '';
      cmts.forEach((c) => {
        const isBest = !!(p.best_comment_id && c.id === p.best_comment_id);
        const isOwnerCmt = c.author_id && p.author_id && c.author_id === p.author_id;
        const row = document.createElement('div');
        row.style.cssText = 'padding:8px 0;border-bottom:1px dashed var(--line)';
        row.innerHTML = `
          <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;font-size:12px;color:var(--muted)">
            <strong>${escapeHtml(c.nickname || '匿名')}</strong>
            ${isBest ? '<span class="badge" style="color:#fff;background:#22c55e">最佳答案</span>' : ''}
            ${isOwnerCmt ? '<span class="badge topic">楼主评论</span>' : ''}
            ${c.blocked ? '<span class="badge" style="color:#fff;background:#8a8a8a">已屏蔽</span>' : ''}
            <span style="margin-left:auto">${formatTime(c.created_at)}</span>
          </div>
          <div style="color:var(--text);font-size:13.5px;line-height:1.6;white-space:pre-wrap;margin:4px 0 6px">${escapeHtml(c.content)}</div>
          ${(!c.blocked && !isOwnerCmt && !isBest) ? `<button class="btn sm ghost" data-best="${c.id}">设为最佳答案</button>` : ''}`;
        const bb = row.querySelector('[data-best]');
        if (bb) bb.addEventListener('click', async () => {
          if (!confirm('确认把该评论设为最佳答案？答主将获得 15 经验；若已有最佳答案会先撤销旧的。')) return;
          bb.disabled = true;
          try {
            await callEdge('qa_admin_set_best', { post_id: p.id, comment_id: c.id });
            alert('✅ 已设为最佳答案');
            loadQa();
          } catch (err) { alert(err.message); bb.disabled = false; }
        });
        box.appendChild(row);
      });
    });
    const unsetBtn = card.querySelector('[data-qa="unset"]');
    if (unsetBtn) unsetBtn.addEventListener('click', async () => {
      if (!confirm('确认撤销该帖的最佳答案？将扣回答主 15 经验，帖子回到「求助中」。')) return;
      unsetBtn.disabled = true;
      try {
        await callEdge('qa_admin_unresolve', { post_id: p.id });
        alert('已撤销最佳答案');
        loadQa();
      } catch (err) { alert(err.message); unsetBtn.disabled = false; }
    });
    return card;
  }
  $('qaRefresh').addEventListener('click', loadQa);
  $('qaScope').addEventListener('change', loadQa);
  $('qaTopic').addEventListener('change', loadQa);
  $('qaFrom').addEventListener('change', loadQa);
  $('qaTo').addEventListener('change', loadQa);
  $('qaKeyword').addEventListener('keydown', (e) => { if (e.key === 'Enter') loadQa(); });

  // ---------- 学习资料 · 学科管理（can_digest） ----------
  async function loadStudy() {
    const list = $('subjList');
    list.innerHTML = '<div class="empty">加载中…</div>';
    let data = [];
    try { data = await callEdge('admin_subject_list', {}) || []; }
    catch (e) { list.innerHTML = `<div class="empty">加载失败：${escapeHtml(e.message)}</div>`; return; }
    list.innerHTML = '';
    if (!data.length) { list.innerHTML = '<div class="empty">还没有学科，请先在上方新增。</div>'; return; }
    data.forEach((s) => {
      const count = Number(s.post_count) || 0;
      const c = document.createElement('div');
      c.className = 'panel fade-in-up';
      c.style.padding = '12px 14px';
      c.style.boxShadow = 'none';
      c.style.marginBottom = '8px';
      c.innerHTML = `
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <input class="input" data-f="name" value="${escapeHtml(s.name)}" style="width:170px" title="学科名称（唯一）" />
          <input class="input" data-f="display_name" value="${escapeHtml(s.display_name || s.name)}" style="width:150px" title="显示名" />
          <input class="input" type="number" data-f="sort" value="${Number(s.sort) || 0}" style="width:80px" title="排序（越小越靠前）" />
          <label style="display:inline-flex;align-items:center;gap:4px;font-size:13px;color:var(--muted)"><input type="checkbox" data-f="enabled" ${s.enabled ? 'checked' : ''} /> 启用</label>
          <span class="badge">在用资料帖 ${count}</span>
          ${s.enabled ? '' : '<span class="badge" style="color:#fff;background:#8a8a8a">已停用</span>'}
          <span style="margin-left:auto;display:flex;gap:6px">
            <button class="btn sm" data-save="${s.id}">保存</button>
            <button class="btn sm danger" data-del="${s.id}">删除</button>
          </span>
        </div>`;
      const read = (f) => c.querySelector(`[data-f="${f}"]`);
      c.querySelector('[data-save]').addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        btn.disabled = true;
        try {
          await callEdge('admin_subject_update', {
            id: s.id,
            name: read('name').value.trim(),
            display_name: read('display_name').value.trim(),
            sort: Number(read('sort').value) || 0,
            enabled: read('enabled').checked
          });
          loadStudy();
        } catch (err) { alert(err.message); btn.disabled = false; }
      });
      c.querySelector('[data-del]').addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        if (count > 0) { alert(`该学科下仍有 ${count} 篇资料帖，请改为「停用」而不是删除。`); return; }
        if (!confirm(`确定删除学科「${s.name}」？`)) return;
        btn.disabled = true;
        try { await callEdge('admin_subject_delete', { id: s.id, name: s.name }); loadStudy(); }
        catch (err) { alert(err.message); btn.disabled = false; }
      });
      list.appendChild(c);
    });
  }
  $('studyRefresh').addEventListener('click', loadStudy);
  $('subjCreateBtn').addEventListener('click', async () => {
    const name = $('subjName').value.trim();
    if (!name) { alert('请填写学科名称'); return; }
    const btn = $('subjCreateBtn');
    btn.disabled = true;
    try {
      await callEdge('admin_subject_create', {
        name,
        display_name: $('subjDisplay').value.trim(),
        sort: Number($('subjSort').value) || 0,
        enabled: $('subjEnabled').checked
      });
      $('subjName').value = ''; $('subjDisplay').value = ''; $('subjSort').value = '0'; $('subjEnabled').checked = true;
      loadStudy();
    } catch (e) { alert(e.message); }
    btn.disabled = false;
  });

  // ---------- 失物招领管理（can_trade） ----------
  const TRADE_LABELS = { ongoing: '进行中', found: '已找到', lost: '已失效' };
  async function loadTrade() {
    const payload = { topic: '失物招领', page: 1, pageSize: 200 };
    const st = $('tradeStatusFilter').value; if (st) payload.trade_status = st;
    const kw = $('tradeKeyword').value.trim(); if (kw) payload.keyword = kw;
    const from = $('tradeFrom').value; if (from) payload.from = from;
    const to = $('tradeTo').value; if (to) payload.to = to + 'T23:59:59';
    const list = $('tradeList');
    list.innerHTML = '<div class="empty">加载中…</div>';
    let data = [];
    try { data = await callEdge('list_posts', payload) || []; }
    catch (e) { list.innerHTML = `<div class="empty">加载失败：${escapeHtml(e.message)}</div>`; return; }
    list.innerHTML = '';
    if (!data.length) { list.innerHTML = '<div class="empty">没有符合条件的失物招领帖</div>'; return; }
    data.forEach((p) => {
      const st2 = p.trade_status || 'ongoing';
      const card = document.createElement('div');
      card.className = 'panel fade-in-up';
      card.style.padding = '14px 16px';
      card.style.boxShadow = 'none';
      card.style.marginBottom = '10px';
      card.innerHTML = `
        <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px;flex-wrap:wrap">
          <strong>${escapeHtml(p.nickname || '匿名')}</strong>
          <span class="badge topic">${escapeHtml(TRADE_LABELS[st2] || st2)}</span>
          ${p.blocked ? '<span class="badge" style="color:#fff;background:var(--danger)">已屏蔽</span>' : ''}
          <span style="margin-left:auto;color:var(--faint);font-size:12px">${formatTime(p.created_at)}</span>
        </div>
        <div style="color:var(--text);font-size:14px;line-height:1.7;white-space:pre-wrap;margin-bottom:10px">${escapeHtml(truncate(p.content, 400))}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
          <span style="font-size:12px;color:var(--muted)">强制改状态：</span>
          ${['ongoing', 'found', 'lost'].map((s) => `<button class="btn sm ${s === st2 ? '' : 'ghost'}" data-set="${s}" data-id="${p.id}">${TRADE_LABELS[s]}</button>`).join('')}
        </div>`;
      card.querySelectorAll('[data-set]').forEach((b) => {
        b.addEventListener('click', async () => {
          if (b.dataset.set === st2) return;
          if (!confirm(`确认把该帖状态改为「${TRADE_LABELS[b.dataset.set]}」？`)) return;
          b.disabled = true;
          try { await callEdge('admin_trade_set_status', { post_id: p.id, status: b.dataset.set }); loadTrade(); }
          catch (err) { alert(err.message); b.disabled = false; }
        });
      });
      list.appendChild(card);
    });
  }
  $('tradeRefresh').addEventListener('click', loadTrade);
  $('tradeStatusFilter').addEventListener('change', loadTrade);
  $('tradeFrom').addEventListener('change', loadTrade);
  $('tradeTo').addEventListener('change', loadTrade);
  $('tradeKeyword').addEventListener('keydown', (e) => { if (e.key === 'Enter') loadTrade(); });
  $('tradeArchiveBtn').addEventListener('click', async () => {
    if (!confirm('确认归档发布满 60 天且仍为「进行中」的失物招领帖？帖子将移入回收站，可恢复。')) return;
    const btn = $('tradeArchiveBtn');
    btn.disabled = true;
    try {
      const r = await callEdge('admin_trade_archive', { days: 60 });
      alert(`✅ 已归档 ${Number(r && r.archived) || 0} 条过期失物招领帖`);
      loadTrade();
    } catch (e) { alert(e.message); }
    btn.disabled = false;
  });

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

  // ---------- 每日运营 ----------
  let dailyQuestEditingId = null;
  // 补发面板的用户选择：输入即匹配，点选后精确绑定用户 id（重名也能选对人）
  let dailyGrantUserId = '';
  function attachUserPicker(input, onPick) {
    if (!input || input.__xddPickerBound) return;
    input.__xddPickerBound = true;
    let drop = null, items = [], idx = -1, timer = null;
    // 注意：渲染下拉时只能移除旧节点，不能清空 items —— 否则候选会被自己清掉，下拉框一片空白
    const closeDrop = () => { if (drop) { drop.remove(); drop = null; } };
    const reset = () => { closeDrop(); items = []; idx = -1; };
    const paint = () => { if (drop) drop.querySelectorAll('.mn-item').forEach((n, i) => n.classList.toggle('active', i === idx)); };
    const pick = (u) => {
      if (!u) return;
      input.value = u.nickname;
      reset();
      onPick(u);
    };
    const place = (node) => {
      const r = input.getBoundingClientRect();
      const h = node.offsetHeight;
      node.style.left = Math.max(8, Math.min(r.left, window.innerWidth - node.offsetWidth - 8)) + 'px';
      node.style.top = (window.innerHeight - r.bottom < h + 12 && r.top > h + 12 ? r.top - h - 4 : r.bottom + 4) + 'px';
    };
    const open = (list) => {
      closeDrop();
      drop = document.createElement('div');
      drop.className = 'mention-drop';
      drop.innerHTML = list.map((u, i) => `<div class="mn-item${i === 0 ? ' active' : ''}" data-i="${i}"><span class="mn-nick">${escapeHtml(u.nickname)}</span><span class="mn-lv">Lv.${Number(u.level) || 0}</span></div>`).join('');
      document.body.appendChild(drop);
      place(drop);
      drop.addEventListener('mousedown', (e) => {
        const it = e.target.closest('.mn-item');
        if (!it) return;
        e.preventDefault();                 // 保住输入框焦点
        pick(list[Number(it.dataset.i)]);
      });
    };
    const openEmpty = (kw) => {
      closeDrop();
      drop = document.createElement('div');
      drop.className = 'mention-drop';
      drop.innerHTML = `<div class="mn-item" style="color:var(--faint);cursor:default">没有匹配「${escapeHtml(kw)}」的用户</div>`;
      document.body.appendChild(drop);
      place(drop);
    };
    input.addEventListener('input', () => {
      onPick(null);                          // 手改过就作废上一次的选中，避免用错人
      const kw = input.value.trim();
      if (timer) { clearTimeout(timer); timer = null; }
      if (!kw) { reset(); return; }
      timer = setTimeout(async () => {
        timer = null;
        if (input.value.trim() !== kw) return;
        let list = [];
        try { list = (await callEdge('admin_daily_user_search', { keyword: kw })) || []; }
        catch (_e) { list = []; }
        if (!Array.isArray(list)) list = list.list || [];   // 兼容 { list: [...] } 形态
        if (input.value.trim() !== kw) return;              // 期间又改了输入：丢弃这次结果
        items = list;
        idx = list.length ? 0 : -1;
        if (!list.length) { openEmpty(kw); return; }
        open(list);
      }, 200);
    });
    input.addEventListener('keydown', (e) => {
      if (!drop || !items.length) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); idx = (idx + 1) % items.length; paint(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); idx = (idx - 1 + items.length) % items.length; paint(); }
      else if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); pick(items[idx]); }
      else if (e.key === 'Escape') { e.preventDefault(); reset(); }
    });
    input.addEventListener('blur', () => setTimeout(() => { if (drop) reset(); }, 120));
  }
  async function loadDailyOps() {
    const cfg = await callEdge('daily_config_get', {});
    $('dailyCoinCap').value = cfg.coinCap; $('dailyXpCap').value = cfg.xpCap; $('comebackXp').value = cfg.comebackXp; $('comebackCoins').value = cfg.comebackCoins;
    const quests = await callEdge('admin_quest_defs_list', {}); const qbox = $('dailyQuestList');
    $('dailyGrantQuest').innerHTML = (quests || []).map((q) => `<option value="${q.id}">${escapeHtml(q.title)}</option>`).join('');
    qbox.innerHTML = (quests || []).map((q) => `<div class="panel" style="box-shadow:none;padding:10px 12px;margin-bottom:8px"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><b>${escapeHtml(q.title)}</b><span class="badge topic">${escapeHtml(q.qkey)}</span><span style="color:var(--faint);font-size:12px">目标 ${q.target} · +${q.coin_reward} 积分 · +${q.xp_reward} 经验</span><span style="margin-left:auto;color:${q.enabled ? 'var(--ok)' : 'var(--faint)'}">${q.enabled ? '启用' : '停用'}</span><button class="btn sm ghost" data-qedit="${q.id}">编辑</button>${q.enabled ? `<button class="btn sm ghost" data-qdisable="${q.id}">停用</button>` : `<button class="btn sm ghost" data-qenable="${q.id}">启用</button>`}<button class="btn sm danger" data-qdelete="${q.id}">删除</button></div><div style="color:var(--muted);font-size:12px;margin-top:5px">${escapeHtml(q.description || '')}</div></div>`).join('') || '<div class="empty">暂无任务定义</div>';
    qbox.querySelectorAll('[data-qedit]').forEach((b) => b.addEventListener('click', () => { const q = quests.find((x) => x.id === b.dataset.qedit); if (!q) return; dailyQuestEditingId = q.id; $('dailyQuestKey').value = q.qkey; $('dailyQuestTitle').value = q.title; $('dailyQuestDesc').value = q.description || ''; $('dailyQuestTarget').value = q.target; $('dailyQuestCoins').value = q.coin_reward; $('dailyQuestXp').value = q.xp_reward; $('dailyQuestEnabled').checked = !!q.enabled; $('dailyQuestFormTitle').textContent = '编辑任务'; }));
    qbox.querySelectorAll('[data-qdisable]').forEach((b) => b.addEventListener('click', async () => { try { await callEdge('admin_quest_defs_disable', { id: b.dataset.qdisable }); await loadDailyOps(); } catch (e) { alert(e.message); } }));
    qbox.querySelectorAll('[data-qenable]').forEach((b) => b.addEventListener('click', async () => { try { await callEdge('admin_quest_defs_enable', { id: b.dataset.qenable }); await loadDailyOps(); } catch (e) { alert(e.message); } }));
    qbox.querySelectorAll('[data-qdelete]').forEach((b) => b.addEventListener('click', async () => { if (!confirm('确认删除任务定义？')) return; try { await callEdge('admin_quest_defs_delete', { id: b.dataset.qdelete }); loadDailyOps(); } catch (e) { alert(e.message); } }));
    const topics = await callEdge('admin_daily_topic_list', {}); const tbox = $('dailyTopicList');
    tbox.innerHTML = (topics || []).map((t) => `<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:8px 0;border-bottom:1px dashed var(--line)"><b>${escapeHtml(t.topic_date)}</b><span>${escapeHtml(t.title)}</span><span style="color:var(--faint);font-size:12px">+${t.coin_reward} 积分 · +${t.xp_reward} 经验</span><span style="margin-left:auto;color:${t.enabled ? 'var(--ok)' : 'var(--faint)'}">${t.enabled ? '启用' : '停用'}</span><button class="btn sm ghost" data-tedit="${t.id}">编辑</button>${t.enabled ? `<button class="btn sm ghost" data-tdisable="${t.id}">停用</button>` : `<button class="btn sm ghost" data-tenable="${t.id}">启用</button>`}<button class="btn sm danger" data-tdelete="${t.id}">删除</button></div>`).join('') || '<div class="empty">暂无每日话题</div>';
    tbox.querySelectorAll('[data-tedit]').forEach((b) => b.addEventListener('click', () => { const t = topics.find((x) => x.id === b.dataset.tedit); if (!t) return; $('dailyTopicDate').value = t.topic_date; $('dailyTopicTitle').value = t.title; $('dailyTopicIntro').value = t.intro || ''; $('dailyTopicCoins').value = t.coin_reward; $('dailyTopicXp').value = t.xp_reward; $('dailyTopicEnabled').checked = !!t.enabled; $('dailyTopicDate').scrollIntoView({ behavior: 'smooth', block: 'center' }); }));
    tbox.querySelectorAll('[data-tdisable]').forEach((b) => b.addEventListener('click', async () => { try { await callEdge('admin_daily_topic_disable', { id: b.dataset.tdisable }); await loadDailyOps(); } catch (e) { alert(e.message); } }));
    tbox.querySelectorAll('[data-tenable]').forEach((b) => b.addEventListener('click', async () => { try { await callEdge('admin_daily_topic_enable', { id: b.dataset.tenable }); await loadDailyOps(); } catch (e) { alert(e.message); } }));
    tbox.querySelectorAll('[data-tdelete]').forEach((b) => b.addEventListener('click', async () => { if (!confirm('确认删除每日话题？')) return; try { await callEdge('admin_daily_topic_delete', { id: b.dataset.tdelete }); loadDailyOps(); } catch (e) { alert(e.message); } }));
  }
  $('dailyRefresh')?.addEventListener('click', loadDailyOps);
  attachUserPicker($('dailyGrantUser'), (u) => { dailyGrantUserId = u ? u.id : ''; });
  $('dailyStatsLoad')?.addEventListener('click', async () => { try { const rows = await callEdge('admin_quest_stats', { day: $('dailyStatsDay').value }); $('dailyStatsList').innerHTML = rows.length ? rows.map((r) => `<div class="pc-row">${escapeHtml(r.title)} · 参与 ${r.users} · 完成 ${r.completed} · 已领取 ${r.claimed}</div>`).join('') : '<div class="empty">该日暂无任务进度</div>'; } catch (e) { alert(e.message); } });
  $('dailyGrantSave')?.addEventListener('click', async () => { if (!confirm('确认补发一次任务奖励？相同用户、任务、日期不可重复补发。')) return; try { const r = await callEdge('admin_quest_grant', { user_id: dailyGrantUserId || undefined, user_query: $('dailyGrantUser').value.trim(), quest_id: $('dailyGrantQuest').value, day: $('dailyStatsDay').value, coin_reward: Number($('dailyGrantCoins').value), xp_reward: Number($('dailyGrantXp').value) }); alert(r.duplicate ? '该任务奖励已补发过' : `补发成功：+${r.coins} 积分、+${r.xp} 经验`); } catch (e) { alert(e.message); } });
  $('dailyConfigSave')?.addEventListener('click', async () => { try { await callEdge('daily_config_set', { daily_coin_cap: Number($('dailyCoinCap').value), daily_xp_cap: Number($('dailyXpCap').value), comeback_xp: Number($('comebackXp').value), comeback_coins: Number($('comebackCoins').value) }); $('dailyConfigMsg').textContent = '已保存'; } catch (e) { $('dailyConfigMsg').textContent = e.message; } });
  $('dailyQuestSave')?.addEventListener('click', async () => { const qkey = $('dailyQuestKey').value; if (!qkey) { alert('请先选择任务标识'); return; } try { await callEdge(dailyQuestEditingId ? 'admin_quest_defs_update' : 'admin_quest_defs_create', { id: dailyQuestEditingId || undefined, qkey, title: $('dailyQuestTitle').value, description: $('dailyQuestDesc').value, target: Number($('dailyQuestTarget').value), coin_reward: Number($('dailyQuestCoins').value), xp_reward: Number($('dailyQuestXp').value), enabled: $('dailyQuestEnabled').checked }); dailyQuestEditingId = null; $('dailyQuestFormTitle').textContent = '新建任务'; ['dailyQuestKey','dailyQuestTitle','dailyQuestDesc','dailyQuestTarget','dailyQuestCoins','dailyQuestXp'].forEach((id) => $(id).value = ''); loadDailyOps(); } catch (e) { alert(e.message); } });
  $('dailyTopicSave')?.addEventListener('click', async () => { try { await callEdge('admin_daily_topic_save', { topic_date: $('dailyTopicDate').value, title: $('dailyTopicTitle').value, intro: $('dailyTopicIntro').value, coin_reward: Number($('dailyTopicCoins').value), xp_reward: Number($('dailyTopicXp').value), enabled: $('dailyTopicEnabled').checked }); alert('每日话题已保存'); loadDailyOps(); } catch (e) { alert(e.message); } });

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
          ${t.reverted_at && !t.is_permanent ? '<span class="badge" style="color:#fff;background:#b8860b">已转回 · 96h 倒计时</span>' : ''}
          ${t.reverted_at && !t.is_permanent && t.post_count > 10 ? '<span class="badge" style="color:#fff;background:#2e8b57">可再次转正</span>' : ''}
          <span style="font-size:13px;color:var(--muted)">${t.post_count} 帖</span>
          <span style="font-size:12px;color:var(--faint)">创建者：${escapeHtml(t.created_by)}</span>
          ${t.is_permanent ? '' : `<span style="font-size:12px;color:var(--faint)">到期：${formatTime(t.expires_at)}${t.reverted_at ? '（96h 倒计时，超 10 帖可再次转正）' : ''}</span>`}
          <span style="margin-left:auto;display:flex;gap:6px">
            ${t.is_permanent ? `<button class="btn sm ghost" data-rev="${t.id}">⏪ 转回自定义话题</button>` : `<button class="btn sm ghost" data-prom="${t.id}">⬆️ 立刻转正</button>`}
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
        const reverted = !!t.reverted_at;
        if (reverted && t.post_count <= 10) {
          alert(`话题「${t.display_name}」已转回自定义话题，需在 96 小时内发布超过 10 帖才可再次转正（当前 ${t.post_count} 帖）。`);
          return;
        }
        if (!confirm(`确认将话题「${t.display_name}」立刻转正为永久话题？转正后不再过期、可被用作认证话题。`)) return;
        el.currentTarget.disabled = true;
        try { await callEdge('topic_promote', { topic_id: t.id }); loadTopicsAdmin(); }
        catch (err) { alert(err.message); el.currentTarget.disabled = false; }
      });
      c.querySelector('[data-rev]')?.addEventListener('click', async (el) => {
        if (!confirm(`确认将永久话题「${t.display_name}」转回自定义话题？\n转回后进入 96 小时倒计时；96 小时内发布超过 10 帖可再次转正，否则到期后该话题及帖子将被清理。`)) return;
        el.currentTarget.disabled = true;
        try { await callEdge('topic_revert', { topic_id: t.id }); loadTopicsAdmin(); }
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
        ['can_block', '屏蔽'], ['can_delete', '删除/回收站'], ['can_gold', '金牌认证'], ['can_review', '内容审核'], ['can_pin', '顶置'], ['can_popup', '弹窗'],
        ['can_report', '举报管理'], ['can_view_audit', '审计查看'], ['can_blacklist', '黑名单管理'],
      ['can_notice', '公告管理'], ['can_bug', 'Bug回复'], ['can_topic', '话题管理'],
        ['can_ban', '用户封禁'], ['can_user_mgmt', '用户统一管理'], ['can_column', '专栏管理'], ['can_digest', '精华聚合'], ['can_mentor', '学长认证'], ['can_invite', '管理论坛邀请码'], ['can_del_log', '用户删除日志'], ['can_archive', '留档日志'], ['can_deviceban', '设备封禁'], ['can_daily', '每日运营'], ['can_dm', '私信管理'], ['can_qa', '问答管理'], ['can_trade', '失物招领'], ['can_badge', '成就徽章'], ['can_shop', '积分商城'], ['can_event', '活动中心']
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

  // ================= 第四期：成就徽章管理（can_badge） =================
  let badgeEditingId = null;
  let badgeGrantUserId = '';
  let badgeCache = [];
  let badgeFx = null;           // 当前徽章特效配置（配置器实时回写）
  let badgeFxApi = null;
  let shopFx = null;            // 当前商品特效配置
  let shopFxApi = null;
  const BADGE_RULE_LABELS = { post: '发帖数', comment: '评论数', like_received: '获赞数', digest: '精华数', legend: '校史编号', best_answer: '最佳答案数', checkin_streak: '连续签到天数', event_win: '活动获奖次数' };
  const DUR_LABELS = { forever: '永久', day: '天', week: '周', month: '月', year: '年' };

  // 内置特效引擎（public/effects.js）；缺失时降级为「仅提示」，不阻塞后台其他功能
  const FX = () => (window.XddFx || null);
  function fxBlank(kind) { const F = FX(); return F ? F.blank(kind) : null; }
  // 挂载可视化配置器：下拉框 + 取色器 + 实时预览 + 组合数校验
  function mountFx(hostId, kind, cfg, onSet) {
    const host = $(hostId);
    if (!host) return;
    const F = FX();
    if (!F) { host.innerHTML = '<div class="fxcfg-hint">特效引擎未加载（public/effects.js），请检查静态资源。</div>'; return; }
    onSet(F.normalize(kind, cfg));
    F.mountConfigurator(host, kind, cfg, (next) => onSet(next));
  }
  // 特效配置的中文摘要（列表展示用）
  function fxSummary(kind, cfg) {
    const F = FX();
    if (!F || !cfg) return '';
    try { return F.summary(kind, cfg); } catch (_e) { return ''; }
  }
  // 内联渲染特效预览 HTML（列表缩略图用）
  function fxPreviewHtml(kind, cfg) {
    const F = FX();
    if (!F || !cfg || F.kinds().indexOf(kind) < 0) return '';
    try {
      const c = F.normalize(kind, cfg);
      if (kind === 'badge') return F.badgeHtml(c, 'lg');
      if (kind === 'title') return F.titleHtml(c);
      return F.previewHtml(kind, c);
    } catch (_e) { return ''; }
  }

  // 活动配置可视化表单（public/event-cfg.js）；缺失时降级为提示，不阻塞后台其他功能
  const EC = () => (window.XddEventCfg || null);
  let eventRuleEditor = null;     // 玩法细则编辑器
  let eventRewardEditor = null;   // 奖励配置编辑器（抽奖奖品 / 排行名次奖励）
  let eventRewardMode = null;     // 奖励编辑器当前对应的玩法，用于判断切换玩法时能否沿用已填内容
  async function ensureEventBadges() {
    if (badgeCache && badgeCache.length) return badgeCache;
    try { badgeCache = (await callEdge('admin_badge_list', {})) || []; } catch (_e) { badgeCache = []; }
    return badgeCache;
  }
  // 按玩法挂载「玩法细则 + 奖励配置」两张可视化表单
  async function renderEventForm(mode, ruleCfg, rewardCfg) {
    const E = EC();
    const ruleHost = $('eventRuleCfgHost'), rewardHost = $('eventRewardCfgHost');
    if (!ruleHost || !rewardHost) return;
    if (!E) {
      const hint = '<div class="fxcfg-hint">活动配置模块未加载（public/event-cfg.js），请检查静态资源。</div>';
      ruleHost.innerHTML = hint; rewardHost.innerHTML = hint;
      eventRuleEditor = null; eventRewardEditor = null; eventRewardMode = null;
      return;
    }
    E.setBadges(await ensureEventBadges());
    eventRuleEditor = E.rules(ruleHost, ruleCfg, null);
    eventRewardEditor = E.reward(rewardHost, mode, rewardCfg, null);
    eventRewardMode = mode;
  }

  function durText(t, d) { return t === 'forever' ? '永久' : `${Number(d) || 0} ${DUR_LABELS[t] || t}`; }
  function badgeRuleText(r) { return (!r || !r.type) ? '—' : `${BADGE_RULE_LABELS[r.type] || r.type} ≥ ${Number(r.count) || 1}`; }
  function badgeSyncSource() {
    const auto = $('badgeSource').value === 'auto';
    $('badgeRuleTypeWrap').style.display = auto ? '' : 'none';
    $('badgeRuleCountWrap').style.display = auto ? '' : 'none';
  }
  function badgeResetForm() {
    badgeEditingId = null;
    ['badgeName', 'badgeDesc', 'badgeHint'].forEach((id) => { const el = $(id); if (el) el.value = ''; });
    $('badgeSource').value = 'auto'; $('badgeDurType').value = 'forever'; $('badgeDurDays').value = '0';
    $('badgeRuleType').value = 'post'; $('badgeRuleCount').value = '1'; $('badgeSort').value = '0';
    $('badgeEnabled').checked = true;
    $('badgeFormTitle').textContent = '新建徽章';
    $('badgeCancel').classList.add('hidden');
    badgeSyncSource();
    mountFx('badgeFxHost', 'badge', fxBlank('badge'), (c) => { badgeFx = c; });
  }
  async function loadBadgeAdmin() {
    const list = (await callEdge('admin_badge_list', {})) || [];
    badgeCache = list;
    $('badgeGrantBadge').innerHTML = list.map((b) => `<option value="${b.id}">${escapeHtml(b.name)}${b.enabled ? '' : '（已停用）'}</option>`).join('');
    const box = $('badgeList');
    box.innerHTML = list.map((b) => `<div class="panel" style="box-shadow:none;padding:10px 12px;margin-bottom:8px">
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <span class="fx-list-ico">${fxPreviewHtml('badge', b.effect) || '🏅'}</span>
        <b>${escapeHtml(b.name)}</b>
        <span class="badge topic">${b.source === 'auto' ? '自动' : '手动'}</span>
        <span style="color:var(--faint);font-size:12px">${b.source === 'auto' ? escapeHtml(badgeRuleText(b.rule)) : '手动授予'} · ${durText(b.duration_type, b.duration_days)} · 已授予 ${b.granted_count}</span>
        <span style="margin-left:auto;color:${b.enabled ? 'var(--ok)' : 'var(--faint)'}">${b.enabled ? '启用' : '停用'}</span>
        <button class="btn sm ghost" data-bedit="${b.id}">编辑</button>
        <button class="btn sm ghost" data-btoggle="${b.id}" data-benabled="${b.enabled ? '1' : '0'}">${b.enabled ? '停用' : '启用'}</button>
        <button class="btn sm danger" data-bdel="${b.id}">删除</button>
      </div>
      <div style="color:var(--muted);font-size:12px;margin-top:5px">${escapeHtml(b.description || '')}${b.obtain_hint ? ` · 提示：${escapeHtml(b.obtain_hint)}` : ''}</div>
      ${b.effect ? `<div style="color:var(--faint);font-size:11px;margin-top:4px">🎨 ${escapeHtml(fxSummary('badge', b.effect))}</div>` : ''}
    </div>`).join('') || '<div class="empty">暂无徽章定义</div>';
    box.querySelectorAll('[data-bedit]').forEach((btn) => btn.addEventListener('click', () => {
      const b = badgeCache.find((x) => x.id === btn.dataset.bedit); if (!b) return;
      badgeEditingId = b.id;
      $('badgeName').value = b.name;
      $('badgeDesc').value = b.description || ''; $('badgeHint').value = b.obtain_hint || '';
      $('badgeSource').value = b.source; $('badgeDurType').value = b.duration_type; $('badgeDurDays').value = b.duration_days;
      $('badgeRuleType').value = b.rule?.type || 'post'; $('badgeRuleCount').value = b.rule?.count || 1;
      $('badgeSort').value = b.sort; $('badgeEnabled').checked = !!b.enabled;
      $('badgeFormTitle').textContent = '编辑徽章'; $('badgeCancel').classList.remove('hidden');
      badgeSyncSource();
      mountFx('badgeFxHost', 'badge', b.effect || fxBlank('badge'), (c) => { badgeFx = c; });
      $('badgeFormTitle').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }));
    box.querySelectorAll('[data-btoggle]').forEach((btn) => btn.addEventListener('click', async () => {
      btn.disabled = true;
      try { await callEdge('admin_badge_toggle', { id: btn.dataset.btoggle, enabled: btn.dataset.benabled !== '1' }); await loadBadgeAdmin(); }
      catch (e) { alert(e.message); btn.disabled = false; }
    }));
    box.querySelectorAll('[data-bdel]').forEach((btn) => btn.addEventListener('click', async () => {
      if (!confirm('确认删除该徽章定义？历史授予记录会保留，徽章墙标记为已下架。')) return;
      btn.disabled = true;
      try { await callEdge('admin_badge_delete', { id: btn.dataset.bdel }); await loadBadgeAdmin(); }
      catch (e) { alert(e.message); btn.disabled = false; }
    }));
    const grants = (await callEdge('admin_badge_grants', {})) || [];
    const gbox = $('badgeGrantList');
    gbox.innerHTML = grants.map((g) => `<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:6px 0;border-bottom:1px dashed var(--line);font-size:12px">
      <b>${escapeHtml(g.nickname || g.username || g.user_id)}</b>
      <span>${escapeHtml(g.badge_name || '')}</span>
      <span class="badge topic">${g.source === 'manual' ? '手动' : '自动'}</span>
      <span style="color:var(--faint)">${formatTime(g.granted_at)}</span>
      <span style="color:var(--faint)">${g.expires_at ? '到期 ' + formatTime(g.expires_at) : '永久'}</span>
      <span style="margin-left:auto;color:${g.revoked_at ? 'var(--faint)' : 'var(--ok)'}">${g.revoked_at ? '已撤销' : '生效中'}</span>
      ${g.revoked_at ? '' : `<button class="btn sm ghost" data-brevoke="${g.badge_id}" data-buid="${g.user_id}">撤销</button>`}
    </div>`).join('') || '<div class="empty">暂无授予记录</div>';
    gbox.querySelectorAll('[data-brevoke]').forEach((btn) => btn.addEventListener('click', async () => {
      if (!confirm('确认撤销该用户此徽章？')) return;
      btn.disabled = true;
      try { await callEdge('admin_badge_revoke', { user_id: btn.dataset.buid, badge_id: btn.dataset.brevoke }); await loadBadgeAdmin(); }
      catch (e) { alert(e.message); btn.disabled = false; }
    }));
  }
  $('badgeRefresh')?.addEventListener('click', () => loadBadgeAdmin().catch((e) => alert(e.message)));
  $('badgeSource')?.addEventListener('change', badgeSyncSource);
  $('badgeCancel')?.addEventListener('click', badgeResetForm);
  attachUserPicker($('badgeGrantUser'), (u) => { badgeGrantUserId = u ? u.id : ''; });
  $('badgeSave')?.addEventListener('click', async () => {
    const name = $('badgeName').value.trim();
    if (!name) { alert('请填写徽章名称'); return; }
    const source = $('badgeSource').value;
    const payload = {
      id: badgeEditingId || undefined, name,
      effect: badgeFx || fxBlank('badge'),
      description: $('badgeDesc').value.trim(), obtain_hint: $('badgeHint').value.trim(),
      source, duration_type: $('badgeDurType').value, duration_days: Number($('badgeDurDays').value) || 0,
      sort: Number($('badgeSort').value) || 0, enabled: $('badgeEnabled').checked
    };
    if (source === 'auto') payload.rule = { type: $('badgeRuleType').value, count: Math.max(1, Number($('badgeRuleCount').value) || 1) };
    try { await callEdge('admin_badge_save', payload); badgeResetForm(); await loadBadgeAdmin(); }
    catch (e) { alert(e.message); }
  });
  $('badgeGrantBtn')?.addEventListener('click', async () => {
    const bid = $('badgeGrantBadge').value;
    if (!badgeGrantUserId) { alert('请先搜索并选择用户'); return; }
    if (!bid) { alert('请选择徽章'); return; }
    try { const r = await callEdge('admin_badge_grant', { user_id: badgeGrantUserId, badge_id: bid }); alert(r.already ? '该用户已拥有此徽章' : '已授予'); await loadBadgeAdmin(); }
    catch (e) { alert(e.message); }
  });
  $('badgeRevokeBtn')?.addEventListener('click', async () => {
    const bid = $('badgeGrantBadge').value;
    if (!badgeGrantUserId || !bid) { alert('请先选择用户和徽章'); return; }
    if (!confirm('确认撤销该用户此徽章？')) return;
    try { await callEdge('admin_badge_revoke', { user_id: badgeGrantUserId, badge_id: bid }); await loadBadgeAdmin(); }
    catch (e) { alert(e.message); }
  });

  // ================= 第四期：积分商城管理（can_shop） =================
  let shopEditingId = null;
  let shopAdjustUserId = '';
  let shopGrantUserId = '';
  let shopGrantFx = null;
  let shopGrantItems = [];
  const SHOP_CAT_LABELS = { background: '帖子背景', title: '称号', nickname_style: '昵称样式', makeup_card: '补签卡', custom: '自定义' };
  const ORDER_STATUS_LABELS = { paid: '已支付', refunding: '待处理退款', refunded: '已退款', refund_rejected: '退款被拒' };
  const COIN_REASON_LABELS = { admin_adjust: '管理员调整', shop_buy: '商城兑换', shop_refund: '退款返还', checkin: '签到', quest: '每日任务', event: '活动奖励' };

  function shopSub(name) {
    ['items', 'orders', 'logs', 'adjust', 'grant'].forEach((k) => { $('shopPane-' + k).classList.toggle('hidden', k !== name); });
    document.querySelectorAll('.shop-sub').forEach((b) => b.classList.toggle('ghost', b.dataset.shopsub !== name));
    if (name === 'orders') loadShopOrders().catch((e) => alert(e.message));
    if (name === 'logs') loadShopLogs().catch((e) => alert(e.message));
    if (name === 'grant') shopGrantSyncSource();
  }
  // 商城分类 → 特效分类（仅这三类需要配置外观，其余无需）
  const SHOP_FX_KINDS = { background: 'background', title: 'title', nickname_style: 'nickname_style' };
  // 依据当前分类挂载/切换可视化特效配置器（下拉框 + 取色器 + 预览）
  function shopSyncFx(cfg) {
    const host = $('shopFxHost');
    if (!host) return;
    const kind = SHOP_FX_KINDS[$('shopCategory').value];
    const hint = $('shopFxHint');
    if (!kind) { shopFx = null; host.innerHTML = ''; if (hint) hint.style.display = ''; return; }
    if (hint) hint.style.display = 'none';
    mountFx('shopFxHost', kind, cfg || shopFx || fxBlank(kind), (c) => { shopFx = c; });
  }
  function shopResetForm() {
    shopEditingId = null;
    ['shopTitle', 'shopImage', 'shopDesc'].forEach((id) => { $(id).value = ''; });
    $('shopCategory').value = 'custom'; $('shopPrice').value = '0'; $('shopStock').value = '-1';
    $('shopDurType').value = 'forever'; $('shopDurDays').value = '0'; $('shopSort').value = '0';
    $('shopEnabled').checked = true; $('shopIsCustom').checked = false;
    $('shopFormTitle').textContent = '新建商品';
    $('shopCancel').classList.add('hidden');
    shopFx = null; shopSyncFx();
  }
  // ---- 手动分发装扮：现场配置特效 / 复用商城商品 ----
  function shopGrantSyncFx(cfg) {
    const host = $('shopGrantFxHost');
    if (!host) return;
    const usingItem = $('shopGrantSource').value === 'item';
    const hint = $('shopGrantFxHint');
    host.classList.toggle('hidden', usingItem);
    if (hint) hint.style.display = usingItem ? '' : 'none';
    if (usingItem) { host.innerHTML = ''; return; }
    const kind = SHOP_FX_KINDS[$('shopGrantType').value];
    mountFx('shopGrantFxHost', kind, cfg || shopGrantFx || fxBlank(kind), (c) => { shopGrantFx = c; });
  }
  async function loadShopGrantItems() {
    const sel = $('shopGrantItem');
    if (!sel) return;
    try {
      const list = (await callEdge('admin_shop_list', { category: $('shopGrantType').value })) || [];
      shopGrantItems = list;
      sel.innerHTML = list.length
        ? list.map((it) => `<option value="${escapeHtml(it.id)}">${escapeHtml(it.title)}${it.enabled ? '' : '（已下架）'}</option>`).join('')
        : '<option value="">（该分类暂无商品）</option>';
    } catch (_e) { sel.innerHTML = '<option value="">加载失败</option>'; }
  }
  async function shopGrantSyncSource() {
    const usingItem = $('shopGrantSource').value === 'item';
    $('shopGrantItemWrap').classList.toggle('hidden', !usingItem);
    if (usingItem) await loadShopGrantItems();
    shopGrantSyncFx();
  }
  async function loadShopAdmin() {
    const list = (await callEdge('admin_shop_list', {})) || [];
    const box = $('shopItemList');
    box.innerHTML = list.map((it) => `<div class="panel" style="box-shadow:none;padding:10px 12px;margin-bottom:8px">
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        ${fxPreviewHtml(it.category, it.template) ? `<span class="fx-list-ico">${fxPreviewHtml(it.category, it.template)}</span>`
          : (it.image_url ? `<img src="${escapeHtml(it.image_url)}" alt="" style="width:38px;height:38px;border-radius:8px;object-fit:cover" />` : '')}
        <b>${escapeHtml(it.title)}</b>
        <span class="badge topic">${SHOP_CAT_LABELS[it.category] || it.category}</span>
        <span style="color:var(--faint);font-size:12px">${it.price} 积分 · 库存 ${it.stock < 0 ? '不限量' : it.stock} · 已售 ${it.sold_count} · ${durText(it.duration_type, it.duration_days)}</span>
        <span style="margin-left:auto;color:${it.enabled ? 'var(--ok)' : 'var(--faint)'}">${it.enabled ? '已上架' : '已下架'}</span>
        <button class="btn sm ghost" data-iedit="${it.id}">编辑</button>
        <button class="btn sm ghost" data-itoggle="${it.id}" data-ienabled="${it.enabled ? '1' : '0'}">${it.enabled ? '下架' : '上架'}</button>
        <button class="btn sm danger" data-idel="${it.id}">删除</button>
      </div>
      <div style="color:var(--muted);font-size:12px;margin-top:5px">${escapeHtml(it.description || '')}</div>
    </div>`).join('') || '<div class="empty">暂无商品</div>';
    box.querySelectorAll('[data-iedit]').forEach((btn) => btn.addEventListener('click', () => {
      const it = list.find((x) => x.id === btn.dataset.iedit); if (!it) return;
      shopEditingId = it.id;
      $('shopTitle').value = it.title; $('shopImage').value = it.image_url || ''; $('shopDesc').value = it.description || '';
      $('shopCategory').value = it.category; $('shopPrice').value = it.price; $('shopStock').value = it.stock;
      $('shopDurType').value = it.duration_type; $('shopDurDays').value = it.duration_days; $('shopSort').value = it.sort;
      $('shopEnabled').checked = !!it.enabled; $('shopIsCustom').checked = !!it.is_custom;
      $('shopFormTitle').textContent = '编辑商品'; $('shopCancel').classList.remove('hidden');
      shopFx = null; shopSyncFx(it.template);
      $('shopFormTitle').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }));
    box.querySelectorAll('[data-itoggle]').forEach((btn) => btn.addEventListener('click', async () => {
      btn.disabled = true;
      try { await callEdge('admin_shop_toggle', { id: btn.dataset.itoggle, enabled: btn.dataset.ienabled !== '1' }); await loadShopAdmin(); }
      catch (e) { alert(e.message); btn.disabled = false; }
    }));
    box.querySelectorAll('[data-idel]').forEach((btn) => btn.addEventListener('click', async () => {
      if (!confirm('确认删除该商品？历史订单与积分流水会保留。')) return;
      btn.disabled = true;
      try { await callEdge('admin_shop_delete', { id: btn.dataset.idel }); await loadShopAdmin(); }
      catch (e) { alert(e.message); btn.disabled = false; }
    }));
  }
  async function loadShopOrders() {
    const rows = (await callEdge('admin_shop_orders', {
      from: $('shopOrderFrom').value, to: $('shopOrderTo').value,
      status: $('shopOrderStatus').value, keyword: $('shopOrderKw').value.trim()
    })) || [];
    const box = $('shopOrderList');
    box.innerHTML = rows.map((r) => `<div class="panel" style="box-shadow:none;padding:10px 12px;margin-bottom:8px">
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <b>${escapeHtml(r.item_snapshot?.title || '（商品已删除）')}</b>
        <span class="badge topic">${ORDER_STATUS_LABELS[r.status] || r.status}</span>
        <span style="color:var(--faint);font-size:12px">${escapeHtml(r.nickname || r.username || r.user_id)} · ${r.price} 积分 · ${formatTime(r.created_at)}</span>
        ${r.balance_after != null ? `<span style="color:var(--faint);font-size:12px">余额 ${r.balance_after}</span>` : ''}
        ${r.status === 'refunding' ? `<button class="btn sm" style="margin-left:auto" data-orefund="${r.id}" data-oapprove="1">通过退款</button><button class="btn sm ghost" data-orefund="${r.id}" data-oapprove="0">拒绝</button>` : ''}
      </div></div>`).join('') || '<div class="empty">该条件下暂无兑换记录</div>';
    box.querySelectorAll('[data-orefund]').forEach((btn) => btn.addEventListener('click', async () => {
      const approve = btn.dataset.oapprove === '1';
      if (!confirm(approve ? '确认通过退款？将按原价 80% 返还积分并收回权益。' : '确认拒绝该退款申请？')) return;
      btn.disabled = true;
      try { await callEdge('admin_shop_refund_handle', { order_id: btn.dataset.orefund, approve }); await loadShopOrders(); }
      catch (e) { alert(e.message); btn.disabled = false; }
    }));
  }
  async function loadShopLogs() {
    const rows = (await callEdge('admin_coin_logs', {
      keyword: $('shopLogKw').value.trim(), reason: $('shopLogReason').value,
      from: $('shopLogFrom').value, to: $('shopLogTo').value
    })) || [];
    const box = $('shopLogList');
    box.innerHTML = rows.map((r) => `<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:6px 0;border-bottom:1px dashed var(--line);font-size:12px">
      <b>${escapeHtml(r.nickname || r.username || r.user_id)}</b>
      <span style="color:${Number(r.delta) >= 0 ? 'var(--ok)' : 'var(--faint)'}">${Number(r.delta) >= 0 ? '+' : ''}${r.delta}</span>
      <span>${escapeHtml(COIN_REASON_LABELS[r.reason] || r.reason || '')}</span>
      <span style="color:var(--faint)">余额 ${r.balance}</span>
      <span style="margin-left:auto;color:var(--faint)">${formatTime(r.created_at)}</span>
    </div>`).join('') || '<div class="empty">暂无积分流水</div>';
  }
  document.querySelectorAll('.shop-sub').forEach((b) => b.addEventListener('click', () => shopSub(b.dataset.shopsub)));
  $('shopRefresh')?.addEventListener('click', async () => {
    try {
      await loadShopAdmin();
      if (!$('shopPane-orders').classList.contains('hidden')) await loadShopOrders();
      if (!$('shopPane-logs').classList.contains('hidden')) await loadShopLogs();
    } catch (e) { alert(e.message); }
  });
  $('shopOrderLoad')?.addEventListener('click', () => loadShopOrders().catch((e) => alert(e.message)));
  $('shopLogLoad')?.addEventListener('click', () => loadShopLogs().catch((e) => alert(e.message)));
  $('shopCancel')?.addEventListener('click', shopResetForm);
  attachUserPicker($('shopAdjustUser'), (u) => { shopAdjustUserId = u ? u.id : ''; });
  attachUserPicker($('shopGrantUser'), (u) => { shopGrantUserId = u ? u.id : ''; });
  $('shopGrantSource')?.addEventListener('change', () => shopGrantSyncSource());
  $('shopGrantType')?.addEventListener('change', async () => {
    if ($('shopGrantSource').value === 'item') await loadShopGrantItems();
    shopGrantSyncFx();
  });
  $('shopGrantSave')?.addEventListener('click', async () => {
    const type = $('shopGrantType').value;
    const source = $('shopGrantSource').value;
    if (!shopGrantUserId) { alert('请先搜索并选择目标用户'); return; }
    const payload = {
      user_id: shopGrantUserId, type,
      duration_type: $('shopGrantDurType').value,
      duration_days: Number($('shopGrantDurDays').value) || 0,
      equip: $('shopGrantEquip').checked
    };
    if (source === 'item') {
      const itemId = $('shopGrantItem').value;
      if (!itemId) { alert('请选择要复用的商城商品（该分类暂无商品时请改用「现场配置特效」）'); return; }
      payload.item_id = itemId;
    } else {
      payload.payload = shopGrantFx || fxBlank(SHOP_FX_KINDS[type]);
      payload.label = $('shopGrantLabel').value.trim();
    }
    if (!confirm(`确认为选中用户分发「${SHOP_CAT_LABELS[type] || type}」？`)) return;
    try { await callEdge('admin_grant_entitlement', payload); alert('分发成功'); }
    catch (e) { alert(e.message); }
  });
  $('shopCategory')?.addEventListener('change', () => shopSyncFx());
  $('shopSave')?.addEventListener('click', async () => {
    const title = $('shopTitle').value.trim();
    if (!title) { alert('请填写商品名称'); return; }
    const category = $('shopCategory').value;
    // 特效类商品：外观配置来自可视化配置器；补签卡固定；其余无需模板
    let template = null;
    if (SHOP_FX_KINDS[category]) template = shopFx || fxBlank(SHOP_FX_KINDS[category]);
    else if (category === 'makeup_card') template = { card: 'makeup' };
    const payload = {
      id: shopEditingId || undefined, title,
      description: $('shopDesc').value.trim(), image_url: $('shopImage').value.trim(),
      category: $('shopCategory').value, price: Number($('shopPrice').value) || 0,
      stock: Number($('shopStock').value), duration_type: $('shopDurType').value,
      duration_days: Number($('shopDurDays').value) || 0, sort: Number($('shopSort').value) || 0,
      enabled: $('shopEnabled').checked, is_custom: $('shopIsCustom').checked, template
    };
    try { await callEdge('admin_shop_save', payload); shopResetForm(); await loadShopAdmin(); }
    catch (e) { alert(e.message); }
  });
  document.querySelectorAll('[data-shoptpl]').forEach((b) => b.addEventListener('click', async () => {
    if (!confirm('一键添加该分类的模板商品？（默认下架，需调整后手动上架）')) return;
    try { await callEdge('admin_shop_template', { category: b.dataset.shoptpl }); await loadShopAdmin(); }
    catch (e) { alert(e.message); }
  }));
  $('shopAdjustSave')?.addEventListener('click', async () => {
    const delta = Math.floor(Number($('shopAdjustDelta').value) || 0);
    const reason = $('shopAdjustReason').value.trim();
    if (!shopAdjustUserId) { alert('请先搜索并选择用户'); return; }
    if (!delta) { alert('调整数值不能为 0'); return; }
    if (!reason) { alert('必须填写调整原因'); return; }
    if (!confirm(`确认对选中用户${delta > 0 ? '补发' : '扣减'} ${Math.abs(delta)} 积分？`)) return;
    try {
      const r = await callEdge('admin_coins_adjust', { user_id: shopAdjustUserId, delta, reason });
      alert(`调整成功，当前余额 ${r.balance} 积分`);
      $('shopAdjustDelta').value = ''; $('shopAdjustReason').value = '';
    } catch (e) { alert(e.message); }
  });

  // ================= 第四期：活动中心管理（can_event） =================
  let eventEditingId = null;
  const EVENT_MODE_LABELS = { lottery: '抽奖', likes: '点赞排行', favorites: '收藏排行', comments: '评论排行' };
  const EVENT_STATUS_LABELS = { draft: '草稿', ongoing: '进行中', ended: '已结束', pending_confirm: '待二次确认', settled: '已结算' };

  function toLocalInput(iso) {
    if (!iso) return '';
    const d = new Date(iso); const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  }
  function showModal(title, html) {
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;z-index:999;padding:20px';
    ov.innerHTML = `<div class="panel" style="max-width:640px;width:100%;max-height:80vh;overflow:auto">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px"><h3 style="margin:0">${escapeHtml(title)}</h3><button class="btn ghost sm" data-close>关闭</button></div>
      <div>${html}</div></div>`;
    ov.addEventListener('click', (e) => { if (e.target === ov || e.target.closest('[data-close]')) ov.remove(); });
    document.body.appendChild(ov);
  }
  function eventResetForm() {
    eventEditingId = null;
    ['eventTitle', 'eventCover', 'eventIntro', 'eventRules'].forEach((id) => { $(id).value = ''; });
    $('eventMode').value = 'lottery'; $('eventStatus').value = 'draft';
    $('eventStart').value = ''; $('eventEnd').value = '';
    ['eventRequireSignup', 'eventAnon', 'eventAutoSettle', 'eventRuleCfgEnabled'].forEach((id) => { $(id).checked = false; });
    $('eventFormTitle').textContent = '新建活动';
    $('eventCancel').classList.add('hidden');
    void renderEventForm('lottery', null, null);
  }
  async function loadEventAdmin() {
    // 首次进入活动 Tab 时初始化可视化配置表单（已在编辑中的内容不会被覆盖）
    if (!eventRuleEditor || !eventRewardEditor) await renderEventForm($('eventMode').value || 'lottery', null, null);
    const list = (await callEdge('admin_event_list', {})) || [];
    const box = $('eventList');
    box.innerHTML = list.map((e) => {
      const base = ['draft', 'ongoing', 'ended'];
      const opts = (base.includes(e.status) ? [] : [`<option value="${e.status}" selected>${EVENT_STATUS_LABELS[e.status] || e.status}</option>`])
        .concat(base.map((s) => `<option value="${s}" ${e.status === s ? 'selected' : ''}>${EVENT_STATUS_LABELS[s]}</option>`)).join('');
      return `<div class="panel" style="box-shadow:none;padding:10px 12px;margin-bottom:8px">
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <b>${escapeHtml(e.title)}</b>
          <span class="badge topic">${EVENT_MODE_LABELS[e.mode] || e.mode}</span>
          <span class="badge">${EVENT_STATUS_LABELS[e.status] || e.status}</span>
          <span style="color:var(--faint);font-size:12px">${e.start_at ? formatTime(e.start_at) : '未设开始'} ~ ${e.end_at ? formatTime(e.end_at) : '未设结束'}</span>
          <span style="color:var(--faint);font-size:12px">报名 ${e.signup_count} · 已发奖 ${e.granted_count}</span>
          ${e.require_signup ? '<span class="badge topic">需报名</span>' : ''}
          ${e.auto_settle ? '<span class="badge topic">自动结算</span>' : ''}
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:8px">
          <select class="input" data-estatus="${e.id}" style="width:120px">${opts}</select>
          <button class="btn sm ghost" data-esignups="${e.id}">报名名单</button>
          <button class="btn sm ghost" data-epreview="${e.id}">预览结果</button>
          ${e.mode !== 'lottery' && e.status === 'ended' ? `<button class="btn sm" data-econfirm="${e.id}">管理员确认结算</button>` : ''}
          ${profile?.isFounder && e.status === 'pending_confirm' ? `<button class="btn sm" data-efounder="${e.id}">创始人二次确认</button>` : ''}
          <button class="btn sm ghost" data-eedit="${e.id}">编辑</button>
          <button class="btn sm danger" data-edel="${e.id}">删除</button>
        </div>
        <div style="color:var(--muted);font-size:12px;margin-top:5px">${escapeHtml(e.intro || '')}</div>
      </div>`;
    }).join('') || '<div class="empty">暂无活动</div>';

    box.querySelectorAll('[data-estatus]').forEach((sel) => sel.addEventListener('change', async () => {
      sel.disabled = true;
      try { await callEdge('admin_event_status', { id: sel.dataset.estatus, status: sel.value }); await loadEventAdmin(); }
      catch (e) { alert(e.message); sel.disabled = false; }
    }));
    box.querySelectorAll('[data-eedit]').forEach((btn) => btn.addEventListener('click', async () => {
      const e = list.find((x) => x.id === btn.dataset.eedit); if (!e) return;
      eventEditingId = e.id;
      $('eventTitle').value = e.title; $('eventCover').value = e.cover_url || '';
      $('eventMode').value = e.mode; $('eventStatus').value = ['draft', 'ongoing', 'ended'].includes(e.status) ? e.status : 'draft';
      $('eventStart').value = toLocalInput(e.start_at); $('eventEnd').value = toLocalInput(e.end_at);
      $('eventIntro').value = e.intro || ''; $('eventRules').value = e.rules || '';
      $('eventRequireSignup').checked = !!e.require_signup; $('eventAnon').checked = !!e.anonymous_allowed;
      $('eventAutoSettle').checked = !!e.auto_settle; $('eventRuleCfgEnabled').checked = !!e.rule_config_enabled;
      await renderEventForm(e.mode, e.rule_config, e.reward_config);
      $('eventFormTitle').textContent = '编辑活动'; $('eventCancel').classList.remove('hidden');
      $('eventFormTitle').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }));
    box.querySelectorAll('[data-edel]').forEach((btn) => btn.addEventListener('click', async () => {
      if (!confirm('确认删除该活动？已结算并发放奖励的活动不可删除。')) return;
      btn.disabled = true;
      try { await callEdge('admin_event_delete', { id: btn.dataset.edel }); await loadEventAdmin(); }
      catch (e) { alert(e.message); btn.disabled = false; }
    }));
    box.querySelectorAll('[data-esignups]').forEach((btn) => btn.addEventListener('click', async () => {
      try {
        const d = await callEdge('admin_event_signups', { id: btn.dataset.esignups });
        const rows = (d?.list || []).map((r) => `<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:6px 0;border-bottom:1px dashed var(--line);font-size:12px">
          <b>${escapeHtml(r.nickname || r.username || r.user_id)}</b>
          <span style="color:var(--faint)">${formatTime(r.created_at)}</span>
          <span style="margin-left:auto;color:var(--faint)">${r.lottery ? '已抽奖：' + escapeHtml(r.lottery.prize || '未中奖') : '未抽奖'}</span>
        </div>`).join('');
        showModal(`报名名单（${d?.count || 0} 人）`, rows || '<div class="empty">暂无报名</div>');
      } catch (e) { alert(e.message); }
    }));
    box.querySelectorAll('[data-epreview]').forEach((btn) => btn.addEventListener('click', async () => {
      try {
        const d = await callEdge('admin_event_preview', { id: btn.dataset.epreview });
        let html = '';
        if (d.mode === 'lottery') {
          html = (d.prizes || []).map((p) => `<div style="display:flex;gap:8px;padding:6px 0;border-bottom:1px dashed var(--line);font-size:12px"><b>${escapeHtml(p.name)}</b><span style="color:var(--faint)">数量 ${p.qty} · 已抽 ${p.drawn} · 权重 ${p.weight}</span></div>`).join('');
          html += `<div style="margin-top:8px;color:var(--faint);font-size:12px">未中奖次数：${d.no_prize_count}</div>`;
        } else {
          html = (d.proposed || []).map((p) => `<div style="display:flex;gap:8px;padding:6px 0;border-bottom:1px dashed var(--line);font-size:12px"><b>第 ${p.rank} 名</b><span>${escapeHtml(p.nickname || p.user_id)}</span><span style="margin-left:auto;color:var(--faint)">+${p.coins} 积分${p.xp ? ' · +' + p.xp + ' 经验' : ''}</span></div>`).join('') || '<div class="empty">暂无排行数据</div>';
        }
        showModal('结算预览', html);
      } catch (e) { alert(e.message); }
    }));
    box.querySelectorAll('[data-econfirm]').forEach((btn) => btn.addEventListener('click', async () => {
      if (!confirm('确认按当前排行拟定获奖名单？之后需创始人二次确认才会真正发奖。')) return;
      btn.disabled = true;
      try { await callEdge('admin_event_confirm', { id: btn.dataset.econfirm }); alert('已提交，等待创始人二次确认'); await loadEventAdmin(); }
      catch (e) { alert(e.message); btn.disabled = false; }
    }));
    box.querySelectorAll('[data-efounder]').forEach((btn) => btn.addEventListener('click', async () => {
      if (!confirm('确认结算并发放奖励？此操作不可撤销。')) return;
      btn.disabled = true;
      try { const r = await callEdge('admin_event_founder_confirm', { id: btn.dataset.efounder }); alert(`已结算，共发放 ${r.granted} 名奖励`); await loadEventAdmin(); }
      catch (e) { alert(e.message); btn.disabled = false; }
    }));
  }
  $('eventRefresh')?.addEventListener('click', () => loadEventAdmin().catch((e) => alert(e.message)));
  $('eventCancel')?.addEventListener('click', eventResetForm);
  // 玩法切换：抽奖 ↔ 排行类的奖励结构不同，跨类型重置为默认，同类型保留已填内容
  $('eventMode')?.addEventListener('change', async () => {
    const E = EC(); if (!E) return;
    const next = $('eventMode').value;
    const keep = !!(eventRewardEditor && eventRewardMode) && ((eventRewardMode === 'lottery') === (next === 'lottery'));
    const seed = keep ? eventRewardEditor.get() : null;
    E.setBadges(await ensureEventBadges());
    eventRewardEditor = E.reward($('eventRewardCfgHost'), next, seed, null);
    eventRewardMode = next;
  });
  $('eventSave')?.addEventListener('click', async () => {
    const title = $('eventTitle').value.trim();
    if (!title) { alert('请填写活动标题'); return; }
    const mode = $('eventMode').value;
    const rule_config = eventRuleEditor ? eventRuleEditor.get() : null;
    const reward_config = eventRewardEditor ? eventRewardEditor.get() : null;
    if (mode === 'lottery' && !reward_config) {
      alert('抽奖活动至少需要一个有效奖品：请填写奖品名称，并给「权重」填一个大于 0 的数值。');
      return;
    }
    const payload = {
      id: eventEditingId || undefined, title,
      intro: $('eventIntro').value.trim(), rules: $('eventRules').value.trim(),
      cover_url: $('eventCover').value.trim(), mode,
      start_at: $('eventStart').value, end_at: $('eventEnd').value, status: $('eventStatus').value,
      require_signup: $('eventRequireSignup').checked, anonymous_allowed: $('eventAnon').checked,
      auto_settle: $('eventAutoSettle').checked, rule_config_enabled: $('eventRuleCfgEnabled').checked,
      rule_config, reward_config
    };
    try { await callEdge('admin_event_save', payload); eventResetForm(); await loadEventAdmin(); }
    catch (e) { alert(e.message); }
  });

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