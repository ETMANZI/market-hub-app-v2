import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Video,
  Upload,
  Link as LinkIcon,
  Eye,
  Trash2,
  Power,
  PlusCircle,
} from "lucide-react";
import PageContainer from "../components/layout/PageContainer";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { api } from "../lib/api";

type PromoBanner = {
  id: number | string;
  title?: string;
  media_type: "video" | "image" | "gif";
  file_url: string;
  target_url?: string | null;
  is_active: boolean;
  created_at?: string;
};

export default function PromoBannerAdminPage() {
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [formError, setFormError] = useState("");

  const previewUrl = useMemo(() => {
    if (!file) return "";
    return URL.createObjectURL(file);
  }, [file]);

  const { data: banners = [], isLoading } = useQuery<PromoBanner[]>({
    queryKey: ["admin-promo-banners"],
    queryFn: async () => {
      const res = await api.get("/promo-banners/");
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) {
        throw new Error("Please select a video file.");
      }

      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("media_type", "video");
      formData.append("target_url", targetUrl.trim());
      formData.append("is_active", String(isActive));
      formData.append("file", file);

      await api.post("/promo-banners/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
    onSuccess: async () => {
      setTitle("");
      setTargetUrl("");
      setIsActive(true);
      setFile(null);
      setFormError("");
      await queryClient.invalidateQueries({ queryKey: ["admin-promo-banners"] });
      await queryClient.invalidateQueries({ queryKey: ["promo-banners"] });
    },
    onError: (error: any) => {
      const data = error?.response?.data;
      if (data?.file?.[0]) {
        setFormError(data.file[0]);
      } else if (data?.target_url?.[0]) {
        setFormError(data.target_url[0]);
      } else if (data?.title?.[0]) {
        setFormError(data.title[0]);
      } else {
        setFormError(error?.message || "Failed to upload banner video.");
      }
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (banner: PromoBanner) => {
      await api.patch(`/promo-banners/${banner.id}/`, {
        is_active: !banner.is_active,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-promo-banners"] });
      await queryClient.invalidateQueries({ queryKey: ["promo-banners"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number | string) => {
      await api.delete(`/promo-banners/${id}/`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-promo-banners"] });
      await queryClient.invalidateQueries({ queryKey: ["promo-banners"] });
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <PageContainer>
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr]">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <Video size={28} />
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                Banner Video Manager
              </h1>
              <p className="mt-4 max-w-2xl text-slate-600">
                Upload promotional videos for the listings page banner. Active videos
                display automatically. Inactive ones stay saved but hidden from users.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
                    <Upload size={18} />
                  </div>
                  <h3 className="font-semibold text-slate-900">Upload</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Add new banner videos from the admin interface.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
                    <Power size={18} />
                  </div>
                  <h3 className="font-semibold text-slate-900">Control status</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Activate or deactivate a banner any time.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
                    <LinkIcon size={18} />
                  </div>
                  <h3 className="font-semibold text-slate-900">Attach link</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Send users directly to the advertiser website.
                  </p>
                </div>
              </div>
            </div>

            <Card className="rounded-[2rem] border border-slate-200 p-6 shadow-sm md:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <PlusCircle size={20} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Create Banner Video</h2>
                  <p className="text-sm text-slate-500">
                    Upload a new video banner for the listings page.
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Banner Title
                  </label>
                  <Input
                    placeholder="Example: Visit Ecobank Today"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Target Link
                  </label>
                  <Input
                    placeholder="https://company-website.com"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Video File
                  </label>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/ogg"
                    onChange={(e) => {
                      setFormError("");
                      setFile(e.target.files?.[0] || null);
                    }}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Recommended: MP4, muted, short loop, landscape format.
                  </p>
                </div>

                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-slate-700">
                    Make this banner active immediately
                  </span>
                </label>

                {previewUrl && (
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                    <video
                      src={previewUrl}
                      className="h-52 w-full object-cover"
                      controls
                      muted
                    />
                  </div>
                )}

                {formError && <p className="text-sm text-red-600">{formError}</p>}

                <Button
                  onClick={() => uploadMutation.mutate()}
                  disabled={!file || uploadMutation.isPending}
                  className="w-full"
                >
                  {uploadMutation.isPending ? "Uploading..." : "Upload Banner Video"}
                </Button>
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Existing Banners</h2>
              <p className="text-sm text-slate-500">{banners.length} item(s)</p>
            </div>

            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Card key={i} className="animate-pulse p-4">
                    <div className="h-48 rounded-2xl bg-slate-200" />
                  </Card>
                ))}
              </div>
            ) : banners.length === 0 ? (
              <Card className="p-8">
                <p className="text-slate-600">No promo banners uploaded yet.</p>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {banners.map((banner) => (
                  <Card key={banner.id} className="overflow-hidden p-0 shadow-sm">
                    <div className="bg-slate-100">
                      <video
                        src={banner.file_url}
                        className="h-56 w-full object-cover"
                        muted
                        controls
                      />
                    </div>

                    <div className="p-5">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">
                            {banner.title || "Untitled Banner"}
                          </h3>
                          <p className="mt-1 text-sm text-slate-500">
                            Type: {banner.media_type}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            banner.is_active
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
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
                          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:underline"
                        >
                          <Eye size={14} />
                          Open target link
                        </a>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          onClick={() => toggleMutation.mutate(banner)}
                          disabled={toggleMutation.isPending}
                        >
                          {banner.is_active ? "Deactivate" : "Activate"}
                        </Button>

                        <Button
                          onClick={() => deleteMutation.mutate(banner.id)}
                          disabled={deleteMutation.isPending}
                          className="inline-flex items-center gap-2"
                        >
                          <Trash2 size={14} />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </PageContainer>
    </div>
  );
}