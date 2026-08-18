# PexxaFloor

Application e-commerce multilingue dédiée aux solutions de chauffage par le sol. Elle regroupe le catalogue, le configurateur de packs, les devis, le panier, le paiement, le suivi des commandes et les espaces métier de PexxaFloor.

## Fonctionnalités principales

- Catalogue hiérarchisé : catégories, sous-catégories, sous-sous-catégories et produits.
- Configurateur de packs selon la surface, le pas de pose, le tuyau, l’isolation et les options choisies.
- Panier accessible sans compte, avec authentification demandée au moment du paiement.
- Paiement Stripe et création des commandes via webhook sécurisé.
- Comptes clients avec historique des commandes et adresses de livraison enregistrées avec consentement.
- Demandes de compte professionnel et validation par un administrateur.
- Tarifs et crédit de bienvenue réservés aux comptes PRO.
- Enregistrement et gestion de devis pour les professionnels.
- PDF distincts : devis PRO, devis destiné au particulier et estimation neutre pour les visiteurs.
- Espaces séparés pour les administrateurs, magasiniers et livreurs.
- Interface disponible en français, néerlandais et anglais.
- Notifications transactionnelles avec Resend.

## Stack technique

- Next.js 16 avec App Router
- React 19 et TypeScript
- Tailwind CSS 4
- Supabase : authentification, PostgreSQL, Storage et Row Level Security
- Stripe Checkout et webhooks
- next-intl pour l’internationalisation
- Google Maps Places pour l’autocomplétion des adresses
- Resend pour les e-mails transactionnels
- jsPDF pour la génération des devis
- Ant Design, Framer Motion et Lucide pour certains composants d’interface

## Prérequis

- Node.js 20 ou une version LTS plus récente
- npm
- Un projet Supabase configuré
- Un compte Stripe
- Une clé Google Maps avec l’API Places activée
- Un compte Resend pour les e-mails automatiques

## Installation locale

```bash
git clone <url-du-depot>
cd pexx
npm install
# Créez ensuite .env.local avec les variables documentées ci-dessous
npm run dev
```

L’application est ensuite accessible sur [http://localhost:3000](http://localhost:3000). La locale par défaut est l’anglais ; les routes publiques commencent par `/en`, `/fr` ou `/nl`.

Le dépôt ne contient pas encore de fichier `.env.example`. Créez `.env.local` avec les variables décrites ci-dessous sans jamais y placer de secrets destinés au navigateur.

## Variables d’environnement

```dotenv
# URL publique de l'application, sans slash final
NEXT_PUBLIC_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# Stripe
STRIPE_SECRET_KEY=<stripe-secret-key>
STRIPE_WEBHOOK_SECRET=<stripe-webhook-signing-secret>

# Google Maps / Places
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<google-maps-browser-key>

# Resend
RESEND_API_KEY=<resend-api-key>
```

`SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` et `RESEND_API_KEY` sont strictement privés. Ils ne doivent jamais être préfixés par `NEXT_PUBLIC_`, exposés dans le navigateur ou ajoutés au dépôt Git.

## Configuration Supabase

La base doit contenir au minimum les ressources utilisées par l’application :

- `profiles`
- `categories`, `subcategories` et `subsubcategories`
- `products` et `product_images`
- `packs` et `pack_items`
- `carts_temp`, `orders` et `stripe_events`
- `pro_applications`
- `pack_quotes`
- `pro_credit_accounts` et les tables associées au crédit PRO
- `pro_category_discounts` pour les remises PRO personnalisées par catégorie
- `shipping_addresses`
- les buckets Storage `images-products` et `images-categories`

Les fonctions PostgreSQL suivantes sont également utilisées :

- `reserve_pro_credit`
- `attach_credit_stripe_session`
- `consume_pro_credit`
- `release_pro_credit`

Toutes les tables contenant des données personnelles doivent avoir la RLS activée. Les règles doivent limiter les clients à leurs propres profils, commandes, devis et adresses. Les opérations d’administration sont effectuées côté serveur après vérification du rôle.

Les migrations SQL doivent idéalement être versionnées dans le dépôt et exécutées dans **Supabase → SQL Editor** dans l’ordre prévu. Après une modification manuelle du schéma, il peut être nécessaire d’exécuter :

```sql
notify pgrst, 'reload schema';
```

### Authentification et redirections

Dans **Supabase → Authentication → URL Configuration**, configurez :

- Site URL locale : `http://localhost:3000`
- Site URL de production : la valeur de `NEXT_PUBLIC_URL`
- Redirect URLs : `http://localhost:3000/auth/callback` et l’équivalent de production

Les confirmations d’inscription, connexions OAuth et réinitialisations de mot de passe passent par `/auth/callback`.

## Configuration Stripe

Le paiement est créé par `POST /api/checkout`. La commande définitive est créée uniquement après réception d’un événement Stripe valide sur :

```text
POST /api/webhooks/stripe
```

Événements gérés :

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`

Pour tester localement avec Stripe CLI :

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copiez le secret `whsec_...` affiché par la CLI dans `STRIPE_WEBHOOK_SECRET`. En production, créez un endpoint webhook vers `https://votre-domaine/api/webhooks/stripe`.

## Google Maps

L’autocomplétion des adresses utilise Google Maps Places depuis le navigateur. La clé doit :

- autoriser l’API Places nécessaire au projet ;
- être limitée aux domaines local et de production ;
- ne pas être réutilisée pour des API serveur sensibles.

Si Google Maps est indisponible, l’adresse reste saisissable manuellement.

## E-mails avec Resend

Resend est utilisé pour notifier les changements de statut des commandes. Pour la production :

1. Acheter et vérifier le domaine d’envoi dans Resend.
2. Ajouter les enregistrements DNS demandés.
3. Remplacer l’expéditeur de test `onboarding@resend.dev` dans les routes d’e-mail par une adresse du domaine vérifié.
4. Définir `RESEND_API_KEY` dans l’environnement de production.

Sans domaine vérifié, Resend limite fortement les destinataires et l’expéditeur utilisables.

## Rôles et accès

Les accès sont protégés dans `middleware.ts` à partir de `profiles.user_role` :

| Rôle | Accès principal |
| --- | --- |
| `client` | Boutique, panier, profil et commandes personnelles |
| `collaborator` | Accès métier limité selon les écrans disponibles |
| `storekeeper` | Préparation et emballage des commandes |
| `delivery` | Livraison et clôture des commandes |
| `admin` | Catalogue, commandes, demandes PRO et gestion des rôles |

Le statut professionnel est distinct du rôle et repose sur `profiles.is_pro`.

## Internationalisation

Les locales sont définies dans `i18n/routing.ts` :

- `fr` : français
- `nl` : néerlandais
- `en` : anglais, locale par défaut

Les traductions se trouvent dans :

```text
messages/fr.json
messages/nl.json
messages/en.json
```

Lorsqu’une clé est ajoutée, elle doit être ajoutée dans les trois fichiers avec la même structure.

## Structure du projet

```text
app/                  Pages, actions serveur et routes API
components/           Composants UI et composants métier
components/admin/     Interfaces d'administration
components/pack/      Configurateur et devis de packs
context/              Authentification, panier, devis et état global
hooks/                Logique réutilisable côté client
i18n/                 Configuration next-intl
lib/                  Clients Supabase et utilitaires serveur
messages/             Traductions FR, NL et EN
public/               Images et ressources statiques
types/                Types TypeScript partagés
utils/                Calculs, accès catalogue et fonctions utilitaires
```

## Commandes utiles

```bash
npm run dev        # Serveur de développement
npm run build      # Build de production et contrôle TypeScript Next.js
npm run start      # Démarrage du build de production
npx tsc --noEmit   # Vérification TypeScript seule
```

Le script `npm run lint` utilise encore l’ancienne commande `next lint`, retirée des versions récentes de Next.js. Il doit être migré vers un appel ESLint direct avant d’être utilisé dans la CI.

## Déploiement

Le projet peut être déployé sur Vercel. Avant une mise en production :

1. Ajouter toutes les variables d’environnement au projet Vercel.
2. Définir `NEXT_PUBLIC_URL` avec le domaine final.
3. Ajouter ce domaine aux redirections autorisées dans Supabase Auth.
4. Configurer le webhook Stripe de production.
5. Restreindre la clé Google Maps au domaine final.
6. Vérifier le domaine Resend et remplacer l’expéditeur de test.
7. Exécuter les migrations Supabase et vérifier les politiques RLS.
8. Tester inscription, confirmation d’e-mail, récupération du mot de passe, paiement et changements de statut d’une commande.

## Vérifications avant livraison

```bash
npx tsc --noEmit
npm run build
```

Effectuez ensuite un test manuel dans les trois langues pour les parcours suivants :

- création et confirmation d’un compte ;
- connexion et récupération du mot de passe ;
- configuration d’un pack et génération des différents PDF ;
- panier visiteur puis authentification ;
- sélection ou enregistrement d’une adresse ;
- paiement Stripe et création de la commande ;
- validation, préparation et livraison par les espaces métier ;
- demande et validation d’un compte PRO ;
- utilisation sécurisée du crédit PRO.

## Licence

Projet privé. Toute reproduction, distribution ou utilisation sans autorisation est interdite.
