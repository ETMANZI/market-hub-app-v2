import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Navbar from "../components/layout/Navbar";
import PageContainer from "../components/layout/PageContainer";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { api } from "../lib/api";

type ListingForm = {
  title: string;
  slug: string;
  category:string;
  description: string;
  listing_type: string;
  sale_mode: string;
  price: number;
  discount_price: number;
  district: string;
  sector: string;
  address: string;
  contact_phone: string;
  contact_email: string;
};

type SelectedImage = {
  file: File;
  preview: string;
};

export default function PublishListingPage() {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = useForm<ListingForm>({
    defaultValues: {
      title: "",
      slug: "",
      category: "",
      description: "",
      listing_type: "house",
      sale_mode: "sell",
      price: 0,
      discount_price: 0,
      district: "",
      sector: "",
      address: "",
      contact_phone: "",
      contact_email: "",
    },
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [images, setImages] = useState<SelectedImage[]>([]);

  const listingType = watch("listing_type");

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (!files.length) return;

    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...newImages]);

    e.target.value = "";
  };

  const removeImage = (indexToRemove: number) => {
    setImages((prev) => {
      const imageToRemove = prev[indexToRemove];
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter((_, index) => index !== indexToRemove);
    });
  };

  const clearAllImages = () => {
    images.forEach((img) => URL.revokeObjectURL(img.preview));
    setImages([]);
  };

  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.preview));
    };
  }, [images]);

  const onSubmit = async (data: ListingForm) => {
    try {
      setError("");
      setMessage("");

      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("slug", data.slug);
      formData.append("category", data.category);
      formData.append("description", data.description);
      formData.append("listing_type", data.listing_type);
      formData.append("price", String(data.price || 0));
      formData.append("discount_price", String(data.discount_price || ""));
      formData.append("district", data.district || "");
      formData.append("sector", data.sector || "");
      formData.append("address", data.address || "");
      formData.append("contact_phone", data.contact_phone || "");
      formData.append("contact_email", data.contact_email || "");

      if (data.listing_type !== "business_ad") {
        formData.append("sale_mode", data.sale_mode || "");
      }

      images.forEach((image) => {
        formData.append("new_images", image.file);
      });

      const listingRes = await api.post("/listings/", formData);

      const listingId = listingRes.data.id;

      const paymentRes = await api.post("/payments/create-listing-payment/", {
        listing_id: listingId,
      });

      setMessage(
        `Listing created successfully. Publishing fee required: ${paymentRes.data.amount} ${paymentRes.data.currency}`
      );

      clearAllImages();
      reset();

    } catch (err: any) {
      console.log("ERROR STATUS:", err?.response?.status);
      console.log("ERROR DATA:", err?.response?.data);

      const responseData = err?.response?.data;

      if (typeof responseData === "string") {
        setError(responseData);
      } else if (responseData?.detail) {
        setError(responseData.detail);
      } else if (responseData && typeof responseData === "object") {
        const firstError = Object.entries(responseData)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(", ") : messages}`)
          .join(" | ");
        setError(firstError);
      } else {
        setError("Failed to create listing.");
      }
    }




  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <PageContainer>
        <div className="mx-auto max-w-4xl py-10">
          <Card>
            <h1 className="mb-6 text-3xl font-bold text-slate-900">
              Publish Listing
            </h1>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="grid gap-4 md:grid-cols-2"
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Title
                </label>
                <Input
                  placeholder="Title"
                  {...register("title", { required: true })}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Slug
                </label>
                <Input
                  placeholder="Slug"
                  {...register("slug", { required: true })}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Listing Type
                </label>
                <select
                  className="w-full rounded-2xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-700"
                  {...register("listing_type")}
                >
                  <option value="house">House</option>
                  <option value="parcel">Parcel</option>
                  <option value="business_ad">Business Advertisement</option>
                </select>
              </div>

              {listingType !== "business_ad" && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Sale Mode
                  </label>
                  <select
                    className="w-full rounded-2xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-700"
                    {...register("sale_mode")}
                  >
                    <option value="sell">Sell</option>
                    <option value="rent">Rent</option>
                    {/* <option value="ads">Ads</option> */}
                  </select>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Price
                </label>
                <Input
                  placeholder="Price"
                  type="number"
                  {...register("price", {
                    valueAsNumber: true,
                    required: true,
                  })}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Discount Price
                </label>
                <Input
                  placeholder="Discount Price"
                  type="number"
                  {...register("discount_price", { valueAsNumber: true })}
                />
              </div>


              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  District
                </label>
                <Input placeholder="District" {...register("district")} />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Sector
                </label>
                <Input placeholder="Sector" {...register("sector")} />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Address
                </label>
                <Input placeholder="Address" {...register("address")} />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Contact Phone
                </label>
                <Input
                  placeholder="Contact Phone"
                  {...register("contact_phone")}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Contact Email
                </label>
                <Input
                  placeholder="Contact Email"
                  type="email"
                  {...register("contact_email")}
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  placeholder="Description"
                  className="min-h-36 w-full rounded-2xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-700"
                  {...register("description", { required: true })}
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Listing Images
                </label>

                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImagesChange}
                  className="w-full rounded-2xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-700"
                />

                <p className="mt-2 text-xs text-slate-500">
                  You can upload multiple images. The first image will be treated
                  as the cover image.
                </p>

                {images.length > 0 && (
                  <div className="mt-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-700">
                        {images.length} image(s) selected
                      </p>

                      <button
                        type="button"
                        onClick={clearAllImages}
                        className="text-sm font-medium text-red-600 transition hover:text-red-700"
                      >
                        Clear all
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                      {images.map((item, index) => (
                        <div
                          key={`${item.file.name}-${index}`}
                          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                        >
                          <img
                            src={item.preview}
                            alt={item.file.name}
                            className="h-32 w-full object-cover"
                          />

                          <div className="space-y-2 p-2">
                            <p className="truncate text-xs text-slate-600">
                              {item.file.name}
                            </p>

                            <div className="flex items-center justify-between gap-2">
                              {index === 0 ? (
                                <span className="inline-block rounded-full bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700">
                                  Cover image
                                </span>
                              ) : (
                                <span className="inline-block rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
                                  Image {index + 1}
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="text-[11px] font-medium text-red-600 hover:text-red-700"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {message && (
                <p className="text-sm text-green-700 md:col-span-2">{message}</p>
              )}

              {error && (
                <p className="text-sm text-red-600 md:col-span-2">{error}</p>
              )}

              <Button
                type="submit"
                className="md:col-span-2"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Creating listing..."
                  : "Create listing and continue to payment"}
              </Button>
            </form>
          </Card>
        </div>
      </PageContainer>
    </div>
  );
}