/*
 * Hero animation: particle cloud and a silver atom (Ag).
 * OrbitField.mount(host, { pointerTarget, hitTarget }) -> { kick, collapse }
 * Colours: --of-dim, --of-bright, --of-bg
 */
(function () {
  'use strict';

  var TAU = Math.PI * 2;
  var TILTS = [-28, 34, 97];
  // Ag: 2, 8, 18, 18, 1
  var SHELLS = [
    { r: 0.105, inc: 1.2, node: 0.2, n: 2, speed: 2.6 },
    { r: 0.16, inc: -0.7, node: 1.4, n: 8, speed: -1.9 },
    { r: 0.225, inc: 0.45, node: 2.6, n: 18, speed: 1.35 },
    { r: 0.29, inc: -1.05, node: -0.6, n: 18, speed: -1.0 },
    { r: 0.375, inc: 0.22, node: -1.4, n: 1, speed: 0.7, lone: true }
  ];
  var DIAL = 0.44;

  function rgb(str, fallback) {
    var m = /#?([0-9a-f]{6})/i.exec(str || '');
    if (!m) return fallback;
    var n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function css(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function seeded(seed) {
    var s = seed >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  function rotX(p, a) { var c = Math.cos(a), s = Math.sin(a); return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c]; }
  function rotY(p, a) { var c = Math.cos(a), s = Math.sin(a); return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c]; }
  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  function mount(host, opts) {
    opts = opts || {};
    var back = document.createElement('canvas'), front = document.createElement('canvas');
    back.className = 'of-canvas'; front.className = 'of-canvas';
    host.appendChild(back); host.appendChild(front);
    var bctx = back.getContext('2d'), fctx = front.getContext('2d');
    if (!bctx || !fctx) return null;

    var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var rand = seeded(333);
    var w = 0, h = 0, dpr = 1, cx = 0, cy = 0, scale = 1;
    var dim, bright, bg;

    // cloud
    var N = 0, a, b, ct, st, phase, speed, size, shade;
    function buildCloud() {
      N = Math.round(Math.min(1200, Math.max(450, (w * h) / 300)));
      a = new Float32Array(N); b = new Float32Array(N); ct = new Float32Array(N); st = new Float32Array(N);
      phase = new Float32Array(N); speed = new Float32Array(N); size = new Float32Array(N); shade = new Float32Array(N);
      for (var i = 0; i < N; i++) {
        var semi = 0.5 + Math.pow(rand(), 0.9) * 0.75;
        var t = (TILTS[i % 3] + (rand() - 0.5) * 9) * Math.PI / 180;
        a[i] = semi; b[i] = semi * (0.18 + rand() * 0.16);
        ct[i] = Math.cos(t); st[i] = Math.sin(t);
        phase[i] = rand() * TAU;
        speed[i] = (0.2 / Math.pow(semi, 1.5)) * (rand() < 0.5 ? 1 : -1) * (0.8 + rand() * 0.4);
        size[i] = rand() < 0.06 ? 1.6 : 0.6 + rand() * 0.6;
        shade[i] = 0.3 + rand() * 0.7;
      }
    }

    // nucleus (47 p : 61 n)
    var nucleons = [];
    (function () {
      var count = 46, golden = Math.PI * (3 - Math.sqrt(5));
      for (var i = 0; i < count; i++) {
        var y = 1 - (i / (count - 1)) * 2, rr = Math.sqrt(1 - y * y), th = golden * i;
        var depth = 0.35 + Math.cbrt(rand()) * 0.65;
        nucleons.push({ p: [Math.cos(th) * rr * depth, y * depth, Math.sin(th) * rr * depth], proton: rand() < 47 / 108 });
      }
    })();

    // state
    var pointer = { x: 0, y: 0, on: 0, target: 0 };
    var view = { yaw: 0.6, pitch: 0.42, tiltX: 0, tiltY: 0 };
    var spin = 0, spinBoost = 0, clock = 0;
    var pulses = [];
    var collapseT = 1;
    var raf = 0, last = 0, running = false, onScreen = true;

    function colours() {
      var cs = getComputedStyle(host);
      dim = rgb(cs.getPropertyValue('--of-dim'), [110, 110, 120]);
      bright = rgb(cs.getPropertyValue('--of-bright'), [241, 241, 239]);
      bg = rgb(cs.getPropertyValue('--of-bg'), [5, 5, 6]);
      brightS = css(bright, 1); dimS = css(dim, 1);
      buildSprites();
    }

    // sprites
    var sprites = {}, brightS, dimS;
    function sphere(stops) {
      var c = document.createElement('canvas'); c.width = c.height = 64;
      var g = c.getContext('2d'), gr = g.createRadialGradient(20, 19, 3, 32, 32, 32);
      stops.forEach(function (st) { gr.addColorStop(st[0], st[1]); });
      g.fillStyle = gr; g.beginPath(); g.arc(32, 32, 32, 0, TAU); g.fill();
      return c;
    }
    function buildSprites() {
      var c = document.createElement('canvas'); c.width = c.height = 64;
      var g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, css(bright, 1)); gr.addColorStop(0.3, css(bright, 1)); gr.addColorStop(0.33, css(bright, 0.4));
      gr.addColorStop(0.5, css(bright, 0.18)); gr.addColorStop(1, css(bright, 0));
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
      sprites.electron = c;
      sprites.proton = sphere([[0, '#ffffff'], [0.55, '#c9c9d1'], [1, '#4b4b55']]);
      sprites.neutron = sphere([[0, '#d7d7de'], [0.55, '#7d7d88'], [1, '#22222a']]);
    }

    function resize() {
      var rect = host.getBoundingClientRect();
      var nw = Math.max(1, rect.width), nh = Math.max(1, rect.height);
      var d = Math.min(window.devicePixelRatio || 1, 2);
      if (nw === w && nh === h && d === dpr) return;
      var first = !w;
      w = nw; h = nh; dpr = d;
      [back, front].forEach(function (c) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); });
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0); fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = w / 2; cy = h / 2;
      scale = Math.min(w, h) * 0.56;
      if (first) buildCloud();
      if (opts.hitTarget) {
        var d2 = Math.round(scale * DIAL * 2);
        opts.hitTarget.style.width = d2 + 'px';
        opts.hitTarget.style.height = d2 + 'px';
      }
      bctx.fillStyle = css(bg, 1); bctx.fillRect(0, 0, w, h);
      frameDraw(0, true);
    }

    // collapse curve, t in 0..1 over 3.4 s
    function squeezeAt(t) {
      if (t >= 1) return 1;
      if (t < 0.4) return 1 - ease(t / 0.4) * 0.97;
      if (t < 0.62) return 0.03;
      return 0.03 + ease((t - 0.62) / 0.38) * 0.97;
    }
    function coreAt(t) {
      if (t >= 1) return 1;
      if (t < 0.4) return 1 + 0.25 * (t / 0.4);
      if (t < 0.48) return 1.25 - 0.85 * ((t - 0.4) / 0.08);
      if (t < 0.56) return 0.4 + 1.6 * ((t - 0.48) / 0.08);
      if (t < 0.75) return 2 - ((t - 0.56) / 0.19);
      return 1;
    }

    function drawCloud(dt, clear, squeeze) {
      bctx.globalCompositeOperation = 'source-over';
      bctx.fillStyle = css(bg, clear ? 1 : 0.075);
      bctx.fillRect(0, 0, w, h);
      bctx.globalCompositeOperation = 'lighter';
      var lens = 70, boost = squeeze < 1 ? 1 + (1 - squeeze) * 4 : 1;
      for (var i = 0; i < N; i++) {
        phase[i] += speed[i] * dt * boost;
        var cp = Math.cos(phase[i]), sp = Math.sin(phase[i]);
        var ex = a[i] * cp * scale * squeeze, ey = b[i] * sp * scale * squeeze;
        var x = cx + ex * ct[i] - ey * st[i], y = cy + ex * st[i] + ey * ct[i];
        var isFront = sp > 0;
        var alpha = shade[i] * (isFront ? 0.5 : 0.16);
        if (pointer.on > 0.01) {
          var dx = x - pointer.x, dy = y - pointer.y, d2 = dx * dx + dy * dy;
          if (d2 < lens * lens * 4) {
            var dd = Math.sqrt(d2) + 0.001, f = Math.max(0, 1 - dd / (lens * 2)), push = f * f * lens * 0.7 * pointer.on;
            x += dx / dd * push; y += dy / dd * push;
            alpha = Math.min(1, alpha + f * 0.5 * pointer.on);
          }
        }
        for (var q = 0; q < pulses.length; q++) {
          var pl = pulses[q], px = x - pl.x, py = y - pl.y, pd = Math.sqrt(px * px + py * py) + 0.001;
          var band = 1 - Math.abs(pd - pl.r) / 40;
          if (band > 0) { var kick = band * 18 * pl.life; x += px / pd * kick; y += py / pd * kick; alpha = Math.min(1, alpha + band * 0.6 * pl.life); }
        }
        bctx.fillStyle = isFront ? brightS : dimS;
        bctx.globalAlpha = alpha;
        var s = size[i];
        bctx.fillRect(x - s / 2, y - s / 2, s, s);
      }
      bctx.globalAlpha = 1;
    }

    // 3d -> 2d
    function project(p) {
      var q = rotY(p, view.yaw + view.tiltY);
      q = rotX(q, view.pitch + view.tiltX);
      var persp = 2.6 / (2.6 + q[2]);
      return { x: cx + q[0] * scale * persp, y: cy + q[1] * scale * persp, z: q[2], k: persp };
    }
    function shellPoint(sh, theta, rad) {
      var p = [Math.cos(theta) * rad, 0, Math.sin(theta) * rad];
      p = rotX(p, sh.inc);
      return rotY(p, sh.node);
    }

    function drawAtom(squeeze, core) {
      fctx.clearRect(0, 0, w, h);
      var i, j;

      // dial
      var R = DIAL * scale;
      fctx.lineWidth = 1;
      fctx.strokeStyle = css(dim, 0.85);
      fctx.beginPath(); fctx.arc(cx, cy, R, 0, TAU); fctx.stroke();
      for (var pass = 0; pass < 2; pass++) {
        fctx.beginPath();
        for (i = 0; i < 72; i++) {
          var major = i % 18 === 0;
          if (major !== (pass === 1)) continue;
          var ang = (i / 72) * TAU, r1 = R + 3, r2 = R + (major ? 13 : 6);
          fctx.moveTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1);
          fctx.lineTo(cx + Math.cos(ang) * r2, cy + Math.sin(ang) * r2);
        }
        fctx.strokeStyle = pass ? brightS : dimS;
        fctx.globalAlpha = pass ? 0.95 : 0.55;
        fctx.lineWidth = pass ? 1.4 : 0.8;
        fctx.stroke();
      }
      fctx.globalAlpha = 1;

      var rings = [], electrons = [];
      for (i = 0; i < SHELLS.length; i++) {
        var sh = SHELLS[i], rad = sh.r * squeeze, pts = [];
        for (j = 0; j <= 96; j++) pts.push(project(shellPoint(sh, (j / 96) * TAU, rad)));
        rings.push({ pts: pts, width: sh.lone ? 1.4 : 0.8, alpha: sh.lone ? 1 : 0.7 });
        for (j = 0; j < sh.n; j++) {
          var th = clock * sh.speed + (j / sh.n) * TAU + i;
          var ep = project(shellPoint(sh, th, rad)); ep.lone = !!sh.lone; electrons.push(ep);
        }
      }
      function strokeRings(wantFront) {
        fctx.strokeStyle = brightS;
        for (var r = 0; r < rings.length; r++) {
          var pts = rings[r].pts, open = false;
          fctx.lineWidth = rings[r].width;
          fctx.globalAlpha = (wantFront ? 0.75 : 0.22) * rings[r].alpha;
          fctx.beginPath();
          for (var k = 0; k < pts.length - 1; k++) {
            var isFront = (pts[k].z + pts[k + 1].z) / 2 < 0;
            if (isFront !== wantFront) { open = false; continue; }
            if (!open) { fctx.moveTo(pts[k].x, pts[k].y); open = true; }
            fctx.lineTo(pts[k + 1].x, pts[k + 1].y);
          }
          fctx.stroke();
        }
        fctx.globalAlpha = 1;
      }
      function drawElectrons(wantFront) {
        for (var e = 0; e < electrons.length; e++) {
          var p = electrons[e], isFront = p.z < 0;
          if (isFront !== wantFront) continue;
          var r = (p.lone ? (isFront ? 5 : 3.8) : (isFront ? 2.1 : 1.5)) * p.k * 3.2;
          fctx.globalAlpha = isFront ? 1 : 0.5;
          fctx.drawImage(sprites.electron, p.x - r, p.y - r, r * 2, r * 2);
        }
        fctx.globalAlpha = 1;
      }
      strokeRings(false);
      drawElectrons(false);

      // nucleus, back to front
      var Rn = 0.06 * scale * core, rs = 0.024 * scale * core, list = [];
      for (i = 0; i < nucleons.length; i++) {
        var n = rotY(rotX(nucleons[i].p, spin * 0.7), spin);
        var pr = project([n[0] * Rn / scale, n[1] * Rn / scale, n[2] * Rn / scale]);
        list.push({ x: pr.x, y: pr.y, z: pr.z, k: pr.k, proton: nucleons[i].proton });
      }
      list.sort(function (p, q) { return q.z - p.z; });
      for (i = 0; i < list.length; i++) {
        var nn = list[i], r0 = rs * nn.k;
        fctx.drawImage(nn.proton ? sprites.proton : sprites.neutron, nn.x - r0, nn.y - r0, r0 * 2, r0 * 2);
      }

      strokeRings(true);
      drawElectrons(true);

      // collapse flash
      if (collapseT < 1 && collapseT > 0.46) {
        var ft = (collapseT - 0.46) / 0.4;
        if (ft < 1) {
          var glow = fctx.createRadialGradient(cx, cy, 0, cx, cy, scale * 0.5);
          glow.addColorStop(0, css(bright, 0.55 * (1 - ft)));
          glow.addColorStop(1, css(bright, 0));
          fctx.fillStyle = glow; fctx.fillRect(0, 0, w, h);
          fctx.strokeStyle = css(bright, 0.7 * (1 - ft)); fctx.lineWidth = 1.5;
          fctx.beginPath(); fctx.arc(cx, cy, 10 + ft * scale * 1.1, 0, TAU); fctx.stroke();
        }
      }
    }

    function frameDraw(dt, clear) {
      pointer.on += (pointer.target - pointer.on) * Math.min(1, dt * 6);
      if (collapseT < 1) collapseT = Math.min(1, collapseT + dt / 3.4);
      var squeeze = squeezeAt(collapseT), core = coreAt(collapseT);
      for (var p = pulses.length - 1; p >= 0; p--) {
        pulses[p].r += dt * 520; pulses[p].life -= dt * 0.9;
        if (pulses[p].life <= 0) pulses.splice(p, 1);
      }
      var tx = pointer.on * ((pointer.y - cy) / h) * 0.6, ty = pointer.on * ((pointer.x - cx) / w) * 0.9;
      view.tiltX += (tx - view.tiltX) * Math.min(1, dt * 3);
      view.tiltY += (ty - view.tiltY) * Math.min(1, dt * 3);
      spinBoost *= Math.pow(0.25, dt);
      var turn = (1 + spinBoost) * (collapseT < 1 ? 1 + (1 - squeeze) * 5 : 1);
      view.yaw += dt * 0.12 * turn;
      spin += dt * 0.35 * turn;
      clock += dt * turn;
      drawCloud(dt, clear, squeeze);
      drawAtom(squeeze, core);
    }

    function frame(now) {
      if (!running) return;
      var dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      frameDraw(dt, false);
      raf = requestAnimationFrame(frame);
    }
    function start() { if (running || reduced) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
    function stop() { running = false; cancelAnimationFrame(raf); }
    function sync() { if (document.hidden || !onScreen) stop(); else start(); }

    colours();
    resize();
    if (reduced) { for (var s = 0; s < 4; s++) frameDraw(0.4, s === 0); }
    new ResizeObserver(resize).observe(host);

    var target = opts.pointerTarget || host;
    function local(e) { var r = host.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    target.addEventListener('pointermove', function (e) { var p = local(e); pointer.x = p.x; pointer.y = p.y; pointer.target = 1; }, { passive: true });
    target.addEventListener('pointerleave', function () { pointer.target = 0; });
    target.addEventListener('pointerdown', function (e) {
      if (reduced) return;
      var p = local(e);
      if (pulses.length < 6) pulses.push({ x: p.x, y: p.y, r: 0, life: 1 });
    }, { passive: true });
    document.addEventListener('visibilitychange', sync);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { onScreen = en[0].isIntersecting; sync(); }).observe(host);
    }
    start();

    return {
      kick: function () { spinBoost = Math.min(6, spinBoost + 1.5); },
      collapse: function () { if (!reduced) collapseT = 0; }
    };
  }

  window.OrbitField = { mount: mount };
})();
