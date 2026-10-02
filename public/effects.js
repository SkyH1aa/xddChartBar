/* ============================================================================
 * XDD吧 · 第四期「内置特效引擎」（effects.js）
 * ----------------------------------------------------------------------------
 * 目标：帖子背景 / 称号 / 昵称样式 / 徽章 全部改为「内置网页特效」，
 *       管理员在后台用下拉框 + 复选框 + 取色器组合即可，无需写任何代码或 JSON。
 *
 * 设计：
 *   1) 单一事实来源：SPEC 定义每个特效槽位与可选项（含 CSS 片段）。
 *   2) CSS 自动生成：ensureStyle() 依据 SPEC 生成 <style id="xdd-fx-style">，
 *      因此「配置器里能选到的」与「页面上能渲染出的」永远一致，不会漂移。
 *   3) 组合数：每个分类的槽位选项数相乘即为「不含颜色」的组合数（≥ 999999）。
 *   4) 配置结构（存 template / payload / effect 字段）：
 *        { v:2, kind:'background', c1:'#..', c2:'#..', text:'', opts:{ grad:'linear', ... } }
 *
 * 对外 API（window.XddFx）：
 *   XddFx.kinds()                       所有分类
 *   XddFx.spec(kind)                    分类规格
 *   XddFx.combos(kind)                  该分类「不含颜色」的组合数（不含文字特效）
 *   XddFx.textCombos(kind)              该分类「文字特效」的组合数（不含颜色）
 *   XddFx.total()                       全部分类组合数合计
 *   XddFx.blank(kind)                   默认配置
 *   XddFx.normalize(kind, cfg)          规整配置（补默认值 / 丢弃非法值）
 *   XddFx.classes(kind, cfg)            计算 CSS 类名数组
 *   XddFx.styleAttr(kind, cfg)          计算内联 style（颜色与数值变量）
 *   XddFx.summary(kind, cfg)            人类可读摘要
 *   XddFx.bgLayers(cfg)                 背景图层 HTML
 *   XddFx.titleHtml(cfg)                称号 HTML
 *   XddFx.badgeHtml(cfg, size)          徽章 HTML（内置渲染，不用图片）
 *   XddFx.applyBg(el, cfg)              把背景特效应用到已有元素
 *   XddFx.mountConfigurator(host, kind, cfg, onChange)   后台可视化配置器
 * ========================================================================== */
(function () {
  'use strict';

  var STYLE_ID = 'xdd-fx-style';
  var NS = 'fx';

  /* ========================================================================
     一、特效规格（SPEC）
     槽位 slot：{ k 键, label 名称, def 默认, target 作用层, opts 选项[] }
     选项 opt ：{ v 值, label 名称, css 声明块, vars 内联变量, extra 附加规则 }
     ======================================================================== */

  /* 公共关键帧 */
  var KEYFRAMES = [
    '@keyframes fxAurora{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}',
    '@keyframes fxFlow{0%{background-position:0% 50%}100%{background-position:200% 50%}}',
    '@keyframes fxPulse{0%,100%{opacity:.35}50%{opacity:.95}}',
    '@keyframes fxShimmer{0%{transform:translateX(-120%)}100%{transform:translateX(120%)}}',
    '@keyframes fxDrift{0%{transform:translate3d(-4%,-3%,0)}50%{transform:translate3d(4%,3%,0)}100%{transform:translate3d(-4%,-3%,0)}}',
    '@keyframes fxTwinkle{0%,100%{opacity:.25}40%{opacity:.85}70%{opacity:.45}}',
    '@keyframes fxRipple{0%{transform:scale(.6);opacity:.8}100%{transform:scale(1.5);opacity:0}}',
    '@keyframes fxBreathe{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}',
    '@keyframes fxSlide{0%{background-position:0% 0%}100%{background-position:100% 100%}}',
    '@keyframes fxSpin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}',
    '@keyframes fxGlowPulse{0%,100%{filter:brightness(1) saturate(1)}50%{filter:brightness(1.45) saturate(1.5)}}',
    '@keyframes fxShine{0%{background-position:-150% 0}100%{background-position:250% 0}}',
    '@keyframes fxFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}',
    '@keyframes fxBlink{0%,100%{opacity:1}45%{opacity:.45}55%{opacity:.45}}',
    '@keyframes fxWave{0%,100%{transform:skewX(0) translateY(0)}25%{transform:skewX(-6deg) translateY(-1px)}75%{transform:skewX(6deg) translateY(1px)}}',
    '@keyframes fxFlicker{0%,100%{opacity:1;filter:none}20%{opacity:.55}40%{opacity:1;filter:brightness(1.4)}60%{opacity:.7}80%{opacity:1}}',
    '@keyframes fxTilt{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}',
    '@keyframes fxScale{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}',
    '@keyframes fxSwing{0%,100%{transform:rotate(-9deg)}50%{transform:rotate(9deg)}}',
    '@keyframes fxBounce{0%,100%{transform:translateY(0)}30%{transform:translateY(-22%)}60%{transform:translateY(0)}}',
    '@keyframes fxOrbit{0%{transform:rotate(0) translateX(2px) rotate(0)}100%{transform:rotate(360deg) translateX(2px) rotate(-360deg)}}',
    '@keyframes fxSparkle{0%,100%{opacity:.15;transform:scale(.9)}50%{opacity:1;transform:scale(1.15)}}',
    '@keyframes fxTypeIn{0%{clip-path:inset(0 100% 0 0)}100%{clip-path:inset(0 0 0 0)}}',
    '@keyframes fxMarquee{0%{transform:translateX(-5%)}50%{transform:translateX(5%)}100%{transform:translateX(-5%)}}',
    '@keyframes fxRise{0%{opacity:.3;transform:translateY(7px)}100%{opacity:1;transform:translateY(0)}}',
    '@keyframes fxShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-2px)}40%{transform:translateX(2px)}60%{transform:translateX(-1.5px)}80%{transform:translateX(1.5px)}}',
    '@keyframes fxGlitch{0%,100%{transform:translate(0);filter:none}20%{transform:translate(-1px,1px);filter:hue-rotate(18deg)}22%{transform:translate(1px,-1px)}42%{transform:translate(0);filter:none}70%{transform:translate(1px,0);filter:hue-rotate(-18deg)}}',
    '@keyframes fxRainbowFlow{0%{background-position:0% 50%}100%{background-position:300% 50%}}'
  ].join('');

  var SPEC = {
    /* ------------------------------ 帖子背景 ------------------------------ */
    background: {
      key: 'background',
      label: '帖子背景',
      icon: '🖼',
      base: 'fx-bg',
      hint: '作用于帖子卡片整块背景；使用购买背景时，等级专属扫光特效（风云学长 / 校史留名）将自动让位。',
      colors: [
        { k: 'c1', label: '主色', def: '#7c3aed' },
        { k: 'c2', label: '辅色', def: '#22d3ee' },
        { k: 'tc1', label: '文字主色', def: '#ffffff' },
        { k: 'tc2', label: '文字辅色', def: '#7c3aed' }
      ],
      // 「文字特效」槽位：单独统计组合数（不含颜色），命中帖子正文与作者昵称
      textSlots: ['tstyle', 'tanim', 'tdeco', 'twt', 'tit', 'tsp', 'tlead', 'tglow', 'talign'],
      slots: [
        {
          k: 'grad', label: '渐变类型', def: 'linear', target: '',
          opts: [
            { v: 'linear', label: '线性渐变', css: 'background-image:linear-gradient(var(--fx-dir,135deg),var(--fx-c1),var(--fx-c2))' },
            { v: 'radial', label: '径向渐变', css: 'background-image:radial-gradient(circle at var(--fx-pos,50% 50%),var(--fx-c1),var(--fx-c2) 70%)' },
            { v: 'conic', label: '锥形渐变', css: 'background-image:conic-gradient(from 210deg at var(--fx-pos,50% 50%),var(--fx-c1),var(--fx-c2),var(--fx-c1))' },
            { v: 'dual', label: '双向渐变', css: 'background-image:linear-gradient(var(--fx-dir,135deg),var(--fx-c1),var(--fx-c2)),linear-gradient(calc(var(--fx-dir,135deg) + 180deg),var(--fx-c1),transparent 60%)' },
            { v: 'mesh', label: '弥散光斑', css: 'background-image:radial-gradient(at 12% 18%,var(--fx-c1) 0,transparent 55%),radial-gradient(at 82% 26%,var(--fx-c2) 0,transparent 52%),radial-gradient(at 48% 88%,var(--fx-c1) 0,transparent 58%)' },
            { v: 'solid', label: '纯色铺底', css: 'background-image:none;background-color:var(--fx-c1)' }
          ]
        },
        {
          k: 'dir', label: '方向 / 焦点', def: '135', target: '',
          opts: [
            { v: '0', label: '向上 ↑', vars: { '--fx-dir': '0deg', '--fx-pos': '50% 100%' } },
            { v: '45', label: '右上 ↗', vars: { '--fx-dir': '45deg', '--fx-pos': '100% 0%' } },
            { v: '90', label: '向右 →', vars: { '--fx-dir': '90deg', '--fx-pos': '0% 50%' } },
            { v: '135', label: '右下 ↘', vars: { '--fx-dir': '135deg', '--fx-pos': '100% 0%' } },
            { v: '180', label: '向下 ↓', vars: { '--fx-dir': '180deg', '--fx-pos': '50% 0%' } },
            { v: '225', label: '左下 ↙', vars: { '--fx-dir': '225deg', '--fx-pos': '0% 0%' } },
            { v: '270', label: '向左 ←', vars: { '--fx-dir': '270deg', '--fx-pos': '100% 50%' } },
            { v: '315', label: '左上 ↖', vars: { '--fx-dir': '315deg', '--fx-pos': '0% 100%' } },
            { v: 'center', label: '居中 ◎', vars: { '--fx-dir': '0deg', '--fx-pos': '50% 50%' } }
          ]
        },
        {
          k: 'pat', label: '纹理图案', def: 'none', target: ' .fx-l-pat',
          opts: [
            { v: 'none', label: '无纹理', css: 'background-image:none' },
            { v: 'dots', label: '圆点', css: 'background-image:radial-gradient(var(--fx-c2) 1.2px,transparent 1.3px)' },
            { v: 'grid', label: '网格', css: 'background-image:linear-gradient(var(--fx-c2) 1px,transparent 1px),linear-gradient(90deg,var(--fx-c2) 1px,transparent 1px)' },
            { v: 'stripes', label: '横条', css: 'background-image:repeating-linear-gradient(0deg,var(--fx-c2) 0 2px,transparent 2px 50%)' },
            { v: 'diag', label: '斜纹', css: 'background-image:repeating-linear-gradient(45deg,var(--fx-c2) 0 2px,transparent 2px 50%)' },
            { v: 'chevron', label: '人字纹', css: 'background-image:repeating-linear-gradient(45deg,var(--fx-c2) 0 2px,transparent 2px 25%),repeating-linear-gradient(-45deg,var(--fx-c2) 0 2px,transparent 2px 25%)' },
            { v: 'cross', label: '十字', css: 'background-image:linear-gradient(var(--fx-c2) 1px,transparent 1px),linear-gradient(90deg,var(--fx-c2) 1px,transparent 1px),radial-gradient(var(--fx-c2) 2px,transparent 2.5px)' },
            { v: 'waves', label: '波纹', css: 'background-image:repeating-radial-gradient(circle at 0 0,transparent 0 8px,var(--fx-c2) 8px 9px)' },
            { v: 'honeycomb', label: '蜂巢', css: 'background-image:conic-gradient(from 30deg,var(--fx-c2) 0 60deg,transparent 60deg 120deg,var(--fx-c2) 120deg 180deg,transparent 180deg 240deg,var(--fx-c2) 240deg 300deg,transparent 300deg 360deg)' },
            { v: 'circuit', label: '电路', css: 'background-image:linear-gradient(90deg,var(--fx-c2) 1px,transparent 1px),linear-gradient(var(--fx-c2) 1px,transparent 1px),radial-gradient(var(--fx-c2) 2px,transparent 2.4px)' },
            { v: 'stars', label: '星点', css: 'background-image:radial-gradient(var(--fx-c2) 1px,transparent 1.4px),radial-gradient(var(--fx-c2) .8px,transparent 1.2px)' },
            { v: 'bubbles', label: '气泡', css: 'background-image:radial-gradient(circle,var(--fx-c2) 22%,transparent 24%),radial-gradient(circle,var(--fx-c2) 14%,transparent 16%)' },
            { v: 'scales', label: '鳞片', css: 'background-image:radial-gradient(circle at 50% 100%,transparent 60%,var(--fx-c2) 62%,transparent 68%)' },
            { v: 'confetti', label: '彩屑', css: 'background-image:conic-gradient(var(--fx-c2) 0 25%,transparent 0 50%,var(--fx-c2) 0 75%,transparent 0)' },
            { v: 'prism', label: '棱镜', css: 'background-image:linear-gradient(120deg,transparent 0 35%,color-mix(in srgb,var(--fx-c2) 65%,transparent) 50%,transparent 65%)' },
            { v: 'crystal', label: '水晶', css: 'background-image:linear-gradient(135deg,rgba(255,255,255,.45) 0 8%,transparent 8% 46%,rgba(255,255,255,.22) 46% 54%,transparent 54% 92%,rgba(255,255,255,.3) 92%)' },
            { v: 'topography', label: '等高线', css: 'background-image:repeating-radial-gradient(ellipse at 30% 40%,transparent 0 8px,color-mix(in srgb,var(--fx-c2) 36%,transparent) 9px 10px)' },
            { v: 'auroraMesh', label: '极光网格', css: 'background-image:linear-gradient(90deg,color-mix(in srgb,var(--fx-c2) 22%,transparent) 1px,transparent 1px),linear-gradient(color-mix(in srgb,var(--fx-c1) 18%,transparent) 1px,transparent 1px),radial-gradient(circle at 18% 24%,var(--fx-c2),transparent 42%)' },
            { v: 'rippleLines', label: '涟漪线', css: 'background-image:repeating-radial-gradient(ellipse at 50% 50%,transparent 0 10px,color-mix(in srgb,var(--fx-c2) 42%,transparent) 11px 12px)' }
          ]
        },
        {
          k: 'sz', label: '纹理密度', def: '2', target: '',
          opts: [
            { v: '1', label: '极密', vars: { '--fx-sz': '5px' } },
            { v: '2', label: '密', vars: { '--fx-sz': '9px' } },
            { v: '3', label: '标准', vars: { '--fx-sz': '14px' } },
            { v: '4', label: '疏', vars: { '--fx-sz': '22px' } },
            { v: '5', label: '极疏', vars: { '--fx-sz': '34px' } }
          ]
        },
        {
          k: 'anim', label: '动效', def: 'none', target: ' .fx-l-anim',
          opts: [
            { v: 'none', label: '静止', css: 'background-image:none;animation:none' },
            { v: 'aurora', label: '极光流动', css: 'background-image:radial-gradient(at 20% 30%,var(--fx-c2) 0,transparent 55%),radial-gradient(at 78% 70%,var(--fx-c1) 0,transparent 55%);background-size:200% 200%;animation:fxAurora var(--fx-dur,10s) ease-in-out infinite' },
            { v: 'flow', label: '流光', css: 'background-image:linear-gradient(var(--fx-dir,135deg),transparent 30%,var(--fx-c2) 50%,transparent 70%);background-size:220% 220%;animation:fxFlow var(--fx-dur,8s) linear infinite' },
            { v: 'pulse', label: '呼吸明暗', css: 'background-image:radial-gradient(circle at var(--fx-pos,50% 50%),var(--fx-c2),transparent 65%);animation:fxPulse var(--fx-dur,6s) ease-in-out infinite' },
            { v: 'shimmer', label: '扫光', css: 'background-image:linear-gradient(105deg,transparent 40%,var(--fx-c2) 50%,transparent 60%);background-size:60% 100%;animation:fxShimmer var(--fx-dur,5s) linear infinite' },
            { v: 'drift', label: '缓移', css: 'background-image:radial-gradient(at 30% 40%,var(--fx-c2) 0,transparent 60%);animation:fxDrift var(--fx-dur,12s) ease-in-out infinite' },
            { v: 'twinkle', label: '闪烁', css: 'background-image:radial-gradient(var(--fx-c2) 1px,transparent 1.6px);animation:fxTwinkle var(--fx-dur,4s) ease-in-out infinite' },
            { v: 'ripple', label: '涟漪', css: 'background-image:radial-gradient(circle at var(--fx-pos,50% 50%),transparent 20%,var(--fx-c2) 24%,transparent 30%);animation:fxRipple var(--fx-dur,5s) ease-out infinite' },
            { v: 'breathe', label: '缩放呼吸', css: 'background-image:radial-gradient(circle at 50% 50%,var(--fx-c2) 0,transparent 60%);animation:fxBreathe var(--fx-dur,7s) ease-in-out infinite' },
            { v: 'slide', label: '斜向推移', css: 'background-image:repeating-linear-gradient(45deg,var(--fx-c2) 0 3px,transparent 3px 18px);background-size:200% 200%;animation:fxSlide var(--fx-dur,9s) linear infinite' },
            { v: 'spin', label: '旋转光轮', css: 'background-image:conic-gradient(from 0deg,transparent,var(--fx-c2),transparent 55%);animation:fxSpin var(--fx-dur,14s) linear infinite' },
            { v: 'glow', label: '色彩律动', css: 'background-image:linear-gradient(var(--fx-dir,135deg),var(--fx-c1),var(--fx-c2));opacity:.5;animation:fxGlowPulse var(--fx-dur,6s) ease-in-out infinite' },
            { v: 'warp', label: '空间扭曲', css: 'background-image:radial-gradient(ellipse at 50% 50%,var(--fx-c2),transparent 58%);background-size:180% 140%;animation:fxDrift var(--fx-dur,9s) ease-in-out infinite' },
            { v: 'nebula', label: '星云', css: 'background-image:radial-gradient(at 18% 28%,var(--fx-c2),transparent 42%),radial-gradient(at 78% 72%,var(--fx-c1),transparent 48%);background-size:220% 220%;animation:fxAurora var(--fx-dur,12s) ease-in-out infinite' },
            { v: 'scan', label: '扫描线', css: 'background-image:repeating-linear-gradient(0deg,transparent 0 8px,color-mix(in srgb,var(--fx-c2) 40%,transparent) 9px 10px);animation:fxSlide var(--fx-dur,6s) linear infinite' },
            { v: 'matrix', label: '矩阵雨', css: 'background-image:repeating-linear-gradient(90deg,transparent 0 7px,color-mix(in srgb,var(--fx-c2) 46%,transparent) 8px 9px);background-size:180% 100%;animation:fxFlow var(--fx-dur,5s) linear infinite' },
            { v: 'prism', label: '棱镜漂移', css: 'background-image:linear-gradient(120deg,transparent 0 30%,color-mix(in srgb,var(--fx-c2) 70%,transparent) 50%,transparent 70%);background-size:240% 100%;animation:fxShine var(--fx-dur,4s) linear infinite' }
          ]
        },
        {
          k: 'spd', label: '速度', def: '3', target: '',
          opts: [
            { v: '1', label: '很慢', vars: { '--fx-dur': '16s' } },
            { v: '2', label: '慢', vars: { '--fx-dur': '11s' } },
            { v: '3', label: '标准', vars: { '--fx-dur': '7s' } },
            { v: '4', label: '快', vars: { '--fx-dur': '4s' } },
            { v: '5', label: '很快', vars: { '--fx-dur': '2.2s' } }
          ]
        },
        {
          k: 'int', label: '浓度', def: '3', target: '',
          opts: [
            { v: '1', label: '极淡', vars: { '--fx-int': '.22' } },
            { v: '2', label: '淡', vars: { '--fx-int': '.42' } },
            { v: '3', label: '标准', vars: { '--fx-int': '.62' } },
            { v: '4', label: '浓', vars: { '--fx-int': '.84' } },
            { v: '5', label: '极浓', vars: { '--fx-int': '1' } }
          ]
        },
        {
          k: 'blend', label: '混合模式', def: 'normal', target: ' .fx-l',
          opts: [
            { v: 'normal', label: '正常', css: 'mix-blend-mode:normal' },
            { v: 'overlay', label: '叠加', css: 'mix-blend-mode:overlay' },
            { v: 'softlight', label: '柔光', css: 'mix-blend-mode:soft-light' },
            { v: 'screen', label: '滤色', css: 'mix-blend-mode:screen' },
            { v: 'multiply', label: '正片叠底', css: 'mix-blend-mode:multiply' },
            { v: 'plus', label: '线性减淡', css: 'mix-blend-mode:plus-lighter' }
          ]
        },
        {
          k: 'vig', label: '暗角 / 描边光', def: 'none', target: ' .fx-l-vig',
          opts: [
            { v: 'none', label: '无', css: 'background-image:none;box-shadow:none' },
            { v: 'soft', label: '柔和暗角', css: 'background-image:radial-gradient(circle at 50% 45%,transparent 45%,rgba(0,0,0,.32) 100%)' },
            { v: 'strong', label: '强烈暗角', css: 'background-image:radial-gradient(circle at 50% 45%,transparent 30%,rgba(0,0,0,.58) 100%)' },
            { v: 'frame', label: '内描边光', css: 'box-shadow:inset 0 0 0 1px var(--fx-c2),inset 0 0 26px -6px var(--fx-c2);border-radius:inherit' }
          ]
        },
        {
          k: 'bd', label: '外框 / 辉光', def: 'none', target: '',
          opts: [
            { v: 'none', label: '无外框', css: 'border-color:transparent;box-shadow:none' },
            { v: 'line', label: '细描边', css: 'border:1px solid var(--fx-c2)' },
            { v: 'glow', label: '柔光外框', css: 'border:1px solid var(--fx-c2);box-shadow:0 0 18px -4px var(--fx-c2)' },
            { v: 'neon', label: '霓虹外框', css: 'border:1px solid var(--fx-c2);box-shadow:0 0 10px var(--fx-c2),inset 0 0 12px -4px var(--fx-c2)' },
            { v: 'dashed', label: '虚线外框', css: 'border:1px dashed var(--fx-c2)' },
            { v: 'double', label: '双线外框', css: 'border:3px double var(--fx-c2)' }
          ]
        },

        /* ---------- 文字特效（text:true，作用于帖子正文 .post-content） ---------- */
        {
          k: 'tstyle', label: '文字样式', def: 'keep', text: true, target: ' .post-content',
          opts: [
            { v: 'keep', label: '跟随主题' },
            { v: 'solid', label: '纯色', css: 'color:var(--fx-tc1)' },
            { v: 'gradient', label: '渐变字', css: 'background-image:linear-gradient(92deg,var(--fx-tc1),var(--fx-tc2));-webkit-background-clip:text;background-clip:text;color:transparent' },
            { v: 'outline', label: '描边字', css: 'color:transparent;-webkit-text-stroke:1px var(--fx-tc1)' },
            { v: 'neon', label: '霓虹', css: 'color:var(--fx-tc2);text-shadow:0 0 6px var(--fx-tc1),0 0 14px var(--fx-tc1)' },
            { v: 'emboss', label: '浮雕', css: 'color:var(--fx-tc1);text-shadow:0 1px 0 rgba(255,255,255,.55),0 -1px 1px rgba(0,0,0,.55)' },
            { v: 'shadow', label: '投影', css: 'color:var(--fx-tc1);text-shadow:0 2px 6px rgba(0,0,0,.6)' },
            { v: 'chrome', label: '金属铬', css: 'background-image:linear-gradient(180deg,#fff,var(--fx-tc1) 45%,#fff 55%,var(--fx-tc2));-webkit-background-clip:text;background-clip:text;color:transparent' },
            { v: 'fire', label: '烈焰', css: 'background-image:linear-gradient(0deg,#fbbf24,var(--fx-tc1) 55%,#fff);-webkit-background-clip:text;background-clip:text;color:transparent' },
            { v: 'ice', label: '寒冰', css: 'background-image:linear-gradient(180deg,#e0f2fe,var(--fx-tc2));-webkit-background-clip:text;background-clip:text;color:transparent' },
            { v: 'rainbow', label: '彩虹', css: 'background-image:linear-gradient(90deg,#f87171,#fbbf24,#4ade80,#38bdf8,#a78bfa);-webkit-background-clip:text;background-clip:text;color:transparent' },
            { v: 'gold', label: '鎏金', css: 'background-image:linear-gradient(100deg,#fde68a,#f59e0b 40%,#fff7cc 55%,#d97706);-webkit-background-clip:text;background-clip:text;color:transparent' },
            { v: 'ink', label: '水墨', css: 'background-image:linear-gradient(160deg,#0f172a,#475569 60%,#94a3b8);-webkit-background-clip:text;background-clip:text;color:transparent' },
            { v: 'candy', label: '糖果', css: 'background-image:linear-gradient(90deg,#f472b6,#c084fc,#60a5fa,#34d399);-webkit-background-clip:text;background-clip:text;color:transparent' }
          ]
        },
        {
          k: 'tanim', label: '文字动效', def: 'none', text: true, target: ' .post-content',
          opts: [
            { v: 'none', label: '静止' },
            { v: 'typein', label: '打字机', css: 'animation:fxTypeIn var(--fx-dur,3s) steps(24,end) 1 both' },
            { v: 'marquee', label: '左右微移', css: 'animation:fxMarquee var(--fx-dur,6s) ease-in-out infinite' },
            { v: 'rise', label: '上浮渐显', css: 'animation:fxRise var(--fx-dur,4s) ease-out infinite' },
            { v: 'shake', label: '抖动', css: 'animation:fxShake var(--fx-dur,1.2s) ease-in-out infinite' },
            { v: 'shine', label: '流光扫过', css: 'background-size:220% 100%;animation:fxShine var(--fx-dur,4s) linear infinite' },
            { v: 'glow', label: '呼吸光晕', css: 'animation:fxGlowPulse var(--fx-dur,5s) ease-in-out infinite' },
            { v: 'breathe', label: '呼吸缩放', css: 'animation:fxBreathe var(--fx-dur,6s) ease-in-out infinite' },
            { v: 'float', label: '轻浮', css: 'animation:fxFloat var(--fx-dur,4s) ease-in-out infinite' },
            { v: 'blink', label: '明暗闪', css: 'animation:fxBlink var(--fx-dur,3s) ease-in-out infinite' },
            { v: 'wave', label: '波浪', css: 'animation:fxWave var(--fx-dur,4s) ease-in-out infinite' },
            { v: 'flicker', label: '霓虹抖动', css: 'animation:fxFlicker var(--fx-dur,3s) linear infinite' },
            { v: 'tilt', label: '轻晃', css: 'animation:fxTilt var(--fx-dur,5s) ease-in-out infinite' },
            { v: 'scale', label: '脉冲', css: 'animation:fxScale var(--fx-dur,3s) ease-in-out infinite' },
            { v: 'swing', label: '摆动', css: 'animation:fxSwing var(--fx-dur,3s) ease-in-out infinite;transform-origin:top center' },
            { v: 'bounce', label: '弹跳', css: 'animation:fxBounce var(--fx-dur,2.6s) ease-in-out infinite' }
          ]
        },
        {
          k: 'tdeco', label: '文字衬底', def: 'none', text: true, target: ' .post-content',
          opts: [
            { v: 'none', label: '无衬底' },
            { v: 'panel', label: '卡片底', css: 'background-color:color-mix(in srgb,var(--fx-tc2) 14%,transparent);border-radius:10px;padding:8px 10px' },
            { v: 'glass', label: '玻璃底', css: 'background-color:color-mix(in srgb,var(--fx-tc2) 12%,transparent);backdrop-filter:blur(6px);border-radius:10px;padding:8px 10px' },
            { v: 'stripe', label: '斜纹底', css: 'background-image:repeating-linear-gradient(45deg,color-mix(in srgb,var(--fx-tc2) 18%,transparent) 0 5px,transparent 5px 11px);border-radius:8px;padding:8px 10px' },
            { v: 'grid', label: '网格底', css: 'background-image:linear-gradient(color-mix(in srgb,var(--fx-tc2) 20%,transparent) 1px,transparent 1px),linear-gradient(90deg,color-mix(in srgb,var(--fx-tc2) 20%,transparent) 1px,transparent 1px);background-size:12px 12px;border-radius:8px;padding:8px 10px' },
            { v: 'dots', label: '圆点底', css: 'background-image:radial-gradient(color-mix(in srgb,var(--fx-tc2) 30%,transparent) 1.2px,transparent 1.3px);background-size:10px 10px;border-radius:8px;padding:8px 10px' },
            { v: 'grad', label: '渐变底', css: 'background-image:linear-gradient(135deg,color-mix(in srgb,var(--fx-tc1) 16%,transparent),color-mix(in srgb,var(--fx-tc2) 20%,transparent));border-radius:10px;padding:8px 10px' },
            { v: 'quote', label: '左侧竖线', css: 'border-left:3px solid var(--fx-tc2);background-color:color-mix(in srgb,var(--fx-tc2) 10%,transparent);border-radius:0 8px 8px 0;padding:8px 10px' }
          ]
        },
        {
          k: 'twt', label: '文字字重', def: '0', text: true, target: ' .post-content',
          opts: [
            { v: '0', label: '跟随主题' },
            { v: '400', label: '常规', css: 'font-weight:400' },
            { v: '600', label: '半粗', css: 'font-weight:600' },
            { v: '800', label: '加粗', css: 'font-weight:800' }
          ]
        },
        {
          k: 'tit', label: '文字倾斜', def: '0', text: true, target: ' .post-content',
          opts: [
            { v: '0', label: '正体' },
            { v: '1', label: '斜体', css: 'font-style:italic' }
          ]
        },
        {
          k: 'tsp', label: '文字字距', def: 'keep', text: true, target: ' .post-content',
          opts: [
            { v: 'keep', label: '跟随主题' },
            { v: '0', label: '紧凑', css: 'letter-spacing:0' },
            { v: '1', label: '标准', css: 'letter-spacing:.4px' },
            { v: '2', label: '宽松', css: 'letter-spacing:1.2px' },
            { v: '3', label: '很宽', css: 'letter-spacing:2.4px' }
          ]
        },
        {
          k: 'tlead', label: '文字行高', def: 'keep', text: true, target: ' .post-content',
          opts: [
            { v: 'keep', label: '跟随主题' },
            { v: '1', label: '紧凑', css: 'line-height:1.5' },
            { v: '2', label: '标准', css: 'line-height:1.8' },
            { v: '3', label: '宽松', css: 'line-height:2.2' }
          ]
        },
        {
          k: 'tglow', label: '文字外发光', def: '0', text: true, target: ' .post-content',
          opts: [
            { v: '0', label: '无' },
            { v: '1', label: '弱', css: 'text-shadow:0 0 4px var(--fx-tc2)' },
            { v: '2', label: '中', css: 'text-shadow:0 0 8px var(--fx-tc2),0 0 14px var(--fx-tc2)' },
            { v: '3', label: '强', css: 'text-shadow:0 0 10px var(--fx-tc1),0 0 20px var(--fx-tc2),0 0 30px var(--fx-tc2)' },
            { v: '4', label: '描边光', css: 'text-shadow:0 1px 0 var(--fx-tc2),0 -1px 0 var(--fx-tc2),1px 0 0 var(--fx-tc2),-1px 0 0 var(--fx-tc2)' }
          ]
        },
        {
          k: 'talign', label: '文字对齐', def: '0', text: true, target: ' .post-content',
          opts: [
            { v: '0', label: '跟随主题' },
            { v: '1', label: '左对齐', css: 'text-align:left' },
            { v: '2', label: '居中', css: 'text-align:center' },
            { v: '3', label: '两端对齐', css: 'text-align:justify' }
          ]
        }
      ]
    },

    /* ------------------------------- 称号 -------------------------------- */
    title: {
      key: 'title',
      label: '称号',
      icon: '🏷',
      base: 'fx-title',
      hint: '称号文字由管理员在商品里设定；用户可在个人主页选择佩戴（最多 3 个）。',
      text: { label: '称号文字', def: '校园达人', max: 12 },
      colors: [
        { k: 'c1', label: '主色', def: '#f59e0b' },
        { k: 'c2', label: '辅色', def: '#ffffff' },
        { k: 'tc1', label: '文字颜色', def: '#f59e0b' }
      ],
      /* tcol 必须最后输出：它是「显式文字色」，要能压过文字样式里的颜色声明 */
      cssOrder: ['style', 'anim', 'deco', 'wt', 'it', 'sp', 'glow', 'sh', 'fill', 'tcol'],
      slots: [
        {
          k: 'style', label: '文字样式', def: 'gradient', target: '',
          opts: [
            { v: 'plain', label: '纯色', css: 'color:var(--fx-tc1)' },
            { v: 'gradient', label: '渐变字', css: 'background-image:linear-gradient(92deg,var(--fx-tc1),var(--fx-c2));-webkit-background-clip:text;background-clip:text;color:transparent' },
            { v: 'outline', label: '描边字', css: 'color:transparent;-webkit-text-stroke:1px var(--fx-tc1)' },
            { v: 'neon', label: '霓虹', css: 'color:var(--fx-tc1);text-shadow:0 0 6px var(--fx-c1),0 0 14px var(--fx-c1)' },
            { v: 'emboss', label: '浮雕', css: 'color:var(--fx-tc1);text-shadow:0 1px 0 rgba(255,255,255,.55),0 -1px 1px rgba(0,0,0,.55)' },
            { v: 'shadow', label: '投影', css: 'color:var(--fx-tc1);text-shadow:0 2px 6px rgba(0,0,0,.55)' },
            { v: 'chrome', label: '金属铬', css: 'background-image:linear-gradient(180deg,#fff,var(--fx-tc1) 45%,#fff 55%,var(--fx-c2));-webkit-background-clip:text;background-clip:text;color:transparent' },
            { v: 'fire', label: '烈焰', css: 'background-image:linear-gradient(0deg,#fbbf24,var(--fx-tc1) 55%,#fff);-webkit-background-clip:text;background-clip:text;color:transparent' },
            { v: 'ice', label: '寒冰', css: 'background-image:linear-gradient(180deg,#e0f2fe,var(--fx-c2));-webkit-background-clip:text;background-clip:text;color:transparent' },
            { v: 'rainbow', label: '彩虹', css: 'background-image:linear-gradient(90deg,#f87171,#fbbf24,#4ade80,#38bdf8,#a78bfa);-webkit-background-clip:text;background-clip:text;color:transparent' },
            { v: 'gold', label: '鎏金', css: 'background-image:linear-gradient(100deg,#fde68a,#f59e0b 40%,#fff7cc 55%,#d97706);-webkit-background-clip:text;background-clip:text;color:transparent' },
            { v: 'sticker', label: '贴纸', css: 'color:var(--fx-c2);background-color:var(--fx-c1);-webkit-text-stroke:.6px rgba(0,0,0,.25)' },
            { v: 'metalgrid', label: '金属格', css: 'background-image:linear-gradient(180deg,#fff,var(--fx-c1) 44%,#fff 52%,var(--fx-c2)),linear-gradient(90deg,rgba(255,255,255,.2) 1px,transparent 1px);background-size:100% 100%,6px 6px;-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent' },
            { v: 'aurora', label: '极光字', css: 'background-image:linear-gradient(100deg,#22d3ee,#a78bfa,#f472b6,#34d399);background-size:220% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent' },
            { v: 'hologram', label: '全息字', css: 'background-image:repeating-linear-gradient(0deg,rgba(255,255,255,.9) 0 1px,transparent 1px 4px),linear-gradient(90deg,#67e8f9,#c4b5fd,#f0abfc);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent' },
            { v: 'glass', label: '玻璃字', css: 'color:rgba(255,255,255,.88);text-shadow:0 1px 0 rgba(255,255,255,.7),0 0 12px var(--fx-c1);-webkit-text-stroke:.35px var(--fx-c2)' },
            { v: 'velvet', label: '丝绒字', css: 'background-image:linear-gradient(135deg,var(--fx-tc1),#7c2d12 48%,var(--fx-c2));text-shadow:0 1px 2px rgba(0,0,0,.45);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent' }
          ]
        },
        {
          k: 'tcol', label: '文字颜色覆盖', def: 'auto', target: '',
          opts: [
            { v: 'auto', label: '跟随文字样式' },
            { v: 'solid', label: '使用「文字颜色」', css: 'color:var(--fx-tc1);-webkit-text-fill-color:var(--fx-tc1)' }
          ]
        },
        {
          k: 'anim', label: '动效', def: 'shine', target: '',
          opts: [
            { v: 'none', label: '静止', css: 'animation:none' },
            { v: 'shine', label: '流光扫过', css: 'background-size:220% 100%;animation:fxShine var(--fx-dur,4s) linear infinite' },
            { v: 'glow', label: '呼吸光晕', css: 'animation:fxGlowPulse var(--fx-dur,5s) ease-in-out infinite' },
            { v: 'breathe', label: '呼吸缩放', css: 'animation:fxBreathe var(--fx-dur,6s) ease-in-out infinite' },
            { v: 'float', label: '轻浮', css: 'animation:fxFloat var(--fx-dur,4s) ease-in-out infinite' },
            { v: 'blink', label: '明暗闪', css: 'animation:fxBlink var(--fx-dur,3s) ease-in-out infinite' },
            { v: 'wave', label: '摇摆', css: 'animation:fxWave var(--fx-dur,4s) ease-in-out infinite' },
            { v: 'flicker', label: '霓虹抖动', css: 'animation:fxFlicker var(--fx-dur,3s) linear infinite' },
            { v: 'tilt', label: '轻晃', css: 'animation:fxTilt var(--fx-dur,5s) ease-in-out infinite' },
            { v: 'scale', label: '脉冲', css: 'animation:fxScale var(--fx-dur,3s) ease-in-out infinite' },
            { v: 'swing', label: '摆动', css: 'animation:fxSwing var(--fx-dur,3s) ease-in-out infinite;transform-origin:top center' },
            { v: 'bounce', label: '弹跳', css: 'animation:fxBounce var(--fx-dur,2.6s) ease-in-out infinite' }
          ]
        },
        {
          k: 'deco', label: '装饰符号 / 铭文', def: 'none', target: '::before', target2: '::after',
          opts: [
            { v: 'none', label: '无', css: 'content:""' },
            { v: 'sparkle', label: '✦ 星芒', css: 'content:"✦";color:var(--fx-c2)' },
            { v: 'star', label: '★ 星', css: 'content:"★";color:var(--fx-c2)' },
            { v: 'heart', label: '♥ 心', css: 'content:"♥";color:var(--fx-c2)' },
            { v: 'fire', label: '🔥 火', css: 'content:"🔥"' },
            { v: 'leaf', label: '🍃 叶', css: 'content:"🍃"' },
            { v: 'snow', label: '❄ 雪', css: 'content:"❄";color:var(--fx-c2)' },
            { v: 'bolt', label: '⚡ 电', css: 'content:"⚡"' },
            { v: 'crown', label: '👑 冠', css: 'content:"👑"' },
            { v: 'gem', label: '💎 钻', css: 'content:"💎"' },
            { v: 'wing', label: '🪽 翼', css: 'content:"🪽"' },
            { v: 'arrow', label: '➤ 箭', css: 'content:"➤";color:var(--fx-c2)' }
          ]
        },
        {
          k: 'wt', label: '字重', def: '600', target: '',
          opts: [
            { v: '400', label: '常规', vars: { '--fx-wt': '400' } },
            { v: '600', label: '半粗', vars: { '--fx-wt': '600' } },
            { v: '800', label: '加粗', vars: { '--fx-wt': '800' } }
          ]
        },
        {
          k: 'it', label: '倾斜', def: '0', target: '',
          opts: [
            { v: '0', label: '正体', vars: { '--fx-it': 'normal' } },
            { v: '1', label: '斜体', vars: { '--fx-it': 'italic' } }
          ]
        },
        {
          k: 'sp', label: '字距', def: '1', target: '',
          opts: [
            { v: '0', label: '紧凑', vars: { '--fx-sp': '0' } },
            { v: '1', label: '标准', vars: { '--fx-sp': '.4px' } },
            { v: '2', label: '宽松', vars: { '--fx-sp': '1.4px' } }
          ]
        },
        {
          k: 'glow', label: '外发光', def: '2', target: '',
          opts: [
            { v: '0', label: '无', css: 'filter:none' },
            { v: '1', label: '弱', css: 'filter:drop-shadow(0 0 2px var(--fx-c1))' },
            { v: '2', label: '中', css: 'filter:drop-shadow(0 0 5px var(--fx-c1))' },
            { v: '3', label: '强', css: 'filter:drop-shadow(0 0 9px var(--fx-c1)) drop-shadow(0 0 16px var(--fx-c2))' }
          ]
        },
        {
          k: 'sh', label: '投影', def: '1', target: '',
          opts: [
            { v: '0', label: '无', css: 'box-shadow:none' },
            { v: '1', label: '柔和', css: 'box-shadow:0 2px 8px -3px rgba(0,0,0,.5)' },
            { v: '2', label: '硬朗', css: 'box-shadow:0 3px 0 -1px rgba(0,0,0,.45)' },
            { v: '3', label: '偏移', css: 'box-shadow:3px 3px 0 0 rgba(0,0,0,.4)' }
          ]
        },
        {
          k: 'fill', label: '底色填充 / 铭牌', def: 'solid', target: '',
          opts: [
            { v: 'solid', label: '实底', css: 'background-color:color-mix(in srgb,var(--fx-c1) 22%,transparent)' },
            { v: 'fade', label: '渐隐', css: 'background-image:linear-gradient(90deg,color-mix(in srgb,var(--fx-c1) 34%,transparent),transparent)' },
            { v: 'stripe', label: '斜纹底', css: 'background-image:repeating-linear-gradient(45deg,color-mix(in srgb,var(--fx-c1) 30%,transparent) 0 4px,transparent 4px 9px)' },
            { v: 'gloss', label: '高光底', css: 'background-image:linear-gradient(180deg,rgba(255,255,255,.28),transparent 60%),linear-gradient(90deg,color-mix(in srgb,var(--fx-c1) 30%,transparent),color-mix(in srgb,var(--fx-c2) 22%,transparent))' },
            { v: 'grain', label: '颗粒底', css: 'background-image:radial-gradient(color-mix(in srgb,var(--fx-c2) 40%,transparent) .8px,transparent 1px);background-size:4px 4px;background-color:color-mix(in srgb,var(--fx-c1) 16%,transparent)' },
            { v: 'glass', label: '玻璃底', css: 'background-color:color-mix(in srgb,var(--fx-c1) 16%,transparent);backdrop-filter:blur(6px)' }
          ]
        }
      ]
    },

    /* ----------------------------- 昵称样式 ------------------------------ */
    nickname_style: {
      key: 'nickname_style',
      label: '昵称样式',
      icon: '✨',
      base: 'fx-nick',
      hint: '作用于帖子与评论里的作者昵称；用户可在个人主页选择佩戴。',
      colors: [
        { k: 'c1', label: '主色', def: '#22d3ee' },
        { k: 'c2', label: '辅色', def: '#a78bfa' },
        { k: 'tc1', label: '文字颜色', def: '#22d3ee' }
      ],
      cssOrder: ['font', 'style', 'anim', 'deco', 'wt', 'it', 'glow', 'ul', 'bg', 'tcol'],
      slots: [
        {
          k: 'font', label: '字体风格', def: 'system', target: '',
          opts: [
            { v: 'system', label: '默认', css: 'font-family:inherit' },
            { v: 'serif', label: '衬线', css: 'font-family:Georgia,"Songti SC","SimSun",serif' },
            { v: 'mono', label: '等宽', css: 'font-family:"JetBrains Mono",Consolas,"Courier New",monospace' },
            { v: 'rounded', label: '圆润', css: 'font-family:"PingFang SC","Microsoft YaHei",system-ui;font-weight:var(--fx-wt,600)' },
            { v: 'condensed', label: '紧凑', css: 'font-stretch:condensed;letter-spacing:-.2px' },
            { v: 'wide', label: '舒展', css: 'font-stretch:expanded;letter-spacing:.8px' },
            { v: 'elegant', label: '雅致', css: 'font-family:"Songti SC",Georgia,serif;font-style:var(--fx-it,italic)' },
            { v: 'hand', label: '手写', css: 'font-family:"Comic Sans MS","Segoe Print",cursive' }
          ]
        },
        {
          k: 'style', label: '文字样式', def: 'gradient', target: ' .nick-txt',
          opts: [
            { v: 'plain', label: '纯色', css: 'color:var(--fx-tc1);-webkit-text-fill-color:var(--fx-tc1)' },
            { v: 'gradient', label: '渐变字', css: 'background-image:linear-gradient(92deg,var(--fx-tc1),var(--fx-c2));-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent' },
            { v: 'outline', label: '描边字', css: 'color:transparent;-webkit-text-fill-color:transparent;-webkit-text-stroke:1px var(--fx-tc1)' },
            { v: 'neon', label: '霓虹', css: 'color:var(--fx-tc1);-webkit-text-fill-color:var(--fx-tc1);text-shadow:0 0 6px var(--fx-c1),0 0 13px var(--fx-c1)' },
            { v: 'emboss', label: '浮雕', css: 'color:var(--fx-tc1);-webkit-text-fill-color:var(--fx-tc1);text-shadow:0 1px 0 rgba(255,255,255,.5),0 -1px 1px rgba(0,0,0,.5)' },
            { v: 'shadow', label: '投影', css: 'color:var(--fx-tc1);-webkit-text-fill-color:var(--fx-tc1);text-shadow:0 2px 5px rgba(0,0,0,.55)' },
            { v: 'chrome', label: '金属铬', css: 'background-image:linear-gradient(180deg,#fff,var(--fx-tc1) 48%,#fff 56%,var(--fx-c2));-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent' },
            { v: 'metalgrid', label: '金属格', css: 'background-image:linear-gradient(180deg,#fff,var(--fx-tc1) 44%,#fff 52%,var(--fx-c2)),linear-gradient(90deg,rgba(255,255,255,.2) 1px,transparent 1px);background-size:100% 100%,6px 6px;-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent' },
            { v: 'fire', label: '烈焰', css: 'background-image:linear-gradient(0deg,#fbbf24,var(--fx-tc1) 60%,#fff);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent' },
            { v: 'ice', label: '寒冰', css: 'background-image:linear-gradient(180deg,#e0f2fe,var(--fx-c2));-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent' },
            { v: 'rainbow', label: '彩虹', css: 'background-image:linear-gradient(90deg,#f87171,#fbbf24,#4ade80,#38bdf8,#a78bfa);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent' },
            { v: 'aurora', label: '极光字', css: 'background-image:linear-gradient(100deg,#22d3ee,#a78bfa,#f472b6,#34d399);background-size:220% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent' },
            { v: 'hologram', label: '全息字', css: 'background-image:repeating-linear-gradient(0deg,rgba(255,255,255,.9) 0 1px,transparent 1px 4px),linear-gradient(90deg,#67e8f9,#c4b5fd,#f0abfc);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent' },
            { v: 'spectrum', label: '光谱字', css: 'background-image:linear-gradient(90deg,#ef4444,#f59e0b,#eab308,#22c55e,#06b6d4,#3b82f6,#8b5cf6,#ec4899);background-size:300% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent' },
            { v: 'plasma', label: '等离子字', css: 'background-image:radial-gradient(circle at 20% 20%,#fff 0 3%,transparent 18%),linear-gradient(110deg,#7c3aed,#ec4899,#06b6d4);background-size:180% 180%;-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent' },
            { v: 'carbon', label: '碳纤维字', css: 'background-image:repeating-linear-gradient(45deg,#111827 0 2px,#374151 2px 4px);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent' },
            { v: 'glass', label: '玻璃字', css: 'color:rgba(255,255,255,.9);-webkit-text-fill-color:rgba(255,255,255,.9);text-shadow:0 1px 0 rgba(255,255,255,.7),0 0 10px var(--fx-c1);-webkit-text-stroke:.35px var(--fx-c2)' },
            { v: 'velvet', label: '丝绒字', css: 'background-image:linear-gradient(135deg,var(--fx-tc1),#7c2d12 48%,var(--fx-c2));-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;text-shadow:0 1px 2px rgba(0,0,0,.45)' }
          ]
        },
        {
          k: 'anim', label: '动效', def: 'none', target: ' .nick-txt',
          opts: [
            { v: 'none', label: '静止', css: 'animation:none' },
            { v: 'shine', label: '流光扫过', css: 'background-size:220% 100%;animation:fxShine var(--fx-dur,4s) linear infinite' },
            { v: 'glow', label: '呼吸光晕', css: 'animation:fxGlowPulse var(--fx-dur,5s) ease-in-out infinite' },
            { v: 'breathe', label: '呼吸缩放', css: 'animation:fxBreathe var(--fx-dur,6s) ease-in-out infinite' },
            { v: 'float', label: '轻浮', css: 'animation:fxFloat var(--fx-dur,4s) ease-in-out infinite' },
            { v: 'blink', label: '明暗闪', css: 'animation:fxBlink var(--fx-dur,3s) ease-in-out infinite' },
            { v: 'wave', label: '摇摆', css: 'animation:fxWave var(--fx-dur,4s) ease-in-out infinite' },
            { v: 'flicker', label: '霓虹抖动', css: 'animation:fxFlicker var(--fx-dur,3s) linear infinite' },
            { v: 'tilt', label: '轻晃', css: 'animation:fxTilt var(--fx-dur,5s) ease-in-out infinite' },
            { v: 'scale', label: '脉冲', css: 'animation:fxScale var(--fx-dur,3s) ease-in-out infinite' },
            { v: 'glitch', label: '故障闪烁', css: 'animation:fxGlitch var(--fx-dur,3s) steps(2,end) infinite' },
            { v: 'rainbow', label: '彩虹流动', css: 'background-size:300% 100%;animation:fxRainbowFlow var(--fx-dur,6s) linear infinite' },
            { v: 'elastic', label: '弹性摆动', css: 'animation:fxSwing var(--fx-dur,3s) cubic-bezier(.34,1.56,.64,1) infinite' },
            { v: 'orbit', label: '环绕摆动', css: 'animation:fxOrbit var(--fx-dur,7s) linear infinite' },
            { v: 'rise', label: '上浮渐显', css: 'animation:fxRise var(--fx-dur,4s) ease-out infinite' }
          ]
        },
        {
          k: 'deco', label: '前置装饰', def: 'none', target: '::before',
          opts: [
            { v: 'none', label: '无', css: 'content:""' },
            { v: 'star', label: '★', css: 'content:"★";color:var(--fx-c1);margin-right:3px' },
            { v: 'sparkle', label: '✦', css: 'content:"✦";color:var(--fx-c1);margin-right:3px' },
            { v: 'heart', label: '♥', css: 'content:"♥";color:var(--fx-c1);margin-right:3px' },
            { v: 'bolt', label: '⚡', css: 'content:"⚡";margin-right:3px' },
            { v: 'wing', label: '🪽', css: 'content:"🪽";margin-right:3px' },
            { v: 'crown', label: '👑', css: 'content:"👑";margin-right:3px' },
            { v: 'gem', label: '💎', css: 'content:"💎";margin-right:3px' }
          ]
        },
        {
          k: 'wt', label: '字重', def: '600', target: '',
          opts: [
            { v: '400', label: '常规', vars: { '--fx-wt': '400' } },
            { v: '600', label: '半粗', vars: { '--fx-wt': '600' } },
            { v: '800', label: '加粗', vars: { '--fx-wt': '800' } }
          ]
        },
        {
          k: 'it', label: '倾斜', def: '0', target: '',
          opts: [
            { v: '0', label: '正体', vars: { '--fx-it': 'normal' } },
            { v: '1', label: '斜体', vars: { '--fx-it': 'italic' } }
          ]
        },
        {
          k: 'glow', label: '外发光', def: '0', target: '',
          opts: [
            { v: '0', label: '无', css: 'filter:none' },
            { v: '1', label: '弱', css: 'filter:drop-shadow(0 0 2px var(--fx-c1))' },
            { v: '2', label: '中', css: 'filter:drop-shadow(0 0 5px var(--fx-c1))' },
            { v: '3', label: '强', css: 'filter:drop-shadow(0 0 9px var(--fx-c1)) drop-shadow(0 0 15px var(--fx-c2))' }
          ]
        },
        {
          k: 'ul', label: '下划线', def: 'none', target: '::after',
          opts: [
            { v: 'none', label: '无', css: 'content:""' },
            { v: 'solid', label: '实线', css: 'content:"";position:absolute;left:0;right:0;bottom:-1px;height:2px;background:var(--fx-c1);border-radius:2px' },
            { v: 'dashed', label: '虚线', css: 'content:"";position:absolute;left:0;right:0;bottom:-1px;height:2px;background:repeating-linear-gradient(90deg,var(--fx-c1) 0 4px,transparent 4px 8px)' },
            { v: 'dotted', label: '点线', css: 'content:"";position:absolute;left:0;right:0;bottom:-1px;height:2px;background:radial-gradient(var(--fx-c1) 1px,transparent 1.2px) repeat-x;background-size:6px 2px' },
            { v: 'wavy', label: '波浪线', css: 'content:"";position:absolute;left:0;right:0;bottom:-2px;height:3px;background:radial-gradient(circle at 3px 0,transparent 2px,var(--fx-c1) 2.2px,transparent 2.6px) repeat-x;background-size:6px 3px' }
          ]
        },
        {
          k: 'bg', label: '昵称底纹 / 铭牌', def: 'none', target: '',
          opts: [
            { v: 'none', label: '无', css: 'background-image:none;background-color:transparent' },
            { v: 'pill', label: '胶囊底', css: 'background-color:color-mix(in srgb,var(--fx-c1) 20%,transparent);border-radius:999px;padding:0 7px' },
            { v: 'soft', label: '柔光底', css: 'background-image:radial-gradient(circle at 50% 50%,color-mix(in srgb,var(--fx-c1) 30%,transparent),transparent 72%)' },
            { v: 'glass', label: '玻璃底', css: 'background-color:color-mix(in srgb,var(--fx-c1) 14%,transparent);backdrop-filter:blur(6px);border-radius:8px;padding:0 5px' }
          ]
        },
        {
          k: 'tcol', label: '文字颜色覆盖', def: 'auto', target: ' .nick-txt',
          opts: [
            { v: 'auto', label: '跟随文字样式' },
            { v: 'solid', label: '使用「文字颜色」', css: 'color:var(--fx-tc1);-webkit-text-fill-color:var(--fx-tc1)' }
          ]
        }
      ]
    },

    /* ------------------------------- 徽章 -------------------------------- */
    badge: {
      key: 'badge',
      label: '成就徽章',
      icon: '🏅',
      base: 'fx-badge',
      hint: '徽章全部由内置图形与动效渲染（不使用图片）；用户可在个人主页选择佩戴（最多 3 枚）。',
      /* 输出顺序：底纹先、动效后 —— 两者都可能写 animation，用户选的动效必须赢 */
      cssOrder: ['ico', 'shape', 'bgf', 'spd', 'anim', 'ring', 'glow', 'spk'],
      icons: [
        '🏅', '🥇', '🥈', '🥉', '🏆', '🎖', '👑', '💎', '⭐', '🌟',
        '✨', '🔥', '⚡', '❄', '🌈', '🍀', '🌱', '🌿', '🌸', '🌺',
        '🌻', '🍁', '🎯', '🎨', '🎓', '📚', '✏️', '🧠', '🔬', '🚀',
        '🛰️', '🛡️', '⚔️', '🗡️', '🏹', '🎵', '🎸', '🥁', '🎤', '💡'
      ],
      colors: [
        { k: 'c1', label: '主色', def: '#7c3aed' },
        { k: 'c2', label: '辅色', def: '#fbbf24' }
      ],
      slots: [
        {
          k: 'ico', label: '内置图标', def: '🏅', target: ' .fx-badge-ico', iconSlot: true,
          opts: [] /* 由 icons 自动展开 */
        },
        {
          /* 外形：圆角写在外层（外环 border-radius:inherit 才能跟着走），
             clip-path 写到内层 .fx-badge-body —— 否则会把自己元素上的「外发光」一并裁掉 */
          k: 'shape', label: '外形', def: 'circle', target: '', target2: ' .fx-badge-body',
          opts: [
            { v: 'circle', label: '圆形', css: '--fx-rad:50%' },
            { v: 'squircle', label: '圆角方', css: '--fx-rad:34%' },
            { v: 'hex', label: '六边形', css: '--fx-rad:14%', css2: 'clip-path:polygon(25% 3%,75% 3%,100% 50%,75% 97%,25% 97%,0 50%)' },
            { v: 'diamond', label: '菱形', css: '--fx-rad:16%', css2: 'clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%)' },
            { v: 'shield', label: '盾形', css: '--fx-rad:12%', css2: 'clip-path:polygon(50% 0,100% 18%,100% 62%,50% 100%,0 62%,0 18%)' },
            { v: 'star', label: '星形', css: '--fx-rad:0', css2: 'clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)' },
            { v: 'leaf', label: '叶形', css: '--fx-rad:0 50% 0 50%' },
            { v: 'ring', label: '环形', css: '--fx-rad:50%', css2: 'box-shadow:inset 0 0 0 3px var(--fx-c2)' },
            { v: 'octagon', label: '八边形', css: '--fx-rad:14%', css2: 'clip-path:polygon(30% 0,70% 0,100% 30%,100% 70%,70% 100%,30% 100%,0 70%,0 30%)' },
            { v: 'burst', label: '爆裂星', css: '--fx-rad:0', css2: 'clip-path:polygon(50% 0,61% 25%,86% 14%,75% 39%,100% 50%,75% 61%,86% 86%,61% 75%,50% 100%,39% 75%,14% 86%,25% 61%,0 50%,25% 39%,14% 14%,39% 25%)' },
            { v: 'ticket', label: '票券形', css: '--fx-rad:12%', css2: 'clip-path:polygon(0 12%,12% 12%,12% 0,88% 0,88% 12%,100% 12%,100% 88%,88% 88%,88% 100%,12% 100%,12% 88%,0 88%)' },
            { v: 'ribbon', label: '绶带形', css: '--fx-rad:18%', css2: 'clip-path:polygon(8% 0,92% 0,100% 50%,92% 100%,8% 100%,0 50%)' }
          ]
        },
        {
          k: 'anim', label: '动效', def: 'none', target: '', target2: ' .fx-badge-body',
          opts: [
            { v: 'none', label: '静止', css: 'animation:none', css2: 'animation:none' },
            { v: 'spin', label: '旋转', css: 'animation:fxSpin var(--fx-dur,8s) linear infinite' },
            { v: 'pulse', label: '脉冲', css: 'animation:fxScale var(--fx-dur,3s) ease-in-out infinite' },
            { v: 'breathe', label: '呼吸', css: 'animation:fxBreathe var(--fx-dur,5s) ease-in-out infinite' },
            { v: 'bounce', label: '弹跳', css: 'animation:fxBounce var(--fx-dur,2.4s) ease-in-out infinite' },
            { v: 'shine', label: '流光', target: ' .fx-badge-body', css: 'background-size:220% 100%;animation:fxShine var(--fx-dur,4s) linear infinite' },
            { v: 'swing', label: '摇摆', css: 'animation:fxSwing var(--fx-dur,3s) ease-in-out infinite;transform-origin:top center' },
            { v: 'float', label: '轻浮', css: 'animation:fxFloat var(--fx-dur,4s) ease-in-out infinite' },
            { v: 'flicker', label: '闪烁', css: 'animation:fxFlicker var(--fx-dur,3s) linear infinite' },
            { v: 'orbit', label: '环绕', css: 'animation:fxOrbit var(--fx-dur,7s) linear infinite' }
          ]
        },
        {
          k: 'ring', label: '外环', def: 'none', target: ' .fx-badge-ring',
          opts: [
            { v: 'none', label: '无', css: 'box-shadow:none;border:none' },
            { v: 'solid', label: '实环', css: 'border:1.5px solid var(--fx-c2);border-radius:inherit' },
            { v: 'dashed', label: '虚环', css: 'border:1.5px dashed var(--fx-c2);border-radius:inherit' },
            { v: 'double', label: '双环', css: 'border:2px double var(--fx-c2);border-radius:inherit' },
            { v: 'glow', label: '光环', css: 'box-shadow:0 0 8px 1px var(--fx-c2);border-radius:inherit' },
            { v: 'gradient', label: '渐变环', css: 'border:2px solid transparent;border-radius:inherit;background:linear-gradient(var(--fx-c1),var(--fx-c1)) padding-box,linear-gradient(140deg,var(--fx-c1),var(--fx-c2)) border-box' }
          ]
        },
        {
          k: 'glow', label: '外发光', def: '1', target: '',
          opts: [
            { v: '0', label: '无', css: 'filter:none' },
            { v: '1', label: '弱', css: 'filter:drop-shadow(0 0 2px var(--fx-c2))' },
            { v: '2', label: '中', css: 'filter:drop-shadow(0 0 5px var(--fx-c2))' },
            { v: '3', label: '强', css: 'filter:drop-shadow(0 0 7px var(--fx-c2)) drop-shadow(0 0 14px var(--fx-c1))' }
          ]
        },
        {
          k: 'spk', label: '闪光点', def: 'none', target: ' .fx-badge-spk',
          opts: [
            { v: 'none', label: '无', css: 'background-image:none' },
            { v: 'sparkle', label: '星芒', css: 'background-image:radial-gradient(circle at 78% 20%,var(--fx-c2) 0 1.4px,transparent 2px);animation:fxSparkle var(--fx-dur,3s) ease-in-out infinite' },
            { v: 'star', label: '星点', css: 'background-image:radial-gradient(circle at 22% 24%,var(--fx-c2) 0 1.1px,transparent 1.7px),radial-gradient(circle at 76% 78%,var(--fx-c2) 0 1px,transparent 1.6px);animation:fxSparkle var(--fx-dur,2.6s) ease-in-out infinite' },
            { v: 'dust', label: '星尘', css: 'background-image:radial-gradient(var(--fx-c2) .7px,transparent 1px);background-size:6px 6px;animation:fxTwinkle var(--fx-dur,3.4s) ease-in-out infinite' },
            { v: 'bolt', label: '电弧', css: 'background-image:linear-gradient(120deg,transparent 44%,var(--fx-c2) 50%,transparent 56%);animation:fxFlicker var(--fx-dur,2.4s) linear infinite' },
            { v: 'bubble', label: '光泡', css: 'background-image:radial-gradient(circle at 30% 30%,rgba(255,255,255,.8),transparent 45%);animation:fxFloat var(--fx-dur,3.6s) ease-in-out infinite' },
            { v: 'comet', label: '彗星', css: 'background-image:linear-gradient(120deg,transparent 35%,var(--fx-c2) 50%,transparent 65%);background-size:260% 100%;animation:fxShine var(--fx-dur,3s) linear infinite' },
            { v: 'cross', label: '十字星', css: 'background-image:radial-gradient(circle at 50% 50%,var(--fx-c2) 0 1px,transparent 2px),linear-gradient(90deg,transparent 46%,var(--fx-c2) 50%,transparent 54%),linear-gradient(0deg,transparent 46%,var(--fx-c2) 50%,transparent 54%);animation:fxSparkle var(--fx-dur,2.4s) ease-in-out infinite' },
            { v: 'halo', label: '环形闪光', css: 'background-image:radial-gradient(circle at 50% 50%,transparent 48%,var(--fx-c2) 49% 51%,transparent 53%);animation:fxRipple var(--fx-dur,4s) ease-out infinite' },
            { v: 'flare', label: '镜头耀斑', css: 'background-image:radial-gradient(circle at 50% 50%,var(--fx-c2) 0 2px,transparent 3px),linear-gradient(90deg,transparent 44%,var(--fx-c2) 50%,transparent 56%),linear-gradient(0deg,transparent 44%,var(--fx-c2) 50%,transparent 56%);animation:fxGlowPulse var(--fx-dur,2.8s) ease-in-out infinite' }
          ]
        },
        {
          k: 'bgf', label: '底纹', def: 'gradient', target: ' .fx-badge-body',
          opts: [
            { v: 'solid', label: '纯色', css: 'background-image:none;background-color:var(--fx-c1)' },
            { v: 'gradient', label: '渐变', css: 'background-image:linear-gradient(140deg,var(--fx-c1),var(--fx-c2))' },
            { v: 'glass', label: '玻璃', css: 'background-image:linear-gradient(140deg,color-mix(in srgb,var(--fx-c1) 55%,transparent),color-mix(in srgb,var(--fx-c2) 45%,transparent));backdrop-filter:blur(6px)' },
            { v: 'metallic', label: '金属', css: 'background-image:linear-gradient(180deg,#fff,var(--fx-c1) 42%,#fff 52%,var(--fx-c2))' },
            { v: 'aurora', label: '极光', css: 'background-image:radial-gradient(at 20% 25%,var(--fx-c2) 0,transparent 55%),radial-gradient(at 80% 75%,var(--fx-c1) 0,transparent 55%);background-size:180% 180%;animation:fxAurora var(--fx-dur,9s) ease-in-out infinite' },
            { v: 'mesh', label: '网格', css: 'background-image:linear-gradient(var(--fx-c2) 1px,transparent 1px),linear-gradient(90deg,var(--fx-c2) 1px,transparent 1px),linear-gradient(140deg,var(--fx-c1),var(--fx-c1));background-size:5px 5px,5px 5px,100% 100%' }
          ]
        },
        {
          k: 'spd', label: '速度', def: '3', target: '',
          opts: [
            { v: '1', label: '很慢', vars: { '--fx-dur': '14s' } },
            { v: '2', label: '慢', vars: { '--fx-dur': '9s' } },
            { v: '3', label: '标准', vars: { '--fx-dur': '5s' } },
            { v: '4', label: '快', vars: { '--fx-dur': '3s' } },
            { v: '5', label: '很快', vars: { '--fx-dur': '1.8s' } }
          ]
        }
      ]
    }
  };

  /* 徽章图标槽位：由 icons 数组自动展开（40 个内置图标） */
  (function expandBadgeIcons() {
    var slot = null;
    SPEC.badge.slots.forEach(function (s) { if (s.iconSlot) slot = s; });
    if (!slot) return;
    slot.opts = SPEC.badge.icons.map(function (em) {
      return { v: em, label: em, ico: em };
    });
  })();

  var KIND_LIST = ['background', 'title', 'nickname_style', 'badge'];

  /* ========================================================================
     二、CSS 生成（保证「能选到的」= 「能渲染的」）
     ======================================================================== */
  var cssBuilt = false;
  function optClass(kind, slot, val) {
    return NS + '-' + slot.k + '-' + slug(val);
  }
  function slug(v) {
    return String(v).replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, function (c) {
      return '_u' + c.codePointAt(0).toString(16);
    });
  }
  /* 槽位输出顺序：默认沿用 SPEC 顺序；spec.cssOrder 可指定「后者覆盖前者」的优先级。
     徽章用它让「用户选的动效」压过「底纹自带的动效」（如 极光底纹 vs 流光动效）。 */
  function orderedSlots(spec) {
    var order = spec.cssOrder;
    if (!order || !order.length) return spec.slots;
    var rank = function (k) { var i = order.indexOf(k); return i < 0 ? order.length : i; };
    return spec.slots.slice().sort(function (a, b) { return rank(a.k) - rank(b.k); });
  }
  function buildCss() {
    var out = [KEYFRAMES];
    KIND_LIST.forEach(function (kind) {
      var spec = SPEC[kind];
      var base = spec.base;
      orderedSlots(spec).forEach(function (slot) {
        if (slot.iconSlot) return;
        slot.opts.forEach(function (opt) {
          if (!opt.css && !opt.css2) return;
          var head = '.' + base + '.' + optClass(kind, slot, opt.v);
          if (opt.css) out.push(head + (opt.target != null ? opt.target : (slot.target || '')) + '{' + opt.css + '}');
          // css2：同一选项需要作用到「另一个子层」时使用（徽章外形：圆角给外层、clip-path 给内层）
          if (opt.css2) out.push(head + (opt.target2 || slot.target2 || slot.target || '') + '{' + opt.css2 + '}');
        });
      });
    });
    return out.join('');
  }
  function ensureStyle() {
    if (cssBuilt && document.getElementById(STYLE_ID)) return;
    var el = document.getElementById(STYLE_ID);
    if (!el) {
      el = document.createElement('style');
      el.id = STYLE_ID;
      (document.head || document.documentElement).appendChild(el);
    }
    el.textContent = buildCss();
    cssBuilt = true;
  }

  /* ========================================================================
     三、配置规整 / 计算
     ======================================================================== */
  function spec(kind) { return SPEC[kind] || SPEC.background; }

  function blank(kind) {
    var s = spec(kind);
    var cfg = { v: 2, kind: kind, opts: {} };
    (s.colors || []).forEach(function (c) { cfg[c.k] = c.def; });
    s.slots.forEach(function (slot) { cfg.opts[slot.k] = slot.def; });
    if (s.text) cfg.text = s.text.def;
    return cfg;
  }

  function normalize(kind, cfg) {
    var s = spec(kind);
    var out = blank(kind);
    if (!cfg || typeof cfg !== 'object') return out;
    (s.colors || []).forEach(function (c) {
      var v = cfg[c.k];
      if (typeof v === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(v.trim())) out[c.k] = v.trim().toLowerCase();
    });
    if (s.text && typeof cfg.text === 'string') out.text = cfg.text.slice(0, s.text.max || 12);
    var opts = (cfg.opts && typeof cfg.opts === 'object') ? cfg.opts : cfg;
    s.slots.forEach(function (slot) {
      var v = opts[slot.k];
      var ok = slot.opts.some(function (o) { return String(o.v) === String(v); });
      out.opts[slot.k] = ok ? v : slot.def;
    });
    return out;
  }

  /* 组合数：isText 为 true 时只统计「文字特效」槽位，否则只统计背景本体槽位。
     文字特效单独计数，便于后台分别校验达标线（背景 ≥ 999999，文字 ≥ 99999）。 */
  function comboCount(kind, isText) {
    var s = spec(kind);
    return s.slots.reduce(function (n, slot) {
      if (!!slot.text !== !!isText) return n;
      return n * Math.max(1, slot.opts.length);
    }, 1);
  }
  function combos(kind) { return comboCount(kind, false); }
  function textCombos(kind) { return comboCount(kind, true); }
  function total() {
    return KIND_LIST.reduce(function (n, k) { return n * combos(k) * textCombos(k); }, 1);
  }
  function hasText(kind) {
    var s = spec(kind);
    return s.slots.some(function (slot) { return !!slot.text; });
  }

  function classes(kind, cfg) {
    var s = spec(kind);
    var c = normalize(kind, cfg);
    var list = [s.base];
    s.slots.forEach(function (slot) {
      if (slot.iconSlot) return;
      list.push(optClass(kind, slot, c.opts[slot.k]));
    });
    return list;
  }

  function styleAttr(kind, cfg) {
    var s = spec(kind);
    var c = normalize(kind, cfg);
    var out = [];
    (s.colors || []).forEach(function (col) { out.push('--' + NS + '-' + col.k + ':' + c[col.k]); });
    s.slots.forEach(function (slot) {
      var v = c.opts[slot.k];
      var hit = slot.opts.filter(function (o) { return String(o.v) === String(v); })[0];
      if (hit && hit.vars) Object.keys(hit.vars).forEach(function (k) { out.push(k + ':' + hit.vars[k]); });
    });
    return out.join(';');
  }

  function summary(kind, cfg) {
    var s = spec(kind);
    var c = normalize(kind, cfg);
    var parts = [];
    if (s.text && c.text) parts.push('“' + c.text + '”');
    s.slots.forEach(function (slot) {
      var hit = slot.opts.filter(function (o) { return String(o.v) === String(c.opts[slot.k]); })[0];
      if (hit) parts.push(hit.label);
    });
    parts.push(c.c1 + (c.c2 && c.c2 !== c.c1 ? ' / ' + c.c2 : ''));
    return parts.join(' · ');
  }

  /* ========================================================================
     四、渲染
     ======================================================================== */
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* 图层顺序（DOM 顺序即绘制顺序，同 z-index 下后者在上）：
     pat 底纹 → ovl 叠加纹理 → anim 动效 → mo 进阶动效 → cor 角饰 → halo 光环 → vig 暗角
     融合层（prestige-fx.js）新增的槽位把声明写到 .fx-l-ovl / .fx-l-mo / .fx-l-cor /
     .fx-l-halo 上，这里必须保证这些载体存在，否则后台能选、页面却渲染不出来。 */
  function bgLayers() {
  return '<span class="fx-l fx-l-pat"></span><span class="fx-l fx-l-ovl"></span>'
    + '<span class="fx-l fx-l-anim"></span><span class="fx-l fx-l-mo"></span>'
    + '<span class="fx-l fx-l-cor"><i></i><i></i><i></i><i></i></span>'
    + '<span class="fx-l fx-l-halo"></span>'
    + '<span class="fx-l fx-l-vig"></span>';
}

  function syncCornerItems(el, cfg) {
    var cor = optClass('background', SPEC.background.slots.filter(function (slot) { return slot.k === 'cor'; })[0], cfg.opts.cor);
    var items = el.querySelectorAll(':scope > .fx-l-cor > i');
    Array.prototype.forEach.call(items, function (item) {
      item.className = cor;
    });
  }

  function applyBg(el, cfg) {
    if (!el) return;
    ensureStyle();
    var c = normalize('background', cfg);
    classes('background', c).forEach(function (k) { el.classList.add(k); });
    el.setAttribute('style', (el.getAttribute('style') || '') + ';' + styleAttr('background', c));
    if (!el.querySelector(':scope > .fx-l-pat')) {
      var tmp = document.createElement('span');
      tmp.innerHTML = bgLayers();
      var ref = el.firstChild;
      while (tmp.firstChild) el.insertBefore(tmp.firstChild, ref);
    }
    syncCornerItems(el, c);
  }

  function titleHtml(cfg) {
    ensureStyle();
    var c = normalize('title', cfg);
    var txt = c.text || '称号';
    return '<span class="' + classes('title', c).join(' ') + '" style="' + esc(styleAttr('title', c)) + '">' + esc(txt) + '</span>';
  }

  function badgeHtml(cfg, size) {
    ensureStyle();
    var nm = (cfg && cfg.name) || '';
    var c = normalize('badge', cfg);
    var cls = classes('badge', c).join(' ') + (size === 'lg' ? ' fx-badge-lg' : '');
    var ico = esc(c.opts.ico || '🏅');
    /* 分层：外层承载 外发光 / 动效 / 外环 / 闪光点；内层 .fx-badge-body 承载 外形裁切 与 底纹。
       这样外形 clip-path 不会再把自己元素上的外发光裁掉，底纹自带的动效也不会顶掉用户选的动效。 */
    return '<span class="' + cls + '" style="' + esc(styleAttr('badge', c)) + '" title="' + esc(nm) + '">'
      + '<span class="fx-badge-body"><span class="fx-badge-ico">' + ico + '</span></span>'
      + '<span class="fx-badge-ring"></span><span class="fx-badge-spk"></span>'
      + '</span>';
  }

  /* ========================================================================
     五、后台可视化配置器
     ======================================================================== */
  var SWATCHES = [
    '#e07a5f', '#f59e0b', '#fbbf24', '#facc15', '#4ec98a', '#22c55e', '#10b981', '#22d3ee',
    '#38bdf8', '#3b82f6', '#6366f1', '#7c3aed', '#a78bfa', '#d946ef', '#ec4899', '#f43f5e',
    '#e11d48', '#ef4444', '#94a3b8', '#64748b', '#334155', '#0f172a', '#ffffff', '#f8fafc'
  ];

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function previewHtml(kind, cfg) {
    var c = normalize(kind, cfg);
    if (kind === 'background') {
      return '<div class="fx-prev-card ' + classes('background', c).join(' ') + '" style="' + esc(styleAttr('background', c)) + '">'
        + bgLayers()
        + '<div style="position:relative;z-index:1"><b>昵称</b> <span class="author-level">Lv.36</span>'
        + '<div class="post-content">帖子正文示例：这是背景与文字特效在帖子卡片上的实际效果预览。</div></div></div>';
    }
    if (kind === 'title') return titleHtml(c);
    if (kind === 'nickname_style') {
      return '<span style="font-size:14px"><span class="' + classes('nickname_style', c).join(' ') + '" style="' + esc(styleAttr('nickname_style', c)) + '"><span class="nick-txt">同学昵称</span></span></span>';
    }
    return badgeHtml(c, 'lg');
  }

  function mountConfigurator(host, kind, cfg, onChange) {
    ensureStyle();
    var s = spec(kind);
    var state = normalize(kind, cfg);
    host.innerHTML = '';
    host.className = 'fxcfg';

    var left = el('div');
    var grid = el('div', 'fxcfg-grid');
    left.appendChild(grid);

    function emit() { if (typeof onChange === 'function') onChange(normalize(kind, state)); }

    /* 称号文字 */
    if (s.text) {
      var tf = el('label', 'fxcfg-field', '<span>' + s.text.label + '（最多 ' + s.text.max + ' 字）</span>');
      var ti = document.createElement('input');
      ti.type = 'text'; ti.maxLength = s.text.max; ti.value = state.text || '';
      ti.addEventListener('input', function () { state.text = ti.value.slice(0, s.text.max); refresh(); emit(); });
      tf.appendChild(ti); grid.appendChild(tf);
    }

    /* 徽章图标选择 */
    var iconSlot = s.slots.filter(function (x) { return x.iconSlot; })[0];
    if (iconSlot) {
      var iw = el('label', 'fxcfg-field', '<span>' + iconSlot.label + '（' + iconSlot.opts.length + ' 个内置图标）</span>');
      var sel0 = document.createElement('select');
      iconSlot.opts.forEach(function (o) {
        var op = document.createElement('option'); op.value = o.v; op.textContent = o.label;
        if (String(state.opts[iconSlot.k]) === String(o.v)) op.selected = true;
        sel0.appendChild(op);
      });
      sel0.addEventListener('change', function () { state.opts[iconSlot.k] = sel0.value; refresh(); emit(); });
      iw.appendChild(sel0); grid.appendChild(iw);
    }

    /* 各槽位下拉：背景本体与「文字特效」分组展示 */
    function addSlotField(slot) {
      var f = el('label', 'fxcfg-field', '<span>' + slot.label + '（' + slot.opts.length + ' 选）</span>');
      var sel = document.createElement('select');
      slot.opts.forEach(function (o) {
        var op = document.createElement('option'); op.value = o.v; op.textContent = o.label;
        if (String(state.opts[slot.k]) === String(o.v)) op.selected = true;
        sel.appendChild(op);
      });
      sel.addEventListener('change', function () { state.opts[slot.k] = sel.value; refresh(); emit(); });
      f.appendChild(sel); grid.appendChild(f);
    }
    s.slots.forEach(function (slot) { if (!slot.iconSlot && !slot.text) addSlotField(slot); });
    if (hasText(kind)) {
      grid.appendChild(el('div', 'fxcfg-group',
        '🎨 文字特效（作用于帖子正文）· ' + textCombos(kind).toLocaleString('en-US') + ' 种组合'));
      s.slots.forEach(function (slot) { if (!slot.iconSlot && slot.text) addSlotField(slot); });
    }

    /* 取色器 */
    function addColorField(col) {
      var f = el('label', 'fxcfg-field', '<span>' + col.label + '（取色器）</span>');
      var wrap = el('div', 'fxcfg-color');
      var pick = document.createElement('input');
      pick.type = 'color'; pick.value = state[col.k];
      var hex = document.createElement('input');
      hex.type = 'text'; hex.value = state[col.k]; hex.maxLength = 9;
      pick.addEventListener('input', function () { state[col.k] = pick.value; hex.value = pick.value; refresh(); emit(); });
      hex.addEventListener('change', function () {
        var v = hex.value.trim();
        if (/^#[0-9a-fA-F]{3,8}$/.test(v)) { state[col.k] = v.toLowerCase(); pick.value = state[col.k]; refresh(); emit(); }
        else hex.value = state[col.k];
      });
      wrap.appendChild(pick); wrap.appendChild(hex); f.appendChild(wrap);
      var sw = el('div', 'fxcfg-swatches');
      SWATCHES.forEach(function (color) {
        var b = el('button', 'fxcfg-sw');
        b.type = 'button'; b.style.background = color; b.title = color;
        b.addEventListener('click', function () { state[col.k] = color; pick.value = color; hex.value = color; refresh(); emit(); });
        sw.appendChild(b);
      });
      f.appendChild(sw);
      grid.appendChild(f);
    }
    var allColors = s.colors || [];
    allColors.filter(function (c) { return c.k.indexOf('tc') !== 0; }).forEach(addColorField);
    var textColors = allColors.filter(function (c) { return c.k.indexOf('tc') === 0; });
    if (textColors.length) {
      grid.appendChild(el('div', 'fxcfg-group', '🖌 文字颜色'));
      textColors.forEach(addColorField);
    }

    /* 预览面板 */
    var right = el('div', 'fxcfg-preview');
    var stage = el('div', 'fx-prev-stage');
    var combo = el('div', 'fxcfg-combos');
    var sum = el('div', 'fxcfg-summary');
    var hint = el('div', 'fxcfg-hint', s.hint || '');
    right.appendChild(stage); right.appendChild(combo); right.appendChild(sum); right.appendChild(hint);

    host.appendChild(left); host.appendChild(right);

    function refresh() {
      var c = normalize(kind, state);
      stage.innerHTML = previewHtml(kind, c);
      var n = combos(kind);
      var html = '背景特效组合数（不含颜色）：<br><b>' + n.toLocaleString('en-US') + '</b> 种'
        + (n >= 999999 ? ' ✅ 已达标' : ' ⚠️ 未达 999999');
      if (hasText(kind)) {
        var tn = textCombos(kind);
        html += '<br>文字特效组合数（不含颜色）：<br><b>' + tn.toLocaleString('en-US') + '</b> 种'
          + (tn >= 99999 ? ' ✅ 已达标' : ' ⚠️ 未达 99999');
      }
      combo.innerHTML = html;
      sum.textContent = summary(kind, c);
    }
    refresh();

    return {
      get: function () { return normalize(kind, state); },
      set: function (next) { state = normalize(kind, next); mountConfigurator(host, kind, state, onChange); }
    };
  }

  /* ========================================================================
     六、导出
     ======================================================================== */
  var API = {
    SPEC: SPEC,
    kinds: function () { return KIND_LIST.slice(); },
    spec: spec,
    blank: blank,
    normalize: normalize,
    combos: combos,
    textCombos: textCombos,
    hasText: hasText,
    total: total,
    classes: classes,
    styleAttr: styleAttr,
    summary: summary,
    ensureStyle: ensureStyle,
    /* 外部（prestige-fx.js）合并进 SPEC 后调用，强制重建整张样式表 */
    rebuild: function () { cssBuilt = false; ensureStyle(); },
    bgLayers: bgLayers,
    applyBg: applyBg,
    titleHtml: titleHtml,
    badgeHtml: badgeHtml,
    previewHtml: previewHtml,
    mountConfigurator: mountConfigurator
  };
  window.XddFx = API;
  ensureStyle();
})();
