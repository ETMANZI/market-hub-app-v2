import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  MapPin,
  House,
  Building2,
  Layers3,
  ArrowLeft,
  Phone,
  CalendarDays,
  BedDouble,
  Bath,
  Ruler,
  Map,
  Car,
  Droplets,
  Zap,
  Fuel,
  Gauge,
  Palette,
  Cog,
  BadgeCheck,
  Package,
  Truck,
  Shirt,
  UtensilsCrossed,
  Home,
  Hash,
  Archive,
  Scale,
} from "lucide-react";
import PageContainer from "../components/layout/PageContainer";
import Card from "../components/ui/Card";
import { api } from "../lib/api";

import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

type ListingImage = {
  id: string;
  image: string;
  is_cover?: boolean;
};

type Listing = {
  id: string;
  title: string;
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
  discount_price?: string | number | null;
  district?: string;
  sector?: string;
  village?: string;
  address?: string;
  contact_phone?: string;
  contact_email?: string;
  owner_name?: string;
  status?: string;
  images?: ListingImage[];
  created_at?: string;
  bedrooms?: number;
  bathrooms?: number;
  upi?: string;
  land_size?: string | number;
  latitude?: string | number | null;
  longitude?: string | number | null;
  has_electricity?: boolean;
  has_water?: boolean;
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

function getListingIcon(type: Listing["listing_type"]) {
  if (type === "house") return <House size={16} />;
  if (type === "parcel") return <Layers3 size={16} />;
  if (type === "car") return <Car size={16} />;
  if (type === "clothes_product") return <Shirt size={16} />;
  if (type === "food_product") return <UtensilsCrossed size={16} />;
  if (type === "home_kitchen_product") return <Home size={16} />;
  return <Building2 size={16} />;
}

function getListingLabel(type: Listing["listing_type"]) {
  if (type === "house") return "House";
  if (type === "parcel") return "Parcel";
  if (type === "car") return "Car";
  if (type === "clothes_product") return "Clothes Product";
  if (type === "food_product") return "Food Product";
  if (type === "home_kitchen_product") return "Home & Kitchen Product";
  return "Business Ad";
}

function formatPrice(value?: string | number | null) {
  const amount = Math.round(parseFloat(String(value ?? 0)));
  if (Number.isNaN(amount)) return "0";
  return new Intl.NumberFormat("en-RW").format(amount);
}

function formatDate(value?: string | null) {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString("en-RW", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatLandSize(value?: string | number | null) {
  const num = Number(value ?? 0);
  if (Number.isNaN(num)) return "0 m²";
  return num % 1 === 0 ? `${num.toFixed(0)} m²` : `${num} m²`;
}

function formatMileage(value?: string | number | null) {
  const num = Number(value ?? 0);
  if (Number.isNaN(num)) return "0 km";
  return `${new Intl.NumberFormat("en-RW").format(num)} km`;
}

function formatNumber(value?: string | number | null) {
  const num = Number(value ?? 0);
  if (Number.isNaN(num)) return "0";
  return new Intl.NumberFormat("en-RW").format(num);
}

function formatLabel(value?: string | null) {
  if (!value) return "Not specified";
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, " ");
}

function formatPhoneForCall(phone?: string | null) {
  if (!phone) return "";
  return phone.replace(/\s+/g, "");
}

function formatPhoneForWhatsApp(phone?: string | null) {
  if (!phone) return "";
  const clean = phone.replace(/\D/g, "");

  if (clean.startsWith("250")) return clean;
  if (clean.startsWith("0")) return `25${clean}`;

  return clean;
}

function getWhatsAppLink(phone?: string | null, title?: string) {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  if (!formattedPhone) return "#";

  const text = encodeURIComponent(
    `Hello, I am interested in your listing${title ? `: ${title}` : ""}.`
  );

  return `https://wa.me/${formattedPhone}?text=${text}`;
}

function InfoTile({
  icon,
  label,
  value,
  valueClassName = "text-slate-900",
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-100 p-4">
      <div className="mb-2 flex items-center gap-2 text-slate-600">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className={`text-lg font-semibold ${valueClassName}`}>{value}</p>
    </div>
  );
}

export default function ListingDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [selectedImage, setSelectedImage] = useState<string>("");

  useEffect(() => {
    if (!id) return;

    api
      .post("/moderation/track-visitor/", {
        path: `/listings/${id}`,
      })
      .catch(() => {});

    api.post(`/listings/${id}/increment_view/`).catch(() => {});
  }, [id]);

  const { data: listing, isLoading, isError } = useQuery<Listing>({
    queryKey: ["public-listing", id],
    queryFn: async () => {
      const response = await api.get(`/public/listings/${id}/`);
      return response.data;
    },
    enabled: !!id,
  });

  const handleTrackContact = async (contactType: "call" | "whatsapp") => {
    if (!listing?.id) return;

    try {
      await api.post(`/listings/${listing.id}/track_contact/`, {
        contact_type: contactType,
      });
    } catch {
      // ignore tracking failure
    }
  };

  const images = listing?.images || [];
  const coverImage =
    selectedImage ||
    images.find((img) => img.is_cover)?.image ||
    images[0]?.image ||
    "";

  const isHouse = listing?.listing_type === "house";
  const isParcel = listing?.listing_type === "parcel";
  const isCar = listing?.listing_type === "car";
  const isClothes = listing?.listing_type === "clothes_product";
  const isFood = listing?.listing_type === "food_product";
  const isHomeKitchen = listing?.listing_type === "home_kitchen_product";
  const isProduct = isClothes || isFood || isHomeKitchen;
  const showPropertyDetails = isHouse || isParcel;

  const latNum = Number(listing?.latitude);
  const lngNum = Number(listing?.longitude);
  const hasCoordinates = Number.isFinite(latNum) && Number.isFinite(lngNum);

  return (
    <div className="min-h-screen bg-slate-50">
      <PageContainer>
        <div className="py-8 md:py-10">
          <div className="mb-6">
            <Link
              to="/listings"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft size={16} />
              Back to listings
            </Link>
          </div>

          {isLoading ? (
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="animate-pulse lg:col-span-2">
                <div className="h-[420px] rounded-2xl bg-slate-200" />
              </Card>

              <Card className="animate-pulse">
                <div className="space-y-4">
                  <div className="h-6 w-2/3 rounded bg-slate-200" />
                  <div className="h-4 w-1/2 rounded bg-slate-200" />
                  <div className="h-4 w-full rounded bg-slate-200" />
                  <div className="h-4 w-5/6 rounded bg-slate-200" />
                </div>
              </Card>
            </div>
          ) : isError || !listing ? (
            <Card>
              <p className="text-red-600">Unable to load listing details.</p>
            </Card>
          ) : (
            <>
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <Card className="overflow-hidden p-0">
                    <div className="h-[420px] w-full bg-slate-200">
                      {coverImage ? (
                        <img
                          src={coverImage}
                          alt={listing.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-500">
                          No Image
                        </div>
                      )}
                    </div>
                  </Card>

                  {images.length > 1 && (
                    <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                      {images.map((img) => (
                        <button
                          key={img.id}
                          type="button"
                          onClick={() => setSelectedImage(img.image)}
                          className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                        >
                          <img
                            src={img.image}
                            alt={listing.title}
                            className="h-24 w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}

                  <Card className="mt-6">
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        {getListingIcon(listing.listing_type)}
                        {getListingLabel(listing.listing_type)}
                      </span>

                      {listing.sale_mode && (
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                          {listing.sale_mode === "sell"
                            ? "For Sale"
                            : listing.sale_mode === "rent"
                            ? "For Rent"
                            : "Advertisement"}
                        </span>
                      )}

                      {listing.negotiable ? (
                        <span className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-700">
                          Negotiable
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                          Fixed Price
                        </span>
                      )}
                    </div>

                    <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
                      {listing.title}
                    </h1>

                    {(listing.address || listing.district || listing.sector || listing.village) && (
                      <div className="mt-3 flex items-start gap-2 text-slate-600">
                        <MapPin size={18} className="mt-0.5 shrink-0" />
                        <span>
                          {listing.address ||
                            [listing.district, listing.sector, listing.village]
                              .filter(Boolean)
                              .join(", ") ||
                            "Location not specified"}
                        </span>
                      </div>
                    )}

                    {isCar && (
                      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <InfoTile icon={<Car size={16} />} label="Make" value={listing.car_make || "Not specified"} />
                        <InfoTile icon={<Car size={16} />} label="Model" value={listing.car_model || "Not specified"} />
                        <InfoTile icon={<CalendarDays size={16} />} label="Year" value={listing.car_year || "Not specified"} />
                        <InfoTile icon={<Gauge size={16} />} label="Mileage" value={formatMileage(listing.car_mileage)} />
                        <InfoTile icon={<Fuel size={16} />} label="Fuel Type" value={formatLabel(listing.car_fuel_type)} />
                        <InfoTile icon={<Cog size={16} />} label="Transmission" value={formatLabel(listing.car_transmission)} />
                        <InfoTile icon={<BadgeCheck size={16} />} label="Condition" value={formatLabel(listing.car_condition)} />
                        <InfoTile icon={<Palette size={16} />} label="Color" value={listing.car_color || "Not specified"} />
                      </div>
                    )}

                    {showPropertyDetails && (
                      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {isHouse && (
                          <>
                            <InfoTile icon={<BedDouble size={16} />} label="Bedrooms" value={listing.bedrooms ?? 0} />
                            <InfoTile icon={<Bath size={16} />} label="Bathrooms" value={listing.bathrooms ?? 0} />
                          </>
                        )}

                        <InfoTile icon={<Ruler size={16} />} label="Land Size" value={formatLandSize(listing.land_size)} />

                        {listing.upi && (
                          <InfoTile icon={<Map size={16} />} label="UPI" value={listing.upi} />
                        )}

                        <InfoTile
                          icon={<Zap size={16} />}
                          label="Electricity"
                          value={listing.has_electricity ? "Available" : "Not Available"}
                          valueClassName={listing.has_electricity ? "text-green-600" : "text-slate-900"}
                        />

                        <InfoTile
                          icon={<Droplets size={16} />}
                          label="Water"
                          value={listing.has_water ? "Available" : "Not Available"}
                          valueClassName={listing.has_water ? "text-green-600" : "text-slate-900"}
                        />
                      </div>
                    )}

                    {isProduct && (
                      <div className="mt-6">
                        <h2 className="mb-4 text-lg font-semibold text-slate-900">
                          Product Details
                        </h2>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          <InfoTile icon={<Package size={16} />} label="Brand" value={listing.brand || "Not specified"} />
                          <InfoTile
                            icon={<Archive size={16} />}
                            label="Stock Quantity"
                            value={listing.stock_quantity != null ? formatNumber(listing.stock_quantity) : "Not specified"}
                          />
                          <InfoTile icon={<Hash size={16} />} label="SKU" value={listing.sku || "Not specified"} />
                          <InfoTile
                            icon={<BadgeCheck size={16} />}
                            label="Condition"
                            value={formatLabel(listing.product_condition)}
                          />
                          <InfoTile
                            icon={<Truck size={16} />}
                            label="Home Delivery"
                            value={listing.has_home_delivery ? "Available" : "Not Available"}
                            valueClassName={listing.has_home_delivery ? "text-green-600" : "text-slate-900"}
                          />
                          <InfoTile
                            icon={<Truck size={16} />}
                            label="Delivery Fee"
                            value={
                              listing.has_home_delivery
                                ? `RWF ${formatPrice(listing.delivery_fee)}`
                                : "Not applicable"
                            }
                          />
                        </div>

                        {listing.delivery_notes && (
                          <div className="mt-4 rounded-2xl bg-slate-100 p-4">
                            <p className="text-sm font-medium text-slate-700">Delivery Notes</p>
                            <p className="mt-2 text-slate-600">{listing.delivery_notes}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {isClothes && (
                      <div className="mt-6">
                        <h2 className="mb-4 text-lg font-semibold text-slate-900">
                          Clothes Details
                        </h2>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          <InfoTile
                            icon={<Shirt size={16} />}
                            label="Category"
                            value={listing.clothes_category || "Not specified"}
                          />
                          <InfoTile
                            icon={<BadgeCheck size={16} />}
                            label="Gender"
                            value={formatLabel(listing.clothes_gender)}
                          />
                          <InfoTile
                            icon={<Ruler size={16} />}
                            label="Size"
                            value={listing.clothes_size?.toUpperCase() || "Not specified"}
                          />
                          <InfoTile
                            icon={<Palette size={16} />}
                            label="Color"
                            value={listing.clothes_color || "Not specified"}
                          />
                          <InfoTile
                            icon={<Package size={16} />}
                            label="Material"
                            value={listing.clothes_material || "Not specified"}
                          />
                        </div>
                      </div>
                    )}

                    {isFood && (
                      <div className="mt-6">
                        <h2 className="mb-4 text-lg font-semibold text-slate-900">
                          Food Details
                        </h2>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          <InfoTile
                            icon={<UtensilsCrossed size={16} />}
                            label="Category"
                            value={listing.food_category || "Not specified"}
                          />
                          <InfoTile
                            icon={<Scale size={16} />}
                            label="Unit"
                            value={formatLabel(listing.food_unit)}
                          />
                          <InfoTile
                            icon={<Package size={16} />}
                            label="Weight / Volume"
                            value={listing.food_weight_volume || "Not specified"}
                          />
                          <InfoTile
                            icon={<BadgeCheck size={16} />}
                            label="Perishable"
                            value={listing.is_perishable ? "Yes" : "No"}
                            valueClassName={listing.is_perishable ? "text-green-600" : "text-slate-900"}
                          />
                          <InfoTile
                            icon={<CalendarDays size={16} />}
                            label="Expiry Date"
                            value={
                              listing.is_perishable
                                ? formatDate(listing.expiry_date || undefined)
                                : "Not applicable"
                            }
                          />
                          <InfoTile
                            icon={<UtensilsCrossed size={16} />}
                            label="Prepared Food"
                            value={listing.is_prepared_food ? "Yes" : "No"}
                            valueClassName={listing.is_prepared_food ? "text-green-600" : "text-slate-900"}
                          />
                        </div>
                      </div>
                    )}

                    {isHomeKitchen && (
                      <div className="mt-6">
                        <h2 className="mb-4 text-lg font-semibold text-slate-900">
                          Home & Kitchen Details
                        </h2>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          <InfoTile
                            icon={<Home size={16} />}
                            label="Category"
                            value={listing.home_product_category || "Not specified"}
                          />
                          <InfoTile
                            icon={<Package size={16} />}
                            label="Material"
                            value={listing.material || "Not specified"}
                          />
                          <InfoTile
                            icon={<Palette size={16} />}
                            label="Color"
                            value={listing.color || "Not specified"}
                          />
                          <InfoTile
                            icon={<Ruler size={16} />}
                            label="Dimensions"
                            value={listing.dimensions || "Not specified"}
                          />
                          <InfoTile
                            icon={<Scale size={16} />}
                            label="Weight"
                            value={listing.weight || "Not specified"}
                          />
                          <InfoTile
                            icon={<BadgeCheck size={16} />}
                            label="Warranty"
                            value={
                              listing.warranty_months != null
                                ? `${listing.warranty_months} month(s)`
                                : "Not specified"
                            }
                          />
                        </div>
                      </div>
                    )}

                    <div className="mt-6">
                      <h2 className="text-lg font-semibold text-slate-900">Description</h2>
                      <p className="mt-2 whitespace-pre-line leading-7 text-slate-600">
                        {listing.description || "No description provided."}
                      </p>
                    </div>
                  </Card>
                </div>

                <div>
                  <Card>
                    <p className="text-sm text-slate-500">Price</p>

                    <div className="mt-2">
                      {listing.discount_price && Number(listing.discount_price) > 0 ? (
                        <div className="flex flex-col">
                          <span className="text-base text-slate-400 line-through">
                            RWF {formatPrice(listing.price)}
                          </span>
                          <h2 className="text-3xl font-bold text-green-600">
                            RWF {formatPrice(listing.discount_price)}
                          </h2>
                        </div>
                      ) : (
                        <h2 className="text-3xl font-bold text-slate-900">
                          RWF {formatPrice(listing.price)}
                        </h2>
                      )}
                    </div>

                    <div className="mt-2">
                      {listing.negotiable ? (
                        <span className="inline-block rounded-full bg-yellow-50 px-3 py-1 text-xs font-medium text-green-700">
                          Negotiable
                        </span>
                      ) : (
                        <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-red-600">
                          Fixed Price
                        </span>
                      )}
                    </div>

                    <div className="mt-6 space-y-4 text-sm text-slate-600">
                      {(listing.district || listing.sector || listing.village) && (
                        <div className="flex items-start gap-3">
                          <MapPin size={18} className="mt-0.5 shrink-0" />
                          <div>
                            <p className="font-medium text-slate-900">Location</p>
                            <p>
                              {[listing.district, listing.sector, listing.village]
                                .filter(Boolean)
                                .join(", ") || "Not specified"}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-3">
                        <CalendarDays size={18} className="mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium text-slate-900">Posted on</p>
                          <p>{formatDate(listing.created_at)}</p>
                        </div>
                      </div>

                      {listing.contact_email && (
                        <div className="flex items-start gap-3">
                          <Package size={18} className="mt-0.5 shrink-0" />
                          <div>
                            <p className="font-medium text-slate-900">Email</p>
                            <p>{listing.contact_email}</p>
                          </div>
                        </div>
                      )}

                      {hasCoordinates && !isCar && (
                        <div className="space-y-2">
                          <div className="flex items-start gap-3">
                            <Map size={18} className="mt-0.5 shrink-0" />
                            <div>
                              <p className="font-medium text-slate-900">Map Location</p>
                              <a
                                href={`https://www.google.com/maps?q=${latNum},${lngNum}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                View on Google Maps
                              </a>
                              <p className="mt-1 text-xs text-slate-500">
                                {latNum}, {lngNum}
                              </p>
                            </div>
                          </div>

                          <div className="overflow-hidden rounded-2xl border border-slate-200">
                            <MapContainer
                              center={[latNum, lngNum]}
                              zoom={16}
                              scrollWheelZoom={false}
                              style={{ height: "220px", width: "100%" }}
                            >
                              <TileLayer
                                attribution="© OpenStreetMap"
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                              />
                              <Marker position={[latNum, lngNum]} icon={markerIcon} />
                            </MapContainer>
                          </div>
                        </div>
                      )}

                      {listing.contact_phone && (
                        <div className="flex items-start gap-3">
                          <Phone size={18} className="mt-0.5 shrink-0" />
                          <div>
                            <p className="font-medium text-slate-900">Contact</p>
                            <p>{listing.contact_phone}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      {listing.contact_phone ? (
                        <>
                          <a
                            href={`tel:${formatPhoneForCall(listing.contact_phone)}`}
                            onClick={() => handleTrackContact("call")}
                            className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-300 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-600"
                          >
                            Call Now
                          </a>

                          <a
                            href={getWhatsAppLink(listing.contact_phone, listing.title)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => handleTrackContact("whatsapp")}
                            className="inline-flex w-full items-center justify-center rounded-2xl bg-green-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-green-700"
                          >
                            WhatsApp
                          </a>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="w-full rounded-2xl bg-slate-300 px-4 py-3 text-white"
                          disabled
                        >
                          No Contact Available
                        </button>
                      )}
                    </div>
                  </Card>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  to="/listings"
                  className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  <ArrowLeft size={16} />
                  Back to listings
                </Link>
              </div>
            </>
          )}
        </div>
      </PageContainer>
    </div>
  );
}