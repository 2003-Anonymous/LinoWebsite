module.exports = (req, res) => {
  const clientId = process.env.GIT_CLIENT_ID;
  const clientSecret = process.env.GIT_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    res.status(500).send(
      "Anmeldung ist nicht eingerichtet: GIT_CLIENT_ID und GIT_CLIENT_SECRET " +
      "fehlen in den Vercel-Umgebungsvariablen."
    );
    return;
  }

  const state = require("crypto").randomUUID().replace(/-/g, "");

  res.setHeader(
    "Set-Cookie",
    `csrf-token=github_${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`
  );

  const ziel = new URL("https://github.com/login/oauth/authorize");
  ziel.searchParams.set("client_id", clientId);
  ziel.searchParams.set("scope", "repo,user");
  ziel.searchParams.set("state", state);

  res.writeHead(302, { Location: ziel.href });
  res.end();
};
