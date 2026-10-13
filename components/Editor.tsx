"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Post, PostStatus } from "@/lib/types";
import { humanSize, slugify } from "@/lib/utils";
import Markdown from "./Markdown";

const AUTOSAVE_MS = 4000;

interface DraftSnapshot {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  tags: string;
  status: PostStatus;
}

export default function Editor({ initial }: { initial?: Post }) {
  const router = useRouter();

  const [id, setId] = useState(initial?.id ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [tags, setTags] = useState((initial?.tags ?? []).join(", "));
  const [status, setStatus] = useState<PostStatus>(initial?.status ?? "draft");
  const [tab, setTab] = useState<"write" | "preview">("write");

  const [dirty, setDirty] = useState(false);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Latest snapshot for autosave / async callbacks (avoids stale closures).
  const snapshotRef = useRef<DraftSnapshot>({ id, title, slug, excerpt, content, tags, status });
  snapshotRef.current = { id, title, slug, excerpt, content, tags, status };

  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const savingRef = useRef(saving);
  savingRef.current = saving;

  useEffect(() => {
    setSlug((prev) => prev || slugify(title));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function markDirty() {
    setDirty(true);
  }

  const save = useCallback(
    async (nextStatus: PostStatus): Promise<boolean> => {
      const snap = snapshotRef.current;
      if (!snap.title.trim()) {
        setError("Title is required before saving.");
        return false;
      }
      setSaving(true);
      setError("");
      try {
        const body: Record<string, unknown> = {
          title: snap.title.trim(),
          excerpt: snap.excerpt,
          content: snap.content,
          tags: snap.tags,
          status: nextStatus,
        };
        if (snap.slug.trim()) body.slug = snap.slug;

        const url = snap.id ? `/api/posts/${snap.id}` : "/api/posts";
        const res = await fetch(url, {
          method: snap.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          setError(data?.error ?? "Failed to save post.");
          return false;
        }

        const data = await res.json();
        if (data.post) {
          setId(data.post.id);
          setStatus(data.post.status as PostStatus);
          snapshotRef.current.id = data.post.id;
          snapshotRef.current.status = data.post.status;
        }
        setDirty(false);
        setSavedAt(new Date().toTimeString().slice(0, 8));
        router.refresh();
        return true;
      } catch {
        setError("Network error while saving.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [router],
  );

  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (dirtyRef.current && !savingRef.current && snapshotRef.current.title.trim()) {
        void saveRef.current("draft");
      }
    }, AUTOSAVE_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && key === "s") {
        e.preventDefault();
        void saveRef.current("draft");
      } else if ((e.ctrlKey || e.metaKey) && key === "enter") {
        e.preventDefault();
        void saveRef.current("published");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function insertAtCursor(before: string, after = "", placeholder = "") {
    const ta = textareaRef.current;
    const current = snapshotRef.current.content;
    const start = ta ? ta.selectionStart : current.length;
    const end = ta ? ta.selectionEnd : current.length;
    const selected = current.slice(start, end) || placeholder;
    const next = current.slice(0, start) + before + selected + after + current.slice(end);
    setContent(next);
    snapshotRef.current.content = next;
    const caret = start + before.length + selected.length + after.length;
    requestAnimationFrame(() => {
      ta?.focus();
      if (ta) {
        ta.setSelectionRange(caret, caret);
      }
    });
  }

  async function uploadAndInsert(file: File, asImageOnly = false) {
    setUploading(true);
    setUploadError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setUploadError(data?.error ?? "Upload failed.");
        return;
      }
      const name = file.name.replace(/[[\]]/g, "-");
      const markdown =
        asImageOnly || file.type.startsWith("image/")
          ? `\n![${name}](${data.url})\n`
          : `\n[${name}](${data.url}) — ${humanSize(file.size)}\n`;
      insertAtCursor(markdown, "", "");
    } catch {
      setUploadError("Upload failed due to a network error.");
    } finally {
      setUploading(false);
    }
  }

  function onToolbarImage() {
    imageInputRef.current?.click();
  }

  function onToolbarFile() {
    fileInputRef.current?.click();
  }

  const wordCount = useMemo(() => content.trim().split(/\s+/).filter(Boolean).length, [content]);
  const charCount = content.length;

  async function remove() {
    if (!snapshotRef.current.id) return;
    if (!window.confirm("Delete this post permanently?")) return;
    const res = await fetch(`/api/posts/${snapshotRef.current.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      setError("Failed to delete post.");
    }
  }

  const toolbar: Array<{ label: string; title: string; run: () => void }> = [
    { label: "B", title: "Bold (Ctrl+B)", run: () => insertAtCursor("**", "**", "bold") },
    { label: "I", title: "Italic", run: () => insertAtCursor("_", "_", "italic") },
    { label: "H2", title: "Heading", run: () => insertAtCursor("## ", "", "") },
    { label: "☐", title: "Link", run: () => insertAtCursor("[", "](https://)", "link text") },
    { label: "`", title: "Inline code", run: () => insertAtCursor("`", "`", "code") },
    {
      label: "</>",
      title: "Code block",
      run: () => insertAtCursor("```\n", "\n```", ""),
    },
    { label: "❯", title: "Quote", run: () => insertAtCursor("> ", "", "") },
    { label: "•-", title: "Bullet list", run: () => insertAtCursor("- ", "", "") },
    { label: "1.", title: "Numbered list", run: () => insertAtCursor("1. ", "", "") },
    { label: "▣", title: "Insert image", run: onToolbarImage },
    { label: "⇪", title: "Insert file", run: onToolbarFile },
  ];

  return (
    <div className="space-y-4">
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        aria-hidden
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void uploadAndInsert(file, true);
          e.target.value = "";
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.md,.txt,.csv,.pdf,.json,.yaml,.yml,.zip,.gz,.7z,.doc,.docx,.xlsx,.js,.ts,.py,.go,.rs,.rb,.java,.c,.cpp,.css,.html,.sh,.sql,.toml"
        className="hidden"
        aria-hidden
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void uploadAndInsert(file, false);
          e.target.value = "";
        }}
      />

      <div
        className="term-window p-3"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file) void uploadAndInsert(file, false);
        }}
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <label className="pb-1 block text-xs text-term-dim" htmlFor="title">
              title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                markDirty();
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              placeholder="Post title"
              className="term-input text-base font-bold"
            />
          </div>
          <div className="flex-1">
            <div className="pb-1 flex items-baseline justify-between">
              <label className="text-xs text-term-dim" htmlFor="slug">
                slug
              </label>
              <button
                type="button"
                onClick={() => {
                  setSlugTouched(false);
                  setSlug(slugify(title));
                  markDirty();
                }}
                className="text-[11px] text-term-dim underline decoration-dotted hover:text-term-amber"
                title={`Auto slug: ${slugify(title)}`}
              >
                [auto]
              </button>
            </div>
            <input
              id="slug"
              type="text"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
                markDirty();
              }}
              placeholder="my-post-slug"
              className="term-input"
            />
          </div>
        </div>

        <div className="mt-3">
          <label className="pb-1 block text-xs text-term-dim" htmlFor="excerpt">
            excerpt <span className="text-term-border">(optional — auto-generated if empty)</span>
          </label>
          <input
            id="excerpt"
            type="text"
            value={excerpt}
            onChange={(e) => {
              setExcerpt(e.target.value);
              markDirty();
            }}
            placeholder="Short summary shown on the feed."
            className="term-input"
          />
        </div>

        <div className="mt-3">
          <label className="pb-1 block text-xs text-term-dim" htmlFor="tags">
            tags <span className="text-term-border">(comma separated)</span>
          </label>
          <input
            id="tags"
            type="text"
            value={tags}
            onChange={(e) => {
              setTags(e.target.value);
              markDirty();
            }}
            placeholder="dev, notes, update"
            className="term-input"
          />
        </div>

        <div className="mt-4 border border-term-border bg-term-bg">
          <div className="no-scrollbar flex flex-wrap items-center gap-1 overflow-x-auto border-b border-term-border bg-term-panel2 px-2 py-1.5">
            {toolbar.map((item) => (
              <button
                key={item.label}
                type="button"
                title={item.title}
                aria-label={item.title}
                onClick={item.run}
                className="border border-transparent px-2 py-1 text-sm text-term-dim transition-colors hover:border-term-border hover:text-term-green"
              >
                {item.label}
              </button>
            ))}
            <span className="ml-auto flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setTab("write")}
                className={`px-2 py-1 ${tab === "write" ? "text-term-green underline underline-offset-4" : "text-term-dim hover:text-term-fg"}`}
              >
                write
              </button>
              <span className="text-term-border">|</span>
              <button
                type="button"
                onClick={() => setTab("preview")}
                className={`px-2 py-1 ${tab === "preview" ? "text-term-green underline underline-offset-4" : "text-term-dim hover:text-term-fg"}`}
              >
                preview
              </button>
            </span>
          </div>

          {tab === "write" ? (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                snapshotRef.current.content = e.target.value;
                markDirty();
              }}
              onPaste={(e) => {
                const image = Array.from(e.clipboardData.items)
                  .map((item) => item.getAsFile())
                  .find((f): f is File | null => Boolean(f?.type.startsWith("image/")));
                if (image) {
                  e.preventDefault();
                  void uploadAndInsert(image, true);
                }
              }}
              placeholder="# Start writing in Markdown..."
              aria-label="Post content (Markdown)"
              rows={18}
              className="block w-full resize-y bg-transparent px-3 py-2 leading-relaxed text-term-fg placeholder:text-term-dim focus:outline-none"
              spellCheck
            />
          ) : (
            <div className="max-h-[30rem] overflow-y-auto px-3 py-2">
              {content.trim() ? (
                <Markdown content={content} />
              ) : (
                <p className="py-8 text-center text-term-dim">Nothing to preview yet.</p>
              )}
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-term-dim">
          <span className="prompt text-sm">$</span>
          <span className="term-badge term-badge-green">● {status === "published" ? "published" : "draft"}</span>
          <span>{wordCount} words</span>
          <span>{charCount} chars</span>
          {dirty && <span className="text-term-amber">unsaved changes</span>}
          {saving && <span>saving…</span>}
          {savedAt && <span>saved {savedAt}</span>}
          {uploading && <span className="text-term-cyan">uploading…</span>}
          <span className="ml-auto hidden sm:inline">
            <kbd className="border border-term-border px-1">Ctrl</kbd>+<kbd className="border border-term-border px-1">S</kbd> save ·{" "}
            <kbd className="border border-term-border px-1">Ctrl</kbd>+<kbd className="border border-term-border px-1">Enter</kbd> publish
          </span>
        </div>

        {error && (
          <p className="mt-3 border border-term-red bg-term-bg px-3 py-2 text-sm text-term-red">
            ✗ {error}
          </p>
        )}
        {uploadError && (
          <p className="mt-3 border border-term-amber bg-term-bg px-3 py-2 text-sm text-term-amber">
            ✗ {uploadError}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void save("draft")}
            disabled={saving}
            className="term-btn"
          >
            [save draft]
          </button>
          {status === "published" ? (
            <button
              type="button"
              onClick={() => void save("draft")}
              disabled={saving}
              className="term-btn"
            >
              [unpublish]
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void save("published")}
              disabled={saving}
              className="term-btn term-btn-primary"
            >
              [publish]
            </button>
          )}
          {id && (
            <button
              type="button"
              onClick={remove}
              disabled={saving}
              className="term-btn term-btn-danger ml-auto"
            >
              [delete]
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-term-dim">
        Drag &amp; drop images/files anywhere in the editor, or paste an image to embed it
        automatically.
      </p>
    </div>
  );
}