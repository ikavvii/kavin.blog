"use client";

import { useState } from "react";
import type { Settings } from "@/lib/types";

const ACCENT_PRESETS = ["#35d16c", "#ffb15c", "#5fd4ff", "#ff6262", "#c792ea", "#e5e7eb"];

export default function SettingsForm({ initial }: { initial: Settings }) {
  const [form, setForm] = useState<Settings>(initial);
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState("");

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSavedAt(null);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Failed to save settings.");
        return;
      }
      const data = await res.json();
      setForm(data.settings as Settings);
      setSavedAt(new Date().toTimeString().slice(0, 8));
    } catch {
      setError("Network error while saving settings.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="term-window px-4 py-6 sm:px-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="sit_title" className="pb-1 block text-xs text-term-dim">
            site title
          </label>
          <input
            id="sit_title"
            type="text"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            className="term-input"
          />
        </div>

        <div>
          <label htmlFor="sit_author" className="pb-1 block text-xs text-term-dim">
            author <span className="text-term-border">(shown by whoami)</span>
          </label>
          <input
            id="sit_author"
            type="text"
            value={form.author}
            onChange={(e) => set("author", e.target.value)}
            className="term-input"
          />
        </div>

        <div>
          <label htmlFor="sit_desc" className="pb-1 block text-xs text-term-dim">
            description
          </label>
          <textarea
            id="sit_desc"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={3}
            className="term-input resize-y"
          />
        </div>

        <div>
          <label htmlFor="sit_favicon" className="pb-1 block text-xs text-term-dim">
            favicon <span className="text-term-border">{"(e.g. \">_\", an emoji, or a URL)"}</span>
          </label>
          <input
            id="sit_favicon"
            type="text"
            value={form.favicon}
            onChange={(e) => set("favicon", e.target.value)}
            className="term-input"
          />
        </div>

        <div>
          <span className="pb-1 block text-xs text-term-dim">accent color</span>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="color"
              value={form.accent}
              onChange={(e) => set("accent", e.target.value)}
              className="h-9 w-14 cursor-pointer border border-term-border bg-term-bg p-1"
              aria-label="Accent color picker"
            />
            <input
              type="text"
              value={form.accent}
              onChange={(e) => set("accent", e.target.value)}
              className="term-input w-28 font-mono text-sm"
              aria-label="Accent color hex"
            />
            <div className="flex items-center gap-1.5">
              {ACCENT_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  title={color}
                  aria-label={`Set accent to ${color}`}
                  onClick={() => set("accent", color)}
                  className={`h-6 w-6 border transition-transform hover:scale-110 ${
                    form.accent.toLowerCase() === color.toLowerCase()
                      ? "border-term-fg"
                      : "border-term-border"
                  }`}
                  style={{ background: color }}
                />
              ))}
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="sit_footer" className="pb-1 block text-xs text-term-dim">
            footer
          </label>
          <input
            id="sit_footer"
            type="text"
            value={form.footer}
            onChange={(e) => set("footer", e.target.value)}
            className="term-input"
          />
        </div>
      </div>

      <div className="mt-6 flex items-center gap-4 border-t border-term-border pt-4">
        <button
          type="submit"
          disabled={busy}
          className="term-btn term-btn-primary"
        >
          {busy ? "[ saving… ]" : "[ save ]"}
        </button>
        {savedAt && <span className="text-xs text-term-dim">saved {savedAt}</span>}
        {error && <span className="text-xs text-term-red">✗ {error}</span>}
      </div>
    </form>
  );
}