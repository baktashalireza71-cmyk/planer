#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# آماده‌سازی keystore برای امضای نسخهٔ release در CI
#
# اگر این ۴ مخفی (secret) در تنظیمات گیت‌هاب تعریف شده باشند:
#   KEYSTORE_BASE64     — محتوای base64 فایل keystore
#   KEYSTORE_PASSWORD   — رمز keystore
#   KEY_ALIAS           — نام مستعار کلید
#   KEY_PASSWORD        — رمز کلید
# فایل‌های android/app/upload-keystore.jks و android/key.properties ساخته
# می‌شوند و APK امضای رسمی می‌گیرد.
#
# اگر تعریف نشده باشند: APK نسخهٔ release با کلید debug امضا می‌شود
# (قابل نصب برای تست — برای انتشار در بازار keystore رسمی لازم است).
# ─────────────────────────────────────────────────────────────
set -euo pipefail

KEYSTORE_FILE="android/app/upload-keystore.jks"
KEYPROPS_FILE="android/key.properties"

if [ -z "${KEYSTORE_BASE64:-}" ] || [ -z "${KEYSTORE_PASSWORD:-}" ] || [ -z "${KEY_ALIAS:-}" ]; then
  echo "⚠️  Signing secrets not set — release APK will be signed with the DEBUG key (ok for testing, NOT for کافه‌بازار)."
  echo "    To sign properly: run the «ساخت کلید امضا (keystore)» workflow, then add"
  echo "    KEYSTORE_BASE64 / KEYSTORE_PASSWORD / KEY_ALIAS / KEY_PASSWORD in repo Settings → Secrets."
  exit 0
fi

echo "$KEYSTORE_BASE64" | base64 -d > "$KEYSTORE_FILE"
cat > "$KEYPROPS_FILE" <<EOF
storeFile=upload-keystore.jks
storePassword=${KEYSTORE_PASSWORD}
keyAlias=${KEY_ALIAS}
keyPassword=${KEY_PASSWORD:-${KEYSTORE_PASSWORD}}
EOF
echo "✓ keystore decoded + key.properties written → release APK will be signed properly"
