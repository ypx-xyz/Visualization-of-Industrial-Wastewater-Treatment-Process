# X6 工艺流程编辑页 · 开发计划

> 智维云-污水治理版 可视化层交互原型
> 目标：将工艺流程大屏做成 AntV X6 可编辑 + 可点击查看详情的交互页面

## 背景与需求

基于 2026-08-26 确认的大屏设计方案（见 `../images/generated.png` 及方案清单），制作可交互 X6 图编辑页。

**用户已确认的精确方案清单：**
1. 左侧「原水管控」：在线监测站房 / 原水管控装置，可切换
2. 物化段：调节池（液位+流量）→ 离心泵 → 反应池1 → 反应池2 → 物化沉淀池1
3. 生化段：厌氧池（方）→ 缺氧池（方）→ 好氧池（方+曝气、无搅拌）→ 生化沉淀池（刮泥机）
4. 生化段每池：pH、ORP、NH3-N、COD、NO3-；仅好氧池加 DO、MLSS
5. 风机房：物化风机×2 + 生化风机×2，各显风量/升压/功率
6. 右下角：液体药剂液位存量（PAM药池、碱池、酸池、碳源池）
7. 右侧：总排口站房出水监测 + 达标判定
8. 顶栏：今日进水 / 今日出水 / 运行状态

**交互需求（2026-08-26 追加）：**
- 点击任一水池 → 弹出该池详细数据面板
- 数据分两个维度来源：**过程监测设备**（连续高频曲线）+ **化验室数据**（上传的离散曲线）
- 面板内点击参数（pH、氨氮等）→ 切换显示对应历史曲线
- 每个参数两条曲线：过程设备曲线 + 化验室曲线，同图对比

## 技术选型

- 纯 HTML + CSS + 原生 JS（无需构建，双击可开，便于方案确认）
- AntV X6 v2（图编辑引擎，CDN）
- ECharts 5（历史曲线，CDN）
- 复用 `03_可视化设计/SVG工艺图元/` 已有图元（已生成 `js/svg-assets.js`）

## 目录结构

```
X6工艺流程编辑/
├── plan.md
├── index.html          # 大屏布局 + 引用
├── js/
│   ├── svg-assets.js   # SVG 图元字符串资产（已生成）
│   ├── mock-data.js    # 模拟数据（各池参数过程设备+化验室曲线）
│   └── app.js          # X6 初始化 + 节点 + 交互 + ECharts
└── css/
    └── style.css       # 大屏样式
```

## 实施步骤

- [x] 环境检查：X6/ECharts CDN 可用，node 可用
- [x] SVG 图元资产化（svg-assets.js）
- [x] 写 mock-data.js（模拟双数据源曲线，30天数据）
- [x] 写 index.html + css/style.css（大屏布局）
- [x] 写 app.js（X6 画布 + 工艺节点 + 连线 + 点击弹数据面板）
- [x] 本地启动 + 浏览器截图验证（已用浏览器实际点击验证）
- [x] 交付给用户实际交互验证（第一版交互原型完成）

## 已验证功能（2026-08-26 浏览器实测）

- 9 节点（8 池体 + 1 离心泵）、8 条水流连线渲染正常
- 物化段（调节池→离心泵→反应池1→反应池2→物化沉淀池1）/ 生物段（厌氧→缺氧→好氧→生化沉淀）分区正确
- 点击池体弹出详情抽屉，参数 tab 切换、时间范围切换正常
- 双数据源曲线（青色=过程监测设备、橙色=化验室散点）+ 化验室数据表正常
- 好氧池 7 参数（pH/ORP/NH3-N/COD/NO3-/DO/MLSS）、调节池 2 参数（液位/流量）正确
- 底部风机（物化2+生化2）、药剂液位（PAM/碱/酸/碳源）、右侧总排口正常

## v2 改版（2026-08-26）

用户要求：三色分区、动态水流线（可编辑起终点）、节点放大、SVG 动图。

- [x] 三区分区框：调节池区（青绿 #3fe3c0）/ 物化段（蓝 #3d8bff）/ 生化段（红 #ff6b7a），标题在左上角，`addSectionBox` 用不可交互 rect 节点（zIndex -2）
- [x] 节点放大到 230x225，SVG 动图占主体，池名放图下方，参数缩小为 8.5px 小字
- [x] 动态水流线：CSS `flow-line` dash 流动动画（`.flow-line` + `@keyframes flow-run`），每条边加 `source-arrowhead/target-arrowhead` tools 支持拖拽重连
- [x] SVG 动图：`enhanceSvg` 按图元注入——好氧池 5 气泡上升（CSS）、反应池/调节池搅拌旋转（SMIL rotate）、沉淀池/二沉池刮泥摆动（SMIL rotate values）

## v3 改动（2026-08-27）

用户要求：添加池体自动进对应分区框；取消连线三角箭头（已有管道流向）。

- [x] 添加池体自动分区：`SECTION_MAP` 映射图元→分区（调节池→调节池区、反应池/沉淀池→物化段、厌氧/缺氧/好氧/二沉池→生化段），`placeInSection` 在分区框内逐行扫描空闲位置自动放置
- [x] 取消三角箭头：`targetMarker: null` 显式禁用；边端点编辑抓手改为 hover 边时才显示（`edge:mouseenter/edge:mouseleave` 动态 setTools/removeTools）
- [x] index.html 静态资源加 `?v=20260827b` 版本号，避免浏览器缓存旧版 js 导致排查困扰

## v4 改动（2026-08-27）

用户要求：自动删除、生化段换适配色、自定义添加流态管道、新增池体自动扩分区框。

- [x] 自动删除：节点 hover 显示 `button-remove` 工具，点 × 删除节点（边自动移除）
- [x] 生化段换色：`COLOR_BIO` 红 #ff6b7a → 绿 #2fb96f（生物/生态适配）
- [x] 自定义添加管道：工具栏「＋添加管道」进入连线模式，点起点→点终点生成 flow-line 流动管道（center 锚点）；起点黄色高亮、Esc 退出
- [x] 自动扩大分区框：`placeInSection` 改为第一行末尾放置，`expandSection` 按新池位置自动扩大对应分区框（维护 sectionBoxNodes 引用，resetLayout 时重置）
- [x] 版本号递增 v=20260827c 防缓存

## v5 改动（2026-08-27）

用户要求：左侧原水管控显示 COD/氨氮/pH/流量 模拟数据；分区标题移到框左边；修复删除功能。

- [x] 左侧「原水管控」下方新增「原水水质数据」区，显示 COD/氨氮/pH/流量 四项模拟数据（保留在线监测站房/原水管控装置切换）
- [x] 分区标题移到框左边：`label.refY='50%'` + `textVerticalAnchor='middle'`（调节池区/物化段/生化段标题靠左垂直居中）
- [x] 修复删除功能：根因是 X6 2.x 把 Selection 拆成独立插件（X6.Selection），主包无 `select/getSelectedCells` API，`selecting` 配置被忽略。改为自维护选中（点击节点加 `.my-selected` 高亮 + 记录 selectedCellId），Delete/Backspace 删除选中节点；hover 节点显示 × 删除按钮（button-remove，不依赖插件）；delSelected 保护分区框

## v6 改动（2026-08-27）

用户要求：分区框跟随内容缩放调整（非固定）；物化搅拌机电机固定只桨叶转；厌氧/缺氧池布潜水搅拌机池底转动。

- [x] 分区框自适应：新增 `autoFitAllSections`，监听 node:moved/node:resized/node:added/node:removed，按框内节点包围盒+padding 自动调整分区框位置与尺寸（实测：添加池体生化段 1078→1332、拖动最右池 1332→1498）
- [x] 物化搅拌机修正：反应池只把 4 个桨叶包进 anim-stir 绕 (50,52) 旋转，电机 rect + 轴固定（实测电机在搅拌组外）
- [x] 厌氧池注入潜水搅拌机（池底 y64 处旋转）；缺氧池潜水搅拌加旋转动画（绕 38,56）

## v7 改动（2026-08-27）

用户要求（附图3张）：物化搅拌机换成图1立式双曲面样式；厌氧/缺氧池潜水搅拌换成图2三叶螺旋桨+导流罩；删除固定分区标签、标题移到模块下方。

- [x] 反应池换立式双曲面搅拌机（电机→减速箱→法兰→长轴→倒伞叶轮），叶轮绕(50,55)旋转
- [x] 厌氧池/缺氧池换三叶螺旋桨+导流罩潜水搅拌（厌氧 50,64 / 缺氧 38,58 旋转）
- [x] 删除旧版固定 .section-label 浮层（物化段/生物段，画布左上/左侧）
- [x] 分区标题移到分区框底部中央（label refX 50% / refY 100% / middle / bottom）

## v8 改动（2026-08-27）

用户要求：叶轮不是平面旋转，要以传动轴为中心立体旋转。

- [x] 反应池双曲面叶轮、厌氧/缺氧池三叶螺旋桨：由 SMIL 平面 `rotate` 改为 CSS 3D `rotateY + perspective(160px)` 立体旋转（`.stir-3d` class，transform-box:view-box，各轴心 50,55 / 50,64 / 38,58）
- [x] 导流罩固定、仅螺旋桨立体旋转（缺氧/厌氧）
- [x] 已浏览器确认 matrix3d 3D 变换运行（stir3d 动画，4s）

## v9 改动（2026-08-27）

用户要求：连接虚线改为直线（不要绕在上方的弧线/折线）。

- [x] 连接线 router 从 `orth`（正交折线）改为 `normal`（直线），connector `normal`
- [x] 同行相邻池为水平直线，跨段（物化沉淀池1→厌氧池）为斜直线，均无弧线折线
- [x] 踩坑：X6 内置直线 router 名是 `normal`，写 `straight` 无效（path 渲染为空）

## v10 改动（2026-08-27）

用户要求：跨段线按参考图折线走向，线样式保持原青色流动虚线。

- [x] 同行线保持水平直线（router normal）
- [x] 跨段线（物化沉淀池1→厌氧池）用手动 vertices 折线：右出→向下→中间空行水平跨越→向下→进厌氧池，不穿过第一行池体
- [x] 注意：X6 orth router 自动折线会从 source 错误侧穿行，需手动 vertices 精确控制路径

## v11 改动（2026-08-27）

用户要求：每个工艺水池名称后加一个方形状态展示框，显示 正常/异常/预警；蓝色=正常、黄色=异常、红色=预警（参考图：方形蓝边框、紧贴名称右侧、深色底）。

- [x] mock-data.js：POOLS 每池新增 `status` 字段（normal/abnormal/warning），演示分布：反应池2=异常(黄)、缺氧池=预警(红)，其余 6 池正常(蓝)
- [x] app.js：`addPoolNode` data 传入 status；`buildPoolHtml` 池名称后追加 `<span class="pool-status st-xxx">`（STATUS_TEXT 映射 正常/异常/预警）
- [x] style.css：`.pool-title` 改 inline-flex；新增 `.pool-status` 方形框（深底+currentColor 边框+发光）三态色：st-normal=#3fa9ff 蓝 / st-abnormal=#ffd24d 黄 / st-warning=#ff5d6b 红
- [x] 版本号 v=20260827n；浏览器实测：8 池全部渲染状态框，getComputedStyle 确认三态色值与用户要求一致（蓝/黄/红）

## 踩坑记录

1. X6 主包 Node 无 getContentElement() 方法（那是 x6-react-shape 的 API），改用 `graph.findView(node).container.querySelector('foreignObject > div')` 填充内容
2. X6 节点视图渲染为异步，填充内容需延迟；单次 setTimeout 不可靠，改为 `ensureRendered` 多次重试（6 次 × 300ms 检查全部渲染）
3. **动画注入顺序坑**：必须先 `enhanceSvg`（匹配原始 `url(#gBody)`）再做 `svgWithPrefix` 前缀化，否则前缀化后 `url(#gBody)` 变成 `url(#prefix-gBody)` 导致匹配失败
4. app.js 曾有一处括号缺失导致 SyntaxError，node --check 语法检查可快速发现
5. SVG 图元内嵌需 id 前缀化（svgWithPrefix），避免多节点 gradient/filter id 冲突
6. 浏览器插件（cdp）对高动画负载页面间歇性 504，验证用 Node 脚本替代（`99_工作中间产物/verify_enhance.js` 可验证 enhanceSvg 逻辑）

## 备注

- 首版交互原型使用模拟数据；用户验证交互后，再决定接真实数据（04_原始数据）
- SVG 内嵌需做 id 前缀化，避免多个 SVG gradient/filter id 冲突
