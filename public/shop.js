/* ============================================================
   XDD吧 · 积分商城（shop.html 专用）
   形态：商品浏览 / 详情 / 兑换 / 我的订单与退款 / 我的权益装备切换。
   权限：所有内容需登录；兑换、退款、装备需登录（服务端再次校验，前端不作为最终判断依据）。
   ============================================================ */
(function () {
  'use strict';

  const SUPABASE_URL = 'https://jgezpvmlnhycxslqbwcx.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_B29ClgwZagW32Ow5x6VdKQ_IL65F7dl';
  const EDGE_URL = `${SUPABASE_URL}/functions/v1/newtheba`;
  const USER_TOKEN_KEY = 'nzb_user_token';
  const USER_PROFILE_KEY = 'nzb_user_profile';

  const CAT_LABEL = { background: '帖子背景', title: '称号', nickname_style: '昵称样式', makeup_card: '补签卡', custom: '自定义' };
  const CAT_ICON = { background: '🖼', title: '🏷', nickname_style: '✨', makeup_card: '📅', custom: '🎁' };
  const ENT_LABEL = { background: '帖子背景', title: '称号', nickname_style: '昵称样式' };
  const ORDER_STATUS = {
    paid: { text: '已支付', cls: 'ok' },
    refunding: { text: '待处理退款', cls: 'warn' },
    refunded: { text: '已退款', cls: 'off' },
    refund_rejected: { text: '退款被拒', cls: 'off' }
  };
  const DUR_LABEL = { day: '天', week: '周', month: '月', year: '年', forever: '永久' };

  const $ = (id) => document.getElementById(id);

  let me = null;
  let coins = 0;
  let items = [];
  const state = { tab: 'items', category: '', keyword: '' };

  // ---------------- 工具 ----------------
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function formatTime(iso) {
    if (!iso) return '';
    if (window.ClubTime) { const s = window.ClubTime.str(iso); if (s) return s; }
    const d = new Date(iso); const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }
  function durText(type, days) {
    if (type === 'forever') return '永久';
    const n = Number(days) || 0;
    return n > 0 ? `${n} ${DUR_LABEL[type] || type}` : (DUR_LABEL[type] || type);
  }
  function loggedIn() { return !!(me && me.token); }

  // ---------------- 内置特效预览（public/effects.js） ----------------
  // 帖子背景 / 称号 / 昵称样式 全部由内置网页特效渲染（不使用图片）
  const FX_KINDS = { background: 1, title: 1, nickname_style: 1 };
  const FX = () => (window.XddFx || null);
  function fxPreviewHtml(category, cfg, withText) {
    const F = FX();
    if (!F || !cfg || !FX_KINDS[category]) return '';
    try {
      const c = F.normalize(category, cfg);
      if (category === 'title') return F.titleHtml(c);
      if (category === 'nickname_style') {
        return `<span class="${F.classes('nickname_style', c).join(' ')}" style="${escapeHtml(F.styleAttr('nickname_style', c))}"><span class="nick-txt">同学昵称</span></span>`;
      }
      // 帖子背景：详情页额外带上正文样例，否则「文字特效」看不到效果
      const inner = F.bgLayers() + (withText ? '<span class="post-content">帖子正文示例：背景与文字特效的实际效果。</span>' : '');
      return `<span class="fx-prev-bg ${F.classes('background', c).join(' ')}" style="${escapeHtml(F.styleAttr('background', c))}">${inner}</span>`;
    } catch (_e) { return ''; }
  }

  // ---------------- 会话与顶栏 ----------------
  function readSession() {
    try {
      const tk = localStorage.getItem(USER_TOKEN_KEY);
      const pf = JSON.parse(localStorage.getItem(USER_PROFILE_KEY) || 'null');
      me = tk ? { token: tk, profile: pf } : null;
    } catch (_e) { me = null; }
  }
  function renderBar() {
    const host = $('userBar');
    if (!host) return;
    if (loggedIn() && me.profile) {
      const nm = me.profile.nickname || me.profile.username || '同学';
      host.innerHTML = `<a class="btn ghost sm" href="index.html">返回主页</a>`;
    } else {
      host.innerHTML = '<a href="index.html" class="btn ghost sm">登录 / 注册</a>';
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
      err.need_captcha = !!data.need_captcha;
      err.captcha = data.captcha;
      throw err;
    }
    return data.data;
  }

  // ---------------- 积分余额 ----------------
  async function loadBalance() {
    const el = $('coinBalance');
    if (!loggedIn()) { coins = 0; el.textContent = '—'; $('coinHint').textContent = '登录后查看余额'; return; }
    try {
      const u = await callEdge('user_whoami', {});
      coins = Number(u && u.coins) || 0;
      el.textContent = coins;
      $('coinHint').textContent = '积分余额';
    } catch (_e) {
      const cached = Number(me.profile && me.profile.coins) || 0;
      coins = cached;
      el.textContent = cached;
      $('coinHint').textContent = '积分余额（本地缓存）';
    }
  }

  // ---------------- 商品 ----------------
  async function loadItems() {
    const box = $('itemList');
    box.innerHTML = '<div class="p4-empty" style="grid-column:1/-1">加载中…</div>';
    try {
      items = (await callEdge('shop_list', { category: state.category, keyword: state.keyword })) || [];
    } catch (e) {
      box.innerHTML = `<div class="p4-empty" style="grid-column:1/-1">加载失败：${escapeHtml(e.message)}</div>`;
      return;
    }
    if (!items.length) {
      box.innerHTML = '<div class="p4-empty" style="grid-column:1/-1"><div class="emoji">🛒</div>暂无可兑换商品</div>';
      return;
    }
    box.innerHTML = items.map((it) => {
      const soldOut = Number(it.stock) === 0;
      const icon = CAT_ICON[it.category] || '🎁';
      const fxPrev = fxPreviewHtml(it.category, it.template);
      const media = fxPrev
        ? `<span class="p4-fx-stage">${fxPrev}</span>`
        : (it.image_url ? `<img src="${escapeHtml(it.image_url)}" alt="" loading="lazy" />` : icon);
      return `<div class="p4-card" data-item="${it.id}">
        <div class="p4-card-media">${media}</div>
        <div class="p4-card-body">
          <div class="p4-card-title">${escapeHtml(it.title)}</div>
          <div class="p4-card-desc">${escapeHtml((it.description || '').slice(0, 120))}</div>
          <div class="p4-card-foot">
            <span class="p4-price">${Number(it.price) || 0} 积分</span>
            <span class="p4-tag">${escapeHtml(CAT_LABEL[it.category] || it.category)}</span>
            <span class="p4-tag off">${durText(it.duration_type, it.duration_days)}</span>
          </div>
          <div class="p4-card-foot">
            <span class="p4-meta">${Number(it.stock) < 0 ? '不限量' : (soldOut ? '已售罄' : '剩余 ' + it.stock)} · 已售 ${it.sold_count || 0}</span>
            <button class="btn ghost sm" data-detail="${it.id}" style="margin-left:auto">详情</button>
            ${loggedIn()
              ? `<button class="btn sm" data-buy="${it.id}"${soldOut ? ' disabled' : ''}>兑换</button>`
              : '<span class="p4-meta">登录后可兑换</span>'}
          </div>
        </div>
      </div>`;
    }).join('');
    box.querySelectorAll('[data-detail]').forEach((b) => b.addEventListener('click', () => openDetail(b.dataset.detail)));
    box.querySelectorAll('[data-buy]').forEach((b) => b.addEventListener('click', () => {
      const it = items.find((x) => x.id === b.dataset.buy);
      if (it) buyItem(it, b);
    }));
  }

  async function openDetail(id) {
    let it = items.find((x) => x.id === id);
    try { const full = await callEdge('shop_detail', { id }); if (full) it = full; } catch (_e) { /* 回退到列表数据 */ }
    if (!it) { window.alert('商品不存在或已下架'); return; }
    const mask = document.createElement('div');
    mask.className = 'shop-mask';
    const soldOut = Number(it.stock) === 0;
    const isCustom = it.is_custom === true || String(it.category) === 'custom';
    mask.innerHTML = `<div class="shop-modal">
      <div class="shop-modal-head"><h3>${escapeHtml(it.title)}</h3><button class="shop-modal-close" data-close>×</button></div>
      ${(() => { const p = fxPreviewHtml(it.category, it.template, true); return p ? `<div class="p4-fx-stage detail">${p}</div>` : ''; })()}
      ${it.image_url ? `<div class="p4-card-media" style="border-radius:12px;margin-bottom:10px"><img src="${escapeHtml(it.image_url)}" alt="" /></div>` : ''}
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
        <span class="p4-tag accent">${Number(it.price) || 0} 积分</span>
        <span class="p4-tag">${escapeHtml(CAT_LABEL[it.category] || it.category)}</span>
        <span class="p4-tag off">有效期 ${durText(it.duration_type, it.duration_days)}</span>
        <span class="p4-tag off">${Number(it.stock) < 0 ? '不限量' : (soldOut ? '已售罄' : '剩余 ' + it.stock)}</span>
      </div>
      <div class="p4-pre">${escapeHtml(it.description || '暂无商品说明')}</div>
      <div style="font-size:11.5px;color:var(--faint);margin-top:10px">${isCustom
        ? '该商品为自定义类：退款需管理员确认后处理。'
        : '系统类商品支持自助退款：按原价 80% 返还积分，相应权益会被收回。'}</div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px">
        <button class="btn ghost sm" data-close>关闭</button>
        ${loggedIn() ? `<button class="btn sm" data-buynow${soldOut ? ' disabled' : ''}>${soldOut ? '已售罄' : '兑换（' + (Number(it.price) || 0) + ' 积分）'}</button>` : ''}
      </div>
    </div>`;
    mask.addEventListener('click', (e) => { if (e.target === mask || e.target.closest('[data-close]')) mask.remove(); });
    document.body.appendChild(mask);
    const buyBtn = mask.querySelector('[data-buynow]');
    if (buyBtn) buyBtn.addEventListener('click', async () => { await buyItem(it, buyBtn); mask.remove(); });
  }

  async function buyItem(it, btn) {
    if (!loggedIn()) { window.alert('请先登录后再兑换'); return; }
    const price = Number(it.price) || 0;
    if (price > coins && $('coinHint').textContent === '积分余额') {
      window.alert(`积分不足：当前 ${coins} 积分，需要 ${price} 积分。`);
      return;
    }
    if (!window.confirm(`确认花费 ${price} 积分兑换「${it.title}」？`)) return;
    btn.disabled = true;
    try {
      const r = await callEdge('shop_buy', { id: it.id });
      window.alert(`✅ 兑换成功！消耗 ${r.price} 积分，当前余额 ${r.balance} 积分。`);
      await loadBalance();
      await loadItems();
      await loadOrders();
    } catch (e) { window.alert(e.message); }
    btn.disabled = false;
  }

  // ---------------- 订单与退款 ----------------
  async function loadOrders() {
    const box = $('orderList');
    if (!loggedIn()) {
      box.innerHTML = '<div class="p4-empty"><div class="emoji">🔒</div>登录后查看你的兑换记录</div>';
      return;
    }
    box.innerHTML = '<div class="p4-empty">加载中…</div>';
    let rows = [];
    try { rows = (await callEdge('my_orders', {})) || []; }
    catch (e) { box.innerHTML = `<div class="p4-empty">加载失败：${escapeHtml(e.message)}</div>`; return; }
    if (!rows.length) { box.innerHTML = '<div class="p4-empty"><div class="emoji">🧾</div>还没有兑换记录</div>'; return; }
    box.innerHTML = rows.map((o) => {
      const snap = o.item_snapshot || {};
      const st = ORDER_STATUS[o.status] || { text: o.status, cls: 'off' };
      const canRefund = o.status === 'paid';
      return `<div class="p4-row">
        <span style="flex:1;min-width:180px">
          <b>${escapeHtml(snap.title || '商品')}</b>
          <span class="p4-tag">${escapeHtml(CAT_LABEL[snap.category] || snap.category || '')}</span>
          <span class="p4-tag ${st.cls}">${escapeHtml(st.text)}</span>
          <br /><span class="p4-meta">${Number(o.price) || 0} 积分 · ${formatTime(o.created_at)}${o.refund_amount ? ` · 已返还 ${o.refund_amount} 积分` : ''}${o.refunded_at ? ` · ${formatTime(o.refunded_at)} 退款` : ''}</span>
        </span>
        ${canRefund ? `<button class="btn ghost sm" data-refund="${o.id}">申请退款</button>` : ''}
      </div>`;
    }).join('');
    box.querySelectorAll('[data-refund]').forEach((b) => b.addEventListener('click', () => refundOrder(b.dataset.refund, b)));
  }

  async function refundOrder(orderId, btn) {
    if (!window.confirm('确认申请退款？系统类商品将按原价 80% 返还积分并收回相应权益；自定义类商品需管理员确认。')) return;
    btn.disabled = true;
    try {
      const r = await callEdge('shop_refund', { order_id: orderId });
      if (r && r.pending) window.alert('退款申请已提交，等待管理员处理。');
      else window.alert(`✅ 退款成功，返还 ${r.refunded} 积分，相应权益已收回。`);
      await loadBalance(); await loadOrders(); await loadEnts();
    } catch (e) { window.alert(e.message); }
    btn.disabled = false;
  }

  // ---------------- 我的权益 ----------------
  async function loadEnts() {
    const box = $('entList');
    if (!loggedIn()) {
      box.innerHTML = '<div class="p4-empty"><div class="emoji">🔒</div>登录后查看你的权益</div>';
      return;
    }
    box.innerHTML = '<div class="p4-empty">加载中…</div>';
    let rows = [];
    try { rows = (await callEdge('my_entitlements', {})) || []; }
    catch (e) { box.innerHTML = `<div class="p4-empty">加载失败：${escapeHtml(e.message)}</div>`; return; }
    if (!rows.length) { box.innerHTML = '<div class="p4-empty"><div class="emoji">✨</div>还没有可装备的权益，去商城兑换试试</div>'; return; }
    const groups = {};
    rows.forEach((r) => { (groups[r.type] = groups[r.type] || []).push(r); });
    box.innerHTML = Object.keys(groups).map((type) => `<div class="ent-group">
      <div class="ent-group-title">${escapeHtml(ENT_LABEL[type] || type)}</div>
      ${groups[type].map((r) => {
        const active = r.active !== false;
        const equipped = !!r.equipped && active;
        const prev = fxPreviewHtml(r.type, r.payload);
        return `<div class="ent-row">
          ${prev ? `<span class="ent-prev">${prev}</span>` : ''}
          <span class="ent-name">${escapeHtml(r.title || '（商品已删除）')}</span>
          ${equipped ? '<span class="p4-tag ok">装备中</span>' : ''}
          ${!active ? '<span class="p4-tag off">已过期/已收回</span>' : ''}
          <span class="p4-meta">${r.expires_at ? '有效期至 ' + formatTime(r.expires_at) : '永久有效'}</span>
          ${active
            ? `<button class="btn ghost sm" data-equip="${r.id}" data-on="${equipped ? 1 : 0}" style="margin-left:auto">${equipped ? '卸下' : '装备'}</button>`
            : '<span class="p4-meta" style="margin-left:auto">不可装备</span>'}
        </div>`;
      }).join('')}
    </div>`).join('');
    box.querySelectorAll('[data-equip]').forEach((b) => b.addEventListener('click', () => equipEnt(b.dataset.equip, b.dataset.on !== '1', b)));
  }

  async function equipEnt(id, equip, btn) {
    btn.disabled = true;
    try {
      await callEdge('equip_entitlement', { id, equip });
      await loadEnts();
    } catch (e) { window.alert(e.message); }
    btn.disabled = false;
  }

  // ---------------- 页签 ----------------
  function switchTab(tab) {
    state.tab = tab;
    document.querySelectorAll('.p4-tabs .chip').forEach((c) => c.classList.toggle('active', c.dataset.tab === tab));
    $('paneItems').classList.toggle('hidden', tab !== 'items');
    $('paneOrders').classList.toggle('hidden', tab !== 'orders');
    $('paneEnts').classList.toggle('hidden', tab !== 'ents');
    if (tab === 'items') loadItems();
    else if (tab === 'orders') loadOrders();
    else loadEnts();
  }

  function init() {
    readSession();
    renderBar();
    if (window.XddContentGate && !XddContentGate.allow()) return;
    document.querySelectorAll('.p4-tabs .chip').forEach((c) => c.addEventListener('click', () => switchTab(c.dataset.tab)));
    $('catFilter').addEventListener('change', () => { state.category = $('catFilter').value; loadItems(); });
    $('itemSearch').addEventListener('click', () => { state.keyword = $('itemKw').value.trim(); loadItems(); });
    $('itemKw').addEventListener('keydown', (e) => { if (e.key === 'Enter') { state.keyword = $('itemKw').value.trim(); loadItems(); } });
    $('itemRefresh').addEventListener('click', () => { loadBalance(); loadItems(); });
    loadBalance();
    loadItems();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
