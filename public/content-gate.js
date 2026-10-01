/* XDD吧 · 内容区统一登录门禁 */
(function () {
  'use strict';
  var TOKEN_KEY = 'nzb_user_token';
  var gate = null;

  function hasSession() {
    try { return !!localStorage.getItem(TOKEN_KEY); } catch (_e) { return false; }
  }

  function ensureStyle() {
    if (document.getElementById('xdd-content-gate-style')) return;
    var style = document.createElement('style');
    style.id = 'xdd-content-gate-style';
    style.textContent = '.xdd-content-gate{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;background:var(--bg,#0e141b);color:var(--text,#e6edf3)}.xdd-content-gate-card{width:min(420px,100%);box-sizing:border-box;text-align:center;padding:36px 28px;border:1px solid var(--line,#2a3747);border-radius:16px;background:var(--card,#18222e);box-shadow:0 20px 70px rgba(0,0,0,.42)}.xdd-content-gate-lock{font-size:42px;margin-bottom:12px}.xdd-content-gate h1{margin:0 0 10px;font-size:21px}.xdd-content-gate p{margin:0 0 20px;color:var(--muted,#9aa9b8);font-size:14px;line-height:1.7}.xdd-content-gate a{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 18px;border-radius:8px;background:var(--accent,#e07a5f);color:#fff;text-decoration:none;font-size:14px;font-weight:600}.xdd-content-gate a:hover{filter:brightness(1.08)}';
    (document.head || document.documentElement).appendChild(style);
  }

  function show() {
    if (gate) return;
    ensureStyle();
    gate = document.createElement('div');
    gate.className = 'xdd-content-gate';
    gate.setAttribute('role', 'dialog');
    gate.setAttribute('aria-modal', 'true');
    gate.innerHTML = '<div class="xdd-content-gate-card"><div class="xdd-content-gate-lock">🔒</div><h1>登录后访问贴吧内容</h1><p>学习资料、校友专栏、徽章墙、积分商城和活动中心仅对登录用户开放。</p><a href="index.html">前往登录 / 注册</a></div>';
    document.body.appendChild(gate);
    document.documentElement.style.overflow = 'hidden';
  }

  function allow() {
    return hasSession();
  }

  function init() {
    if (!hasSession()) show();
  }

  window.XddContentGate = { allow: allow, show: show, hasSession: hasSession };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
