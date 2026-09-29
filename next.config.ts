import type { NextConfig } from "next";

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
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  async headers() {
    return [
      {
        // اعمال هدرهای امنیتی روی تمام مسیرها
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
