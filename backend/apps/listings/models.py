from django.conf import settings
from django.db import models
from apps.common.models import TimeStampedModel
from django.core.validators import URLValidator


class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    parent = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="children"
    )

    def __str__(self):
        return self.name






class Listing(TimeStampedModel):
    class ListingType(models.TextChoices):
        BUSINESS_AD = "business_ad", "Business Ad"
        HOUSE = "house", "House"
        PARCEL = "parcel", "Parcel"
        CAR = "car", "Car"
        CLOTHES_PRODUCT = "clothes_product", "Clothes Product"
        FOOD_PRODUCT = "food_product", "Food Product"
        HOME_KITCHEN_PRODUCT = "home_kitchen_product", "Home & Kitchen Product"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    class VisibilityStatus(models.TextChoices):
        ACTIVE = "active", "Active"
        INACTIVE = "inactive", "Inactive"

    class SaleMode(models.TextChoices):
        SELL = "sell", "Sell"
        RENT = "rent", "Rent"
        ADS = "ads", "Ads"

    class ProductCondition(models.TextChoices):
        NEW = "new", "New"
        USED = "used", "Used"

    class ClothesGender(models.TextChoices):
        MEN = "men", "Men"
        WOMEN = "women", "Women"
        UNISEX = "unisex", "Unisex"
        KIDS = "kids", "Kids"

    class ClothesSize(models.TextChoices):
        XS = "xs", "XS"
        S = "s", "S"
        M = "m", "M"
        L = "l", "L"
        XL = "xl", "XL"
        XXL = "xxl", "XXL"
        XXXL = "xxxl", "XXXL"

    class FoodUnit(models.TextChoices):
        PIECE = "piece", "Piece"
        KG = "kg", "Kg"
        GRAM = "gram", "Gram"
        LITER = "liter", "Liter"
        ML = "ml", "Ml"
        PACK = "pack", "Pack"
        PLATE = "plate", "Plate"
        BOX = "box", "Box"
        BOTTLE = "bottle", "Bottle"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="listings"
    )
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    description = models.TextField()

    listing_type = models.CharField(max_length=30, choices=ListingType.choices)
    sale_mode = models.CharField(max_length=20, choices=SaleMode.choices, blank=True)

    status = models.CharField(max_length=30, choices=Status.choices, default=Status.PENDING)
    visibility_status = models.CharField(
        max_length=20,
        choices=VisibilityStatus.choices,
        default=VisibilityStatus.ACTIVE,
    )

    price = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    discount_price = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    publish_fee = models.DecimalField(max_digits=10, decimal_places=2, default=5000)
    is_featured = models.BooleanField(default=False)
    negotiable = models.BooleanField(default=False)

    address = models.CharField(max_length=255, blank=True)
    district = models.CharField(max_length=100, blank=True)
    sector = models.CharField(max_length=100, blank=True)
    village = models.CharField(max_length=100, blank=True)
    latitude = models.DecimalField(max_digits=50, decimal_places=16, null=True, blank=True)
    longitude = models.DecimalField(max_digits=50, decimal_places=16, null=True, blank=True)

    contact_phone = models.CharField(max_length=30, blank=True)
    contact_email = models.EmailField(blank=True)

    views_count = models.PositiveIntegerField(default=0)
    call_clicks = models.PositiveIntegerField(default=0)
    whatsapp_clicks = models.PositiveIntegerField(default=0)

    rejection_reason = models.TextField(blank=True, null=True)
    moderated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="moderated_listings"
    )
    moderated_at = models.DateTimeField(null=True, blank=True)

    # --------------------------
    # HOUSE FIELDS
    # --------------------------
    bedrooms = models.PositiveIntegerField(null=True, blank=True)
    bathrooms = models.PositiveIntegerField(null=True, blank=True)
    has_electricity = models.BooleanField(default=False)
    has_water = models.BooleanField(default=False)

    # --------------------------
    # PARCEL FIELDS
    # --------------------------
    upi = models.CharField(max_length=50, null=True, blank=True)
    land_size = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    # --------------------------
    # CAR FIELDS
    # --------------------------
    car_make = models.CharField(max_length=100, blank=True, null=True)
    car_model = models.CharField(max_length=100, blank=True, null=True)
    car_year = models.PositiveIntegerField(blank=True, null=True)
    car_mileage = models.PositiveIntegerField(blank=True, null=True)
    car_fuel_type = models.CharField(
        max_length=20,
        choices=[
            ("petrol", "Petrol"),
            ("diesel", "Diesel"),
            ("electric", "Electric"),
            ("hybrid", "Hybrid"),
        ],
        blank=True,
        null=True,
    )
    car_transmission = models.CharField(
        max_length=20,
        choices=[
            ("manual", "Manual"),
            ("automatic", "Automatic"),
        ],
        blank=True,
        null=True,
    )
    car_condition = models.CharField(
        max_length=20,
        choices=[
            ("new", "New"),
            ("used", "Used"),
        ],
        blank=True,
        null=True,
    )
    car_color = models.CharField(max_length=50, blank=True, null=True)

    # --------------------------
    # COMMON PRODUCT FIELDS
    # (for clothes, food, home/kitchen)
    # --------------------------
    brand = models.CharField(max_length=100, blank=True, null=True)
    stock_quantity = models.PositiveIntegerField(null=True, blank=True)
    sku = models.CharField(max_length=100, blank=True, null=True)
    product_condition = models.CharField(
        max_length=20,
        choices=ProductCondition.choices,
        blank=True,
        null=True,
    )

    has_home_delivery = models.BooleanField(default=False)
    delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    delivery_notes = models.CharField(max_length=255, blank=True, null=True)

    # --------------------------
    # CLOTHES PRODUCT FIELDS
    # --------------------------
    clothes_gender = models.CharField(
        max_length=20,
        choices=ClothesGender.choices,
        blank=True,
        null=True,
    )
    clothes_size = models.CharField(
        max_length=10,
        choices=ClothesSize.choices,
        blank=True,
        null=True,
    )
    clothes_color = models.CharField(max_length=50, blank=True, null=True)
    clothes_material = models.CharField(max_length=100, blank=True, null=True)
    clothes_category = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Example: shirt, trouser, dress, shoes, jacket"
    )

    # --------------------------
    # FOOD PRODUCT FIELDS
    # --------------------------
    food_category = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Example: fresh food, cooked food, drink, snack, bakery"
    )
    food_unit = models.CharField(
        max_length=20,
        choices=FoodUnit.choices,
        blank=True,
        null=True,
    )
    food_weight_volume = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Example: 1kg, 500ml, 12 pieces"
    )
    is_perishable = models.BooleanField(default=False)
    expiry_date = models.DateField(blank=True, null=True)
    is_prepared_food = models.BooleanField(default=False)

    # --------------------------
    # HOME & KITCHEN PRODUCT FIELDS
    # --------------------------
    home_product_category = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Example: cookware, furniture, decor, appliance, storage"
    )
    material = models.CharField(max_length=100, blank=True, null=True)
    color = models.CharField(max_length=50, blank=True, null=True)
    dimensions = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Example: 120x60x75 cm"
    )
    weight = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Example: 5kg"
    )
    warranty_months = models.PositiveIntegerField(blank=True, null=True)

    def __str__(self):
        return self.title








class ListingImage(TimeStampedModel):
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="listings/")
    alt_text = models.CharField(max_length=255, blank=True)
    is_cover = models.BooleanField(default=False)

class Favorite(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="favorites")
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="favorited_by")

    class Meta:
        unique_together = ("user", "listing")
        
        
class Partner(models.Model):
    name = models.CharField(max_length=255)
    logo = models.ImageField(upload_to="partners/")
    website = models.URLField(blank=True, null=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
    
    
    
    





class Notification(models.Model):
    TYPE_CHOICES = [
        ("listing_approved", "Listing Approved"),
        ("listing_rejected", "Listing Rejected"),
        ("listing_view", "Listing View"),
        ("listing_contact", "Listing Contact"),
        ("subscription_expiry", "Subscription Expiry"),
        ("subscription_expired", "Subscription Expired"),
        ("general", "General"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications"
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=50, choices=TYPE_CHOICES, default="general")
    is_read = models.BooleanField(default=False)
    listing = models.ForeignKey(
        "Listing",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notifications"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.title}"
    
    
    
    
class FCMDevice(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="fcm_devices"
    )
    token = models.TextField(unique=True)
    device_type = models.CharField(max_length=20, blank=True, null=True) 
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.device_type or 'device'}"
    
    
    
    
class ListingViewEvent(models.Model):
    listing = models.ForeignKey("Listing", on_delete=models.CASCADE, related_name="view_events")
    viewed_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    session_key = models.CharField(max_length=100, null=True, blank=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="listing_view_events"
    )

    def __str__(self):
        return f"{self.listing} viewed at {self.viewed_at}"


class ListingContactEvent(models.Model):
    CONTACT_CHOICES = [
        ("call", "Call"),
        ("whatsapp", "WhatsApp"),
    ]

    listing = models.ForeignKey("Listing", on_delete=models.CASCADE, related_name="contact_events")
    contact_type = models.CharField(max_length=20, choices=CONTACT_CHOICES)
    clicked_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    session_key = models.CharField(max_length=100, null=True, blank=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="listing_contact_events"
    )

    def __str__(self):
        return f"{self.listing} - {self.contact_type}"
    
    
    
    

class PromoBanner(models.Model):
    class MediaType(models.TextChoices):
        VIDEO = "video", "Video"
        IMAGE = "image", "Image"
        GIF = "gif", "GIF"

    title = models.CharField(max_length=200, blank=True)
    media_type = models.CharField(
        max_length=10,
        choices=MediaType.choices,
        default=MediaType.VIDEO,
    )
    file = models.FileField(upload_to="promo_banners/")
    target_url = models.URLField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title or f"Banner {self.id}"
    
    
    
class ListingImpression(models.Model):
    listing = models.ForeignKey("Listing", on_delete=models.CASCADE, related_name="impressions")
    session_key = models.CharField(max_length=100, blank=True, default="")
    ip_address = models.CharField(max_length=100, blank=True, default="")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)
    
    
class ListingInterest(models.Model):
    listing = models.ForeignKey(
        Listing,
        on_delete=models.CASCADE,
        related_name="interests"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    anonymous_user_id = models.CharField(
        max_length=255,
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["listing", "user"],
                name="unique_listing_interest_user"
            ),
            models.UniqueConstraint(
                fields=["listing", "anonymous_user_id"],
                name="unique_listing_interest_anonymous"
            ),
        ]
        
        
class ListingViewLog(models.Model):
    listing = models.ForeignKey(
        "Listing",
        on_delete=models.CASCADE,
        related_name="view_logs"
    )
    session_key = models.CharField(max_length=100)
    ip_address = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["listing", "session_key", "created_at"]),
            models.Index(fields=["listing", "ip_address", "created_at"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"{self.listing} - {self.session_key} - {self.created_at}"