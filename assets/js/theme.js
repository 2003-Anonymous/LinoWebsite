// Lädt das Design der Seite: die gemeinsamen Effekte und den passenden Hero.
//
// Fest eingestellt ist "ocean" (Meer) – siehe Inline-Skript in index.html.
// Das zweite Design "pool" (helles Becken, Bahnenleinen) liegt weiterhin im
// Projekt und lässt sich über ?design=pool anschauen; einen Umschalter auf
// der Seite gibt es bewusst nicht mehr.

(function () {
  const DESIGNS = {
    ocean: { css: "assets/css/theme-ocean.css", js: "assets/js/hero-ocean.js", global: "LinoOceanHero" },
    pool:  { css: "assets/css/theme-pool.css",  js: "assets/js/hero-pool.js",  global: "LinoPoolHero" }
  };

  function skriptLaden(pfad) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = pfad;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  function alleInhalteZeigen() {
    document.documentElement.removeAttribute("data-reveal-ready");
  }

  function init() {
    const design = DESIGNS[document.documentElement.dataset.design] ? document.documentElement.dataset.design : "ocean";

    document.documentElement.dataset.design = design;
    document.getElementById("theme-css").href = DESIGNS[design].css;

    // Sicherheitsnetz: Laden die Skripte nicht, werden die Inhalte trotzdem
    // sichtbar (die Einblend-Animation versteckt sie sonst dauerhaft).
    const notbremse = setTimeout(alleInhalteZeigen, 2500);

    Promise.all([
      skriptLaden("assets/js/effects.js"),
      skriptLaden(DESIGNS[design].js)
    ]).then(() => {
      clearTimeout(notbremse);
      if (window.LinoEffects) window.LinoEffects.init();
      else alleInhalteZeigen();

      const hero = window[DESIGNS[design].global];
      if (hero) hero.init();
    }).catch(() => {
      clearTimeout(notbremse);
      alleInhalteZeigen();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
