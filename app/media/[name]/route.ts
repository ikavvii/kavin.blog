import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { UPLOADS_DIR } from "@/lib/store";

export const runtime = "nodejs";

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".csv": "text/csv",
  ".json": "application/json",
  ".yaml": "application/x-yaml",
  ".yml": "application/x-yaml",
  ".pdf": "application/pdf",
  ".zip": "application/zip",
  ".gz": "application/gzip",
  ".7z": "application/x-7z-compressed",
  ".tar": "application/x-tar",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

type Ctx = { params: Promise<{ name: string }> };

export async function GET(_req: Request, { params }: Ctx): Promise<NextResponse> {
  const { name } = await params;
  const safe = path.basename(name);
  if (safe !== name || safe.includes("..")) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }

  const filePath = path.join(UPLOADS_DIR, safe);
  let data: Buffer;
  try {
    data = await fs.readFile(filePath);
  } catch {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }

  const ext = path.extname(safe).toLowerCase();
  const mime = MIME[ext] ?? "application/octet-stream";
  const inline = mime.startsWith("image/") || mime.startsWith("text/") || mime === "application/pdf";

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": mime,
      "Content-Disposition": inline ? `inline; filename="${safe}"` : `attachment; filename="${safe}"`,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "sandbox",
      "Cross-Origin-Resource-Policy": "cross-origin",
    },
  });
}