import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
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

  latitude?: number;
  longitude?: number;

  negotiable?: boolean;

  // House
  bedrooms?: number;
  bathrooms?: number;
  has_electricity: boolean;
  has_water: boolean;

  // Parcel
  upi: string;
  land_size?: number;

  // Car
  car_make?: string;
  car_model?: string;
  car_year?: number;
  car_mileage?: number;
  car_fuel_type?: string;
  car_transmission?: string;
  car_condition?: string;
  car_color?: string;

  // Common product fields
  brand?: string;
  stock_quantity?: number;
  sku?: string;
  product_condition?: string;
  has_home_delivery?: boolean;
  delivery_fee?: number;
  delivery_notes?: string;

  // Clothes product
  clothes_gender?: string;
  clothes_size?: string;
  clothes_color?: string;
  clothes_material?: string;
  clothes_category?: string;

  // Food product
  food_category?: string;
  food_unit?: string;
  food_weight_volume?: string;
  is_perishable?: boolean;
  expiry_date?: string;
  is_prepared_food?: boolean;

  // Home & kitchen product
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

const PRODUCT_TYPES = [
  "clothes_product",
  "food_product",
  "home_kitchen_product",
];

export default function PublishListingPage() {
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
      latitude: undefined,
      longitude: undefined,
      negotiable: false,

      bedrooms: 0,
      bathrooms: 0,
      upi: "",
      land_size: 0,
      has_electricity: false,
      has_water: false,

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

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

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
  const showLandSize = isParcel || isHouse;
  const showBedroomsBathrooms = isHouse;
  const showUpi = isParcel || isHouse;
  const showUtilities = isParcel || isHouse;
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
      if (imageToRemove) URL.revokeObjectURL(imageToRemove.preview);
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

  const appendIfPresent = (
    formData: FormData,
    key: string,
    value: string | number | boolean | undefined | null
  ) => {
    if (value === undefined || value === null || value === "") return;
    formData.append(key, String(value));
  };

  const onSubmit = async (data: ListingForm) => {
    try {
      setError("");
      setMessage("");

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
      }

      if (showUpi) {
        appendIfPresent(formData, "upi", data.upi);
      }

      if (showLandSize) {
        appendIfPresent(formData, "land_size", data.land_size);
      }

      if (showUtilities) {
        formData.append("has_electricity", String(!!data.has_electricity));
        formData.append("has_water", String(!!data.has_water));
      }

      if (isCar) {
        appendIfPresent(formData, "car_make", data.car_make);
        appendIfPresent(formData, "car_model", data.car_model);
        appendIfPresent(formData, "car_year", data.car_year);
        appendIfPresent(formData, "car_mileage", data.car_mileage);
        appendIfPresent(formData, "car_fuel_type", data.car_fuel_type);
        appendIfPresent(formData, "car_transmission", data.car_transmission);
        appendIfPresent(formData, "car_condition", data.car_condition);
        appendIfPresent(formData, "car_color", data.car_color);
      } else {
        appendIfPresent(formData, "latitude", data.latitude);
        appendIfPresent(formData, "longitude", data.longitude);
      }

      if (isProductType) {
        appendIfPresent(formData, "brand", data.brand);
        appendIfPresent(formData, "stock_quantity", data.stock_quantity);
        appendIfPresent(formData, "sku", data.sku);
        appendIfPresent(formData, "product_condition", data.product_condition);
        formData.append("has_home_delivery", String(!!data.has_home_delivery));
        appendIfPresent(formData, "delivery_fee", data.delivery_fee);
        appendIfPresent(formData, "delivery_notes", data.delivery_notes);
      }

      if (listingType === "clothes_product") {
        appendIfPresent(formData, "clothes_gender", data.clothes_gender);
        appendIfPresent(formData, "clothes_size", data.clothes_size);
        appendIfPresent(formData, "clothes_color", data.clothes_color);
        appendIfPresent(formData, "clothes_material", data.clothes_material);
        appendIfPresent(formData, "clothes_category", data.clothes_category);
      }

      if (listingType === "food_product") {
        appendIfPresent(formData, "food_category", data.food_category);
        appendIfPresent(formData, "food_unit", data.food_unit);
        appendIfPresent(formData, "food_weight_volume", data.food_weight_volume);
        formData.append("is_perishable", String(!!data.is_perishable));
        appendIfPresent(formData, "expiry_date", data.expiry_date);
        formData.append("is_prepared_food", String(!!data.is_prepared_food));
      }

      if (listingType === "home_kitchen_product") {
        appendIfPresent(formData, "home_product_category", data.home_product_category);
        appendIfPresent(formData, "material", data.material);
        appendIfPresent(formData, "color", data.color);
        appendIfPresent(formData, "dimensions", data.dimensions);
        appendIfPresent(formData, "weight", data.weight);
        appendIfPresent(formData, "warranty_months", data.warranty_months);
      }

      images.forEach((image) => formData.append("new_images", image.file));

      const listingRes = await api.post("/listings/", formData);
      const listingId = listingRes.data.id;

      const paymentRes = await api.post("/payments/create-listing-payment/", {
        listing_id: listingId,
      });

      setMessage(
        `Listing created successfully. Publishing fee required: ${paymentRes.data.amount} ${paymentRes.data.currency}`
      );

      clearAllImages();

      reset({
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
        latitude: undefined,
        longitude: undefined,
        negotiable: false,

        bedrooms: 0,
        bathrooms: 0,
        upi: "",
        land_size: 0,
        has_electricity: false,
        has_water: false,

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
      });
    } catch (err: any) {
      const responseData = err?.response?.data;

      if (typeof responseData === "string") {
        setError(responseData);
      } else if (responseData?.detail) {
        setError(responseData.detail);
      } else if (responseData && typeof responseData === "object") {
        const firstError = Object.entries(responseData)
          .map(([field, messages]) => {
            return `${field}: ${Array.isArray(messages) ? messages.join(", ") : messages}`;
          })
          .join(" | ");
        setError(firstError);
      } else {
        setError("Failed to create listing.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <PageContainer>
        <div className="mx-auto max-w-4xl py-10">
          <Card>
            <h1 className="mb-6 text-3xl font-bold text-slate-900">
              Publish Listing
            </h1>

            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Title
                </label>
                <Input placeholder="Title" {...register("title", { required: true })} />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Slug
                </label>
                <Input placeholder="Slug" {...register("slug", { required: true })} />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Category
                </label>
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
                  <option value="car">Car</option>
                  <option value="clothes_product">Clothes Product</option>
                  <option value="food_product">Food Product</option>
                  <option value="home_kitchen_product">Home & Kitchen Product</option>
                </select>
              </div>

              {showSaleMode && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Sale Mode
                  </label>
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

                    {listingType === "business_ad" && (
                      <option value="ads">Ads</option>
                    )}
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
                  {...register("price", { valueAsNumber: true, required: true })}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Discount Price
                </label>
                <Input
                  placeholder="Discount Price"
                  type="number"
                  step="0.01"
                  {...register("discount_price", {
                    setValueAs: (v) => (v === "" ? undefined : Number(v)),
                  })}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Is Price Negotiable?
                </label>

                <label className="flex w-full rounded-2xl border border-slate-300 bg-white px-3 py-3 outline-none">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 shrink-0"
                    {...register("negotiable")}
                  />
                  <span className="ml-3 text-sm text-slate-700">Yes</span>
                </label>
              </div>

              {showBedroomsBathrooms && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Bedrooms
                    </label>
                    <Input
                      placeholder="Bedrooms"
                      type="number"
                      {...register("bedrooms", {
                        setValueAs: (v) => (v === "" ? undefined : Number(v)),
                      })}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Bathrooms
                    </label>
                    <Input
                      placeholder="Bathrooms"
                      type="number"
                      {...register("bathrooms", {
                        setValueAs: (v) => (v === "" ? undefined : Number(v)),
                      })}
                    />
                  </div>
                </>
              )}

              {showUpi && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    UPI
                  </label>
                  <Input placeholder="UPI" {...register("upi")} />
                </div>
              )}

              {showLandSize && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Land Size (m²)
                  </label>
                  <Input
                    placeholder="Land Size in square meters"
                    type="number"
                    step="0.01"
                    {...register("land_size", {
                      setValueAs: (v) => (v === "" ? undefined : Number(v)),
                    })}
                  />
                </div>
              )}

              {isCar && (
                <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-4 text-sm font-semibold text-slate-800">Car Details</p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Make
                      </label>
                      <Input placeholder="e.g. Toyota" {...register("car_make")} />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Model
                      </label>
                      <Input placeholder="e.g. Corolla" {...register("car_model")} />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Year
                      </label>
                      <Input
                        placeholder="e.g. 2018"
                        type="number"
                        {...register("car_year", {
                          setValueAs: (v) => (v === "" ? undefined : Number(v)),
                        })}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Mileage (km)
                      </label>
                      <Input
                        placeholder="e.g. 85000"
                        type="number"
                        {...register("car_mileage", {
                          setValueAs: (v) => (v === "" ? undefined : Number(v)),
                        })}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Fuel Type
                      </label>
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
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Transmission
                      </label>
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
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Condition
                      </label>
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
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Color
                      </label>
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
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Brand
                      </label>
                      <Input placeholder="Brand" {...register("brand")} />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Stock Quantity
                      </label>
                      <Input
                        placeholder="Stock Quantity"
                        type="number"
                        {...register("stock_quantity", {
                          setValueAs: (v) => (v === "" ? undefined : Number(v)),
                        })}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        SKU
                      </label>
                      <Input placeholder="SKU" {...register("sku")} />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Product Condition
                      </label>
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
                        <span className="text-sm text-slate-700">
                          Home delivery available
                        </span>
                      </label>
                    </div>

                    {hasHomeDelivery && (
                      <>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Delivery Fee
                          </label>
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
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Delivery Notes
                          </label>
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
                  <p className="mb-4 text-sm font-semibold text-slate-800">
                    Clothes Details
                  </p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Clothes Category
                      </label>
                      <Input
                        placeholder="Shirt, Dress, Shoes..."
                        {...register("clothes_category")}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Gender
                      </label>
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
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Size
                      </label>
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
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Color
                      </label>
                      <Input placeholder="Black" {...register("clothes_color")} />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Material
                      </label>
                      <Input placeholder="Cotton" {...register("clothes_material")} />
                    </div>
                  </div>
                </div>
              )}

              {listingType === "food_product" && (
                <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-4 text-sm font-semibold text-slate-800">
                    Food Details
                  </p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Food Category
                      </label>
                      <Input
                        placeholder="Fresh food, snack, bakery, drink..."
                        {...register("food_category")}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Unit
                      </label>
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
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Weight / Volume
                      </label>
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
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Expiry Date
                        </label>
                        <Input type="date" {...register("expiry_date")} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {listingType === "home_kitchen_product" && (
                <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-4 text-sm font-semibold text-slate-800">
                    Home & Kitchen Details
                  </p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Product Category
                      </label>
                      <Input
                        placeholder="Cookware, furniture, decor..."
                        {...register("home_product_category")}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Material
                      </label>
                      <Input placeholder="Wood, steel..." {...register("material")} />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Color
                      </label>
                      <Input placeholder="Brown" {...register("color")} />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Dimensions
                      </label>
                      <Input placeholder="120x60x75 cm" {...register("dimensions")} />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Weight
                      </label>
                      <Input placeholder="5kg" {...register("weight")} />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Warranty (months)
                      </label>
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
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        {...register("has_electricity")}
                      />
                      <span className="text-sm text-slate-700">
                        House/Parcel has electricity
                      </span>
                    </label>

                    <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        {...register("has_water")}
                      />
                      <span className="text-sm text-slate-700">
                        House/Parcel has water
                      </span>
                    </label>
                  </div>
                </div>
              )}

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

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Village
                </label>
                <Input placeholder="Village" {...register("village")} />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Address
                </label>
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
                    Selected:{" "}
                    <span className="font-medium text-slate-700">
                      {latitude ?? "N/A"}, {longitude ?? "N/A"}
                    </span>
                  </div>

                  <input type="hidden" {...register("latitude")} />
                  <input type="hidden" {...register("longitude")} />
                </div>
              )}

              {!showMap && (
                <>
                  <input type="hidden" {...register("latitude")} />
                  <input type="hidden" {...register("longitude")} />
                </>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Contact Phone
                </label>
                <Input placeholder="Contact Phone" {...register("contact_phone")} />
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
                  You can upload multiple images. The first image will be treated as the cover image.
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
                            <p className="truncate text-xs text-slate-600">{item.file.name}</p>

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

              {message && <p className="text-sm text-green-700 md:col-span-2">{message}</p>}
              {error && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}

              <Button type="submit" className="md:col-span-2" disabled={isSubmitting}>
                {isSubmitting ? "Creating listing..." : "Create listing and continue to payment"}
              </Button>
            </form>
          </Card>
        </div>
      </PageContainer>
    </div>
  );
}