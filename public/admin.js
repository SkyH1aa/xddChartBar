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
      { key: 'posts', label: '帖子管理' },
      { key: 'review', label: '吃瓜审核' },
      { key: 'pinned', label: '顶置管理' },
      { key: 'site', label: '站点开关' },
      { key: 'popups', label: '弹窗公告' }
    ];
    if (profile?.isFounder) tabs.push({ key: 'admins', label: '管理员' });
    const nav = $('tabs');
    nav.innerHTML = '';
    tabs.forEach((t) => {
      const b = document.createElement('button');
      b.className = 'chip' + (activeTab === t.key ? ' active' : '');
      b.textContent = t.label;
      b.addEventListener('click', () => switchTab(t.key));
      nav.appendChild(b);
    });
  }
  function switchTab(key) {
    activeTab = key;
    document.querySelectorAll('[id^="tab-"]').forEach((s) => s.classList.add('hidden'));
    $('tab-' + key).classList.remove('hidden');
    renderTabs();
    if (key === 'posts') loadPosts();
    if (key === 'review') loadReview();
    if (key === 'pinned') loadPinned();
    if (key === 'site') loadSite();
    if (key === 'popups') loadPopups();
    if (key === 'admins') loadAdmins();
  }

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