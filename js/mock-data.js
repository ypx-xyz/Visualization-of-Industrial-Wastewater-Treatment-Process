// 工业污水处理过程可视化 X6 工艺流程编辑页 · 模拟数据模块
// 生成各池参数的"过程监测设备曲线 + 化验室曲线"双数据源
// 说明：当前为交互原型验证用模拟数据，后续可替换为真实接口

(function (global) {
  'use strict';

  // ---------- 确定性伪随机（保证每次刷新数据一致，便于演示） ----------
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---------- 工艺池定义（含每池可查看的参数） ----------
  // section: 物化段 / 生物段 ; svg: 对应 svg-assets.js 里的图元 key
  var POOLS = [
    {
      id: 'tiaojiechi', name: '调节池', section: '物化段', svg: '调节池', status: 'normal',
      params: [
        { key: 'level', name: '液位', unit: '%', range: [20, 80] },
        { key: 'flow', name: '流量', unit: 'm3/h', range: [60, 160] }
      ]
    },
    {
      id: 'fanying1', name: '反应池1', section: '物化段', svg: '反应池', status: 'normal',
      params: [
        { key: 'ph', name: 'pH', unit: '', range: [6.5, 8.5] },
        { key: 'orp', name: 'ORP', unit: 'mV', range: [-80, 120] },
        { key: 'cod', name: 'COD', unit: 'mg/L', range: [60, 180] }
      ]
    },
    {
      id: 'fanying2', name: '反应池2', section: '物化段', svg: '反应池', status: 'abnormal',
      params: [
        { key: 'ph', name: 'pH', unit: '', range: [6.5, 8.5] },
        { key: 'orp', name: 'ORP', unit: 'mV', range: [-80, 120] },
        { key: 'cod', name: 'COD', unit: 'mg/L', range: [60, 180] }
      ]
    },
    {
      id: 'wuhuacd1', name: '物化沉淀池1', section: '物化段', svg: '沉淀池', status: 'normal',
      params: [
        { key: 'ph', name: 'pH', unit: '', range: [6.5, 8.5] },
        { key: 'cod', name: 'COD', unit: 'mg/L', range: [50, 150] },
        { key: 'nh3n', name: 'NH3-N', unit: 'mg/L', range: [8, 35] }
      ]
    },
    {
      id: 'yanyang', name: '厌氧池', section: '生物段', svg: '厌氧池', status: 'normal',
      params: [
        { key: 'ph', name: 'pH', unit: '', range: [6.8, 7.6] },
        { key: 'orp', name: 'ORP', unit: 'mV', range: [-320, -180] },
        { key: 'nh3n', name: 'NH3-N', unit: 'mg/L', range: [8, 30] },
        { key: 'cod', name: 'COD', unit: 'mg/L', range: [40, 140] },
        { key: 'no3', name: 'NO3-', unit: 'mg/L', range: [0.5, 5] }
      ]
    },
    {
      id: 'queyang', name: '缺氧池', section: '生物段', svg: '缺氧池', status: 'warning',
      params: [
        { key: 'ph', name: 'pH', unit: '', range: [6.8, 7.8] },
        { key: 'orp', name: 'ORP', unit: 'mV', range: [-120, 20] },
        { key: 'nh3n', name: 'NH3-N', unit: 'mg/L', range: [6, 25] },
        { key: 'cod', name: 'COD', unit: 'mg/L', range: [35, 120] },
        { key: 'no3', name: 'NO3-', unit: 'mg/L', range: [1, 12] }
      ]
    },
    {
      id: 'haoyang', name: '好氧池', section: '生物段', svg: '好氧池', status: 'normal',
      params: [
        { key: 'ph', name: 'pH', unit: '', range: [7.0, 8.2] },
        { key: 'orp', name: 'ORP', unit: 'mV', range: [-20, 80] },
        { key: 'nh3n', name: 'NH3-N', unit: 'mg/L', range: [0.5, 8] },
        { key: 'cod', name: 'COD', unit: 'mg/L', range: [25, 90] },
        { key: 'no3', name: 'NO3-', unit: 'mg/L', range: [5, 20] },
        { key: 'do', name: 'DO', unit: 'mg/L', range: [1.5, 5.5] },
        { key: 'mlss', name: 'MLSS', unit: 'mg/L', range: [2500, 4500] }
      ]
    },
    {
      id: 'shenghuacd', name: '生化沉淀池', section: '生物段', svg: '二沉池', status: 'normal',
      params: [
        { key: 'ph', name: 'pH', unit: '', range: [6.8, 7.8] },
        { key: 'orp', name: 'ORP', unit: 'mV', range: [-40, 40] },
        { key: 'nh3n', name: 'NH3-N', unit: 'mg/L', range: [0.3, 6] },
        { key: 'cod', name: 'COD', unit: 'mg/L', range: [20, 80] },
        { key: 'no3', name: 'NO3-', unit: 'mg/L', range: [8, 25] }
      ]
    }
  ];

  // ---------- 底部风机房（物化×2 + 生化×2） ----------
  var FANS = [
    { id: 'fan1', name: '物化风机1#', kind: '物化', wind: 42.5, press: 4.6, power: 68 },
    { id: 'fan2', name: '物化风机2#', kind: '物化', wind: 38.9, press: 4.2, power: 61 },
    { id: 'fan3', name: '生化风机1#', kind: '生化', wind: 55.3, press: 5.8, power: 82 },
    { id: 'fan4', name: '生化风机2#', kind: '生化', wind: 51.7, press: 5.5, power: 76 }
  ];

  // ---------- 右下角液体药剂液位存量 ----------
  var CHEMICALS = [
    { id: 'pam', name: 'PAM药池', level: 68, color: '#7FF3FF' },
    { id: 'jian', name: '碱池', level: 54, color: '#00F0FF' },
    { id: 'suan', name: '酸池', level: 42, color: '#FFB36B' },
    { id: 'tanyuan', name: '碳源池', level: 75, color: '#9FFF6B' }
  ];

  // ---------- 原水管控水质数据（COD/氨氮/pH/流量） ----------
  var ORIGIN_WATER = [
    { name: 'COD', value: 235.6, unit: 'mg/L', trend: 'up' },
    { name: '氨氮', value: 28.4, unit: 'mg/L', trend: 'down' },
    { name: 'pH', value: 7.85, unit: '', trend: 'flat' },
    { name: '流量', value: 96.8, unit: 'm³/h', trend: 'up' }
  ];

  // ---------- 总排口站房出水监测 ----------
  var OUTLET = [
    { name: 'pH', value: 7.08, rate: 100, unit: '' },
    { name: 'COD', value: 38.6, rate: 96.8, unit: 'mg/L' },
    { name: '氨氮', value: 1.52, rate: 100, unit: 'mg/L' },
    { name: '总铬', value: 0.18, rate: 99.5, unit: 'mg/L' }
  ];
  var OUTLET_STANDARD = { pH: [6, 9], COD: 100, 氨氮: 15, 总铬: 1.5 };

  // ---------- 时间工具 ----------
  var HOUR = 3600 * 1000;
  function timeStr(t) {
    var d = new Date(t);
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':00';
  }

  // ---------- 曲线生成（过程设备 vs 化验室） ----------
  // 返回 { process: [[ts, value]...每小时], lab: [[ts, value]...每天1-2点] }
  var seriesCache = {};
  function genSeries(poolId, paramKey) {
    var cacheKey = poolId + '::' + paramKey;
    if (seriesCache[cacheKey]) return seriesCache[cacheKey];

    var pool = POOLS.filter(function (p) { return p.id === poolId; })[0];
    var param = pool.params.filter(function (p) { return p.key === paramKey; })[0];
    var rng = mulberry32(hashStr(poolId + paramKey));
    var now = Date.now();
    var HOURS = 24 * 30; // 近 30 天过程数据（24h/7d/30d 通过时间过滤）
    var start = now - HOURS * HOUR;

    // 慢漂移基线 + 随机波动
    var base = param.range[0] + (param.range[1] - param.range[0]) * (0.3 + 0.4 * rng());
    var amplitude = (param.range[1] - param.range[0]) * 0.08;

    var process = [];
    for (var i = 0; i <= HOURS; i++) {
      var t = start + i * HOUR;
      var wave = Math.sin(i / 18 + rng() * 6.28) * amplitude * 2;
      var noise = (rng() - 0.5) * amplitude;
      var v = clamp(base + wave + noise, param.range[0], param.range[1]);
      process.push([t, round(v, param.unit)]);
    }

    // 化验室：每天 1~2 个采样点（某些天可能缺失）
    var lab = [];
    for (var d = 0; d < 30; d++) {
      var dayT = start + d * 24 * HOUR + 8 * HOUR + Math.floor(rng() * 8) * HOUR;
      var count = rng() > 0.35 ? (rng() > 0.5 ? 2 : 1) : 0; // 35% 概率当天无上传
      for (var k = 0; k < count; k++) {
        var lt = dayT + k * 6 * HOUR + Math.floor(rng() * 3) * HOUR;
        // 化验室值与过程设备基线相近但独立波动
        var lv = clamp(base + (rng() - 0.5) * amplitude * 4, param.range[0], param.range[1]);
        lab.push([lt, round(lv, param.unit)]);
      }
    }
    lab.sort(function (a, b) { return a[0] - b[0]; });

    var series = { process: process, lab: lab, paramName: param.name, unit: param.unit, range: param.range };
    seriesCache[cacheKey] = series;
    return series;
  }

  function hashStr(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return Math.abs(h);
  }
  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
  function round(v, unit) {
    var dec = (unit === 'pH' || unit === '') ? 2 : 1;
    if (unit === '%') dec = 1;
    var f = Math.pow(10, dec);
    return Math.round(v * f) / f;
  }

  // 导出
  global.MOCK = {
    POOLS: POOLS,
    FANS: FANS,
    CHEMICALS: CHEMICALS,
    ORIGIN_WATER: ORIGIN_WATER,
    OUTLET: OUTLET,
    OUTLET_STANDARD: OUTLET_STANDARD,
    genSeries: genSeries,
    timeStr: timeStr
  };
})(typeof window !== 'undefined' ? window : this);
