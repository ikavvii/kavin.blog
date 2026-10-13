import { listPosts } from "@/lib/store";
import AdminPosts from "@/components/AdminPosts";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard" };

export default async function AdminPage() {
  const posts = await listPosts({ status: "all" });

  return (
    <>
      <h1 className="text-lg font-bold">
        <span className="prompt">~$</span> ls ./posts --all
        <span className="text-term-dim"> ({posts.length})</span>
      </h1>
      <p className="mt-1 text-sm text-term-dim">
        Manage posts, drafts and publishing from here.
      </p>
      <div className="mt-6">
        <AdminPosts initialPosts={posts} />
      </div>
    </>
  );
}