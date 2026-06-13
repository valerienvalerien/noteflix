import type { Platform } from "./types";

export interface ParsedVideo {
  platform: Platform;
  videoId: string | null;
  canonicalUrl: string;
}

/** Detect the platform and extract the embeddable video id from a pasted URL. */
export function parseVideoUrl(rawUrl: string): ParsedVideo | null {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, "").toLowerCase();

  // --- YouTube (watch, shorts, youtu.be, embed) ---
  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return id ? { platform: "youtube", videoId: id, canonicalUrl: rawUrl } : null;
  }
  if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
    const v = url.searchParams.get("v");
    if (v) return { platform: "youtube", videoId: v, canonicalUrl: rawUrl };
    const m = url.pathname.match(/^\/(shorts|embed|live)\/([\w-]+)/);
    if (m) return { platform: "youtube", videoId: m[2], canonicalUrl: rawUrl };
    return { platform: "youtube", videoId: null, canonicalUrl: rawUrl };
  }

  // --- TikTok (full links carry the numeric id; short links resolved separately) ---
  if (host.endsWith("tiktok.com")) {
    const m = url.pathname.match(/\/video\/(\d+)/) || url.pathname.match(/\/v\/(\d+)/);
    return { platform: "tiktok", videoId: m ? m[1] : null, canonicalUrl: rawUrl };
  }

  // --- Instagram (posts & reels) ---
  if (host.endsWith("instagram.com")) {
    const m = url.pathname.match(/\/(p|reel|reels|tv)\/([\w-]+)/);
    return { platform: "instagram", videoId: m ? m[2] : null, canonicalUrl: rawUrl };
  }

  return { platform: "other", videoId: null, canonicalUrl: rawUrl };
}

/** Build an embeddable iframe URL. `autoplay` starts a muted preview (browser policy). */
export function buildEmbedUrl(
  platform: Platform,
  videoId: string | null,
  autoplay = true
): string | null {
  switch (platform) {
    case "youtube":
      if (!videoId) return null;
      return `https://www.youtube-nocookie.com/embed/${videoId}?${
        autoplay ? "autoplay=1&mute=1&" : ""
      }playsinline=1&rel=0`;
    case "tiktok":
      if (!videoId) return null;
      return `https://www.tiktok.com/embed/v2/${videoId}`;
    case "instagram":
      if (!videoId) return null;
      return `https://www.instagram.com/p/${videoId}/embed/`;
    default:
      return null;
  }
}

export function youtubeThumbnail(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}
