import Link from "next/link";
import type { Post } from "@/lib/types";
import { formatDate, readingTime } from "@/lib/utils";

export default function PostCard({ post }: { post: Post }) {
  return (
    <Link href={`/posts/${post.slug}`} className="term-card animate-fadeUp">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-term-dim">
        <span>&gt; {formatDate(post.publishedAt ?? post.createdAt)}</span>
        <span aria-hidden>·</span>
        <span>{readingTime(post.content)}</span>
        {post.tags.length > 0 && (
          <>
            <span aria-hidden>·</span>
            <span>
              {post.tags.map((t) => (
                <span key={t} className="mr-1 text-term-amber">
                  #{t}
                </span>
              ))}
            </span>
          </>
        )}
      </div>
      <h2 className="mt-2 text-base font-bold text-term-cyan">{post.title}</h2>
      {post.excerpt && (
        <p className="mt-1 line-clamp-2 text-sm text-term-dim">{post.excerpt}</p>
      )}
    </Link>
  );
}