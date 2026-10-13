import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { UPLOADS_DIR } from "@/lib/store";
import { isCodeFile } from "@/lib/utils";

export const runtime = "nodejs";

const MAX_MB = Math.max(1, Number(process.env.MAX_UPLOAD_MB || 25));
const MAX_BYTES = MAX_MB * 1024 * 1024;

const IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
  "image/svg+xml",
]);

const DOC_MIME = new Set([
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/pdf",
  "application/json",
  "application/x-yaml",
  "application/zip",
  "application/gzip",
  "application/x-7z-compressed",
  "application/x-tar",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const BLOCKED_EXT = new Set([".html", ".htm", ".php", ".asp", ".aspx", ".jsp", ".exe", ".sh", ".cmd", ".bat", ".js"]);

function isAllowed(file: File): boolean {
  const name = file.name.toLowerCase();
  const ext = path.extname(name);
  const type = file.type || "";
  if (BLOCKED_EXT.has(ext)) return false;
  if (isCodeFile(file.name)) return true;
  if (IMAGE_MIME.has(type)) return true;
  if (DOC_MIME.has(type)) return true;
  if (type.startsWith("text/")) return true;
  return false;
}

export async function POST(req: Request): Promise<NextResponse> {
  if (req.headers.get("content-length")) {
    const len = Number(req.headers.get("content-length"));
    if (Number.isFinite(len) && len > MAX_BYTES) {
      return NextResponse.json(
        { ok: false, error: `File exceeds the ${MAX_MB}MB upload limit.` },
        { status: 413 },
      );
    }
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Expected multipart form data." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "No file provided." }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ ok: false, error: "The file is empty." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, error: `File exceeds the ${MAX_MB}MB upload limit.` },
      { status: 413 },
    );
  }
  if (!isAllowed(file)) {
    return NextResponse.json(
      { ok: false, error: "File type is not supported. Allowed: images, code, text, PDF, archives." },
      { status: 415 },
    );
  }

  const ext = path.extname(file.name).toLowerCase() || ".bin";
  const storedName = `${crypto.randomBytes(8).toString("hex")}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOADS_DIR, storedName), buffer);

  return NextResponse.json({
    ok: true,
    url: `/media/${storedName}`,
    name: file.name,
    size: file.size,
    type: file.type || "application/octet-stream",
  });
}