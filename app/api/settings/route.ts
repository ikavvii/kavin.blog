import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/store";
import type { Settings } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  const settings = await getSettings();
  return NextResponse.json({ ok: true, settings });
}

export async function PATCH(req: Request): Promise<NextResponse> {
  let body: Partial<Settings>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const settings = await updateSettings(body);
  return NextResponse.json({ ok: true, settings });
}