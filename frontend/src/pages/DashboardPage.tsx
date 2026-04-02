import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, Phone, Eye, PhoneCall, MessageCircle, Shield } from "lucide-react";
import PageContainer from "../components/layout/PageContainer";
import Card from "../components/ui/Card";
import { api } from "../lib/api";

type Listing = {
  id: string;
  title: string;
  district?: string;
  sector?: string;
  status?: "pending" | "approved" | "rejected";
  visibility_status?: "active" | "inactive";
  price?: string | number;
  contact_phone?: string;
  created_at?: string;
  views_count?: number;
  call_clicks?: number;
  whatsapp_clicks?: number;
  category?: string | number | null;
};

type CurrentUser = {
  id: number | string;
  email?: string;
  is_staff?: boolean;
  is_superuser?: boolean;
};

type SellerStats = {
  total_listings: number;
  active_listings: number;
  approved_listings: number;
  pending_listings: number;
  rejected_listings: number;
  total_views: number;
  total_call_clicks: number;
  total_whatsapp_clicks: number;
  top_listing?: {
    id: string | number;
    title: string;
    views_count: number;
    call_clicks: number;
    whatsapp_clicks: number;
  } | null;
};

type AdminOverview = {
  total_listings: number;
  approved_listings: number;
  pending_listings: number;
  rejected_listings: number;
  active_listings: number;
  inactive_listings: number;
  total_views: number;
  total_call_clicks: number;
  total_whatsapp_clicks: number;
};

type PopularCategory = {
  category__id: number | string;
  category__name: string;
  total_listings: number;
  total_views: number;
};

const ITEMS_PER_PAGE = 8;

function formatPrice(value?: string | number) {
  return new Intl.NumberFormat("en-RW").format(Number(value || 0));
}

function getStatusBadgeClass(status?: string) {
  if (status === "approved") return "bg-green-100 text-green-700";
  if (status === "pending") return "bg-yellow-100 text-yellow-700";
  if (status === "rejected") return "bg-red-100 text-red-700";
  return "bg-slate-100 text-slate-700";
}

function getVisibilityBadgeClass(status?: string) {
  if (status === "active") return "bg-blue-100 text-blue-700";
  if (status === "inactive") return "bg-slate-200 text-slate-600";
  return "bg-slate-100 text-slate-700";
}

export default function DashboardPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");

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

  const isAdmin = !!(currentUser?.is_staff || currentUser?.is_superuser);

  const { data: listings = [], isLoading } = useQuery<Listing[]>({
    queryKey: ["my-listings"],
    queryFn: async () => {
      const res = await api.get("/listings/?mine=1");
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    },
  });

  const { data: sellerStats, isLoading: loadingSellerStats } = useQuery<SellerStats>({
    queryKey: ["seller-dashboard-stats"],
    queryFn: async () => (await api.get("/analytics/seller-stats/")).data,
    enabled: !isAdmin,
  });

  const { data: adminOverview, isLoading: loadingAdminOverview } = useQuery<AdminOverview>({
    queryKey: ["admin-dashboard-overview"],
    queryFn: async () => (await api.get("/analytics/admin-overview/")).data,
    enabled: isAdmin,
  });

  const { data: popularCategories = [], isLoading: loadingPopularCategories } = useQuery<
    PopularCategory[]
  >({
    queryKey: ["popular-categories"],
    queryFn: async () => {
      const res = await api.get("/analytics/popular-categories/");
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    },
  });

  const filteredData = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return listings;

    return listings.filter((item) => {
      const text = `${item.title || ""} ${item.district || ""} ${item.sector || ""} ${
        item.contact_phone || ""
      } ${item.status || ""} ${item.visibility_status || ""}`.toLowerCase();

      return text.includes(term);
    });
  }, [listings, search]);

  const total = listings.length;
  const pending = listings.filter((x) => x.status === "pending").length;
  const published = listings.filter((x) => x.status === "approved").length;
  const rejected = listings.filter((x) => x.status === "rejected").length;

  const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <PageContainer>
        <div className="py-10">
          <div className="mb-6 flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900">
              {isAdmin ? "Admin Dashboard" : "Seller Dashboard"}
            </h1>
            {isAdmin && (
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                <Shield size={14} />
                Admin
              </span>
            )}
          </div>

          {isAdmin ? (
            <>
              <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card>
                  <p className="text-sm text-slate-500">Total Listings</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {loadingAdminOverview ? "..." : adminOverview?.total_listings ?? 0}
                  </p>
                </Card>

                <Card>
                  <p className="text-sm text-slate-500">Approved Listings</p>
                  <p className="mt-2 text-3xl font-bold text-green-600">
                    {loadingAdminOverview ? "..." : adminOverview?.approved_listings ?? 0}
                  </p>
                </Card>

                <Card>
                  <p className="text-sm text-slate-500">Pending Listings</p>
                  <p className="mt-2 text-3xl font-bold text-yellow-600">
                    {loadingAdminOverview ? "..." : adminOverview?.pending_listings ?? 0}
                  </p>
                </Card>

                <Card>
                  <p className="text-sm text-slate-500">Rejected Listings</p>
                  <p className="mt-2 text-3xl font-bold text-red-600">
                    {loadingAdminOverview ? "..." : adminOverview?.rejected_listings ?? 0}
                  </p>
                </Card>
              </div>

              <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Eye size={16} />
                    <p className="text-sm">Total Views</p>
                  </div>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {loadingAdminOverview ? "..." : adminOverview?.total_views ?? 0}
                  </p>
                </Card>

                <Card>
                  <div className="flex items-center gap-2 text-slate-500">
                    <PhoneCall size={16} />
                    <p className="text-sm">Call Clicks</p>
                  </div>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {loadingAdminOverview ? "..." : adminOverview?.total_call_clicks ?? 0}
                  </p>
                </Card>

                <Card>
                  <div className="flex items-center gap-2 text-slate-500">
                    <MessageCircle size={16} />
                    <p className="text-sm">WhatsApp Clicks</p>
                  </div>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {loadingAdminOverview ? "..." : adminOverview?.total_whatsapp_clicks ?? 0}
                  </p>
                </Card>

                <Card>
                  <p className="text-sm text-slate-500">Inactive Listings</p>
                  <p className="mt-2 text-3xl font-bold text-slate-700">
                    {loadingAdminOverview ? "..." : adminOverview?.inactive_listings ?? 0}
                  </p>
                </Card>
              </div>

              <Card>
                <div className="mb-5">
                  <h2 className="text-xl font-semibold text-slate-900">Popular Categories</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Most viewed categories across the platform.
                  </p>
                </div>

                {loadingPopularCategories ? (
                  <p className="text-slate-600">Loading...</p>
                ) : popularCategories.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-sm text-slate-600">No category analytics available yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead>
                        <tr className="text-left">
                          <th className="px-4 py-3 text-sm font-semibold text-slate-700">#</th>
                          <th className="px-4 py-3 text-sm font-semibold text-slate-700">
                            Category
                          </th>
                          <th className="px-4 py-3 text-sm font-semibold text-slate-700">
                            Listings
                          </th>
                          <th className="px-4 py-3 text-sm font-semibold text-slate-700">
                            Views
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {popularCategories.map((item, index) => (
                          <tr key={`${item.category__id}-${index}`}>
                            <td className="px-4 py-3 text-sm text-slate-600">{index + 1}</td>
                            <td className="px-4 py-3 text-sm font-medium text-slate-900">
                              {item.category__name || "Uncategorized"}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">
                              {item.total_listings}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">
                              {item.total_views}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </>
          ) : (
            <>
              <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card>
                  <p className="text-sm text-slate-500">Total Listings</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {loadingSellerStats ? total : sellerStats?.total_listings ?? total}
                  </p>
                </Card>

                <Card>
                  <p className="text-sm text-slate-500">Pending Review</p>
                  <p className="mt-2 text-3xl font-bold text-yellow-600">
                    {loadingSellerStats ? pending : sellerStats?.pending_listings ?? pending}
                  </p>
                </Card>

                <Card>
                  <p className="text-sm text-slate-500">Published</p>
                  <p className="mt-2 text-3xl font-bold text-green-600">
                    {loadingSellerStats ? published : sellerStats?.approved_listings ?? published}
                  </p>
                </Card>

                <Card>
                  <p className="text-sm text-slate-500">Rejected</p>
                  <p className="mt-2 text-3xl font-bold text-red-600">
                    {loadingSellerStats ? rejected : sellerStats?.rejected_listings ?? rejected}
                  </p>
                </Card>
              </div>

              <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Eye size={16} />
                    <p className="text-sm">Total Views</p>
                  </div>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {loadingSellerStats ? "..." : sellerStats?.total_views ?? 0}
                  </p>
                </Card>

                <Card>
                  <div className="flex items-center gap-2 text-slate-500">
                    <PhoneCall size={16} />
                    <p className="text-sm">Call Clicks</p>
                  </div>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {loadingSellerStats ? "..." : sellerStats?.total_call_clicks ?? 0}
                  </p>
                </Card>

                <Card>
                  <div className="flex items-center gap-2 text-slate-500">
                    <MessageCircle size={16} />
                    <p className="text-sm">WhatsApp Clicks</p>
                  </div>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {loadingSellerStats ? "..." : sellerStats?.total_whatsapp_clicks ?? 0}
                  </p>
                </Card>

                <Card>
                  <p className="text-sm text-slate-500">Active Listings</p>
                  <p className="mt-2 text-3xl font-bold text-blue-700">
                    {loadingSellerStats ? "..." : sellerStats?.active_listings ?? 0}
                  </p>
                </Card>
              </div>

              {sellerStats?.top_listing && (
                <Card className="mb-6">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">Top Performing Listing</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Your best listing by views.
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="font-semibold text-slate-900">
                        {sellerStats.top_listing.title}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-600">
                        <span>{sellerStats.top_listing.views_count} views</span>
                        <span>{sellerStats.top_listing.call_clicks} calls</span>
                        <span>{sellerStats.top_listing.whatsapp_clicks} WhatsApp</span>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              <Card>
                <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">My Listings</h2>
                    {!isLoading && (
                      <p className="mt-1 text-sm text-slate-500">
                        {filteredData.length} listing{filteredData.length !== 1 ? "s" : ""} found
                      </p>
                    )}
                  </div>

                  <div className="relative w-full md:w-80">
                    <Search
                      size={18}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Search listings..."
                      className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-slate-700"
                    />
                  </div>
                </div>

                {isLoading ? (
                  <p className="text-slate-600">Loading...</p>
                ) : filteredData.length === 0 ? (
                  <div className="py-10 text-center">
                    <h3 className="text-lg font-semibold text-slate-900">No listings found</h3>
                    <p className="mt-2 text-sm text-slate-600">Try another search term.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {paginatedData.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                        >
                          <div className="flex flex-col gap-3 md:gap-2">
                            <div className="flex items-center justify-between gap-3">
                              <h3 className="truncate text-base font-semibold text-slate-900">
                                {item.title}
                              </h3>

                              <div className="flex items-center gap-2 shrink-0">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${getStatusBadgeClass(
                                    item.status
                                  )}`}
                                >
                                  {item.status || "unknown"}
                                </span>

                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${getVisibilityBadgeClass(
                                    item.visibility_status
                                  )}`}
                                >
                                  {item.visibility_status || "unknown"}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                              <div className="flex flex-col gap-1 text-sm text-slate-500">
                                <div className="flex items-center gap-2">
                                  <MapPin size={14} className="shrink-0" />
                                  <span>
                                    {[item.district, item.sector].filter(Boolean).join(" • ") ||
                                      "No location"}
                                  </span>
                                </div>

                                {item.contact_phone && (
                                  <a
                                    href={`tel:${item.contact_phone}`}
                                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
                                  >
                                    <Phone size={14} className="shrink-0 text-rose-500" />
                                    {item.contact_phone}
                                  </a>
                                )}

                                <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-600">
                                  <span className="inline-flex items-center gap-1">
                                    <Eye size={14} />
                                    {item.views_count ?? 0} views
                                  </span>
                                  <span className="inline-flex items-center gap-1">
                                    <PhoneCall size={14} />
                                    {item.call_clicks ?? 0} calls
                                  </span>
                                  <span className="inline-flex items-center gap-1">
                                    <MessageCircle size={14} />
                                    {item.whatsapp_clicks ?? 0} WhatsApp
                                  </span>
                                </div>
                              </div>

                              <div className="shrink-0 text-right">
                                <p className="text-xl font-bold text-slate-900">
                                  RWF {formatPrice(item.price)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {totalPages > 1 && (
                      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => goToPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Previous
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            type="button"
                            onClick={() => goToPage(page)}
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
                          onClick={() => goToPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
              </Card>
            </>
          )}
        </div>
      </PageContainer>
    </div>
  );
}