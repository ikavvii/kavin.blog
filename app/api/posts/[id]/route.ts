import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { deletePost, updatePost } from "@/lib/store";
import type { PostInput } from "@/lib/types";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx): Promise<NextResponse> {
  const { id } = await params;

  let body: PostInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const post = await updatePost(id, body);
  if (!post) {
    return NextResponse.json({ ok: false, error: "Post not found." }, { status: 404 });
  }

  revalidatePath("/");
  revalidatePath(`/posts/${post.slug}`);
  revalidatePath("/admin");
  return NextResponse.json({ ok: true, post });
}

export async function DELETE(_req: Request, { params }: Ctx): Promise<NextResponse> {
  const { id } = await params;
  const deleted = await deletePost(id);
  if (!deleted) {
    return NextResponse.json({ ok: false, error: "Post not found." }, { status: 404 });
  }

  revalidatePath("/");
  revalidatePath("/admin");
  return NextResponse.json({ ok: true });
}