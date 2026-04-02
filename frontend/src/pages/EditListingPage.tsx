import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import PageContainer from "../components/layout/PageContainer";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { api } from "../lib/api";
import MapPicker from "../components/MapPicker";

type Category = {
  id: string | number;
  name: string;
};

type ExistingImage = {
  id: string | number;
  image: string;
  alt_text?: string;
  is_cover?: boolean;
};

type Listing = {
  id: string;
  title: string;
  slug: string;
  category?: string | number | null;
  description: string;
  listing_type:
    | "house"
    | "parcel"
    | "business_ad"
    | "car"
    | "clothes_product"
    | "food_product"
    | "home_kitchen_product";
  sale_mode?: "sell" | "rent" | "ads";
  price: string | number;
  discount_price: string | number | null;
  district?: string;
  sector?: string;
  village?: string;
  address?: string;
  contact_phone?: string;
  contact_email?: string;
  bedrooms?: number;
  bathrooms?: number;
  upi?: string;
  land_size?: string | number | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  has_electricity?: boolean;
  has_water?: boolean;
  is_owner?: boolean;
  images?: ExistingImage[];
  negotiable?: boolean;

  car_make?: string;
  car_model?: string;
  car_year?: string | number | null;
  car_mileage?: string | number | null;
  car_fuel_type?: string;
  car_transmission?: string;
  car_condition?: string;
  car_color?: string;

  brand?: string;
  stock_quantity?: string | number | null;
  sku?: string;
  product_condition?: string;
  has_home_delivery?: boolean;
  delivery_fee?: string | number | null;
  delivery_notes?: string;

  clothes_gender?: string;
  clothes_size?: string;
  clothes_color?: string;
  clothes_material?: string;
  clothes_category?: string;

  food_category?: string;
  food_unit?: string;
  food_weight_volume?: string;
  is_perishable?: boolean;
  expiry_date?: string | null;
  is_prepared_food?: boolean;

  home_product_category?: string;
  material?: string;
  color?: string;
  dimensions?: string;
  weight?: string;
  warranty_months?: string | number | null;
};

type ListingForm = {
  title: string;
  slug: string;
  category: string;
  description: string;
  listing_type: string;
  sale_mode: string;
  price: number;
  discount_price?: number;
  district: string;
  sector: string;
  village: string;
  address: string;
  contact_phone: string;
  contact_email: string;

  bedrooms?: number;
  bathrooms?: number;
  upi: string;
  land_size?: number;
  latitude?: number;
  longitude?: number;
  has_electricity: boolean;
  has_water: boolean;
  negotiable?: boolean;

  car_make?: string;
  car_model?: string;
  car_year?: number;
  car_mileage?: number;
  car_fuel_type?: string;
  car_transmission?: string;
  car_condition?: string;
  car_color?: string;

  brand?: string;
  stock_quantity?: number;
  sku?: string;
  product_condition?: string;
  has_home_delivery?: boolean;
  delivery_fee?: number;
  delivery_notes?: string;

  clothes_gender?: string;
  clothes_size?: string;
  clothes_color?: string;
  clothes_material?: string;
  clothes_category?: string;

  food_category?: string;
  food_unit?: string;
  food_weight_volume?: string;
  is_perishable?: boolean;
  expiry_date?: string;
  is_prepared_food?: boolean;

  home_product_category?: string;
  material?: string;
  color?: string;
  dimensions?: string;
  weight?: string;
  warranty_months?: number;
};

type SelectedImage = {
  file: File;
  preview: string;
};

function extractErrorMessage(err: any): string {
  const status = err?.response?.status;
  const data = err?.response?.data;

  if (status === 401) return "Please login first.";
  if (status === 403) return "Only admin can edit this listing.";

  if (!data) return "Failed to update listing.";
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  if (data.message) return data.message;

  if (typeof data === "object") {
    const messages: string[] = [];

    Object.entries(data).forEach(([field, value]) => {
      if (Array.isArray(value)) messages.push(`${field}: ${value.join(", ")}`);
      else if (typeof value === "string") messages.push(`${field}: ${value}`);
    });

    if (messages.length > 0) return messages.join(" | ");
  }

  return "Failed to update listing.";
}

const normalizeId = (value: string | number | null | undefined): string | null => {
  if (value === null || value === undefined) return null;
  return String(value);
};

const PRODUCT_TYPES = [
  "clothes_product",
  "food_product",
  "home_kitchen_product",
];

export default function EditListingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [newImages, setNewImages] = useState<SelectedImage[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);
  const [selectedCoverImageId, setSelectedCoverImageId] = useState<string | null>(null);
  const [initialCoverImageId, setInitialCoverImageId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
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
      discount_price: undefined,
      district: "",
      sector: "",
      village: "",
      address: "",
      contact_phone: "",
      contact_email: "",
      bedrooms: 0,
      bathrooms: 0,
      upi: "",
      land_size: 0,
      latitude: undefined,
      longitude: undefined,
      has_electricity: false,
      has_water: false,
      negotiable: false,

      car_make: "",
      car_model: "",
      car_year: undefined,
      car_mileage: undefined,
      car_fuel_type: "",
      car_transmission: "",
      car_condition: "",
      car_color: "",

      brand: "",
      stock_quantity: undefined,
      sku: "",
      product_condition: "",
      has_home_delivery: false,
      delivery_fee: undefined,
      delivery_notes: "",

      clothes_gender: "",
      clothes_size: "",
      clothes_color: "",
      clothes_material: "",
      clothes_category: "",

      food_category: "",
      food_unit: "",
      food_weight_volume: "",
      is_perishable: false,
      expiry_date: "",
      is_prepared_food: false,

      home_product_category: "",
      material: "",
      color: "",
      dimensions: "",
      weight: "",
      warranty_months: undefined,
    },
  });

  const listingType = watch("listing_type");
  const latitude = watch("latitude");
  const longitude = watch("longitude");
  const hasHomeDelivery = watch("has_home_delivery");
  const isPerishable = watch("is_perishable");

  const isCar = listingType === "car";
  const isBusinessAd = listingType === "business_ad";
  const isHouse = listingType === "house";
  const isParcel = listingType === "parcel";
  const isProductType = useMemo(() => PRODUCT_TYPES.includes(listingType), [listingType]);

  const showSaleMode = !isBusinessAd;
  const showBedroomsBathrooms = isHouse;
  const showLandSize = isHouse || isParcel;
  const showUpi = isHouse || isParcel;
  const showUtilities = isHouse || isParcel;
  const showMap = listingType !== "car";

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const res = await api.get("/categories/");
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setCategories(data);
      } catch (err) {
        console.error("Failed to load categories", err);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (listingType === "business_ad") {
      setValue("sale_mode", "ads");
    } else if (
      listingType === "parcel" ||
      listingType === "car" ||
      listingType === "clothes_product" ||
      listingType === "food_product" ||
      listingType === "home_kitchen_product"
    ) {
      setValue("sale_mode", "sell");
    } else if (listingType === "house") {
      setValue("sale_mode", "sell");
    }
  }, [listingType, setValue]);

  const { data: listing, isLoading, isError } = useQuery<Listing>({
    queryKey: ["listing", id],
    queryFn: async () => {
      const response = await api.get(`/listings/${id}/`);
      return response.data;
    },
    enabled: !!id,
  });

  const normalizedImages = useMemo(() => {
    return (listing?.images || []).map((img) => ({
      ...img,
      normalizedId: String(img.id),
    }));
  }, [listing]);

  useEffect(() => {
    if (!listing) return;

    reset({
      title: listing.title || "",
      slug: listing.slug || "",
      category: listing.category ? String(listing.category) : "",
      description: listing.description || "",
      listing_type: listing.listing_type || "house",
      sale_mode: listing.sale_mode || "sell",
      price: Number(listing.price || 0),
      discount_price:
        listing.discount_price !== null && listing.discount_price !== undefined
          ? Number(listing.discount_price)
          : undefined,
      district: listing.district || "",
      sector: listing.sector || "",
      village: listing.village || "",
      address: listing.address || "",
      contact_phone: listing.contact_phone || "",
      contact_email: listing.contact_email || "",

      bedrooms: listing.bedrooms !== null && listing.bedrooms !== undefined ? Number(listing.bedrooms) : 0,
      bathrooms: listing.bathrooms !== null && listing.bathrooms !== undefined ? Number(listing.bathrooms) : 0,
      upi: listing.upi || "",
      land_size:
        listing.land_size !== null && listing.land_size !== undefined
          ? Number(listing.land_size)
          : 0,
      latitude:
        listing.latitude !== null &&
        listing.latitude !== undefined &&
        String(listing.latitude) !== ""
          ? Number(listing.latitude)
          : undefined,
      longitude:
        listing.longitude !== null &&
        listing.longitude !== undefined &&
        String(listing.longitude) !== ""
          ? Number(listing.longitude)
          : undefined,
      has_electricity: !!listing.has_electricity,
      has_water: !!listing.has_water,
      negotiable: !!listing.negotiable,

      car_make: listing.car_make || "",
      car_model: listing.car_model || "",
      car_year:
        listing.car_year !== null && listing.car_year !== undefined
          ? Number(listing.car_year)
          : undefined,
      car_mileage:
        listing.car_mileage !== null && listing.car_mileage !== undefined
          ? Number(listing.car_mileage)
          : undefined,
      car_fuel_type: listing.car_fuel_type || "",
      car_transmission: listing.car_transmission || "",
      car_condition: listing.car_condition || "",
      car_color: listing.car_color || "",

      brand: listing.brand || "",
      stock_quantity:
        listing.stock_quantity !== null && listing.stock_quantity !== undefined
          ? Number(listing.stock_quantity)
          : undefined,
      sku: listing.sku || "",
      product_condition: listing.product_condition || "",
      has_home_delivery: !!listing.has_home_delivery,
      delivery_fee:
        listing.delivery_fee !== null && listing.delivery_fee !== undefined
          ? Number(listing.delivery_fee)
          : undefined,
      delivery_notes: listing.delivery_notes || "",

      clothes_gender: listing.clothes_gender || "",
      clothes_size: listing.clothes_size || "",
      clothes_color: listing.clothes_color || "",
      clothes_material: listing.clothes_material || "",
      clothes_category: listing.clothes_category || "",

      food_category: listing.food_category || "",
      food_unit: listing.food_unit || "",
      food_weight_volume: listing.food_weight_volume || "",
      is_perishable: !!listing.is_perishable,
      expiry_date: listing.expiry_date || "",
      is_prepared_food: !!listing.is_prepared_food,

      home_product_category: listing.home_product_category || "",
      material: listing.material || "",
      color: listing.color || "",
      dimensions: listing.dimensions || "",
      weight: listing.weight || "",
      warranty_months:
        listing.warranty_months !== null && listing.warranty_months !== undefined
          ? Number(listing.warranty_months)
          : undefined,
    });

    const currentCover =
      normalizeId(normalizedImages.find((img) => img.is_cover)?.normalizedId) ||
      normalizeId(normalizedImages[0]?.normalizedId) ||
      null;

    setSelectedCoverImageId(currentCover);
    setInitialCoverImageId(currentCover);
    setDeletedImageIds([]);
  }, [listing, normalizedImages, reset]);

  useEffect(() => {
    return () => {
      newImages.forEach((img) => URL.revokeObjectURL(img.preview));
    };
  }, [newImages]);

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const mapped = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setNewImages((prev) => [...prev, ...mapped]);
    e.target.value = "";
  };

  const removeNewImage = (indexToRemove: number) => {
    setNewImages((prev) => {
      const target = prev[indexToRemove];
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((_, index) => index !== indexToRemove);
    });
  };

  const clearAllNewImages = () => {
    newImages.forEach((img) => URL.revokeObjectURL(img.preview));
    setNewImages([]);
  };

  const handleSetCoverImage = (imageId: string | number) => {
    const normalizedId = String(imageId);
    setDeletedImageIds((prev) => prev.filter((imgId) => imgId !== normalizedId));
    setSelectedCoverImageId(normalizedId);
  };

  const toggleDeleteExistingImage = (imageId: string | number) => {
    const normalizedId = String(imageId);

    setDeletedImageIds((prev) => {
      const exists = prev.includes(normalizedId);
      const updated = exists ? prev.filter((imgId) => imgId !== normalizedId) : [...prev, normalizedId];

      if (selectedCoverImageId === normalizedId && !exists) {
        const nextAvailableImage = normalizedImages.find(
          (img) => img.normalizedId !== normalizedId && !updated.includes(img.normalizedId)
        );
        setSelectedCoverImageId(nextAvailableImage?.normalizedId ?? null);
      }

      return updated;
    });
  };

  const resetCoverImage = () => {
    if (initialCoverImageId !== null && !deletedImageIds.includes(initialCoverImageId)) {
      setSelectedCoverImageId(initialCoverImageId);
      return;
    }

    const firstAvailableImage = normalizedImages.find((img) => !deletedImageIds.includes(img.normalizedId));
    setSelectedCoverImageId(firstAvailableImage?.normalizedId ?? null);
  };

  const appendIfPresent = (
    formData: FormData,
    key: string,
    value: string | number | boolean | undefined | null
  ) => {
    if (value === undefined || value === null || value === "") return;
    formData.append(key, String(value));
  };

  const updateMutation = useMutation({
    mutationFn: async (data: ListingForm) => {
      const formData = new FormData();

      formData.append("title", data.title);
      formData.append("slug", data.slug);
      formData.append("category", data.category || "");
      formData.append("description", data.description);
      formData.append("listing_type", data.listing_type);
      formData.append("price", String(data.price || 0));
      formData.append("negotiable", String(!!data.negotiable));

      if (
        data.discount_price !== undefined &&
        data.discount_price !== null &&
        !Number.isNaN(data.discount_price)
      ) {
        formData.append("discount_price", String(data.discount_price));
      }

      formData.append("district", data.district || "");
      formData.append("sector", data.sector || "");
      formData.append("village", data.village || "");
      formData.append("address", data.address || "");
      formData.append("contact_phone", data.contact_phone || "");
      formData.append("contact_email", data.contact_email || "");

      if (showSaleMode) {
        formData.append("sale_mode", data.sale_mode || "");
      }

      if (showBedroomsBathrooms) {
        appendIfPresent(formData, "bedrooms", data.bedrooms);
        appendIfPresent(formData, "bathrooms", data.bathrooms);
      } else {
        formData.append("bedrooms", "0");
        formData.append("bathrooms", "0");
      }

      if (showUpi) formData.append("upi", data.upi || "");
      else formData.append("upi", "");

      if (showLandSize) appendIfPresent(formData, "land_size", data.land_size);
      else formData.append("land_size", "0");

      if (showUtilities) {
        formData.append("has_electricity", String(!!data.has_electricity));
        formData.append("has_water", String(!!data.has_water));
      } else {
        formData.append("has_electricity", "false");
        formData.append("has_water", "false");
      }

      if (isCar) {
        formData.append("latitude", "");
        formData.append("longitude", "");

        formData.append("car_make", data.car_make || "");
        formData.append("car_model", data.car_model || "");
        appendIfPresent(formData, "car_year", data.car_year);
        appendIfPresent(formData, "car_mileage", data.car_mileage);
        appendIfPresent(formData, "car_fuel_type", data.car_fuel_type);
        appendIfPresent(formData, "car_transmission", data.car_transmission);
        appendIfPresent(formData, "car_condition", data.car_condition);
        appendIfPresent(formData, "car_color", data.car_color);
      } else {
        formData.append("latitude", data.latitude !== undefined ? String(data.latitude) : "");
        formData.append("longitude", data.longitude !== undefined ? String(data.longitude) : "");

        formData.append("car_make", "");
        formData.append("car_model", "");
        formData.append("car_year", "");
        formData.append("car_mileage", "");
        formData.append("car_fuel_type", "");
        formData.append("car_transmission", "");
        formData.append("car_condition", "");
        formData.append("car_color", "");
      }

      if (isProductType) {
        appendIfPresent(formData, "brand", data.brand);
        appendIfPresent(formData, "stock_quantity", data.stock_quantity);
        appendIfPresent(formData, "sku", data.sku);
        appendIfPresent(formData, "product_condition", data.product_condition);
        formData.append("has_home_delivery", String(!!data.has_home_delivery));
        appendIfPresent(formData, "delivery_fee", data.delivery_fee);
        appendIfPresent(formData, "delivery_notes", data.delivery_notes);
      } else {
        formData.append("brand", "");
        formData.append("stock_quantity", "");
        formData.append("sku", "");
        formData.append("product_condition", "");
        formData.append("has_home_delivery", "false");
        formData.append("delivery_fee", "");
        formData.append("delivery_notes", "");
      }

      if (listingType === "clothes_product") {
        appendIfPresent(formData, "clothes_gender", data.clothes_gender);
        appendIfPresent(formData, "clothes_size", data.clothes_size);
        appendIfPresent(formData, "clothes_color", data.clothes_color);
        appendIfPresent(formData, "clothes_material", data.clothes_material);
        appendIfPresent(formData, "clothes_category", data.clothes_category);
      } else {
        formData.append("clothes_gender", "");
        formData.append("clothes_size", "");
        formData.append("clothes_color", "");
        formData.append("clothes_material", "");
        formData.append("clothes_category", "");
      }

      if (listingType === "food_product") {
        appendIfPresent(formData, "food_category", data.food_category);
        appendIfPresent(formData, "food_unit", data.food_unit);
        appendIfPresent(formData, "food_weight_volume", data.food_weight_volume);
        formData.append("is_perishable", String(!!data.is_perishable));
        appendIfPresent(formData, "expiry_date", data.expiry_date);
        formData.append("is_prepared_food", String(!!data.is_prepared_food));
      } else {
        formData.append("food_category", "");
        formData.append("food_unit", "");
        formData.append("food_weight_volume", "");
        formData.append("is_perishable", "false");
        formData.append("expiry_date", "");
        formData.append("is_prepared_food", "false");
      }

      if (listingType === "home_kitchen_product") {
        appendIfPresent(formData, "home_product_category", data.home_product_category);
        appendIfPresent(formData, "material", data.material);
        appendIfPresent(formData, "color", data.color);
        appendIfPresent(formData, "dimensions", data.dimensions);
        appendIfPresent(formData, "weight", data.weight);
        appendIfPresent(formData, "warranty_months", data.warranty_months);
      } else {
        formData.append("home_product_category", "");
        formData.append("material", "");
        formData.append("color", "");
        formData.append("dimensions", "");
        formData.append("weight", "");
        formData.append("warranty_months", "");
      }

      newImages.forEach((img) => formData.append("new_images", img.file));
      deletedImageIds.forEach((imageId) => formData.append("delete_image_ids", imageId));

      const coverId =
        selectedCoverImageId !== null && !deletedImageIds.includes(selectedCoverImageId)
          ? selectedCoverImageId
          : null;

      if (coverId !== null) formData.append("cover_image_id", coverId);

      const response = await api.patch(`/listings/${id}/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    },
    onSuccess: async (updatedListing) => {
      setMessage("Listing updated successfully.");
      setError("");
      clearAllNewImages();
      setDeletedImageIds([]);

      await queryClient.invalidateQueries({ queryKey: ["listings"] });
      await queryClient.invalidateQueries({ queryKey: ["listing", id] });
      await queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      await queryClient.invalidateQueries({ queryKey: ["all-moderation-listings"] });

      navigate(`/listings/${updatedListing.id}`);
    },
    onError: (err: any) => {
      setError(extractErrorMessage(err));
      setMessage("");
    },
  });

  const onSubmit = (data: ListingForm) => {
    setError("");
    setMessage("");
    updateMutation.mutate(data);
  };

  const visibleExistingImages = normalizedImages.filter((img) => !deletedImageIds.includes(img.normalizedId));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PageContainer>
          <div className="mx-auto max-w-4xl py-10">
            <Card>
              <p className="text-slate-600">Loading listing...</p>
            </Card>
          </div>
        </PageContainer>
      </div>
    );
  }

  if (isError || !listing) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PageContainer>
          <div className="mx-auto max-w-4xl py-10">
            <Card>
              <p className="text-red-600">Unable to load listing.</p>
            </Card>
          </div>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <PageContainer>
        <div className="mx-auto max-w-4xl py-10">
          <div className="mb-4">
            <Link
              to={`/listings/${listing.id}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft size={16} />
              Back to listing
            </Link>
          </div>

          <Card>
            <h1 className="mb-6 text-3xl font-bold text-slate-900">Edit Listing</h1>

            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {message && (
              <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Title</label>
                <Input placeholder="Title" {...register("title", { required: true })} />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Slug</label>
                <Input placeholder="Slug" {...register("slug", { required: true })} />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Category</label>
                <select
                  className="w-full rounded-2xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-700"
                  {...register("category")}
                >
                  <option value="">
                    {loadingCategories ? "Loading categories..." : "Select category"}
                  </option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Listing Type</label>
                <select
                  className="w-full rounded-2xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-700"
                  {...register("listing_type")}
                >
                  <option value="house">House</option>
                  <option value="parcel">Parcel</option>
                  <option value="business_ad">Business Advertisement</option>
                  <option value="car">Car</option>
                  <option value="clothes_product">Clothes Product</option>
                  <option value="food_product">Food Product</option>
                  <option value="home_kitchen_product">Home & Kitchen Product</option>
                </select>
              </div>

              {showSaleMode && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Sale Mode</label>
                  <select
                    className="w-full rounded-2xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-700"
                    {...register("sale_mode")}
                  >
                    {listingType === "house" && (
                      <>
                        <option value="sell">Sell</option>
                        <option value="rent">Rent</option>
                      </>
                    )}

                    {(listingType === "parcel" ||
                      listingType === "car" ||
                      listingType === "clothes_product" ||
                      listingType === "food_product" ||
                      listingType === "home_kitchen_product") && (
                      <option value="sell">Sell</option>
                    )}
                  </select>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Price</label>
                <Input
                  placeholder="Price"
                  type="number"
                  {...register("price", { valueAsNumber: true, required: true })}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Discount Price</label>
                <Input
                  placeholder="Discount Price"
                  type="number"
                  step="0.01"
                  {...register("discount_price", {
                    setValueAs: (value) => (value === "" || value === null ? undefined : Number(value)),
                  })}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Is Price Negotiable?
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                  <input type="checkbox" className="h-4 w-4" {...register("negotiable")} />
                  <span className="text-sm text-slate-700">Yes</span>
                </div>
              </div>

              {showBedroomsBathrooms && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Bedrooms</label>
                    <Input
                      placeholder="Bedrooms"
                      type="number"
                      {...register("bedrooms", { valueAsNumber: true })}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Bathrooms</label>
                    <Input
                      placeholder="Bathrooms"
                      type="number"
                      {...register("bathrooms", { valueAsNumber: true })}
                    />
                  </div>
                </>
              )}

              {showUpi && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">UPI</label>
                  <Input placeholder="UPI" {...register("upi")} />
                </div>
              )}

              {showLandSize && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Land Size (m²)</label>
                  <Input
                    placeholder="Land Size in square meters"
                    type="number"
                    step="0.01"
                    {...register("land_size", { valueAsNumber: true })}
                  />
                </div>
              )}

              {isCar && (
                <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-4 text-sm font-semibold text-slate-800">Car Details</p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Make</label>
                      <Input placeholder="e.g. Toyota" {...register("car_make")} />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Model</label>
                      <Input placeholder="e.g. Corolla" {...register("car_model")} />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Year</label>
                      <Input
                        placeholder="e.g. 2018"
                        type="number"
                        {...register("car_year", {
                          setValueAs: (v) => (v === "" ? undefined : Number(v)),
                        })}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Mileage (km)</label>
                      <Input
                        placeholder="e.g. 85000"
                        type="number"
                        {...register("car_mileage", {
                          setValueAs: (v) => (v === "" ? undefined : Number(v)),
                        })}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Fuel Type</label>
                      <select
                        className="w-full rounded-2xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-700"
                        {...register("car_fuel_type")}
                      >
                        <option value="">Select fuel type</option>
                        <option value="petrol">Petrol</option>
                        <option value="diesel">Diesel</option>
                        <option value="electric">Electric</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Transmission</label>
                      <select
                        className="w-full rounded-2xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-700"
                        {...register("car_transmission")}
                      >
                        <option value="">Select transmission</option>
                        <option value="manual">Manual</option>
                        <option value="automatic">Automatic</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Condition</label>
                      <select
                        className="w-full rounded-2xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-700"
                        {...register("car_condition")}
                      >
                        <option value="">Select condition</option>
                        <option value="new">New</option>
                        <option value="used">Used</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Color</label>
                      <Input placeholder="e.g. Black" {...register("car_color")} />
                    </div>
                  </div>
                </div>
              )}

              {isProductType && (
                <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-4 text-sm font-semibold text-slate-800">Product Details</p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Brand</label>
                      <Input placeholder="Brand" {...register("brand")} />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Stock Quantity</label>
                      <Input
                        placeholder="Stock Quantity"
                        type="number"
                        {...register("stock_quantity", {
                          setValueAs: (v) => (v === "" ? undefined : Number(v)),
                        })}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">SKU</label>
                      <Input placeholder="SKU" {...register("sku")} />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Product Condition</label>
                      <select
                        className="w-full rounded-2xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-700"
                        {...register("product_condition")}
                      >
                        <option value="">Select condition</option>
                        <option value="new">New</option>
                        <option value="used">Used</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          {...register("has_home_delivery")}
                        />
                        <span className="text-sm text-slate-700">Home delivery available</span>
                      </label>
                    </div>

                    {hasHomeDelivery && (
                      <>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">Delivery Fee</label>
                          <Input
                            placeholder="Delivery Fee"
                            type="number"
                            step="0.01"
                            {...register("delivery_fee", {
                              setValueAs: (v) => (v === "" ? undefined : Number(v)),
                            })}
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">Delivery Notes</label>
                          <Input
                            placeholder="Delivery within Kigali, same day..."
                            {...register("delivery_notes")}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {listingType === "clothes_product" && (
                <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-4 text-sm font-semibold text-slate-800">Clothes Details</p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Clothes Category</label>
                      <Input
                        placeholder="Shirt, Dress, Shoes..."
                        {...register("clothes_category")}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Gender</label>
                      <select
                        className="w-full rounded-2xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-700"
                        {...register("clothes_gender")}
                      >
                        <option value="">Select gender</option>
                        <option value="men">Men</option>
                        <option value="women">Women</option>
                        <option value="unisex">Unisex</option>
                        <option value="kids">Kids</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Size</label>
                      <select
                        className="w-full rounded-2xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-700"
                        {...register("clothes_size")}
                      >
                        <option value="">Select size</option>
                        <option value="xs">XS</option>
                        <option value="s">S</option>
                        <option value="m">M</option>
                        <option value="l">L</option>
                        <option value="xl">XL</option>
                        <option value="xxl">XXL</option>
                        <option value="xxxl">XXXL</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Color</label>
                      <Input placeholder="Black" {...register("clothes_color")} />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Material</label>
                      <Input placeholder="Cotton" {...register("clothes_material")} />
                    </div>
                  </div>
                </div>
              )}

              {listingType === "food_product" && (
                <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-4 text-sm font-semibold text-slate-800">Food Details</p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Food Category</label>
                      <Input
                        placeholder="Fresh food, snack, bakery, drink..."
                        {...register("food_category")}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Unit</label>
                      <select
                        className="w-full rounded-2xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-700"
                        {...register("food_unit")}
                      >
                        <option value="">Select unit</option>
                        <option value="piece">Piece</option>
                        <option value="kg">Kg</option>
                        <option value="gram">Gram</option>
                        <option value="liter">Liter</option>
                        <option value="ml">Ml</option>
                        <option value="pack">Pack</option>
                        <option value="plate">Plate</option>
                        <option value="box">Box</option>
                        <option value="bottle">Bottle</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Weight / Volume</label>
                      <Input
                        placeholder="1kg, 500ml, 12 pieces"
                        {...register("food_weight_volume")}
                      />
                    </div>

                    <div className="sm:col-span-2 grid gap-3 sm:grid-cols-2">
                      <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          {...register("is_perishable")}
                        />
                        <span className="text-sm text-slate-700">Perishable</span>
                      </label>

                      <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          {...register("is_prepared_food")}
                        />
                        <span className="text-sm text-slate-700">Prepared food</span>
                      </label>
                    </div>

                    {isPerishable && (
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Expiry Date</label>
                        <Input type="date" {...register("expiry_date")} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {listingType === "home_kitchen_product" && (
                <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-4 text-sm font-semibold text-slate-800">Home & Kitchen Details</p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Product Category</label>
                      <Input
                        placeholder="Cookware, furniture, decor..."
                        {...register("home_product_category")}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Material</label>
                      <Input placeholder="Wood, steel..." {...register("material")} />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Color</label>
                      <Input placeholder="Brown" {...register("color")} />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Dimensions</label>
                      <Input placeholder="120x60x75 cm" {...register("dimensions")} />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Weight</label>
                      <Input placeholder="5kg" {...register("weight")} />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Warranty (months)</label>
                      <Input
                        placeholder="12"
                        type="number"
                        {...register("warranty_months", {
                          setValueAs: (v) => (v === "" ? undefined : Number(v)),
                        })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {showUtilities && (
                <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-3 text-sm font-semibold text-slate-800">Utilities</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                      <input type="checkbox" className="h-4 w-4" {...register("has_electricity")} />
                      <span className="text-sm text-slate-700">Property has electricity</span>
                    </label>

                    <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                      <input type="checkbox" className="h-4 w-4" {...register("has_water")} />
                      <span className="text-sm text-slate-700">Property has water</span>
                    </label>
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">District</label>
                <Input placeholder="District" {...register("district")} />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Sector</label>
                <Input placeholder="Sector" {...register("sector")} />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Village</label>
                <Input placeholder="Village" {...register("village")} />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">Address</label>
                <Input placeholder="Address" {...register("address")} />
              </div>

              {showMap && (
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Property Location (click on map)
                  </label>

                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <MapPicker
                      latitude={latitude}
                      longitude={longitude}
                      onChange={(lat, lng) => {
                        setValue("latitude", lat, { shouldDirty: true });
                        setValue("longitude", lng, { shouldDirty: true });
                      }}
                    />
                  </div>

                  <div className="mt-2 text-xs text-slate-500">
                    Selected: <span className="font-medium text-slate-700">{latitude ?? "N/A"}, {longitude ?? "N/A"}</span>
                  </div>

                  <input type="hidden" {...register("latitude", { valueAsNumber: true })} />
                  <input type="hidden" {...register("longitude", { valueAsNumber: true })} />
                </div>
              )}

              {!showMap && (
                <>
                  <input type="hidden" {...register("latitude", { valueAsNumber: true })} />
                  <input type="hidden" {...register("longitude", { valueAsNumber: true })} />
                </>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Contact Phone</label>
                <Input placeholder="Contact Phone" {...register("contact_phone")} />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Contact Email</label>
                <Input placeholder="Contact Email" type="email" {...register("contact_email")} />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
                <textarea
                  placeholder="Description"
                  className="min-h-36 w-full rounded-2xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-700"
                  {...register("description", { required: true })}
                />
              </div>

              <div className="md:col-span-2">
                <h2 className="mb-3 text-lg font-semibold text-slate-900">Existing Images</h2>

                {normalizedImages.length > 0 ? (
                  <>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <p className="text-sm text-slate-600">
                        Current selected cover: <span className="font-semibold">{selectedCoverImageId || "None"}</span>
                      </p>

                      {selectedCoverImageId !== initialCoverImageId && (
                        <button
                          type="button"
                          onClick={resetCoverImage}
                          className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                        >
                          Reset cover
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                      {normalizedImages.map((img) => {
                        const isDeleted = deletedImageIds.includes(img.normalizedId);
                        const isSelectedCover = selectedCoverImageId === img.normalizedId;

                        return (
                          <div
                            key={img.normalizedId}
                            className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${
                              isDeleted ? "border-red-300 opacity-50" : "border-slate-200"
                            }`}
                          >
                            <img
                              src={img.image}
                              alt={img.alt_text || "Listing image"}
                              className="h-32 w-full object-cover"
                            />

                            <div className="space-y-2 p-2">
                              <div className="flex flex-wrap gap-2">
                                {img.is_cover && !isDeleted && (
                                  <span className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700">
                                    Current cover
                                  </span>
                                )}

                                {isSelectedCover && !isDeleted && (
                                  <span className="rounded-full bg-green-50 px-2 py-1 text-[11px] font-medium text-green-700">
                                    Selected cover
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-col gap-2">
                                <button
                                  type="button"
                                  disabled={isDeleted}
                                  onClick={() => handleSetCoverImage(img.normalizedId)}
                                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Set as cover
                                </button>

                                <button
                                  type="button"
                                  onClick={() => toggleDeleteExistingImage(img.normalizedId)}
                                  className={`rounded-xl px-3 py-2 text-xs font-medium text-white ${
                                    isDeleted ? "bg-slate-500 hover:bg-slate-600" : "bg-red-600 hover:bg-red-700"
                                  }`}
                                >
                                  {isDeleted ? "Undo remove" : "Remove"}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">No existing images.</p>
                )}
              </div>

              <div className="md:col-span-2">
                <h2 className="mb-3 text-lg font-semibold text-slate-900">Add New Images</h2>

                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImagesChange}
                  className="w-full rounded-2xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-700"
                />

                <p className="mt-2 text-xs text-slate-500">
                  You can add more images. After upload, you can later choose one of the saved images as cover.
                </p>

                {newImages.length > 0 && (
                  <div className="mt-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-700">{newImages.length} new image(s) selected</p>

                      <button
                        type="button"
                        onClick={clearAllNewImages}
                        className="text-sm font-medium text-red-600 hover:text-red-700"
                      >
                        Clear all
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                      {newImages.map((item, index) => (
                        <div
                          key={`${item.file.name}-${index}`}
                          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                        >
                          <img src={item.preview} alt={item.file.name} className="h-32 w-full object-cover" />

                          <div className="space-y-2 p-2">
                            <p className="truncate text-xs text-slate-600">{item.file.name}</p>

                            <button
                              type="button"
                              onClick={() => removeNewImage(index)}
                              className="w-full rounded-xl bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <p className="text-sm text-slate-600">
                  Remaining existing images after save:{" "}
                  <span className="font-semibold">{visibleExistingImages.length}</span>
                </p>
              </div>

              <Button type="submit" className="md:col-span-2" disabled={isSubmitting || updateMutation.isPending}>
                {isSubmitting || updateMutation.isPending ? "Saving changes..." : "Save changes"}
              </Button>
            </form>
          </Card>
        </div>
      </PageContainer>
    </div>
  );
}