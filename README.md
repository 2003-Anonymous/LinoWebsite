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


