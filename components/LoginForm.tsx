"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Authentication failed.");
        return;
      }
      const from = searchParams.get("from") ?? "/admin";
      router.push(from);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="px-4 py-10 sm:px-8">
      <p className="prompt">~$ ./authenticate</p>
      <p className="mt-4 flex items-center gap-2">
        <label htmlFor="password" className="shrink-0 text-term-dim">
          password&nbsp;:
        </label>
        <input
          ref={inputRef}
          id="password"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
          autoComplete="current-password"
          className="term-input"
          placeholder="••••••••"
          aria-label="Password"
        />
      </p>
      {error && (
        <p className="mt-3 text-sm text-term-red" role="alert">
          ✗ {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy || !password}
        className="term-btn term-btn-primary mt-6"
      >
        {busy ? "checking..." : "[ connect ]"}
      </button>
    </form>
  );
}