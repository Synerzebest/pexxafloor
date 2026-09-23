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
RESEND_FROM_EMAIL="PexxaFloor <commandes@votre-domaine-verifie.be>"
# Facultatif : adresse qui recevra les réponses des clients
RESEND_REPLY_TO=info@votre-domaine.be
# Secret aléatoire pour la tâche de relance (par exemple : openssl rand -hex 32)
CRON_SECRET=<secret-aleatoire>
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


## Mise en service des e-mails automatiques

### Commandes (API Resend)

1. Vérifier le domaine de l’expéditeur dans Resend en ajoutant les entrées DNS demandées. L’adresse `onboarding@resend.dev` est réservée aux tests ; elle n’est plus utilisée par l’application.
2. Renseigner `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NEXT_PUBLIC_URL` et `CRON_SECRET` dans `.env.local` (ou `.env`) **et dans les variables de production de l’hébergeur**. `NEXT_PUBLIC_URL` doit être l’URL HTTPS canonique du site, avec la bonne variante `www`. Redémarrer le serveur local ou redéployer après modification.
3. Exécuter [la migration de notifications](supabase/migrations/202609140001_order_email_outbox.sql) dans le SQL Editor Supabase **avant de déployer le nouveau code**. Elle ajoute une file privée et un déclencheur transactionnel sur les commandes. Elle n’envoie aucun mail aux anciennes commandes. Les nouveaux paiements et changements de statut sont enregistrés atomiquement avec la commande, même si Resend est indisponible.
4. Déployer. Les routes métier tentent immédiatement l’envoi au propriétaire de la commande, dans la langue de la commande (FR/NL/EN). L’adresse est lue depuis Supabase Auth. Les liens mènent à `/{locale}/profile`, qui contient l’historique réel des commandes.

Notifications couvertes : paiement confirmé (`paid`), préparation (`preparing`), emballage vérifié (`packed`), prête à expédier (`ready`), en livraison (`delivering`), livrée (`delivered`) et annulée (`cancelled`, si une commande passe à ce statut). L’étape `verification` est interne et ne produit pas un second mail de préparation. Les modifications directes de statut en base sont également mises en attente par le déclencheur SQL.

### Relances et suivi

`vercel.json` prévoit une relance quotidienne à 04:00 UTC, compatible avec une fréquence quotidienne. Les envois normaux restent immédiats. Pour une reprise rapide après panne, configurer un ordonnanceur appelant **toutes les 5 minutes** :

```text
GET https://votre-domaine.be/api/cron/emails
Authorization: Bearer <CRON_SECRET>
```

Sur une offre Vercel autorisant cette fréquence, remplacer le planning par `*/5 * * * *`. Sur un autre hébergeur, configurer cet appel explicitement. Le traitement prend au plus 10 messages par appel ; augmenter la fréquence en cas de volume important. La route refuse tout appel sans le secret. Un échec donne un HTTP 503, exploitable par la supervision de l’ordonnanceur.

Les messages refusés restent en base, avec des délais croissants de 5 à 60 minutes. Une notification d’une commande attend l’envoi des précédentes. Un verrou temporaire empêche deux traitements simultanés du même message. Une clé d’idempotence et le contenu exact de la requête sont conservés lors des reprises. Resend protège les doublons pendant 24 heures ; au-delà, une réponse réseau perdue après acceptation reste un cas ambigu. `sent_at` signifie **accepté par Resend**, pas nécessairement remis dans la boîte de réception : consulter Resend pour les rebonds et la délivrabilité.

Pour diagnostiquer les notifications sans afficher les adresses ni le contenu des mails :

```sql
select id, order_id, status, attempts, sent_at, resend_id, last_error, available_at
from public.order_email_outbox
order by created_at desc
limit 100;
```

Après correction de configuration, une notification en échec sera reprise au prochain passage. Le champ `request_payload` conserve l’expéditeur et le destinataire d’origine : si une mauvaise adresse d’expédition y est enregistrée, vérifier d’abord dans Resend qu’aucun envoi n’a été accepté avant toute réparation manuelle. Ne pas réinitialiser une notification déjà acceptée, au risque de la renvoyer.

### Inscription et réinitialisation du mot de passe (Supabase Auth)

Ces mails sont émis par **Supabase Auth**, qui ne lit pas la variable `RESEND_API_KEY` de Next.js. Activer son SMTP personnalisé :

- Serveur : `smtp.resend.com`
- Port : `465`
- Utilisateur : `resend`
- Mot de passe : la clé API Resend
- Expéditeur : une adresse du domaine vérifié ; nom : `PexxaFloor`

Vérifier aussi les paramètres Site URL, Redirect URLs et les modèles de confirmation/récupération dans Supabase. Ne pas remplacer les liens de confirmation Supabase par un simple lien vers l’accueil.

Références : [SMTP Supabase avec Resend](https://resend.com/docs/send-with-supabase-smtp), [idempotence Resend](https://resend.com/docs/dashboard/emails/idempotency-keys).

### Vérification

```bash
node --test tests/order-email.test.cjs
npx tsc --noEmit --incremental false
```

Les tests simulent Resend ; aucun mail réel n’est envoyé. Avant mise en service, utiliser un compte de test pour vérifier la confirmation d’inscription, la récupération du mot de passe, un paiement Stripe de test puis chaque transition de commande. Vérifier le destinataire, la langue, le lien, le statut Resend et l’absence de nouvel envoi lorsqu’on rejoue la tâche. Simuler ensuite un refus Resend et contrôler la reprise après correction.

### Récupération du mot de passe sur pexxafloor.be

Déployer `/auth/recovery` avant de changer le modèle du mail. Dans Supabase :

1. **Authentication → URL Configuration → Site URL** : `https://pexxafloor.be` (sans slash final).
2. Ajouter les Redirect URLs `https://pexxafloor.be/auth/recovery?locale=fr`, `https://pexxafloor.be/auth/recovery?locale=nl` et `https://pexxafloor.be/auth/recovery?locale=en`. Conserver les URLs de callback utilisées par l’inscription et Google.
3. Dans **Email Templates → Reset Password**, utiliser [le modèle de récupération](supabase/templates/recovery.html). Son lien `{{ .SiteURL }}/auth/recovery?token_hash={{ .TokenHash }}` est vérifié exclusivement comme une récupération, puis redirigé vers le formulaire français. Il fonctionne également depuis un autre navigateur, sans dépendre d’un cookie PKCE du navigateur d’origine.
4. Demander un **nouveau** mail depuis la production. Tester avec un compte admin et un compte client. Un lien expiré ou déjà utilisé doit afficher l’erreur de récupération, même si le navigateur a déjà une session.

Le modèle Supabase standard `{{ .ConfirmationURL }}` reste pris en charge avec les nouvelles adresses de retour ; son parcours PKCE nécessite le navigateur et le domaine d’origine. Le modèle fourni ci-dessus rend explicite la destination du mail et évite de dépendre de la redirection par défaut vers l’accueil.

Vérification locale (aucun vrai mail envoyé) : `node --test tests/password-recovery.test.cjs`.
