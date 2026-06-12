# Noteflix 🎬

Ta mémoire vidéo personnelle, façon Netflix. Sauvegarde des vidéos (YouTube/Shorts, TikTok, Instagram) et des idées, puis **retrouve-les des mois plus tard à partir d'une simple description en langage naturel** — là où les favoris YouTube/TikTok/Instagram échouent.

## Fonctionnalités

- **Ajout en un collage** : colle une URL, le titre / l'auteur / la miniature sont récupérés automatiquement (oEmbed YouTube & TikTok). Mode « Idée » pour les notes en texte libre.
- **Description personnelle** : à chaque ajout, tu notes *pourquoi tu gardes* l'item — c'est le carburant de la recherche.
- **UI façon Netflix** : thème sombre, rangées horizontales par catégorie, rangée « Ajouts récents ».
- **Lecture intégrée** : preview en autoplay (muet, politique navigateur) dans une modale, bouton plein écran. YouTube en embed natif, TikTok via embed v2, Instagram via embed post/reel.
- **Recherche double** :
  - ⚡ **Instantanée** (locale, insensible aux accents) pendant la frappe.
  - ✨ **IA** : décris vaguement ce que tu cherches (« le gars qui apprend le mandarin avec des post-its ») — Claude analyse ta bibliothèque et retourne les items pertinents avec la raison du match.
- **Recommandations à la demande** : « Suggère-moi » → Claude propose quoi *revoir* dans ta bibliothèque et quoi *explorer* (avec liens de recherche YouTube), optionnellement sur un thème.

## Démarrage

```bash
npm install
export ANTHROPIC_API_KEY=sk-ant-...   # requis pour la recherche IA et les recommandations
npm run dev
```

Ouvre http://localhost:3000. Sans clé API, tout fonctionne sauf les deux fonctions IA (un message clair s'affiche).

## Stack

- **Next.js 15** (App Router) + React 19 + TypeScript
- **Tailwind CSS 4**
- **SQLite** via better-sqlite3 (fichier `data/noteflix.db`, créé automatiquement, gitignoré)
- **Claude API** (`claude-opus-4-8`) avec sorties structurées (Zod) pour la recherche sémantique et les recommandations

## Architecture

```
app/
  page.tsx                 # UI principale (header, recherche, rangées, modales)
  api/items/               # CRUD bibliothèque
  api/metadata/            # résolution oEmbed d'une URL collée
  api/search/              # recherche locale + sémantique (Claude)
  api/recommend/           # recommandations (Claude)
components/                # Card, Row, PlayerModal, AddModal, RecommendModal
lib/
  db.ts                    # SQLite (items, categories)
  video.ts                 # parsing d'URL + construction des embeds
  search.ts                # scoring local insensible aux accents
  ai.ts                    # appels Claude (sorties structurées Zod)
```

## Limites connues

- **Instagram** : pas d'oEmbed public → titre à saisir manuellement ; certains posts bloquent l'embed (l'app propose alors « Ouvrir l'original »).
- **TikTok** : les liens courts (`vm.tiktok.com`) sont résolus côté serveur ; si la résolution échoue, l'item reste consultable via « Ouvrir l'original ».
- Mono-utilisateur (pas d'auth) — pensé comme un outil personnel auto-hébergé.
