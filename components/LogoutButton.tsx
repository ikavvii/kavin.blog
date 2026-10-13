"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={busy}
      className="term-link disabled:opacity-40"
      aria-label="Log out"
    >
      {busy ? "..." : "log out"}
    </button>
  );
}