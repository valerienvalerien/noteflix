# Noteflix 🎬

Ton **second cerveau vidéo**, façon Netflix / Prime Video — **app mobile iOS & Android**
(Expo / React Native) adossée à un backend **Supabase**. Sauvegarde des vidéos
(YouTube/Shorts, TikTok, Instagram) et des idées, puis **retrouve-les des mois plus
tard à partir d'une simple description en langage naturel** — là où les favoris
YouTube/TikTok/Instagram échouent.

C'est un vrai **SaaS cloud** : compte utilisateur, synchro entre appareils, et
**vraie recherche sémantique** (embeddings vectoriels pgvector + Claude), pas un
simple stockage local.

> 🚀 **Déploiement** : voir **[SETUP.md](./SETUP.md)** (créer le projet Supabase,
> appliquer les migrations, déployer les Edge Functions, poser le secret Claude).

## Fonctionnalités

- **Ajout en un collage** : colle une URL → titre / auteur / miniature récupérés
  automatiquement (oEmbed). Détection du presse-papier (« Coller le lien copié »).
  Mode « Idée » pour les notes en texte libre.
- **Recherche sémantique** : décris vaguement ce que tu cherches (« le gars qui gère
  une objection prix en 30 secondes ») — embedding de la requête → plus proches
  voisins pgvector → Claude re-classe et explique. Plus une recherche instantanée
  locale pendant la frappe.
- **Accueil façon Netflix/Prime** : bannière héros, rangées « Ajouts récents » /
  « Reprendre » / par catégorie, navigation par onglets.
- **Lecture intégrée** : embed dans une `WebView` (YouTube nocookie, TikTok, Instagram).
- **Recommandations** : « Suggère-moi » → Claude propose quoi *revoir* et quoi *explorer*.
- **Parcours d'apprentissage IA** : « Apprends le closing en 30 jours » → Claude bâtit
  un parcours progressif à partir de TA bibliothèque.

## Stack

- **Expo (SDK 56)** + React Native 0.85 + React 19 + TypeScript
- **Supabase** : Postgres + **pgvector**, Auth (email + mot de passe), RLS par
  utilisateur, **Edge Functions** (Deno)
- **Embeddings** : `gte-small` (384 dim) via le runtime Edge de Supabase (gratuit, swappable)
- **Claude API** (`claude-opus-4-8`) — appelée **uniquement côté serveur** (clé en
  secret Supabase, jamais sur l'appareil)
- **@react-navigation** (onglets) · **react-native-webview** (lecture)

## Architecture

```
App.tsx                         # providers + auth gate + onglets + modales globales
src/
  supabase.ts                   # client Supabase (auth persistée via AsyncStorage)
  data.ts                       # couche données (Postgres + appels Edge Functions)
  types.ts                      # Item, Category, LearningPath
  theme.ts · util.ts            # palette + helpers
  video.ts · metadata.ts        # parsing d'URL + résolution oEmbed
  search.ts                     # recherche instantanée locale (accents)
  auth/                         # AuthProvider, AuthScreen
  library/LibraryContext.tsx    # état global items/catégories + modales
  screens/                      # Home, Search, Paths, Profile
  components/                   # HeroBillboard, Card, Row, PlayerModal, AddModal, RecommendModal

supabase/
  migrations/0001_init.sql      # tables, RLS, pgvector, index HNSW, match_items
  functions/
    _shared/                    # cors, client, embed (gte-small), anthropic (Claude)
    index-item/                 # calcule et stocke l'embedding d'un item
    search/                     # recherche sémantique
    recommend/                  # recommandations
    generate-path/              # parcours d'apprentissage
```

## Limites connues

- **Instagram** : pas d'oEmbed public → titre à saisir manuellement ; certains posts
  bloquent l'embed (« Ouvrir l'original » en repli).
- **TikTok** : liens courts (`vm.tiktok.com`) résolus via la redirection.
- **Transcription auto** : hors scope pour l'instant (colonne `transcript` prévue) —
  la recherche porte sur tes notes + métadonnées, pas encore sur l'audio des vidéos.
- **Partage natif** (Partager → Noteflix) : nécessite un build EAS dev (voir SETUP.md).
