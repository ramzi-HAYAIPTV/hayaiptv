# HayaIPTV — plateforme IPTV (projet de fin d'études)

**Site en ligne : [https://hayaiptv.com](https://hayaiptv.com)**

HayaIPTV est une plateforme web de télévision par Internet (IPTV) réalisée dans le cadre d'un projet de fin d'études : présentation de l'offre, catalogue de chaînes, guide TV interactif, tunnel de commande, base de données des commandes et espace d'administration.

> ℹ️ Projet pédagogique : chaînes et programmes fictifs, paiement en **mode test (PayPal sandbox simulé)**. Aucun abonnement réel n'est vendu.

📂 **Le code source est dans le dossier [`hayaiptv-github`](hayaiptv-github)** — présentation détaillée : [hayaiptv-github/README.md](hayaiptv-github/README.md).

## ✨ Points clés
- Catalogue de chaînes ([/channels](https://hayaiptv.com/channels)), guide TV (EPG) avec l'heure réelle, lecteur d'aperçu
- Tunnel de commande en 3 étapes, codes promo, TVA, reçu PDF
- **API serverless** (Netlify Functions) + **base de données** (Netlify Blobs) : commandes en temps réel depuis tous les appareils
- **Admin sécurisé** : PBKDF2-SHA256, anti force brute, en-têtes CSP / HSTS
- Assistant virtuel, blog ([/blog](https://hayaiptv.com/blog/)), PWA, mode clair/sombre

## 🛠️ Technologies
HTML5 · CSS3 · JavaScript (sans framework) · Netlify Functions · Netlify Blobs · Web Crypto API · JSON-LD · PWA

## 📊 Google PageSpeed Insights
| Performances | Accessibilité | Bonnes pratiques | SEO |
|:---:|:---:|:---:|:---:|
| **99** | **100** | **100** | **100** |

## 👤 Auteur
Projet de fin d'études, 2026 — [hayaiptv.com](https://hayaiptv.com)

© 2026 HayaIPTV — Tous droits réservés.
