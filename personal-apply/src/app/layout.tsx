import type { Metadata, Viewport } from "next";
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

const APP_NAME = "LinkApply";
const APP_DESCRIPTION =
  "Drop a job link. Tailor materials. Track applications from your phone.";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_NAME,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#1f6b4a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full`}>
      <body className="min-h-full antialiased pb-[env(safe-area-inset-bottom)]">
        <header className="shell pt-[max(1.25rem,env(safe-area-inset-top))] pb-2 sticky top-0 z-20 bg-[rgba(243,239,230,0.86)] backdrop-blur-md">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="display text-3xl md:text-4xl tracking-tight">
              LinkApply
            </Link>
            <nav className="flex items-center gap-2 text-sm font-semibold">
              <Link className="btn btn-secondary !px-3 !py-2" href="/">
                Queue
              </Link>
              <Link className="btn btn-secondary !px-3 !py-2" href="/profile">
                Profile
              </Link>
            </nav>
          </div>
        </header>
        <main className="shell flex-1 pb-20 pt-4">{children}</main>
      </body>
    </html>
  );
}
