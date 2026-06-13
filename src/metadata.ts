import { parseVideoUrl, youtubeThumbnail } from "./video";
import type { Platform } from "./types";

export interface ResolvedMeta {
  platform: Platform;
  video_id: string | null;
  url: string;
  title: string | null;
  author: string | null;
  thumbnail: string | null;
}

/**
 * Resolves a pasted URL into platform + video id + title/author/thumbnail
 * via the public oEmbed endpoints (YouTube, TikTok). Instagram has no public
 * oEmbed — the user fills the title manually. Best-effort: never throws.
 */
export async function resolveMetadata(rawUrl: string): Promise<ResolvedMeta | null> {
  let parsed = parseVideoUrl(rawUrl);
  if (!parsed) return null;

  // Short TikTok links (vm.tiktok.com / tiktok.com/t/...) need a redirect resolve.
  if (parsed.platform === "tiktok" && !parsed.videoId) {
    try {
      const res = await fetch(rawUrl, { method: "GET", redirect: "follow" });
      const resolved = parseVideoUrl(res.url);
      if (resolved?.videoId) parsed = resolved;
    } catch {
      // keep the unresolved link; embed will fall back to "open original"
    }
  }

  let title: string | null = null;
  let author: string | null = null;
  let thumbnail: string | null = null;

  try {
    if (parsed.platform === "youtube") {
      const res = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(parsed.canonicalUrl)}&format=json`
      );
      if (res.ok) {
        const data = await res.json();
        title = data.title ?? null;
        author = data.author_name ?? null;
        thumbnail = data.thumbnail_url ?? null;
      }
      if (!thumbnail && parsed.videoId) thumbnail = youtubeThumbnail(parsed.videoId);
    } else if (parsed.platform === "tiktok") {
      const res = await fetch(
        `https://www.tiktok.com/oembed?url=${encodeURIComponent(parsed.canonicalUrl)}`
      );
      if (res.ok) {
        const data = await res.json();
        title = data.title ?? null;
        author = data.author_name ?? null;
        thumbnail = data.thumbnail_url ?? null;
        if (!parsed.videoId && data.embed_product_id) {
          parsed = { ...parsed, videoId: String(data.embed_product_id) };
        }
      }
    }
  } catch {
    // metadata is best-effort; the form stays editable
  }

  return {
    platform: parsed.platform,
    video_id: parsed.videoId,
    url: parsed.canonicalUrl,
    title,
    author,
    thumbnail,
  };
}
