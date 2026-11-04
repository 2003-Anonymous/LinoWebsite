# Einrichtung – was noch zu tun ist

Einmalige Schritte, danach läuft alles von selbst. Rechne mit 20–30 Minuten.

Reihenfolge einhalten: Schritt 2 braucht die Adresse aus Schritt 1.

---

## Schritt 1 – Projekt auf Vercel anlegen

1. Auf [vercel.com](https://vercel.com) anmelden → **Add New** → **Project**
2. Das GitHub-Repo `2003-Anonymous/LinoWebsite` auswählen → **Import**
3. Einstellungen:
   - **Framework Preset:** `Other`
   - **Build Command:** leer lassen
   - **Output Directory:** leer lassen
4. **Deploy** klicken

Danach zeigt Vercel die Adresse an, z.B. `https://lino-website.vercel.app`.
**Diese Adresse notieren** – sie wird in Schritt 2 und 4 gebraucht.

> Die Website ist ab jetzt online, aber die Anmeldung am Admin-Bereich
> funktioniert noch nicht. Das kommt in den nächsten Schritten.

---

## Schritt 2 – GitHub-OAuth-App anlegen

Damit sich Lino anmelden kann, braucht GitHub die Information, dass unsere
Seite Anmeldungen durchführen darf.

1. GitHub → oben rechts aufs Profilbild → **Settings**
2. Ganz unten links: **Developer settings**
3. **OAuth Apps** → **New OAuth App**
4. Ausfüllen:

   | Feld | Wert |
   |---|---|
   | Application name | `Lino Website Admin` |
   | Homepage URL | deine Vercel-Adresse |
   | Authorization callback URL | deine Vercel-Adresse + `/api/callback` |

   Beispiel für die Callback-URL:
   `https://lino-website.vercel.app/api/callback`

   ⚠️ Der häufigste Fehler: Die Callback-URL muss **exakt** stimmen –
   kein Schrägstrich am Ende, `https` statt `http`.

5. **Register application**
6. Die **Client ID** notieren
7. **Generate a new client secret** → das **Client Secret** sofort notieren
   (es wird nur ein einziges Mal angezeigt)

---

## Schritt 3 – Zugangsdaten in Vercel hinterlegen

1. Vercel → dein Projekt → **Settings** → **Environment Variables**
2. Zwei Einträge anlegen:

   | Name | Wert |
   |---|---|
   | `GIT_CLIENT_ID` | die Client ID aus Schritt 2 |
   | `GIT_CLIENT_SECRET` | das Client Secret aus Schritt 2 |

3. Bei beiden alle Umgebungen angehakt lassen (Production, Preview, Development)
4. **Wichtig:** Danach **Deployments** → beim neuesten Eintrag auf **⋯** →
   **Redeploy**. Ohne das kennt die Seite die neuen Werte nicht.

---

## Schritt 4 – Adresse überall eintragen

An vier Stellen steht ein Platzhalter, der durch die echte Adresse ersetzt
werden muss. Suche im Projekt nach `BITTE-HIER-DIE` – dann findest du alle:

| Datei | Wozu |
|---|---|
| `admin/config.yml` | Anmeldung am Admin-Bereich |
| `index.html` | Vorschaubild beim Teilen, Angaben für Google |
| `robots.txt` | Verweis auf die Sitemap |
| `sitemap.xml` | Adresse der Seite für Google |

Überall `https://BITTE-HIER-DIE-ADRESSE-EINTRAGEN.vercel.app` durch deine
echte Adresse ersetzen, z.B. `https://lino-website.vercel.app`.
**Ohne Schrägstrich am Ende**, ausser dort, wo schon einer steht.

Dann hochladen:

```bash
git add -A
git commit -m "Adresse eingetragen"
git push
```

Vercel veröffentlicht die Änderung automatisch.

> Wenn ihr später eine eigene Domain nehmt (z.B. `lino-gautschi.ch`), müssen
> dieselben vier Stellen erneut angepasst werden.

---

## Schritt 5 – Selbst testen, bevor Lino es bekommt

1. `https://DEINE-ADRESSE/admin/` öffnen
2. **"Mit GitHub anmelden"** klicken
3. Es öffnet sich ein GitHub-Fenster → **Authorize** klicken
4. Du solltest jetzt die Bereiche *Startseite*, *Resultate*, *Sponsoren*
   und *Galerie* sehen
5. Zur Probe irgendwo einen Text ändern → **Speichern** → nach rund einer
   Minute auf der Website nachschauen

Wenn das klappt, funktioniert es auch für Lino.

---

## Schritt 6 – Lino Zugriff geben

1. Lino legt sich ein kostenloses GitHub-Konto an ([github.com/signup](https://github.com/signup))
   und schickt dir seinen Benutzernamen
2. GitHub → Repo `LinoWebsite` → **Settings** → **Collaborators** →
   **Add people** → seinen Benutzernamen eintragen
3. Lino bekommt eine E-Mail und muss die Einladung annehmen

> Ohne diesen Schritt kann Lino sich zwar anmelden, aber **nichts speichern**.

---

## Wenn etwas nicht funktioniert

| Problem | Ursache | Lösung |
|---|---|---|
| "Anmeldung ist nicht eingerichtet" | Umgebungsvariablen fehlen | Schritt 3, danach **Redeploy** nicht vergessen |
| GitHub zeigt "redirect_uri mismatch" | Callback-URL stimmt nicht | Schritt 2 prüfen, auf Tippfehler und Schrägstrich am Ende achten |
| "Sicherheitsprüfung fehlgeschlagen" | Anmeldefenster zu lange offen gelassen | Fenster schliessen, erneut anmelden |
| Anmeldung klappt, Speichern nicht | Lino ist kein Collaborator | Schritt 6 |
| Änderung ist nach 5 Min. nicht online | Veröffentlichung fehlgeschlagen | Vercel → **Deployments** → Fehlermeldung ansehen |

---

## Schritt 7 – Bei Google anmelden

Erst sinnvoll, wenn Schritt 4 erledigt ist und echte Texte auf der Seite
stehen.

1. [search.google.com/search-console](https://search.google.com/search-console)
   öffnen, mit dem Google-Konto anmelden
2. **Property hinzufügen** → **URL-Präfix** → die Adresse der Website eintragen
3. Bestätigung: Google bietet mehrere Wege an. Am einfachsten ist die
   **HTML-Datei**: herunterladen, in den Projektordner legen, committen,
   pushen – danach auf *Bestätigen* klicken.
4. Links auf **Sitemaps** → `sitemap.xml` eintragen → *Senden*
5. Oben in die Suchleiste die Adresse der Website eingeben →
   **Indexierung beantragen**

Danach dauert es in der Regel ein paar Tage bis zwei Wochen, bis die Seite
bei einer Suche nach „Lino Gautschi" erscheint.

**Was zusätzlich wirklich hilft** (mehr als jede technische Einstellung):

- **Eine eigene Domain** wie `lino-gautschi.ch` statt `…vercel.app`
- **Verlinkungen von anderen Seiten**: Instagram-Profil (Link in der Bio),
  Vereins-Website, Vereinsmitglied-Seiten, Wettkampf-Ergebnislisten.
  Solche Links sind der stärkste Faktor dafür, dass Google die Seite
  überhaupt ernst nimmt.
- **Echte Texte** statt Platzhalter. Google braucht Inhalt, den es lesen kann.

**Realistische Erwartung:** Eine Suche nach „Lino Gautschi" wird die Seite
finden. Bei allgemeinen Begriffen wie „Rettungsschwimmen Schweiz" wird sie
nicht weit oben stehen – dort konkurrieren Verbände und Vereine mit jahrelang
gewachsenen Seiten.

---

## Danach noch offen (kein Zeitdruck)

- Eigene Domain bei Vercel hinterlegen (statt `…vercel.app`)
- Platzhalterbilder durch echte Fotos ersetzen
- Echte Sponsoren-Logos statt der grauen Platzhalter
- Kontaktdaten ausfüllen – dort stehen noch Platzhalter
  (`E-Mail`, `Insta`, Telefonnummer `+41 79 000 00 00`)
