/* =====================================================================
   checkout.js — Tunnel de commande SIMULÉ (mode test)
   ---------------------------------------------------------------------
   Étapes : 1. Formule + coordonnées  2. Paiement  3. Confirmation
   - Paiement unique par PayPal, SIMULÉ (sandbox) : aucun argent réel.
   - La commande est enregistrée dans data.orders → visible dans Admin > Commandes.
   En production : PayPal JavaScript SDK + un serveur qui crée et vérifie le paiement.
   ===================================================================== */
(function () {
  const modal = document.getElementById("checkout");
  const body = document.getElementById("co-body");
  const steps = modal.querySelectorAll(".co-steps li");
  let order = null, lastFocus = null;

  const VAT = 0.20; // TVA française 20 % (prix affichés TTC)
  const COUNTRIES = [["FR", "France", "+33"], ["BE", "Belgique", "+32"], ["CH", "Suisse", "+41"], ["LU", "Luxembourg", "+352"],
                     ["CA", "Canada", "+1"], ["DZ", "Algérie", "+213"], ["MA", "Maroc", "+212"], ["TN", "Tunisie", "+216"]];
  const dialOf = code => (COUNTRIES.find(c => c[0] === code) || COUNTRIES[0])[2];
  const disc = () => (parseFloat(hayaLoad().content.yearlyDiscount) || 0) / 100;
  // Mode « prix annuels » : le prix saisi dans l'admin EST le prix de l'année
  const annualOnly = () => (hayaLoad().content.billingPeriod || "mois") === "an";
  const amountOf = (plan, billing) => {
    const m = parseFloat(plan.price) || 0;
    if (annualOnly()) return m;
    return billing === "annuel" ? Math.round(m * (1 - disc()) * 12 * 100) / 100 : m;
  };

  function setStep(n) {
    steps.forEach((li, i) => { li.classList.toggle("on", i === n); li.classList.toggle("done", i < n); });
  }

  // ---------- Ouverture / fermeture ----------
  window.hayaOpenCheckout = function (planId, yearly) {
    const plan = hayaLoad().plans.find(p => p.id == planId);
    if (!plan) return;
    order = { plan, billing: (yearly || annualOnly()) ? "annuel" : "mensuel", name: "", email: "", country: "FR", phone: "", newsletter: false };
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    stepPlan();
  };
  function close() {
    modal.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }
  modal.addEventListener("click", e => { if (e.target === modal || e.target.closest("[data-close]")) close(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !modal.hidden) close(); });

  // ---------- Étape 1 : formule + coordonnées ----------
  function stepPlan() {
    setStep(0);
    const p = order.plan, pct = Math.round(disc() * 100);
    body.innerHTML = `
      <h2 id="co-title" style="margin:0 0 14px;font-size:1.4rem">Votre commande</h2>
      <div class="co-sum"><div><h3>Formule ${esc(p.name)}</h3><span class="muted" style="font-size:.85rem">${p.features.slice(0, 2).map(esc).join(" · ")}</span></div>
        <div class="amt" id="co-amt"></div></div>
      ${annualOnly()
        ? `<p class="muted" style="margin:0 0 12px;font-size:.88rem">Abonnement <b style="color:var(--text)">12 mois</b> · 1 écran · sans reconduction automatique</p>`
        : `<div class="seg" role="radiogroup" aria-label="Facturation">
        <label><input type="radio" name="billing" value="mensuel" ${order.billing === "mensuel" ? "checked" : ""}>Mensuel<small>${euro(p.price)} € / mois</small></label>
        <label><input type="radio" name="billing" value="annuel" ${order.billing === "annuel" ? "checked" : ""}>Annuel −${pct} %<small>${euro(amountOf(p, "annuel"))} € / an</small></label>
      </div>`}
      <div class="co-vat" id="co-vat"></div>
      <form class="co-form" id="co-form1" novalidate>
        <label class="field">Nom complet<input name="name" autocomplete="name" required maxlength="80" value="${esc(order.name)}"></label>
        <label class="field">E-mail<input name="email" type="email" autocomplete="email" required maxlength="120" value="${esc(order.email)}"></label>
        <div class="phone-row">
          <label class="field">Pays<select name="country" autocomplete="country">${COUNTRIES.map(([c, n, d]) => `<option value="${c}" ${c === order.country ? "selected" : ""}>${n} (${d})</option>`).join("")}</select></label>
          <label class="field">Téléphone<input name="phone" type="tel" autocomplete="tel-national" inputmode="tel" placeholder="6 12 34 56 78" maxlength="20" required value="${esc(order.phone)}"></label>
        </div>
        <label class="check"><input type="checkbox" name="cgv" required> J'ai lu et j'accepte les <a href="mentions-legales.html#cgv" target="_blank" rel="noopener">conditions générales de vente</a> et la <a href="mentions-legales.html#confidentialite" target="_blank" rel="noopener">politique de confidentialité</a>.</label>
        <label class="check"><input type="checkbox" name="newsletter" ${order.newsletter ? "checked" : ""}> J'accepte de recevoir les nouveautés et offres par e-mail (facultatif, désinscription à tout moment).</label>
        <p class="co-err" id="co-err"></p>
        <button class="btn block" type="submit">Continuer vers le paiement →</button>
      </form>`;
    const showAmt = () => {
      const ttc = amountOf(p, order.billing), ht = ttc / (1 + VAT);
      document.getElementById("co-amt").textContent = euro(ttc) + " €";
      document.getElementById("co-vat").innerHTML = `<span>Prix HT</span><span>${euro(ht)} €</span><span>TVA (20 %)</span><span>${euro(ttc - ht)} €</span><b>Total TTC</b><b>${euro(ttc)} €</b>`;
    };
    showAmt();
    body.querySelectorAll('input[name=billing]').forEach(r => r.addEventListener("change", () => { order.billing = r.value; showAmt(); }));
    body.querySelector("#co-form1").addEventListener("submit", async e => {
      e.preventDefault();
      const f = new FormData(e.target);
      order.name = f.get("name").trim(); order.email = f.get("email").trim();
      order.country = f.get("country"); order.newsletter = f.get("newsletter") === "on";
      const digits = f.get("phone").replace(/\D/g, "").replace(/^0+/, "");
      if (order.name.length < 2) return err("Indiquez votre nom.");
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(order.email)) return err("Adresse e-mail invalide.");
      if (digits.length < 6 || digits.length > 13) return err("Numéro de téléphone invalide.");
      if (f.get("cgv") !== "on") return err("Vous devez accepter les conditions générales de vente.");
      order.phone = f.get("phone").trim();
      // Format international lisible, ex. +33 6 12 34 56 78 (groupes de 2 chiffres depuis la fin)
      order.phoneIntl = hayaPhonePretty(dialOf(order.country) + digits);
      saveOrder("en attente", "—");   // la commande apparaît tout de suite dans Admin > Commandes
      const btn = e.target.querySelector("button[type=submit]"), label = btn.innerHTML;
      btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Enregistrement…'; err("");
      const ok = await sendOrder();
      btn.disabled = false; btn.innerHTML = label;
      if (!ok) return err("Impossible d'enregistrer la commande : vérifiez votre connexion Internet puis réessayez.");
      stepPay("paypal");
    });
    body.querySelector("input[name=name]").focus();
  }
  function err(msg) { const el = document.getElementById("co-err"); if (el) el.textContent = msg; }

  // ---------- Étape 2 : paiement ----------
  const finalTotal = () => Math.max(0, Math.round((amountOf(order.plan, order.billing) - (order.discount || 0)) * 100) / 100);

  function stepPay(method) {
    setStep(1);
    const total = euro(finalTotal());
    body.innerHTML = `
      <h2 id="co-title" style="margin:0 0 14px;font-size:1.4rem">Paiement</h2>
      <div class="co-sum"><div><h3>${esc(order.plan.name)} — ${order.billing}</h3><span class="muted" style="font-size:.85rem">${esc(order.email)} · ${esc(order.phoneIntl)}</span></div><div class="amt">${total} €<small style="display:block;font-size:.7rem;color:var(--muted);font-weight:600;text-align:right">TTC</small></div></div>
      <div class="promo-row">
        <input id="co-promo" placeholder="Code promo" value="${esc(order.promo || "")}" maxlength="20" aria-label="Code promo" autocomplete="off">
        <button type="button" class="btn small ghost" id="co-promo-btn">${order.promo ? "Retirer" : "Appliquer"}</button>
      </div>
      <p class="promo-msg" id="co-promo-msg">${order.promo ? `🎟️ Code <b>${esc(order.promo)}</b> appliqué : −${euro(order.discount)} € (prix avant remise : ${euro(amountOf(order.plan, order.billing))} €)` : ""}</p>
      <label class="check" style="margin-bottom:14px"><input type="checkbox" id="co-waiver" ${order.waiver ? "checked" : ""}> Je demande l'accès immédiat au service et je reconnais perdre mon droit de rétractation de 14 jours une fois le service activé (art. L221-28 du Code de la consommation).</label>
      <div id="pay-zone"></div>`;
    document.getElementById("co-promo-btn").addEventListener("click", () => {
      if (order.promo) { order.promo = null; order.discount = 0; return stepPay(method); }
      const r = hayaApplyPromo(hayaLoad(), document.getElementById("co-promo").value, amountOf(order.plan, order.billing));
      if (!r.ok) { document.getElementById("co-promo-msg").innerHTML = `<span style="color:#ff8f8f">${esc(r.error || "Saisissez un code.")}</span>`; return; }
      order.promo = r.promo.code; order.discount = r.discount; stepPay(method);
    });
    const waiver = document.getElementById("co-waiver");
    waiver.addEventListener("change", () => { order.waiver = waiver.checked; });
    const waiverOk = () => { if (waiver.checked) return true; err("Cochez la case d'accès immédiat au service pour continuer."); waiver.focus(); return false; };
    const zone = document.getElementById("pay-zone");

    // Paiement unique : PayPal (simulé en mode test)
    zone.innerHTML = `
      <div class="co-form">
        <div class="pp-head"><b style="color:#003087;font-size:1.3rem">Pay</b><b style="color:#009cde;font-size:1.3rem">Pal</b>
          <span class="muted" style="font-size:.82rem;margin-left:auto">🔒 Paiement sécurisé</span></div>
        <p class="muted" style="margin:0;font-size:.88rem">Payez avec votre compte PayPal ou par carte bancaire via PayPal, sans partager vos coordonnées bancaires avec nous.</p>
        <button type="button" class="btn block btn-paypal" id="pp-btn"><b style="color:#003087">Pay</b><b style="color:#009cde">Pal</b> &nbsp;·&nbsp; Payer ${total} €</button>
        <div id="pp-zone"></div>
        <p class="co-hint">🧪 <b>Mode test</b> — paiement PayPal simulé (sandbox), aucun argent réel.</p>
        <p class="co-err" id="co-err"></p>
      </div>`;
    document.getElementById("pp-btn").addEventListener("click", () => {
      if (!waiverOk()) return;
      err("");
      document.getElementById("pp-zone").innerHTML = `
        <div class="paypal-box">
          <b>PayPal <small style="font-weight:600;color:#6b7280">sandbox</small></b>
          <span>Connecté en tant que <strong>acheteur-test@example.com</strong></span>
          <span>Montant : <strong>${total} €</strong> à HayaIPTV</span>
          <button type="button" class="btn block" id="pp-ok" style="background:#0070ba">Approuver le paiement</button>
        </div>`;
      document.getElementById("pp-ok").addEventListener("click", e => processing(e.target, () => finish("PayPal (sandbox)")));
    });
  }

  function processing(btn, done) {
    const label = btn.innerHTML;
    btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Traitement…';
    setTimeout(() => { if (done() === false) { btn.disabled = false; btn.innerHTML = label; } }, 1200);
  }

  // ---------- Enregistrement de la commande (Admin > Commandes) ----------
  // Étape 1 validée → commande « en attente » ; paiement accepté → la même commande passe « payée ».
  function saveOrder(status, method) {
    const d = hayaLoad();
    let rec = order.id && d.orders.find(o => o.id === order.id);
    if (!rec) {
      const id = hayaNextId(d.orders), rnd = hayaSalt();
      order.uid = rnd.slice(0, 24); order.key = hayaSalt().slice(0, 24);
      // Référence unique même si plusieurs téléphones commandent en même temps
      const ref = "HS-" + new Date().toISOString().slice(2, 10).replace(/-/g, "") + "-" + rnd.slice(24, 28).toUpperCase();
      rec = { id, uid: order.uid, ref, cgvAcceptedAt: new Date().toISOString() };
      d.orders.unshift(rec); order.id = id;
    }
    Object.assign(rec, {
      plan: order.plan.name, billing: order.billing, amount: finalTotal(),
      promo: order.promo || null, discount: order.discount || 0,
      name: order.name, email: order.email, phone: order.phoneIntl, country: order.country,
      method, status, date: new Date().toISOString().slice(0, 10),
      waiver: !!order.waiver, newsletter: order.newsletter
    });
    if (status === "payée" && order.promo) { const p = d.promos.find(x => x.code === order.promo); if (p) p.uses = (p.uses || 0) + 1; }
    hayaSave(d);
    order.rec = rec;
    return rec;
  }
  // Envoi au serveur (base de données en ligne) → visible dans l'admin depuis n'importe quel appareil.
  // 3 essais ; renvoie true si le serveur a bien enregistré la commande.
  async function sendOrder() {
    for (let i = 0; i < 3; i++) {
      try {
        const r = await fetch("/api/orders", { method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "upsert", uid: order.uid, key: order.key, order: order.rec }) });
        if (r.ok) { order.sent = true; return true; }
        if (r.status < 500) return false;
      } catch (e) {}
      await new Promise(res => setTimeout(res, 800));
    }
    return false;
  }

  // ---------- Étape 3 : confirmation ----------
  function finish(method) {
    const rec = saveOrder("payée", method);
    sendOrder();
    order.promo = null; order.discount = 0;
    setStep(2); steps[2].classList.add("done");
    body.innerHTML = `
      <div class="co-done">
        <div class="check">✓</div>
        <h2 id="co-title" style="margin:0 0 6px">Commande confirmée !</h2>
        <p class="muted" style="margin:0 0 6px;font-size:.8rem">${order.sent ? "✓ Enregistrée sur le serveur" : "⏳ Envoi au serveur…"}</p>
        <p class="muted" style="margin:0">Merci ${esc(rec.name)}. Un e-mail de confirmation serait envoyé à ${esc(rec.email)} (simulation).</p>
        <dl>
          <dt>Référence</dt><dd>${rec.ref}</dd>
          <dt>Formule</dt><dd>${esc(rec.plan)} (${rec.billing})</dd>
          <dt>Téléphone</dt><dd>${esc(rec.phone)}</dd>
          <dt>Montant TTC</dt><dd>${euro(rec.amount)} €</dd>
          <dt>dont TVA 20 %</dt><dd>${euro(rec.amount - rec.amount / (1 + VAT))} €</dd>
          <dt>Paiement</dt><dd>${esc(rec.method)}</dd>
        </dl>
        <div style="display:grid;gap:10px">
          <button class="btn ghost block" id="co-receipt">🧾 Télécharger le reçu</button>
          <button class="btn block" data-close>Terminer</button>
        </div>
      </div>`;
    document.getElementById("co-receipt").addEventListener("click", () => hayaPrintReceipt(rec));
    body.querySelector("[data-close]").focus();
    return true;
  }
})();
