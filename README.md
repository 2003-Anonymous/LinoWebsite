# Lino Website

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


