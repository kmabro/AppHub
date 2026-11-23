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
  created_at: string;
  updated_at: string;
  owner_name?: string;
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
