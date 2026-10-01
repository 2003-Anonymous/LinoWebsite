// Admin-Panel: lädt die Daten aus data/*.js, zeigt sie in Formularen an
// und schreibt sie beim Speichern zurück in die jeweiligen Dateien.
//
// Speichern funktioniert auf zwei Arten:
// 1. Direkt (Chrome/Edge): Über "Projektordner verbinden" wird die File
//    System Access API genutzt, Dateien werden ohne Umweg überschrieben.
// 2. Fallback (alle Browser): Die Datei wird heruntergeladen und muss von
//    Hand im Ordner "data/" ersetzt werden (Anleitung erscheint als Hinweis).

let projectDirHandle = null;

// Arbeitskopien der geladenen Daten (aus data/*.js), damit Änderungen
// erst beim Speichern übernommen werden.
const adminContent = structuredClone(CONTENT);
const adminResultate = structuredClone(RESULTATE);
const adminSponsoren = structuredClone(SPONSOREN);
const adminGalerie = structuredClone(GALERIE);

function setStatus(message, type = "info") {
  const status = document.getElementById("admin-status");
  status.textContent = message;
  status.className = `admin-status ${type}`;
}

function field(row, labelText, value, onChange, opts = {}) {
  const wrap = document.createElement("label");
  wrap.className = "admin-field";
  const span = document.createElement("span");
  span.textContent = labelText;
  wrap.appendChild(span);

  let input;
  if (opts.textarea) {
    input = document.createElement("textarea");
    input.rows = opts.rows || 4;
  } else {
    input = document.createElement("input");
    input.type = opts.type || "text";
  }
  input.value = value || "";
  input.addEventListener("input", () => onChange(input.value));
  wrap.appendChild(input);
  row.appendChild(wrap);
  return input;
}

function imageField(row, labelText, getPath, onPathChange, subfolder) {
  const wrap = document.createElement("div");
  wrap.className = "admin-field admin-image-field";
  const span = document.createElement("span");
  span.textContent = labelText;
  wrap.appendChild(span);

  const preview = document.createElement("img");
  preview.className = "admin-image-preview";
  preview.src = "../" + getPath();
  preview.alt = "Vorschau";
  preview.onerror = () => { preview.removeAttribute("src"); };
  wrap.appendChild(preview);

  const pathInput = document.createElement("input");
  pathInput.type = "text";
  pathInput.value = getPath();
  pathInput.addEventListener("input", () => {
    onPathChange(pathInput.value);
    preview.src = "../" + pathInput.value;
  });
  wrap.appendChild(pathInput);

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) return;
    if (projectDirHandle) {
      try {
        const relPath = await saveImageFile(subfolder, file);
        pathInput.value = relPath;
        onPathChange(relPath);
        preview.src = "../" + relPath + "?t=" + Date.now();
        setStatus(`Bild "${file.name}" gespeichert.`, "success");
      } catch (err) {
        console.error(err);
        setStatus(`Bild konnte nicht gespeichert werden: ${err.message}`, "error");
      }
    } else {
      const objectUrl = URL.createObjectURL(file);
      preview.src = objectUrl;
      setStatus(
        `Bitte "${file.name}" manuell in den Ordner assets/images/${subfolder}/ kopieren und den Dateinamen im Textfeld eintragen. ` +
        `Tipp: Oben auf "Projektordner verbinden" klicken (Chrome/Edge), dann werden Bilder automatisch gespeichert.`,
        "info"
      );
    }
  });
  wrap.appendChild(fileInput);

  row.appendChild(wrap);
}

function createListEditor({ container, items, renderItem, newItem, addLabel }) {
  function redraw() {
    container.innerHTML = "";
    items.forEach((item, index) => {
      const row = document.createElement("div");
      row.className = "admin-list-row";
      renderItem(row, item, index);
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "btn-remove";
      removeBtn.textContent = "✕ Eintrag entfernen";
      removeBtn.addEventListener("click", () => {
        items.splice(index, 1);
        redraw();
      });
      row.appendChild(removeBtn);
      container.appendChild(row);
    });

    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "btn-add";
    addBtn.textContent = addLabel;
    addBtn.addEventListener("click", () => {
      items.push(typeof newItem === "function" ? newItem() : structuredClone(newItem));
      redraw();
    });
    container.appendChild(addBtn);
  }
  redraw();
}

// ---------- Formulare ----------

function renderHomeForm() {
  const container = document.getElementById("admin-home");
  container.innerHTML = "";

  const grid = document.createElement("div");
  grid.className = "admin-row-grid";
  field(grid, "Name", adminContent.meta.name, v => (adminContent.meta.name = v));
  field(grid, "Tagline", adminContent.meta.tagline, v => (adminContent.meta.tagline = v));
  container.appendChild(grid);

  field(container, "Zitat", adminContent.home.zitat, v => (adminContent.home.zitat = v), { textarea: true, rows: 2 });

  const heroWrap = document.createElement("div");
  heroWrap.innerHTML = "<h3>Hero-Bilder</h3>";
  container.appendChild(heroWrap);
  const heroList = document.createElement("div");
  container.appendChild(heroList);
  createListEditor({
    container: heroList,
    items: adminContent.home.heroImages,
    addLabel: "+ Bild hinzufügen",
    newItem: () => "",
    renderItem: (row, item, index) => {
      imageField(row, `Bild ${index + 1}`,
        () => adminContent.home.heroImages[index],
        v => (adminContent.home.heroImages[index] = v),
        "hero");
    }
  });

  const wkWrap = document.createElement("div");
  wkWrap.innerHTML = "<h3>Nächste Wettkämpfe</h3>";
  container.appendChild(wkWrap);
  const wkList = document.createElement("div");
  container.appendChild(wkList);
  createListEditor({
    container: wkList,
    items: adminContent.home.naechsteWettkaempfe,
    addLabel: "+ Wettkampf hinzufügen",
    newItem: () => ({ name: "", ort: "", datum: "" }),
    renderItem: (row, item) => {
      const grid = document.createElement("div");
      grid.className = "admin-row-grid";
      field(grid, "Name", item.name, v => (item.name = v));
      field(grid, "Ort", item.ort, v => (item.ort = v));
      field(grid, "Datum", item.datum, v => (item.datum = v), { type: "date" });
      row.appendChild(grid);
    }
  });
}

function renderUeberMichForm() {
  const container = document.getElementById("admin-ueber-mich");
  container.innerHTML = "";
  field(container, "Text", adminContent.ueberMich.text, v => (adminContent.ueberMich.text = v), { textarea: true, rows: 8 });
  imageField(container, "Bild", () => adminContent.ueberMich.bild || "", v => (adminContent.ueberMich.bild = v), "about");
}

function renderRettungsschwimmsportForm() {
  const container = document.getElementById("admin-rettungsschwimmsport");
  container.innerHTML = "";
  field(container, "Text", adminContent.rettungsschwimmsport.text, v => (adminContent.rettungsschwimmsport.text = v), { textarea: true, rows: 8 });
}

function renderKontaktForm() {
  const container = document.getElementById("admin-kontakt");
  container.innerHTML = "";
  const grid = document.createElement("div");
  grid.className = "admin-row-grid";
  field(grid, "E-Mail", adminContent.kontakt.email, v => (adminContent.kontakt.email = v), { type: "email" });
  field(grid, "Telefon", adminContent.kontakt.telefon, v => (adminContent.kontakt.telefon = v), { type: "tel" });
  field(grid, "Instagram-URL", adminContent.kontakt.instagram, v => (adminContent.kontakt.instagram = v), { type: "url" });
  field(grid, "Ort", adminContent.kontakt.ort, v => (adminContent.kontakt.ort = v));
  container.appendChild(grid);
}

function renderResultateForm() {
  const poolMeta = document.getElementById("admin-pool-meta");
  poolMeta.innerHTML = "";
  field(poolMeta, "Titel", adminResultate.pool.titel, v => (adminResultate.pool.titel = v));
  field(poolMeta, "Einleitungstext", adminResultate.pool.text, v => (adminResultate.pool.text = v), { textarea: true, rows: 2 });

  const beachMeta = document.getElementById("admin-beach-meta");
  beachMeta.innerHTML = "";
  field(beachMeta, "Titel", adminResultate.beach.titel, v => (adminResultate.beach.titel = v));
  field(beachMeta, "Einleitungstext", adminResultate.beach.text, v => (adminResultate.beach.text = v), { textarea: true, rows: 2 });

  const poolWrap = document.getElementById("admin-pool");
  poolWrap.innerHTML = "";
  createListEditor({
    container: poolWrap,
    items: adminResultate.pool.disziplinen,
    addLabel: "+ Disziplin hinzufügen",
    newItem: () => ({ name: "", allTimePB: "", saisonPB: "", letztesResultat: { zeit: "", wettkampf: "", datum: "" } }),
    renderItem: (row, item) => {
      const grid = document.createElement("div");
      grid.className = "admin-row-grid";
      field(grid, "Disziplin", item.name, v => (item.name = v));
      field(grid, "All-Time PB", item.allTimePB, v => (item.allTimePB = v));
      field(grid, "Saison-PB", item.saisonPB, v => (item.saisonPB = v));
      row.appendChild(grid);

      const grid2 = document.createElement("div");
      grid2.className = "admin-row-grid";
      if (!item.letztesResultat) item.letztesResultat = { zeit: "", wettkampf: "", datum: "" };
      field(grid2, "Letzte Zeit", item.letztesResultat.zeit, v => (item.letztesResultat.zeit = v));
      field(grid2, "Letzter Wettkampf", item.letztesResultat.wettkampf, v => (item.letztesResultat.wettkampf = v));
      field(grid2, "Datum", item.letztesResultat.datum, v => (item.letztesResultat.datum = v), { type: "date" });
      row.appendChild(grid2);
    }
  });

  const erfolgeWrap = document.getElementById("admin-erfolge");
  erfolgeWrap.innerHTML = "";
  createListEditor({
    container: erfolgeWrap,
    items: adminResultate.erfolge,
    addLabel: "+ Erfolg hinzufügen",
    newItem: () => ({ titel: "", wettkampf: "", datum: "" }),
    renderItem: (row, item) => {
      const grid = document.createElement("div");
      grid.className = "admin-row-grid";
      field(grid, "Titel (z.B. Top 10 Finish)", item.titel, v => (item.titel = v));
      field(grid, "Wettkampf", item.wettkampf, v => (item.wettkampf = v));
      field(grid, "Datum", item.datum, v => (item.datum = v), { type: "date" });
      row.appendChild(grid);
    }
  });

  const beachWrap = document.getElementById("admin-beach");
  beachWrap.innerHTML = "";
  createListEditor({
    container: beachWrap,
    items: adminResultate.beach.disziplinen,
    addLabel: "+ Beach-Disziplin hinzufügen",
    newItem: () => ({ name: "", bestesResultat: "", letztesResultat: "" }),
    renderItem: (row, item) => {
      const grid = document.createElement("div");
      grid.className = "admin-row-grid";
      field(grid, "Disziplin", item.name, v => (item.name = v));
      field(grid, "Bestes Resultat", item.bestesResultat, v => (item.bestesResultat = v));
      field(grid, "Letztes Resultat", item.letztesResultat, v => (item.letztesResultat = v));
      row.appendChild(grid);
    }
  });
}

function renderSponsorenForm() {
  const container = document.getElementById("admin-sponsor-kategorien");
  container.innerHTML = "";

  createListEditor({
    container,
    items: adminSponsoren.kategorien,
    addLabel: "+ Kategorie hinzufügen",
    newItem: () => ({ titel: "Neue Kategorie", text: "", sponsoren: [] }),
    renderItem: (row, kategorie) => {
      field(row, "Titel der Kategorie", kategorie.titel, v => (kategorie.titel = v));
      field(row, "Einleitungstext (optional)", kategorie.text, v => (kategorie.text = v), { textarea: true, rows: 2 });

      const sponsorenWrap = document.createElement("div");
      sponsorenWrap.className = "admin-nested";
      row.appendChild(sponsorenWrap);

      if (!Array.isArray(kategorie.sponsoren)) kategorie.sponsoren = [];

      createListEditor({
        container: sponsorenWrap,
        items: kategorie.sponsoren,
        addLabel: "+ Sponsor hinzufügen",
        newItem: () => ({ name: "", logo: "assets/images/sponsors/placeholder.svg", url: "", beschreibung: "" }),
        renderItem: (sponsorRow, sponsor, index) => {
          const grid = document.createElement("div");
          grid.className = "admin-row-grid";
          field(grid, "Name", sponsor.name, v => (sponsor.name = v));
          field(grid, "Website-URL (optional)", sponsor.url, v => (sponsor.url = v), { type: "url" });
          sponsorRow.appendChild(grid);
          field(sponsorRow, "Beschreibung", sponsor.beschreibung, v => (sponsor.beschreibung = v), { textarea: true, rows: 2 });
          imageField(sponsorRow, "Logo",
            () => kategorie.sponsoren[index].logo,
            v => (kategorie.sponsoren[index].logo = v),
            "sponsors");
        }
      });
    }
  });

  const ctaWrap = document.getElementById("admin-sponsor-cta");
  ctaWrap.innerHTML = "";
  if (!adminSponsoren.cta) adminSponsoren.cta = { titel: "", text: "", buttonText: "", buttonLink: "#kontakt" };
  const cta = adminSponsoren.cta;
  field(ctaWrap, "Titel", cta.titel, v => (cta.titel = v));
  field(ctaWrap, "Text", cta.text, v => (cta.text = v), { textarea: true, rows: 4 });
  const ctaGrid = document.createElement("div");
  ctaGrid.className = "admin-row-grid";
  field(ctaGrid, "Button-Beschriftung", cta.buttonText, v => (cta.buttonText = v));
  field(ctaGrid, "Button-Ziel", cta.buttonLink, v => (cta.buttonLink = v));
  ctaWrap.appendChild(ctaGrid);
}

function renderGalerieForm() {
  const container = document.getElementById("admin-galerie");
  container.innerHTML = "";
  field(container, "Instagram-URL", adminGalerie.instagramUrl, v => (adminGalerie.instagramUrl = v), { type: "url" });

  const bilderWrap = document.getElementById("admin-galerie-bilder");
  bilderWrap.innerHTML = "";
  createListEditor({
    container: bilderWrap,
    items: adminGalerie.bilder,
    addLabel: "+ Bild hinzufügen",
    newItem: () => ({ src: "assets/images/gallery/placeholder.svg", bildtext: "" }),
    renderItem: (row, item, index) => {
      imageField(row, "Bild", () => adminGalerie.bilder[index].src, v => (adminGalerie.bilder[index].src = v), "gallery");
      field(row, "Bildtext", item.bildtext, v => (item.bildtext = v));
    }
  });
}

// ---------- Speichern ----------

function serializeDataFile(varName, comment, data) {
  return `${comment}\nconst ${varName} = ${JSON.stringify(data, null, 2)};\n`;
}

function downloadTextFile(fileName, text) {
  const blob = new Blob([text], { type: "text/javascript" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

async function saveDataFile(fileName, varName, comment, data) {
  const text = serializeDataFile(varName, comment, data);
  if (projectDirHandle) {
    try {
      const dataDir = await projectDirHandle.getDirectoryHandle("data", { create: true });
      const fileHandle = await dataDir.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(text);
      await writable.close();
      setStatus(`${fileName} gespeichert.`, "success");
      return;
    } catch (err) {
      console.error(err);
      setStatus(`Fehler beim Speichern von ${fileName}: ${err.message}`, "error");
      return;
    }
  }
  downloadTextFile(fileName, text);
  setStatus(`${fileName} wurde heruntergeladen. Bitte die Datei im Ordner "data/" ersetzen (alte Datei überschreiben).`, "info");
}

async function saveImageFile(subfolder, file) {
  const assetsDir = await projectDirHandle.getDirectoryHandle("assets", { create: true });
  const imagesDir = await assetsDir.getDirectoryHandle("images", { create: true });
  const targetDir = await imagesDir.getDirectoryHandle(subfolder, { create: true });
  const fileHandle = await targetDir.getFileHandle(file.name, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(file);
  await writable.close();
  return `assets/images/${subfolder}/${file.name}`;
}

function saveContent() {
  return saveDataFile(
    "content.js",
    "CONTENT",
    "// Inhalte für Home, Über mich, Rettungsschwimmsport und Kontakt.\n// Diese Datei kann über das Admin-Panel (admin/index.html) bearbeitet werden\n// oder direkt hier von Hand angepasst werden.",
    adminContent
  );
}

function saveResultate() {
  return saveDataFile(
    "resultate.js",
    "RESULTATE",
    "// Resultate: Pool-Tabelle, Beach/Ocean-Tabelle und Erfolge.\n// Reihenfolge auf der Website: Pool → Beach/Ocean → Erfolge.\n// Über das Admin-Panel (admin/index.html) bearbeitbar.",
    adminResultate
  );
}

function saveSponsoren() {
  return saveDataFile(
    "sponsoren.js",
    "SPONSOREN",
    "// Sponsoren: frei sortierbare Kategorien + Abschluss-Text (\"Interesse geweckt?\").\n// Die Reihenfolge der Kategorien = Reihenfolge auf der Website.\n// Über das Admin-Panel (admin/index.html) bearbeitbar.",
    adminSponsoren
  );
}

function saveGalerie() {
  return saveDataFile(
    "galerie.js",
    "GALERIE",
    "// Galerie: Instagram-Link und einzelne Bilder.\n// Über das Admin-Panel (admin/index.html) bearbeitbar.",
    adminGalerie
  );
}

async function connectProjectFolder() {
  if (!window.showDirectoryPicker) {
    setStatus("Dein Browser unterstützt direktes Speichern nicht (nutze Chrome oder Edge). Du kannst Änderungen trotzdem herunterladen und manuell ersetzen.", "info");
    return;
  }
  try {
    const handle = await window.showDirectoryPicker();
    await handle.getDirectoryHandle("data");
    projectDirHandle = handle;
    setStatus(`Ordner "${handle.name}" verbunden. Änderungen können jetzt direkt gespeichert werden.`, "success");
  } catch (err) {
    if (err.name !== "AbortError") {
      console.error(err);
      setStatus('Ordner konnte nicht verbunden werden. Bitte den "LinoWebsite"-Hauptordner auswählen (der Ordner mit "index.html" und "data/").', "error");
    }
  }
}

function init() {
  renderHomeForm();
  renderUeberMichForm();
  renderRettungsschwimmsportForm();
  renderKontaktForm();
  renderResultateForm();
  renderSponsorenForm();
  renderGalerieForm();

  document.getElementById("btn-connect").addEventListener("click", connectProjectFolder);
  document.getElementById("btn-save-content").addEventListener("click", saveContent);
  document.getElementById("btn-save-resultate").addEventListener("click", saveResultate);
  document.getElementById("btn-save-sponsoren").addEventListener("click", saveSponsoren);
  document.getElementById("btn-save-galerie").addEventListener("click", saveGalerie);
  document.getElementById("btn-save-all").addEventListener("click", async () => {
    await saveContent();
    await saveResultate();
    await saveSponsoren();
    await saveGalerie();
    setStatus("Alle Änderungen gespeichert.", "success");
  });
}

document.addEventListener("DOMContentLoaded", init);
