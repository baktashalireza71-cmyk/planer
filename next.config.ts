import type { NextConfig } from "next";

// ─────────────────────────────────────────────
//  حالت‌های بیلد:
//  • پیش‌فرض (standalone): نسخه سروردار — مثل قبل
//  • STATIC_EXPORT=1 (export): نسخه کاملاً استاتیک بدون سرور
//    خروجی: پوشه out/ — همان چیزی که APK و هاست‌های استاتیک رایگان استفاده می‌کنند
//    (distDir جداگانه تا بیلد استاتیک، دیتای dev سرور را خراب نکند)
// ─────────────────────────────────────────────
const isStaticExport = process.env.STATIC_EXPORT === "1";

// ─────────────────────────────────────────────
//  هدرهای امنیتی برای همه مسیرها
//  (توجه: CSP عمداً تنظیم نشده چون حالت dev را می‌شکند)
// ─────────────────────────────────────────────
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  ...(isStaticExport
    ? {
        output: "export" as const,
        distDir: ".next-static",
        images: { unoptimized: true },
      }
    : {
        output: "standalone" as const,
      }),
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  ...(isStaticExport
    ? {}
    : {
        async headers() {
          return [
            {
              // اعمال هدرهای امنیتی روی تمام مسیرها
              source: "/:path*",
              headers: securityHeaders,
            },
          ];
        },
      }),
};

export default nextConfig;
