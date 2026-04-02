import { Link } from "react-router-dom";
import { BadgeAlert, Phone, Mail, Megaphone, ArrowRight } from "lucide-react";

type AdItem = {
  id: string | number;
  title: string;
  description?: string;
  contact_phone?: string;
  contact_email?: string;
};

type Props = {
  ads: AdItem[];
};

const softCardStyles = [
  "bg-slate-50 border-slate-200",
  "bg-blue-50/70 border-blue-100",
  "bg-indigo-50/70 border-indigo-100",
  "bg-emerald-50/70 border-emerald-100",
];

const softIconStyles = [
  "bg-white text-slate-600",
  "bg-blue-100/70 text-blue-700",
  "bg-indigo-100/70 text-indigo-700",
  "bg-emerald-100/70 text-emerald-700",
];

export default function AdMarquee({ ads }: Props) {
  if (!ads || ads.length === 0) return null;

  const scrollingAds = ads.length > 1 ? [...ads, ...ads] : ads;

  return (
    <div className="w-full overflow-hidden border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 py-2">
      <div className="ad-marquee">
        <div className="ad-marquee-track flex items-center">
          {scrollingAds.map((ad, index) => {
            const cardStyle = softCardStyles[index % softCardStyles.length];
            const iconStyle = softIconStyles[index % softIconStyles.length];

            return (
              <Link
                key={`${ad.id}-${index}`}
                to={`/listings/${ad.id}`}
                className={`mx-3 flex min-w-[360px] max-w-[520px] shrink-0 items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm transition duration-200 hover:-translate-y-[1px] hover:bg-white hover:shadow-md ${cardStyle}`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconStyle}`}
                >
                  <Megaphone size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-600 ring-1 ring-indigo-100">
                      <BadgeAlert size={12} />
                      Sponsored
                    </span>
                  </div>

                  <div className="truncate text-sm font-semibold text-slate-800">
                    {ad.title}
                  </div>

                  {ad.description && (
                    <div className="truncate text-xs text-slate-500">
                      {ad.description}
                    </div>
                  )}

                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-600">
                    {ad.contact_phone ? (
                      <>
                        <Phone size={12} className="shrink-0" />
                        <span className="truncate">{ad.contact_phone}</span>
                      </>
                    ) : ad.contact_email ? (
                      <>
                        <Mail size={12} className="shrink-0" />
                        <span className="truncate">{ad.contact_email}</span>
                      </>
                    ) : (
                      <span className="truncate">Contact seller</span>
                    )}
                  </div>
                </div>

                <div className="hidden shrink-0 items-center text-slate-300 sm:flex">
                  <ArrowRight size={16} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}