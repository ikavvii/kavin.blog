"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function SearchBox() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = value.trim();
    const params = new URLSearchParams(searchParams.toString());
    if (trimmed) {
      params.set("q", trimmed);
    } else {
      params.delete("q");
    }
    const next = params.toString();
    router.push(next ? `${pathname}?${next}` : pathname);
  }

  return (
    <form
      onSubmit={submit}
      role="search"
      aria-label="Search posts"
      className="flex items-center gap-2"
    >
      <span className="prompt select-none" aria-hidden>
        grep
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="search posts..."
        aria-label="Search query"
        className="term-input flex-1"
      />
      <button type="submit" className="term-btn term-btn-primary">
        [run]
      </button>
    </form>
  );
}