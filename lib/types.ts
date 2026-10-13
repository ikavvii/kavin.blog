export type PostStatus = "draft" | "published";

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: PostStatus;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface Settings {
  title: string;
  description: string;
  author: string;
  footer: string;
  favicon: string;
  accent: string;
}

export interface UploadResult {
  url: string;
  name: string;
  size: number;
  type: string;
}

export type PostInput = {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  status?: PostStatus;
  tags?: string[] | string;
};
