import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPost } from "@/lib/store";
import Editor from "@/components/Editor";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);
  return { title: post ? `Edit: ${post.title}` : "Edit Post" };
}

export default async function EditPostPage({ params }: Props) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound();

  return (
    <>
      <h1 className="text-lg font-bold">
        <span className="prompt">~$</span> vim ./posts/{post.slug}.md
      </h1>
      <p className="mt-1 text-sm text-term-dim">
        Editing <span className="text-term-amber">/{post.slug}</span>. Save early, save often.
      </p>
      <div className="mt-6">
        <Editor initial={post} />
      </div>
    </>
  );
}