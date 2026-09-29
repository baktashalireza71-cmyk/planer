#!/usr/bin/env node
/**
 * پچ کردن آدرس سرور داخل capacitor.config.ts
 * ─────────────────────────────────────────
 * در گیت‌هاب اکشنز (یا به‌صورت محلی) این‌طوری صدا زده می‌شود:
 *   node scripts/patch-server-url.js "https://planner.liara.run"
 *
 * اگر آدرس داده نشود، هیچ کاری نمی‌کند (همان مقدار فعلی فایل می‌ماند).
 */
const fs = require("fs");
const path = require("path");

const url = (process.argv[2] || "").trim();
if (!url) {
  console.log("ℹ️  server URL not provided — keeping capacitor.config.ts as-is");
  process.exit(0);
}

if (!/^https:\/\/.+/.test(url)) {
  console.error(`✗ INVALID URL: "${url}" — must start with https://`);
  process.exit(1);
}

const configPath = path.join(__dirname, "..", "capacitor.config.ts");
let content = fs.readFileSync(configPath, "utf8");

const re = /(const\s+SERVER_URL\s*=\s*")([^"]*)(")/;
if (!re.test(content)) {
  console.error("✗ SERVER_URL constant not found in capacitor.config.ts");
  process.exit(1);
}

content = content.replace(re, `$1${url}$3`);
fs.writeFileSync(configPath, content, "utf8");
console.log(`✓ SERVER_URL → ${url}`);
