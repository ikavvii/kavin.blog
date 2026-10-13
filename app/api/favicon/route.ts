import { NextResponse } from "next/server";
import { getSettings } from "@/lib/store";
import { looksLikeEmoji } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse | Response> {
  const settings = await getSettings();
  const favicon = settings.favicon || ">_";

  if (!looksLikeEmoji(favicon)) {
    return NextResponse.redirect(favicon.startsWith("/") ? favicon : favicon, 302);
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="8" fill="#070a08"/>
  <rect width="64" height="64" rx="8" fill="none" stroke="${escapeXml(settings.accent)}" stroke-width="3"/>
  <text x="32" y="44" font-family="Menlo,Consolas,monospace" font-size="30" text-anchor="middle" fill="${escapeXml(settings.accent)}">${escapeXml(favicon)}</text>
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}