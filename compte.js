// Page « Mon compte » : connexion avec le compte de l'app (2FA comprise), état de la formule, changement, résiliation, portail Stripe.
// Seule la clé publishable est ici ; les vraies règles (prix payé, droits) sont appliquées par le serveur.
(function () {
  "use strict";
  var page = document.querySelector(".cp");
  if (!page) return;
  var EN = page.dataset.lang === "en";
  var SB = "https://jlstedchnmdteazuqbly.supabase.co";
  var CLE = "sb_publishable_B1w244FrkzbIn-SZ-T_z8w_4HVg9stb";
  var STOCK = "rt_compte_session";
  var PRIX = { essentiel: [2.49, 19.99], pro: [4.99, 39.99], elite: [6.99, 55.99], clips: [3.99, 31.99], option: [2.49, 19.99], fondateur: 34.99 };
  var NOMS = { essentiel: "Essentiel", pro: "Pro", elite: EN ? "Elite" : "Élite", clips: EN ? "REF CLIPS only" : "REF CLIPS seul", fondateur: EN ? "Founder" : "Fondateur" };
  var T = EN ? {
    ferme: "Subscriptions open soon. You keep full access to the app.",
    reseau: "Can't connect right now, try again in a moment.", erreur: "Something went wrong, try again in a moment.",
    identifiants: "Wrong email or password.", champs: "Enter your email and password.", connexion: "Logging in…",
    oubliEmail: "Enter your email above first.", oubliOk: "If this email has an account, you'll get a link to choose a new password.",
    code: "Enter the 6 digits of the code.", codeFaux: "Wrong code, try again.", connecte: "Logged in as ",
    merci: "Thank you, your payment is recorded. Your plan turns on in a moment.", annule: "Payment cancelled: nothing was charged.",
    complet: "Full access, free during the test phase.", essai: "Free trial, all features open, until {d}.",
    lecture: "Read-only account", depuis: " since {d}", resilie: ". Contract cancelled: access until {d}, no more payments.",
    suite: " Next season: {f}.", fondateurE: "Founder offer: all features until {d}.",
    mois: ". Charged each month from September to June (nothing in July and August), current access until {d}.",
    saisonE: ". Access until {d}. Paid per season: nothing renews automatically.",
    auMois: ", monthly", aLaSaison: ", per season",
    resilier: "Cancel my contract", portail: "My invoices and card",
    avant: "Before you confirm the cancellation:", c1: "no new payment will be taken;", c2: "you keep your plan until {d}, the end of the period already paid;",
    c3: "then your account becomes read-only: your games, payments and exports stay visible;", c4: "you get a confirmation email.",
    confirmer: "Confirm the cancellation", annuler: "Back",
    changerT: "Change plan", choisirT: "Choose a plan", formule: "Plan", auMoisL: "Monthly", saisonL: "Per season",
    aide: "Monthly: September to June, no commitment, restarts each September (we remind you in August). Per season: one payment, until 31 August, no renewal.",
    fond: "Founder: {p} once, all features until 31 August 2028. {n} places left.", ajout: "Add REF CLIPS",
    renonce: "I ask for immediate access and give up my 14-day right of withdrawal",
    payer: "Pay", valider: "Confirm the change",
    total: "Total: {p}", uneFois: " once", pourSaison: " for the season", parMois: " a month",
    actuelle: "This is your current plan.", diff: "You only pay the difference: {p}, right away.",
    nouveau: "New price: {p} a month. The difference for the current month is charged now, pro rata of the days left.",
    moins: "Cheaper plan: it starts next season. You keep your current plan until then.",
    ouverture: "Opening the secure payment page…", enreg: "Saving…",
    noteSaison: "Noted: your new plan starts next season.", fait: "Done: your new plan is active.",
    resil: "Cancelling…", resilFait: "Done: your contract is cancelled, no more payments. A confirmation email has been sent.",
    E: { PAIEMENT_FERME: "Payment is not open yet.", FONDATEUR_FERME: "The Founder offer isn't available (full or closed).", DEJA_FONDATEUR: "You already have the Founder offer.",
      AUCUN_ABONNEMENT: "No monthly subscription in progress.", RENONCIATION: "Tick the « immediate access » box to continue.",
      PAIEMENT_REFUSE: "Your card was declined: nothing changed. Update it in « My invoices and card ».", MEME_FORMULE: "This is already your plan.",
      PAS_DE_FORMULE: "No paid plan in progress: choose a plan.", AUCUN_PAIEMENT: "No payment found for this account.", FORMULE: "This plan isn't available.",
      AUTH: "Your session has expired: log in again." }
  } : {
    ferme: "Les abonnements ouvriront bientôt. Ton accès à l'app reste complet.",
    reseau: "Connexion impossible pour le moment, réessaie dans un instant.", erreur: "Une erreur est survenue, réessaie dans un instant.",
    identifiants: "E-mail ou mot de passe incorrect.", champs: "Indique ton e-mail et ton mot de passe.", connexion: "Connexion…",
    oubliEmail: "Indique d'abord ton e-mail au-dessus.", oubliOk: "Si cet e-mail a un compte, tu vas recevoir un lien pour choisir un nouveau mot de passe.",
    code: "Tape les 6 chiffres du code.", codeFaux: "Code incorrect, réessaie.", connecte: "Connecté avec ",
    merci: "Merci, ton paiement est enregistré, ta formule s'active dans un instant.", annule: "Paiement annulé : rien n'a été prélevé.",
    complet: "Accès complet offert pendant la phase de test.", essai: "Essai gratuit, toutes les fonctions ouvertes, jusqu'au {d}.",
    lecture: "Compte en lecture seule", depuis: " depuis le {d}", resilie: ". Contrat résilié : accès jusqu'au {d}, plus aucun prélèvement.",
    suite: " À la saison prochaine : {f}.", fondateurE: "Offre Fondateur : toutes les fonctions jusqu'au {d}.",
    mois: ". Prélèvement chaque mois de septembre à juin (rien en juillet et août), accès en cours jusqu'au {d}.",
    saisonE: ". Accès jusqu'au {d}. Paiement à la saison : rien ne se renouvelle tout seul.",
    auMois: ", au mois", aLaSaison: ", à la saison",
    resilier: "Résilier votre contrat", portail: "Mes factures et ma carte",
    avant: "Avant de confirmer la résiliation :", c1: "aucun nouveau prélèvement ne sera fait ;", c2: "tu gardes ta formule jusqu'au {d}, la fin de la période déjà payée ;",
    c3: "ensuite ton compte passe en lecture seule : tes matchs, tes paiements et tes exports restent visibles ;", c4: "tu reçois un mail de confirmation.",
    confirmer: "Confirmer la résiliation", annuler: "Annuler",
    changerT: "Changer de formule", choisirT: "Choisir une formule", formule: "Formule", auMoisL: "Au mois", saisonL: "À la saison",
    aide: "Au mois : de septembre à juin, sans engagement, reprise chaque septembre (tu es prévenu en août). À la saison : en une fois, jusqu'au 31 août, sans renouvellement.",
    fond: "Fondateur : {p} en une fois, toutes les fonctions jusqu'au 31 août 2028. Encore {n} places.", ajout: "Ajouter REF CLIPS",
    renonce: "Je demande l'accès immédiat et je renonce à mon droit de rétractation de 14 jours",
    payer: "Payer", valider: "Valider le changement",
    total: "Total : {p}", uneFois: " en une fois", pourSaison: " pour la saison", parMois: " par mois",
    actuelle: "C'est ta formule actuelle.", diff: "Tu paies seulement la différence : {p}, tout de suite.",
    nouveau: "Nouveau prix : {p} par mois. La différence pour le mois en cours est prélevée tout de suite, au prorata des jours restants.",
    moins: "Formule moins chère : elle prendra effet à la saison prochaine. Tu gardes ta formule actuelle jusque-là.",
    ouverture: "Ouverture de la page de paiement sécurisée…", enreg: "Enregistrement…",
    noteSaison: "C'est noté : ta nouvelle formule commencera à la saison prochaine.", fait: "C'est fait : ta nouvelle formule est active.",
    resil: "Résiliation…", resilFait: "C'est fait : ton contrat est résilié, plus aucun prélèvement. Un mail de confirmation t'a été envoyé.",
    E: { PAIEMENT_FERME: "Le paiement n'est pas encore ouvert.", FONDATEUR_FERME: "L'offre Fondateur n'est pas disponible (complète ou fermée).", DEJA_FONDATEUR: "Tu as déjà l'offre Fondateur.",
      AUCUN_ABONNEMENT: "Aucun abonnement au mois en cours.", RENONCIATION: "Coche la case « accès immédiat » pour continuer.",
      PAIEMENT_REFUSE: "Ta carte a été refusée : rien n'a changé. Mets-la à jour dans « Mes factures et ma carte ».", MEME_FORMULE: "C'est déjà ta formule.",
      PAS_DE_FORMULE: "Aucune formule payée en cours : choisis une formule.", AUCUN_PAIEMENT: "Aucun paiement trouvé pour ce compte.", FORMULE: "Cette formule n'est pas disponible.",
      AUTH: "Ta session a expiré : reconnecte-toi." }
  };

  var $ = function (id) { return document.getElementById(id); };
  var fConn = $("cp-connexion"), fCode = $("cp-code"), bloc = $("cp-compte"), zone = $("cp-zone");
  function msg(el, t) { (el.classList.contains("cp-msg") ? el : el.querySelector(".cp-msg")).textContent = t || ""; }
  function eur(x) { var n = x.toFixed(2); return EN ? "€" + n : n.replace(".", ",") + " €"; }
  function date(s) { return s ? new Date(s).toLocaleDateString(EN ? "en-GB" : "fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" }) : ""; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function aal(jeton) { try { return JSON.parse(atob(jeton.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).aal; } catch (e) { return ""; } }

  // Session : sessionStorage seulement (fermée avec l'onglet), jamais dans l'adresse.
  var S = null;
  try { S = JSON.parse(sessionStorage.getItem(STOCK) || "null"); } catch (e) { S = null; }
  function garder(j) {
    S = { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: j.expires_at || Math.floor(Date.now() / 1000) + (j.expires_in || 3600), email: (j.user && j.user.email) || (S && S.email) || "" };
    try { sessionStorage.setItem(STOCK, JSON.stringify(S)); } catch (e) { /* navigation privée stricte : la session reste en mémoire */ }
  }
  function oublier() { S = null; try { sessionStorage.removeItem(STOCK); } catch (e) {} }

  function auth(chemin, corps, jeton, methode) {
    var h = { apikey: CLE, "Content-Type": "application/json" };
    if (jeton) h.Authorization = "Bearer " + jeton;
    return fetch(SB + "/auth/v1/" + chemin, { method: methode || "POST", headers: h, body: corps ? JSON.stringify(corps) : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, statut: r.status, j: j }; }); });
  }
  // Jeton valide (rafraîchi s'il expire dans moins d'une minute).
  function jeton() {
    if (!S) return Promise.reject(new Error(T.E.AUTH));
    if (S.expires_at - 60 > Date.now() / 1000) return Promise.resolve(S.access_token);
    return auth("token?grant_type=refresh_token", { refresh_token: S.refresh_token }).then(function (r) {
      if (!r.ok || !r.j.access_token) { oublier(); throw new Error(T.E.AUTH); }
      garder(r.j); return S.access_token;
    });
  }

  function afficher(quoi) {
    fConn.hidden = quoi !== "connexion"; fCode.hidden = quoi !== "code"; bloc.hidden = quoi !== "compte";
    var cible = quoi === "connexion" ? $("cp-email") : quoi === "code" ? $("cp-totp") : null;
    if (cible) cible.focus();
  }

  /* ---------- Connexion ---------- */
  var facteur = null;
  fConn.addEventListener("submit", function (e) {
    e.preventDefault();
    var email = $("cp-email").value.trim(), mdp = $("cp-mdp").value;
    if (!email || !mdp) { msg(fConn, T.champs); return; }
    var b = fConn.querySelector("[type=submit]"); b.disabled = true; msg(fConn, T.connexion);
    auth("token?grant_type=password", { email: email, password: mdp }).then(function (r) {
      if (!r.ok || !r.j.access_token) throw new Error(r.statut === 400 || r.statut === 401 ? T.identifiants : T.erreur);
      garder(r.j); $("cp-mdp").value = "";
      return apresConnexion();
    }).catch(function (err) { msg(fConn, err instanceof TypeError ? T.reseau : err.message); }).then(function () { b.disabled = false; });
  });
  // Même règle que l'app : facteur TOTP vérifié (hors facteurs « admin ») → code demandé pour passer en aal2.
  function apresConnexion() {
    if (aal(S.access_token) === "aal2") return montrerCompte();
    return auth("user", null, S.access_token, "GET").then(function (r) {
      var f = ((r.j && r.j.factors) || []).filter(function (x) { return x.factor_type === "totp" && x.status === "verified" && !/^admin/i.test(x.friendly_name || ""); })[0];
      if (!f) return montrerCompte();
      facteur = f.id; $("cp-totp").value = ""; msg(fCode, ""); afficher("code");
    });
  }
  fCode.addEventListener("submit", function (e) {
    e.preventDefault();
    var code = $("cp-totp").value.replace(/\D/g, "");
    if (code.length !== 6) { msg(fCode, T.code); return; }
    var b = fCode.querySelector("[type=submit]"); b.disabled = true; msg(fCode, "");
    auth("factors/" + encodeURIComponent(facteur) + "/challenge", {}, S.access_token).then(function (r) {
      if (!r.ok || !r.j.id) throw new Error(T.erreur);
      return auth("factors/" + encodeURIComponent(facteur) + "/verify", { challenge_id: r.j.id, code: code }, S.access_token);
    }).then(function (r) {
      if (!r.ok || !r.j.access_token) throw new Error(T.codeFaux);
      garder(r.j); return montrerCompte();
    }).catch(function (err) { msg(fCode, err instanceof TypeError ? T.reseau : err.message); }).then(function () { b.disabled = false; });
  });
  $("cp-oubli").addEventListener("click", function () {
    var email = $("cp-email").value.trim();
    if (!email) { msg(fConn, T.oubliEmail); $("cp-email").focus(); return; }
    auth("recover", { email: email, gotrue_meta_security: {} }).then(function () { msg(fConn, T.oubliOk); }, function () { msg(fConn, T.reseau); });
  });
  document.querySelectorAll("[data-cp-sortir]").forEach(function (b) {
    b.addEventListener("click", function () {
      if (S) auth("logout?scope=local", null, S.access_token).catch(function () {});
      oublier(); A = null; zone.textContent = ""; msg(bloc, ""); afficher("connexion");
    });
  });

  /* ---------- État de l'abonnement ---------- */
  var A = null, pub = null;
  function rpc(nom, j) {
    var h = { apikey: CLE, "Content-Type": "application/json" };
    if (j) h.Authorization = "Bearer " + j;
    return fetch(SB + "/rest/v1/rpc/" + nom, { method: "POST", headers: h, body: "{}" }).then(function (r) {
      if (r.status === 401) throw new Error(T.E.AUTH);   // session refusée : on redemande la connexion
      return r.ok ? r.json() : null;   // 404 = fonction pas encore créée : vente fermée
    });
  }
  function montrerCompte() {
    afficher("compte");
    bloc.querySelector(".cp-qui").textContent = S.email ? T.connecte + S.email : "";
    return charger();
  }
  function charger() {
    return jeton().then(function (j) { return rpc("rt_mon_acces", j); })
      .then(function (r) { A = r && typeof r.pack === "string" ? r : null; }, function (e) { if (e.message === T.E.AUTH) throw e; A = null; })
      .then(function () {
        if (!A || !A.paiement_actif) return;
        return rpc("rt_paiement_public").then(function (p) { pub = p; }, function () { pub = null; });
      })
      .then(dessiner)
      .catch(function (e) { oublier(); afficher("connexion"); msg(fConn, e.message); });
  }

  function resume() {
    var f = A.formule ? NOMS[A.formule] + (A.option_clips ? " + REF CLIPS" : "") + (A.periode === "mois" ? T.auMois : A.periode === "saison" ? T.aLaSaison : "") : "";
    if (A.pack === "complet") return T.complet;
    if (A.essai) return T.essai.replace("{d}", date(A.essai_fin));
    if (A.pack === "lecture_seule") return T.lecture + (A.payee_jusqu_au ? T.depuis.replace("{d}", date(A.payee_jusqu_au)) : "") + ".";
    if (A.resilie_le) return f + T.resilie.replace("{d}", date(A.payee_jusqu_au));
    var suite = A.formule_suivante ? T.suite.replace("{f}", NOMS[A.formule_suivante] + (A.clips_suivant ? " + REF CLIPS" : "")) : "";
    if (A.formule === "fondateur") return T.fondateurE.replace("{d}", date(A.payee_jusqu_au));
    return f + (A.periode === "mois" ? T.mois : T.saisonE).replace("{d}", date(A.payee_jusqu_au)) + suite;
  }
  function abonneEnCours() { return A.etat === "actif" && A.pack !== "lecture_seule" && !A.resilie_le && ["essentiel", "pro", "elite"].indexOf(A.formule) >= 0; }
  function avecOption(f) { return f === "essentiel" || f === "pro"; }
  function prixMois(f, clips) { return PRIX[f][0] + (clips && avecOption(f) ? PRIX.option[0] : 0); }

  // Appel à la fonction de paiement. Redirection seulement vers Stripe.
  function appel(corps) {
    return jeton().then(function (j) {
      return fetch(SB + "/functions/v1/paiement", { method: "POST", headers: { apikey: CLE, Authorization: "Bearer " + j, "Content-Type": "application/json" }, body: JSON.stringify(corps) })
        .catch(function () { throw new Error(T.reseau); });
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok || !j.ok) throw new Error(T.E[j.error] || T.erreur);
        return j;
      });
    });
  }
  function allerStripe(url) {
    if (typeof url === "string" && /^https:\/\/(checkout|billing)\.stripe\.com\//.test(url)) { location.href = url; return true; }
    return false;
  }

  function dessiner() {
    if (!A || !A.paiement_actif) { zone.innerHTML = '<p class="cp-etat">' + esc(T.ferme) + "</p>"; return; }
    var s = A.formule_souhaitee || {}, changer = abonneEnCours();
    var choixF = A.formule_suivante || A.formule || (s.formule === "ess" ? "essentiel" : s.formule) || "pro";
    if (!PRIX[choixF] || (changer && choixF === "clips")) choixF = "pro";
    var fondateur = pub && pub.fondateur_ouvert && A.formule !== "fondateur" && !changer;
    var per = A.periode || s.periode;
    var options = ["essentiel", "pro", "elite", "clips"].filter(function (k) { return !changer || k !== "clips"; }).concat(fondateur ? ["fondateur"] : [])
      .map(function (k) { return '<option value="' + k + '"' + (k === choixF ? " selected" : "") + ">" + esc(NOMS[k]) + "</option>"; }).join("");
    var formulaire =
      '<label class="cp-champ">' + T.formule + '<select id="cp-f">' + options + "</select></label>" +
      '<fieldset class="cp-per" id="cp-per"' + (changer ? " hidden" : "") + "><legend class=\"sr\">" + T.formule + "</legend>" +
        '<label class="cp-radio"><input type="radio" name="cp-per" value="mois"' + (per !== "saison" ? " checked" : "") + "> " + T.auMoisL + ' <span id="cp-pm"></span></label>' +
        '<label class="cp-radio"><input type="radio" name="cp-per" value="saison"' + (per === "saison" ? " checked" : "") + "> " + T.saisonL + ' <span id="cp-ps"></span></label>' +
        '<p class="cp-aide">' + T.aide + "</p></fieldset>" +
      (fondateur ? '<p class="cp-aide" id="cp-fond" hidden>' + esc(T.fond.replace("{p}", eur(PRIX.fondateur)).replace("{n}", pub.fondateur_restantes)) + "</p>" : "") +
      '<label class="cp-radio" id="cp-clips-l"><input type="checkbox" id="cp-clips"' + ((A.formule_suivante ? A.clips_suivant : A.option_clips || s.clips) ? " checked" : "") + "> " + T.ajout + "</label>" +
      '<p class="cp-total" id="cp-total"></p>' +
      '<label class="cp-radio cp-renonce" id="cp-renon-l"><input type="checkbox" id="cp-renon"> ' + T.renonce + "</label>" +
      '<button type="button" class="btn btn-gold cp-plein" id="cp-payer">' + (changer ? T.valider : T.payer) + "</button>";
    zone.innerHTML = '<p class="cp-etat">' + esc(resume()) + "</p>" +
      (A.au_mois_en_cours || A.client_stripe ? '<div class="cp-actions">' +
        (A.au_mois_en_cours ? '<button type="button" class="btn btn-ghost" id="cp-resil">' + T.resilier + "</button>" : "") +
        (A.client_stripe ? '<button type="button" class="btn btn-ghost" id="cp-portail">' + T.portail + "</button>" : "") + "</div>" : "") +
      (A.au_mois_en_cours ? '<div class="cp-conf" id="cp-conf" hidden><p><b>' + T.avant + "</b></p><ul><li>" + T.c1 + "</li><li>" + esc(T.c2.replace("{d}", date(A.payee_jusqu_au))) + "</li><li>" + T.c3 + "</li><li>" + T.c4 + "</li></ul>" +
        '<div class="cp-actions"><button type="button" class="btn cp-danger" id="cp-oui">' + T.confirmer + '</button><button type="button" class="btn btn-ghost" id="cp-non">' + T.annuler + "</button></div></div>" : "") +
      (A.formule === "fondateur" && A.pack !== "lecture_seule" ? ""
        : changer ? '<details class="cp-changer"><summary>' + T.changerT + "</summary>" + formulaire + "</details>"
        : "<h3>" + T.choisirT + "</h3>" + formulaire);

    function total() {
      var f = $("cp-f").value, coche = zone.querySelector('input[name="cp-per"]:checked');
      var saison = changer ? A.periode === "saison" : !!coche && coche.value === "saison";
      var opt = avecOption(f), clips = opt && $("cp-clips").checked, i = saison ? 1 : 0;
      $("cp-per").hidden = changer || f === "fondateur"; $("cp-clips-l").hidden = !opt;
      if ($("cp-fond")) $("cp-fond").hidden = f !== "fondateur";
      if (f !== "fondateur") { $("cp-pm").textContent = "· " + eur(PRIX[f][0] + (clips ? PRIX.option[0] : 0)); $("cp-ps").textContent = "· " + eur(PRIX[f][1] + (clips ? PRIX.option[1] : 0)); }
      var t = f === "fondateur" ? PRIX.fondateur : PRIX[f][i] + (clips ? PRIX.option[i] : 0);
      var texte = T.total.replace("{p}", eur(t)) + (f === "fondateur" ? T.uneFois : saison ? T.pourSaison : T.parMois), montee = true;
      var meme = changer && f === A.formule && clips === !!A.option_clips;
      if (changer) {
        var avant = PRIX[A.formule][i] + (A.option_clips && avecOption(A.formule) ? PRIX.option[i] : 0);
        montee = prixMois(f, clips) > prixMois(A.formule, !!A.option_clips);
        texte = meme ? T.actuelle : montee ? (saison ? T.diff.replace("{p}", eur(t - avant)) : T.nouveau.replace("{p}", eur(t))) : T.moins;
      }
      $("cp-total").textContent = texte;
      $("cp-renon-l").hidden = changer && !montee;
      $("cp-payer").disabled = meme || (!$("cp-renon-l").hidden && !$("cp-renon").checked);
      return { formule: f, periode: saison ? "saison" : "mois", clips: clips, montee: montee };
    }
    if ($("cp-f")) {
      zone.querySelectorAll("select, input").forEach(function (x) { x.addEventListener("change", total); });
      total();
      $("cp-payer").addEventListener("click", function () {
        var b = $("cp-payer"), c = total(); b.disabled = true;
        msg($("cp-msg"), changer && !c.montee ? T.enreg : T.ouverture);
        appel({ action: changer ? "changer" : "creer", retour: EN ? "compte_en" : "compte", formule: c.formule, periode: c.periode, clips: c.clips, renonciation: $("cp-renon").checked })
          .then(function (j) {
            if (j.url) { if (!allerStripe(j.url)) throw new Error(T.erreur); return; }
            if (j.effet === "saison_suivante") { A.formule_suivante = c.formule; A.clips_suivant = c.clips; dessiner(); msg($("cp-msg"), T.noteSaison); }
            else return charger().then(function () { msg($("cp-msg"), T.fait); });
          })
          .catch(function (e) { msg($("cp-msg"), e.message); b.disabled = false; });
      });
    }
    if ($("cp-resil")) {
      $("cp-resil").addEventListener("click", function () { $("cp-conf").hidden = false; $("cp-resil").hidden = true; $("cp-oui").focus(); });
      $("cp-non").addEventListener("click", function () { $("cp-conf").hidden = true; $("cp-resil").hidden = false; $("cp-resil").focus(); });
      $("cp-oui").addEventListener("click", function () {
        $("cp-oui").disabled = true; msg($("cp-msg"), T.resil);
        appel({ action: "resilier" }).then(function (j) {
          A.resilie_le = new Date().toISOString(); A.au_mois_en_cours = false; if (j.jusqu_au) A.payee_jusqu_au = j.jusqu_au;
          dessiner(); msg($("cp-msg"), T.resilFait);
        }).catch(function (e) { msg($("cp-msg"), e.message); $("cp-oui").disabled = false; });
      });
    }
    if ($("cp-portail")) $("cp-portail").addEventListener("click", function () {
      appel({ action: "portail", retour: EN ? "compte_en" : "compte" }).then(function (j) { if (!allerStripe(j.url)) throw new Error(T.erreur); }).catch(function (e) { msg($("cp-msg"), e.message); });
    });
  }

  /* ---------- Démarrage ---------- */
  var retour = /[?&]paiement=(merci|annule)\b/.exec(location.search);
  if (retour) { try { history.replaceState(null, "", location.pathname); } catch (e) {} }
  function noterRetour() {
    if (!retour) return;
    msg($("cp-msg"), retour[1] === "merci" ? T.merci : T.annule);
    if (retour[1] === "merci") setTimeout(charger, 6000);   // la confirmation de Stripe arrive quelques secondes après
  }
  if (S) {
    afficher("compte");
    jeton().then(apresConnexion).then(noterRetour, function () { oublier(); afficher("connexion"); });
  } else {
    afficher("connexion");
    if (retour) msg(fConn, retour[1] === "merci" ? T.merci : T.annule);
  }
})();
