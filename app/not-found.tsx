import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4">
      <div className="term-window">
        <div className="term-titlebar" aria-hidden>
          <span className="term-dot bg-term-red" />
          <span className="term-dot bg-term-amber" />
          <span className="term-dot bg-term-red" />
          <span className="ml-2 text-xs text-term-dim">~/error — 404</span>
        </div>
        <div className="px-4 py-10 text-center sm:px-8">
          <p className="text-5xl font-bold text-term-amber">404</p>
          <p className="prompt mt-5 text-sm">~$ cat /dev/null</p>
          <p className="mt-1 text-term-dim">No such file or directory.</p>
          <Link href="/" className="term-btn term-btn-primary mt-8">
            ← back to feed
          </Link>
        </div>
      </div>
    </main>
  );
}