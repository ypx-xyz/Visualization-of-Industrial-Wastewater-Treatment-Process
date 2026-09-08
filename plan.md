# 工艺流程编辑页（X6）· 开发计划

> 工业污水处理过程可视化 交互原型
> 目标：将工艺流程大屏做成 AntV X6 可编辑 + 可点击查看详情的交互页面

## 背景与需求

基于 2026-08-26 确认的工艺大屏设计方案，制作可交互 X6 图编辑页。

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
- 复用自绘 SVG 工艺图元库（已生成 `js/svg-assets.js`）

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

## v12 改动（2026-09-08）

需求①：修复 bug——连线模式加管道后，第一个被选中的水池消失。
- 根因：起点高亮用 `node.attr('body/stroke', ...)`，X6 收到 attr 变更会重建节点 DOM，导致注入到 foreignObject 的池体 HTML（SVG/名称/状态框）被清空，节点变透明空壳；起点池经历两次 attr 变更所以只有它消失
- 修复：高亮改用容器 class（`.x6-node.connect-source .pool-node` 黄色描边光晕），不触碰 node.attr；实测加管道后 edges 8→9，起点池内容完整（startPoolIntact=true）

需求②：池体名称就地编辑。
- 实现：双击池体名称 → `.pool-name-input`（input+datalist，可自由输入也可从 POOL_NAME_PRESETS 预设清单下拉选），Enter/失焦保存、Esc 取消；连线模式下禁用编辑；保存后 renderNodeContent 重渲染（状态框跟随），toast 提示改名结果
- 实测：双击出输入框、改名“反应池1→中和反应池”保存成功

版本号 v=20260827o；预览图 v14。

## v13+ 补丁（2026-09-08 下午）

用户反馈：单击加药管道的“药剂”想改文字时，图元像隐藏了，看不到字也编辑不了。

- 根因：编辑框 input 是就地塞进 foreignObject 的，竖版管道节点只有 42px 宽，input 宽 110px 且继承了 .pipe-label.vertical 的 writing-mode:vertical-rl，绝大部分被 overflow:hidden 裁剪到节点外 → 字消失、输入框看不见、焦点异常
- 修复：编辑改为**页面级浮动输入框**（.pipe-name-float-input，position:fixed 定位到“药剂”文字上方居中，120~220px 宽），完全不进 foreignObject，横竖版通用；Enter/失焦保存、Esc 取消
- 实测：点击出框→可见且获焦→改“絮凝剂→阻垢剂”Enter 保存→数据/标签同步、编辑框移除、竖管 SVG 完整
- 版本号 v=20260908k，预览图 v18

### 踩坑补充
- synthetic 合成事件测 X6：需先退出连线模式再测双击编辑（startEditName 里 connectMode 会拦截）；X6 node:click/dblclick 需完整 pointerdown/mousedown/up/click 序列才会触发
- 池体可见内容是直接注入 DOM 的 HTML，不归 X6 attr 管——任何对池体节点的 attr 操作都可能清空内容，改节点外观一律用容器 class

## v13 改动（2026-09-08）

需求①：修复双击改名“进不去编辑”的 bug（用户双击上百次仅偶尔触发且闪退）。
- 根因1：foreignObject 设了 pointerEvents:none，输入框拿不到真实用户交互，失焦即“保存”退出（截图证据：闪现“已重命名：厌氧池”toast 而无输入框）
- 根因2：单击即开历史数据抽屉，双击的第一下 click 先弹抽屉盖住画布并抢走焦点
- 修复：编辑期间临时将 fo 的 pointerEvents 改为 auto，结束恢复；单击改为延迟 260ms 开抽屉，双击编辑时取消该定时器，编辑中禁止再触发抽屉
- 实测：双击出输入框且 foPE=auto、改名“厌氧池→厌氧池A段”保存成功、抽屉由立即弹改为延迟弹

需求②：新增“保存配置”按钮。
- saveConfig()：graph.toJSON() 存 localStorage（key=x6_flow_config_v1），下次打开自动恢复（loadSavedConfig，含分区框引用重建+内容重注入）
- 重置布局同时清除保存的配置；配置损坏时回退默认布局
- 实测：保存 len=8013 → 刷新后改名/8条边/3个分区框全部恢复；重置后 localStorage 清空、名称回默认

版本号 v=20260827p；预览图 v15。

## v13 改动（2026-09-08 第二轮）

需求①：修复双击改名不稳定（双击100多次才有几率进入编辑）。
- 根因：依赖 X6 `node:dblclick`，对 foreignObject 内 HTML 内容的双击判定不可靠；且第一次单击触发的抽屉定时器（260ms）会在双击慢时打开抽屉抢焦点，打断编辑
- 修复：①弃用 X6 node:dblclick，改原生 DOM 委托（graphContainer dblclick → closest('.pool-name')）；②fo pointerEvents none→auto，让 HTML 内容直接接收事件（拖拽/点击靠冒泡仍正常）；③startEditName 内取消抽屉定时器
- 实测：连续 5 次双击 5/5 进入编辑态

需求②：管道编辑/删除（仿 WPS 流程图）。
- hover 管道：两端箭头（拖拽改起终点）+ 折点抓手（vertices）+ × 删除按钮
- 点击管道：选中高亮（金色），Delete 删除
- 按住管道拖动：整体平移折点；直线管道拖动自动生成中点折弯，可拖回
- 实测：折点整体平移 (+40,-30)、Delete 8→7 均通过

需求③：保存按钮（已存在）：保存配置 → localStorage（x6_flow_config_v1），下次打开自动恢复；实测保存→刷新→恢复一致。注意：重置布局会清除存档。

版本号 v=20260908a；预览图 v15。

### 踩坑补充
- 浏览器自动化测试会写 localStorage 脏存档，测完必须 removeItem 清理，否则用户打开页面恢复成测试后的残缺布局

## v13 改动（2026-09-08 第二轮）

① 双击改名不可靠修复：根因是双击前必先触发两次单击，第一次单击打开历史数据抽屉抢焦点。改为**单击名称文字直接进编辑**（.pool-name 开 pointer-events:auto，node:click 里检测 target closest('.pool-name') → startEditName；点名称以外区域才开抽屉），单击一次即可编辑，实测稳定。

② 管道正交化：addFlowEdge router 由 'normal' 改 'orth'，所有段只允许横/竖线；实测 8 条边渲染 path 全部 0 斜线段，跨段线手写 vertices 被尊重。interacting 新增 edgeMovable:false（修“拖管道起终点跟着动”）、vertexMovable/vertexAddable/vertexDeletable:true（拖折点改走向、双击加/删折点，起终点不变）。数据层验证：改 vertices 后 src/tgt 不变且 path 仍全正交；改 target 后 orth 自动正交。

③ 保存配置（上轮已实现，本轮实测通过）：保存到 localStorage（x6_flow_config_v1），刷新自动恢复（12节点/8边/内容完整），重置布局会清除保存的配置。

版本号 v=20260908b。截图插件本轮持续 504，预览图未更新（功能验证以 DOM/path 检查为准）。

## v13 改动（2026-09-08）

需求：修复 bug——管道重叠时，点击变色后无法拖动；不重叠时可拖。

### 根因
- 管道只有一条 flow-line 虚线 path，SVG 默认 pointer-events=visiblePainted，**dash 间隙不可命中**
- X6 边的 wrap 命中层未配置 stroke（默认 none → 不可命中）
- 重叠时：选中顶层管道（变色）后按住拖动，若按点落在 dash 间隙，事件穿透到下层同路径管道 → 拖的是下面那条，选中的黄条纹丝不动 → 表现为“无法挪动”；不重叠时间隙点击落空重试即可，所以时好时坏

### 修复
- [x] addFlowEdge 增加 wrap 命中层：`attrs.wrap = { stroke:'transparent', strokeWidth:14, strokeLinecap:'round' }`（透明 stroke 属于 painted，dash 间隙也可命中）
- [x] loadSavedConfig 兼容旧存档：fromJSON 后给所有历史管道补 wrap 命中层
- [x] edge:mousedown 时 `edge.toFront()`：重叠时被拖管道自动置顶，拖的始终是当前操作的那条
- [x] 实测：重叠对从 wrap 层按下拖动 → 折点生成且仅被拖管道位移，拖动管道置顶

版本号 v=20260908c。

### 踩坑补充
- SVG 虚线的 dash 间隙在默认 visiblePainted 规则下不可命中——凡是可交互的虚线都必须配透明宽 stroke 命中层
- 合成事件测 X6 edge 事件：mouseenter/mouseleave 不冒泡无法合成，事件要从 path 元素派发且带完整 mousedown/up 序列

## v13 改动（2026-09-08 下午）

用户需求：生成管道时避让 SVG 图元（水池/设备），在空白处走线，避开直接穿现有水池。

- [x] 先试 X6 内置 manhattan 路由器（args: step/padding/excludeObstacles 分区框）：实测大画布跨排场景避障失败，回退成直角直连仍穿池 → 弃用
- [x] 改自研空白走廊算法 `routeAvoiding(srcCell, tgtCell)`：
  - 收集 pool-node/device-node 包围盒（起终点自身不算障碍，竖出/竖入段从自身池后穿过，管道 zIndex 低于池体不可见）
  - 候选走廊：起终点同行 + 池排间隙/上下方空白带中点，按绕行代价排序
  - 逐段校验（含 8px 安全边距），找到即返回“竖出→走廊横穿→竖入”vertices；找不到回退 orth 直连
- [x] 直角短路径优先：同行/同列只需一个折点，不绕走廊
- [x] 拖动双保险：拖动逻辑抽 `startEdgeDrag`，除 X6 edge:mousedown 外再在 wrap 命中层直挂 DOM mousedown（view 未就绪重试 5 次）
- [x] 实测：调节池→好氧池走 y=413 空白走廊（两排池之间）不穿任何池体；物化沉淀池1→生化沉淀池沿右侧空白竖走廊；整体拖动走廊 y 413→483 平移、起终点锚点不变；Delete 删除正常

版本号 v=20260908e；预览图 v16。

### 踩坑补充
- `edge.getVertices()` 只返回手动折点，路由器生成的路径点不在其中——验证路由必须读渲染后 `path.flow-line` 的 d 属性
- X6 更新边时会替换 path DOM 元素，测试脚本缓存的 path 引用会读到旧值——每次断言都重新 querySelector
- manhattan 路由器在本项目大画布（跨 900px、多障碍）下不可靠，自研走廊算法更可控

## v13 改动（2026-09-08）

用户要求：删除「调节池区」「物化段」两个分区框及其标题，生化段框保留，其他不变。

- [x] SECTIONS 数组只保留生化段一项（索引自动对齐，placeInSection/expandSection/autoFitAllSections 无需改）
- [x] SECTION_MAP 只映射生化类池（厌氧/缺氧/好氧/二沉池→0）；调节池/反应池/沉淀池新增时改放自由位置，不再自动入框
- [x] loadSavedConfig 重建时按 label/text 过滤：只保留“生化段”框并同步其坐标，旧存档里的调节池区/物化段框自动删除
- [x] 版本号 v=20260908f；浏览器实测：分区框只剩生化段 1 个，9 个池/设备、8 条边完整（截图接口 504，以 DOM 核验为准）

## v13 改动（2026-09-08）

需求：新增“加药管道”SVG 图元，放入添加设备弹窗；管道可整体拖动，管道上文字像池名一样可编辑，默认“药剂”。

- [x] svg-assets.js 追加 `加药管道` 图元（横向主管 + 截止阀 + 3路向下加药支管，青色发光风格）
- [x] app.js 注册 `chem-pipe-node`（320×64），data.type='chempipe'；添加设备弹窗新增“加药管道”项；默认布置在水池上方空白处
- [x] 管道中间叠 `.pipe-label` 文字标签：单击即进入编辑（自由输入，Enter/失焦保存、Esc 取消）；整体拖动为 X6 默认行为；Delete 可删除；水流管道避障把加药管道计入障碍物
- [x] 修附带 bug：X6 2.x 无 `graph.getBBox()`，新增 getGraphBBox() 手动遍历节点计算包围盒（freePos 同步修复）
- [x] 实测：弹窗选“加药管道”→ 添加成功（水池上方 y≈86）→ SVG 渲染 → 单击“药剂”编辑→ 改名“PAM加药管”保存 → 拖动位移验证（100,86→160,100）

版本号 v=20260908h；预览图 v15。

## v13 改动（2026-09-08）

需求：新增一种加药管形态（竖版），放在设备弹层里，大小仿参考图红框（小竖矩形），文字竖排，功能同横版（单击文字改名、按住拖动）。

- [x] app.js：新增 VPIPE_W=42/VPIPE_H=190；`buildChemPipeHtml` 按 `data.vertical` 分支渲染（CSS 竖管 .vpipe-bar + writing-mode:vertical-rl 竖排标签，无需新 SVG 图元）；`addChemPipeNode` 加 vertical 参数（实例级 attrs 覆盖 fo/content 尺寸）；设备弹层 items 加“加药管道竖版”，无 SVG 资产时用 .mi-vpipe CSS 迷你预览；添加分支合并处理横/竖版
- [x] style.css：.chem-pipe.vertical / .vpipe-bar（竖管+两端接头）/ .pipe-label.vertical / .mi-vpipe
- [x] 保存兼容：saveConfig 走 graph.toJSON，尺寸/data.vertical 自动持久化，刷新恢复实测通过（name=絮凝剂 size=42x190 pos=220,114）
- [x] 实测：弹层入口存在→点击添加→节点 42x190 渲染竖排“药剂”→单击改名“絮凝剂”→拖动位移正常→保存刷新恢复一致；视觉核对：竖管避开池体、竖排文字完整可读
- [x] 版本号 v=20260908i；预览图 v17

## v13 改动（2026-09-08 下午）

需求：加药管道（横/竖版）可调整大小——单击拖住移动不变，双击改变长短，宽度/短边与字体不变。

- [x] 交互：双击管体（非文字标签）进入/退出调长模式；进入后末端显示圆形金色手柄（竖版在底部⇕、横版在右侧⇔）；拖手柄改变长短，再双击或 Esc 退出
- [x] 实现：buildChemPipeHtml 按 d.resizing 渲染手柄；原生 dblclick 委托扩展支持 chempipe；拖拽用 mousedown capture 拦截（不触发节点拖动/选中），node.resize 更新模型 + syncChemPipeDomSize 直接改 DOM（不走 node.attr 避免重建清空注入内容）
- [x] 限制：竖版高度 90–520px，横版宽度 140–900px；文字标签与字号完全不受影响
- [x] 实测：双击进模式（手柄出现）→ 拖手柄高度 190→310px 精确跟随、宽度 42 不变、字体 12px 不变、内容无缺失 → 双击退出手柄消失尺寸保留
- [x] 版本号 v=20260908j；预览图 v15

## v13 改动（2026-09-08 晚）：加药管道调长大小保存丢失 bug 修复

需求：保存后加药管道的调整大小没有保存，下次打开恢复默认。

- 根因：调长用 `node.resize()` 更新了节点模型 size，保存 `toJSON()` 也记录了新尺寸；但 `renderNodeContent` 重新填充 innerHTML 时，foreignObject/div 用的是 chem-pipe-node 注册时的固定常量尺寸（PIPE_W/PIPE_H），不跟随节点模型 size，恢复时把 DOM 尺寸打回默认值 → 视觉上“大小没保存”
- 修复：`renderNodeContent` 的 chempipe 分支渲染后，强制按 `node.getSize()` 同步 foreignObject（width/height 属性+style）和 div style 宽高。这样调长、保存恢复、重渲染任何路径都保证 DOM 尺寸 = 模型尺寸
- 实测：UI 添加加药管道 → resize 到 520x64 → 保存 → 刷新自动恢复 → model/foreignObject/div 全部 520x64（默认应为 320x64），大小保存成功
- 版本号 v=20260908k→l；预览图 v18

## 踩坑记录

1. X6 主包 Node 无 getContentElement() 方法（那是 x6-react-shape 的 API），改用 `graph.findView(node).container.querySelector('foreignObject > div')` 填充内容
2. X6 节点视图渲染为异步，填充内容需延迟；单次 setTimeout 不可靠，改为 `ensureRendered` 多次重试（6 次 × 300ms 检查全部渲染）
3. **动画注入顺序坑**：必须先 `enhanceSvg`（匹配原始 `url(#gBody)`）再做 `svgWithPrefix` 前缀化，否则前缀化后 `url(#gBody)` 变成 `url(#prefix-gBody)` 导致匹配失败
4. app.js 曾有一处括号缺失导致 SyntaxError，node --check 语法检查可快速发现
5. SVG 图元内嵌需 id 前缀化（svgWithPrefix），避免多节点 gradient/filter id 冲突
6. 浏览器插件（cdp）对高动画负载页面间歇性 504，验证用 Node 脚本替代（`verify_enhance.js` 可验证 enhanceSvg 逻辑）

## 备注

- 首版交互原型使用模拟数据；用户验证交互后，再决定接真实数据（04_原始数据）
- SVG 内嵌需做 id 前缀化，避免多个 SVG gradient/filter id 冲突
