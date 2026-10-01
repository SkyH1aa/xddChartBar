/* =============================================================================
 * XDD吧 · 第三期功能「一键全自动」验收脚本（浏览器控制台版）
 * -----------------------------------------------------------------------------
 * 用法：打开站点任意页面（index.html / admin.html / study.html）
 *       → F12 打开 Console → 整段粘贴 → 回车。
 *
 *       粘贴后【无需任何手动输入】，脚本会自动：
 *         ① 读取登录态（管理员 token 自动取自 localStorage: nzb_admin_token）
 *         ② 自动准备两个测试账号（已存在直接登录，不存在自动注册 + 自动过验证码
 *             + 自动处理邀请码注册开关）
 *         ③ 环境自检 → 只读验收 → 写流程验收（问答 / 学习资料 / 失物招领 / 学科）
 *         ④ 自动清理本轮产生的测试帖与测试学科（含历史残留）
 *         ⑤ 输出汇总表格 + 通过/失败结论
 *
 *       想中止：XDDQA.stop()
 *       想分步跑：XDDQA.help()
 *
 * 说明：
 *   - 全部请求走 Edge Function，跨域已开（Access-Control-Allow-Origin: *），
 *     因此 file:// 本地打开页面同样可用（不要用 fetch 去读本地 js，会被 CORS 拦）。
 *   - 写流程受服务端限流（发帖 4/分、发帖+评论合计 5/分），脚本内置自动排队等待，
 *     整体耗时约 2~3 分钟，属正常现象。
 *   - 每日发布满 10 条后服务端会要求验证码，脚本会自动解算并重试，无需人工干预。
 *   - 会残留两个专用测试账号（qa_selfcheck_a / qa_selfcheck_b），用于下次直接登录，
 *     不会污染你自己的账号数据。
 * ========================================================================== */
(function () {
  'use strict';

  var VERSION = 'auto-2026.10.01';
  var SB = 'https://jgezpvmlnhycxslqbwcx.supabase.co';
  var EDGE = SB + '/functions/v1/newtheba';
  var KEY = 'sb_publishable_B29ClgwZagW32Ow5x6VdKQ_IL65F7dl';

  var BEST_ANSWER_XP = 15;
  var TRADE_TOPIC = '失物招领';
  var STUDY_TOPIC = '学习资料';
  var QA_TAG = '[QA自动验收]';

  var ACCOUNT_A = 'qa_selfcheck_a';
  var ACCOUNT_B = 'qa_selfcheck_b';
  var ACCOUNT_PWD = 'QaSelfCheck2026';
  var DEVICE_KEY = 'qa-selfcheck-device';

  /* ============================ 运行时状态 ============================ */
  var tokens = { admin: '', user: '', user2: '' };
  var made = { posts: [], subjects: [] };
  var rows = [];
  var ctx = { qa: {}, study: {}, trade: {}, sub: {} };
  var state = {
    running: false,
    stopped: false,
    siteOpen: true,
    adminName: '',
    adminPerms: null,
    finished: false
  };

  /* ============================ 小工具 ============================ */
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function rand(n) { var s = ''; while (s.length < n) s += Math.random().toString(36).slice(2); return s.slice(0, n); }
  function lsGet(k) { try { return localStorage.getItem(k) || ''; } catch (_e) { return ''; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (_e) {} }
  function prune(a, win) { var t = Date.now(); while (a.length && t - a[0] >= win) a.shift(); }

  function Skip(msg) { this.message = msg; this.__skip = true; }
  Skip.prototype = Object.create(Error.prototype);
  function must(cond, msg) { if (!cond) throw new Error(msg || '断言失败'); }
  function req(v, msg) { if (!v) throw new Skip(msg || '前置步骤未完成'); return v; }

  /* ============================ 限流排队 ============================ */
  // 服务端两道上限：post_create 4/60s、comment_create 8/60s，且「发帖+评论」合计 5/60s。
  // 这里在客户端提前排队，避免把 429 当成用例失败。
  var gate = { post: [], comment: [], act: [] };
  async function reserve(kind) {
    for (var guard = 0; guard < 60; guard++) {
      prune(gate.act, 60000); prune(gate.post, 60000); prune(gate.comment, 60000);
      var q = kind === 'post' ? gate.post : gate.comment;
      var okAct = gate.act.length < 5;
      var okOp = q.length < (kind === 'post' ? 4 : 8);
      if (okAct && okOp) {
        var t = Date.now();
        gate.act.push(t); q.push(t);
        return;
      }
      var waits = [];
      if (!okAct) waits.push(60000 - (Date.now() - gate.act[0]));
      if (!okOp) waits.push(60000 - (Date.now() - q[0]));
      var w = Math.max.apply(null, waits) + 400;
      console.log('⏳ 服务端限流冷却中，等待 ' + Math.ceil(w / 1000) + 's 后继续…');
      await sleep(w);
    }
    throw new Error('限流排队超时');
  }

  /* ============================ 人机验证自动解算 ============================ */
  // 服务端返回 8 个球，其中 2 个为 #ef4444（红球），答案就是这两个球的下标。
  function solveCaptcha(c) {
    var idx = [];
    (c && c.balls || []).forEach(function (b, i) {
      if (String(b && b.color || '').toLowerCase() === '#ef4444') idx.push(i);
    });
    return idx.slice(0, 2);
  }
  function captchaFields(c) {
    return { captcha_id: c.id, captcha_ans: solveCaptcha(c), captcha_sig: c.sig, captcha_exp: c.exp };
  }

  /* ============================ 统一请求层 ============================ */
  async function api(action, payload, token, opts) {
    opts = opts || {};
    if (action === 'post_create') await reserve('post');
    if (action === 'comment_create') await reserve('comment');

    var attempt = 0;
    for (;;) {
      attempt++;
      var tk = token === undefined ? (tokens.admin || tokens.user) : token;
      var body = Object.assign({ action: action }, payload || {});
      if (tk) body.token = tk;

      var res, j = {};
      try {
        res = await fetch(EDGE, {
          method: 'POST',
          headers: { 'content-type': 'application/json', apikey: KEY },
          body: JSON.stringify(body)
        });
        try { j = await res.json(); } catch (_e) {}
      } catch (e) {
        return { status: 0, ok: false, data: null, error: '网络错误：' + e.message, raw: {} };
      }

      // ① 服务端要求验证码（每日发布上限 / 匿名发帖）→ 自动解算后重试
      if (j && j.need_captcha && j.captcha && attempt < 4 && !opts.noCaptcha) {
        Object.assign(body, captchaFields(j.captcha));
        continue;
      }
      // ② 429 限流 → 自动等待后重试（登录锁定类 429 不重试）
      var errText = String(j && j.error || '');
      if (res.status === 429 && attempt < 6 && !opts.noRetry && !/尝试次数过多/.test(errText)) {
        console.log('⏳ 接口限流（' + action + '），等待 20s 后重试…');
        await sleep(20000);
        continue;
      }

      return {
        status: res.status,
        ok: res.ok && j.ok !== false,
        data: j.data,
        error: errText || (res.ok ? '' : ('HTTP ' + res.status)),
        raw: j
      };
    }
  }

  /* ============================ 用例记录 ============================ */
  function rec(group, name, status, info, ms) {
    rows.push({ 组: group, 用例: name, 结果: status, 说明: info || '', 耗时ms: ms || 0 });
    var icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
    console.log(icon + ' [' + group + '] ' + name + (info ? ' — ' + info : ''));
  }

  async function step(group, name, need, fn) {
    if (state.stopped) return rec(group, name, 'SKIP', '用户已中止');
    if (need === 'admin' && !tokens.admin) return rec(group, name, 'SKIP', '缺少管理员登录态（请先在 admin.html 登录后重新粘贴脚本）');
    if (need === 'user' && !tokens.user) return rec(group, name, 'SKIP', '缺少测试账号 A');
    if (need === 'user2' && !tokens.user2) return rec(group, name, 'SKIP', '缺少测试账号 B');
    var t0 = Date.now();
    try {
      var info = await fn();
      rec(group, name, 'PASS', info || '', Date.now() - t0);
    } catch (e) {
      var isSkip = !!(e && e.__skip);
      rec(group, name, isSkip ? 'SKIP' : 'FAIL', (e && e.message) || String(e), Date.now() - t0);
    }
  }

  function report() {
    var pass = rows.filter(function (r) { return r.结果 === 'PASS'; }).length;
    var fail = rows.filter(function (r) { return r.结果 === 'FAIL'; }).length;
    var skip = rows.filter(function (r) { return r.结果 === 'SKIP'; }).length;
    console.log('\n===== 验收汇总：PASS ' + pass + ' / FAIL ' + fail + ' / SKIP ' + skip + ' =====');
    if (rows.length) console.table(rows);
    if (fail) {
      console.warn('失败用例：\n' + rows.filter(function (r) { return r.结果 === 'FAIL'; })
        .map(function (r) { return '- [' + r.组 + '] ' + r.用例 + '：' + r.说明; }).join('\n'));
    }
    var line = fail === 0
      ? '%c✅ 验收结论：全部通过（PASS ' + pass + '，SKIP ' + skip + '）'
      : '%c❌ 验收结论：存在失败项（FAIL ' + fail + '），请查看上方失败清单';
    console.log(line, 'font-weight:bold;font-size:14px;color:' + (fail === 0 ? '#16a34a' : '#dc2626'));
    return { pass: pass, fail: fail, skip: skip, rows: rows };
  }

  /* ============================ 账号自动准备 ============================ */
  async function fetchCaptcha() {
    var r = await api('captcha_new', {}, null);
    if (!r.ok || !r.data || !r.data.balls) throw new Error('获取验证码失败：' + (r.error || '未知错误'));
    return r.data;
  }

  async function loginUser(username, password) {
    var cap = await fetchCaptcha();
    return api('user_login', Object.assign({
      username: username, password: password, device_key: DEVICE_KEY, device_name: 'QA自动验收'
    }, captchaFields(cap)), null, { noCaptcha: true });
  }

  async function registerUser(username, password) {
    var cap = await fetchCaptcha();
    var base = Object.assign({
      username: username, password: password, device_key: DEVICE_KEY, device_name: 'QA自动验收'
    }, captchaFields(cap));
    var r = await api('user_register', base, null, { noCaptcha: true });
    if (r.ok) return r;
    // 站点开启「邀请码注册」时：用管理员身份自动生成一个邀请码再重试
    if (/邀请码/.test(r.error || '') && tokens.admin) {
      var inv = await api('admin_invite_create', { count: 1 }, tokens.admin);
      var code = inv.ok && inv.data && inv.data.codes && inv.data.codes[0];
      if (code) {
        var cap2 = await fetchCaptcha();
        var retry = Object.assign({}, base, { invite_code: code }, captchaFields(cap2));
        var r2 = await api('user_register', retry, null, { noCaptcha: true });
        if (r2.ok) r2.inviteCode = code;
        return r2;
      }
    }
    return r;
  }

  async function ensureAccount(base) {
    var names = [base, base + '_' + rand(4)];
    var lastErr = '';
    for (var i = 0; i < names.length; i++) {
      var uname = names[i];
      var lg = await loginUser(uname, ACCOUNT_PWD);
      if (lg.ok && lg.data && lg.data.token) {
        console.log('🔑 测试账号已就绪（登录）：' + uname);
        return { token: lg.data.token, name: uname };
      }
      lastErr = lg.error || '';
      if (lg.status === 429) throw new Error('登录被限流：' + lastErr);
      var rg = await registerUser(uname, ACCOUNT_PWD);
      if (rg.ok && rg.data && rg.data.token) {
        console.log('🆕 测试账号已就绪（新注册）：' + uname + (rg.inviteCode ? '（邀请码 ' + rg.inviteCode + '）' : ''));
        return { token: rg.data.token, name: uname };
      }
      lastErr = rg.error || lastErr;
      if (!/已被注册/.test(rg.error || '')) {
        // 非「已注册」类失败：换一个带随机后缀的名字再试一次
        continue;
      }
    }
    throw new Error('测试账号准备失败：' + lastErr);
  }

  async function bootAdmin() {
    var t = lsGet('nzb_admin_token');
    if (!t) return false;
    var r = await api('whoami', {}, t, { noRetry: true });
    if (!r.ok) return false;
    tokens.admin = t;
    state.adminName = r.data.name || (r.data.isFounder ? '创始人' : '管理员');
    state.adminPerms = r.data.perms || {};
    return true;
  }

  async function bootstrap() {
    var okAdmin = await bootAdmin();
    if (okAdmin) {
      console.log('🔑 管理员登录态已就绪：' + state.adminName);
    } else {
      console.warn('⚠️ 未检测到管理员登录态（localStorage.nzb_admin_token）。' +
        '管理端相关用例将标记为 SKIP；如需完整验收，请先在 admin.html 登录，再重新粘贴本脚本。');
    }
    var a = await ensureAccount(ACCOUNT_A);
    var b = await ensureAccount(ACCOUNT_B);
    tokens.user = a.token;
    tokens.user2 = b.token;
    return { okAdmin: okAdmin, userA: a.name, userB: b.name };
  }

  /* ============================ 通用取数辅助 ============================ */
  async function xpOf(token) {
    var r = await api('user_whoami', {}, token);
    must(r.ok, '读取用户信息失败：' + r.error);
    return Number(r.data.xp_event) || 0;
  }

  async function findPost(postId) {
    var r = await api('list_posts', { keyword: QA_TAG, page: 1, pageSize: 200 }, tokens.admin);
    must(r.ok, 'list_posts 失败：' + r.error);
    return (r.data || []).filter(function (p) { return p.id === postId; })[0] || null;
  }

  async function ensureSubject() {
    var subs = await api('subject_list', {}, null);
    must(subs.ok, 'subject_list 失败：' + subs.error);
    if ((subs.data || []).length) return subs.data[0];
    if (!tokens.admin) throw new Skip('没有可用学科，且缺少管理员登录态无法自动创建');
    var name = '__QA临时学科' + String(Date.now()).slice(-6);
    var c = await api('admin_subject_create', { name: name, display_name: name, sort: 999, enabled: true }, tokens.admin);
    must(c.ok, '自动创建临时学科失败：' + c.error);
    made.subjects.push({ id: c.data.id, name: name });
    console.log('🆕 自动创建临时学科：' + name);
    return { id: c.data.id, name: name, display_name: name };
  }

  /* ============================ 环境自检 ============================ */
  async function env() {
    var out = {};
    var site = await api('site_get', {}, null);
    state.siteOpen = !(site.ok && site.data && site.data.open === false);
    out['站点开关'] = site.ok
      ? (state.siteOpen ? '开放（可跑写流程）' : '已关闭（写流程会被拒绝）')
      : ('读取失败：' + site.error);
    out['管理员登录态'] = tokens.admin ? (state.adminName || '已就绪') : '缺失（管理端用例将 SKIP）';
    out['测试账号 A（楼主）'] = tokens.user ? '已就绪' : '缺失';
    out['测试账号 B（答主）'] = tokens.user2 ? '已就绪' : '缺失';

    if (tokens.admin) {
      var p = state.adminPerms || {};
      var on = Object.keys(p).filter(function (k) { return p[k]; });
      out['已授权限'] = on.join('、') || '无';
      out['第三期权限位'] = ['can_review', 'can_digest', 'can_qa', 'can_trade']
        .map(function (k) { return k + '=' + (p[k] ? '✔' : '✘'); }).join('  ');
    }
    if (tokens.user) {
      var u = await api('user_whoami', {}, tokens.user);
      out['测试账号 A 资料'] = u.ok
        ? ((u.data.nickname || u.data.username) + '（Lv' + u.data.level + '，事件经验 ' + (Number(u.data.xp_event) || 0) + '）')
        : ('读取失败：' + u.error);
    }
    console.log('===== 环境自检 =====');
    console.table(out);
    return out;
  }

  /* ============================ 只读验收（不改数据） ============================ */
  async function readonlySteps() {
    /* ---- 组 1：公开取数与可见性 ---- */
    await step('公开取数', 'subject_list 只返回启用学科', null, async function () {
      var r = await api('subject_list', {}, null);
      must(r.ok, 'subject_list 失败：' + r.error);
      var list = r.data || [];
      must(Array.isArray(list), '返回格式不是数组');
      must(list.every(function (s) { return s.enabled !== false; }), '返回了已停用学科');
      return '共 ' + list.length + ' 个启用学科';
    });

    await step('公开取数', 'study_list 仅含「已审核·未屏蔽·学习资料」', null, async function () {
      var r = await api('study_list', { page: 1, pageSize: 50 }, null);
      must(r.ok, 'study_list 失败：' + r.error);
      var list = (r.data && r.data.list) || [];
      var bad = list.filter(function (p) { return p.topic !== STUDY_TOPIC || p.reviewed !== true || p.blocked === true; });
      must(!bad.length, '发现 ' + bad.length + ' 条不合规帖子：' + bad.slice(0, 3).map(function (p) { return p.id; }).join(','));
      return '本页 ' + list.length + ' 条，全部合规';
    });

    await step('公开取数', 'study_list 精选仅含已加精资料帖', null, async function () {
      var r = await api('study_list', { sort: 'digest', page: 1, pageSize: 50 }, null);
      must(r.ok, 'study_list(digest) 失败：' + r.error);
      var list = (r.data && r.data.list) || [];
      must(list.every(function (p) { return p.topic === STUDY_TOPIC; }), '精选里混入非学习资料帖');
      return '精选 ' + list.length + ' 条';
    });

    /* ---- 组 2：管理端取数与筛选 ---- */
    await step('管理取数', 'list_posts 多话题（吃瓜 + 学习资料）', 'admin', async function () {
      var r = await api('list_posts', { topics: ['吃瓜', STUDY_TOPIC], page: 1, pageSize: 50 }, tokens.admin);
      must(r.ok, 'list_posts 失败：' + r.error);
      var list = r.data || [];
      must(list.every(function (p) { return p.topic === '吃瓜' || p.topic === STUDY_TOPIC; }), '多话题取数混入其他话题');
      var pending = list.filter(function (p) { return p.reviewed !== true && !p.blocked; }).length;
      return '共 ' + list.length + ' 条，其中待审 ' + pending + ' 条';
    });

    await step('管理取数', '失物招领按「进行中」筛选', 'admin', async function () {
      var r = await api('list_posts', { topic: TRADE_TOPIC, trade_status: 'ongoing', page: 1, pageSize: 100 }, tokens.admin);
      must(r.ok, 'list_posts 失败：' + r.error);
      var bad = (r.data || []).filter(function (p) { return (p.trade_status || 'ongoing') !== 'ongoing'; });
      must(!bad.length, '筛选结果含非「进行中」帖子');
      return '进行中 ' + (r.data || []).length + ' 条';
    });

    await step('管理取数', '问答「仅求助中」筛选准确', 'admin', async function () {
      var r = await api('list_posts', { ask_only: true, unresolved_only: true, page: 1, pageSize: 100 }, tokens.admin);
      must(r.ok, 'list_posts 失败：' + r.error);
      var bad = (r.data || []).filter(function (p) { return p.ask_mode !== true || p.resolved === true; });
      must(!bad.length, '「仅求助中」筛选不准确');
      return '求助中 ' + (r.data || []).length + ' 条';
    });

    await step('管理取数', '问答「仅已解决」筛选准确', 'admin', async function () {
      var r = await api('list_posts', { ask_only: true, resolved: true, page: 1, pageSize: 100 }, tokens.admin);
      must(r.ok, 'list_posts 失败：' + r.error);
      var bad = (r.data || []).filter(function (p) { return p.ask_mode !== true || p.resolved !== true; });
      must(!bad.length, '「仅已解决」筛选不准确');
      return '已解决 ' + (r.data || []).length + ' 条';
    });

    await step('管理取数', '问答「话题 + 时间」组合过滤', 'admin', async function () {
      var today = new Date().toISOString().slice(0, 10);
      var r = await api('list_posts', {
        ask_only: true, topic: '闲聊', from: '2020-01-01', to: today + 'T23:59:59', page: 1, pageSize: 50
      }, tokens.admin);
      must(r.ok, 'list_posts 失败：' + r.error);
      must((r.data || []).every(function (p) { return p.topic === '闲聊'; }), '话题过滤失效');
      return (r.data || []).length + ' 条';
    });

    await step('管理取数', 'queue_unread 返回 review / reports 角标', 'admin', async function () {
      var r = await api('queue_unread', {}, tokens.admin);
      must(r.ok, 'queue_unread 失败：' + r.error);
      must(r.data && typeof r.data.review === 'number', 'review 角标缺失：' + JSON.stringify(r.data));
      return '待审 ' + r.data.review + '，举报 ' + r.data.reports;
    });

    await step('管理取数', 'admin_subject_list 带在用帖数（post_count）', 'admin', async function () {
      var r = await api('admin_subject_list', {}, tokens.admin);
      must(r.ok, 'admin_subject_list 失败：' + r.error);
      var list = r.data || [];
      must(list.every(function (s) { return 'post_count' in s; }), '未返回 post_count，无法判断可否删除');
      return '共 ' + list.length + ' 个学科';
    });

    /* ---- 组 3：权限矩阵 ---- */
    await step('权限', '未登录调用 admin_subject_list → 401', null, async function () {
      var r = await api('admin_subject_list', {}, null, { noRetry: true });
      must(!r.ok && r.status === 401, '期望 401，实际 ' + r.status + ' ' + r.error);
      return 'HTTP 401';
    });

    await step('权限', '普通用户 token 调用管理接口 → 拒绝', 'user', async function () {
      var r = await api('admin_subject_list', {}, tokens.user, { noRetry: true });
      must(!r.ok, '普通用户竟可调用 admin_subject_list');
      return 'HTTP ' + r.status + '：' + r.error;
    });

    await step('权限', '未登录调用 admin_trade_set_status → 401', null, async function () {
      var r = await api('admin_trade_set_status', { post_id: 'x', status: 'found' }, null, { noRetry: true });
      must(!r.ok && r.status === 401, '期望 401，实际 ' + r.status);
      return 'HTTP 401';
    });

    await step('权限', '未登录调用 qa_set_best → 401', null, async function () {
      var r = await api('qa_set_best', { post_id: 'x', comment_id: 'y' }, null, { noRetry: true });
      must(!r.ok && r.status === 401, '期望 401，实际 ' + r.status);
      return 'HTTP 401';
    });

    await step('权限', '未登录调用 review_pass_post → 401', null, async function () {
      var r = await api('review_pass_post', { id: 'x' }, null, { noRetry: true });
      must(!r.ok && r.status === 401, '期望 401，实际 ' + r.status);
      return 'HTTP 401';
    });

    await step('权限', 'cron_maintenance 错误密钥 → 403', null, async function () {
      var r = await api('cron_maintenance', { secret: '__wrong_' + Date.now() }, null, { noRetry: true });
      must(!r.ok && r.status === 403, '期望 403，实际 ' + r.status + ' ' + r.error);
      return 'HTTP 403';
    });

    /* ---- 组 4：RLS 直连防护（绕过 Edge Function） ---- */
    await step('安全', '匿名 key 直插 forum_subjects → 拒绝', null, async function () {
      var res = await fetch(SB + '/rest/v1/forum_subjects', {
        method: 'POST',
        headers: { 'content-type': 'application/json', apikey: KEY, authorization: 'Bearer ' + KEY, prefer: 'return=representation' },
        body: JSON.stringify({ name: '__qa_probe_' + Date.now(), display_name: '__qa_probe__' })
      });
      must(res.status >= 400, '匿名 key 竟可写入 forum_subjects（HTTP ' + res.status + '）');
      return 'HTTP ' + res.status + '（已拒绝）';
    });

    await step('安全', '匿名 key 直插 forum_posts → 拒绝', null, async function () {
      var res = await fetch(SB + '/rest/v1/forum_posts', {
        method: 'POST',
        headers: { 'content-type': 'application/json', apikey: KEY, authorization: 'Bearer ' + KEY, prefer: 'return=representation' },
        body: JSON.stringify({ topic: '闲聊', content: '__qa_probe__' })
      });
      must(res.status >= 400, '匿名 key 竟可写入 forum_posts（HTTP ' + res.status + '）');
      return 'HTTP ' + res.status + '（已拒绝）';
    });

    await step('安全', '匿名 key 直改 forum_posts.ask_mode → 拒绝', null, async function () {
      var res = await fetch(SB + '/rest/v1/forum_posts?id=eq.00000000-0000-0000-0000-000000000000', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', apikey: KEY, authorization: 'Bearer ' + KEY, prefer: 'return=representation' },
        body: JSON.stringify({ ask_mode: true })
      });
      var txt = '';
      try { txt = await res.text(); } catch (_e) {}
      var t = (txt || '').trim();
      must(res.status >= 400 || t === '' || t === '[]',
        '匿名 key 似乎能更新 forum_posts：HTTP ' + res.status + ' body=' + t.slice(0, 160));
      return 'HTTP ' + res.status + '，影响行数 0';
    });

    await step('安全', '匿名 key 直改 forum_posts.trade_status → 拒绝', null, async function () {
      var res = await fetch(SB + '/rest/v1/forum_posts?id=eq.00000000-0000-0000-0000-000000000000', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', apikey: KEY, authorization: 'Bearer ' + KEY, prefer: 'return=representation' },
        body: JSON.stringify({ trade_status: 'found' })
      });
      var txt = '';
      try { txt = await res.text(); } catch (_e) {}
      var t = (txt || '').trim();
      must(res.status >= 400 || t === '' || t === '[]',
        '匿名 key 似乎能更新 forum_posts：HTTP ' + res.status + ' body=' + t.slice(0, 160));
      return 'HTTP ' + res.status + '，影响行数 0';
    });
  }

  /* ============================ 写流程验收 ============================ */
  async function writeSteps() {
    if (!state.siteOpen) {
      rec('写流程', '站点开关检查', 'SKIP', '站点当前处于关闭状态，写流程全部跳过');
      return;
    }

    /* ---------- 问答全流程 ---------- */
    await step('问答', '楼主发布求助帖', 'user', async function () {
      var r = await api('post_create', {
        topic: '闲聊', content: QA_TAG + ' 求助 ' + Date.now() + '：这道题怎么解？', ask_mode: true
      }, tokens.user);
      must(r.ok, '发帖失败：' + r.error);
      ctx.qa.postId = r.data.id; made.posts.push(r.data.id);
      return 'postId=' + r.data.id;
    });

    await step('问答', '求助帖 ask_mode=true / resolved=false', 'admin', async function () {
      var pid = req(ctx.qa.postId);
      var p = await findPost(pid);
      must(p, '未在管理列表中找到该帖（可能未落库）');
      must(p.ask_mode === true && p.resolved === false, '状态异常：ask_mode=' + p.ask_mode + ' resolved=' + p.resolved);
      return 'ask_mode=true，resolved=false';
    });

    await step('问答', '楼主自评不能设为最佳答案（负向）', 'user', async function () {
      var pid = req(ctx.qa.postId);
      var c = await api('comment_create', { post_id: pid, content: QA_TAG + ' 楼主自己的评论' }, tokens.user);
      must(c.ok, '楼主评论失败：' + c.error);
      ctx.qa.ownComment = c.data.id;
      var r = await api('qa_set_best', { post_id: pid, comment_id: ctx.qa.ownComment }, tokens.user, { noRetry: true });
      must(!r.ok && /自己的评论/.test(r.error || ''), '未被拒绝：' + (r.ok ? '竟然成功了' : r.error));
      return '已拒绝：' + r.error;
    });

    await step('问答', '答主（测试账号 B）评论', 'user2', async function () {
      var pid = req(ctx.qa.postId);
      var c = await api('comment_create', { post_id: pid, content: QA_TAG + ' 答主评论 ' + Date.now() }, tokens.user2);
      must(c.ok, '答主评论失败：' + c.error);
      ctx.qa.answerComment = c.data.id;
      return 'commentId=' + c.data.id;
    });

    await step('问答', '非楼主不能设最佳答案（负向）', 'user2', async function () {
      var pid = req(ctx.qa.postId);
      var cid = req(ctx.qa.answerComment, '缺少答主评论');
      var r = await api('qa_set_best', { post_id: pid, comment_id: cid }, tokens.user2, { noRetry: true });
      must(!r.ok && /楼主/.test(r.error || ''), '非楼主竟可设置最佳答案：' + (r.ok ? '竟然成功了' : r.error));
      return '已拒绝：' + r.error;
    });

    await step('问答', '记录答主经验基线（xp_event）', 'user2', async function () {
      req(ctx.qa.answerComment, '缺少答主评论');
      ctx.qa.xp0 = await xpOf(tokens.user2);
      return 'xp_event=' + ctx.qa.xp0;
    });

    await step('问答', '楼主设最佳答案 → resolved=true', 'user', async function () {
      var pid = req(ctx.qa.postId);
      var cid = req(ctx.qa.answerComment, '缺少答主评论');
      var r = await api('qa_set_best', { post_id: pid, comment_id: cid }, tokens.user, { noRetry: true });
      must(r.ok && r.data.resolved === true, '设置失败：' + r.error);
      must(r.data.best_comment_id === cid, 'best_comment_id 不匹配');
      return 'best_comment_id=' + r.data.best_comment_id;
    });

    await step('问答', '答主经验 +' + BEST_ANSWER_XP, 'user2', async function () {
      req(ctx.qa.xp0 !== undefined, '缺少经验基线');
      var now = await xpOf(tokens.user2);
      var d = now - ctx.qa.xp0;
      must(d === BEST_ANSWER_XP, '期望 +' + BEST_ANSWER_XP + '，实际 ' + d);
      return 'xp_event ' + ctx.qa.xp0 + ' → ' + now;
    });

    await step('问答', '答主收到 best_answer 通知', 'user2', async function () {
      var pid = req(ctx.qa.postId);
      var r = await api('notifications_list', {}, tokens.user2);
      must(r.ok, 'notifications_list 失败：' + r.error);
      var list = Array.isArray(r.data) ? r.data : ((r.data && r.data.list) || []);
      var hit = list.filter(function (n) { return n.type === 'best_answer' && String(n.post_id || '') === pid; });
      must(hit.length > 0, '未找到该帖的 best_answer 通知');
      return '命中 ' + hit.length + ' 条';
    });

    await step('问答', '重复设同一答案幂等（经验不重复发放）', 'user', async function () {
      var pid = req(ctx.qa.postId);
      var cid = req(ctx.qa.answerComment, '缺少答主评论');
      var r = await api('qa_set_best', { post_id: pid, comment_id: cid }, tokens.user, { noRetry: true });
      must(r.ok && r.data.already === true, '未返回 already 幂等标记：' + JSON.stringify(r.data || r.error));
      var now = await xpOf(tokens.user2);
      must(now === ctx.qa.xp0 + BEST_ANSWER_XP, '经验被重复发放：' + now);
      return 'already=true，经验未重复发放';
    });

    await step('问答', '管理员代设 / 撤销（can_qa）', 'admin', async function () {
      var pid = req(ctx.qa.postId);
      var cid = req(ctx.qa.answerComment, '缺少答主评论');
      var un = await api('qa_admin_unresolve', { post_id: pid }, tokens.admin, { noRetry: true });
      must(un.ok && un.data.resolved === false, '管理员撤销失败：' + un.error);
      var now = await xpOf(tokens.user2);
      must(now === ctx.qa.xp0, '撤销后经验未回滚：期望 ' + ctx.qa.xp0 + '，实际 ' + now);
      var set = await api('qa_admin_set_best', { post_id: pid, comment_id: cid }, tokens.admin, { noRetry: true });
      must(set.ok && set.data.resolved === true, '管理员代设失败：' + set.error);
      return '撤销 → 经验回滚；代设 → 成功';
    });

    await step('问答', '楼主撤销 → 经验回滚且不为负，重复撤销被拒', 'user', async function () {
      var pid = req(ctx.qa.postId);
      req(ctx.qa.answerComment, '缺少答主评论');
      var r = await api('qa_unresolve', { post_id: pid }, tokens.user, { noRetry: true });
      must(r.ok && r.data.resolved === false, '撤销失败：' + r.error);
      var now = await xpOf(tokens.user2);
      must(now === ctx.qa.xp0, '经验未回滚：期望 ' + ctx.qa.xp0 + '，实际 ' + now);
      must(now >= 0, '经验出现负值');
      var again = await api('qa_unresolve', { post_id: pid }, tokens.user, { noRetry: true });
      must(!again.ok, '重复撤销未被拒绝');
      return 'xp_event=' + now + '，重复撤销已拒绝';
    });

    /* ---------- 学习资料全流程 ---------- */
    await step('学习资料', '未选学科不能发布资料帖（负向）', 'user', async function () {
      var r = await api('post_create', { topic: STUDY_TOPIC, content: QA_TAG + ' 未选学科测试' }, tokens.user, { noRetry: true });
      must(!r.ok && /学科/.test(r.error || ''), '未选学科竟可发布：' + (r.ok ? '竟然成功了' : r.error));
      return '已拒绝：' + r.error;
    });

    await step('学习资料', '发布资料帖（带学科）', 'user', async function () {
      var sub = await ensureSubject();
      ctx.study.subjectId = sub.id;
      var r = await api('post_create', {
        topic: STUDY_TOPIC, content: QA_TAG + ' 资料帖 ' + Date.now(), subject_id: sub.id
      }, tokens.user);
      must(r.ok, '发布失败：' + r.error);
      ctx.study.postId = r.data.id; made.posts.push(r.data.id);
      return 'postId=' + r.data.id + '，学科=' + (sub.display_name || sub.name);
    });

    await step('学习资料', '非资料话题带学科被拒（负向）', 'user', async function () {
      req(ctx.study.subjectId, '缺少测试学科');
      var r = await api('post_create', { topic: '闲聊', content: QA_TAG + ' 错误学科', subject_id: ctx.study.subjectId }, tokens.user, { noRetry: true });
      must(!r.ok, '非资料话题竟可带学科');
      return '已拒绝：' + r.error;
    });

    await step('学习资料', '作者本人可见自己的待审帖（pending_review）', 'user', async function () {
      var pid = req(ctx.study.postId);
      var r = await api('study_list', { page: 1, pageSize: 20 }, tokens.user);
      must(r.ok, 'study_list 失败：' + r.error);
      var p = ((r.data && r.data.list) || []).filter(function (x) { return x.id === pid; })[0];
      must(p, '作者本人看不到自己的待审资料帖');
      must(p.pending_review === true, '缺少 pending_review 标识');
      return 'pending_review=true';
    });

    await step('学习资料', '未登录访客看不到待审帖', null, async function () {
      var pid = req(ctx.study.postId);
      var r = await api('study_list', { page: 1, pageSize: 20 }, null);
      must(r.ok, 'study_list 失败：' + r.error);
      var seen = ((r.data && r.data.list) || []).some(function (x) { return x.id === pid; });
      must(!seen, '待审帖对未登录访客可见');
      return '未登录不可见';
    });

    await step('学习资料', '管理员审核通过（can_review）', 'admin', async function () {
      var pid = req(ctx.study.postId);
      var r = await api('review_pass_post', { id: pid }, tokens.admin, { noRetry: true });
      must(r.ok, '审核通过失败：' + r.error);
      ctx.study.reviewed = true;
      return 'review_pass_post ok';
    });

    await step('学习资料', '通过后对外公开可见', null, async function () {
      var pid = req(ctx.study.postId);
      req(ctx.study.reviewed, '审核未通过（管理员登录态缺失），跳过可见性校验');
      var r = await api('study_list', { page: 1, pageSize: 20 }, null);
      must(r.ok, 'study_list 失败：' + r.error);
      var seen = ((r.data && r.data.list) || []).some(function (x) { return x.id === pid; });
      must(seen, '通过后仍未对外可见');
      return '已公开';
    });

    await step('学习资料', '按学科筛选命中该帖且不串学科', null, async function () {
      var pid = req(ctx.study.postId);
      var sid = req(ctx.study.subjectId, '缺少测试学科');
      var r = await api('study_list', { subject_id: sid, page: 1, pageSize: 20 }, null);
      must(r.ok, 'study_list 失败：' + r.error);
      var list = (r.data && r.data.list) || [];
      must(list.every(function (x) { return x.subject_id === sid; }), '学科筛选混入其他学科');
      must(list.some(function (x) { return x.id === pid; }), '学科筛选未命中刚发布的资料帖');
      return list.length + ' 条';
    });

    /* ---------- 失物招领全流程 ---------- */
    await step('失物招领', '发布失物招领帖（进行中）', 'user', async function () {
      var r = await api('post_create', {
        topic: TRADE_TOPIC, content: QA_TAG + ' 丢了一张校园卡 ' + Date.now(), trade_status: 'ongoing'
      }, tokens.user);
      must(r.ok, '发布失败：' + r.error);
      ctx.trade.postId = r.data.id; made.posts.push(r.data.id);
      return 'postId=' + r.data.id;
    });

    await step('失物招领', '普通帖不能设最佳答案（负向）', 'user', async function () {
      var pid = req(ctx.trade.postId);
      var r = await api('qa_set_best', { post_id: pid, comment_id: ctx.qa.answerComment || 'x' }, tokens.user, { noRetry: true });
      must(!r.ok && /求助帖/.test(r.error || ''), '普通帖竟可设最佳答案：' + (r.ok ? '竟然成功了' : r.error));
      return '已拒绝：' + r.error;
    });

    await step('失物招领', '非失物招领话题带状态被拒（负向）', 'user', async function () {
      var r = await api('post_create', { topic: '闲聊', content: QA_TAG + ' 错误状态', trade_status: 'found' }, tokens.user, { noRetry: true });
      must(!r.ok, '非失物招领话题竟可带状态');
      return '已拒绝：' + r.error;
    });

    await step('失物招领', '无效状态被拒（负向）', 'user', async function () {
      var pid = req(ctx.trade.postId);
      var r = await api('trade_mark', { post_id: pid, status: 'bad' }, tokens.user, { noRetry: true });
      must(!r.ok, '无效状态竟被接受');
      return '已拒绝：' + r.error;
    });

    await step('失物招领', '楼主标记「已找到」', 'user', async function () {
      var pid = req(ctx.trade.postId);
      var r = await api('trade_mark', { post_id: pid, status: 'found' }, tokens.user, { noRetry: true });
      must(r.ok && r.data.trade_status === 'found', '标记失败：' + r.error);
      return 'ongoing → found';
    });

    await step('失物招领', '重复标记幂等（already=true）', 'user', async function () {
      var pid = req(ctx.trade.postId);
      var r = await api('trade_mark', { post_id: pid, status: 'found' }, tokens.user, { noRetry: true });
      must(r.ok && r.data.already === true, '重复标记未返回幂等标记：' + JSON.stringify(r.data || r.error));
      return 'already=true';
    });

    await step('失物招领', '他人不能标记我的帖子（负向）', 'user2', async function () {
      var pid = req(ctx.trade.postId);
      var r = await api('trade_mark', { post_id: pid, status: 'lost' }, tokens.user2, { noRetry: true });
      must(!r.ok, '他人竟可标记我的帖子');
      return '已拒绝：' + r.error;
    });

    await step('失物招领', '按「已找到」筛选命中且不串状态', 'admin', async function () {
      var pid = req(ctx.trade.postId);
      var r = await api('list_posts', { topic: TRADE_TOPIC, trade_status: 'found', page: 1, pageSize: 100 }, tokens.admin);
      must(r.ok, 'list_posts 失败：' + r.error);
      must((r.data || []).some(function (x) { return x.id === pid; }), '筛选未命中该帖');
      must((r.data || []).every(function (x) { return (x.trade_status || 'ongoing') === 'found'; }), '筛选混入其他状态');
      return (r.data || []).length + ' 条';
    });

    await step('失物招领', '管理员强制改状态（can_trade）', 'admin', async function () {
      var pid = req(ctx.trade.postId);
      var r = await api('admin_trade_set_status', { post_id: pid, status: 'lost' }, tokens.admin, { noRetry: true });
      must(r.ok && r.data.trade_status === 'lost', '强制改状态失败：' + r.error);
      return 'found → lost';
    });

    await step('失物招领', '管理员手动归档不误伤新帖', 'admin', async function () {
      var pid = req(ctx.trade.postId);
      var r = await api('admin_trade_archive', { days: 60 }, tokens.admin, { noRetry: true });
      must(r.ok && typeof r.data.archived === 'number', '归档失败：' + r.error);
      var chk = await api('list_posts', { topic: TRADE_TOPIC, page: 1, pageSize: 100 }, tokens.admin);
      must((chk.data || []).some(function (x) { return x.id === pid; }), '新帖被误归档');
      return '归档 ' + r.data.archived + ' 条，新帖未受影响';
    });

    /* ---------- 学科 CRUD ---------- */
    var subName = '__QA学科' + String(Date.now()).slice(-6);
    await step('学科管理', '新增学科（can_digest）', 'admin', async function () {
      var r = await api('admin_subject_create', { name: subName, display_name: subName, sort: 999, enabled: true }, tokens.admin, { noRetry: true });
      must(r.ok, '新增失败：' + r.error);
      ctx.sub.id = r.data.id; ctx.sub.name = subName;
      made.subjects.push({ id: r.data.id, name: subName });
      return 'id=' + r.data.id;
    });

    await step('学科管理', '学科名称含屏蔽词被拒（负向）', 'admin', async function () {
      var r = await api('admin_subject_create', { name: '傻逼学科' + String(Date.now()).slice(-4), enabled: true }, tokens.admin, { noRetry: true });
      must(!r.ok, '屏蔽词学科竟可创建');
      return '已拒绝：' + r.error;
    });

    await step('学科管理', '编辑学科为停用', 'admin', async function () {
      var sid = req(ctx.sub.id, '学科未创建成功');
      var r = await api('admin_subject_update', { id: sid, name: subName, display_name: subName, sort: 998, enabled: false }, tokens.admin, { noRetry: true });
      must(r.ok && r.data.enabled === false, '编辑失败：' + r.error);
      return 'enabled=false';
    });

    await step('学科管理', '停用学科不出现在公开列表', null, async function () {
      var sid = req(ctx.sub.id, '学科未创建成功');
      var r = await api('subject_list', {}, null);
      must(r.ok, 'subject_list 失败：' + r.error);
      must(!(r.data || []).some(function (s) { return s.id === sid; }), '停用学科仍出现在公开列表');
      return '已隐藏';
    });

    await step('学科管理', '删除空学科', 'admin', async function () {
      var sid = req(ctx.sub.id, '学科未创建成功');
      var r = await api('admin_subject_delete', { id: sid, name: subName }, tokens.admin, { noRetry: true });
      must(r.ok, '删除失败：' + r.error);
      made.subjects = made.subjects.filter(function (x) { return x.id !== sid; });
      return '已删除';
    });

    await step('学科管理', '在用学科只能停用不能删除（负向）', 'admin', async function () {
      var sid = req(ctx.study.subjectId, '缺少资料帖学科（学习资料流程未完成）');
      var r = await api('admin_subject_delete', { id: sid }, tokens.admin, { noRetry: true });
      must(!r.ok && /停用/.test(r.error || ''), '在用学科竟可删除：' + (r.ok ? '竟然成功了' : r.error));
      return '已拒绝：' + r.error;
    });
  }

  /* ============================ 清理 ============================ */
  async function cleanup() {
    var ok = 0, bad = 0;
    var ids = made.posts.slice();

    // 兜底：把历史残留（含此前中断运行留下的）也一并清掉
    if (tokens.admin) {
      var scan = await api('list_posts', { keyword: QA_TAG, page: 1, pageSize: 200 }, tokens.admin);
      if (scan.ok) {
        (scan.data || []).forEach(function (p) { if (ids.indexOf(p.id) < 0) ids.push(p.id); });
      }
    }

    for (var i = 0; i < ids.length; i++) {
      var id = ids[i];
      var r = tokens.admin
        ? await api('review_delete_post', { id: id }, tokens.admin, { noRetry: true })
        : { ok: false, error: '缺少管理员登录态' };
      if (!r.ok && tokens.user) r = await api('post_delete_self', { post_id: id }, tokens.user, { noRetry: true });
      if (r.ok) { ok++; made.posts = made.posts.filter(function (x) { return x !== id; }); console.log('🧹 已删除测试帖 ' + id); }
      else { bad++; console.warn('清理失败 ' + id + '：' + r.error); }
    }

    for (var k = 0; k < made.subjects.slice().length; k++) {
      var s = made.subjects.slice()[k];
      var sid = s && s.id ? s.id : s;
      var sname = s && s.name ? s.name : sid;
      var sr = await api('admin_subject_delete', { id: sid, name: sname }, tokens.admin, { noRetry: true });
      if (!sr.ok) sr = await api('admin_subject_update', { id: sid, name: sname, display_name: sname, enabled: false }, tokens.admin, { noRetry: true });
      if (sr.ok) { ok++; made.subjects = made.subjects.filter(function (x) { return (x && x.id ? x.id : x) !== sid; }); console.log('🧹 已清理测试学科 ' + sid); }
      else { bad++; console.warn('学科清理失败 ' + sid + '：' + sr.error); }
    }

    console.log('清理完成：成功 ' + ok + '，失败 ' + bad);
    return { ok: ok, fail: bad };
  }

  /* ============================ 对外入口 ============================ */
  async function readonly() { rows = []; await readonlySteps(); return report(); }
  async function write() { rows = []; await writeSteps(); return report(); }
  async function all() { rows = []; await readonlySteps(); await writeSteps(); return report(); }

  function stop() { state.stopped = true; console.warn('⛔ 已请求中止，当前步骤结束后停止。'); }

  function help() {
    console.log([
      '===== XDDQA · 第三期一键验收 =====',
      '粘贴脚本即自动开跑；以下命令供手动分步使用：',
      '  await XDDQA.auto()       重新跑一遍全自动流程（含账号准备与清理）',
      '  await XDDQA.env()        环境自检（登录态 / 站点开关 / 权限位）',
      '  await XDDQA.readonly()   只读验收：公开取数、管理取数、权限矩阵、RLS 防护',
      '  await XDDQA.write()      写流程验收：问答、学习资料、失物招领、学科 CRUD',
      '  await XDDQA.all()        只读 + 写流程',
      '  await XDDQA.cleanup()    清理测试帖（含历史残留）与测试学科',
      '  XDDQA.stop()             中止正在进行的验收',
      '  XDDQA.report()           重新打印上一次的汇总表',
      '  XDDQA.tokens / ctx / made  查看登录态 / 流程中间态 / 本轮创建的数据',
      '  XDDQA.raw(action, payload, token)  手动调用任意接口',
      '',
      '前置条件：站点已开启、SQL 已执行、Edge Function 已部署。',
      '管理员用例需先在 admin.html 登录（token 存于 localStorage.nzb_admin_token）。'
    ].join('\n'));
  }

  /* ============================ 全自动主流程 ============================ */
  async function auto() {
    if (state.running) { console.warn('⚠️ 验收正在进行中，请稍候…'); return; }
    state.running = true; state.stopped = false; state.finished = false;
    rows = []; made.posts = []; made.subjects = [];
    ctx = { qa: {}, study: {}, trade: {}, sub: {} };

    console.log('%c╔══════════════════════════════════════════════╗', 'color:#e07a5f;font-weight:bold');
    console.log('%c║  XDD吧 · 第三期功能 一键全自动验收 v' + VERSION + '  ║', 'color:#e07a5f;font-weight:bold');
    console.log('%c╚══════════════════════════════════════════════╝', 'color:#e07a5f;font-weight:bold');
    console.log('无需任何手动输入，脚本将自动完成：环境自检 → 只读验收 → 写流程验收 → 清理 → 出报告');
    console.log('⚠️ 会在站点创建少量带「' + QA_TAG + '」标记的测试帖，流程结束后自动删除。');
    console.log('（如需中止：XDDQA.stop()）');

    for (var i = 3; i > 0; i--) {
      if (state.stopped) break;
      console.log('⏱ ' + i + ' 秒后开始…');
      await sleep(1000);
    }
    if (state.stopped) { state.running = false; return end(); }

    try {
      console.log('%c\n① 读取登录态 / 自动准备测试账号', 'color:#0ea5e9;font-weight:bold');
      await bootstrap();

      console.log('%c\n② 环境自检', 'color:#0ea5e9;font-weight:bold');
      await env();

      console.log('%c\n③ 只读验收', 'color:#0ea5e9;font-weight:bold');
      await readonlySteps();

      console.log('%c\n④ 写流程验收（受服务端限流影响，请耐心等待）', 'color:#0ea5e9;font-weight:bold');
      await writeSteps();
    } catch (e) {
      console.error('❌ 验收中断：' + ((e && e.message) || e));
      rec('主流程', '执行中断', 'FAIL', (e && e.message) || String(e));
    } finally {
      console.log('%c\n⑤ 清理测试数据', 'color:#0ea5e9;font-weight:bold');
      try { await cleanup(); } catch (e) { console.warn('清理异常：' + ((e && e.message) || e)); }
      state.running = false;
      state.finished = true;
      end();
    }
    return { rows: rows };
  }

  function end() {
    console.log('%c\n⑥ 汇总', 'color:#0ea5e9;font-weight:bold');
    var r = report();
    if (!tokens.admin) {
      console.warn('提示：本次缺少管理员登录态，管理端用例未执行。' +
        '请在 admin.html 登录后重新粘贴本脚本，即可跑完整验收。');
    }
    console.log('（测试账号 ' + ACCOUNT_A + ' / ' + ACCOUNT_B + ' 已保留，供下次直接登录复用；' +
      '如需彻底删除请在 Supabase 后台处理。）');
    return r;
  }

  /* ============================ 注入 ============================ */
  if (window.XDDQA && window.XDDQA.__version === VERSION) {
    console.log('XDDQA 已存在（同版本），直接复用。输入 XDDQA.help() 查看命令。');
    return;
  }

  window.XDDQA = {
    __version: VERSION,
    help: help,
    auto: auto,
    stop: stop,
    env: env,
    readonly: readonly,
    write: write,
    all: all,
    cleanup: cleanup,
    report: report,
    raw: api,
    tokens: tokens,
    ctx: ctx,
    made: made,
    state: state,
    get rows() { return rows; }
  };

  console.log('%cXDDQA 已就绪（v' + VERSION + '）· 全自动验收开始…', 'color:#e07a5f;font-weight:bold');
  auto();
})();
