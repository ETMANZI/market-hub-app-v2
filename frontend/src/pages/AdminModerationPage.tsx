import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  BarChart3,
  CalendarDays,
  Edit3,
  FolderTree,
  Layers3,
  Plus,
  Tag,
  Trash2,
  Users,
} from "lucide-react";
import PageContainer from "../components/layout/PageContainer";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { api } from "../lib/api";

type ListingImage = {
  id: string | number;
  image: string;
  is_cover?: boolean;
};

type ModerationListing = {
  id: string;
  title: string;
  listing_type: string;
  district?: string;
  sector?: string;
  price?: string | number;
  owner_email?: string;
  description?: string;
  images?: ListingImage[];
};

type Category = {
  id: string | number;
  name: string;
  slug: string;
  parent?: string | number | null;
};

type Partner = {
  id: string | number;
  name: string;
  logo?: string | null;
  website?: string | null;
  description?: string;
  is_active: boolean;
};

type PromoBanner = {
  id: string | number;
  title?: string;
  media_type: "video" | "image" | "gif";
  file_url: string;
  target_url?: string | null;
  is_active: boolean;
  created_at?: string;
};

type AdminUser = {
  id: string | number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
};

type NonAdminUser = {
  id: string | number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
  date_joined?: string;
};

type VisitorStatsResponse = {
  total_visits?: number;
  unique_visitors?: number;
  today_visits?: number;
  this_month_visits?: number;
  daily?: { period: string; total: number }[];
  monthly?: { period: string; total: number }[];
};

function formatPrice(value?: string | number) {
  return new Intl.NumberFormat("en-RW").format(Math.round(Number(value || 0)));
}

function formatNumber(value?: string | number) {
  return new Intl.NumberFormat("en-RW").format(Number(value || 0));
}

function extractErrorMessage(err: any, fallback = "Something went wrong.") {
  const data = err?.response?.data;
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;

  const messages: string[] = [];
  Object.entries(data).forEach(([field, value]) => {
    if (Array.isArray(value)) messages.push(`${field}: ${value.join(", ")}`);
    else if (typeof value === "string") messages.push(`${field}: ${value}`);
  });

  return messages.length ? messages.join(" | ") : fallback;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function formatDate(value?: string) {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString("en-RW", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getDisplayName(user: {
  username: string;
  first_name?: string;
  last_name?: string;
}) {
  const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
  return fullName || user.username;
}

function formatTrafficDate(value: string) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-RW", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTrafficMonth(value: string) {
  if (!value) return "-";

  if (/^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);

    return date.toLocaleDateString("en-RW", {
      year: "numeric",
      month: "short",
    });
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-RW", {
    year: "numeric",
    month: "short",
  });
}

function StatMiniCard({
  title,
  value,
  icon,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">{icon}</div>
      </div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h3 className="mt-2 text-3xl font-bold text-slate-900">{formatNumber(value)}</h3>
      {subtitle && <p className="mt-2 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: (number | string)[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);

    if (currentPage > 3) pages.push("...");

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) pages.push(i);

    if (currentPage < totalPages - 2) pages.push("...");

    pages.push(totalPages);
  }

  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Previous
      </button>

      {pages.map((page, index) =>
        page === "..." ? (
          <span key={`ellipsis-${index}`} className="px-2 text-slate-500">
            ...
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(Number(page))}
            className={`rounded-xl px-3 py-2 text-sm font-medium ${
              currentPage === page
                ? "bg-slate-900 text-white"
                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            {page}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}

type ActiveTab =
  | "moderation"
  | "categories"
  | "visitor_stats"
  | "partners"
  | "video_banners"
  | "admin_users"
  | "non_admin_users";

export default function AdminModerationPage() {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<ActiveTab>("moderation");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | number | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategorySlug, setNewCategorySlug] = useState("");
  const [newCategoryParent, setNewCategoryParent] = useState<string>("");
  const [categoryError, setCategoryError] = useState("");
  const [categorySuccess, setCategorySuccess] = useState("");

  const [editingPartnerId, setEditingPartnerId] = useState<string | number | null>(null);
  const [partnerName, setPartnerName] = useState("");
  const [partnerWebsite, setPartnerWebsite] = useState("");
  const [partnerDescription, setPartnerDescription] = useState("");
  const [partnerIsActive, setPartnerIsActive] = useState(true);
  const [partnerLogo, setPartnerLogo] = useState<File | null>(null);
  const [partnerError, setPartnerError] = useState("");
  const [partnerSuccess, setPartnerSuccess] = useState("");

  const [editingBannerId, setEditingBannerId] = useState<string | number | null>(null);
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerTargetUrl, setBannerTargetUrl] = useState("");
  const [bannerIsActive, setBannerIsActive] = useState(true);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerError, setBannerError] = useState("");
  const [bannerSuccess, setBannerSuccess] = useState("");

  const [editingAdminUserId, setEditingAdminUserId] = useState<string | number | null>(null);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminFirstName, setAdminFirstName] = useState("");
  const [adminLastName, setAdminLastName] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminConfirmPassword, setAdminConfirmPassword] = useState("");
  const [adminIsActive, setAdminIsActive] = useState(true);
  const [adminIsSuperuser, setAdminIsSuperuser] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [adminSuccess, setAdminSuccess] = useState("");

  const [nonAdminUserError, setNonAdminUserError] = useState("");
  const [nonAdminUserSuccess, setNonAdminUserSuccess] = useState("");
  const [nonAdminSearch, setNonAdminSearch] = useState("");
  const [nonAdminPage, setNonAdminPage] = useState(1);
  const NON_ADMIN_USERS_PER_PAGE = 10;

  const [recentDailyPage, setRecentDailyPage] = useState(1);
  const [dailyBreakdownPage, setDailyBreakdownPage] = useState(1);
  const [monthlyPerformancePage, setMonthlyPerformancePage] = useState(1);

  const RECENT_DAILY_PER_PAGE = 7;
  const DAILY_BREAKDOWN_PER_PAGE = 10;
  const MONTHLY_PERFORMANCE_PER_PAGE = 10;

  const { data: moderationData = [], isLoading: isLoadingModeration } = useQuery<ModerationListing[]>({
    queryKey: ["all-moderation-listings"],
    queryFn: async () => (await api.get("/listings/?status=pending")).data,
  });

  const { data: categoryData = [], isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ["categories-admin"],
    queryFn: async () => {
      const res = await api.get("/categories/");
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    },
  });

  const { data: visitorStats, isLoading: isLoadingStats } = useQuery<VisitorStatsResponse>({
    queryKey: ["visitor-stats"],
    queryFn: async () => (await api.get("/moderation/visitor-stats/")).data,
    enabled: activeTab === "visitor_stats",
  });

  const { data: partnersData = [], isLoading: isLoadingPartners } = useQuery<Partner[]>({
    queryKey: ["partners-admin"],
    queryFn: async () => {
      const res = await api.get("/partners/");
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    },
    enabled: activeTab === "partners",
  });

  const { data: promoBannersData = [], isLoading: isLoadingPromoBanners } = useQuery<PromoBanner[]>({
    queryKey: ["promo-banners-admin"],
    queryFn: async () => {
      const res = await api.get("/promo-banners/");
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    },
    enabled: activeTab === "video_banners",
  });

  const { data: adminUsersData = [], isLoading: isLoadingAdminUsers } = useQuery<AdminUser[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await api.get("/accounts/admin-users/");
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    },
    enabled: activeTab === "admin_users",
  });

  const { data: nonAdminUsersData = [], isLoading: isLoadingNonAdminUsers } = useQuery<NonAdminUser[]>({
    queryKey: ["non-admin-users"],
    queryFn: async () => {
      const res = await api.get("/accounts/non-admin-users/");
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    },
    enabled: activeTab === "non_admin_users",
  });

  const approveMutation = useMutation({
    mutationFn: async (listingId: string) => {
      await api.post(`/listings/${listingId}/approve/`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["all-moderation-listings"] });
      await queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({
      listingId,
      reason,
    }: {
      listingId: string;
      reason: string;
    }) => {
      await api.post(`/listings/${listingId}/reject/`, { reason });
    },
    onSuccess: async () => {
      setRejectingId(null);
      setRejectReason("");
      await queryClient.invalidateQueries({ queryKey: ["all-moderation-listings"] });
      await queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (payload: { name: string; slug: string; parent: string | null }) => {
      const res = await api.post("/categories/", payload);
      return res.data;
    },
    onSuccess: async () => {
      resetCategoryForm();
      setCategorySuccess("Category created successfully.");
      await queryClient.invalidateQueries({ queryKey: ["categories-admin"] });
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (err: any) => {
      setCategorySuccess("");
      setCategoryError(extractErrorMessage(err, "Failed to create category."));
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async (payload: {
      id: string | number;
      name: string;
      slug: string;
      parent: string | null;
    }) => {
      const res = await api.patch(`/categories/${payload.id}/`, {
        name: payload.name,
        slug: payload.slug,
        parent: payload.parent,
      });
      return res.data;
    },
    onSuccess: async () => {
      resetCategoryForm();
      setCategorySuccess("Category updated successfully.");
      await queryClient.invalidateQueries({ queryKey: ["categories-admin"] });
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (err: any) => {
      setCategorySuccess("");
      setCategoryError(extractErrorMessage(err, "Failed to update category."));
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string | number) => {
      await api.delete(`/categories/${categoryId}/`);
    },
    onSuccess: async () => {
      if (editingCategoryId) resetCategoryForm();
      setCategorySuccess("Category deleted successfully.");
      await queryClient.invalidateQueries({ queryKey: ["categories-admin"] });
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (err: any) => {
      setCategorySuccess("");
      setCategoryError(extractErrorMessage(err, "Failed to delete category."));
    },
  });

  const createPartnerMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("name", partnerName.trim());
      formData.append("website", partnerWebsite.trim());
      formData.append("description", partnerDescription.trim());
      formData.append("is_active", String(partnerIsActive));

      if (partnerLogo) formData.append("logo", partnerLogo);

      const res = await api.post("/partners/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: async () => {
      resetPartnerForm();
      setPartnerSuccess("Partner registered successfully.");
      await queryClient.invalidateQueries({ queryKey: ["partners-admin"] });
    },
    onError: (err: any) => {
      setPartnerSuccess("");
      setPartnerError(extractErrorMessage(err, "Failed to register partner."));
    },
  });

  const updatePartnerMutation = useMutation({
    mutationFn: async () => {
      if (!editingPartnerId) throw new Error("No partner selected for editing.");

      const formData = new FormData();
      formData.append("name", partnerName.trim());
      formData.append("website", partnerWebsite.trim());
      formData.append("description", partnerDescription.trim());
      formData.append("is_active", String(partnerIsActive));

      if (partnerLogo) formData.append("logo", partnerLogo);

      const res = await api.patch(`/partners/${editingPartnerId}/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: async () => {
      resetPartnerForm();
      setPartnerSuccess("Partner updated successfully.");
      await queryClient.invalidateQueries({ queryKey: ["partners-admin"] });
    },
    onError: (err: any) => {
      setPartnerSuccess("");
      setPartnerError(extractErrorMessage(err, "Failed to update partner."));
    },
  });

  const togglePartnerStatusMutation = useMutation({
    mutationFn: async (partner: Partner) => {
      const formData = new FormData();
      formData.append("name", partner.name || "");
      formData.append("website", partner.website || "");
      formData.append("description", partner.description || "");
      formData.append("is_active", String(!partner.is_active));

      const res = await api.patch(`/partners/${partner.id}/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["partners-admin"] });
      await queryClient.invalidateQueries({ queryKey: ["partners"] });
    },
    onError: (err: any) => {
      setPartnerSuccess("");
      setPartnerError(extractErrorMessage(err, "Failed to update partner status."));
    },
  });

  const createPromoBannerMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("title", bannerTitle.trim());
      formData.append("media_type", "video");
      formData.append("target_url", bannerTargetUrl.trim());
      formData.append("is_active", String(bannerIsActive));

      if (bannerFile) formData.append("file", bannerFile);

      const res = await api.post("/promo-banners/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: async () => {
      resetBannerForm();
      setBannerSuccess("Banner video uploaded successfully.");
      await queryClient.invalidateQueries({ queryKey: ["promo-banners-admin"] });
      await queryClient.invalidateQueries({ queryKey: ["promo-banners"] });
    },
    onError: (err: any) => {
      setBannerSuccess("");
      setBannerError(extractErrorMessage(err, "Failed to upload banner video."));
    },
  });

  const updatePromoBannerMutation = useMutation({
    mutationFn: async () => {
      if (!editingBannerId) throw new Error("No banner selected for editing.");

      const formData = new FormData();
      formData.append("title", bannerTitle.trim());
      formData.append("media_type", "video");
      formData.append("target_url", bannerTargetUrl.trim());
      formData.append("is_active", String(bannerIsActive));

      if (bannerFile) formData.append("file", bannerFile);

      const res = await api.patch(`/promo-banners/${editingBannerId}/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: async () => {
      resetBannerForm();
      setBannerSuccess("Banner video updated successfully.");
      await queryClient.invalidateQueries({ queryKey: ["promo-banners-admin"] });
      await queryClient.invalidateQueries({ queryKey: ["promo-banners"] });
    },
    onError: (err: any) => {
      setBannerSuccess("");
      setBannerError(extractErrorMessage(err, "Failed to update banner video."));
    },
  });

  const togglePromoBannerStatusMutation = useMutation({
    mutationFn: async (banner: PromoBanner) => {
      const formData = new FormData();
      formData.append("title", banner.title || "");
      formData.append("media_type", "video");
      formData.append("target_url", banner.target_url || "");
      formData.append("is_active", String(!banner.is_active));

      const res = await api.patch(`/promo-banners/${banner.id}/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["promo-banners-admin"] });
      await queryClient.invalidateQueries({ queryKey: ["promo-banners"] });
    },
    onError: (err: any) => {
      setBannerSuccess("");
      setBannerError(extractErrorMessage(err, "Failed to update banner status."));
    },
  });

  const deletePromoBannerMutation = useMutation({
    mutationFn: async (bannerId: string | number) => {
      await api.delete(`/promo-banners/${bannerId}/`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["promo-banners-admin"] });
      await queryClient.invalidateQueries({ queryKey: ["promo-banners"] });
    },
    onError: (err: any) => {
      setBannerSuccess("");
      setBannerError(extractErrorMessage(err, "Failed to delete banner."));
    },
  });

  const createAdminUserMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        username: adminUsername.trim(),
        email: adminEmail.trim(),
        first_name: adminFirstName.trim(),
        last_name: adminLastName.trim(),
        password: adminPassword,
        confirm_password: adminConfirmPassword,
        is_active: adminIsActive,
        is_staff: true,
        is_superuser: adminIsSuperuser,
      };

      const res = await api.post("/accounts/admin-users/", payload);
      return res.data;
    },
    onSuccess: async () => {
      resetAdminForm();
      setAdminSuccess("Admin user created successfully.");
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: any) => {
      setAdminSuccess("");
      setAdminError(extractErrorMessage(err, "Failed to create admin user."));
    },
  });

  const updateAdminUserMutation = useMutation({
    mutationFn: async () => {
      if (!editingAdminUserId) throw new Error("No admin user selected for editing.");

      const payload: any = {
        username: adminUsername.trim(),
        email: adminEmail.trim(),
        first_name: adminFirstName.trim(),
        last_name: adminLastName.trim(),
        is_active: adminIsActive,
        is_superuser: adminIsSuperuser,
      };

      if (adminPassword.trim()) {
        payload.password = adminPassword;
        payload.confirm_password = adminConfirmPassword;
      }

      const res = await api.patch(`/accounts/admin-users/${editingAdminUserId}/`, payload);
      return res.data;
    },
    onSuccess: async () => {
      resetAdminForm();
      setAdminSuccess("Admin user updated successfully.");
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: any) => {
      setAdminSuccess("");
      setAdminError(extractErrorMessage(err, "Failed to update admin user."));
    },
  });

  const toggleAdminUserStatusMutation = useMutation({
    mutationFn: async (user: AdminUser) => {
      const payload = {
        username: user.username,
        email: user.email,
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        is_active: !user.is_active,
        is_superuser: !!user.is_superuser,
      };

      const res = await api.patch(`/accounts/admin-users/${user.id}/`, payload);
      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: any) => {
      setAdminSuccess("");
      setAdminError(extractErrorMessage(err, "Failed to update user status."));
    },
  });

  const toggleNonAdminUserStatusMutation = useMutation({
    mutationFn: async (user: NonAdminUser) => {
      const payload = { is_active: !user.is_active };
      const res = await api.patch(`/accounts/non-admin-users/${user.id}/`, payload);
      return res.data;
    },
    onSuccess: async (_data, user) => {
      setNonAdminUserError("");
      setNonAdminUserSuccess(
        `${getDisplayName(user)} has been ${user.is_active ? "deactivated" : "activated"} successfully.`
      );
      await queryClient.invalidateQueries({ queryKey: ["non-admin-users"] });
    },
    onError: (err: any) => {
      setNonAdminUserSuccess("");
      setNonAdminUserError(extractErrorMessage(err, "Failed to update user status."));
    },
  });

  const sortedCategories = useMemo(() => {
    return [...categoryData].sort((a, b) => a.name.localeCompare(b.name));
  }, [categoryData]);

  const parentCategories = useMemo(() => {
    return sortedCategories.filter((cat) => !cat.parent);
  }, [sortedCategories]);

  const childCategories = useMemo(() => {
    return sortedCategories.filter((cat) => !!cat.parent);
  }, [sortedCategories]);

  const getParentName = (parentId: string | number | null | undefined) => {
    if (!parentId) return "-";
    const parent = sortedCategories.find((cat) => String(cat.id) === String(parentId));
    return parent?.name || "-";
  };

  const categorySummary = useMemo(() => {
    return {
      total: sortedCategories.length,
      main: parentCategories.length,
      sub: childCategories.length,
    };
  }, [sortedCategories, parentCategories, childCategories]);

  const filteredNonAdminUsers = useMemo(() => {
    const search = nonAdminSearch.trim().toLowerCase();

    return nonAdminUsersData
      .filter((user) => !user.is_staff && !user.is_superuser)
      .filter((user) => {
        if (!search) return true;

        const haystack = [
          user.username,
          user.email,
          user.first_name,
          user.last_name,
          getDisplayName(user),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(search);
      });
  }, [nonAdminUsersData, nonAdminSearch]);

  const totalNonAdminPages = Math.max(
    1,
    Math.ceil(filteredNonAdminUsers.length / NON_ADMIN_USERS_PER_PAGE)
  );

  const paginatedNonAdminUsers = useMemo(() => {
    const start = (nonAdminPage - 1) * NON_ADMIN_USERS_PER_PAGE;
    const end = start + NON_ADMIN_USERS_PER_PAGE;
    return filteredNonAdminUsers.slice(start, end);
  }, [filteredNonAdminUsers, nonAdminPage]);

  const handleChangeNonAdminPage = (page: number) => {
    if (page < 1 || page > totalNonAdminPages) return;
    setNonAdminPage(page);
  };

  const handleSearchNonAdminUsers = (value: string) => {
    setNonAdminSearch(value);
    setNonAdminPage(1);
  };

  const dailyStats = visitorStats?.daily || [];
  const monthlyStats = visitorStats?.monthly || [];

  const recentDailyStats = useMemo(() => {
    return [...dailyStats].reverse();
  }, [dailyStats]);

  const monthlyPerformanceStats = useMemo(() => {
    return [...monthlyStats].reverse();
  }, [monthlyStats]);

  const totalRecentDailyPages = Math.max(
    1,
    Math.ceil(recentDailyStats.length / RECENT_DAILY_PER_PAGE)
  );

  const paginatedRecentDaily = useMemo(() => {
    const start = (recentDailyPage - 1) * RECENT_DAILY_PER_PAGE;
    const end = start + RECENT_DAILY_PER_PAGE;
    return recentDailyStats.slice(start, end);
  }, [recentDailyStats, recentDailyPage]);

  const totalDailyBreakdownPages = Math.max(
    1,
    Math.ceil(recentDailyStats.length / DAILY_BREAKDOWN_PER_PAGE)
  );

  const paginatedDailyBreakdown = useMemo(() => {
    const start = (dailyBreakdownPage - 1) * DAILY_BREAKDOWN_PER_PAGE;
    const end = start + DAILY_BREAKDOWN_PER_PAGE;
    return recentDailyStats.slice(start, end);
  }, [recentDailyStats, dailyBreakdownPage]);

  const totalMonthlyPerformancePages = Math.max(
    1,
    Math.ceil(monthlyPerformanceStats.length / MONTHLY_PERFORMANCE_PER_PAGE)
  );

  const paginatedMonthlyPerformance = useMemo(() => {
    const start = (monthlyPerformancePage - 1) * MONTHLY_PERFORMANCE_PER_PAGE;
    const end = start + MONTHLY_PERFORMANCE_PER_PAGE;
    return monthlyPerformanceStats.slice(start, end);
  }, [monthlyPerformanceStats, monthlyPerformancePage]);

  useEffect(() => {
    setRecentDailyPage(1);
    setDailyBreakdownPage(1);
    setMonthlyPerformancePage(1);
  }, [dailyStats, monthlyStats]);

  const startReject = (listingId: string) => {
    setRejectingId(listingId);
    setRejectReason("");
  };

  const submitReject = () => {
    if (!rejectingId) return;

    rejectMutation.mutate({
      listingId: rejectingId,
      reason: rejectReason.trim() || "Rejected by moderator",
    });
  };

  const resetCategoryForm = () => {
    setIsCategoryModalOpen(false);
    setEditingCategoryId(null);
    setNewCategoryName("");
    setNewCategorySlug("");
    setNewCategoryParent("");
    setCategoryError("");
  };

  const openCategoryModal = () => {
    setIsCategoryModalOpen(true);
    setEditingCategoryId(null);
    setNewCategoryName("");
    setNewCategorySlug("");
    setNewCategoryParent("");
    setCategoryError("");
    setCategorySuccess("");
  };

  const handleEditCategory = (category: Category) => {
    setIsCategoryModalOpen(true);
    setEditingCategoryId(category.id);
    setNewCategoryName(category.name || "");
    setNewCategorySlug(category.slug || "");
    setNewCategoryParent(category.parent ? String(category.parent) : "");
    setCategoryError("");
    setCategorySuccess("");
  };

  const handleDeleteCategory = (category: Category) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${category.name}"?`);
    if (!confirmed) return;

    setCategoryError("");
    setCategorySuccess("");
    deleteCategoryMutation.mutate(category.id);
  };

  const submitCategory = () => {
    const name = newCategoryName.trim();
    const slug = newCategorySlug.trim();

    setCategoryError("");
    setCategorySuccess("");

    if (!name) {
      setCategoryError("Category name is required.");
      return;
    }

    if (!slug) {
      setCategoryError("Slug is required.");
      return;
    }

    if (editingCategoryId && String(newCategoryParent) === String(editingCategoryId)) {
      setCategoryError("A category cannot be its own parent.");
      return;
    }

    if (editingCategoryId) {
      updateCategoryMutation.mutate({
        id: editingCategoryId,
        name,
        slug,
        parent: newCategoryParent || null,
      });
    } else {
      createCategoryMutation.mutate({
        name,
        slug,
        parent: newCategoryParent || null,
      });
    }
  };

  const resetPartnerForm = () => {
    setEditingPartnerId(null);
    setPartnerName("");
    setPartnerWebsite("");
    setPartnerDescription("");
    setPartnerIsActive(true);
    setPartnerLogo(null);
    setPartnerError("");
    setPartnerSuccess("");
  };

  const handleEditPartner = (partner: Partner) => {
    setEditingPartnerId(partner.id);
    setPartnerName(partner.name || "");
    setPartnerWebsite(partner.website || "");
    setPartnerDescription(partner.description || "");
    setPartnerIsActive(Boolean(partner.is_active));
    setPartnerLogo(null);
    setPartnerError("");
    setPartnerSuccess("");
  };

  const handleTogglePartnerStatus = (partner: Partner) => {
    setPartnerError("");
    setPartnerSuccess("");
    togglePartnerStatusMutation.mutate(partner);
  };

  const submitPartner = () => {
    setPartnerError("");
    setPartnerSuccess("");

    if (!partnerName.trim()) {
      setPartnerError("Partner name is required.");
      return;
    }

    if (!editingPartnerId && !partnerLogo) {
      setPartnerError("Partner logo is required.");
      return;
    }

    if (editingPartnerId) {
      updatePartnerMutation.mutate();
    } else {
      createPartnerMutation.mutate();
    }
  };

  const resetBannerForm = () => {
    setEditingBannerId(null);
    setBannerTitle("");
    setBannerTargetUrl("");
    setBannerIsActive(true);
    setBannerFile(null);
    setBannerError("");
    setBannerSuccess("");
  };

  const handleEditBanner = (banner: PromoBanner) => {
    setEditingBannerId(banner.id);
    setBannerTitle(banner.title || "");
    setBannerTargetUrl(banner.target_url || "");
    setBannerIsActive(!!banner.is_active);
    setBannerFile(null);
    setBannerError("");
    setBannerSuccess("");
  };

  const submitBanner = () => {
    setBannerError("");
    setBannerSuccess("");

    if (!editingBannerId && !bannerFile) {
      setBannerError("Video file is required.");
      return;
    }

    if (editingBannerId) {
      updatePromoBannerMutation.mutate();
    } else {
      createPromoBannerMutation.mutate();
    }
  };

  const resetAdminForm = () => {
    setEditingAdminUserId(null);
    setAdminUsername("");
    setAdminEmail("");
    setAdminFirstName("");
    setAdminLastName("");
    setAdminPassword("");
    setAdminConfirmPassword("");
    setAdminIsActive(true);
    setAdminIsSuperuser(false);
    setAdminError("");
    setAdminSuccess("");
  };

  const handleEditAdminUser = (user: AdminUser) => {
    setEditingAdminUserId(user.id);
    setAdminUsername(user.username || "");
    setAdminEmail(user.email || "");
    setAdminFirstName(user.first_name || "");
    setAdminLastName(user.last_name || "");
    setAdminPassword("");
    setAdminConfirmPassword("");
    setAdminIsActive(!!user.is_active);
    setAdminIsSuperuser(!!user.is_superuser);
    setAdminError("");
    setAdminSuccess("");
  };

  const submitAdminUser = () => {
    setAdminError("");
    setAdminSuccess("");

    if (!adminUsername.trim()) {
      setAdminError("Username is required.");
      return;
    }

    if (!adminEmail.trim()) {
      setAdminError("Email is required.");
      return;
    }

    if (!editingAdminUserId && !adminPassword) {
      setAdminError("Password is required.");
      return;
    }

    if (adminPassword || adminConfirmPassword) {
      if (adminPassword !== adminConfirmPassword) {
        setAdminError("Passwords do not match.");
        return;
      }
    }

    if (editingAdminUserId) {
      updateAdminUserMutation.mutate();
    } else {
      createAdminUserMutation.mutate();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <PageContainer>
        <div className="py-10">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Admin Panel</h1>
            <p className="mt-2 text-sm text-slate-500">
              Manage moderation, categories, platform users, partners, banners, and visitor analytics.
            </p>
          </div>

          <div className="mb-8 flex flex-wrap gap-3">
            {[
              { key: "moderation", label: "Moderation Queue" },
              { key: "categories", label: "Categories" },
              { key: "visitor_stats", label: "Visitor Statistics" },
              { key: "partners", label: "Partner Registration" },
              { key: "video_banners", label: "Video Banners" },
              { key: "admin_users", label: "Admin Users" },
              { key: "non_admin_users", label: "Non-Admin Users" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as ActiveTab)}
                className={`rounded-2xl px-4 py-2.5 text-sm font-medium transition ${
                  activeTab === tab.key
                    ? "bg-slate-900 text-white shadow-sm"
                    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "moderation" && (
            <>
              <h2 className="mb-6 text-2xl font-semibold text-slate-900">Moderation Queue</h2>

              {isLoadingModeration ? (
                <p className="text-slate-600">Loading...</p>
              ) : moderationData.length === 0 ? (
                <Card>
                  <div className="py-10 text-center">
                    <h2 className="text-xl font-semibold text-slate-900">No pending listings</h2>
                    <p className="mt-2 text-slate-600">Everything is up to date.</p>
                  </div>
                </Card>
              ) : (
                <div className="space-y-5">
                  {moderationData.map((item) => {
                    const coverImage =
                      item.images?.find((img) => img.is_cover)?.image ||
                      item.images?.[0]?.image ||
                      "";

                    const isRejectingThis = rejectingId === item.id;

                    return (
                      <Card key={item.id}>
                        <div className="grid gap-4 md:grid-cols-[180px_1fr_auto] md:items-start">
                          <div className="overflow-hidden rounded-2xl bg-slate-100">
                            {coverImage ? (
                              <img
                                src={coverImage}
                                alt={item.title}
                                className="h-36 w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-36 items-center justify-center text-sm text-slate-500">
                                No Image
                              </div>
                            )}
                          </div>

                          <div>
                            <h2 className="text-lg font-semibold text-slate-900">{item.title}</h2>

                            <p className="mt-1 text-sm text-slate-500">
                              {item.listing_type} • {item.district || "N/A"} • {item.sector || "N/A"}
                            </p>

                            <p className="mt-2 text-base font-semibold text-slate-900">
                              RWF {formatPrice(item.price)}
                            </p>

                            {item.owner_email && (
                              <p className="mt-2 text-sm text-slate-600">Owner: {item.owner_email}</p>
                            )}

                            {item.description && (
                              <p className="mt-3 line-clamp-3 text-sm text-slate-600">
                                {item.description}
                              </p>
                            )}

                            {isRejectingThis && (
                              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                  Reject reason
                                </label>

                                <textarea
                                  value={rejectReason}
                                  onChange={(e) => setRejectReason(e.target.value)}
                                  placeholder="Why is this listing being rejected?"
                                  className="min-h-24 w-full rounded-2xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-700"
                                />

                                <div className="mt-3 flex flex-wrap gap-3">
                                  <Button
                                    className="bg-red-600"
                                    onClick={submitReject}
                                    disabled={rejectMutation.isPending}
                                  >
                                    {rejectMutation.isPending ? "Rejecting..." : "Confirm Reject"}
                                  </Button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRejectingId(null);
                                      setRejectReason("");
                                    }}
                                    className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-3">
                            <Button
                              className="bg-green-600"
                              onClick={() => approveMutation.mutate(item.id)}
                              disabled={approveMutation.isPending}
                            >
                              {approveMutation.isPending ? "Approving..." : "Approve"}
                            </Button>

                            {!isRejectingThis && (
                              <Button className="bg-red-600" onClick={() => startReject(item.id)}>
                                Reject
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {activeTab === "categories" && (
            <>
              <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">Categories</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Manage main categories and subcategories with a cleaner admin view.
                  </p>
                </div>

                <Button onClick={openCategoryModal} className="inline-flex items-center gap-2">
                  <Plus size={16} />
                  Add New Category
                </Button>
              </div>

              {categoryError && (
                <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {categoryError}
                </div>
              )}

              {categorySuccess && (
                <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {categorySuccess}
                </div>
              )}

              {isLoadingCategories ? (
                <p className="text-slate-600">Loading categories...</p>
              ) : sortedCategories.length === 0 ? (
                <Card>
                  <div className="py-10 text-center">
                    <h3 className="text-xl font-semibold text-slate-900">No categories found</h3>
                    <p className="mt-2 text-slate-600">Start by adding your first category.</p>
                  </div>
                </Card>
              ) : (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-500">Total Categories</p>
                          <p className="mt-2 text-3xl font-bold text-slate-900">
                            {formatNumber(categorySummary.total)}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                          <FolderTree size={20} />
                        </div>
                      </div>
                    </Card>

                    <Card>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-500">Main Categories</p>
                          <p className="mt-2 text-3xl font-bold text-slate-900">
                            {formatNumber(categorySummary.main)}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                          <Layers3 size={20} />
                        </div>
                      </div>
                    </Card>

                    <Card>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-500">Subcategories</p>
                          <p className="mt-2 text-3xl font-bold text-slate-900">
                            {formatNumber(categorySummary.sub)}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                          <Tag size={20} />
                        </div>
                      </div>
                    </Card>
                  </div>

                  <div className="grid gap-6 xl:grid-cols-[1.1fr_1.6fr]">
                    <Card>
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">Main Categories</h3>
                          <p className="mt-1 text-sm text-slate-500">
                            Top-level categories available on the platform.
                          </p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                          {parentCategories.length}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {parentCategories.map((category) => (
                          <div
                            key={category.id}
                            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <h4 className="text-base font-semibold text-slate-900">
                                  {category.name}
                                </h4>
                                <p className="mt-1 break-all text-sm text-slate-500">
                                  Slug: {category.slug}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  Children:{" "}
                                  {
                                    childCategories.filter(
                                      (child) => String(child.parent) === String(category.id)
                                    ).length
                                  }
                                </p>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleEditCategory(category)}
                                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                                >
                                  <Edit3 size={15} />
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteCategory(category)}
                                  disabled={deleteCategoryMutation.isPending}
                                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                                >
                                  <Trash2 size={15} />
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>

                    <Card>
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">All Categories</h3>
                          <p className="mt-1 text-sm text-slate-500">
                            Full category structure with parent mapping.
                          </p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                          {sortedCategories.length} total
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                          <thead>
                            <tr className="bg-slate-50 text-left">
                              <th className="px-4 py-3 text-sm font-semibold text-slate-700">Name</th>
                              <th className="px-4 py-3 text-sm font-semibold text-slate-700">Slug</th>
                              <th className="px-4 py-3 text-sm font-semibold text-slate-700">Type</th>
                              <th className="px-4 py-3 text-sm font-semibold text-slate-700">Parent</th>
                              <th className="px-4 py-3 text-sm font-semibold text-slate-700">Actions</th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-slate-100">
                            {sortedCategories.map((category) => (
                              <tr key={category.id} className="hover:bg-slate-50">
                                <td className="px-4 py-4 text-sm font-medium text-slate-900">
                                  {category.name}
                                </td>
                                <td className="px-4 py-4 text-sm text-slate-600">{category.slug}</td>
                                <td className="px-4 py-4 text-sm">
                                  <span
                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                      category.parent
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-blue-100 text-blue-700"
                                    }`}
                                  >
                                    {category.parent ? "Subcategory" : "Main"}
                                  </span>
                                </td>
                                <td className="px-4 py-4 text-sm text-slate-600">
                                  {getParentName(category.parent)}
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleEditCategory(category)}
                                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteCategory(category)}
                                      disabled={deleteCategoryMutation.isPending}
                                      className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "visitor_stats" && (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-slate-900">Visitor Statistics</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Clean overview of traffic performance with daily and monthly trends.
                </p>
              </div>

              {isLoadingStats ? (
                <p className="text-slate-600">Loading statistics...</p>
              ) : (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatMiniCard
                      title="Total Visits"
                      value={visitorStats?.total_visits || 0}
                      icon={<Activity className="h-5 w-5" />}
                      subtitle="All recorded visits"
                    />
                    <StatMiniCard
                      title="Unique Visitors"
                      value={visitorStats?.unique_visitors || 0}
                      icon={<Users className="h-5 w-5" />}
                      subtitle="Distinct visitors"
                    />
                    <StatMiniCard
                      title="Today's Visits"
                      value={visitorStats?.today_visits || 0}
                      icon={<CalendarDays className="h-5 w-5" />}
                      subtitle="Visits recorded today"
                    />
                    <StatMiniCard
                      title="This Month"
                      value={visitorStats?.this_month_visits || 0}
                      icon={<BarChart3 className="h-5 w-5" />}
                      subtitle="Current month visits"
                    />
                  </div>

                  <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                    <Card>
                      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">Recent Daily Traffic</h3>
                          <p className="mt-1 text-sm text-slate-500">
                            Recent daily records shown in smaller pages
                          </p>
                        </div>

                        {totalRecentDailyPages > 1 && (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                            Page {recentDailyPage} of {totalRecentDailyPages}
                          </span>
                        )}
                      </div>

                      {paginatedRecentDaily.length === 0 ? (
                        <div className="py-8 text-center text-slate-500">No daily traffic data found.</div>
                      ) : (
                        <>
                          <div className="space-y-3">
                            {paginatedRecentDaily.map((d) => {
                              const max = Math.max(...paginatedRecentDaily.map((x) => x.total), 1);
                              const width = `${(d.total / max) * 100}%`;

                              return (
                                <div key={d.period}>
                                  <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                                    <span className="font-medium text-slate-700">
                                      {formatTrafficDate(d.period)}
                                    </span>
                                    <span className="shrink-0 text-slate-500">
                                      {formatNumber(d.total)}
                                    </span>
                                  </div>
                                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                                    <div
                                      className="h-full rounded-full bg-slate-900 transition-all"
                                      style={{ width }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <Pagination
                            currentPage={recentDailyPage}
                            totalPages={totalRecentDailyPages}
                            onPageChange={setRecentDailyPage}
                          />
                        </>
                      )}
                    </Card>

                    <Card>
                      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">Monthly Performance</h3>
                          <p className="mt-1 text-sm text-slate-500">
                            Monthly records shown in smaller pages
                          </p>
                        </div>

                        {totalMonthlyPerformancePages > 1 && (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                            Page {monthlyPerformancePage} of {totalMonthlyPerformancePages}
                          </span>
                        )}
                      </div>

                      {paginatedMonthlyPerformance.length === 0 ? (
                        <div className="py-8 text-center text-slate-500">No monthly traffic data found.</div>
                      ) : (
                        <>
                          <div className="space-y-3">
                            {paginatedMonthlyPerformance.map((m) => {
                              const max = Math.max(...paginatedMonthlyPerformance.map((x) => x.total), 1);
                              const width = `${(m.total / max) * 100}%`;

                              return (
                                <div key={m.period}>
                                  <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                                    <span className="font-medium text-slate-700">
                                      {formatTrafficMonth(m.period)}
                                    </span>
                                    <span className="shrink-0 text-slate-500">
                                      {formatNumber(m.total)}
                                    </span>
                                  </div>
                                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                                    <div
                                      className="h-full rounded-full bg-emerald-600 transition-all"
                                      style={{ width }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <Pagination
                            currentPage={monthlyPerformancePage}
                            totalPages={totalMonthlyPerformancePages}
                            onPageChange={setMonthlyPerformancePage}
                          />
                        </>
                      )}
                    </Card>
                  </div>

                  <div className="grid gap-6 xl:grid-cols-2">
                    <Card>
                      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">Daily Breakdown</h3>
                          <p className="mt-1 text-sm text-slate-500">
                            Detailed daily traffic table with paging
                          </p>
                        </div>

                        {recentDailyStats.length > 0 && (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                            {recentDailyStats.length} records
                          </span>
                        )}
                      </div>

                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                          <thead>
                            <tr className="text-left">
                              <th className="px-4 py-3 text-sm font-semibold text-slate-700">Date</th>
                              <th className="px-4 py-3 text-sm font-semibold text-slate-700">Visits</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {paginatedDailyBreakdown.length ? (
                              paginatedDailyBreakdown.map((d) => (
                                <tr key={d.period}>
                                  <td className="px-4 py-3 text-sm text-slate-700">
                                    {formatTrafficDate(d.period)}
                                  </td>
                                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                                    {formatNumber(d.total)}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={2} className="px-4 py-6 text-center text-sm text-slate-500">
                                  No daily data available.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      <Pagination
                        currentPage={dailyBreakdownPage}
                        totalPages={totalDailyBreakdownPages}
                        onPageChange={setDailyBreakdownPage}
                      />
                    </Card>

                    <Card>
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-slate-900">Monthly Breakdown</h3>
                        <p className="mt-1 text-sm text-slate-500">Detailed monthly traffic table.</p>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                          <thead>
                            <tr className="text-left">
                              <th className="px-4 py-3 text-sm font-semibold text-slate-700">Month</th>
                              <th className="px-4 py-3 text-sm font-semibold text-slate-700">Visits</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {monthlyStats.length ? (
                              [...monthlyStats].reverse().map((m) => (
                                <tr key={m.period}>
                                  <td className="px-4 py-3 text-sm text-slate-700">
                                    {formatTrafficMonth(m.period)}
                                  </td>
                                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                                    {formatNumber(m.total)}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={2} className="px-4 py-6 text-center text-sm text-slate-500">
                                  No monthly data available.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "partners" && (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-slate-900">Partner Registration</h2>
                <p className="mt-1 text-sm text-slate-600">Register and manage platform partners.</p>
              </div>

              <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
                <Card>
                  <h3 className="mb-4 text-lg font-semibold text-slate-900">
                    {editingPartnerId ? "Edit Partner" : "Add New Partner"}
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Partner Name
                      </label>
                      <input
                        type="text"
                        value={partnerName}
                        onChange={(e) => setPartnerName(e.target.value)}
                        placeholder="e.g. Auto Plaza"
                        className="w-full rounded-2xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-700"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Website</label>
                      <input
                        type="url"
                        value={partnerWebsite}
                        onChange={(e) => setPartnerWebsite(e.target.value)}
                        placeholder="https://example.com"
                        className="w-full rounded-2xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-700"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Description
                      </label>
                      <textarea
                        value={partnerDescription}
                        onChange={(e) => setPartnerDescription(e.target.value)}
                        placeholder="Short description"
                        className="min-h-28 w-full rounded-2xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-700"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Logo {editingPartnerId ? "(optional - choose only if changing)" : ""}
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setPartnerLogo(e.target.files?.[0] || null)}
                        className="w-full rounded-2xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-700"
                      />
                    </div>

                    <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <input
                        type="checkbox"
                        checked={partnerIsActive}
                        onChange={(e) => setPartnerIsActive(e.target.checked)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm text-slate-700">Active</span>
                    </label>

                    {partnerError && <p className="text-sm text-red-600">{partnerError}</p>}
                    {partnerSuccess && <p className="text-sm text-green-700">{partnerSuccess}</p>}

                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={submitPartner}
                        disabled={
                          createPartnerMutation.isPending ||
                          updatePartnerMutation.isPending ||
                          togglePartnerStatusMutation.isPending
                        }
                      >
                        {createPartnerMutation.isPending || updatePartnerMutation.isPending
                          ? "Saving..."
                          : editingPartnerId
                          ? "Update Partner"
                          : "Save Partner"}
                      </Button>

                      {editingPartnerId && (
                        <button
                          type="button"
                          onClick={resetPartnerForm}
                          className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                        >
                          Cancel Edit
                        </button>
                      )}
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">Registered Partners</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Active and inactive partners are listed here.
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {partnersData.length} total
                    </span>
                  </div>

                  {isLoadingPartners ? (
                    <p className="text-slate-600">Loading partners...</p>
                  ) : partnersData.length === 0 ? (
                    <div className="py-10 text-center">
                      <h3 className="text-xl font-semibold text-slate-900">No partners found</h3>
                      <p className="mt-2 text-slate-600">Start by registering your first partner.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {partnersData.map((partner) => (
                        <div
                          key={partner.id}
                          className={`rounded-2xl border p-4 transition ${
                            partner.is_active
                              ? "border-slate-200 bg-slate-50"
                              : "border-red-200 bg-red-50/40"
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                              {partner.logo ? (
                                <img
                                  src={partner.logo}
                                  alt={partner.name}
                                  className="h-full w-full object-contain"
                                />
                              ) : (
                                <span className="text-xs text-slate-400">No Logo</span>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-base font-semibold text-slate-900">{partner.name}</h4>

                                <span
                                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                    partner.is_active
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {partner.is_active ? "Active" : "Inactive"}
                                </span>
                              </div>

                              {partner.description && (
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                  {partner.description}
                                </p>
                              )}

                              {partner.website && (
                                <a
                                  href={partner.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-2 inline-block break-all text-sm font-medium text-blue-600 hover:underline"
                                >
                                  {partner.website}
                                </a>
                              )}
                            </div>

                            <div className="shrink-0">
                              <div className="flex flex-col gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleEditPartner(partner)}
                                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleTogglePartnerStatus(partner)}
                                  disabled={togglePartnerStatusMutation.isPending}
                                  className={`rounded-xl px-4 py-2 text-sm font-medium text-white transition ${
                                    partner.is_active
                                      ? "bg-red-600 hover:bg-red-700"
                                      : "bg-green-600 hover:bg-green-700"
                                  }`}
                                >
                                  {partner.is_active ? "Deactivate" : "Activate"}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </>
          )}

          {activeTab === "video_banners" && (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-slate-900">Video Banners</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Upload and manage promo banner videos for the listings page.
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
                <Card>
                  <h3 className="mb-4 text-lg font-semibold text-slate-900">
                    {editingBannerId ? "Edit Video Banner" : "Add Video Banner"}
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Banner Title
                      </label>
                      <input
                        type="text"
                        value={bannerTitle}
                        onChange={(e) => setBannerTitle(e.target.value)}
                        placeholder="e.g. Visit Company Website"
                        className="w-full rounded-2xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-700"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Target Link
                      </label>
                      <input
                        type="url"
                        value={bannerTargetUrl}
                        onChange={(e) => setBannerTargetUrl(e.target.value)}
                        placeholder="https://company.com"
                        className="w-full rounded-2xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-700"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Video File {editingBannerId ? "(optional - choose only if changing)" : ""}
                      </label>
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/ogg"
                        onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
                        className="w-full rounded-2xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-700"
                      />
                    </div>

                    <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <input
                        type="checkbox"
                        checked={bannerIsActive}
                        onChange={(e) => setBannerIsActive(e.target.checked)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm text-slate-700">Active</span>
                    </label>

                    {bannerError && <p className="text-sm text-red-600">{bannerError}</p>}
                    {bannerSuccess && <p className="text-sm text-green-700">{bannerSuccess}</p>}

                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={submitBanner}
                        disabled={
                          createPromoBannerMutation.isPending ||
                          updatePromoBannerMutation.isPending ||
                          togglePromoBannerStatusMutation.isPending
                        }
                      >
                        {createPromoBannerMutation.isPending || updatePromoBannerMutation.isPending
                          ? "Saving..."
                          : editingBannerId
                          ? "Update Video Banner"
                          : "Save Video Banner"}
                      </Button>

                      {editingBannerId && (
                        <button
                          type="button"
                          onClick={resetBannerForm}
                          className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                        >
                          Cancel Edit
                        </button>
                      )}
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">Uploaded Video Banners</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Active banners display automatically on the listings page.
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {promoBannersData.length} total
                    </span>
                  </div>

                  {isLoadingPromoBanners ? (
                    <p className="text-slate-600">Loading video banners...</p>
                  ) : promoBannersData.length === 0 ? (
                    <div className="py-10 text-center">
                      <h3 className="text-xl font-semibold text-slate-900">No video banners found</h3>
                      <p className="mt-2 text-slate-600">Upload your first banner video.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {promoBannersData.map((banner) => (
                        <div
                          key={banner.id}
                          className={`rounded-2xl border p-4 transition ${
                            banner.is_active
                              ? "border-slate-200 bg-slate-50"
                              : "border-red-200 bg-red-50/40"
                          }`}
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex min-w-0 flex-1 gap-4">
                              <div className="h-24 w-40 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                <video
                                  src={banner.file_url}
                                  className="h-full w-full object-cover"
                                  muted
                                  controls
                                />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="text-base font-semibold text-slate-900">
                                    {banner.title || "Untitled Banner"}
                                  </h4>

                                  <span
                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                      banner.is_active
                                        ? "bg-green-100 text-green-700"
                                        : "bg-red-100 text-red-700"
                                    }`}
                                  >
                                    {banner.is_active ? "Active" : "Inactive"}
                                  </span>
                                </div>

                                {banner.target_url && (
                                  <a
                                    href={banner.target_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-2 inline-block break-all text-sm font-medium text-blue-600 hover:underline"
                                  >
                                    {banner.target_url}
                                  </a>
                                )}
                              </div>
                            </div>

                            <div className="shrink-0">
                              <div className="flex flex-col gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleEditBanner(banner)}
                                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() => togglePromoBannerStatusMutation.mutate(banner)}
                                  disabled={togglePromoBannerStatusMutation.isPending}
                                  className={`rounded-xl px-4 py-2 text-sm font-medium text-white transition ${
                                    banner.is_active
                                      ? "bg-red-600 hover:bg-red-700"
                                      : "bg-green-600 hover:bg-green-700"
                                  }`}
                                >
                                  {banner.is_active ? "Deactivate" : "Activate"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => deletePromoBannerMutation.mutate(banner.id)}
                                  disabled={deletePromoBannerMutation.isPending}
                                  className="rounded-xl bg-slate-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-600"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </>
          )}

          {activeTab === "admin_users" && (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-slate-900">Admin Users</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Create, edit, enable, and disable admin users.
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
                <Card>
                  <h3 className="mb-4 text-lg font-semibold text-slate-900">
                    {editingAdminUserId ? "Edit Admin User" : "Create Admin User"}
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Username
                      </label>
                      <input
                        type="text"
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        placeholder="Enter username"
                        className="w-full rounded-2xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-700"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                      <input
                        type="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="Enter email"
                        className="w-full rounded-2xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-700"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={adminFirstName}
                          onChange={(e) => setAdminFirstName(e.target.value)}
                          placeholder="First name"
                          className="w-full rounded-2xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-700"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={adminLastName}
                          onChange={(e) => setAdminLastName(e.target.value)}
                          placeholder="Last name"
                          className="w-full rounded-2xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-700"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Password {editingAdminUserId ? "(leave blank to keep current password)" : ""}
                      </label>
                      <input
                        type="password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="Enter password"
                        className="w-full rounded-2xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-700"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        value={adminConfirmPassword}
                        onChange={(e) => setAdminConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        className="w-full rounded-2xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-700"
                      />
                    </div>

                    <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <input
                        type="checkbox"
                        checked={adminIsActive}
                        onChange={(e) => setAdminIsActive(e.target.checked)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm text-slate-700">Active</span>
                    </label>

                    <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <input
                        type="checkbox"
                        checked={adminIsSuperuser}
                        onChange={(e) => setAdminIsSuperuser(e.target.checked)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm text-slate-700">Superuser</span>
                    </label>

                    {adminError && <p className="text-sm text-red-600">{adminError}</p>}
                    {adminSuccess && <p className="text-sm text-green-700">{adminSuccess}</p>}

                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={submitAdminUser}
                        disabled={
                          createAdminUserMutation.isPending ||
                          updateAdminUserMutation.isPending ||
                          toggleAdminUserStatusMutation.isPending
                        }
                      >
                        {createAdminUserMutation.isPending || updateAdminUserMutation.isPending
                          ? "Saving..."
                          : editingAdminUserId
                          ? "Update Admin User"
                          : "Create Admin User"}
                      </Button>

                      <button
                        type="button"
                        onClick={resetAdminForm}
                        className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                      >
                        {editingAdminUserId ? "Cancel Edit" : "Reset"}
                      </button>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">Existing Admin Users</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        All current admin accounts are listed here.
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {adminUsersData.length} total
                    </span>
                  </div>

                  {isLoadingAdminUsers ? (
                    <p className="text-slate-600">Loading admin users...</p>
                  ) : adminUsersData.length === 0 ? (
                    <div className="py-10 text-center">
                      <h3 className="text-xl font-semibold text-slate-900">No admin users found</h3>
                      <p className="mt-2 text-slate-600">Create your first admin user.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {adminUsersData.map((user) => (
                        <div
                          key={user.id}
                          className={`rounded-2xl border p-4 ${
                            user.is_active
                              ? "border-slate-200 bg-slate-50"
                              : "border-red-200 bg-red-50/40"
                          }`}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h4 className="text-base font-semibold text-slate-900">
                                {user.first_name || user.last_name
                                  ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
                                  : user.username}
                              </h4>
                              <p className="text-sm text-slate-600">@{user.username}</p>
                              <p className="text-sm text-slate-600">{user.email}</p>
                            </div>

                            <div className="flex flex-col gap-2 sm:items-end">
                              <div className="flex flex-wrap gap-2">
                                <span
                                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                    user.is_active
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {user.is_active ? "Active" : "Inactive"}
                                </span>

                                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                  {user.is_superuser ? "Superuser" : "Staff Admin"}
                                </span>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleEditAdminUser(user)}
                                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() => toggleAdminUserStatusMutation.mutate(user)}
                                  disabled={toggleAdminUserStatusMutation.isPending}
                                  className={`rounded-xl px-4 py-2 text-sm font-medium text-white transition ${
                                    user.is_active
                                      ? "bg-red-600 hover:bg-red-700"
                                      : "bg-green-600 hover:bg-green-700"
                                  }`}
                                >
                                  {user.is_active ? "Disable" : "Enable"}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </>
          )}

          {activeTab === "non_admin_users" && (
            <>
              <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">Non-Admin Users</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    View regular users and only activate or deactivate them.
                  </p>
                </div>

                <div className="w-full max-w-md">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Search users
                  </label>
                  <input
                    type="text"
                    value={nonAdminSearch}
                    onChange={(e) => handleSearchNonAdminUsers(e.target.value)}
                    placeholder="Search by username, email, or name"
                    className="w-full rounded-2xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-700"
                  />
                </div>
              </div>

              <Card>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Registered Non-Admin Users</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      You can only change user status here.
                    </p>
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {filteredNonAdminUsers.length} total
                  </span>
                </div>

                {nonAdminUserError && <p className="mb-4 text-sm text-red-600">{nonAdminUserError}</p>}
                {nonAdminUserSuccess && <p className="mb-4 text-sm text-green-700">{nonAdminUserSuccess}</p>}

                {isLoadingNonAdminUsers ? (
                  <p className="text-slate-600">Loading non-admin users...</p>
                ) : filteredNonAdminUsers.length === 0 ? (
                  <div className="py-10 text-center">
                    <h3 className="text-xl font-semibold text-slate-900">No non-admin users found</h3>
                    <p className="mt-2 text-slate-600">
                      There are no matching regular users at the moment.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {paginatedNonAdminUsers.map((user) => (
                        <div
                          key={user.id}
                          className={`rounded-2xl border p-4 ${
                            user.is_active
                              ? "border-slate-200 bg-slate-50"
                              : "border-red-200 bg-red-50/40"
                          }`}
                        >
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <h4 className="text-base font-semibold text-slate-900">
                                {getDisplayName(user)}
                              </h4>
                              <p className="text-sm text-slate-600">@{user.username}</p>
                              <p className="text-sm text-slate-600">{user.email}</p>
                              <p className="mt-1 text-xs text-slate-500">
                                Joined: {formatDate(user.date_joined)}
                              </p>
                            </div>

                            <div className="flex flex-col gap-2 lg:items-end">
                              <div className="flex flex-wrap gap-2">
                                <span
                                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                    user.is_active
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {user.is_active ? "Active" : "Inactive"}
                                </span>

                                <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                  Regular User
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setNonAdminUserError("");
                                  setNonAdminUserSuccess("");
                                  toggleNonAdminUserStatusMutation.mutate(user);
                                }}
                                disabled={toggleNonAdminUserStatusMutation.isPending}
                                className={`rounded-xl px-4 py-2 text-sm font-medium text-white transition ${
                                  user.is_active
                                    ? "bg-red-600 hover:bg-red-700"
                                    : "bg-green-600 hover:bg-green-700"
                                }`}
                              >
                                {user.is_active ? "Deactivate" : "Activate"}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Pagination
                      currentPage={nonAdminPage}
                      totalPages={totalNonAdminPages}
                      onPageChange={handleChangeNonAdminPage}
                    />
                  </>
                )}
              </Card>
            </>
          )}
        </div>
      </PageContainer>

      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">
                  {editingCategoryId ? "Edit Category" : "Add New Category"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {editingCategoryId
                    ? "Update the selected category details."
                    : "Create a new category or subcategory."}
                </p>
              </div>

              <button
                type="button"
                onClick={resetCategoryForm}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Category Name
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewCategoryName(value);
                    setNewCategorySlug((current) =>
                      editingCategoryId && current ? current : slugify(value)
                    );
                  }}
                  placeholder="Enter category name"
                  className="w-full rounded-2xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-700"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Slug</label>
                <input
                  type="text"
                  value={newCategorySlug}
                  onChange={(e) => setNewCategorySlug(slugify(e.target.value))}
                  placeholder="category-slug"
                  className="w-full rounded-2xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-700"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Parent Category
                </label>
                <select
                  value={newCategoryParent}
                  onChange={(e) => setNewCategoryParent(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-700"
                >
                  <option value="">None (Main Category)</option>
                  {parentCategories
                    .filter((cat) => String(cat.id) !== String(editingCategoryId))
                    .map((category) => (
                      <option key={category.id} value={String(category.id)}>
                        {category.name}
                      </option>
                    ))}
                </select>
              </div>

              {categoryError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {categoryError}
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  onClick={submitCategory}
                  disabled={
                    createCategoryMutation.isPending ||
                    updateCategoryMutation.isPending ||
                    deleteCategoryMutation.isPending
                  }
                >
                  {createCategoryMutation.isPending || updateCategoryMutation.isPending
                    ? "Saving..."
                    : editingCategoryId
                    ? "Update Category"
                    : "Create Category"}
                </Button>

                <button
                  type="button"
                  onClick={resetCategoryForm}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}