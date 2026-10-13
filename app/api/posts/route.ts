import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createPost, listPosts } from "@/lib/store";
import type { PostInput, PostStatus } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as PostStatus | null;
  const q = searchParams.get("q") ?? undefined;
  const posts = await listPosts({ status: status ?? "all", q });
  return NextResponse.json({ ok: true, posts });
}

export async function POST(req: Request): Promise<NextResponse> {
  let body: PostInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof body.content !== "string") {
    return NextResponse.json(
      { ok: false, error: "Field \u201ccontent\u201d is required." },
      { status: 400 },
    );
  }

  const post = await createPost(body);
  revalidatePath("/");
  revalidatePath(`/posts/${post.slug}`);
  return NextResponse.json({ ok: true, post }, { status: 201 });
}