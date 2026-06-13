export type Platform = "youtube" | "tiktok" | "instagram" | "other";

export interface Item {
  id: number;
  type: "video" | "idea";
  url: string | null;
  platform: Platform | null;
  video_id: string | null;
  title: string;
  description: string;
  author: string | null;
  thumbnail: string | null;
  category_id: number | null;
  category?: string | null;
  tags: string[];
  created_at: string;
  view_count: number;
}

export interface Category {
  id: number;
  name: string;
  position: number;
}

export interface NewItem {
  type: "video" | "idea";
  url?: string | null;
  platform?: Platform | null;
  video_id?: string | null;
  title: string;
  description?: string;
  author?: string | null;
  thumbnail?: string | null;
  category?: string | null;
  tags?: string[];
}
