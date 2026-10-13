import type { Metadata } from "next";
import { getSettings } from "@/lib/store";
import LoginForm from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return { title: "Login", description: settings.description };
}

export default async function LoginPage() {
  const settings = await getSettings();

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-10">
      <div className="term-window">
        <div className="term-titlebar" aria-hidden>
          <span className="term-dot bg-term-red" />
          <span className="term-dot bg-term-amber" />
          <span className="term-dot" style={{ background: "var(--term-accent)" }} />
          <span className="ml-2 text-xs text-term-dim">~/auth.exe</span>
        </div>
        <LoginForm />
      </div>
      <p className="mt-4 text-center text-xs text-term-dim">
        restricted area — {settings.title}
      </p>
    </main>
  );
}