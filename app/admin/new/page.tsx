import Editor from "@/components/Editor";

export const dynamic = "force-dynamic";
export const metadata = { title: "New Post" };

export default async function NewPostPage() {
  return (
    <>
      <h1 className="text-lg font-bold">
        <span className="prompt">~$</span> touch ./posts/new.md
      </h1>
      <p className="mt-1 text-sm text-term-dim">
        Write in Markdown. Autosave runs every few seconds for drafts.
      </p>
      <div className="mt-6">
        <Editor />
      </div>
    </>
  );
}