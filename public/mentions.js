/* ============================================================
   XDD吧 · @提及补全（主论坛 app.js 与专栏 columns.js 共用）
   输入 @ 后按昵称匹配站内用户；重名时列出全部候选人由用户点选，
   点选结果按「昵称 → 用户 id」记在本元素上，提交时精确绑定该用户，
   避免正文里同名昵称被解析成别人。
   ============================================================ */
(function () {
  'use strict';

  const EDGE_URL = 'https://jgezpvmlnhycxslqbwcx.supabase.co/functions/v1/newtheba';
  const SUPABASE_KEY = 'sb_publishable_B29ClgwZagW32Ow5x6VdKQ_IL65F7dl';
  const MAX_PICK = 5;
  const DEBOUNCE_MS = 200;

  // 元素 → 已点选列表 [{ nickname, id }]，WeakMap 避免元素销毁后泄漏
  const pickedMap = new WeakMap();
  function pickedOf(el) {
    let a = pickedMap.get(el);
    if (!a) { a = []; pickedMap.set(el, a); }
    return a;
  }

  async function search(keyword, token) {
    const res = await fetch(EDGE_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', apikey: SUPABASE_KEY },
      body: JSON.stringify({ action: 'user_search_mentions', token: token || '', keyword })
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok || d.ok === false) throw new Error(d.error || ('请求失败 ' + res.status));
    return d.data || [];
  }

  // 光标前是否正处于「@关键词」中
  function tokenAt(el) {
    const caret = el.selectionStart;
    if (caret == null) return null;
    const before = String(el.value || '').slice(0, caret);
    const m = before.match(/(^|[\s\u3000])@([^\s@]{0,24})$/);
    if (!m) return null;
    return { start: caret - m[2].length - 1, keyword: m[2] };
  }

  function closeDrop(el) {
    if (el.__xddDrop) { el.__xddDrop.remove(); el.__xddDrop = null; }
    el.__xddItems = null;
    el.__xddIdx = -1;
  }

  function paintActive(el) {
    const drop = el.__xddDrop;
    if (!drop || !el.__xddItems) return;
    drop.querySelectorAll('.mn-item').forEach((n, i) => {
      n.classList.toggle('active', i === el.__xddIdx);
    });
  }

  function showDrop(el, items, onPick) {
    closeDrop(el);
    el.__xddItems = items;
    el.__xddIdx = items.length ? 0 : -1;
    const drop = document.createElement('div');
    drop.className = 'mention-drop';
    drop.innerHTML = items.map((u, i) => `
      <div class="mn-item${i === 0 ? ' active' : ''}" data-i="${i}">
        <span class="mn-nick">${escapeHtml(u.nickname)}</span>
        <span class="mn-lv">Lv.${Number(u.level) || 0}</span>
      </div>`).join('');
    document.body.appendChild(drop);
    el.__xddDrop = drop;
    // 挂在输入框下方；空间不足则翻到上方
    const r = el.getBoundingClientRect();
    const h = drop.offsetHeight;
    const below = window.innerHeight - r.bottom;
    drop.style.left = Math.max(8, Math.min(r.left, window.innerWidth - drop.offsetWidth - 8)) + 'px';
    drop.style.top = (below < h + 12 && r.top > h + 12 ? r.top - h - 4 : r.bottom + 4) + 'px';
    drop.addEventListener('mousedown', (e) => {
      const it = e.target.closest('.mn-item');
      if (!it) return;
      e.preventDefault();                       // 保住输入框焦点与光标
      onPick(items[Number(it.dataset.i)]);
    });
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function insertPick(el, start, user) {
    const caret = el.selectionStart == null ? el.value.length : el.selectionStart;
    const text = String(el.value || '');
    const inserted = '@' + user.nickname + ' ';
    el.value = text.slice(0, start) + inserted + text.slice(caret);
    const pos = start + inserted.length;
    try { el.setSelectionRange(pos, pos); } catch (_e) {}
    const list = pickedOf(el);
    // 同一 id 只记一次；同名不同人各自保留，提交时按昵称逐条匹配
    if (!list.some((x) => x.id === user.id)) list.push({ nickname: user.nickname, id: user.id });
    closeDrop(el);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function attach(el, opts) {
    if (!el || el.__xddMentionBound) return;
    el.__xddMentionBound = true;
    const getToken = (opts && opts.getToken) || (() => '');
    let timer = null;

    el.addEventListener('input', () => {
      const t = tokenAt(el);
      if (timer) { clearTimeout(timer); timer = null; }
      if (!t) { closeDrop(el); return; }
      const kw = t.keyword;
      timer = setTimeout(async () => {
        timer = null;
        // 输入期间用户可能已把 @ 删掉或移动光标
        const now = tokenAt(el);
        if (!now || now.keyword !== kw) return;
        let items = [];
        try { items = await search(kw, getToken()); } catch (_e) { items = []; }
        if (!items.length) { closeDrop(el); return; }
        showDrop(el, items, (u) => insertPick(el, now.start, u));
      }, DEBOUNCE_MS);
    });

    el.addEventListener('keydown', (e) => {
      const drop = el.__xddDrop;
      if (!drop || !el.__xddItems || !el.__xddItems.length) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); el.__xddIdx = (el.__xddIdx + 1) % el.__xddItems.length; paintActive(el); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); el.__xddIdx = (el.__xddIdx - 1 + el.__xddItems.length) % el.__xddItems.length; paintActive(el); }
      else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const u = el.__xddItems[el.__xddIdx];
        const t = tokenAt(el);
        if (u && t) insertPick(el, t.start, u);
      } else if (e.key === 'Escape') { e.preventDefault(); closeDrop(el); }
    });

    el.addEventListener('blur', () => setTimeout(() => closeDrop(el), 120));
    el.addEventListener('scroll', () => closeDrop(el));
    window.addEventListener('resize', () => closeDrop(el));
  }

  // 提交时取本次真正绑定到的用户：昵称仍在正文里才算数（用户可能已把 @ 删掉）
  function collect(el) {
    if (!el) return [];
    const text = String(el.value || '');
    const out = [];
    for (const x of pickedOf(el)) {
      if (!text.includes('@' + x.nickname)) continue;
      if (out.some((y) => y.id === x.id)) continue;
      out.push({ id: x.id, nickname: x.nickname });
      if (out.length >= MAX_PICK) break;
    }
    return out;
  }

  function reset(el) { pickedMap.set(el, []); closeDrop(el); }

  window.XddMentions = { attach, collect, reset, MAX_PICK };
})();
