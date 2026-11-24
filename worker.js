// Sert les fichiers du site et ajoute les en-têtes de sécurité (impossibles sur GitHub Pages).
const ENTETES = {
  "X-Frame-Options": "DENY",
  "Content-Security-Policy": "frame-ancestors 'none'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=31536000",
};

export default {
  async fetch(req, env) {
    const u = new URL(req.url);
    if (u.hostname === "referee-tracker.fr") {
      u.protocol = "https:";
      u.hostname = "www.referee-tracker.fr";
      return Response.redirect(u.toString(), 301);
    }
    // Dossier (/, /en/, /guides/…) : on sert son index.html, sans changer l'adresse.
    const chemin = u.pathname.endsWith("/") ? u.pathname + "index.html" : u.pathname;
    let r = await env.ASSETS.fetch(new URL(chemin, u), req);
    let statut = r.status;
    if (statut === 404 && !u.pathname.endsWith("/") && !u.pathname.split("/").pop().includes(".")) {
      // /guides -> /guides/ (comme GitHub Pages)
      const dossier = await env.ASSETS.fetch(new URL(u.pathname + "/index.html", u));
      if (dossier.ok) { u.pathname += "/"; return Response.redirect(u.toString(), 301); }
    }
    if (statut === 404) {
      r = await env.ASSETS.fetch(new URL("/404.html", u));
      statut = 404;
    }
    const h = new Headers(r.headers);
    for (const [k, v] of Object.entries(ENTETES)) h.set(k, v);
    return new Response(r.body, { status: statut, headers: h });
  },
};
