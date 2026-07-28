import type { Metadata } from "next";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { AppFooter, type ChangelogEntry } from "@/components/AppFooter";
import changelog from "@/lib/changelog.json";
import packageJson from "@/package.json";
import "./globals.css";

config.autoAddCss = false;

export const metadata: Metadata = {
  title: "Fahrtenbuch",
  description: "Persönliches Fahrtenbuch für Dienstfahrten",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>
        <div className="flex min-h-screen flex-col">
          <div className="min-h-0 flex-1">{children}</div>
          <AppFooter version={packageJson.version} changelog={changelog as ChangelogEntry[]} />
        </div>
      </body>
    </html>
  );
}
