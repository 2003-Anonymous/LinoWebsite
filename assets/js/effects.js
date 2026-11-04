(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let revealObserver = null;

  function initReveals() {
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      document.documentElement.removeAttribute("data-reveal-ready");
      document.querySelectorAll(".reveal").forEach(node => node.classList.add("is-visible"));
      return;
    }

    revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });

    document.querySelectorAll(".reveal").forEach(node => {
      const siblings = Array.from(node.parentNode ? node.parentNode.children : []);
      const index = siblings.filter(n => n.classList && n.classList.contains("reveal")).indexOf(node);
      node.style.transitionDelay = Math.max(index, 0) * 90 + "ms";
      revealObserver.observe(node);
    });

    netzStarten();
  }

  let netzTimer = null;
  let netzScroll = null;

  function sichtbarkeitPruefen() {
    const offen = document.querySelectorAll(".reveal:not(.is-visible)");
    if (!offen.length) { netzStoppen(); return; }

    const hoehe = window.innerHeight;
    offen.forEach(node => {
      const kasten = node.getBoundingClientRect();

      if (kasten.top < hoehe - 200) {

        node.style.transition = "none";
        node.style.transitionDelay = "0ms";
        node.classList.add("is-visible");
      }
    });
  }

  function netzStarten() {

    setTimeout(() => {
      if (!document.querySelector(".reveal:not(.is-visible)")) return;

      let letzterLauf = 0;
      netzScroll = () => {
        const jetzt = Date.now();
        if (jetzt - letzterLauf < 200) return;
        letzterLauf = jetzt;
        sichtbarkeitPruefen();
      };
      window.addEventListener("scroll", netzScroll, { passive: true });
      netzTimer = setInterval(sichtbarkeitPruefen, 500);
      sichtbarkeitPruefen();
    }, 900);
  }

  function netzStoppen() {
    if (netzTimer) { clearInterval(netzTimer); netzTimer = null; }
    if (netzScroll) { window.removeEventListener("scroll", netzScroll); netzScroll = null; }
  }

  function destroyReveals() {
    netzStoppen();
    if (revealObserver) { revealObserver.disconnect(); revealObserver = null; }
    document.documentElement.removeAttribute("data-reveal-ready");
    document.querySelectorAll(".reveal").forEach(node => {
      node.classList.remove("is-visible");
      node.style.transitionDelay = "";
    });
  }

  function initBubbles() {
    if (prefersReducedMotion || document.querySelector(".bubble-layer")) return;

    const layer = document.createElement("div");
    layer.className = "bubble-layer";
    layer.setAttribute("aria-hidden", "true");

    const count = window.innerWidth < 800 ? 8 : 14;
    for (let i = 0; i < count; i++) {
      const bubble = document.createElement("span");
      const size = 5 + Math.random() * 13;
      bubble.className = "bubble";
      bubble.style.width = size + "px";
      bubble.style.height = size + "px";
      bubble.style.left = Math.random() * 100 + "%";
      bubble.style.animationDuration = (16 + Math.random() * 20) + "s";
      bubble.style.animationDelay = (-Math.random() * 30) + "s";
      layer.appendChild(bubble);
    }

    document.body.appendChild(layer);
  }

  function destroyBubbles() {
    const layer = document.querySelector(".bubble-layer");
    if (layer) layer.remove();
  }

  let lightbox = null;
  let galleryHandler = null;

  function initLightbox() {
    const grid = document.getElementById("galerie-bilder");
    if (!grid || lightbox) return;

    lightbox = document.createElement("div");
    lightbox.className = "lightbox";
    lightbox.innerHTML = '<button class="lightbox-close" type="button" aria-label="Schliessen">&times;</button><img src="" alt="">';
    document.body.appendChild(lightbox);

    const image = lightbox.querySelector("img");

    galleryHandler = event => {
      const clicked = event.target.closest("img");
      if (!clicked) return;
      image.src = clicked.src;
      image.alt = clicked.alt || "";
      lightbox.classList.add("open");
    };

    grid.addEventListener("click", galleryHandler);
    grid.style.cursor = "zoom-in";
    lightbox.addEventListener("click", () => lightbox.classList.remove("open"));
    document.addEventListener("keydown", onLightboxKey);
  }

  function onLightboxKey(event) {
    if (event.key === "Escape" && lightbox) lightbox.classList.remove("open");
  }

  function destroyLightbox() {
    const grid = document.getElementById("galerie-bilder");
    if (grid && galleryHandler) {
      grid.removeEventListener("click", galleryHandler);
      grid.style.cursor = "";
    }
    document.removeEventListener("keydown", onLightboxKey);
    if (lightbox) { lightbox.remove(); lightbox = null; }
    galleryHandler = null;
  }

  let rail = null;
  let railSections = [];
  let railOnScroll = null;

  const MAX_TIEFE = 25;

  function initRail() {
    if (rail || window.innerWidth < 1100) return;

    const sections = Array.from(document.querySelectorAll("main section[id]"));
    if (!sections.length) return;

    rail = document.createElement("nav");
    rail.className = "depth-rail";
    rail.setAttribute("aria-label", "Abschnitte");

    const track = document.createElement("div");
    track.className = "depth-rail-track";
    const fill = document.createElement("div");
    fill.className = "depth-rail-fill";
    track.appendChild(fill);
    rail.appendChild(track);

    railSections = sections.map(section => {
      const label = section.dataset.railLabel
        || (section.querySelector("h2") ? section.querySelector("h2").textContent : section.id);
      const dot = document.createElement("a");
      dot.className = "depth-rail-dot";
      dot.href = "#" + section.id;
      dot.innerHTML = '<span class="depth-rail-label"></span>';
      dot.querySelector(".depth-rail-label").textContent = label;
      rail.appendChild(dot);
      return { section, dot };
    });

    const readout = document.createElement("div");
    readout.className = "depth-rail-readout";
    readout.textContent = "0 m";
    rail.appendChild(readout);

    document.body.appendChild(rail);

    railOnScroll = () => {
      const scrollBar = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollBar > 0 ? Math.min(window.scrollY / scrollBar, 1) : 0;
      fill.style.transform = `scaleY(${progress})`;
      readout.textContent = (progress * MAX_TIEFE).toFixed(1).replace(".", ",") + " m";

      let activeIndex = 0;
      railSections.forEach(({ section }, index) => {
        if (window.scrollY >= section.offsetTop - window.innerHeight * 0.4) activeIndex = index;
      });
      railSections.forEach(({ dot }, index) => {
        dot.classList.toggle("is-active", index === activeIndex);
      });
    };

    window.addEventListener("scroll", railOnScroll, { passive: true });
    window.addEventListener("resize", railOnScroll);
    railOnScroll();
  }

  function destroyRail() {
    if (railOnScroll) {
      window.removeEventListener("scroll", railOnScroll);
      window.removeEventListener("resize", railOnScroll);
      railOnScroll = null;
    }
    if (rail) { rail.remove(); rail = null; }
    railSections = [];
  }

  let active = false;

  function init() {
    if (active) return;
    active = true;
    initReveals();
    initBubbles();
    initLightbox();
    initRail();
  }

  function destroy() {
    if (!active) return;
    active = false;
    destroyReveals();
    destroyBubbles();
    destroyLightbox();
    destroyRail();
  }

  window.LinoEffects = { init, destroy };
})();
