from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import AdminAnalyticsOverviewView, ListingViewSet,CategoryViewSet, FavoriteViewSet,AdTickerView, PartnerDetailView, PartnerListView, PopularCategoriesView, PromoBannerViewSet, PublicBusinessAdListView, PublicListingDetailView, SellerDashboardStatsView,search_location

router = DefaultRouter()
router.register("listings", ListingViewSet, basename="listing")
router.register("categories", CategoryViewSet, basename="category")
router.register("favorites", FavoriteViewSet, basename="favorite")
# router.register("categories", CategoryViewSet, basename="category")
router.register("promo-banners", PromoBannerViewSet, basename="promo-banners")


urlpatterns = router.urls + [
    path("ads/ticker/", AdTickerView.as_view(), name="ads-ticker"),
    path("search-location/", search_location, name="search_location"),
    path("partners/", PartnerListView.as_view(), name="partner-list"),
    path("partners/<int:pk>/", PartnerDetailView.as_view(), name="partner-detail"),
    
    path("analytics/seller-stats/", SellerDashboardStatsView.as_view(), name="seller-stats"),
    path("analytics/popular-categories/", PopularCategoriesView.as_view(), name="popular-categories"),
    path("analytics/admin-overview/", AdminAnalyticsOverviewView.as_view(), name="admin-overview"),
    
    path("public/business-ads/", PublicBusinessAdListView.as_view(), name="public-business-ads"),
    path("public/listings/<uuid:id>/", PublicListingDetailView.as_view(), name="public-listing-detail"),

]