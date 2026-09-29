#!/usr/bin/env node
/**
 * تنظیم versionName / versionCode در android/app/build.gradle
 * ─────────────────────────────────────────
 *   node scripts/patch-version.js "1.0" 2
 *
 * اگر ورودی‌ها داده نشوند، هیچ کاری نمی‌کند.
 */
const fs = require("fs");
const path = require("path");

const versionName = (process.argv[2] || "").trim();
const versionCode = (process.argv[3] || "").trim();

if (!versionName && !versionCode) {
  console.log("ℹ️  no version inputs — keeping build.gradle as-is");
  process.exit(0);
}

const gradlePath = path.join(__dirname, "..", "android", "app", "build.gradle");
let content = fs.readFileSync(gradlePath, "utf8");

if (versionName) {
  if (!/^\d+(\.\d+)*$/.test(versionName)) {
    console.error(`✗ invalid versionName: "${versionName}" (example: 1.0)`);
    process.exit(1);
  }
  content = content.replace(/versionName\s+"[^"]*"/, `versionName "${versionName}"`);
  console.log(`✓ versionName → ${versionName}`);
}

if (versionCode) {
  const code = Number(versionCode);
  if (!Number.isInteger(code) || code < 1) {
    console.error(`✗ invalid versionCode: "${versionCode}" (must be positive integer)`);
    process.exit(1);
  }
  content = content.replace(/versionCode\s+\d+/, `versionCode ${code}`);
  console.log(`✓ versionCode → ${code}`);
}

fs.writeFileSync(gradlePath, content, "utf8");
