import type { Metadata } from "next";
import { getSettings, listPosts } from "@/lib/store";
import SiteHeader from "@/components/SiteHeader";
import PostCard from "@/components/PostCard";
import SearchBox from "@/components/SearchBox";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return { title: settings.title, description: settings.description };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const settings = await getSettings();
  const posts = await listPosts({ status: "published", q });
  const author = settings.author || settings.title;

  return (
    <div className="min-h-screen">
      <SiteHeader settings={settings} />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <section className="term-window">
          <div className="term-titlebar" aria-hidden>
            <span className="term-dot bg-term-red" />
            <span className="term-dot bg-term-amber" />
            <span className="term-dot" style={{ background: "var(--term-accent)" }} />
            <span className="ml-2 text-xs text-term-dim">~/serve --port 8080</span>
          </div>
          <div className="px-4 py-6 sm:px-6">
            <div className="space-y-1.5 text-sm sm:text-base">
              <p className="terminal-line">
                <span className="prompt">~$</span> <span className="text-term-dim">whoami</span>
                <span className="ml-3 text-term-amber">{author}</span>
              </p>
              <p className="terminal-line">
                <span className="prompt">~$</span>{" "}
                <span className="text-term-dim">cat ./about.txt</span>
              </p>
              <p className="terminal-line text-term-dim">{settings.description}</p>
              <p className="terminal-line">
                <span className="prompt">~$</span>{" "}
                <span className="text-term-dim">ls ./posts --published</span>
                <span className="ml-3 text-term-cyan">{posts.length} entry(ies)</span>
              </p>
            </div>
          </div>
        </section>

        <div className="mt-8">
          <SearchBox />
        </div>

        <section className="mt-6 space-y-3">
          <h1 className="text-xs uppercase tracking-widest text-term-dim">
            {q ? `grep "${q}"` : "feed"}
          </h1>
          {posts.length === 0 ? (
            <div className="term-window px-4 py-8 text-center">
              <p className="prompt">~$ ./no-posts-found</p>
              <p className="mt-2 text-term-dim">
                {q
                  ? "No published posts match your search. Try another query."
                  : "No published posts yet. Check back soon."}
              </p>
            </div>
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </section>

        <footer className="mt-10 flex items-center gap-2 text-xs text-term-dim">
          <span className="prompt">~$</span>
          <span>exit</span>
          <span className="cursor" aria-hidden />
        </footer>
      </main>
    </div>
  );
}