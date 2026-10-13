import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug, getSettings } from "@/lib/store";
import SiteHeader from "@/components/SiteHeader";
import Markdown from "@/components/Markdown";
import { formatDate, formatDateTime, readingTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || post.status !== "published") {
    return { title: "Not found" };
  }
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt ?? undefined,
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const settings = await getSettings();
  const post = await getPostBySlug(slug);

  if (!post || post.status !== "published") {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <SiteHeader settings={settings} />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
        <Link
          href="/"
          className="text-xs text-term-dim transition-colors hover:text-term-amber"
        >
          ← back to feed
        </Link>

        <article className="term-window mt-4">
          <div className="px-4 py-6 sm:px-8 sm:py-8">
            <header>
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
              <h1 className="mt-3 text-2xl font-bold text-term-cyan sm:text-3xl">
                {post.title}
              </h1>
            </header>

            <div className="term-divider my-6" />

            <Markdown content={post.content} />
          </div>
          <footer className="border-t border-term-border px-4 py-3 text-xs text-term-dim sm:px-8">
            <p>
              <span className="prompt">~$</span> stat {post.slug} · updated{" "}
              {formatDateTime(post.updatedAt)} ·{" "}
              <Link href={`/admin/edit/${post.id}`} className="term-link">
                edit
              </Link>
            </p>
          </footer>
        </article>
      </main>
    </div>
  );
}