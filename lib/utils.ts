export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function slugify(input: string): string {
  const base = (input || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return base || "post";
}

/** Deterministic UTC date string (safe for SSR + client hydration). */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const h = String(d.getUTCHours()).padStart(2, "0");
  const min = String(d.getUTCMinutes()).padStart(2, "0");
  return `${formatDate(iso)} ${h}:${min}`;
}

export function makeExcerpt(markdown: string, length = 180): string {
  const text = (markdown || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_~\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= length) return text;
  return text.slice(0, length).trimEnd() + "…";
}

export function readingTime(markdown: string): string {
  const words = (markdown || "").trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

export function parseTags(tags: string[] | string | undefined): string[] {
  if (!tags) return [];
  const list = Array.isArray(tags) ? tags : tags.split(",");
  const cleaned = list
    .map((t) => String(t).trim())
    .filter(Boolean)
    .map((t) => t.replace(/^#/, ""));
  return Array.from(new Set(cleaned)).slice(0, 12);
}

export function humanSize(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

const CODE_EXT = new Set([
  "js", "jsx", "ts", "tsx", "json", "css", "scss", "html", "xml", "svg",
  "py", "rb", "go", "rs", "java", "c", "h", "cpp", "cs", "php", "sh", "bash",
  "zsh", "ps1", "sql", "yml", "yaml", "toml", "md", "txt", "env", "ini",
]);

export function isCodeFile(name: string): boolean {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return CODE_EXT.has(ext);
}

export function looksLikeEmoji(value: string): boolean {
  if (!value) return false;
  if (/^(https?:)?\/\//.test(value) || value.startsWith("/") || value.includes(".")) {
    return false;
  }
  return value.length <= 8;
}
