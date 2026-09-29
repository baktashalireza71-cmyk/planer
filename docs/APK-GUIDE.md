# 📱 راهنمای کامل ساخت اپ اندروید (APK) — از صفر تا بازار

این راهنما قدم‌به‌قدم است؛ حتی اگر تا حالا APK نساخته باشی، با همین مراحل می‌توانی.

> 💰 هزینه: صفر — همه ابزارها رایگان‌اند
>
> ✅ خبر خوب: **برای ساخت APK به Android Studio نیاز نداری!** دو راه داری:
>
> | روش | نیاز دارد به | مناسب برای |
> |---|---|---|
> | **۱. گیت‌هاب اکشنز (پیشنهادی)** ⚡ | فقط یک اکانت گیت‌هاب | همه‌کاره — بدون نصب هیچ چیز روی کامپیوتر |
> | **۲. Android Studio** | کامپیوتر + ۱ گیگ دانلود | تست روی شبیه‌ساز، دیباگ حرفه‌ای |
>
> هر دو روش **دقیقاً همان APK** را می‌سازند (همان پروژه `android/` موجود در مخزن).

---

## پیش‌نیاز مشترک هر دو روش: آدرس سایت منتشرشده

اپ اندروید، سایت تو را داخل خودش باز می‌کند، پس اول باید سایت را روی یک هاست منتشر کنی (مثلاً لیارا — طبق README قدم ۲) و آدرسش را داشته باشی، مثل:

```
https://planner.liara.run
```

> 🔴 نکته: دامنه را قبل از انتشار نهایی انتخاب کن و بعداً عوضش نکن — داده‌های کاربران (localStorage) به دامنه گره خورده‌اند و با تغییر دامنه صفر می‌شوند.
>
> 🔴 شناسه اپ (`appId: "ir.plannerman.app"` در `capacitor.config.ts`) هم بعد از اولین انتشار در بازار قابل تغییر نیست.

> 💡 هنوز سایت را منتشر نکرده‌ای؟ می‌توانی همین حالا هم APK تستی بسازی — اپ بالا می‌آید، داده‌ها روی گوشی ذخیره می‌شوند، فقط تنظیمات تبلیغات (که از سرور می‌آید) لود نمی‌شود.

---
---

# ⚡ روش ۱: ساخت APK با گیت‌هاب اکشنز — بدون Android Studio

ایده: گیت‌هاب خودش روی سرورهایش APK را می‌سازد و به‌عنوان «Artifact» تحویلت می‌دهد. تو فقط کلیک می‌کنی.

## قدم ۱ — کد را روی گیت‌هاب بگذار

طبق README (قدم ۱) یک مخزن بساز و push کن. فایل‌های زیر از قبل در پروژه آماده‌اند:

- `.github/workflows/build-apk.yml` ← دستور ساخت APK
- `.github/workflows/make-keystore.yml` ← ساخت کلید امضا
- `android/` ← کل پروژه اندروید (با آیکون‌ها و اسپلش تولیدشده)

## قدم ۲ — اولین APK تستی (همین حالا می‌توانی بگیری!)

1. در صفحه مخزن گیت‌هاب، برو به تب **Actions**
2. اگر پیام «Workflows aren't being run…» دیدی، دکمه سبز **I understand my workflows, go ahead and enable them** را بزن
3. از لیست سمت راست **«ساخت APK اندروید»** را انتخاب کن
4. دکمه **Run workflow** را بزن
5. فیلدها را خالی بگذار (برای تست اولیه) و دوباره **Run workflow** را بزن
6. ۵ تا ۱۰ دقیقه صبر کن؛ وقتی ران سبز شد ✅، واردش شو
7. پایین صفحه، بخش **Artifacts** → دانلود **planner-man-apk**
8. زیپ را باز کن — دو فایل داری:
   - `app-debug.apk` → برای تست روی گوشی خودت و دوستان (با تلگرام/بلوتوث بفرست و نصب کن)
   - `app-release.apk` → همان نسخه ولی امضای موقت (تست نهایی رفتار release)

> 📱 نصب روی گوشی: فایل APK را باز کن → اگر پرسید «نصب از منابع ناشناس» → اجازه بده. اگر گوشی گفت «فایل خراب است» یعنی دانلود ناقص شده؛ دوباره دانلود کن.

## قدم ۳ — وصل کردن به سایتت

وقتی سایت را منتشر کردی، همان مسیر قبلی (**Actions → ساخت APK اندروید → Run workflow**) این بار در فیلد:

- **server_url** → آدرس سایتت را بنویس (مثل `https://planner.liara.run`)
- **version_name** → `1.0`
- **version_code** → `1`

APK ساخته‌شده از این به بعد به سایتت وصل است.

## قدم ۴ — کلید امضای رسمی (برای انتشار در بازار — فقط یک بار!)

APK مرحله ۲ با «کلید تستی» امضا شده؛ **کافه‌بازار کلید رسمی می‌خواهد.** نیازی به نصب چیزی نداری — گیت‌هاب خودش کلید را می‌سازد:

1. تب **Actions** → این‌بار **«ساخت کلید امضا (keystore)»** را انتخاب کن → **Run workflow**
2. در فیلد **store_password** یک رمز قوی بنویس و **همان را جایی یادداشت کن** → Run
3. بعد از اتمام، از Artifacts فایل **plannerman-keystore** را دانلود کن. داخلش:
   - `plannerman.keystore` ← **گنج!» در جای خیلی امن نگه‌دار (مثلاً ایمیل خودت + یک فلش). اگر گمش کنی، هیچ‌وقت نمی‌توانی آپدیت بدهی.**
   - `plannerman.keystore.base64.txt` ← محتوای متنش را کپی کن
   - `secrets-values.txt` و `README.txt` ← راهنما

4. در مخزن گیت‌هاب: **Settings → Secrets and variables → Actions → دکمه New repository secret** — این ۴ تا را بساز:

| Name (دقیقاً همین) | Secret (مقدار) |
|---|---|
| `KEYSTORE_BASE64` | کل محتوای `plannerman.keystore.base64.txt` |
| `KEYSTORE_PASSWORD` | رمزی که در قدم ۲ نوشتی |
| `KEY_ALIAS` | `plannerman` |
| `KEY_PASSWORD` | همان رمز قدم ۲ |

5. تمام! حالا هر بار **«ساخت APK اندروید»** را اجرا کنی، `app-release.apk` با کلید رسمی خودت امضا می‌شود — همین فایل را به بازار می‌دهی.

> 🔒 نکته امنیتی: اگر مخزنت **عمومی (Public)** است، حتماً همین روش Secrets را استفاده کن و هرگز فایل keystore را داخل خود کد آپلود نکن. مخزن خصوصی (Private) هم برای بازار کاملاً کافی است.

## قدم ۵ — چک‌لیست ارسال به بازار

برو به بخش «۷) تنظیمات قبل از ارسال به بازار» پایین 👇

---
---

# 🖥 روش ۲: با Android Studio (اختیاری — برای شبیه‌ساز و دیباگ)

## ۰) پیش‌نیازها (روی کامپیوتر)

| ابزار | از کجا | نکته |
|---|---|---|
| **Android Studio** | [developer.android.com/studio](https://developer.android.com/studio) | نسخه جدید (JDK داخلش هست) — حدود ۱ گیگ دانلود |
| **Node.js 20+** یا **Bun** | [nodejs.org](https://nodejs.org) / [bun.sh](https://bun.sh) | برای اجرای دستورات cap |
| **گیت** | [git-scm.com](https://git-scm.com) | برای گرفتن کد از گیت‌هاب |

> بعد از نصب Android Studio، یک بار بازش کن تا ویزارد راه‌اندازی (دانلود Android SDK) کامل شود.

## ۱) گرفتن کد و نصب وابستگی‌ها

```bash
git clone https://github.com/USERNAME/planner.git
cd planner
npm install        # یا: bun install
```

## ۲) ⚠️ تنظیم آدرس سایت

فایل **`capacitor.config.ts`** را باز کن و `SERVER_URL` را با آدرس واقعی سایت منتشرشده‌ات عوض کن:

```ts
const SERVER_URL = "https://planner.liara.run";   // ← آدرس خودت
```

اپ اندروید این آدرس را داخل خودش باز می‌کند. **دیتابیس هم روی گوشی است** (localStorage)، پس حتی بدون اینترنت هم برنامه بالا می‌آید و داده‌ها هست؛ فقط برای همگام‌سازی تنظیمات تبلیغات به اینترنت نیاز دارد.

## ۳) آیکون و اسپلش

✅ از قبل تولید شده‌اند (پوشه `android/app/src/main/res`). اگر روزی خواستی عوضشان کنی:

```bash
# فایل assets/icon.png و assets/splash.png را جایگزین کن، بعد:
npx @capacitor/assets generate --android
```

## ۴) اولین تست روی شبیه‌ساز یا گوشی

```bash
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

## ۵) ساخت فایل APK برای تست روی گوشی‌های دیگر

در Android Studio:

```
Build → Build App Bundle(s) / APK(s) → Build APK(s)
```

فایل خروجی: `android/app/build/outputs/apk/debug/app-debug.apk`
این فایل را می‌توانی با تلگرام/بلوتوث به هر گوشی بفرستی و نصب کنی («نصب از منابع ناشناس» را موقتاً فعال کن).

---

## ۶) نسخه نهایی: APK امضاشده (Release) — مشترک بین هر دو روش

> 🎁 راحتی: `android/app/build.gradle` از قبل طوری تنظیم شده که اگر فایل `android/key.properties` موجود باشد، خودکار نسخه release را با کلید تو امضا می‌کند؛ اگر نباشد با کلید debug امضا می‌کند تا APK همیشه قابل نصب باشد. **دیگر لازم نیست gradle را دستی ویرایش کنی.**

### اگر با روش ۱ (گیت‌هاب) پیش می‌روی

هیچ کاری نکن! فقط Secrets را طبق قدم ۴ روش ۱ ست کن — workflow خودش فایل‌ها را می‌سازد و امضا می‌کند.

### اگر روی کامپیوتر خودت می‌سازی

**۶-۱) کلید را بساز (یا از workflow «ساخت کلید امضا» دانلودش کن):**

```bash
keytool -genkey -v -keystore planner-release.keystore -alias planner -keyalg RSA -keysize 2048 -validity 10000
```

**۶-۲) دو فایل را سر جای خودشان بگذار:**

کلید `planner-release.keystore` را به مسیر `android/app/upload-keystore.jks` کپی کن، و فایل `android/key.properties` را بساز:

```properties
storeFile=upload-keystore.jks
storePassword=رمز keystore
keyAlias=planner
keyPassword=همان رمز
```

**۶-۳) ساخت خروجی:**

```bash
cd android
./gradlew assembleRelease     # خروجی APK
# یا:
./gradlew bundleRelease       # خروجی AAB
```

مسیر خروجی:
- APK: `android/app/build/outputs/apk/release/app-release.apk` ✅ (برای بازار)
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`

> در Android Studio می‌توانی از منوی **Build → Generate Signed App Bundle / APK** هم استفاده کنی و keystore را دستی معرفی کنی.

---

## ۷) تنظیمات قبل از ارسال به بازار

- [ ] نسخه جدید: در هنگام Run workflow فیلدهای `version_name` و `version_code` را پر کن (یا دستی `android/app/build.gradle` → `versionCode` +۱)
- [ ] `app-release.apk` **امضاشده با کلید رسمی** (قدم ۴ روش ۱ یا بخش ۶)
- [ ] نام اپ: در `capacitor.config.ts` → `appName` (روی لانچر گوشی همین نشان داده می‌شود)
- [ ] آیکون ۵۱۲×۵۱۲ برای پنل بازار: `public/icon-512.png` ✅ آماده است
- [ ] اسکرین‌شات‌ها: از گوشی/شبیه‌ساز بگیر (حداقل ۲ عدد)
- [ ] آدرس سیاست حفظ حریم خصوصی (داخل اپ موجود است — می‌توانی یک صفحه وب هم برایش بسازی)
- [ ] همان `key.properties` و `plannerman.keystore` که در قدم ۴ ساختی

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
| ران Actions قرمز شد | روی ران کلیک کن → مرحله قرمز → لاگش را بخوان؛ اکثراً مشکل موقت شبکه است — دوباره Run workflow بزن |
| در تب Actions هیچ workflowای نیست | یک فایل را commit/push کن تا فعال شود (مثلاً تغییر کوچکی در README) |
| Artifact را نمی‌بینم | باید وارد ران تمام‌شده (سبز) شوی؛ Artifact پایین صفحه است |
| گوشی می‌گوید «برنامه نصب نمی‌شود» | اگر قبلاً نسخه دیگری از اپ را نصب کرده‌ای و امضایش فرق دارد، اول نسخه قبلی را پاک کن |
| `JAVA_HOME is not set` | Android Studio → Settings → Build Tools → Gradle → Gradle JDK → انتخاب Embedded JDK |
| `SDK location not found` | فایل `android/local.properties` بساز: `sdk.dir=/path/to/Android/sdk` |
| اپ سفید باز می‌شود | `SERVER_URL` در `capacitor.config.ts` اشتباه است؛ درستش کن و `npx cap sync` بزن |
| تست با `http://192.168...` کار نمی‌کند | موقتاً در config بگذار `cleartext: true` و sync کن |
| اعلان‌ها نمی‌آیند | تنظیمات گوشی ← برنامه ← مجوزها ← Notifications فعال؟ بهینه‌سازی باتری (Battery Optimization) را برای اپ خاموش کن |

---

## ۱۰) جمع‌بندی دستورات (چیت‌شیت)

**روش گیت‌هاب (بدون نصب هیچ‌چیز):**

```text
push به گیت‌هاب
→ تب Actions → «ساخت APK اندروید» → Run workflow (server_url را بده)
→ Artifacts → دانلود planner-man-apk → نصب/ارسال به بازار
یک بار هم: «ساخت کلید امضا» → ۴ secret → از آن به بعد APKها امضای رسمی دارند
```

**روش کامپیوتری (Android Studio):**

```bash
git clone https://github.com/USERNAME/planner.git && cd planner
npm install
# capacitor.config.ts → SERVER_URL را عوض کن
npx cap sync
npx cap open android
# در Android Studio: Run ▶ (تست) → Build APK(s) (تست روی گوشی دیگر)
# برای بازار: key.properties + upload-keystore.jks → ./gradlew assembleRelease
```
