// Hero des "Becken"-Designs: interaktive Bahnenleinen.
//
// Jede Leine ist eine Kette von Schwimmkörpern, die über eine einfache
// Wellengleichung gekoppelt sind. Die Maus drückt die Leinen weg, ein Klick
// erzeugt einen Stoss samt Ringwelle – die Wellen laufen dann der Leine
// entlang aus. Canvas 2D, keine Bibliothek.

(function () {
  "use strict";

  const TAU = Math.PI * 2;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const ABSTAND = 34;      // Pixel zwischen zwei Schwimmkörpern
  const RADIUS = 13;
  const DREH_STUFEN = 8;   // vorgerenderte Drehphasen je Farbe
  const KOPPLUNG = 0.26;   // wie stark Nachbarn aneinander ziehen
  const DAEMPFUNG = 0.976;
  const RUECKSTELLUNG = 0.010;

  const pool = {
    canvas: null,
    ctx: null,
    leinen: [],
    ringe: [],
    frame: 0,
    zeit: 0,
    breite: 0,
    hoehe: 0,
    sichtbar: true,
    observer: null,
    listeners: [],
    zeiger: { x: -999, y: -999, vorX: -999, vorY: -999, aktiv: false },
    sprites: null,
    dpr: 1
  };

  // Die Schwimmkörper werden einmal vorgezeichnet und danach nur noch kopiert.
  // Einzelne Kreise pro Bild wären bei mehreren hundert Körpern zu teuer.
  function spritesBauen(dpr) {
    const groesse = Math.ceil(RADIUS * 2 * dpr);
    const sprites = {};

    ["#1a6ea8", "#f2f7fa", "#d8443c"].forEach(farbe => {
      sprites[farbe] = [];
      for (let f = 0; f < DREH_STUFEN; f++) {
        const c = document.createElement("canvas");
        c.width = c.height = groesse;
        const g = c.getContext("2d");
        g.scale(dpr, dpr);

        g.fillStyle = farbe;
        g.beginPath();
        g.arc(RADIUS, RADIUS, RADIUS - 0.5, 0, TAU);
        g.fill();

        const winkel = (f / DREH_STUFEN) * TAU;
        g.fillStyle = "rgba(255,255,255,0.5)";
        g.beginPath();
        g.arc(
          RADIUS + Math.cos(winkel) * RADIUS * 0.34,
          RADIUS + Math.sin(winkel) * RADIUS * 0.34,
          RADIUS * 0.3, 0, TAU
        );
        g.fill();

        sprites[farbe].push(c);
      }
    });

    return sprites;
  }

  function on(target, type, handler, opts) {
    target.addEventListener(type, handler, opts);
    pool.listeners.push([target, type, handler, opts]);
  }

  /* ---------- Aufbau ---------- */

  function initPool() {
    const mount = document.getElementById("hero-bg");
    if (!mount || pool.canvas) return;

    const canvas = document.createElement("canvas");
    canvas.className = "pool-canvas";
    mount.appendChild(canvas);

    pool.canvas = canvas;
    pool.ctx = canvas.getContext("2d");

    groesseAnpassen();
    on(window, "resize", groesseAnpassen);
    on(window, "pointermove", zeigerBewegt, { passive: true });
    on(window, "pointerdown", zeigerGedrueckt);
    on(window, "pointerleave", () => { pool.zeiger.aktiv = false; });

    const hero = document.querySelector(".hero");
    if (hero && "IntersectionObserver" in window) {
      pool.observer = new IntersectionObserver(entries => {
        pool.sichtbar = entries[0].isIntersecting;
        if (pool.sichtbar && !pool.frame && !prefersReducedMotion) schleife();
      }, { threshold: 0 });
      pool.observer.observe(hero);
    }

    on(document, "visibilitychange", () => {
      if (!document.hidden && pool.sichtbar && !pool.frame && !prefersReducedMotion) schleife();
    });

    if (prefersReducedMotion) zeichnen();
    else schleife();
  }

  function groesseAnpassen() {
    if (!pool.canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    const hero = document.querySelector(".hero");
    const breite = hero ? hero.clientWidth : window.innerWidth;
    const hoehe = hero ? hero.clientHeight : window.innerHeight;

    pool.breite = breite;
    pool.hoehe = hoehe;
    pool.canvas.width = Math.floor(breite * dpr);
    pool.canvas.height = Math.floor(hoehe * dpr);
    pool.canvas.style.width = breite + "px";
    pool.canvas.style.height = hoehe + "px";
    pool.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (pool.dpr !== dpr || !pool.sprites) {
      pool.sprites = spritesBauen(dpr);
      pool.dpr = dpr;
    }

    leinenBauen();
  }

  function leinenBauen() {
    // Die Leinen lassen die Mitte frei – der Betrachter schaut in Linos Bahn,
    // und das Logo liegt ungestört darin.
    const hoehen = pool.hoehe < 620
      ? [0.13, 0.87]
      : [0.10, 0.25, 0.75, 0.90];

    const punkte = Math.max(12, Math.round(pool.breite / ABSTAND));

    // Auslenkungen der alten Leinen möglichst übernehmen (kein Sprung beim Resize)
    const alt = pool.leinen;
    pool.leinen = [];

    hoehen.forEach((anteil, r) => {
      const vorher = alt[r];
      const pts = [];
      for (let i = 0; i < punkte; i++) {
        const quelle = vorher && vorher.pts[Math.round(i / punkte * vorher.pts.length)];
        pts.push({ y: quelle ? quelle.y : 0, v: 0 });
      }
      pool.leinen.push({
        basisY: pool.hoehe * anteil,
        pts,
        n: punkte,
        bahn: r + 1
      });
    });
  }

  /* ---------- Interaktion ---------- */

  function heroKoordinaten(event) {
    const rect = pool.canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function zeigerBewegt(event) {
    if (!pool.canvas) return;
    const p = heroKoordinaten(event);
    pool.zeiger.vorX = pool.zeiger.aktiv ? pool.zeiger.x : p.x;
    pool.zeiger.vorY = pool.zeiger.aktiv ? pool.zeiger.y : p.y;
    pool.zeiger.x = p.x;
    pool.zeiger.y = p.y;
    pool.zeiger.aktiv = p.y >= 0 && p.y <= pool.hoehe;
  }

  function zeigerGedrueckt(event) {
    if (!pool.canvas) return;
    const p = heroKoordinaten(event);
    if (p.y < 0 || p.y > pool.hoehe) return;

    pool.ringe.push({ x: p.x, y: p.y, r: 4, alpha: 0.5 });

    pool.leinen.forEach(leine => {
      const abstand = p.y - leine.basisY;
      const einfluss = Math.exp(-(abstand * abstand) / (2 * 175 * 175));
      if (einfluss < 0.02) return;
      const schritt = pool.breite / (leine.n - 1);
      const mitte = Math.round(p.x / schritt);
      const weite = 7;
      for (let i = Math.max(0, mitte - weite); i <= Math.min(leine.n - 1, mitte + weite); i++) {
        const abfall = 1 - Math.abs(i - mitte) / (weite + 1);
        leine.pts[i].v += Math.sign(abstand || 1) * einfluss * abfall * 9;
      }
    });
  }

  function zeigerKraft() {
    const z = pool.zeiger;
    if (!z.aktiv) return;

    const tempo = Math.min(Math.hypot(z.x - z.vorX, z.y - z.vorY), 45);

    pool.leinen.forEach(leine => {
      const abstand = z.y - leine.basisY;
      const einfluss = Math.exp(-(abstand * abstand) / (2 * 105 * 105));
      if (einfluss < 0.015) return;

      const schritt = pool.breite / (leine.n - 1);
      const mitte = Math.round(z.x / schritt);
      const weite = 5;
      for (let i = Math.max(0, mitte - weite); i <= Math.min(leine.n - 1, mitte + weite); i++) {
        const abfall = 1 - Math.abs(i - mitte) / (weite + 1);
        leine.pts[i].v += Math.sign(abstand || 1) * einfluss * abfall * (0.35 + tempo * 0.06);
      }
    });

    z.vorX = z.x;
    z.vorY = z.y;
  }

  /* ---------- Simulation ---------- */

  function rechnen() {
    zeigerKraft();

    pool.leinen.forEach(leine => {
      const p = leine.pts;
      const n = leine.n;
      for (let i = 0; i < n; i++) {
        // Enden sind fest verankert (wie an der Beckenwand)
        if (i === 0 || i === n - 1) { p[i].y = 0; p[i].v = 0; continue; }
        const beschleunigung = KOPPLUNG * (p[i - 1].y + p[i + 1].y - 2 * p[i].y) - RUECKSTELLUNG * p[i].y;
        p[i].v = (p[i].v + beschleunigung) * DAEMPFUNG;
      }
      for (let i = 1; i < n - 1; i++) p[i].y += p[i].v;
    });

    pool.ringe = pool.ringe.filter(ring => {
      ring.r += 6;
      ring.alpha *= 0.94;
      return ring.alpha > 0.01 && ring.r < Math.max(pool.breite, pool.hoehe);
    });
  }

  /* ---------- Zeichnen ---------- */

  // Wettkampf-Leinen sind überwiegend blau, mit weissen Körpern als Taktung
  // und einer kurzen roten Markierung wie bei der 15-Meter-Marke.
  function farbe(i, n) {
    const anteil = i / (n - 1);
    if (Math.abs(anteil - 0.12) < 0.035 || Math.abs(anteil - 0.88) < 0.035) return "#d8443c";
    if (i % 4 === 0) return "#f2f7fa";
    return "#1a6ea8";
  }

  function zeichnen() {
    const ctx = pool.ctx;
    if (!ctx) return;

    ctx.clearRect(0, 0, pool.breite, pool.hoehe);

    // Ringwellen vom Klick
    pool.ringe.forEach(ring => {
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.r, 0, TAU);
      ctx.strokeStyle = `rgba(255,255,255,${ring.alpha})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    pool.leinen.forEach(leine => {
      const schritt = pool.breite / (leine.n - 1);

      // Schatten der Leine auf dem Beckenboden
      ctx.beginPath();
      for (let i = 0; i < leine.n; i++) {
        const x = i * schritt;
        const y = leine.basisY + leine.pts[i].y + 14;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.strokeStyle = "rgba(4, 40, 66, 0.10)";
      ctx.lineWidth = 9;
      ctx.stroke();

      // Stahlseil
      ctx.beginPath();
      for (let i = 0; i < leine.n; i++) {
        const x = i * schritt;
        const y = leine.basisY + leine.pts[i].y;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.strokeStyle = "rgba(6, 45, 72, 0.30)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Schwimmkörper: vorgezeichnete Sprites, nur noch kopieren.
      // Die Drehphase wandert mit der Zeit – die Körper drehen sich im Wasser.
      for (let i = 0; i < leine.n; i++) {
        const x = i * schritt;
        const y = leine.basisY + leine.pts[i].y;
        const phasen = pool.sprites[farbe(i, leine.n)];
        const stufe = (Math.floor(pool.zeit * 3 + i * 1.7) % DREH_STUFEN + DREH_STUFEN) % DREH_STUFEN;
        ctx.drawImage(phasen[stufe], x - RADIUS, y - RADIUS, RADIUS * 2, RADIUS * 2);
      }
    });
  }

  function schleife() {
    pool.zeit += 0.016;
    rechnen();
    zeichnen();
    pool.frame = (pool.sichtbar && !document.hidden && !prefersReducedMotion)
      ? requestAnimationFrame(schleife)
      : 0;
  }

  function destroyPool() {
    if (pool.frame) cancelAnimationFrame(pool.frame);
    pool.frame = 0;

    pool.listeners.forEach(([target, type, handler, opts]) => {
      target.removeEventListener(type, handler, opts);
    });
    pool.listeners = [];

    if (pool.observer) { pool.observer.disconnect(); pool.observer = null; }
    if (pool.canvas && pool.canvas.parentNode) pool.canvas.parentNode.removeChild(pool.canvas);

    pool.canvas = null;
    pool.ctx = null;
    pool.leinen = [];
    pool.ringe = [];
  }

  window.LinoPoolHero = { init: initPool, destroy: destroyPool };
})();
