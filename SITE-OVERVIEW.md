# Mini Shop — Vue d'ensemble du site

## Architecture

**2 projets distincts** :

- **Backend** — NestJS + TypeORM (SQLite) : API REST JSON sur `:3000`. JWT + Passport + guards RBAC. Sortie build : `dist/src/main.js`, watch mode + compilation TypeScript.
- **Frontend** — Angular (signals, standalone components, lazy loading par route) : SPA sur `:4200`, proxy `/api` → `:3000`. Stores injectables par domaine (`*.store.ts`), interceptor HTTP de refresh token, toasts.

**3 rôles** : `user` (client), `supplier` (fournisseur = propriétaire d'une boutique), `admin`. Les routes et endpoints sont protégés par guards côté front et par `@Roles()`/vérifications côté back.

## Authentification (workflow complet)

1. **Inscription** → `POST /auth/register` → email de vérification envoyé ; la connexion est **bloquée tant que l'email n'est pas vérifié**.
2. **Login** → `POST /auth/login` → renvoie `{ accessToken, refreshToken, user }` stockés en `localStorage`.
3. **Chaque requête protégée** ajoute `Authorization: Bearer <accessToken>` (interceptor).
4. **Expiration (401)** → interceptor appelle `POST /auth/refresh` une seule fois (shareReplay), **rejoue** la requête, sinon logout.
5. Oubli du mot de passe → `reset-password-request` → email avec token (validité 1 h) → `reset-password`.

## Workflow client (achat)

1. **Navigation publique** : home → catalogue produits, boutique (par shop), fiche produit avec avis.
2. **Ajout au panier** → `POST /cart/:productId` (201) ; le panier est persistant par user (limité en quantité ≤ stock).
3. **Panier** : modifier quantités, retirer, total recalculé.
4. **Payer** (bouton → `completeCheckout()`) :
   - `POST /payments/:cartId` → crée la **commande** (`pending`) + le **paiement** (et vide le panier),
   - `PATCH /payments/:id {status: 'succeeded'}` → **émet `order.paid`** → notifications in-app (fournisseur + client), emails (fournisseur par boutique + client avec **facture PDF en pièce jointe**), génération de la facture.
5. **Mes commandes** : statut affiché, **télécharger la facture PDF** (`GET /orders/:id/invoice`), **annuler** (uniquement si `pending` ou `confirmed`).
6. Le client ne peut que **canceler** ; il ne déplace pas les autres statuts.

## Machine à états des commandes

```
pending → confirmed → shipped → delivered → completed
   └───────── cancelled ←────┘
```

- Le **fournisseur** avance : Confirmer → Expédier (avec n° de suivi, optionnel) → Livrée → Terminer.
- **Annulation** (client, fournisseur, admin) = remise en stock **transactionnelle** (restock).
- L'**admin** peut tout faire (toute transition valide).
- Transitions illégales rejetées (`validateStatusTransition`), ex. : `delivered → shipped` impossible.

## Workflow fournisseur

- Dashboard : revenus, commandes reçues, produits en stock bas, statistiques par boutique.
- **Produits** : CRUD complet (nom, prix, stock, image, catégorie, boutique), ajustement de stock (`PATCH /products/:id/stock`).
- **Commandes** : liste filtrée (pending en évidence), boutons de progression + champ n° de suivi.
- Reçoit **notification in-app** « New order #xxxxx » + **email** à chaque nouvelle commande passée dans sa boutique.

## Workflow admin

- **Dashboard** : KPIs (CA, nb commandes, utilisateurs, panier moyen), ventes par statut, répartition produits/boutiques.
- **Users** : liste, changement de rôle (admin/supplier/user), activation/désactivation.
- **Catégories & Produits** : CRUD + modération.
- **Commandes** : vue globale, peut forcer n'importe quel statut.
- **Paiements** : liste, montants réussis, peut annuler un paiement.
- **Avis** : modération (visibles/validés).

## Comptes & notifications

- **Profil** : infos personnelles + gestion des adresses de livraison.
- **Notifications** (cloche) : liste, `unread-count`, marquer lue une par une ou tout lire.

## Écosystème (détails implémentés)

- **Emails (Brevo SMTP)** : vérification, reset password, nouvelle commande (fournisseur), confirmation + facture (client). Les erreurs et les succès sont loggés (« Email sent to … »).
- **Factures PDF** : générées avec pdfkit à la volée (cache en `storage/invoices/`), téléchargeables par le client.
- **Pagination** : standard `{page, limit, items, total, totalPages, hasNextPage}` sur toutes les listes.
- **RBAC double** : guards Angular (routes) + guards Nest (`@Public`/`@Roles`/vérif de propriété).

## Points d'attention (emails)

- L'email « client » part vers `order.user.email` (l'email du compte connecté), pas une adresse personnelle paramétrable. Ex. : se connecter avec le compte admin (`admin@minishop.com`, adresse fictive) envoie l'email dans le vide.
- L'expéditeur (`SMTP_FROM`) doit être **vérifié** dans le compte Brevo, sinon les emails atterrissent en spam ou ne partent pas.

## Limites connues

- `sendOrderShippedToCustomer` / `sendOrderCancelledToCustomer` sont **écrits mais non branchés** sur les transitions de statut.
- `GET /payments` renvoie tous les paiements à tout user connecté (faille documentée dans `endpoints.ts`).
- Paiement **simulé** : côté client, c'est un simple « je confirme » — pas de vrai processeur de paiement.