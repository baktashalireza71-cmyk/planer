import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";

/**
 * فونت وزیرمتن به‌صورت لوکال (باندل‌شده) — نه از Google Fonts
 * مزیت: بیلد استاتیک بدون اینترنت کار می‌کند + اپ اندروید آفلاین فونت دارد
 * (منبع: پکیج vazirmatn — مجوز OFL)
 */
const vazir = localFont({
  variable: "--font-vazir",
  display: "swap",
  src: [
    { path: "./fonts/Vazirmatn-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Vazirmatn-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Vazirmatn-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "./fonts/Vazirmatn-Bold.woff2", weight: "700", style: "normal" },
    { path: "./fonts/Vazirmatn-ExtraBold.woff2", weight: "800", style: "normal" },
    { path: "./fonts/Vazirmatn-Black.woff2", weight: "900", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: "پلنر من | برنامه‌ریز حرفه‌ای زندگی",
  description:
    "پلنر حرفه‌ای فارسی با کارها، تقویم شمسی، عادت‌ها، اهداف، یادداشت‌ها و آمار پیشرفت",
  keywords: ["پلنر", "برنامه‌ریزی", "کارها", "عادت", "تقویم شمسی", "planner"],
  applicationName: "پلنر من",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "پلنر من",
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body
        className={`${vazir.variable} font-sans antialiased bg-background text-foreground min-h-screen`}
      >
        <Providers>{children}</Providers>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
