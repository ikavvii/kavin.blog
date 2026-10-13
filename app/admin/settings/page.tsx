import { getSettings } from "@/lib/store";
import SettingsForm from "@/components/SettingsForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const settings = await getSettings();

  return (
    <>
      <h1 className="text-lg font-bold">
        <span className="prompt">~$</span> nano ./config.json
      </h1>
      <p className="mt-1 text-sm text-term-dim">
        Basic site configuration — reflected across the whole site immediately.
      </p>
      <div className="mt-6">
        <SettingsForm initial={settings} />
      </div>
    </>
  );
}