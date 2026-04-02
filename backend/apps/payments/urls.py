from django.urls import path
from .views import CreateListingPaymentView, MockPaymentWebhookView

urlpatterns = [
    path("create-listing-payment/", CreateListingPaymentView.as_view()),
    path("webhook/mock/", MockPaymentWebhookView.as_view()),
]