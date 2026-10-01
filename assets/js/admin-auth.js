// Einfacher Passwortschutz für den Admin-Bereich.
//
// Wichtig: Das ist KEIN echter Sicherheitsmechanismus (der Code läuft im
// Browser und liesse sich mit Entwicklertools umgehen). Er verhindert nur,
// dass zufällige Besucher die Bearbeitungsoberfläche sehen/nutzen. Die echte
// Website kann über den Admin-Bereich ohnehin nicht verändert werden (siehe
// README) – Speichern schreibt nur in einen lokal ausgewählten Ordner.
//
// Passwort ändern: In der Browser-Konsole (F12) Folgendes ausführen und den
// Hash unten bei ADMIN_PASSWORD_HASH einsetzen:
//
//   crypto.subtle.digest("SHA-256", new TextEncoder().encode("neuesPasswort"))
//     .then(buf => console.log([...new Uint8Array(buf)]
//       .map(b => b.toString(16).padStart(2, "0")).join("")));
//
// Aktuelles Standard-Passwort: lino2026

const ADMIN_PASSWORD_HASH = "fe268d3573516b128b5e0ad6417cb962313ed6c7f966bcbf9a116cba67d2f2a5";
const SESSION_KEY = "lino-admin-unlocked";

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function showGate() {
  const overlay = document.createElement("div");
  overlay.id = "admin-gate";
  overlay.innerHTML = `
    <form id="admin-gate-form">
      <h1>Admin-Login</h1>
      <p>Bitte Passwort eingeben.</p>
      <input type="password" id="admin-gate-input" autocomplete="current-password" autofocus>
      <button type="submit">Weiter</button>
      <p id="admin-gate-error"></p>
    </form>
  `;
  document.body.appendChild(overlay);

  document.getElementById("admin-gate-form").addEventListener("submit", async e => {
    e.preventDefault();
    const input = document.getElementById("admin-gate-input").value;
    const hash = await sha256(input);
    if (hash === ADMIN_PASSWORD_HASH) {
      sessionStorage.setItem(SESSION_KEY, "1");
      unlock();
    } else {
      document.getElementById("admin-gate-error").textContent = "Falsches Passwort.";
    }
  });
}

function unlock() {
  const overlay = document.getElementById("admin-gate");
  if (overlay) overlay.remove();
  document.documentElement.classList.remove("admin-locked");
}

document.documentElement.classList.add("admin-locked");

if (sessionStorage.getItem(SESSION_KEY) === "1") {
  document.addEventListener("DOMContentLoaded", unlock);
} else {
  document.addEventListener("DOMContentLoaded", showGate);
}
