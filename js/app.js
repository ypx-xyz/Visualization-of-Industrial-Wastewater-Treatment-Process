// 工业污水处理过程可视化 · 工艺流程编辑页（X6）
// 功能：X6 图编辑画布 + 工艺池体节点（复用 SVG 图元）+ 点击查看历史数据（过程设备 vs 化验室）
(function () {
  'use strict';

  var POOL_W = 230, POOL_H = 225; // 池体节点尺寸（放大，SVG 占主体）
  var DEV_W = 100, DEV_H = 100;   // 设备节点尺寸

  // 三区颜色（用户指定：物化段=蓝、生化段=绿（适配生物/生态），调节池区青绿色区分）
  var COLOR_PHYS = '#3d8bff';
  var COLOR_BIO = '#2fb96f';
  var COLOR_ADJ = '#3fe3c0';

  // 分区框节点引用（用于动态扩大分区框）
  var sectionBoxNodes = [];

  // ===================== SVG 动画增强 =====================
  // 根据图元类型注入动画：曝气气泡上升 / 搅拌机旋转 / 刮泥机摆动
  function enhanceSvg(svgKey, svg) {
    if (!svg) return svg;
    if (svgKey === '好氧池' || svgKey === '曝气池') {
      // 气泡上升动画（5 个气泡 circle）
      var n = 0;
      svg = svg.replace(/<circle cx="(\d+)" cy="(\d+)" r="([\d.]+)" fill="none" stroke="#00F0FF"/g, function (m, cx, cy, r) {
        n++;
        return '<circle class="anim-bubble" style="animation-delay:' + ((n * 0.35) % 1).toFixed(2) + 's" cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="#00F0FF"';
      });
      return svg;
    }
    if (svgKey === '反应池') {
      // 物化搅拌机：立式双曲面搅拌机（电机→减速箱→法兰→长轴→倒伞叶轮），叶轮绕轴旋转
      var newStir = '<!-- 双曲面搅拌机（立式，桨绕轴立体旋转） -->\n' +
        '<rect x="43" y="16" width="14" height="7" rx="1.5" fill="url(#gBody)" stroke="#7FF3FF" stroke-opacity="0.85" stroke-width="1"/>' +
        '<rect x="44.5" y="23" width="11" height="6" rx="1.5" fill="url(#gBody)" stroke="#7FF3FF" stroke-opacity="0.7" stroke-width="1"/>' +
        '<rect x="39" y="29" width="22" height="3.5" rx="1" fill="#7FF3FF" fill-opacity="0.15" stroke="#7FF3FF" stroke-opacity="0.6" stroke-width="0.8"/>' +
        '<line x1="50" y1="32.5" x2="50" y2="50" stroke="#B8DFFF" stroke-opacity="0.9" stroke-width="1.3"/>' +
        '<g class="stir-3d" style="transform-origin:50px 55px">' +
        '<path d="M50 51 Q38 56 34 63 Q42 60.5 50 62.5 Q58 60.5 66 63 Q62 56 50 51 Z" fill="url(#gBody)" stroke="#7FF3FF" stroke-opacity="0.85" stroke-width="1.1"/>' +
        '<path d="M50 53 L45 59.5 M50 53 L55 59.5 M50 53 L50 61.5" stroke="#9FFFFF" stroke-opacity="0.7" stroke-width="0.9"/>' +
        '</g>';
      var stirMatch = svg.match(/<!-- 顶置搅拌机 -->[\s\S]*?<path d="M56 58 L64 60 L56 56 Z"[^>]*\/>/);
      if (stirMatch) {
        svg = svg.replace(stirMatch[0], newStir);
      }
      return svg;
    }
    if (svgKey === '缺氧池') {
      // 潜水搅拌机：三叶螺旋桨 + 导流罩（池底转动）
      var newQSub = '<!-- 潜水搅拌机（三叶螺旋桨+导流罩，螺旋桨绕轴立体旋转） -->\n' +
        '<ellipse cx="38" cy="58" rx="13" ry="6" fill="url(#gBody)" fill-opacity="0.35" stroke="#7FF3FF" stroke-opacity="0.6" stroke-width="1"/>' +
        '<g class="stir-3d" style="transform-origin:38px 58px">' +
        '<path d="M38 58 L31 53 A7.5 7.5 0 0 1 38 58 Z" fill="#9FFFFF" fill-opacity="0.85"/>' +
        '<path d="M38 58 L46 53.5 A7.5 7.5 0 0 1 38 58 Z" fill="#7FF3FF" fill-opacity="0.75"/>' +
        '<path d="M38 58 L38 64.5 A7.5 7.5 0 0 1 38 58 Z" fill="#00F0FF" fill-opacity="0.7"/>' +
        '<circle cx="38" cy="58" r="2.5" fill="#B8DFFF"/>' +
        '</g>';
      var qm = svg.match(/<!-- 潜水搅拌机（水平推进） -->[\s\S]*?<line x1="41" y1="56" x2="44" y2="56"[^>]*\/>/);
      if (qm) {
        svg = svg.replace(qm[0], newQSub);
      }
      return svg;
    }
    if (svgKey === '厌氧池') {
      // 潜水搅拌机：三叶螺旋桨 + 导流罩（池底转动）
      var subPump = '<!-- 潜水搅拌机（三叶螺旋桨+导流罩，螺旋桨绕轴立体旋转） -->\n' +
        '<ellipse cx="50" cy="64" rx="13" ry="6" fill="url(#gBody)" fill-opacity="0.35" stroke="#7FF3FF" stroke-opacity="0.6" stroke-width="1"/>' +
        '<g class="stir-3d" style="transform-origin:50px 64px">' +
        '<path d="M50 64 L43 59 A7.5 7.5 0 0 1 50 64 Z" fill="#9FFFFF" fill-opacity="0.85"/>' +
        '<path d="M50 64 L58 59.5 A7.5 7.5 0 0 1 50 64 Z" fill="#7FF3FF" fill-opacity="0.75"/>' +
        '<path d="M50 64 L50 70.5 A7.5 7.5 0 0 1 50 64 Z" fill="#00F0FF" fill-opacity="0.7"/>' +
        '<circle cx="50" cy="64" r="2.5" fill="#B8DFFF"/>' +
        '</g>\n';
      if (svg.indexOf('<!-- 液面 -->') >= 0) {
        svg = svg.replace('<!-- 液面 -->', subPump + '<!-- 液面 -->');
      }
      return svg;
    }
    if (svgKey === '调节池') {
      // 潜水搅拌旋转：绕(50,60)
      if (svg.indexOf('<!-- 潜水搅拌（均质） -->') >= 0) {
        svg = svg.replace('<!-- 潜水搅拌（均质） -->', '<!-- 潜水搅拌（均质，动画） -->\n<g class="anim-stir">');
        svg = svg.replace(
          '<path d="M58 55 A9 9 0 0 1 58 65" fill="none" stroke="#00F0FF" stroke-width="1.3" stroke-linecap="round" filter="url(#glow)"/>',
          '<path d="M58 55 A9 9 0 0 1 58 65" fill="none" stroke="#00F0FF" stroke-width="1.3" stroke-linecap="round" filter="url(#glow)"/>\n<animateTransform attributeName="transform" type="rotate" from="0 50 60" to="360 50 60" dur="7s" repeatCount="indefinite"/>\n</g>'
        );
      }
      return svg;
    }
    if (svgKey === '沉淀池' || svgKey === '二沉池') {
      // 刮泥机摆动：绕池中心小幅来回摆动
      var openTag, closeTag;
      if (svgKey === '沉淀池') { openTag = '<!-- 刮泥桥 -->'; closeTag = '<!-- 出水堰 -->'; }
      else { openTag = '<!-- 刮泥机 -->'; closeTag = '<!-- 排泥 -->'; }
      if (svg.indexOf(openTag) >= 0 && svg.indexOf(closeTag) >= 0) {
        svg = svg.replace(openTag, '<!-- 刮泥机（动画） -->\n<g class="anim-bridge">\n' + openTag);
        svg = svg.replace(
          closeTag,
          '<animateTransform attributeName="transform" type="rotate" values="0 50 66; 4 50 66; 0 50 66; -4 50 66; 0 50 66" dur="4s" repeatCount="indefinite"/>\n</g>\n' + closeTag
        );
      }
      return svg;
    }
    return svg;
  }

  // ===================== 1. SVG 工具 =====================
  // SVG 图元 id 前缀化：多个节点内嵌同一套 SVG 时避免 gradient/filter id 冲突
  function svgWithPrefix(svg, prefix) {
    if (!svg) return '';
    var ids = [], m, re = /id="([^"]+)"/g;
    while ((m = re.exec(svg))) ids.push(m[1]);
    var s = svg;
    ids.forEach(function (id) {
      s = s.split('id="' + id + '"').join('id="' + prefix + '-' + id + '"');
      s = s.split('url(#' + id + ')').join('url(#' + prefix + '-' + id + ')');
    });
    return s;
  }

  // ===================== 2. 节点内容渲染 =====================
  function lastVal(poolId, key) {
    try {
      var s = MOCK.genSeries(poolId, key);
      var last = s.process[s.process.length - 1];
      return last ? last[1] : 0;
    } catch (e) { return 0; }
  }

  // 池体状态文字映射（正常=蓝 / 异常=黄 / 预警=红）
  var STATUS_TEXT = { normal: '正常', abnormal: '异常', warning: '预警' };

  // 池体节点 HTML（SVG 动图占主体，工艺名称放图下方，名称后带状态展示框，参数小字）
  function buildPoolHtml(d) {
    var prefix = 'p' + d.poolId;
    var stKey = STATUS_TEXT[d.status] ? d.status : 'normal';
    var paramsHtml = '';
    d.params.forEach(function (p) {
      paramsHtml += '<span class="param"><i class="p-ok"></i><span class="p-name">' + p.name + '</span>&nbsp;<span class="p-val">' + p.val + (p.unit ? p.unit : '') + '</span></span>';
    });
    // 先注入动画（匹配原始 SVG 的 url(#...)），再做 id 前缀化防冲突
    var svg = enhanceSvg(d.svgKey, SVG_ASSETS[d.svgKey]);
    svg = svgWithPrefix(svg, 'p' + d.poolId);
    return '<div class="pool-node">' +
      '<div class="pool-svg">' + svg + '</div>' +
      '<div class="pool-meta">' +
      '<div class="pool-title">' + d.poolName +
      '<span class="pool-status st-' + stKey + '">' + STATUS_TEXT[stKey] + '</span></div>' +
      '<div class="pool-params">' + paramsHtml + '</div>' +
      '</div>' +
      '</div>';
  }

  // 设备节点 HTML（离心泵等）
  function buildDeviceHtml(d) {
    return '<div class="device-node">' + svgWithPrefix(SVG_ASSETS[d.svgKey], 'dev' + d.name) + '<div class="dev-name">' + d.name + '</div></div>';
  }

  function renderNodeContent(node) {
    var d = node.getData();
    if (!d) return;
    try {
      var view = graph.findView(node);
      if (!view || !view.container) return;
      var fo = view.container.querySelector('foreignObject');
      if (!fo) return;
      var el = fo.querySelector('div');
      if (!el) return;
      if (d.type === 'pool') el.innerHTML = buildPoolHtml(d);
      else if (d.type === 'device') el.innerHTML = buildDeviceHtml(d);
    } catch (e) {
      // 单节点渲染失败不中断，交由 ensureRendered 重试
    }
  }

  function renderAllContents() {
    graph.getNodes().forEach(renderNodeContent);
  }

  // 多次重试渲染，直到所有池体/设备节点内容填充完成（X6 渲染异步，时机不可靠）
  function ensureRendered(retries) {
    renderAllContents();
    var allDone = true;
    graph.getNodes().forEach(function (n) {
      if (n.shape !== 'pool-node' && n.shape !== 'device-node') return;
      var v = graph.findView(n);
      var fo = v && v.container ? v.container.querySelector('foreignObject') : null;
      var el = fo ? fo.querySelector('div') : null;
      if (!el || !el.innerHTML.length) allDone = false;
    });
    if (!allDone && retries > 0) {
      setTimeout(function () { ensureRendered(retries - 1); }, 350);
    }
  }

  // ===================== 3. 注册 X6 节点类型 =====================
  X6.Graph.registerNode('pool-node', {
    inherit: 'rect',
    width: POOL_W, height: POOL_H,
    markup: [
      { tagName: 'rect', selector: 'body' },
      {
        tagName: 'foreignObject', selector: 'fo',
        children: [{ tagName: 'div', ns: 'http://www.w3.org/1999/xhtml', selector: 'content' }]
      }
    ],
    attrs: {
      body: { fill: 'rgba(0,0,0,0)', stroke: 'none' },
      fo: { x: 0, y: 0, width: POOL_W, height: POOL_H, style: { overflow: 'hidden', pointerEvents: 'none' } },
      content: { style: { width: POOL_W + 'px', height: POOL_H + 'px', overflow: 'hidden' } }
    }
  });

  X6.Graph.registerNode('device-node', {
    inherit: 'rect',
    width: DEV_W, height: DEV_H,
    markup: [
      { tagName: 'rect', selector: 'body' },
      {
        tagName: 'foreignObject', selector: 'fo',
        children: [{ tagName: 'div', ns: 'http://www.w3.org/1999/xhtml', selector: 'content' }]
      }
    ],
    attrs: {
      body: { fill: 'rgba(0,0,0,0)', stroke: 'none' },
      fo: { x: 0, y: 0, width: DEV_W, height: DEV_H, style: { overflow: 'hidden', pointerEvents: 'none' } },
      content: { style: { width: DEV_W + 'px', height: DEV_H + 'px', overflow: 'hidden' } }
    }
  });

  // ===================== 4. Graph 初始化 =====================
  var graph = new X6.Graph({
    container: document.getElementById('graphContainer'),
    grid: { size: 20, visible: true, type: 'dot', args: { color: 'rgba(0,229,255,.14)' } },
    panning: { enabled: true, eventTypes: ['middleMouseDown'] },
    mousewheel: { enabled: true, modifiers: ['ctrl', 'meta'] },
    selecting: { enabled: true, multiple: true, rubberband: true, showNodeSelectionBox: true, pointerdown: true },
    snapline: { enabled: true },
    // 连线重连：允许拖拽边端点连接到其他节点
    connecting: {
      snap: true,
      allowBlank: false,
      allowLoop: false,
      allowNode: true,
      allowEdge: false,
      highlight: true
    },
    interacting: { nodeMovable: true }
  });

  // ===================== 5. 工艺流程图节点 =====================
  // 物化段：调节池 → 离心泵 → 反应池1 → 反应池2 → 物化沉淀池1
  // 生物段：厌氧池 → 缺氧池 → 好氧池 → 生化沉淀池
  function poolParams(pool) {
    return pool.params.map(function (p) {
      return { key: p.key, name: p.name, unit: p.unit, val: lastVal(pool.id, p.key) };
    });
  }

  function addPoolNode(pool, x, y, fixedId) {
    return graph.addNode({
      shape: 'pool-node',
      id: fixedId ? ('pool-' + pool.id) : undefined,
      x: x, y: y, width: POOL_W, height: POOL_H,
      zIndex: 1,
      data: {
        type: 'pool', poolId: pool.id, poolName: pool.name, status: pool.status,
        svgKey: pool.svg, section: pool.section, params: poolParams(pool)
      }
    });
  }

  function addDeviceNode(svgKey, name, x, y) {
    return graph.addNode({
      shape: 'device-node',
      x: x, y: y, width: DEV_W, height: DEV_H,
      zIndex: 1,
      data: { type: 'device', name: name, svgKey: svgKey }
    });
  }

  // 分区框：物化段（蓝）/生化段（红）/调节池区（青绿），不可交互、置于底层
  function hexToRgba(hex, a) {
    var h = hex.replace('#', '');
    var r = parseInt(h.substring(0, 2), 16), g = parseInt(h.substring(2, 4), 16), b = parseInt(h.substring(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }
  function addSectionBox(x, y, width, height, title, color) {
    var boxNode = graph.addNode({
      shape: 'rect',
      x: x, y: y, width: width, height: height,
      zIndex: -2,
      attrs: {
        body: {
          fill: hexToRgba(color, 0.05),
          stroke: color, strokeWidth: 1.6, rx: 16, ry: 16
        },
        label: {
          text: title, fill: color, fontSize: 15, fontWeight: 700,
          letterSpacing: 3,
          refX: '50%', refY: '100%',
          textAnchor: 'middle', textVerticalAnchor: 'bottom'
        }
      },
      interacting: false
    });
    sectionBoxNodes.push(boxNode);
    return boxNode;
  }

  // 动态水流线：flow-line 流动动画（流向由流动管道表达，不加三角箭头）
  // 注意：X6 默认边自带 targetMarker(marker-v1)，必须显式 targetMarker:null 禁用
  function addFlowEdge(sourceId, targetId, sAnchor, tAnchor, vertices) {
    var opts = {
      source: { cell: sourceId, anchor: sAnchor || 'right' },
      target: { cell: targetId, anchor: tAnchor || 'left' },
      router: { name: 'normal' }, // 同行/跨段均直线，跨段用 vertices 折线（参考图走向）
      connector: { name: 'normal' },
      zIndex: 0,
      attrs: {
        line: {
          stroke: '#00f0ff', strokeWidth: 2, strokeOpacity: 0.7,
          class: 'flow-line',
          targetMarker: null // 显式禁用箭头（X6 默认边自带三角箭头）
        }
      }
    };
    if (vertices) opts.vertices = vertices;
    var edge = graph.addEdge(opts);
    return edge;
  }

  // 三区布局：调节池区(青绿) / 物化段(蓝) / 生化段(红)
  var SECTIONS = [
    { x: 20, y: 70, w: 420, h: 330, title: '调节池区', color: COLOR_ADJ },
    { x: 470, y: 70, w: 900, h: 330, title: '物化段', color: COLOR_PHYS },
    { x: 470, y: 430, w: 1140, h: 330, title: '生化段', color: COLOR_BIO }
  ];

  function buildFlow() {
    sectionBoxNodes = []; // 重置分区框引用（resetLayout 时重建）
    // 分区框（底层）
    SECTIONS.forEach(function (s) {
      addSectionBox(s.x, s.y, s.w, s.h, s.title, s.color);
    });
    // 池体 / 设备
    var ids = {};
    // 调节池区
    ids.tiaojiechi = addPoolNode(MOCK.POOLS[0], 40, 120, true).id;   // 调节池
    ids['离心泵'] = addDeviceNode('水泵', '离心泵', 300, 200).id;
    // 物化段
    ids.fanying1 = addPoolNode(MOCK.POOLS[1], 500, 120, true).id;    // 反应池1
    ids.fanying2 = addPoolNode(MOCK.POOLS[2], 760, 120, true).id;    // 反应池2
    ids.wuhuacd1 = addPoolNode(MOCK.POOLS[3], 1020, 120, true).id;   // 物化沉淀池1
    // 生化段
    ids.yanyang = addPoolNode(MOCK.POOLS[4], 500, 480, true).id;     // 厌氧池
    ids.queyang = addPoolNode(MOCK.POOLS[5], 760, 480, true).id;     // 缺氧池
    ids.haoyang = addPoolNode(MOCK.POOLS[6], 1020, 480, true).id;    // 好氧池
    ids.shenghuacd = addPoolNode(MOCK.POOLS[7], 1280, 480, true).id; // 生化沉淀池
    // 动态水流线（起终点可拖拽编辑）
    addFlowEdge(ids.tiaojiechi, ids['离心泵'], 'right', 'left');
    addFlowEdge(ids['离心泵'], ids.fanying1, 'right', 'left');
    addFlowEdge(ids.fanying1, ids.fanying2, 'right', 'left');
    addFlowEdge(ids.fanying2, ids.wuhuacd1, 'right', 'left');
    // 跨段折线：物化沉淀池1右出→向下→中间空行水平跨越→向下→进厌氧池（参考图走向）
    addFlowEdge(ids.wuhuacd1, ids.yanyang, 'right', 'left', [
      { x: 1360, y: 232 }, { x: 1360, y: 400 }, { x: 470, y: 400 }, { x: 470, y: 592 }
    ]);
    addFlowEdge(ids.yanyang, ids.queyang, 'right', 'left');
    addFlowEdge(ids.queyang, ids.haoyang, 'right', 'left');
    addFlowEdge(ids.haoyang, ids.shenghuacd, 'right', 'left');
  }

  // ===================== 6. 工具栏 =====================
  var toolbar = document.getElementById('canvasToolbar');
  var modalMask = document.getElementById('modalMask');
  var modalGrid = document.getElementById('modalGrid');
  var modalTitle = document.getElementById('modalTitle');
  var modalCancel = document.getElementById('modalCancel');
  var modalMode = 'pool';

  function openModal(mode) {
    modalMode = mode;
    modalTitle.textContent = mode === 'pool' ? '添加池体构筑物' : '添加设备';
    var items = [];
    if (mode === 'pool') {
      items = ['调节池', '反应池', '沉淀池', '厌氧池', '缺氧池', '好氧池', '二沉池'];
    } else {
      items = ['水泵', '风机', '搅拌机', '曝气盘', '刮泥机'];
    }
    modalGrid.innerHTML = items.map(function (k) {
      return '<div class="modal-item" data-svg="' + k + '"><div class="mi-svg">' + svgWithPrefix(SVG_ASSETS[k], 'mi') + '</div><div class="mi-name">' + k + '</div></div>';
    }).join('');
    modalMask.classList.add('show');
  }
  function closeModal() { modalMask.classList.remove('show'); }

  toolbar.addEventListener('click', function (e) {
    var btn = e.target.closest('.tool-btn');
    if (!btn) return;
    var act = btn.getAttribute('data-act');
    if (act === 'add-pool') openModal('pool');
    else if (act === 'add-device') openModal('device');
    else if (act === 'add-pipe') toggleConnectMode();
    else if (act === 'del') delSelected();
    else if (act === 'reset') resetLayout();
    else if (act === 'export') exportJson();
  });

  // ===== 连线模式：自定义添加流态管道（点起点 → 点终点，方向即流向） =====
  var connectMode = false;
  var connectSourceId = null;

  function toggleConnectMode() {
    connectMode = !connectMode;
    var btn = document.querySelector('.tool-btn[data-act="add-pipe"]');
    if (btn) btn.classList.toggle('active', connectMode);
    clearConnectSource();
    if (connectMode) {
      toast('连线模式已开启：点击起点节点 → 点击终点节点，生成流动管道（Esc 退出）');
    } else {
      toast('已退出连线模式');
    }
  }

  function clearConnectSource() {
    if (connectSourceId) {
      var n = graph.getCellById(connectSourceId);
      if (n) n.attr('body/stroke', null);
    }
    connectSourceId = null;
  }

  function getNodeName(id) {
    var n = graph.getCellById(id);
    if (!n) return id;
    var d = n.getData();
    return d ? (d.poolName || d.name || id) : id;
  }

  function handleConnectClick(node) {
    if (!connectSourceId) {
      connectSourceId = node.id;
      node.attr('body/stroke', '#ffcf5c'); // 高亮起点
      toast('起点：' + getNodeName(node.id) + '，再点击终点节点');
    } else if (connectSourceId === node.id) {
      clearConnectSource();
      toast('已取消起点选择');
    } else {
      var sourceId = connectSourceId;
      addFlowEdge(sourceId, node.id, 'center', 'center');
      clearConnectSource();
      toast('已添加管道：' + getNodeName(sourceId) + ' → ' + getNodeName(node.id));
    }
  }

  modalMask.addEventListener('click', function (e) {
    if (e.target === modalMask) closeModal();
  });
  modalCancel.addEventListener('click', closeModal);
  modalGrid.addEventListener('click', function (e) {
    var item = e.target.closest('.modal-item');
    if (!item) return;
    var svgKey = item.getAttribute('data-svg');
    addStencilNode(svgKey);
    closeModal();
  });

  function delSelected() {
    if (!selectedCellId) { toast('请先点击选中要删除的节点'); return; }
    var cell = graph.getCellById(selectedCellId);
    if (!cell) { clearSelection(); return; }
    var name = getNodeName(selectedCellId);
    cell.remove();
    clearSelection();
    toast('已删除：' + name);
  }

  function resetLayout() {
    clearSelection();
    graph.clearCells();
    buildFlow();
    ensureRendered(6);
    toast('已重置工艺流程图布局');
  }

  function exportJson() {
    var json = JSON.stringify(graph.toJSON(), null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '工艺流程布局.json';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('已导出布局 JSON');
  }

  // 图元 → 分区框映射（用户要求：按类型自动放进对应分区框）
  // 0=调节池区, 1=物化段, 2=生化段
  var SECTION_MAP = {
    '调节池': 0,
    '反应池': 1, '沉淀池': 1,
    '厌氧池': 2, '缺氧池': 2, '好氧池': 2, '二沉池': 2
  };

  // 在分区框内第一行末尾找空位（框不够时由 expandSection 自动扩大）
  function placeInSection(sectionIdx) {
    var section = SECTIONS[sectionIdx];
    var pad = 24;
    var rowY = section.y + 50;
    var existing = [];
    graph.getNodes().forEach(function (n) {
      if (n.shape !== 'pool-node' && n.shape !== 'device-node') return;
      var p = n.position(), s = n.getSize();
      if (p.x >= section.x - 5 && p.x <= section.x + section.w + 5 &&
          p.y >= section.y - 5 && p.y <= section.y + section.h + 5) {
        existing.push({ x: p.x, y: p.y, w: s.width, h: s.height });
      }
    });
    var maxRight = section.x + pad;
    existing.forEach(function (e) {
      if (Math.abs(e.y - rowY) < 60) {
        if (e.x + e.w + pad > maxRight) maxRight = e.x + e.w + pad;
      }
    });
    return { x: maxRight, y: rowY };
  }

  // 自动扩大分区框，容纳新增池体（框右缘/下缘不够时向外扩展）
  function expandSection(sectionIdx, pos) {
    var section = SECTIONS[sectionIdx];
    var boxNode = sectionBoxNodes[sectionIdx];
    var newW = Math.max(section.w, pos.x + POOL_W + 20 - section.x);
    var newH = Math.max(section.h, pos.y + POOL_H + 20 - section.y);
    if (newW > section.w || newH > section.h) {
      section.w = newW;
      section.h = newH;
      if (boxNode) boxNode.setSize({ width: newW, height: newH });
    }
  }

  // 从图元库/弹层添加节点（池体自动放入对应分区框，设备放到画布空闲处）
  function addStencilNode(svgKey) {
    var poolBySvg = { '调节池': 'tiaojiechi', '反应池': 'fanying1', '沉淀池': 'wuhuacd1', '厌氧池': 'yanyang', '缺氧池': 'queyang', '好氧池': 'haoyang', '二沉池': 'shenghuacd' };
    var sectionIdx = SECTION_MAP[svgKey];
    var pos = sectionIdx !== undefined ? placeInSection(sectionIdx) : freePos();
    if (poolBySvg[svgKey]) {
      var pool = MOCK.POOLS.filter(function (p) { return p.id === poolBySvg[svgKey]; })[0];
      var n = addPoolNode(pool, pos.x, pos.y);
      if (sectionIdx !== undefined) expandSection(sectionIdx, pos); // 自动扩大分区框
      setTimeout(function () { renderNodeContent(n); }, 150);
      toast('已添加池体：' + pool.name + (sectionIdx !== undefined ? (' → ' + SECTIONS[sectionIdx].title) : ''));
    } else {
      var dn = addDeviceNode(svgKey, svgKey, pos.x, pos.y);
      setTimeout(function () { renderNodeContent(dn); }, 150);
      toast('已添加设备：' + svgKey);
    }
  }
  function freePos() {
    var bbox = graph.getBBox();
    return { x: Math.max(40, bbox.x + 40), y: Math.max(74, bbox.y + 40) };
  }

  // ===================== 7. 事件绑定 =====================
  graph.on('render:done', renderAllContents);
  // 节点视图渲染完成后才填充内容（X6 渲染异步，需延迟）
  graph.on('node:added', function (e) { setTimeout(function () { renderNodeContent(e.node); }, 120); });
  graph.on('node:removed', function () { /* 边自动删除 */ });

  // ===== 分区框自适应内容（跟随节点缩放调整，非固定区域） =====
  function autoFitAllSections() {
    SECTIONS.forEach(function (section, idx) {
      var boxNode = sectionBoxNodes[idx];
      if (!boxNode) return;
      var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, has = false;
      graph.getNodes().forEach(function (n) {
        if (n.shape !== 'pool-node' && n.shape !== 'device-node') return;
        var p = n.position(), s = n.getSize();
        var cx = p.x + s.width / 2, cy = p.y + s.height / 2;
        if (cx >= section.x - 40 && cx <= section.x + section.w + 40 &&
            cy >= section.y - 40 && cy <= section.y + section.h + 40) {
          if (p.x < minX) minX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.x + s.width > maxX) maxX = p.x + s.width;
          if (p.y + s.height > maxY) maxY = p.y + s.height;
          has = true;
        }
      });
      if (!has) return;
      var pad = 34;
      var nx = Math.round(minX - pad), ny = Math.round(minY - pad);
      var nw = Math.round(maxX - minX + pad * 2);
      var nh = Math.round(maxY - minY + pad * 2);
      section.x = nx; section.y = ny; section.w = nw; section.h = nh;
      boxNode.setPosition(nx, ny);
      boxNode.setSize({ width: nw, height: nh });
    });
  }
  // 节点拖动/缩放/增删后自动调整分区框
  graph.on('node:moved', autoFitAllSections);
  graph.on('node:resized', autoFitAllSections);
  graph.on('node:added', function () { setTimeout(autoFitAllSections, 60); });
  graph.on('node:removed', function () { setTimeout(autoFitAllSections, 60); });

  // 连线编辑抓手：hover 边时显示可拖拽端点（起终点可编辑），平时隐藏不显示箭头
  graph.on('edge:mouseenter', function (e) {
    if (e.edge && e.edge.setTools) {
      e.edge.setTools([{ name: 'source-arrowhead' }, { name: 'target-arrowhead' }]);
    }
  });
  graph.on('edge:mouseleave', function (e) {
    if (e.edge && e.edge.removeTools) {
      e.edge.removeTools();
    }
  });

  // 节点悬停显示删除按钮（自动删除功能，点 × 即删除该节点）
  graph.on('node:mouseenter', function (e) {
    if (!connectMode && e.node && e.node.setTools) {
      e.node.setTools([{ name: 'button-remove' }]);
    }
  });
  graph.on('node:mouseleave', function (e) {
    if (e.node && e.node.removeTools) e.node.removeTools();
  });

  // ===== 自维护选中状态（X6 2.x 把 Selection 拆成了插件，主包无选中 API） =====
  var selectedCellId = null;
  function selectNode(node) {
    if (selectedCellId) {
      var old = graph.getCellById(selectedCellId);
      if (old) {
        var ov = graph.findView(old);
        if (ov && ov.container) ov.container.classList.remove('my-selected');
      }
    }
    selectedCellId = node ? node.id : null;
    if (node) {
      var v = graph.findView(node);
      if (v && v.container) v.container.classList.add('my-selected');
    }
  }
  function clearSelection() { selectNode(null); }

  // 点击池体 → 选中 + 打开历史数据抽屉；连线模式下选择管道起终点
  graph.on('node:click', function (e) {
    if (connectMode) {
      handleConnectClick(e.node);
      return;
    }
    var d = e.node.getData();
    if (!d) return;
    selectNode(e.node); // 自维护选中（供 Delete 删除）
    if (d.type === 'pool') {
      openDrawer(d.poolId, d.poolName);
    } else {
      toast('设备节点：' + d.name + '（暂无历史数据曲线）');
    }
  });

  // 悬停提示
  var tipEl = null;
  graph.on('node:mouseenter', function (e) {
    var d = e.node.getData();
    if (!d) return;
    showTip(e.e.clientX, e.e.clientY, d.type === 'pool' ? ('点击查看「' + d.poolName + '」历史数据') : (d.name + ' · 可拖动'));
  });
  graph.on('node:mouseleave', hideTip);

  function showTip(x, y, text) {
    if (!tipEl) {
      tipEl = document.createElement('div');
      tipEl.className = 'node-tip';
      document.body.appendChild(tipEl);
    }
    tipEl.textContent = text;
    tipEl.style.left = (x + 14) + 'px';
    tipEl.style.top = (y + 14) + 'px';
    tipEl.style.display = 'block';
  }
  function hideTip() { if (tipEl) tipEl.style.display = 'none'; }

  // 左栏原水水质数据（COD/氨氮/pH/流量 模拟数据）
  function renderNavData() {
    var el = document.getElementById('navData');
    if (!el) return;
    el.innerHTML = MOCK.ORIGIN_WATER.map(function (w) {
      var icon = w.trend === 'up' ? '▲' : (w.trend === 'down' ? '▼' : '◆');
      var tcls = w.trend === 'up' ? 'trend-up' : (w.trend === 'down' ? 'trend-down' : 'trend-flat');
      return '<div class="nav-data-item">' +
        '<div class="nd-name">' + w.name + '</div>' +
        '<div class="nd-val">' + w.value + '<i>' + (w.unit || '') + '</i></div>' +
        '<div class="nd-trend ' + tcls + '">' + icon + '</div>' +
        '</div>';
    }).join('');
  }

  // 左栏原水管控切换
  var sourceSwitch = document.getElementById('sourceSwitch');
  sourceSwitch.addEventListener('click', function (e) {
    var opt = e.target.closest('.switch-opt');
    if (!opt) return;
    sourceSwitch.querySelectorAll('.switch-opt').forEach(function (o) { o.classList.remove('active'); });
    opt.classList.add('active');
    var mode = opt.getAttribute('data-mode');
    toast(mode === 'station' ? '已切换到：在线监测站房' : '已切换到：原水管控装置');
  });

  // 图元库点击添加
  var stencil = document.getElementById('stencil');
  stencil.addEventListener('click', function (e) {
    var item = e.target.closest('.stencil-item');
    if (!item) return;
    addStencilNode(item.getAttribute('data-svg'));
  });

  // ===================== 8. 池体详情抽屉 + ECharts =====================
  var drawer = document.getElementById('drawer');
  var drawerMask = document.getElementById('drawerMask');
  var drawerClose = document.getElementById('drawerClose');
  var paramTabs = document.getElementById('paramTabs');
  var timeRange = document.getElementById('timeRange');
  var chartBox = document.getElementById('chart');
  var chartUnit = document.getElementById('chartUnit');
  var dataTableBody = document.querySelector('#dataTable tbody');
  var currentPool = null;   // pool 定义
  var currentParam = null;  // param 定义
  var currentRange = '7d';
  var chart = null;

  function openDrawer(poolId, poolName) {
    var pool = MOCK.POOLS.filter(function (p) { return p.id === poolId; })[0];
    if (!pool) return;
    currentPool = pool;
    document.getElementById('drawerTitle').textContent = poolName;
    document.getElementById('drawerSub').textContent = '历史数据 · 过程监测设备 vs 化验室数据';
    // 渲染参数 tabs
    paramTabs.innerHTML = pool.params.map(function (p, i) {
      return '<span class="param-tab' + (i === 0 ? ' active' : '') + '" data-key="' + p.key + '">' + p.name + '</span>';
    }).join('');
    currentParam = pool.params[0];
    drawer.classList.add('show');
    drawerMask.classList.add('show');
    updateChart();
  }

  function closeDrawer() {
    drawer.classList.remove('show');
    drawerMask.classList.remove('show');
  }

  drawerClose.addEventListener('click', closeDrawer);
  drawerMask.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (connectMode) { toggleConnectMode(); return; }
      closeDrawer();
    }
    // Delete / Backspace 删除选中节点（自动删除功能）
    if (e.key === 'Delete' || e.key === 'Backspace') {
      var tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      delSelected();
    }
  });

  paramTabs.addEventListener('click', function (e) {
    var tab = e.target.closest('.param-tab');
    if (!tab) return;
    paramTabs.querySelectorAll('.param-tab').forEach(function (t) { t.classList.remove('active'); });
    tab.classList.add('active');
    var key = tab.getAttribute('data-key');
    currentParam = currentPool.params.filter(function (p) { return p.key === key; })[0];
    updateChart();
  });

  timeRange.addEventListener('click', function (e) {
    var span = e.target.closest('span[data-range]');
    if (!span) return;
    timeRange.querySelectorAll('span').forEach(function (s) { s.classList.remove('active'); });
    span.classList.add('active');
    currentRange = span.getAttribute('data-range');
    updateChart();
  });

  function rangeHours() {
    if (currentRange === '24h') return 24;
    if (currentRange === '7d') return 24 * 7;
    return 24 * 30;
  }

  function updateChart() {
    if (!currentPool || !currentParam) return;
    if (!chart) {
      chart = window.echarts.init(chartBox);
      window.addEventListener('resize', function () { chart && chart.resize(); });
    }
    var series = MOCK.genSeries(currentPool.id, currentParam.key);
    var hours = rangeHours();
    var now = Date.now();
    var cutoff = now - hours * 3600 * 1000;

    var process = series.process.filter(function (pt) { return pt[0] >= cutoff; });
    var lab = series.lab.filter(function (pt) { return pt[0] >= cutoff; });

    chartUnit.textContent = '单位：' + (series.unit || '—');

    chart.setOption({
      animationDuration: 300,
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(6,20,30,.95)',
        borderColor: 'rgba(0,240,255,.4)',
        textStyle: { color: '#c9f4ff', fontSize: 11 },
        valueFormatter: function (v) { return (typeof v === 'number' ? v.toFixed(2) : v) + (series.unit ? ' ' + series.unit : ''); }
      },
      legend: { show: false },
      grid: { left: 48, right: 16, top: 12, bottom: 30 },
      xAxis: {
        type: 'time',
        axisLine: { lineStyle: { color: 'rgba(0,229,255,.35)' } },
        axisLabel: { color: '#6fb3c4', fontSize: 10 },
        splitLine: { show: false }
      },
      yAxis: {
        type: 'value', scale: true,
        name: series.unit || '',
        nameTextStyle: { color: '#6fb3c4', fontSize: 10 },
        axisLabel: { color: '#6fb3c4', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(0,229,255,.08)' } }
      },
      series: [
        {
          name: '过程监测设备', type: 'line', data: process, smooth: true, showSymbol: false,
          lineStyle: { color: '#00f0ff', width: 1.8 },
          itemStyle: { color: '#00f0ff' },
          areaStyle: { color: 'rgba(0,240,255,.10)' }
        },
        {
          name: '化验室数据', type: 'line', data: lab, smooth: false, symbol: 'circle', symbolSize: 8,
          lineStyle: { color: '#ffb36b', type: 'dashed', width: 1.2 },
          itemStyle: { color: '#ffb36b', borderColor: '#ffd9a8', borderWidth: 1 }
        }
      ]
    });

    renderDataTable(lab, process, series.unit);
  }

  // 化验室最近数据表
  function nearestProc(process, ts) {
    var best = null, bestD = Infinity;
    for (var i = 0; i < process.length; i++) {
      var d = Math.abs(process[i][0] - ts);
      if (d < bestD) { bestD = d; best = process[i]; }
    }
    return best;
  }
  function fmtTime(ts) { return MOCK.timeStr(ts); }
  function renderDataTable(lab, process, unit) {
    var recent = lab.slice(-8).reverse();
    if (!recent.length) {
      dataTableBody.innerHTML = '<tr><td colspan="4" style="color:#6fb3c4">该时间段无化验室数据上传</td></tr>';
      return;
    }
    dataTableBody.innerHTML = recent.map(function (pt) {
      var proc = nearestProc(process, pt[0]);
      var dev = proc ? proc[1] : null;
      var bias = (dev !== null) ? Math.round((pt[1] - dev) * 100) / 100 : null;
      var biasTxt = bias === null ? '—' : (bias >= 0 ? '+' + bias : bias);
      var cls = bias === null ? '' : (Math.abs(bias) < 2 ? 'pos' : 'neg');
      return '<tr>' +
        '<td>' + fmtTime(pt[0]) + '</td>' +
        '<td>' + pt[1] + (unit || '') + '</td>' +
        '<td>' + (dev === null ? '—' : dev + (unit || '')) + '</td>' +
        '<td class="' + cls + '">' + biasTxt + (unit || '') + '</td>' +
        '</tr>';
    }).join('');
  }

  // ===================== 9. 底部风机房 + 药剂渲染 =====================
  function renderBottom() {
    var fansGrid = document.getElementById('fansGrid');
    fansGrid.innerHTML = MOCK.FANS.map(function (f) {
      var svg = svgWithPrefix(SVG_ASSETS['风机'], 'fan' + f.id);
      return '<div class="fan-card">' +
        '<div class="fan-head"><span class="fan-name">' + f.name + '</span><span class="fan-kind">' + f.kind + '</span></div>' +
        '<div class="fan-body">' +
        '<div class="fan-svg">' + svg + '</div>' +
        '<div class="fan-metrics">' +
        '<div class="fan-metric"><label>风量</label><b>' + f.wind + ' <i>m³/min</i></b></div>' +
        '<div class="fan-metric"><label>升压</label><b>' + f.press + ' <i>kPa</i></b></div>' +
        '<div class="fan-metric"><label>功率</label><b>' + f.power + '<i>%</i></b></div>' +
        '</div></div>' +
        '<div class="fan-state"><span class="dot"></span>运行中</div>' +
        '</div>';
    }).join('');

    var chemGrid = document.getElementById('chemGrid');
    chemGrid.innerHTML = MOCK.CHEMICALS.map(function (c) {
      return '<div class="chem-card">' +
        '<div class="chem-name">' + c.name + '<b>' + c.level + '%</b></div>' +
        '<div class="chem-tank">' +
        '<div class="chem-scale"></div>' +
        '<div class="chem-fill" style="height:' + c.level + '%;background:linear-gradient(180deg,rgba(127,243,255,.55),rgba(0,194,232,.3))"></div>' +
        '</div>' +
        '<div class="chem-level">液位存量 ' + c.level + '%</div>' +
        '</div>';
    }).join('');
  }

  // ===================== 10. 右侧总排口渲染 =====================
  function renderOutlet() {
    var list = document.getElementById('outletList');
    list.innerHTML = MOCK.OUTLET.map(function (o) {
      var ok = o.rate >= 95;
      return '<div class="outlet-item">' +
        '<span class="o-name">' + o.name + '</span>' +
        '<span class="o-val">' + o.value + (o.unit ? ' <i>' + o.unit + '</i>' : '') + '</span>' +
        '<span class="o-rate ' + (ok ? '' : 'bad') + '">达标率 ' + o.rate + '%</span>' +
        '</div>';
    }).join('');
    document.getElementById('btnStand').addEventListener('click', function () {
      toast('达标判定：全部指标符合《城镇污水处理厂污染物排放标准》');
    });
    document.getElementById('btnExport').addEventListener('click', function () {
      toast('运行记录已生成（演示功能）');
    });
  }

  // ===================== 11. Toast =====================
  var toastEl = null;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.style.cssText = 'position:fixed;left:50%;bottom:170px;transform:translateX(-50%);z-index:200;background:rgba(6,20,30,.95);border:1px solid rgba(0,240,255,.5);color:#7ff3ff;font-size:13px;padding:9px 18px;border-radius:9px;box-shadow:0 8px 24px rgba(0,0,0,.5);letter-spacing:.5px;transition:opacity .3s;';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.style.opacity = '1';
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () { toastEl.style.opacity = '0'; }, 2200);
  }

  // ===================== 12. 初始化 =====================
  buildFlow();
  ensureRendered(14); // 多次重试渲染节点内容（覆盖更长加载时间）
  renderNavData();
  renderBottom();
  renderOutlet();
  // 首次画布缩放适配
  setTimeout(function () {
    var bbox = graph.getBBox();
    var cw = document.getElementById('graphContainer').clientWidth;
    var ch = document.getElementById('graphContainer').clientHeight;
    var scale = Math.min(cw / (bbox.width + 80), ch / (bbox.height + 80), 1);
    if (scale < 1) graph.zoom(scale, { center: { x: cw / 2, y: ch / 2 } });
  }, 60);

  // 暴露给调试
  window.__graph = graph;
})();
