import Link from "next/link";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata = { title: "Fraud Analysis", description: "Card-fraud analysis dashboard" };

const links = [
  ["/", "Narrative"],
  ["/findings", "Key Findings"],
  ["/patterns", "Fraud Patterns"],
  ["/model", "Detection Model"],
  ["/explorer", "Data Explorer"],
] as const;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <nav>
          <span className="brand">Fraud Analysis</span>
          {links.map(([href, label]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
