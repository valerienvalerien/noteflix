# Noteflix — Guide de déploiement

Noteflix est une app **Expo / React Native** (iOS + Android) adossée à un backend
**Supabase** (Postgres + pgvector, Auth, Edge Functions). Le code est complet ;
il te reste à créer le projet Supabase et à le déployer.

---

## 1. Créer le projet Supabase

1. Sur [supabase.com](https://supabase.com), crée un projet (note le mot de passe DB).
2. Récupère dans **Project Settings → API** :
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public key** → `EXPO_PUBLIC_SUPABASE_ANON_KEY`
3. À la racine du dépôt, copie `.env.example` en `.env` et renseigne ces deux valeurs.

```bash
cp .env.example .env
# puis édite .env
```

## 2. Installer la CLI Supabase et lier le projet

```bash
npm install -g supabase            # ou: brew install supabase/tap/supabase
supabase login
supabase link --project-ref <ton-ref-projet>   # le ref est dans l'URL du dashboard
```

## 3. Appliquer le schéma (migrations)

Crée les tables, la RLS, l'extension pgvector, l'index HNSW et la fonction
`match_items` :

```bash
supabase db push
```

## 4. Déployer les Edge Functions

Quatre fonctions (le module `embed` est partagé, pas une fonction à déployer) :

```bash
supabase functions deploy index-item
supabase functions deploy search
supabase functions deploy recommend
supabase functions deploy generate-path
```

## 5. Poser le secret Anthropic

La clé Claude vit **uniquement côté serveur** (jamais sur l'appareil) :

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

> `SUPABASE_URL` et `SUPABASE_ANON_KEY` sont injectées automatiquement dans les
> fonctions par Supabase — rien à faire.

## 6. Lancer l'app

```bash
npm install
npx expo start
```

Scanne le QR code avec **Expo Go** (iOS/Android). Crée un compte, ajoute une
vidéo, puis teste la recherche IA.

> ⚠️ Si Expo signale des versions de modules natifs incompatibles avec le SDK 56,
> lance `npx expo install --fix` (nécessite l'accès à l'API Expo).

---

## Développement 100 % local (optionnel, nécessite Docker)

```bash
supabase start                      # Postgres + Auth + Edge Runtime locaux
supabase functions serve --env-file supabase/functions/.env
```

Mets l'`ANTHROPIC_API_KEY` dans `supabase/functions/.env` (non commité) et pointe
l'app sur l'URL/clé locales affichées par `supabase start`.
En local, `config.toml` désactive la confirmation d'e-mail (`enable_confirmations = false`)
pour se connecter immédiatement.

---

## Architecture

```
Expo app (iOS/Android)
  ├─ Auth (email + mot de passe)  ── Supabase Auth
  ├─ Données (items, catégories, parcours)  ── Postgres + RLS (par utilisateur)
  ├─ Recherche instantanée  ── locale (src/search.ts)
  └─ IA (jamais de clé sur l'appareil)  ── Edge Functions :
        embed (gte-small, partagé) · index-item · search · recommend · generate-path
                                              └─ Claude claude-opus-4-8 (secret serveur)
```

- **Embeddings** : `gte-small` (384 dim) via le runtime Edge de Supabase — gratuit,
  aucune clé externe. Pour plus de précision, remplace `supabase/functions/_shared/embed.ts`
  (OpenAI/Voyage) et la dimension `vector(384)` dans la migration.
- **Recherche** : embed de la requête → plus proches voisins pgvector (RLS) →
  re-classement + explication par Claude (repli : ordre vectoriel brut).

## Ré-indexer d'anciens items (backfill)

Les items créés avant l'activation des embeddings ont `embedding = NULL`. Pour les
réindexer, appelle `index-item` pour chacun, par ex. via la console SQL :

```sql
select id from public.items where embedding is null;
```

puis, côté app/script, `supabase.functions.invoke('index-item', { body: { item_id } })`
pour chaque id (l'app le fait automatiquement à chaque nouvel ajout).

## Capture native (Partager → Noteflix) — étape future

La capture par presse-papier (bouton « Coller ») fonctionne dans Expo Go. Le
partage natif depuis TikTok/YouTube/Instagram nécessite `expo-share-intent` + un
**build EAS dev client** (indisponible dans Expo Go) — à activer plus tard.
