import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { Post, PostInput, PostStatus, Settings } from "./types";
import { makeExcerpt, nowIso, parseTags, slugify } from "./utils";

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), "data");

const POSTS_FILE = path.join(DATA_DIR, "posts.json");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

export const DEFAULT_SETTINGS: Settings = {
  title: "terminal.blog",
  description: "Notes, articles and work updates from the command line.",
  author: "Kavin",
  footer: "// built with a terminal-style CMS",
  favicon: ">_",
  accent: "#33ff66",
};

export const DEFAULT_POST_CONTENT = `# New post

Write in **Markdown**. Drag and drop an image or file to embed it.

\`\`\`js
console.log("hello, world");
\`\`\`
`;

async function ensureDirs(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf8");
    if (!raw.trim()) return fallback;
    return JSON.parse(raw) as T;
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException)?.code === "ENOENT") return fallback;
    throw err;
  }
}

async function writeJson(file: string, value: unknown): Promise<void> {
  await ensureDirs();
  const tmp = `${file}.${randomUUID()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(value, null, 2), "utf8");
  await fs.rename(tmp, file);
}

let lock: Promise<unknown> = Promise.resolve();

/** Serialise mutations so concurrent requests never clobber the JSON store. */
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = lock.then(fn, fn);
  lock = run.catch(() => undefined);
  return run;
}

async function readPosts(): Promise<Post[]> {
  const posts = await readJson<Post[]>(POSTS_FILE, []);
  return Array.isArray(posts) ? posts : [];
}

export interface ListOptions {
  status?: PostStatus | "all";
  q?: string;
  tag?: string;
  sort?: "newest" | "oldest" | "title";
}

export async function listPosts(options: ListOptions = {}): Promise<Post[]> {
  const { status = "all", q, tag, sort = "newest" } = options;
  let posts = await readPosts();

  if (status !== "all") {
    posts = posts.filter((p) => p.status === status);
  }

  if (q) {
    const needle = q.toLowerCase();
    posts = posts.filter(
      (p) =>
        p.title.toLowerCase().includes(needle) ||
        p.content.toLowerCase().includes(needle) ||
        p.excerpt.toLowerCase().includes(needle) ||
        p.tags.some((t) => t.toLowerCase().includes(needle)),
    );
  }

  if (tag) {
    const needle = tag.toLowerCase();
    posts = posts.filter((p) => p.tags.some((t) => t.toLowerCase() === needle));
  }

  posts.sort((a, b) => {
    if (sort === "title") return a.title.localeCompare(b.title);
    const aDate = a.publishedAt ?? a.createdAt;
    const bDate = b.publishedAt ?? b.createdAt;
    const diff = new Date(bDate).getTime() - new Date(aDate).getTime();
    return sort === "oldest" ? -diff : diff;
  });

  return posts;
}

export async function getPost(id: string): Promise<Post | null> {
  const posts = await readPosts();
  return posts.find((p) => p.id === id) ?? null;
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const posts = await readPosts();
  return posts.find((p) => p.slug === slug) ?? null;
}

export async function allTags(): Promise<string[]> {
  const posts = await readPosts();
  const set = new Set<string>();
  posts
    .filter((p) => p.status === "published")
    .forEach((p) => p.tags.forEach((t) => set.add(t)));
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

async function uniqueSlug(posts: Post[], desired: string, ignoreId?: string): Promise<string> {
  const base = slugify(desired);
  let candidate = base;
  let n = 2;
  const taken = new Set(
    posts.filter((p) => p.id !== ignoreId).map((p) => p.slug),
  );
  while (taken.has(candidate)) {
    candidate = `${base}-${n++}`;
  }
  return candidate;
}

export async function createPost(input: PostInput): Promise<Post> {
  return withLock(async () => {
    const posts = await readPosts();
    const now = nowIso();
    const status: PostStatus = input.status === "published" ? "published" : "draft";
    const content = input.content ?? "";
    const title = (input.title ?? "").trim() || "Untitled";

    const post: Post = {
      id: randomUUID(),
      title,
      slug: await uniqueSlug(posts, input.slug || title),
      excerpt: (input.excerpt ?? "").trim() || makeExcerpt(content),
      content,
      status,
      tags: parseTags(input.tags),
      createdAt: now,
      updatedAt: now,
      publishedAt: status === "published" ? now : null,
    };

    posts.unshift(post);
    await writeJson(POSTS_FILE, posts);
    return post;
  });
}

export async function updatePost(id: string, patch: PostInput): Promise<Post | null> {
  return withLock(async () => {
    const posts = await readPosts();
    const index = posts.findIndex((p) => p.id === id);
    if (index === -1) return null;

    const current = posts[index];
    const next: Post = { ...current };

    if (patch.title !== undefined) next.title = patch.title.trim() || "Untitled";
    if (patch.content !== undefined) next.content = patch.content;
    if (patch.excerpt !== undefined) {
      next.excerpt = patch.excerpt.trim() || makeExcerpt(next.content);
    } else if (patch.content !== undefined && !current.excerpt) {
      next.excerpt = makeExcerpt(next.content);
    }
    if (patch.tags !== undefined) next.tags = parseTags(patch.tags);
    if (patch.slug !== undefined && patch.slug.trim()) {
      next.slug = await uniqueSlug(posts, patch.slug, id);
    }
    if (patch.status !== undefined) {
      next.status = patch.status === "published" ? "published" : "draft";
      if (next.status === "published" && !current.publishedAt) {
        next.publishedAt = nowIso();
      }
      if (next.status === "draft") {
        // keep publishedAt for history but it is no longer visible publicly
      }
    }

    next.updatedAt = nowIso();
    posts[index] = next;
    await writeJson(POSTS_FILE, posts);
    return next;
  });
}

export async function deletePost(id: string): Promise<boolean> {
  return withLock(async () => {
    const posts = await readPosts();
    const next = posts.filter((p) => p.id !== id);
    if (next.length === posts.length) return false;
    await writeJson(POSTS_FILE, next);
    return true;
  });
}

export async function getSettings(): Promise<Settings> {
  const stored = await readJson<Partial<Settings>>(SETTINGS_FILE, {});
  return { ...DEFAULT_SETTINGS, ...stored };
}

export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  return withLock(async () => {
    const current = await getSettings();
    const next: Settings = {
      title: (patch.title ?? current.title).trim() || DEFAULT_SETTINGS.title,
      description: (patch.description ?? current.description).trim(),
      author: (patch.author ?? current.author).trim(),
      footer: (patch.footer ?? current.footer).trim(),
      favicon: (patch.favicon ?? current.favicon).trim(),
      accent: (patch.accent ?? current.accent).trim() || DEFAULT_SETTINGS.accent,
    };
    await writeJson(SETTINGS_FILE, next);
    return next;
  });
}
