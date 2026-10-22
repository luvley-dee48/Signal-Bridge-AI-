/* Live Monitoring: fixture data and pure functions (no DOM access).
   Everything here is GENERATED DEMO DATA. When a backend exists, replace view/series/rows
   with calls to GET /api/v1/stations/{id}/latest, /history and /health and keep the same shapes. */
(function (w) {
  'use strict';

  var CFG = {
    datum: 150.0,        // reference height H_ref, bed to transducer horn (cm)
    caution: 6.0,        // demo caution threshold (cm of water depth)
    high: 12.0,          // demo high-water threshold (cm)
    distMin: 5.0,        // valid sensor-to-water distance range (cm)
    distMax: 148.0,
    staleSec: 30,        // data older than this is stale
    offlineSec: 7200,    // data older than this is offline
    asOf: Date.parse('2026-10-21T14:42:08Z'), // fixture reference time, same as the Global Dashboard
    bufferRecords: 50
  };

  var STATIONS = [
    { id: 'SB-DEMO-001', name: 'Smart Flood Monitor', option: 'Smart Flood Monitor (demo hardware)', mode: 'fixture', def: 'B',
      loc: 'Thames Basin Catchment #8, Kingston Lock fluvial gauge', coords: '51.4112° N, 0.3061° W',
      hw: 'ESP32-WROOM-32U + MaxBotix MB7389 ultrasonic', uplink: 'Wi-Fi, LoRaWAN failover planned' },
    { id: 'SB-DEMO-002', name: 'Culvert Hydrology Node', option: 'Culvert Hydrology Node (stale)', mode: 'fixture', def: 'D', ageMin: 45,
      loc: 'Lambeth culvert (demo location)', coords: 'Not recorded',
      hw: 'ESP32 + ultrasonic level sensor', uplink: 'Wi-Fi' },
    { id: 'SB-DEMO-003', name: 'Storm Runoff Basin', option: 'Storm Runoff Basin (offline)', mode: 'fixture', def: 'D', ageMin: 190,
      loc: 'Southwark storm-runoff basin (demo location)', coords: 'Not recorded',
      hw: 'ESP32 + ultrasonic level sensor', uplink: 'Wi-Fi' },
    { id: 'SIM-TEST-004', name: 'Simulated Testing Fixture', option: 'Simulated Testing Fixture (synthetic)', mode: 'synthetic', def: 'A',
      loc: 'Test bench (no physical location)', coords: 'Not applicable',
      hw: 'Software simulator', uplink: 'None' }
  ];

  // kind: ok | stale | fault | apierr | pending
  var SCENARIOS = [
    { key: 'A', btn: 'Test A: Normal (4.2 cm)', kind: 'ok', distance: 145.8, ageSec: 2, trend15: 0.1, trend: '+0.1 cm / 15 min (stable)', tIcon: 'trending_flat' },
    { key: 'B', btn: 'Test B: Caution (7.4 cm)', kind: 'ok', distance: 142.6, ageSec: 3, trend15: 0.8, trend: '+0.8 cm / 15 min (rising)', tIcon: 'trending_up' },
    { key: 'C', btn: 'Test C: High water (13.8 cm)', kind: 'ok', distance: 136.2, ageSec: 1, trend15: 2.4, trend: '+2.4 cm / 15 min (fast surge)', tIcon: 'emergency' },
    { key: 'D', btn: 'Test D: Wi-Fi stale (45 min)', kind: 'stale', distance: 142.6, trend15: 0.8, trend: 'Unknown (signal lost)', tIcon: 'wifi_off' },
    { key: 'E', btn: 'Test E: Sensor fault', kind: 'fault', distance: 999.0, ageSec: 2, trend15: 0, trend: 'Echo lost', tIcon: 'error' },
    { key: 'F', btn: 'Test F: API error', kind: 'apierr', trend: 'Connection dropped', tIcon: 'cloud_off' },
    { key: 'G', btn: 'Test G: Unprovisioned', kind: 'pending', distance: 150.0, trend: 'Awaiting first sync', tIcon: 'hourglass_empty' }
  ];

  var RANGES = [
    { key: '15m', label: 'Last 15 minutes', min: 15 },
    { key: '1h', label: 'Last hour', min: 60 },
    { key: '6h', label: 'Last 6 hours', min: 360 },
    { key: '24h', label: 'Last 24 hours', min: 1440 }
  ];

  function r1(x) { return Math.round(x * 10) / 10; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function hms(ms) { var d = new Date(ms); return pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()); }
  function hm(ms) { return hms(ms).slice(0, 5); }
  function ageText(sec) {
    if (sec == null) return 'unknown';
    if (sec < 90) return Math.round(sec) + ' s';
    if (sec < 5400) return Math.round(sec / 60) + ' min';
    return Math.floor(sec / 3600) + ' h ' + Math.round((sec % 3600) / 60) + ' min';
  }
  function find(list, key, v) { for (var i = 0; i < list.length; i++) if (list[i][key] === v) return list[i]; return null; }
  function stationById(id) { return find(STATIONS, 'id', id); }
  function scenarioByKey(k) { return find(SCENARIOS, 'key', k); }

  function thresholdOf(depth) { return depth > CFG.high ? 'high' : depth > CFG.caution ? 'caution' : 'normal'; }

  /* The one object every panel renders from. */
  function view(stationId, key) {
    var st = stationById(stationId), sc = scenarioByKey(key);
    var kind = sc.kind, ageSec = null, status, depth = null, distance = sc.distance == null ? null : sc.distance, observedAt = null;
    if (kind === 'ok' || kind === 'fault') ageSec = sc.ageSec;
    if (kind === 'stale') ageSec = (st.ageMin || 45) * 60;
    if (ageSec != null) observedAt = CFG.asOf - ageSec * 1000;
    var distOk = distance != null && distance >= CFG.distMin && distance <= CFG.distMax;
    if (kind === 'pending') { depth = 0.0; status = 'pending'; }
    else if (kind === 'apierr') { status = 'apierr'; }
    else if (kind === 'fault' || !distOk) { status = 'fault'; }
    else {
      depth = r1(CFG.datum - distance);
      if (ageSec > CFG.staleSec) status = ageSec > CFG.offlineSec ? 'offline' : 'stale';
      else status = thresholdOf(depth);
    }
    return { station: st, scenario: sc, kind: kind, status: status, depth: depth, distance: distance, distOk: distOk,
      ageSec: ageSec, observedAt: observedAt, trend: sc.trend, tIcon: sc.tIcon, trend15: sc.trend15 || 0,
      obsNo: observedAt ? 8912 : null };
  }

  function hasHistory(v) { return v.kind === 'ok' || v.kind === 'stale' || v.kind === 'fault'; }
  function baseDepth(v) { return v.depth != null && v.kind !== 'fault' ? v.depth : 6.8; } // last good reading before a fault

  /* Chart series: deterministic points (about 30 per range) ending at the last good observation,
     limited to the selected time window. A window with no observations returns no points. */
  function series(v, rangeKey) {
    var range = find(RANGES, 'key', rangeKey), start = CFG.asOf - range.min * 60000;
    if (!hasHistory(v)) return { points: [], start: start, end: CFG.asOf };
    var n = 30, cur = baseDepth(v), step = range.min * 60000 / (n - 1);
    var drift = (v.kind === 'fault' ? 0.3 : (v.trend15 || 0.8)) * Math.min(range.min / 15, 5);
    var endGood = v.kind === 'fault' ? CFG.asOf - 4 * 60000 : v.observedAt, pts = [], k, t, d;
    for (k = 0; (t = endGood - k * step) >= start; k++) {
      d = Math.max(0.3, r1(cur - drift * (k / (n - 1)) + (k ? 0.2 * Math.sin(k * 1.9) : 0)));
      pts.unshift({ t: t, depth: d, distance: r1(CFG.datum - d), invalid: false });
    }
    if (v.kind === 'fault') for (k = 3; k >= 1; k--) pts.push({ t: CFG.asOf - k * 60000, depth: null, distance: 999.0, invalid: true });
    return { points: pts, start: start, end: CFG.asOf };
  }

  /* Measurement log: up to bufferRecords rows, newest first, 1 per minute. */
  function rows(v) {
    if (!hasHistory(v)) return [];
    var out = [], last = v.kind === 'fault' ? CFG.asOf - 4 * 60000 : v.observedAt, cur = baseDepth(v), slope = (v.trend15 || 0.8) / 15, k, d, flag, bad;
    if (v.kind === 'fault') {
      for (k = 3; k >= 0; k--) out.push({ t: CFG.asOf - (k === 0 ? 2 : k * 60) * 1000, depth: null, distance: 999.0, snr: null, rssi: null, flag: 'Echo timeout', state: 'fault', obs: 8912 - 3 + (3 - k) });
      out.reverse(); // newest first
    }
    for (k = 0; out.length < CFG.bufferRecords; k++) {
      d = Math.max(0.3, r1(cur - slope * k + (k ? 0.15 * Math.sin(k * 1.3) : 0)));
      flag = k === 0 ? 'Range check passed' : k % 3 === 0 ? 'Filter passed' : 'Rate-of-rise OK';
      out.push({ t: last - k * 60000, depth: d, distance: r1(CFG.datum - d), snr: r1(96 + ((k * 7) % 38) / 10), rssi: -63 - ((k * 5) % 4), flag: flag, state: thresholdOf(d), obs: 8912 - 4 - k });
    }
    return out;
  }

  w.SBData = { CFG: CFG, STATIONS: STATIONS, SCENARIOS: SCENARIOS, RANGES: RANGES, view: view, series: series, rows: rows, hasHistory: hasHistory,
    stationById: stationById, scenarioByKey: scenarioByKey, hms: hms, hm: hm, ageText: ageText, r1: r1, thresholdOf: thresholdOf };
})(window);
