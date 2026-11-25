// Panier en 3 étapes (page tarifs + page panier).
// Le paiement n'est pas encore ouvert : rien n'est envoyé d'ici, on calcule le total et on transmet le choix à l'inscription.
(function () {
  "use strict";
  // Prix en centimes : [au mois, la saison]
  var PRIX = { ess: [249, 1999], pro: [499, 3999], elite: [699, 5599], clips: [399, 3199] };
  var OPTION = [249, 1999];

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
        lMois: "Au mois, 10 prélèvements", lSaison: "À la saison, en une fois",
        dMois: "10 prélèvements de {p}, de septembre à juin.", dSaison: "Au mois, ça ferait {p}.", sMois: "Au mois, ça ferait {p} : tu gardes {e}." }
    : { ess: "Essentiel", pro: "Pro", elite: "Élite", clips: "REF CLIPS only", opt: "REF CLIPS add-on", mois: "a month", saison: "a season",
        lMois: "Monthly, 10 payments", lSaison: "Per season, one payment",
        dMois: "10 payments of {p}, September to June.", dSaison: "Monthly would be {p}.", sMois: "Monthly would be {p}: you keep {e}." };
  // Contenu de chaque formule (mêmes listes que la page tarifs)
  var INC = fr ? {
    ess: ["Convocations 5x5 et 3x3 lues automatiquement", "Indemnités au centime, kilomètres compris", "Qui te doit quoi : paiements et retards", "Agenda synchronisé", "Notifications : nouveau match, annulation, retard"],
    pro: ["Tout Essentiel", "Règlement et QCM adaptés à tes erreurs", "Rapports de match pré-remplis", "Progression : observations et axes de travail", "Statistiques de ta saison"],
    elite: ["Tout Pro", "REF CLIPS inclus, sur Mac et Windows", "Découpe tes matchs en clips", "Dessine sur l'image et code tes actions", "Rapport vidéo prêt à partager"],
    clips: ["REF CLIPS, sur Mac et Windows", "Découpe tes matchs en clips", "Dessine sur l'image et code tes actions", "Rapport vidéo prêt à partager"],
    opt: "REF CLIPS : clips, dessin sur l'image, rapport vidéo" } : {
    ess: ["5x5 and 3x3 appointments read automatically", "Fees to the cent, mileage included", "Who owes you what: payments and delays", "Synced calendar", "Alerts: new game, cancellation, late payment"],
    pro: ["Everything in Essentiel", "Rules and quizzes based on your mistakes", "Pre-filled game reports", "Progress: feedback and focus areas", "Season statistics"],
    elite: ["Everything in Pro", "REF CLIPS included, on Mac and Windows", "Cut your games into clips", "Draw on the image and tag your calls", "Video report ready to share"],
    clips: ["REF CLIPS, on Mac and Windows", "Cut your games into clips", "Draw on the image and tag your calls", "Video report ready to share"],
    opt: "REF CLIPS: clips, drawing on the image, video report" };
  var IMG = { ess: "app/paiements.webp", pro: "app/qcm.webp", elite: "app/accueil.webp", clips: "refclips/codes.webp" };
  var racine = fr ? "" : "../";
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

  function maj() {
    var e = etat();
    // étape 2 : prix des deux façons de payer et option
    var saison = PRIX[e.fo][1] + (e.opt ? OPTION[1] : 0);
    $('[data-prix="mois"]').textContent = euros(e.totalMois) + " " + T.mois;
    $('[data-prix="saison"]').textContent = euros(saison) + " " + T.saison;
    $("[data-saison-d]").textContent = T.sMois.replace("{p}", euros(e.totalMois * 10)).replace("{e}", euros(e.totalMois * 10 - saison));
    $("#pn-opt").hidden = !e.optPossible;
    f.clips.disabled = !e.optPossible;
    $("#pn-inclus").hidden = e.fo !== "elite";
    $("#pn-opt-p").textContent = "+" + euros(OPTION[e.i]) + " " + (e.i ? T.saison : T.mois);
    // étape 3 : articles du panier
    var ul = $("#pn-lignes");
    ul.textContent = "";
    var lignes = [[T[e.fo], e.i ? T.lSaison : T.lMois, PRIX[e.fo][e.i], IMG[e.fo], e.fo]];
    if (e.opt) lignes.push([T.opt, e.i ? T.lSaison : T.lMois, OPTION[e.i], "refclips/dessin.webp", "clips"]);
    lignes.forEach(function (l) {
      var li = document.createElement("li"); li.className = "pn-art pc-" + l[4];
      var im = document.createElement("img"); im.src = racine + "img/" + l[3]; im.alt = ""; im.loading = "lazy";
      var tx = document.createElement("span"); tx.className = "pn-art-t";
      var b = document.createElement("b"); b.textContent = l[0];
      var sp = document.createElement("span"); sp.textContent = l[1];
      tx.append(b, sp);
      var px = document.createElement("strong"); px.textContent = euros(l[2]);
      li.append(im, tx, px); ul.append(li);
    });
    var suffixe = " " + (e.i ? T.saison : T.mois);
    $("#pn-sous").textContent = euros(e.total) + suffixe;
    var tot = $("#pn-total"); tot.textContent = euros(e.total) + suffixe; rejouer(tot);
    $("#pn-payer-m").textContent = euros(e.total) + suffixe;
    var inc = $("#pn-inc"); inc.textContent = "";
    INC[e.fo].concat(e.opt ? [INC.opt] : []).forEach(function (t) { var li = document.createElement("li"); li.textContent = t; inc.append(li); });
    $("#pn-detail").textContent = e.i ? T.dSaison.replace("{p}", euros(e.totalMois * 10)) : T.dMois.replace("{p}", euros(e.total));
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
  f.addEventListener("change", maj);
  f.addEventListener("submit", function (e) { e.preventDefault(); });

  // Arrivée depuis la page tarifs : formule déjà choisie → on passe directement à l'étape suivante.
  aller(PRIX[q.get("formule")] ? (q.get("formule") === "ess" || q.get("formule") === "pro" ? 2 : 3) : 1);
})();
