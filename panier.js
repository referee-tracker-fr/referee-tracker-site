// Panier en 3 étapes (page tarifs + page panier).
// Le paiement n'est pas encore ouvert : rien n'est envoyé d'ici, on calcule le total et on transmet le choix à l'inscription.
(function () {
  "use strict";
  // Prix en centimes : [au mois, la saison]
  var PRIX = { ess: [249, 1999], pro: [499, 3999], elite: [699, 5599], clips: [399, 3199] };
  var OPTION = [249, 1999];

  // Vente en ligne : c'est la base qui décide (interrupteur). Fermée, ou en cas d'erreur, la page reste telle quelle.
  var SUPA = "https://jlstedchnmdteazuqbly.supabase.co";
  var CLE = "sb_publishable_B1w244FrkzbIn-SZ-T_z8w_4HVg9stb"; // clé publique (publishable) : pas un secret
  var EN = document.documentElement.lang === "en";
  var vente = fetch(SUPA + "/rest/v1/rpc/rt_paiement_public", {
    method: "POST", headers: { apikey: CLE, "Content-Type": "application/json" }, body: "{}"
  }).then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) { return d && d.actif === true ? d : null; })
    .catch(function () { return null; });

  // Cases obligatoires avant de payer (non cochées par défaut) : accès immédiat (le droit de rétractation reste, au prorata) et majorité.
  var CASES = EN ? ["I request immediate access. If I withdraw within 14 days, I only pay for the part already used.", "I am 18 or have my legal guardian's consent"]
                 : ["Je demande l’accès immédiat. Si je me rétracte dans les 14 jours, je paie seulement la part déjà utilisée.", "J’ai 18 ans ou l’accord de mon représentant légal"];
  function casesPaiement(onChange) {
    var bloc = document.createDocumentFragment(), boites = [];
    CASES.forEach(function (texte) {
      var l = document.createElement("label"); l.className = "renonce";
      var c = document.createElement("input"); c.type = "checkbox";
      var t = document.createElement("span"); t.textContent = texte;
      l.append(c, t); bloc.append(l); boites.push(c);
      c.addEventListener("change", function () { onChange(boites.every(function (b) { return b.checked; })); });
    });
    return bloc;
  }
  function lienCGV() {
    var p = document.createElement("p"); p.className = "pn-cgv";
    var a = document.createElement("a"); a.href = EN ? "terms-of-sale.html" : "cgv.html"; a.target = "_blank"; a.rel = "noopener";
    a.textContent = EN ? "terms of sale" : "conditions générales de vente";
    p.append(EN ? "By paying, you accept the " : "En payant, tu acceptes les ", a, ".");
    return p;
  }
  // Prélèvements au mois de la saison en cours : du mois d'arrivée jusqu'à juin (en juillet-août : la saison suivante, 10 mois).
  var MOIS = EN ? ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
                : ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  var SAISON = (function () {
    var m = new Date().getMonth();
    if (m === 6 || m === 7) m = 8;
    return { n: m >= 8 ? 18 - m : 6 - m, debut: MOIS[m] };
  })();
  function texteMois(n) {
    if (n === 1) return EN ? "1 payment, in June" : "1 prélèvement, en juin";
    return EN ? n + " payments, " + SAISON.debut + " to June" : n + " prélèvements, de " + SAISON.debut + " à juin";
  }
  // Page tarifs : sous les prix des cartes, le compte des mois restants.
  document.querySelectorAll(".pc-sous").forEach(function (p) {
    var carte = p.closest(".pc"), k = carte && (carte.classList.contains("pc-ess") ? "ess" : carte.classList.contains("pc-pro") ? "pro" : carte.classList.contains("pc-elite") ? "elite" : "");
    if (!k) return;
    var m = p.querySelector(".m"), s = p.querySelector(".s");
    if (m) m.textContent = texteMois(SAISON.n);
    if (s) s.textContent = (EN ? "Monthly would be " : "Au mois, ça ferait ") + eurosTarifs(PRIX[k][0] * SAISON.n);
  });
  function eurosTarifs(c) { var n = (c / 100).toFixed(2); return EN ? "€" + n : n.replace(".", ",") + " €"; }
  // Page tarifs : compteur de places et bouton de l'offre Fondateur (seulement si la vente est ouverte).
  var fondateur = document.querySelector(".fondateur");
  if (fondateur) vente.then(function (d) {
    if (!d) return;
    var n = Math.max(0, Number(d.fondateur_restantes) || 0);
    var c = document.createElement("p"); c.className = "fondateur-compteur";
    c.textContent = EN ? n + (n > 1 ? " places left" : " place left") + " out of 50" : n + (n > 1 ? " places restantes" : " place restante") + " sur 50";
    var bouton = fondateur.querySelector(".btn");
    fondateur.insertBefore(c, bouton);
    if (d.fondateur_ouvert && n > 0) {
      var a = document.createElement("a"); a.className = "btn btn-gold";
      a.href = (EN ? "../signup.html" : "inscription.html") + "?formule=fondateur&payer=1&renonciation=1&majeur=1";
      a.textContent = EN ? "Become a Founder · Pay €34.99" : "Devenir Fondateur · Payer 34,99 €";
      a.setAttribute("aria-disabled", "true"); a.classList.add("off");
      a.addEventListener("click", function (e) { if (a.classList.contains("off")) e.preventDefault(); });
      bouton.replaceWith(a);
      var rec = document.createElement("p"); rec.className = "pn-cgv";
      rec.textContent = EN ? "14 days to withdraw: you only pay for the part already used." : "14 jours pour te rétracter : tu paies seulement la part déjà utilisée.";
      a.before(rec, casesPaiement(function (ok) { a.classList.toggle("off", !ok); a.setAttribute("aria-disabled", String(!ok)); }), lienCGV());
    }
  });

  // Retour de Stripe après un paiement abandonné : un petit message, rien de plus.
  if (new URLSearchParams(location.search).get("paiement") === "annule") {
    var tete = document.querySelector(".tarifs-tete");
    if (tete) {
      var m = document.createElement("p"); m.className = "paiement-annule"; m.setAttribute("role", "status");
      m.textContent = EN ? "Payment cancelled: nothing has been charged." : "Paiement annulé : rien n'a été prélevé.";
      tete.append(m);
    }
  }

  // Page tarifs : le bouton emporte le choix « au mois / à la saison » vers le panier.
  document.querySelectorAll("a[data-panier]").forEach(function (a) {
    a.addEventListener("click", function () {
      var s = document.getElementById("p-saison");
      var u = new URL(a.getAttribute("href"), location.href);
      u.searchParams.set("periode", s && s.checked ? "saison" : "mois");
      a.href = u.toString();
    });
  });

  var f = document.getElementById("panier");
  if (!f) return;
  var fr = f.dataset.lang === "fr";
  var T = fr
    ? { ess: "Essentiel", pro: "Pro", elite: "Élite", clips: "REF CLIPS seul", opt: "Option REF CLIPS", mois: "par mois", saison: "la saison",
        lMois: "Au mois, {n} prélèvements", lSaison: "À la saison, en une fois",
        dMois: "{n} prélèvements de {p}, de {d} à juin.", dSaison: "Au mois, ça ferait {p}.", sMois: "Au mois, ça ferait {p} : tu gardes {e}.", sMoins: "Au mois, ça ferait {p} : moins cher que la saison à ce moment de l'année." }
    : { ess: "Essentiel", pro: "Pro", elite: "Élite", clips: "REF CLIPS only", opt: "REF CLIPS add-on", mois: "a month", saison: "a season",
        lMois: "Monthly, {n} payments", lSaison: "Per season, one payment",
        dMois: "{n} payments of {p}, {d} to June.", dSaison: "Monthly would be {p}.", sMois: "Monthly would be {p}: you keep {e}.", sMoins: "Monthly would be {p}: cheaper than the season at this time of year." };
  if (SAISON.n === 1) {   // en juin : un seul prélèvement
    T.lMois = fr ? "Au mois, 1 prélèvement" : "Monthly, 1 payment";
    T.dMois = fr ? "1 prélèvement de {p}, en juin." : "1 payment of {p}, in June.";
  }
  // Contenu de chaque formule (mêmes listes que la page tarifs)
  var INC = fr ? {
    ess: ["Convocations 5x5 et 3x3 lues automatiquement", "Indemnités au centime, kilomètres compris", "Qui te doit quoi : paiements et retards", "Agenda synchronisé", "Notifications : nouveau match, annulation, retard"],
    pro: ["Tout Essentiel", "Export PDF de l'année pour ta déclaration de revenus", "Statistiques de ta saison", "Carte des salles où tu as arbitré", "Hôtel et télépéage", "Contacts de tes collègues", "QCM d'entraînement"],
    elite: ["Toute l'app", "Règlement : pose tes questions à l'IA", "QCM adaptés à tes erreurs", "Progression : observations et axes de travail", "Rapports de match pré-remplis", "REF CLIPS sur Mac et Windows : clips, dessin, codage, rapport vidéo"],
    clips: ["REF CLIPS, sur Mac et Windows", "Découpe tes matchs en clips", "Dessine sur l'image et code tes actions", "Rapport vidéo prêt à partager"],
    opt: "REF CLIPS : clips, dessin, codage, rapport vidéo" } : {
    ess: ["5x5 and 3x3 appointments read automatically", "Fees to the cent, mileage included", "Who owes you what: payments and delays", "Synced calendar", "Alerts: new game, cancellation, late payment"],
    pro: ["Everything in Essentiel", "Yearly PDF export for your tax return", "Season statistics", "Map of the venues you've refereed", "Hotel and toll tags", "Your colleagues' contacts", "Practice quizzes"],
    elite: ["The whole app", "Rules: ask the AI your questions", "Quizzes based on your mistakes", "Progress: feedback and focus areas", "Pre-filled game reports", "REF CLIPS on Mac and Windows: clips, drawing, tagging, video report"],
    clips: ["REF CLIPS, on Mac and Windows", "Cut your games into clips", "Draw on the image and tag your calls", "Video report ready to share"],
    opt: "REF CLIPS: clips, drawing, tagging, video report" };
  function euros(c) {
    var n = (c / 100).toFixed(2);
    return fr ? n.replace(".", ",") + " €" : "€" + n;
  }
  function $(s) { return f.querySelector(s); }

  // Choix reçus dans l'adresse (?formule=pro&periode=saison&clips=1), seulement s'ils sont connus.
  var q = new URLSearchParams(location.search);
  if (PRIX[q.get("formule")]) f.formule.value = q.get("formule");
  if (q.get("periode") === "saison" || q.get("periode") === "mois") f.periode.value = q.get("periode");
  if (q.get("clips") === "1") f.clips.checked = true;

  function etat() {
    var fo = f.formule.value, i = f.periode.value === "saison" ? 1 : 0;
    var opt = (fo === "ess" || fo === "pro") && f.clips.checked;
    return { fo: fo, i: i, optPossible: fo === "ess" || fo === "pro", opt: opt,
             total: PRIX[fo][i] + (opt ? OPTION[i] : 0), totalMois: PRIX[fo][0] + (opt ? OPTION[0] : 0) };
  }

  function rejouer(el) { el.style.animation = "none"; void el.offsetWidth; el.style.animation = ""; }

  var recapitulatif = null;   // rempli seulement si la vente est ouverte
  function maj() {
    var e = etat();
    if (recapitulatif) recapitulatif(e);
    // étape 2 : prix des deux façons de payer et option
    var saison = PRIX[e.fo][1] + (e.opt ? OPTION[1] : 0);
    $('[data-prix="mois"]').textContent = euros(e.totalMois) + " " + T.mois;
    $('[data-prix="saison"]').textContent = euros(saison) + " " + T.saison;
    var auMois = e.totalMois * SAISON.n;
    $("[data-saison-d]").textContent = (auMois > saison ? T.sMois : T.sMoins).replace("{p}", euros(auMois)).replace("{e}", euros(auMois - saison));
    $('[data-prix="mois"]').nextElementSibling.textContent = texteMois(SAISON.n) + (EN ? ". No commitment." : ". Sans engagement.");
    $("#pn-opt").hidden = !e.optPossible;
    f.clips.disabled = !e.optPossible;
    $("#pn-inclus").hidden = e.fo !== "elite";
    $("#pn-opt-p").textContent = "+" + euros(OPTION[e.i]) + " " + (e.i ? T.saison : T.mois);
    // étape 3 : articles du panier
    var ul = $("#pn-lignes");
    ul.textContent = "";
    var lignes = [[T[e.fo],  e.i ? T.lSaison : T.lMois.replace("{n}", SAISON.n), PRIX[e.fo][e.i], "", e.fo]];
    if (e.opt) lignes.push([T.opt,  e.i ? T.lSaison : T.lMois.replace("{n}", SAISON.n), OPTION[e.i], "", "clips"]);
    lignes.forEach(function (l) {
      var li = document.createElement("li"); li.className = "pn-art pc-" + l[4];
      var tu = document.createElement("span"); tu.className = "pn-tuile"; tu.setAttribute("aria-hidden", "true");
      var lo = document.createElement("img"); lo.alt = "";
      lo.src = (fr ? "" : "../") + (l[4] === "clips" ? "img/refclips/logo.svg" : "img/logo-icon-sm.png");
      tu.append(lo);
      var tx = document.createElement("span"); tx.className = "pn-art-t";
      var b = document.createElement("b"); b.textContent = l[0];
      var sp = document.createElement("span"); sp.textContent = l[1];
      tx.append(b, sp);
      var px = document.createElement("strong"); px.textContent = euros(l[2]);
      li.append(tu, tx, px); ul.append(li);
    });
    var suffixe = " " + (e.i ? T.saison : T.mois);
    var tot = $("#pn-total"); tot.textContent = euros(e.total) + suffixe; rejouer(tot);
    $("#pn-payer-m").textContent = euros(e.total) + suffixe;
    var inc = $("#pn-inc"); inc.textContent = "";
    INC[e.fo].concat(e.opt ? [INC.opt] : []).forEach(function (t) { var li = document.createElement("li"); li.textContent = t; inc.append(li); });
    $("#pn-detail").textContent = e.i ? T.dSaison.replace("{p}", euros(e.totalMois * SAISON.n)) : T.dMois.replace("{n}", SAISON.n).replace("{p}", euros(e.total)).replace("{d}", SAISON.debut);
    // l'essai gratuit emporte le choix vers l'inscription
    var a = $("#pn-essai"), u = new URL(a.getAttribute("href"), location.href);
    u.search = "";
    u.searchParams.set("formule", e.fo); u.searchParams.set("periode", e.i ? "saison" : "mois");
    if (e.opt) u.searchParams.set("clips", "1");
    a.href = u.toString();
    // adresse de la page à jour (retour arrière, partage)
    history.replaceState(null, "", "?" + u.searchParams.toString() + "#etape" + courante);
  }

  // Étapes : une seule visible à la fois (sans JavaScript, tout reste affiché).
  var courante = 1;
  function aller(n) {
    courante = n;
    f.classList.add("js");
    f.querySelectorAll(".pn-etape").forEach(function (s) {
      var vis = +s.dataset.etape === n;
      s.hidden = !vis;
      if (vis) rejouer(s);
    });
    f.querySelectorAll(".pn-etapes li").forEach(function (li) {
      var k = +li.dataset.e;
      li.classList.toggle("fait", k < n); li.classList.toggle("actif", k === n);
      if (k === n) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
    });
    maj();
    var h = f.querySelector('.pn-etape[data-etape="' + n + '"] h1');
    if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  f.addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-aller]");
    if (b) aller(+b.dataset.aller);
  });
  vente.then(function (d) {
    if (!d) return;
    var payer = $(".pn-payer");
    var note = $(".pn-bientot");
    payer.disabled = false; payer.className = "btn btn-gold pn-btn";
    var montant = $("#pn-payer-m");
    payer.textContent = EN ? "Pay " : "Payer "; payer.append(montant);
    if (note) note.hidden = true;
    var essai = $("#pn-essai"); essai.classList.remove("btn-gold"); essai.classList.add("btn-ghost");
    essai.before(payer); payer.style.marginBottom = "10px"; // « Payer » devient le bouton principal
    payer.disabled = true;
    // Récapitulatif juste avant le bouton : formule, prix, prélèvements, reprise, rétractation, CGV.
    var recap = document.createElement("ul"); recap.className = "pn-resume"; recap.id = "pn-recap";
    payer.before(recap, casesPaiement(function (ok) { payer.disabled = !ok; }), lienCGV());
    recapitulatif = function (e) {
      var nom = T[e.fo] + (e.opt ? " + REF CLIPS" : ""), lignes;
      if (e.i) lignes = fr
        ? [nom + " à la saison : " + euros(e.total) + ", toutes charges comprises (TVA non applicable).", "Un seul paiement, aujourd'hui. Accès jusqu'au 31 août, sans renouvellement automatique."]
        : [nom + " per season: " + euros(e.total) + ", all charges included (VAT not applicable).", "One payment, today. Access until 31 August, no automatic renewal."];
      else lignes = fr
        ? [nom + " au mois : " + euros(e.total) + " par mois, toutes charges comprises (TVA non applicable).", texteMois(SAISON.n) + ", rien en juillet et août.", "Reprise en septembre pour la nouvelle saison : tu es prévenu en août et tu peux résilier à tout moment."]
        : [nom + " monthly: " + euros(e.total) + " a month, all charges included (VAT not applicable).", texteMois(SAISON.n) + ", nothing in July and August.", "Restarts in September for the new season: you are reminded in August and can cancel at any time."];
      lignes.push(fr ? "14 jours pour te rétracter : tu paies seulement la part déjà utilisée." : "14 days to withdraw: you only pay for the part already used.");
      payer.firstChild.nodeValue = e.i ? (fr ? "Payer " : "Pay ") : (fr ? "S'abonner · " : "Subscribe · ");   // bouton final
      recap.textContent = "";
      lignes.forEach(function (t) { var li = document.createElement("li"); li.textContent = t; recap.append(li); });
    };
    maj();
    payer.addEventListener("click", function () {
      // on passe par l'inscription (création du compte), puis le paiement Stripe s'ouvre tout seul
      var u = new URL($("#pn-essai").href); u.searchParams.set("payer", "1"); u.searchParams.set("renonciation", "1"); u.searchParams.set("majeur", "1"); location.href = u.toString();
    });
  });
  f.addEventListener("change", maj);
  f.addEventListener("submit", function (e) { e.preventDefault(); });

  // Arrivée depuis la page tarifs : formule déjà choisie → on passe directement à l'étape suivante.
  aller(PRIX[q.get("formule")] ? (q.get("formule") === "ess" || q.get("formule") === "pro" ? 2 : 3) : 1);
})();
