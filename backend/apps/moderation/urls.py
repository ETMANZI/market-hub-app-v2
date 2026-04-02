from django.urls import path
from .views import ModerateListingView,TrackVisitorView,VisitorStatsView

urlpatterns = [
    path("listings/<uuid:listing_id>/", ModerateListingView.as_view()),
    path("track-visitor/", TrackVisitorView.as_view(), name="track-visitor"),
    path("visitor-stats/", VisitorStatsView.as_view(), name="visitor-stats"),

]