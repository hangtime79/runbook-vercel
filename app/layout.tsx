import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { AskProvider } from "@/components/ask/AskProvider";
import { AppShell } from "@/components/shell/AppShell";
import "./globals.css";

export const metadata = { title: "Card Fraud Analysis", description: "Card-fraud analysis dashboard" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <AskProvider>
          <AppShell>{children}</AppShell>
        </AskProvider>
      </body>
    </html>
  );
}
