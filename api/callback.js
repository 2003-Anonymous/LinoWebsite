function cookieLesen(req, name) {
  const roh = req.headers.cookie || "";
  const treffer = roh
    .split(";")
    .map(teil => teil.trim())
    .find(teil => teil.startsWith(name + "="));
  return treffer ? decodeURIComponent(treffer.slice(name.length + 1)) : "";
}

function antwortSeite({ erfolg, nutzlast, erlaubterHost }) {
  const zustand = erfolg ? "success" : "error";
  const nachricht = `authorization:github:${zustand}:${JSON.stringify(nutzlast)}`;

  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><title>Anmeldung</title></head>
<body style="font-family: system-ui, sans-serif; padding: 24px">
<p>Anmeldung ${erfolg ? "erfolgreich" : "fehlgeschlagen"} – dieses Fenster schliesst sich gleich.</p>
<script>
(function () {
  var nachricht = ${JSON.stringify(nachricht)};
  var erlaubterHost = ${JSON.stringify(erlaubterHost)};

  function antworten(ereignis) {
    if (ereignis.data !== "authorizing:github") return;

    var absender;
    try { absender = new URL(ereignis.origin).hostname; } catch (e) { return; }
    if (absender !== erlaubterHost) return;

    window.removeEventListener("message", antworten);
    window.opener.postMessage(nachricht, ereignis.origin);
    setTimeout(function () { window.close(); }, 600);
  }

  window.addEventListener("message", antworten);
  if (window.opener) window.opener.postMessage("authorizing:github", "*");
})();
</script>
</body>
</html>`;
}

module.exports = async (req, res) => {
  const seitenHost = (req.headers["x-forwarded-host"] || req.headers.host || "").split(":")[0];

  const url = new URL(req.url, "https://" + (req.headers.host || "localhost"));
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const senden = (erfolg, nutzlast) => {

    res.setHeader("Set-Cookie", "csrf-token=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(antwortSeite({ erfolg, nutzlast, erlaubterHost: seitenHost }));
  };

  const gespeichert = cookieLesen(req, "csrf-token");

  if (!code || !state) {
    senden(false, { provider: "github", error: "Anfrage unvollständig", errorCode: "AUTH_CODE_REQUEST_FAILED" });
    return;
  }

  if (gespeichert !== "github_" + state) {
    senden(false, { provider: "github", error: "Sicherheitsprüfung fehlgeschlagen", errorCode: "CSRF_DETECTED" });
    return;
  }

  try {
    const antwort = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET
      })
    });

    const daten = await antwort.json();

    if (daten.access_token) {
      senden(true, { provider: "github", token: daten.access_token });
    } else {
      senden(false, {
        provider: "github",
        error: daten.error_description || daten.error || "Kein Token erhalten",
        errorCode: "TOKEN_REQUEST_FAILED"
      });
    }
  } catch (fehler) {
    senden(false, { provider: "github", error: String(fehler), errorCode: "TOKEN_REQUEST_FAILED" });
  }
};
