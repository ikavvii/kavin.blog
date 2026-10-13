import Link from "next/link";
import { getSettings } from "@/lib/store";
import LogoutButton from "@/components/LogoutButton";

export const metadata = { title: "Admin" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();

  return (
    <div className="min-h-screen">
      <header className="term-titlebar sticky top-0 z-40">
        <span className="term-dot bg-term-red" aria-hidden />
        <span className="term-dot bg-term-amber" aria-hidden />
        <span className="term-dot" style={{ background: "var(--term-accent)" }} aria-hidden />
        <span className="ml-2 font-bold text-term-green">~/cms</span>
        <nav
          className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-sm"
          aria-label="CMS"
        >
          <Link href="/admin" className="term-link">
            dashboard
          </Link>
          <Link href="/admin/new" className="term-link">
            new post
          </Link>
          <Link href="/admin/settings" className="term-link">
            settings
          </Link>
          <Link href="/" className="term-link">
            view site
          </Link>
          <LogoutButton />
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      <footer className="mx-auto max-w-5xl px-4 pb-8 text-xs text-term-dim">
        {settings.footer}
      </footer>
    </div>
  );
}