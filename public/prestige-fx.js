/* ============================================================================
 * 说明：本文件由构建脚本生成，配方已合并去重，请勿手工编辑单个条目。
 * XDD吧 · 尊贵身份组件融合层（prestige-fx.js）
 * ----------------------------------------------------------------------------
 * 来源：工程师交付的「论坛尊贵身份组件系统解析.js / .css」。
 * 本文件把它 13 个维度（底纹/边框/辉光/角饰/动效/勋章/字体/铭牌/叠加层/光环/
 * 铭文/稀有度/调色板）共 900+ 个组件，全部并入本站既有效果引擎（XddFx.SPEC），
 * 使「后台能选到的」=「页面能渲染的」保持一致，不引入第二套身份系统。
 *
 * 对参考 CSS 做的必要修正（原文件规格非本站规格，且存在已知 bug）：
 *   1. 变量映射：--main/--main-comp/--glow/--pq* → 本站 --fx-c1/--fx-c2
 *   2. 无效语法修复：`var(--main) .16` 这类「颜色+透明度简写」不是合法 CSS，
 *      统一改写为 color-mix(in srgb, ... N%, transparent)
 *   3. 主题适配：原文件按深色卡片用 rgba(255,255,255,α) 画纹理线，浅色主题下
 *      不可见；统一改为辅色 --fx-c2 的等价透明度
 *   4. 尺寸适配：图案 background-size 收敛到 3–38px，避免小卡片上过于稀疏
 *   5. 空实现补齐：角饰/动效/光环/勋章/铭文/稀有度在参考 CSS 里只写了变量、
 *      没有实际声明（生成器缺陷），此处按字典名称语义重新实现
 *   6. 不引入全局选择器（原文件含 * / body 全局规则与固定 px 布局），
 *      全部规则限定在本站 .fx-* 命名空间与图层内
 *
 * 依赖：必须在 effects.js 之后加载。
 * ========================================================================== */
(function () {
  'use strict';
  if (!window.XddFx || !window.XddFx.SPEC) return;

  var CSS = {
 "tx": {
  "grain": "background-image: repeating-radial-gradient(circle at 25% 25%, color-mix(in srgb,var(--fx-c2) 12%,transparent) .5px, transparent 1.2px); background-size:5px 5px;",
  "micrograin": "background-image: repeating-radial-gradient(circle, color-mix(in srgb,var(--fx-c2) 10%,transparent) .4px, transparent 1px); background-size:3px 3px;",
  "film": "background-image: repeating-radial-gradient(circle at 13% 17%, color-mix(in srgb,var(--fx-c2) 15%,transparent) 1px, transparent 2px); background-size:7px 9px;",
  "dots": "background-image: radial-gradient(color-mix(in srgb,var(--fx-c2) 16%,transparent) 1px, transparent 1.4px); background-size:22px 22px;",
  "dotsdense": "background-image: radial-gradient(color-mix(in srgb,var(--fx-c2) 14%,transparent) 1px, transparent 1.3px); background-size:12px 12px;",
  "dotscross": "background-image: radial-gradient(color-mix(in srgb,var(--fx-c2) 15%,transparent) 1.4px, transparent 2px), radial-gradient(color-mix(in srgb,var(--fx-c2) 10%,transparent) 1px, transparent 1.5px); background-size:20px 20px, 20px 20px; background-position: 0 0, 10px 10px;",
  "dotssparse": "background-image: radial-gradient(1.5px 1.5px at 30% 40%, color-mix(in srgb,var(--fx-c2) 25%,transparent), transparent 60%), radial-gradient(1px 1px at 70% 70%, color-mix(in srgb,var(--fx-c2) 18%,transparent), transparent 60%); background-size:38px 38px;",
  "dotsfade": "background-image: radial-gradient(color-mix(in srgb,var(--fx-c2) 18%,transparent) 1.2px, transparent 1.6px); background-size:18px 18px; -webkit-mask-image: radial-gradient(circle, #000 30%, transparent 75%); mask-image: radial-gradient(circle, #000 30%, transparent 75%);",
  "halftone": "background-image: radial-gradient(color-mix(in srgb,var(--fx-c2) 20%,transparent) 2.4px, transparent 3.2px), radial-gradient(color-mix(in srgb,var(--fx-c2) 14%,transparent) 1.4px, transparent 2px), radial-gradient(color-mix(in srgb,var(--fx-c2) 10%,transparent) .8px, transparent 1.2px); background-size:30px 30px, 30px 30px, 30px 30px; background-position: 0 0, 0 10px, 0 20px;",
  "grid": "background-image: linear-gradient(color-mix(in srgb,var(--fx-c2) 7%,transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb,var(--fx-c2) 7%,transparent) 1px, transparent 1px); background-size:38px 38px;",
  "gridbold": "background-image: linear-gradient(color-mix(in srgb,var(--fx-c2) 10%,transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb,var(--fx-c2) 10%,transparent) 1px, transparent 1px); background-size:22px 22px;",
  "gridfade": "background-image: linear-gradient(color-mix(in srgb,var(--fx-c2) 8%,transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb,var(--fx-c2) 8%,transparent) 1px, transparent 1px); background-size:34px 34px; -webkit-mask-image: radial-gradient(circle, #000 40%, transparent 80%); mask-image: radial-gradient(circle, #000 40%, transparent 80%);",
  "graph": "background-image: linear-gradient(color-mix(in srgb,var(--fx-c2) 5%,transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb,var(--fx-c2) 5%,transparent) 1px, transparent 1px), linear-gradient(color-mix(in srgb,var(--fx-c2) 9%,transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb,var(--fx-c2) 9%,transparent) 1px, transparent 1px); background-size:16px 16px, 16px 16px, 80px 80px, 80px 80px;",
  "plus": "background-image: linear-gradient(color-mix(in srgb,var(--fx-c2) 12%,transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb,var(--fx-c2) 12%,transparent) 1px, transparent 1px); background-size:30px 30px; background-position: 15px 15px, 15px 15px;",
  "isometric": "background-image: linear-gradient(30deg, color-mix(in srgb,var(--fx-c2) 8%,transparent) 1px, transparent 1px), linear-gradient(150deg, color-mix(in srgb,var(--fx-c2) 8%,transparent) 1px, transparent 1px); background-size:30px 38px;",
  "horizon": "background-image: linear-gradient(color-mix(in srgb,var(--fx-c2) 10%,transparent) 1px, transparent 1px); background-size: 100% 40px; transform: perspective(400px) rotateX(55deg);",
  "linesh": "background-image: repeating-linear-gradient(0deg, transparent, transparent 15px, color-mix(in srgb,var(--fx-c2) 8%,transparent) 15px, color-mix(in srgb,var(--fx-c2) 8%,transparent) 16px);",
  "linesv": "background-image: repeating-linear-gradient(90deg, transparent, transparent 15px, color-mix(in srgb,var(--fx-c2) 8%,transparent) 15px, color-mix(in srgb,var(--fx-c2) 8%,transparent) 16px);",
  "pinstripe": "background-image: repeating-linear-gradient(90deg, transparent, transparent 5px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 5px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 6px);",
  "ruled": "background-image: repeating-linear-gradient(0deg, transparent, transparent 31px, rgba(255,120,120,.30) 31px, rgba(255,120,120,.30) 32px);",
  "diag": "background-image: repeating-linear-gradient(135deg, transparent, transparent 14px, color-mix(in srgb,var(--fx-c2) 9%,transparent) 14px, color-mix(in srgb,var(--fx-c2) 9%,transparent) 15px);",
  "diagbold": "background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 10px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 12px);",
  "crosshatch": "background-image: repeating-linear-gradient(45deg, transparent, transparent 8px, color-mix(in srgb,var(--fx-c2) 9%,transparent) 8px, color-mix(in srgb,var(--fx-c2) 9%,transparent) 9px), repeating-linear-gradient(135deg, transparent, transparent 8px, color-mix(in srgb,var(--fx-c2) 9%,transparent) 8px, color-mix(in srgb,var(--fx-c2) 9%,transparent) 9px);",
  "zigzag": "background-image: repeating-linear-gradient(135deg, transparent, transparent 8px, color-mix(in srgb,var(--fx-c2) 12%,transparent) 8px, color-mix(in srgb,var(--fx-c2) 12%,transparent) 10px); background-size:20px 20px;",
  "chevron": "background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 10px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 12px), repeating-linear-gradient(-45deg, transparent, transparent 10px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 10px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 12px);",
  "wave": "background-image: repeating-radial-gradient(circle at 50% 100%, transparent 0, transparent 12px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 12px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 13px); background-size:38px 20px;",
  "sine": "background-image: repeating-linear-gradient(0deg, transparent, transparent 6px, color-mix(in srgb,var(--fx-c2) 8%,transparent) 6px, color-mix(in srgb,var(--fx-c2) 8%,transparent) 7px); background-size: 100% 24px;",
  "squiggle": "background-image: radial-gradient(circle at 10px 0, transparent 0 6px, color-mix(in srgb,var(--fx-c2) 12%,transparent) 6px 7px, transparent 8px) repeat-x; background-size:20px 14px;",
  "hex": "background-image: radial-gradient(circle at 10px 17px, color-mix(in srgb,var(--fx-c2) 14%,transparent) 1.5px, transparent 2.4px); background-size:20px 34px;",
  "hexfine": "background-image: radial-gradient(circle at 8px 14px, color-mix(in srgb,var(--fx-c2) 12%,transparent) 1px, transparent 1.8px); background-size:16px 28px;",
  "honeycomb": "background-image: radial-gradient(circle at 12px 20px, color-mix(in srgb,var(--fx-c2) 18%,transparent) 2px, transparent 3px), radial-gradient(circle at 0 0, color-mix(in srgb,var(--fx-c2) 18%,transparent) 2px, transparent 3px); background-size:24px 38px;",
  "triangle": "background-image: linear-gradient(60deg, color-mix(in srgb,var(--fx-c2) 8%,transparent) 25%, transparent 25%), linear-gradient(120deg, color-mix(in srgb,var(--fx-c2) 8%,transparent) 25%, transparent 25%); background-size:30px 38px;",
  "triangledark": "background-image: linear-gradient(60deg, color-mix(in srgb,var(--fx-c2) 12%,transparent) 50%, transparent 50%), linear-gradient(120deg, color-mix(in srgb,var(--fx-c2) 12%,transparent) 50%, transparent 50%); background-size:26px 38px;",
  "diamond": "background-image: linear-gradient(45deg, color-mix(in srgb,var(--fx-c2) 9%,transparent) 25%, transparent 25%, transparent 75%, color-mix(in srgb,var(--fx-c2) 9%,transparent) 75%), linear-gradient(-45deg, color-mix(in srgb,var(--fx-c2) 9%,transparent) 25%, transparent 25%, transparent 75%, color-mix(in srgb,var(--fx-c2) 9%,transparent) 75%); background-size:26px 26px;",
  "diamondsm": "background-image: linear-gradient(45deg, color-mix(in srgb,var(--fx-c2) 10%,transparent) 25%, transparent 25%, transparent 75%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 75%), linear-gradient(-45deg, color-mix(in srgb,var(--fx-c2) 10%,transparent) 25%, transparent 25%, transparent 75%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 75%); background-size:14px 14px;",
  "checker": "background-image: linear-gradient(45deg, color-mix(in srgb,var(--fx-c2) 10%,transparent) 25%, transparent 25%, transparent 75%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 75%), linear-gradient(-45deg, color-mix(in srgb,var(--fx-c2) 10%,transparent) 25%, transparent 25%, transparent 75%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 75%); background-size:20px 20px;",
  "checkersm": "background-image: linear-gradient(45deg, color-mix(in srgb,var(--fx-c2) 10%,transparent) 25%, transparent 25%, transparent 75%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 75%), linear-gradient(-45deg, color-mix(in srgb,var(--fx-c2) 10%,transparent) 25%, transparent 25%, transparent 75%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 75%); background-size:10px 10px;",
  "plaid": "background-image: repeating-linear-gradient(45deg, transparent, transparent 14px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 14px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 16px), repeating-linear-gradient(-45deg, transparent, transparent 14px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 14px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 16px);",
  "herringbone": "background-image: repeating-linear-gradient(45deg, transparent, transparent 12px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 12px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 14px), repeating-linear-gradient(-45deg, transparent, transparent 12px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 12px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 14px); background-size:34px 34px;",
  "argyle": "background-image: repeating-linear-gradient(45deg, transparent, transparent 20px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 20px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 22px), repeating-linear-gradient(-45deg, transparent, transparent 20px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 20px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 22px);",
  "contour": "background-image: repeating-radial-gradient(circle at 30% 40%, transparent 0, transparent 14px, color-mix(in srgb,var(--fx-c2) 12%,transparent) 14px, color-mix(in srgb,var(--fx-c2) 12%,transparent) 15px);",
  "topo": "background-image: repeating-radial-gradient(circle at 35% 45%, transparent 0, transparent 18px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 18px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 19px);",
  "ripples": "background-image: repeating-radial-gradient(circle at 50% 120%, transparent 0, transparent 30px, color-mix(in srgb,var(--fx-c2) 12%,transparent) 30px, color-mix(in srgb,var(--fx-c2) 12%,transparent) 31px);",
  "bubbles": "background-image: radial-gradient(circle at 20% 30%, color-mix(in srgb,var(--fx-c2) 14%,transparent) 6px, transparent 8px), radial-gradient(circle at 70% 60%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 10px, transparent 12px), radial-gradient(circle at 40% 80%, color-mix(in srgb,var(--fx-c2) 8%,transparent) 14px, transparent 16px); background-size:38px 38px;",
  "circles": "background-image: repeating-radial-gradient(circle at 50% 50%, transparent 0, transparent 20px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 20px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 21px);",
  "concentric": "background-image: repeating-radial-gradient(circle at 50% 50%, transparent 0, transparent 10px, color-mix(in srgb,var(--fx-c2) 9%,transparent) 10px, color-mix(in srgb,var(--fx-c2) 9%,transparent) 11px), repeating-radial-gradient(circle at 50% 50%, transparent 0, transparent 24px, color-mix(in srgb,var(--fx-c2) 12%,transparent) 24px, color-mix(in srgb,var(--fx-c2) 12%,transparent) 25px);",
  "starfield": "background-image: radial-gradient(1px 1px at 20% 30%, #fff, transparent), radial-gradient(1px 1px at 70% 60%, #fff, transparent), radial-gradient(1.5px 1.5px at 40% 80%, #fff, transparent); background-size:38px 38px;",
  "stardense": "background-image: radial-gradient(1px 1px at 10% 20%, #fff, transparent), radial-gradient(1.5px 1.5px at 30% 50%, #fff, transparent), radial-gradient(1px 1px at 60% 30%, #fff, transparent), radial-gradient(1.2px 1.2px at 80% 70%, #fff, transparent), radial-gradient(1px 1px at 50% 85%, #fff, transparent); background-size:38px 38px;",
  "nebula": "background-image: radial-gradient(circle at 20% 30%, color-mix(in srgb,var(--fx-c1) 10%,transparent), transparent 40%), radial-gradient(circle at 80% 70%, color-mix(in srgb,var(--fx-c2) 10%,transparent), transparent 45%);",
  "matrix": "background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,150,.10) 2px, rgba(0,255,150,.10) 4px);",
  "circuit": "background-image: linear-gradient(90deg, transparent 49%, color-mix(in srgb,var(--fx-c2) 12%,transparent) 49% 51%, transparent 51%), linear-gradient(0deg, transparent 49%, color-mix(in srgb,var(--fx-c2) 12%,transparent) 49% 51%, transparent 51%); background-size:38px 38px;",
  "circuitdark": "background-image: linear-gradient(90deg, transparent 33%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 33% 66%, transparent 66%), linear-gradient(0deg, transparent 33%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 33% 66%, transparent 66%); background-size:30px 30px;",
  "tech": "background-image: radial-gradient(circle at 50% 50%, var(--fx-c1) 1.5px, transparent 2px); background-size:26px 26px;",
  "data": "background-image: linear-gradient(90deg, transparent 30%, color-mix(in srgb,var(--fx-c2) 14%,transparent) 30% 32%, transparent 32%), linear-gradient(90deg, transparent 60%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 60% 62%, transparent 62%); background-size:38px 38px;",
  "hud": "background-image: linear-gradient(color-mix(in srgb,var(--fx-c2) 7%,transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb,var(--fx-c2) 7%,transparent) 1px, transparent 1px); background-size:30px 30px;",
  "mesh": "background-image: radial-gradient(circle at 0 0, transparent 0 40%, var(--fx-c1) 40%, var(--fx-c1) 60%, transparent 60%), radial-gradient(circle at 100% 100%, transparent 0 40%, var(--fx-c2) 40%, var(--fx-c2) 60%, transparent 60%); background-size: 200% 200%;",
  "membrane": "background-image: linear-gradient(90deg, transparent 49%, color-mix(in srgb,var(--fx-c2) 8%,transparent) 49% 51%, transparent 51%); background-size: 24px 100%;",
  "carbon": "background-image: linear-gradient(60deg, #000 25%, transparent 25%), linear-gradient(120deg, #000 25%, transparent 25%); background-size:8px 14px;",
  "carbon3d": "background-image: linear-gradient(60deg, color-mix(in srgb,var(--fx-c2) 6%,transparent) 25%, transparent 25%), linear-gradient(120deg, color-mix(in srgb,var(--fx-c2) 6%,transparent) 25%, transparent 25%), linear-gradient(0deg, color-mix(in srgb,var(--fx-c2) 5%,transparent), transparent 60%); background-size:8px 14px, 8px 14px, 100% 100%;",
  "brushed": "background-image: repeating-linear-gradient(90deg, transparent 0 3px, color-mix(in srgb,var(--fx-c2) 7%,transparent) 3px 4px);",
  "brushedv": "background-image: repeating-linear-gradient(0deg, transparent 0 3px, color-mix(in srgb,var(--fx-c2) 7%,transparent) 3px 4px);",
  "silk": "background-image: linear-gradient(120deg, transparent 0%, var(--fx-c1) 50%, transparent 100%);",
  "silkwave": "background-image: linear-gradient(115deg, transparent 0%, color-mix(in srgb,var(--fx-c1) 72%,#fff) .1, transparent 50%, color-mix(in srgb,var(--fx-c1) 10%,transparent), transparent 100%);",
  "velvet": "background-image: radial-gradient(circle at 50% 0%, color-mix(in srgb,var(--fx-c1) 15%,transparent), transparent 60%);",
  "leather": "background-image: radial-gradient(circle at 25% 25%, rgba(0,0,0,.25) .5px, transparent 1.4px); background-size:6px 6px;",
  "linen": "background-image: repeating-linear-gradient(0deg, transparent 0 2px, color-mix(in srgb,var(--fx-c2) 6%,transparent) 2px 3px), repeating-linear-gradient(90deg, transparent 0 2px, color-mix(in srgb,var(--fx-c2) 6%,transparent) 2px 3px);",
  "fabric": "background-image: repeating-linear-gradient(45deg, transparent 0 3px, color-mix(in srgb,var(--fx-c2) 7%,transparent) 3px 4px), repeating-linear-gradient(-45deg, transparent 0 3px, color-mix(in srgb,var(--fx-c2) 7%,transparent) 3px 4px);",
  "paper": "background-image: radial-gradient(circle at 20% 30%, color-mix(in srgb,var(--fx-c2) 5%,transparent) .8px, transparent 1.6px); background-size:9px 9px;",
  "marble": "background-image: radial-gradient(ellipse at 30% 20%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 0 8%, transparent 20%), radial-gradient(ellipse at 70% 60%, color-mix(in srgb,var(--fx-c2) 7%,transparent) 0 12%, transparent 26%);",
  "crystal": "background-image: linear-gradient(105deg, transparent 0 30%, color-mix(in srgb,var(--fx-c2) 12%,transparent) 30% 33%, transparent 33% 66%, color-mix(in srgb,var(--fx-c2) 8%,transparent) 66% 69%, transparent 69%), linear-gradient(75deg, transparent 0 40%, color-mix(in srgb,var(--fx-c2) 7%,transparent) 40% 43%, transparent 43%);",
  "frosted": "background: color-mix(in srgb,var(--fx-c2) 5%,transparent); backdrop-filter: blur(6px);",
  "glass": "background: linear-gradient(135deg, color-mix(in srgb,var(--fx-c2) 10%,transparent), color-mix(in srgb,var(--fx-c2) 2%,transparent)); backdrop-filter: blur(10px); border: 1px solid color-mix(in srgb,var(--fx-c2) 12%,transparent);",
  "softblob": "background-image: radial-gradient(circle at 20% 20%, color-mix(in srgb,var(--fx-c1) 12%,transparent), transparent 45%), radial-gradient(circle at 80% 70%, color-mix(in srgb,var(--fx-c2) 10%,transparent), transparent 45%);",
  "radial": "background-image: radial-gradient(circle at 50% 0%, color-mix(in srgb,var(--fx-c1) 18%,transparent), transparent 65%);",
  "conespot": "background-image: conic-gradient(from 180deg at 50% 0%, transparent 0 160deg, color-mix(in srgb,var(--fx-c1) 20%,transparent), transparent 200deg);",
  "beam": "background-image: conic-gradient(from 200deg at 50% -10%, transparent 0 140deg, color-mix(in srgb,var(--fx-c1) 12%,transparent), transparent 180deg);",
  "aurora": "background-image: radial-gradient(circle at 20% 0%, color-mix(in srgb,var(--fx-c1) 12%,transparent), transparent 55%), radial-gradient(circle at 85% 10%, color-mix(in srgb,var(--fx-c2) 10%,transparent), transparent 50%), radial-gradient(circle at 50% 100%, color-mix(in srgb,var(--fx-c1) 8%,transparent), transparent 55%);",
  "deco": "background-image: repeating-linear-gradient(45deg, transparent 0 12px, rgba(255,215,150,.08) 12px 13px), repeating-linear-gradient(-45deg, transparent 0 12px, rgba(255,215,150,.08) 12px 13px);",
  "memphis": "background-image: radial-gradient(circle at 20% 30%, color-mix(in srgb,var(--fx-c1) 10%,transparent) 8px, transparent 9px), linear-gradient(45deg, transparent 0 40%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 41%, transparent 42%); background-size:38px 38px;",
  "confetti": "background-image: radial-gradient(circle at 25% 25%, var(--fx-c1) 3px, transparent 4px), radial-gradient(circle at 70% 55%, var(--fx-c2) 4px, transparent 5px), radial-gradient(circle at 45% 80%, var(--fx-c1) 2px, transparent 3px); background-size:38px 38px;",
  "hearts": "background-image: radial-gradient(circle at 30% 30%, rgba(255,120,160,.20) 0 5px, transparent 6px), radial-gradient(circle at 70% 65%, rgba(255,120,160,.14) 0 7px, transparent 8px); background-size:38px 38px;",
  "stars": "background-image: radial-gradient(2px 2px at 25% 35%, #fff, transparent), radial-gradient(1.5px 1.5px at 65% 60%, #fff, transparent), radial-gradient(2.5px 2.5px at 45% 80%, #fff, transparent); background-size:38px 38px;",
  "leaf": "background-image: radial-gradient(ellipse at 30% 40%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 0 12px, transparent 20px); background-size:38px 38px;",
  "feather": "background-image: repeating-linear-gradient(80deg, transparent 0 6px, color-mix(in srgb,var(--fx-c2) 8%,transparent) 6px 7px);",
  "scale": "background-image: radial-gradient(circle at 50% 100%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 0 50%, transparent 52%); background-size:22px 22px;",
  "brick": "background-image: linear-gradient(color-mix(in srgb,var(--fx-c2) 8%,transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb,var(--fx-c2) 8%,transparent) 1px, transparent 1px); background-size:38px 20px;",
  "arabesque": "background-image: radial-gradient(circle at 50% 50%, transparent 0 30%, rgba(255,215,150,.10) 30% 32%, transparent 34%), radial-gradient(circle at 50% 50%, transparent 0 50%, rgba(255,215,150,.08) 50% 52%, transparent 54%); background-size:38px 38px;",
  "moroccan": "background-image: linear-gradient(60deg, transparent 0 30%, rgba(255,215,150,.10) 30% 70%, transparent 70%), linear-gradient(120deg, transparent 0 30%, rgba(255,215,150,.10) 30% 70%, transparent 70%); background-size:30px 38px;"
 },
 "ov": {
  "vignette": "background-image: radial-gradient(circle, transparent 55%, rgba(0,0,0,.55) 100%);",
  "vignettesoft": "background-image: radial-gradient(circle, transparent 65%, rgba(0,0,0,.40) 100%);",
  "radial": "background-image: radial-gradient(circle at 50% 50%, color-mix(in srgb,var(--fx-c1) 16%,transparent), transparent 70%);",
  "conic": "background-image: conic-gradient(from 0deg, transparent 0 25%, color-mix(in srgb,var(--fx-c1) 8%,transparent) 50%, transparent 75%);",
  "aurora": "background-image: radial-gradient(circle at 30% 20%, color-mix(in srgb,var(--fx-c1) 14%,transparent), transparent 60%), radial-gradient(circle at 75% 80%, color-mix(in srgb,var(--fx-c2) 12%,transparent), transparent 60%);",
  "spotlight": "background-image: radial-gradient(ellipse 70% 60% at 50% 0%, color-mix(in srgb,var(--fx-c1) 18%,transparent), transparent 70%);",
  "beam": "background-image: conic-gradient(from 200deg at 50% -10%, transparent 0 150deg, color-mix(in srgb,var(--fx-c1) 12%,transparent), transparent 190deg);",
  "rays": "background-image: conic-gradient(from 0deg at 50% 100%, color-mix(in srgb,var(--fx-c1) 6%,transparent) 0 15deg, transparent 15deg 45deg, color-mix(in srgb,var(--fx-c1) 6%,transparent) 45deg 60deg, transparent 60deg 90deg, color-mix(in srgb,var(--fx-c1) 6%,transparent) 90deg 105deg, transparent 105deg 135deg, color-mix(in srgb,var(--fx-c1) 6%,transparent) 135deg 150deg, transparent 150deg 180deg, color-mix(in srgb,var(--fx-c1) 6%,transparent) 180deg 195deg, transparent 195deg 225deg, color-mix(in srgb,var(--fx-c1) 6%,transparent) 225deg 240deg, transparent 240deg 270deg, color-mix(in srgb,var(--fx-c1) 6%,transparent) 270deg 285deg, transparent 285deg 315deg, color-mix(in srgb,var(--fx-c1) 6%,transparent) 315deg 330deg, transparent 330deg 360deg);",
  "raystop": "background-image: conic-gradient(from 180deg at 50% 0%, transparent 0 155deg, color-mix(in srgb,var(--fx-c1) 16%,transparent) 180deg 205deg, transparent 230deg);",
  "raysbot": "background-image: conic-gradient(from 0deg at 50% 100%, transparent 0 155deg, color-mix(in srgb,var(--fx-c1) 16%,transparent) 180deg 205deg, transparent 230deg);",
  "halftone": "background-image: radial-gradient(color-mix(in srgb,var(--fx-c2) 18%,transparent) 2px, transparent 2.8px); background-size:14px 14px;",
  "scanline": "background-image: repeating-linear-gradient(0deg, transparent 0 3px, color-mix(in srgb,var(--fx-c2) 7%,transparent) 3px 4px);",
  "scanline2": "background-image: repeating-linear-gradient(0deg, transparent 0 2px, color-mix(in srgb,var(--fx-c2) 9%,transparent) 2px 3px);",
  "crt": "background-image: repeating-linear-gradient(0deg, transparent 0 2px, rgba(0,0,0,.16) 2px 4px);",
  "crt2": "background-image: repeating-linear-gradient(0deg, transparent 0 4px, rgba(0,0,0,.18) 4px 8px);",
  "matrix": "background-image: repeating-linear-gradient(0deg, transparent 0 3px, rgba(0,255,150,.10) 3px 5px);",
  "hologram": "background-image: repeating-linear-gradient(0deg, transparent 0 2px, color-mix(in srgb,var(--fx-c1) 8%,transparent) 2px 3px, transparent 3px 5px, color-mix(in srgb,var(--fx-c2) 8%,transparent) 5px 6px);",
  "glitch": "background-image: linear-gradient(90deg, transparent 0 48%, rgba(255,0,80,.12) 48% 50%, transparent 50% 52%, rgba(0,200,255,.12) 52% 54%, transparent 54%);",
  "glitchrgb": "background-image: linear-gradient(90deg, rgba(255,0,80,.10), rgba(0,200,255,.10));",
  "pixel": "background-image: linear-gradient(90deg, color-mix(in srgb,var(--fx-c2) 10%,transparent) 1px, transparent 1px), linear-gradient(0deg, color-mix(in srgb,var(--fx-c2) 10%,transparent) 1px, transparent 1px); background-size:6px 6px;",
  "pixelgrid": "background-image: linear-gradient(90deg, color-mix(in srgb,var(--fx-c2) 12%,transparent) 1px, transparent 1px), linear-gradient(0deg, color-mix(in srgb,var(--fx-c2) 12%,transparent) 1px, transparent 1px); background-size:10px 10px;",
  "stripe": "background-image: repeating-linear-gradient(90deg, transparent 0 4px, color-mix(in srgb,var(--fx-c2) 8%,transparent) 4px 5px);",
  "stripes": "background-image: repeating-linear-gradient(90deg, transparent 0 10px, color-mix(in srgb,var(--fx-c2) 8%,transparent) 10px 12px);",
  "stripebold": "background-image: repeating-linear-gradient(90deg, transparent 0 12px, color-mix(in srgb,var(--fx-c2) 12%,transparent) 12px 16px);",
  "rain": "background-image: repeating-linear-gradient(100deg, transparent 0 14px, color-mix(in srgb,var(--fx-c2) 8%,transparent) 14px 15px);",
  "rain2": "background-image: repeating-linear-gradient(80deg, transparent 0 18px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 18px 19px);",
  "snow": "background-image: radial-gradient(1.5px 1.5px at 25% 30%, #fff, transparent), radial-gradient(1px 1px at 55% 65%, #fff, transparent), radial-gradient(2px 2px at 75% 20%, #fff, transparent); background-size:38px 38px;",
  "dust": "background-image: radial-gradient(1.5px 1.5px at 30% 40%, rgba(255,255,220,.25), transparent 60%), radial-gradient(1px 1px at 65% 70%, rgba(255,255,220,.18), transparent 60%), radial-gradient(1.2px 1.2px at 45% 25%, rgba(255,255,220,.20), transparent 60%); background-size:38px 38px;",
  "sparkle": "background-image: radial-gradient(2px 2px at 20% 30%, #fff, transparent), radial-gradient(1.5px 1.5px at 60% 55%, #fff, transparent), radial-gradient(2.5px 2.5px at 80% 80%, #fff, transparent); background-size:38px 38px;",
  "smoke": "background-image: radial-gradient(circle at 30% 60%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 0 30%, transparent 50%), radial-gradient(circle at 70% 40%, color-mix(in srgb,var(--fx-c2) 8%,transparent) 0 30%, transparent 50%);",
  "fog": "background-image: radial-gradient(circle at 50% 50%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 0 40%, transparent 75%);",
  "cloud": "background-image: radial-gradient(ellipse at 30% 40%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 0 30%, transparent 55%), radial-gradient(ellipse at 70% 60%, color-mix(in srgb,var(--fx-c2) 8%,transparent) 0 30%, transparent 55%);",
  "feather": "background-image: repeating-linear-gradient(85deg, transparent 0 8px, color-mix(in srgb,var(--fx-c2) 8%,transparent) 8px 9px);",
  "leaf": "background-image: radial-gradient(ellipse at 35% 45%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 0 14px, transparent 24px); background-size:38px 38px;",
  "scale": "background-image: radial-gradient(circle at 50% 100%, color-mix(in srgb,var(--fx-c2) 12%,transparent) 0 55%, transparent 57%); background-size:24px 24px;",
  "brick": "background-image: linear-gradient(color-mix(in srgb,var(--fx-c2) 9%,transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb,var(--fx-c2) 9%,transparent) 1px, transparent 1px); background-size:38px 22px;",
  "herringbone": "background-image: repeating-linear-gradient(50deg, transparent 0 12px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 12px 14px), repeating-linear-gradient(-50deg, transparent 0 12px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 12px 14px); background-size:36px 36px;",
  "triangles": "background-image: linear-gradient(60deg, transparent 0 50%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 50% 52%, transparent 52%), linear-gradient(120deg, transparent 0 50%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 50% 52%, transparent 52%); background-size:30px 38px;",
  "mesh": "background-image: radial-gradient(circle at 0 0, transparent 0 45%, color-mix(in srgb,var(--fx-c1) 10%,transparent) 55%, transparent 65%), radial-gradient(circle at 100% 100%, transparent 0 45%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 55%, transparent 65%); background-size: 200% 200%;",
  "membrane": "background-image: linear-gradient(90deg, transparent 49%, color-mix(in srgb,var(--fx-c2) 9%,transparent) 49% 51%, transparent 51%); background-size: 26px 100%;",
  "ripplewave": "background-image: repeating-radial-gradient(circle at 50% 50%, transparent 0 12px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 12px 13px, transparent 24px);",
  "spiral": "background-image: repeating-radial-gradient(circle at 50% 50%, transparent 0 6px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 6px 7px, transparent 12px);",
  "concentric": "background-image: repeating-radial-gradient(circle at 50% 50%, transparent 0 8px, color-mix(in srgb,var(--fx-c2) 9%,transparent) 8px 9px, transparent 16px, color-mix(in srgb,var(--fx-c2) 12%,transparent) 16px 17px, transparent 24px);",
  "rings": "background-image: repeating-radial-gradient(circle at 50% 50%, transparent 0 18px, color-mix(in srgb,var(--fx-c2) 11%,transparent) 18px 19px);",
  "dotcircle": "background-image: radial-gradient(circle at 50% 50%, color-mix(in srgb,var(--fx-c2) 14%,transparent) 3px, transparent 4px); background-size:24px 24px;",
  "plusgrid": "background-image: linear-gradient(color-mix(in srgb,var(--fx-c2) 12%,transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb,var(--fx-c2) 12%,transparent) 1px, transparent 1px); background-size:30px 30px; background-position: 15px 15px, 15px 15px;",
  "hash": "background-image: linear-gradient(color-mix(in srgb,var(--fx-c2) 10%,transparent) 2px, transparent 2px), linear-gradient(90deg, color-mix(in srgb,var(--fx-c2) 10%,transparent) 2px, transparent 2px); background-size:30px 30px;",
  "techlines": "background-image: linear-gradient(90deg, transparent 25%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 25% 27%, transparent 27%), linear-gradient(90deg, transparent 65%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 65% 67%, transparent 67%); background-size:38px 38px;",
  "dataflow": "background-image: repeating-linear-gradient(90deg, transparent 0 30px, color-mix(in srgb,var(--fx-c1) 12%,transparent) 30px 32px, transparent 32px 50px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 50px 52px, transparent 52px);",
  "halo": "background-image: radial-gradient(circle, color-mix(in srgb,var(--fx-c1) 14%,transparent) 0 40%, transparent 70%);",
  "glowcenter": "background-image: radial-gradient(circle at 50% 50%, color-mix(in srgb,var(--fx-c1) 18%,transparent) 0 30%, transparent 65%);",
  "shade": "background-image: linear-gradient(180deg, rgba(0,0,0,.30), transparent 45%);",
  "lift": "background-image: linear-gradient(0deg, color-mix(in srgb,var(--fx-c2) 8%,transparent), transparent 45%);",
  "noise": "background-image: repeating-radial-gradient(circle at 25% 25%, color-mix(in srgb,var(--fx-c2) 12%,transparent) .5px, transparent 1.2px); background-size:5px 5px;",
  "noisefine": "background-image: repeating-radial-gradient(circle, color-mix(in srgb,var(--fx-c2) 10%,transparent) .4px, transparent 1px); background-size:3px 3px;",
  "grain": "background-image: repeating-radial-gradient(circle at 25% 25%, color-mix(in srgb,var(--fx-c2) 12%,transparent) .5px, transparent 1.2px); background-size:5px 5px;",
  "dots": "background-image: radial-gradient(color-mix(in srgb,var(--fx-c2) 16%,transparent) 1px, transparent 1.4px); background-size:22px 22px;",
  "grid": "background-image: linear-gradient(color-mix(in srgb,var(--fx-c2) 7%,transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb,var(--fx-c2) 7%,transparent) 1px, transparent 1px); background-size:38px 38px;",
  "gridfade": "background-image: linear-gradient(color-mix(in srgb,var(--fx-c2) 8%,transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb,var(--fx-c2) 8%,transparent) 1px, transparent 1px); background-size:34px 34px; -webkit-mask-image: radial-gradient(circle, #000 40%, transparent 80%); mask-image: radial-gradient(circle, #000 40%, transparent 80%);",
  "plus": "background-image: linear-gradient(color-mix(in srgb,var(--fx-c2) 12%,transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb,var(--fx-c2) 12%,transparent) 1px, transparent 1px); background-size:30px 30px; background-position: 15px 15px, 15px 15px;",
  "linesh": "background-image: repeating-linear-gradient(0deg, transparent, transparent 15px, color-mix(in srgb,var(--fx-c2) 8%,transparent) 15px, color-mix(in srgb,var(--fx-c2) 8%,transparent) 16px);",
  "linesv": "background-image: repeating-linear-gradient(90deg, transparent, transparent 15px, color-mix(in srgb,var(--fx-c2) 8%,transparent) 15px, color-mix(in srgb,var(--fx-c2) 8%,transparent) 16px);",
  "diag": "background-image: repeating-linear-gradient(135deg, transparent, transparent 14px, color-mix(in srgb,var(--fx-c2) 9%,transparent) 14px, color-mix(in srgb,var(--fx-c2) 9%,transparent) 15px);",
  "crosshatch": "background-image: repeating-linear-gradient(45deg, transparent, transparent 8px, color-mix(in srgb,var(--fx-c2) 9%,transparent) 8px, color-mix(in srgb,var(--fx-c2) 9%,transparent) 9px), repeating-linear-gradient(135deg, transparent, transparent 8px, color-mix(in srgb,var(--fx-c2) 9%,transparent) 8px, color-mix(in srgb,var(--fx-c2) 9%,transparent) 9px);",
  "zigzag": "background-image: repeating-linear-gradient(135deg, transparent, transparent 8px, color-mix(in srgb,var(--fx-c2) 12%,transparent) 8px, color-mix(in srgb,var(--fx-c2) 12%,transparent) 10px); background-size:20px 20px;",
  "wave": "background-image: repeating-radial-gradient(circle at 50% 100%, transparent 0, transparent 12px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 12px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 13px); background-size:38px 20px;",
  "hex": "background-image: radial-gradient(circle at 10px 17px, color-mix(in srgb,var(--fx-c2) 14%,transparent) 1.5px, transparent 2.4px); background-size:20px 34px;",
  "diamond": "background-image: linear-gradient(45deg, color-mix(in srgb,var(--fx-c2) 9%,transparent) 25%, transparent 25%, transparent 75%, color-mix(in srgb,var(--fx-c2) 9%,transparent) 75%), linear-gradient(-45deg, color-mix(in srgb,var(--fx-c2) 9%,transparent) 25%, transparent 25%, transparent 75%, color-mix(in srgb,var(--fx-c2) 9%,transparent) 75%); background-size:26px 26px;",
  "checker": "background-image: linear-gradient(45deg, color-mix(in srgb,var(--fx-c2) 10%,transparent) 25%, transparent 25%, transparent 75%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 75%), linear-gradient(-45deg, color-mix(in srgb,var(--fx-c2) 10%,transparent) 25%, transparent 25%, transparent 75%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 75%); background-size:20px 20px;",
  "plaid": "background-image: repeating-linear-gradient(45deg, transparent, transparent 14px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 14px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 16px), repeating-linear-gradient(-45deg, transparent, transparent 14px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 14px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 16px);",
  "contour": "background-image: repeating-radial-gradient(circle at 30% 40%, transparent 0, transparent 14px, color-mix(in srgb,var(--fx-c2) 12%,transparent) 14px, color-mix(in srgb,var(--fx-c2) 12%,transparent) 15px);",
  "ripples": "background-image: repeating-radial-gradient(circle at 50% 120%, transparent 0, transparent 30px, color-mix(in srgb,var(--fx-c2) 12%,transparent) 30px, color-mix(in srgb,var(--fx-c2) 12%,transparent) 31px);",
  "bubbles": "background-image: radial-gradient(circle at 20% 30%, color-mix(in srgb,var(--fx-c2) 14%,transparent) 6px, transparent 8px), radial-gradient(circle at 70% 60%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 10px, transparent 12px), radial-gradient(circle at 40% 80%, color-mix(in srgb,var(--fx-c2) 8%,transparent) 14px, transparent 16px); background-size:38px 38px;",
  "circles": "background-image: repeating-radial-gradient(circle at 50% 50%, transparent 0, transparent 20px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 20px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 21px);",
  "starfield": "background-image: radial-gradient(1px 1px at 20% 30%, #fff, transparent), radial-gradient(1px 1px at 70% 60%, #fff, transparent), radial-gradient(1.5px 1.5px at 40% 80%, #fff, transparent); background-size:38px 38px;",
  "circuit": "background-image: linear-gradient(90deg, transparent 49%, color-mix(in srgb,var(--fx-c2) 12%,transparent) 49% 51%, transparent 51%), linear-gradient(0deg, transparent 49%, color-mix(in srgb,var(--fx-c2) 12%,transparent) 49% 51%, transparent 51%); background-size:38px 38px;",
  "data": "background-image: linear-gradient(90deg, transparent 30%, color-mix(in srgb,var(--fx-c2) 14%,transparent) 30% 32%, transparent 32%), linear-gradient(90deg, transparent 60%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 60% 62%, transparent 62%); background-size:38px 38px;",
  "carbon": "background-image: linear-gradient(60deg, #000 25%, transparent 25%), linear-gradient(120deg, #000 25%, transparent 25%); background-size:8px 14px;",
  "brushed": "background-image: repeating-linear-gradient(90deg, transparent 0 3px, color-mix(in srgb,var(--fx-c2) 7%,transparent) 3px 4px);",
  "silk": "background-image: linear-gradient(120deg, transparent 0%, var(--fx-c1) 50%, transparent 100%);",
  "linen": "background-image: repeating-linear-gradient(0deg, transparent 0 2px, color-mix(in srgb,var(--fx-c2) 6%,transparent) 2px 3px), repeating-linear-gradient(90deg, transparent 0 2px, color-mix(in srgb,var(--fx-c2) 6%,transparent) 2px 3px);",
  "paper": "background-image: radial-gradient(circle at 20% 30%, color-mix(in srgb,var(--fx-c2) 5%,transparent) .8px, transparent 1.6px); background-size:9px 9px;",
  "marble": "background-image: radial-gradient(ellipse at 30% 20%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 0 8%, transparent 20%), radial-gradient(ellipse at 70% 60%, color-mix(in srgb,var(--fx-c2) 7%,transparent) 0 12%, transparent 26%);",
  "frosted": "background: color-mix(in srgb,var(--fx-c2) 5%,transparent); backdrop-filter: blur(6px);",
  "arabesque": "background-image: radial-gradient(circle at 50% 50%, transparent 0 30%, rgba(255,215,150,.10) 30% 32%, transparent 34%), radial-gradient(circle at 50% 50%, transparent 0 50%, rgba(255,215,150,.08) 50% 52%, transparent 54%); background-size:38px 38px;",
  "moroccan": "background-image: linear-gradient(60deg, transparent 0 30%, rgba(255,215,150,.10) 30% 70%, transparent 70%), linear-gradient(120deg, transparent 0 30%, rgba(255,215,150,.10) 30% 70%, transparent 70%); background-size:30px 38px;"
 },
 "gw": {
  "outer": "box-shadow: 0 0 24px -2px var(--fx-c2), 0 8px 30px rgba(0,0,0,.5);",
  "outer2": "box-shadow: 0 0 18px var(--fx-c2), 0 0 40px -4px var(--fx-c2), 0 8px 30px rgba(0,0,0,.5);",
  "inner": "box-shadow: inset 0 0 50px -10px var(--fx-c2);",
  "both": "box-shadow: 0 0 24px -2px var(--fx-c2), inset 0 0 30px -8px var(--fx-c2);",
  "soft": "box-shadow: 0 6px 40px -6px var(--fx-c2);",
  "softwide": "box-shadow: 0 10px 60px -10px var(--fx-c2);",
  "tight": "box-shadow: 0 0 10px 2px var(--fx-c2);",
  "breath": "animation: pfGwBreath 3.5s ease-in-out infinite;",
  "breathslow": "animation: pfGwBreath 6s ease-in-out infinite;",
  "pulse": "animation: pfGwPulse 2.2s ease-out infinite;",
  "pulse2": "animation: pfGwPulse2 2.6s ease-out infinite;",
  "sonar": "animation: pfGwSonar 3s ease-out infinite;",
  "neon": "box-shadow: 0 0 6px var(--fx-c2), 0 0 18px var(--fx-c2), 0 0 46px var(--fx-c2);",
  "neonflick": "animation: pfGwFlick 8s infinite;",
  "buzzing": "animation: pfGwBuzz 3s infinite;",
  "rainbow": "animation: pfGwRainbow 4s linear infinite;",
  "rainbowslow": "animation: pfGwRainbow 8s linear infinite;",
  "aurora": "background-image: radial-gradient(circle at 20% 0%, color-mix(in srgb,var(--fx-c2) 12%,transparent), transparent 60%), radial-gradient(circle at 85% 100%, color-mix(in srgb,var(--fx-c2) 10%,transparent), transparent 55%);",
  "spot": "box-shadow: 0 -10px 50px -15px var(--fx-c2);",
  "volumetric": "box-shadow: 0 0 60px -10px var(--fx-c2), inset 0 0 40px -20px var(--fx-c2);",
  "bloom": "box-shadow: 0 0 20px var(--fx-c2), 0 0 60px -10px var(--fx-c2);",
  "bloomsoft": "box-shadow: 0 0 30px -6px var(--fx-c2), 0 0 80px -20px var(--fx-c2);",
  "glowup": "animation: pfGwUp 2.5s ease-in-out infinite alternate;",
  "glowdown": "animation: pfGwDown 2.5s ease-in-out infinite alternate;",
  "shimmer": "animation: pfGwShim 4s ease-in-out infinite;",
  "sparkle": "animation: pfGwSpark 5s ease-in-out infinite;",
  "fairy": "animation: pfGwFairy 6s ease-in-out infinite;",
  "halo": "box-shadow: 0 0 30px 4px var(--fx-c2), inset 0 0 20px var(--fx-c2);",
  "halorot": "animation: pfGwHaloRot 6s linear infinite;",
  "ringglow": "box-shadow: 0 0 0 1px var(--fx-c2), 0 0 24px -2px var(--fx-c2);",
  "shadowcore": "box-shadow: inset 0 0 40px 4px rgba(0,0,0,.5), 0 0 30px -6px var(--fx-c2);",
  "underglow": "box-shadow: 0 20px 40px -10px var(--fx-c2);",
  "topglow": "box-shadow: 0 -20px 40px -10px var(--fx-c2);",
  "sides": "box-shadow: -16px 0 40px -16px var(--fx-c2), 16px 0 40px -16px var(--fx-c2);",
  "fire": "box-shadow: 0 0 24px -2px #ff5722, 0 0 50px -10px #ff9800;",
  "ice": "box-shadow: 0 0 28px -2px #80deea, inset 0 0 20px -4px #b2ebf2;",
  "magic": "box-shadow: 0 0 26px -2px #ce93d8, 0 0 50px -12px #ba68c8;",
  "electric": "box-shadow: 0 0 12px #00e5ff, 0 0 30px #00bcd4, inset 0 0 12px #00e5ff;",
  "plasma": "box-shadow: 0 0 22px -2px #b388ff, 0 0 50px -10px #7c4dff;",
  "laser": "box-shadow: 0 0 4px var(--fx-c2), 0 0 14px var(--fx-c2), 0 0 32px var(--fx-c2);",
  "energy": "box-shadow: 0 0 20px -2px var(--fx-c2), inset 0 0 16px -4px var(--fx-c2); animation: pfGwBreath 3s ease-in-out infinite;",
  "energyflow": "animation: pfGwFlow 3s ease-in-out infinite alternate;",
  "core": "box-shadow: inset 0 0 20px 4px var(--fx-c2), 0 0 30px -4px var(--fx-c2);",
  "gridglow": "box-shadow: 0 0 30px -6px var(--fx-c2); filter: drop-shadow(0 0 6px var(--fx-c2));",
  "matrixglow": "box-shadow: 0 0 24px -2px #00ff96;",
  "glitch": "animation: pfGwGlitch 3s infinite;",
  "glitchrgb": "box-shadow: -3px 0 0 rgba(255,0,80,.5), 3px 0 0 rgba(0,200,255,.5);",
  "scan": "animation: pfGwScan 6s linear infinite;",
  "scanline": "box-shadow: inset 0 0 0 1px var(--fx-c2);",
  "crt": "box-shadow: inset 0 0 60px rgba(0,0,0,.5);",
  "hologram": "box-shadow: 0 0 24px -2px var(--fx-c2), inset 0 0 24px -6px var(--fx-c2); animation: pfGwHolo 5s ease-in-out infinite;",
  "hologrid": "box-shadow: 0 0 24px -4px var(--fx-c2); filter: drop-shadow(0 0 4px var(--fx-c2));",
  "morph": "animation: pfGwMorph 8s ease-in-out infinite;",
  "wobble": "animation: pfGwWobble 4s ease-in-out infinite;",
  "strobe": "animation: pfGwStrobe 2s steps(2) infinite;",
  "flicker": "animation: pfGwFlicker 4s infinite;",
  "ember": "box-shadow: 0 0 20px -4px #ff6d00, 0 0 40px -12px #ff3d00;",
  "sunset": "box-shadow: 0 0 40px -10px #ff7043, 0 -10px 50px -16px #ffab40;",
  "dawn": "box-shadow: 0 0 40px -12px #ff8a80, 0 0 60px -18px #ffd180;",
  "golden": "box-shadow: 0 0 30px -6px #ffd54f;",
  "silver": "box-shadow: 0 0 30px -6px #cfd8dc;",
  "iridescent": "box-shadow: 0 0 24px -2px var(--fx-c2); animation: pfGwIridescent 5s linear infinite;",
  "oil": "box-shadow: 0 0 24px -4px var(--fx-c2); animation: pfGwOil 6s linear infinite;",
  "soap": "box-shadow: 0 0 30px -6px var(--fx-c2); animation: pfGwSoap 7s ease-in-out infinite;",
  "prism": "box-shadow: -4px 0 12px rgba(255,0,80,.5), 4px 0 12px rgba(0,150,255,.5);",
  "chroma": "box-shadow: 0 0 14px var(--fx-c2); animation: pfGwChroma 5s linear infinite;",
  "ambient": "box-shadow: 0 8px 40px -8px var(--fx-c2);",
  "ambientsm": "box-shadow: 0 6px 30px -10px var(--fx-c2);",
  "refract": "box-shadow: 0 0 20px -4px var(--fx-c2); filter: blur(.2px);",
  "reflect": "box-shadow: inset 0 -20px 40px -20px var(--fx-c2), 0 10px 30px -10px var(--fx-c2);",
  "shadow": "box-shadow: 0 12px 30px -8px rgba(0,0,0,.6);",
  "shadowdeep": "box-shadow: 0 20px 50px -10px rgba(0,0,0,.7);",
  "shadowlong": "box-shadow: 20px 20px 40px -10px rgba(0,0,0,.6);",
  "layered": "box-shadow: 0 0 10px var(--fx-c2), 0 0 26px -2px var(--fx-c2), 0 0 50px -10px var(--fx-c2), inset 0 0 16px -4px var(--fx-c2);",
  "comet": "animation: pfGwComet 6s ease-in-out infinite;",
  "flare": "box-shadow: 0 0 60px 4px var(--fx-c2), 0 0 120px -10px var(--fx-c2);",
  "dust": "box-shadow: 0 0 40px -10px var(--fx-c2);",
  "starlight": "box-shadow: 0 0 20px -2px var(--fx-c2), inset 0 0 10px -2px #fff;",
  "sunbeam": "box-shadow: 0 -20px 60px -16px var(--fx-c2);",
  "lunar": "box-shadow: 0 0 40px -10px #cfd8dc, inset 0 0 20px -6px #eceff1;",
  "twilight": "box-shadow: 0 0 40px -10px #b39ddb, 0 0 60px -18px #f48fb1;",
  "polar": "box-shadow: 0 0 40px -10px var(--fx-c2); animation: pfGwPolar 6s linear infinite;",
  "candle": "box-shadow: 0 0 20px -4px #ffb74d; animation: pfGwFlicker 3s infinite;",
  "torch": "box-shadow: 0 0 26px -4px #ff8a65, 0 0 50px -12px #ff5722;",
  "lamp": "box-shadow: 0 0 30px -6px #ffe082;",
  "dreame": "box-shadow: 0 0 40px -12px #ea80fc, 0 0 60px -20px #b388ff;"
 },
 "bd": {
  "solid": "box-shadow: inset 0 0 0 2px var(--fx-c2);",
  "solidthin": "box-shadow: inset 0 0 0 1px var(--fx-c2);",
  "double": "box-shadow: inset 0 0 0 1px #2a3040, inset 0 0 0 4px var(--fx-c2);",
  "doublegap": "box-shadow: inset 0 0 0 2px #161b27, inset 0 0 0 4px var(--fx-c2);",
  "triple": "box-shadow: inset 0 0 0 1px var(--fx-c2), inset 0 0 0 4px #161b27, inset 0 0 0 6px var(--fx-c2);",
  "glow": "box-shadow: 0 0 0 1px var(--fx-c2), 0 0 24px -4px var(--fx-c1), 0 8px 30px rgba(0,0,0,.5);",
  "glowstrong": "box-shadow: 0 0 0 1px var(--fx-c2), 0 0 40px -2px var(--fx-c1);",
  "glowsoft": "box-shadow: 0 0 0 1px var(--fx-c2), 0 6px 40px -8px var(--fx-c1);",
  "neon": "box-shadow: 0 0 4px var(--fx-c2), 0 0 14px var(--fx-c2);",
  "neondouble": "box-shadow: 0 0 4px var(--fx-c2), 0 0 14px var(--fx-c2), 0 0 30px var(--fx-c2);",
  "etchedsingle": "box-shadow: inset 0 0 0 1px var(--fx-c2);",
  "etched": "box-shadow: inset 0 0 0 1px var(--fx-c2), inset 0 0 0 3px rgba(0,0,0,.4);",
  "etcheddeep": "box-shadow: inset 0 0 0 1px var(--fx-c2), inset 0 0 0 4px rgba(0,0,0,.5), inset 0 0 0 5px var(--fx-c2);",
  "gradient": "box-shadow: inset 0 0 0 2px transparent;",
  "gradientvert": "box-shadow: inset 0 0 0 2px transparent;",
  "hueshift": "box-shadow: inset 0 0 0 2px transparent;",
  "bevel": "clip-path: polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px);",
  "bevel2": "clip-path: polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px);",
  "bevelsoft": "clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);",
  "cut": "clip-path: polygon(0 12px, 12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px));",
  "cutthin": "clip-path: polygon(0 8px, 8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px));",
  "notch": "clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px));",
  "tape": "clip-path: polygon(0 0, 100% 0, 100% 100%, 20px 100%, 0 calc(100% - 20px));",
  "cyber": "clip-path: polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px);",
  "cyber2": "clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px));",
  "inset": "box-shadow: inset 2px 2px 0 var(--fx-c2), inset -2px -2px 0 var(--fx-c2);",
  "insetdeep": "box-shadow: inset 3px 3px 0 var(--fx-c2), inset -3px -3px 0 var(--fx-c2), inset 0 0 0 6px rgba(0,0,0,.3);",
  "outset": "box-shadow: 2px 2px 0 var(--fx-c2), -2px -2px 0 var(--fx-c2);",
  "ridge": "box-shadow: inset 2px 2px 4px color-mix(in srgb,var(--fx-c2) 25%,transparent), inset -2px -2px 4px rgba(0,0,0,.5), 0 0 0 1px var(--fx-c2);",
  "groove": "box-shadow: inset 2px 2px 4px rgba(0,0,0,.5), inset -2px -2px 4px color-mix(in srgb,var(--fx-c2) 15%,transparent), 0 0 0 1px var(--fx-c2);",
  "dashed": "box-shadow: inset 0 0 0 1px var(--fx-c2);",
  "dashedlong": "box-shadow: inset 0 0 0 2px var(--fx-c2);",
  "dotted": "box-shadow: inset 0 0 0 2px var(--fx-c2);",
  "dotdash": "box-shadow: inset 0 0 0 1px var(--fx-c2);",
  "stitch": "box-shadow: inset 0 0 0 3px #161b27, inset 0 0 0 4px var(--fx-c2);",
  "zigzagline": "clip-path: polygon(0 0, 8px 6px, 16px 0, 24px 6px, 32px 0, 100% 0, 100% 100%, 0 100%);",
  "scallop": "clip-path: polygon(0 12px, 6px 6px, 12px 12px, 18px 6px, 24px 12px, 30px 6px, 36px 12px, 100% 12px, 100% 100%, 0 100%);",
  "waveedge": "clip-path: polygon(0 8px, 10px 0, 20px 8px, 30px 0, 40px 8px, 100% 8px, 100% 100%, 0 100%);",
  "rope": "box-shadow: inset 0 0 0 4px #161b27, inset 0 0 0 6px var(--fx-c2), repeating-linear-gradient(45deg, transparent 0 6px, rgba(0,0,0,.2) 6px 8px);",
  "chain": "box-shadow: inset 0 0 0 2px #161b27, inset 0 0 0 4px var(--fx-c2);",
  "frame": "box-shadow: inset 0 0 0 8px #161b27, inset 0 0 0 10px var(--fx-c2);",
  "framegold": "box-shadow: inset 0 0 0 6px #2a1a08, inset 0 0 0 9px var(--fx-c2);",
  "pillar": "box-shadow: inset 10px 0 0 var(--fx-c2), inset -10px 0 0 var(--fx-c2);",
  "arch": "border-radius: 50% 50% 0 0 / 20% 20% 0 0;",
  "shield": "clip-path: polygon(0 0, 100% 0, 100% 75%, 50% 100%, 0 75%);",
  "crestframe": "clip-path: polygon(20% 0, 80% 0, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0 80%, 0 20%);",
  "seal": "border-radius: 50%;",
  "stamp": "clip-path: polygon(0 6px, 6px 0, 12px 6px, 18px 0, 24px 6px, 30px 0, 36px 6px, 42px 0, 48px 6px, 54px 0, 60px 6px, 66px 0, 72px 6px, 78px 0, 84px 6px, 90px 0, 96px 6px, 100% 0, 100% 100%, 0 100%);",
  "ticket": "clip-path: polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px);",
  "polaroid": "box-shadow: inset 0 0 0 10px #161b27, inset 0 -30px 0 #0d1119;",
  "card": "box-shadow: 0 2px 0 #2a3040, 0 4px 14px rgba(0,0,0,.5);",
  "card2": "box-shadow: 0 2px 0 #2a3040, 0 4px 0 #161b27, 0 6px 20px rgba(0,0,0,.5);",
  "glass": "box-shadow: inset 0 1px 0 color-mix(in srgb,var(--fx-c2) 30%,transparent), inset 0 0 0 1px color-mix(in srgb,var(--fx-c2) 15%,transparent);",
  "glassstrong": "box-shadow: inset 0 1px 0 color-mix(in srgb,var(--fx-c2) 40%,transparent), inset 0 0 0 2px color-mix(in srgb,var(--fx-c2) 20%,transparent);",
  "metal": "box-shadow: inset 0 1px 0 color-mix(in srgb,var(--fx-c2) 40%,transparent), inset 0 -1px 0 rgba(0,0,0,.4), 0 0 0 1px var(--fx-c2);",
  "metalthin": "box-shadow: inset 0 1px 0 color-mix(in srgb,var(--fx-c2) 30%,transparent), inset 0 -1px 0 rgba(0,0,0,.3), 0 0 0 1px var(--fx-c2);",
  "chrome": "box-shadow: inset 0 2px 4px color-mix(in srgb,var(--fx-c2) 50%,transparent), inset 0 -2px 4px rgba(0,0,0,.4), 0 0 0 1px var(--fx-c2);",
  "copper": "box-shadow: inset 0 1px 0 rgba(255,180,120,.4), inset 0 0 0 2px var(--fx-c2);",
  "titanium": "box-shadow: inset 0 1px 0 color-mix(in srgb,var(--fx-c2) 35%,transparent), inset 0 0 0 2px var(--fx-c2), 0 0 24px -8px var(--fx-c2);",
  "wood": "box-shadow: inset 0 0 0 6px #3a2410, inset 0 0 0 7px var(--fx-c2);",
  "acrylic": "box-shadow: inset 0 0 0 1px color-mix(in srgb,var(--fx-c2) 40%,transparent); background: color-mix(in srgb,var(--fx-c2) 6%,transparent); backdrop-filter: blur(8px);",
  "marblebd": "box-shadow: inset 0 0 0 3px #161b27, inset 0 0 0 5px var(--fx-c2);",
  "rotating": "box-shadow: inset 0 0 0 2px transparent; animation: pfBdSpin 5s linear infinite;",
  "tracing": "box-shadow: inset 0 0 0 2px transparent;",
  "focus": "box-shadow: 0 0 0 2px #161b27, 0 0 0 4px var(--fx-c2);",
  "halftonebd": "box-shadow: inset 0 0 0 2px var(--fx-c2);",
  "pixel": "box-shadow: inset 0 0 0 3px var(--fx-c2);",
  "bracket": "box-shadow: inset 4px 0 0 var(--fx-c2), inset -4px 0 0 var(--fx-c2);",
  "arrow": "clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 60%, 12px 50%, 0 40%);",
  "plusbr": "box-shadow: inset 0 0 0 2px var(--fx-c2);",
  "dotbr": "box-shadow: inset 0 0 0 2px var(--fx-c2);",
  "ring": "box-shadow: inset 0 0 0 6px transparent, 0 0 0 1px var(--fx-c2);",
  "ringdouble": "box-shadow: inset 0 0 0 4px transparent, inset 0 0 0 8px var(--fx-c2), 0 0 0 1px var(--fx-c2);",
  "glowpulse": "box-shadow: 0 0 0 1px var(--fx-c2); animation: pfBdPulse 2.5s ease-out infinite;",
  "innershine": "box-shadow: inset 0 0 30px -4px var(--fx-c2);",
  "synth": "box-shadow: 0 0 0 1px var(--fx-c2), 0 0 24px -4px var(--fx-c2);",
  "scanlinebd": "box-shadow: inset 0 0 0 1px var(--fx-c2);",
  "split": "box-shadow: inset 0 6px 0 var(--fx-c2), inset 0 -6px 0 var(--fx-c2);",
  "cornerclip": "clip-path: polygon(16px 0, calc(100% - 16px) 0, 100% 16px, 100% calc(100% - 16px), calc(100% - 16px) 100%, 16px 100%, 0 calc(100% - 16px), 0 16px);",
  "torn": "clip-path: polygon(0 4px, 8px 0, 16px 5px, 24px 1px, 32px 6px, 100% 0, 100% 100%, 0 100%);",
  "tapecorner": "box-path: none;",
  "minimal": "box-shadow: 0 -2px 0 var(--fx-c2);",
  "minimal2": "box-shadow: inset 4px 0 0 var(--fx-c2);",
  "fancy": "box-shadow: inset 0 0 0 2px var(--fx-c2), inset 0 0 0 6px #161b27, inset 0 0 0 8px var(--fx-c2);"
 },
 "ty": {
  "serif": "font-family: \"Songti SC\", \"SimSun\", \"Noto Serif SC\", serif; font-weight: 700; letter-spacing: 1px;",
  "serif2": "font-family: \"Source Serif Pro\", Georgia, serif; font-weight: 700;",
  "serif3": "font-family: \"Iowan Old Style\", \"Apple Garamond\", Georgia, serif; font-weight: 600; letter-spacing: .5px;",
  "seriftrad": "font-family: \"SimSun\", \"宋体\", serif; font-weight: 700;",
  "serifdisplay": "font-family: \"Playfair Display\", \"Songti SC\", serif; font-weight: 900; letter-spacing: 1.5px;",
  "bodoni": "font-family: \"Bodoni 72\", \"Didot\", serif; font-weight: 700; letter-spacing: 2px;",
  "garamond": "font-family: \"Adobe Garamond\", \"Garamond\", serif; font-weight: 600;",
  "caslon": "font-family: \"Big Caslon\", \"Caslon\", serif; font-weight: 600; letter-spacing: .5px;",
  "sans": "font-family: \"PingFang SC\", \"Microsoft YaHei\", sans-serif; font-weight: 800; letter-spacing: .5px;",
  "sans2": "font-family: \"Inter\", \"Helvetica Neue\", sans-serif; font-weight: 700;",
  "sans3": "font-family: \"Nunito\", \"PingFang SC\", sans-serif; font-weight: 800; border-radius: 4px;",
  "sans4": "font-family: \"Futura\", \"Montserrat\", sans-serif; font-weight: 700; letter-spacing: 2px;",
  "sans5": "font-family: \"IBM Plex Sans\", \"PingFang SC\", sans-serif; font-weight: 600;",
  "sansbold": "font-family: \"PingFang SC\", \"Microsoft YaHei\", sans-serif; font-weight: 900; letter-spacing: .5px;",
  "sanslight": "font-family: \"PingFang SC\", \"Microsoft YaHei\", sans-serif; font-weight: 300; letter-spacing: 1px;",
  "sanscond": "font-family: \"PingFang SC\", \"Microsoft YaHei\", sans-serif; font-weight: 700; letter-spacing: .2px;",
  "hei": "font-family: \"Microsoft YaHei\", \"黑体\", sans-serif; font-weight: 700;",
  "heilight": "font-family: \"Microsoft YaHei\", \"黑体\", sans-serif; font-weight: 300;",
  "heibold": "font-family: \"Microsoft YaHei\", \"黑体\", sans-serif; font-weight: 900;",
  "song": "font-family: \"SimSun\", \"宋体\", serif;",
  "kai": "font-family: \"Kaiti SC\", \"楷体\", serif;",
  "kaiti": "font-family: \"標楷體\", \"Kaiti SC\", serif;",
  "fang": "font-family: \"FangSong\", \"仿宋\", serif;",
  "li": "font-family: \"LiSu\", \"隶书\", serif;",
  "xiao": "font-family: \"STXingkai\", \"Xingkai SC\", serif;",
  "mono": "font-family: \"JetBrains Mono\", \"Consolas\", monospace; font-weight: 600; letter-spacing: 2px;",
  "mono2": "font-family: \"Courier New\", monospace; font-weight: 700;",
  "mono3": "font-family: \"Fira Code\", \"Consolas\", monospace; font-weight: 500;",
  "monobold": "font-family: \"JetBrains Mono\", \"Consolas\", monospace; font-weight: 800; letter-spacing: 1px;",
  "monocond": "font-family: \"JetBrains Mono\", \"Consolas\", monospace; font-weight: 600; letter-spacing: 1px;",
  "monolight": "font-family: \"VT323\", \"Courier New\", monospace; font-weight: 400;",
  "display": "font-family: \"Impact\", \"Arial Black\", sans-serif; font-weight: 900; letter-spacing: 3px;",
  "display2": "font-family: \"Bebas Neue\", \"Oswald\", \"Arial Narrow\", sans-serif; font-weight: 700; letter-spacing: 2px;",
  "display3": "font-family: \"Anton\", \"Arial Narrow\", sans-serif; font-weight: 700; letter-spacing: 2px;",
  "displaythin": "font-family: \"Oswald\", \"Arial Narrow\", sans-serif; font-weight: 300; letter-spacing: 3px;",
  "cond": "font-family: \"Oswald\", \"Arial Narrow\", sans-serif; font-weight: 700; letter-spacing: 1px;",
  "extcond": "font-family: \"Bebas Neue\", \"Arial Narrow\", sans-serif; font-weight: 700; letter-spacing: .5px;",
  "extwide": "font-family: \"Arial Narrow\", sans-serif; font-weight: 700; letter-spacing: 5px;",
  "script": "font-family: \"Snell Roundhand\", \"Brush Script MT\", cursive; font-weight: 600;",
  "script2": "font-family: \"Xingkai SC\", \"Kaiti SC\", cursive; font-weight: 600;",
  "script3": "font-family: \"Dancing Script\", cursive; font-weight: 700;",
  "hand": "font-family: \"Comic Sans MS\", \"PingFang SC\", cursive; font-weight: 600;",
  "hand2": "font-family: \"Marker Felt\", \"Chalkboard SE\", cursive;",
  "cursive": "font-family: \"Apple Chancery\", \"Segoe Script\", cursive;",
  "brush": "font-family: \"Brush Script MT\", \"Kaiti SC\", cursive; font-weight: 700;",
  "brush2": "font-family: \"Xingkai SC\", cursive; font-weight: 800; letter-spacing: 1px;",
  "gothic": "font-family: \"Fette Fraktur\", \"UnifrakturCook\", serif; font-weight: 700;",
  "gothic2": "font-family: \"Blackletter\", serif; font-weight: 700; letter-spacing: 1px;",
  "gothictext": "font-family: \"Textura\", serif; font-weight: 700;",
  "stencil": "font-family: \"Stencil Std\", \"Impact\", sans-serif; font-weight: 700;",
  "stencil2": "font-family: \"Allerta Stencil\", \"Impact\", sans-serif; font-weight: 700;",
  "inline": "font-family: \"PingFang SC\", \"Microsoft YaHei\", sans-serif; font-weight: 800; -webkit-text-stroke: 1px var(--fx-c1); color: transparent;",
  "shadow": "font-family: \"PingFang SC\", \"Microsoft YaHei\", sans-serif; font-weight: 800; text-shadow: 3px 3px 0 color-mix(in srgb,var(--fx-c1) 62%,#000);",
  "outline": "font-family: \"PingFang SC\", \"Microsoft YaHei\", sans-serif; font-weight: 800; -webkit-text-stroke: 1.5px var(--fx-c1); color: transparent;",
  "doubleout": "font-family: \"PingFang SC\", \"Microsoft YaHei\", sans-serif; font-weight: 800; -webkit-text-stroke: 2.5px var(--fx-c1); color: transparent;",
  "gradient": "background: linear-gradient(135deg, color-mix(in srgb,var(--fx-c1) 72%,#fff), color-mix(in srgb,var(--fx-c1) 62%,#000)); -webkit-background-clip: text; background-clip: text; color: transparent; font-weight: 800;",
  "metallic": "background: linear-gradient(180deg, color-mix(in srgb,var(--fx-c1) 72%,#fff), color-mix(in srgb,var(--fx-c1) 62%,#000)); -webkit-background-clip: text; background-clip: text; color: transparent; font-weight: 800;",
  "neonfont": "font-family: \"PingFang SC\", \"Microsoft YaHei\", sans-serif; font-weight: 800; color: #fff; text-shadow: 0 0 4px var(--fx-c1), 0 0 12px var(--fx-c1);",
  "chromef": "background: linear-gradient(180deg, #fff 0%, color-mix(in srgb,var(--fx-c1) 72%,#fff) 45%, color-mix(in srgb,var(--fx-c1) 62%,#000) 55%, #fff 100%); -webkit-background-clip: text; background-clip: text; color: transparent; font-weight: 800;",
  "woodf": "background: linear-gradient(180deg, #b07d54, #6b4423); -webkit-background-clip: text; background-clip: text; color: transparent; font-weight: 800;",
  "marblef": "background: linear-gradient(120deg, #f5f5f5, #c9c9c9, #f5f5f5); -webkit-background-clip: text; background-clip: text; color: transparent; font-weight: 800;",
  "glassf": "background: linear-gradient(135deg, color-mix(in srgb,var(--fx-c2) 90%,transparent), color-mix(in srgb,var(--fx-c2) 40%,transparent)); -webkit-background-clip: text; background-clip: text; color: transparent; font-weight: 800;",
  "pixel": "font-family: \"Silkscreen\", \"Press Start 2P\", monospace; font-weight: 400; letter-spacing: 1px;",
  "pixel2": "font-family: \"VT323\", monospace; font-weight: 400;",
  "pixel3": "font-family: \"Press Start 2P\", monospace; font-weight: 400; letter-spacing: .5px;",
  "rounded": "font-family: \"Quicksand\", \"PingFang SC\", sans-serif; font-weight: 700;",
  "roundbold": "font-family: \"Varela Round\", \"PingFang SC\", sans-serif; font-weight: 700;",
  "marker": "font-family: \"Permanent Marker\", \"Marker Felt\", cursive; font-weight: 400;",
  "chalk": "font-family: \"Chalkboard SE\", \"Comic Sans MS\", cursive;",
  "typewriter": "font-family: \"Courier Prime\", \"Courier New\", monospace;",
  "stampf": "font-family: \"Courier New\", monospace; font-weight: 700; letter-spacing: 2px; color: color-mix(in srgb,var(--fx-c1) 72%,#fff); border: 2px solid var(--fx-c1); padding: 0 4px; display: inline-block;",
  "comic": "font-family: \"Comic Sans MS\", \"PingFang SC\", cursive; font-weight: 700;",
  "artdeco": "font-family: \"Fascinate\", \"Playfair Display\", serif; font-weight: 400; letter-spacing: 2px;",
  "retro": "font-family: \"Rye\", \"Playfair Display\", serif; font-weight: 400; letter-spacing: 1px;",
  "cyber": "font-family: \"Orbitron\", \"Rajdhani\", sans-serif; font-weight: 700; letter-spacing: 3px;",
  "glitchf": "font-family: \"Rajdhani\", \"PingFang SC\", sans-serif; font-weight: 800; letter-spacing: 1px;",
  "runic": "font-family: \"Cinzel\", serif; font-weight: 600; letter-spacing: 2px;",
  "uppercase": "text-transform: uppercase; letter-spacing: 3px;",
  "lowercase": "text-transform: lowercase;",
  "caps": "font-variant: small-caps; letter-spacing: 1px;",
  "italic": "font-style: italic;",
  "bold": "font-weight: 900;",
  "thin": "font-weight: 200;",
  "upright": "font-family: \"JetBrains Mono\", \"Consolas\", monospace;",
  "chrome": "background: linear-gradient(180deg, #fff 0%, color-mix(in srgb,var(--fx-c1) 72%,#fff) 45%, color-mix(in srgb,var(--fx-c1) 62%,#000) 55%, #fff 100%); -webkit-background-clip: text; background-clip: text; color: transparent; font-weight: 800;"
 },
 "pq": {
  "plate": "background: linear-gradient(180deg, color-mix(in srgb, var(--fx-c1) 25%, #1a1f2b), color-mix(in srgb, var(--fx-c1) 40%, #0f131c)); border: 1px solid color-mix(in srgb, var(--fx-c1) 50%, transparent); box-shadow: inset 0 1px 0 color-mix(in srgb,var(--fx-c2) 12%,transparent), 0 2px 6px rgba(0,0,0,.4);",
  "plate2": "background: color-mix(in srgb,var(--fx-c2) 4%,transparent); border: 1px solid color-mix(in srgb, var(--fx-c1) 45%, transparent); backdrop-filter: blur(4px);",
  "plate3": "background: repeating-linear-gradient(90deg, transparent 0 3px, color-mix(in srgb,var(--fx-c2) 5%,transparent) 3px 4px), linear-gradient(180deg, color-mix(in srgb, var(--fx-c1) 20%, #1a1f2b), color-mix(in srgb, var(--fx-c1) 35%, #0f131c)); border: 1px solid color-mix(in srgb, var(--fx-c1) 50%, transparent);",
  "platebold": "background: color-mix(in srgb, var(--fx-c1) 30%, #141a26); border: 2px solid var(--fx-c1);",
  "ribbon": "background: linear-gradient(90deg, color-mix(in srgb,var(--fx-c1) 62%,#000), var(--fx-c1), color-mix(in srgb,var(--fx-c1) 62%,#000)); color: #0b0e15; font-weight: 700; clip-path: polygon(8px 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0 50%);",
  "ribbon2": "background: var(--fx-c1); color: #0b0e15; font-weight: 700; clip-path: polygon(0 0, 100% 0, calc(100% - 8px) 100%, 8px 100%);",
  "ribbon3": "background: linear-gradient(90deg, color-mix(in srgb,var(--fx-c1) 62%,#000), var(--fx-c1), color-mix(in srgb,var(--fx-c1) 62%,#000)); color: #0b0e15; font-weight: 700; clip-path: polygon(0 0, 100% 0, 100% 100%, 86% 100%, 80% 0, 74% 100%, 60% 100%, 54% 0, 48% 100%, 34% 100%, 28% 0, 22% 100%, 8% 100%, 0 0);",
  "ribbon4": "background: var(--fx-c1); color: #0b0e15; font-weight: 700; clip-path: polygon(0 20%, 20% 0, 80% 0, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0 80%);",
  "crest": "background: linear-gradient(135deg, color-mix(in srgb, var(--fx-c1) 40%, #0f131c), #0f131c); border: 1px solid var(--fx-c1); border-radius: 4px 14px 4px 14px; box-shadow: 0 0 12px -4px var(--fx-c1);",
  "crest2": "background: linear-gradient(135deg, color-mix(in srgb,var(--fx-c1) 62%,#000), #0f131c); border: 1px solid var(--fx-c1); clip-path: polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%);",
  "crest3": "background: linear-gradient(135deg, color-mix(in srgb,var(--fx-c1) 62%,#000), #0f131c); border: 1px solid var(--fx-c1); border-radius: 50% 50% 0 0;",
  "chip": "background: #0c1018; border: 1px solid var(--fx-c1); border-radius: 4px; font-family: \"JetBrains Mono\", monospace;",
  "chip2": "background: #0c1018; border: 1px solid var(--fx-c1); border-radius: 4px; box-shadow: inset 0 0 0 3px #0c1018, inset 0 0 0 4px var(--fx-c1);",
  "seal": "background: radial-gradient(circle at 30% 30%, color-mix(in srgb,var(--fx-c1) 72%,#fff), color-mix(in srgb,var(--fx-c1) 62%,#000)); color: #0b0e15; font-weight: 800; border-radius: 50px;",
  "seal2": "background: #0b0e15; border: 2px solid var(--fx-c1); border-radius: 50px; color: color-mix(in srgb,var(--fx-c1) 72%,#fff);",
  "seal3": "background: #0b0e15; border: 2px solid var(--fx-c1); color: color-mix(in srgb,var(--fx-c1) 72%,#fff);",
  "badge": "background: #0b0e15; border: 1px solid var(--fx-c1); border-radius: 6px; color: color-mix(in srgb,var(--fx-c1) 72%,#fff); box-shadow: 0 3px 8px rgba(0,0,0,.4);",
  "badge2": "background: linear-gradient(135deg, color-mix(in srgb,var(--fx-c1) 62%,#000), #0f131c); border: 1px solid var(--fx-c1); border-radius: 6px 6px 0 0;",
  "tag": "background: var(--fx-c1); color: #0b0e15; font-weight: 700; clip-path: polygon(0 0, 100% 0, 100% 100%, 14px 100%, 0 calc(100% - 14px));",
  "tag2": "background: color-mix(in srgb,var(--fx-c1) 62%,#000); color: color-mix(in srgb,var(--fx-c1) 72%,#fff); clip-path: polygon(0 0, 100% 0, 100% calc(100% - 10px), 50% 100%, 0 calc(100% - 10px));",
  "label": "background: color-mix(in srgb,var(--fx-c2) 6%,transparent); border: 1px solid color-mix(in srgb,var(--fx-c2) 12%,transparent); border-left: 3px solid var(--fx-c1);",
  "label2": "background: linear-gradient(90deg, var(--fx-c1), transparent 80%); color: #0b0e15; font-weight: 700;",
  "label3": "background: var(--fx-c1); color: #0b0e15; font-weight: 700; border-radius: 4px;",
  "band": "background: color-mix(in srgb,var(--fx-c1) 62%,#000); color: color-mix(in srgb,var(--fx-c1) 72%,#fff); height: 22px; border-radius: 2px;",
  "band2": "background: linear-gradient(90deg, color-mix(in srgb,var(--fx-c1) 62%,#000), color-mix(in srgb,var(--fx-c1) 72%,#fff), color-mix(in srgb,var(--fx-c1) 62%,#000)); color: #0b0e15; font-weight: 700;",
  "band3": "background: linear-gradient(90deg, var(--fx-c1), var(--fx-c2)); color: #0b0e15; font-weight: 700;",
  "banner": "background: linear-gradient(90deg, color-mix(in srgb,var(--fx-c1) 62%,#000), var(--fx-c1), color-mix(in srgb,var(--fx-c1) 62%,#000)); color: #0b0e15; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; padding: 5px 16px;",
  "banner2": "background: var(--fx-c1); color: #0b0e15; font-weight: 800; clip-path: polygon(10px 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 10px 100%, 0 50%); padding: 5px 18px;",
  "banner3": "background: var(--fx-c1); color: #0b0e15; font-weight: 800; clip-path: polygon(0 0, 100% 0, calc(100% - 10px) 100%, 10px 100%); padding: 5px 18px;",
  "tab": "background: color-mix(in srgb,var(--fx-c1) 62%,#000); color: color-mix(in srgb,var(--fx-c1) 72%,#fff); border-radius: 6px 6px 0 0;",
  "tab2": "background: var(--fx-c1); color: #0b0e15; font-weight: 700; border-radius: 0 0 6px 6px;",
  "tab3": "background: color-mix(in srgb,var(--fx-c1) 62%,#000); color: color-mix(in srgb,var(--fx-c1) 72%,#fff); border-radius: 0 6px 6px 0;",
  "pill": "background: var(--fx-c1); color: #0b0e15; font-weight: 700; border-radius: 50px; padding: 4px 14px;",
  "pill2": "background: color-mix(in srgb,var(--fx-c1) 62%,#000); color: color-mix(in srgb,var(--fx-c1) 72%,#fff); border: 1px solid var(--fx-c1); border-radius: 50px;",
  "pill3": "background: linear-gradient(135deg, color-mix(in srgb,var(--fx-c1) 72%,#fff), color-mix(in srgb,var(--fx-c1) 62%,#000)); color: #0b0e15; font-weight: 700; border-radius: 50px;",
  "bubble": "background: var(--fx-c1); color: #0b0e15; font-weight: 700; border-radius: 14px 14px 14px 2px;",
  "bubble2": "background: color-mix(in srgb,var(--fx-c1) 62%,#000); color: color-mix(in srgb,var(--fx-c1) 72%,#fff); border-radius: 14px 14px 14px 2px; border: 1px solid var(--fx-c1);",
  "cloud": "background: var(--fx-c1); color: #0b0e15; font-weight: 700; border-radius: 20px 20px 4px 20px;",
  "shieldp": "background: linear-gradient(135deg, color-mix(in srgb,var(--fx-c1) 62%,#000), #0f131c); border: 1px solid var(--fx-c1); clip-path: polygon(0 0, 100% 0, 100% 75%, 50% 100%, 0 75%);",
  "shieldp2": "background: linear-gradient(135deg, var(--fx-c1), color-mix(in srgb,var(--fx-c1) 62%,#000)); color: #0b0e15; font-weight: 800; clip-path: polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%);",
  "medallion": "background: radial-gradient(circle at 30% 30%, color-mix(in srgb,var(--fx-c1) 72%,#fff), color-mix(in srgb,var(--fx-c1) 62%,#000)); color: #0b0e15; font-weight: 800; border-radius: 50%; width: 120px; height: 28px; line-height: 28px; text-align: center; padding: 0;",
  "coinp": "background: radial-gradient(circle at 35% 30%, color-mix(in srgb,var(--fx-c1) 72%,#fff), color-mix(in srgb,var(--fx-c1) 62%,#000)); color: #0b0e15; font-weight: 800; border: 2px solid color-mix(in srgb,var(--fx-c1) 72%,#fff); border-radius: 50%; box-shadow: 0 0 8px var(--fx-c1);",
  "key": "background: color-mix(in srgb,var(--fx-c1) 62%,#000); color: color-mix(in srgb,var(--fx-c1) 72%,#fff); border: 1px solid var(--fx-c1); clip-path: polygon(0 0, 100% 0, 100% 100%, 20% 100%, 20% 60%, 0 60%);",
  "gem": "background: linear-gradient(135deg, color-mix(in srgb,var(--fx-c1) 72%,#fff), color-mix(in srgb,var(--fx-c1) 62%,#000)); color: #0b0e15; font-weight: 800; clip-path: polygon(50% 0, 100% 35%, 100% 65%, 50% 100%, 0 65%, 0 35%);",
  "crownp": "background: var(--fx-c1); color: #0b0e15; font-weight: 800; clip-path: polygon(0 100%, 0 50%, 20% 30%, 35% 50%, 50% 10%, 65% 50%, 80% 30%, 100% 50%, 100% 100%);",
  "laurelp": "background: linear-gradient(90deg, color-mix(in srgb,var(--fx-c1) 62%,#000), var(--fx-c1), color-mix(in srgb,var(--fx-c1) 62%,#000)); color: #0b0e15; font-weight: 800; position: relative;",
  "wingp": "background: color-mix(in srgb,var(--fx-c1) 62%,#000); color: color-mix(in srgb,var(--fx-c1) 72%,#fff); border: 1px solid var(--fx-c1); clip-path: polygon(0 20%, 15% 0, 85% 0, 100% 20%, 100% 80%, 85% 100%, 15% 100%, 0 80%);",
  "bookp": "background: var(--fx-c1); color: #0b0e15; font-weight: 700; clip-path: polygon(0 0, 48% 0, 52% 8%, 100% 8%, 100% 100%, 0 100%);",
  "scrollp": "background: var(--fx-c1); color: #0b0e15; font-weight: 700; border-radius: 4px; box-shadow: 0 4px 0 -2px color-mix(in srgb,var(--fx-c1) 62%,#000), 0 -4px 0 -2px color-mix(in srgb,var(--fx-c1) 62%,#000);",
  "emblem": "background: color-mix(in srgb,var(--fx-c1) 62%,#000); color: color-mix(in srgb,var(--fx-c1) 72%,#fff); border: 2px solid var(--fx-c1); border-radius: 4px;",
  "emblem2": "background: #0b0e15; color: color-mix(in srgb,var(--fx-c1) 72%,#fff); border: 2px solid var(--fx-c1); border-radius: 50%; width: 120px; text-align: center; padding: 0;",
  "emblem3": "background: #0b0e15; color: color-mix(in srgb,var(--fx-c1) 72%,#fff); border: 2px solid var(--fx-c1); clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);",
  "frame": "background: color-mix(in srgb,var(--fx-c1) 62%,#000); color: color-mix(in srgb,var(--fx-c1) 72%,#fff); border: 4px solid var(--fx-c1); border-radius: 4px;",
  "frame2": "background: color-mix(in srgb,var(--fx-c1) 62%,#000); color: color-mix(in srgb,var(--fx-c1) 72%,#fff); border: 3px solid #8a6a30; box-shadow: 0 0 0 1px #2a1a08, inset 0 0 0 1px #2a1a08;",
  "frame3": "background: #2a1a10; color: color-mix(in srgb,var(--fx-c1) 72%,#fff); border: 3px solid #4a2a14;",
  "glassp": "background: color-mix(in srgb,var(--fx-c2) 8%,transparent); border: 1px solid color-mix(in srgb,var(--fx-c2) 25%,transparent); backdrop-filter: blur(6px);",
  "glassp2": "background: color-mix(in srgb,var(--fx-c2) 5%,transparent); border: 1px solid color-mix(in srgb,var(--fx-c2) 18%,transparent); backdrop-filter: blur(8px); box-shadow: inset 0 1px 0 color-mix(in srgb,var(--fx-c2) 20%,transparent);",
  "neonp": "background: #0b0e15; color: #fff; border: 1.5px solid var(--fx-c1); box-shadow: 0 0 6px var(--fx-c1), inset 0 0 6px var(--fx-c1); font-weight: 700;",
  "neonp2": "background: #0b0e15; color: #fff; border: 1.5px solid var(--fx-c1); box-shadow: 0 0 6px var(--fx-c1), 0 0 14px var(--fx-c2), inset 0 0 6px var(--fx-c1); font-weight: 700;",
  "led": "background: #0b0e15; color: color-mix(in srgb,var(--fx-c1) 72%,#fff); font-family: \"VT323\", \"JetBrains Mono\", monospace; border: 1px solid color-mix(in srgb,var(--fx-c1) 62%,#000); letter-spacing: 2px;",
  "lcd": "background: #0a1a14; color: #7cffb2; font-family: \"VT323\", monospace; border: 1px solid #1a3a2a;",
  "metal": "background: linear-gradient(180deg, color-mix(in srgb,var(--fx-c1) 72%,#fff), color-mix(in srgb,var(--fx-c1) 62%,#000)); color: #0b0e15; font-weight: 800; border: 1px solid var(--fx-c1); box-shadow: inset 0 1px 2px color-mix(in srgb,var(--fx-c2) 40%,transparent);",
  "metal2": "background: repeating-linear-gradient(90deg, transparent 0 3px, color-mix(in srgb,var(--fx-c2) 6%,transparent) 3px 4px), linear-gradient(180deg, color-mix(in srgb,var(--fx-c1) 72%,#fff), color-mix(in srgb,var(--fx-c1) 62%,#000)); color: #0b0e15; font-weight: 800; border: 1px solid var(--fx-c1);",
  "metal3": "background: linear-gradient(180deg, #e0a070, #8a4a20); color: #1a0a04; font-weight: 800; border: 1px solid #6a3a10;",
  "metal4": "background: linear-gradient(180deg, #e8eef5, #8a9aa8); color: #0b1018; font-weight: 800; border: 1px solid #6a7a88;",
  "metal5": "background: linear-gradient(180deg, #f0f4f8, #aab4c0); color: #0b1018; font-weight: 800;",
  "metal6": "background: linear-gradient(180deg, #f5f5f0, #d0d0c8); color: #0b0e15; font-weight: 800; border: 1px solid #b0b0a8;",
  "wood": "background: linear-gradient(180deg, #5a3418, #3a2010); color: #f0d0a0; border: 1px solid #2a1808; box-shadow: inset 0 1px 0 color-mix(in srgb,var(--fx-c2) 10%,transparent);",
  "wood2": "background: linear-gradient(180deg, #4a2814, #2a1408); color: #d0a070; border: 1px solid #1a0c04;",
  "wood3": "background: linear-gradient(180deg, #6a3a1c, #3a1e0c); color: #f0d0a0; border: 2px solid #2a1408; box-shadow: inset 0 0 8px rgba(0,0,0,.4);",
  "acrylic": "background: color-mix(in srgb,var(--fx-c2) 10%,transparent); border: 1px solid color-mix(in srgb,var(--fx-c2) 30%,transparent); backdrop-filter: blur(10px);",
  "acrylic2": "background: color-mix(in srgb,var(--fx-c2) 4%,transparent); border: 1px solid color-mix(in srgb,var(--fx-c2) 20%,transparent); backdrop-filter: blur(12px);",
  "marblep": "background: linear-gradient(135deg, #f5f5f5, #c9c9c9); color: #1a1a1a; font-weight: 800; border: 1px solid #a0a0a0;",
  "marblep2": "background: linear-gradient(135deg, #f5f5f5, #c9c9c9); color: #1a1a1a; font-weight: 800; border: 2px solid var(--fx-c1);",
  "leatherp": "background: linear-gradient(180deg, #4a2818, #2a1408); color: #f0d0a0; border: 1px solid #1a0c04; box-shadow: inset 0 0 12px rgba(0,0,0,.5);",
  "leatherp2": "background: #3a2010; color: #e0c090; border: 2px solid #5a3418; box-shadow: inset 0 1px 0 color-mix(in srgb,var(--fx-c2) 10%,transparent), inset 0 -1px 0 rgba(0,0,0,.4);",
  "paperp": "background: #f5f0e6; color: #2a2018; border: 1px solid #d0c8b8; box-shadow: 1px 1px 4px rgba(0,0,0,.2);",
  "paperp2": "background: #f5f0e6; color: #8a2010; border: 1px solid #8a2010; border-radius: 50px;",
  "washi": "background: #f5efe0; color: #2a2018; border: 1px solid #d0c8b0; box-shadow: inset 0 0 12px rgba(180,160,120,.2);",
  "carbonp": "background: linear-gradient(135deg, #1a1a1a, #0a0a0a); color: color-mix(in srgb,var(--fx-c1) 72%,#fff); border: 1px solid #333;",
  "crystalp": "background: linear-gradient(135deg, color-mix(in srgb,var(--fx-c2) 20%,transparent), color-mix(in srgb,var(--fx-c2) 5%,transparent)); border: 1px solid color-mix(in srgb,var(--fx-c2) 40%,transparent); backdrop-filter: blur(6px); color: #fff;",
  "crystalp2": "background: linear-gradient(105deg, transparent 0 30%, color-mix(in srgb,var(--fx-c2) 15%,transparent) 30% 33%, transparent 33% 66%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 66% 69%, transparent 69%); border: 1px solid color-mix(in srgb,var(--fx-c2) 30%,transparent); color: #fff;",
  "enamel": "background: linear-gradient(135deg, #1a1a2a, #0a0a14); color: color-mix(in srgb,var(--fx-c1) 72%,#fff); border: 1.5px solid var(--fx-c1); box-shadow: inset 0 1px 1px color-mix(in srgb,var(--fx-c2) 20%,transparent);",
  "enamel2": "background: linear-gradient(135deg, color-mix(in srgb,var(--fx-c1) 62%,#000), #0f131c); color: color-mix(in srgb,var(--fx-c1) 72%,#fff); border: 1.5px solid var(--fx-c1); box-shadow: inset 0 1px 1px color-mix(in srgb,var(--fx-c2) 20%,transparent), 0 0 8px -2px var(--fx-c1);",
  "gold": "background: linear-gradient(135deg, #f5dfae, #c9a15a, #8a6a30); color: #1a1208; font-weight: 800; border: 1px solid #8a6a30;",
  "gold2": "background: linear-gradient(135deg, #f5dfae, #c9a15a); color: #1a1208; font-weight: 800; border: 1px solid #6a4a20; box-shadow: inset 0 1px 2px color-mix(in srgb,var(--fx-c2) 50%,transparent);",
  "silverp": "background: linear-gradient(135deg, #f0f4f8, #b0bcc8); color: #0b1018; font-weight: 800; border: 1px solid #8090a0;",
  "brass": "background: linear-gradient(135deg, #e8c877, #a08030); color: #1a1408; font-weight: 800; border: 1px solid #806020;",
  "tech": "background: #0c1018; border: 1px solid var(--fx-c1); border-left: 3px solid var(--fx-c1); font-family: \"JetBrains Mono\", monospace; color: color-mix(in srgb,var(--fx-c1) 72%,#fff);",
  "holo": "background: linear-gradient(135deg, var(--fx-c1), var(--fx-c2)); color: #0b0e15; font-weight: 800; box-shadow: 0 0 10px -2px var(--fx-c1);",
  "minimal": "background: transparent; color: color-mix(in srgb,var(--fx-c1) 72%,#fff); border-bottom: 1.5px solid var(--fx-c1); border-radius: 0;",
  "minimal2": "background: transparent; color: color-mix(in srgb,var(--fx-c1) 72%,#fff); border-radius: 0; box-shadow: inset 4px 0 0 var(--fx-c1);"
 },
 "cor": {
  "metal": "background-image:radial-gradient(circle,transparent 52%,var(--fx-c2) 55% 64%,transparent 67%),radial-gradient(circle,transparent 52%,var(--fx-c2) 55% 64%,transparent 67%),radial-gradient(circle,transparent 52%,var(--fx-c2) 55% 64%,transparent 67%),radial-gradient(circle,transparent 52%,var(--fx-c2) 55% 64%,transparent 67%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:8px 8px;background-repeat:no-repeat;opacity:0.60",
  "metal2": "background-image:linear-gradient(color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)),color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2))),linear-gradient(color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)),color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2))),linear-gradient(color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)),color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2))),linear-gradient(color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)),color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)));background-position:0 0,100% 0,0 100%,100% 100%;background-size:8px 8px;background-repeat:no-repeat;opacity:0.70",
  "metalbold": "background-image:conic-gradient(from 45deg,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 25%,transparent 0),conic-gradient(from 45deg,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 25%,transparent 0),conic-gradient(from 45deg,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 25%,transparent 0),conic-gradient(from 45deg,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 25%,transparent 0);background-position:0 0,100% 0,0 100%,100% 100%;background-size:8px 8px;background-repeat:no-repeat;opacity:0.80;filter:drop-shadow(0 0 4px var(--fx-c1))",
  "cut": "background-image:radial-gradient(circle at 50% 50%,transparent 60%,var(--fx-c1) 63% 72%,transparent 75%),radial-gradient(circle at 50% 50%,transparent 60%,var(--fx-c1) 63% 72%,transparent 75%),radial-gradient(circle at 50% 50%,transparent 60%,var(--fx-c1) 63% 72%,transparent 75%),radial-gradient(circle at 50% 50%,transparent 60%,var(--fx-c1) 63% 72%,transparent 75%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:8px 8px;background-repeat:no-repeat;opacity:0.90",
  "cutthin": "background-image:radial-gradient(circle,var(--fx-c2) 0 1.6px,transparent 2px),radial-gradient(circle,var(--fx-c2) 0 1.6px,transparent 2px),radial-gradient(circle,var(--fx-c2) 0 1.6px,transparent 2px),radial-gradient(circle,var(--fx-c2) 0 1.6px,transparent 2px);background-position:0 0,100% 0,0 100%,100% 100%;background-size:8px 8px;background-repeat:no-repeat;opacity:0.50",
  "cutbold": "background-image:conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c1) 55%,transparent) 0 25%,transparent 0 50%,color-mix(in srgb,var(--fx-c1) 55%,transparent) 0 75%,transparent 0),conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c1) 55%,transparent) 0 25%,transparent 0 50%,color-mix(in srgb,var(--fx-c1) 55%,transparent) 0 75%,transparent 0),conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c1) 55%,transparent) 0 25%,transparent 0 50%,color-mix(in srgb,var(--fx-c1) 55%,transparent) 0 75%,transparent 0),conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c1) 55%,transparent) 0 25%,transparent 0 50%,color-mix(in srgb,var(--fx-c1) 55%,transparent) 0 75%,transparent 0);background-position:0 0,100% 0,0 100%,100% 100%;background-size:8px 8px;background-repeat:no-repeat;opacity:0.60;filter:drop-shadow(0 0 4px var(--fx-c1))",
  "dot": "background-image:linear-gradient(90deg,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 100%),linear-gradient(90deg,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 100%),linear-gradient(90deg,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 100%),linear-gradient(90deg,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 100%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:8px 8px;background-repeat:no-repeat;opacity:0.70",
  "dot2": "background-image:linear-gradient(135deg,var(--fx-c1),transparent 70%),linear-gradient(135deg,var(--fx-c1),transparent 70%),linear-gradient(135deg,var(--fx-c1),transparent 70%),linear-gradient(135deg,var(--fx-c1),transparent 70%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:8px 8px;background-repeat:no-repeat;opacity:0.80",
  "dotsrow": "background-image:radial-gradient(circle,var(--fx-c2) 0 40%,transparent 62%),radial-gradient(circle,var(--fx-c2) 0 40%,transparent 62%),radial-gradient(circle,var(--fx-c2) 0 40%,transparent 62%),radial-gradient(circle,var(--fx-c2) 0 40%,transparent 62%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:8px 8px;background-repeat:no-repeat;opacity:0.90;filter:drop-shadow(0 0 4px var(--fx-c1))",
  "rivet": "background-image:radial-gradient(circle,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 0 3px,transparent 3.4px),radial-gradient(circle,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 0 3px,transparent 3.4px),radial-gradient(circle,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 0 3px,transparent 3.4px),radial-gradient(circle,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 0 3px,transparent 3.4px);background-position:0 0,100% 0,0 100%,100% 100%;background-size:10px 10px;background-repeat:no-repeat;opacity:0.50",
  "geo": "background-image:radial-gradient(circle,transparent 52%,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 55% 64%,transparent 67%),radial-gradient(circle,transparent 52%,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 55% 64%,transparent 67%),radial-gradient(circle,transparent 52%,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 55% 64%,transparent 67%),radial-gradient(circle,transparent 52%,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 55% 64%,transparent 67%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:10px 10px;background-repeat:no-repeat;opacity:0.60",
  "geoline": "background-image:linear-gradient(var(--fx-c1),var(--fx-c1)),linear-gradient(var(--fx-c1),var(--fx-c1)),linear-gradient(var(--fx-c1),var(--fx-c1)),linear-gradient(var(--fx-c1),var(--fx-c1));background-position:0 0,100% 0,0 100%,100% 100%;background-size:10px 10px;background-repeat:no-repeat;opacity:0.70;filter:drop-shadow(0 0 4px var(--fx-c1))",
  "geo2": "background-image:conic-gradient(from 45deg,var(--fx-c2) 0 25%,transparent 0),conic-gradient(from 45deg,var(--fx-c2) 0 25%,transparent 0),conic-gradient(from 45deg,var(--fx-c2) 0 25%,transparent 0),conic-gradient(from 45deg,var(--fx-c2) 0 25%,transparent 0);background-position:0 0,100% 0,0 100%,100% 100%;background-size:10px 10px;background-repeat:no-repeat;opacity:0.80",
  "bracket": "background-image:radial-gradient(circle at 50% 50%,transparent 60%,color-mix(in srgb,var(--fx-c1) 55%,transparent) 63% 72%,transparent 75%),radial-gradient(circle at 50% 50%,transparent 60%,color-mix(in srgb,var(--fx-c1) 55%,transparent) 63% 72%,transparent 75%),radial-gradient(circle at 50% 50%,transparent 60%,color-mix(in srgb,var(--fx-c1) 55%,transparent) 63% 72%,transparent 75%),radial-gradient(circle at 50% 50%,transparent 60%,color-mix(in srgb,var(--fx-c1) 55%,transparent) 63% 72%,transparent 75%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:10px 10px;background-repeat:no-repeat;opacity:0.90",
  "bracket2": "background-image:radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 1.6px,transparent 2px),radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 1.6px,transparent 2px),radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 1.6px,transparent 2px),radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 1.6px,transparent 2px);background-position:0 0,100% 0,0 100%,100% 100%;background-size:10px 10px;background-repeat:no-repeat;opacity:0.50;filter:drop-shadow(0 0 4px var(--fx-c1))",
  "bracket3": "background-image:conic-gradient(from 0deg,var(--fx-c1) 0 25%,transparent 0 50%,var(--fx-c1) 0 75%,transparent 0),conic-gradient(from 0deg,var(--fx-c1) 0 25%,transparent 0 50%,var(--fx-c1) 0 75%,transparent 0),conic-gradient(from 0deg,var(--fx-c1) 0 25%,transparent 0 50%,var(--fx-c1) 0 75%,transparent 0),conic-gradient(from 0deg,var(--fx-c1) 0 25%,transparent 0 50%,var(--fx-c1) 0 75%,transparent 0);background-position:0 0,100% 0,0 100%,100% 100%;background-size:10px 10px;background-repeat:no-repeat;opacity:0.60",
  "braces": "background-image:linear-gradient(90deg,var(--fx-c2) 0 100%),linear-gradient(90deg,var(--fx-c2) 0 100%),linear-gradient(90deg,var(--fx-c2) 0 100%),linear-gradient(90deg,var(--fx-c2) 0 100%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:10px 10px;background-repeat:no-repeat;opacity:0.70",
  "chevron": "background-image:linear-gradient(135deg,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)),transparent 70%),linear-gradient(135deg,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)),transparent 70%),linear-gradient(135deg,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)),transparent 70%),linear-gradient(135deg,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)),transparent 70%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:10px 10px;background-repeat:no-repeat;opacity:0.80;filter:drop-shadow(0 0 4px var(--fx-c1))",
  "arrow": "background-image:radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 40%,transparent 62%),radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 40%,transparent 62%),radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 40%,transparent 62%),radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 40%,transparent 62%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:10px 10px;background-repeat:no-repeat;opacity:0.90",
  "plus": "background-image:radial-gradient(circle,var(--fx-c1) 0 3px,transparent 3.4px),radial-gradient(circle,var(--fx-c1) 0 3px,transparent 3.4px),radial-gradient(circle,var(--fx-c1) 0 3px,transparent 3.4px),radial-gradient(circle,var(--fx-c1) 0 3px,transparent 3.4px);background-position:0 0,100% 0,0 100%,100% 100%;background-size:12px 12px;background-repeat:no-repeat;opacity:0.50",
  "cross": "background-image:radial-gradient(circle,transparent 52%,var(--fx-c2) 55% 64%,transparent 67%),radial-gradient(circle,transparent 52%,var(--fx-c2) 55% 64%,transparent 67%),radial-gradient(circle,transparent 52%,var(--fx-c2) 55% 64%,transparent 67%),radial-gradient(circle,transparent 52%,var(--fx-c2) 55% 64%,transparent 67%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:12px 12px;background-repeat:no-repeat;opacity:0.60;filter:drop-shadow(0 0 4px var(--fx-c1))",
  "tri": "background-image:linear-gradient(color-mix(in srgb,var(--fx-c1) 55%,transparent),color-mix(in srgb,var(--fx-c1) 55%,transparent)),linear-gradient(color-mix(in srgb,var(--fx-c1) 55%,transparent),color-mix(in srgb,var(--fx-c1) 55%,transparent)),linear-gradient(color-mix(in srgb,var(--fx-c1) 55%,transparent),color-mix(in srgb,var(--fx-c1) 55%,transparent)),linear-gradient(color-mix(in srgb,var(--fx-c1) 55%,transparent),color-mix(in srgb,var(--fx-c1) 55%,transparent));background-position:0 0,100% 0,0 100%,100% 100%;background-size:12px 12px;background-repeat:no-repeat;opacity:0.70",
  "tri2": "background-image:conic-gradient(from 45deg,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 25%,transparent 0),conic-gradient(from 45deg,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 25%,transparent 0),conic-gradient(from 45deg,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 25%,transparent 0),conic-gradient(from 45deg,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 25%,transparent 0);background-position:0 0,100% 0,0 100%,100% 100%;background-size:12px 12px;background-repeat:no-repeat;opacity:0.80",
  "triple": "background-image:radial-gradient(circle at 50% 50%,transparent 60%,var(--fx-c1) 63% 72%,transparent 75%),radial-gradient(circle at 50% 50%,transparent 60%,var(--fx-c1) 63% 72%,transparent 75%),radial-gradient(circle at 50% 50%,transparent 60%,var(--fx-c1) 63% 72%,transparent 75%),radial-gradient(circle at 50% 50%,transparent 60%,var(--fx-c1) 63% 72%,transparent 75%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:12px 12px;background-repeat:no-repeat;opacity:0.90;filter:drop-shadow(0 0 4px var(--fx-c1))",
  "square": "background-image:radial-gradient(circle,var(--fx-c2) 0 1.6px,transparent 2px),radial-gradient(circle,var(--fx-c2) 0 1.6px,transparent 2px),radial-gradient(circle,var(--fx-c2) 0 1.6px,transparent 2px),radial-gradient(circle,var(--fx-c2) 0 1.6px,transparent 2px);background-position:0 0,100% 0,0 100%,100% 100%;background-size:12px 12px;background-repeat:no-repeat;opacity:0.50",
  "diamondc": "background-image:conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 0 25%,transparent 0 50%,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 0 75%,transparent 0),conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 0 25%,transparent 0 50%,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 0 75%,transparent 0),conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 0 25%,transparent 0 50%,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 0 75%,transparent 0),conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 0 25%,transparent 0 50%,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 0 75%,transparent 0);background-position:0 0,100% 0,0 100%,100% 100%;background-size:12px 12px;background-repeat:no-repeat;opacity:0.60",
  "hexc": "background-image:linear-gradient(90deg,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 100%),linear-gradient(90deg,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 100%),linear-gradient(90deg,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 100%),linear-gradient(90deg,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 100%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:12px 12px;background-repeat:no-repeat;opacity:0.70;filter:drop-shadow(0 0 4px var(--fx-c1))",
  "star": "background-image:linear-gradient(135deg,var(--fx-c1),transparent 70%),linear-gradient(135deg,var(--fx-c1),transparent 70%),linear-gradient(135deg,var(--fx-c1),transparent 70%),linear-gradient(135deg,var(--fx-c1),transparent 70%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:12px 12px;background-repeat:no-repeat;opacity:0.80",
  "circlec": "background-image:radial-gradient(circle,var(--fx-c2) 0 40%,transparent 62%),radial-gradient(circle,var(--fx-c2) 0 40%,transparent 62%),radial-gradient(circle,var(--fx-c2) 0 40%,transparent 62%),radial-gradient(circle,var(--fx-c2) 0 40%,transparent 62%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:12px 12px;background-repeat:no-repeat;opacity:0.90",
  "ring": "background-image:radial-gradient(circle,color-mix(in srgb,var(--fx-c1) 55%,transparent) 0 3px,transparent 3.4px),radial-gradient(circle,color-mix(in srgb,var(--fx-c1) 55%,transparent) 0 3px,transparent 3.4px),radial-gradient(circle,color-mix(in srgb,var(--fx-c1) 55%,transparent) 0 3px,transparent 3.4px),radial-gradient(circle,color-mix(in srgb,var(--fx-c1) 55%,transparent) 0 3px,transparent 3.4px);background-position:0 0,100% 0,0 100%,100% 100%;background-size:14px 14px;background-repeat:no-repeat;opacity:0.50;filter:drop-shadow(0 0 4px var(--fx-c1))",
  "orb": "background-image:radial-gradient(circle,transparent 52%,color-mix(in srgb,var(--fx-c2) 55%,transparent) 55% 64%,transparent 67%),radial-gradient(circle,transparent 52%,color-mix(in srgb,var(--fx-c2) 55%,transparent) 55% 64%,transparent 67%),radial-gradient(circle,transparent 52%,color-mix(in srgb,var(--fx-c2) 55%,transparent) 55% 64%,transparent 67%),radial-gradient(circle,transparent 52%,color-mix(in srgb,var(--fx-c2) 55%,transparent) 55% 64%,transparent 67%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:14px 14px;background-repeat:no-repeat;opacity:0.60",
  "line": "background-image:linear-gradient(var(--fx-c1),var(--fx-c1)),linear-gradient(var(--fx-c1),var(--fx-c1)),linear-gradient(var(--fx-c1),var(--fx-c1)),linear-gradient(var(--fx-c1),var(--fx-c1));background-position:0 0,100% 0,0 100%,100% 100%;background-size:14px 14px;background-repeat:no-repeat;opacity:0.70",
  "linebold": "background-image:conic-gradient(from 45deg,var(--fx-c2) 0 25%,transparent 0),conic-gradient(from 45deg,var(--fx-c2) 0 25%,transparent 0),conic-gradient(from 45deg,var(--fx-c2) 0 25%,transparent 0),conic-gradient(from 45deg,var(--fx-c2) 0 25%,transparent 0);background-position:0 0,100% 0,0 100%,100% 100%;background-size:14px 14px;background-repeat:no-repeat;opacity:0.80;filter:drop-shadow(0 0 4px var(--fx-c1))",
  "line2": "background-image:radial-gradient(circle at 50% 50%,transparent 60%,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 63% 72%,transparent 75%),radial-gradient(circle at 50% 50%,transparent 60%,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 63% 72%,transparent 75%),radial-gradient(circle at 50% 50%,transparent 60%,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 63% 72%,transparent 75%),radial-gradient(circle at 50% 50%,transparent 60%,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 63% 72%,transparent 75%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:14px 14px;background-repeat:no-repeat;opacity:0.90",
  "corner": "background-image:radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 1.6px,transparent 2px),radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 1.6px,transparent 2px),radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 1.6px,transparent 2px),radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 1.6px,transparent 2px);background-position:0 0,100% 0,0 100%,100% 100%;background-size:14px 14px;background-repeat:no-repeat;opacity:0.50",
  "corner2": "background-image:conic-gradient(from 0deg,var(--fx-c1) 0 25%,transparent 0 50%,var(--fx-c1) 0 75%,transparent 0),conic-gradient(from 0deg,var(--fx-c1) 0 25%,transparent 0 50%,var(--fx-c1) 0 75%,transparent 0),conic-gradient(from 0deg,var(--fx-c1) 0 25%,transparent 0 50%,var(--fx-c1) 0 75%,transparent 0),conic-gradient(from 0deg,var(--fx-c1) 0 25%,transparent 0 50%,var(--fx-c1) 0 75%,transparent 0);background-position:0 0,100% 0,0 100%,100% 100%;background-size:14px 14px;background-repeat:no-repeat;opacity:0.60;filter:drop-shadow(0 0 4px var(--fx-c1))",
  "fold": "background-image:linear-gradient(90deg,var(--fx-c2) 0 100%),linear-gradient(90deg,var(--fx-c2) 0 100%),linear-gradient(90deg,var(--fx-c2) 0 100%),linear-gradient(90deg,var(--fx-c2) 0 100%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:14px 14px;background-repeat:no-repeat;opacity:0.70",
  "tape": "background-image:linear-gradient(135deg,color-mix(in srgb,var(--fx-c1) 55%,transparent),transparent 70%),linear-gradient(135deg,color-mix(in srgb,var(--fx-c1) 55%,transparent),transparent 70%),linear-gradient(135deg,color-mix(in srgb,var(--fx-c1) 55%,transparent),transparent 70%),linear-gradient(135deg,color-mix(in srgb,var(--fx-c1) 55%,transparent),transparent 70%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:14px 14px;background-repeat:no-repeat;opacity:0.80",
  "tape2": "background-image:radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 40%,transparent 62%),radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 40%,transparent 62%),radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 40%,transparent 62%),radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 40%,transparent 62%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:14px 14px;background-repeat:no-repeat;opacity:0.90;filter:drop-shadow(0 0 4px var(--fx-c1))",
  "pin": "background-image:radial-gradient(circle,var(--fx-c1) 0 3px,transparent 3.4px),radial-gradient(circle,var(--fx-c1) 0 3px,transparent 3.4px),radial-gradient(circle,var(--fx-c1) 0 3px,transparent 3.4px),radial-gradient(circle,var(--fx-c1) 0 3px,transparent 3.4px);background-position:0 0,100% 0,0 100%,100% 100%;background-size:17px 17px;background-repeat:no-repeat;opacity:0.50",
  "clip": "background-image:radial-gradient(circle,transparent 52%,var(--fx-c2) 55% 64%,transparent 67%),radial-gradient(circle,transparent 52%,var(--fx-c2) 55% 64%,transparent 67%),radial-gradient(circle,transparent 52%,var(--fx-c2) 55% 64%,transparent 67%),radial-gradient(circle,transparent 52%,var(--fx-c2) 55% 64%,transparent 67%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:17px 17px;background-repeat:no-repeat;opacity:0.60",
  "ribbonc": "background-image:linear-gradient(color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)),color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2))),linear-gradient(color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)),color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2))),linear-gradient(color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)),color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2))),linear-gradient(color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)),color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)));background-position:0 0,100% 0,0 100%,100% 100%;background-size:17px 17px;background-repeat:no-repeat;opacity:0.70;filter:drop-shadow(0 0 4px var(--fx-c1))",
  "ribbon2": "background-image:conic-gradient(from 45deg,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 25%,transparent 0),conic-gradient(from 45deg,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 25%,transparent 0),conic-gradient(from 45deg,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 25%,transparent 0),conic-gradient(from 45deg,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 25%,transparent 0);background-position:0 0,100% 0,0 100%,100% 100%;background-size:17px 17px;background-repeat:no-repeat;opacity:0.80",
  "flag": "background-image:radial-gradient(circle at 50% 50%,transparent 60%,var(--fx-c1) 63% 72%,transparent 75%),radial-gradient(circle at 50% 50%,transparent 60%,var(--fx-c1) 63% 72%,transparent 75%),radial-gradient(circle at 50% 50%,transparent 60%,var(--fx-c1) 63% 72%,transparent 75%),radial-gradient(circle at 50% 50%,transparent 60%,var(--fx-c1) 63% 72%,transparent 75%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:17px 17px;background-repeat:no-repeat;opacity:0.90",
  "banner": "background-image:radial-gradient(circle,var(--fx-c2) 0 1.6px,transparent 2px),radial-gradient(circle,var(--fx-c2) 0 1.6px,transparent 2px),radial-gradient(circle,var(--fx-c2) 0 1.6px,transparent 2px),radial-gradient(circle,var(--fx-c2) 0 1.6px,transparent 2px);background-position:0 0,100% 0,0 100%,100% 100%;background-size:17px 17px;background-repeat:no-repeat;opacity:0.50;filter:drop-shadow(0 0 4px var(--fx-c1))",
  "seal": "background-image:conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c1) 55%,transparent) 0 25%,transparent 0 50%,color-mix(in srgb,var(--fx-c1) 55%,transparent) 0 75%,transparent 0),conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c1) 55%,transparent) 0 25%,transparent 0 50%,color-mix(in srgb,var(--fx-c1) 55%,transparent) 0 75%,transparent 0),conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c1) 55%,transparent) 0 25%,transparent 0 50%,color-mix(in srgb,var(--fx-c1) 55%,transparent) 0 75%,transparent 0),conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c1) 55%,transparent) 0 25%,transparent 0 50%,color-mix(in srgb,var(--fx-c1) 55%,transparent) 0 75%,transparent 0);background-position:0 0,100% 0,0 100%,100% 100%;background-size:17px 17px;background-repeat:no-repeat;opacity:0.60",
  "stamp": "background-image:linear-gradient(90deg,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 100%),linear-gradient(90deg,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 100%),linear-gradient(90deg,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 100%),linear-gradient(90deg,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 100%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:17px 17px;background-repeat:no-repeat;opacity:0.70",
  "coin": "background-image:linear-gradient(135deg,var(--fx-c1),transparent 70%),linear-gradient(135deg,var(--fx-c1),transparent 70%),linear-gradient(135deg,var(--fx-c1),transparent 70%),linear-gradient(135deg,var(--fx-c1),transparent 70%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:17px 17px;background-repeat:no-repeat;opacity:0.80;filter:drop-shadow(0 0 4px var(--fx-c1))",
  "gem": "background-image:radial-gradient(circle,var(--fx-c2) 0 40%,transparent 62%),radial-gradient(circle,var(--fx-c2) 0 40%,transparent 62%),radial-gradient(circle,var(--fx-c2) 0 40%,transparent 62%),radial-gradient(circle,var(--fx-c2) 0 40%,transparent 62%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:17px 17px;background-repeat:no-repeat;opacity:0.90",
  "crown": "background-image:radial-gradient(circle,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 0 3px,transparent 3.4px),radial-gradient(circle,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 0 3px,transparent 3.4px),radial-gradient(circle,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 0 3px,transparent 3.4px),radial-gradient(circle,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 0 3px,transparent 3.4px);background-position:0 0,100% 0,0 100%,100% 100%;background-size:21px 21px;background-repeat:no-repeat;opacity:0.50",
  "wing": "background-image:radial-gradient(circle,transparent 52%,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 55% 64%,transparent 67%),radial-gradient(circle,transparent 52%,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 55% 64%,transparent 67%),radial-gradient(circle,transparent 52%,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 55% 64%,transparent 67%),radial-gradient(circle,transparent 52%,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 55% 64%,transparent 67%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:21px 21px;background-repeat:no-repeat;opacity:0.60;filter:drop-shadow(0 0 4px var(--fx-c1))",
  "laurel": "background-image:linear-gradient(var(--fx-c1),var(--fx-c1)),linear-gradient(var(--fx-c1),var(--fx-c1)),linear-gradient(var(--fx-c1),var(--fx-c1)),linear-gradient(var(--fx-c1),var(--fx-c1));background-position:0 0,100% 0,0 100%,100% 100%;background-size:21px 21px;background-repeat:no-repeat;opacity:0.70",
  "crest": "background-image:conic-gradient(from 45deg,var(--fx-c2) 0 25%,transparent 0),conic-gradient(from 45deg,var(--fx-c2) 0 25%,transparent 0),conic-gradient(from 45deg,var(--fx-c2) 0 25%,transparent 0),conic-gradient(from 45deg,var(--fx-c2) 0 25%,transparent 0);background-position:0 0,100% 0,0 100%,100% 100%;background-size:21px 21px;background-repeat:no-repeat;opacity:0.80",
  "shieldc": "background-image:radial-gradient(circle at 50% 50%,transparent 60%,color-mix(in srgb,var(--fx-c1) 55%,transparent) 63% 72%,transparent 75%),radial-gradient(circle at 50% 50%,transparent 60%,color-mix(in srgb,var(--fx-c1) 55%,transparent) 63% 72%,transparent 75%),radial-gradient(circle at 50% 50%,transparent 60%,color-mix(in srgb,var(--fx-c1) 55%,transparent) 63% 72%,transparent 75%),radial-gradient(circle at 50% 50%,transparent 60%,color-mix(in srgb,var(--fx-c1) 55%,transparent) 63% 72%,transparent 75%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:21px 21px;background-repeat:no-repeat;opacity:0.90;filter:drop-shadow(0 0 4px var(--fx-c1))",
  "emblem": "background-image:radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 1.6px,transparent 2px),radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 1.6px,transparent 2px),radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 1.6px,transparent 2px),radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 1.6px,transparent 2px);background-position:0 0,100% 0,0 100%,100% 100%;background-size:21px 21px;background-repeat:no-repeat;opacity:0.50",
  "mono": "background-image:conic-gradient(from 0deg,var(--fx-c1) 0 25%,transparent 0 50%,var(--fx-c1) 0 75%,transparent 0),conic-gradient(from 0deg,var(--fx-c1) 0 25%,transparent 0 50%,var(--fx-c1) 0 75%,transparent 0),conic-gradient(from 0deg,var(--fx-c1) 0 25%,transparent 0 50%,var(--fx-c1) 0 75%,transparent 0),conic-gradient(from 0deg,var(--fx-c1) 0 25%,transparent 0 50%,var(--fx-c1) 0 75%,transparent 0);background-position:0 0,100% 0,0 100%,100% 100%;background-size:21px 21px;background-repeat:no-repeat;opacity:0.60",
  "half": "background-image:linear-gradient(90deg,var(--fx-c2) 0 100%),linear-gradient(90deg,var(--fx-c2) 0 100%),linear-gradient(90deg,var(--fx-c2) 0 100%),linear-gradient(90deg,var(--fx-c2) 0 100%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:21px 21px;background-repeat:no-repeat;opacity:0.70;filter:drop-shadow(0 0 4px var(--fx-c1))",
  "quarter": "background-image:linear-gradient(135deg,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)),transparent 70%),linear-gradient(135deg,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)),transparent 70%),linear-gradient(135deg,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)),transparent 70%),linear-gradient(135deg,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)),transparent 70%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:21px 21px;background-repeat:no-repeat;opacity:0.80",
  "split": "background-image:radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 40%,transparent 62%),radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 40%,transparent 62%),radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 40%,transparent 62%),radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 40%,transparent 62%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:21px 21px;background-repeat:no-repeat;opacity:0.90",
  "splash": "background-image:radial-gradient(circle,var(--fx-c1) 0 3px,transparent 3.4px),radial-gradient(circle,var(--fx-c1) 0 3px,transparent 3.4px),radial-gradient(circle,var(--fx-c1) 0 3px,transparent 3.4px),radial-gradient(circle,var(--fx-c1) 0 3px,transparent 3.4px);background-position:0 0,100% 0,0 100%,100% 100%;background-size:26px 26px;background-repeat:no-repeat;opacity:0.50;filter:drop-shadow(0 0 4px var(--fx-c1))",
  "spark": "background-image:radial-gradient(circle,transparent 52%,var(--fx-c2) 55% 64%,transparent 67%),radial-gradient(circle,transparent 52%,var(--fx-c2) 55% 64%,transparent 67%),radial-gradient(circle,transparent 52%,var(--fx-c2) 55% 64%,transparent 67%),radial-gradient(circle,transparent 52%,var(--fx-c2) 55% 64%,transparent 67%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:26px 26px;background-repeat:no-repeat;opacity:0.60",
  "beam": "background-image:linear-gradient(color-mix(in srgb,var(--fx-c1) 55%,transparent),color-mix(in srgb,var(--fx-c1) 55%,transparent)),linear-gradient(color-mix(in srgb,var(--fx-c1) 55%,transparent),color-mix(in srgb,var(--fx-c1) 55%,transparent)),linear-gradient(color-mix(in srgb,var(--fx-c1) 55%,transparent),color-mix(in srgb,var(--fx-c1) 55%,transparent)),linear-gradient(color-mix(in srgb,var(--fx-c1) 55%,transparent),color-mix(in srgb,var(--fx-c1) 55%,transparent));background-position:0 0,100% 0,0 100%,100% 100%;background-size:26px 26px;background-repeat:no-repeat;opacity:0.70",
  "grad": "background-image:conic-gradient(from 45deg,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 25%,transparent 0),conic-gradient(from 45deg,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 25%,transparent 0),conic-gradient(from 45deg,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 25%,transparent 0),conic-gradient(from 45deg,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 25%,transparent 0);background-position:0 0,100% 0,0 100%,100% 100%;background-size:26px 26px;background-repeat:no-repeat;opacity:0.80;filter:drop-shadow(0 0 4px var(--fx-c1))",
  "neon": "background-image:radial-gradient(circle at 50% 50%,transparent 60%,var(--fx-c1) 63% 72%,transparent 75%),radial-gradient(circle at 50% 50%,transparent 60%,var(--fx-c1) 63% 72%,transparent 75%),radial-gradient(circle at 50% 50%,transparent 60%,var(--fx-c1) 63% 72%,transparent 75%),radial-gradient(circle at 50% 50%,transparent 60%,var(--fx-c1) 63% 72%,transparent 75%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:26px 26px;background-repeat:no-repeat;opacity:0.90",
  "neon2": "background-image:radial-gradient(circle,var(--fx-c2) 0 1.6px,transparent 2px),radial-gradient(circle,var(--fx-c2) 0 1.6px,transparent 2px),radial-gradient(circle,var(--fx-c2) 0 1.6px,transparent 2px),radial-gradient(circle,var(--fx-c2) 0 1.6px,transparent 2px);background-position:0 0,100% 0,0 100%,100% 100%;background-size:26px 26px;background-repeat:no-repeat;opacity:0.50",
  "pixel": "background-image:conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 0 25%,transparent 0 50%,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 0 75%,transparent 0),conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 0 25%,transparent 0 50%,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 0 75%,transparent 0),conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 0 25%,transparent 0 50%,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 0 75%,transparent 0),conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 0 25%,transparent 0 50%,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 0 75%,transparent 0);background-position:0 0,100% 0,0 100%,100% 100%;background-size:26px 26px;background-repeat:no-repeat;opacity:0.60;filter:drop-shadow(0 0 4px var(--fx-c1))",
  "pixelc": "background-image:linear-gradient(90deg,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 100%),linear-gradient(90deg,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 100%),linear-gradient(90deg,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 100%),linear-gradient(90deg,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 100%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:26px 26px;background-repeat:no-repeat;opacity:0.70",
  "block": "background-image:linear-gradient(135deg,var(--fx-c1),transparent 70%),linear-gradient(135deg,var(--fx-c1),transparent 70%),linear-gradient(135deg,var(--fx-c1),transparent 70%),linear-gradient(135deg,var(--fx-c1),transparent 70%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:26px 26px;background-repeat:no-repeat;opacity:0.80",
  "step": "background-image:radial-gradient(circle,var(--fx-c2) 0 40%,transparent 62%),radial-gradient(circle,var(--fx-c2) 0 40%,transparent 62%),radial-gradient(circle,var(--fx-c2) 0 40%,transparent 62%),radial-gradient(circle,var(--fx-c2) 0 40%,transparent 62%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:26px 26px;background-repeat:no-repeat;opacity:0.90;filter:drop-shadow(0 0 4px var(--fx-c1))",
  "zigzagc": "background-image:radial-gradient(circle,color-mix(in srgb,var(--fx-c1) 55%,transparent) 0 3px,transparent 3.4px),radial-gradient(circle,color-mix(in srgb,var(--fx-c1) 55%,transparent) 0 3px,transparent 3.4px),radial-gradient(circle,color-mix(in srgb,var(--fx-c1) 55%,transparent) 0 3px,transparent 3.4px),radial-gradient(circle,color-mix(in srgb,var(--fx-c1) 55%,transparent) 0 3px,transparent 3.4px);background-position:0 0,100% 0,0 100%,100% 100%;background-size:32px 32px;background-repeat:no-repeat;opacity:0.50",
  "wavec": "background-image:radial-gradient(circle,transparent 52%,color-mix(in srgb,var(--fx-c2) 55%,transparent) 55% 64%,transparent 67%),radial-gradient(circle,transparent 52%,color-mix(in srgb,var(--fx-c2) 55%,transparent) 55% 64%,transparent 67%),radial-gradient(circle,transparent 52%,color-mix(in srgb,var(--fx-c2) 55%,transparent) 55% 64%,transparent 67%),radial-gradient(circle,transparent 52%,color-mix(in srgb,var(--fx-c2) 55%,transparent) 55% 64%,transparent 67%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:32px 32px;background-repeat:no-repeat;opacity:0.60",
  "spine": "background-image:linear-gradient(var(--fx-c1),var(--fx-c1)),linear-gradient(var(--fx-c1),var(--fx-c1)),linear-gradient(var(--fx-c1),var(--fx-c1)),linear-gradient(var(--fx-c1),var(--fx-c1));background-position:0 0,100% 0,0 100%,100% 100%;background-size:32px 32px;background-repeat:no-repeat;opacity:0.70;filter:drop-shadow(0 0 4px var(--fx-c1))",
  "tab": "background-image:conic-gradient(from 45deg,var(--fx-c2) 0 25%,transparent 0),conic-gradient(from 45deg,var(--fx-c2) 0 25%,transparent 0),conic-gradient(from 45deg,var(--fx-c2) 0 25%,transparent 0),conic-gradient(from 45deg,var(--fx-c2) 0 25%,transparent 0);background-position:0 0,100% 0,0 100%,100% 100%;background-size:32px 32px;background-repeat:no-repeat;opacity:0.80",
  "notchc": "background-image:radial-gradient(circle at 50% 50%,transparent 60%,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 63% 72%,transparent 75%),radial-gradient(circle at 50% 50%,transparent 60%,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 63% 72%,transparent 75%),radial-gradient(circle at 50% 50%,transparent 60%,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 63% 72%,transparent 75%),radial-gradient(circle at 50% 50%,transparent 60%,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 63% 72%,transparent 75%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:32px 32px;background-repeat:no-repeat;opacity:0.90",
  "bolt": "background-image:radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 1.6px,transparent 2px),radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 1.6px,transparent 2px),radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 1.6px,transparent 2px),radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 1.6px,transparent 2px);background-position:0 0,100% 0,0 100%,100% 100%;background-size:32px 32px;background-repeat:no-repeat;opacity:0.50;filter:drop-shadow(0 0 4px var(--fx-c1))",
  "wire": "background-image:conic-gradient(from 0deg,var(--fx-c1) 0 25%,transparent 0 50%,var(--fx-c1) 0 75%,transparent 0),conic-gradient(from 0deg,var(--fx-c1) 0 25%,transparent 0 50%,var(--fx-c1) 0 75%,transparent 0),conic-gradient(from 0deg,var(--fx-c1) 0 25%,transparent 0 50%,var(--fx-c1) 0 75%,transparent 0),conic-gradient(from 0deg,var(--fx-c1) 0 25%,transparent 0 50%,var(--fx-c1) 0 75%,transparent 0);background-position:0 0,100% 0,0 100%,100% 100%;background-size:32px 32px;background-repeat:no-repeat;opacity:0.60",
  "hollow": "background-image:linear-gradient(90deg,var(--fx-c2) 0 100%),linear-gradient(90deg,var(--fx-c2) 0 100%),linear-gradient(90deg,var(--fx-c2) 0 100%),linear-gradient(90deg,var(--fx-c2) 0 100%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:32px 32px;background-repeat:no-repeat;opacity:0.70",
  "full": "background-image:linear-gradient(135deg,color-mix(in srgb,var(--fx-c1) 55%,transparent),transparent 70%),linear-gradient(135deg,color-mix(in srgb,var(--fx-c1) 55%,transparent),transparent 70%),linear-gradient(135deg,color-mix(in srgb,var(--fx-c1) 55%,transparent),transparent 70%),linear-gradient(135deg,color-mix(in srgb,var(--fx-c1) 55%,transparent),transparent 70%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:32px 32px;background-repeat:no-repeat;opacity:0.80;filter:drop-shadow(0 0 4px var(--fx-c1))",
  "halfgrad": "background-image:radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 40%,transparent 62%),radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 40%,transparent 62%),radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 40%,transparent 62%),radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 40%,transparent 62%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:32px 32px;background-repeat:no-repeat;opacity:0.90"
 },
 "mo": {
  "shimmer": "background-image:linear-gradient(120deg,transparent 18%,color-mix(in srgb,var(--fx-c2) 38%,transparent) 50%,transparent 82%);background-size:200% 200%;background-repeat:no-repeat;animation:fxShimmer var(--fx-dur,5s) linear infinite",
  "shimmerslow": "background-image:repeating-linear-gradient(45deg,color-mix(in srgb,var(--fx-c2) 20%,transparent) 0 3px,transparent 3px 17px);background-size:200% 200%;background-repeat:no-repeat;animation:fxShimmer var(--fx-dur,9s) linear infinite",
  "shimmerfast": "background-image:conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c2) 30%,transparent),transparent 42%,color-mix(in srgb,var(--fx-c1) 28%,transparent) 72%,transparent);background-size:200% 200%;background-repeat:no-repeat;animation:fxShimmer var(--fx-dur,3s) linear infinite",
  "sheen": "background-image:radial-gradient(ellipse at 50% 100%,color-mix(in srgb,var(--fx-c2) 38%,transparent),transparent 66%);background-size:200% 200%;background-repeat:no-repeat;animation:fxShimmer var(--fx-dur,5s) linear infinite",
  "sheen2": "background-image:linear-gradient(0deg,color-mix(in srgb,var(--fx-c1) 34%,transparent),transparent 58%);background-size:200% 200%;background-repeat:no-repeat;animation:fxShimmer var(--fx-dur,5s) linear infinite",
  "float": "background-image:radial-gradient(circle at 30% 30%,color-mix(in srgb,var(--fx-c2) 42%,transparent),transparent 62%),radial-gradient(circle at 72% 74%,color-mix(in srgb,var(--fx-c1) 38%,transparent),transparent 62%);background-size:200% 200%;background-repeat:no-repeat;animation:fxFloat var(--fx-dur,5s) ease-in-out infinite",
  "float2": "background-image:linear-gradient(120deg,transparent 18%,color-mix(in srgb,var(--fx-c2) 38%,transparent) 50%,transparent 82%);background-size:200% 200%;background-repeat:no-repeat;animation:fxFloat var(--fx-dur,5s) ease-in-out infinite",
  "float3": "background-image:repeating-linear-gradient(45deg,color-mix(in srgb,var(--fx-c2) 20%,transparent) 0 3px,transparent 3px 17px);background-size:200% 200%;background-repeat:no-repeat;animation:fxFloat var(--fx-dur,5s) ease-in-out infinite",
  "hoverlift": "background-image:conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c2) 30%,transparent),transparent 42%,color-mix(in srgb,var(--fx-c1) 28%,transparent) 72%,transparent);background-size:200% 200%;background-repeat:no-repeat;animation:fxFloat var(--fx-dur,5s) ease-in-out infinite",
  "hoverscale": "background-image:radial-gradient(ellipse at 50% 100%,color-mix(in srgb,var(--fx-c2) 38%,transparent),transparent 66%);background-size:200% 200%;background-repeat:no-repeat;animation:fxFloat var(--fx-dur,5s) ease-in-out infinite",
  "hovershine": "background-image:linear-gradient(0deg,color-mix(in srgb,var(--fx-c1) 34%,transparent),transparent 58%);background-size:200% 200%;background-repeat:no-repeat;animation:fxShimmer var(--fx-dur,5s) linear infinite",
  "hoverglow": "background-image:radial-gradient(circle at 30% 30%,color-mix(in srgb,var(--fx-c2) 42%,transparent),transparent 62%),radial-gradient(circle at 72% 74%,color-mix(in srgb,var(--fx-c1) 38%,transparent),transparent 62%);background-size:200% 200%;background-repeat:no-repeat;animation:fxFloat var(--fx-dur,5s) ease-in-out infinite",
  "hoverrotate": "background-image:linear-gradient(120deg,transparent 18%,color-mix(in srgb,var(--fx-c2) 38%,transparent) 50%,transparent 82%);background-size:200% 200%;background-repeat:no-repeat;animation:fxFloat var(--fx-dur,5s) ease-in-out infinite",
  "hoverrise": "background-image:repeating-linear-gradient(45deg,color-mix(in srgb,var(--fx-c2) 20%,transparent) 0 3px,transparent 3px 17px);background-size:200% 200%;background-repeat:no-repeat;animation:fxFloat var(--fx-dur,5s) ease-in-out infinite",
  "parallax": "background-image:conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c2) 30%,transparent),transparent 42%,color-mix(in srgb,var(--fx-c1) 28%,transparent) 72%,transparent);background-size:200% 200%;background-repeat:no-repeat;animation:fxDrift var(--fx-dur,13s) ease-in-out infinite",
  "parallax2": "background-image:radial-gradient(ellipse at 50% 100%,color-mix(in srgb,var(--fx-c2) 38%,transparent),transparent 66%);background-size:200% 200%;background-repeat:no-repeat;animation:fxDrift var(--fx-dur,13s) ease-in-out infinite",
  "particle": "background-image:linear-gradient(0deg,color-mix(in srgb,var(--fx-c1) 34%,transparent),transparent 58%);background-size:200% 200%;background-repeat:no-repeat;animation:fxTwinkle var(--fx-dur,4s) ease-in-out infinite",
  "particle2": "background-image:radial-gradient(circle at 30% 30%,color-mix(in srgb,var(--fx-c2) 42%,transparent),transparent 62%),radial-gradient(circle at 72% 74%,color-mix(in srgb,var(--fx-c1) 38%,transparent),transparent 62%);background-size:200% 200%;background-repeat:no-repeat;animation:fxTwinkle var(--fx-dur,4s) ease-in-out infinite",
  "particle3": "background-image:linear-gradient(120deg,transparent 18%,color-mix(in srgb,var(--fx-c2) 38%,transparent) 50%,transparent 82%);background-size:200% 200%;background-repeat:no-repeat;animation:fxTwinkle var(--fx-dur,4s) ease-in-out infinite",
  "drift": "background-image:repeating-linear-gradient(45deg,color-mix(in srgb,var(--fx-c2) 20%,transparent) 0 3px,transparent 3px 17px);background-size:200% 200%;background-repeat:no-repeat;animation:fxDrift var(--fx-dur,13s) ease-in-out infinite",
  "drift2": "background-image:conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c2) 30%,transparent),transparent 42%,color-mix(in srgb,var(--fx-c1) 28%,transparent) 72%,transparent);background-size:200% 200%;background-repeat:no-repeat;animation:fxDrift var(--fx-dur,13s) ease-in-out infinite",
  "pulse": "background-image:radial-gradient(ellipse at 50% 100%,color-mix(in srgb,var(--fx-c2) 38%,transparent),transparent 66%);background-size:200% 200%;background-repeat:no-repeat;animation:fxGlowPulse var(--fx-dur,5s) ease-in-out infinite",
  "pulse2": "background-image:linear-gradient(0deg,color-mix(in srgb,var(--fx-c1) 34%,transparent),transparent 58%);background-size:200% 200%;background-repeat:no-repeat;animation:fxRipple var(--fx-dur,4.4s) ease-out infinite",
  "breath": "background-image:radial-gradient(circle at 30% 30%,color-mix(in srgb,var(--fx-c2) 42%,transparent),transparent 62%),radial-gradient(circle at 72% 74%,color-mix(in srgb,var(--fx-c1) 38%,transparent),transparent 62%);background-size:200% 200%;background-repeat:no-repeat;animation:fxBreathe var(--fx-dur,7s) ease-in-out infinite",
  "breathe": "background-image:linear-gradient(120deg,transparent 18%,color-mix(in srgb,var(--fx-c2) 38%,transparent) 50%,transparent 82%);background-size:200% 200%;background-repeat:no-repeat;animation:fxBreathe var(--fx-dur,7s) ease-in-out infinite",
  "breathelight": "background-image:repeating-linear-gradient(45deg,color-mix(in srgb,var(--fx-c2) 20%,transparent) 0 3px,transparent 3px 17px);background-size:200% 200%;background-repeat:no-repeat;animation:fxBreathe var(--fx-dur,7s) ease-in-out infinite",
  "rotate": "background-image:conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c2) 30%,transparent),transparent 42%,color-mix(in srgb,var(--fx-c1) 28%,transparent) 72%,transparent);background-size:200% 200%;background-repeat:no-repeat;animation:fxSpin var(--fx-dur,16s) linear infinite",
  "rotate2": "background-image:radial-gradient(ellipse at 50% 100%,color-mix(in srgb,var(--fx-c2) 38%,transparent),transparent 66%);background-size:200% 200%;background-repeat:no-repeat;animation:fxSpin var(--fx-dur,16s) linear infinite",
  "rotate3": "background-image:linear-gradient(0deg,color-mix(in srgb,var(--fx-c1) 34%,transparent),transparent 58%);background-size:200% 200%;background-repeat:no-repeat;animation:fxSpin var(--fx-dur,16s) linear infinite",
  "rotor": "background-image:radial-gradient(circle at 30% 30%,color-mix(in srgb,var(--fx-c2) 42%,transparent),transparent 62%),radial-gradient(circle at 72% 74%,color-mix(in srgb,var(--fx-c1) 38%,transparent),transparent 62%);background-size:200% 200%;background-repeat:no-repeat;animation:fxGlowPulse var(--fx-dur,6s) ease-in-out infinite",
  "wiggle": "background-image:linear-gradient(120deg,transparent 18%,color-mix(in srgb,var(--fx-c2) 38%,transparent) 50%,transparent 82%);background-size:200% 200%;background-repeat:no-repeat;animation:fxTilt var(--fx-dur,5s) ease-in-out infinite",
  "wobble": "background-image:repeating-linear-gradient(45deg,color-mix(in srgb,var(--fx-c2) 20%,transparent) 0 3px,transparent 3px 17px);background-size:200% 200%;background-repeat:no-repeat;animation:fxTilt var(--fx-dur,5s) ease-in-out infinite",
  "bounce": "background-image:conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c2) 30%,transparent),transparent 42%,color-mix(in srgb,var(--fx-c1) 28%,transparent) 72%,transparent);background-size:200% 200%;background-repeat:no-repeat;animation:fxBounce var(--fx-dur,3s) ease-in-out infinite",
  "shake": "background-image:radial-gradient(ellipse at 50% 100%,color-mix(in srgb,var(--fx-c2) 38%,transparent),transparent 66%);background-size:200% 200%;background-repeat:no-repeat;animation:fxShake var(--fx-dur,1.6s) ease-in-out infinite",
  "wavem": "background-image:linear-gradient(0deg,color-mix(in srgb,var(--fx-c1) 34%,transparent),transparent 58%);background-size:200% 200%;background-repeat:no-repeat;animation:fxWave var(--fx-dur,5s) ease-in-out infinite",
  "ripple": "background-image:radial-gradient(circle at 30% 30%,color-mix(in srgb,var(--fx-c2) 42%,transparent),transparent 62%),radial-gradient(circle at 72% 74%,color-mix(in srgb,var(--fx-c1) 38%,transparent),transparent 62%);background-size:200% 200%;background-repeat:no-repeat;animation:fxRipple var(--fx-dur,4.4s) ease-out infinite",
  "ripple2": "background-image:linear-gradient(120deg,transparent 18%,color-mix(in srgb,var(--fx-c2) 38%,transparent) 50%,transparent 82%);background-size:200% 200%;background-repeat:no-repeat;animation:fxRipple var(--fx-dur,4.4s) ease-out infinite",
  "blink": "background-image:repeating-linear-gradient(45deg,color-mix(in srgb,var(--fx-c2) 20%,transparent) 0 3px,transparent 3px 17px);background-size:200% 200%;background-repeat:no-repeat;animation:fxBlink var(--fx-dur,3.2s) ease-in-out infinite",
  "blink2": "background-image:conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c2) 30%,transparent),transparent 42%,color-mix(in srgb,var(--fx-c1) 28%,transparent) 72%,transparent);background-size:200% 200%;background-repeat:no-repeat;animation:fxBlink var(--fx-dur,3.2s) ease-in-out infinite",
  "flicker": "background-image:radial-gradient(ellipse at 50% 100%,color-mix(in srgb,var(--fx-c2) 38%,transparent),transparent 66%);background-size:200% 200%;background-repeat:no-repeat;animation:fxFlicker var(--fx-dur,3s) linear infinite",
  "strobe": "background-image:linear-gradient(0deg,color-mix(in srgb,var(--fx-c1) 34%,transparent),transparent 58%);background-size:200% 200%;background-repeat:no-repeat;animation:fxBlink var(--fx-dur,3.2s) ease-in-out infinite",
  "fadein": "background-image:radial-gradient(circle at 30% 30%,color-mix(in srgb,var(--fx-c2) 42%,transparent),transparent 62%),radial-gradient(circle at 72% 74%,color-mix(in srgb,var(--fx-c1) 38%,transparent),transparent 62%);background-size:200% 200%;background-repeat:no-repeat;animation:fxRise var(--fx-dur,3.6s) ease-out infinite",
  "fadeup": "background-image:linear-gradient(120deg,transparent 18%,color-mix(in srgb,var(--fx-c2) 38%,transparent) 50%,transparent 82%);background-size:200% 200%;background-repeat:no-repeat;animation:fxBreathe var(--fx-dur,5s) ease-in-out infinite",
  "fadedown": "background-image:repeating-linear-gradient(45deg,color-mix(in srgb,var(--fx-c2) 20%,transparent) 0 3px,transparent 3px 17px);background-size:200% 200%;background-repeat:no-repeat;animation:fxDrift var(--fx-dur,6s) ease-in-out infinite",
  "fadeside": "background-image:conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c2) 30%,transparent),transparent 42%,color-mix(in srgb,var(--fx-c1) 28%,transparent) 72%,transparent);background-size:200% 200%;background-repeat:no-repeat;animation:fxTwinkle var(--fx-dur,7s) ease-in-out infinite",
  "scalein": "background-image:radial-gradient(ellipse at 50% 100%,color-mix(in srgb,var(--fx-c2) 38%,transparent),transparent 66%);background-size:200% 200%;background-repeat:no-repeat;animation:fxScale var(--fx-dur,5s) ease-out infinite",
  "spin": "background-image:linear-gradient(0deg,color-mix(in srgb,var(--fx-c1) 34%,transparent),transparent 58%);background-size:200% 200%;background-repeat:no-repeat;animation:fxSpin var(--fx-dur,16s) linear infinite",
  "spin3d": "background-image:radial-gradient(circle at 30% 30%,color-mix(in srgb,var(--fx-c2) 42%,transparent),transparent 62%),radial-gradient(circle at 72% 74%,color-mix(in srgb,var(--fx-c1) 38%,transparent),transparent 62%);background-size:200% 200%;background-repeat:no-repeat;animation:fxSpin var(--fx-dur,16s) linear infinite",
  "flip": "background-image:linear-gradient(120deg,transparent 18%,color-mix(in srgb,var(--fx-c2) 38%,transparent) 50%,transparent 82%);background-size:200% 200%;background-repeat:no-repeat;animation:fxSpin var(--fx-dur,12s) linear infinite;transform-origin:center",
  "flipx": "background-image:repeating-linear-gradient(45deg,color-mix(in srgb,var(--fx-c2) 20%,transparent) 0 3px,transparent 3px 17px);background-size:200% 200%;background-repeat:no-repeat;animation:fxSpin var(--fx-dur,12s) linear infinite;transform-origin:center",
  "tilt": "background-image:conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c2) 30%,transparent),transparent 42%,color-mix(in srgb,var(--fx-c1) 28%,transparent) 72%,transparent);background-size:200% 200%;background-repeat:no-repeat;animation:fxTilt var(--fx-dur,5s) ease-in-out infinite",
  "tilt2": "background-image:radial-gradient(ellipse at 50% 100%,color-mix(in srgb,var(--fx-c2) 38%,transparent),transparent 66%);background-size:200% 200%;background-repeat:no-repeat;animation:fxTilt var(--fx-dur,5s) ease-in-out infinite",
  "glitch": "background-image:linear-gradient(0deg,color-mix(in srgb,var(--fx-c1) 34%,transparent),transparent 58%);background-size:200% 200%;background-repeat:no-repeat;animation:fxGlitch var(--fx-dur,3s) steps(2,end) infinite",
  "glitch2": "background-image:radial-gradient(circle at 30% 30%,color-mix(in srgb,var(--fx-c2) 42%,transparent),transparent 62%),radial-gradient(circle at 72% 74%,color-mix(in srgb,var(--fx-c1) 38%,transparent),transparent 62%);background-size:200% 200%;background-repeat:no-repeat;animation:fxGlitch var(--fx-dur,3s) steps(2,end) infinite",
  "glitch3": "background-image:linear-gradient(120deg,transparent 18%,color-mix(in srgb,var(--fx-c2) 38%,transparent) 50%,transparent 82%);background-size:200% 200%;background-repeat:no-repeat;animation:fxGlitch var(--fx-dur,3s) steps(2,end) infinite",
  "scan": "background-image:repeating-linear-gradient(45deg,color-mix(in srgb,var(--fx-c2) 20%,transparent) 0 3px,transparent 3px 17px);background-size:200% 200%;background-repeat:no-repeat;animation:fxFlow var(--fx-dur,6s) linear infinite",
  "scan2": "background-image:conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c2) 30%,transparent),transparent 42%,color-mix(in srgb,var(--fx-c1) 28%,transparent) 72%,transparent);background-size:200% 200%;background-repeat:no-repeat;animation:fxFlow var(--fx-dur,6s) linear infinite",
  "scanline": "background-image:radial-gradient(ellipse at 50% 100%,color-mix(in srgb,var(--fx-c2) 38%,transparent),transparent 66%);background-size:200% 200%;background-repeat:no-repeat;animation:fxFlow var(--fx-dur,6s) linear infinite",
  "hologram": "background-image:linear-gradient(0deg,color-mix(in srgb,var(--fx-c1) 34%,transparent),transparent 58%);background-size:200% 200%;background-repeat:no-repeat;animation:fxGlowPulse var(--fx-dur,5s) ease-in-out infinite;filter:hue-rotate(20deg)",
  "matrix": "background-image:radial-gradient(circle at 30% 30%,color-mix(in srgb,var(--fx-c2) 42%,transparent),transparent 62%),radial-gradient(circle at 72% 74%,color-mix(in srgb,var(--fx-c1) 38%,transparent),transparent 62%);background-size:200% 200%;background-repeat:no-repeat;animation:fxFlow var(--fx-dur,6s) linear infinite",
  "type": "background-image:linear-gradient(120deg,transparent 18%,color-mix(in srgb,var(--fx-c2) 38%,transparent) 50%,transparent 82%);background-size:200% 200%;background-repeat:no-repeat;animation:fxTypeIn var(--fx-dur,4s) steps(20,end) infinite",
  "typeloop": "background-image:repeating-linear-gradient(45deg,color-mix(in srgb,var(--fx-c2) 20%,transparent) 0 3px,transparent 3px 17px);background-size:200% 200%;background-repeat:no-repeat;animation:fxTypeIn var(--fx-dur,4s) steps(20,end) infinite",
  "reveal": "background-image:conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c2) 30%,transparent),transparent 42%,color-mix(in srgb,var(--fx-c1) 28%,transparent) 72%,transparent);background-size:200% 200%;background-repeat:no-repeat;animation:fxRise var(--fx-dur,3.6s) ease-out infinite",
  "reveal2": "background-image:radial-gradient(ellipse at 50% 100%,color-mix(in srgb,var(--fx-c2) 38%,transparent),transparent 66%);background-size:200% 200%;background-repeat:no-repeat;animation:fxRise var(--fx-dur,3.6s) ease-out infinite",
  "clip": "background-image:linear-gradient(0deg,color-mix(in srgb,var(--fx-c1) 34%,transparent),transparent 58%);background-size:200% 200%;background-repeat:no-repeat;animation:fxPulse var(--fx-dur,6s) ease-in-out infinite",
  "wipe": "background-image:radial-gradient(circle at 30% 30%,color-mix(in srgb,var(--fx-c2) 42%,transparent),transparent 62%),radial-gradient(circle at 72% 74%,color-mix(in srgb,var(--fx-c1) 38%,transparent),transparent 62%);background-size:200% 200%;background-repeat:no-repeat;animation:fxScale var(--fx-dur,7s) ease-in-out infinite",
  "zoom": "background-image:linear-gradient(120deg,transparent 18%,color-mix(in srgb,var(--fx-c2) 38%,transparent) 50%,transparent 82%);background-size:200% 200%;background-repeat:no-repeat;animation:fxScale var(--fx-dur,5s) ease-out infinite",
  "zoom2": "background-image:repeating-linear-gradient(45deg,color-mix(in srgb,var(--fx-c2) 20%,transparent) 0 3px,transparent 3px 17px);background-size:200% 200%;background-repeat:no-repeat;animation:fxScale var(--fx-dur,5s) ease-out infinite",
  "pan": "background-image:conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c2) 30%,transparent),transparent 42%,color-mix(in srgb,var(--fx-c1) 28%,transparent) 72%,transparent);background-size:200% 200%;background-repeat:no-repeat;animation:fxDrift var(--fx-dur,13s) ease-in-out infinite",
  "orbit": "background-image:radial-gradient(ellipse at 50% 100%,color-mix(in srgb,var(--fx-c2) 38%,transparent),transparent 66%);background-size:200% 200%;background-repeat:no-repeat;animation:fxOrbit var(--fx-dur,8s) linear infinite",
  "orbit2": "background-image:linear-gradient(0deg,color-mix(in srgb,var(--fx-c1) 34%,transparent),transparent 58%);background-size:200% 200%;background-repeat:no-repeat;animation:fxOrbit var(--fx-dur,8s) linear infinite",
  "comet": "background-image:radial-gradient(circle at 30% 30%,color-mix(in srgb,var(--fx-c2) 42%,transparent),transparent 62%),radial-gradient(circle at 72% 74%,color-mix(in srgb,var(--fx-c1) 38%,transparent),transparent 62%);background-size:200% 200%;background-repeat:no-repeat;animation:fxShine var(--fx-dur,3.4s) linear infinite",
  "magnet": "background-image:linear-gradient(120deg,transparent 18%,color-mix(in srgb,var(--fx-c2) 38%,transparent) 50%,transparent 82%);background-size:200% 200%;background-repeat:no-repeat;animation:fxPulse var(--fx-dur,7s) ease-in-out infinite",
  "glowwave": "background-image:repeating-linear-gradient(45deg,color-mix(in srgb,var(--fx-c2) 20%,transparent) 0 3px,transparent 3px 17px);background-size:200% 200%;background-repeat:no-repeat;animation:fxGlowPulse var(--fx-dur,4.6s) ease-in-out infinite",
  "shockwave": "background-image:conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c2) 30%,transparent),transparent 42%,color-mix(in srgb,var(--fx-c1) 28%,transparent) 72%,transparent);background-size:200% 200%;background-repeat:no-repeat;animation:fxRipple var(--fx-dur,4.4s) ease-out infinite",
  "focus": "background-image:radial-gradient(ellipse at 50% 100%,color-mix(in srgb,var(--fx-c2) 38%,transparent),transparent 66%);background-size:200% 200%;background-repeat:no-repeat;animation:fxGlowPulse var(--fx-dur,6.5s) ease-in-out infinite;filter:saturate(1.12)",
  "unfocus": "background-image:linear-gradient(0deg,color-mix(in srgb,var(--fx-c1) 34%,transparent),transparent 58%);background-size:200% 200%;background-repeat:no-repeat;animation:fxGlowPulse var(--fx-dur,6.5s) ease-in-out infinite;filter:saturate(1.12)",
  "blur": "background-image:radial-gradient(circle at 30% 30%,color-mix(in srgb,var(--fx-c2) 42%,transparent),transparent 62%),radial-gradient(circle at 72% 74%,color-mix(in srgb,var(--fx-c1) 38%,transparent),transparent 62%);background-size:200% 200%;background-repeat:no-repeat;animation:fxGlowPulse var(--fx-dur,6.5s) ease-in-out infinite;filter:saturate(1.12)",
  "sharpen": "background-image:linear-gradient(120deg,transparent 18%,color-mix(in srgb,var(--fx-c2) 38%,transparent) 50%,transparent 82%);background-size:200% 200%;background-repeat:no-repeat;animation:fxTilt var(--fx-dur,6s) ease-in-out infinite",
  "tint": "background-image:repeating-linear-gradient(45deg,color-mix(in srgb,var(--fx-c2) 20%,transparent) 0 3px,transparent 3px 17px);background-size:200% 200%;background-repeat:no-repeat;animation:fxGlowPulse var(--fx-dur,7s) ease-in-out infinite;filter:hue-rotate(12deg) saturate(1.2)",
  "saturate": "background-image:conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c2) 30%,transparent),transparent 42%,color-mix(in srgb,var(--fx-c1) 28%,transparent) 72%,transparent);background-size:200% 200%;background-repeat:no-repeat;animation:fxGlowPulse var(--fx-dur,7s) ease-in-out infinite;filter:hue-rotate(12deg) saturate(1.2)",
  "bright": "background-image:radial-gradient(ellipse at 50% 100%,color-mix(in srgb,var(--fx-c2) 38%,transparent),transparent 66%);background-size:200% 200%;background-repeat:no-repeat;animation:fxScale var(--fx-dur,9s) ease-in-out infinite",
  "contrast": "background-image:linear-gradient(0deg,color-mix(in srgb,var(--fx-c1) 34%,transparent),transparent 58%);background-size:200% 200%;background-repeat:no-repeat;animation:fxGlowPulse var(--fx-dur,7s) ease-in-out infinite;filter:hue-rotate(12deg) saturate(1.2)",
  "invert": "background-image:radial-gradient(circle at 30% 30%,color-mix(in srgb,var(--fx-c2) 42%,transparent),transparent 62%),radial-gradient(circle at 72% 74%,color-mix(in srgb,var(--fx-c1) 38%,transparent),transparent 62%);background-size:200% 200%;background-repeat:no-repeat;animation:fxDrift var(--fx-dur,4s) ease-in-out infinite",
  "ghost": "background-image:linear-gradient(120deg,transparent 18%,color-mix(in srgb,var(--fx-c2) 38%,transparent) 50%,transparent 82%);background-size:200% 200%;background-repeat:no-repeat;animation:fxTwinkle var(--fx-dur,5s) ease-in-out infinite",
  "liquid": "background-image:repeating-linear-gradient(45deg,color-mix(in srgb,var(--fx-c2) 20%,transparent) 0 3px,transparent 3px 17px);background-size:200% 200%;background-repeat:no-repeat;animation:fxWave var(--fx-dur,6s) ease-in-out infinite",
  "neonpulse": "background-image:conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c2) 30%,transparent),transparent 42%,color-mix(in srgb,var(--fx-c1) 28%,transparent) 72%,transparent);background-size:200% 200%;background-repeat:no-repeat;animation:fxGlowPulse var(--fx-dur,3s) ease-in-out infinite"
 },
 "hl": {
  "solid": "background-image:radial-gradient(circle at 50% 50%,transparent 40%,var(--fx-c2) 41% 47%,transparent 49%);background-size:120% 120%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.42",
  "double": "background-image:radial-gradient(circle at 50% 50%,transparent 40%,var(--fx-c1) 41% 42.5%,transparent 44%,transparent 48%,var(--fx-c1) 49% 50.5%,transparent 52%);background-size:120% 120%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.54",
  "triple": "background-image:radial-gradient(circle at 50% 50%,var(--fx-c2) 0,transparent 58%);background-size:120% 120%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.66",
  "dotted": "background-image:radial-gradient(ellipse at 50% 50%,var(--fx-c1) 0,transparent 66%);background-size:120% 120%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.78",
  "dashed": "background-image:repeating-conic-gradient(from 0deg,var(--fx-c2) 0 2deg,transparent 2deg 12deg);background-size:120% 120%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.30",
  "glow": "background-image:repeating-conic-gradient(from 0deg,var(--fx-c1) 0 8deg,transparent 8deg 18deg);background-size:120% 120%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.42",
  "glow2": "background-image:repeating-conic-gradient(from 0deg,var(--fx-c2) 0 40deg,transparent 40deg 60deg);background-size:120% 120%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.54",
  "glowsoft": "background-image:conic-gradient(from 0deg,var(--fx-c1),transparent 40%,var(--fx-c1) 70%,transparent);background-size:120% 120%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.66",
  "breath": "background-image:radial-gradient(circle at 50% 8%,var(--fx-c2) 0 2px,transparent 3px),radial-gradient(circle at 50% 92%,var(--fx-c2) 0 2px,transparent 3px),radial-gradient(circle at 8% 50%,var(--fx-c2) 0 2px,transparent 3px),radial-gradient(circle at 92% 50%,var(--fx-c2) 0 2px,transparent 3px);background-size:120% 120%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.78",
  "pulse": "background-image:radial-gradient(circle at 50% 50%,transparent 30%,color-mix(in srgb,var(--fx-c1) 45%,transparent) 62%,transparent 78%);background-size:120% 120%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.30",
  "pulse2": "background-image:conic-gradient(from 180deg at 50% 50%,var(--fx-c2) 0 12deg,transparent 12deg 348deg);background-size:120% 120%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.42",
  "sonar": "background-image:radial-gradient(circle at 50% 50%,transparent 44%,var(--fx-c1) 45% 46.5%,transparent 48%);background-size:160% 160%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.54",
  "spin": "background-image:radial-gradient(circle at 50% 50%,transparent 40%,var(--fx-c2) 41% 47%,transparent 49%);background-size:160% 160%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.66",
  "spin2": "background-image:radial-gradient(circle at 50% 50%,transparent 40%,var(--fx-c1) 41% 42.5%,transparent 44%,transparent 48%,var(--fx-c1) 49% 50.5%,transparent 52%);background-size:160% 160%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.78",
  "spin3": "background-image:radial-gradient(circle at 50% 50%,var(--fx-c2) 0,transparent 58%);background-size:160% 160%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.30",
  "spindash": "background-image:radial-gradient(ellipse at 50% 50%,var(--fx-c1) 0,transparent 66%);background-size:160% 160%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.42",
  "spindash2": "background-image:repeating-conic-gradient(from 0deg,var(--fx-c2) 0 2deg,transparent 2deg 12deg);background-size:160% 160%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.54",
  "rotateconic": "background-image:repeating-conic-gradient(from 0deg,var(--fx-c1) 0 8deg,transparent 8deg 18deg);background-size:160% 160%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.66",
  "rotatearc": "background-image:repeating-conic-gradient(from 0deg,var(--fx-c2) 0 40deg,transparent 40deg 60deg);background-size:160% 160%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.78",
  "comet": "background-image:conic-gradient(from 0deg,var(--fx-c1),transparent 40%,var(--fx-c1) 70%,transparent);background-size:160% 160%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.30",
  "dashcomet": "background-image:radial-gradient(circle at 50% 8%,var(--fx-c2) 0 2px,transparent 3px),radial-gradient(circle at 50% 92%,var(--fx-c2) 0 2px,transparent 3px),radial-gradient(circle at 8% 50%,var(--fx-c2) 0 2px,transparent 3px),radial-gradient(circle at 92% 50%,var(--fx-c2) 0 2px,transparent 3px);background-size:160% 160%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.42",
  "orbit": "background-image:radial-gradient(circle at 50% 50%,transparent 30%,color-mix(in srgb,var(--fx-c1) 45%,transparent) 62%,transparent 78%);background-size:160% 160%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.54",
  "orbit2": "background-image:conic-gradient(from 180deg at 50% 50%,var(--fx-c2) 0 12deg,transparent 12deg 348deg);background-size:160% 160%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.66",
  "ringglow": "background-image:radial-gradient(circle at 50% 50%,transparent 44%,var(--fx-c1) 45% 46.5%,transparent 48%);background-size:200% 200%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.78",
  "ringglow2": "background-image:radial-gradient(circle at 50% 50%,transparent 40%,var(--fx-c2) 41% 47%,transparent 49%);background-size:200% 200%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.30",
  "halo": "background-image:radial-gradient(circle at 50% 50%,transparent 40%,var(--fx-c1) 41% 42.5%,transparent 44%,transparent 48%,var(--fx-c1) 49% 50.5%,transparent 52%);background-size:200% 200%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.42",
  "halorot": "background-image:radial-gradient(circle at 50% 50%,var(--fx-c2) 0,transparent 58%);background-size:200% 200%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.54",
  "halorot2": "background-image:radial-gradient(ellipse at 50% 50%,var(--fx-c1) 0,transparent 66%);background-size:200% 200%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.66",
  "dotring": "background-image:repeating-conic-gradient(from 0deg,var(--fx-c2) 0 2deg,transparent 2deg 12deg);background-size:200% 200%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.78",
  "dotring2": "background-image:repeating-conic-gradient(from 0deg,var(--fx-c1) 0 8deg,transparent 8deg 18deg);background-size:200% 200%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.30",
  "dotring3": "background-image:repeating-conic-gradient(from 0deg,var(--fx-c2) 0 40deg,transparent 40deg 60deg);background-size:200% 200%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.42",
  "starring": "background-image:conic-gradient(from 0deg,var(--fx-c1),transparent 40%,var(--fx-c1) 70%,transparent);background-size:200% 200%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.54",
  "stardust": "background-image:radial-gradient(circle at 50% 8%,var(--fx-c2) 0 2px,transparent 3px),radial-gradient(circle at 50% 92%,var(--fx-c2) 0 2px,transparent 3px),radial-gradient(circle at 8% 50%,var(--fx-c2) 0 2px,transparent 3px),radial-gradient(circle at 92% 50%,var(--fx-c2) 0 2px,transparent 3px);background-size:200% 200%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.66",
  "sparklering": "background-image:radial-gradient(circle at 50% 50%,transparent 30%,color-mix(in srgb,var(--fx-c1) 45%,transparent) 62%,transparent 78%);background-size:200% 200%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.78",
  "diamondring": "background-image:conic-gradient(from 180deg at 50% 50%,var(--fx-c2) 0 12deg,transparent 12deg 348deg);background-size:200% 200%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.30",
  "hexring": "background-image:radial-gradient(circle at 50% 50%,transparent 44%,var(--fx-c1) 45% 46.5%,transparent 48%);background-size:240% 240%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.42;animation:fxSpin var(--fx-dur,18s) linear infinite",
  "trianglering": "background-image:radial-gradient(circle at 50% 50%,transparent 40%,var(--fx-c2) 41% 47%,transparent 49%);background-size:240% 240%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.54;animation:fxSpin var(--fx-dur,18s) linear infinite",
  "squarering": "background-image:radial-gradient(circle at 50% 50%,transparent 40%,var(--fx-c1) 41% 42.5%,transparent 44%,transparent 48%,var(--fx-c1) 49% 50.5%,transparent 52%);background-size:240% 240%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.66;animation:fxSpin var(--fx-dur,18s) linear infinite",
  "crossring": "background-image:radial-gradient(circle at 50% 50%,var(--fx-c2) 0,transparent 58%);background-size:240% 240%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.78;animation:fxSpin var(--fx-dur,18s) linear infinite",
  "gearring": "background-image:radial-gradient(ellipse at 50% 50%,var(--fx-c1) 0,transparent 66%);background-size:240% 240%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.30;animation:fxSpin var(--fx-dur,18s) linear infinite",
  "teeth": "background-image:repeating-conic-gradient(from 0deg,var(--fx-c2) 0 2deg,transparent 2deg 12deg);background-size:240% 240%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.42;animation:fxSpin var(--fx-dur,18s) linear infinite",
  "wave": "background-image:repeating-conic-gradient(from 0deg,var(--fx-c1) 0 8deg,transparent 8deg 18deg);background-size:240% 240%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.54;animation:fxSpin var(--fx-dur,18s) linear infinite",
  "ripple": "background-image:repeating-conic-gradient(from 0deg,var(--fx-c2) 0 40deg,transparent 40deg 60deg);background-size:240% 240%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.66;animation:fxSpin var(--fx-dur,18s) linear infinite",
  "bubble": "background-image:conic-gradient(from 0deg,var(--fx-c1),transparent 40%,var(--fx-c1) 70%,transparent);background-size:240% 240%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.78;animation:fxSpin var(--fx-dur,18s) linear infinite",
  "flame": "background-image:radial-gradient(circle at 50% 8%,var(--fx-c2) 0 2px,transparent 3px),radial-gradient(circle at 50% 92%,var(--fx-c2) 0 2px,transparent 3px),radial-gradient(circle at 8% 50%,var(--fx-c2) 0 2px,transparent 3px),radial-gradient(circle at 92% 50%,var(--fx-c2) 0 2px,transparent 3px);background-size:240% 240%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.30;animation:fxSpin var(--fx-dur,18s) linear infinite",
  "electric": "background-image:radial-gradient(circle at 50% 50%,transparent 30%,color-mix(in srgb,var(--fx-c1) 45%,transparent) 62%,transparent 78%);background-size:240% 240%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.42;animation:fxSpin var(--fx-dur,18s) linear infinite",
  "plasma": "background-image:conic-gradient(from 180deg at 50% 50%,var(--fx-c2) 0 12deg,transparent 12deg 348deg);background-size:240% 240%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.54;animation:fxSpin var(--fx-dur,18s) linear infinite",
  "energy": "background-image:radial-gradient(circle at 50% 50%,transparent 44%,var(--fx-c1) 45% 46.5%,transparent 48%);background-size:280% 280%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.66;animation:fxPulse var(--fx-dur,6s) ease-in-out infinite",
  "core": "background-image:radial-gradient(circle at 50% 50%,transparent 40%,var(--fx-c2) 41% 47%,transparent 49%);background-size:280% 280%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.78;animation:fxPulse var(--fx-dur,6s) ease-in-out infinite",
  "neon": "background-image:radial-gradient(circle at 50% 50%,transparent 40%,var(--fx-c1) 41% 42.5%,transparent 44%,transparent 48%,var(--fx-c1) 49% 50.5%,transparent 52%);background-size:280% 280%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.30;animation:fxPulse var(--fx-dur,6s) ease-in-out infinite",
  "neon2": "background-image:radial-gradient(circle at 50% 50%,var(--fx-c2) 0,transparent 58%);background-size:280% 280%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.42;animation:fxPulse var(--fx-dur,6s) ease-in-out infinite",
  "neonflick": "background-image:radial-gradient(ellipse at 50% 50%,var(--fx-c1) 0,transparent 66%);background-size:280% 280%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.54;animation:fxPulse var(--fx-dur,6s) ease-in-out infinite",
  "laser": "background-image:repeating-conic-gradient(from 0deg,var(--fx-c2) 0 2deg,transparent 2deg 12deg);background-size:280% 280%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.66;animation:fxPulse var(--fx-dur,6s) ease-in-out infinite",
  "rainbow": "background-image:repeating-conic-gradient(from 0deg,var(--fx-c1) 0 8deg,transparent 8deg 18deg);background-size:280% 280%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.78;animation:fxPulse var(--fx-dur,6s) ease-in-out infinite",
  "iridescent": "background-image:repeating-conic-gradient(from 0deg,var(--fx-c2) 0 40deg,transparent 40deg 60deg);background-size:280% 280%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.30;animation:fxPulse var(--fx-dur,6s) ease-in-out infinite",
  "oil": "background-image:conic-gradient(from 0deg,var(--fx-c1),transparent 40%,var(--fx-c1) 70%,transparent);background-size:280% 280%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.42;animation:fxPulse var(--fx-dur,6s) ease-in-out infinite",
  "prism": "background-image:radial-gradient(circle at 50% 8%,var(--fx-c2) 0 2px,transparent 3px),radial-gradient(circle at 50% 92%,var(--fx-c2) 0 2px,transparent 3px),radial-gradient(circle at 8% 50%,var(--fx-c2) 0 2px,transparent 3px),radial-gradient(circle at 92% 50%,var(--fx-c2) 0 2px,transparent 3px);background-size:280% 280%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.54;animation:fxPulse var(--fx-dur,6s) ease-in-out infinite",
  "chroma": "background-image:radial-gradient(circle at 50% 50%,transparent 30%,color-mix(in srgb,var(--fx-c1) 45%,transparent) 62%,transparent 78%);background-size:280% 280%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.66;animation:fxPulse var(--fx-dur,6s) ease-in-out infinite",
  "glitch": "background-image:conic-gradient(from 180deg at 50% 50%,var(--fx-c2) 0 12deg,transparent 12deg 348deg);background-size:280% 280%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.78;animation:fxPulse var(--fx-dur,6s) ease-in-out infinite",
  "glitchrgb": "background-image:radial-gradient(circle at 50% 50%,transparent 44%,var(--fx-c1) 45% 46.5%,transparent 48%);background-size:320% 320%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.30;animation:fxBreathe var(--fx-dur,7s) ease-in-out infinite",
  "scan": "background-image:radial-gradient(circle at 50% 50%,transparent 40%,var(--fx-c2) 41% 47%,transparent 49%);background-size:320% 320%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.42;animation:fxBreathe var(--fx-dur,7s) ease-in-out infinite",
  "scanline": "background-image:radial-gradient(circle at 50% 50%,transparent 40%,var(--fx-c1) 41% 42.5%,transparent 44%,transparent 48%,var(--fx-c1) 49% 50.5%,transparent 52%);background-size:320% 320%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.54;animation:fxBreathe var(--fx-dur,7s) ease-in-out infinite",
  "hologram": "background-image:radial-gradient(circle at 50% 50%,var(--fx-c2) 0,transparent 58%);background-size:320% 320%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.66;animation:fxBreathe var(--fx-dur,7s) ease-in-out infinite",
  "matrix": "background-image:radial-gradient(ellipse at 50% 50%,var(--fx-c1) 0,transparent 66%);background-size:320% 320%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.78;animation:fxBreathe var(--fx-dur,7s) ease-in-out infinite",
  "tech": "background-image:repeating-conic-gradient(from 0deg,var(--fx-c2) 0 2deg,transparent 2deg 12deg);background-size:320% 320%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.30;animation:fxBreathe var(--fx-dur,7s) ease-in-out infinite",
  "circuit": "background-image:repeating-conic-gradient(from 0deg,var(--fx-c1) 0 8deg,transparent 8deg 18deg);background-size:320% 320%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.42;animation:fxBreathe var(--fx-dur,7s) ease-in-out infinite",
  "data": "background-image:repeating-conic-gradient(from 0deg,var(--fx-c2) 0 40deg,transparent 40deg 60deg);background-size:320% 320%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.54;animation:fxBreathe var(--fx-dur,7s) ease-in-out infinite",
  "morph": "background-image:conic-gradient(from 0deg,var(--fx-c1),transparent 40%,var(--fx-c1) 70%,transparent);background-size:320% 320%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.66;animation:fxBreathe var(--fx-dur,7s) ease-in-out infinite",
  "morph2": "background-image:radial-gradient(circle at 50% 8%,var(--fx-c2) 0 2px,transparent 3px),radial-gradient(circle at 50% 92%,var(--fx-c2) 0 2px,transparent 3px),radial-gradient(circle at 8% 50%,var(--fx-c2) 0 2px,transparent 3px),radial-gradient(circle at 92% 50%,var(--fx-c2) 0 2px,transparent 3px);background-size:320% 320%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.78;animation:fxBreathe var(--fx-dur,7s) ease-in-out infinite",
  "wobble": "background-image:radial-gradient(circle at 50% 50%,transparent 30%,color-mix(in srgb,var(--fx-c1) 45%,transparent) 62%,transparent 78%);background-size:320% 320%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.30;animation:fxBreathe var(--fx-dur,7s) ease-in-out infinite",
  "blob": "background-image:conic-gradient(from 180deg at 50% 50%,var(--fx-c2) 0 12deg,transparent 12deg 348deg);background-size:320% 320%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.42;animation:fxBreathe var(--fx-dur,7s) ease-in-out infinite",
  "liquid": "background-image:radial-gradient(circle at 50% 50%,transparent 44%,var(--fx-c1) 45% 46.5%,transparent 48%);background-size:120% 120%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.54;animation:fxRipple var(--fx-dur,5s) ease-out infinite",
  "frost": "background-image:radial-gradient(circle at 50% 50%,transparent 40%,var(--fx-c2) 41% 47%,transparent 49%);background-size:120% 120%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.66;animation:fxRipple var(--fx-dur,5s) ease-out infinite",
  "shadow": "background-image:radial-gradient(circle at 50% 50%,transparent 40%,var(--fx-c1) 41% 42.5%,transparent 44%,transparent 48%,var(--fx-c1) 49% 50.5%,transparent 52%);background-size:120% 120%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.78;animation:fxRipple var(--fx-dur,5s) ease-out infinite",
  "reflect": "background-image:radial-gradient(circle at 50% 50%,var(--fx-c2) 0,transparent 58%);background-size:120% 120%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.30;animation:fxRipple var(--fx-dur,5s) ease-out infinite",
  "glass": "background-image:radial-gradient(ellipse at 50% 50%,var(--fx-c1) 0,transparent 66%);background-size:120% 120%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.42;animation:fxRipple var(--fx-dur,5s) ease-out infinite",
  "thin": "background-image:repeating-conic-gradient(from 0deg,var(--fx-c2) 0 2deg,transparent 2deg 12deg);background-size:120% 120%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.54;animation:fxRipple var(--fx-dur,5s) ease-out infinite",
  "thick": "background-image:repeating-conic-gradient(from 0deg,var(--fx-c1) 0 8deg,transparent 8deg 18deg);background-size:120% 120%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.66;animation:fxRipple var(--fx-dur,5s) ease-out infinite",
  "thickglow": "background-image:repeating-conic-gradient(from 0deg,var(--fx-c2) 0 40deg,transparent 40deg 60deg);background-size:120% 120%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.78;animation:fxRipple var(--fx-dur,5s) ease-out infinite",
  "cut": "background-image:conic-gradient(from 0deg,var(--fx-c1),transparent 40%,var(--fx-c1) 70%,transparent);background-size:120% 120%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.30;animation:fxRipple var(--fx-dur,5s) ease-out infinite",
  "bevel": "background-image:radial-gradient(circle at 50% 8%,var(--fx-c2) 0 2px,transparent 3px),radial-gradient(circle at 50% 92%,var(--fx-c2) 0 2px,transparent 3px),radial-gradient(circle at 8% 50%,var(--fx-c2) 0 2px,transparent 3px),radial-gradient(circle at 92% 50%,var(--fx-c2) 0 2px,transparent 3px);background-size:120% 120%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.42;animation:fxRipple var(--fx-dur,5s) ease-out infinite",
  "engraved": "background-image:radial-gradient(circle at 50% 50%,transparent 30%,color-mix(in srgb,var(--fx-c1) 45%,transparent) 62%,transparent 78%);background-size:120% 120%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.54;animation:fxRipple var(--fx-dur,5s) ease-out infinite",
  "embossed": "background-image:conic-gradient(from 180deg at 50% 50%,var(--fx-c2) 0 12deg,transparent 12deg 348deg);background-size:120% 120%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.66;animation:fxRipple var(--fx-dur,5s) ease-out infinite",
  "rope": "background-image:radial-gradient(circle at 50% 50%,transparent 44%,var(--fx-c1) 45% 46.5%,transparent 48%);background-size:160% 160%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.78"
 },
 "md": {
  "circle": {
   "css": "--fx-rad:50%"
  },
  "round2": {
   "css": "--fx-rad:38%"
  },
  "round3": {
   "css": "--fx-rad:38%"
  },
  "oval": {
   "css": "--fx-rad:14%",
   "css2": "clip-path:polygon(25% 3%,75% 3%,100% 50%,75% 97%,25% 97%,0 50%)"
  },
  "star": {
   "css": "--fx-rad:0",
   "css2": "clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)"
  },
  "star4": {
   "css": "--fx-rad:0",
   "css2": "clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)"
  },
  "star6": {
   "css": "--fx-rad:0",
   "css2": "clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)"
  },
  "star8": {
   "css": "--fx-rad:0",
   "css2": "clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)"
  },
  "starburst": {
   "css": "--fx-rad:0",
   "css2": "clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)"
  },
  "shield": {
   "css": "--fx-rad:12%",
   "css2": "clip-path:polygon(50% 0,100% 18%,100% 62%,50% 100%,0 62%,0 18%)"
  },
  "shield2": {
   "css": "--fx-rad:12%",
   "css2": "clip-path:polygon(50% 0,100% 18%,100% 62%,50% 100%,0 62%,0 18%)"
  },
  "shield3": {
   "css": "--fx-rad:12%",
   "css2": "clip-path:polygon(50% 0,100% 18%,100% 62%,50% 100%,0 62%,0 18%)"
  },
  "shield4": {
   "css": "--fx-rad:12%",
   "css2": "clip-path:polygon(50% 0,100% 18%,100% 62%,50% 100%,0 62%,0 18%)"
  },
  "crest": {
   "css": "--fx-rad:12%",
   "css2": "clip-path:polygon(50% 0,100% 18%,100% 62%,50% 100%,0 62%,0 18%)"
  },
  "crest2": {
   "css": "--fx-rad:12%",
   "css2": "clip-path:polygon(50% 0,100% 18%,100% 62%,50% 100%,0 62%,0 18%)"
  },
  "hexagon": {
   "css": "--fx-rad:14%",
   "css2": "clip-path:polygon(25% 3%,75% 3%,100% 50%,75% 97%,25% 97%,0 50%)"
  },
  "hex2": {
   "css": "--fx-rad:14%",
   "css2": "clip-path:polygon(25% 3%,75% 3%,100% 50%,75% 97%,25% 97%,0 50%)"
  },
  "diamond": {
   "css": "--fx-rad:16%",
   "css2": "clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%)"
  },
  "diamond2": {
   "css": "--fx-rad:16%",
   "css2": "clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%)"
  },
  "square": {
   "css": "--fx-rad:28%"
  },
  "square2": {
   "css": "--fx-rad:28%"
  },
  "octagon": {
   "css": "--fx-rad:14%",
   "css2": "clip-path:polygon(30% 0,70% 0,100% 30%,100% 70%,70% 100%,30% 100%,0 70%,0 30%)"
  },
  "octagon2": {
   "css": "--fx-rad:14%",
   "css2": "clip-path:polygon(30% 0,70% 0,100% 30%,100% 70%,70% 100%,30% 100%,0 70%,0 30%)"
  },
  "triangle": {
   "css": "--fx-rad:14%",
   "css2": "clip-path:polygon(25% 3%,75% 3%,100% 50%,75% 97%,25% 97%,0 50%)"
  },
  "triangle2": {
   "css": "--fx-rad:10%",
   "css2": "clip-path:polygon(50% 0,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%)"
  },
  "triangler": {
   "css": "--fx-rad:16%",
   "css2": "clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%)"
  },
  "heart": {
   "css": "--fx-rad:0",
   "css2": "clip-path:polygon(50% 100%,4% 40%,4% 20%,20% 4%,38% 4%,50% 18%,62% 4%,80% 4%,96% 20%,96% 40%)"
  },
  "heart2": {
   "css": "--fx-rad:0",
   "css2": "clip-path:polygon(50% 100%,4% 40%,4% 20%,20% 4%,38% 4%,50% 18%,62% 4%,80% 4%,96% 20%,96% 40%)"
  },
  "cross": {
   "css": "--fx-rad:0",
   "css2": "clip-path:polygon(50% 0,61% 25%,86% 14%,75% 39%,100% 50%,75% 61%,86% 86%,61% 75%,50% 100%,39% 75%,14% 86%,25% 61%,0 50%,25% 39%,14% 14%,39% 25%)"
  },
  "cross2": {
   "css": "--fx-rad:14%",
   "css2": "clip-path:polygon(30% 0,70% 0,100% 30%,100% 70%,70% 100%,30% 100%,0 70%,0 30%)"
  },
  "cross3": {
   "css": "--fx-rad:0 50% 0 50%"
  },
  "laurel": {
   "css": "--fx-rad:12%",
   "css2": "clip-path:polygon(0 12%,12% 12%,12% 0,88% 0,88% 12%,100% 12%,100% 88%,88% 88%,88% 100%,12% 100%,12% 88%,0 88%)"
  },
  "leaf": {
   "css": "--fx-rad:0 50% 0 50%"
  },
  "flame": {
   "css": "--fx-rad:50% 50% 50% 0"
  },
  "flame2": {
   "css": "--fx-rad:0",
   "css2": "clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%,50% 20%)"
  },
  "bolt": {
   "css": "--fx-rad:0",
   "css2": "clip-path:polygon(50% 0,63% 12%,80% 8%,84% 25%,100% 35%,92% 50%,100% 65%,84% 75%,80% 92%,63% 88%,50% 100%,37% 88%,20% 92%,16% 75%,0 65%,8% 50%,0 35%,16% 25%,20% 8%,37% 12%)"
  },
  "sun": {
   "css": "--fx-rad:0",
   "css2": "clip-path:polygon(50% 0,61% 25%,86% 14%,75% 39%,100% 50%,75% 61%,86% 86%,61% 75%,50% 100%,39% 75%,14% 86%,25% 61%,0 50%,25% 39%,14% 14%,39% 25%)"
  },
  "moon": {
   "css": "--fx-rad:0",
   "css2": "clip-path:polygon(50% 100%,4% 40%,4% 20%,20% 4%,38% 4%,50% 18%,62% 4%,80% 4%,96% 20%,96% 40%)"
  },
  "moon2": {
   "css": "--fx-rad:8%",
   "css2": "clip-path:polygon(0 0,100% 0,100% 72%,50% 100%,0 72%)"
  },
  "cloud": {
   "css": "--fx-rad:14%",
   "css2": "clip-path:polygon(0 0,100% 0,100% 70%,88% 70%,88% 100%,12% 100%,12% 70%,0 70%)"
  },
  "snow": {
   "css": "--fx-rad:50%"
  },
  "drop": {
   "css": "--fx-rad:0 50% 0 50%"
  },
  "gem": {
   "css": "--fx-rad:28%"
  },
  "gem2": {
   "css": "--fx-rad:14%",
   "css2": "clip-path:polygon(25% 3%,75% 3%,100% 50%,75% 97%,25% 97%,0 50%)"
  },
  "crown": {
   "css": "--fx-rad:10%",
   "css2": "clip-path:polygon(50% 0,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%)"
  },
  "wing": {
   "css": "--fx-rad:16%",
   "css2": "clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%)"
  },
  "eye": {
   "css": "--fx-rad:12%",
   "css2": "clip-path:polygon(50% 0,100% 18%,100% 62%,50% 100%,0 62%,0 18%)"
  },
  "eye2": {
   "css": "--fx-rad:0",
   "css2": "clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)"
  },
  "key": {
   "css": "--fx-rad:0",
   "css2": "clip-path:polygon(50% 0,61% 25%,86% 14%,75% 39%,100% 50%,75% 61%,86% 86%,61% 75%,50% 100%,39% 75%,14% 86%,25% 61%,0 50%,25% 39%,14% 14%,39% 25%)"
  },
  "coin": {
   "css": "--fx-rad:0",
   "css2": "clip-path:polygon(50% 0,63% 12%,80% 8%,84% 25%,100% 35%,92% 50%,100% 65%,84% 75%,80% 92%,63% 88%,50% 100%,37% 88%,20% 92%,16% 75%,0 65%,8% 50%,0 35%,16% 25%,20% 8%,37% 12%)"
  },
  "coin2": {
   "css": "--fx-rad:0",
   "css2": "clip-path:polygon(50% 0,63% 12%,80% 8%,84% 25%,100% 35%,92% 50%,100% 65%,84% 75%,80% 92%,63% 88%,50% 100%,37% 88%,20% 92%,16% 75%,0 65%,8% 50%,0 35%,16% 25%,20% 8%,37% 12%)"
  },
  "medallion": {
   "css": "--fx-rad:0",
   "css2": "clip-path:polygon(50% 0,63% 12%,80% 8%,84% 25%,100% 35%,92% 50%,100% 65%,84% 75%,80% 92%,63% 88%,50% 100%,37% 88%,20% 92%,16% 75%,0 65%,8% 50%,0 35%,16% 25%,20% 8%,37% 12%)"
  },
  "ribbon": {
   "css": "--fx-rad:18%",
   "css2": "clip-path:polygon(8% 0,92% 0,100% 50%,92% 100%,8% 100%,0 50%)"
  },
  "ribbon2": {
   "css": "--fx-rad:18%",
   "css2": "clip-path:polygon(8% 0,92% 0,100% 50%,92% 100%,8% 100%,0 50%)"
  },
  "book": {
   "css": "--fx-rad:0",
   "css2": "clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%,50% 20%)"
  },
  "scroll": {
   "css": "--fx-rad:0",
   "css2": "clip-path:polygon(50% 0,63% 12%,80% 8%,84% 25%,100% 35%,92% 50%,100% 65%,84% 75%,80% 92%,63% 88%,50% 100%,37% 88%,20% 92%,16% 75%,0 65%,8% 50%,0 35%,16% 25%,20% 8%,37% 12%)"
  },
  "quill": {
   "css": "--fx-rad:0",
   "css2": "clip-path:polygon(50% 0,60% 8%,72% 5%,79% 16%,92% 18%,93% 31%,100% 50%,93% 69%,92% 82%,79% 84%,72% 95%,60% 92%,50% 100%,40% 92%,28% 95%,21% 84%,8% 82%,7% 69%,0 50%,7% 31%,8% 18%,21% 16%,28% 5%,40% 8%)"
  },
  "gear": {
   "css": "--fx-rad:0",
   "css2": "clip-path:polygon(50% 0,60% 8%,72% 5%,79% 16%,92% 18%,93% 31%,100% 50%,93% 69%,92% 82%,79% 84%,72% 95%,60% 92%,50% 100%,40% 92%,28% 95%,21% 84%,8% 82%,7% 69%,0 50%,7% 31%,8% 18%,21% 16%,28% 5%,40% 8%)"
  },
  "atom": {
   "css": "--fx-rad:8%",
   "css2": "clip-path:polygon(0 0,100% 0,100% 72%,50% 100%,0 72%)"
  },
  "infinity": {
   "css": "--fx-rad:14%",
   "css2": "clip-path:polygon(0 0,100% 0,100% 70%,88% 70%,88% 100%,12% 100%,12% 70%,0 70%)"
  },
  "yinyang": {
   "css": "--fx-rad:50%"
  },
  "flower": {
   "css": "--fx-rad:0 50% 0 50%"
  },
  "flower2": {
   "css": "--fx-rad:0 50% 0 50%"
  },
  "shell": {
   "css": "--fx-rad:14%",
   "css2": "clip-path:polygon(25% 3%,75% 3%,100% 50%,75% 97%,25% 97%,0 50%)"
  },
  "anchor": {
   "css": "--fx-rad:10%",
   "css2": "clip-path:polygon(50% 0,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%)"
  },
  "sword": {
   "css": "--fx-rad:0",
   "css2": "clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%,50% 20%)"
  },
  "sword2": {
   "css": "--fx-rad:0",
   "css2": "clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%,50% 20%)"
  },
  "arrow": {
   "css": "--fx-rad:0",
   "css2": "clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%,50% 20%)"
  },
  "compass": {
   "css": "--fx-rad:0",
   "css2": "clip-path:polygon(50% 0,61% 25%,86% 14%,75% 39%,100% 50%,75% 61%,86% 86%,61% 75%,50% 100%,39% 75%,14% 86%,25% 61%,0 50%,25% 39%,14% 14%,39% 25%)"
  },
  "spiral": {
   "css": "--fx-rad:14%",
   "css2": "clip-path:polygon(30% 0,70% 0,100% 30%,100% 70%,70% 100%,30% 100%,0 70%,0 30%)"
  },
  "wave": {
   "css": "--fx-rad:0 50% 0 50%"
  },
  "plug": {
   "css": "--fx-rad:12%",
   "css2": "clip-path:polygon(0 12%,12% 12%,12% 0,88% 0,88% 12%,100% 12%,100% 88%,88% 88%,88% 100%,12% 100%,12% 88%,0 88%)"
  },
  "chip": {
   "css": "--fx-rad:18%",
   "css2": "clip-path:polygon(8% 0,92% 0,100% 50%,92% 100%,8% 100%,0 50%)"
  },
  "planet": {
   "css": "--fx-rad:50% 50% 50% 0"
  },
  "cometm": {
   "css": "--fx-rad:0",
   "css2": "clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%,50% 20%)"
  },
  "skull": {
   "css": "--fx-rad:0",
   "css2": "clip-path:polygon(50% 0,63% 12%,80% 8%,84% 25%,100% 35%,92% 50%,100% 65%,84% 75%,80% 92%,63% 88%,50% 100%,37% 88%,20% 92%,16% 75%,0 65%,8% 50%,0 35%,16% 25%,20% 8%,37% 12%)"
  },
  "runes": {
   "css": "--fx-rad:0",
   "css2": "clip-path:polygon(50% 0,60% 8%,72% 5%,79% 16%,92% 18%,93% 31%,100% 50%,93% 69%,92% 82%,79% 84%,72% 95%,60% 92%,50% 100%,40% 92%,28% 95%,21% 84%,8% 82%,7% 69%,0 50%,7% 31%,8% 18%,21% 16%,28% 5%,40% 8%)"
  },
  "blank": {
   "css": "--fx-rad:50%"
  }
 },
 "sig": {
  "bracket": {
   "css": "content:\"[ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ]\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "bracket2": {
   "css": "content:\"< \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" >\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "braces": {
   "css": "content:\"{ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" }\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "paren": {
   "css": "content:\"( \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" )\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "doubleparen": {
   "css": "content:\"(( \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ))\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "bar": {
   "css": "content:\"| \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" |\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "dash": {
   "css": "content:\"— \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" —\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "dash2": {
   "css": "content:\"—— \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ——\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "tilde": {
   "css": "content:\"~ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ~\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "star": {
   "css": "content:\"* \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" *\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "star2": {
   "css": "content:\"** \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" **\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "star3": {
   "css": "content:\"*** \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ***\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "dot": {
   "css": "content:\"· \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ·\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "dot2": {
   "css": "content:\"·· \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ··\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "bullet": {
   "css": "content:\"▪ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ▪\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "bullet2": {
   "css": "content:\"▸ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ◂\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "slash": {
   "css": "content:\"/ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" /\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "slash2": {
   "css": "content:\"// \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" //\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "pipe": {
   "css": "content:\"|| \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ||\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "plus": {
   "css": "content:\"+ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" +\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "equal": {
   "css": "content:\"= \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" =\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "arrowlr": {
   "css": "content:\"← \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" →\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "arrow2": {
   "css": "content:\"⇆ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ⇆\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "arrow3": {
   "css": "content:\"▷ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ◁\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "arrow4": {
   "css": "content:\"➤ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ◀\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "arrow5": {
   "css": "content:\"↑ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ↓\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "diamond": {
   "css": "content:\"◆ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ◆\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "diamond2": {
   "css": "content:\"◇ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ◇\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "hex": {
   "css": "content:\"⬢ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ⬢\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "tri": {
   "css": "content:\"▲ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ▲\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "tri2": {
   "css": "content:\"▼ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ▼\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "square": {
   "css": "content:\"■ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ■\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "square2": {
   "css": "content:\"□ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" □\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "circle": {
   "css": "content:\"● \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ●\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "circle2": {
   "css": "content:\"○ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ○\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "circledot": {
   "css": "content:\"◉ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ◉\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "starbig": {
   "css": "content:\"★ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ★\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "starbig2": {
   "css": "content:\"☆ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ☆\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "star4": {
   "css": "content:\"✦ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ✦\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "star6": {
   "css": "content:\"✶ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ✶\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "spark": {
   "css": "content:\"✺ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ✺\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "crown": {
   "css": "content:\"♛ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ♛\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "crown2": {
   "css": "content:\"👑 \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" 👑\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "wing": {
   "css": "content:\"⚜ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ⚜\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "laurel": {
   "css": "content:\"🍃 \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" 🍃\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "flame": {
   "css": "content:\"🔥 \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" 🔥\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "bolt": {
   "css": "content:\"⚡ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ⚡\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "gem": {
   "css": "content:\"💎 \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" 💎\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "eye": {
   "css": "content:\"👁 \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" 👁\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "key": {
   "css": "content:\"🔑 \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" 🔑\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "infinity": {
   "css": "content:\"∞ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ∞\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "yinyang": {
   "css": "content:\"☯ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ☯\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "atom": {
   "css": "content:\"⚛ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ⚛\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "gear": {
   "css": "content:\"⚙ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ⚙\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "music": {
   "css": "content:\"♪ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ♪\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "music2": {
   "css": "content:\"♫ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ♫\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "cross": {
   "css": "content:\"✚ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ✚\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "cross2": {
   "css": "content:\"✠ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ✠\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "sword": {
   "css": "content:\"⚔ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ⚔\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "sun": {
   "css": "content:\"☀ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ☀\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "moon": {
   "css": "content:\"☽ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ☽\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "snow": {
   "css": "content:\"❄ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ❄\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "heart": {
   "css": "content:\"♥ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ♥\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "drop": {
   "css": "content:\"💧 \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" 💧\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "flower": {
   "css": "content:\"❁ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ❁\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "anchor": {
   "css": "content:\"⚓ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ⚓\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "compass": {
   "css": "content:\"❂ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ❂\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "skull": {
   "css": "content:\"☠ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ☠\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "runic": {
   "css": "content:\"ᚠ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ᚠ\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "grave": {
   "css": "content:\"⌂ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ⌂\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "section": {
   "css": "content:\"§ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" §\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "dagger": {
   "css": "content:\"† \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" †\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "doublecross": {
   "css": "content:\"‡ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ‡\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "tilde2": {
   "css": "content:\"≈ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ≈\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "caret": {
   "css": "content:\"‹ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ›\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "guillemet": {
   "css": "content:\"« \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" »\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "quote": {
   "css": "content:\"“ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ”\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "prime": {
   "css": "content:\"“\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\"”\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "accent": {
   "css": "content:\"` \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ´\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "caret2": {
   "css": "content:\"^ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ^\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "underscore": {
   "css": "content:\"_ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" _\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "colon": {
   "css": "content:\": \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" :\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "semicolon": {
   "css": "content:\"; \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ;\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "question": {
   "css": "content:\"? \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" ?\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "exclaim": {
   "css": "content:\"! \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" !\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  },
  "hash": {
   "css": "content:\"# \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
   "css2": "content:\" #\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
  }
 },
 "rar": {
  "common": "filter:drop-shadow(0 0 2px var(--fx-c1)) drop-shadow(0 0 4px var(--fx-c2))",
  "uncommon": "filter:drop-shadow(0 0 4px var(--fx-c1)) drop-shadow(0 0 8px var(--fx-c2))",
  "rare": "filter:drop-shadow(0 0 5px var(--fx-c1)) drop-shadow(0 0 10px var(--fx-c2))",
  "epic": "filter:drop-shadow(0 0 7px var(--fx-c1)) drop-shadow(0 0 14px var(--fx-c2))",
  "legend": "filter:drop-shadow(0 0 10px var(--fx-c1)) drop-shadow(0 0 20px var(--fx-c2))",
  "mythic": "filter:drop-shadow(0 0 14px var(--fx-c1)) drop-shadow(0 0 28px var(--fx-c2))",
  "divine": "filter:drop-shadow(0 0 18px var(--fx-c1)) drop-shadow(0 0 36px var(--fx-c2))",
  "eternal": "filter:drop-shadow(0 0 22px var(--fx-c1)) drop-shadow(0 0 44px var(--fx-c2))"
 }
};

  var CSS_LIST = {
 "tx": [
  {
   "v": "none",
   "label": "纯色哑光"
  },
  {
   "v": "grain",
   "label": "颗粒噪点",
   "css": "background-image: repeating-radial-gradient(circle at 25% 25%, color-mix(in srgb,var(--fx-c2) 12%,transparent) .5px, transparent 1.2px); background-size:5px 5px;"
  },
  {
   "v": "micrograin",
   "label": "微颗粒",
   "css": "background-image: repeating-radial-gradient(circle, color-mix(in srgb,var(--fx-c2) 10%,transparent) .4px, transparent 1px); background-size:3px 3px;"
  },
  {
   "v": "film",
   "label": "胶片颗粒",
   "css": "background-image: repeating-radial-gradient(circle at 13% 17%, color-mix(in srgb,var(--fx-c2) 15%,transparent) 1px, transparent 2px); background-size:7px 9px;"
  },
  {
   "v": "dots",
   "label": "稀疏点阵",
   "css": "background-image: radial-gradient(color-mix(in srgb,var(--fx-c2) 16%,transparent) 1px, transparent 1.4px); background-size:22px 22px;"
  },
  {
   "v": "dotsdense",
   "label": "密点阵",
   "css": "background-image: radial-gradient(color-mix(in srgb,var(--fx-c2) 14%,transparent) 1px, transparent 1.3px); background-size:12px 12px;"
  },
  {
   "v": "dotscross",
   "label": "十字点阵",
   "css": "background-image: radial-gradient(color-mix(in srgb,var(--fx-c2) 15%,transparent) 1.4px, transparent 2px), radial-gradient(color-mix(in srgb,var(--fx-c2) 10%,transparent) 1px, transparent 1.5px); background-size:20px 20px, 20px 20px; background-position: 0 0, 10px 10px;"
  },
  {
   "v": "dotssparse",
   "label": "星点散布",
   "css": "background-image: radial-gradient(1.5px 1.5px at 30% 40%, color-mix(in srgb,var(--fx-c2) 25%,transparent), transparent 60%), radial-gradient(1px 1px at 70% 70%, color-mix(in srgb,var(--fx-c2) 18%,transparent), transparent 60%); background-size:38px 38px;"
  },
  {
   "v": "dotsfade",
   "label": "渐隐点阵",
   "css": "background-image: radial-gradient(color-mix(in srgb,var(--fx-c2) 18%,transparent) 1.2px, transparent 1.6px); background-size:18px 18px; -webkit-mask-image: radial-gradient(circle, #000 30%, transparent 75%); mask-image: radial-gradient(circle, #000 30%, transparent 75%);"
  },
  {
   "v": "halftone",
   "label": "半调网点",
   "css": "background-image: radial-gradient(color-mix(in srgb,var(--fx-c2) 20%,transparent) 2.4px, transparent 3.2px), radial-gradient(color-mix(in srgb,var(--fx-c2) 14%,transparent) 1.4px, transparent 2px), radial-gradient(color-mix(in srgb,var(--fx-c2) 10%,transparent) .8px, transparent 1.2px); background-size:30px 30px, 30px 30px, 30px 30px; background-position: 0 0, 0 10px, 0 20px;"
  },
  {
   "v": "grid",
   "label": "细网格",
   "css": "background-image: linear-gradient(color-mix(in srgb,var(--fx-c2) 7%,transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb,var(--fx-c2) 7%,transparent) 1px, transparent 1px); background-size:38px 38px;"
  },
  {
   "v": "gridbold",
   "label": "粗网格",
   "css": "background-image: linear-gradient(color-mix(in srgb,var(--fx-c2) 10%,transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb,var(--fx-c2) 10%,transparent) 1px, transparent 1px); background-size:22px 22px;"
  },
  {
   "v": "gridfade",
   "label": "渐隐网格",
   "css": "background-image: linear-gradient(color-mix(in srgb,var(--fx-c2) 8%,transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb,var(--fx-c2) 8%,transparent) 1px, transparent 1px); background-size:34px 34px; -webkit-mask-image: radial-gradient(circle, #000 40%, transparent 80%); mask-image: radial-gradient(circle, #000 40%, transparent 80%);"
  },
  {
   "v": "graph",
   "label": "坐标纸",
   "css": "background-image: linear-gradient(color-mix(in srgb,var(--fx-c2) 5%,transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb,var(--fx-c2) 5%,transparent) 1px, transparent 1px), linear-gradient(color-mix(in srgb,var(--fx-c2) 9%,transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb,var(--fx-c2) 9%,transparent) 1px, transparent 1px); background-size:16px 16px, 16px 16px, 80px 80px, 80px 80px;"
  },
  {
   "v": "plus",
   "label": "十字网格",
   "css": "background-image: linear-gradient(color-mix(in srgb,var(--fx-c2) 12%,transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb,var(--fx-c2) 12%,transparent) 1px, transparent 1px); background-size:30px 30px; background-position: 15px 15px, 15px 15px;"
  },
  {
   "v": "isometric",
   "label": "等距网格",
   "css": "background-image: linear-gradient(30deg, color-mix(in srgb,var(--fx-c2) 8%,transparent) 1px, transparent 1px), linear-gradient(150deg, color-mix(in srgb,var(--fx-c2) 8%,transparent) 1px, transparent 1px); background-size:30px 38px;"
  },
  {
   "v": "horizon",
   "label": "透视地平",
   "css": "background-image: linear-gradient(color-mix(in srgb,var(--fx-c2) 10%,transparent) 1px, transparent 1px); background-size: 100% 40px; transform: perspective(400px) rotateX(55deg);"
  },
  {
   "v": "linesh",
   "label": "横向细线",
   "css": "background-image: repeating-linear-gradient(0deg, transparent, transparent 15px, color-mix(in srgb,var(--fx-c2) 8%,transparent) 15px, color-mix(in srgb,var(--fx-c2) 8%,transparent) 16px);"
  },
  {
   "v": "linesv",
   "label": "纵向细线",
   "css": "background-image: repeating-linear-gradient(90deg, transparent, transparent 15px, color-mix(in srgb,var(--fx-c2) 8%,transparent) 15px, color-mix(in srgb,var(--fx-c2) 8%,transparent) 16px);"
  },
  {
   "v": "pinstripe",
   "label": "竖细条纹",
   "css": "background-image: repeating-linear-gradient(90deg, transparent, transparent 5px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 5px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 6px);"
  },
  {
   "v": "ruled",
   "label": "笔记本横格",
   "css": "background-image: repeating-linear-gradient(0deg, transparent, transparent 31px, rgba(255,120,120,.30) 31px, rgba(255,120,120,.30) 32px);"
  },
  {
   "v": "diag",
   "label": "斜纹",
   "css": "background-image: repeating-linear-gradient(135deg, transparent, transparent 14px, color-mix(in srgb,var(--fx-c2) 9%,transparent) 14px, color-mix(in srgb,var(--fx-c2) 9%,transparent) 15px);"
  },
  {
   "v": "diagbold",
   "label": "粗斜纹",
   "css": "background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 10px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 12px);"
  },
  {
   "v": "crosshatch",
   "label": "交叉影线",
   "css": "background-image: repeating-linear-gradient(45deg, transparent, transparent 8px, color-mix(in srgb,var(--fx-c2) 9%,transparent) 8px, color-mix(in srgb,var(--fx-c2) 9%,transparent) 9px), repeating-linear-gradient(135deg, transparent, transparent 8px, color-mix(in srgb,var(--fx-c2) 9%,transparent) 8px, color-mix(in srgb,var(--fx-c2) 9%,transparent) 9px);"
  },
  {
   "v": "zigzag",
   "label": "锯齿折线",
   "css": "background-image: repeating-linear-gradient(135deg, transparent, transparent 8px, color-mix(in srgb,var(--fx-c2) 12%,transparent) 8px, color-mix(in srgb,var(--fx-c2) 12%,transparent) 10px); background-size:20px 20px;"
  },
  {
   "v": "chevron",
   "label": "人字纹",
   "css": "background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 10px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 12px), repeating-linear-gradient(-45deg, transparent, transparent 10px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 10px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 12px);"
  },
  {
   "v": "wave",
   "label": "波纹",
   "css": "background-image: repeating-radial-gradient(circle at 50% 100%, transparent 0, transparent 12px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 12px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 13px); background-size:38px 20px;"
  },
  {
   "v": "sine",
   "label": "正弦波",
   "css": "background-image: repeating-linear-gradient(0deg, transparent, transparent 6px, color-mix(in srgb,var(--fx-c2) 8%,transparent) 6px, color-mix(in srgb,var(--fx-c2) 8%,transparent) 7px); background-size: 100% 24px;"
  },
  {
   "v": "squiggle",
   "label": "波浪线",
   "css": "background-image: radial-gradient(circle at 10px 0, transparent 0 6px, color-mix(in srgb,var(--fx-c2) 12%,transparent) 6px 7px, transparent 8px) repeat-x; background-size:20px 14px;"
  },
  {
   "v": "hex",
   "label": "蜂巢",
   "css": "background-image: radial-gradient(circle at 10px 17px, color-mix(in srgb,var(--fx-c2) 14%,transparent) 1.5px, transparent 2.4px); background-size:20px 34px;"
  },
  {
   "v": "hexfine",
   "label": "细蜂巢",
   "css": "background-image: radial-gradient(circle at 8px 14px, color-mix(in srgb,var(--fx-c2) 12%,transparent) 1px, transparent 1.8px); background-size:16px 28px;"
  },
  {
   "v": "honeycomb",
   "label": "深蜂巢",
   "css": "background-image: radial-gradient(circle at 12px 20px, color-mix(in srgb,var(--fx-c2) 18%,transparent) 2px, transparent 3px), radial-gradient(circle at 0 0, color-mix(in srgb,var(--fx-c2) 18%,transparent) 2px, transparent 3px); background-size:24px 38px;"
  },
  {
   "v": "triangle",
   "label": "三角镶嵌",
   "css": "background-image: linear-gradient(60deg, color-mix(in srgb,var(--fx-c2) 8%,transparent) 25%, transparent 25%), linear-gradient(120deg, color-mix(in srgb,var(--fx-c2) 8%,transparent) 25%, transparent 25%); background-size:30px 38px;"
  },
  {
   "v": "triangledark",
   "label": "暗三角",
   "css": "background-image: linear-gradient(60deg, color-mix(in srgb,var(--fx-c2) 12%,transparent) 50%, transparent 50%), linear-gradient(120deg, color-mix(in srgb,var(--fx-c2) 12%,transparent) 50%, transparent 50%); background-size:26px 38px;"
  },
  {
   "v": "diamond",
   "label": "菱格纹",
   "css": "background-image: linear-gradient(45deg, color-mix(in srgb,var(--fx-c2) 9%,transparent) 25%, transparent 25%, transparent 75%, color-mix(in srgb,var(--fx-c2) 9%,transparent) 75%), linear-gradient(-45deg, color-mix(in srgb,var(--fx-c2) 9%,transparent) 25%, transparent 25%, transparent 75%, color-mix(in srgb,var(--fx-c2) 9%,transparent) 75%); background-size:26px 26px;"
  },
  {
   "v": "diamondsm",
   "label": "小菱格",
   "css": "background-image: linear-gradient(45deg, color-mix(in srgb,var(--fx-c2) 10%,transparent) 25%, transparent 25%, transparent 75%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 75%), linear-gradient(-45deg, color-mix(in srgb,var(--fx-c2) 10%,transparent) 25%, transparent 25%, transparent 75%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 75%); background-size:14px 14px;"
  },
  {
   "v": "checker",
   "label": "棋盘格",
   "css": "background-image: linear-gradient(45deg, color-mix(in srgb,var(--fx-c2) 10%,transparent) 25%, transparent 25%, transparent 75%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 75%), linear-gradient(-45deg, color-mix(in srgb,var(--fx-c2) 10%,transparent) 25%, transparent 25%, transparent 75%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 75%); background-size:20px 20px;"
  },
  {
   "v": "checkersm",
   "label": "小棋盘",
   "css": "background-image: linear-gradient(45deg, color-mix(in srgb,var(--fx-c2) 10%,transparent) 25%, transparent 25%, transparent 75%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 75%), linear-gradient(-45deg, color-mix(in srgb,var(--fx-c2) 10%,transparent) 25%, transparent 25%, transparent 75%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 75%); background-size:10px 10px;"
  },
  {
   "v": "plaid",
   "label": "菱格编织",
   "css": "background-image: repeating-linear-gradient(45deg, transparent, transparent 14px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 14px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 16px), repeating-linear-gradient(-45deg, transparent, transparent 14px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 14px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 16px);"
  },
  {
   "v": "herringbone",
   "label": "人字斜纹",
   "css": "background-image: repeating-linear-gradient(45deg, transparent, transparent 12px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 12px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 14px), repeating-linear-gradient(-45deg, transparent, transparent 12px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 12px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 14px); background-size:34px 34px;"
  },
  {
   "v": "argyle",
   "label": "雅致菱格",
   "css": "background-image: repeating-linear-gradient(45deg, transparent, transparent 20px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 20px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 22px), repeating-linear-gradient(-45deg, transparent, transparent 20px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 20px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 22px);"
  },
  {
   "v": "contour",
   "label": "等高线",
   "css": "background-image: repeating-radial-gradient(circle at 30% 40%, transparent 0, transparent 14px, color-mix(in srgb,var(--fx-c2) 12%,transparent) 14px, color-mix(in srgb,var(--fx-c2) 12%,transparent) 15px);"
  },
  {
   "v": "topo",
   "label": "地形纹",
   "css": "background-image: repeating-radial-gradient(circle at 35% 45%, transparent 0, transparent 18px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 18px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 19px);"
  },
  {
   "v": "ripples",
   "label": "水波纹",
   "css": "background-image: repeating-radial-gradient(circle at 50% 120%, transparent 0, transparent 30px, color-mix(in srgb,var(--fx-c2) 12%,transparent) 30px, color-mix(in srgb,var(--fx-c2) 12%,transparent) 31px);"
  },
  {
   "v": "bubbles",
   "label": "气泡",
   "css": "background-image: radial-gradient(circle at 20% 30%, color-mix(in srgb,var(--fx-c2) 14%,transparent) 6px, transparent 8px), radial-gradient(circle at 70% 60%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 10px, transparent 12px), radial-gradient(circle at 40% 80%, color-mix(in srgb,var(--fx-c2) 8%,transparent) 14px, transparent 16px); background-size:38px 38px;"
  },
  {
   "v": "circles",
   "label": "同心圆",
   "css": "background-image: repeating-radial-gradient(circle at 50% 50%, transparent 0, transparent 20px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 20px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 21px);"
  },
  {
   "v": "concentric",
   "label": "疏密同心圆",
   "css": "background-image: repeating-radial-gradient(circle at 50% 50%, transparent 0, transparent 10px, color-mix(in srgb,var(--fx-c2) 9%,transparent) 10px, color-mix(in srgb,var(--fx-c2) 9%,transparent) 11px), repeating-radial-gradient(circle at 50% 50%, transparent 0, transparent 24px, color-mix(in srgb,var(--fx-c2) 12%,transparent) 24px, color-mix(in srgb,var(--fx-c2) 12%,transparent) 25px);"
  },
  {
   "v": "starfield",
   "label": "深空星河",
   "css": "background-image: radial-gradient(1px 1px at 20% 30%, #fff, transparent), radial-gradient(1px 1px at 70% 60%, #fff, transparent), radial-gradient(1.5px 1.5px at 40% 80%, #fff, transparent); background-size:38px 38px;"
  },
  {
   "v": "stardense",
   "label": "繁星",
   "css": "background-image: radial-gradient(1px 1px at 10% 20%, #fff, transparent), radial-gradient(1.5px 1.5px at 30% 50%, #fff, transparent), radial-gradient(1px 1px at 60% 30%, #fff, transparent), radial-gradient(1.2px 1.2px at 80% 70%, #fff, transparent), radial-gradient(1px 1px at 50% 85%, #fff, transparent); background-size:38px 38px;"
  },
  {
   "v": "nebula",
   "label": "星云",
   "css": "background-image: radial-gradient(circle at 20% 30%, color-mix(in srgb,var(--fx-c1) 10%,transparent), transparent 40%), radial-gradient(circle at 80% 70%, color-mix(in srgb,var(--fx-c2) 10%,transparent), transparent 45%);"
  },
  {
   "v": "matrix",
   "label": "矩阵雨",
   "css": "background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,150,.10) 2px, rgba(0,255,150,.10) 4px);"
  },
  {
   "v": "circuit",
   "label": "电路板",
   "css": "background-image: linear-gradient(90deg, transparent 49%, color-mix(in srgb,var(--fx-c2) 12%,transparent) 49% 51%, transparent 51%), linear-gradient(0deg, transparent 49%, color-mix(in srgb,var(--fx-c2) 12%,transparent) 49% 51%, transparent 51%); background-size:38px 38px;"
  },
  {
   "v": "circuitdark",
   "label": "暗电路",
   "css": "background-image: linear-gradient(90deg, transparent 33%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 33% 66%, transparent 66%), linear-gradient(0deg, transparent 33%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 33% 66%, transparent 66%); background-size:30px 30px;"
  },
  {
   "v": "tech",
   "label": "科技节点",
   "css": "background-image: radial-gradient(circle at 50% 50%, var(--fx-c1) 1.5px, transparent 2px); background-size:26px 26px;"
  },
  {
   "v": "data",
   "label": "数据流",
   "css": "background-image: linear-gradient(90deg, transparent 30%, color-mix(in srgb,var(--fx-c2) 14%,transparent) 30% 32%, transparent 32%), linear-gradient(90deg, transparent 60%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 60% 62%, transparent 62%); background-size:38px 38px;"
  },
  {
   "v": "hud",
   "label": "HUD 网格",
   "css": "background-image: linear-gradient(color-mix(in srgb,var(--fx-c2) 7%,transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb,var(--fx-c2) 7%,transparent) 1px, transparent 1px); background-size:30px 30px;"
  },
  {
   "v": "mesh",
   "label": "极光网格",
   "css": "background-image: radial-gradient(circle at 0 0, transparent 0 40%, var(--fx-c1) 40%, var(--fx-c1) 60%, transparent 60%), radial-gradient(circle at 100% 100%, transparent 0 40%, var(--fx-c2) 40%, var(--fx-c2) 60%, transparent 60%); background-size: 200% 200%;"
  },
  {
   "v": "membrane",
   "label": "网格薄膜",
   "css": "background-image: linear-gradient(90deg, transparent 49%, color-mix(in srgb,var(--fx-c2) 8%,transparent) 49% 51%, transparent 51%); background-size: 24px 100%;"
  },
  {
   "v": "carbon",
   "label": "碳纤维",
   "css": "background-image: linear-gradient(60deg, #000 25%, transparent 25%), linear-gradient(120deg, #000 25%, transparent 25%); background-size:8px 14px;"
  },
  {
   "v": "carbon3d",
   "label": "立体碳纤",
   "css": "background-image: linear-gradient(60deg, color-mix(in srgb,var(--fx-c2) 6%,transparent) 25%, transparent 25%), linear-gradient(120deg, color-mix(in srgb,var(--fx-c2) 6%,transparent) 25%, transparent 25%), linear-gradient(0deg, color-mix(in srgb,var(--fx-c2) 5%,transparent), transparent 60%); background-size:8px 14px, 8px 14px, 100% 100%;"
  },
  {
   "v": "brushed",
   "label": "拉丝金属",
   "css": "background-image: repeating-linear-gradient(90deg, transparent 0 3px, color-mix(in srgb,var(--fx-c2) 7%,transparent) 3px 4px);"
  },
  {
   "v": "brushedv",
   "label": "纵向拉丝",
   "css": "background-image: repeating-linear-gradient(0deg, transparent 0 3px, color-mix(in srgb,var(--fx-c2) 7%,transparent) 3px 4px);"
  },
  {
   "v": "silk",
   "label": "丝绸渐变",
   "css": "background-image: linear-gradient(120deg, transparent 0%, var(--fx-c1) 50%, transparent 100%);"
  },
  {
   "v": "silkwave",
   "label": "丝绸波纹",
   "css": "background-image: linear-gradient(115deg, transparent 0%, color-mix(in srgb,var(--fx-c1) 72%,#fff) .1, transparent 50%, color-mix(in srgb,var(--fx-c1) 10%,transparent), transparent 100%);"
  },
  {
   "v": "velvet",
   "label": "天鹅绒",
   "css": "background-image: radial-gradient(circle at 50% 0%, color-mix(in srgb,var(--fx-c1) 15%,transparent), transparent 60%);"
  },
  {
   "v": "leather",
   "label": "皮革压纹",
   "css": "background-image: radial-gradient(circle at 25% 25%, rgba(0,0,0,.25) .5px, transparent 1.4px); background-size:6px 6px;"
  },
  {
   "v": "linen",
   "label": "亚麻布纹",
   "css": "background-image: repeating-linear-gradient(0deg, transparent 0 2px, color-mix(in srgb,var(--fx-c2) 6%,transparent) 2px 3px), repeating-linear-gradient(90deg, transparent 0 2px, color-mix(in srgb,var(--fx-c2) 6%,transparent) 2px 3px);"
  },
  {
   "v": "fabric",
   "label": "织物斜纹",
   "css": "background-image: repeating-linear-gradient(45deg, transparent 0 3px, color-mix(in srgb,var(--fx-c2) 7%,transparent) 3px 4px), repeating-linear-gradient(-45deg, transparent 0 3px, color-mix(in srgb,var(--fx-c2) 7%,transparent) 3px 4px);"
  },
  {
   "v": "paper",
   "label": "宣纸",
   "css": "background-image: radial-gradient(circle at 20% 30%, color-mix(in srgb,var(--fx-c2) 5%,transparent) .8px, transparent 1.6px); background-size:9px 9px;"
  },
  {
   "v": "marble",
   "label": "大理石纹",
   "css": "background-image: radial-gradient(ellipse at 30% 20%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 0 8%, transparent 20%), radial-gradient(ellipse at 70% 60%, color-mix(in srgb,var(--fx-c2) 7%,transparent) 0 12%, transparent 26%);"
  },
  {
   "v": "crystal",
   "label": "水晶切面",
   "css": "background-image: linear-gradient(105deg, transparent 0 30%, color-mix(in srgb,var(--fx-c2) 12%,transparent) 30% 33%, transparent 33% 66%, color-mix(in srgb,var(--fx-c2) 8%,transparent) 66% 69%, transparent 69%), linear-gradient(75deg, transparent 0 40%, color-mix(in srgb,var(--fx-c2) 7%,transparent) 40% 43%, transparent 43%);"
  },
  {
   "v": "frosted",
   "label": "磨砂玻璃",
   "css": "background: color-mix(in srgb,var(--fx-c2) 5%,transparent); backdrop-filter: blur(6px);"
  },
  {
   "v": "glass",
   "label": "玻璃态",
   "css": "background: linear-gradient(135deg, color-mix(in srgb,var(--fx-c2) 10%,transparent), color-mix(in srgb,var(--fx-c2) 2%,transparent)); backdrop-filter: blur(10px); border: 1px solid color-mix(in srgb,var(--fx-c2) 12%,transparent);"
  },
  {
   "v": "softblob",
   "label": "柔光色块",
   "css": "background-image: radial-gradient(circle at 20% 20%, color-mix(in srgb,var(--fx-c1) 12%,transparent), transparent 45%), radial-gradient(circle at 80% 70%, color-mix(in srgb,var(--fx-c2) 10%,transparent), transparent 45%);"
  },
  {
   "v": "radial",
   "label": "放射光",
   "css": "background-image: radial-gradient(circle at 50% 0%, color-mix(in srgb,var(--fx-c1) 18%,transparent), transparent 65%);"
  },
  {
   "v": "conespot",
   "label": "聚光锥",
   "css": "background-image: conic-gradient(from 180deg at 50% 0%, transparent 0 160deg, color-mix(in srgb,var(--fx-c1) 20%,transparent), transparent 200deg);"
  },
  {
   "v": "beam",
   "label": "顶光光束",
   "css": "background-image: conic-gradient(from 200deg at 50% -10%, transparent 0 140deg, color-mix(in srgb,var(--fx-c1) 12%,transparent), transparent 180deg);"
  },
  {
   "v": "aurora",
   "label": "极光",
   "css": "background-image: radial-gradient(circle at 20% 0%, color-mix(in srgb,var(--fx-c1) 12%,transparent), transparent 55%), radial-gradient(circle at 85% 10%, color-mix(in srgb,var(--fx-c2) 10%,transparent), transparent 50%), radial-gradient(circle at 50% 100%, color-mix(in srgb,var(--fx-c1) 8%,transparent), transparent 55%);"
  },
  {
   "v": "deco",
   "label": "装饰艺术",
   "css": "background-image: repeating-linear-gradient(45deg, transparent 0 12px, rgba(255,215,150,.08) 12px 13px), repeating-linear-gradient(-45deg, transparent 0 12px, rgba(255,215,150,.08) 12px 13px);"
  },
  {
   "v": "memphis",
   "label": "孟菲斯三角",
   "css": "background-image: radial-gradient(circle at 20% 30%, color-mix(in srgb,var(--fx-c1) 10%,transparent) 8px, transparent 9px), linear-gradient(45deg, transparent 0 40%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 41%, transparent 42%); background-size:38px 38px;"
  },
  {
   "v": "confetti",
   "label": "彩屑点缀",
   "css": "background-image: radial-gradient(circle at 25% 25%, var(--fx-c1) 3px, transparent 4px), radial-gradient(circle at 70% 55%, var(--fx-c2) 4px, transparent 5px), radial-gradient(circle at 45% 80%, var(--fx-c1) 2px, transparent 3px); background-size:38px 38px;"
  },
  {
   "v": "hearts",
   "label": "心形点缀",
   "css": "background-image: radial-gradient(circle at 30% 30%, rgba(255,120,160,.20) 0 5px, transparent 6px), radial-gradient(circle at 70% 65%, rgba(255,120,160,.14) 0 7px, transparent 8px); background-size:38px 38px;"
  },
  {
   "v": "stars",
   "label": "星形点缀",
   "css": "background-image: radial-gradient(2px 2px at 25% 35%, #fff, transparent), radial-gradient(1.5px 1.5px at 65% 60%, #fff, transparent), radial-gradient(2.5px 2.5px at 45% 80%, #fff, transparent); background-size:38px 38px;"
  },
  {
   "v": "leaf",
   "label": "叶脉",
   "css": "background-image: radial-gradient(ellipse at 30% 40%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 0 12px, transparent 20px); background-size:38px 38px;"
  },
  {
   "v": "feather",
   "label": "羽纹",
   "css": "background-image: repeating-linear-gradient(80deg, transparent 0 6px, color-mix(in srgb,var(--fx-c2) 8%,transparent) 6px 7px);"
  },
  {
   "v": "scale",
   "label": "鳞片纹",
   "css": "background-image: radial-gradient(circle at 50% 100%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 0 50%, transparent 52%); background-size:22px 22px;"
  },
  {
   "v": "brick",
   "label": "砖墙",
   "css": "background-image: linear-gradient(color-mix(in srgb,var(--fx-c2) 8%,transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb,var(--fx-c2) 8%,transparent) 1px, transparent 1px); background-size:38px 20px;"
  },
  {
   "v": "arabesque",
   "label": "阿拉伯纹",
   "css": "background-image: radial-gradient(circle at 50% 50%, transparent 0 30%, rgba(255,215,150,.10) 30% 32%, transparent 34%), radial-gradient(circle at 50% 50%, transparent 0 50%, rgba(255,215,150,.08) 50% 52%, transparent 54%); background-size:38px 38px;"
  },
  {
   "v": "moroccan",
   "label": "摩洛哥砖",
   "css": "background-image: linear-gradient(60deg, transparent 0 30%, rgba(255,215,150,.10) 30% 70%, transparent 70%), linear-gradient(120deg, transparent 0 30%, rgba(255,215,150,.10) 30% 70%, transparent 70%); background-size:30px 38px;"
  }
 ],
 "ov": [
  {
   "v": "none",
   "label": "无叠加"
  },
  {
   "v": "noise",
   "label": "颗粒噪点",
   "css": "background-image: repeating-radial-gradient(circle at 25% 25%, color-mix(in srgb,var(--fx-c2) 12%,transparent) .5px, transparent 1.2px); background-size:5px 5px;"
  },
  {
   "v": "noisefine",
   "label": "细噪点",
   "css": "background-image: repeating-radial-gradient(circle, color-mix(in srgb,var(--fx-c2) 10%,transparent) .4px, transparent 1px); background-size:3px 3px;"
  },
  {
   "v": "grain",
   "label": "胶片颗粒",
   "css": "background-image: repeating-radial-gradient(circle at 25% 25%, color-mix(in srgb,var(--fx-c2) 12%,transparent) .5px, transparent 1.2px); background-size:5px 5px;"
  },
  {
   "v": "dots",
   "label": "点阵叠加",
   "css": "background-image: radial-gradient(color-mix(in srgb,var(--fx-c2) 16%,transparent) 1px, transparent 1.4px); background-size:22px 22px;"
  },
  {
   "v": "grid",
   "label": "网格叠加",
   "css": "background-image: linear-gradient(color-mix(in srgb,var(--fx-c2) 7%,transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb,var(--fx-c2) 7%,transparent) 1px, transparent 1px); background-size:38px 38px;"
  },
  {
   "v": "gridfade",
   "label": "渐隐网格",
   "css": "background-image: linear-gradient(color-mix(in srgb,var(--fx-c2) 8%,transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb,var(--fx-c2) 8%,transparent) 1px, transparent 1px); background-size:34px 34px; -webkit-mask-image: radial-gradient(circle, #000 40%, transparent 80%); mask-image: radial-gradient(circle, #000 40%, transparent 80%);"
  },
  {
   "v": "plus",
   "label": "十字网格",
   "css": "background-image: linear-gradient(color-mix(in srgb,var(--fx-c2) 12%,transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb,var(--fx-c2) 12%,transparent) 1px, transparent 1px); background-size:30px 30px; background-position: 15px 15px, 15px 15px;"
  },
  {
   "v": "linesh",
   "label": "横向线",
   "css": "background-image: repeating-linear-gradient(0deg, transparent, transparent 15px, color-mix(in srgb,var(--fx-c2) 8%,transparent) 15px, color-mix(in srgb,var(--fx-c2) 8%,transparent) 16px);"
  },
  {
   "v": "linesv",
   "label": "纵向线",
   "css": "background-image: repeating-linear-gradient(90deg, transparent, transparent 15px, color-mix(in srgb,var(--fx-c2) 8%,transparent) 15px, color-mix(in srgb,var(--fx-c2) 8%,transparent) 16px);"
  },
  {
   "v": "diag",
   "label": "斜线",
   "css": "background-image: repeating-linear-gradient(135deg, transparent, transparent 14px, color-mix(in srgb,var(--fx-c2) 9%,transparent) 14px, color-mix(in srgb,var(--fx-c2) 9%,transparent) 15px);"
  },
  {
   "v": "crosshatch",
   "label": "交叉影线",
   "css": "background-image: repeating-linear-gradient(45deg, transparent, transparent 8px, color-mix(in srgb,var(--fx-c2) 9%,transparent) 8px, color-mix(in srgb,var(--fx-c2) 9%,transparent) 9px), repeating-linear-gradient(135deg, transparent, transparent 8px, color-mix(in srgb,var(--fx-c2) 9%,transparent) 8px, color-mix(in srgb,var(--fx-c2) 9%,transparent) 9px);"
  },
  {
   "v": "zigzag",
   "label": "锯齿",
   "css": "background-image: repeating-linear-gradient(135deg, transparent, transparent 8px, color-mix(in srgb,var(--fx-c2) 12%,transparent) 8px, color-mix(in srgb,var(--fx-c2) 12%,transparent) 10px); background-size:20px 20px;"
  },
  {
   "v": "wave",
   "label": "波纹",
   "css": "background-image: repeating-radial-gradient(circle at 50% 100%, transparent 0, transparent 12px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 12px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 13px); background-size:38px 20px;"
  },
  {
   "v": "hex",
   "label": "蜂巢叠加",
   "css": "background-image: radial-gradient(circle at 10px 17px, color-mix(in srgb,var(--fx-c2) 14%,transparent) 1.5px, transparent 2.4px); background-size:20px 34px;"
  },
  {
   "v": "diamond",
   "label": "菱格叠加",
   "css": "background-image: linear-gradient(45deg, color-mix(in srgb,var(--fx-c2) 9%,transparent) 25%, transparent 25%, transparent 75%, color-mix(in srgb,var(--fx-c2) 9%,transparent) 75%), linear-gradient(-45deg, color-mix(in srgb,var(--fx-c2) 9%,transparent) 25%, transparent 25%, transparent 75%, color-mix(in srgb,var(--fx-c2) 9%,transparent) 75%); background-size:26px 26px;"
  },
  {
   "v": "checker",
   "label": "棋盘叠加",
   "css": "background-image: linear-gradient(45deg, color-mix(in srgb,var(--fx-c2) 10%,transparent) 25%, transparent 25%, transparent 75%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 75%), linear-gradient(-45deg, color-mix(in srgb,var(--fx-c2) 10%,transparent) 25%, transparent 25%, transparent 75%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 75%); background-size:20px 20px;"
  },
  {
   "v": "plaid",
   "label": "编织叠加",
   "css": "background-image: repeating-linear-gradient(45deg, transparent, transparent 14px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 14px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 16px), repeating-linear-gradient(-45deg, transparent, transparent 14px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 14px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 16px);"
  },
  {
   "v": "contour",
   "label": "等高线",
   "css": "background-image: repeating-radial-gradient(circle at 30% 40%, transparent 0, transparent 14px, color-mix(in srgb,var(--fx-c2) 12%,transparent) 14px, color-mix(in srgb,var(--fx-c2) 12%,transparent) 15px);"
  },
  {
   "v": "ripples",
   "label": "水波",
   "css": "background-image: repeating-radial-gradient(circle at 50% 120%, transparent 0, transparent 30px, color-mix(in srgb,var(--fx-c2) 12%,transparent) 30px, color-mix(in srgb,var(--fx-c2) 12%,transparent) 31px);"
  },
  {
   "v": "bubbles",
   "label": "气泡",
   "css": "background-image: radial-gradient(circle at 20% 30%, color-mix(in srgb,var(--fx-c2) 14%,transparent) 6px, transparent 8px), radial-gradient(circle at 70% 60%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 10px, transparent 12px), radial-gradient(circle at 40% 80%, color-mix(in srgb,var(--fx-c2) 8%,transparent) 14px, transparent 16px); background-size:38px 38px;"
  },
  {
   "v": "circles",
   "label": "同心圆",
   "css": "background-image: repeating-radial-gradient(circle at 50% 50%, transparent 0, transparent 20px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 20px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 21px);"
  },
  {
   "v": "starfield",
   "label": "星点叠加",
   "css": "background-image: radial-gradient(1px 1px at 20% 30%, #fff, transparent), radial-gradient(1px 1px at 70% 60%, #fff, transparent), radial-gradient(1.5px 1.5px at 40% 80%, #fff, transparent); background-size:38px 38px;"
  },
  {
   "v": "circuit",
   "label": "电路叠加",
   "css": "background-image: linear-gradient(90deg, transparent 49%, color-mix(in srgb,var(--fx-c2) 12%,transparent) 49% 51%, transparent 51%), linear-gradient(0deg, transparent 49%, color-mix(in srgb,var(--fx-c2) 12%,transparent) 49% 51%, transparent 51%); background-size:38px 38px;"
  },
  {
   "v": "data",
   "label": "数据流",
   "css": "background-image: linear-gradient(90deg, transparent 30%, color-mix(in srgb,var(--fx-c2) 14%,transparent) 30% 32%, transparent 32%), linear-gradient(90deg, transparent 60%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 60% 62%, transparent 62%); background-size:38px 38px;"
  },
  {
   "v": "carbon",
   "label": "碳纤叠加",
   "css": "background-image: linear-gradient(60deg, #000 25%, transparent 25%), linear-gradient(120deg, #000 25%, transparent 25%); background-size:8px 14px;"
  },
  {
   "v": "brushed",
   "label": "拉丝叠加",
   "css": "background-image: repeating-linear-gradient(90deg, transparent 0 3px, color-mix(in srgb,var(--fx-c2) 7%,transparent) 3px 4px);"
  },
  {
   "v": "silk",
   "label": "丝绸叠加",
   "css": "background-image: linear-gradient(120deg, transparent 0%, var(--fx-c1) 50%, transparent 100%);"
  },
  {
   "v": "linen",
   "label": "亚麻叠加",
   "css": "background-image: repeating-linear-gradient(0deg, transparent 0 2px, color-mix(in srgb,var(--fx-c2) 6%,transparent) 2px 3px), repeating-linear-gradient(90deg, transparent 0 2px, color-mix(in srgb,var(--fx-c2) 6%,transparent) 2px 3px);"
  },
  {
   "v": "paper",
   "label": "纸张纹理",
   "css": "background-image: radial-gradient(circle at 20% 30%, color-mix(in srgb,var(--fx-c2) 5%,transparent) .8px, transparent 1.6px); background-size:9px 9px;"
  },
  {
   "v": "marble",
   "label": "大理石纹",
   "css": "background-image: radial-gradient(ellipse at 30% 20%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 0 8%, transparent 20%), radial-gradient(ellipse at 70% 60%, color-mix(in srgb,var(--fx-c2) 7%,transparent) 0 12%, transparent 26%);"
  },
  {
   "v": "frosted",
   "label": "磨砂叠加",
   "css": "background: color-mix(in srgb,var(--fx-c2) 5%,transparent); backdrop-filter: blur(6px);"
  },
  {
   "v": "vignette",
   "label": "暗角",
   "css": "background-image: radial-gradient(circle, transparent 55%, rgba(0,0,0,.55) 100%);"
  },
  {
   "v": "vignettesoft",
   "label": "柔暗角",
   "css": "background-image: radial-gradient(circle, transparent 65%, rgba(0,0,0,.40) 100%);"
  },
  {
   "v": "radial",
   "label": "放射叠加",
   "css": "background-image: radial-gradient(circle at 50% 50%, color-mix(in srgb,var(--fx-c1) 16%,transparent), transparent 70%);"
  },
  {
   "v": "conic",
   "label": "圆锥渐变",
   "css": "background-image: conic-gradient(from 0deg, transparent 0 25%, color-mix(in srgb,var(--fx-c1) 8%,transparent) 50%, transparent 75%);"
  },
  {
   "v": "aurora",
   "label": "极光叠加",
   "css": "background-image: radial-gradient(circle at 30% 20%, color-mix(in srgb,var(--fx-c1) 14%,transparent), transparent 60%), radial-gradient(circle at 75% 80%, color-mix(in srgb,var(--fx-c2) 12%,transparent), transparent 60%);"
  },
  {
   "v": "spotlight",
   "label": "聚光叠加",
   "css": "background-image: radial-gradient(ellipse 70% 60% at 50% 0%, color-mix(in srgb,var(--fx-c1) 18%,transparent), transparent 70%);"
  },
  {
   "v": "beam",
   "label": "光束叠加",
   "css": "background-image: conic-gradient(from 200deg at 50% -10%, transparent 0 150deg, color-mix(in srgb,var(--fx-c1) 12%,transparent), transparent 190deg);"
  },
  {
   "v": "rays",
   "label": "光芒射线",
   "css": "background-image: conic-gradient(from 0deg at 50% 100%, color-mix(in srgb,var(--fx-c1) 6%,transparent) 0 15deg, transparent 15deg 45deg, color-mix(in srgb,var(--fx-c1) 6%,transparent) 45deg 60deg, transparent 60deg 90deg, color-mix(in srgb,var(--fx-c1) 6%,transparent) 90deg 105deg, transparent 105deg 135deg, color-mix(in srgb,var(--fx-c1) 6%,transparent) 135deg 150deg, transparent 150deg 180deg, color-mix(in srgb,var(--fx-c1) 6%,transparent) 180deg 195deg, transparent 195deg 225deg, color-mix(in srgb,var(--fx-c1) 6%,transparent) 225deg 240deg, transparent 240deg 270deg, color-mix(in srgb,var(--fx-c1) 6%,transparent) 270deg 285deg, transparent 285deg 315deg, color-mix(in srgb,var(--fx-c1) 6%,transparent) 315deg 330deg, transparent 330deg 360deg);"
  },
  {
   "v": "raystop",
   "label": "顶部光芒",
   "css": "background-image: conic-gradient(from 180deg at 50% 0%, transparent 0 155deg, color-mix(in srgb,var(--fx-c1) 16%,transparent) 180deg 205deg, transparent 230deg);"
  },
  {
   "v": "raysbot",
   "label": "底部光芒",
   "css": "background-image: conic-gradient(from 0deg at 50% 100%, transparent 0 155deg, color-mix(in srgb,var(--fx-c1) 16%,transparent) 180deg 205deg, transparent 230deg);"
  },
  {
   "v": "halftone",
   "label": "半调叠加",
   "css": "background-image: radial-gradient(color-mix(in srgb,var(--fx-c2) 18%,transparent) 2px, transparent 2.8px); background-size:14px 14px;"
  },
  {
   "v": "scanline",
   "label": "扫描线",
   "css": "background-image: repeating-linear-gradient(0deg, transparent 0 3px, color-mix(in srgb,var(--fx-c2) 7%,transparent) 3px 4px);"
  },
  {
   "v": "scanline2",
   "label": "细扫描线",
   "css": "background-image: repeating-linear-gradient(0deg, transparent 0 2px, color-mix(in srgb,var(--fx-c2) 9%,transparent) 2px 3px);"
  },
  {
   "v": "crt",
   "label": "CRT 扫描",
   "css": "background-image: repeating-linear-gradient(0deg, transparent 0 2px, rgba(0,0,0,.16) 2px 4px);"
  },
  {
   "v": "crt2",
   "label": "粗 CRT",
   "css": "background-image: repeating-linear-gradient(0deg, transparent 0 4px, rgba(0,0,0,.18) 4px 8px);"
  },
  {
   "v": "matrix",
   "label": "矩阵叠加",
   "css": "background-image: repeating-linear-gradient(0deg, transparent 0 3px, rgba(0,255,150,.10) 3px 5px);"
  },
  {
   "v": "hologram",
   "label": "全息叠加",
   "css": "background-image: repeating-linear-gradient(0deg, transparent 0 2px, color-mix(in srgb,var(--fx-c1) 8%,transparent) 2px 3px, transparent 3px 5px, color-mix(in srgb,var(--fx-c2) 8%,transparent) 5px 6px);"
  },
  {
   "v": "glitch",
   "label": "故障叠加",
   "css": "background-image: linear-gradient(90deg, transparent 0 48%, rgba(255,0,80,.12) 48% 50%, transparent 50% 52%, rgba(0,200,255,.12) 52% 54%, transparent 54%);"
  },
  {
   "v": "glitchrgb",
   "label": "RGB 偏移",
   "css": "background-image: linear-gradient(90deg, rgba(255,0,80,.10), rgba(0,200,255,.10));"
  },
  {
   "v": "pixel",
   "label": "像素叠加",
   "css": "background-image: linear-gradient(90deg, color-mix(in srgb,var(--fx-c2) 10%,transparent) 1px, transparent 1px), linear-gradient(0deg, color-mix(in srgb,var(--fx-c2) 10%,transparent) 1px, transparent 1px); background-size:6px 6px;"
  },
  {
   "v": "pixelgrid",
   "label": "像素网格",
   "css": "background-image: linear-gradient(90deg, color-mix(in srgb,var(--fx-c2) 12%,transparent) 1px, transparent 1px), linear-gradient(0deg, color-mix(in srgb,var(--fx-c2) 12%,transparent) 1px, transparent 1px); background-size:10px 10px;"
  },
  {
   "v": "stripe",
   "label": "细条纹",
   "css": "background-image: repeating-linear-gradient(90deg, transparent 0 4px, color-mix(in srgb,var(--fx-c2) 8%,transparent) 4px 5px);"
  },
  {
   "v": "stripes",
   "label": "宽条纹",
   "css": "background-image: repeating-linear-gradient(90deg, transparent 0 10px, color-mix(in srgb,var(--fx-c2) 8%,transparent) 10px 12px);"
  },
  {
   "v": "stripebold",
   "label": "粗条纹",
   "css": "background-image: repeating-linear-gradient(90deg, transparent 0 12px, color-mix(in srgb,var(--fx-c2) 12%,transparent) 12px 16px);"
  },
  {
   "v": "rain",
   "label": "雨丝",
   "css": "background-image: repeating-linear-gradient(100deg, transparent 0 14px, color-mix(in srgb,var(--fx-c2) 8%,transparent) 14px 15px);"
  },
  {
   "v": "rain2",
   "label": "斜雨",
   "css": "background-image: repeating-linear-gradient(80deg, transparent 0 18px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 18px 19px);"
  },
  {
   "v": "snow",
   "label": "雪花叠加",
   "css": "background-image: radial-gradient(1.5px 1.5px at 25% 30%, #fff, transparent), radial-gradient(1px 1px at 55% 65%, #fff, transparent), radial-gradient(2px 2px at 75% 20%, #fff, transparent); background-size:38px 38px;"
  },
  {
   "v": "dust",
   "label": "光尘叠加",
   "css": "background-image: radial-gradient(1.5px 1.5px at 30% 40%, rgba(255,255,220,.25), transparent 60%), radial-gradient(1px 1px at 65% 70%, rgba(255,255,220,.18), transparent 60%), radial-gradient(1.2px 1.2px at 45% 25%, rgba(255,255,220,.20), transparent 60%); background-size:38px 38px;"
  },
  {
   "v": "sparkle",
   "label": "闪光叠加",
   "css": "background-image: radial-gradient(2px 2px at 20% 30%, #fff, transparent), radial-gradient(1.5px 1.5px at 60% 55%, #fff, transparent), radial-gradient(2.5px 2.5px at 80% 80%, #fff, transparent); background-size:38px 38px;"
  },
  {
   "v": "smoke",
   "label": "烟雾",
   "css": "background-image: radial-gradient(circle at 30% 60%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 0 30%, transparent 50%), radial-gradient(circle at 70% 40%, color-mix(in srgb,var(--fx-c2) 8%,transparent) 0 30%, transparent 50%);"
  },
  {
   "v": "fog",
   "label": "薄雾",
   "css": "background-image: radial-gradient(circle at 50% 50%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 0 40%, transparent 75%);"
  },
  {
   "v": "cloud",
   "label": "云纹叠加",
   "css": "background-image: radial-gradient(ellipse at 30% 40%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 0 30%, transparent 55%), radial-gradient(ellipse at 70% 60%, color-mix(in srgb,var(--fx-c2) 8%,transparent) 0 30%, transparent 55%);"
  },
  {
   "v": "feather",
   "label": "羽纹叠加",
   "css": "background-image: repeating-linear-gradient(85deg, transparent 0 8px, color-mix(in srgb,var(--fx-c2) 8%,transparent) 8px 9px);"
  },
  {
   "v": "leaf",
   "label": "叶脉叠加",
   "css": "background-image: radial-gradient(ellipse at 35% 45%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 0 14px, transparent 24px); background-size:38px 38px;"
  },
  {
   "v": "scale",
   "label": "鳞片叠加",
   "css": "background-image: radial-gradient(circle at 50% 100%, color-mix(in srgb,var(--fx-c2) 12%,transparent) 0 55%, transparent 57%); background-size:24px 24px;"
  },
  {
   "v": "brick",
   "label": "砖纹叠加",
   "css": "background-image: linear-gradient(color-mix(in srgb,var(--fx-c2) 9%,transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb,var(--fx-c2) 9%,transparent) 1px, transparent 1px); background-size:38px 22px;"
  },
  {
   "v": "arabesque",
   "label": "阿拉伯纹",
   "css": "background-image: radial-gradient(circle at 50% 50%, transparent 0 30%, rgba(255,215,150,.10) 30% 32%, transparent 34%), radial-gradient(circle at 50% 50%, transparent 0 50%, rgba(255,215,150,.08) 50% 52%, transparent 54%); background-size:38px 38px;"
  },
  {
   "v": "moroccan",
   "label": "摩洛哥纹",
   "css": "background-image: linear-gradient(60deg, transparent 0 30%, rgba(255,215,150,.10) 30% 70%, transparent 70%), linear-gradient(120deg, transparent 0 30%, rgba(255,215,150,.10) 30% 70%, transparent 70%); background-size:30px 38px;"
  },
  {
   "v": "herringbone",
   "label": "人字叠加",
   "css": "background-image: repeating-linear-gradient(50deg, transparent 0 12px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 12px 14px), repeating-linear-gradient(-50deg, transparent 0 12px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 12px 14px); background-size:36px 36px;"
  },
  {
   "v": "triangles",
   "label": "三角叠加",
   "css": "background-image: linear-gradient(60deg, transparent 0 50%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 50% 52%, transparent 52%), linear-gradient(120deg, transparent 0 50%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 50% 52%, transparent 52%); background-size:30px 38px;"
  },
  {
   "v": "mesh",
   "label": "网格薄膜",
   "css": "background-image: radial-gradient(circle at 0 0, transparent 0 45%, color-mix(in srgb,var(--fx-c1) 10%,transparent) 55%, transparent 65%), radial-gradient(circle at 100% 100%, transparent 0 45%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 55%, transparent 65%); background-size: 200% 200%;"
  },
  {
   "v": "membrane",
   "label": "薄膜",
   "css": "background-image: linear-gradient(90deg, transparent 49%, color-mix(in srgb,var(--fx-c2) 9%,transparent) 49% 51%, transparent 51%); background-size: 26px 100%;"
  },
  {
   "v": "ripplewave",
   "label": "涟漪波",
   "css": "background-image: repeating-radial-gradient(circle at 50% 50%, transparent 0 12px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 12px 13px, transparent 24px);"
  },
  {
   "v": "spiral",
   "label": "螺旋叠加",
   "css": "background-image: repeating-radial-gradient(circle at 50% 50%, transparent 0 6px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 6px 7px, transparent 12px);"
  },
  {
   "v": "concentric",
   "label": "疏密圆",
   "css": "background-image: repeating-radial-gradient(circle at 50% 50%, transparent 0 8px, color-mix(in srgb,var(--fx-c2) 9%,transparent) 8px 9px, transparent 16px, color-mix(in srgb,var(--fx-c2) 12%,transparent) 16px 17px, transparent 24px);"
  },
  {
   "v": "rings",
   "label": "圆环叠加",
   "css": "background-image: repeating-radial-gradient(circle at 50% 50%, transparent 0 18px, color-mix(in srgb,var(--fx-c2) 11%,transparent) 18px 19px);"
  },
  {
   "v": "dotcircle",
   "label": "圆点圈",
   "css": "background-image: radial-gradient(circle at 50% 50%, color-mix(in srgb,var(--fx-c2) 14%,transparent) 3px, transparent 4px); background-size:24px 24px;"
  },
  {
   "v": "plusgrid",
   "label": "加号网格",
   "css": "background-image: linear-gradient(color-mix(in srgb,var(--fx-c2) 12%,transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb,var(--fx-c2) 12%,transparent) 1px, transparent 1px); background-size:30px 30px; background-position: 15px 15px, 15px 15px;"
  },
  {
   "v": "hash",
   "label": "井号网格",
   "css": "background-image: linear-gradient(color-mix(in srgb,var(--fx-c2) 10%,transparent) 2px, transparent 2px), linear-gradient(90deg, color-mix(in srgb,var(--fx-c2) 10%,transparent) 2px, transparent 2px); background-size:30px 30px;"
  },
  {
   "v": "techlines",
   "label": "科技线",
   "css": "background-image: linear-gradient(90deg, transparent 25%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 25% 27%, transparent 27%), linear-gradient(90deg, transparent 65%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 65% 67%, transparent 67%); background-size:38px 38px;"
  },
  {
   "v": "dataflow",
   "label": "数据流向",
   "css": "background-image: repeating-linear-gradient(90deg, transparent 0 30px, color-mix(in srgb,var(--fx-c1) 12%,transparent) 30px 32px, transparent 32px 50px, color-mix(in srgb,var(--fx-c2) 10%,transparent) 50px 52px, transparent 52px);"
  },
  {
   "v": "halo",
   "label": "光晕叠加",
   "css": "background-image: radial-gradient(circle, color-mix(in srgb,var(--fx-c1) 14%,transparent) 0 40%, transparent 70%);"
  },
  {
   "v": "glowcenter",
   "label": "中心辉光",
   "css": "background-image: radial-gradient(circle at 50% 50%, color-mix(in srgb,var(--fx-c1) 18%,transparent) 0 30%, transparent 65%);"
  },
  {
   "v": "shade",
   "label": "顶部阴影",
   "css": "background-image: linear-gradient(180deg, rgba(0,0,0,.30), transparent 45%);"
  },
  {
   "v": "lift",
   "label": "底部提亮",
   "css": "background-image: linear-gradient(0deg, color-mix(in srgb,var(--fx-c2) 8%,transparent), transparent 45%);"
  }
 ],
 "bd": [
  {
   "v": "none",
   "label": "无边框"
  },
  {
   "v": "solid",
   "label": "实心金属",
   "css": "box-shadow: inset 0 0 0 2px var(--fx-c2);"
  },
  {
   "v": "solidthin",
   "label": "细实线",
   "css": "box-shadow: inset 0 0 0 1px var(--fx-c2);"
  },
  {
   "v": "double",
   "label": "双线",
   "css": "box-shadow: inset 0 0 0 1px #2a3040, inset 0 0 0 4px var(--fx-c2);"
  },
  {
   "v": "doublegap",
   "label": "双线宽缝",
   "css": "box-shadow: inset 0 0 0 2px #161b27, inset 0 0 0 4px var(--fx-c2);"
  },
  {
   "v": "triple",
   "label": "三线",
   "css": "box-shadow: inset 0 0 0 1px var(--fx-c2), inset 0 0 0 4px #161b27, inset 0 0 0 6px var(--fx-c2);"
  },
  {
   "v": "glow",
   "label": "流光发光",
   "css": "box-shadow: 0 0 0 1px var(--fx-c2), 0 0 24px -4px var(--fx-c1), 0 8px 30px rgba(0,0,0,.5);"
  },
  {
   "v": "glowstrong",
   "label": "强光晕",
   "css": "box-shadow: 0 0 0 1px var(--fx-c2), 0 0 40px -2px var(--fx-c1);"
  },
  {
   "v": "glowsoft",
   "label": "柔光晕",
   "css": "box-shadow: 0 0 0 1px var(--fx-c2), 0 6px 40px -8px var(--fx-c1);"
  },
  {
   "v": "neon",
   "label": "霓虹管",
   "css": "box-shadow: 0 0 4px var(--fx-c2), 0 0 14px var(--fx-c2);"
  },
  {
   "v": "neondouble",
   "label": "双管霓虹",
   "css": "box-shadow: 0 0 4px var(--fx-c2), 0 0 14px var(--fx-c2), 0 0 30px var(--fx-c2);"
  },
  {
   "v": "etchedsingle",
   "label": "细蚀刻",
   "css": "box-shadow: inset 0 0 0 1px var(--fx-c2);"
  },
  {
   "v": "etched",
   "label": "蚀刻线",
   "css": "box-shadow: inset 0 0 0 1px var(--fx-c2), inset 0 0 0 3px rgba(0,0,0,.4);"
  },
  {
   "v": "etcheddeep",
   "label": "深蚀刻",
   "css": "box-shadow: inset 0 0 0 1px var(--fx-c2), inset 0 0 0 4px rgba(0,0,0,.5), inset 0 0 0 5px var(--fx-c2);"
  },
  {
   "v": "gradient",
   "label": "渐变描边",
   "css": "box-shadow: inset 0 0 0 2px transparent;"
  },
  {
   "v": "gradientvert",
   "label": "竖向渐变边",
   "css": "box-shadow: inset 0 0 0 2px transparent;"
  },
  {
   "v": "hueshift",
   "label": "色相渐变边",
   "css": "box-shadow: inset 0 0 0 2px transparent;"
  },
  {
   "v": "bevel",
   "label": "斜切倒角",
   "css": "clip-path: polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px);"
  },
  {
   "v": "bevel2",
   "label": "双斜切",
   "css": "clip-path: polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px);"
  },
  {
   "v": "bevelsoft",
   "label": "柔光倒角",
   "css": "clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);"
  },
  {
   "v": "cut",
   "label": "八点斜切",
   "css": "clip-path: polygon(0 12px, 12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px));"
  },
  {
   "v": "cutthin",
   "label": "细斜切",
   "css": "clip-path: polygon(0 8px, 8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px));"
  },
  {
   "v": "notch",
   "label": "缺口切角",
   "css": "clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px));"
  },
  {
   "v": "tape",
   "label": "斜切胶带",
   "css": "clip-path: polygon(0 0, 100% 0, 100% 100%, 20px 100%, 0 calc(100% - 20px));"
  },
  {
   "v": "cyber",
   "label": "赛博角",
   "css": "clip-path: polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px);"
  },
  {
   "v": "cyber2",
   "label": "赛博括号",
   "css": "clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px));"
  },
  {
   "v": "inset",
   "label": "内嵌凹槽",
   "css": "box-shadow: inset 2px 2px 0 var(--fx-c2), inset -2px -2px 0 var(--fx-c2);"
  },
  {
   "v": "insetdeep",
   "label": "深凹槽",
   "css": "box-shadow: inset 3px 3px 0 var(--fx-c2), inset -3px -3px 0 var(--fx-c2), inset 0 0 0 6px rgba(0,0,0,.3);"
  },
  {
   "v": "outset",
   "label": "外凸浮雕",
   "css": "box-shadow: 2px 2px 0 var(--fx-c2), -2px -2px 0 var(--fx-c2);"
  },
  {
   "v": "ridge",
   "label": "脊线",
   "css": "box-shadow: inset 2px 2px 4px color-mix(in srgb,var(--fx-c2) 25%,transparent), inset -2px -2px 4px rgba(0,0,0,.5), 0 0 0 1px var(--fx-c2);"
  },
  {
   "v": "groove",
   "label": "沟槽",
   "css": "box-shadow: inset 2px 2px 4px rgba(0,0,0,.5), inset -2px -2px 4px color-mix(in srgb,var(--fx-c2) 15%,transparent), 0 0 0 1px var(--fx-c2);"
  },
  {
   "v": "dashed",
   "label": "虚线",
   "css": "box-shadow: inset 0 0 0 1px var(--fx-c2);"
  },
  {
   "v": "dashedlong",
   "label": "长虚线",
   "css": "box-shadow: inset 0 0 0 2px var(--fx-c2);"
  },
  {
   "v": "dotted",
   "label": "点线",
   "css": "box-shadow: inset 0 0 0 2px var(--fx-c2);"
  },
  {
   "v": "dotdash",
   "label": "点划线",
   "css": "box-shadow: inset 0 0 0 1px var(--fx-c2);"
  },
  {
   "v": "stitch",
   "label": "缝线",
   "css": "box-shadow: inset 0 0 0 3px #161b27, inset 0 0 0 4px var(--fx-c2);"
  },
  {
   "v": "zigzagline",
   "label": "锯齿边",
   "css": "clip-path: polygon(0 0, 8px 6px, 16px 0, 24px 6px, 32px 0, 100% 0, 100% 100%, 0 100%);"
  },
  {
   "v": "scallop",
   "label": "扇贝边",
   "css": "clip-path: polygon(0 12px, 6px 6px, 12px 12px, 18px 6px, 24px 12px, 30px 6px, 36px 12px, 100% 12px, 100% 100%, 0 100%);"
  },
  {
   "v": "waveedge",
   "label": "波浪边",
   "css": "clip-path: polygon(0 8px, 10px 0, 20px 8px, 30px 0, 40px 8px, 100% 8px, 100% 100%, 0 100%);"
  },
  {
   "v": "rope",
   "label": "绳索纹",
   "css": "box-shadow: inset 0 0 0 4px #161b27, inset 0 0 0 6px var(--fx-c2), repeating-linear-gradient(45deg, transparent 0 6px, rgba(0,0,0,.2) 6px 8px);"
  },
  {
   "v": "chain",
   "label": "链条纹",
   "css": "box-shadow: inset 0 0 0 2px #161b27, inset 0 0 0 4px var(--fx-c2);"
  },
  {
   "v": "frame",
   "label": "古典画框",
   "css": "box-shadow: inset 0 0 0 8px #161b27, inset 0 0 0 10px var(--fx-c2);"
  },
  {
   "v": "framegold",
   "label": "鎏金画框",
   "css": "box-shadow: inset 0 0 0 6px #2a1a08, inset 0 0 0 9px var(--fx-c2);"
  },
  {
   "v": "pillar",
   "label": "立柱框",
   "css": "box-shadow: inset 10px 0 0 var(--fx-c2), inset -10px 0 0 var(--fx-c2);"
  },
  {
   "v": "arch",
   "label": "拱门框",
   "css": "border-radius: 50% 50% 0 0 / 20% 20% 0 0;"
  },
  {
   "v": "shield",
   "label": "盾形框",
   "css": "clip-path: polygon(0 0, 100% 0, 100% 75%, 50% 100%, 0 75%);"
  },
  {
   "v": "crestframe",
   "label": "纹章框",
   "css": "clip-path: polygon(20% 0, 80% 0, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0 80%, 0 20%);"
  },
  {
   "v": "seal",
   "label": "火漆印框",
   "css": "border-radius: 50%;"
  },
  {
   "v": "stamp",
   "label": "邮票齿孔",
   "css": "clip-path: polygon(0 6px, 6px 0, 12px 6px, 18px 0, 24px 6px, 30px 0, 36px 6px, 42px 0, 48px 6px, 54px 0, 60px 6px, 66px 0, 72px 6px, 78px 0, 84px 6px, 90px 0, 96px 6px, 100% 0, 100% 100%, 0 100%);"
  },
  {
   "v": "ticket",
   "label": "票根",
   "css": "clip-path: polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px);"
  },
  {
   "v": "polaroid",
   "label": "拍立得",
   "css": "box-shadow: inset 0 0 0 10px #161b27, inset 0 -30px 0 #0d1119;"
  },
  {
   "v": "card",
   "label": "卡片凸起",
   "css": "box-shadow: 0 2px 0 #2a3040, 0 4px 14px rgba(0,0,0,.5);"
  },
  {
   "v": "card2",
   "label": "双层卡片",
   "css": "box-shadow: 0 2px 0 #2a3040, 0 4px 0 #161b27, 0 6px 20px rgba(0,0,0,.5);"
  },
  {
   "v": "glass",
   "label": "玻璃态边",
   "css": "box-shadow: inset 0 1px 0 color-mix(in srgb,var(--fx-c2) 30%,transparent), inset 0 0 0 1px color-mix(in srgb,var(--fx-c2) 15%,transparent);"
  },
  {
   "v": "glassstrong",
   "label": "强玻璃边",
   "css": "box-shadow: inset 0 1px 0 color-mix(in srgb,var(--fx-c2) 40%,transparent), inset 0 0 0 2px color-mix(in srgb,var(--fx-c2) 20%,transparent);"
  },
  {
   "v": "metal",
   "label": "金属包边",
   "css": "box-shadow: inset 0 1px 0 color-mix(in srgb,var(--fx-c2) 40%,transparent), inset 0 -1px 0 rgba(0,0,0,.4), 0 0 0 1px var(--fx-c2);"
  },
  {
   "v": "metalthin",
   "label": "细金属边",
   "css": "box-shadow: inset 0 1px 0 color-mix(in srgb,var(--fx-c2) 30%,transparent), inset 0 -1px 0 rgba(0,0,0,.3), 0 0 0 1px var(--fx-c2);"
  },
  {
   "v": "chrome",
   "label": "镀铬边",
   "css": "box-shadow: inset 0 2px 4px color-mix(in srgb,var(--fx-c2) 50%,transparent), inset 0 -2px 4px rgba(0,0,0,.4), 0 0 0 1px var(--fx-c2);"
  },
  {
   "v": "copper",
   "label": "铜包边",
   "css": "box-shadow: inset 0 1px 0 rgba(255,180,120,.4), inset 0 0 0 2px var(--fx-c2);"
  },
  {
   "v": "titanium",
   "label": "钛合金边",
   "css": "box-shadow: inset 0 1px 0 color-mix(in srgb,var(--fx-c2) 35%,transparent), inset 0 0 0 2px var(--fx-c2), 0 0 24px -8px var(--fx-c2);"
  },
  {
   "v": "wood",
   "label": "木质边框",
   "css": "box-shadow: inset 0 0 0 6px #3a2410, inset 0 0 0 7px var(--fx-c2);"
  },
  {
   "v": "acrylic",
   "label": "亚克力边",
   "css": "box-shadow: inset 0 0 0 1px color-mix(in srgb,var(--fx-c2) 40%,transparent); background: color-mix(in srgb,var(--fx-c2) 6%,transparent); backdrop-filter: blur(8px);"
  },
  {
   "v": "marblebd",
   "label": "大理石边",
   "css": "box-shadow: inset 0 0 0 3px #161b27, inset 0 0 0 5px var(--fx-c2);"
  },
  {
   "v": "rotating",
   "label": "旋转渐变环",
   "css": "box-shadow: inset 0 0 0 2px transparent; animation: bdSpin 5s linear infinite;"
  },
  {
   "v": "tracing",
   "label": "描边追踪",
   "css": "box-shadow: inset 0 0 0 2px transparent;"
  },
  {
   "v": "focus",
   "label": "焦点发光",
   "css": "box-shadow: 0 0 0 2px #161b27, 0 0 0 4px var(--fx-c2);"
  },
  {
   "v": "halftonebd",
   "label": "半调边",
   "css": "box-shadow: inset 0 0 0 2px var(--fx-c2);"
  },
  {
   "v": "pixel",
   "label": "像素点边",
   "css": "box-shadow: inset 0 0 0 3px var(--fx-c2);"
  },
  {
   "v": "bracket",
   "label": "方括号",
   "css": "box-shadow: inset 4px 0 0 var(--fx-c2), inset -4px 0 0 var(--fx-c2);"
  },
  {
   "v": "arrow",
   "label": "箭头角",
   "css": "clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 60%, 12px 50%, 0 40%);"
  },
  {
   "v": "plusbr",
   "label": "十字角",
   "css": "box-shadow: inset 0 0 0 2px var(--fx-c2);"
  },
  {
   "v": "dotbr",
   "label": "圆点角",
   "css": "box-shadow: inset 0 0 0 2px var(--fx-c2);"
  },
  {
   "v": "ring",
   "label": "圆环框",
   "css": "box-shadow: inset 0 0 0 6px transparent, 0 0 0 1px var(--fx-c2);"
  },
  {
   "v": "ringdouble",
   "label": "双圆环",
   "css": "box-shadow: inset 0 0 0 4px transparent, inset 0 0 0 8px var(--fx-c2), 0 0 0 1px var(--fx-c2);"
  },
  {
   "v": "glowpulse",
   "label": "发光脉冲边",
   "css": "box-shadow: 0 0 0 1px var(--fx-c2); animation: bdPulse 2.5s ease-out infinite;"
  },
  {
   "v": "innershine",
   "label": "内辉光边",
   "css": "box-shadow: inset 0 0 30px -4px var(--fx-c2);"
  },
  {
   "v": "synth",
   "label": "合成器双色",
   "css": "box-shadow: 0 0 0 1px var(--fx-c2), 0 0 24px -4px var(--fx-c2);"
  },
  {
   "v": "scanlinebd",
   "label": "扫描线边",
   "css": "box-shadow: inset 0 0 0 1px var(--fx-c2);"
  },
  {
   "v": "split",
   "label": "上下分色边",
   "css": "box-shadow: inset 0 6px 0 var(--fx-c2), inset 0 -6px 0 var(--fx-c2);"
  },
  {
   "v": "cornerclip",
   "label": "对角裁切",
   "css": "clip-path: polygon(16px 0, calc(100% - 16px) 0, 100% 16px, 100% calc(100% - 16px), calc(100% - 16px) 100%, 16px 100%, 0 calc(100% - 16px), 0 16px);"
  },
  {
   "v": "torn",
   "label": "撕裂边",
   "css": "clip-path: polygon(0 4px, 8px 0, 16px 5px, 24px 1px, 32px 6px, 100% 0, 100% 100%, 0 100%);"
  },
  {
   "v": "tapecorner",
   "label": "胶带贴角",
   "css": "box-path: none;"
  },
  {
   "v": "minimal",
   "label": "极简上线",
   "css": "box-shadow: 0 -2px 0 var(--fx-c2);"
  },
  {
   "v": "minimal2",
   "label": "极简框线",
   "css": "box-shadow: inset 4px 0 0 var(--fx-c2);"
  },
  {
   "v": "fancy",
   "label": "华丽双层",
   "css": "box-shadow: inset 0 0 0 2px var(--fx-c2), inset 0 0 0 6px #161b27, inset 0 0 0 8px var(--fx-c2);"
  }
 ],
 "gw": [
  {
   "v": "none",
   "label": "无辉光"
  },
  {
   "v": "outer",
   "label": "外发光",
   "css": "box-shadow: 0 0 24px -2px var(--fx-c2), 0 8px 30px rgba(0,0,0,.5);"
  },
  {
   "v": "outer2",
   "label": "双层外发光",
   "css": "box-shadow: 0 0 18px var(--fx-c2), 0 0 40px -4px var(--fx-c2), 0 8px 30px rgba(0,0,0,.5);"
  },
  {
   "v": "inner",
   "label": "内辉光",
   "css": "box-shadow: inset 0 0 50px -10px var(--fx-c2);"
  },
  {
   "v": "both",
   "label": "内外发光",
   "css": "box-shadow: 0 0 24px -2px var(--fx-c2), inset 0 0 30px -8px var(--fx-c2);"
  },
  {
   "v": "soft",
   "label": "柔光晕",
   "css": "box-shadow: 0 6px 40px -6px var(--fx-c2);"
  },
  {
   "v": "softwide",
   "label": "广角柔光",
   "css": "box-shadow: 0 10px 60px -10px var(--fx-c2);"
  },
  {
   "v": "tight",
   "label": "紧致光核",
   "css": "box-shadow: 0 0 10px 2px var(--fx-c2);"
  },
  {
   "v": "breath",
   "label": "呼吸灯",
   "css": "animation: gwBreath 3.5s ease-in-out infinite;"
  },
  {
   "v": "breathslow",
   "label": "慢呼吸",
   "css": "animation: gwBreath 6s ease-in-out infinite;"
  },
  {
   "v": "pulse",
   "label": "脉冲环",
   "css": "animation: gwPulse 2.2s ease-out infinite;"
  },
  {
   "v": "pulse2",
   "label": "双脉冲",
   "css": "animation: gwPulse2 2.6s ease-out infinite;"
  },
  {
   "v": "sonar",
   "label": "声纳扩散",
   "css": "animation: gwSonar 3s ease-out infinite;"
  },
  {
   "v": "neon",
   "label": "霓虹灯管",
   "css": "box-shadow: 0 0 6px var(--fx-c2), 0 0 18px var(--fx-c2), 0 0 46px var(--fx-c2);"
  },
  {
   "v": "neonflick",
   "label": "霓虹闪烁",
   "css": "animation: gwFlick 8s infinite;"
  },
  {
   "v": "buzzing",
   "label": "蜂鸣辉光",
   "css": "animation: gwBuzz 3s infinite;"
  },
  {
   "v": "rainbow",
   "label": "彩虹光",
   "css": "animation: gwRainbow 4s linear infinite;"
  },
  {
   "v": "rainbowslow",
   "label": "慢彩虹",
   "css": "animation: gwRainbow 8s linear infinite;"
  },
  {
   "v": "aurora",
   "label": "极光流",
   "css": "background-image: radial-gradient(circle at 20% 0%, color-mix(in srgb,var(--fx-c2) 12%,transparent), transparent 60%), radial-gradient(circle at 85% 100%, color-mix(in srgb,var(--fx-c2) 10%,transparent), transparent 55%);"
  },
  {
   "v": "spot",
   "label": "聚光灯",
   "css": "box-shadow: 0 -10px 50px -15px var(--fx-c2);"
  },
  {
   "v": "volumetric",
   "label": "体积光",
   "css": "box-shadow: 0 0 60px -10px var(--fx-c2), inset 0 0 40px -20px var(--fx-c2);"
  },
  {
   "v": "bloom",
   "label": "泛光",
   "css": "box-shadow: 0 0 20px var(--fx-c2), 0 0 60px -10px var(--fx-c2);"
  },
  {
   "v": "bloomsoft",
   "label": "柔泛光",
   "css": "box-shadow: 0 0 30px -6px var(--fx-c2), 0 0 80px -20px var(--fx-c2);"
  },
  {
   "v": "glowup",
   "label": "渐强发光",
   "css": "animation: gwUp 2.5s ease-in-out infinite alternate;"
  },
  {
   "v": "glowdown",
   "label": "渐弱辉光",
   "css": "animation: gwDown 2.5s ease-in-out infinite alternate;"
  },
  {
   "v": "shimmer",
   "label": "微光闪烁",
   "css": "animation: gwShim 4s ease-in-out infinite;"
  },
  {
   "v": "sparkle",
   "label": "闪烁星点",
   "css": "animation: gwSpark 5s ease-in-out infinite;"
  },
  {
   "v": "fairy",
   "label": "萤火微光",
   "css": "animation: gwFairy 6s ease-in-out infinite;"
  },
  {
   "v": "halo",
   "label": "神圣光环",
   "css": "box-shadow: 0 0 30px 4px var(--fx-c2), inset 0 0 20px var(--fx-c2);"
  },
  {
   "v": "halorot",
   "label": "旋转光环",
   "css": "animation: gwHaloRot 6s linear infinite;"
  },
  {
   "v": "ringglow",
   "label": "光环扩散",
   "css": "box-shadow: 0 0 0 1px var(--fx-c2), 0 0 24px -2px var(--fx-c2);"
  },
  {
   "v": "shadowcore",
   "label": "暗核逆光",
   "css": "box-shadow: inset 0 0 40px 4px rgba(0,0,0,.5), 0 0 30px -6px var(--fx-c2);"
  },
  {
   "v": "underglow",
   "label": "底部托光",
   "css": "box-shadow: 0 20px 40px -10px var(--fx-c2);"
  },
  {
   "v": "topglow",
   "label": "顶部高光",
   "css": "box-shadow: 0 -20px 40px -10px var(--fx-c2);"
  },
  {
   "v": "sides",
   "label": "双侧光束",
   "css": "box-shadow: -16px 0 40px -16px var(--fx-c2), 16px 0 40px -16px var(--fx-c2);"
  },
  {
   "v": "fire",
   "label": "火焰光",
   "css": "box-shadow: 0 0 24px -2px #ff5722, 0 0 50px -10px #ff9800;"
  },
  {
   "v": "ice",
   "label": "寒冰辉光",
   "css": "box-shadow: 0 0 28px -2px #80deea, inset 0 0 20px -4px #b2ebf2;"
  },
  {
   "v": "magic",
   "label": "魔法辉光",
   "css": "box-shadow: 0 0 26px -2px #ce93d8, 0 0 50px -12px #ba68c8;"
  },
  {
   "v": "electric",
   "label": "电弧光",
   "css": "box-shadow: 0 0 12px #00e5ff, 0 0 30px #00bcd4, inset 0 0 12px #00e5ff;"
  },
  {
   "v": "plasma",
   "label": "等离子",
   "css": "box-shadow: 0 0 22px -2px #b388ff, 0 0 50px -10px #7c4dff;"
  },
  {
   "v": "laser",
   "label": "激光边",
   "css": "box-shadow: 0 0 4px var(--fx-c2), 0 0 14px var(--fx-c2), 0 0 32px var(--fx-c2);"
  },
  {
   "v": "energy",
   "label": "能量场",
   "css": "box-shadow: 0 0 20px -2px var(--fx-c2), inset 0 0 16px -4px var(--fx-c2); animation: gwBreath 3s ease-in-out infinite;"
  },
  {
   "v": "energyflow",
   "label": "能量流",
   "css": "animation: gwFlow 3s ease-in-out infinite alternate;"
  },
  {
   "v": "core",
   "label": "能量核心",
   "css": "box-shadow: inset 0 0 20px 4px var(--fx-c2), 0 0 30px -4px var(--fx-c2);"
  },
  {
   "v": "gridglow",
   "label": "网格发光",
   "css": "box-shadow: 0 0 30px -6px var(--fx-c2); filter: drop-shadow(0 0 6px var(--fx-c2));"
  },
  {
   "v": "matrixglow",
   "label": "矩阵辉光",
   "css": "box-shadow: 0 0 24px -2px #00ff96;"
  },
  {
   "v": "glitch",
   "label": "故障辉光",
   "css": "animation: gwGlitch 3s infinite;"
  },
  {
   "v": "glitchrgb",
   "label": "RGB 偏移",
   "css": "box-shadow: -3px 0 0 rgba(255,0,80,.5), 3px 0 0 rgba(0,200,255,.5);"
  },
  {
   "v": "scan",
   "label": "扫描扫光",
   "css": "animation: gwScan 6s linear infinite;"
  },
  {
   "v": "scanline",
   "label": "扫描线",
   "css": "box-shadow: inset 0 0 0 1px var(--fx-c2);"
  },
  {
   "v": "crt",
   "label": "CRT 屏幕",
   "css": "box-shadow: inset 0 0 60px rgba(0,0,0,.5);"
  },
  {
   "v": "hologram",
   "label": "全息投影",
   "css": "box-shadow: 0 0 24px -2px var(--fx-c2), inset 0 0 24px -6px var(--fx-c2); animation: gwHolo 5s ease-in-out infinite;"
  },
  {
   "v": "hologrid",
   "label": "全息网格",
   "css": "box-shadow: 0 0 24px -4px var(--fx-c2); filter: drop-shadow(0 0 4px var(--fx-c2));"
  },
  {
   "v": "morph",
   "label": "形变光",
   "css": "animation: gwMorph 8s ease-in-out infinite;"
  },
  {
   "v": "wobble",
   "label": "摆动辉光",
   "css": "animation: gwWobble 4s ease-in-out infinite;"
  },
  {
   "v": "strobe",
   "label": "频闪",
   "css": "animation: gwStrobe 2s steps(2) infinite;"
  },
  {
   "v": "flicker",
   "label": "烛火微闪",
   "css": "animation: gwFlicker 4s infinite;"
  },
  {
   "v": "ember",
   "label": "余烬",
   "css": "box-shadow: 0 0 20px -4px #ff6d00, 0 0 40px -12px #ff3d00;"
  },
  {
   "v": "sunset",
   "label": "暮光渐变",
   "css": "box-shadow: 0 0 40px -10px #ff7043, 0 -10px 50px -16px #ffab40;"
  },
  {
   "v": "dawn",
   "label": "晨光",
   "css": "box-shadow: 0 0 40px -12px #ff8a80, 0 0 60px -18px #ffd180;"
  },
  {
   "v": "golden",
   "label": "黄金时刻",
   "css": "box-shadow: 0 0 30px -6px #ffd54f;"
  },
  {
   "v": "silver",
   "label": "银光",
   "css": "box-shadow: 0 0 30px -6px #cfd8dc;"
  },
  {
   "v": "iridescent",
   "label": "虹彩薄膜",
   "css": "box-shadow: 0 0 24px -2px var(--fx-c2); animation: gwIridescent 5s linear infinite;"
  },
  {
   "v": "oil",
   "label": "油膜虹彩",
   "css": "box-shadow: 0 0 24px -4px var(--fx-c2); animation: gwOil 6s linear infinite;"
  },
  {
   "v": "soap",
   "label": "皂泡",
   "css": "box-shadow: 0 0 30px -6px var(--fx-c2); animation: gwSoap 7s ease-in-out infinite;"
  },
  {
   "v": "prism",
   "label": "棱镜分光",
   "css": "box-shadow: -4px 0 12px rgba(255,0,80,.5), 4px 0 12px rgba(0,150,255,.5);"
  },
  {
   "v": "chroma",
   "label": "色散边",
   "css": "box-shadow: 0 0 14px var(--fx-c2); animation: gwChroma 5s linear infinite;"
  },
  {
   "v": "ambient",
   "label": "环境光",
   "css": "box-shadow: 0 8px 40px -8px var(--fx-c2);"
  },
  {
   "v": "ambientsm",
   "label": "微环境光",
   "css": "box-shadow: 0 6px 30px -10px var(--fx-c2);"
  },
  {
   "v": "refract",
   "label": "折射光",
   "css": "box-shadow: 0 0 20px -4px var(--fx-c2); filter: blur(.2px);"
  },
  {
   "v": "reflect",
   "label": "镜面反射",
   "css": "box-shadow: inset 0 -20px 40px -20px var(--fx-c2), 0 10px 30px -10px var(--fx-c2);"
  },
  {
   "v": "shadow",
   "label": "柔和投影",
   "css": "box-shadow: 0 12px 30px -8px rgba(0,0,0,.6);"
  },
  {
   "v": "shadowdeep",
   "label": "深投影",
   "css": "box-shadow: 0 20px 50px -10px rgba(0,0,0,.7);"
  },
  {
   "v": "shadowlong",
   "label": "长投影",
   "css": "box-shadow: 20px 20px 40px -10px rgba(0,0,0,.6);"
  },
  {
   "v": "layered",
   "label": "多层光",
   "css": "box-shadow: 0 0 10px var(--fx-c2), 0 0 26px -2px var(--fx-c2), 0 0 50px -10px var(--fx-c2), inset 0 0 16px -4px var(--fx-c2);"
  },
  {
   "v": "comet",
   "label": "彗星尾光",
   "css": "animation: gwComet 6s ease-in-out infinite;"
  },
  {
   "v": "flare",
   "label": "镜头光晕",
   "css": "box-shadow: 0 0 60px 4px var(--fx-c2), 0 0 120px -10px var(--fx-c2);"
  },
  {
   "v": "dust",
   "label": "光尘",
   "css": "box-shadow: 0 0 40px -10px var(--fx-c2);"
  },
  {
   "v": "starlight",
   "label": "星光",
   "css": "box-shadow: 0 0 20px -2px var(--fx-c2), inset 0 0 10px -2px #fff;"
  },
  {
   "v": "sunbeam",
   "label": "日冕光束",
   "css": "box-shadow: 0 -20px 60px -16px var(--fx-c2);"
  },
  {
   "v": "lunar",
   "label": "月华清辉",
   "css": "box-shadow: 0 0 40px -10px #cfd8dc, inset 0 0 20px -6px #eceff1;"
  },
  {
   "v": "twilight",
   "label": "暮色微光",
   "css": "box-shadow: 0 0 40px -10px #b39ddb, 0 0 60px -18px #f48fb1;"
  },
  {
   "v": "polar",
   "label": "极光流转",
   "css": "box-shadow: 0 0 40px -10px var(--fx-c2); animation: gwPolar 6s linear infinite;"
  },
  {
   "v": "candle",
   "label": "烛火摇曳",
   "css": "box-shadow: 0 0 20px -4px #ffb74d; animation: gwFlicker 3s infinite;"
  },
  {
   "v": "torch",
   "label": "火炬炽燃",
   "css": "box-shadow: 0 0 26px -4px #ff8a65, 0 0 50px -12px #ff5722;"
  },
  {
   "v": "lamp",
   "label": "暖灯柔光",
   "css": "box-shadow: 0 0 30px -6px #ffe082;"
  },
  {
   "v": "dreame",
   "label": "幻梦流光",
   "css": "box-shadow: 0 0 40px -12px #ea80fc, 0 0 60px -20px #b388ff;"
  }
 ],
 "ty": [
  {
   "v": "serif",
   "label": "优雅衬线",
   "css": "font-family: \"Songti SC\", \"SimSun\", \"Noto Serif SC\", serif; font-weight: 700; letter-spacing: 1px;"
  },
  {
   "v": "serif2",
   "label": "经典衬线",
   "css": "font-family: \"Source Serif Pro\", Georgia, serif; font-weight: 700;"
  },
  {
   "v": "serif3",
   "label": "人文衬线",
   "css": "font-family: \"Iowan Old Style\", \"Apple Garamond\", Georgia, serif; font-weight: 600; letter-spacing: .5px;"
  },
  {
   "v": "seriftrad",
   "label": "传统宋体",
   "css": "font-family: \"SimSun\", \"宋体\", serif; font-weight: 700;"
  },
  {
   "v": "serifdisplay",
   "label": "展示衬线",
   "css": "font-family: \"Playfair Display\", \"Songti SC\", serif; font-weight: 900; letter-spacing: 1.5px;"
  },
  {
   "v": "bodoni",
   "label": "波多尼",
   "css": "font-family: \"Bodoni 72\", \"Didot\", serif; font-weight: 700; letter-spacing: 2px;"
  },
  {
   "v": "garamond",
   "label": "加拉蒙",
   "css": "font-family: \"Adobe Garamond\", \"Garamond\", serif; font-weight: 600;"
  },
  {
   "v": "caslon",
   "label": "卡斯隆",
   "css": "font-family: \"Big Caslon\", \"Caslon\", serif; font-weight: 600; letter-spacing: .5px;"
  },
  {
   "v": "sans",
   "label": "硬核无衬",
   "css": "font-family: \"PingFang SC\", \"Microsoft YaHei\", sans-serif; font-weight: 800; letter-spacing: .5px;"
  },
  {
   "v": "sans2",
   "label": "极简无衬",
   "css": "font-family: \"Inter\", \"Helvetica Neue\", sans-serif; font-weight: 700;"
  },
  {
   "v": "sans3",
   "label": "圆润无衬",
   "css": "font-family: \"Nunito\", \"PingFang SC\", sans-serif; font-weight: 800; border-radius: 4px;"
  },
  {
   "v": "sans4",
   "label": "几何无衬",
   "css": "font-family: \"Futura\", \"Montserrat\", sans-serif; font-weight: 700; letter-spacing: 2px;"
  },
  {
   "v": "sans5",
   "label": "人文无衬",
   "css": "font-family: \"IBM Plex Sans\", \"PingFang SC\", sans-serif; font-weight: 600;"
  },
  {
   "v": "sansbold",
   "label": "粗黑无衬",
   "css": "font-family: \"PingFang SC\", \"Microsoft YaHei\", sans-serif; font-weight: 900; letter-spacing: .5px;"
  },
  {
   "v": "sanslight",
   "label": "细体无衬",
   "css": "font-family: \"PingFang SC\", \"Microsoft YaHei\", sans-serif; font-weight: 300; letter-spacing: 1px;"
  },
  {
   "v": "sanscond",
   "label": "窄体无衬",
   "css": "font-family: \"PingFang SC\", \"Microsoft YaHei\", sans-serif; font-weight: 700; letter-spacing: .2px;"
  },
  {
   "v": "hei",
   "label": "黑体",
   "css": "font-family: \"Microsoft YaHei\", \"黑体\", sans-serif; font-weight: 700;"
  },
  {
   "v": "heilight",
   "label": "细黑体",
   "css": "font-family: \"Microsoft YaHei\", \"黑体\", sans-serif; font-weight: 300;"
  },
  {
   "v": "heibold",
   "label": "粗黑体",
   "css": "font-family: \"Microsoft YaHei\", \"黑体\", sans-serif; font-weight: 900;"
  },
  {
   "v": "song",
   "label": "宋体",
   "css": "font-family: \"SimSun\", \"宋体\", serif;"
  },
  {
   "v": "kai",
   "label": "楷体",
   "css": "font-family: \"Kaiti SC\", \"楷体\", serif;"
  },
  {
   "v": "kaiti",
   "label": "繁楷",
   "css": "font-family: \"標楷體\", \"Kaiti SC\", serif;"
  },
  {
   "v": "fang",
   "label": "仿宋",
   "css": "font-family: \"FangSong\", \"仿宋\", serif;"
  },
  {
   "v": "li",
   "label": "隶书",
   "css": "font-family: \"LiSu\", \"隶书\", serif;"
  },
  {
   "v": "xiao",
   "label": "小篆",
   "css": "font-family: \"STXingkai\", \"Xingkai SC\", serif;"
  },
  {
   "v": "mono",
   "label": "极客等宽",
   "css": "font-family: \"JetBrains Mono\", \"Consolas\", monospace; font-weight: 600; letter-spacing: 2px;"
  },
  {
   "v": "mono2",
   "label": "经典等宽",
   "css": "font-family: \"Courier New\", monospace; font-weight: 700;"
  },
  {
   "v": "mono3",
   "label": "细等宽",
   "css": "font-family: \"Fira Code\", \"Consolas\", monospace; font-weight: 500;"
  },
  {
   "v": "monobold",
   "label": "粗等宽",
   "css": "font-family: \"JetBrains Mono\", \"Consolas\", monospace; font-weight: 800; letter-spacing: 1px;"
  },
  {
   "v": "monocond",
   "label": "窄等宽",
   "css": "font-family: \"JetBrains Mono\", \"Consolas\", monospace; font-weight: 600; letter-spacing: 1px;"
  },
  {
   "v": "monolight",
   "label": "终端等宽",
   "css": "font-family: \"VT323\", \"Courier New\", monospace; font-weight: 400;"
  },
  {
   "v": "display",
   "label": "展示美术",
   "css": "font-family: \"Impact\", \"Arial Black\", sans-serif; font-weight: 900; letter-spacing: 3px;"
  },
  {
   "v": "display2",
   "label": "粗展示",
   "css": "font-family: \"Bebas Neue\", \"Oswald\", \"Arial Narrow\", sans-serif; font-weight: 700; letter-spacing: 2px;"
  },
  {
   "v": "display3",
   "label": "极粗展示",
   "css": "font-family: \"Anton\", \"Arial Narrow\", sans-serif; font-weight: 700; letter-spacing: 2px;"
  },
  {
   "v": "displaythin",
   "label": "极细展示",
   "css": "font-family: \"Oswald\", \"Arial Narrow\", sans-serif; font-weight: 300; letter-spacing: 3px;"
  },
  {
   "v": "cond",
   "label": "窄体展示",
   "css": "font-family: \"Oswald\", \"Arial Narrow\", sans-serif; font-weight: 700; letter-spacing: 1px;"
  },
  {
   "v": "extcond",
   "label": "超窄体",
   "css": "font-family: \"Bebas Neue\", \"Arial Narrow\", sans-serif; font-weight: 700; letter-spacing: .5px;"
  },
  {
   "v": "extwide",
   "label": "超宽体",
   "css": "font-family: \"Arial Narrow\", sans-serif; font-weight: 700; letter-spacing: 5px;"
  },
  {
   "v": "script",
   "label": "优雅手写",
   "css": "font-family: \"Snell Roundhand\", \"Brush Script MT\", cursive; font-weight: 600;"
  },
  {
   "v": "script2",
   "label": "毛笔手写",
   "css": "font-family: \"Xingkai SC\", \"Kaiti SC\", cursive; font-weight: 600;"
  },
  {
   "v": "script3",
   "label": "草体",
   "css": "font-family: \"Dancing Script\", cursive; font-weight: 700;"
  },
  {
   "v": "hand",
   "label": "印刷手写",
   "css": "font-family: \"Comic Sans MS\", \"PingFang SC\", cursive; font-weight: 600;"
  },
  {
   "v": "hand2",
   "label": "圆体手写",
   "css": "font-family: \"Marker Felt\", \"Chalkboard SE\", cursive;"
  },
  {
   "v": "cursive",
   "label": "连笔",
   "css": "font-family: \"Apple Chancery\", \"Segoe Script\", cursive;"
  },
  {
   "v": "brush",
   "label": "笔刷",
   "css": "font-family: \"Brush Script MT\", \"Kaiti SC\", cursive; font-weight: 700;"
  },
  {
   "v": "brush2",
   "label": "粗笔刷",
   "css": "font-family: \"Xingkai SC\", cursive; font-weight: 800; letter-spacing: 1px;"
  },
  {
   "v": "gothic",
   "label": "哥特黑体",
   "css": "font-family: \"Fette Fraktur\", \"UnifrakturCook\", serif; font-weight: 700;"
  },
  {
   "v": "gothic2",
   "label": "破碎哥特",
   "css": "font-family: \"Blackletter\", serif; font-weight: 700; letter-spacing: 1px;"
  },
  {
   "v": "gothictext",
   "label": "古英哥特",
   "css": "font-family: \"Textura\", serif; font-weight: 700;"
  },
  {
   "v": "stencil",
   "label": "镂空字",
   "css": "font-family: \"Stencil Std\", \"Impact\", sans-serif; font-weight: 700;"
  },
  {
   "v": "stencil2",
   "label": "粗镂空",
   "css": "font-family: \"Allerta Stencil\", \"Impact\", sans-serif; font-weight: 700;"
  },
  {
   "v": "inline",
   "label": "内线装饰",
   "css": "font-family: \"PingFang SC\", \"Microsoft YaHei\", sans-serif; font-weight: 800; -webkit-text-stroke: 1px var(--fx-c1); color: transparent;"
  },
  {
   "v": "shadow",
   "label": "阴影字",
   "css": "font-family: \"PingFang SC\", \"Microsoft YaHei\", sans-serif; font-weight: 800; text-shadow: 3px 3px 0 color-mix(in srgb,var(--fx-c1) 62%,#000);"
  },
  {
   "v": "outline",
   "label": "描边字",
   "css": "font-family: \"PingFang SC\", \"Microsoft YaHei\", sans-serif; font-weight: 800; -webkit-text-stroke: 1.5px var(--fx-c1); color: transparent;"
  },
  {
   "v": "doubleout",
   "label": "双描边",
   "css": "font-family: \"PingFang SC\", \"Microsoft YaHei\", sans-serif; font-weight: 800; -webkit-text-stroke: 2.5px var(--fx-c1); color: transparent;"
  },
  {
   "v": "gradient",
   "label": "渐变字",
   "css": "background: linear-gradient(135deg, color-mix(in srgb,var(--fx-c1) 72%,#fff), color-mix(in srgb,var(--fx-c1) 62%,#000)); -webkit-background-clip: text; background-clip: text; color: transparent; font-weight: 800;"
  },
  {
   "v": "metallic",
   "label": "金属字",
   "css": "background: linear-gradient(180deg, color-mix(in srgb,var(--fx-c1) 72%,#fff), color-mix(in srgb,var(--fx-c1) 62%,#000)); -webkit-background-clip: text; background-clip: text; color: transparent; font-weight: 800;"
  },
  {
   "v": "neonfont",
   "label": "霓虹字",
   "css": "font-family: \"PingFang SC\", \"Microsoft YaHei\", sans-serif; font-weight: 800; color: #fff; text-shadow: 0 0 4px var(--fx-c1), 0 0 12px var(--fx-c1);"
  },
  {
   "v": "chrome",
   "label": "镀铬字",
   "css": "background: linear-gradient(180deg, #fff 0%, color-mix(in srgb,var(--fx-c1) 72%,#fff) 45%, color-mix(in srgb,var(--fx-c1) 62%,#000) 55%, #fff 100%); -webkit-background-clip: text; background-clip: text; color: transparent; font-weight: 800;"
  },
  {
   "v": "woodf",
   "label": "木质字",
   "css": "background: linear-gradient(180deg, #b07d54, #6b4423); -webkit-background-clip: text; background-clip: text; color: transparent; font-weight: 800;"
  },
  {
   "v": "marblef",
   "label": "大理石字",
   "css": "background: linear-gradient(120deg, #f5f5f5, #c9c9c9, #f5f5f5); -webkit-background-clip: text; background-clip: text; color: transparent; font-weight: 800;"
  },
  {
   "v": "glassf",
   "label": "玻璃字",
   "css": "background: linear-gradient(135deg, color-mix(in srgb,var(--fx-c2) 90%,transparent), color-mix(in srgb,var(--fx-c2) 40%,transparent)); -webkit-background-clip: text; background-clip: text; color: transparent; font-weight: 800;"
  },
  {
   "v": "pixel",
   "label": "像素字",
   "css": "font-family: \"Silkscreen\", \"Press Start 2P\", monospace; font-weight: 400; letter-spacing: 1px;"
  },
  {
   "v": "pixel2",
   "label": "方块字",
   "css": "font-family: \"VT323\", monospace; font-weight: 400;"
  },
  {
   "v": "pixel3",
   "label": "复古像素",
   "css": "font-family: \"Press Start 2P\", monospace; font-weight: 400; letter-spacing: .5px;"
  },
  {
   "v": "rounded",
   "label": "圆体字",
   "css": "font-family: \"Quicksand\", \"PingFang SC\", sans-serif; font-weight: 700;"
  },
  {
   "v": "roundbold",
   "label": "粗圆体",
   "css": "font-family: \"Varela Round\", \"PingFang SC\", sans-serif; font-weight: 700;"
  },
  {
   "v": "marker",
   "label": "马克笔",
   "css": "font-family: \"Permanent Marker\", \"Marker Felt\", cursive; font-weight: 400;"
  },
  {
   "v": "chalk",
   "label": "粉笔",
   "css": "font-family: \"Chalkboard SE\", \"Comic Sans MS\", cursive;"
  },
  {
   "v": "typewriter",
   "label": "打字机体",
   "css": "font-family: \"Courier Prime\", \"Courier New\", monospace;"
  },
  {
   "v": "stampf",
   "label": "印章体",
   "css": "font-family: \"Courier New\", monospace; font-weight: 700; letter-spacing: 2px; color: color-mix(in srgb,var(--fx-c1) 72%,#fff); border: 2px solid var(--fx-c1); padding: 0 4px; display: inline-block;"
  },
  {
   "v": "comic",
   "label": "漫画体",
   "css": "font-family: \"Comic Sans MS\", \"PingFang SC\", cursive; font-weight: 700;"
  },
  {
   "v": "artdeco",
   "label": "装饰艺术体",
   "css": "font-family: \"Fascinate\", \"Playfair Display\", serif; font-weight: 400; letter-spacing: 2px;"
  },
  {
   "v": "retro",
   "label": "复古广告",
   "css": "font-family: \"Rye\", \"Playfair Display\", serif; font-weight: 400; letter-spacing: 1px;"
  },
  {
   "v": "cyber",
   "label": "赛博体",
   "css": "font-family: \"Orbitron\", \"Rajdhani\", sans-serif; font-weight: 700; letter-spacing: 3px;"
  },
  {
   "v": "glitchf",
   "label": "故障体",
   "css": "font-family: \"Rajdhani\", \"PingFang SC\", sans-serif; font-weight: 800; letter-spacing: 1px;"
  },
  {
   "v": "runic",
   "label": "符文字",
   "css": "font-family: \"Cinzel\", serif; font-weight: 600; letter-spacing: 2px;"
  },
  {
   "v": "uppercase",
   "label": "全大写",
   "css": "text-transform: uppercase; letter-spacing: 3px;"
  },
  {
   "v": "lowercase",
   "label": "全小写",
   "css": "text-transform: lowercase;"
  },
  {
   "v": "caps",
   "label": "小型大写",
   "css": "font-variant: small-caps; letter-spacing: 1px;"
  },
  {
   "v": "italic",
   "label": "意大利体",
   "css": "font-style: italic;"
  },
  {
   "v": "bold",
   "label": "加粗体",
   "css": "font-weight: 900;"
  },
  {
   "v": "thin",
   "label": "极细体",
   "css": "font-weight: 200;"
  },
  {
   "v": "upright",
   "label": "直立等宽",
   "css": "font-family: \"JetBrains Mono\", \"Consolas\", monospace;"
  },
  {
   "v": "chromef",
   "label": "chromef",
   "css": "background: linear-gradient(180deg, #fff 0%, color-mix(in srgb,var(--fx-c1) 72%,#fff) 45%, color-mix(in srgb,var(--fx-c1) 62%,#000) 55%, #fff 100%); -webkit-background-clip: text; background-clip: text; color: transparent; font-weight: 800;"
  }
 ],
 "pq": [
  {
   "v": "plate",
   "label": "金属铭牌",
   "css": "background: linear-gradient(180deg, color-mix(in srgb, var(--fx-c1) 25%, #1a1f2b), color-mix(in srgb, var(--fx-c1) 40%, #0f131c)); border: 1px solid color-mix(in srgb, var(--fx-c1) 50%, transparent); box-shadow: inset 0 1px 0 color-mix(in srgb,var(--fx-c2) 12%,transparent), 0 2px 6px rgba(0,0,0,.4);"
  },
  {
   "v": "plate2",
   "label": "磨砂铭牌",
   "css": "background: color-mix(in srgb,var(--fx-c2) 4%,transparent); border: 1px solid color-mix(in srgb, var(--fx-c1) 45%, transparent); backdrop-filter: blur(4px);"
  },
  {
   "v": "plate3",
   "label": "拉丝铭牌",
   "css": "background: repeating-linear-gradient(90deg, transparent 0 3px, color-mix(in srgb,var(--fx-c2) 5%,transparent) 3px 4px), linear-gradient(180deg, color-mix(in srgb, var(--fx-c1) 20%, #1a1f2b), color-mix(in srgb, var(--fx-c1) 35%, #0f131c)); border: 1px solid color-mix(in srgb, var(--fx-c1) 50%, transparent);"
  },
  {
   "v": "platebold",
   "label": "粗边铭牌",
   "css": "background: color-mix(in srgb, var(--fx-c1) 30%, #141a26); border: 2px solid var(--fx-c1);"
  },
  {
   "v": "ribbon",
   "label": "缎带横幅",
   "css": "background: linear-gradient(90deg, color-mix(in srgb,var(--fx-c1) 62%,#000), var(--fx-c1), color-mix(in srgb,var(--fx-c1) 62%,#000)); color: #0b0e15; font-weight: 700; clip-path: polygon(8px 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0 50%);"
  },
  {
   "v": "ribbon2",
   "label": "折叠缎带",
   "css": "background: var(--fx-c1); color: #0b0e15; font-weight: 700; clip-path: polygon(0 0, 100% 0, calc(100% - 8px) 100%, 8px 100%);"
  },
  {
   "v": "ribbon3",
   "label": "双尾缎带",
   "css": "background: linear-gradient(90deg, color-mix(in srgb,var(--fx-c1) 62%,#000), var(--fx-c1), color-mix(in srgb,var(--fx-c1) 62%,#000)); color: #0b0e15; font-weight: 700; clip-path: polygon(0 0, 100% 0, 100% 100%, 86% 100%, 80% 0, 74% 100%, 60% 100%, 54% 0, 48% 100%, 34% 100%, 28% 0, 22% 100%, 8% 100%, 0 0);"
  },
  {
   "v": "ribbon4",
   "label": "燕尾缎带",
   "css": "background: var(--fx-c1); color: #0b0e15; font-weight: 700; clip-path: polygon(0 20%, 20% 0, 80% 0, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0 80%);"
  },
  {
   "v": "crest",
   "label": "纹章盾牌",
   "css": "background: linear-gradient(135deg, color-mix(in srgb, var(--fx-c1) 40%, #0f131c), #0f131c); border: 1px solid var(--fx-c1); border-radius: 4px 14px 4px 14px; box-shadow: 0 0 12px -4px var(--fx-c1);"
  },
  {
   "v": "crest2",
   "label": "尖盾纹章",
   "css": "background: linear-gradient(135deg, color-mix(in srgb,var(--fx-c1) 62%,#000), #0f131c); border: 1px solid var(--fx-c1); clip-path: polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%);"
  },
  {
   "v": "crest3",
   "label": "圆盾纹章",
   "css": "background: linear-gradient(135deg, color-mix(in srgb,var(--fx-c1) 62%,#000), #0f131c); border: 1px solid var(--fx-c1); border-radius: 50% 50% 0 0;"
  },
  {
   "v": "chip",
   "label": "芯片贴片",
   "css": "background: #0c1018; border: 1px solid var(--fx-c1); border-radius: 4px; font-family: \"JetBrains Mono\", monospace;"
  },
  {
   "v": "chip2",
   "label": "引脚芯片",
   "css": "background: #0c1018; border: 1px solid var(--fx-c1); border-radius: 4px; box-shadow: inset 0 0 0 3px #0c1018, inset 0 0 0 4px var(--fx-c1);"
  },
  {
   "v": "seal",
   "label": "印章火漆",
   "css": "background: radial-gradient(circle at 30% 30%, color-mix(in srgb,var(--fx-c1) 72%,#fff), color-mix(in srgb,var(--fx-c1) 62%,#000)); color: #0b0e15; font-weight: 800; border-radius: 50px;"
  },
  {
   "v": "seal2",
   "label": "圆形印章",
   "css": "background: #0b0e15; border: 2px solid var(--fx-c1); border-radius: 50px; color: color-mix(in srgb,var(--fx-c1) 72%,#fff);"
  },
  {
   "v": "seal3",
   "label": "方印",
   "css": "background: #0b0e15; border: 2px solid var(--fx-c1); color: color-mix(in srgb,var(--fx-c1) 72%,#fff);"
  },
  {
   "v": "badge",
   "label": "工牌",
   "css": "background: #0b0e15; border: 1px solid var(--fx-c1); border-radius: 6px; color: color-mix(in srgb,var(--fx-c1) 72%,#fff); box-shadow: 0 3px 8px rgba(0,0,0,.4);"
  },
  {
   "v": "badge2",
   "label": "挂绳工牌",
   "css": "background: linear-gradient(135deg, color-mix(in srgb,var(--fx-c1) 62%,#000), #0f131c); border: 1px solid var(--fx-c1); border-radius: 6px 6px 0 0;"
  },
  {
   "v": "tag",
   "label": "行李牌",
   "css": "background: var(--fx-c1); color: #0b0e15; font-weight: 700; clip-path: polygon(0 0, 100% 0, 100% 100%, 14px 100%, 0 calc(100% - 14px));"
  },
  {
   "v": "tag2",
   "label": "三角标签",
   "css": "background: color-mix(in srgb,var(--fx-c1) 62%,#000); color: color-mix(in srgb,var(--fx-c1) 72%,#fff); clip-path: polygon(0 0, 100% 0, 100% calc(100% - 10px), 50% 100%, 0 calc(100% - 10px));"
  },
  {
   "v": "label",
   "label": "平标",
   "css": "background: color-mix(in srgb,var(--fx-c2) 6%,transparent); border: 1px solid color-mix(in srgb,var(--fx-c2) 12%,transparent); border-left: 3px solid var(--fx-c1);"
  },
  {
   "v": "label2",
   "label": "斜标",
   "css": "background: linear-gradient(90deg, var(--fx-c1), transparent 80%); color: #0b0e15; font-weight: 700;"
  },
  {
   "v": "label3",
   "label": "圆角标签",
   "css": "background: var(--fx-c1); color: #0b0e15; font-weight: 700; border-radius: 4px;"
  },
  {
   "v": "band",
   "label": "窄条带",
   "css": "background: color-mix(in srgb,var(--fx-c1) 62%,#000); color: color-mix(in srgb,var(--fx-c1) 72%,#fff); height: 22px; border-radius: 2px;"
  },
  {
   "v": "band2",
   "label": "渐变条带",
   "css": "background: linear-gradient(90deg, color-mix(in srgb,var(--fx-c1) 62%,#000), color-mix(in srgb,var(--fx-c1) 72%,#fff), color-mix(in srgb,var(--fx-c1) 62%,#000)); color: #0b0e15; font-weight: 700;"
  },
  {
   "v": "band3",
   "label": "双色条带",
   "css": "background: linear-gradient(90deg, var(--fx-c1), var(--fx-c2)); color: #0b0e15; font-weight: 700;"
  },
  {
   "v": "banner",
   "label": "横幅",
   "css": "background: linear-gradient(90deg, color-mix(in srgb,var(--fx-c1) 62%,#000), var(--fx-c1), color-mix(in srgb,var(--fx-c1) 62%,#000)); color: #0b0e15; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; padding: 5px 16px;"
  },
  {
   "v": "banner2",
   "label": "斜切横幅",
   "css": "background: var(--fx-c1); color: #0b0e15; font-weight: 800; clip-path: polygon(10px 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 10px 100%, 0 50%); padding: 5px 18px;"
  },
  {
   "v": "banner3",
   "label": "飘带横幅",
   "css": "background: var(--fx-c1); color: #0b0e15; font-weight: 800; clip-path: polygon(0 0, 100% 0, calc(100% - 10px) 100%, 10px 100%); padding: 5px 18px;"
  },
  {
   "v": "tab",
   "label": "标签页",
   "css": "background: color-mix(in srgb,var(--fx-c1) 62%,#000); color: color-mix(in srgb,var(--fx-c1) 72%,#fff); border-radius: 6px 6px 0 0;"
  },
  {
   "v": "tab2",
   "label": "下挂标签",
   "css": "background: var(--fx-c1); color: #0b0e15; font-weight: 700; border-radius: 0 0 6px 6px;"
  },
  {
   "v": "tab3",
   "label": "侧标签",
   "css": "background: color-mix(in srgb,var(--fx-c1) 62%,#000); color: color-mix(in srgb,var(--fx-c1) 72%,#fff); border-radius: 0 6px 6px 0;"
  },
  {
   "v": "pill",
   "label": "胶囊",
   "css": "background: var(--fx-c1); color: #0b0e15; font-weight: 700; border-radius: 50px; padding: 4px 14px;"
  },
  {
   "v": "pill2",
   "label": "粗胶囊",
   "css": "background: color-mix(in srgb,var(--fx-c1) 62%,#000); color: color-mix(in srgb,var(--fx-c1) 72%,#fff); border: 1px solid var(--fx-c1); border-radius: 50px;"
  },
  {
   "v": "pill3",
   "label": "渐变胶囊",
   "css": "background: linear-gradient(135deg, color-mix(in srgb,var(--fx-c1) 72%,#fff), color-mix(in srgb,var(--fx-c1) 62%,#000)); color: #0b0e15; font-weight: 700; border-radius: 50px;"
  },
  {
   "v": "bubble",
   "label": "气泡框",
   "css": "background: var(--fx-c1); color: #0b0e15; font-weight: 700; border-radius: 14px 14px 14px 2px;"
  },
  {
   "v": "bubble2",
   "label": "指向气泡",
   "css": "background: color-mix(in srgb,var(--fx-c1) 62%,#000); color: color-mix(in srgb,var(--fx-c1) 72%,#fff); border-radius: 14px 14px 14px 2px; border: 1px solid var(--fx-c1);"
  },
  {
   "v": "cloud",
   "label": "云形铭牌",
   "css": "background: var(--fx-c1); color: #0b0e15; font-weight: 700; border-radius: 20px 20px 4px 20px;"
  },
  {
   "v": "shieldp",
   "label": "盾牌铭牌",
   "css": "background: linear-gradient(135deg, color-mix(in srgb,var(--fx-c1) 62%,#000), #0f131c); border: 1px solid var(--fx-c1); clip-path: polygon(0 0, 100% 0, 100% 75%, 50% 100%, 0 75%);"
  },
  {
   "v": "shieldp2",
   "label": "尖盾铭牌",
   "css": "background: linear-gradient(135deg, var(--fx-c1), color-mix(in srgb,var(--fx-c1) 62%,#000)); color: #0b0e15; font-weight: 800; clip-path: polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%);"
  },
  {
   "v": "medallion",
   "label": "圆形挂章",
   "css": "background: radial-gradient(circle at 30% 30%, color-mix(in srgb,var(--fx-c1) 72%,#fff), color-mix(in srgb,var(--fx-c1) 62%,#000)); color: #0b0e15; font-weight: 800; border-radius: 50%; width: 120px; height: 28px; line-height: 28px; text-align: center; padding: 0;"
  },
  {
   "v": "coinp",
   "label": "金币牌",
   "css": "background: radial-gradient(circle at 35% 30%, color-mix(in srgb,var(--fx-c1) 72%,#fff), color-mix(in srgb,var(--fx-c1) 62%,#000)); color: #0b0e15; font-weight: 800; border: 2px solid color-mix(in srgb,var(--fx-c1) 72%,#fff); border-radius: 50%; box-shadow: 0 0 8px var(--fx-c1);"
  },
  {
   "v": "key",
   "label": "钥匙牌",
   "css": "background: color-mix(in srgb,var(--fx-c1) 62%,#000); color: color-mix(in srgb,var(--fx-c1) 72%,#fff); border: 1px solid var(--fx-c1); clip-path: polygon(0 0, 100% 0, 100% 100%, 20% 100%, 20% 60%, 0 60%);"
  },
  {
   "v": "gem",
   "label": "宝石牌",
   "css": "background: linear-gradient(135deg, color-mix(in srgb,var(--fx-c1) 72%,#fff), color-mix(in srgb,var(--fx-c1) 62%,#000)); color: #0b0e15; font-weight: 800; clip-path: polygon(50% 0, 100% 35%, 100% 65%, 50% 100%, 0 65%, 0 35%);"
  },
  {
   "v": "crownp",
   "label": "皇冠牌",
   "css": "background: var(--fx-c1); color: #0b0e15; font-weight: 800; clip-path: polygon(0 100%, 0 50%, 20% 30%, 35% 50%, 50% 10%, 65% 50%, 80% 30%, 100% 50%, 100% 100%);"
  },
  {
   "v": "laurelp",
   "label": "桂冠牌",
   "css": "background: linear-gradient(90deg, color-mix(in srgb,var(--fx-c1) 62%,#000), var(--fx-c1), color-mix(in srgb,var(--fx-c1) 62%,#000)); color: #0b0e15; font-weight: 800; position: relative;"
  },
  {
   "v": "wingp",
   "label": "羽翼牌",
   "css": "background: color-mix(in srgb,var(--fx-c1) 62%,#000); color: color-mix(in srgb,var(--fx-c1) 72%,#fff); border: 1px solid var(--fx-c1); clip-path: polygon(0 20%, 15% 0, 85% 0, 100% 20%, 100% 80%, 85% 100%, 15% 100%, 0 80%);"
  },
  {
   "v": "bookp",
   "label": "书卷牌",
   "css": "background: var(--fx-c1); color: #0b0e15; font-weight: 700; clip-path: polygon(0 0, 48% 0, 52% 8%, 100% 8%, 100% 100%, 0 100%);"
  },
  {
   "v": "scrollp",
   "label": "卷轴牌",
   "css": "background: var(--fx-c1); color: #0b0e15; font-weight: 700; border-radius: 4px; box-shadow: 0 4px 0 -2px color-mix(in srgb,var(--fx-c1) 62%,#000), 0 -4px 0 -2px color-mix(in srgb,var(--fx-c1) 62%,#000);"
  },
  {
   "v": "emblem",
   "label": "徽章铭牌",
   "css": "background: color-mix(in srgb,var(--fx-c1) 62%,#000); color: color-mix(in srgb,var(--fx-c1) 72%,#fff); border: 2px solid var(--fx-c1); border-radius: 4px;"
  },
  {
   "v": "emblem2",
   "label": "圆徽章",
   "css": "background: #0b0e15; color: color-mix(in srgb,var(--fx-c1) 72%,#fff); border: 2px solid var(--fx-c1); border-radius: 50%; width: 120px; text-align: center; padding: 0;"
  },
  {
   "v": "emblem3",
   "label": "六角徽章",
   "css": "background: #0b0e15; color: color-mix(in srgb,var(--fx-c1) 72%,#fff); border: 2px solid var(--fx-c1); clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);"
  },
  {
   "v": "frame",
   "label": "相框铭牌",
   "css": "background: color-mix(in srgb,var(--fx-c1) 62%,#000); color: color-mix(in srgb,var(--fx-c1) 72%,#fff); border: 4px solid var(--fx-c1); border-radius: 4px;"
  },
  {
   "v": "frame2",
   "label": "金框铭牌",
   "css": "background: color-mix(in srgb,var(--fx-c1) 62%,#000); color: color-mix(in srgb,var(--fx-c1) 72%,#fff); border: 3px solid #8a6a30; box-shadow: 0 0 0 1px #2a1a08, inset 0 0 0 1px #2a1a08;"
  },
  {
   "v": "frame3",
   "label": "木框铭牌",
   "css": "background: #2a1a10; color: color-mix(in srgb,var(--fx-c1) 72%,#fff); border: 3px solid #4a2a14;"
  },
  {
   "v": "glassp",
   "label": "玻璃铭牌",
   "css": "background: color-mix(in srgb,var(--fx-c2) 8%,transparent); border: 1px solid color-mix(in srgb,var(--fx-c2) 25%,transparent); backdrop-filter: blur(6px);"
  },
  {
   "v": "glassp2",
   "label": "磨砂玻璃牌",
   "css": "background: color-mix(in srgb,var(--fx-c2) 5%,transparent); border: 1px solid color-mix(in srgb,var(--fx-c2) 18%,transparent); backdrop-filter: blur(8px); box-shadow: inset 0 1px 0 color-mix(in srgb,var(--fx-c2) 20%,transparent);"
  },
  {
   "v": "neonp",
   "label": "霓虹牌",
   "css": "background: #0b0e15; color: #fff; border: 1.5px solid var(--fx-c1); box-shadow: 0 0 6px var(--fx-c1), inset 0 0 6px var(--fx-c1); font-weight: 700;"
  },
  {
   "v": "neonp2",
   "label": "双色霓虹牌",
   "css": "background: #0b0e15; color: #fff; border: 1.5px solid var(--fx-c1); box-shadow: 0 0 6px var(--fx-c1), 0 0 14px var(--fx-c2), inset 0 0 6px var(--fx-c1); font-weight: 700;"
  },
  {
   "v": "led",
   "label": "LED 点阵",
   "css": "background: #0b0e15; color: color-mix(in srgb,var(--fx-c1) 72%,#fff); font-family: \"VT323\", \"JetBrains Mono\", monospace; border: 1px solid color-mix(in srgb,var(--fx-c1) 62%,#000); letter-spacing: 2px;"
  },
  {
   "v": "lcd",
   "label": "LCD 屏",
   "css": "background: #0a1a14; color: #7cffb2; font-family: \"VT323\", monospace; border: 1px solid #1a3a2a;"
  },
  {
   "v": "metal",
   "label": "纯金属牌",
   "css": "background: linear-gradient(180deg, color-mix(in srgb,var(--fx-c1) 72%,#fff), color-mix(in srgb,var(--fx-c1) 62%,#000)); color: #0b0e15; font-weight: 800; border: 1px solid var(--fx-c1); box-shadow: inset 0 1px 2px color-mix(in srgb,var(--fx-c2) 40%,transparent);"
  },
  {
   "v": "metal2",
   "label": "拉丝金属牌",
   "css": "background: repeating-linear-gradient(90deg, transparent 0 3px, color-mix(in srgb,var(--fx-c2) 6%,transparent) 3px 4px), linear-gradient(180deg, color-mix(in srgb,var(--fx-c1) 72%,#fff), color-mix(in srgb,var(--fx-c1) 62%,#000)); color: #0b0e15; font-weight: 800; border: 1px solid var(--fx-c1);"
  },
  {
   "v": "metal3",
   "label": "铜牌",
   "css": "background: linear-gradient(180deg, #e0a070, #8a4a20); color: #1a0a04; font-weight: 800; border: 1px solid #6a3a10;"
  },
  {
   "v": "metal4",
   "label": "钛金牌",
   "css": "background: linear-gradient(180deg, #e8eef5, #8a9aa8); color: #0b1018; font-weight: 800; border: 1px solid #6a7a88;"
  },
  {
   "v": "metal5",
   "label": "银牌",
   "css": "background: linear-gradient(180deg, #f0f4f8, #aab4c0); color: #0b1018; font-weight: 800;"
  },
  {
   "v": "metal6",
   "label": "铂金牌",
   "css": "background: linear-gradient(180deg, #f5f5f0, #d0d0c8); color: #0b0e15; font-weight: 800; border: 1px solid #b0b0a8;"
  },
  {
   "v": "wood",
   "label": "木质铭牌",
   "css": "background: linear-gradient(180deg, #5a3418, #3a2010); color: #f0d0a0; border: 1px solid #2a1808; box-shadow: inset 0 1px 0 color-mix(in srgb,var(--fx-c2) 10%,transparent);"
  },
  {
   "v": "wood2",
   "label": "深木牌",
   "css": "background: linear-gradient(180deg, #4a2814, #2a1408); color: #d0a070; border: 1px solid #1a0c04;"
  },
  {
   "v": "wood3",
   "label": "雕花木牌",
   "css": "background: linear-gradient(180deg, #6a3a1c, #3a1e0c); color: #f0d0a0; border: 2px solid #2a1408; box-shadow: inset 0 0 8px rgba(0,0,0,.4);"
  },
  {
   "v": "acrylic",
   "label": "亚克力牌",
   "css": "background: color-mix(in srgb,var(--fx-c2) 10%,transparent); border: 1px solid color-mix(in srgb,var(--fx-c2) 30%,transparent); backdrop-filter: blur(10px);"
  },
  {
   "v": "acrylic2",
   "label": "透明亚克力",
   "css": "background: color-mix(in srgb,var(--fx-c2) 4%,transparent); border: 1px solid color-mix(in srgb,var(--fx-c2) 20%,transparent); backdrop-filter: blur(12px);"
  },
  {
   "v": "marblep",
   "label": "大理石牌",
   "css": "background: linear-gradient(135deg, #f5f5f5, #c9c9c9); color: #1a1a1a; font-weight: 800; border: 1px solid #a0a0a0;"
  },
  {
   "v": "marblep2",
   "label": "金镶大理石",
   "css": "background: linear-gradient(135deg, #f5f5f5, #c9c9c9); color: #1a1a1a; font-weight: 800; border: 2px solid var(--fx-c1);"
  },
  {
   "v": "leatherp",
   "label": "皮革铭牌",
   "css": "background: linear-gradient(180deg, #4a2818, #2a1408); color: #f0d0a0; border: 1px solid #1a0c04; box-shadow: inset 0 0 12px rgba(0,0,0,.5);"
  },
  {
   "v": "leatherp2",
   "label": "压印皮牌",
   "css": "background: #3a2010; color: #e0c090; border: 2px solid #5a3418; box-shadow: inset 0 1px 0 color-mix(in srgb,var(--fx-c2) 10%,transparent), inset 0 -1px 0 rgba(0,0,0,.4);"
  },
  {
   "v": "paperp",
   "label": "纸签",
   "css": "background: #f5f0e6; color: #2a2018; border: 1px solid #d0c8b8; box-shadow: 1px 1px 4px rgba(0,0,0,.2);"
  },
  {
   "v": "paperp2",
   "label": "火漆纸签",
   "css": "background: #f5f0e6; color: #8a2010; border: 1px solid #8a2010; border-radius: 50px;"
  },
  {
   "v": "washi",
   "label": "和纸签",
   "css": "background: #f5efe0; color: #2a2018; border: 1px solid #d0c8b0; box-shadow: inset 0 0 12px rgba(180,160,120,.2);"
  },
  {
   "v": "carbonp",
   "label": "碳纤牌",
   "css": "background: linear-gradient(135deg, #1a1a1a, #0a0a0a); color: color-mix(in srgb,var(--fx-c1) 72%,#fff); border: 1px solid #333;"
  },
  {
   "v": "crystalp",
   "label": "水晶牌",
   "css": "background: linear-gradient(135deg, color-mix(in srgb,var(--fx-c2) 20%,transparent), color-mix(in srgb,var(--fx-c2) 5%,transparent)); border: 1px solid color-mix(in srgb,var(--fx-c2) 40%,transparent); backdrop-filter: blur(6px); color: #fff;"
  },
  {
   "v": "crystalp2",
   "label": "切割水晶牌",
   "css": "background: linear-gradient(105deg, transparent 0 30%, color-mix(in srgb,var(--fx-c2) 15%,transparent) 30% 33%, transparent 33% 66%, color-mix(in srgb,var(--fx-c2) 10%,transparent) 66% 69%, transparent 69%); border: 1px solid color-mix(in srgb,var(--fx-c2) 30%,transparent); color: #fff;"
  },
  {
   "v": "enamel",
   "label": "珐琅牌",
   "css": "background: linear-gradient(135deg, #1a1a2a, #0a0a14); color: color-mix(in srgb,var(--fx-c1) 72%,#fff); border: 1.5px solid var(--fx-c1); box-shadow: inset 0 1px 1px color-mix(in srgb,var(--fx-c2) 20%,transparent);"
  },
  {
   "v": "enamel2",
   "label": "彩绘珐琅",
   "css": "background: linear-gradient(135deg, color-mix(in srgb,var(--fx-c1) 62%,#000), #0f131c); color: color-mix(in srgb,var(--fx-c1) 72%,#fff); border: 1.5px solid var(--fx-c1); box-shadow: inset 0 1px 1px color-mix(in srgb,var(--fx-c2) 20%,transparent), 0 0 8px -2px var(--fx-c1);"
  },
  {
   "v": "gold",
   "label": "鎏金牌",
   "css": "background: linear-gradient(135deg, #f5dfae, #c9a15a, #8a6a30); color: #1a1208; font-weight: 800; border: 1px solid #8a6a30;"
  },
  {
   "v": "gold2",
   "label": "錾金牌",
   "css": "background: linear-gradient(135deg, #f5dfae, #c9a15a); color: #1a1208; font-weight: 800; border: 1px solid #6a4a20; box-shadow: inset 0 1px 2px color-mix(in srgb,var(--fx-c2) 50%,transparent);"
  },
  {
   "v": "silverp",
   "label": "银箔牌",
   "css": "background: linear-gradient(135deg, #f0f4f8, #b0bcc8); color: #0b1018; font-weight: 800; border: 1px solid #8090a0;"
  },
  {
   "v": "brass",
   "label": "黄铜牌",
   "css": "background: linear-gradient(135deg, #e8c877, #a08030); color: #1a1408; font-weight: 800; border: 1px solid #806020;"
  },
  {
   "v": "tech",
   "label": "科技感贴片",
   "css": "background: #0c1018; border: 1px solid var(--fx-c1); border-left: 3px solid var(--fx-c1); font-family: \"JetBrains Mono\", monospace; color: color-mix(in srgb,var(--fx-c1) 72%,#fff);"
  },
  {
   "v": "holo",
   "label": "全息贴片",
   "css": "background: linear-gradient(135deg, var(--fx-c1), var(--fx-c2)); color: #0b0e15; font-weight: 800; box-shadow: 0 0 10px -2px var(--fx-c1);"
  },
  {
   "v": "minimal",
   "label": "极简下划线",
   "css": "background: transparent; color: color-mix(in srgb,var(--fx-c1) 72%,#fff); border-bottom: 1.5px solid var(--fx-c1); border-radius: 0;"
  },
  {
   "v": "minimal2",
   "label": "极简括弧",
   "css": "background: transparent; color: color-mix(in srgb,var(--fx-c1) 72%,#fff); border-radius: 0; box-shadow: inset 4px 0 0 var(--fx-c1);"
  }
 ],
 "cor": [
  {
   "v": "none",
   "label": "无角饰"
  },
  {
   "v": "metal",
   "label": "金属包角",
   "css": "background-image:radial-gradient(circle,transparent 52%,var(--fx-c2) 55% 64%,transparent 67%),radial-gradient(circle,transparent 52%,var(--fx-c2) 55% 64%,transparent 67%),radial-gradient(circle,transparent 52%,var(--fx-c2) 55% 64%,transparent 67%),radial-gradient(circle,transparent 52%,var(--fx-c2) 55% 64%,transparent 67%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:8px 8px;background-repeat:no-repeat;opacity:0.60"
  },
  {
   "v": "metal2",
   "label": "双铆包角",
   "css": "background-image:linear-gradient(color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)),color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2))),linear-gradient(color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)),color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2))),linear-gradient(color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)),color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2))),linear-gradient(color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)),color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)));background-position:0 0,100% 0,0 100%,100% 100%;background-size:8px 8px;background-repeat:no-repeat;opacity:0.70"
  },
  {
   "v": "metalbold",
   "label": "粗金属角",
   "css": "background-image:conic-gradient(from 45deg,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 25%,transparent 0),conic-gradient(from 45deg,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 25%,transparent 0),conic-gradient(from 45deg,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 25%,transparent 0),conic-gradient(from 45deg,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 25%,transparent 0);background-position:0 0,100% 0,0 100%,100% 100%;background-size:8px 8px;background-repeat:no-repeat;opacity:0.80;filter:drop-shadow(0 0 4px var(--fx-c1))"
  },
  {
   "v": "cut",
   "label": "斜切角标",
   "css": "background-image:radial-gradient(circle at 50% 50%,transparent 60%,var(--fx-c1) 63% 72%,transparent 75%),radial-gradient(circle at 50% 50%,transparent 60%,var(--fx-c1) 63% 72%,transparent 75%),radial-gradient(circle at 50% 50%,transparent 60%,var(--fx-c1) 63% 72%,transparent 75%),radial-gradient(circle at 50% 50%,transparent 60%,var(--fx-c1) 63% 72%,transparent 75%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:8px 8px;background-repeat:no-repeat;opacity:0.90"
  },
  {
   "v": "cutthin",
   "label": "细斜切",
   "css": "background-image:radial-gradient(circle,var(--fx-c2) 0 1.6px,transparent 2px),radial-gradient(circle,var(--fx-c2) 0 1.6px,transparent 2px),radial-gradient(circle,var(--fx-c2) 0 1.6px,transparent 2px),radial-gradient(circle,var(--fx-c2) 0 1.6px,transparent 2px);background-position:0 0,100% 0,0 100%,100% 100%;background-size:8px 8px;background-repeat:no-repeat;opacity:0.50"
  },
  {
   "v": "cutbold",
   "label": "粗斜切",
   "css": "background-image:conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c1) 55%,transparent) 0 25%,transparent 0 50%,color-mix(in srgb,var(--fx-c1) 55%,transparent) 0 75%,transparent 0),conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c1) 55%,transparent) 0 25%,transparent 0 50%,color-mix(in srgb,var(--fx-c1) 55%,transparent) 0 75%,transparent 0),conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c1) 55%,transparent) 0 25%,transparent 0 50%,color-mix(in srgb,var(--fx-c1) 55%,transparent) 0 75%,transparent 0),conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c1) 55%,transparent) 0 25%,transparent 0 50%,color-mix(in srgb,var(--fx-c1) 55%,transparent) 0 75%,transparent 0);background-position:0 0,100% 0,0 100%,100% 100%;background-size:8px 8px;background-repeat:no-repeat;opacity:0.60;filter:drop-shadow(0 0 4px var(--fx-c1))"
  },
  {
   "v": "dot",
   "label": "圆点铆钉",
   "css": "background-image:linear-gradient(90deg,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 100%),linear-gradient(90deg,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 100%),linear-gradient(90deg,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 100%),linear-gradient(90deg,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 100%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:8px 8px;background-repeat:no-repeat;opacity:0.70"
  },
  {
   "v": "dot2",
   "label": "双圆点",
   "css": "background-image:linear-gradient(135deg,var(--fx-c1),transparent 70%),linear-gradient(135deg,var(--fx-c1),transparent 70%),linear-gradient(135deg,var(--fx-c1),transparent 70%),linear-gradient(135deg,var(--fx-c1),transparent 70%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:8px 8px;background-repeat:no-repeat;opacity:0.80"
  },
  {
   "v": "dotsrow",
   "label": "铆钉列",
   "css": "background-image:radial-gradient(circle,var(--fx-c2) 0 40%,transparent 62%),radial-gradient(circle,var(--fx-c2) 0 40%,transparent 62%),radial-gradient(circle,var(--fx-c2) 0 40%,transparent 62%),radial-gradient(circle,var(--fx-c2) 0 40%,transparent 62%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:8px 8px;background-repeat:no-repeat;opacity:0.90;filter:drop-shadow(0 0 4px var(--fx-c1))"
  },
  {
   "v": "rivet",
   "label": "铆钉装饰",
   "css": "background-image:radial-gradient(circle,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 0 3px,transparent 3.4px),radial-gradient(circle,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 0 3px,transparent 3.4px),radial-gradient(circle,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 0 3px,transparent 3.4px),radial-gradient(circle,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 0 3px,transparent 3.4px);background-position:0 0,100% 0,0 100%,100% 100%;background-size:10px 10px;background-repeat:no-repeat;opacity:0.50"
  },
  {
   "v": "geo",
   "label": "几何切角",
   "css": "background-image:radial-gradient(circle,transparent 52%,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 55% 64%,transparent 67%),radial-gradient(circle,transparent 52%,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 55% 64%,transparent 67%),radial-gradient(circle,transparent 52%,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 55% 64%,transparent 67%),radial-gradient(circle,transparent 52%,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 55% 64%,transparent 67%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:10px 10px;background-repeat:no-repeat;opacity:0.60"
  },
  {
   "v": "geoline",
   "label": "几何线",
   "css": "background-image:linear-gradient(var(--fx-c1),var(--fx-c1)),linear-gradient(var(--fx-c1),var(--fx-c1)),linear-gradient(var(--fx-c1),var(--fx-c1)),linear-gradient(var(--fx-c1),var(--fx-c1));background-position:0 0,100% 0,0 100%,100% 100%;background-size:10px 10px;background-repeat:no-repeat;opacity:0.70;filter:drop-shadow(0 0 4px var(--fx-c1))"
  },
  {
   "v": "geo2",
   "label": "双线几何",
   "css": "background-image:conic-gradient(from 45deg,var(--fx-c2) 0 25%,transparent 0),conic-gradient(from 45deg,var(--fx-c2) 0 25%,transparent 0),conic-gradient(from 45deg,var(--fx-c2) 0 25%,transparent 0),conic-gradient(from 45deg,var(--fx-c2) 0 25%,transparent 0);background-position:0 0,100% 0,0 100%,100% 100%;background-size:10px 10px;background-repeat:no-repeat;opacity:0.80"
  },
  {
   "v": "bracket",
   "label": "直角括号",
   "css": "background-image:radial-gradient(circle at 50% 50%,transparent 60%,color-mix(in srgb,var(--fx-c1) 55%,transparent) 63% 72%,transparent 75%),radial-gradient(circle at 50% 50%,transparent 60%,color-mix(in srgb,var(--fx-c1) 55%,transparent) 63% 72%,transparent 75%),radial-gradient(circle at 50% 50%,transparent 60%,color-mix(in srgb,var(--fx-c1) 55%,transparent) 63% 72%,transparent 75%),radial-gradient(circle at 50% 50%,transparent 60%,color-mix(in srgb,var(--fx-c1) 55%,transparent) 63% 72%,transparent 75%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:10px 10px;background-repeat:no-repeat;opacity:0.90"
  },
  {
   "v": "bracket2",
   "label": "尖括号",
   "css": "background-image:radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 1.6px,transparent 2px),radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 1.6px,transparent 2px),radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 1.6px,transparent 2px),radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 1.6px,transparent 2px);background-position:0 0,100% 0,0 100%,100% 100%;background-size:10px 10px;background-repeat:no-repeat;opacity:0.50;filter:drop-shadow(0 0 4px var(--fx-c1))"
  },
  {
   "v": "bracket3",
   "label": "双角括号",
   "css": "background-image:conic-gradient(from 0deg,var(--fx-c1) 0 25%,transparent 0 50%,var(--fx-c1) 0 75%,transparent 0),conic-gradient(from 0deg,var(--fx-c1) 0 25%,transparent 0 50%,var(--fx-c1) 0 75%,transparent 0),conic-gradient(from 0deg,var(--fx-c1) 0 25%,transparent 0 50%,var(--fx-c1) 0 75%,transparent 0),conic-gradient(from 0deg,var(--fx-c1) 0 25%,transparent 0 50%,var(--fx-c1) 0 75%,transparent 0);background-position:0 0,100% 0,0 100%,100% 100%;background-size:10px 10px;background-repeat:no-repeat;opacity:0.60"
  },
  {
   "v": "braces",
   "label": "花括号",
   "css": "background-image:linear-gradient(90deg,var(--fx-c2) 0 100%),linear-gradient(90deg,var(--fx-c2) 0 100%),linear-gradient(90deg,var(--fx-c2) 0 100%),linear-gradient(90deg,var(--fx-c2) 0 100%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:10px 10px;background-repeat:no-repeat;opacity:0.70"
  },
  {
   "v": "chevron",
   "label": "V 形角",
   "css": "background-image:linear-gradient(135deg,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)),transparent 70%),linear-gradient(135deg,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)),transparent 70%),linear-gradient(135deg,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)),transparent 70%),linear-gradient(135deg,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)),transparent 70%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:10px 10px;background-repeat:no-repeat;opacity:0.80;filter:drop-shadow(0 0 4px var(--fx-c1))"
  },
  {
   "v": "arrow",
   "label": "箭头角",
   "css": "background-image:radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 40%,transparent 62%),radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 40%,transparent 62%),radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 40%,transparent 62%),radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 40%,transparent 62%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:10px 10px;background-repeat:no-repeat;opacity:0.90"
  },
  {
   "v": "plus",
   "label": "十字角",
   "css": "background-image:radial-gradient(circle,var(--fx-c1) 0 3px,transparent 3.4px),radial-gradient(circle,var(--fx-c1) 0 3px,transparent 3.4px),radial-gradient(circle,var(--fx-c1) 0 3px,transparent 3.4px),radial-gradient(circle,var(--fx-c1) 0 3px,transparent 3.4px);background-position:0 0,100% 0,0 100%,100% 100%;background-size:12px 12px;background-repeat:no-repeat;opacity:0.50"
  },
  {
   "v": "cross",
   "label": "十字架",
   "css": "background-image:radial-gradient(circle,transparent 52%,var(--fx-c2) 55% 64%,transparent 67%),radial-gradient(circle,transparent 52%,var(--fx-c2) 55% 64%,transparent 67%),radial-gradient(circle,transparent 52%,var(--fx-c2) 55% 64%,transparent 67%),radial-gradient(circle,transparent 52%,var(--fx-c2) 55% 64%,transparent 67%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:12px 12px;background-repeat:no-repeat;opacity:0.60;filter:drop-shadow(0 0 4px var(--fx-c1))"
  },
  {
   "v": "tri",
   "label": "三角角标",
   "css": "background-image:linear-gradient(color-mix(in srgb,var(--fx-c1) 55%,transparent),color-mix(in srgb,var(--fx-c1) 55%,transparent)),linear-gradient(color-mix(in srgb,var(--fx-c1) 55%,transparent),color-mix(in srgb,var(--fx-c1) 55%,transparent)),linear-gradient(color-mix(in srgb,var(--fx-c1) 55%,transparent),color-mix(in srgb,var(--fx-c1) 55%,transparent)),linear-gradient(color-mix(in srgb,var(--fx-c1) 55%,transparent),color-mix(in srgb,var(--fx-c1) 55%,transparent));background-position:0 0,100% 0,0 100%,100% 100%;background-size:12px 12px;background-repeat:no-repeat;opacity:0.70"
  },
  {
   "v": "tri2",
   "label": "空心三角",
   "css": "background-image:conic-gradient(from 45deg,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 25%,transparent 0),conic-gradient(from 45deg,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 25%,transparent 0),conic-gradient(from 45deg,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 25%,transparent 0),conic-gradient(from 45deg,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 25%,transparent 0);background-position:0 0,100% 0,0 100%,100% 100%;background-size:12px 12px;background-repeat:no-repeat;opacity:0.80"
  },
  {
   "v": "triple",
   "label": "三层三角",
   "css": "background-image:radial-gradient(circle at 50% 50%,transparent 60%,var(--fx-c1) 63% 72%,transparent 75%),radial-gradient(circle at 50% 50%,transparent 60%,var(--fx-c1) 63% 72%,transparent 75%),radial-gradient(circle at 50% 50%,transparent 60%,var(--fx-c1) 63% 72%,transparent 75%),radial-gradient(circle at 50% 50%,transparent 60%,var(--fx-c1) 63% 72%,transparent 75%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:12px 12px;background-repeat:no-repeat;opacity:0.90;filter:drop-shadow(0 0 4px var(--fx-c1))"
  },
  {
   "v": "square",
   "label": "方角标",
   "css": "background-image:radial-gradient(circle,var(--fx-c2) 0 1.6px,transparent 2px),radial-gradient(circle,var(--fx-c2) 0 1.6px,transparent 2px),radial-gradient(circle,var(--fx-c2) 0 1.6px,transparent 2px),radial-gradient(circle,var(--fx-c2) 0 1.6px,transparent 2px);background-position:0 0,100% 0,0 100%,100% 100%;background-size:12px 12px;background-repeat:no-repeat;opacity:0.50"
  },
  {
   "v": "diamondc",
   "label": "菱形角",
   "css": "background-image:conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 0 25%,transparent 0 50%,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 0 75%,transparent 0),conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 0 25%,transparent 0 50%,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 0 75%,transparent 0),conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 0 25%,transparent 0 50%,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 0 75%,transparent 0),conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 0 25%,transparent 0 50%,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 0 75%,transparent 0);background-position:0 0,100% 0,0 100%,100% 100%;background-size:12px 12px;background-repeat:no-repeat;opacity:0.60"
  },
  {
   "v": "hexc",
   "label": "六角角标",
   "css": "background-image:linear-gradient(90deg,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 100%),linear-gradient(90deg,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 100%),linear-gradient(90deg,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 100%),linear-gradient(90deg,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 100%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:12px 12px;background-repeat:no-repeat;opacity:0.70;filter:drop-shadow(0 0 4px var(--fx-c1))"
  },
  {
   "v": "star",
   "label": "星形角标",
   "css": "background-image:linear-gradient(135deg,var(--fx-c1),transparent 70%),linear-gradient(135deg,var(--fx-c1),transparent 70%),linear-gradient(135deg,var(--fx-c1),transparent 70%),linear-gradient(135deg,var(--fx-c1),transparent 70%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:12px 12px;background-repeat:no-repeat;opacity:0.80"
  },
  {
   "v": "circlec",
   "label": "圆环角标",
   "css": "background-image:radial-gradient(circle,var(--fx-c2) 0 40%,transparent 62%),radial-gradient(circle,var(--fx-c2) 0 40%,transparent 62%),radial-gradient(circle,var(--fx-c2) 0 40%,transparent 62%),radial-gradient(circle,var(--fx-c2) 0 40%,transparent 62%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:12px 12px;background-repeat:no-repeat;opacity:0.90"
  },
  {
   "v": "ring",
   "label": "环形角",
   "css": "background-image:radial-gradient(circle,color-mix(in srgb,var(--fx-c1) 55%,transparent) 0 3px,transparent 3.4px),radial-gradient(circle,color-mix(in srgb,var(--fx-c1) 55%,transparent) 0 3px,transparent 3.4px),radial-gradient(circle,color-mix(in srgb,var(--fx-c1) 55%,transparent) 0 3px,transparent 3.4px),radial-gradient(circle,color-mix(in srgb,var(--fx-c1) 55%,transparent) 0 3px,transparent 3.4px);background-position:0 0,100% 0,0 100%,100% 100%;background-size:14px 14px;background-repeat:no-repeat;opacity:0.50;filter:drop-shadow(0 0 4px var(--fx-c1))"
  },
  {
   "v": "orb",
   "label": "球体角饰",
   "css": "background-image:radial-gradient(circle,transparent 52%,color-mix(in srgb,var(--fx-c2) 55%,transparent) 55% 64%,transparent 67%),radial-gradient(circle,transparent 52%,color-mix(in srgb,var(--fx-c2) 55%,transparent) 55% 64%,transparent 67%),radial-gradient(circle,transparent 52%,color-mix(in srgb,var(--fx-c2) 55%,transparent) 55% 64%,transparent 67%),radial-gradient(circle,transparent 52%,color-mix(in srgb,var(--fx-c2) 55%,transparent) 55% 64%,transparent 67%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:14px 14px;background-repeat:no-repeat;opacity:0.60"
  },
  {
   "v": "line",
   "label": "细线角",
   "css": "background-image:linear-gradient(var(--fx-c1),var(--fx-c1)),linear-gradient(var(--fx-c1),var(--fx-c1)),linear-gradient(var(--fx-c1),var(--fx-c1)),linear-gradient(var(--fx-c1),var(--fx-c1));background-position:0 0,100% 0,0 100%,100% 100%;background-size:14px 14px;background-repeat:no-repeat;opacity:0.70"
  },
  {
   "v": "linebold",
   "label": "粗线角",
   "css": "background-image:conic-gradient(from 45deg,var(--fx-c2) 0 25%,transparent 0),conic-gradient(from 45deg,var(--fx-c2) 0 25%,transparent 0),conic-gradient(from 45deg,var(--fx-c2) 0 25%,transparent 0),conic-gradient(from 45deg,var(--fx-c2) 0 25%,transparent 0);background-position:0 0,100% 0,0 100%,100% 100%;background-size:14px 14px;background-repeat:no-repeat;opacity:0.80;filter:drop-shadow(0 0 4px var(--fx-c1))"
  },
  {
   "v": "line2",
   "label": "双细线角",
   "css": "background-image:radial-gradient(circle at 50% 50%,transparent 60%,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 63% 72%,transparent 75%),radial-gradient(circle at 50% 50%,transparent 60%,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 63% 72%,transparent 75%),radial-gradient(circle at 50% 50%,transparent 60%,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 63% 72%,transparent 75%),radial-gradient(circle at 50% 50%,transparent 60%,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 63% 72%,transparent 75%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:14px 14px;background-repeat:no-repeat;opacity:0.90"
  },
  {
   "v": "corner",
   "label": "直角折边",
   "css": "background-image:radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 1.6px,transparent 2px),radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 1.6px,transparent 2px),radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 1.6px,transparent 2px),radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 1.6px,transparent 2px);background-position:0 0,100% 0,0 100%,100% 100%;background-size:14px 14px;background-repeat:no-repeat;opacity:0.50"
  },
  {
   "v": "corner2",
   "label": "双层折边",
   "css": "background-image:conic-gradient(from 0deg,var(--fx-c1) 0 25%,transparent 0 50%,var(--fx-c1) 0 75%,transparent 0),conic-gradient(from 0deg,var(--fx-c1) 0 25%,transparent 0 50%,var(--fx-c1) 0 75%,transparent 0),conic-gradient(from 0deg,var(--fx-c1) 0 25%,transparent 0 50%,var(--fx-c1) 0 75%,transparent 0),conic-gradient(from 0deg,var(--fx-c1) 0 25%,transparent 0 50%,var(--fx-c1) 0 75%,transparent 0);background-position:0 0,100% 0,0 100%,100% 100%;background-size:14px 14px;background-repeat:no-repeat;opacity:0.60;filter:drop-shadow(0 0 4px var(--fx-c1))"
  },
  {
   "v": "fold",
   "label": "折纸角",
   "css": "background-image:linear-gradient(90deg,var(--fx-c2) 0 100%),linear-gradient(90deg,var(--fx-c2) 0 100%),linear-gradient(90deg,var(--fx-c2) 0 100%),linear-gradient(90deg,var(--fx-c2) 0 100%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:14px 14px;background-repeat:no-repeat;opacity:0.70"
  },
  {
   "v": "tape",
   "label": "胶带角",
   "css": "background-image:linear-gradient(135deg,color-mix(in srgb,var(--fx-c1) 55%,transparent),transparent 70%),linear-gradient(135deg,color-mix(in srgb,var(--fx-c1) 55%,transparent),transparent 70%),linear-gradient(135deg,color-mix(in srgb,var(--fx-c1) 55%,transparent),transparent 70%),linear-gradient(135deg,color-mix(in srgb,var(--fx-c1) 55%,transparent),transparent 70%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:14px 14px;background-repeat:no-repeat;opacity:0.80"
  },
  {
   "v": "tape2",
   "label": "对角胶带",
   "css": "background-image:radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 40%,transparent 62%),radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 40%,transparent 62%),radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 40%,transparent 62%),radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 40%,transparent 62%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:14px 14px;background-repeat:no-repeat;opacity:0.90;filter:drop-shadow(0 0 4px var(--fx-c1))"
  },
  {
   "v": "pin",
   "label": "图钉",
   "css": "background-image:radial-gradient(circle,var(--fx-c1) 0 3px,transparent 3.4px),radial-gradient(circle,var(--fx-c1) 0 3px,transparent 3.4px),radial-gradient(circle,var(--fx-c1) 0 3px,transparent 3.4px),radial-gradient(circle,var(--fx-c1) 0 3px,transparent 3.4px);background-position:0 0,100% 0,0 100%,100% 100%;background-size:17px 17px;background-repeat:no-repeat;opacity:0.50"
  },
  {
   "v": "clip",
   "label": "回形针",
   "css": "background-image:radial-gradient(circle,transparent 52%,var(--fx-c2) 55% 64%,transparent 67%),radial-gradient(circle,transparent 52%,var(--fx-c2) 55% 64%,transparent 67%),radial-gradient(circle,transparent 52%,var(--fx-c2) 55% 64%,transparent 67%),radial-gradient(circle,transparent 52%,var(--fx-c2) 55% 64%,transparent 67%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:17px 17px;background-repeat:no-repeat;opacity:0.60"
  },
  {
   "v": "ribbonc",
   "label": "缎带角",
   "css": "background-image:linear-gradient(color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)),color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2))),linear-gradient(color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)),color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2))),linear-gradient(color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)),color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2))),linear-gradient(color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)),color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)));background-position:0 0,100% 0,0 100%,100% 100%;background-size:17px 17px;background-repeat:no-repeat;opacity:0.70;filter:drop-shadow(0 0 4px var(--fx-c1))"
  },
  {
   "v": "ribbon2",
   "label": "双缎带",
   "css": "background-image:conic-gradient(from 45deg,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 25%,transparent 0),conic-gradient(from 45deg,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 25%,transparent 0),conic-gradient(from 45deg,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 25%,transparent 0),conic-gradient(from 45deg,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 25%,transparent 0);background-position:0 0,100% 0,0 100%,100% 100%;background-size:17px 17px;background-repeat:no-repeat;opacity:0.80"
  },
  {
   "v": "flag",
   "label": "旗帜角标",
   "css": "background-image:radial-gradient(circle at 50% 50%,transparent 60%,var(--fx-c1) 63% 72%,transparent 75%),radial-gradient(circle at 50% 50%,transparent 60%,var(--fx-c1) 63% 72%,transparent 75%),radial-gradient(circle at 50% 50%,transparent 60%,var(--fx-c1) 63% 72%,transparent 75%),radial-gradient(circle at 50% 50%,transparent 60%,var(--fx-c1) 63% 72%,transparent 75%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:17px 17px;background-repeat:no-repeat;opacity:0.90"
  },
  {
   "v": "banner",
   "label": "小横幅",
   "css": "background-image:radial-gradient(circle,var(--fx-c2) 0 1.6px,transparent 2px),radial-gradient(circle,var(--fx-c2) 0 1.6px,transparent 2px),radial-gradient(circle,var(--fx-c2) 0 1.6px,transparent 2px),radial-gradient(circle,var(--fx-c2) 0 1.6px,transparent 2px);background-position:0 0,100% 0,0 100%,100% 100%;background-size:17px 17px;background-repeat:no-repeat;opacity:0.50;filter:drop-shadow(0 0 4px var(--fx-c1))"
  },
  {
   "v": "seal",
   "label": "火漆印",
   "css": "background-image:conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c1) 55%,transparent) 0 25%,transparent 0 50%,color-mix(in srgb,var(--fx-c1) 55%,transparent) 0 75%,transparent 0),conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c1) 55%,transparent) 0 25%,transparent 0 50%,color-mix(in srgb,var(--fx-c1) 55%,transparent) 0 75%,transparent 0),conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c1) 55%,transparent) 0 25%,transparent 0 50%,color-mix(in srgb,var(--fx-c1) 55%,transparent) 0 75%,transparent 0),conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c1) 55%,transparent) 0 25%,transparent 0 50%,color-mix(in srgb,var(--fx-c1) 55%,transparent) 0 75%,transparent 0);background-position:0 0,100% 0,0 100%,100% 100%;background-size:17px 17px;background-repeat:no-repeat;opacity:0.60"
  },
  {
   "v": "stamp",
   "label": "印章角",
   "css": "background-image:linear-gradient(90deg,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 100%),linear-gradient(90deg,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 100%),linear-gradient(90deg,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 100%),linear-gradient(90deg,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 100%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:17px 17px;background-repeat:no-repeat;opacity:0.70"
  },
  {
   "v": "coin",
   "label": "金币角",
   "css": "background-image:linear-gradient(135deg,var(--fx-c1),transparent 70%),linear-gradient(135deg,var(--fx-c1),transparent 70%),linear-gradient(135deg,var(--fx-c1),transparent 70%),linear-gradient(135deg,var(--fx-c1),transparent 70%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:17px 17px;background-repeat:no-repeat;opacity:0.80;filter:drop-shadow(0 0 4px var(--fx-c1))"
  },
  {
   "v": "gem",
   "label": "宝石角",
   "css": "background-image:radial-gradient(circle,var(--fx-c2) 0 40%,transparent 62%),radial-gradient(circle,var(--fx-c2) 0 40%,transparent 62%),radial-gradient(circle,var(--fx-c2) 0 40%,transparent 62%),radial-gradient(circle,var(--fx-c2) 0 40%,transparent 62%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:17px 17px;background-repeat:no-repeat;opacity:0.90"
  },
  {
   "v": "crown",
   "label": "皇冠角饰",
   "css": "background-image:radial-gradient(circle,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 0 3px,transparent 3.4px),radial-gradient(circle,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 0 3px,transparent 3.4px),radial-gradient(circle,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 0 3px,transparent 3.4px),radial-gradient(circle,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 0 3px,transparent 3.4px);background-position:0 0,100% 0,0 100%,100% 100%;background-size:21px 21px;background-repeat:no-repeat;opacity:0.50"
  },
  {
   "v": "wing",
   "label": "羽翼角饰",
   "css": "background-image:radial-gradient(circle,transparent 52%,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 55% 64%,transparent 67%),radial-gradient(circle,transparent 52%,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 55% 64%,transparent 67%),radial-gradient(circle,transparent 52%,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 55% 64%,transparent 67%),radial-gradient(circle,transparent 52%,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 55% 64%,transparent 67%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:21px 21px;background-repeat:no-repeat;opacity:0.60;filter:drop-shadow(0 0 4px var(--fx-c1))"
  },
  {
   "v": "laurel",
   "label": "桂冠角",
   "css": "background-image:linear-gradient(var(--fx-c1),var(--fx-c1)),linear-gradient(var(--fx-c1),var(--fx-c1)),linear-gradient(var(--fx-c1),var(--fx-c1)),linear-gradient(var(--fx-c1),var(--fx-c1));background-position:0 0,100% 0,0 100%,100% 100%;background-size:21px 21px;background-repeat:no-repeat;opacity:0.70"
  },
  {
   "v": "crest",
   "label": "纹章角",
   "css": "background-image:conic-gradient(from 45deg,var(--fx-c2) 0 25%,transparent 0),conic-gradient(from 45deg,var(--fx-c2) 0 25%,transparent 0),conic-gradient(from 45deg,var(--fx-c2) 0 25%,transparent 0),conic-gradient(from 45deg,var(--fx-c2) 0 25%,transparent 0);background-position:0 0,100% 0,0 100%,100% 100%;background-size:21px 21px;background-repeat:no-repeat;opacity:0.80"
  },
  {
   "v": "shieldc",
   "label": "盾形角",
   "css": "background-image:radial-gradient(circle at 50% 50%,transparent 60%,color-mix(in srgb,var(--fx-c1) 55%,transparent) 63% 72%,transparent 75%),radial-gradient(circle at 50% 50%,transparent 60%,color-mix(in srgb,var(--fx-c1) 55%,transparent) 63% 72%,transparent 75%),radial-gradient(circle at 50% 50%,transparent 60%,color-mix(in srgb,var(--fx-c1) 55%,transparent) 63% 72%,transparent 75%),radial-gradient(circle at 50% 50%,transparent 60%,color-mix(in srgb,var(--fx-c1) 55%,transparent) 63% 72%,transparent 75%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:21px 21px;background-repeat:no-repeat;opacity:0.90;filter:drop-shadow(0 0 4px var(--fx-c1))"
  },
  {
   "v": "emblem",
   "label": "徽记角",
   "css": "background-image:radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 1.6px,transparent 2px),radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 1.6px,transparent 2px),radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 1.6px,transparent 2px),radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 1.6px,transparent 2px);background-position:0 0,100% 0,0 100%,100% 100%;background-size:21px 21px;background-repeat:no-repeat;opacity:0.50"
  },
  {
   "v": "mono",
   "label": "单色块角",
   "css": "background-image:conic-gradient(from 0deg,var(--fx-c1) 0 25%,transparent 0 50%,var(--fx-c1) 0 75%,transparent 0),conic-gradient(from 0deg,var(--fx-c1) 0 25%,transparent 0 50%,var(--fx-c1) 0 75%,transparent 0),conic-gradient(from 0deg,var(--fx-c1) 0 25%,transparent 0 50%,var(--fx-c1) 0 75%,transparent 0),conic-gradient(from 0deg,var(--fx-c1) 0 25%,transparent 0 50%,var(--fx-c1) 0 75%,transparent 0);background-position:0 0,100% 0,0 100%,100% 100%;background-size:21px 21px;background-repeat:no-repeat;opacity:0.60"
  },
  {
   "v": "half",
   "label": "半块角",
   "css": "background-image:linear-gradient(90deg,var(--fx-c2) 0 100%),linear-gradient(90deg,var(--fx-c2) 0 100%),linear-gradient(90deg,var(--fx-c2) 0 100%),linear-gradient(90deg,var(--fx-c2) 0 100%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:21px 21px;background-repeat:no-repeat;opacity:0.70;filter:drop-shadow(0 0 4px var(--fx-c1))"
  },
  {
   "v": "quarter",
   "label": "四分角",
   "css": "background-image:linear-gradient(135deg,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)),transparent 70%),linear-gradient(135deg,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)),transparent 70%),linear-gradient(135deg,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)),transparent 70%),linear-gradient(135deg,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)),transparent 70%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:21px 21px;background-repeat:no-repeat;opacity:0.80"
  },
  {
   "v": "split",
   "label": "斜分角",
   "css": "background-image:radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 40%,transparent 62%),radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 40%,transparent 62%),radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 40%,transparent 62%),radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 40%,transparent 62%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:21px 21px;background-repeat:no-repeat;opacity:0.90"
  },
  {
   "v": "splash",
   "label": "泼墨角",
   "css": "background-image:radial-gradient(circle,var(--fx-c1) 0 3px,transparent 3.4px),radial-gradient(circle,var(--fx-c1) 0 3px,transparent 3.4px),radial-gradient(circle,var(--fx-c1) 0 3px,transparent 3.4px),radial-gradient(circle,var(--fx-c1) 0 3px,transparent 3.4px);background-position:0 0,100% 0,0 100%,100% 100%;background-size:26px 26px;background-repeat:no-repeat;opacity:0.50;filter:drop-shadow(0 0 4px var(--fx-c1))"
  },
  {
   "v": "spark",
   "label": "火花角",
   "css": "background-image:radial-gradient(circle,transparent 52%,var(--fx-c2) 55% 64%,transparent 67%),radial-gradient(circle,transparent 52%,var(--fx-c2) 55% 64%,transparent 67%),radial-gradient(circle,transparent 52%,var(--fx-c2) 55% 64%,transparent 67%),radial-gradient(circle,transparent 52%,var(--fx-c2) 55% 64%,transparent 67%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:26px 26px;background-repeat:no-repeat;opacity:0.60"
  },
  {
   "v": "beam",
   "label": "光束角",
   "css": "background-image:linear-gradient(color-mix(in srgb,var(--fx-c1) 55%,transparent),color-mix(in srgb,var(--fx-c1) 55%,transparent)),linear-gradient(color-mix(in srgb,var(--fx-c1) 55%,transparent),color-mix(in srgb,var(--fx-c1) 55%,transparent)),linear-gradient(color-mix(in srgb,var(--fx-c1) 55%,transparent),color-mix(in srgb,var(--fx-c1) 55%,transparent)),linear-gradient(color-mix(in srgb,var(--fx-c1) 55%,transparent),color-mix(in srgb,var(--fx-c1) 55%,transparent));background-position:0 0,100% 0,0 100%,100% 100%;background-size:26px 26px;background-repeat:no-repeat;opacity:0.70"
  },
  {
   "v": "grad",
   "label": "渐变角",
   "css": "background-image:conic-gradient(from 45deg,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 25%,transparent 0),conic-gradient(from 45deg,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 25%,transparent 0),conic-gradient(from 45deg,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 25%,transparent 0),conic-gradient(from 45deg,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 25%,transparent 0);background-position:0 0,100% 0,0 100%,100% 100%;background-size:26px 26px;background-repeat:no-repeat;opacity:0.80;filter:drop-shadow(0 0 4px var(--fx-c1))"
  },
  {
   "v": "neon",
   "label": "霓虹角",
   "css": "background-image:radial-gradient(circle at 50% 50%,transparent 60%,var(--fx-c1) 63% 72%,transparent 75%),radial-gradient(circle at 50% 50%,transparent 60%,var(--fx-c1) 63% 72%,transparent 75%),radial-gradient(circle at 50% 50%,transparent 60%,var(--fx-c1) 63% 72%,transparent 75%),radial-gradient(circle at 50% 50%,transparent 60%,var(--fx-c1) 63% 72%,transparent 75%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:26px 26px;background-repeat:no-repeat;opacity:0.90"
  },
  {
   "v": "neon2",
   "label": "双色霓虹角",
   "css": "background-image:radial-gradient(circle,var(--fx-c2) 0 1.6px,transparent 2px),radial-gradient(circle,var(--fx-c2) 0 1.6px,transparent 2px),radial-gradient(circle,var(--fx-c2) 0 1.6px,transparent 2px),radial-gradient(circle,var(--fx-c2) 0 1.6px,transparent 2px);background-position:0 0,100% 0,0 100%,100% 100%;background-size:26px 26px;background-repeat:no-repeat;opacity:0.50"
  },
  {
   "v": "pixel",
   "label": "像素角",
   "css": "background-image:conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 0 25%,transparent 0 50%,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 0 75%,transparent 0),conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 0 25%,transparent 0 50%,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 0 75%,transparent 0),conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 0 25%,transparent 0 50%,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 0 75%,transparent 0),conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 0 25%,transparent 0 50%,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 0 75%,transparent 0);background-position:0 0,100% 0,0 100%,100% 100%;background-size:26px 26px;background-repeat:no-repeat;opacity:0.60;filter:drop-shadow(0 0 4px var(--fx-c1))"
  },
  {
   "v": "pixelc",
   "label": "像素方角",
   "css": "background-image:linear-gradient(90deg,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 100%),linear-gradient(90deg,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 100%),linear-gradient(90deg,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 100%),linear-gradient(90deg,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 100%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:26px 26px;background-repeat:no-repeat;opacity:0.70"
  },
  {
   "v": "block",
   "label": "方块角",
   "css": "background-image:linear-gradient(135deg,var(--fx-c1),transparent 70%),linear-gradient(135deg,var(--fx-c1),transparent 70%),linear-gradient(135deg,var(--fx-c1),transparent 70%),linear-gradient(135deg,var(--fx-c1),transparent 70%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:26px 26px;background-repeat:no-repeat;opacity:0.80"
  },
  {
   "v": "step",
   "label": "阶梯角",
   "css": "background-image:radial-gradient(circle,var(--fx-c2) 0 40%,transparent 62%),radial-gradient(circle,var(--fx-c2) 0 40%,transparent 62%),radial-gradient(circle,var(--fx-c2) 0 40%,transparent 62%),radial-gradient(circle,var(--fx-c2) 0 40%,transparent 62%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:26px 26px;background-repeat:no-repeat;opacity:0.90;filter:drop-shadow(0 0 4px var(--fx-c1))"
  },
  {
   "v": "zigzagc",
   "label": "锯齿角",
   "css": "background-image:radial-gradient(circle,color-mix(in srgb,var(--fx-c1) 55%,transparent) 0 3px,transparent 3.4px),radial-gradient(circle,color-mix(in srgb,var(--fx-c1) 55%,transparent) 0 3px,transparent 3.4px),radial-gradient(circle,color-mix(in srgb,var(--fx-c1) 55%,transparent) 0 3px,transparent 3.4px),radial-gradient(circle,color-mix(in srgb,var(--fx-c1) 55%,transparent) 0 3px,transparent 3.4px);background-position:0 0,100% 0,0 100%,100% 100%;background-size:32px 32px;background-repeat:no-repeat;opacity:0.50"
  },
  {
   "v": "wavec",
   "label": "波浪角",
   "css": "background-image:radial-gradient(circle,transparent 52%,color-mix(in srgb,var(--fx-c2) 55%,transparent) 55% 64%,transparent 67%),radial-gradient(circle,transparent 52%,color-mix(in srgb,var(--fx-c2) 55%,transparent) 55% 64%,transparent 67%),radial-gradient(circle,transparent 52%,color-mix(in srgb,var(--fx-c2) 55%,transparent) 55% 64%,transparent 67%),radial-gradient(circle,transparent 52%,color-mix(in srgb,var(--fx-c2) 55%,transparent) 55% 64%,transparent 67%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:32px 32px;background-repeat:no-repeat;opacity:0.60"
  },
  {
   "v": "spine",
   "label": "书脊角",
   "css": "background-image:linear-gradient(var(--fx-c1),var(--fx-c1)),linear-gradient(var(--fx-c1),var(--fx-c1)),linear-gradient(var(--fx-c1),var(--fx-c1)),linear-gradient(var(--fx-c1),var(--fx-c1));background-position:0 0,100% 0,0 100%,100% 100%;background-size:32px 32px;background-repeat:no-repeat;opacity:0.70;filter:drop-shadow(0 0 4px var(--fx-c1))"
  },
  {
   "v": "tab",
   "label": "标签页角",
   "css": "background-image:conic-gradient(from 45deg,var(--fx-c2) 0 25%,transparent 0),conic-gradient(from 45deg,var(--fx-c2) 0 25%,transparent 0),conic-gradient(from 45deg,var(--fx-c2) 0 25%,transparent 0),conic-gradient(from 45deg,var(--fx-c2) 0 25%,transparent 0);background-position:0 0,100% 0,0 100%,100% 100%;background-size:32px 32px;background-repeat:no-repeat;opacity:0.80"
  },
  {
   "v": "notchc",
   "label": "凹口角",
   "css": "background-image:radial-gradient(circle at 50% 50%,transparent 60%,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 63% 72%,transparent 75%),radial-gradient(circle at 50% 50%,transparent 60%,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 63% 72%,transparent 75%),radial-gradient(circle at 50% 50%,transparent 60%,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 63% 72%,transparent 75%),radial-gradient(circle at 50% 50%,transparent 60%,color-mix(in srgb,var(--fx-c1) 70%,var(--fx-c2)) 63% 72%,transparent 75%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:32px 32px;background-repeat:no-repeat;opacity:0.90"
  },
  {
   "v": "bolt",
   "label": "螺栓角",
   "css": "background-image:radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 1.6px,transparent 2px),radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 1.6px,transparent 2px),radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 1.6px,transparent 2px),radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 70%,var(--fx-c1)) 0 1.6px,transparent 2px);background-position:0 0,100% 0,0 100%,100% 100%;background-size:32px 32px;background-repeat:no-repeat;opacity:0.50;filter:drop-shadow(0 0 4px var(--fx-c1))"
  },
  {
   "v": "wire",
   "label": "绕线角",
   "css": "background-image:conic-gradient(from 0deg,var(--fx-c1) 0 25%,transparent 0 50%,var(--fx-c1) 0 75%,transparent 0),conic-gradient(from 0deg,var(--fx-c1) 0 25%,transparent 0 50%,var(--fx-c1) 0 75%,transparent 0),conic-gradient(from 0deg,var(--fx-c1) 0 25%,transparent 0 50%,var(--fx-c1) 0 75%,transparent 0),conic-gradient(from 0deg,var(--fx-c1) 0 25%,transparent 0 50%,var(--fx-c1) 0 75%,transparent 0);background-position:0 0,100% 0,0 100%,100% 100%;background-size:32px 32px;background-repeat:no-repeat;opacity:0.60"
  },
  {
   "v": "hollow",
   "label": "镂空角",
   "css": "background-image:linear-gradient(90deg,var(--fx-c2) 0 100%),linear-gradient(90deg,var(--fx-c2) 0 100%),linear-gradient(90deg,var(--fx-c2) 0 100%),linear-gradient(90deg,var(--fx-c2) 0 100%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:32px 32px;background-repeat:no-repeat;opacity:0.70"
  },
  {
   "v": "full",
   "label": "满角块",
   "css": "background-image:linear-gradient(135deg,color-mix(in srgb,var(--fx-c1) 55%,transparent),transparent 70%),linear-gradient(135deg,color-mix(in srgb,var(--fx-c1) 55%,transparent),transparent 70%),linear-gradient(135deg,color-mix(in srgb,var(--fx-c1) 55%,transparent),transparent 70%),linear-gradient(135deg,color-mix(in srgb,var(--fx-c1) 55%,transparent),transparent 70%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:32px 32px;background-repeat:no-repeat;opacity:0.80;filter:drop-shadow(0 0 4px var(--fx-c1))"
  },
  {
   "v": "halfgrad",
   "label": "半渐变角",
   "css": "background-image:radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 40%,transparent 62%),radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 40%,transparent 62%),radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 40%,transparent 62%),radial-gradient(circle,color-mix(in srgb,var(--fx-c2) 55%,transparent) 0 40%,transparent 62%);background-position:0 0,100% 0,0 100%,100% 100%;background-size:32px 32px;background-repeat:no-repeat;opacity:0.90"
  }
 ],
 "mo": [
  {
   "v": "static",
   "label": "静态克制"
  },
  {
   "v": "shimmer",
   "label": "流光掠影",
   "css": "background-image:linear-gradient(120deg,transparent 18%,color-mix(in srgb,var(--fx-c2) 38%,transparent) 50%,transparent 82%);background-size:200% 200%;background-repeat:no-repeat;animation:fxShimmer var(--fx-dur,5s) linear infinite"
  },
  {
   "v": "shimmerslow",
   "label": "慢流光",
   "css": "background-image:repeating-linear-gradient(45deg,color-mix(in srgb,var(--fx-c2) 20%,transparent) 0 3px,transparent 3px 17px);background-size:200% 200%;background-repeat:no-repeat;animation:fxShimmer var(--fx-dur,9s) linear infinite"
  },
  {
   "v": "shimmerfast",
   "label": "快流光",
   "css": "background-image:conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c2) 30%,transparent),transparent 42%,color-mix(in srgb,var(--fx-c1) 28%,transparent) 72%,transparent);background-size:200% 200%;background-repeat:no-repeat;animation:fxShimmer var(--fx-dur,3s) linear infinite"
  },
  {
   "v": "sheen",
   "label": "丝绸反光",
   "css": "background-image:radial-gradient(ellipse at 50% 100%,color-mix(in srgb,var(--fx-c2) 38%,transparent),transparent 66%);background-size:200% 200%;background-repeat:no-repeat;animation:fxShimmer var(--fx-dur,5s) linear infinite"
  },
  {
   "v": "sheen2",
   "label": "双丝绸",
   "css": "background-image:linear-gradient(0deg,color-mix(in srgb,var(--fx-c1) 34%,transparent),transparent 58%);background-size:200% 200%;background-repeat:no-repeat;animation:fxShimmer var(--fx-dur,5s) linear infinite"
  },
  {
   "v": "float",
   "label": "悬浮浮动",
   "css": "background-image:radial-gradient(circle at 30% 30%,color-mix(in srgb,var(--fx-c2) 42%,transparent),transparent 62%),radial-gradient(circle at 72% 74%,color-mix(in srgb,var(--fx-c1) 38%,transparent),transparent 62%);background-size:200% 200%;background-repeat:no-repeat;animation:fxFloat var(--fx-dur,5s) ease-in-out infinite"
  },
  {
   "v": "float2",
   "label": "轻浮动",
   "css": "background-image:linear-gradient(120deg,transparent 18%,color-mix(in srgb,var(--fx-c2) 38%,transparent) 50%,transparent 82%);background-size:200% 200%;background-repeat:no-repeat;animation:fxFloat var(--fx-dur,5s) ease-in-out infinite"
  },
  {
   "v": "float3",
   "label": "缓浮动",
   "css": "background-image:repeating-linear-gradient(45deg,color-mix(in srgb,var(--fx-c2) 20%,transparent) 0 3px,transparent 3px 17px);background-size:200% 200%;background-repeat:no-repeat;animation:fxFloat var(--fx-dur,5s) ease-in-out infinite"
  },
  {
   "v": "hoverlift",
   "label": "悬停抬升",
   "css": "background-image:conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c2) 30%,transparent),transparent 42%,color-mix(in srgb,var(--fx-c1) 28%,transparent) 72%,transparent);background-size:200% 200%;background-repeat:no-repeat;animation:fxFloat var(--fx-dur,5s) ease-in-out infinite"
  },
  {
   "v": "hoverscale",
   "label": "悬停放大",
   "css": "background-image:radial-gradient(ellipse at 50% 100%,color-mix(in srgb,var(--fx-c2) 38%,transparent),transparent 66%);background-size:200% 200%;background-repeat:no-repeat;animation:fxFloat var(--fx-dur,5s) ease-in-out infinite"
  },
  {
   "v": "hovershine",
   "label": "悬停闪光",
   "css": "background-image:linear-gradient(0deg,color-mix(in srgb,var(--fx-c1) 34%,transparent),transparent 58%);background-size:200% 200%;background-repeat:no-repeat;animation:fxShimmer var(--fx-dur,5s) linear infinite"
  },
  {
   "v": "hoverglow",
   "label": "悬停发光",
   "css": "background-image:radial-gradient(circle at 30% 30%,color-mix(in srgb,var(--fx-c2) 42%,transparent),transparent 62%),radial-gradient(circle at 72% 74%,color-mix(in srgb,var(--fx-c1) 38%,transparent),transparent 62%);background-size:200% 200%;background-repeat:no-repeat;animation:fxFloat var(--fx-dur,5s) ease-in-out infinite"
  },
  {
   "v": "hoverrotate",
   "label": "悬停微转",
   "css": "background-image:linear-gradient(120deg,transparent 18%,color-mix(in srgb,var(--fx-c2) 38%,transparent) 50%,transparent 82%);background-size:200% 200%;background-repeat:no-repeat;animation:fxFloat var(--fx-dur,5s) ease-in-out infinite"
  },
  {
   "v": "hoverrise",
   "label": "悬停上浮",
   "css": "background-image:repeating-linear-gradient(45deg,color-mix(in srgb,var(--fx-c2) 20%,transparent) 0 3px,transparent 3px 17px);background-size:200% 200%;background-repeat:no-repeat;animation:fxFloat var(--fx-dur,5s) ease-in-out infinite"
  },
  {
   "v": "parallax",
   "label": "视差位移",
   "css": "background-image:conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c2) 30%,transparent),transparent 42%,color-mix(in srgb,var(--fx-c1) 28%,transparent) 72%,transparent);background-size:200% 200%;background-repeat:no-repeat;animation:fxDrift var(--fx-dur,13s) ease-in-out infinite"
  },
  {
   "v": "parallax2",
   "label": "多层视差",
   "css": "background-image:radial-gradient(ellipse at 50% 100%,color-mix(in srgb,var(--fx-c2) 38%,transparent),transparent 66%);background-size:200% 200%;background-repeat:no-repeat;animation:fxDrift var(--fx-dur,13s) ease-in-out infinite"
  },
  {
   "v": "particle",
   "label": "粒子漂浮",
   "css": "background-image:linear-gradient(0deg,color-mix(in srgb,var(--fx-c1) 34%,transparent),transparent 58%);background-size:200% 200%;background-repeat:no-repeat;animation:fxTwinkle var(--fx-dur,4s) ease-in-out infinite"
  },
  {
   "v": "particle2",
   "label": "微光粒子",
   "css": "background-image:radial-gradient(circle at 30% 30%,color-mix(in srgb,var(--fx-c2) 42%,transparent),transparent 62%),radial-gradient(circle at 72% 74%,color-mix(in srgb,var(--fx-c1) 38%,transparent),transparent 62%);background-size:200% 200%;background-repeat:no-repeat;animation:fxTwinkle var(--fx-dur,4s) ease-in-out infinite"
  },
  {
   "v": "particle3",
   "label": "星尘粒子",
   "css": "background-image:linear-gradient(120deg,transparent 18%,color-mix(in srgb,var(--fx-c2) 38%,transparent) 50%,transparent 82%);background-size:200% 200%;background-repeat:no-repeat;animation:fxTwinkle var(--fx-dur,4s) ease-in-out infinite"
  },
  {
   "v": "drift",
   "label": "缓慢漂移",
   "css": "background-image:repeating-linear-gradient(45deg,color-mix(in srgb,var(--fx-c2) 20%,transparent) 0 3px,transparent 3px 17px);background-size:200% 200%;background-repeat:no-repeat;animation:fxDrift var(--fx-dur,13s) ease-in-out infinite"
  },
  {
   "v": "drift2",
   "label": "背景漂移",
   "css": "background-image:conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c2) 30%,transparent),transparent 42%,color-mix(in srgb,var(--fx-c1) 28%,transparent) 72%,transparent);background-size:200% 200%;background-repeat:no-repeat;animation:fxDrift var(--fx-dur,13s) ease-in-out infinite"
  },
  {
   "v": "pulse",
   "label": "脉动缩放",
   "css": "background-image:radial-gradient(ellipse at 50% 100%,color-mix(in srgb,var(--fx-c2) 38%,transparent),transparent 66%);background-size:200% 200%;background-repeat:no-repeat;animation:fxGlowPulse var(--fx-dur,5s) ease-in-out infinite"
  },
  {
   "v": "pulse2",
   "label": "柔脉动",
   "css": "background-image:linear-gradient(0deg,color-mix(in srgb,var(--fx-c1) 34%,transparent),transparent 58%);background-size:200% 200%;background-repeat:no-repeat;animation:fxRipple var(--fx-dur,4.4s) ease-out infinite"
  },
  {
   "v": "breath",
   "label": "呼吸缩放",
   "css": "background-image:radial-gradient(circle at 30% 30%,color-mix(in srgb,var(--fx-c2) 42%,transparent),transparent 62%),radial-gradient(circle at 72% 74%,color-mix(in srgb,var(--fx-c1) 38%,transparent),transparent 62%);background-size:200% 200%;background-repeat:no-repeat;animation:fxBreathe var(--fx-dur,7s) ease-in-out infinite"
  },
  {
   "v": "breathe",
   "label": "缓呼吸",
   "css": "background-image:linear-gradient(120deg,transparent 18%,color-mix(in srgb,var(--fx-c2) 38%,transparent) 50%,transparent 82%);background-size:200% 200%;background-repeat:no-repeat;animation:fxBreathe var(--fx-dur,7s) ease-in-out infinite"
  },
  {
   "v": "breathelight",
   "label": "光呼吸",
   "css": "background-image:repeating-linear-gradient(45deg,color-mix(in srgb,var(--fx-c2) 20%,transparent) 0 3px,transparent 3px 17px);background-size:200% 200%;background-repeat:no-repeat;animation:fxBreathe var(--fx-dur,7s) ease-in-out infinite"
  },
  {
   "v": "rotate",
   "label": "持续旋转",
   "css": "background-image:conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c2) 30%,transparent),transparent 42%,color-mix(in srgb,var(--fx-c1) 28%,transparent) 72%,transparent);background-size:200% 200%;background-repeat:no-repeat;animation:fxSpin var(--fx-dur,16s) linear infinite"
  },
  {
   "v": "rotate2",
   "label": "慢旋转",
   "css": "background-image:radial-gradient(ellipse at 50% 100%,color-mix(in srgb,var(--fx-c2) 38%,transparent),transparent 66%);background-size:200% 200%;background-repeat:no-repeat;animation:fxSpin var(--fx-dur,16s) linear infinite"
  },
  {
   "v": "rotate3",
   "label": "逆旋转",
   "css": "background-image:linear-gradient(0deg,color-mix(in srgb,var(--fx-c1) 34%,transparent),transparent 58%);background-size:200% 200%;background-repeat:no-repeat;animation:fxSpin var(--fx-dur,16s) linear infinite"
  },
  {
   "v": "rotor",
   "label": "摇摆",
   "css": "background-image:radial-gradient(circle at 30% 30%,color-mix(in srgb,var(--fx-c2) 42%,transparent),transparent 62%),radial-gradient(circle at 72% 74%,color-mix(in srgb,var(--fx-c1) 38%,transparent),transparent 62%);background-size:200% 200%;background-repeat:no-repeat;animation:fxGlowPulse var(--fx-dur,6s) ease-in-out infinite"
  },
  {
   "v": "wiggle",
   "label": "轻微摆动",
   "css": "background-image:linear-gradient(120deg,transparent 18%,color-mix(in srgb,var(--fx-c2) 38%,transparent) 50%,transparent 82%);background-size:200% 200%;background-repeat:no-repeat;animation:fxTilt var(--fx-dur,5s) ease-in-out infinite"
  },
  {
   "v": "wobble",
   "label": "摇晃",
   "css": "background-image:repeating-linear-gradient(45deg,color-mix(in srgb,var(--fx-c2) 20%,transparent) 0 3px,transparent 3px 17px);background-size:200% 200%;background-repeat:no-repeat;animation:fxTilt var(--fx-dur,5s) ease-in-out infinite"
  },
  {
   "v": "bounce",
   "label": "弹跳",
   "css": "background-image:conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c2) 30%,transparent),transparent 42%,color-mix(in srgb,var(--fx-c1) 28%,transparent) 72%,transparent);background-size:200% 200%;background-repeat:no-repeat;animation:fxBounce var(--fx-dur,3s) ease-in-out infinite"
  },
  {
   "v": "shake",
   "label": "微抖动",
   "css": "background-image:radial-gradient(ellipse at 50% 100%,color-mix(in srgb,var(--fx-c2) 38%,transparent),transparent 66%);background-size:200% 200%;background-repeat:no-repeat;animation:fxShake var(--fx-dur,1.6s) ease-in-out infinite"
  },
  {
   "v": "wavem",
   "label": "波浪形动",
   "css": "background-image:linear-gradient(0deg,color-mix(in srgb,var(--fx-c1) 34%,transparent),transparent 58%);background-size:200% 200%;background-repeat:no-repeat;animation:fxWave var(--fx-dur,5s) ease-in-out infinite"
  },
  {
   "v": "ripple",
   "label": "涟漪",
   "css": "background-image:radial-gradient(circle at 30% 30%,color-mix(in srgb,var(--fx-c2) 42%,transparent),transparent 62%),radial-gradient(circle at 72% 74%,color-mix(in srgb,var(--fx-c1) 38%,transparent),transparent 62%);background-size:200% 200%;background-repeat:no-repeat;animation:fxRipple var(--fx-dur,4.4s) ease-out infinite"
  },
  {
   "v": "ripple2",
   "label": "扩散涟漪",
   "css": "background-image:linear-gradient(120deg,transparent 18%,color-mix(in srgb,var(--fx-c2) 38%,transparent) 50%,transparent 82%);background-size:200% 200%;background-repeat:no-repeat;animation:fxRipple var(--fx-dur,4.4s) ease-out infinite"
  },
  {
   "v": "blink",
   "label": "闪烁",
   "css": "background-image:repeating-linear-gradient(45deg,color-mix(in srgb,var(--fx-c2) 20%,transparent) 0 3px,transparent 3px 17px);background-size:200% 200%;background-repeat:no-repeat;animation:fxBlink var(--fx-dur,3.2s) ease-in-out infinite"
  },
  {
   "v": "blink2",
   "label": "慢闪烁",
   "css": "background-image:conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c2) 30%,transparent),transparent 42%,color-mix(in srgb,var(--fx-c1) 28%,transparent) 72%,transparent);background-size:200% 200%;background-repeat:no-repeat;animation:fxBlink var(--fx-dur,3.2s) ease-in-out infinite"
  },
  {
   "v": "flicker",
   "label": "微闪",
   "css": "background-image:radial-gradient(ellipse at 50% 100%,color-mix(in srgb,var(--fx-c2) 38%,transparent),transparent 66%);background-size:200% 200%;background-repeat:no-repeat;animation:fxFlicker var(--fx-dur,3s) linear infinite"
  },
  {
   "v": "strobe",
   "label": "频闪",
   "css": "background-image:linear-gradient(0deg,color-mix(in srgb,var(--fx-c1) 34%,transparent),transparent 58%);background-size:200% 200%;background-repeat:no-repeat;animation:fxBlink var(--fx-dur,3.2s) ease-in-out infinite"
  },
  {
   "v": "fadein",
   "label": "淡入",
   "css": "background-image:radial-gradient(circle at 30% 30%,color-mix(in srgb,var(--fx-c2) 42%,transparent),transparent 62%),radial-gradient(circle at 72% 74%,color-mix(in srgb,var(--fx-c1) 38%,transparent),transparent 62%);background-size:200% 200%;background-repeat:no-repeat;animation:fxRise var(--fx-dur,3.6s) ease-out infinite"
  },
  {
   "v": "fadeup",
   "label": "上浮淡入",
   "css": "background-image:linear-gradient(120deg,transparent 18%,color-mix(in srgb,var(--fx-c2) 38%,transparent) 50%,transparent 82%);background-size:200% 200%;background-repeat:no-repeat;animation:fxBreathe var(--fx-dur,5s) ease-in-out infinite"
  },
  {
   "v": "fadedown",
   "label": "下沉淡入",
   "css": "background-image:repeating-linear-gradient(45deg,color-mix(in srgb,var(--fx-c2) 20%,transparent) 0 3px,transparent 3px 17px);background-size:200% 200%;background-repeat:no-repeat;animation:fxDrift var(--fx-dur,6s) ease-in-out infinite"
  },
  {
   "v": "fadeside",
   "label": "侧滑淡入",
   "css": "background-image:conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c2) 30%,transparent),transparent 42%,color-mix(in srgb,var(--fx-c1) 28%,transparent) 72%,transparent);background-size:200% 200%;background-repeat:no-repeat;animation:fxTwinkle var(--fx-dur,7s) ease-in-out infinite"
  },
  {
   "v": "scalein",
   "label": "缩放进入",
   "css": "background-image:radial-gradient(ellipse at 50% 100%,color-mix(in srgb,var(--fx-c2) 38%,transparent),transparent 66%);background-size:200% 200%;background-repeat:no-repeat;animation:fxScale var(--fx-dur,5s) ease-out infinite"
  },
  {
   "v": "spin",
   "label": "悬停旋转",
   "css": "background-image:linear-gradient(0deg,color-mix(in srgb,var(--fx-c1) 34%,transparent),transparent 58%);background-size:200% 200%;background-repeat:no-repeat;animation:fxSpin var(--fx-dur,16s) linear infinite"
  },
  {
   "v": "spin3d",
   "label": "3D 翻转",
   "css": "background-image:radial-gradient(circle at 30% 30%,color-mix(in srgb,var(--fx-c2) 42%,transparent),transparent 62%),radial-gradient(circle at 72% 74%,color-mix(in srgb,var(--fx-c1) 38%,transparent),transparent 62%);background-size:200% 200%;background-repeat:no-repeat;animation:fxSpin var(--fx-dur,16s) linear infinite"
  },
  {
   "v": "flip",
   "label": "卡片翻转",
   "css": "background-image:linear-gradient(120deg,transparent 18%,color-mix(in srgb,var(--fx-c2) 38%,transparent) 50%,transparent 82%);background-size:200% 200%;background-repeat:no-repeat;animation:fxSpin var(--fx-dur,12s) linear infinite;transform-origin:center"
  },
  {
   "v": "flipx",
   "label": "X 轴翻转",
   "css": "background-image:repeating-linear-gradient(45deg,color-mix(in srgb,var(--fx-c2) 20%,transparent) 0 3px,transparent 3px 17px);background-size:200% 200%;background-repeat:no-repeat;animation:fxSpin var(--fx-dur,12s) linear infinite;transform-origin:center"
  },
  {
   "v": "tilt",
   "label": "倾斜跟随",
   "css": "background-image:conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c2) 30%,transparent),transparent 42%,color-mix(in srgb,var(--fx-c1) 28%,transparent) 72%,transparent);background-size:200% 200%;background-repeat:no-repeat;animation:fxTilt var(--fx-dur,5s) ease-in-out infinite"
  },
  {
   "v": "tilt2",
   "label": "微倾斜",
   "css": "background-image:radial-gradient(ellipse at 50% 100%,color-mix(in srgb,var(--fx-c2) 38%,transparent),transparent 66%);background-size:200% 200%;background-repeat:no-repeat;animation:fxTilt var(--fx-dur,5s) ease-in-out infinite"
  },
  {
   "v": "glitch",
   "label": "故障干扰",
   "css": "background-image:linear-gradient(0deg,color-mix(in srgb,var(--fx-c1) 34%,transparent),transparent 58%);background-size:200% 200%;background-repeat:no-repeat;animation:fxGlitch var(--fx-dur,3s) steps(2,end) infinite"
  },
  {
   "v": "glitch2",
   "label": "RGB 故障",
   "css": "background-image:radial-gradient(circle at 30% 30%,color-mix(in srgb,var(--fx-c2) 42%,transparent),transparent 62%),radial-gradient(circle at 72% 74%,color-mix(in srgb,var(--fx-c1) 38%,transparent),transparent 62%);background-size:200% 200%;background-repeat:no-repeat;animation:fxGlitch var(--fx-dur,3s) steps(2,end) infinite"
  },
  {
   "v": "glitch3",
   "label": "扫描故障",
   "css": "background-image:linear-gradient(120deg,transparent 18%,color-mix(in srgb,var(--fx-c2) 38%,transparent) 50%,transparent 82%);background-size:200% 200%;background-repeat:no-repeat;animation:fxGlitch var(--fx-dur,3s) steps(2,end) infinite"
  },
  {
   "v": "scan",
   "label": "扫描线",
   "css": "background-image:repeating-linear-gradient(45deg,color-mix(in srgb,var(--fx-c2) 20%,transparent) 0 3px,transparent 3px 17px);background-size:200% 200%;background-repeat:no-repeat;animation:fxFlow var(--fx-dur,6s) linear infinite"
  },
  {
   "v": "scan2",
   "label": "扫描光带",
   "css": "background-image:conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c2) 30%,transparent),transparent 42%,color-mix(in srgb,var(--fx-c1) 28%,transparent) 72%,transparent);background-size:200% 200%;background-repeat:no-repeat;animation:fxFlow var(--fx-dur,6s) linear infinite"
  },
  {
   "v": "scanline",
   "label": "横扫线",
   "css": "background-image:radial-gradient(ellipse at 50% 100%,color-mix(in srgb,var(--fx-c2) 38%,transparent),transparent 66%);background-size:200% 200%;background-repeat:no-repeat;animation:fxFlow var(--fx-dur,6s) linear infinite"
  },
  {
   "v": "hologram",
   "label": "全息闪动",
   "css": "background-image:linear-gradient(0deg,color-mix(in srgb,var(--fx-c1) 34%,transparent),transparent 58%);background-size:200% 200%;background-repeat:no-repeat;animation:fxGlowPulse var(--fx-dur,5s) ease-in-out infinite;filter:hue-rotate(20deg)"
  },
  {
   "v": "matrix",
   "label": "矩阵流",
   "css": "background-image:radial-gradient(circle at 30% 30%,color-mix(in srgb,var(--fx-c2) 42%,transparent),transparent 62%),radial-gradient(circle at 72% 74%,color-mix(in srgb,var(--fx-c1) 38%,transparent),transparent 62%);background-size:200% 200%;background-repeat:no-repeat;animation:fxFlow var(--fx-dur,6s) linear infinite"
  },
  {
   "v": "type",
   "label": "打字机",
   "css": "background-image:linear-gradient(120deg,transparent 18%,color-mix(in srgb,var(--fx-c2) 38%,transparent) 50%,transparent 82%);background-size:200% 200%;background-repeat:no-repeat;animation:fxTypeIn var(--fx-dur,4s) steps(20,end) infinite"
  },
  {
   "v": "typeloop",
   "label": "循环打字",
   "css": "background-image:repeating-linear-gradient(45deg,color-mix(in srgb,var(--fx-c2) 20%,transparent) 0 3px,transparent 3px 17px);background-size:200% 200%;background-repeat:no-repeat;animation:fxTypeIn var(--fx-dur,4s) steps(20,end) infinite"
  },
  {
   "v": "reveal",
   "label": "遮罩展开",
   "css": "background-image:conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c2) 30%,transparent),transparent 42%,color-mix(in srgb,var(--fx-c1) 28%,transparent) 72%,transparent);background-size:200% 200%;background-repeat:no-repeat;animation:fxRise var(--fx-dur,3.6s) ease-out infinite"
  },
  {
   "v": "reveal2",
   "label": "斜向展开",
   "css": "background-image:radial-gradient(ellipse at 50% 100%,color-mix(in srgb,var(--fx-c2) 38%,transparent),transparent 66%);background-size:200% 200%;background-repeat:no-repeat;animation:fxRise var(--fx-dur,3.6s) ease-out infinite"
  },
  {
   "v": "clip",
   "label": "裁切循环",
   "css": "background-image:linear-gradient(0deg,color-mix(in srgb,var(--fx-c1) 34%,transparent),transparent 58%);background-size:200% 200%;background-repeat:no-repeat;animation:fxPulse var(--fx-dur,6s) ease-in-out infinite"
  },
  {
   "v": "wipe",
   "label": "擦拭",
   "css": "background-image:radial-gradient(circle at 30% 30%,color-mix(in srgb,var(--fx-c2) 42%,transparent),transparent 62%),radial-gradient(circle at 72% 74%,color-mix(in srgb,var(--fx-c1) 38%,transparent),transparent 62%);background-size:200% 200%;background-repeat:no-repeat;animation:fxScale var(--fx-dur,7s) ease-in-out infinite"
  },
  {
   "v": "zoom",
   "label": "背景缩放",
   "css": "background-image:linear-gradient(120deg,transparent 18%,color-mix(in srgb,var(--fx-c2) 38%,transparent) 50%,transparent 82%);background-size:200% 200%;background-repeat:no-repeat;animation:fxScale var(--fx-dur,5s) ease-out infinite"
  },
  {
   "v": "zoom2",
   "label": "慢缩放",
   "css": "background-image:repeating-linear-gradient(45deg,color-mix(in srgb,var(--fx-c2) 20%,transparent) 0 3px,transparent 3px 17px);background-size:200% 200%;background-repeat:no-repeat;animation:fxScale var(--fx-dur,5s) ease-out infinite"
  },
  {
   "v": "pan",
   "label": "全景平移",
   "css": "background-image:conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c2) 30%,transparent),transparent 42%,color-mix(in srgb,var(--fx-c1) 28%,transparent) 72%,transparent);background-size:200% 200%;background-repeat:no-repeat;animation:fxDrift var(--fx-dur,13s) ease-in-out infinite"
  },
  {
   "v": "orbit",
   "label": "环绕光",
   "css": "background-image:radial-gradient(ellipse at 50% 100%,color-mix(in srgb,var(--fx-c2) 38%,transparent),transparent 66%);background-size:200% 200%;background-repeat:no-repeat;animation:fxOrbit var(--fx-dur,8s) linear infinite"
  },
  {
   "v": "orbit2",
   "label": "双环环绕",
   "css": "background-image:linear-gradient(0deg,color-mix(in srgb,var(--fx-c1) 34%,transparent),transparent 58%);background-size:200% 200%;background-repeat:no-repeat;animation:fxOrbit var(--fx-dur,8s) linear infinite"
  },
  {
   "v": "comet",
   "label": "彗星轨迹",
   "css": "background-image:radial-gradient(circle at 30% 30%,color-mix(in srgb,var(--fx-c2) 42%,transparent),transparent 62%),radial-gradient(circle at 72% 74%,color-mix(in srgb,var(--fx-c1) 38%,transparent),transparent 62%);background-size:200% 200%;background-repeat:no-repeat;animation:fxShine var(--fx-dur,3.4s) linear infinite"
  },
  {
   "v": "magnet",
   "label": "磁性吸引",
   "css": "background-image:linear-gradient(120deg,transparent 18%,color-mix(in srgb,var(--fx-c2) 38%,transparent) 50%,transparent 82%);background-size:200% 200%;background-repeat:no-repeat;animation:fxPulse var(--fx-dur,7s) ease-in-out infinite"
  },
  {
   "v": "glowwave",
   "label": "光波扩散",
   "css": "background-image:repeating-linear-gradient(45deg,color-mix(in srgb,var(--fx-c2) 20%,transparent) 0 3px,transparent 3px 17px);background-size:200% 200%;background-repeat:no-repeat;animation:fxGlowPulse var(--fx-dur,4.6s) ease-in-out infinite"
  },
  {
   "v": "shockwave",
   "label": "冲击波",
   "css": "background-image:conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c2) 30%,transparent),transparent 42%,color-mix(in srgb,var(--fx-c1) 28%,transparent) 72%,transparent);background-size:200% 200%;background-repeat:no-repeat;animation:fxRipple var(--fx-dur,4.4s) ease-out infinite"
  },
  {
   "v": "focus",
   "label": "聚焦缩放",
   "css": "background-image:radial-gradient(ellipse at 50% 100%,color-mix(in srgb,var(--fx-c2) 38%,transparent),transparent 66%);background-size:200% 200%;background-repeat:no-repeat;animation:fxGlowPulse var(--fx-dur,6.5s) ease-in-out infinite;filter:saturate(1.12)"
  },
  {
   "v": "unfocus",
   "label": "失焦模糊",
   "css": "background-image:linear-gradient(0deg,color-mix(in srgb,var(--fx-c1) 34%,transparent),transparent 58%);background-size:200% 200%;background-repeat:no-repeat;animation:fxGlowPulse var(--fx-dur,6.5s) ease-in-out infinite;filter:saturate(1.12)"
  },
  {
   "v": "blur",
   "label": "模糊循环",
   "css": "background-image:radial-gradient(circle at 30% 30%,color-mix(in srgb,var(--fx-c2) 42%,transparent),transparent 62%),radial-gradient(circle at 72% 74%,color-mix(in srgb,var(--fx-c1) 38%,transparent),transparent 62%);background-size:200% 200%;background-repeat:no-repeat;animation:fxGlowPulse var(--fx-dur,6.5s) ease-in-out infinite;filter:saturate(1.12)"
  },
  {
   "v": "sharpen",
   "label": "清晰闪现",
   "css": "background-image:linear-gradient(120deg,transparent 18%,color-mix(in srgb,var(--fx-c2) 38%,transparent) 50%,transparent 82%);background-size:200% 200%;background-repeat:no-repeat;animation:fxTilt var(--fx-dur,6s) ease-in-out infinite"
  },
  {
   "v": "tint",
   "label": "色相循环",
   "css": "background-image:repeating-linear-gradient(45deg,color-mix(in srgb,var(--fx-c2) 20%,transparent) 0 3px,transparent 3px 17px);background-size:200% 200%;background-repeat:no-repeat;animation:fxGlowPulse var(--fx-dur,7s) ease-in-out infinite;filter:hue-rotate(12deg) saturate(1.2)"
  },
  {
   "v": "saturate",
   "label": "饱和度脉动",
   "css": "background-image:conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c2) 30%,transparent),transparent 42%,color-mix(in srgb,var(--fx-c1) 28%,transparent) 72%,transparent);background-size:200% 200%;background-repeat:no-repeat;animation:fxGlowPulse var(--fx-dur,7s) ease-in-out infinite;filter:hue-rotate(12deg) saturate(1.2)"
  },
  {
   "v": "bright",
   "label": "明度脉动",
   "css": "background-image:radial-gradient(ellipse at 50% 100%,color-mix(in srgb,var(--fx-c2) 38%,transparent),transparent 66%);background-size:200% 200%;background-repeat:no-repeat;animation:fxScale var(--fx-dur,9s) ease-in-out infinite"
  },
  {
   "v": "contrast",
   "label": "对比脉动",
   "css": "background-image:linear-gradient(0deg,color-mix(in srgb,var(--fx-c1) 34%,transparent),transparent 58%);background-size:200% 200%;background-repeat:no-repeat;animation:fxGlowPulse var(--fx-dur,7s) ease-in-out infinite;filter:hue-rotate(12deg) saturate(1.2)"
  },
  {
   "v": "invert",
   "label": "反相闪",
   "css": "background-image:radial-gradient(circle at 30% 30%,color-mix(in srgb,var(--fx-c2) 42%,transparent),transparent 62%),radial-gradient(circle at 72% 74%,color-mix(in srgb,var(--fx-c1) 38%,transparent),transparent 62%);background-size:200% 200%;background-repeat:no-repeat;animation:fxDrift var(--fx-dur,4s) ease-in-out infinite"
  },
  {
   "v": "ghost",
   "label": "幽灵淡出",
   "css": "background-image:linear-gradient(120deg,transparent 18%,color-mix(in srgb,var(--fx-c2) 38%,transparent) 50%,transparent 82%);background-size:200% 200%;background-repeat:no-repeat;animation:fxTwinkle var(--fx-dur,5s) ease-in-out infinite"
  },
  {
   "v": "liquid",
   "label": "液态流动",
   "css": "background-image:repeating-linear-gradient(45deg,color-mix(in srgb,var(--fx-c2) 20%,transparent) 0 3px,transparent 3px 17px);background-size:200% 200%;background-repeat:no-repeat;animation:fxWave var(--fx-dur,6s) ease-in-out infinite"
  },
  {
   "v": "neonpulse",
   "label": "霓虹脉冲",
   "css": "background-image:conic-gradient(from 0deg,color-mix(in srgb,var(--fx-c2) 30%,transparent),transparent 42%,color-mix(in srgb,var(--fx-c1) 28%,transparent) 72%,transparent);background-size:200% 200%;background-repeat:no-repeat;animation:fxGlowPulse var(--fx-dur,3s) ease-in-out infinite"
  }
 ],
 "hl": [
  {
   "v": "none",
   "label": "无光环"
  },
  {
   "v": "solid",
   "label": "实线环",
   "css": "background-image:radial-gradient(circle at 50% 50%,transparent 40%,var(--fx-c2) 41% 47%,transparent 49%);background-size:120% 120%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.42"
  },
  {
   "v": "double",
   "label": "双线环",
   "css": "background-image:radial-gradient(circle at 50% 50%,transparent 40%,var(--fx-c1) 41% 42.5%,transparent 44%,transparent 48%,var(--fx-c1) 49% 50.5%,transparent 52%);background-size:120% 120%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.54"
  },
  {
   "v": "triple",
   "label": "三线环",
   "css": "background-image:radial-gradient(circle at 50% 50%,var(--fx-c2) 0,transparent 58%);background-size:120% 120%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.66"
  },
  {
   "v": "dotted",
   "label": "点线环",
   "css": "background-image:radial-gradient(ellipse at 50% 50%,var(--fx-c1) 0,transparent 66%);background-size:120% 120%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.78"
  },
  {
   "v": "dashed",
   "label": "虚线环",
   "css": "background-image:repeating-conic-gradient(from 0deg,var(--fx-c2) 0 2deg,transparent 2deg 12deg);background-size:120% 120%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.30"
  },
  {
   "v": "glow",
   "label": "发光环",
   "css": "background-image:repeating-conic-gradient(from 0deg,var(--fx-c1) 0 8deg,transparent 8deg 18deg);background-size:120% 120%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.42"
  },
  {
   "v": "glow2",
   "label": "强光环",
   "css": "background-image:repeating-conic-gradient(from 0deg,var(--fx-c2) 0 40deg,transparent 40deg 60deg);background-size:120% 120%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.54"
  },
  {
   "v": "glowsoft",
   "label": "柔光环",
   "css": "background-image:conic-gradient(from 0deg,var(--fx-c1),transparent 40%,var(--fx-c1) 70%,transparent);background-size:120% 120%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.66"
  },
  {
   "v": "breath",
   "label": "呼吸光环",
   "css": "background-image:radial-gradient(circle at 50% 8%,var(--fx-c2) 0 2px,transparent 3px),radial-gradient(circle at 50% 92%,var(--fx-c2) 0 2px,transparent 3px),radial-gradient(circle at 8% 50%,var(--fx-c2) 0 2px,transparent 3px),radial-gradient(circle at 92% 50%,var(--fx-c2) 0 2px,transparent 3px);background-size:120% 120%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.78"
  },
  {
   "v": "pulse",
   "label": "脉冲环",
   "css": "background-image:radial-gradient(circle at 50% 50%,transparent 30%,color-mix(in srgb,var(--fx-c1) 45%,transparent) 62%,transparent 78%);background-size:120% 120%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.30"
  },
  {
   "v": "pulse2",
   "label": "双脉冲环",
   "css": "background-image:conic-gradient(from 180deg at 50% 50%,var(--fx-c2) 0 12deg,transparent 12deg 348deg);background-size:120% 120%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.42"
  },
  {
   "v": "sonar",
   "label": "声纳环",
   "css": "background-image:radial-gradient(circle at 50% 50%,transparent 44%,var(--fx-c1) 45% 46.5%,transparent 48%);background-size:160% 160%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.54"
  },
  {
   "v": "spin",
   "label": "旋转环",
   "css": "background-image:radial-gradient(circle at 50% 50%,transparent 40%,var(--fx-c2) 41% 47%,transparent 49%);background-size:160% 160%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.66"
  },
  {
   "v": "spin2",
   "label": "虚线旋转",
   "css": "background-image:radial-gradient(circle at 50% 50%,transparent 40%,var(--fx-c1) 41% 42.5%,transparent 44%,transparent 48%,var(--fx-c1) 49% 50.5%,transparent 52%);background-size:160% 160%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.78"
  },
  {
   "v": "spin3",
   "label": "反向旋转",
   "css": "background-image:radial-gradient(circle at 50% 50%,var(--fx-c2) 0,transparent 58%);background-size:160% 160%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.30"
  },
  {
   "v": "spindash",
   "label": "虚线正转",
   "css": "background-image:radial-gradient(ellipse at 50% 50%,var(--fx-c1) 0,transparent 66%);background-size:160% 160%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.42"
  },
  {
   "v": "spindash2",
   "label": "虚线反转",
   "css": "background-image:repeating-conic-gradient(from 0deg,var(--fx-c2) 0 2deg,transparent 2deg 12deg);background-size:160% 160%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.54"
  },
  {
   "v": "rotateconic",
   "label": "圆锥渐变环",
   "css": "background-image:repeating-conic-gradient(from 0deg,var(--fx-c1) 0 8deg,transparent 8deg 18deg);background-size:160% 160%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.66"
  },
  {
   "v": "rotatearc",
   "label": "弧形扫描",
   "css": "background-image:repeating-conic-gradient(from 0deg,var(--fx-c2) 0 40deg,transparent 40deg 60deg);background-size:160% 160%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.78"
  },
  {
   "v": "comet",
   "label": "彗星环",
   "css": "background-image:conic-gradient(from 0deg,var(--fx-c1),transparent 40%,var(--fx-c1) 70%,transparent);background-size:160% 160%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.30"
  },
  {
   "v": "dashcomet",
   "label": "虚线彗星",
   "css": "background-image:radial-gradient(circle at 50% 8%,var(--fx-c2) 0 2px,transparent 3px),radial-gradient(circle at 50% 92%,var(--fx-c2) 0 2px,transparent 3px),radial-gradient(circle at 8% 50%,var(--fx-c2) 0 2px,transparent 3px),radial-gradient(circle at 92% 50%,var(--fx-c2) 0 2px,transparent 3px);background-size:160% 160%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.42"
  },
  {
   "v": "orbit",
   "label": "环绕星点",
   "css": "background-image:radial-gradient(circle at 50% 50%,transparent 30%,color-mix(in srgb,var(--fx-c1) 45%,transparent) 62%,transparent 78%);background-size:160% 160%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.54"
  },
  {
   "v": "orbit2",
   "label": "双轨环绕",
   "css": "background-image:conic-gradient(from 180deg at 50% 50%,var(--fx-c2) 0 12deg,transparent 12deg 348deg);background-size:160% 160%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.66"
  },
  {
   "v": "ringglow",
   "label": "光环扩散",
   "css": "background-image:radial-gradient(circle at 50% 50%,transparent 44%,var(--fx-c1) 45% 46.5%,transparent 48%);background-size:200% 200%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.78"
  },
  {
   "v": "ringglow2",
   "label": "双光环",
   "css": "background-image:radial-gradient(circle at 50% 50%,transparent 40%,var(--fx-c2) 41% 47%,transparent 49%);background-size:200% 200%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.30"
  },
  {
   "v": "halo",
   "label": "神圣光环",
   "css": "background-image:radial-gradient(circle at 50% 50%,transparent 40%,var(--fx-c1) 41% 42.5%,transparent 44%,transparent 48%,var(--fx-c1) 49% 50.5%,transparent 52%);background-size:200% 200%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.42"
  },
  {
   "v": "halorot",
   "label": "旋转光环",
   "css": "background-image:radial-gradient(circle at 50% 50%,var(--fx-c2) 0,transparent 58%);background-size:200% 200%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.54"
  },
  {
   "v": "halorot2",
   "label": "反向光环",
   "css": "background-image:radial-gradient(ellipse at 50% 50%,var(--fx-c1) 0,transparent 66%);background-size:200% 200%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.66"
  },
  {
   "v": "dotring",
   "label": "圆点环",
   "css": "background-image:repeating-conic-gradient(from 0deg,var(--fx-c2) 0 2deg,transparent 2deg 12deg);background-size:200% 200%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.78"
  },
  {
   "v": "dotring2",
   "label": "双点环",
   "css": "background-image:repeating-conic-gradient(from 0deg,var(--fx-c1) 0 8deg,transparent 8deg 18deg);background-size:200% 200%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.30"
  },
  {
   "v": "dotring3",
   "label": "密点环",
   "css": "background-image:repeating-conic-gradient(from 0deg,var(--fx-c2) 0 40deg,transparent 40deg 60deg);background-size:200% 200%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.42"
  },
  {
   "v": "starring",
   "label": "星光环",
   "css": "background-image:conic-gradient(from 0deg,var(--fx-c1),transparent 40%,var(--fx-c1) 70%,transparent);background-size:200% 200%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.54"
  },
  {
   "v": "stardust",
   "label": "星尘环",
   "css": "background-image:radial-gradient(circle at 50% 8%,var(--fx-c2) 0 2px,transparent 3px),radial-gradient(circle at 50% 92%,var(--fx-c2) 0 2px,transparent 3px),radial-gradient(circle at 8% 50%,var(--fx-c2) 0 2px,transparent 3px),radial-gradient(circle at 92% 50%,var(--fx-c2) 0 2px,transparent 3px);background-size:200% 200%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.66"
  },
  {
   "v": "sparklering",
   "label": "火花环",
   "css": "background-image:radial-gradient(circle at 50% 50%,transparent 30%,color-mix(in srgb,var(--fx-c1) 45%,transparent) 62%,transparent 78%);background-size:200% 200%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.78"
  },
  {
   "v": "diamondring",
   "label": "菱形环",
   "css": "background-image:conic-gradient(from 180deg at 50% 50%,var(--fx-c2) 0 12deg,transparent 12deg 348deg);background-size:200% 200%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.30"
  },
  {
   "v": "hexring",
   "label": "六角环",
   "css": "background-image:radial-gradient(circle at 50% 50%,transparent 44%,var(--fx-c1) 45% 46.5%,transparent 48%);background-size:240% 240%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.42;animation:fxSpin var(--fx-dur,18s) linear infinite"
  },
  {
   "v": "trianglering",
   "label": "三角环",
   "css": "background-image:radial-gradient(circle at 50% 50%,transparent 40%,var(--fx-c2) 41% 47%,transparent 49%);background-size:240% 240%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.54;animation:fxSpin var(--fx-dur,18s) linear infinite"
  },
  {
   "v": "squarering",
   "label": "方点环",
   "css": "background-image:radial-gradient(circle at 50% 50%,transparent 40%,var(--fx-c1) 41% 42.5%,transparent 44%,transparent 48%,var(--fx-c1) 49% 50.5%,transparent 52%);background-size:240% 240%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.66;animation:fxSpin var(--fx-dur,18s) linear infinite"
  },
  {
   "v": "crossring",
   "label": "十字环",
   "css": "background-image:radial-gradient(circle at 50% 50%,var(--fx-c2) 0,transparent 58%);background-size:240% 240%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.78;animation:fxSpin var(--fx-dur,18s) linear infinite"
  },
  {
   "v": "gearring",
   "label": "齿轮环",
   "css": "background-image:radial-gradient(ellipse at 50% 50%,var(--fx-c1) 0,transparent 66%);background-size:240% 240%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.30;animation:fxSpin var(--fx-dur,18s) linear infinite"
  },
  {
   "v": "teeth",
   "label": "齿纹环",
   "css": "background-image:repeating-conic-gradient(from 0deg,var(--fx-c2) 0 2deg,transparent 2deg 12deg);background-size:240% 240%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.42;animation:fxSpin var(--fx-dur,18s) linear infinite"
  },
  {
   "v": "wave",
   "label": "波纹环",
   "css": "background-image:repeating-conic-gradient(from 0deg,var(--fx-c1) 0 8deg,transparent 8deg 18deg);background-size:240% 240%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.54;animation:fxSpin var(--fx-dur,18s) linear infinite"
  },
  {
   "v": "ripple",
   "label": "涟漪环",
   "css": "background-image:repeating-conic-gradient(from 0deg,var(--fx-c2) 0 40deg,transparent 40deg 60deg);background-size:240% 240%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.66;animation:fxSpin var(--fx-dur,18s) linear infinite"
  },
  {
   "v": "bubble",
   "label": "气泡环",
   "css": "background-image:conic-gradient(from 0deg,var(--fx-c1),transparent 40%,var(--fx-c1) 70%,transparent);background-size:240% 240%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.78;animation:fxSpin var(--fx-dur,18s) linear infinite"
  },
  {
   "v": "flame",
   "label": "火焰环",
   "css": "background-image:radial-gradient(circle at 50% 8%,var(--fx-c2) 0 2px,transparent 3px),radial-gradient(circle at 50% 92%,var(--fx-c2) 0 2px,transparent 3px),radial-gradient(circle at 8% 50%,var(--fx-c2) 0 2px,transparent 3px),radial-gradient(circle at 92% 50%,var(--fx-c2) 0 2px,transparent 3px);background-size:240% 240%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.30;animation:fxSpin var(--fx-dur,18s) linear infinite"
  },
  {
   "v": "electric",
   "label": "电弧环",
   "css": "background-image:radial-gradient(circle at 50% 50%,transparent 30%,color-mix(in srgb,var(--fx-c1) 45%,transparent) 62%,transparent 78%);background-size:240% 240%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.42;animation:fxSpin var(--fx-dur,18s) linear infinite"
  },
  {
   "v": "plasma",
   "label": "等离子环",
   "css": "background-image:conic-gradient(from 180deg at 50% 50%,var(--fx-c2) 0 12deg,transparent 12deg 348deg);background-size:240% 240%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.54;animation:fxSpin var(--fx-dur,18s) linear infinite"
  },
  {
   "v": "energy",
   "label": "能量环",
   "css": "background-image:radial-gradient(circle at 50% 50%,transparent 44%,var(--fx-c1) 45% 46.5%,transparent 48%);background-size:280% 280%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.66;animation:fxPulse var(--fx-dur,6s) ease-in-out infinite"
  },
  {
   "v": "core",
   "label": "能量核心环",
   "css": "background-image:radial-gradient(circle at 50% 50%,transparent 40%,var(--fx-c2) 41% 47%,transparent 49%);background-size:280% 280%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.78;animation:fxPulse var(--fx-dur,6s) ease-in-out infinite"
  },
  {
   "v": "neon",
   "label": "霓虹环",
   "css": "background-image:radial-gradient(circle at 50% 50%,transparent 40%,var(--fx-c1) 41% 42.5%,transparent 44%,transparent 48%,var(--fx-c1) 49% 50.5%,transparent 52%);background-size:280% 280%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.30;animation:fxPulse var(--fx-dur,6s) ease-in-out infinite"
  },
  {
   "v": "neon2",
   "label": "双色霓虹",
   "css": "background-image:radial-gradient(circle at 50% 50%,var(--fx-c2) 0,transparent 58%);background-size:280% 280%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.42;animation:fxPulse var(--fx-dur,6s) ease-in-out infinite"
  },
  {
   "v": "neonflick",
   "label": "霓虹闪烁",
   "css": "background-image:radial-gradient(ellipse at 50% 50%,var(--fx-c1) 0,transparent 66%);background-size:280% 280%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.54;animation:fxPulse var(--fx-dur,6s) ease-in-out infinite"
  },
  {
   "v": "laser",
   "label": "激光环",
   "css": "background-image:repeating-conic-gradient(from 0deg,var(--fx-c2) 0 2deg,transparent 2deg 12deg);background-size:280% 280%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.66;animation:fxPulse var(--fx-dur,6s) ease-in-out infinite"
  },
  {
   "v": "rainbow",
   "label": "彩虹环",
   "css": "background-image:repeating-conic-gradient(from 0deg,var(--fx-c1) 0 8deg,transparent 8deg 18deg);background-size:280% 280%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.78;animation:fxPulse var(--fx-dur,6s) ease-in-out infinite"
  },
  {
   "v": "iridescent",
   "label": "虹彩环",
   "css": "background-image:repeating-conic-gradient(from 0deg,var(--fx-c2) 0 40deg,transparent 40deg 60deg);background-size:280% 280%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.30;animation:fxPulse var(--fx-dur,6s) ease-in-out infinite"
  },
  {
   "v": "oil",
   "label": "油膜环",
   "css": "background-image:conic-gradient(from 0deg,var(--fx-c1),transparent 40%,var(--fx-c1) 70%,transparent);background-size:280% 280%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.42;animation:fxPulse var(--fx-dur,6s) ease-in-out infinite"
  },
  {
   "v": "prism",
   "label": "棱镜环",
   "css": "background-image:radial-gradient(circle at 50% 8%,var(--fx-c2) 0 2px,transparent 3px),radial-gradient(circle at 50% 92%,var(--fx-c2) 0 2px,transparent 3px),radial-gradient(circle at 8% 50%,var(--fx-c2) 0 2px,transparent 3px),radial-gradient(circle at 92% 50%,var(--fx-c2) 0 2px,transparent 3px);background-size:280% 280%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.54;animation:fxPulse var(--fx-dur,6s) ease-in-out infinite"
  },
  {
   "v": "chroma",
   "label": "色散环",
   "css": "background-image:radial-gradient(circle at 50% 50%,transparent 30%,color-mix(in srgb,var(--fx-c1) 45%,transparent) 62%,transparent 78%);background-size:280% 280%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.66;animation:fxPulse var(--fx-dur,6s) ease-in-out infinite"
  },
  {
   "v": "glitch",
   "label": "故障环",
   "css": "background-image:conic-gradient(from 180deg at 50% 50%,var(--fx-c2) 0 12deg,transparent 12deg 348deg);background-size:280% 280%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.78;animation:fxPulse var(--fx-dur,6s) ease-in-out infinite"
  },
  {
   "v": "glitchrgb",
   "label": "RGB 环",
   "css": "background-image:radial-gradient(circle at 50% 50%,transparent 44%,var(--fx-c1) 45% 46.5%,transparent 48%);background-size:320% 320%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.30;animation:fxBreathe var(--fx-dur,7s) ease-in-out infinite"
  },
  {
   "v": "scan",
   "label": "扫描环",
   "css": "background-image:radial-gradient(circle at 50% 50%,transparent 40%,var(--fx-c2) 41% 47%,transparent 49%);background-size:320% 320%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.42;animation:fxBreathe var(--fx-dur,7s) ease-in-out infinite"
  },
  {
   "v": "scanline",
   "label": "扫描线环",
   "css": "background-image:radial-gradient(circle at 50% 50%,transparent 40%,var(--fx-c1) 41% 42.5%,transparent 44%,transparent 48%,var(--fx-c1) 49% 50.5%,transparent 52%);background-size:320% 320%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.54;animation:fxBreathe var(--fx-dur,7s) ease-in-out infinite"
  },
  {
   "v": "hologram",
   "label": "全息环",
   "css": "background-image:radial-gradient(circle at 50% 50%,var(--fx-c2) 0,transparent 58%);background-size:320% 320%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.66;animation:fxBreathe var(--fx-dur,7s) ease-in-out infinite"
  },
  {
   "v": "matrix",
   "label": "矩阵环",
   "css": "background-image:radial-gradient(ellipse at 50% 50%,var(--fx-c1) 0,transparent 66%);background-size:320% 320%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.78;animation:fxBreathe var(--fx-dur,7s) ease-in-out infinite"
  },
  {
   "v": "tech",
   "label": "科技环",
   "css": "background-image:repeating-conic-gradient(from 0deg,var(--fx-c2) 0 2deg,transparent 2deg 12deg);background-size:320% 320%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.30;animation:fxBreathe var(--fx-dur,7s) ease-in-out infinite"
  },
  {
   "v": "circuit",
   "label": "电路环",
   "css": "background-image:repeating-conic-gradient(from 0deg,var(--fx-c1) 0 8deg,transparent 8deg 18deg);background-size:320% 320%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.42;animation:fxBreathe var(--fx-dur,7s) ease-in-out infinite"
  },
  {
   "v": "data",
   "label": "数据流环",
   "css": "background-image:repeating-conic-gradient(from 0deg,var(--fx-c2) 0 40deg,transparent 40deg 60deg);background-size:320% 320%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.54;animation:fxBreathe var(--fx-dur,7s) ease-in-out infinite"
  },
  {
   "v": "morph",
   "label": "形变环",
   "css": "background-image:conic-gradient(from 0deg,var(--fx-c1),transparent 40%,var(--fx-c1) 70%,transparent);background-size:320% 320%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.66;animation:fxBreathe var(--fx-dur,7s) ease-in-out infinite"
  },
  {
   "v": "morph2",
   "label": "反向形变",
   "css": "background-image:radial-gradient(circle at 50% 8%,var(--fx-c2) 0 2px,transparent 3px),radial-gradient(circle at 50% 92%,var(--fx-c2) 0 2px,transparent 3px),radial-gradient(circle at 8% 50%,var(--fx-c2) 0 2px,transparent 3px),radial-gradient(circle at 92% 50%,var(--fx-c2) 0 2px,transparent 3px);background-size:320% 320%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.78;animation:fxBreathe var(--fx-dur,7s) ease-in-out infinite"
  },
  {
   "v": "wobble",
   "label": "摆动环",
   "css": "background-image:radial-gradient(circle at 50% 50%,transparent 30%,color-mix(in srgb,var(--fx-c1) 45%,transparent) 62%,transparent 78%);background-size:320% 320%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.30;animation:fxBreathe var(--fx-dur,7s) ease-in-out infinite"
  },
  {
   "v": "blob",
   "label": "液滴环",
   "css": "background-image:conic-gradient(from 180deg at 50% 50%,var(--fx-c2) 0 12deg,transparent 12deg 348deg);background-size:320% 320%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.42;animation:fxBreathe var(--fx-dur,7s) ease-in-out infinite"
  },
  {
   "v": "liquid",
   "label": "液态环",
   "css": "background-image:radial-gradient(circle at 50% 50%,transparent 44%,var(--fx-c1) 45% 46.5%,transparent 48%);background-size:120% 120%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.54;animation:fxRipple var(--fx-dur,5s) ease-out infinite"
  },
  {
   "v": "frost",
   "label": "冰霜环",
   "css": "background-image:radial-gradient(circle at 50% 50%,transparent 40%,var(--fx-c2) 41% 47%,transparent 49%);background-size:120% 120%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.66;animation:fxRipple var(--fx-dur,5s) ease-out infinite"
  },
  {
   "v": "shadow",
   "label": "暗影环",
   "css": "background-image:radial-gradient(circle at 50% 50%,transparent 40%,var(--fx-c1) 41% 42.5%,transparent 44%,transparent 48%,var(--fx-c1) 49% 50.5%,transparent 52%);background-size:120% 120%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.78;animation:fxRipple var(--fx-dur,5s) ease-out infinite"
  },
  {
   "v": "reflect",
   "label": "镜面环",
   "css": "background-image:radial-gradient(circle at 50% 50%,var(--fx-c2) 0,transparent 58%);background-size:120% 120%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.30;animation:fxRipple var(--fx-dur,5s) ease-out infinite"
  },
  {
   "v": "glass",
   "label": "玻璃环",
   "css": "background-image:radial-gradient(ellipse at 50% 50%,var(--fx-c1) 0,transparent 66%);background-size:120% 120%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.42;animation:fxRipple var(--fx-dur,5s) ease-out infinite"
  },
  {
   "v": "thin",
   "label": "细线环",
   "css": "background-image:repeating-conic-gradient(from 0deg,var(--fx-c2) 0 2deg,transparent 2deg 12deg);background-size:120% 120%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.54;animation:fxRipple var(--fx-dur,5s) ease-out infinite"
  },
  {
   "v": "thick",
   "label": "粗环",
   "css": "background-image:repeating-conic-gradient(from 0deg,var(--fx-c1) 0 8deg,transparent 8deg 18deg);background-size:120% 120%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.66;animation:fxRipple var(--fx-dur,5s) ease-out infinite"
  },
  {
   "v": "thickglow",
   "label": "粗发光环",
   "css": "background-image:repeating-conic-gradient(from 0deg,var(--fx-c2) 0 40deg,transparent 40deg 60deg);background-size:120% 120%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.78;animation:fxRipple var(--fx-dur,5s) ease-out infinite"
  },
  {
   "v": "cut",
   "label": "斜切环",
   "css": "background-image:conic-gradient(from 0deg,var(--fx-c1),transparent 40%,var(--fx-c1) 70%,transparent);background-size:120% 120%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.30;animation:fxRipple var(--fx-dur,5s) ease-out infinite"
  },
  {
   "v": "bevel",
   "label": "倒角环",
   "css": "background-image:radial-gradient(circle at 50% 8%,var(--fx-c2) 0 2px,transparent 3px),radial-gradient(circle at 50% 92%,var(--fx-c2) 0 2px,transparent 3px),radial-gradient(circle at 8% 50%,var(--fx-c2) 0 2px,transparent 3px),radial-gradient(circle at 92% 50%,var(--fx-c2) 0 2px,transparent 3px);background-size:120% 120%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.42;animation:fxRipple var(--fx-dur,5s) ease-out infinite"
  },
  {
   "v": "engraved",
   "label": "蚀刻环",
   "css": "background-image:radial-gradient(circle at 50% 50%,transparent 30%,color-mix(in srgb,var(--fx-c1) 45%,transparent) 62%,transparent 78%);background-size:120% 120%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.54;animation:fxRipple var(--fx-dur,5s) ease-out infinite"
  },
  {
   "v": "embossed",
   "label": "浮雕环",
   "css": "background-image:conic-gradient(from 180deg at 50% 50%,var(--fx-c2) 0 12deg,transparent 12deg 348deg);background-size:120% 120%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.66;animation:fxRipple var(--fx-dur,5s) ease-out infinite"
  },
  {
   "v": "rope",
   "label": "绳索环",
   "css": "background-image:radial-gradient(circle at 50% 50%,transparent 44%,var(--fx-c1) 45% 46.5%,transparent 48%);background-size:160% 160%;background-position:50% 50%;background-repeat:no-repeat;opacity:0.78"
  }
 ],
 "md": [
  {
   "v": "circle",
   "label": "圆形",
   "css": {
    "css": "--fx-rad:50%"
   }
  },
  {
   "v": "round2",
   "label": "厚圆",
   "css": {
    "css": "--fx-rad:38%"
   }
  },
  {
   "v": "round3",
   "label": "齿轮圆",
   "css": {
    "css": "--fx-rad:38%"
   }
  },
  {
   "v": "oval",
   "label": "椭圆",
   "css": {
    "css": "--fx-rad:14%",
    "css2": "clip-path:polygon(25% 3%,75% 3%,100% 50%,75% 97%,25% 97%,0 50%)"
   }
  },
  {
   "v": "star",
   "label": "五角星",
   "css": {
    "css": "--fx-rad:0",
    "css2": "clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)"
   }
  },
  {
   "v": "star4",
   "label": "四角星",
   "css": {
    "css": "--fx-rad:0",
    "css2": "clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)"
   }
  },
  {
   "v": "star6",
   "label": "六角星",
   "css": {
    "css": "--fx-rad:0",
    "css2": "clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)"
   }
  },
  {
   "v": "star8",
   "label": "八角星",
   "css": {
    "css": "--fx-rad:0",
    "css2": "clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)"
   }
  },
  {
   "v": "starburst",
   "label": "放射星",
   "css": {
    "css": "--fx-rad:0",
    "css2": "clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)"
   }
  },
  {
   "v": "shield",
   "label": "盾牌",
   "css": {
    "css": "--fx-rad:12%",
    "css2": "clip-path:polygon(50% 0,100% 18%,100% 62%,50% 100%,0 62%,0 18%)"
   }
  },
  {
   "v": "shield2",
   "label": "尖盾",
   "css": {
    "css": "--fx-rad:12%",
    "css2": "clip-path:polygon(50% 0,100% 18%,100% 62%,50% 100%,0 62%,0 18%)"
   }
  },
  {
   "v": "shield3",
   "label": "圆盾",
   "css": {
    "css": "--fx-rad:12%",
    "css2": "clip-path:polygon(50% 0,100% 18%,100% 62%,50% 100%,0 62%,0 18%)"
   }
  },
  {
   "v": "shield4",
   "label": "方盾",
   "css": {
    "css": "--fx-rad:12%",
    "css2": "clip-path:polygon(50% 0,100% 18%,100% 62%,50% 100%,0 62%,0 18%)"
   }
  },
  {
   "v": "crest",
   "label": "纹章",
   "css": {
    "css": "--fx-rad:12%",
    "css2": "clip-path:polygon(50% 0,100% 18%,100% 62%,50% 100%,0 62%,0 18%)"
   }
  },
  {
   "v": "crest2",
   "label": "花体纹章",
   "css": {
    "css": "--fx-rad:12%",
    "css2": "clip-path:polygon(50% 0,100% 18%,100% 62%,50% 100%,0 62%,0 18%)"
   }
  },
  {
   "v": "hexagon",
   "label": "六边形",
   "css": {
    "css": "--fx-rad:14%",
    "css2": "clip-path:polygon(25% 3%,75% 3%,100% 50%,75% 97%,25% 97%,0 50%)"
   }
  },
  {
   "v": "hex2",
   "label": "粗六边形",
   "css": {
    "css": "--fx-rad:14%",
    "css2": "clip-path:polygon(25% 3%,75% 3%,100% 50%,75% 97%,25% 97%,0 50%)"
   }
  },
  {
   "v": "diamond",
   "label": "菱形",
   "css": {
    "css": "--fx-rad:16%",
    "css2": "clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%)"
   }
  },
  {
   "v": "diamond2",
   "label": "斜方",
   "css": {
    "css": "--fx-rad:16%",
    "css2": "clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%)"
   }
  },
  {
   "v": "square",
   "label": "方章",
   "css": {
    "css": "--fx-rad:28%"
   }
  },
  {
   "v": "square2",
   "label": "圆角方",
   "css": {
    "css": "--fx-rad:28%"
   }
  },
  {
   "v": "octagon",
   "label": "八边形",
   "css": {
    "css": "--fx-rad:14%",
    "css2": "clip-path:polygon(30% 0,70% 0,100% 30%,100% 70%,70% 100%,30% 100%,0 70%,0 30%)"
   }
  },
  {
   "v": "octagon2",
   "label": "斜八角",
   "css": {
    "css": "--fx-rad:14%",
    "css2": "clip-path:polygon(30% 0,70% 0,100% 30%,100% 70%,70% 100%,30% 100%,0 70%,0 30%)"
   }
  },
  {
   "v": "triangle",
   "label": "三角章",
   "css": {
    "css": "--fx-rad:14%",
    "css2": "clip-path:polygon(25% 3%,75% 3%,100% 50%,75% 97%,25% 97%,0 50%)"
   }
  },
  {
   "v": "triangle2",
   "label": "倒三角",
   "css": {
    "css": "--fx-rad:10%",
    "css2": "clip-path:polygon(50% 0,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%)"
   }
  },
  {
   "v": "triangler",
   "label": "右三角",
   "css": {
    "css": "--fx-rad:16%",
    "css2": "clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%)"
   }
  },
  {
   "v": "heart",
   "label": "心形",
   "css": {
    "css": "--fx-rad:0",
    "css2": "clip-path:polygon(50% 100%,4% 40%,4% 20%,20% 4%,38% 4%,50% 18%,62% 4%,80% 4%,96% 20%,96% 40%)"
   }
  },
  {
   "v": "heart2",
   "label": "宝爱心",
   "css": {
    "css": "--fx-rad:0",
    "css2": "clip-path:polygon(50% 100%,4% 40%,4% 20%,20% 4%,38% 4%,50% 18%,62% 4%,80% 4%,96% 20%,96% 40%)"
   }
  },
  {
   "v": "cross",
   "label": "十字",
   "css": {
    "css": "--fx-rad:0",
    "css2": "clip-path:polygon(50% 0,61% 25%,86% 14%,75% 39%,100% 50%,75% 61%,86% 86%,61% 75%,50% 100%,39% 75%,14% 86%,25% 61%,0 50%,25% 39%,14% 14%,39% 25%)"
   }
  },
  {
   "v": "cross2",
   "label": "马耳他",
   "css": {
    "css": "--fx-rad:14%",
    "css2": "clip-path:polygon(30% 0,70% 0,100% 30%,100% 70%,70% 100%,30% 100%,0 70%,0 30%)"
   }
  },
  {
   "v": "cross3",
   "label": "铁十字",
   "css": {
    "css": "--fx-rad:0 50% 0 50%"
   }
  },
  {
   "v": "laurel",
   "label": "桂冠",
   "css": {
    "css": "--fx-rad:12%",
    "css2": "clip-path:polygon(0 12%,12% 12%,12% 0,88% 0,88% 12%,100% 12%,100% 88%,88% 88%,88% 100%,12% 100%,12% 88%,0 88%)"
   }
  },
  {
   "v": "leaf",
   "label": "叶形",
   "css": {
    "css": "--fx-rad:0 50% 0 50%"
   }
  },
  {
   "v": "flame",
   "label": "火焰",
   "css": {
    "css": "--fx-rad:50% 50% 50% 0"
   }
  },
  {
   "v": "flame2",
   "label": "火苗",
   "css": {
    "css": "--fx-rad:0",
    "css2": "clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%,50% 20%)"
   }
  },
  {
   "v": "bolt",
   "label": "闪电",
   "css": {
    "css": "--fx-rad:0",
    "css2": "clip-path:polygon(50% 0,63% 12%,80% 8%,84% 25%,100% 35%,92% 50%,100% 65%,84% 75%,80% 92%,63% 88%,50% 100%,37% 88%,20% 92%,16% 75%,0 65%,8% 50%,0 35%,16% 25%,20% 8%,37% 12%)"
   }
  },
  {
   "v": "sun",
   "label": "太阳",
   "css": {
    "css": "--fx-rad:0",
    "css2": "clip-path:polygon(50% 0,61% 25%,86% 14%,75% 39%,100% 50%,75% 61%,86% 86%,61% 75%,50% 100%,39% 75%,14% 86%,25% 61%,0 50%,25% 39%,14% 14%,39% 25%)"
   }
  },
  {
   "v": "moon",
   "label": "弯月",
   "css": {
    "css": "--fx-rad:0",
    "css2": "clip-path:polygon(50% 100%,4% 40%,4% 20%,20% 4%,38% 4%,50% 18%,62% 4%,80% 4%,96% 20%,96% 40%)"
   }
  },
  {
   "v": "moon2",
   "label": "满月",
   "css": {
    "css": "--fx-rad:8%",
    "css2": "clip-path:polygon(0 0,100% 0,100% 72%,50% 100%,0 72%)"
   }
  },
  {
   "v": "cloud",
   "label": "云纹",
   "css": {
    "css": "--fx-rad:14%",
    "css2": "clip-path:polygon(0 0,100% 0,100% 70%,88% 70%,88% 100%,12% 100%,12% 70%,0 70%)"
   }
  },
  {
   "v": "snow",
   "label": "雪花",
   "css": {
    "css": "--fx-rad:50%"
   }
  },
  {
   "v": "drop",
   "label": "水滴",
   "css": {
    "css": "--fx-rad:0 50% 0 50%"
   }
  },
  {
   "v": "gem",
   "label": "宝石",
   "css": {
    "css": "--fx-rad:28%"
   }
  },
  {
   "v": "gem2",
   "label": "菱形宝",
   "css": {
    "css": "--fx-rad:14%",
    "css2": "clip-path:polygon(25% 3%,75% 3%,100% 50%,75% 97%,25% 97%,0 50%)"
   }
  },
  {
   "v": "crown",
   "label": "皇冠",
   "css": {
    "css": "--fx-rad:10%",
    "css2": "clip-path:polygon(50% 0,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%)"
   }
  },
  {
   "v": "wing",
   "label": "羽翼",
   "css": {
    "css": "--fx-rad:16%",
    "css2": "clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%)"
   }
  },
  {
   "v": "eye",
   "label": "眼形",
   "css": {
    "css": "--fx-rad:12%",
    "css2": "clip-path:polygon(50% 0,100% 18%,100% 62%,50% 100%,0 62%,0 18%)"
   }
  },
  {
   "v": "eye2",
   "label": "全视之眼",
   "css": {
    "css": "--fx-rad:0",
    "css2": "clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)"
   }
  },
  {
   "v": "key",
   "label": "钥匙",
   "css": {
    "css": "--fx-rad:0",
    "css2": "clip-path:polygon(50% 0,61% 25%,86% 14%,75% 39%,100% 50%,75% 61%,86% 86%,61% 75%,50% 100%,39% 75%,14% 86%,25% 61%,0 50%,25% 39%,14% 14%,39% 25%)"
   }
  },
  {
   "v": "coin",
   "label": "金币",
   "css": {
    "css": "--fx-rad:0",
    "css2": "clip-path:polygon(50% 0,63% 12%,80% 8%,84% 25%,100% 35%,92% 50%,100% 65%,84% 75%,80% 92%,63% 88%,50% 100%,37% 88%,20% 92%,16% 75%,0 65%,8% 50%,0 35%,16% 25%,20% 8%,37% 12%)"
   }
  },
  {
   "v": "coin2",
   "label": "古币",
   "css": {
    "css": "--fx-rad:0",
    "css2": "clip-path:polygon(50% 0,63% 12%,80% 8%,84% 25%,100% 35%,92% 50%,100% 65%,84% 75%,80% 92%,63% 88%,50% 100%,37% 88%,20% 92%,16% 75%,0 65%,8% 50%,0 35%,16% 25%,20% 8%,37% 12%)"
   }
  },
  {
   "v": "medallion",
   "label": "圆形挂章",
   "css": {
    "css": "--fx-rad:0",
    "css2": "clip-path:polygon(50% 0,63% 12%,80% 8%,84% 25%,100% 35%,92% 50%,100% 65%,84% 75%,80% 92%,63% 88%,50% 100%,37% 88%,20% 92%,16% 75%,0 65%,8% 50%,0 35%,16% 25%,20% 8%,37% 12%)"
   }
  },
  {
   "v": "ribbon",
   "label": "缎带",
   "css": {
    "css": "--fx-rad:18%",
    "css2": "clip-path:polygon(8% 0,92% 0,100% 50%,92% 100%,8% 100%,0 50%)"
   }
  },
  {
   "v": "ribbon2",
   "label": "三角缎带",
   "css": {
    "css": "--fx-rad:18%",
    "css2": "clip-path:polygon(8% 0,92% 0,100% 50%,92% 100%,8% 100%,0 50%)"
   }
  },
  {
   "v": "book",
   "label": "书卷",
   "css": {
    "css": "--fx-rad:0",
    "css2": "clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%,50% 20%)"
   }
  },
  {
   "v": "scroll",
   "label": "卷轴",
   "css": {
    "css": "--fx-rad:0",
    "css2": "clip-path:polygon(50% 0,63% 12%,80% 8%,84% 25%,100% 35%,92% 50%,100% 65%,84% 75%,80% 92%,63% 88%,50% 100%,37% 88%,20% 92%,16% 75%,0 65%,8% 50%,0 35%,16% 25%,20% 8%,37% 12%)"
   }
  },
  {
   "v": "quill",
   "label": "羽毛笔",
   "css": {
    "css": "--fx-rad:0",
    "css2": "clip-path:polygon(50% 0,60% 8%,72% 5%,79% 16%,92% 18%,93% 31%,100% 50%,93% 69%,92% 82%,79% 84%,72% 95%,60% 92%,50% 100%,40% 92%,28% 95%,21% 84%,8% 82%,7% 69%,0 50%,7% 31%,8% 18%,21% 16%,28% 5%,40% 8%)"
   }
  },
  {
   "v": "gear",
   "label": "齿轮",
   "css": {
    "css": "--fx-rad:0",
    "css2": "clip-path:polygon(50% 0,60% 8%,72% 5%,79% 16%,92% 18%,93% 31%,100% 50%,93% 69%,92% 82%,79% 84%,72% 95%,60% 92%,50% 100%,40% 92%,28% 95%,21% 84%,8% 82%,7% 69%,0 50%,7% 31%,8% 18%,21% 16%,28% 5%,40% 8%)"
   }
  },
  {
   "v": "atom",
   "label": "原子",
   "css": {
    "css": "--fx-rad:8%",
    "css2": "clip-path:polygon(0 0,100% 0,100% 72%,50% 100%,0 72%)"
   }
  },
  {
   "v": "infinity",
   "label": "无限",
   "css": {
    "css": "--fx-rad:14%",
    "css2": "clip-path:polygon(0 0,100% 0,100% 70%,88% 70%,88% 100%,12% 100%,12% 70%,0 70%)"
   }
  },
  {
   "v": "yinyang",
   "label": "阴阳",
   "css": {
    "css": "--fx-rad:50%"
   }
  },
  {
   "v": "flower",
   "label": "花纹",
   "css": {
    "css": "--fx-rad:0 50% 0 50%"
   }
  },
  {
   "v": "flower2",
   "label": "六瓣花",
   "css": {
    "css": "--fx-rad:0 50% 0 50%"
   }
  },
  {
   "v": "shell",
   "label": "贝壳纹",
   "css": {
    "css": "--fx-rad:14%",
    "css2": "clip-path:polygon(25% 3%,75% 3%,100% 50%,75% 97%,25% 97%,0 50%)"
   }
  },
  {
   "v": "anchor",
   "label": "船锚",
   "css": {
    "css": "--fx-rad:10%",
    "css2": "clip-path:polygon(50% 0,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%)"
   }
  },
  {
   "v": "sword",
   "label": "利剑",
   "css": {
    "css": "--fx-rad:0",
    "css2": "clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%,50% 20%)"
   }
  },
  {
   "v": "sword2",
   "label": "交叉剑",
   "css": {
    "css": "--fx-rad:0",
    "css2": "clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%,50% 20%)"
   }
  },
  {
   "v": "arrow",
   "label": "箭矢",
   "css": {
    "css": "--fx-rad:0",
    "css2": "clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%,50% 20%)"
   }
  },
  {
   "v": "compass",
   "label": "罗盘",
   "css": {
    "css": "--fx-rad:0",
    "css2": "clip-path:polygon(50% 0,61% 25%,86% 14%,75% 39%,100% 50%,75% 61%,86% 86%,61% 75%,50% 100%,39% 75%,14% 86%,25% 61%,0 50%,25% 39%,14% 14%,39% 25%)"
   }
  },
  {
   "v": "spiral",
   "label": "螺旋",
   "css": {
    "css": "--fx-rad:14%",
    "css2": "clip-path:polygon(30% 0,70% 0,100% 30%,100% 70%,70% 100%,30% 100%,0 70%,0 30%)"
   }
  },
  {
   "v": "wave",
   "label": "声波",
   "css": {
    "css": "--fx-rad:0 50% 0 50%"
   }
  },
  {
   "v": "plug",
   "label": "插头",
   "css": {
    "css": "--fx-rad:12%",
    "css2": "clip-path:polygon(0 12%,12% 12%,12% 0,88% 0,88% 12%,100% 12%,100% 88%,88% 88%,88% 100%,12% 100%,12% 88%,0 88%)"
   }
  },
  {
   "v": "chip",
   "label": "芯片",
   "css": {
    "css": "--fx-rad:18%",
    "css2": "clip-path:polygon(8% 0,92% 0,100% 50%,92% 100%,8% 100%,0 50%)"
   }
  },
  {
   "v": "planet",
   "label": "行星",
   "css": {
    "css": "--fx-rad:50% 50% 50% 0"
   }
  },
  {
   "v": "cometm",
   "label": "彗星",
   "css": {
    "css": "--fx-rad:0",
    "css2": "clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%,50% 20%)"
   }
  },
  {
   "v": "skull",
   "label": "骷髅",
   "css": {
    "css": "--fx-rad:0",
    "css2": "clip-path:polygon(50% 0,63% 12%,80% 8%,84% 25%,100% 35%,92% 50%,100% 65%,84% 75%,80% 92%,63% 88%,50% 100%,37% 88%,20% 92%,16% 75%,0 65%,8% 50%,0 35%,16% 25%,20% 8%,37% 12%)"
   }
  },
  {
   "v": "runes",
   "label": "符文",
   "css": {
    "css": "--fx-rad:0",
    "css2": "clip-path:polygon(50% 0,60% 8%,72% 5%,79% 16%,92% 18%,93% 31%,100% 50%,93% 69%,92% 82%,79% 84%,72% 95%,60% 92%,50% 100%,40% 92%,28% 95%,21% 84%,8% 82%,7% 69%,0 50%,7% 31%,8% 18%,21% 16%,28% 5%,40% 8%)"
   }
  },
  {
   "v": "blank",
   "label": "空白章",
   "css": {
    "css": "--fx-rad:50%"
   }
  }
 ],
 "sig": [
  {
   "v": "none",
   "label": "无铭文"
  },
  {
   "v": "bracket",
   "label": "方括号",
   "css": {
    "css": "content:\"[ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ]\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "bracket2",
   "label": "尖括号",
   "css": {
    "css": "content:\"< \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" >\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "braces",
   "label": "花括号",
   "css": {
    "css": "content:\"{ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" }\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "paren",
   "label": "圆括号",
   "css": {
    "css": "content:\"( \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" )\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "doubleparen",
   "label": "双括号",
   "css": {
    "css": "content:\"(( \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ))\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "bar",
   "label": "竖线",
   "css": {
    "css": "content:\"| \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" |\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "dash",
   "label": "破折号",
   "css": {
    "css": "content:\"— \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" —\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "dash2",
   "label": "双破折号",
   "css": {
    "css": "content:\"—— \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ——\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "tilde",
   "label": "波浪号",
   "css": {
    "css": "content:\"~ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ~\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "star",
   "label": "星号",
   "css": {
    "css": "content:\"* \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" *\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "star2",
   "label": "双星",
   "css": {
    "css": "content:\"** \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" **\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "star3",
   "label": "三星",
   "css": {
    "css": "content:\"*** \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ***\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "dot",
   "label": "中点",
   "css": {
    "css": "content:\"· \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ·\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "dot2",
   "label": "双点",
   "css": {
    "css": "content:\"·· \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ··\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "bullet",
   "label": "方点",
   "css": {
    "css": "content:\"▪ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ▪\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "bullet2",
   "label": "三角点",
   "css": {
    "css": "content:\"▸ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ◂\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "slash",
   "label": "斜杠",
   "css": {
    "css": "content:\"/ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" /\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "slash2",
   "label": "双斜杠",
   "css": {
    "css": "content:\"// \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" //\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "pipe",
   "label": "双竖线",
   "css": {
    "css": "content:\"|| \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ||\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "plus",
   "label": "加号",
   "css": {
    "css": "content:\"+ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" +\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "equal",
   "label": "等号",
   "css": {
    "css": "content:\"= \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" =\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "arrowlr",
   "label": "左右箭头",
   "css": {
    "css": "content:\"← \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" →\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "arrow2",
   "label": "双箭头",
   "css": {
    "css": "content:\"⇆ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ⇆\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "arrow3",
   "label": "三角箭头",
   "css": {
    "css": "content:\"▷ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ◁\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "arrow4",
   "label": "粗箭头",
   "css": {
    "css": "content:\"➤ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ◀\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "arrow5",
   "label": "上下箭头",
   "css": {
    "css": "content:\"↑ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ↓\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "diamond",
   "label": "菱形符",
   "css": {
    "css": "content:\"◆ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ◆\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "diamond2",
   "label": "空心菱形",
   "css": {
    "css": "content:\"◇ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ◇\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "hex",
   "label": "六角符",
   "css": {
    "css": "content:\"⬢ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ⬢\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "tri",
   "label": "三角符",
   "css": {
    "css": "content:\"▲ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ▲\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "tri2",
   "label": "倒三角",
   "css": {
    "css": "content:\"▼ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ▼\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "square",
   "label": "方符",
   "css": {
    "css": "content:\"■ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ■\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "square2",
   "label": "空心方",
   "css": {
    "css": "content:\"□ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" □\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "circle",
   "label": "圆符",
   "css": {
    "css": "content:\"● \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ●\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "circle2",
   "label": "空心圆",
   "css": {
    "css": "content:\"○ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ○\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "circledot",
   "label": "点中圆",
   "css": {
    "css": "content:\"◉ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ◉\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "starbig",
   "label": "大星",
   "css": {
    "css": "content:\"★ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ★\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "starbig2",
   "label": "空心星",
   "css": {
    "css": "content:\"☆ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ☆\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "star4",
   "label": "四角星",
   "css": {
    "css": "content:\"✦ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ✦\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "star6",
   "label": "六角星",
   "css": {
    "css": "content:\"✶ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ✶\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "spark",
   "label": "火花符",
   "css": {
    "css": "content:\"✺ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ✺\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "crown",
   "label": "皇冠符",
   "css": {
    "css": "content:\"♛ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ♛\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "crown2",
   "label": "王冠",
   "css": {
    "css": "content:\"👑 \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" 👑\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "wing",
   "label": "羽翼符",
   "css": {
    "css": "content:\"⚜ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ⚜\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "laurel",
   "label": "桂冠符",
   "css": {
    "css": "content:\"🍃 \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" 🍃\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "flame",
   "label": "火焰符",
   "css": {
    "css": "content:\"🔥 \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" 🔥\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "bolt",
   "label": "闪电符",
   "css": {
    "css": "content:\"⚡ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ⚡\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "gem",
   "label": "宝石符",
   "css": {
    "css": "content:\"💎 \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" 💎\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "eye",
   "label": "眼符",
   "css": {
    "css": "content:\"👁 \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" 👁\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "key",
   "label": "钥匙符",
   "css": {
    "css": "content:\"🔑 \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" 🔑\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "infinity",
   "label": "无限符",
   "css": {
    "css": "content:\"∞ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ∞\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "yinyang",
   "label": "阴阳符",
   "css": {
    "css": "content:\"☯ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ☯\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "atom",
   "label": "原子符",
   "css": {
    "css": "content:\"⚛ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ⚛\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "gear",
   "label": "齿轮符",
   "css": {
    "css": "content:\"⚙ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ⚙\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "music",
   "label": "音符符",
   "css": {
    "css": "content:\"♪ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ♪\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "music2",
   "label": "双音符",
   "css": {
    "css": "content:\"♫ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ♫\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "cross",
   "label": "十字符",
   "css": {
    "css": "content:\"✚ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ✚\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "cross2",
   "label": "马耳他",
   "css": {
    "css": "content:\"✠ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ✠\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "sword",
   "label": "利剑符",
   "css": {
    "css": "content:\"⚔ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ⚔\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "sun",
   "label": "太阳符",
   "css": {
    "css": "content:\"☀ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ☀\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "moon",
   "label": "月符",
   "css": {
    "css": "content:\"☽ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ☽\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "snow",
   "label": "雪花符",
   "css": {
    "css": "content:\"❄ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ❄\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "heart",
   "label": "心符",
   "css": {
    "css": "content:\"♥ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ♥\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "drop",
   "label": "水滴符",
   "css": {
    "css": "content:\"💧 \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" 💧\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "flower",
   "label": "花符",
   "css": {
    "css": "content:\"❁ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ❁\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "anchor",
   "label": "锚符",
   "css": {
    "css": "content:\"⚓ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ⚓\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "compass",
   "label": "罗盘符",
   "css": {
    "css": "content:\"❂ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ❂\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "skull",
   "label": "骷髅符",
   "css": {
    "css": "content:\"☠ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ☠\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "runic",
   "label": "符文",
   "css": {
    "css": "content:\"ᚠ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ᚠ\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "grave",
   "label": "墓碑符",
   "css": {
    "css": "content:\"⌂ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ⌂\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "section",
   "label": "节号",
   "css": {
    "css": "content:\"§ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" §\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "dagger",
   "label": "匕首号",
   "css": {
    "css": "content:\"† \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" †\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "doublecross",
   "label": "双十字",
   "css": {
    "css": "content:\"‡ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ‡\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "tilde2",
   "label": "双波浪",
   "css": {
    "css": "content:\"≈ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ≈\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "caret",
   "label": "插入符",
   "css": {
    "css": "content:\"‹ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ›\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "guillemet",
   "label": "双尖括号",
   "css": {
    "css": "content:\"« \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" »\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "quote",
   "label": "引号",
   "css": {
    "css": "content:\"“ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ”\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "prime",
   "label": "撇号",
   "css": {
    "css": "content:\"“\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\"”\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "accent",
   "label": "重音符",
   "css": {
    "css": "content:\"` \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ´\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "caret2",
   "label": "上插入符",
   "css": {
    "css": "content:\"^ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ^\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "underscore",
   "label": "下划线",
   "css": {
    "css": "content:\"_ \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" _\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "colon",
   "label": "冒号",
   "css": {
    "css": "content:\": \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" :\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "semicolon",
   "label": "分号",
   "css": {
    "css": "content:\"; \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ;\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "question",
   "label": "问号",
   "css": {
    "css": "content:\"? \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" ?\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "exclaim",
   "label": "叹号",
   "css": {
    "css": "content:\"! \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" !\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  },
  {
   "v": "hash",
   "label": "井号",
   "css": {
    "css": "content:\"# \";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92",
    "css2": "content:\" #\";color:var(--fx-c2);-webkit-text-fill-color:var(--fx-c2);opacity:.92"
   }
  }
 ],
 "rar": [
  {
   "v": "common",
   "label": "普通",
   "css": "filter:drop-shadow(0 0 2px var(--fx-c1)) drop-shadow(0 0 4px var(--fx-c2))"
  },
  {
   "v": "uncommon",
   "label": "优秀",
   "css": "filter:drop-shadow(0 0 4px var(--fx-c1)) drop-shadow(0 0 8px var(--fx-c2))"
  },
  {
   "v": "rare",
   "label": "精良",
   "css": "filter:drop-shadow(0 0 5px var(--fx-c1)) drop-shadow(0 0 10px var(--fx-c2))"
  },
  {
   "v": "epic",
   "label": "史诗",
   "css": "filter:drop-shadow(0 0 7px var(--fx-c1)) drop-shadow(0 0 14px var(--fx-c2))"
  },
  {
   "v": "legend",
   "label": "传说",
   "css": "filter:drop-shadow(0 0 10px var(--fx-c1)) drop-shadow(0 0 20px var(--fx-c2))"
  },
  {
   "v": "mythic",
   "label": "神话",
   "css": "filter:drop-shadow(0 0 14px var(--fx-c1)) drop-shadow(0 0 28px var(--fx-c2))"
  },
  {
   "v": "divine",
   "label": "神圣",
   "css": "filter:drop-shadow(0 0 18px var(--fx-c1)) drop-shadow(0 0 36px var(--fx-c2))"
  },
  {
   "v": "eternal",
   "label": "永恒",
   "css": "filter:drop-shadow(0 0 22px var(--fx-c1)) drop-shadow(0 0 44px var(--fx-c2))"
  }
 ]
};

  var CSS_PALETTES = [{"v":"imperial","label":"帝王金","h":42,"s":90,"l":55},{"v":"sapphire","label":"皇家蓝宝","h":215,"s":85,"l":55},{"v":"amethyst","label":"紫水晶","h":275,"s":70,"l":58},{"v":"emerald","label":"翡翠绿","h":155,"s":65,"l":45},{"v":"crimson","label":"绯红","h":350,"s":80,"l":52},{"v":"silver","label":"冷银","h":200,"s":8,"l":75},{"v":"copper","label":"赤铜","h":25,"s":75,"l":50},{"v":"azure","label":"天青","h":190,"s":80,"l":50},{"v":"rosegold","label":"玫瑰金","h":345,"s":55,"l":62},{"v":"topaz","label":"黄玉","h":40,"s":95,"l":60},{"v":"garnet","label":"石榴石","h":355,"s":70,"l":45},{"v":"peridot","label":"橄榄石","h":80,"s":55,"l":48},{"v":"aquamarine","label":"海蓝宝","h":175,"s":70,"l":55},{"v":"tanzanite","label":"坦桑石","h":260,"s":65,"l":55},{"v":"onyx","label":"黑玛瑙","h":240,"s":5,"l":35},{"v":"pearl","label":"珍珠","h":50,"s":20,"l":88},{"v":"ruby","label":"红宝石","h":0,"s":85,"l":50},{"v":"jade","label":"碧玉","h":145,"s":50,"l":42},{"v":"lapis","label":"青金石","h":230,"s":70,"l":45},{"v":"citrine","label":"黄水晶","h":48,"s":90,"l":58},{"v":"platinum","label":"铂金","h":210,"s":6,"l":82},{"v":"obsidian","label":"黑曜石","h":260,"s":10,"l":18},{"v":"opal","label":"欧泊","h":320,"s":60,"l":72},{"v":"steel","label":"精钢","h":205,"s":15,"l":60},{"v":"magenta","label":"品红","h":315,"s":90,"l":55},{"v":"cyan","label":"青色","h":185,"s":95,"l":52},{"v":"lime","label":"青柠","h":75,"s":90,"l":50},{"v":"violet","label":"紫罗兰","h":265,"s":85,"l":60},{"v":"teal","label":"青蓝","h":175,"s":60,"l":42},{"v":"bronze","label":"古铜","h":30,"s":55,"l":45},{"v":"iridescent","label":"幻彩","h":290,"s":75,"l":65},{"v":"sunset","label":"暮色","h":12,"s":85,"l":58},{"v":"arctic","label":"极地冰","h":195,"s":40,"l":85},{"v":"volcanic","label":"熔岩","h":15,"s":95,"l":52},{"v":"forest","label":"深林","h":135,"s":40,"l":32},{"v":"desert","label":"沙金","h":45,"s":70,"l":62},{"v":"midnight","label":"子夜蓝","h":235,"s":75,"l":32},{"v":"neonpink","label":"霓虹粉","h":330,"s":100,"l":62},{"v":"neongreen","label":"霓虹绿","h":120,"s":100,"l":50},{"v":"electric","label":"电光蓝","h":200,"s":100,"l":55}];

  var CSS_RARITIES = [{"v":"common","label":"普通","glow":4},{"v":"uncommon","label":"优秀","glow":7},{"v":"rare","label":"精良","glow":10},{"v":"epic","label":"史诗","glow":14},{"v":"legend","label":"传说","glow":20},{"v":"mythic","label":"神话","glow":28},{"v":"divine","label":"神圣","glow":36},{"v":"eternal","label":"永恒","glow":44}];

  var CSS_KF = "@keyframes pfGwBreath { 0%,100%{ box-shadow: 0 0 12px -2px var(--fx-c2); } 50%{ box-shadow: 0 0 30px var(--fx-c2); } }\n@keyframes pfGwPulse { 0%{ box-shadow: 0 0 0 0 color-mix(in srgb, var(--fx-c2) 50%, transparent); } 100%{ box-shadow: 0 0 0 26px transparent; } }\n@keyframes pfGwPulse2 { 0%{ box-shadow: 0 0 0 0 color-mix(in srgb, var(--fx-c2) 55%, transparent), 0 0 0 10px color-mix(in srgb, var(--fx-c2) 20%, transparent); } 100%{ box-shadow: 0 0 0 20px transparent, 0 0 0 40px transparent; } }\n@keyframes pfGwSonar { 0%{ box-shadow: 0 0 0 0 color-mix(in srgb, var(--fx-c2) 45%, transparent); } 100%{ box-shadow: 0 0 0 40px transparent; } }\n@keyframes pfGwFlick { 0%,92%,100%{ opacity: 1; } 94%{ opacity: .55; } 96%{ opacity: .85; } }\n@keyframes pfGwBuzz { 0%,100%{ box-shadow: 0 0 6px var(--fx-c2); } 50%{ box-shadow: 0 0 6px var(--fx-c2), 0 0 18px var(--fx-c2); } }\n@keyframes pfGwRainbow { to { filter: hue-rotate(360deg); } }\n@keyframes pfGwUp { from{ box-shadow: 0 0 10px var(--fx-c2); } to{ box-shadow: 0 0 34px var(--fx-c2); } }\n@keyframes pfGwDown { from{ box-shadow: 0 0 34px var(--fx-c2); } to{ box-shadow: 0 0 10px var(--fx-c2); } }\n@keyframes pfGwShim { 0%,100%{ box-shadow: 0 0 14px -2px var(--fx-c2); } 50%{ box-shadow: 0 0 26px var(--fx-c2); } }\n@keyframes pfGwSpark { 0%,100%{ box-shadow: 0 0 12px -2px var(--fx-c2); } 50%{ box-shadow: 0 0 30px var(--fx-c2), 0 0 50px -10px var(--fx-c2); } }\n@keyframes pfGwFairy { 0%,100%{ box-shadow: 0 0 14px -2px var(--fx-c2); } 33%{ box-shadow: 0 0 24px var(--fx-c2); } 66%{ box-shadow: 0 0 18px var(--fx-c2); } }\n@keyframes pfGwHaloRot { to { filter: hue-rotate(360deg); } }\n@keyframes pfGwFlow { from{ box-shadow: 0 0 14px -2px var(--fx-c2); } to{ box-shadow: 0 0 32px var(--fx-c2); } }\n@keyframes pfGwGlitch { 0%,90%,100%{ transform: translate(0); } 92%{ transform: translate(-2px,1px); } 96%{ transform: translate(2px,-1px); } }\n@keyframes pfGwScan { 0%{ background-position: 0 -100%; } 100%{ background-position: 0 200%; } }\n@keyframes pfGwHolo { 0%,100%{ filter: hue-rotate(0deg); } 50%{ filter: hue-rotate(30deg); } }\n@keyframes pfGwMorph { 0%,100%{ border-radius: 14px; } 50%{ border-radius: 24px 8px 24px 8px; } }\n@keyframes pfGwWobble { 0%,100%{ transform: rotate(-.6deg); } 50%{ transform: rotate(.6deg); } }\n@keyframes pfGwStrobe { 0%,49%{ opacity: 1; } 50%,100%{ opacity: .55; } }\n@keyframes pfGwFlicker { 0%,19.9%,22%,62.9%,64%,64.9%,70%,100%{ opacity: 1; } 20%,21.9%,63%,63.9%,65%,69.9%{ opacity: .35; } }\n@keyframes pfGwIridescent { to { filter: hue-rotate(360deg); } }\n@keyframes pfGwOil { to { filter: hue-rotate(360deg); } }\n@keyframes pfGwSoap { 0%,100%{ filter: hue-rotate(0deg) brightness(1); } 50%{ filter: hue-rotate(60deg) brightness(1.15); } }\n@keyframes pfGwChroma { to { filter: hue-rotate(360deg); } }\n@keyframes pfGwComet { 0%,100%{ box-shadow: 0 0 14px -2px var(--fx-c2); } 50%{ box-shadow: 16px 0 30px -4px var(--fx-c2); } }\n@keyframes pfGwPolar { to { filter: hue-rotate(360deg); } }\n@keyframes pfBdSpin { to { --bd-a: 360deg; filter: hue-rotate(360deg); } }\n@keyframes pfBdPulse { 0%{ box-shadow: 0 0 0 1px var(--fx-c2); } 50%{ box-shadow: 0 0 0 1px var(--fx-c2), 0 0 24px -4px var(--fx-c2); } 100%{ box-shadow: 0 0 0 1px var(--fx-c2); } }\n@keyframes pfHaloSpin { to { transform: rotate(360deg); } }\n@keyframes pfEnergyFlow { from{ filter: brightness(.8); } to{ filter: brightness(1.3); } }";


  /* ---------------------------- 安装器 ---------------------------- */
  var SPEC = window.XddFx.SPEC;

  /* 关键帧库：工程师 gw-* / bd-* 配方里引用的动画（pf 前缀，避免与本站 fx* 撞名）。
     单独注入一个 <style>，不占用引擎那张样式表。 */
  (function injectKeyframes() {
    if (!CSS_KF) return;
    var ID = 'xdd-prestige-kf';
    var el = document.getElementById(ID);
    if (!el) {
      el = document.createElement('style');
      el.id = ID;
      (document.head || document.documentElement).appendChild(el);
    }
    if (el.textContent !== CSS_KF) el.textContent = CSS_KF;
  })();

  /* 把一批选项并入指定槽位（按 v 去重，已存在的跳过） */
  function mergeSlot(kind, slotKey, list, defaults) {
    var spec = SPEC[kind];
    if (!spec) return 0;
    var slot = null;
    spec.slots.forEach(function (s) { if (s.k === slotKey) slot = s; });
    if (!slot) {
      slot = { k: slotKey, label: defaults.label, def: defaults.def, target: defaults.target, opts: [] };
      if (defaults.target2) slot.target2 = defaults.target2;
      if (defaults.text) slot.text = true;
      spec.slots.push(slot);
    }
    var have = {};
    slot.opts = slot.opts || [];
    slot.opts.forEach(function (o) { have[String(o.v)] = 1; });
    var added = 0;
    list.forEach(function (o) {
      if (have[String(o.v)]) return;
      have[String(o.v)] = 1;
      slot.opts.push(o);
      added++;
    });
    return added;
  }

  /* 生成「无」选项（不输出任何 CSS，避免覆盖其它槽位） */
  function noneOpt(label) { return { v: 'none', label: label || '无' }; }

  /* 简单列表（单目标）：css 为声明串 */
  function simple(list, extraCss) {
    return list.map(function (o) {
      var item = { v: o.v, label: o.label };
      if (o.css) item.css = o.css + (extraCss || '');
      return item;
    });
  }
  /* 双目标列表：css → target，css2 → target2 */
  function dual(list) {
    return list.map(function (o) {
      var item = { v: o.v, label: o.label };
      if (o.css) item.css = o.css;
      if (o.css2) item.css2 = o.css2;
      return item;
    });
  }

  var stat = {};

  /* 合并原则：**同一 CSS 属性只能有一个槽位负责**，否则后注册的槽位会把先注册的
     声明整个覆盖掉（引擎是「一个槽位只输出一条规则」，不做多值合成）。
     因此工程师的 13 个维度按属性归并到既有槽位 / 新建独立槽位：
       tx→pat   ov→ovl(新)  bd+gw→bd   cor(新)  mo(新)  hl→halo(新)  rar(新)
       ty→style  pq→fill/bg  sig→deco   md→shape */

  /* ============ 帖子背景 ============ */
  stat.pat = mergeSlot('background', 'pat', simple(CSS_LIST.tx), {});
  stat.ovl = mergeSlot('background', 'ovl',
    [noneOpt('无叠加')].concat(simple(CSS_LIST.ov)),
    { label: '叠加层（第二层纹理）', def: 'none', target: ' .fx-l-ovl' });
  /* 外框(bd) 与 辉光(gw) 都写 .fx-bg 的 box-shadow，且 gw 里含 box-shadow 关键帧动画
     （动画会一直压过普通声明）→ 必须合成同一个槽位，否则「外框」永远被辉光吃掉 */
  stat.bd = mergeSlot('background', 'bd',
    simple(CSS_LIST.bd).concat(simple(CSS_LIST.gw)), {});
  stat.cor = mergeSlot('background', 'cor',
    [noneOpt('无角饰')].concat(simple(CSS_LIST.cor)),
    { label: '角饰', def: 'none', target: ' .fx-l-cor' });
  stat.mo = mergeSlot('background', 'mo',
    [{ v: 'static', label: '静态' }].concat(simple(CSS_LIST.mo)),
    { label: '进阶动效', def: 'static', target: ' .fx-l-mo' });
  stat.halo = mergeSlot('background', 'halo',
    [noneOpt('无光环')].concat(simple(CSS_LIST.hl)),
    { label: '光环', def: 'none', target: ' .fx-l-halo' });
  /* 稀有度用 filter，与外框的 box-shadow 是不同属性，可以并存，单开一个槽位 */
  stat.rar = mergeSlot('background', 'rar',
    [noneOpt('无')].concat(simple(CSS_LIST.rar)),
    { label: '稀有度光效', def: 'none', target: '' });

  /* ============ 称号 ============ */
  /* 字体(ty) 里混着 font-family / color / background-clip:text / text-shadow，
     与「文字样式(style)」完全同域 → 并入 style；字重/字距由后面的 wt/sp 槽位覆盖，
     用户的显式选择仍然优先。 */
  stat.titleTypo = mergeSlot('title', 'style', simple(CSS_LIST.ty), {});
  /* 铭牌(pq) 写 background/border/box-shadow，与「底色填充(fill)」同域 → 并入 */
  stat.titlePlaque = mergeSlot('title', 'fill', simple(CSS_LIST.pq), {});
  /* 铭文(sig) 是成对伪元素，并入「装饰符号(deco)」并补上 ::after 目标 */
  stat.titleSig = mergeSlot('title', 'deco', dual(CSS_LIST.sig), {});
  /* 稀有度(rar) 是 filter，与「外发光(glow)」同域 → 并入 */
  stat.titleRar = mergeSlot('title', 'glow', simple(CSS_LIST.rar), {});

  /* ============ 昵称样式 ============ */
  stat.nickFont = mergeSlot('nickname_style', 'style', simple(CSS_LIST.ty), {});
  stat.nickPlaque = mergeSlot('nickname_style', 'bg', simple(CSS_LIST.pq), {});
  /* 昵称的 ::before 被「前置装饰」占用、::after 被「下划线」占用，
     铭文改用内层 .nick-txt 的伪元素，互不打架 */
  stat.nickSig = mergeSlot('nickname_style', 'sig',
    [noneOpt('无铭文')].concat(dual(CSS_LIST.sig)),
    { label: '铭文（前后缀）', def: 'none',
      target: ' .nick-txt::before', target2: ' .nick-txt::after' });
  stat.nickRar = mergeSlot('nickname_style', 'glow', simple(CSS_LIST.rar), {});

  /* ============ 徽章 ============ */
  stat.badgeShape = mergeSlot('badge', 'shape', dual(CSS_LIST.md), {});
  /* 辉光(gw) 与 稀有度(rar) 都是 filter / box-shadow，与既有「外发光(glow)」同域 → 并入 */
  stat.badgeGlow = mergeSlot('badge', 'glow',
    simple(CSS_LIST.gw).concat(simple(CSS_LIST.rar)), {});

  /* 重建样式表：SPEC 变了，必须让引擎重新生成 CSS */
  if (typeof window.XddFx.rebuild === 'function') window.XddFx.rebuild();

  window.XddPrestige = {
    version: 2,
    added: stat,
    palettes: CSS_PALETTES,
    rarities: CSS_RARITIES,
    dictionaries: CSS_LIST,
    /* 便捷：把某分类的组合数报出来 */
    combos: function (kind) { return window.XddFx.combos(kind); },
    total: function () { return window.XddFx.total(); }
  };
})();
