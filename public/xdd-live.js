/* ============================================================
   XDD吧 · 第二期实时层（纯轮询，1 秒）
   私信未读 / 通知增量 / 会话消息统一走 Edge Function 的 live_poll 合并接口，
   把 1 秒轮询的调用量压到每小时约 3600 次（单标签页），不订阅 Realtime。
   - 页面切后台：不发请求，回前台立即补一次
   - 连续 5 次失败：退避到 5 秒，成功后立刻恢复 1 秒
   另提供：底栏到达提示、私信面板（会话 / 消息 / 已读 / 撤回 / 收藏 / 举报）
   ============================================================ */
(function () {
  'use strict';

  const SUPABASE_URL = 'https://jgezpvmlnhycxslqbwcx.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_B29ClgwZagW32Ow5x6VdKQ_IL65F7dl';
  const EDGE_URL = `${SUPABASE_URL}/functions/v1/newtheba`;
  const TOKEN_KEY = 'nzb_user_token';

  const POLL_MS = 1000;              // 用户确认：间隔取最短 1 秒
  const POLL_MS_SLOW = 5000;         // 连续失败后的退避间隔
  const FAIL_LIMIT = 5;
  const RECALL_MS = 3 * 60 * 1000;   // 撤回窗口 3 分钟
  const READ_DWELL_MS = 2000;        // 已读判定：消息在视口内停留 2 秒
  const DM_BODY_MAX = 500;
  const TOAST_TTL = 6000;
  const TOAST_MAX = 3;

  // ---------------- 基础 ----------------
  function getToken() { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (_e) { return ''; } }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function fmtTime(iso) {
    if (!iso) return '';
    if (window.ClubTime) { const s = window.ClubTime.str(iso); if (s) return s; }
    const d = new Date(iso); const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }
  function fmtShort(iso) {
    if (!iso) return '';
    const d = new Date(iso); const p = (n) => String(n).padStart(2, '0');
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return `${p(d.getHours())}:${p(d.getMinutes())}`;
    return `${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }

  async function edge(action, payload) {
    const res = await fetch(EDGE_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', apikey: SUPABASE_KEY },
      body: JSON.stringify({ action, token: getToken(), ...(payload || {}) })
    });
    let data = {};
    try { data = await res.json(); } catch (_e) {}
    if (!res.ok || data.ok === false) throw new Error(data.error || ('请求失败 ' + res.status));
    return data.data;
  }

  // ---------------- 轮询 ----------------
  let running = false;
  let timer = null;
  let inFlight = false;
  let failCount = 0;
  let since = '';                    // 通知增量游标（服务端 server_now）
  const seenNotif = new Set();

  function start() {
    if (running) return;
    running = true;
    // 重新登录/换账号后从零开始：避免用旧游标把历史通知当成新增弹一遍
    since = '';
    seenNotif.clear();
    failCount = 0;
    document.addEventListener('visibilitychange', onVisibility);
    loop();
  }
  function stop() {
    running = false;
    if (timer) { clearTimeout(timer); timer = null; }
    document.removeEventListener('visibilitychange', onVisibility);
  }
  function schedule(ms) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(loop, ms);
  }
  function onVisibility() {
    if (document.visibilityState !== 'visible') return;
    if (!running || inFlight) return;
    if (timer) { clearTimeout(timer); timer = null; }
    loop();
  }
  function pollNow() {
    if (!running) return;
    if (timer) { clearTimeout(timer); timer = null; }
    loop();
  }

  async function loop() {
    timer = null;
    if (!running || inFlight) return;
    if (!getToken()) { schedule(POLL_MS); return; }               // 未登录：空转等待登录
    if (document.visibilityState === 'hidden') return;            // 后台不发请求，等 visibilitychange 唤醒
    inFlight = true;
    let wait = POLL_MS;
    try {
      const view = dm.open ? (dm.threadId ? 'thread' : 'threads') : 'none';
      const data = await edge('live_poll', {
        since_notif: since, view, thread_id: dm.threadId || ''
      }) || {};
      failCount = 0;
      if (data.server_now) since = data.server_now;
      applyBadges(data);
      pushToasts(data.notif || []);
      if (view === 'thread') applyThread(data);
      else if (view === 'threads') applyThreads(data.threads || []);
    } catch (_e) {
      failCount++;
      if (failCount >= FAIL_LIMIT) wait = POLL_MS_SLOW;
    } finally { inFlight = false; }
    schedule(wait);
  }

  function setBadge(el, n) {
    if (!el) return;
    el.classList.toggle('on', n > 0);
    el.textContent = n > 99 ? '99+' : String(n);
  }
  function applyBadges(data) {
    setBadge(document.getElementById('notifBadge'), Number(data.unread_notif) || 0);
    setBadge(document.getElementById('dmBadge'), Number(data.unread_dm) || 0);
  }

  // ---------------- 底栏到达提示 ----------------
  let toastHostEl = null;
  function toastHost() {
    if (!toastHostEl) {
      toastHostEl = document.createElement('div');
      toastHostEl.className = 'xdd-toast-host';
      document.body.appendChild(toastHostEl);
    }
    return toastHostEl;
  }
  function notifIcon(t) {
    const s = String(t || '');
    if (s === 'dm') return '✉️';
    if (s === 'mention') return '📣';
    if (s === 'like') return '❤️';
    if (s === 'comment' || s === 'reply') return '💬';
    if (s === 'report_result') return '📮';
    if (s === 'report_handled') return '⚠️';
    if (s === 'col_post') return '📚';
    return '🔔';
  }
  function showToast(n) {
    const host = toastHost();
    const el = document.createElement('div');
    el.className = 'xdd-toast';
    el.innerHTML = `<span class="tt-ico">${notifIcon(n.type)}</span>
      <span class="tt-msg">${escapeHtml(n.message || '')}</span>
      <button class="tt-x" title="关闭">×</button>`;
    el.addEventListener('click', (e) => {
      if (e.target.closest('.tt-x')) { el.remove(); return; }
      el.remove();
      gotoNotif(n);
    });
    host.appendChild(el);
    while (host.children.length > TOAST_MAX) host.firstChild.remove();
    setTimeout(() => el.remove(), TOAST_TTL);
  }
  function pushToasts(list) {
    for (const n of list) {
      if (!n || !n.id || seenNotif.has(n.id)) continue;
      seenNotif.add(n.id);
      // 正在看的那个会话不再重复弹提示
      if (n.type === 'dm' && dm.open && n.ref_id && n.ref_id === dm.threadId) continue;
      showToast(n);
    }
    if (seenNotif.size > 400) {
      const keep = Array.from(seenNotif).slice(-200);
      seenNotif.clear();
      keep.forEach((id) => seenNotif.add(id));
    }
  }
  function gotoNotif(n) {
    if (n.ref_type === 'dm_thread' && n.ref_id) { openDm({ threadId: n.ref_id }); return; }
    if (n.post_id) {
      if (typeof window.__xddScrollToPost === 'function') { window.__xddScrollToPost(n.post_id); return; }
      location.href = 'index.html#post-' + encodeURIComponent(n.post_id);
      return;
    }
    // 已在通知中心页：直接刷新列表，不再整页跳转
    if (typeof window.__xddNotifReload === 'function') { window.__xddNotifReload(); return; }
    location.href = 'notifications.html';
  }

  // ---------------- 私信面板 ----------------
  const dm = {
    built: false, mask: null, open: false, tab: 'threads',
    threads: [], threadsSig: '',
    threadId: '', peer: null, messages: [], blocked: false, blockedReason: '', selfDisabled: false,
    bond: null,
    msgSig: '', hasMore: false, loadingOlder: false,
    favs: [], favSet: new Set(),
    readSent: new Set(), io: null
  };

  function msgSigOf(list) {
    return list.map((m) => `${m.id}:${m.recalled ? 1 : 0}:${m.read ? 1 : 0}:${m.blocked ? 1 : 0}`).join('|');
  }
  // 续缘标识：档位决定特效，颜色可自定义（--bond-c）；未满 3 天时展示进度「已互聊 x 天 · 还差 x 天」
  function bondBadgeHtml(bond, extraCls) {
    if (!bond || !bond.days) return '';
    const cls = extraCls ? ' ' + extraCls : '';
    if (!bond.tier) {
      const tip = `与 TA 已互聊 ${bond.days} 天，还差 ${bond.need} 天形成续缘`;
      return `<span class="dm-bond bond-pending${cls}" title="${escapeHtml(tip)}">已互聊 ${bond.days} 天 · 还差 ${bond.need} 天</span>`;
    }
    const color = /^#[0-9a-f]{6}$/i.test(bond.color || '') ? bond.color : '';
    const style = color ? ` style="--bond-c:${color}"` : '';
    const label = `${bond.name} ${bond.days} 天`;
    return `<span class="dm-bond bond-${escapeHtml(bond.tier)}${cls}"${style} title="与 TA 连续互聊 ${bond.days} 天">${escapeHtml(label)}</span>`;
  }
  function card() { return dm.mask ? dm.mask.querySelector('.dm-card') : null; }
  function q(sel) { return dm.mask ? dm.mask.querySelector(sel) : null; }

  function buildPanel() {
    if (dm.built) return;
    const mask = document.createElement('div');
    mask.className = 'dm-mask';
    mask.style.display = 'none';
    mask.innerHTML = `
      <div class="dm-card">
        <div class="dm-head">
          <span class="dm-title">✉️ 私信</span>
          <div class="dm-tabs">
            <button class="dm-tab on" data-tab="threads">会话</button>
            <button class="dm-tab" data-tab="favorites">收藏</button>
          </div>
          <button class="dm-close" title="关闭">×</button>
        </div>
        <div class="dm-body">
          <aside class="dm-side">
            <div class="dm-search">
              <input class="dm-search-input" placeholder="搜索昵称或账号，开始新的私信…" autocomplete="off" />
              <div class="dm-search-res"></div>
            </div>
            <div class="dm-threads"><div class="dm-empty">加载中…</div></div>
          </aside>
          <section class="dm-main">
            <div class="dm-peer">
              <button class="dm-back" title="返回会话列表">‹</button>
              <span class="dm-peer-name"></span>
              <span class="dm-peer-lv"></span>
              <span class="dm-peer-bond"></span>
              <span class="dm-peer-gone"></span>
            </div>
            <div class="dm-banner" style="display:none"></div>
            <div class="dm-msgs"></div>
            <div class="dm-compose">
              <textarea class="dm-input" maxlength="${DM_BODY_MAX}" placeholder="输入私信内容…（Ctrl + Enter 发送）"></textarea>
              <button class="btn sm dm-send">发送</button>
            </div>
          </section>
        </div>
      </div>`;
    document.body.appendChild(mask);
    dm.mask = mask;
    dm.built = true;

    q('.dm-close').addEventListener('click', closePanel);
    mask.addEventListener('click', (e) => { if (e.target === mask) closePanel(); });
    q('.dm-back').addEventListener('click', backToList);
    q('.dm-card').querySelectorAll('.dm-tab').forEach((b) => {
      b.addEventListener('click', () => switchTab(b.dataset.tab));
    });
    q('.dm-send').addEventListener('click', sendMsg);
    q('.dm-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); sendMsg(); }
    });
    q('.dm-msgs').addEventListener('click', onMsgClick);
    q('.dm-threads').addEventListener('click', onThreadListClick);

    const si = q('.dm-search-input');
    let st = null;
    let seq = 0;
    si.addEventListener('input', () => {
      if (st) clearTimeout(st);
      const kw = si.value.trim();
      if (!kw) { seq++; renderSearchRes([], ''); return; }
      const my = ++seq;
      st = setTimeout(async () => {
        try {
          const list = await edge('user_search_mentions', { keyword: kw });
          if (my !== seq) return;                       // 输入已变化，丢弃过期结果
          renderSearchRes(list, kw);
        } catch (_e) { if (my === seq) renderSearchRes([], kw); }
      }, 200);
    });
    q('.dm-search-res').addEventListener('click', (e) => {
      const it = e.target.closest('[data-uid]');
      if (!it) return;
      si.value = '';
      seq++;
      renderSearchRes([], '');
      openThreadByPeer(it.dataset.uid);
    });
    // 点击搜索框以外区域收起结果面板
    document.addEventListener('click', (e) => {
      if (!dm.open) return;
      if (e.target.closest && e.target.closest('.dm-search')) return;
      renderSearchRes([], '');
    });
  }

  function openPanel() {
    if (!getToken()) { window.alert('请先登录后再使用私信'); return; }
    buildPanel();
    dm.open = true;
    dm.mask.style.display = 'flex';
    if (dm.tab === 'favorites') loadFavs();
    else if (dm.threads.length) renderThreads(dm.threads);
    pollNow();
  }
  function closePanel() {
    dm.open = false;
    if (dm.mask) dm.mask.style.display = 'none';
    pollNow();
  }
  function backToList() {
    if (card()) card().classList.remove('has-thread');
    dm.threadId = '';
    dm.messages = [];
    dm.msgSig = '';
    renderThreads(dm.threads);
    pollNow();
  }

  function switchTab(tab) {
    dm.tab = tab;
    if (!dm.mask) return;
    dm.mask.querySelectorAll('.dm-tab').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
    if (tab === 'favorites') loadFavs();
    else if (dm.threads.length) renderThreads(dm.threads);
    else q('.dm-threads').innerHTML = '<div class="dm-empty">还没有会话<br>搜索昵称开始私信吧</div>';
    pollNow();
  }

  function openDm(opts) {
    opts = opts || {};
    if (!getToken()) { window.alert('请先登录后再使用私信'); return; }
    buildPanel();
    if (!dm.open) { dm.open = true; dm.mask.style.display = 'flex'; }
    if (opts.threadId) openThread(opts.threadId);
    else if (opts.peerId) openThreadByPeer(opts.peerId);
    else { if (dm.tab === 'favorites') loadFavs(); else if (dm.threads.length) renderThreads(dm.threads); pollNow(); }
  }

  async function openThreadByPeer(peerId) {
    try {
      const r = await edge('dm_open', { target_id: peerId });
      await openThread(r.id, r.peer);
    } catch (e) { window.alert(e.message); }
  }

  async function openThread(threadId, peer) {
    buildPanel();
    dm.threadId = threadId;
    if (peer) dm.peer = peer;
    if (card()) card().classList.add('has-thread');
    dm.messages = [];
    dm.msgSig = '';
    dm.hasMore = false;
    dm.bond = null;
    dm.readSent = new Set();
    q('.dm-msgs').innerHTML = '<div class="dm-empty">加载中…</div>';
    try {
      const r = await edge('dm_messages', { thread_id: threadId });
      dm.peer = r.peer || dm.peer;
      dm.blocked = !!r.thread.blocked;
      dm.blockedReason = r.thread.blocked_reason || '';
      dm.bond = r.bond || null;
      dm.selfDisabled = !!r.self_disabled;
      dm.hasMore = !!r.has_more;
      dm.messages = r.messages || [];
      renderThread();
      q('.dm-msgs').scrollTop = q('.dm-msgs').scrollHeight;
    } catch (e) {
      q('.dm-msgs').innerHTML = `<div class="dm-empty">${escapeHtml(e.message)}</div>`;
    }
    pollNow();
  }

  async function refreshThreadNow() {
    if (!dm.threadId) return;
    const r = await edge('dm_messages', { thread_id: dm.threadId });
    if (r.peer) dm.peer = r.peer;
    dm.blocked = !!r.thread.blocked;
    dm.blockedReason = r.thread.blocked_reason || '';
    dm.bond = r.bond || null;
    dm.selfDisabled = !!r.self_disabled;
    dm.hasMore = !!r.has_more;
    dm.messages = r.messages || [];
    renderThread();
  }

  function renderThread() {
    if (!dm.mask) return;
    const p = dm.peer || {};
    q('.dm-peer-name').textContent = p.nickname || p.username || '已注销用户';
    q('.dm-peer-lv').textContent = 'Lv.' + (Number(p.level) || 0);
    q('.dm-peer-bond').innerHTML = bondBadgeHtml(dm.bond);
    q('.dm-peer-gone').textContent = p.gone ? '已注销' : '';
    const banner = q('.dm-banner');
    const locked = dm.blocked || dm.selfDisabled;
    if (locked) {
      banner.style.display = '';
      banner.textContent = dm.blocked
        ? '⚠️ 该会话已被管理员封禁，暂时无法收发私信' + (dm.blockedReason ? '：' + dm.blockedReason : '')
        : '🚫 你的私信功能已被管理员禁用，暂时无法发送私信';
    } else banner.style.display = 'none';
    const ta = q('.dm-input');
    ta.disabled = locked;
    q('.dm-send').disabled = locked;
    renderMessages();
    dm.msgSig = msgSigOf(dm.messages);
  }

  function msgHtml(m) {
    const canRecall = m.mine && !m.recalled && (Date.now() - new Date(m.created_at).getTime() <= RECALL_MS);
    const favOn = dm.favSet.has(m.id);
    const acts = [];
    if (!m.recalled) {
      acts.push(`<button class="dm-act${favOn ? ' on' : ''}" data-fav="${m.id}" title="${favOn ? '取消收藏' : '收藏'}">${favOn ? '★' : '☆'}</button>`);
      if (!m.mine) acts.push(`<button class="dm-act" data-rep="${m.id}" title="举报该私信">🚩</button>`);
      if (canRecall) acts.push(`<button class="dm-act" data-recall="${m.id}" title="撤回（3 分钟内）">↩</button>`);
    }
    let body;
    if (m.recalled) body = '<span class="dm-recall">消息已撤回</span>';
    else if (m.blocked) body = `<span class="dm-blocked">${escapeHtml(m.body)}</span><span class="dm-badge-blk">已被管理员屏蔽</span>`;
    else body = escapeHtml(m.body);
    const t = fmtTime(m.created_at);
    const readTxt = (m.mine && !m.recalled) ? ' · ' + (m.read ? '已读' : '未读') : '';
    const unread = (!m.mine && !m.read && !m.recalled) ? ' data-unread="1"' : '';
    return `<div class="dm-msg${m.mine ? ' mine' : ''}" data-mid="${m.id}"${unread}>
      <div class="dm-bubble">${body}</div>
      <div class="dm-meta"><span class="dm-time" data-t="${escapeHtml(t)}">${escapeHtml(t + readTxt)}</span><span class="dm-acts">${acts.join('')}</span></div>
    </div>`;
  }

  function renderMessages() {
    const box = q('.dm-msgs');
    if (!box) return;
    const nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
    const older = dm.hasMore ? '<div class="dm-more-wrap"><button class="dm-more-older">加载更早的消息</button></div>' : '';
    if (!dm.messages.length) box.innerHTML = older + '<div class="dm-empty">还没有消息，打个招呼吧</div>';
    else box.innerHTML = older + dm.messages.map(msgHtml).join('');
    if (nearBottom) box.scrollTop = box.scrollHeight;
    watchUnread();
  }

  // 已读：消息在视口内停留 2 秒后批量上报
  let readBatch = [];
  let readFlush = null;
  function watchUnread() {
    const box = q('.dm-msgs');
    if (!box) return;
    if (dm.io) { dm.io.disconnect(); dm.io = null; }
    const targets = box.querySelectorAll('.dm-msg[data-unread="1"]');
    if (!targets.length) return;
    if (!('IntersectionObserver' in window)) {
      targets.forEach((el) => queueRead(el.dataset.mid));
      return;
    }
    dm.io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        const el = en.target;
        if (en.isIntersecting) {
          if (!el.__readTimer) {
            el.__readTimer = setTimeout(() => { el.__readTimer = null; queueRead(el.dataset.mid); }, READ_DWELL_MS);
          }
        } else if (el.__readTimer) {
          clearTimeout(el.__readTimer);
          el.__readTimer = null;
        }
      }
    }, { threshold: 0.6 });
    targets.forEach((el) => dm.io.observe(el));
  }
  function queueRead(id) {
    if (!id || dm.readSent.has(id)) return;
    dm.readSent.add(id);
    readBatch.push(id);
    if (readFlush) return;
    readFlush = setTimeout(async () => {
      const ids = readBatch.slice();
      readBatch = [];
      readFlush = null;
      if (!ids.length || !dm.threadId) return;
      try {
        await edge('dm_read', { thread_id: dm.threadId, message_ids: ids });
        ids.forEach((mid) => {
          const m = dm.messages.find((x) => x.id === mid);
          if (m) m.read = true;
          const el = q(`.dm-msg[data-mid="${mid}"]`);
          if (el) {
            el.removeAttribute('data-unread');
            const t = el.querySelector('.dm-time');
            if (t && t.dataset.t && !/已读/.test(t.textContent)) t.textContent = t.dataset.t + ' · 已读';
          }
        });
        dm.msgSig = msgSigOf(dm.messages);
      } catch (_e) { ids.forEach((mid) => dm.readSent.delete(mid)); }
    }, 250);
  }

  function onMsgClick(e) {
    const rec = e.target.closest('[data-recall]');
    if (rec) { recallMsg(rec.dataset.recall); return; }
    const fv = e.target.closest('[data-fav]');
    if (fv) { toggleFav(fv.dataset.fav); return; }
    const rp = e.target.closest('[data-rep]');
    if (rp) { reportMsg(rp.dataset.rep); return; }
    if (e.target.closest('.dm-more-older')) loadOlder();
  }

  async function sendMsg() {
    if (!dm.threadId) return;
    const ta = q('.dm-input');
    const text = (ta.value || '').trim();
    if (!text) return;
    if (text.length > DM_BODY_MAX) { window.alert(`私信内容不能超过 ${DM_BODY_MAX} 字`); return; }
    const btn = q('.dm-send');
    btn.disabled = true;
    try {
      await edge('dm_send', { thread_id: dm.threadId, body: text });
      ta.value = '';
      await refreshThreadNow();
      const box = q('.dm-msgs');
      box.scrollTop = box.scrollHeight;
      pollNow();
    } catch (e) { window.alert(e.message); }
    btn.disabled = !!dm.blocked || !!dm.selfDisabled;
  }

  async function loadOlder() {
    if (!dm.threadId || !dm.messages.length || dm.loadingOlder) return;
    dm.loadingOlder = true;
    const box = q('.dm-msgs');
    const prevH = box.scrollHeight;
    try {
      const r = await edge('dm_messages', { thread_id: dm.threadId, before: dm.messages[0].created_at });
      const older = r.messages || [];
      dm.hasMore = older.length ? !!r.has_more : false;
      if (older.length) dm.messages = older.concat(dm.messages);
      renderMessages();
      box.scrollTop = Math.max(0, box.scrollHeight - prevH);
    } catch (e) { window.alert(e.message); }
    dm.loadingOlder = false;
  }

  async function recallMsg(id) {
    if (!window.confirm('撤回这条私信？对方将看到「消息已撤回」。')) return;
    try {
      await edge('dm_recall', { message_id: id });
      await refreshThreadNow();
      pollNow();
    } catch (e) { window.alert(e.message); }
  }

  async function toggleFav(id) {
    const on = dm.favSet.has(id);
    try {
      await edge(on ? 'dm_unfavorite' : 'dm_favorite', { message_id: id });
      if (on) dm.favSet.delete(id); else dm.favSet.add(id);
      renderMessages();
    } catch (e) { window.alert(e.message); }
  }

  async function reportMsg(id) {
    const reason = window.prompt('请填写举报理由（将提交给管理员，不会告知对方）：');
    if (reason == null) return;
    const r = String(reason).trim();
    if (!r) return;
    try {
      await edge('report_submit', { target_type: 'dm', target_id: id, reason: r });
      window.alert('✅ 举报已提交，管理员会尽快处理。');
    } catch (e) { window.alert(e.message); }
  }

  // ---------------- 会话列表 / 收藏 / 搜索 ----------------
  function renderThreads(list) {
    const box = q('.dm-threads');
    if (!box) return;
    if (!list || !list.length) {
      box.innerHTML = '<div class="dm-empty">还没有会话<br>搜索昵称开始私信吧</div>';
      return;
    }
    box.innerHTML = list.map((t) => {
      const p = t.peer || {};
      const name = p.nickname || p.username || '已注销用户';
      return `<div class="dm-thread${t.id === dm.threadId ? ' on' : ''}" data-thread="${t.id}">
        <span class="dm-th-avatar">${escapeHtml(String(name).slice(0, 1))}</span>
        <span class="dm-th-body">
          <span class="dm-th-top"><b>${escapeHtml(name)}</b>${bondBadgeHtml(t.bond, 'sm')}${p.gone ? '<i class="dm-th-gone">已注销</i>' : ''}<span class="dm-th-time">${escapeHtml(fmtShort(t.last_message_at))}</span></span>
          <span class="dm-th-prev">${escapeHtml(t.last_preview || '')}</span>
        </span>
        ${t.blocked ? '<span class="dm-th-blk">封禁</span>' : ''}
        ${t.unread ? `<span class="dm-th-unread">${t.unread > 99 ? '99+' : t.unread}</span>` : ''}
      </div>`;
    }).join('');
  }

  function onThreadListClick(e) {
    const fav = e.target.closest('[data-fav-thread]');
    if (fav) { openDm({ threadId: fav.dataset.favThread }); return; }
    const t = e.target.closest('[data-thread]');
    if (t) openThread(t.dataset.thread);
  }

  async function loadFavs() {
    const box = q('.dm-threads');
    if (!box) return;
    box.innerHTML = '<div class="dm-empty">加载中…</div>';
    try {
      const list = await edge('dm_favorites', {}) || [];
      dm.favs = list;
      dm.favSet = new Set(list.map((f) => f.message && f.message.id).filter(Boolean));
      renderFavs();
    } catch (e) { box.innerHTML = `<div class="dm-empty">${escapeHtml(e.message)}</div>`; }
  }
  function renderFavs() {
    const box = q('.dm-threads');
    if (!box) return;
    if (!dm.favs.length) { box.innerHTML = '<div class="dm-empty">还没有收藏的私信</div>'; return; }
    box.innerHTML = dm.favs.map((f) => {
      const m = f.message || {};
      const p = f.peer || {};
      return `<div class="dm-fav" data-fav-thread="${f.thread_id}">
        <div class="dm-fav-head"><b>${escapeHtml(p.nickname || p.username || '已注销用户')}</b>
          <span class="dm-th-time">${escapeHtml(fmtTime(m.created_at))}</span></div>
        <div class="dm-fav-body">${m.recalled ? '（消息已撤回）' : escapeHtml(m.body || '')}</div>
      </div>`;
    }).join('');
  }

  // 搜索结果面板：.dm-search-res 的样式是 display:none，必须显式置为 block，
  // 之前写 style.display = '' 会回落到样式表的 none，结果永远不可见（表现为「搜不到人」）。
  function renderSearchRes(list, keyword) {
    const box = q('.dm-search-res');
    if (!box) return;
    if (!list || !list.length) {
      if (!keyword) { box.innerHTML = ''; box.style.display = 'none'; return; }
      box.style.display = 'block';
      box.innerHTML = '<div class="dm-sres-none">未找到匹配的用户（可试试账号或昵称的其它写法）</div>';
      return;
    }
    box.style.display = 'block';
    box.innerHTML = list.map((u) => `<div class="dm-sres" data-uid="${u.id}">
      <span class="dm-sres-nick">${escapeHtml(u.nickname)}</span>
      ${u.allow_stranger === false ? '<i class="dm-sres-tip">不接收陌生人私信</i>' : ''}
      <i class="dm-sres-lv">Lv.${Number(u.level) || 0}</i></div>`).join('');
  }

  // ---------------- 轮询回填 ----------------
  function applyThread(data) {
    const t = data.thread;
    if (!t || t.id !== dm.threadId) return;
    const blockedChanged = !!t.blocked !== dm.blocked;
    dm.blocked = !!t.blocked;
    dm.blockedReason = t.block_reason || '';
    const bondSig = (b) => (b ? `${b.tier}:${b.days}:${b.color || ''}` : '');
    const bondChanged = bondSig(t.bond) !== bondSig(dm.bond);
    dm.bond = t.bond || null;
    const list = data.messages || [];
    const sig = msgSigOf(list);
    if (sig !== dm.msgSig) {
      dm.messages = list;
      renderThread();
    } else if (blockedChanged || bondChanged) {
      renderThread();
    }
  }
  function applyThreads(list) {
    dm.threads = list;
    const sig = list.map((t) => `${t.id}:${t.unread}:${t.last_message_at || ''}:${t.blocked ? 1 : 0}:${t.last_preview || ''}:${t.bond ? t.bond.days : 0}:${t.bond ? t.bond.color || '' : ''}`).join('|');
    if (sig === dm.threadsSig) return;
    dm.threadsSig = sig;
    if (dm.tab === 'threads') renderThreads(list);
  }

  // ---------------- 对外接口 ----------------
  window.XddLive = {
    start, stop, pollNow,
    openDm, openPanel, closePanel,
    isOpen() { return dm.open; },
    toast: showToast
  };
})();
