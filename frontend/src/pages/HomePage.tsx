import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AnimatedText from "../components/ui/AnimatedText";
import PageContainer from "../components/layout/PageContainer";
import { api } from "../lib/api";

type ListingImage = {
  id: string | number;
  image: string;
  is_cover?: boolean;
};

type Listing = {
  id: string | number;
  title: string;
  contact_phone?: string;
  is_featured?: boolean;
  images?: ListingImage[];
};

type HeroSlide = {
  listingId: string;
  title: string;
  image: string;
  contactPhone?: string;
  isFeatured?: boolean;
};

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const { data: listings = [] } = useQuery<Listing[]>({
    queryKey: ["home-hero-listings"],
    queryFn: async () => {
      const response = await api.get("/listings/");
      return response.data;
    },
  });

  const slides = useMemo((): HeroSlide[] => {
    const sortedListings = [...listings].sort((a, b) => {
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      return 0;
    });

    const result: HeroSlide[] = [];

    for (const listing of sortedListings) {
      const coverImage =
        listing.images?.find((img) => img.is_cover)?.image ||
        listing.images?.[0]?.image ||
        "";

      if (!coverImage) continue;

      result.push({
        listingId: String(listing.id),
        title: listing.title,
        image: coverImage,
        contactPhone: listing.contact_phone || undefined,
        isFeatured: listing.is_featured || undefined,
      });
    }

    return result;
  }, [listings]);

  useEffect(() => {
    if (slides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [slides.length]);

  useEffect(() => {
    if (currentSlide >= slides.length) {
      setCurrentSlide(0);
    }
  }, [currentSlide, slides.length]);

  const activeSlide = slides[currentSlide];

  return (
    <div className="min-h-screen bg-slate-50">
      <PageContainer>
        <section className="grid gap-8 pt-2 pb-12 md:grid-cols-2 md:items-center md:pt-3 md:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="inline-block rounded-full bg-slate-200 px-3 py-1 text-sm">
              Homes • Parcels • Business Ads
            </span>

            <h1 className="mt-4 text-3xl font-bold leading-tight md:text-5xl">
              <AnimatedText text="Modern marketplace for buying, selling, and advertising." />
            </h1>

            <div className="mt-4 text-lg text-slate-600">
              <AnimatedText
                text="Publish property listings, advertise businesses, manage paid publishing, and connect buyers with sellers."
                typingSpeed={20}
                highlightSpeed={50}
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/listings"
                className="rounded-xl bg-slate-500 px-6 py-3 text-white"
              >
                Browse listings
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl bg-white p-4 shadow-xl"
          >
            <div className="relative h-[420px] overflow-hidden rounded-2xl bg-gradient-to-br from-slate-200 to-slate-100">
              {activeSlide ? (
                <>
                  <img
                    src={activeSlide.image}
                    alt={activeSlide.title}
                    className="h-full w-full object-cover transition-all duration-700"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                    {activeSlide.isFeatured && (
                      <span className="mb-3 inline-block rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-slate-900">
                        Featured
                      </span>
                    )}

                    <h3 className="text-xl font-semibold">{activeSlide.title}</h3>

                    {activeSlide.contactPhone && (
                      <p className="mt-2 text-sm text-white/90">
                        Contact: {activeSlide.contactPhone}
                      </p>
                    )}

                    <Link
                      to={`/listings/${activeSlide.listingId}`}
                      className="mt-4 inline-block rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700"
                    >
                      View details
                    </Link>
                  </div>

                  {slides.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentSlide(
                            (prev) => (prev - 1 + slides.length) % slides.length
                          )
                        }
                        className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-xl text-slate-900 shadow hover:bg-white"
                      >
                        &lt;
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setCurrentSlide((prev) => (prev + 1) % slides.length)
                        }
                        className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-xl text-slate-900 shadow hover:bg-white"
                      >
                        &gt;
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="flex h-full items-center justify-center text-center text-2xl font-semibold text-slate-500">
                  Marketplace Hero Preview
                </div>
              )}
            </div>
          </motion.div>
        </section>
      </PageContainer>
    </div>
  );
}