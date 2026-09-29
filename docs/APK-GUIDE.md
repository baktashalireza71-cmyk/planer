# 📱 راهنمای کامل ساخت اپ اندروید (APK) — از صفر تا بازار

این راهنما قدم‌به‌قدم است؛ حتی اگر تا حالا APK نساخته باشی، با همین مراحل می‌توانی.

> ⏱ زمان لازم: اولین بار حدود ۱ ساعت (اکثرش دانلود Android Studio است)
> 💰 هزینه: صفر — همه ابزارها رایگان‌اند

---

## ۰) پیش‌نیازها (روی کامپیوتر)

| ابزار | از کجا | نکته |
|---|---|---|
| **Android Studio** | [developer.android.com/studio](https://developer.android.com/studio) | نسخه جدید (JDK 17 داخلش هست) — حدود ۱ گیگ دانلود |
| **Node.js 20+** یا **Bun** | [nodejs.org](https://nodejs.org) / [bun.sh](https://bun.sh) | برای اجرای دستورات cap |
| **گیت** | [git-scm.com](https://git-scm.com) | برای گرفتن کد از گیت‌هاب |

> بعد از نصب Android Studio، یک بار بازش کن تا ویزارد راه‌اندازی (دانلود Android SDK) کامل شود.

---

## ۱) گرفتن کد و نصب وابستگی‌ها

```bash
git clone https://github.com/USERNAME/planner.git
cd planner
npm install        # یا: bun install
```

همه پکیج‌های Capacitor از قبل در `package.json` ثبت شده‌اند؛ چیزی لازم نیست اضافه کنی.

---

## ۲) ⚠️ تنظیم آدرس سایت (مهم‌ترین قدم!)

فایل **`capacitor.config.ts`** را باز کن و `SERVER_URL` را با آدرس واقعی سایت منتشرشده‌ات عوض کن:

```ts
const SERVER_URL = "https://planner.liara.run";   // ← آدرس خودت
```

اپ اندروید این آدرس را داخل خودش باز می‌کند. **دیتابیس هم روی گوشی است** (localStorage)، پس حتی بدون اینترنت هم برنامه بالا می‌آید و داده‌ها هست؛ فقط برای همگام‌سازی تنظیمات تبلیغات به اینترنت نیاز دارد.

> 🔴 نکته: دامنه را قبل از انتشار نهایی انتخاب کن و بعداً عوضش نکن — داده‌های کاربران به دامنه گره خورده‌اند و با تغییر دامنه صفر می‌شوند.
>
> 🔴 شناسه اپ (`appId: "ir.plannerman.app"`) هم بعد از اولین انتشار در بازار قابل تغییر نیست. اگر می‌خواهی چیز دیگر باشد، همین حالا عوضش کن.

---

## ۳) آیکون و اسپلش (اختیاری — فایل‌ها آماده‌اند)

فایل‌های `assets/icon.png` و `assets/splash.png` از قبل آماده‌اند. برای تولید همه سایزهای اندروید:

```bash
npm install -D @capacitor/assets
npx capacitor-assets generate --android
```

---

## ۴) ساخت پروژه اندروید و اولین تست

```bash
npx cap add android     # فقط بار اول — پروژه android/ ساخته می‌شود
npx cap sync            # بعد از هر تغییر config
npx cap open android    # باز شدن در Android Studio
```

در Android Studio:

- یک شبیه‌ساز بساز (Device Manager → Create Device → Pixel 6) یا گوشی خودت را با USB وصل کن (USB Debugging روشن)
- دکمه سبز **Run ▶** را بزن — اپ روی گوشی/شبیه‌ساز بالا می‌آید

> ✅ در همین مرحله اعلان‌های واقعی فعال‌اند: اولین باز شدن، دیالوگ مجوز اعلان را نشان می‌دهد. یادآور روزانه را در تنظیمات اپ تست کن (ساعتش را بگذار ۱-۲ دقیقه بعد).

### تست سریع با گوشی وصل

```bash
npx cap run android
```

---

## ۵) ساخت فایل APK برای تست روی گوشی‌های دیگر

در Android Studio:

```
Build → Build App Bundle(s) / APK(s) → Build APK(s)
```

فایل خروجی: `android/app/build/outputs/apk/debug/app-debug.apk`
این فایل را می‌توانی با تلگرام/بلوتوث به هر گوشی بفرستی و نصب کنی («نصب از منابع ناشناس» را موقتاً فعال کن).

> این نسخه «debug» فقط برای تست است — برای بازار باید نسخه **release امضاشده** بسازی (قدم بعد).

---

## ۶) نسخه نهایی: ساخت APK/AAB امضاشده (Release)

### ۶-۱) ساخت کلید امضا (فقط یک بار در عمرت!)

```bash
keytool -genkey -v -keystore planner-release.keystore -alias planner -keyalg RSA -keysize 2048 -validity 10000
```

- یک رمز قوی انتخاب کن و **دو جا رمز و فایل keystore را جایی امن نگه دار** (اگر گم شود، هیچ‌وقت نمی‌توانی آپدیت بدهی!)

### ۶-۲) معرفی کلید به پروژه

فایل `android/key.properties` بساز:

```properties
storeFile=../../planner-release.keystore
storePassword=رمز keystore
keyAlias=planner
keyPassword=همان رمز
```

و در `android/app/build.gradle` داخل بلوک `android { ... }`:

```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file("key.properties")
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    ...
    signingConfigs {
        release {
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
        }
    }
}
```

> ساده‌تر (بدون فایل gradle): در Android Studio از منوی
> **Build → Generate Signed App Bundle / APK → APK → Choose existing** فایل keystore را معرفی کن — خودش نسخه امضاشده می‌سازد.

### ۶-۳) ساخت خروجی

```bash
cd android
./gradlew assembleRelease     # خروجی APK
# یا:
./gradlew bundleRelease       # خروجی AAB
```

مسیر خروجی:
- APK: `android/app/build/outputs/apk/release/app-release.apk` ✅ (برای بازار)
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`

---

## ۷) تنظیمات قبل از ارسال به بازار

- [ ] `android/app/build.gradle` → `versionCode = 1` و `versionName = "1.0.0"` (با هر آپدیت versionCode را +۱ کن)
- [ ] نام اپ: در `capacitor.config.ts` → `appName` (روی لانچر گوشی همین نشان داده می‌شود)
- [ ] آیکون ۵۱۲×۵۱۲ برای پنل بازار: `public/icon-512.png` ✅ آماده است
- [ ] اسکرین‌شات‌ها: از گوشی/شبیه‌ساز بگیر (حداقل ۲ عدد)
- [ ] آدرس سیاست حفظ حریم خصوصی (داخل اپ موجود است — می‌توانی یک صفحه وب هم برایش بسازی)
- [ ] فایل `app-release.apk` یا `.aab`

---

## ۸) اعلان‌ها در نسخه اندروید — چطور کار می‌کند؟

همه‌چیز **از قبل کدنویسی و وصل شده**؛ کاری لازم نیست بکنی:

1. **اولین باز شدن اپ** → دیالوگ سیستمی «اجازه اعلان» نمایش داده می‌شود
2. **یادآور روزانه** → در ساعت تنظیم‌شده کاربر، اعلان سیستمی می‌آید — **حتی وقتی برنامه بسته است**
3. **اعلان کارهای امروز** → هر روز ساعت ۹ صبح اعلان «کارهای امروزت را بررسی کن»
4. **تغییر تنظیمات** → با هر تغییر در بخش اعلان‌های اپ، زمان‌بندی سیستمی خودکار به‌روز می‌شود
5. لمس اعلان → برنامه باز می‌شود

> ⚙️ نکته فنی: یادآورها با `@capacitor/local-notifications` و `allowWhileIdle` زمان‌بندی می‌شوند (پلاگین مجوز `SCHEDULE_EXACT_ALARM` را خودش اعلام می‌کند). در اندروید ۱۴+ اگر دقت دقیق لازم شد، کاربر یک بار از تنظیمات «Alarms & reminders» اپ را مجاز می‌کند — بدون آن هم اعلان می‌آید، فقط شاید با چند دقیقه اختلاف.

---

## ۹) عیب‌یابی‌های رایج

| خطا | راه‌حل |
|---|---|
| `JAVA_HOME is not set` | Android Studio → Settings → Build Tools → Gradle → Gradle JDK → انتخاب Embedded JDK |
| `SDK location not found` | فایل `android/local.properties` بساز: `sdk.dir=/path/to/Android/sdk` |
| اپ سفید باز می‌شود | `SERVER_URL` در `capacitor.config.ts` اشتباه است؛ درستش کن و `npx cap sync` بزن |
| تست با `http://192.168...` کار نمی‌کند | موقتاً در config بگذار `cleartext: true` و sync کن |
| اعلان‌ها نمی‌آیند | تنظیمات گوشی ← برنامه ← مجوزها ← Notifications فعال؟ بهینه‌سازی باتری (Battery Optimization) را برای اپ خاموش کن |
| `gradle` خطای نسخه | Android Studio را به آخرین نسخه آپدیت کن |

---

## ۱۰) جمع‌بندی دستورات (چیت‌شیت)

```bash
git clone https://github.com/USERNAME/planner.git && cd planner
npm install
# capacitor.config.ts → SERVER_URL را عوض کن
npm install -D @capacitor/assets && npx capacitor-assets generate --android
npx cap add android
npx cap sync
npx cap open android
# در Android Studio: Run ▶ (تست) → Build APK(s) (تست روی گوشی دیگر)
# برای بازار: Build → Generate Signed APK یا ./gradlew assembleRelease
```
