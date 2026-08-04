import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "LinkApply — personal auto-apply",
  description:
    "Drop a job link. LinkApply scrapes the role, tailors your materials, and applies on supported ATS boards.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full`}>
      <body className="min-h-full antialiased">
        <header className="shell pt-6 pb-2">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="display text-3xl md:text-4xl tracking-tight">
              LinkApply
            </Link>
            <nav className="flex items-center gap-2 text-sm font-semibold">
              <Link className="btn btn-secondary" href="/">
                Queue
              </Link>
              <Link className="btn btn-secondary" href="/profile">
                Profile
              </Link>
            </nav>
          </div>
        </header>
        <main className="shell flex-1 pb-16 pt-6">{children}</main>
      </body>
    </html>
  );
}
