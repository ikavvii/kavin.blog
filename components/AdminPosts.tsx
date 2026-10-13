"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Post, PostStatus } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

export default function AdminPosts({ initialPosts }: { initialPosts: Post[] }) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | PostStatus>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return posts
      .filter((p) => status === "all" || p.status === status)
      .filter(
        (p) =>
          !needle ||
          p.title.toLowerCase().includes(needle) ||
          p.slug.toLowerCase().includes(needle) ||
          p.excerpt.toLowerCase().includes(needle) ||
          p.tags.some((t) => t.toLowerCase().includes(needle)),
      );
  }, [posts, q, status]);

  async function changeStatus(post: Post, nextStatus: PostStatus) {
    setBusyId(post.id);
    setError("");
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        setError("Failed to update post status.");
        return;
      }
      const data = await res.json();
      setPosts((prev) => prev.map((p) => (p.id === post.id ? data.post : p)));
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function remove(post: Post) {
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) {
      return;
    }
    setBusyId(post.id);
    setError("");
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      if (!res.ok) {
        setError("Failed to delete post.");
        return;
      }
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="prompt">$</span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="find posts..."
          aria-label="Find posts"
          className="term-input max-w-xs"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as "all" | PostStatus)}
          aria-label="Filter by status"
          className="term-select"
        >
          <option value="all">all</option>
          <option value="published">published</option>
          <option value="draft">drafts</option>
        </select>
        <span className="ml-auto text-xs text-term-dim">
          {filtered.length}/{posts.length} shown
        </span>
      </div>

      {error && <p className="mt-3 text-sm text-term-red">{error}</p>}

      <div className="mt-6 space-y-2">
        {filtered.length === 0 ? (
          <div className="term-window px-4 py-8 text-center">
            <p className="text-term-dim">No posts match those filters.</p>
            <p className="mt-2">
              <Link href="/admin/new" className="term-link">
                [ create first post ]
              </Link>
            </p>
          </div>
        ) : (
          filtered.map((post) => (
            <article key={post.id} className="term-window px-4 py-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span
                  className={`term-badge ${
                    post.status === "published" ? "term-badge-green" : "term-badge-amber"
                  }`}
                >
                  {post.status === "published" ? "● published" : "○ draft"}
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/posts/${post.slug}`}
                    className="block truncate font-bold text-term-cyan hover:text-term-amber"
                  >
                    {post.title}
                  </Link>
                  <p className="truncate text-xs text-term-dim">
                    /{post.slug} · updated {formatDateTime(post.updatedAt)}
                    {post.publishedAt ? ` · published ${formatDateTime(post.publishedAt)}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  {post.status === "published" ? (
                    <button
                      type="button"
                      onClick={() => changeStatus(post, "draft")}
                      disabled={busyId === post.id}
                      className="term-btn"
                    >
                      [unpublish]
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => changeStatus(post, "published")}
                      disabled={busyId === post.id}
                      className="term-btn term-btn-primary"
                    >
                      [publish]
                    </button>
                  )}
                  <Link href={`/admin/edit/${post.id}`} className="term-btn">
                    [edit]
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(post)}
                    disabled={busyId === post.id}
                    className="term-btn term-btn-danger"
                    aria-label={`Delete ${post.title}`}
                  >
                    [rm]
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}