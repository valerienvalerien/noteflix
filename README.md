# Noteflix 🎬 (mobile)

Ta mémoire vidéo personnelle, façon Netflix — **app mobile iOS & Android** (Expo / React Native). Sauvegarde des vidéos (YouTube/Shorts, TikTok, Instagram) et des idées, puis **retrouve-les des mois plus tard à partir d'une simple description en langage naturel** — là où les favoris YouTube/TikTok/Instagram échouent.

Tout vit **sur ton téléphone** : base de données locale (SQLite), aucune donnée envoyée ailleurs qu'à l'API Claude pour les fonctions IA. Pas de serveur à héberger.

## Démarrage

```bash
npm install
npm start          # ouvre Expo ; scanne le QR code avec l'app Expo Go
```

- **Sur ton téléphone** : installe **Expo Go** (App Store / Play Store), puis scanne le QR code affiché par `npm start`.
- **Émulateur** : `npm run android` ou `npm run ios` (iOS nécessite un Mac).

Au premier lancement, ouvre **⚙ Réglages** et colle ta **clé API Anthropic** (`sk-ant-…`, depuis console.anthropic.com). Elle est stockée de façon **sécurisée sur l'appareil** (`expo-secure-store`). Sans clé, la bibliothèque et la recherche instantanée fonctionnent ; seules les fonctions IA sont désactivées.

## Fonctionnalités

- **Ajout en un collage** : colle une URL, le titre / l'auteur / la miniature sont récupérés automatiquement (oEmbed YouTube & TikTok). Mode « Idée » pour les notes en texte libre.
- **Description personnelle** : à chaque ajout, tu notes *pourquoi tu gardes* l'item — c'est le carburant de la recherche.
- **UI façon Netflix** : thème sombre, rangées horizontales par catégorie, rangée « Ajouts récents ».
- **Lecture intégrée** : embed dans une `WebView` (YouTube nocookie, TikTok v2, Instagram), avec « Ouvrir l'original » en repli.
- **Recherche double** :
  - ⚡ **Instantanée** (locale, insensible aux accents) pendant la frappe.
  - ✨ **IA** : décris vaguement ce que tu cherches (« le gars qui apprend le mandarin avec des post-its ») — Claude analyse ta bibliothèque et retourne les items pertinents avec la raison du match.
- **Recommandations à la demande** : « Suggère-moi » → Claude propose quoi *revoir* dans ta bibliothèque et quoi *explorer* (avec liens de recherche YouTube), optionnellement sur un thème.

## Stack

- **Expo (SDK 56)** + React Native 0.85 + React 19 + TypeScript
- **expo-sqlite** : base locale `noteflix.db` sur l'appareil
- **expo-secure-store** : stockage chiffré de la clé API
- **react-native-webview** : lecture des embeds vidéo
- **Claude API** (`claude-opus-4-8`) appelée directement depuis l'app, avec sorties structurées (tool use) pour la recherche sémantique et les recommandations

## Architecture

```
App.tsx                    # écran principal (header, recherche, rangées, modales)
index.ts                   # point d'entrée (polyfill URL + registerRootComponent)
src/
  types.ts                 # Item, Category, Platform
  theme.ts                 # palette sombre + badges
  db.ts                    # SQLite local (items, categories) — API async
  video.ts                 # parsing d'URL + construction des embeds
  search.ts                # scoring local insensible aux accents
  metadata.ts              # résolution oEmbed d'une URL collée
  ai.ts                    # appels Claude (Messages API + tool use)
  apiKey.ts                # clé API via expo-secure-store
  components/              # Card, Row, PlayerModal, AddModal, RecommendModal, SettingsModal
```

## Limites connues

- **Instagram** : pas d'oEmbed public → titre à saisir manuellement ; certains posts bloquent l'embed (l'app propose alors « Ouvrir l'original »).
- **TikTok** : les liens courts (`vm.tiktok.com`) sont résolus en suivant la redirection ; si ça échoue, l'item reste consultable via « Ouvrir l'original ».
- Mono-appareil (données locales, pas de synchro) — pensé comme un outil personnel.
- La clé API vit sur l'appareil : pratique pour un usage perso, à ne pas faire dans une app publique distribuée.
