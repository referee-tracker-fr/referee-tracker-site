// Panier (page tarifs + page panier). Le paiement n'est pas encore ouvert : rien n'est envoyé, on calcule seulement le total.
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
        dMois: "10 prélèvements de {p}, de septembre à juin.", dSaison: "En une fois pour la saison, de septembre à juin. Au mois, ça ferait {p}." }
    : { ess: "Essentiel", pro: "Pro", elite: "Élite", clips: "REF CLIPS only", opt: "REF CLIPS add-on", mois: "a month", saison: "a season",
        dMois: "10 payments of {p}, September to June.", dSaison: "One payment for the season, September to June. Monthly would be {p}." };
  function euros(c) {
    var n = (c / 100).toFixed(2);
    return fr ? n.replace(".", ",") + " €" : "€" + n;
  }

  // Choix reçus dans l'adresse (?formule=pro&periode=saison&clips=1), seulement s'ils sont connus.
  var q = new URLSearchParams(location.search);
  if (PRIX[q.get("formule")]) f.formule.value = q.get("formule");
  if (q.get("periode") === "saison" || q.get("periode") === "mois") f.periode.value = q.get("periode");
  if (q.get("clips") === "1") f.clips.checked = true;

  function maj() {
    var fo = f.formule.value, i = f.periode.value === "saison" ? 1 : 0;
    var optPossible = fo === "ess" || fo === "pro";
    f.clips.disabled = !optPossible;
    document.getElementById("pn-opt").classList.toggle("off", !optPossible);
    document.getElementById("pn-inclus").hidden = fo !== "elite";
    document.getElementById("pn-opt-p").textContent = "+" + euros(OPTION[i]) + " " + (i ? T.saison : T.mois);
    var lignes = [[T[fo], PRIX[fo][i]]];
    if (optPossible && f.clips.checked) lignes.push([T.opt, OPTION[i]]);
    var total = 0, totalMois = 0;
    var ul = document.getElementById("pn-lignes");
    ul.textContent = "";
    lignes.forEach(function (l) {
      total += l[1];
      var li = document.createElement("li");
      var a = document.createElement("span"); a.textContent = l[0];
      var b = document.createElement("b"); b.textContent = euros(l[1]);
      li.append(a, b); ul.append(li);
    });
    totalMois = PRIX[fo][0] + (optPossible && f.clips.checked ? OPTION[0] : 0);
    var tot = document.getElementById("pn-total");
    tot.textContent = euros(total) + " " + (i ? T.saison : T.mois);
    tot.style.animation = "none"; void tot.offsetWidth; tot.style.animation = ""; // rejoue le fondu à chaque changement
    document.getElementById("pn-detail").textContent = i ? T.dSaison.replace("{p}", euros(totalMois * 10)) : T.dMois.replace("{p}", euros(total));
  }
  f.addEventListener("change", maj);
  f.addEventListener("submit", function (e) { e.preventDefault(); });
  maj();
})();
