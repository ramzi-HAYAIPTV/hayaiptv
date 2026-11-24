/* =====================================================================
   data.js — "base de données" de la plateforme Haya IPTV
   ---------------------------------------------------------------------
   - HAYA_DEFAULTS contient le contenu d'origine du site.
   - Les modifications faites dans /admin sont enregistrées dans le
     navigateur (localStorage) sous la clé HAYA_KEY.
   - index.html et admin/index.html lisent ces données avec hayaLoad().
   En production, on remplacerait localStorage par une API + base de données.
   ===================================================================== */
const HAYA_KEY = "haya-data-v5";

const HAYA_DEFAULTS = {
  // Paramètres généraux
  settings: {
    name: "HayaIPTV",
    slogan: "La télévision nouvelle génération",
    email: "contact@hayaiptv.com",
    whatsapp: "+213555439766",            // format international ; vide = bouton masqué
    whatsappMessage: "Bonjour, j'ai une question sur Haya IPTV.",
    author: ""                            // vide = pas de ligne « Conçu et développé par » dans le pied de page
  },

  // Sections affichées sur la page d'accueil (Admin > Sections affichées)
  sections: {
    iptv: true,        // « C'est quoi l'IPTV ? » (schéma)
    features: false,   // Fonctionnalités
    channels: true,    // Chaînes
    guide: true,       // Guide TV
    pricing: true,     // Tarifs
    steps: false,      // Démarrage en 3 étapes
    devices: false,    // Appareils compatibles (+ bandeau défilant)
    reviews: false,    // Avis clients (s'affiche seulement s'il y a de VRAIS avis)
    faq: true,         // FAQ
    contact: true      // Contact
  },

  // Sécurité de l'admin : le mot de passe n'est JAMAIS stocké en clair,
  // seulement son empreinte PBKDF2-SHA256 (sel aléatoire + 150 000 itérations).
  security: {
    adminUser: "admin",
    salt: "095e92b1361e7ddf04681253b2fa5f28",
    hash: "4a45e6cae577e4f8dbdfa52016c02a5f9f384da096d07e6d315be5ea98694140",
    iter: 150000
  },

  // Comptes clients (espace client) : mots de passe hachés de la même façon
  customers: [],

  // Codes promo (Admin > Codes promo)
  promos: [
    { code: "BIENVENUE10", type: "percent", value: 10, maxUses: 100, uses: 0, expires: "2027-12-31", active: true },
    { code: "VIP5",        type: "fixed",   value: 5,  maxUses: 50,  uses: 0, expires: "2027-06-30", active: true }
  ],

  // Tableau comparatif des formules (une valeur par formule, dans l'ordre)
  compare: [
    { label: "Écrans simultanés",      values: ["1", "1", "1"] },
    { label: "Qualité d'image",         values: ["Full HD", "4K HDR", "4K HDR"] },
    { label: "Chaînes en direct",       values: ["✓", "✓", "✓"] },
    { label: "Films et séries",         values: ["—", "✓", "✓"] },
    { label: "Replay",                  values: ["24 h", "7 jours", "30 jours"] },
    { label: "Enregistrement cloud",    values: ["—", "—", "✓"] },
    { label: "Contrôle parental",       values: ["✓", "✓", "✓"] },
    { label: "Support",                 values: ["E-mail", "7 j/7", "Prioritaire WhatsApp"] }
  ],

  // Avis clients : à remplir UNIQUEMENT avec de vrais retours (Admin > Sections & FAQ).
  // Tant que la liste est vide, la section Avis n'apparaît pas sur le site.
  reviews: [],

  // État du service (page status.html, modifiable dans Admin > État du service)
  status: {
    message: "",
    components: [
      { name: "Site web et espace client", state: "ok" },
      { name: "Streaming en direct",       state: "ok" },
      { name: "Replay et enregistrements", state: "ok" },
      { name: "Paiements",                 state: "ok" },
      { name: "Assistant virtuel",          state: "ok" },
      { name: "Support client",            state: "ok" }
    ]
  },

  // Couleurs du site (modifiables dans Admin > Apparence)
  theme: { brand: "#7c5cff", brand2: "#00d4ff", hot: "#ff4d8d" },

  // Tous les textes du site (modifiables dans Admin > Contenu)
  content: {
    heroBadge: "IPTV",
    heroBadgeText: "Télévision par Internet · Direct · Replay · 4K",
    heroTitle: "HayaIPTV :",
    heroHighlight: "la télé par Internet.",
    heroLead: "HayaIPTV est une plateforme IPTV (télévision par protocole Internet) : chaînes en direct, replay et guide TV diffusés par Internet sur Smart TV, box, mobile et ordinateur.",
    heroCta1: "Voir les offres →",
    heroCta2: "Explorer les chaînes",
    stat1Label: "thèmes : sport, ciné, séries, info…",
    iptvTitle: "C'est quoi",
    iptvHighlight: "l'IPTV ?",
    iptvLead: "IPTV veut dire « télévision par protocole Internet » : les chaînes arrivent par votre connexion Internet, pas par une antenne ni une parabole.",
    stat2Value: "4K HDR", stat2Label: "qualité maximale",
    stat3Value: "dès 45 €", stat3Label: "par an, sans engagement",
    featuresTitle: "Tout ce qu'on attend d'une",
    featuresHighlight: "plateforme moderne",
    featuresLead: "Une expérience pensée dans les moindres détails, du premier clic au dernier épisode.",
    featureBigNumber: "0,8 s",
    channelsTitle: "Des chaînes pour",
    channelsHighlight: "toute la famille",
    channelsLead: "Sport, cinéma, séries, info, jeunesse… Le catalogue est géré en temps réel depuis l'espace d'administration.",
    pricingTitle: "Une formule pour",
    billingPeriod: "an",                 // "an" = prix annuels (sans bouton mensuel/annuel) ; "mois" = prix mensuels + remise annuelle
    pricingHighlight: "chaque envie",
    pricingLead: "Un paiement par an, un écran, aucune surprise. Changez de formule quand vous voulez.",
    yearlyDiscount: "20",
    stepsTitle: "Prêt en",
    stepsHighlight: "3 minutes",
    devicesTitle: "Sur",
    devicesHighlight: "tous vos écrans",
    devicesLead: "Commencez un film sur la TV du salon, terminez-le dans le train.",
    faqTitle: "Questions",
    faqHighlight: "fréquentes",
    ctaTitle: "Prêt à changer de télé ?",
    ctaText: "Rejoignez la plateforme et découvrez une nouvelle façon de regarder vos programmes.",
    ctaButton: "Choisir ma formule →",
    contactTitle: "Parlons-en",
    contactLead: "Une question sur une formule ou un appareil ? Notre équipe vous répond rapidement.",
    contactHours: "7 jours sur 7, de 9 h à 21 h",
    contactDelay: "moins de 2 heures",
    footerNote: "HayaIPTV — la télévision par Internet : direct, replay et guide TV.",
    botName: "Haya",
    botWelcome: "Bonjour 👋 Je suis Haya, l'assistante de la plateforme. Posez-moi vos questions sur les formules, les chaînes, les appareils ou votre commande !"
  },

  features: [
    { icon: "📈", title: "Streaming adaptatif", text: "La qualité s'ajuste en temps réel à votre connexion : pas de coupure, même quand le réseau faiblit." },
    { icon: "⏱️", title: "Zapping éclair", text: "Changement de chaîne en moins d'une seconde." },
    { icon: "🗓️", title: "Guide TV intelligent", text: "Programme sur 7 jours, rappels et recommandations." },
    { icon: "⏪", title: "Replay & pause du direct", text: "Reprenez là où vous en étiez, sur n'importe quel écran." },
    { icon: "👨‍👩‍👧", title: "Profils & contrôle parental", text: "Un espace par membre de la famille, sécurisé par code." }
  ],

  steps: [
    { title: "Choisissez votre formule", text: "Sélectionnez l'offre adaptée à votre foyer." },
    { title: "Installez l'application", text: "Disponible sur TV, mobile, ordinateur et navigateur." },
    { title: "Profitez", text: "Connectez-vous et lancez votre première chaîne." }
  ],

  devices: [
    { icon: "📺", title: "Smart TV", text: "Samsung, LG, Android TV" },
    { icon: "🔥", title: "Fire TV", text: "Toutes générations" },
    { icon: "🍏", title: "Apple TV", text: "tvOS 16 et +" },
    { icon: "📱", title: "Mobile", text: "iPhone & Android" },
    { icon: "💻", title: "Ordinateur", text: "Windows & macOS" },
    { icon: "🌐", title: "Web", text: "Chrome, Edge, Safari" }
  ],

  faq: [
    { q: "Quel débit internet faut-il ?", a: "10 Mbit/s suffisent pour la HD et 25 Mbit/s pour la 4K. Le streaming adaptatif ajuste automatiquement la qualité." },
    { q: "Puis-je regarder sur plusieurs écrans en même temps ?", a: "Chaque abonnement inclut 1 écran à la fois. Vous pouvez installer l'application sur tous vos appareils, mais regarder sur un seul écran simultanément. Pour 2 écrans en même temps, il faut 2 abonnements." },
    { q: "Y a-t-il un engagement ?", a: "Non. Toutes les formules sont sans engagement et résiliables à tout moment." },
    { q: "Le contrôle parental est-il inclus ?", a: "Oui, le contrôle parental par code est inclus dans toutes les formules." },
    { q: "Comment contacter le support ?", a: "Via le formulaire de contact : chaque message est traité depuis l'espace d'administration." }
  ],

  channels: [
    { id: 1,  name: "Sport One",      cat: "Sport",        icon: "⚽", program: "Grand Derby — direct" },
    { id: 2,  name: "Arena Plus",     cat: "Sport",        icon: "🏀", program: "Basket : finale régionale" },
    { id: 3,  name: "Velocity",       cat: "Sport",        icon: "🏎️", program: "Magazine auto-moto" },
    { id: 4,  name: "Ciné Max",       cat: "Cinéma",       icon: "🎬", program: "Le Dernier Horizon" },
    { id: 5,  name: "Ciné Classics",  cat: "Cinéma",       icon: "🎞️", program: "Cycle noir & blanc" },
    { id: 6,  name: "Séries Club",    cat: "Séries",       icon: "🍿", program: "Les Voisins — S2E4" },
    { id: 7,  name: "Kids World",     cat: "Enfants",      icon: "🧸", program: "Les Aventures de Pixel" },
    { id: 8,  name: "Info 24",        cat: "Actualités",   icon: "📰", program: "Le journal de 20 h" },
    { id: 9,  name: "Planète Docs",   cat: "Documentaire", icon: "🌍", program: "Océans inconnus" },
    { id: 10, name: "Music Live",     cat: "Musique",      icon: "🎵", program: "Live session acoustique" },
    { id: 11, name: "Chef TV",        cat: "Lifestyle",    icon: "🍳", program: "Desserts en 15 minutes" },
    { id: 12, name: "Game Zone",      cat: "Gaming",       icon: "🎮", program: "Tournoi e-sport" }
  ],

  plans: [
    { id: 1, name: "Basique", price: "45",  popular: false, features: ["1 écran", "Qualité Full HD", "Chaînes du catalogue", "Replay 24 h", "Support par e-mail"] },
    { id: 2, name: "Premium", price: "55",  popular: true,  features: ["1 écran", "Qualité 4K HDR", "Chaînes du catalogue + films et séries", "Replay 7 jours", "Support 7 j/7"] },
    { id: 3, name: "VIP",     price: "75",  popular: false, features: ["1 écran", "Qualité 4K HDR", "Tout le catalogue", "Replay 30 jours + enregistrement cloud", "Support prioritaire WhatsApp"] }
  ],

  // Assistant virtuel : réponses personnalisées ajoutées depuis l'admin
  botQA: [
    { q: "Y a-t-il une période d'essai gratuite ?", a: "Il n'y a pas d'essai gratuit, mais toutes les formules sont sans engagement : vous pouvez résilier à tout moment." },
    { q: "Puis-je changer de formule ?", a: "Oui, vous pouvez passer à une formule supérieure ou inférieure à tout moment. Le changement s'applique à la période suivante." }
  ],
  // Historique des conversations avec l'assistant (visible dans l'admin)
  chats: [],

  // Commandes passées via le tunnel de paiement (MODE TEST : aucun argent réel).
  // La liste complète vient du serveur (/api/orders) : voir Admin > Commandes.
  orders: [],

  messages: [
    { id: 1, name: "Sarah M.", email: "sarah@example.com", message: "Bonjour, l'application est-elle disponible sur Samsung ?", date: "2026-11-19", read: true },
    { id: 2, name: "Yanis B.", email: "yanis@example.com", message: "Peut-on changer de formule en cours d'année ?", date: "2026-11-21", read: false },
    { id: 3, name: "Lina K.",  email: "lina@example.com",  message: "Le contrôle parental est-il inclus dans Premium ?", date: "2026-11-22", read: false }
  ]
};

/* Charge les données : celles enregistrées par l'admin, complétées par les valeurs
   par défaut (utile si on ajoute de nouveaux champs plus tard). */
function hayaLoad() {
  const base = JSON.parse(JSON.stringify(HAYA_DEFAULTS));
  try {
    let raw = localStorage.getItem(HAYA_KEY), saved;
    if (raw) saved = JSON.parse(raw);
    else {
      // Reprise des données de l'ancienne version (v4) en retirant les anciens textes « démo »
      const old = localStorage.getItem("haya-data-v4");
      if (!old) return base;
      saved = JSON.parse(old);
      delete saved.reviews;
      if (saved.settings) { if (/\.example$/.test(saved.settings.email || "")) delete saved.settings.email; if (saved.settings.author === "Votre nom") delete saved.settings.author; }
      if (saved.content) ["heroBadgeText", "footerNote"].forEach(k => { if (/démonstration|fictif/i.test(saved.content[k] || "")) delete saved.content[k]; });
    }
    for (const k in base) {
      if (saved[k] === undefined) continue;
      base[k] = (base[k] && !Array.isArray(base[k]) && typeof base[k] === "object") ? Object.assign(base[k], saved[k]) : saved[k];
    }
  } catch (e) {}
  return base;
}
function hayaSave(data) { try { localStorage.setItem(HAYA_KEY, JSON.stringify(data)); return true; } catch (e) { return false; } }
function hayaReset() { try { localStorage.removeItem(HAYA_KEY); } catch (e) {} }
function hayaNextId(list) { return list.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0) + 1; }
function esc(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function euro(n) { return Number(n).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

/* ---------- Cryptographie (Web Crypto API du navigateur) ---------- */
const hayaHex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
const hayaUnhex = hex => new Uint8Array(hex.match(/../g).map(h => parseInt(h, 16)));
function hayaSalt() { const a = new Uint8Array(16); crypto.getRandomValues(a); return hayaHex(a); }
/* Empreinte PBKDF2-SHA256 d'un mot de passe (lent volontairement : freine les attaques par force brute) */
async function hayaHash(password, saltHex, iter = 150000) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: hayaUnhex(saltHex), iterations: iter }, key, 256);
  return hayaHex(bits);
}
/* Comparaison en temps constant (évite de deviner l'empreinte caractère par caractère) */
function hayaSafeEqual(a, b) { if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; }
/* Règle de mot de passe : 10 caractères minimum, avec lettres et chiffres */
function hayaPasswordOk(p, min = 10) { return typeof p === "string" && p.length >= min && /[a-zA-Z]/.test(p) && /\d/.test(p); }

/* Anti force brute : 5 essais ratés → blocage 5 minutes (par espace : admin / client) */
function hayaLockState(scope) { try { return JSON.parse(localStorage.getItem("haya-lock-" + scope)) || { fails: 0, until: 0 }; } catch (e) { return { fails: 0, until: 0 }; } }
function hayaLockFail(scope) { const s = hayaLockState(scope); s.fails++; if (s.fails >= 5) { s.until = Date.now() + 5 * 60 * 1000; s.fails = 0; } try { localStorage.setItem("haya-lock-" + scope, JSON.stringify(s)); } catch (e) {} return s; }
function hayaLockReset(scope) { try { localStorage.removeItem("haya-lock-" + scope); } catch (e) {} }

/* Codes promo : renvoie { ok, promo, discount, error } pour un montant donné */
function hayaApplyPromo(data, code, amount) {
  const c = String(code || "").trim().toUpperCase();
  if (!c) return { ok: false, error: "" };
  const p = data.promos.find(x => x.code.toUpperCase() === c);
  if (!p || !p.active) return { ok: false, error: "Code promo invalide." };
  if (p.expires && new Date(p.expires + "T23:59:59") < new Date()) return { ok: false, error: "Ce code promo a expiré." };
  if (p.maxUses && p.uses >= p.maxUses) return { ok: false, error: "Ce code promo n'est plus disponible." };
  const discount = Math.min(amount, Math.round((p.type === "percent" ? amount * p.value / 100 : Number(p.value)) * 100) / 100);
  return { ok: true, promo: p, discount };
}

/* Reçu de commande imprimable / enregistrable en PDF (utilisé par le site et l'admin) */
function hayaPrintReceipt(o) {
  const ttc = Number(o.amount), ht = ttc / 1.2, tva = ttc - ht;
  const w = window.open("", "_blank", "width=720,height=900");
  if (!w) { alert("Autorisez les fenêtres pop-up pour afficher le reçu."); return; }
  w.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Reçu ${esc(o.ref)}</title>
  <style>body{font-family:system-ui,Segoe UI,sans-serif;color:#111;max-width:640px;margin:40px auto;padding:0 20px}
  h1{font-size:1.6rem;margin:0}.top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #111;padding-bottom:16px}
  table{width:100%;border-collapse:collapse;margin:24px 0}td,th{padding:10px;border-bottom:1px solid #ddd;text-align:left}td:last-child,th:last-child{text-align:right}
  .tot td{font-weight:700;font-size:1.1rem;border-bottom:2px solid #111}.muted{color:#666;font-size:.9rem}.test{background:#fff3cd;border:1px solid #f0c36d;padding:8px 12px;border-radius:8px;font-size:.85rem}
  @media print{.noprint{display:none}}</style></head><body>
  <p class="test">🧪 Reçu de démonstration — paiement en mode test, aucun débit réel.</p>
  <div class="top"><div><h1>Haya IPTV</h1><div class="muted">hayaiptv.com</div></div><div style="text-align:right"><b>REÇU</b><br>${esc(o.ref)}<br><span class="muted">${esc(o.date)}</span></div></div>
  <p><b>Client</b><br>${esc(o.name)}<br>${esc(o.email)}<br>${esc(o.phone || "")}</p>
  <table><tr><th>Désignation</th><th>Montant</th></tr>
  <tr><td>Formule ${esc(o.plan)} — abonnement ${esc(o.billing)}</td><td>${euro(ht)} € HT</td></tr>
  <tr><td>TVA 20 %</td><td>${euro(tva)} €</td></tr>
  ${o.promo ? `<tr><td>Code promo ${esc(o.promo)} (déjà déduit)</td><td>−${euro(o.discount || 0)} €</td></tr>` : ""}
  <tr class="tot"><td>Total TTC</td><td>${euro(ttc)} €</td></tr></table>
  <p class="muted">Payé par ${esc(o.method)}. Statut : ${esc(o.status)}.<br>Conditions générales de vente acceptées${o.cgvAcceptedAt ? " le " + new Date(o.cgvAcceptedAt).toLocaleString("fr-FR") : ""}.</p>
  <button class="noprint" onclick="print()" style="padding:10px 18px;font-size:1rem;cursor:pointer">Imprimer / Enregistrer en PDF</button>
  </body></html>`);
  w.document.close();
}

/* Lien WhatsApp « click to chat » (https://wa.me/<numéro sans + ni espaces>?text=...) */
function hayaWhatsAppLink(settings) {
  const num = String(settings.whatsapp || "").replace(/\D/g, "").replace(/^00/, "");
  return num ? `https://wa.me/${num}?text=${encodeURIComponent(settings.whatsappMessage || "")}` : "";
}
/* Affichage lisible : +213 555 43 97 66 */
function hayaPhonePretty(p) {
  const d = String(p || "").replace(/\D/g, "").replace(/^00/, "");
  if (!d) return "";
  // Indicatif : 1 chiffre (+1), 3 chiffres (+213, +212, +216, +352…) ou 2 chiffres (+33, +32, +41…)
  const cc = d.startsWith("1") ? 1 : /^(21\d|35\d|2[2-9]\d)/.test(d) ? 3 : 2;
  const rest = d.slice(cc);
  const pairs = s => s.replace(/\B(?=(\d{2})+(?!\d))/g, " ");
  const grouped = cc === 1 ? rest.replace(/^(\d{3})(\d{3})(\d{4})$/, "$1 $2 $3")                 // Canada : 514 555 1234
                : d.startsWith("33") ? pairs(rest)                                               // France : 6 12 34 56 78
                : rest.length === 9 ? rest.replace(/^(\d{3})(\d{2})(\d{2})(\d{2})$/, "$1 $2 $3 $4") // Algérie, Belgique… : 555 43 97 66
                : pairs(rest);
  return "+" + d.slice(0, cc) + " " + grouped.trim();
}

/* Bouton mode clair / sombre : mémorise le choix du visiteur */
function hayaThemeButton(btn) {
  if (!btn) return;
  const paint = () => { const light = document.documentElement.dataset.theme === "light";
    btn.textContent = light ? "🌙" : "☀️"; btn.setAttribute("aria-label", light ? "Passer en mode sombre" : "Passer en mode clair"); };
  btn.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("haya-theme", next); } catch (e) {}
    paint();
  });
  paint();
}

/* Applique les couleurs choisies dans l'admin à toute la page */
function hayaApplyTheme(theme) {
  const r = document.documentElement.style;
  r.setProperty("--brand", theme.brand);
  r.setProperty("--brand-2", theme.brand2);
  r.setProperty("--hot", theme.hot);
}
