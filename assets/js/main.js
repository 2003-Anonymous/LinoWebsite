// Rendert die Inhalte aus den Daten-Dateien (data/*.js) in die HTML-Struktur.
// Die Daten liegen als globale Objekte vor: CONTENT, RESULTATE, SPONSOREN, GALERIE.
// Bewusst als <script>-Einbindung statt fetch(), damit die Seite auch lokal
// per Doppelklick auf index.html funktioniert.

function formatDatum(isoDatum) {
  if (!isoDatum) return "";
  const parts = String(isoDatum).split("-");
  if (parts.length !== 3) return isoDatum;
  const [jahr, monat, tag] = parts;
  return `${tag}.${monat}.${jahr}`;
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined) continue;
    if (key === "text") node.textContent = value;
    else node.setAttribute(key, value);
  }
  for (const child of children) {
    if (child) node.appendChild(child);
  }
  return node;
}

function setText(id, value) {
  const node = document.getElementById(id);
  if (node) node.textContent = value || "";
}

/* ---------- Home / Hero ---------- */

function renderHero() {
  const { meta } = CONTENT;
  setText("hero-name-sr", meta.name);
  setText("hero-tagline", meta.tagline);
  setText("footer-name", meta.name);
  document.title = `${meta.name} – ${meta.tagline}`;
}

function renderUeberblick() {
  const { home } = CONTENT;

  setText("zitat-text", home.zitat ? `„${home.zitat}“` : "");
  setText("zitat-autor", home.zitat ? home.zitatAutor : "");

  const liste = document.getElementById("wettkaempfe-liste");
  liste.innerHTML = "";
  (home.naechsteWettkaempfe || []).forEach(wk => {
    liste.appendChild(el("li", {}, [
      el("span", { class: "wk-name", text: wk.name }, [
        el("span", { class: "wk-ort", text: wk.ort })
      ]),
      el("span", { class: "wk-datum", text: formatDatum(wk.datum) })
    ]));
  });

  const bilder = document.getElementById("overview-images");
  bilder.innerHTML = "";
  (home.heroImages || []).forEach(src => {
    bilder.appendChild(el("img", { src, alt: "", loading: "lazy" }));
  });
}

/* ---------- Über mich / Sport ---------- */

function renderUeberMich() {
  setText("ueber-mich-text", CONTENT.ueberMich.text);

  const bild = document.getElementById("ueber-mich-bild");
  const figure = bild.closest("figure");
  if (CONTENT.ueberMich.bild) {
    bild.src = CONTENT.ueberMich.bild;
    bild.alt = CONTENT.meta.name;
  } else if (figure) {
    figure.remove();
  }
}

function renderRettungsschwimmsport() {
  setText("rettungsschwimmsport-text", CONTENT.rettungsschwimmsport.text);
}

/* ---------- Resultate: Pool -> Beach/Ocean -> Erfolge ---------- */

// Erkennt eine Platzierung am Anfang eines Textes ("3. Platz, Beach Cup").
// Für die Podestfarben in der Beach-Tabelle.
function platzAusText(text) {
  const treffer = /^\s*(\d+)\s*\./.exec(String(text || ""));
  return treffer ? Number(treffer[1]) : null;
}

function resultatZelle(text) {
  const platz = platzAusText(text);
  const td = el("td", { class: platz && platz <= 3 ? `podest podest--${platz}` : null });
  if (platz && platz <= 3) td.appendChild(el("span", { class: "medaille", "aria-hidden": "true" }));
  td.appendChild(document.createTextNode(text || "–"));
  return td;
}

function renderResultate() {
  const { pool, beach, erfolge } = RESULTATE;

  setText("pool-titel", pool.titel || "Pool");
  setText("pool-text", pool.text);

  const poolBody = document.querySelector("#pool-tabelle tbody");
  poolBody.innerHTML = "";
  (pool.disziplinen || []).forEach(d => {
    const letztes = d.letztesResultat || {};
    poolBody.appendChild(el("tr", {}, [
      el("td", { text: d.name }),
      el("td", { class: "zeit-zelle" }, [
        el("span", { class: "zeit", text: d.allTimePB || "–" }),
        d.allTimePB ? el("span", { class: "badge badge--pb", text: "PB" }) : null
      ]),
      el("td", { class: "zeit-zelle" }, [
        el("span", { class: "zeit zeit--neben", text: d.saisonPB || "–" }),
        d.saisonPB ? el("span", { class: "badge badge--sb", text: "Saison" }) : null
      ]),
      el("td", {}, [
        el("span", { class: "zeit zeit--neben", text: letztes.zeit || "–" }),
        letztes.wettkampf || letztes.datum
          ? el("span", {
              class: "res-sub",
              text: [letztes.wettkampf, formatDatum(letztes.datum)].filter(Boolean).join(" · ")
            })
          : null
      ])
    ]));
  });

  setText("beach-titel", beach.titel || "Beach / Ocean");
  setText("beach-text", beach.text);

  const beachBody = document.querySelector("#beach-tabelle tbody");
  beachBody.innerHTML = "";
  (beach.disziplinen || []).forEach(d => {
    beachBody.appendChild(el("tr", {}, [
      el("td", { text: d.name }),
      resultatZelle(d.bestesResultat),
      resultatZelle(d.letztesResultat)
    ]));
  });

  const erfolgeListe = document.getElementById("erfolge-liste");
  erfolgeListe.innerHTML = "";
  (erfolge || []).forEach(e => {
    erfolgeListe.appendChild(el("li", {}, [
      el("span", { class: "erfolg-icon", "aria-hidden": "true" }),
      el("span", {}, [
        el("span", { class: "erfolg-titel", text: e.titel }),
        el("span", {
          class: "erfolg-meta",
          text: [e.wettkampf, formatDatum(e.datum)].filter(Boolean).join(" · ")
        })
      ])
    ]));
  });
}

/* ---------- Sponsoren ---------- */

function renderSponsoren() {
  const container = document.getElementById("sponsoren-kategorien");
  container.innerHTML = "";

  (SPONSOREN.kategorien || []).forEach(kategorie => {
    const block = el("div", { class: "sponsor-kategorie reveal" }, [
      el("h3", { text: kategorie.titel }),
      kategorie.text ? el("p", { class: "block-text", text: kategorie.text }) : null
    ]);

    const liste = el("div", { class: "sponsoren-liste" });
    (kategorie.sponsoren || []).forEach(s => {
      const inhalt = [
        el("span", { class: "sponsor-logo" }, [
          el("img", { src: s.logo, alt: s.name, loading: "lazy" })
        ]),
        el("span", { class: "sponsor-name", text: s.name }),
        s.beschreibung ? el("p", { class: "sponsor-text", text: s.beschreibung }) : null
      ];

      // Mit Link, falls eine URL hinterlegt ist – sonst als einfache Karte
      const karte = s.url
        ? el("a", { class: "sponsor-item", href: s.url, target: "_blank", rel: "noopener" }, inhalt)
        : el("div", { class: "sponsor-item" }, inhalt);

      liste.appendChild(karte);
    });

    block.appendChild(liste);
    container.appendChild(block);
  });

  const cta = SPONSOREN.cta || {};
  const ctaBox = document.getElementById("sponsor-cta");
  ctaBox.innerHTML = "";
  if (cta.titel || cta.text) {
    ctaBox.appendChild(el("h3", { text: cta.titel }));
    if (cta.text) ctaBox.appendChild(el("p", { text: cta.text }));
    if (cta.buttonText) {
      ctaBox.appendChild(el("a", {
        class: "btn",
        href: cta.buttonLink || "#kontakt",
        text: cta.buttonText
      }));
    }
  } else {
    ctaBox.remove();
  }
}

/* ---------- Galerie ---------- */

function renderGalerie() {
  const grid = document.getElementById("galerie-bilder");
  grid.innerHTML = "";
  (GALERIE.bilder || []).forEach(bild => {
    grid.appendChild(el("figure", { class: "reveal" }, [
      el("img", { src: bild.src, alt: bild.bildtext || "", loading: "lazy" }),
      bild.bildtext ? el("figcaption", { text: bild.bildtext }) : null
    ]));
  });

  const linkEl = document.getElementById("galerie-instagram-link");
  linkEl.innerHTML = "";
  if (GALERIE.instagramUrl && GALERIE.instagramUrl.startsWith("http")) {
    linkEl.appendChild(el("a", {
      href: GALERIE.instagramUrl,
      target: "_blank",
      rel: "noopener",
      text: "Mehr Bilder auf Instagram →"
    }));
  }
}

/* ---------- Kontakt ---------- */

function renderKontakt() {
  const { kontakt } = CONTENT;
  const liste = document.getElementById("kontakt-liste");
  liste.innerHTML = "";

  // Nur verlinken, wenn der Wert wirklich wie eine Adresse aussieht –
  // sonst bleiben Platzhalter als reiner Text stehen.
  const eintraege = [
    ["E-Mail", kontakt.email, kontakt.email && kontakt.email.includes("@") ? `mailto:${kontakt.email}` : null],
    ["Telefon", kontakt.telefon, kontakt.telefon && /\d/.test(kontakt.telefon) ? `tel:${String(kontakt.telefon).replace(/\s/g, "")}` : null],
    ["Instagram", kontakt.instagram, kontakt.instagram && kontakt.instagram.startsWith("http") ? kontakt.instagram : null],
    ["Ort", kontakt.ort, null]
  ];

  eintraege.forEach(([label, wert, link]) => {
    if (!wert) return;
    const dd = el("dd");
    if (link) {
      dd.appendChild(el("a", {
        href: link,
        text: wert,
        target: link.startsWith("http") ? "_blank" : null,
        rel: link.startsWith("http") ? "noopener" : null
      }));
    } else {
      dd.textContent = wert;
    }
    // Bezeichnung und Wert als Paar gruppieren, damit sie im Raster
    // untereinander statt nebeneinander stehen
    liste.appendChild(el("div", { class: "kontakt-item" }, [
      el("dt", { text: label }),
      dd
    ]));
  });
}

/* ---------- Navigation / Kopfzeile ---------- */

function setupNav() {
  const toggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("main-nav");
  const header = document.getElementById("site-header");

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Menü schliessen" : "Menü öffnen");
  });

  nav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });

  const onScroll = () => {
    header.classList.toggle("scrolled", window.scrollY > 40);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

function init() {
  renderHero();
  renderUeberblick();
  renderUeberMich();
  renderRettungsschwimmsport();
  renderResultate();
  renderSponsoren();
  renderGalerie();
  renderKontakt();
  setupNav();
  setText("jahr", String(new Date().getFullYear()));
}

document.addEventListener("DOMContentLoaded", init);
