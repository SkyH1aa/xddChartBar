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

  /* ============================================================
     正文 @提及 → 可点击直达个人主页
     正文里存的是纯文本「@昵称」，没有用户 id。这里按昵称批量反查 id
     （重名不猜：后端只回唯一昵称），命中后把 @昵称 换成可点击元素。
     ============================================================ */
  const AT_RE = /@([^\s@<>#，。！？、,.!?：:；;]{1,24})/g;
  const AT_SKIP = 'a,button,textarea,input,select,option,script,style,noscript,'
    + '[contenteditable],.at-user,.mention-drop,.mn-item,.own-acts';
  const idOfNick = new Map();   // 昵称 → 用户 id（只放解析成功的）
  const atMiss = new Set();     // 重名 / 不存在 / 已注销 → 不再重复请求
  const atPending = new Set();
  let atTimer = null;

  function atEl(nick, id) {
    const s = document.createElement('span');
    s.className = 'at-user';
    s.dataset.openProfile = id;
    s.dataset.nick = nick;
    s.title = '查看 ' + nick + ' 的个人主页';
    s.textContent = '@' + nick;
    return s;
  }

  async function atFlush() {
    atTimer = null;
    const names = Array.from(atPending);
    atPending.clear();
    if (!names.length) return;
    let map = {};
    try {
      const res = await fetch(EDGE_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json', apikey: SUPABASE_KEY },
        body: JSON.stringify({ action: 'mention_resolve', nicknames: names })
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.ok !== false && d.data) map = d.data;
    } catch (_e) { /* 网络异常：本轮保持纯文本，不打扰阅读 */ }
    names.forEach((n) => { if (map[n]) idOfNick.set(n, map[n]); else atMiss.add(n); });
    if (Object.keys(map).length) decorate(document.body);
  }

  function atQueue(nick) {
    if (idOfNick.has(nick) || atMiss.has(nick) || atPending.has(nick)) return;
    atPending.add(nick);
    if (!atTimer) atTimer = setTimeout(atFlush, 120);
  }

  // 把 root 子树文本节点里的 @昵称 换成可点击元素；已解析的立刻换，未解析的入队等回包
  function decorate(root) {
    const scope = !root ? document.body : (root.nodeType === 1 ? root : root.parentElement);
    if (!scope || !scope.isConnected) return;
    const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, null);
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) {
      if (!n.nodeValue || n.nodeValue.indexOf('@') < 0) continue;
      const p = n.parentElement;
      if (!p || p.closest(AT_SKIP)) continue;
      nodes.push(n);
    }
    nodes.forEach((node) => {
      const text = node.nodeValue;
      AT_RE.lastIndex = 0;
      let m, last = 0, frag = null;
      while ((m = AT_RE.exec(text))) {
        const nick = m[1];
        const id = idOfNick.get(nick);
        if (!id) { atQueue(nick); continue; }
        if (!frag) frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode(text.slice(last, m.index)));
        frag.appendChild(atEl(nick, id));
        last = m.index + m[0].length;
      }
      if (frag) {
        frag.appendChild(document.createTextNode(text.slice(last)));
        node.parentNode.replaceChild(frag, node);
      }
    });
  }

  // 页面动态渲染（翻页 / 展开评论 / 专栏列表…）后自动补齐，无需各页手动调用
  let atMoTimer = null;
  const atDirty = new Set();
  function scheduleDecorate(node) {
    if (node.nodeType === 3) {
      if (!node.parentElement) return;
      atDirty.add(node.parentElement);
    } else if (node.nodeType === 1) {
      atDirty.add(node);
    } else return;
    if (atMoTimer) return;
    atMoTimer = setTimeout(() => {
      atMoTimer = null;
      const roots = Array.from(atDirty);
      atDirty.clear();
      roots.forEach((r) => decorate(r));
    }, 60);
  }
  function startObserver() {
    if (!document.body) return;
    new MutationObserver((muts) => {
      muts.forEach((m) => m.addedNodes.forEach(scheduleDecorate));
    }).observe(document.documentElement, { childList: true, subtree: true });
    decorate(document.body);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startObserver, { once: true });
  else startObserver();

  // 点击 @提及：主论坛交给页面自己的 openProfile（页内弹层），其余页面直接跳个人主页
  document.addEventListener('click', (e) => {
    const at = e.target && e.target.closest ? e.target.closest('.at-user') : null;
    if (!at) return;
    const id = at.dataset.openProfile;
    if (!id) return;
    e.preventDefault();
    e.stopPropagation();
    if (typeof window.__xddOpenProfile === 'function') { window.__xddOpenProfile(id); return; }
    try { location.href = 'index.html#profile-' + encodeURIComponent(id); } catch (_e) {}
  });

  window.XddMentions = { attach, collect, reset, decorate, MAX_PICK };
})();
