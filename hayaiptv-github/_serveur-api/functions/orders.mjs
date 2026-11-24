/* =====================================================================
   API des commandes — Netlify Function + Netlify Blobs (base de données)
   ---------------------------------------------------------------------
   Adresse : /api/orders
   - POST {action:"upsert"}  (public)  : le site enregistre / met à jour une commande
       → chaque commande a un identifiant (uid) + une clé secrète (key) :
         seul le navigateur qui l'a créée peut la modifier.
   - GET                      (admin)   : liste de toutes les commandes
   - POST {action:"status"}   (admin)   : changer le statut
   - POST {action:"delete"}   (admin)   : supprimer
   Admin : le mot de passe est envoyé dans l'en-tête « x-admin-pass » et vérifié
   avec la même empreinte PBKDF2-SHA256 que l'écran de connexion (jamais en clair).
   ===================================================================== */
import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";

const ADMIN = {
  salt: "095e92b1361e7ddf04681253b2fa5f28",
  hash: "4a45e6cae577e4f8dbdfa52016c02a5f9f384da096d07e6d315be5ea98694140",
  iter: 150000
};
const STATUSES = ["payée", "en attente", "remboursée", "annulée"];
const ID = /^[a-z0-9]{16,40}$/;

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});
const str = (v, n) => String(v ?? "").trim().slice(0, n);
const num = v => { const n = Number(v); return Number.isFinite(n) && n >= 0 && n < 100000 ? Math.round(n * 100) / 100 : 0; };

function isAdmin(req) {
  const p = req.headers.get("x-admin-pass") || "";
  if (!p || p.length > 200) return false;
  const h = crypto.pbkdf2Sync(p, Buffer.from(ADMIN.salt, "hex"), ADMIN.iter, 32, "sha256");
  return crypto.timingSafeEqual(h, Buffer.from(ADMIN.hash, "hex"));
}

// Ne garde que les champs attendus (protection contre les données piégées)
function clean(o) {
  return {
    ref: str(o.ref, 30), plan: str(o.plan, 40), billing: str(o.billing, 20), amount: num(o.amount),
    promo: o.promo ? str(o.promo, 20) : null, discount: num(o.discount),
    name: str(o.name, 80), email: str(o.email, 120), phone: str(o.phone, 30), country: str(o.country, 4),
    method: str(o.method, 40), status: o.status === "payée" ? "payée" : "en attente",
    date: str(o.date, 10), cgvAcceptedAt: str(o.cgvAcceptedAt, 30), waiver: !!o.waiver, newsletter: !!o.newsletter
  };
}

export default async req => {
  const store = getStore({ name: "orders", consistency: "strong" });

  if (req.method === "GET") {
    if (!isAdmin(req)) return json({ error: "Accès refusé" }, 401);
    const { blobs } = await store.list();
    const all = await Promise.all(blobs.map(b => store.get(b.key, { type: "json" })));
    const orders = all.filter(Boolean).map(({ key, ...o }) => o)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    return json({ orders });
  }

  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);
  if (Number(req.headers.get("content-length") || 0) > 8000) return json({ error: "Trop volumineux" }, 413);
  let body;
  try { body = await req.json(); } catch { return json({ error: "Requête invalide" }, 400); }
  const uid = str(body.uid, 40);
  if (!ID.test(uid)) return json({ error: "Identifiant invalide" }, 400);

  if (body.action === "upsert") {
    const key = str(body.key, 40);
    if (!ID.test(key)) return json({ error: "Clé invalide" }, 400);
    const o = clean(body.order || {});
    if (o.name.length < 2 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(o.email) || o.phone.replace(/\D/g, "").length < 6) return json({ error: "Commande incomplète" }, 400);
    const old = await store.get(uid, { type: "json" });
    if (old && old.key !== key) return json({ error: "Accès refusé" }, 403);
    if (old && old.status !== "en attente" && old.status !== "payée") o.status = old.status; // statut fixé par l'admin
    await store.setJSON(uid, { ...o, uid, key, createdAt: old?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() });
    return json({ ok: true });
  }

  if (!isAdmin(req)) return json({ error: "Accès refusé" }, 401);
  if (body.action === "status") {
    const old = await store.get(uid, { type: "json" });
    if (!old) return json({ error: "Introuvable" }, 404);
    if (!STATUSES.includes(body.status)) return json({ error: "Statut invalide" }, 400);
    await store.setJSON(uid, { ...old, status: body.status, updatedAt: new Date().toISOString() });
    return json({ ok: true });
  }
  if (body.action === "delete") { await store.delete(uid); return json({ ok: true }); }
  return json({ error: "Action inconnue" }, 400);
};

export const config = { path: "/api/orders" };
