import uuid
from rest_framework import generics, permissions
from rest_framework.response import Response
from apps.listings.models import Listing
from .models import PaymentTransaction


class CreateListingPaymentView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        listing_id = request.data.get("listing_id")
        listing = Listing.objects.get(id=listing_id, owner=request.user)

        payment = PaymentTransaction.objects.create(
            user=request.user,
            listing=listing,
            amount=listing.publish_fee,
            transaction_ref=str(uuid.uuid4()),
            status="success", 
        )
        listing.status = "pending"  
        listing.save(update_fields=["status"])
        return Response({
            "payment_id": str(payment.id),
            "amount": str(payment.amount),
            "currency": payment.currency,
            "transaction_ref": payment.transaction_ref,
            "message": "Proceed to payment gateway"
        })


class MockPaymentWebhookView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        transaction_ref = request.data.get("transaction_ref")
        status_value = request.data.get("status", "success")
        provider_reference = request.data.get("provider_reference", "mock-reference")

        payment = PaymentTransaction.objects.get(transaction_ref=transaction_ref)
        payment.status = status_value
        payment.provider_reference = provider_reference
        payment.save(update_fields=["status", "provider_reference"])

        if status_value == "success":
            # payment.listing.status = "pending_review"
            payment.listing.status = Listing.Status.PENDING
            payment.listing.save(update_fields=["status"])

        return Response({"message": "Webhook processed"})