import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  MapPin,
  House,
  Building2,
  Layers3,
  Pencil,
  Car,
  Eye,
  Star,
} from "lucide-react";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import AdBannerVideo from "../pages/AdBannerVideo";
import { api } from "../lib/api";
import { isAuthenticated } from "../lib/auth";

type ListingImage = {
  id: string;
  image: string;
  is_cover?: boolean;
};

type Listing = {
  id: string;
  title: string;
  description: string;
  listing_type: "house" | "parcel" | "business_ad" | "car";
  sale_mode?: "sell" | "rent" | "ads";
  price: string | number;
  negotiable?: boolean;
  discount_price?: string | number | null;
  district?: string;
  sector?: string;
  address?: string;
  status?: string;
  visibility_status?: "active" | "inactive";
  owner?: number | string;
  owner_id?: number | string;
  is_owner?: boolean;
  images?: ListingImage[];
  created_at?: string;
  car_make?: string;
  car_model?: string;
  car_year?: string | number | null;
  car_mileage?: string | number | null;
  category?: string | number | null;
  views_count?: number;
  interested_count?: number;
  has_interested?: boolean;
};

type CurrentUser = {
  id: number | string;
  is_staff?: boolean;
  is_superuser?: boolean;
};

type Category = {
  id: string | number;
  name: string;
  slug: string;
};

const ITEMS_PER_PAGE = 12;
const ANONYMOUS_INTEREST_KEY = "anonymous_interest_user_id";

function getListingIcon(type: Listing["listing_type"]) {
  if (type === "house") return <House size={16} />;
  if (type === "parcel") return <Layers3 size={16} />;
  if (type === "car") return <Car size={16} />;
  return <Building2 size={16} />;
}

function getListingLabel(type: Listing["listing_type"]) {
  if (type === "house") return "House";
  if (type === "parcel") return "Parcel";
  if (type === "car") return "Car";
  return "Business Ad";
}

function formatPrice(value: string | number) {
  return new Intl.NumberFormat("en-RW").format(Number(value || 0));
}

function formatNumber(value?: string | number) {
  return new Intl.NumberFormat("en-RW").format(Number(value || 0));
}

function formatRWF(value: string | number) {
  return `RWF ${Math.round(Number(value)).toLocaleString()}`;
}

function formatMileage(value?: string | number | null) {
  const num = Number(value ?? 0);
  if (!value || Number.isNaN(num) || num <= 0) return "";
  return `${new Intl.NumberFormat("en-RW").format(num)} km`;
}

function getErrorMessage(error: any, fallback: string) {
  const data = error?.response?.data;
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (typeof data?.detail === "string") return data.detail;
  return fallback;
}

function getAnonymousInterestUserId() {
  let existing = localStorage.getItem(ANONYMOUS_INTEREST_KEY);
  if (existing) return existing;

  const generated =
    "anon_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  localStorage.setItem(ANONYMOUS_INTEREST_KEY, generated);
  return generated;
}

export default function ListingsPage() {
  const loggedIn = isAuthenticated();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [listingType, setListingType] = useState("");
  const [saleMode, setSaleMode] = useState("");
  const [district, setDistrict] = useState("");
  const [sector, setSector] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [withDiscount, setWithDiscount] = useState(false);
  const [negotiableOnly, setNegotiableOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [interestMessage, setInterestMessage] = useState("");

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    if (search.trim()) params.append("q", search.trim());
    if (listingType) params.append("listing_type", listingType);
    if (saleMode) params.append("sale_mode", saleMode);
    if (district.trim()) params.append("district", district.trim());
    if (sector.trim()) params.append("sector", sector.trim());
    if (category) params.append("category", category);
    if (minPrice) params.append("min_price", minPrice);
    if (maxPrice) params.append("max_price", maxPrice);
    if (withDiscount) params.append("with_discount", "1");
    if (negotiableOnly) params.append("negotiable", "1");

    return params.toString();
  }, [
    search,
    listingType,
    saleMode,
    district,
    sector,
    category,
    minPrice,
    maxPrice,
    withDiscount,
    negotiableOnly,
  ]);

  const { data: listingsData, isLoading, isError } = useQuery<Listing[]>({
    queryKey: [
      "listings",
      search,
      listingType,
      saleMode,
      district,
      sector,
      category,
      minPrice,
      maxPrice,
      withDiscount,
      negotiableOnly,
    ],
    queryFn: async () => {
      const url = queryString ? `/listings/?${queryString}` : "/listings/";
      const res = await api.get(url);
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    },
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["listing-categories"],
    queryFn: async () => {
      const res = await api.get("/categories/");
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    },
  });

  const { data: currentUser } = useQuery<CurrentUser | null>({
    queryKey: ["current-user"],
    queryFn: async () => {
      try {
        return (await api.get("/accounts/me/")).data;
      } catch {
        return null;
      }
    },
  });

  const isAdmin =
    currentUser?.is_staff === true || currentUser?.is_superuser === true;

  const hideMutation = useMutation({
    mutationFn: async (listingId: string) => {
      await api.post(`/listings/${listingId}/hide/`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });

  const unhideMutation = useMutation({
    mutationFn: async (listingId: string) => {
      await api.post(`/listings/${listingId}/unhide/`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });

  const toggleInterestMutation = useMutation({
    mutationFn: async (listingId: string) => {
      const isAnonymous = !loggedIn;
      const anonymousId = isAnonymous ? getAnonymousInterestUserId() : null;

      const res = await api.post(`/listings/${listingId}/toggle_interest/`, {
        anonymous_user_id: anonymousId,
        anonymous_name: isAnonymous ? "Anonymous" : null,
      });

      return { listingId, data: res.data };
    },
    onSuccess: async ({ data }) => {
      setInterestMessage(
        data?.interested
          ? "Listing marked as Interested."
          : "Interest removed from listing."
      );
      await queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
    onError: (error: any) => {
      setInterestMessage(getErrorMessage(error, "Unable to update interest."));
    },
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    listingType,
    saleMode,
    district,
    sector,
    category,
    minPrice,
    maxPrice,
    withDiscount,
    negotiableOnly,
  ]);

  useEffect(() => {
    api
      .post("/moderation/track-visitor/", {
        path: window.location.pathname,
      })
      .catch(() => {});
  }, []);

  const listings = listingsData || [];
  const totalPages = Math.ceil(listings.length / ITEMS_PER_PAGE);

  const paginatedListings = listings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const resetFilters = () => {
    setSearch("");
    setListingType("");
    setSaleMode("");
    setDistrict("");
    setSector("");
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    setWithDiscount(false);
    setNegotiableOnly(false);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <AdBannerVideo />

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <p className="text-sm text-slate-600 md:text-base">
          Explore houses, parcels, cars, and business advertisements across Rwanda.
        </p>

        {loggedIn && (
          <Link
            to="/publish"
            className="rounded-2xl bg-slate-400 px-5 py-3 text-white"
          >
            Post Listing
          </Link>
        )}
      </div>

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, description, location..."
          />

          <select
            value={listingType}
            onChange={(e) => setListingType(e.target.value)}
            className="rounded-2xl border border-slate-300 bg-white px-3 py-3 outline-none focus:border-slate-700"
          >
            <option value="">All types</option>
            <option value="house">House</option>
            <option value="parcel">Parcel</option>
            <option value="car">Car</option>
            <option value="business_ad">Business Ad</option>
          </select>

          <select
            value={saleMode}
            onChange={(e) => setSaleMode(e.target.value)}
            className="rounded-2xl border border-slate-300 bg-white px-3 py-3 outline-none focus:border-slate-700"
          >
            <option value="">All sale modes</option>
            <option value="sell">Sell</option>
            <option value="rent">Rent</option>
            <option value="ads">Ads</option>
          </select>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-2xl border border-slate-300 bg-white px-3 py-3 outline-none focus:border-slate-700"
          >
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item.id} value={String(item.id)}>
                {item.name}
              </option>
            ))}
          </select>

          <Input
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            placeholder="District"
          />

          <Input
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            placeholder="Sector"
          />

          <Input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Min price"
          />

          <Input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max price"
          />

          <label className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={withDiscount}
              onChange={(e) => setWithDiscount(e.target.checked)}
              className="h-4 w-4"
            />
            With discount
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={negotiableOnly}
              onChange={(e) => setNegotiableOnly(e.target.checked)}
              className="h-4 w-4"
            />
            Negotiable only
          </label>
        </div>

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Reset
          </button>
        </div>
      </Card>

      {interestMessage && (
        <Card className="border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm text-slate-700">{interestMessage}</p>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          {isLoading ? "Loading..." : `${listings.length} listing(s) found`}
        </p>

        {!isLoading && listings.length > 0 && (
          <p className="text-sm text-slate-500">
            Page {currentPage} of {totalPages}
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <div className="mb-4 h-56 rounded-2xl bg-slate-200" />
              <div className="space-y-3">
                <div className="h-5 w-2/3 rounded bg-slate-200" />
                <div className="h-4 w-1/2 rounded bg-slate-200" />
                <div className="h-4 w-full rounded bg-slate-200" />
                <div className="h-4 w-5/6 rounded bg-slate-200" />
              </div>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Card>
          <p className="text-red-600">Unable to load listings.</p>
        </Card>
      ) : listings.length === 0 ? (
        <Card>
          <div className="py-10 text-center">
            <h2 className="text-xl font-semibold text-slate-900">No listings found</h2>
            <p className="mt-2 text-slate-600">
              Try changing your search or filters.
            </p>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 2xl:grid-cols-3">
            {paginatedListings.map((item) => {
              const coverImage =
                item.images?.find((img) => img.is_cover)?.image ||
                item.images?.[0]?.image ||
                "";

              const carSummary =
                item.listing_type === "car"
                  ? [item.car_make, item.car_model, item.car_year].filter(Boolean).join(" • ")
                  : "";

              const mileage =
                item.listing_type === "car" ? formatMileage(item.car_mileage) : "";

              const isInterestUpdating =
                toggleInterestMutation.isPending &&
                toggleInterestMutation.variables === item.id;

              return (
                <Card
                  key={item.id}
                  className="h-full overflow-hidden p-0 shadow-sm transition hover:shadow-xl"
                >
                  <Link to={`/listings/${item.id}`} className="block">
                    <div className="h-56 w-full bg-slate-200">
                      {coverImage ? (
                        <img
                          src={coverImage}
                          alt={item.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-200 to-slate-100 text-center text-slate-500">
                          No Image
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="p-5">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                          {getListingIcon(item.listing_type)}
                          {getListingLabel(item.listing_type)}
                        </span>

                        {item.sale_mode && (
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                            {item.sale_mode === "sell"
                              ? "For Sale"
                              : item.sale_mode === "rent"
                              ? "For Rent"
                              : "Advertisement"}
                          </span>
                        )}

                        {isAdmin === true && item.visibility_status && (
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              item.visibility_status === "active"
                                ? "bg-green-50 text-green-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {item.visibility_status === "active" ? "Active" : "Inactive"}
                          </span>
                        )}
                      </div>
                    </div>

                    <Link to={`/listings/${item.id}`} className="block">
                      <h2 className="line-clamp-2 text-lg font-semibold text-slate-900 hover:text-slate-700">
                        {item.title}
                      </h2>
                    </Link>

                    {item.listing_type === "car" && carSummary && (
                      <p className="mt-2 text-sm font-medium text-slate-700">
                        {carSummary}
                      </p>
                    )}

                    <div className="mt-2 flex items-start gap-2 text-sm text-slate-500">
                      <MapPin size={16} className="mt-0.5 shrink-0" />
                      <span className="line-clamp-2">
                        {item.address ||
                          [item.district, item.sector].filter(Boolean).join(", ")}
                      </span>
                    </div>

                    {item.listing_type === "car" && mileage && (
                      <p className="mt-2 text-sm text-slate-500">{mileage}</p>
                    )}

                    <p className="mt-3 line-clamp-2 text-sm text-slate-600">
                      {item.description}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 font-medium">
                        <Eye size={14} />
                        {formatNumber(item.views_count || 0)} Impressions
                      </span>

                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 font-medium text-amber-700">
                        <Star size={14} />
                        {formatNumber(item.interested_count || 0)} Interested
                      </span>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3">
                      <div>
                        {item.discount_price && Number(item.discount_price) > 0 ? (
                          <div className="flex flex-col">
                            <span className="text-[16px] text-slate-400 line-through">
                              {item.sale_mode === "rent"
                                ? `RWF ${formatPrice(item.price)} / month`
                                : `RWF ${formatPrice(item.price)}`}
                            </span>

                            <span className="text-[16px] font-bold text-green-600">
                              {item.sale_mode === "rent"
                                ? `${formatRWF(item.discount_price)} / month`
                                : formatRWF(item.discount_price)}
                            </span>
                          </div>
                        ) : (
                          <p className="text-[16px] font-bold text-slate-900">
                            {item.sale_mode === "rent"
                              ? `RWF ${formatPrice(item.price)} / month`
                              : `RWF ${formatPrice(item.price)}`}
                          </p>
                        )}

                        {item.negotiable && (
                          <span className="mt-1 inline-block rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-blue-700">
                            Negotiable
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setInterestMessage("");
                            toggleInterestMutation.mutate(item.id);
                          }}
                          disabled={isInterestUpdating}
                          className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                            item.has_interested
                              ? "bg-amber-500 text-white hover:bg-amber-600"
                              : "border border-amber-300 bg-white text-amber-700 hover:bg-amber-50"
                          } disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                          <Star size={14} />
                          {isInterestUpdating
                            ? "Saving..."
                            : item.has_interested
                            ? "Interested ✓"
                            : "Interested"}
                        </button>

                        <Link
                          to={`/listings/${item.id}`}
                          className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                        >
                          Details
                        </Link>

                        {isAdmin === true && (
                          <Link
                            to={`/listings/${item.id}/edit`}
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-400 px-3 py-2 text-sm font-medium text-white transition hover:opacity-90"
                          >
                            <Pencil size={14} />
                            Edit
                          </Link>
                        )}

                        {isAdmin === true && item.visibility_status === "active" && (
                          <button
                            type="button"
                            onClick={() => hideMutation.mutate(item.id)}
                            disabled={hideMutation.isPending}
                            className="rounded-xl bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                          >
                            Hide
                          </button>
                        )}

                        {isAdmin === true && item.visibility_status === "inactive" && (
                          <button
                            type="button"
                            onClick={() => unhideMutation.mutate(item.id)}
                            disabled={unhideMutation.isPending}
                            className="rounded-xl bg-green-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-50"
                          >
                            Unhide
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    currentPage === page
                      ? "bg-slate-900 text-white"
                      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}