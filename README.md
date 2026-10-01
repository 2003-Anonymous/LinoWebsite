# Lino Website

Website für Lino (Rettungsschwimmsport). Statische Seite ohne Build-Tools –
funktioniert direkt im Browser, kann auf jedem einfachen Webhosting (oder
GitHub Pages, Netlify etc.) abgelegt werden.

## Struktur

```
index.html              Die eigentliche Website (eine Seite mit Sprungmarken)
admin/index.html         Admin-Bereich zum Bearbeiten der Inhalte
data/                    Alle Texte, Resultate, Sponsoren, Bildverweise
  content.js              Home, Über mich, Rettungsschwimmsport, Kontakt
  resultate.js             Pool, Beach/Ocean, Erfolge
  sponsoren.js              Sponsor-Kategorien + Abschluss-Text
  galerie.js                 Instagram-Link, Galerie-Bilder
assets/
  css/
    base.css               Gemeinsames Grundgerüst (Layout, Struktur)
    theme-ocean.css         Design "Meer" (aktiv)
    theme-pool.css           Design "Becken" (aufgehoben, siehe unten)
    admin.css                 Admin-Bereich
  js/
    main.js                Inhalte in die Seite rendern
    theme.js                lädt Design, Effekte und Hero
    effects.js               Einblenden, Luftblasen, Lightbox, Tiefen-Leiste
    hero-ocean.js             Wasseroberfläche in 3D (WebGL-Shader)
    hero-pool.js               Bahnenleinen mit Wellenphysik (Canvas)
    admin.js / admin-auth.js    Admin-Bereich + Passwortschutz
  images/
    logo/                  Logo als Vektor, 4 Varianten (siehe unten)
    hero/                   Bilder für die Startseite
    about/                  Bild(er) für "Über mich"
    gallery/                Galerie-Bilder
    sponsors/               Sponsoren-Logos
```

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

Anschauen lässt es sich mit `?design=pool` in der Adresszeile, also z.B.
`https://…netlify.app/?design=pool`. Auf der Seite selbst gibt es dafür
bewusst keinen Umschalter – normale Besucher sehen immer "Meer".

Soll später dauerhaft gewechselt werden: in `index.html` im Inline-Skript im
`<head>` steht die Zeile, die `"ocean"` festlegt – dort `"pool"` eintragen.

## Logo

Das Logo wurde aus `Entwürfe.pdf` als Vektor (SVG) extrahiert, in vier
Varianten:

- `logo-mark-dark.svg` / `logo-mark-light.svg` – nur die Bildmarke (Kopfzeile)
- `logo-full-dark.svg` / `logo-full-light.svg` – mit Schriftzug (Hero)

"dark" ist für helle Hintergründe, "light" für dunkle.

## Inhalte selbst bearbeiten (ohne Programmieren)

1. `admin/index.html` im Browser öffnen (am besten **Chrome** oder **Edge**,
   damit direktes Speichern funktioniert).
2. Oben auf **"Projektordner verbinden"** klicken und den `LinoWebsite`-Hauptordner
   auswählen (den Ordner, in dem `index.html` liegt).
3. Texte, Resultate, Sponsoren eintragen/ändern. Bilder über die Datei-Auswahl
   bei den Bildfeldern hochladen – sie werden automatisch im richtigen
   `assets/images/…`-Ordner gespeichert.
4. Bei jeder Karte unten auf **"Speichern"** klicken (oder oben auf
   **"Alles speichern"**).
5. Über **"Seite ansehen"** die Änderungen direkt prüfen.

**Browser ohne Projektordner-Unterstützung** (z.B. Firefox, Safari): Der
"Speichern"-Button lädt stattdessen die aktualisierte Datei herunter
(z.B. `content.js`). Diese Datei muss dann von Hand in den Ordner `data/`
kopiert werden (alte Datei überschreiben). Bilder müssen dort manuell in den
passenden `assets/images/…`-Ordner kopiert werden; der Dateiname muss mit dem
Namen im Textfeld übereinstimmen.

## Wer kann was verändern?

Die veröffentlichte Website ist für Besucher **immer nur lesbar**. Das
Admin-Panel speichert Änderungen ausschliesslich in den lokal ausgewählten
Ordner im eigenen Browser (Punkt 2 oben) – es gibt keine Verbindung zu einem
Server. Selbst wenn jemand `admin/index.html` auf der veröffentlichten Seite
öffnet, kann er damit nicht die echte, für alle sichtbare Seite verändern.

Damit random Besucher den Admin-Bereich aber gar nicht erst sehen:

- `admin/index.html` ist zusätzlich mit einem **Passwort** gesperrt
  (`assets/js/admin-auth.js`). Standardpasswort: `lino2026` – bitte ändern!
  Dazu im Browser mit F12 die Konsole öffnen und ausführen:
  ```js
  crypto.subtle.digest("SHA-256", new TextEncoder().encode("neuesPasswort"))
    .then(buf => console.log([...new Uint8Array(buf)]
      .map(b => b.toString(16).padStart(2, "0")).join("")));
  ```
  Den ausgegebenen Hash in `assets/js/admin-auth.js` bei
  `ADMIN_PASSWORD_HASH` einsetzen.
- `robots.txt` und ein `noindex`-Meta-Tag verhindern, dass Suchmaschinen den
  Admin-Bereich auflisten.
- Wichtig: Das Passwort ist ein einfacher Schutz vor zufälligen Besuchern,
  keine echte Verschlüsselung – wer sich mit Browser-Entwicklertools
  auskennt, könnte ihn theoretisch umgehen. Das ist unkritisch, weil damit
  ohnehin nichts an der echten Seite verändert werden kann (siehe oben).

## Veröffentlichen (Netlify, Drag & Drop)

1. Auf [app.netlify.com](https://app.netlify.com) einen kostenlosen Account
   erstellen (falls noch nicht vorhanden).
2. Im Netlify-Dashboard auf **"Add new site" → "Deploy manually"**.
3. Den ganzen `LinoWebsite`-Ordner (der Ordner mit `index.html` drin) per
   Drag & Drop in das Upload-Feld ziehen. Netlify vergibt automatisch eine
   Adresse wie `zufallsname.netlify.app` (kann später auf eine eigene Domain
   umgestellt werden).
4. Fertig – die Seite ist live.

**Wichtig:** Wenn Lino danach im Admin-Panel etwas ändert, betrifft das nur
seinen lokalen Ordner. Damit die Änderungen auch online sichtbar werden, muss
er denselben Ordner danach erneut per Drag & Drop auf dieselbe Netlify-Seite
hochladen (Netlify → Site → "Deploys" → Ordner erneut hineinziehen). Das
überschreibt die alte Version mit der neuen.

## Direkt in den Daten-Dateien bearbeiten (Alternative)

Wer sich das zutraut, kann die Dateien in `data/` auch direkt mit einem
Texteditor öffnen und anpassen – es ist normales, lesbares JavaScript
(Listen mit `{ ... }`-Einträgen). Wichtig: Anführungszeichen und Kommas nicht
verlieren, sonst funktioniert die Seite nicht mehr.

## Seite lokal testen

`index.html` kann direkt per Doppelklick geöffnet werden – die Seite lädt
ihre Inhalte über normale `<script>`-Einbindungen (keine Server-Abhängigkeit).

## Noch offen (nächste Schritte)

- Platzhalterbilder durch echte Fotos ersetzen (Hero, Über mich, Galerie)
- Echte Sponsoren-Logos statt der grauen Platzhalter einsetzen
- Kontaktdaten ausfüllen (aktuell stehen dort noch Platzhalter)
- Admin-Passwort ändern (siehe oben, Standard ist `lino2026`)
