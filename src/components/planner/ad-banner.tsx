"use client";

/**
 * بنر تبلیغ و کارت خوشامد — از کانفیگ مرکزی برنامه (AppConfigProvider)
 * ------------------------------------------------
 * هر دو کامپوننت خودشان با isReady گیت می‌شوند؛ جایی که استفاده می‌شوند
 * نباید دوباره گیت شوند. تا قبل از آماده‌شدن کانفیگ هیچ چیزی رندر نمی‌شود
 * (نه اسکلت، نه فضای خالی) تا صفحه نپرد.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Megaphone, ExternalLink, MessageCircleHeart, X } from "lucide-react";
import { useAppConfig, buildContactUrl } from "@/lib/app-config-context";

// ─────────────────────────────────────────────
//  بنر تبلیغ
// ─────────────────────────────────────────────
export function AdBanner() {
  const { config, isReady } = useAppConfig();
  const [imageBroken, setImageBroken] = useState(false);

  if (!isReady || !config.adsEnabled) return null;

  const showImage = Boolean(config.adImage) && !imageBroken;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="relative min-w-0 overflow-hidden rounded-3xl bg-gradient-to-bl from-amber-500 via-orange-500 to-rose-500 p-5 text-white shadow-xl shadow-amber-500/25 sm:p-6"
    >
      <div aria-hidden className="pointer-events-none absolute -top-10 -left-10 h-36 w-36 rounded-full bg-white/15 blur-2xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-12 right-1/4 h-40 w-40 rounded-full bg-rose-300/25 blur-2xl" />

      <div className="relative flex min-w-0 items-start justify-between gap-3">
        {/* چیپ شفافیت */}
        <span className="shrink-0 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold text-white/95 backdrop-blur">
          تبلیغ
        </span>
        <Megaphone className="h-6 w-6 shrink-0 text-white/90" strokeWidth={2.2} />
      </div>

      <div className="relative mt-3 flex min-w-0 items-start gap-3">
        {showImage && (
          <img
            src={config.adImage ?? ""}
            alt="تصویر تبلیغ"
            onError={() => setImageBroken(true)}
            className="h-16 w-16 shrink-0 rounded-2xl border-2 border-white/40 object-cover shadow-md sm:h-20 sm:w-20"
          />
        )}
        <div className="min-w-0 flex-1">
          {config.adTitle && (
            <h3 className="text-base font-black leading-snug sm:text-lg">{config.adTitle}</h3>
          )}
          {config.adText && (
            <p className="mt-1 whitespace-pre-line text-xs font-medium leading-relaxed text-white/90 sm:text-sm">
              {config.adText}
            </p>
          )}
        </div>
      </div>

      {config.adLink && (
        <div className="relative mt-3">
          <a
            href={config.adLink}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-black text-rose-600 shadow-lg shadow-rose-900/20 transition-transform hover:scale-[1.02] active:scale-[0.98] sm:w-auto"
          >
            {config.adButtonText || "مشاهده"}
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      )}
    </motion.section>
  );
}

// ─────────────────────────────────────────────
//  کارت خوشامد / ارتباط با پشتیبانی
// ─────────────────────────────────────────────
const CHANNEL_LABELS: Record<string, string> = {
  WHATSAPP: "واتساپ",
  TELEGRAM: "تلگرام",
  BALE: "بله",
};

export function WelcomeContactCard() {
  const { config, isReady, seenWelcomeVersion, dismissWelcome } = useAppConfig();

  if (!isReady) return null;
  if (config.welcomeVersion <= seenWelcomeVersion) return null;

  const contactUrl = buildContactUrl(
    config.contactChannel,
    config.contactTarget,
    config.contactMessage
  );
  if (!config.welcomeText && !contactUrl) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="relative min-w-0 overflow-hidden rounded-3xl bg-gradient-to-bl from-violet-500 via-purple-500 to-fuchsia-500 p-5 text-white shadow-xl shadow-violet-500/25 sm:p-6"
    >
      <div aria-hidden className="pointer-events-none absolute -top-10 -left-10 h-36 w-36 rounded-full bg-white/15 blur-2xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-12 left-1/3 h-40 w-40 rounded-full bg-fuchsia-300/25 blur-2xl" />

      <div className="relative flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
          <MessageCircleHeart className="h-6 w-6" strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-black leading-snug sm:text-lg">
            {config.welcomeText || "به پلنر من خوش آمدی!"}
          </h3>
          {contactUrl && (
            <p className="mt-1 text-xs font-medium text-white/85 sm:text-sm">
              سوالی یا پیشنهادی داری؟ از راه {CHANNEL_LABELS[config.contactChannel] ?? "ارتباطی"} در خدمتت هستیم.
            </p>
          )}
        </div>
        {/* دکمه بستن — dismissible */}
        <button
          onClick={dismissWelcome}
          aria-label="بستن کارت خوشامد"
          className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/20 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {contactUrl && (
        <div className="relative mt-3">
          <a
            href={contactUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-black text-violet-600 shadow-lg shadow-violet-900/20 transition-transform hover:scale-[1.02] active:scale-[0.98] sm:w-auto"
          >
            <MessageCircleHeart className="h-4 w-4" />
            ارتباط با پشتیبانی
          </a>
        </div>
      )}
    </motion.section>
  );
}
