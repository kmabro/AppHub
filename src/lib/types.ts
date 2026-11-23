export type Platform = "android" | "ios";
export type InstallMethod = "file" | "link";

export type AppRecord = {
  id: string;
  owner_id: string;
  name: string;
  package_name: string;
  description: string;
  category: string;
  platform: Platform;
  version: string;
  install_method: InstallMethod;
  file_url: string | null;
  external_url: string | null;
  file_size: string | number;
  icon_url: string | null;
  screenshots: string[] | null;
  downloads: number;
  status?: "published" | "suspended" | "pending";
  featured?: boolean;
  created_at: string;
  updated_at: string;
  owner_name?: string;
  owner_username?: string;
  avg_rating?: string | number | null;
  review_count?: string | number | null;
  pending_count?: string | number | null;
};

export type AppVersion = {
  id: string;
  app_id: string;
  version: string;
  release_notes: string;
  install_method: InstallMethod;
  platform: Platform;
  file_url: string | null;
  external_url: string | null;
  file_size: string | number;
  status: "published" | "pending" | "rejected";
  is_current: boolean;
  created_at: string;
};

export type Review = {
  id: string;
  app_id: string;
  user_id: string;
  rating: number;
  body: string;
  created_at: string;
  updated_at: string;
  author_name?: string;
  author_username?: string;
  author_avatar?: string | null;
};

export type Report = {
  id: string;
  reporter_id: string;
  app_id: string | null;
  review_id: string | null;
  reason: string;
  status: "open" | "resolved" | "dismissed";
  created_at: string;
  app_name?: string;
  review_body?: string;
};

export const CATEGORIES = [
  "Education",
  "Productivity",
  "Games",
  "Health & Fitness",
  "Social",
  "Utilities",
  "Business",
  "Entertainment",
  "Other",
] as const;

export const PLATFORM_LABEL: Record<Platform, string> = {
  android: "Android",
  ios: "iOS",
};
