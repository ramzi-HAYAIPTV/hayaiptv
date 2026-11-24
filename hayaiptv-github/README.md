# HayaIPTV — plateforme IPTV (projet de fin d'études)

**Site en ligne : [https://hayaiptv.com](https://hayaiptv.com)**

HayaIPTV est une plateforme web de télévision par Internet (IPTV) réalisée dans le cadre d'un projet de fin d'études. Elle couvre tout le parcours d'un service de streaming : présentation de l'offre, catalogue de chaînes, guide TV interactif, tunnel de commande, base de données des commandes et espace d'administration.

> ℹ️ Projet pédagogique : les chaînes et les programmes sont fictifs, et le paiement fonctionne en **mode test (PayPal sandbox simulé)**. Aucun abonnement réel n'est vendu.

---

## ✨ Fonctionnalités

### Site public
- **Page d'accueil** avec une explication visuelle « C'est quoi l'IPTV ? »
- **Catalogue de chaînes** avec filtres par catégorie et recherche ([/channels](https://hayaiptv.com/channels))
- **Guide TV (EPG)** : grille des programmes, ligne de l'heure réelle, fiche programme et rappels 🔔
- **Lecteur d'aperçu** animé (canvas), avec raccourcis clavier et mode plein écran
- **Formules et comparatif** : Basique 45 €, Premium 55 €, VIP 75 € par an
- **Tunnel de commande en 3 étapes** : coordonnées, paiement PayPal (simulé), confirmation et reçu PDF
- **Codes promo**, calcul de la TVA, case CGV et renonciation au droit de rétractation
- **Assistant virtuel** qui répond aux questions fréquentes et apprend de nouvelles réponses depuis l'admin
- **Blog** de guides IPTV ([/blog](https://hayaiptv.com/blog/)) et **page contact** ([/contact](https://hayaiptv.com/contact))
- Bouton **WhatsApp**, **mode clair et sombre**, **application installable (PWA)**

### Espace d'administration (`/admin`)
- Connexion sécurisée : mot de passe haché en **PBKDF2-SHA256** (150 000 itérations), blocage après 5 essais, session de 30 minutes
- **Commandes en temps réel** depuis tous les appareils, avec changement de statut, suppression et reçu
- Modification de **tous les textes**, des couleurs, des chaînes, des formules, de la FAQ et des codes promo
- **Sections affichées** : choix des parties visibles sur la page d'accueil
- Messages de contact, état du service et apprentissage de l'assistant

---

## 🛠️ Technologies

| Domaine | Choix |
|---|---|
| Front-end | HTML5, CSS3 (variables, grid, animations), JavaScript sans framework |
| Back-end | **Netlify Functions** (API serverless `/api/orders`) |
| Base de données | **Netlify Blobs** (commandes), localStorage (contenu modifiable) |
| Sécurité | Web Crypto API (PBKDF2), en-têtes CSP, HSTS et X-Frame-Options, protection XSS |
| SEO | HTML pré-rendu, données structurées JSON-LD, sitemap, Open Graph, IndexNow |
| PWA | Manifest et service worker (stratégie « réseau d'abord ») |
| Hébergement | Netlify, domaine chez Hostinger, HTTPS |

---

## 📊 Qualité (Google PageSpeed Insights)

| Performances | Accessibilité | Bonnes pratiques | SEO |
|:---:|:---:|:---:|:---:|
| **99** | **100** | **100** | **100** |

Mesures mobiles en 4G lente : premier affichage en 1,7 s, CLS de 0,003, aucun blocage.

---

## 📁 Structure du projet

```
├── index.html            Page d'accueil (pré-rendue pour le SEO)
├── channels.html         Catalogue des chaînes
├── contact.html          Page contact
├── blog/                 Articles (générés par build-blog.ps1)
├── admin/index.html      Espace d'administration
├── style.css             Design (thèmes clair et sombre)
├── data.js               Données, sécurité (PBKDF2) et fonctions communes
├── checkout.js           Tunnel de commande
├── assistant.js          Assistant virtuel
├── tv.js                 Guide TV et lecteur d'aperçu
├── sw.js                 Service worker (PWA)
├── _headers, _redirects  Sécurité et redirections Netlify
└── _serveur-api/         API des commandes (Netlify Function + Blobs)
```

---

## 🚀 Lancer le projet

1. Ouvrir le dossier avec un petit serveur local (par exemple l'extension « Live Server » de VS Code).
2. Pour le déploiement :
   ```bash
   netlify deploy --prod --dir . --functions _serveur-api/functions
   ```

---

## 👤 Auteur

**[Ton prénom et nom]** — projet de fin d'études, 2026
[LinkedIn](https://www.linkedin.com/in/ton-profil) · [hayaiptv.com](https://hayaiptv.com)
