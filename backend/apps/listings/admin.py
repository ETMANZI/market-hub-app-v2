from django.contrib import admin
from .models import Category, Listing, ListingImage, Favorite,Partner

admin.site.register(Category)
admin.site.register(Listing)
admin.site.register(ListingImage)
admin.site.register(Favorite)

@admin.register(Partner)
class PartnerAdmin(admin.ModelAdmin):
    list_display = ("name", "is_active", "created_at")
    list_filter = ("is_active",)
    search_fields = ("name",)