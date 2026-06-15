/** Dark, Netflix-like palette mirrored from the original web app (zinc/red). */
export const colors = {
  bg: "#09090b", // zinc-950
  surface: "#18181b", // zinc-900
  surfaceAlt: "#27272a", // zinc-800
  border: "#27272a",
  borderInput: "#3f3f46", // zinc-700
  text: "#f4f4f5", // zinc-100
  textMuted: "#a1a1aa", // zinc-400
  textFaint: "#71717a", // zinc-500
  red: "#dc2626", // red-600
  redLight: "#ef4444", // red-500
  emerald: "#059669", // emerald-600
  emeraldText: "#34d399", // emerald-400
  sky: "#0c4a6e",
  skyText: "#7dd3fc",
  greenBadge: "#064e3b",
  greenBadgeText: "#6ee7b7",
};

export const PLATFORM_BADGE: Record<string, { label: string; bg: string; fg: string }> = {
  youtube: { label: "YouTube", bg: "#dc2626", fg: "#ffffff" },
  tiktok: { label: "TikTok", bg: "#f4f4f5", fg: "#18181b" },
  instagram: { label: "Instagram", bg: "#c026d3", fg: "#ffffff" },
  twitter: { label: "X", bg: "#0f1419", fg: "#ffffff" },
  linkedin: { label: "LinkedIn", bg: "#0a66c2", fg: "#ffffff" },
  other: { label: "Lien", bg: "#3f3f46", fg: "#ffffff" },
};

export const IDEA_GRADIENTS: [string, string][] = [
  ["#b45309", "#9f1239"],
  ["#075985", "#312e81"],
  ["#065f46", "#134e4a"],
  ["#86198f", "#581c87"],
];
