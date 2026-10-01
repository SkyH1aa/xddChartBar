/* ============================================================
   XDD吧 · 活动配置可视化表单（admin.html 专用）
   与 public/effects.js 同一套思路：内置字段规格 → 自动生成表单 → 服务端白名单规整。
   管理员只做勾选 / 下拉 / 填数字，不需要写任何 JSON。

   三类配置：
     · 玩法细则 rule_config    { v:1, items:[{label,value}] }                        → 活动详情页展示
     · 抽奖奖品 reward_config  { v:1, prizes:[{name,weight,qty,coins,xp,badge_id}] }  → 抽奖按权重随机
     · 排行奖励 reward_config  { v:1, rewards:[{rank,coins,xp,badge_id}] }            → 结算按名次发放
   ============================================================ */
(function () {
  'use strict';

  let badges = [];        // 徽章下拉数据源（由 admin.js 通过 setBadges 注入）
  let styled = false;

  // ---------------- 内置样式（自包含，页面无需额外引 CSS） ----------------
  function ensureStyle() {
    if (styled || document.getElementById('ec-style')) { styled = true; return; }
    const st = document.createElement('style');
    st.id = 'ec-style';
    st.textContent = [
      '.ec-box{border:1px dashed var(--line);border-radius:12px;padding:10px;background:var(--card-soft)}',
      '.ec-rows{display:flex;flex-direction:column;gap:8px}',
      '.ec-row{display:flex;flex-wrap:wrap;gap:6px;align-items:flex-end;padding:8px;border:1px solid var(--line);border-radius:10px;background:var(--card)}',
      '.ec-field{display:flex;flex-direction:column;gap:3px;flex:1 1 var(--w,110px);min-width:72px}',
      '.ec-field>span{font-size:11px;color:var(--faint);white-space:nowrap}',
      '.ec-field input,.ec-field select{width:100%;padding:5px 7px;border:1px solid var(--line);border-radius:8px;background:var(--input-bg);color:var(--text);font-size:13px}',
      '.ec-acts{display:flex;gap:4px;align-items:center;margin-left:auto}',
      '.ec-mini{width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--line);border-radius:8px;background:var(--card-soft);color:var(--muted);cursor:pointer;font-size:12px;line-height:1}',
      '.ec-mini:hover:not(:disabled){color:var(--text);border-color:var(--accent)}',
      '.ec-mini:disabled{opacity:.35;cursor:not-allowed}',
      '.ec-mini.danger{color:var(--danger,#e5484d)}',
      '.ec-sum{margin-top:8px;font-size:12px;color:var(--muted);line-height:1.7}',
      '.ec-tip{color:var(--faint);margin-bottom:2px}',
      '.ec-warn{color:var(--danger,#e5484d);margin-bottom:2px}',
      '.ec-add{margin-top:8px}',
      '.ec-empty{font-size:12px;color:var(--faint);padding:4px 2px}'
    ].join('');
    document.head.appendChild(st);
    styled = true;
  }

  // ---------------- 取值助手 ----------------
  function txt(v) { return String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, '').trim(); }
  function num(v, def) {
    const s = String(v == null ? '' : v).trim();
    if (s === '') return def;
    const n = Math.floor(Number(s));
    return Number.isFinite(n) ? n : def;
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function badgeOpts() {
    return [{ v: '', label: '不附赠徽章' }].concat(badges.map((b) => ({ v: b.id, label: b.name || '徽章' })));
  }
  function blankRow(fields) {
    const o = {};
    fields.forEach((f) => { o[f.k] = f.def == null ? '' : String(f.def); });
    return o;
  }
  function fieldHtml(f, row, i) {
    const val = row[f.k] == null ? '' : row[f.k];
    const style = '--w:' + (f.w || 110) + 'px';
    if (f.type === 'select') {
      const opts = (typeof f.opts === 'function' ? f.opts() : f.opts) || [];
      const cur = String(val);
      const html = opts.map((o) => `<option value="${esc(o.v)}"${String(o.v) === cur ? ' selected' : ''}>${esc(o.label)}</option>`).join('');
      return `<label class="ec-field" style="${style}"><span>${esc(f.label)}</span>`
        + `<select data-i="${i}" data-k="${f.k}">${html}</select></label>`;
    }
    const attrs = f.type === 'num'
      ? ` type="number" inputmode="numeric" min="${f.min == null ? 0 : f.min}" step="1"`
      : ' type="text"';
    const ph = f.ph ? ` placeholder="${esc(f.ph)}"` : '';
    return `<label class="ec-field" style="${style}"><span>${esc(f.label)}</span>`
      + `<input data-i="${i}" data-k="${f.k}"${attrs} value="${esc(val)}"${ph} /></label>`;
  }

  // ---------------- 通用「可增删行」编辑器 ----------------
  function listEditor(host, spec, cfg, onChange) {
    ensureStyle();
    host.innerHTML = '';
    const state = { rows: spec.load(cfg).slice(0, spec.max) };
    if (!state.rows.length) state.rows = [spec.blank(0)];

    const box = document.createElement('div');
    box.className = 'ec-box';
    const rowsEl = document.createElement('div');
    rowsEl.className = 'ec-rows';
    const sumEl = document.createElement('div');
    sumEl.className = 'ec-sum';
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'btn sm ghost ec-add';
    addBtn.textContent = spec.addLabel;
    box.append(rowsEl, sumEl, addBtn);
    host.appendChild(box);

    function render() {
      rowsEl.innerHTML = state.rows.map((row, i) => `<div class="ec-row" data-row="${i}">`
        + spec.fields.map((f) => fieldHtml(f, row, i)).join('')
        + `<div class="ec-acts">`
        + `<button type="button" class="ec-mini" data-mv="${i}" data-dir="-1"${i === 0 ? ' disabled' : ''} title="上移">↑</button>`
        + `<button type="button" class="ec-mini" data-mv="${i}" data-dir="1"${i === state.rows.length - 1 ? ' disabled' : ''} title="下移">↓</button>`
        + `<button type="button" class="ec-mini danger" data-del="${i}" title="删除此行">✕</button>`
        + `</div></div>`).join('');
      sumEl.innerHTML = spec.summary ? spec.summary(state) : '';
      addBtn.disabled = state.rows.length >= spec.max;
      addBtn.textContent = state.rows.length >= spec.max ? `${spec.addLabel}（已达上限 ${spec.max} 行）` : spec.addLabel;
      if (onChange) onChange();
    }

    rowsEl.addEventListener('input', (e) => {
      const el = e.target.closest('[data-k]'); if (!el) return;
      const i = Number(el.dataset.i);
      if (!state.rows[i]) return;
      state.rows[i][el.dataset.k] = el.value;
      sumEl.innerHTML = spec.summary ? spec.summary(state) : '';
      if (onChange) onChange();
    });
    rowsEl.addEventListener('change', (e) => {
      const el = e.target.closest('select[data-k]'); if (!el) return;
      const i = Number(el.dataset.i);
      if (!state.rows[i]) return;
      state.rows[i][el.dataset.k] = el.value;
      if (onChange) onChange();
    });
    rowsEl.addEventListener('click', (e) => {
      const mv = e.target.closest('[data-mv]');
      if (mv) {
        const i = Number(mv.dataset.mv); const j = i + Number(mv.dataset.dir);
        if (j < 0 || j >= state.rows.length) return;
        const t = state.rows[i]; state.rows[i] = state.rows[j]; state.rows[j] = t;
        render(); return;
      }
      const del = e.target.closest('[data-del]');
      if (del) {
        if (state.rows.length <= 1) { state.rows[0] = spec.blank(0); }
        else state.rows.splice(Number(del.dataset.del), 1);
        render();
      }
    });
    addBtn.addEventListener('click', () => {
      if (state.rows.length >= spec.max) return;
      state.rows.push(spec.blank(state.rows.length));
      render();
    });

    render();
    return {
      get: () => spec.read(state),
      set: (next) => {
        state.rows = spec.load(next).slice(0, spec.max);
        if (!state.rows.length) state.rows = [spec.blank(0)];
        render();
      }
    };
  }

  // ---------------- 规格：抽奖奖品 ----------------
  const PRIZE_FIELDS = [
    { k: 'name', label: '奖品名称', type: 'text', ph: '一等奖', w: 132, def: '' },
    { k: 'weight', label: '权重', type: 'num', ph: '10', w: 68, min: 0, def: 10 },
    { k: 'qty', label: '数量', type: 'num', ph: '留空=不限', w: 92, min: 0, def: '' },
    { k: 'coins', label: '积分', type: 'num', ph: '0', w: 68, min: 0, def: '' },
    { k: 'xp', label: '经验', type: 'num', ph: '0', w: 68, min: 0, def: '' },
    { k: 'badge_id', label: '附赠徽章', type: 'select', w: 148, def: '', opts: badgeOpts }
  ];
  const PRIZE_SPEC = {
    fields: PRIZE_FIELDS,
    max: 50,
    addLabel: '＋ 添加奖品',
    blank: () => blankRow(PRIZE_FIELDS),
    load: (cfg) => {
      const arr = cfg && Array.isArray(cfg.prizes) ? cfg.prizes : [];
      return arr.map((p) => ({
        name: p && p.name != null ? String(p.name) : '',
        weight: p && p.weight != null ? String(p.weight) : '10',
        qty: p && p.qty != null ? String(p.qty) : '',
        coins: p && p.coins != null ? String(p.coins) : '',
        xp: p && p.xp != null ? String(p.xp) : '',
        badge_id: (p && p.badge_id) || ''
      }));
    },
    // 未填写名称的行不算奖品，避免空行被保存成「奖品」垃圾数据
    read: (state) => {
      const prizes = [];
      state.rows.forEach((r) => {
        const name = txt(r.name);
        if (!name) return;
        const o = { name, weight: Math.max(0, num(r.weight, 0)) };
        if (String(r.qty).trim() !== '') o.qty = Math.max(0, num(r.qty, 0));
        const c = Math.max(0, num(r.coins, 0)); if (c) o.coins = c;
        const x = Math.max(0, num(r.xp, 0)); if (x) o.xp = x;
        if (r.badge_id) o.badge_id = r.badge_id;
        prizes.push(o);
      });
      return prizes.length ? { v: 1, prizes } : null;
    },
    summary: (state) => {
      const named = state.rows.map((r, i) => ({ r, i })).filter((x) => txt(x.r.name));
      if (!named.length) return '<div class="ec-warn">还没有有效奖品（需填写「奖品名称」），抽奖将无法进行</div>';
      const w = state.rows.map((r) => Math.max(0, num(r.weight, 0)));
      const total = w.reduce((a, b) => a + b, 0);
      let html = total > 0
        ? `<div class="ec-tip">总权重 ${total} · 按权重随机抽取 · 某奖品库存抽完会自动跳过它</div>`
        : '<div class="ec-warn">总权重为 0，抽奖无法进行：请至少给一个奖品设置大于 0 的权重</div>';
      html += named.map(({ r, i }) => {
        const p = total > 0 ? ((w[i] / total) * 100).toFixed(2) + '%' : '—';
        const q = String(r.qty).trim() === '' ? '不限量' : `限 ${Math.max(0, num(r.qty, 0))} 份`;
        const extra = [];
        if (num(r.coins, 0)) extra.push(`+${num(r.coins, 0)} 积分`);
        if (num(r.xp, 0)) extra.push(`+${num(r.xp, 0)} 经验`);
        if (r.badge_id) {
          const b = badges.find((x) => x.id === r.badge_id);
          extra.push(`徽章「${esc(b ? (b.name || '徽章') : '已删除的徽章')}」`);
        }
        return `<div>· ${esc(txt(r.name))}：中奖概率 ${p} · ${q}${extra.length ? ' · ' + extra.join('、') : ''}</div>`;
      }).join('');
      return html;
    }
  };

  // ---------------- 规格：排行奖励 ----------------
  const REWARD_FIELDS = [
    { k: 'rank', label: '名次', type: 'num', ph: '1', w: 70, min: 1, def: 1 },
    { k: 'coins', label: '积分', type: 'num', ph: '100', w: 82, min: 0, def: '' },
    { k: 'xp', label: '经验', type: 'num', ph: '20', w: 82, min: 0, def: '' },
    { k: 'badge_id', label: '附赠徽章', type: 'select', w: 148, def: '', opts: badgeOpts }
  ];
  const REWARD_SPEC = {
    fields: REWARD_FIELDS,
    max: 100,
    addLabel: '＋ 添加名次奖励',
    blank: (i) => {
      const o = blankRow(REWARD_FIELDS);
      o.rank = String((Number(i) || 0) + 1);
      return o;
    },
    load: (cfg) => {
      const arr = cfg && Array.isArray(cfg.rewards) ? cfg.rewards : [];
      if (!arr.length) return [1, 2, 3].map((rk) => {
        const o = blankRow(REWARD_FIELDS);
        o.rank = String(rk);
        o.coins = String(rk === 1 ? 100 : rk === 2 ? 60 : 30);
        o.xp = String(rk === 1 ? 20 : rk === 2 ? 12 : 6);
        return o;
      });
      return arr.map((r) => ({
        rank: r && r.rank != null ? String(r.rank) : '1',
        coins: r && r.coins != null ? String(r.coins) : '',
        xp: r && r.xp != null ? String(r.xp) : '',
        badge_id: (r && r.badge_id) || ''
      }));
    },
    // 只有名次、没有任何奖励的行忽略（否则会凭空增加发奖人数上限）
    read: (state) => {
      const rewards = [];
      state.rows.forEach((r) => {
        const c = Math.max(0, num(r.coins, 0));
        const x = Math.max(0, num(r.xp, 0));
        if (!c && !x && !r.badge_id) return;
        const o = { rank: Math.min(1000, Math.max(1, num(r.rank, 1))) };
        if (c) o.coins = c;
        if (x) o.xp = x;
        if (r.badge_id) o.badge_id = r.badge_id;
        rewards.push(o);
      });
      return rewards.length ? { v: 1, rewards } : null;
    },
    summary: (state) => {
      const ranks = state.rows.map((r) => num(r.rank, 1)).filter((n) => n > 0);
      const maxRank = ranks.length ? Math.max.apply(null, ranks) : 0;
      const dup = ranks.filter((n, i) => ranks.indexOf(n) !== i);
      let html = `<div class="ec-tip">结算时按排行榜名次发奖；未配置的名次沿用默认值（第1名 100 积分 / 20 经验，第2名 60 / 12，第3名 30 / 6，之后为 0）</div>`;
      html += `<div>· 已配置 ${ranks.length} 个名次${maxRank ? `，最高到第 ${maxRank} 名` : ''}；结算取「已配置名次数」与 3 的较大值作为发奖人数上限</div>`;
      if (dup.length) html += `<div class="ec-warn">名次重复：第 ${Array.from(new Set(dup)).join('、')} 名被配置了多次，同名次只有第一条生效</div>`;
      return html;
    }
  };

  // ---------------- 规格：玩法细则 ----------------
  const RULE_FIELDS = [
    { k: 'label', label: '细则标题', type: 'text', ph: '每人可抽奖次数', w: 160, def: '' },
    { k: 'value', label: '说明', type: 'text', ph: '每天 1 次，活动期内最多 3 次', w: 260, def: '' }
  ];
  const RULE_SPEC = {
    fields: RULE_FIELDS,
    max: 30,
    addLabel: '＋ 添加细则',
    blank: () => blankRow(RULE_FIELDS),
    load: (cfg) => {
      const arr = cfg && Array.isArray(cfg.items) ? cfg.items : [];
      return arr.map((it) => ({
        label: it && it.label != null ? String(it.label) : '',
        value: it && it.value != null ? String(it.value) : ''
      }));
    },
    read: (state) => {
      const items = [];
      state.rows.forEach((r) => {
        const label = txt(r.label); const value = txt(r.value);
        if (!label && !value) return;
        items.push({ label: label || '细则', value });
      });
      return items.length ? { v: 1, items } : null;
    },
    summary: (state) => {
      const n = state.rows.filter((r) => txt(r.label) || txt(r.value)).length;
      if (!n) return '<div class="ec-empty">还没有细则条目。未启用「启用玩法细则」或没有条目时，活动详情页不会显示这一栏。</div>';
      return `<div class="ec-tip">共 ${n} 条，将以「标题：说明」的形式展示在活动详情页的「玩法细则」栏</div>`;
    }
  };

  window.XddEventCfg = {
    // 注入徽章下拉数据（admin_badge_list 的结果）
    setBadges(list) { badges = Array.isArray(list) ? list : []; },
    // 抽奖奖品
    prizes(host, cfg, onChange) { return listEditor(host, PRIZE_SPEC, cfg, onChange); },
    // 排行奖励
    rewards(host, cfg, onChange) { return listEditor(host, REWARD_SPEC, cfg, onChange); },
    // 玩法细则
    rules(host, cfg, onChange) { return listEditor(host, RULE_SPEC, cfg, onChange); },
    // 按玩法自动选择奖励表单（抽奖 → 奖品；排行类 → 名次奖励）
    reward(host, mode, cfg, onChange) {
      return mode === 'lottery' ? this.prizes(host, cfg, onChange) : this.rewards(host, cfg, onChange);
    }
  };
})();
