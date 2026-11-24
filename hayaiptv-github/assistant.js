/* =====================================================================
   assistant.js — Assistant virtuel « Haya » (chatbot du service client)
   ---------------------------------------------------------------------
   Fonctionnement (traitement du langage simplifié, 100 % dans le navigateur) :
   1. normalisation du message (minuscules, sans accents ni ponctuation)
   2. détection d'INTENTIONS par mots-clés pondérés (prix, chaînes, appareils…)
   3. sinon recherche de la question la plus proche dans la FAQ + les réponses
      ajoutées dans l'admin (score de similarité par mots communs)
   4. réponses construites à partir des VRAIES données du site (formules,
      chaînes, appareils…) : si l'admin change un prix, Haya le sait.
   5. mini-dialogue pour conseiller une formule, suivi de commande,
      transfert vers un conseiller humain (crée un message dans l'admin).
   Les questions sans réponse sont enregistrées : l'admin peut leur ajouter
   une réponse, et l'assistant « apprend ».
   ===================================================================== */
(function () {
  const STOP = new Set("le la les un une des de du d l a au aux et ou en est ce ces je j tu il on vous nous mon ma mes votre vos pour par sur avec dans que qui quoi est-ce y t s n ne pas plus bien svp stp merci bonjour".split(" "));
  const norm = s => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9€ ]+/g, " ").replace(/\s+/g, " ").trim();
  const tokens = s => norm(s).split(" ").filter(w => w.length > 1 && !STOP.has(w)).map(w => w.replace(/(s|x)$/, ""));
  const has = (t, words) => words.some(w => (" " + t + " ").includes(" " + w));
  const D = () => hayaLoad();
  const money = n => euro(n).replace(",00", "") + " €";
  const annual = () => (D().content.billingPeriod || "mois") === "an";
  const per = () => annual() ? "/an" : "/mois";

  // ---------- Intentions ----------
  const INTENTS = [
    { id: "greet",   words: ["bonjour", "salut", "slt", "coucou", "cc", "hello", "salam", "bonsoir", "hey"], only: true,
      reply: () => ({ text: `Bonjour 👋 Comment puis-je vous aider ?`, chips: ["Voir les prix", "Quelle formule choisir ?", "Appareils compatibles"] }) },
    { id: "thanks",  words: ["merci", "parfait", "super", "top", "genial", "ok merci"], only: true,
      reply: () => ({ text: "Avec plaisir 😊 Autre chose ?", chips: ["Voir les prix", "Parler à un conseiller"] }) },
    { id: "human",   words: ["humain", "conseiller", "agent", "quelqu un", "parler a", "appeler", "rappel", "telephone", "joindre", "support", "sav"],
      reply: () => { state.mode = "handoff"; return { text: "Je vous mets en relation avec un conseiller 🙋. Laissez-moi votre <b>e-mail ou téléphone</b> et votre question en un seul message, un conseiller vous recontacte (réponse moyenne : " + esc(D().content.contactDelay) + ")." }; } },
    { id: "order",   words: ["commande", "suivi", "hs 20", "statut", "recu", "facture", "ma commande"],
      reply: (t, raw) => {
        const m = raw.toUpperCase().match(/HS-?\s?(\d{4})-?\s?(\d{4})/);
        if (!m) { state.mode = "order"; return { text: "Donnez-moi votre <b>référence de commande</b> (ex. HS-2026-0005), je vérifie son statut." }; }
        return orderStatus(`HS-${m[1]}-${m[2]}`);
      } },
    { id: "recommend", words: ["quelle formule", "choisir", "conseil", "recommande", "laquelle", "meilleure formule", "adapte", "pour moi", "hesite"],
      reply: () => { state.mode = "reco1"; return { text: "Je vous aide à choisir 🎯 Qu'est-ce qui compte le plus pour vous ?", chips: ["Le meilleur prix", "La qualité 4K", "Tout inclus (replay 30 j, support prioritaire)"] }; } },
    { id: "compare", words: ["difference", "differences", "comparer", "comparaison", "compare", "vs", "versus", "entre"],
      reply: () => ({ text: "Comparatif des formules 📊 :<br>" + D().plans.map(p => `<b>${esc(p.name)}</b> — ${money(p.price)}${per()}<br>` + p.features.map(f => "✓ " + esc(f)).join("<br>")).join("<br><br>"), chips: ["Quelle formule choisir ?", "Commander"] }) },
    { id: "price",   words: ["prix", "tarif", "combien", "cout", "coute", "abonnement", "formule", "offre", "pas cher", "moins cher", "€", "euro"],
      reply: () => {
        const d = D(), disc = parseFloat(d.content.yearlyDiscount) || 0;
        return { text: "Voici nos formules 💳 (1 écran) :<br>" + d.plans.map(p => `• <b>${esc(p.name)}</b> : ${money(p.price)}${per()} — ${esc(p.features.slice(1, 3).join(", "))}`).join("<br>") +
          (annual() ? "<br>Paiement unique pour 12 mois, sans reconduction automatique." : `<br>En annuel, vous économisez <b>${disc} %</b>. Sans engagement.`), chips: ["Quelle formule choisir ?", "Moyens de paiement", "Commander"] };
      } },
    { id: "channels", words: ["chaine", "chaines", "sport", "cinema", "film", "serie", "enfant", "kids", "info", "actualite", "documentaire", "musique", "catalogue", "programme"],
      reply: t => {
        const d = D(), cats = [...new Set(d.channels.map(c => c.cat))];
        const cat = cats.find(c => t.includes(norm(c).replace(/s$/, ""))) || (has(t, ["film"]) && "Cinéma") || (has(t, ["kids", "enfant"]) && "Enfants") || (has(t, ["info"]) && "Actualités");
        if (cat) {
          const list = d.channels.filter(c => c.cat === cat);
          return { text: `📺 Chaînes <b>${esc(cat)}</b> (${list.length}) :<br>` + list.map(c => `• ${esc(c.icon)} ${esc(c.name)} — <i>${esc(c.program || "")}</i>`).join("<br>"), chips: ["Toutes les catégories", "Voir les prix"] };
        }
        return { text: `Nous proposons <b>${d.channels.length} chaînes</b> dans ${cats.length} catégories : ${cats.map(esc).join(", ")}. Laquelle vous intéresse ?`, chips: cats.slice(0, 4) };
      } },
    { id: "devices", words: ["appareil", "compatible", "compatibilite", "smart tv", "samsung", "lg", "iphone", "android", "fire", "apple tv", "ordinateur", "pc", "mac", "tablette", "telephone portable", "navigateur", "installer", "installation", "application", "appli"],
      reply: () => ({ text: `📱 ${esc(D().settings.name)} fonctionne sur :<br>` + D().devices.map(x => `• ${esc(x.icon)} <b>${esc(x.title)}</b> — ${esc(x.text)}`).join("<br>"), chips: ["Combien d'écrans ?", "Voir les prix"] }) },
    { id: "screens", words: ["ecran", "ecrans", "simultane", "plusieurs", "en meme temps", "famille"],
      reply: () => ({ text: "Nombre d'écrans simultanés selon la formule :<br>" + D().plans.map(p => `• <b>${esc(p.name)}</b> : ${esc((p.features.find(f => /écran/i.test(f)) || "voir détails"))}`).join("<br>"), chips: ["Quelle formule choisir ?"] }) },
    { id: "payment", words: ["paiement", "payer", "carte", "paypal", "stripe", "visa", "mastercard", "cb", "securise", "virement"],
      reply: () => ({ text: "💳 Paiement par <b>PayPal</b> (compte PayPal ou carte bancaire via PayPal), 100 % sécurisé. Vos coordonnées bancaires ne sont jamais transmises à notre site.<br><i>Pour l'instant, le paiement en ligne est en mode test : aucun débit réel.</i>", chips: ["Commander", "Remboursement"] }) },
    { id: "refund", words: ["rembours", "retractation", "annuler", "annulation", "resilier", "resiliation", "engagement", "arreter", "desabonner"],
      reply: () => ({ text: "✅ Toutes les formules sont <b>sans engagement</b> : résiliation à tout moment, effective à la fin de la période en cours.<br>Vous disposez d'un <b>droit de rétractation de 14 jours</b>, sauf si vous avez demandé l'accès immédiat au service. Détails dans les <a href='mentions-legales.html#cgv'>CGV</a>.", chips: ["Parler à un conseiller"] }) },
    { id: "quality", words: ["qualite", "4k", "hd", "hdr", "debit", "internet", "connexion", "coupe", "lag", "buffer", "rame", "fibre", "wifi"],
      reply: () => ({ text: "📶 Il faut <b>10 Mbit/s</b> pour la HD et <b>25 Mbit/s</b> pour la 4K. Le streaming adaptatif ajuste la qualité automatiquement.<br>Si l'image coupe : privilégiez un câble Ethernet ou le Wi-Fi 5 GHz, et redémarrez votre box.", chips: ["Appareils compatibles", "Parler à un conseiller"] }) },
    { id: "buy", words: ["commander", "acheter", "souscrire", "inscrire", "inscription", "m abonner", "abonner", "s abonner"],
      reply: () => ({ text: "Super 🎉 Choisissez votre formule, je vous ouvre la commande :", chips: D().plans.map(p => "Commander " + p.name) }) },
    { id: "hours", words: ["horaire", "heure", "ouvert", "disponible", "quand", "delai", "reponse"],
      reply: () => ({ text: `⏰ Notre équipe est disponible <b>${esc(D().content.contactHours)}</b>, réponse moyenne : ${esc(D().content.contactDelay)}. Je suis là 24 h/24 pour les questions simples !` }) },
    { id: "who", words: ["qui es tu", "robot", "ia", "intelligence", "bot", "humain ou"], only: false,
      reply: () => ({ text: `Je suis <b>${esc(D().content.botName)}</b>, l'assistante virtuelle de ${esc(D().settings.name)} 🤖. Je réponds instantanément aux questions courantes, et je peux vous transférer à un conseiller humain.` }) }
  ];

  // ---------- Recherche dans la FAQ + réponses de l'admin ----------
  function bestFaq(text) {
    const d = D(), q = tokens(text); if (!q.length) return null;
    const pool = [...d.botQA, ...d.faq];
    let best = null, bestScore = 0;
    for (const item of pool) {
      const k = tokens(item.q);
      const common = q.filter(w => k.some(x => x === w || (w.length > 4 && x.startsWith(w.slice(0, 5))))).length;
      const score = common / Math.max(2, Math.min(q.length, k.length));
      if (score > bestScore) { bestScore = score; best = item; }
    }
    return bestScore >= 0.5 ? best : null;
  }

  function orderStatus(ref) {
    const o = D().orders.find(x => x.ref.toUpperCase() === ref.toUpperCase());
    state.mode = null;
    if (!o) return { text: `Je ne trouve pas la commande <b>${esc(ref)}</b>. Vérifiez la référence sur votre reçu, ou parlez à un conseiller.`, chips: ["Parler à un conseiller"] };
    const icon = { "payée": "✅", "en attente": "⏳", "remboursée": "↩️", "annulée": "❌" }[o.status] || "ℹ️";
    return { text: `${icon} Commande <b>${esc(o.ref)}</b> du ${esc(o.date)} : formule ${esc(o.plan)} (${esc(o.billing)}), ${money(o.amount)} — statut : <b>${esc(o.status)}</b>.` };
  }

  // ---------- Cerveau : choisit la réponse ----------
  const state = { mode: null, screens: null };
  function answer(raw) {
    const t = norm(raw);
    // Dialogues en cours
    if (state.mode === "handoff") {
      state.mode = null;
      const d = D();
      const contact = (raw.match(/[\w.+-]+@[\w-]+\.[\w.]+/) || raw.match(/\+?\d[\d .-]{7,}\d/) || [""])[0];
      d.messages.unshift({ id: hayaNextId(d.messages), name: "Client (assistant)", email: contact.includes("@") ? contact : "—", phone: contact.includes("@") ? "" : contact, message: "[Via l'assistant] " + raw, date: new Date().toISOString().slice(0, 10), read: false });
      hayaSave(d);
      return { text: "✅ C'est transmis ! Un conseiller vous recontacte rapidement." + (contact ? "" : "<br><i>Astuce : ajoutez votre e-mail ou téléphone pour être recontacté.</i>"), handled: true };
    }
    if (state.mode === "order") { const m = raw.toUpperCase().match(/HS-?\s?(\d{4})-?\s?(\d{4})/); if (m) return orderStatus(`HS-${m[1]}-${m[2]}`); state.mode = null; }
    if (state.mode === "reco1") {
      // Conseil : formules triées par prix → 1re = petit budget, 2e = 4K, dernière = tout inclus
      const choice = /prix|budget|cher|econom|basique/.test(t) ? 0 : /4k|qualite|hdr|image/.test(t) ? 1 : /tout|inclus|vip|replay|prioritaire|max/.test(t) ? 2 : null;
      if (choice !== null) {
        state.mode = null;
        const sorted = [...D().plans].sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        const pick = sorted[Math.min(choice, sorted.length - 1)];
        return { text: `Je vous recommande la formule <b>${esc(pick.name)}</b> à ${money(pick.price)}${per()} 🎯<br>` + pick.features.map(f => "✓ " + esc(f)).join("<br>"), chips: ["Commander " + pick.name, "Voir les prix"] };
      }
    }
    // Commande directe depuis une puce « Commander X »
    const cmd = raw.match(/^Commander (.+)$/);
    if (cmd) { const p = D().plans.find(x => x.name === cmd[1]); if (p && window.hayaOpenCheckout) { setTimeout(() => hayaOpenCheckout(p.id, false), 400); return { text: `J'ouvre la commande de la formule <b>${esc(p.name)}</b> 🛒` }; } }
    if (t === "toutes les categories") return INTENTS.find(i => i.id === "channels").reply("");

    // Intentions (la plus spécifique gagne)
    let best = null, bestHits = 0;
    for (const it of INTENTS) {
      const hits = it.words.filter(w => (" " + t + " ").includes(" " + norm(w))).length;
      if (it.only && t.split(" ").length > 4) continue; // « bonjour, combien coûte… » → pas un simple bonjour
      if (hits > bestHits) { best = it; bestHits = hits; }
    }
    const faq = bestFaq(raw);
    if (faq && (!best || best.id === "greet" || best.id === "quality" || best.id === "screens")) return { text: esc(faq.a), chips: ["Autre question", "Parler à un conseiller"] };
    if (best) return best.reply(t, raw);
    if (faq) return { text: esc(faq.a) };
    return { text: "Je n'ai pas bien compris 🤔 Pouvez-vous reformuler ? Voici ce que je sais faire :", chips: ["Voir les prix", "Quelle formule choisir ?", "Appareils compatibles", "Suivre ma commande", "Parler à un conseiller"], unanswered: true };
  }
  window.hayaBotAnswer = answer; // exposé pour les tests

  // ---------- Interface (fenêtre de discussion) ----------
  const root = document.getElementById("bot");
  if (!root) return;
  const log = root.querySelector(".bot-log"), form = root.querySelector("form"), input = form.querySelector("input");
  const sessionId = "c" + Date.now().toString(36);
  let opened = false;

  function saveChat(role, text, unanswered) {
    const d = D();
    let chat = d.chats.find(c => c.id === sessionId);
    if (!chat) { chat = { id: sessionId, date: new Date().toISOString(), messages: [] }; d.chats.unshift(chat); d.chats = d.chats.slice(0, 100); }
    chat.messages.push({ role, text: text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(), unanswered: !!unanswered, time: new Date().toISOString() });
    hayaSave(d);
  }
  function bubble(role, html, chips) {
    const el = document.createElement("div");
    el.className = "msg from-" + role;
    if (role === "user") el.textContent = html; else el.innerHTML = html;
    log.appendChild(el);
    if (chips && chips.length) {
      const c = document.createElement("div"); c.className = "chips";
      chips.forEach(label => { const b = document.createElement("button"); b.type = "button"; b.textContent = label; b.addEventListener("click", () => send(label)); c.appendChild(b); });
      log.appendChild(c);
    }
    log.scrollTop = log.scrollHeight;
  }
  function send(text) {
    text = text.trim(); if (!text) return;
    log.querySelectorAll(".chips").forEach(c => c.remove());
    bubble("user", text); saveChat("client", text);
    const typing = document.createElement("div"); typing.className = "msg from-bot typing"; typing.innerHTML = "<i></i><i></i><i></i>"; log.appendChild(typing); log.scrollTop = log.scrollHeight;
    setTimeout(() => {
      typing.remove();
      const r = answer(text);
      bubble("bot", r.text, r.chips);
      saveChat("assistant", r.text);
      if (r.unanswered) { const d = D(); const chat = d.chats.find(c => c.id === sessionId); chat.messages[chat.messages.length - 2].unanswered = true; hayaSave(d); }
    }, 500 + Math.min(900, text.length * 12));
  }
  function toggle(open) {
    root.classList.toggle("open", open);
    root.querySelector(".bot-fab").setAttribute("aria-expanded", open);
    if (open && !opened) {
      opened = true;
      const c = D().content;
      root.querySelector(".bot-name").textContent = c.botName;
      bubble("bot", esc(c.botWelcome), ["Voir les prix", "Quelle formule choisir ?", "Appareils compatibles", "Parler à un conseiller"]);
    }
    if (open) setTimeout(() => input.focus(), 50);
  }
  root.querySelector(".bot-fab").addEventListener("click", () => toggle(!root.classList.contains("open")));
  root.querySelector(".bot-close").addEventListener("click", () => toggle(false));
  form.addEventListener("submit", e => { e.preventDefault(); const v = input.value; input.value = ""; send(v); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && root.classList.contains("open")) toggle(false); });
})();
