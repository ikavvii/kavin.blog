import { NextResponse } from "next/server";
import {
  checkPassword,
  createSessionToken,
  isAuthEnabled,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<NextResponse> {
  if (!isAuthEnabled()) {
    return NextResponse.json({ ok: true, note: "authentication disabled" });
  }

  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  if (!checkPassword(body.password ?? "")) {
    return NextResponse.json({ ok: false, error: "Invalid password." }, { status: 401 });
  }

  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}

export async function DELETE(): Promise<NextResponse> {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}