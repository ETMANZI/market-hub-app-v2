from rest_framework import serializers
from .models import Listing, ListingImage, Category, Favorite, Partner, PromoBanner


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug"]


class ListingImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListingImage
        fields = ["id", "image", "alt_text", "is_cover"]





class ListingSerializer(serializers.ModelSerializer):
    images = ListingImageSerializer(many=True, read_only=True)
    owner_email = serializers.EmailField(source="owner.email", read_only=True)
    is_owner = serializers.SerializerMethodField()
    interested_count = serializers.IntegerField(read_only=True)
    has_interested = serializers.SerializerMethodField()
    
    discount_price = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
        required=False,
        allow_null=True,
    )

    latitude = serializers.DecimalField(
        max_digits=50,
        decimal_places=16,
        required=False,
        allow_null=True,
    )

    longitude = serializers.DecimalField(
        max_digits=50,
        decimal_places=16,
        required=False,
        allow_null=True,
    )

    new_images = serializers.ListField(
        child=serializers.ImageField(),
        write_only=True,
        required=False,
    )

    delete_image_ids = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False,
    )

    cover_image_id = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        allow_null=True,
    )

    
    class Meta:
        model = Listing
        fields = [
            "id",
            "owner",
            "owner_email",
            "category",
            "title",
            "slug",
            "description",
            "listing_type",
            "sale_mode",
            "status",
            "price",
            "discount_price",
            "publish_fee",
            "is_featured",
            "bedrooms",
            "bathrooms",
            "upi",
            "land_size",
            "address",
            "district",
            "sector",
            "village",
            "latitude",
            "longitude",
            "has_electricity",
            "has_water",
            "contact_phone",
            "contact_email",
            "views_count",
            "rejection_reason",
            "moderated_by",
            "moderated_at",
            "images",
            "created_at",
            "is_owner",
            "new_images",
            "delete_image_ids",
            "cover_image_id",
            "car_make",
            "car_model",
            "car_year",
            "car_mileage",
            "car_fuel_type",
            "car_transmission",
            "car_condition",
            "car_color",
            "visibility_status",
            "negotiable",
            "call_clicks",
            "whatsapp_clicks",
            "brand",
            "stock_quantity",
            "sku",
            "product_condition",
            "has_home_delivery",
            "delivery_fee",
            "delivery_notes",
            "clothes_gender",
            "clothes_size",
            "clothes_color",
            "clothes_material",
            "clothes_category",
            "food_category",
            "food_unit",
            "food_weight_volume",
            "is_perishable",
            "expiry_date",
            "is_prepared_food",
            "home_product_category",
            "material",
            "color",
            "dimensions",
            "weight",
            "warranty_months",
            "interested_count",
            "has_interested",
        ]
        read_only_fields = [
            "owner",
            "status",
            "publish_fee",
            "views_count",
            "owner_email",
            "images",
            "created_at",
            "is_owner",
            "rejection_reason",
            "moderated_by",
            "moderated_at",
        ]

    def get_is_owner(self, obj):
        request = self.context.get("request")
        return bool(
            request
            and request.user.is_authenticated
            and obj.owner_id == request.user.id
        )
    def get_has_interested(self, obj):
        request = self.context.get("request")
        return bool(
            request
            and request.user.is_authenticated
            and obj.interests.filter(user=request.user).exists()
        )
    def to_internal_value(self, data):
        mutable_data = data.copy()
        request = self.context.get("request")

        if request:
            files = request.FILES.getlist("new_images")
            if not files:
                files = request.FILES.getlist("images")

            if files:
                mutable_data.setlist("new_images", files)

            delete_ids = request.data.getlist("delete_image_ids")
            if delete_ids:
                mutable_data.setlist("delete_image_ids", delete_ids)

        nullable_fields = [
            "discount_price",
            "latitude",
            "longitude",
            "delivery_fee",
            "stock_quantity",
            "car_year",
            "car_mileage",
            "bedrooms",
            "bathrooms",
            "land_size",
            "warranty_months",
            "land_size",
            "bathrooms",
            "bedrooms",
        ]

        for field_name in nullable_fields:
            raw_value = mutable_data.get(field_name)
            if raw_value in ["", " ", None, "null", "undefined", "NaN"]:
                mutable_data[field_name] = None

        listing_type = mutable_data.get("listing_type")
        if listing_type == Listing.ListingType.CAR:
            mutable_data["latitude"] = None
            mutable_data["longitude"] = None

        return super().to_internal_value(mutable_data)

    def validate(self, attrs):
        listing_type = attrs.get("listing_type") or getattr(self.instance, "listing_type", None)
        sale_mode = attrs.get("sale_mode") or getattr(self.instance, "sale_mode", None)

        if not listing_type:
            raise serializers.ValidationError({"listing_type": "Listing type is required."})

        product_types = [
            Listing.ListingType.CLOTHES_PRODUCT,
            Listing.ListingType.FOOD_PRODUCT,
            Listing.ListingType.HOME_KITCHEN_PRODUCT,
        ]

        # Enforce sale mode
        if listing_type == Listing.ListingType.BUSINESS_AD:
            attrs["sale_mode"] = Listing.SaleMode.ADS
        elif listing_type == Listing.ListingType.HOUSE:
            if sale_mode not in [Listing.SaleMode.SELL, Listing.SaleMode.RENT]:
                raise serializers.ValidationError({
                    "sale_mode": "House must have sale mode 'sell' or 'rent'."
                })
        else:
            attrs["sale_mode"] = Listing.SaleMode.SELL

        # Remove irrelevant house fields
        if listing_type != Listing.ListingType.HOUSE:
            attrs.pop("bedrooms", None)
            attrs.pop("bathrooms", None)

        # UPI / land size: allow for house and parcel
        if listing_type not in [Listing.ListingType.HOUSE, Listing.ListingType.PARCEL]:
            attrs.pop("upi", None)
            attrs.pop("land_size", None)

        # Utilities: allow for house and parcel
        if listing_type not in [Listing.ListingType.HOUSE, Listing.ListingType.PARCEL]:
            attrs.pop("has_electricity", None)
            attrs.pop("has_water", None)

        # Car-only fields
        if listing_type != Listing.ListingType.CAR:
            attrs.pop("car_make", None)
            attrs.pop("car_model", None)
            attrs.pop("car_year", None)
            attrs.pop("car_mileage", None)
            attrs.pop("car_fuel_type", None)
            attrs.pop("car_transmission", None)
            attrs.pop("car_condition", None)
            attrs.pop("car_color", None)

        # Product common fields
        if listing_type not in product_types:
            attrs.pop("brand", None)
            attrs.pop("stock_quantity", None)
            attrs.pop("sku", None)
            attrs.pop("product_condition", None)
            attrs.pop("has_home_delivery", None)
            attrs.pop("delivery_fee", None)
            attrs.pop("delivery_notes", None)

        # Clothes-only fields
        if listing_type != Listing.ListingType.CLOTHES_PRODUCT:
            attrs.pop("clothes_gender", None)
            attrs.pop("clothes_size", None)
            attrs.pop("clothes_color", None)
            attrs.pop("clothes_material", None)
            attrs.pop("clothes_category", None)

        # Food-only fields
        if listing_type != Listing.ListingType.FOOD_PRODUCT:
            attrs.pop("food_category", None)
            attrs.pop("food_unit", None)
            attrs.pop("food_weight_volume", None)
            attrs.pop("is_perishable", None)
            attrs.pop("expiry_date", None)
            attrs.pop("is_prepared_food", None)

        # Home/kitchen-only fields
        if listing_type != Listing.ListingType.HOME_KITCHEN_PRODUCT:
            attrs.pop("home_product_category", None)
            attrs.pop("material", None)
            attrs.pop("color", None)
            attrs.pop("dimensions", None)
            attrs.pop("weight", None)
            attrs.pop("warranty_months", None)

        # Cars should not have coordinates
        if listing_type == Listing.ListingType.CAR:
            attrs["latitude"] = None
            attrs["longitude"] = None

        # Product delivery validation
        if listing_type in product_types:
            has_home_delivery = attrs.get(
                "has_home_delivery",
                getattr(self.instance, "has_home_delivery", False) if self.instance else False,
            )
            delivery_fee = attrs.get(
                "delivery_fee",
                getattr(self.instance, "delivery_fee", None) if self.instance else None,
            )

            if has_home_delivery and delivery_fee in [None, ""]:
                raise serializers.ValidationError({
                    "delivery_fee": "Delivery fee is required when home delivery is enabled."
                })

        # Food expiry validation
        if listing_type == Listing.ListingType.FOOD_PRODUCT:
            is_perishable = attrs.get(
                "is_perishable",
                getattr(self.instance, "is_perishable", False) if self.instance else False,
            )
            expiry_date = attrs.get(
                "expiry_date",
                getattr(self.instance, "expiry_date", None) if self.instance else None,
            )

            if is_perishable and not expiry_date:
                raise serializers.ValidationError({
                    "expiry_date": "Expiry date is required for perishable food."
                })

        return attrs

    def _get_raw_cover_image_id(self):
        request = self.context.get("request")
        if not request:
            return None

        raw_value = request.data.get("cover_image_id")
        if raw_value in [None, "", "null", "undefined"]:
            return None

        return str(raw_value)

    def create(self, validated_data):
        request = self.context["request"]

        new_images = validated_data.pop("new_images", [])
        validated_data.pop("delete_image_ids", None)
        validated_data.pop("cover_image_id", None)

        listing = Listing.objects.create(
            owner=request.user,
            status=Listing.Status.PENDING,
            **validated_data,
        )

        for index, image in enumerate(new_images):
            ListingImage.objects.create(
                listing=listing,
                image=image,
                is_cover=(index == 0),
            )

        listing.refresh_from_db()

        cover_image_id = self._get_raw_cover_image_id()
        if cover_image_id is not None:
            self._set_cover_image(listing, cover_image_id)

        if not listing.images.filter(is_cover=True).exists() and listing.images.exists():
            first_image = listing.images.first()
            listing.images.update(is_cover=False)
            first_image.is_cover = True
            first_image.save(update_fields=["is_cover"])

        if hasattr(listing, "_prefetched_objects_cache"):
            listing._prefetched_objects_cache = {}

        listing.refresh_from_db()
        return listing

    def update(self, instance, validated_data):
        request = self.context.get("request")

        if not (request and (request.user.is_staff or request.user.is_superuser)):
            validated_data.pop("visibility_status", None)

        new_images = validated_data.pop("new_images", [])
        delete_image_ids = validated_data.pop("delete_image_ids", [])
        validated_data.pop("cover_image_id", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        if delete_image_ids:
            images_to_delete = instance.images.filter(id__in=delete_image_ids)
            deleted_cover = images_to_delete.filter(is_cover=True).exists()
            images_to_delete.delete()

            if deleted_cover and instance.images.exists():
                first_image = instance.images.first()
                instance.images.update(is_cover=False)
                first_image.is_cover = True
                first_image.save(update_fields=["is_cover"])

        had_cover_before_adding = instance.images.filter(is_cover=True).exists()

        for index, image in enumerate(new_images):
            ListingImage.objects.create(
                listing=instance,
                image=image,
                is_cover=(not had_cover_before_adding and index == 0),
            )

        cover_image_id = self._get_raw_cover_image_id()
        if cover_image_id is not None:
            self._set_cover_image(instance, cover_image_id)

        if not instance.images.filter(is_cover=True).exists() and instance.images.exists():
            first_image = instance.images.first()
            instance.images.update(is_cover=False)
            first_image.is_cover = True
            first_image.save(update_fields=["is_cover"])

        if hasattr(instance, "_prefetched_objects_cache"):
            instance._prefetched_objects_cache = {}

        instance.refresh_from_db()
        return instance

    def _set_cover_image(self, listing, cover_image_id):
        cover_image = listing.images.filter(id=cover_image_id).first()
        if not cover_image:
            return

        listing.images.update(is_cover=False)
        cover_image.is_cover = True
        cover_image.save(update_fields=["is_cover"])


    def get_has_interested(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.interests.filter(user=request.user).exists()
        return False







class FavoriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Favorite
        fields = ["id", "user", "listing"]
        read_only_fields = ["user"]


class AdTickerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Listing
        fields = ["id", "title", "description", "contact_phone", "contact_email"]
        


from .models import Category


class CategorySerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(source="parent.name", read_only=True)
    children_count = serializers.IntegerField(source="children.count", read_only=True)

    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "slug",
            "parent",
            "parent_name",
            "children_count",
        ]

    def validate_slug(self, value):
        value = value.strip().lower()
        qs = Category.objects.filter(slug=value)

        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)

        if qs.exists():
            raise serializers.ValidationError("A category with this slug already exists.")

        return value

    def validate(self, attrs):
        parent = attrs.get("parent")
        instance = getattr(self, "instance", None)

        if instance and parent and parent.pk == instance.pk:
            raise serializers.ValidationError({
                "parent": "A category cannot be its own parent."
            })

        return attrs
    
    



class PartnerSerializer(serializers.ModelSerializer):
    logo = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Partner
        fields = ["id", "name", "logo", "website", "description", "is_active"]
        
        
        
class PromoBannerSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = PromoBanner
        fields = [
            "id",
            "title",
            "media_type",
            "file",
            "file_url",
            "target_url",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "file_url", "created_at"]

    def get_file_url(self, obj):
        request = self.context.get("request")
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        if obj.file:
            return obj.file.url
        return None

    def validate_target_url(self, value):
        if value:
            return value.strip()
        return value
        
        
        
