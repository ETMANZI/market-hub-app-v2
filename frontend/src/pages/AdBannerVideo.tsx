import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

type MediaItem = {
  id: number | string;
  title?: string;
  media_type: "video" | "image" | "gif";
  file_url: string;
  target_url?: string | null;
  is_active: boolean;
};

function BannerMedia({ item }: { item: MediaItem }) {
  if (item.media_type === "video") {
    return (
      <video
        src={item.file_url}
        className="h-40 w-full object-cover md:h-48"
        autoPlay
        muted
        loop
        playsInline
      />
    );
  }

  return (
    <img
      src={item.file_url}
      alt={item.title || "Promo banner"}
      className="h-40 w-full object-cover md:h-48"
    />
  );
}

export default function AdBannerVideo() {
  const { data: mediaItems = [], isLoading } = useQuery<MediaItem[]>({
    queryKey: ["promo-banners"],
    queryFn: async () => {
      const res = await api.get("/promo-banners/");
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    },
  });

  if (isLoading) {
    return (
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="h-40 animate-pulse rounded-2xl bg-slate-200 md:h-48"
          />
        ))}
      </div>
    );
  }

  if (!mediaItems.length) return null;

  return (
    <div className="mb-6">
      <div className="flex gap-4 overflow-x-auto pb-2">
        {mediaItems.map((item) => {
          const content = (
            <div className="relative min-w-[320px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:min-w-[420px]">
              <BannerMedia item={item} />
              {item.title && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                </div>
              )}
            </div>
          );

          if (item.target_url) {
            return (
              <a
                key={item.id}
                href={item.target_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block transition hover:opacity-95"
              >
                {content}
              </a>
            );
          }

          return <div key={item.id}>{content}</div>;
        })}
      </div>
    </div>
  );
}