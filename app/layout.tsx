import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { AskProvider } from "@/components/ask/AskProvider";
import { AppShell } from "@/components/shell/AppShell";
import { XrayProvider } from "@/components/xray/XrayProvider";
import { loadXrayStops } from "@/lib/content";
import "./globals.css";

export const metadata = { title: "Card Fraud Analysis", description: "Card-fraud analysis dashboard" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // The x-ray cards live in content/xray/*.md; the provider only draws them when the mode is on.
  const stops = loadXrayStops();
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <AskProvider>
          <XrayProvider stops={stops}>
            <AppShell>{children}</AppShell>
          </XrayProvider>
        </AskProvider>
      </body>
    </html>
  );
}
