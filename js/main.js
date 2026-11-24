(function () {
  'use strict';
  var doc = document, root = doc.documentElement, body = doc.body;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover)').matches;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };

  /* ---------- THEME ---------- */
  var themeBtn = $('#themeBtn'), meta = $('meta[name="theme-color"]');
  function setTheme(t, save) {
    root.setAttribute('data-theme', t);
    if (meta) meta.setAttribute('content', t === 'night' ? '#000000' : '#dde1e9');
    themeBtn.setAttribute('aria-label', t === 'night' ? 'Switch to day theme' : 'Switch to night theme');
    if (save) { try { localStorage.setItem('bhathvik-theme', t); } catch (e) {} }
    fxColor();
  }
  var saved = null;
  try { saved = localStorage.getItem('bhathvik-theme'); } catch (e) {}
  themeBtn.addEventListener('click', function () {
    setTheme(root.getAttribute('data-theme') === 'night' ? 'day' : 'night', true);
  });

  /* ---------- SPLASH: "Welcome to my portfolio" is written out ---------- */
  var intro = $('#intro'), introDone = false;
  function endIntro() {
    if (introDone) return;
    introDone = true;
    intro.classList.add('done');
    body.classList.remove('intro-lock');
    setTimeout(function () { body.classList.add('ready'); startTyping(); }, 350);
    setTimeout(function () { intro.style.display = 'none'; }, 1200);
  }
  $('#skip').addEventListener('click', endIntro);
  setTimeout(endIntro, reduce ? 900 : 5600);

  /* ---------- HERO TYPING ---------- */
  var typedEl = $('#typed'), typingStarted = false, fullName = 'Kommuri Bhathvik Sri';
  function startTyping() {
    if (typingStarted) return; typingStarted = true;
    if (reduce) { typedEl.textContent = fullName; return; }
    var i = 0;
    (function tick() {
      typedEl.textContent = fullName.slice(0, ++i);
      if (i < fullName.length) setTimeout(tick, 85 + Math.random() * 70);
    })();
  }

  /* ---------- NAV (zoom in + 50% background blur while pointer is on it) ---------- */
  var nav = $('#nav'), links = $('#navLinks'), menuBtn = $('#menuBtn');
  function navFocus(on) { body.classList.toggle('nav-focus', on); }
  function closeMenu() { links.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); navFocus(false); }
  nav.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') navFocus(true); });
  nav.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse' && !links.classList.contains('open')) navFocus(false); });
  nav.addEventListener('focusin', function () { navFocus(true); });
  nav.addEventListener('focusout', function (e) { if (!nav.contains(e.relatedTarget) && !nav.matches(':hover') && !links.classList.contains('open')) navFocus(false); });
  menuBtn.addEventListener('click', function () {
    var open = links.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open);
    navFocus(open);
  });
  $$('a', links).forEach(function (a) { a.addEventListener('click', closeMenu); });
  doc.addEventListener('click', function (e) { if (!nav.contains(e.target) && links.classList.contains('open')) closeMenu(); });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  var navLinkEls = $$('a', links);
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting) navLinkEls.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section').forEach(function (s) { spy.observe(s); });

    var rv = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); rv.unobserve(en.target); } });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    $$('.reveal').forEach(function (el) { rv.observe(el); });
  } else {
    $$('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- PROJECTS: scroll = next card, with 3D page-turn transition ---------- */
  var stack = $('#stack'), cards = $$('.pcard'), dotsEl = $('#stackDots'), N = cards.length, dots = [], activeIdx = -1;
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function stackTop() { return stack.getBoundingClientRect().top + (window.scrollY || 0); }
  function stackTotal() { return Math.max(1, stack.offsetHeight - innerHeight); }
  if (reduce) { stack.classList.add('static'); }
  else {
    cards.forEach(function (c, i) {
      var b = doc.createElement('button');
      b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-label', 'Project ' + (i + 1) + ' of ' + N);
      b.addEventListener('click', function () {
        window.scrollTo({ top: stackTop() + (i / (N - 1)) * stackTotal(), behavior: 'smooth' });
      });
      dotsEl.appendChild(b); dots.push(b);
    });
  }
  function updateStack() {
    if (reduce) return;
    var r = stack.getBoundingClientRect();
    var prog = clamp(-r.top / stackTotal(), 0, 1), p = prog * (N - 1);
    var H = $('#stage').offsetHeight;
    cards.forEach(function (c, i) {
      var d = i - p, t = Math.min(1, Math.abs(d)), s = (i % 2) ? 1 : -1, y, sc, op, rx, ry, bl, z;
      if (d > 0) {            /* next card: flies up from below, turning flat */
        y = t * H * 1.15; rx = t * 24; ry = s * t * 26; sc = 1 - t * 0.12; op = 1 - t * t; bl = 0; z = 101 - Math.round(d * 20);
      } else {                /* current card: lifts away, shrinks and blurs */
        y = -t * 70; rx = -t * 10; ry = -s * t * 30; sc = 1 - t * 0.16; op = clamp(1 - t * 1.25, 0, 1); bl = t * 7; z = 100 - Math.round(t * 20);
      }
      c.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) scale(' + sc.toFixed(3) + ')';
      c.style.opacity = op.toFixed(3);
      c.style.filter = bl > 0.05 ? 'blur(' + bl.toFixed(1) + 'px)' : 'none';
      c.style.zIndex = z;
      var show = op > 0.02;
      c.style.visibility = show ? 'visible' : 'hidden';
      c.style.pointerEvents = Math.abs(d) < 0.5 ? 'auto' : 'none';
      c.setAttribute('aria-hidden', Math.abs(d) < 0.5 ? 'false' : 'true');
    });
    var idx = Math.round(p);
    if (idx !== activeIdx) {
      activeIdx = idx;
      dots.forEach(function (b, i) { b.classList.toggle('on', i === idx); b.setAttribute('aria-selected', i === idx); });
    }
  }

  /* ---------- SCROLL: progress, hero zoom-out, nav hide ---------- */
  var progress = $('#progress'), heroInner = $('#heroInner'), ironTilt = $('#ironTilt'), lastY = 0, ticking = false;
  var mx = 0, my = 0;
  function onScroll() {
    var y = window.scrollY || 0, h = Math.max(1, doc.documentElement.scrollHeight - innerHeight);
    progress.style.transform = 'scaleX(' + Math.min(1, y / h) + ')';
    var p = Math.min(1, y / (innerHeight * 0.8));
    if (!reduce) {
      heroInner.style.transform = 'translate3d(0,' + (p * -40) + 'px,0) scale(' + (1 - p * 0.12) + ')';
      heroInner.style.opacity = String(1 - p * 0.9);
      ironFade = 1 - p * 0.95;
    }
    if (y > lastY + 6 && y > 200 && !links.classList.contains('open') && !body.classList.contains('nav-focus')) nav.classList.add('hide');
    else if (y < lastY - 6 || y < 120) nav.classList.remove('hide');
    lastY = y; ticking = false;
    updateStack();
  }
  var ironFade = 1;
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener('resize', updateStack);

  /* ---------- CARD TILT + SPOTLIGHT ---------- */
  if (canHover && !reduce) {
    $$('.card').forEach(function (c) {
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.setProperty('--ry', ((x - 0.5) * 10).toFixed(2) + 'deg');
        c.style.setProperty('--rx', ((0.5 - y) * 8).toFixed(2) + 'deg');
        c.style.setProperty('--mx', (x * 100) + '%');
        c.style.setProperty('--my', (y * 100) + '%');
      });
      c.addEventListener('pointerleave', function () { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
    });
  }

  /* ---------- CURSOR GLOW + ORB / IRON MAN / AVATAR PARALLAX ---------- */
  var glow = $('#cursorGlow'), orbs = $$('.orb'), av = $('.avatar-wrap'), gx = 0, gy = 0, tx = 0, ty = 0, avRX = 0, avRY = 0;
  window.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    tx = e.clientX; ty = e.clientY;
    mx = (e.clientX / innerWidth - 0.5); my = (e.clientY / innerHeight - 0.5);
    glow.style.opacity = '1';
    if (canHover && !reduce && av) {
      var r = av.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      avRY = clamp((e.clientX - cx) / 500, -1, 1) * 16; avRX = -clamp((e.clientY - cy) / 500, -1, 1) * 16;
    }
  }, { passive: true });
  (function glowLoop() {
    gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12;
    glow.style.transform = 'translate3d(' + gx + 'px,' + gy + 'px,0)';
    if (!reduce) {
      orbs.forEach(function (o, i) { var k = (i + 1) * 22; o.style.transform = 'translate3d(' + (mx * k) + 'px,' + (my * k) + 'px,0)'; });
      ironTilt.style.transform = 'translate3d(' + (-mx * 22) + 'px,' + (-my * 16) + 'px,0) rotate(' + (mx * 5) + 'deg)';
      ironTilt.style.opacity = String(Math.max(0, ironFade));
      if (av) av.style.transform = 'perspective(700px) rotateY(' + avRY.toFixed(2) + 'deg) rotateX(' + avRX.toFixed(2) + 'deg)';
    }
    requestAnimationFrame(glowLoop);
  })();

  /* ---------- PARTICLE FIELD (mouse move = repel, mouse drag = pull) ---------- */
  var cv = $('#fx'), ctx = cv.getContext('2d'), W, H, dpr, P = [], col = '255,205,80';
  var ptr = { x: -9999, y: -9999, down: false };
  function fxColor() { col = root.getAttribute('data-theme') === 'day' ? '47,86,232' : '255,205,80'; }
  function fxSize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.round(Math.min(120, (W * H) / 15000));
    P = [];
    for (var i = 0; i < n; i++) P.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35, r: Math.random() * 1.8 + .7 });
  }
  function burst(x, y) {
    P.forEach(function (p) {
      var dx = p.x - x, dy = p.y - y, d = Math.hypot(dx, dy) || 1;
      if (d < 220) { var f = (1 - d / 220) * 6; p.vx += dx / d * f; p.vy += dy / d * f; }
    });
  }
  window.addEventListener('pointerdown', function (e) {
    ptr.x = e.clientX; ptr.y = e.clientY;
    if (e.pointerType === 'mouse') ptr.down = true; else burst(e.clientX, e.clientY);
  });
  window.addEventListener('pointerup', function () { if (ptr.down) burst(ptr.x, ptr.y); ptr.down = false; });
  window.addEventListener('pointercancel', function () { ptr.down = false; });
  window.addEventListener('pointermove', function (e) { if (e.pointerType !== 'touch') { ptr.x = e.clientX; ptr.y = e.clientY; } }, { passive: true });
  window.addEventListener('pointerout', function (e) { if (!e.relatedTarget) { ptr.x = -9999; ptr.y = -9999; ptr.down = false; } });

  function fxFrame() {
    ctx.clearRect(0, 0, W, H);
    var i, j, a, b, dx, dy, d;
    for (i = 0; i < P.length; i++) {
      a = P[i];
      dx = a.x - ptr.x; dy = a.y - ptr.y; d = Math.hypot(dx, dy);
      if (d < 200) {
        if (ptr.down) { a.vx -= dx / d * 0.35; a.vy -= dy / d * 0.35; a.vx += -dy / d * 0.12; a.vy += dx / d * 0.12; }
        else { a.vx += dx / (d + 1) * 0.06; a.vy += dy / (d + 1) * 0.06; }
      }
      a.vx *= 0.985; a.vy *= 0.985;
      var sp = Math.hypot(a.vx, a.vy); if (sp < .12) { a.vx += (Math.random() - .5) * .02; a.vy += (Math.random() - .5) * .02; }
      a.x += a.vx; a.y += a.vy;
      if (a.x < -10) a.x = W + 10; else if (a.x > W + 10) a.x = -10;
      if (a.y < -10) a.y = H + 10; else if (a.y > H + 10) a.y = -10;
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 6.2832); ctx.fillStyle = 'rgba(' + col + ',.7)'; ctx.fill();
      for (j = i + 1; j < P.length; j++) {
        b = P[j]; dx = a.x - b.x; dy = a.y - b.y; d = dx * dx + dy * dy;
        if (d < 12100) { ctx.strokeStyle = 'rgba(' + col + ',' + (0.22 * (1 - d / 12100)) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      }
    }
    requestAnimationFrame(fxFrame);
  }
  fxColor(); fxSize();
  if (saved === 'day' || saved === 'night') setTheme(saved, false);
  if (reduce) { P.forEach(function (p) { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fillStyle = 'rgba(' + col + ',.5)'; ctx.fill(); }); }
  else { requestAnimationFrame(fxFrame); }

  /* ---------- SMOKE TRAIL (blue in day theme, warm gold at night) ---------- */
  var sm = $('#smoke'), sctx = sm.getContext('2d'), puffs = [], SC = 0.5, lastPX = null, lastPY = null;
  function smSize() { sm.width = Math.round(innerWidth * SC); sm.height = Math.round(innerHeight * SC); }
  smSize();
  window.addEventListener('resize', function () { smSize(); fxSize(); });
  function emit(x, y, dx, dy) {
    var day = root.getAttribute('data-theme') === 'day';
    var dist = Math.hypot(dx, dy), n = clamp(Math.round(1 + dist / 22), 1, 3);
    for (var k = 0; k < n; k++) {
      puffs.push({
        x: x + (Math.random() - .5) * 14, y: y + (Math.random() - .5) * 14,
        r: 30 + Math.random() * 36, life: 0, max: 100 + Math.random() * 70,
        vx: dx * 0.03 + (Math.random() - .5) * .6, vy: dy * 0.03 - 0.3 + (Math.random() - .5) * .5,
        ph: Math.random() * 6.28, a: day ? 0.28 : 0.14,
        c: day ? (Math.random() < .5 ? '25,65,235' : '70,130,255') : (Math.random() < .5 ? '255,196,70' : '255,150,50')
      });
    }
    if (puffs.length > 220) puffs.splice(0, puffs.length - 220);
  }
  window.addEventListener('pointermove', function (e) {
    if (reduce || introDone === false) return;
    if (e.pointerType === 'touch') return;
    if (lastPX === null) { lastPX = e.clientX; lastPY = e.clientY; return; }
    var dx = e.clientX - lastPX, dy = e.clientY - lastPY;
    if (Math.abs(dx) + Math.abs(dy) > 2) { emit(e.clientX, e.clientY, dx, dy); lastPX = e.clientX; lastPY = e.clientY; }
  }, { passive: true });
  window.addEventListener('pointerout', function (e) { if (!e.relatedTarget) { lastPX = lastPY = null; } });
  window.addEventListener('pointerdown', function (e) { if (!reduce && introDone) { for (var i = 0; i < 6; i++) emit(e.clientX, e.clientY, (Math.random() - .5) * 40, (Math.random() - .5) * 40); } });
  var smokeWasEmpty = true;
  function smokeFrame() {
    if (puffs.length || !smokeWasEmpty) {
      sctx.clearRect(0, 0, sm.width, sm.height);
      smokeWasEmpty = puffs.length === 0;
      for (var i = puffs.length - 1; i >= 0; i--) {
        var p = puffs[i]; p.life++;
        var k = p.life / p.max;
        if (k >= 1) { puffs.splice(i, 1); continue; }
        p.x += p.vx + Math.sin(p.ph + p.life * 0.05) * 0.35; p.y += p.vy; p.vx *= 0.985; p.vy *= 0.985;
        var al = p.a * (k < 0.18 ? k / 0.18 : (1 - k) / 0.82), rr = p.r * (1 + k * 1.7) * SC;
        var g = sctx.createRadialGradient(p.x * SC, p.y * SC, 0, p.x * SC, p.y * SC, rr);
        g.addColorStop(0, 'rgba(' + p.c + ',' + al + ')'); g.addColorStop(1, 'rgba(' + p.c + ',0)');
        sctx.fillStyle = g; sctx.beginPath(); sctx.arc(p.x * SC, p.y * SC, rr, 0, 6.2832); sctx.fill();
      }
    }
    requestAnimationFrame(smokeFrame);
  }
  if (!reduce) requestAnimationFrame(smokeFrame);

  /* ---------- MARQUEE (auto scroll + drag to scrub) ---------- */
  var mq = $('#marquee'), track = $('#marqueeTrack');
  Array.prototype.slice.call(track.children).forEach(function (n) { var c = n.cloneNode(true); c.setAttribute('aria-hidden', 'true'); track.appendChild(c); });
  var mxPos = 0, speed = reduce ? 0 : -0.7, dragging = false, lastX = 0, hovering = false, half = 0;
  function measure() { half = track.scrollWidth / 2; }
  window.addEventListener('load', measure); window.addEventListener('resize', measure); measure();
  mq.addEventListener('pointerdown', function (e) { dragging = true; lastX = e.clientX; try { mq.setPointerCapture(e.pointerId); } catch (x) {} });
  mq.addEventListener('pointermove', function (e) { if (dragging) { mxPos += e.clientX - lastX; lastX = e.clientX; } });
  ['pointerup', 'pointercancel'].forEach(function (ev) { mq.addEventListener(ev, function () { dragging = false; }); });
  mq.addEventListener('pointerenter', function () { hovering = true; });
  mq.addEventListener('pointerleave', function () { hovering = false; });
  (function mqLoop() {
    if (!dragging) mxPos += speed * (hovering ? 0.3 : 1);
    if (half) { if (mxPos <= -half) mxPos += half; if (mxPos > 0) mxPos -= half; }
    track.style.transform = 'translate3d(' + mxPos + 'px,0,0)';
    requestAnimationFrame(mqLoop);
  })();

  $('#year').textContent = new Date().getFullYear();
  onScroll();
})();
