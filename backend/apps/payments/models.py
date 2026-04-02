from django.conf import settings
from django.db import models
from apps.common.models import TimeStampedModel


class PaymentTransaction(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        SUCCESS = "success", "Success"
        FAILED = "failed", "Failed"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="payments")
    listing = models.ForeignKey("listings.Listing", on_delete=models.CASCADE, related_name="payments")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default="RWF")
    provider = models.CharField(max_length=50, default="mobile_money")
    transaction_ref = models.CharField(max_length=100, unique=True)
    provider_reference = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)