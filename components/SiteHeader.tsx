import Link from "next/link";
import type { Settings } from "@/lib/types";
import { looksLikeEmoji } from "@/lib/utils";

export default function SiteHeader({ settings }: { settings: Settings }) {
  const favicon = settings.favicon || ">_";

  return (
    <header className="term-titlebar sticky top-0 z-40">
      <span className="term-dot bg-term-red" aria-hidden />
      <span className="term-dot bg-term-amber" aria-hidden />
      <span className="term-dot" style={{ background: "var(--term-accent)" }} aria-hidden />
      <Link href="/" className="ml-2 flex items-center gap-2 truncate font-bold">
        {looksLikeEmoji(favicon) ? (
          <span aria-hidden>{favicon}</span>
        ) : (
          <span className="text-sm text-term-green">$</span>
        )}
        <span className="text-term-fg">{settings.title}</span>
      </Link>
      <nav className="ml-auto flex items-center gap-4 text-sm" aria-label="Site">
        <Link href="/" className="term-link">
          feed
        </Link>
        <Link href="/admin" className="term-link">
          admin
        </Link>
      </nav>
    </header>
  );
}