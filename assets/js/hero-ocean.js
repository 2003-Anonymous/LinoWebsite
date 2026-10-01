// Hero des "Ozean"-Designs: animierte 3D-Wasseroberfläche in WebGL.
//
// Bewusst ohne 3D-Bibliothek: ein einziger Fragment-Shader zeichnet Himmel,
// Wellen, Spiegelung, Sonnenglitzern und Schaum. Ohne WebGL bleibt der
// CSS-Verlauf aus theme-ocean.css stehen.

(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* =========================================================
     Wasseroberfläche (WebGL)
     ========================================================= */

  const VERTEX_SHADER = `
    attribute vec2 aPos;
    void main() {
      gl_Position = vec4(aPos, 0.0, 1.0);
    }
  `;

  // OCTAVES wird vor dem Kompilieren je nach Gerät ersetzt (Performance).
  const FRAGMENT_SHADER = `
    precision highp float;

    uniform vec2  uResolution;
    uniform float uTime;
    uniform vec2  uMouse;   // -1 .. 1
    uniform float uScroll;  // 0 .. 1
    uniform vec3  uRipple;  // xy = Position auf dem Wasser, z = Startzeit (Klick)
    uniform vec3  uHover;   // xy = Position unter dem Zeiger, z = Stärke 0..1

    vec2 rot(vec2 v, float a) {
      float c = cos(a), s = sin(a);
      return vec2(v.x * c - v.y * s, v.x * s + v.y * c);
    }

    // ---- Wellen -----------------------------------------------------------
    // Summe gerichteter Wellen mit geschärften Kämmen. Jede Oktave verschiebt
    // die Koordinaten der nächsten ("Domain-Warp") – dadurch wirken die Wellen
    // unregelmässig statt wie ein gleichmässiges Sinusmuster.
    // "detail" blendet feine Oktaven in der Ferne aus, sonst flimmert es.
    float oceanHeight(vec2 p, float t, float detail) {
      vec2 origin = p;        // unverschobene Position, für Maus- und Klickeffekt
      float h = 0.0;
      float amp = 0.70;
      float freq = 0.17;
      float speed = 0.80;
      vec2 dir = normalize(vec2(0.92, 0.38));
      vec2 warp = vec2(0.0);

      for (int i = 0; i < OCTAVES; i++) {
        float fade = mix(1.0, detail, float(i) / float(OCTAVES));
        float s = sin(dot(p + warp, dir) * freq + t * speed);
        float crest = pow(0.5 + 0.5 * s, 2.6);      // spitze Kämme, flache Täler
        float layer = (crest - 0.34) * amp * fade;
        h += layer;
        warp += dir * layer * 3.0;
        dir = rot(dir, 2.39996323);                  // goldener Winkel: kein Raster
        amp *= 0.55;
        freq *= 1.95;
        speed *= 1.16;
      }

      // WICHTIG: ab hier "origin" verwenden, nicht "p" – p wurde im Loop
      // durch den Domain-Warp verschoben, der Effekt sässe sonst daneben.

      // Dauerhafte Kräuselung unter dem Zeiger. Sie folgt der Maus, statt
      // bei jeder Bewegung neu zu starten.
      if (uHover.z > 0.003) {
        float d = length(origin - uHover.xy);
        // Harte Begrenzung: ohne sie kräuselt der Effekt minimal die ganze
        // Fläche – im Glitzerpfad fällt das mehr auf als am Cursor selbst.
        float huelle = smoothstep(6.5, 0.0, d);
        h += sin(d * 3.0 - uTime * 6.0) * huelle * huelle * 0.46 * uHover.z * detail;
      }

      // Ringwelle vom Klick: eine Front, die nach aussen läuft und ausklingt
      float alter = uTime - uRipple.z;
      if (alter > 0.0 && alter < 4.0) {
        float d = length(origin - uRipple.xy);
        float front = alter * 5.0;
        float band = exp(-abs(d - front) * 0.85);     // schmale, laufende Front
        h += sin((d - front) * 2.6) * band * exp(-alter * 0.7) * 0.75 * detail;
      }

      return h;
    }

    // Gibt die Höhe gleich mit zurück (hOut). Sonst müsste sie danach ein
    // viertes Mal berechnet werden – das ist der teuerste Teil des Shaders.
    vec3 oceanNormal(vec2 p, float t, float eps, float detail, out float hOut) {
      float h  = oceanHeight(p, t, detail);
      float hx = oceanHeight(p + vec2(eps, 0.0), t, detail);
      float hz = oceanHeight(p + vec2(0.0, eps), t, detail);
      hOut = h;
      return normalize(vec3(h - hx, eps, h - hz));
    }

    // ---- Himmel -----------------------------------------------------------
    vec3 skyColor(vec3 rd, vec3 sunDir) {
      float y = max(rd.y, 0.0);
      vec3 zenith  = vec3(0.016, 0.062, 0.115);
      vec3 horizon = vec3(0.085, 0.215, 0.300);
      vec3 col = mix(horizon, zenith, pow(y, 0.50));

      float sd = max(dot(rd, sunDir), 0.0);
      col += vec3(1.00, 0.86, 0.66) * pow(sd, 900.0) * 3.2;   // Sonnenscheibe
      col += vec3(1.00, 0.80, 0.58) * pow(sd, 26.0) * 0.30;   // enger Hof
      col += vec3(0.80, 0.72, 0.62) * pow(sd, 4.0) * 0.09;    // weicher Schein
      col = mix(col, horizon * 1.06, exp(-y * 20.0) * 0.45);  // Dunst am Horizont
      return col;
    }

    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;

      vec3 sunDir = normalize(vec3(-0.34, 0.105, -1.0));

      // Kamera knapp über dem Wasser, taucht beim Scrollen ab
      vec3 ro = vec3(0.0, 1.55 + uScroll * 1.6, 8.0);
      vec3 ta = vec3(uMouse.x * 0.5, 0.75 - uMouse.y * 0.16 - uScroll * 0.9, 0.0);

      vec3 fwd = normalize(ta - ro);
      vec3 rgt = normalize(cross(vec3(0.0, 1.0, 0.0), fwd));
      vec3 upv = cross(fwd, rgt);
      vec3 rd  = normalize(fwd * 1.7 + rgt * uv.x + upv * uv.y);

      vec3 col;

      if (rd.y > -0.0025) {
        col = skyColor(rd, sunDir);
      } else {
        float dist = -ro.y / rd.y;
        vec3 pos = ro + rd * dist;

        float detail = exp(-dist * 0.016);              // fernes Wasser glatt
        float eps = 0.010 + dist * 0.0026;       // Abtastung ~ Pixelgrösse
        float h;
        vec3 n = oceanNormal(pos.xz, uTime, eps, detail, h);
        // Ganz hinten Normalen aufrichten – verhindert Streifen am Horizont
        n = normalize(mix(n, vec3(0.0, 1.0, 0.0), smoothstep(45.0, 170.0, dist)));

        vec3 v = -rd;

        float fres = 0.02 + 0.98 * pow(1.0 - max(dot(v, n), 0.0), 5.0);

        vec3 refl = reflect(rd, n);
        refl.y = abs(refl.y);                           // nie unter den Horizont spiegeln
        vec3 reflCol = skyColor(refl, sunDir);

        vec3 deep    = vec3(0.007, 0.048, 0.085);
        vec3 shallow = vec3(0.022, 0.160, 0.215);
        vec3 water = mix(deep, shallow, clamp(h * 0.9 + 0.45, 0.0, 1.0));

        // Licht, das durch die Wellenkämme schimmert
        float sss = pow(max(dot(normalize(rd + sunDir * 0.55), n), 0.0), 3.0);
        water += vec3(0.04, 0.26, 0.28) * sss * clamp(h + 0.25, 0.0, 1.0);

        col = mix(water, reflCol, fres);

        // Glitzerpfad: in der Ferne "rauer" -> schmaler, funkelnder Streifen
        vec3 hv = normalize(sunDir + v);
        float shine = mix(900.0, 90.0, clamp(dist * 0.016, 0.0, 1.0));
        col += vec3(1.0, 0.92, 0.78) * pow(max(dot(n, hv), 0.0), shine) * 2.3 * fres;

        // Schaum auf den steilsten Kämmen, nur im Vordergrund
        float steep = 1.0 - n.y;
        float foam = smoothstep(0.07, 0.22, steep) * smoothstep(0.28, 0.52, h) * exp(-dist * 0.045);
        col = mix(col, vec3(0.72, 0.83, 0.88), foam * 0.45);

        // Der Mauseffekt bekommt eigenes Licht. Ohne das wäre er nur dort zu
        // sehen, wo das Wasser ohnehin hell ist – im Nahbereich ist die
        // Oberfläche fast schwarz und eine Höhenänderung allein fiele nicht auf.
        if (uHover.z > 0.003) {
          float dh = length(pos.xz - uHover.xy);
          float huelle = smoothstep(6.5, 0.0, dh);
          float welle = max(sin(dh * 3.0 - uTime * 6.0), 0.0);
          col += vec3(0.30, 0.58, 0.72) * huelle * huelle * welle * 0.20 * uHover.z;
        }

        float alterK = uTime - uRipple.z;
        if (alterK > 0.0 && alterK < 4.0) {
          float dk = length(pos.xz - uRipple.xy);
          float frontK = alterK * 5.0;
          float bandK = exp(-abs(dk - frontK) * 0.85);
          col += vec3(0.45, 0.72, 0.85) * bandK * exp(-alterK * 0.7) * 0.30;
        }

        // Dunst zum Horizont: geht exakt in die Himmelsfarbe über
        float fog = 1.0 - exp(-dist * 0.0095);
        col = mix(col, skyColor(vec3(rd.x, 0.002, rd.z), sunDir), fog);
      }

      float vig = smoothstep(1.60, 0.30, length(uv * vec2(0.9, 1.0)));
      col *= mix(0.80, 1.0, vig);

      // filmisches Tonemapping + Gamma
      col = (col * (2.51 * col + 0.03)) / (col * (2.43 * col + 0.59) + 0.14);
      col = pow(clamp(col, 0.0, 1.0), vec3(1.0 / 2.2));

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  const water = {
    canvas: null,
    gl: null,
    program: null,
    uniforms: {},
    frame: 0,
    startTime: 0,
    letzteZeit: 0,
    visible: true,
    mouse: { x: 0, y: 0 },
    mouseTarget: { x: 0, y: 0 },
    pointer: { x: 0, y: 0, drin: false },
    hover: [0, 0, 0],
    cssBreite: 0,
    cssHoehe: 0,
    ripple: [0, 0, -99],
    observer: null,
    listeners: []
  };

  function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn("Shader-Fehler:", gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function on(target, type, handler, opts) {
    target.addEventListener(type, handler, opts);
    water.listeners.push([target, type, handler, opts]);
  }

  function initWater() {
    const mount = document.getElementById("hero-bg");
    if (!mount || water.canvas) return;

    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      powerPreference: "high-performance"
    });
    if (!gl) return; // ohne WebGL bleibt der CSS-Verlauf stehen

    // Auf schwächeren/kleinen Geräten weniger Wellen-Oktaven rechnen
    const octaves = (mount.clientWidth || window.innerWidth) < 800 ? 4 : 6;
    const fragmentSource = FRAGMENT_SHADER.replace(/OCTAVES/g, String(octaves));

    const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn("Programm-Fehler:", gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    // Ein grosses Dreieck deckt den ganzen Bildschirm ab
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    mount.appendChild(canvas);

    water.canvas = canvas;
    water.gl = gl;
    water.program = program;
    water.uniforms = {
      resolution: gl.getUniformLocation(program, "uResolution"),
      time: gl.getUniformLocation(program, "uTime"),
      mouse: gl.getUniformLocation(program, "uMouse"),
      scroll: gl.getUniformLocation(program, "uScroll"),
      ripple: gl.getUniformLocation(program, "uRipple"),
      hover: gl.getUniformLocation(program, "uHover")
    };
    water.startTime = performance.now();
    water.letzteZeit = performance.now();

    resizeWater();
    on(window, "resize", resizeWater);

    const hero = document.querySelector(".hero");
    if (hero && "IntersectionObserver" in window) {
      water.observer = new IntersectionObserver(entries => {
        water.visible = entries[0].isIntersecting;
        if (water.visible && !water.frame && !prefersReducedMotion) renderWater();
      }, { threshold: 0 });
      water.observer.observe(hero);
    }

    on(document, "visibilitychange", () => {
      if (!document.hidden && water.visible && !water.frame && !prefersReducedMotion) renderWater();
    });

    on(window, "pointermove", event => {
      const rect = water.canvas.getBoundingClientRect();
      water.pointer.x = event.clientX - rect.left;
      water.pointer.y = event.clientY - rect.top;
      water.pointer.drin = water.pointer.y >= 0 && water.pointer.y <= rect.height;

      water.mouseTarget.x = (water.pointer.x / rect.width) * 2 - 1;
      water.mouseTarget.y = (water.pointer.y / rect.height) * 2 - 1;
    }, { passive: true });

    on(window, "pointerdown", event => {
      const rect = water.canvas.getBoundingClientRect();
      const y = event.clientY - rect.top;
      if (y < 0 || y > rect.height) return;
      const pos = screenToWater(event.clientX - rect.left, y);
      if (pos) water.ripple = [pos[0], pos[1], (performance.now() - water.startTime) / 1000];
    });

    on(window, "pointerleave", () => { water.pointer.drin = false; });

    renderWater();
  }

  // Position im Canvas -> Punkt auf der Wasserfläche.
  // Muss exakt dieselbe Kamera benutzen wie der Shader, sonst wandert der
  // Effekt weg – in der Ferne wirkt sich schon ein kleiner Unterschied
  // riesig aus, weil der Sehstrahl dort fast parallel zum Wasser liegt.
  function screenToWater(x, y) {
    const w = water.cssBreite, h = water.cssHoehe;
    if (!w || !h) return null;

    const uvx = (x - 0.5 * w) / h;
    const uvy = (0.5 * h - y) / h;

    const scroll = aktuellerScroll();
    const ro = [0, 1.55 + scroll * 1.6, 8.0];
    const ta = [water.mouse.x * 0.5, 0.75 - water.mouse.y * 0.16 - scroll * 0.9, 0];

    const fwd = normalize([ta[0] - ro[0], ta[1] - ro[1], ta[2] - ro[2]]);
    const rgt = normalize(cross([0, 1, 0], fwd));
    const upv = cross(fwd, rgt);

    const rd = normalize([
      fwd[0] * 1.7 + rgt[0] * uvx + upv[0] * uvy,
      fwd[1] * 1.7 + rgt[1] * uvx + upv[1] * uvy,
      fwd[2] * 1.7 + rgt[2] * uvx + upv[2] * uvy
    ]);

    if (rd[1] >= -0.02) return null;
    const t = -ro[1] / rd[1];
    if (t > 60) return null;          // weiter hinten ist der Punkt nicht mehr zuverlässig
    return [ro[0] + rd[0] * t, ro[2] + rd[2] * t];
  }

  function aktuellerScroll() {
    const hero = document.querySelector(".hero");
    const hoehe = hero ? hero.offsetHeight : window.innerHeight;
    return Math.min(window.scrollY / Math.max(hoehe, 1), 1);
  }

  function cross(a, b) {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }

  function normalize(v) {
    const len = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / len, v[1] / len, v[2] / len];
  }

  function resizeWater() {
    if (!water.canvas) return;
    // Auf die tatsächliche Grösse des Hero beziehen, nicht auf das Fenster –
    // sonst passen Seitenverhältnis und Mausumrechnung nicht zusammen.
    const hero = document.querySelector(".hero");
    const cssB = hero ? hero.clientWidth : window.innerWidth;
    const cssH = hero ? hero.clientHeight : window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.25);

    water.cssBreite = cssB;
    water.cssHoehe = cssH;

    const w = Math.floor(cssB * dpr);
    const h = Math.floor(cssH * dpr);
    if (water.canvas.width === w && water.canvas.height === h) return;
    water.canvas.width = w;
    water.canvas.height = h;
    water.gl.viewport(0, 0, w, h);
  }

  function renderWater() {
    const { gl, uniforms } = water;
    if (!gl) return;

    const time = (performance.now() - water.startTime) / 1000;

    // Nachziehen zeitbasiert statt pro Bild: sonst hängt das Tempo an der
    // Bildrate und der Effekt braucht auf langsamen Geräten ewig.
    const dt = Math.min((performance.now() - water.letzteZeit) / 1000, 0.1);
    water.letzteZeit = performance.now();
    const nachzug = 1 - Math.exp(-dt * 6);

    water.mouse.x += (water.mouseTarget.x - water.mouse.x) * nachzug;
    water.mouse.y += (water.mouseTarget.y - water.mouse.y) * nachzug;

    const scroll = aktuellerScroll();

    // Die Störung unter dem Zeiger wird in JEDEM Bild neu berechnet – nur so
    // bleibt sie unter dem Cursor, auch während die Kamera noch nachzieht.
    if (water.pointer.drin) {
      const pos = screenToWater(water.pointer.x, water.pointer.y);
      if (pos) {
        const abstand = Math.hypot(pos[0], pos[1] - 8.0);
        const staerke = Math.max(0, 1 - abstand / 40);
        const anstieg = 1 - Math.exp(-dt * 12);
        water.hover = [pos[0], pos[1], water.hover[2] + (staerke - water.hover[2]) * anstieg];
      } else {
        water.hover[2] *= Math.exp(-dt * 6);
      }
    } else {
      water.hover[2] *= Math.exp(-dt * 6);
    }

    gl.uniform2f(uniforms.resolution, water.canvas.width, water.canvas.height);
    gl.uniform1f(uniforms.time, time);
    gl.uniform2f(uniforms.mouse, water.mouse.x, water.mouse.y);
    gl.uniform1f(uniforms.scroll, scroll);
    gl.uniform3f(uniforms.ripple, water.ripple[0], water.ripple[1], water.ripple[2]);
    gl.uniform3f(uniforms.hover, water.hover[0], water.hover[1], water.hover[2]);

    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Bei reduzierter Bewegung nur ein Standbild zeichnen
    if (prefersReducedMotion) { water.frame = 0; return; }

    water.frame = (water.visible && !document.hidden)
      ? requestAnimationFrame(renderWater)
      : 0;
  }

  function destroyWater() {
    if (water.frame) cancelAnimationFrame(water.frame);
    water.frame = 0;

    water.listeners.forEach(([target, type, handler, opts]) => {
      target.removeEventListener(type, handler, opts);
    });
    water.listeners = [];

    if (water.observer) { water.observer.disconnect(); water.observer = null; }

    if (water.gl) {
      const ext = water.gl.getExtension("WEBGL_lose_context");
      if (ext) ext.loseContext();
    }
    if (water.canvas && water.canvas.parentNode) water.canvas.parentNode.removeChild(water.canvas);

    water.canvas = null;
    water.gl = null;
    water.program = null;
  }

  window.LinoOceanHero = {
    init: initWater,
    destroy: destroyWater
  };
})();
