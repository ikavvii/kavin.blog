import type { Metadata } from "next";
import { getSettings } from "@/lib/store";
import { looksLikeEmoji } from "@/lib/utils";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: {
      default: settings.title,
      template: `%s // ${settings.title}`,
    },
    description: settings.description,
    icons: {
      icon: looksLikeEmoji(settings.favicon) ? "/api/favicon" : settings.favicon,
    },
    openGraph: {
      title: settings.title,
      description: settings.description,
      type: "website",
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();
  const accent = settings.accent || "#35d16c";

  return (
    <html lang="en">
      <body
        style={
          {
            "--term-accent": accent,
            "--term-green": accent,
          } as React.CSSProperties
        }
      >
        {children}
      </body>
    </html>
  );
}