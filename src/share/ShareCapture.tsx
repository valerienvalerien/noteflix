import { useEffect } from "react";
import Constants from "expo-constants";
import { useShareIntent } from "expo-share-intent";
import { useLibrary } from "../library/LibraryContext";

// Le partage natif (« Partager → Noteflix ») nécessite un build dev/EAS.
// Dans Expo Go il n'est pas disponible : on désactive le hook pour ne rien casser.
const isExpoGo = Constants.appOwnership === "expo";

/**
 * Écoute les intents de partage (TikTok / YouTube / Instagram → Noteflix) et
 * ouvre l'ajout pré-rempli avec l'URL partagée. Ne rend rien.
 */
export default function ShareCapture() {
  const { openAdd } = useLibrary();
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent({
    disabled: isExpoGo,
  });

  useEffect(() => {
    if (!hasShareIntent) return;
    const fromText =
      shareIntent.text && shareIntent.text.trim().startsWith("http")
        ? shareIntent.text.trim()
        : null;
    const url = shareIntent.webUrl ?? fromText;
    if (url) {
      openAdd(url);
      resetShareIntent();
    }
  }, [hasShareIntent, shareIntent, openAdd, resetShareIntent]);

  return null;
}
