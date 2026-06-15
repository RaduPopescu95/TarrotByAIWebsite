import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { resolvePartnerPromotionLinkUrl } from "../../lib/partnerPromotions/partnerPromotionLinks";

export default function PartnerPromoSlot({ placement, className = "" }) {
  const router = useRouter();
  const { t } = useTranslation("common");
  const [promotions, setPromotions] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!placement) {
      setLoaded(true);
      return undefined;
    }

    let cancelled = false;
    const locale = router.locale || "ro";

    const load = async () => {
      try {
        const params = new URLSearchParams({
          placement,
          platform: "web",
          locale,
        });
        const res = await fetch(`/api/public/partner-promotions?${params.toString()}`, {
          headers: { Accept: "application/json" },
        });
        const data = await res.json().catch(() => ({}));
        if (!cancelled) {
          setPromotions(Array.isArray(data?.promotions) ? data.promotions : []);
        }
      } catch {
        if (!cancelled) setPromotions([]);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [placement, router.locale]);

  if (!loaded || promotions.length === 0) return null;

  return (
    <div className={`space-y-4 ${className}`.trim()}>
      {promotions.map((promo) => {
        const href = resolvePartnerPromotionLinkUrl(promo.linkUrl, promo.linkType);
        if (!href) return null;
        return (
          <article
            key={promo.id}
            className="overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-white p-4 shadow-sm"
          >
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-amber-700/80">
              {t("partnerPromoBadge")}
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {promo.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={promo.logoUrl}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-xl border border-white bg-white object-contain p-1"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-slate-900">{promo.name}</h3>
                {promo.description ? (
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{promo.description}</p>
                ) : null}
              </div>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center justify-center rounded-full bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700"
              >
                {t("partnerPromoCta")}
              </a>
            </div>
          </article>
        );
      })}
    </div>
  );
}
