# Lino Website

Website für Lino Gautschi (Rettungsschwimmsport). Statische Seite ohne
Build-Schritt. Die Inhalte liegen als JSON in `data/` und werden über einen
Admin-Bereich auf der Seite selbst bearbeitet (Sveltia CMS).

**Ablauf:** Lino bearbeitet unter `/admin/` → das CMS speichert nach GitHub →
Vercel veröffentlicht automatisch → nach rund einer Minute ist es live.

---

## Für Lino: Inhalte bearbeiten

1. **`https://DEINE-ADRESSE/admin/`** öffnen (am besten als Lesezeichen
   speichern, auf dem Handy als Symbol auf dem Startbildschirm).
2. Auf **"Mit GitHub anmelden"** klicken. Das ist nur beim ersten Mal nötig.
3. Links einen Bereich wählen: *Startseite*, *Resultate*, *Sponsoren* oder
   *Galerie*.
4. Felder ausfüllen bzw. ändern. Bilder lassen sich direkt hochladen –
   auch vom Handy aus der Fotomediathek.
5. Oben auf **"Speichern"**. Nach etwa einer Minute ist die Änderung online.

Nicht veränderbar sind Design, Aufbau und Programmcode – es erscheinen nur
die Felder, die in `admin/config.yml` festgelegt sind. Jede Änderung wird
zudem als eigene Version gespeichert und lässt sich rückgängig machen.

---

## Für den Betreuer: Einrichtung

Einmalig, danach läuft es von selbst.

### 1. Vercel mit dem GitHub-Repo verbinden

Auf [vercel.com](https://vercel.com) ein neues Projekt aus dem Repo
`2003-Anonymous/LinoWebsite` anlegen. Framework: **Other**, kein Build-Befehl.
Vercel erkennt die statischen Dateien und die Funktionen im Ordner `api/`
automatisch.

### 2. GitHub-OAuth-App anlegen

GitHub → *Settings* → *Developer settings* → *OAuth Apps* → *New OAuth App*:

| Feld | Wert |
|---|---|
| Application name | Lino Website Admin |
| Homepage URL | `https://DEINE-ADRESSE` |
| Authorization callback URL | `https://DEINE-ADRESSE/api/callback` |

Danach *Client ID* notieren und ein *Client Secret* erzeugen.

### 3. Zugangsdaten in Vercel hinterlegen

Vercel → Projekt → *Settings* → *Environment Variables*:

- `GIT_CLIENT_ID`
- `GIT_CLIENT_SECRET`

Danach einmal neu veröffentlichen (*Redeploy*), damit die Werte greifen.

### 4. Adresse in der CMS-Konfiguration eintragen

In `admin/config.yml` die Zeile `base_url:` auf die echte Adresse ändern:

```yaml
base_url: https://lino-website.vercel.app
```

### 5. Lino Zugriff geben

GitHub-Repo → *Settings* → *Collaborators* → Lino einladen (er braucht ein
kostenloses GitHub-Konto). Ohne diesen Schritt kann er sich zwar anmelden,
aber nichts speichern.

---

## Struktur

```
index.html               Die Website (eine Seite mit Sprungmarken)
admin/
  index.html              Admin-Bereich (lädt Sveltia CMS)
  config.yml               Welche Felder bearbeitbar sind
api/
  auth.js                 Anmeldung Schritt 1 (Weiterleitung zu GitHub)
  callback.js              Anmeldung Schritt 2 (Token abholen)
data/                    Die Inhalte, vom CMS bearbeitet
  content.json            Startseite, Über mich, Rettungsschwimmsport, Kontakt
  resultate.json           Pool, Beach/Ocean, Erfolge
  sponsoren.json            Sponsorenliste + Abschluss-Text
  galerie.json               Instagram-Link, Galerie-Bilder
assets/
  css/
    base.css              Gemeinsames Grundgerüst (Layout, Struktur)
    theme-ocean.css        Design "Meer" (aktiv)
    theme-pool.css          Design "Becken" (aufgehoben, siehe unten)
  js/
    main.js               Inhalte laden und in die Seite einsetzen
    theme.js               lädt Design, Effekte und Hero
    effects.js              Einblenden, Luftblasen, Lightbox, Tiefen-Leiste
    hero-ocean.js            Wasseroberfläche in 3D (WebGL-Shader)
    hero-pool.js              Bahnenleinen mit Wellenphysik (Canvas)
  images/
    logo/                 Logo als Vektor, 4 Varianten (siehe unten)
    hero/ about/ gallery/ sponsors/    Platzhalterbilder
    uploads/              Hierhin lädt das CMS neue Bilder
```

---

## Das Design

Die Website läuft im Design **"Meer"** (dunkel). Im Hero steht eine animierte
3D-Wasseroberfläche – ein eigener WebGL-Shader rechnet Wellen, Spiegelung,
Sonnenglitzern und Schaum. Die Maus kräuselt das Wasser an Ort und Stelle, ein
Klick löst eine auslaufende Ringwelle aus, beim Scrollen taucht die Kamera ab.

Motive, die sich durch die Seite ziehen:

- Abschnitte sind wie Bahnen durchnummeriert (01, 02, …)
- Bahnenleinen als Trenner zwischen den Abschnitten
- Resultate als Wettkampf-Anzeigetafel: PB-Plakette, Saison-Marke,
  Podestfarben (Gold/Silber/Bronze) in der Beach/Ocean-Tabelle
- Erfolge als Medaillen-Karten
- Leiste am linken Rand: zeigt den Abschnitt und übersetzt den Scroll-Stand
  in Tiefenmeter

### Das zweite Design ist aufgehoben

Das helle Becken-Design (Bahnenleinen mit Wellenphysik, Kacheln, Kontakt als
Startblock) ist **nicht gelöscht**, nur nicht mehr aktiv. Es liegt in
`assets/css/theme-pool.css` und `assets/js/hero-pool.js`.

Anschauen lässt es sich mit `?design=pool` in der Adresszeile. Auf der Seite
selbst gibt es dafür bewusst keinen Umschalter – Besucher sehen immer "Meer".

Soll später dauerhaft gewechselt werden: in `index.html` im Inline-Skript im
`<head>` steht die Zeile, die `"ocean"` festlegt – dort `"pool"` eintragen.

## Logo

Das Logo wurde aus `Entwürfe.pdf` als Vektor (SVG) extrahiert, in vier
Varianten:

- `logo-mark-dark.svg` / `logo-mark-light.svg` – nur die Bildmarke (Kopfzeile)
- `logo-full-dark.svg` / `logo-full-light.svg` – mit Schriftzug (Hero)

"dark" ist für helle Hintergründe, "light" für dunkle.

---

## Technische Hinweise

Drei Dinge, die beim Weiterarbeiten leicht kaputtgehen – sie standen früher
als Kommentare im Code:

**1. `.site-header` nicht in die `position`-Regeln der Theme-Dateien aufnehmen.**
In `theme-ocean.css` hebt die Regel `main, .site-footer { position: relative }`
den Inhalt über die Luftblasen-Ebene. Nimmt man `.site-header` dazu, überschreibt
das `position: fixed` aus `base.css`: Die Navigation scrollt weg und der Hero
verrutscht um die Höhe der Kopfzeile. Das wiederum verschiebt die Mausposition
im Wasser-Effekt.

**2. Die Kamera in `hero-ocean.js` existiert zweimal.** Einmal im Shader
(`ro`/`ta` in `main()`) und einmal in JavaScript (`screenToWater`). Beide
müssen identisch sein, sonst sitzt der Maus-Effekt nicht mehr unter dem Cursor –
in der Ferne wirkt sich schon ein kleiner Unterschied stark aus.

**3. Das Einblenden braucht das Sicherheitsnetz in `effects.js`.**
`IntersectionObserver` liefert seine Rückmeldungen zusammen mit dem Bildaufbau.
Ist der Hauptthread ausgelastet (Wasser-Animation auf schwachem Gerät), bleiben
sie aus – Inhalte mit `opacity: 0` wären dann dauerhaft unsichtbar. Deshalb
prüfen zusätzlich ein Scroll-Ereignis und ein Timer die Sichtbarkeit.
Grundregel: Sichtbarkeit von Inhalten nie allein vom `IntersectionObserver`
oder einer CSS-Überblendung abhängig machen.

Ausserdem: Die CMS-Version in `admin/index.html` ist bewusst festgenagelt
(`@sveltia/cms@0.236.0`). Ein ungepinntes „latest" könnte den Editor jederzeit
unangekündigt verändern.

## Lokale Vorschau

Ein Doppelklick auf `index.html` reicht **nicht** mehr: Die Seite lädt ihre
Inhalte aus `data/*.json`, und Browser verbieten das bei lokal geöffneten
Dateien. Stattdessen im Projektordner einen kleinen Server starten:

```bash
npx serve
```

Dann die angezeigte Adresse öffnen (meist `http://localhost:3000`).

---

## Noch offen

- Platzhalterbilder durch echte Fotos ersetzen (Hero, Über mich, Galerie)
- Echte Sponsoren-Logos statt der grauen Platzhalter
- Kontaktdaten ausfüllen (stehen noch auf Platzhaltern)
- Hinweis an Lino: Fotos nicht in voller Kameraauflösung hochladen –
  sie bleiben dauerhaft im Repo
