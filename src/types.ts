export type Platform =
  | "youtube"
  | "tiktok"
  | "instagram"
  | "twitter"
  | "linkedin"
  | "other";

export interface Item {
  id: string;
  type: "video" | "idea";
  url: string | null;
  platform: Platform | null;
  video_id: string | null;
  title: string;
  description: string;
  author: string | null;
  thumbnail: string | null;
  category_id: string | null;
  category?: string | null;
  tags: string[];
  is_favorite: boolean;
  summary: string | null;
  created_at: string;
  view_count: number;
}

export interface Category {
  id: string;
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

export interface PathStep {
  day: number;
  item_id: string;
  title: string;
  why: string;
  done?: boolean;
}

export interface LearningPath {
  id: string;
  goal: string;
  title: string;
  steps: PathStep[];
  created_at: string;
}
