from django.db.models import Q
from django.utils import timezone
from datetime import timedelta
from rest_framework.exceptions import ValidationError
from rest_framework import viewsets, permissions, parsers,generics
from rest_framework.decorators import action
from .models import Listing, Category, Favorite, Partner, PromoBanner
from .serializers import AdTickerSerializer, ListingSerializer, CategorySerializer, FavoriteSerializer, PromoBannerSerializer
from rest_framework import viewsets, permissions, parsers
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Listing,ListingViewEvent,ListingContactEvent,ListingViewLog,ListingInterest
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .utils import create_notification
from rest_framework.permissions import AllowAny, IsAuthenticated


from django.db.models import Sum, Count
from rest_framework.views import APIView


class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.owner_id == request.user.id





class ListingViewSet(viewsets.ModelViewSet):
    serializer_class = ListingSerializer
    permission_classes = [permissions.AllowAny]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    queryset = (
        Listing.objects
        .select_related("owner", "category")
        .prefetch_related("images")
        .annotate(interested_count=Count("interests", distinct=True))
    )

    filterset_fields = [
        "listing_type",
        "district",
        "sector",
        "sale_mode",
        "is_featured",
        "status",
        "category",
        "visibility_status",
        "negotiable",
    ]

    search_fields = [
        "title",
        "description",
        "address",
        "district",
        "sector",
        "village",
        "upi",
        "contact_phone",
        "contact_email",
        "brand",
        "sku",
        "clothes_category",
        "food_category",
        "home_product_category",
    ]

    ordering_fields = ["price", "created_at", "views_count", "interested_count"]

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            return x_forwarded_for.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR")

    def _base_queryset(self):
        return (
            Listing.objects
            .select_related("owner", "category")
            .prefetch_related("images")
            .annotate(interested_count=Count("interests", distinct=True))
        )

    def _apply_custom_filters(self, queryset):
        params = self.request.query_params

        q = (params.get("q") or "").strip()
        min_price = params.get("min_price")
        max_price = params.get("max_price")
        category = params.get("category")
        district = (params.get("district") or "").strip()
        sector = (params.get("sector") or "").strip()
        listing_type = (params.get("listing_type") or "").strip()
        sale_mode = (params.get("sale_mode") or "").strip()
        with_discount = (params.get("with_discount") or "").strip()
        negotiable = (params.get("negotiable") or "").strip()

        brand = (params.get("brand") or "").strip()
        has_delivery = (params.get("has_home_delivery") or "").strip()
        product_condition = (params.get("product_condition") or "").strip()
        clothes_gender = (params.get("clothes_gender") or "").strip()
        clothes_size = (params.get("clothes_size") or "").strip()
        food_unit = (params.get("food_unit") or "").strip()
        is_prepared_food = (params.get("is_prepared_food") or "").strip()
        is_perishable = (params.get("is_perishable") or "").strip()

        if q:
            queryset = queryset.filter(
                Q(title__icontains=q)
                | Q(description__icontains=q)
                | Q(address__icontains=q)
                | Q(district__icontains=q)
                | Q(sector__icontains=q)
                | Q(village__icontains=q)
                | Q(contact_phone__icontains=q)
                | Q(contact_email__icontains=q)
                | Q(brand__icontains=q)
                | Q(sku__icontains=q)
                | Q(clothes_category__icontains=q)
                | Q(food_category__icontains=q)
                | Q(home_product_category__icontains=q)
            )

        if min_price:
            try:
                queryset = queryset.filter(price__gte=min_price)
            except (TypeError, ValueError):
                pass

        if max_price:
            try:
                queryset = queryset.filter(price__lte=max_price)
            except (TypeError, ValueError):
                pass

        if category:
            queryset = queryset.filter(category_id=category)

        if district:
            queryset = queryset.filter(district__iexact=district)

        if sector:
            queryset = queryset.filter(sector__iexact=sector)

        if listing_type:
            queryset = queryset.filter(listing_type=listing_type)

        if sale_mode:
            queryset = queryset.filter(sale_mode=sale_mode)

        if with_discount.lower() in ["1", "true", "yes"]:
            queryset = queryset.filter(discount_price__isnull=False)

        if negotiable.lower() in ["1", "true", "yes"]:
            queryset = queryset.filter(negotiable=True)

        if brand:
            queryset = queryset.filter(brand__icontains=brand)

        if has_delivery.lower() in ["1", "true", "yes"]:
            queryset = queryset.filter(has_home_delivery=True)

        if product_condition:
            queryset = queryset.filter(product_condition=product_condition)

        if clothes_gender:
            queryset = queryset.filter(clothes_gender=clothes_gender)

        if clothes_size:
            queryset = queryset.filter(clothes_size=clothes_size)

        if food_unit:
            queryset = queryset.filter(food_unit=food_unit)

        if is_prepared_food.lower() in ["1", "true", "yes"]:
            queryset = queryset.filter(is_prepared_food=True)

        if is_perishable.lower() in ["1", "true", "yes"]:
            queryset = queryset.filter(is_perishable=True)

        return queryset

    def get_queryset(self):
        user = self.request.user
        mine = self.request.query_params.get("mine")
        base_qs = self._base_queryset()

        if user.is_authenticated and (user.is_staff or user.is_superuser):
            if mine == "1":
                qs = base_qs.filter(owner=user).order_by("-interested_count", "-created_at")
            else:
                qs = base_qs.order_by("-interested_count", "-created_at")
            return self._apply_custom_filters(qs)

        if user.is_authenticated and mine == "1":
            qs = base_qs.filter(owner=user).order_by("-interested_count", "-created_at")
            return self._apply_custom_filters(qs)

        qs = (
            base_qs.filter(
                status=Listing.Status.APPROVED,
                visibility_status=Listing.VisibilityStatus.ACTIVE,
            )
            .exclude(listing_type=Listing.ListingType.BUSINESS_AD)
            .order_by("-interested_count", "-created_at")
        )
        return self._apply_custom_filters(qs)

    def get_permissions(self):
        if self.action == "create":
            return [permissions.IsAuthenticated()]

        if self.action in ["update", "partial_update", "destroy"]:
            return [permissions.IsAdminUser()]

        return [permissions.AllowAny()]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        serializer.save()

    def perform_destroy(self, instance):
        instance.delete()

    @action(detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def my_listings(self, request):
        qs = (
            self._base_queryset()
            .filter(owner=request.user)
            .order_by("-interested_count", "-created_at")
        )
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAdminUser])
    def approve(self, request, pk=None):
        listing = self.get_object()
        listing.status = Listing.Status.APPROVED
        listing.moderated_by = request.user
        listing.moderated_at = timezone.now()
        listing.rejection_reason = None
        listing.save(update_fields=["status", "moderated_by", "moderated_at", "rejection_reason"])

        create_notification(
            user=listing.owner,
            title="Listing Approved",
            message=f'Your listing "{listing.title}" has been approved.',
            notification_type="listing_approved",
            listing=listing,
        )

        return Response({"message": "Listing approved"})

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAdminUser])
    def reject(self, request, pk=None):
        listing = self.get_object()
        reason = (request.data.get("reason") or "").strip()

        listing.status = Listing.Status.REJECTED
        listing.rejection_reason = reason if reason else "Rejected by moderator"
        listing.moderated_by = request.user
        listing.moderated_at = timezone.now()
        listing.save(
            update_fields=[
                "status",
                "rejection_reason",
                "moderated_by",
                "moderated_at",
            ]
        )

        create_notification(
            user=listing.owner,
            title="Listing Rejected",
            message=f'Your listing "{listing.title}" was rejected. Reason: {listing.rejection_reason}',
            notification_type="listing_rejected",
            listing=listing,
        )

        return Response({"message": "Listing rejected"})

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAdminUser])
    def hide(self, request, pk=None):
        listing = self.get_object()
        listing.visibility_status = Listing.VisibilityStatus.INACTIVE
        listing.save(update_fields=["visibility_status"])
        return Response({"message": "Listing hidden successfully"})

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAdminUser])
    def unhide(self, request, pk=None):
        listing = self.get_object()
        listing.visibility_status = Listing.VisibilityStatus.ACTIVE
        listing.save(update_fields=["visibility_status"])
        return Response({"message": "Listing unhidden successfully"})

    @action(detail=True, methods=["post"], permission_classes=[permissions.AllowAny])
    def track_contact(self, request, pk=None):
        listing = self.get_object()
        contact_type = (request.data.get("contact_type") or "").strip()

        if not request.session.session_key:
            request.session.save()

        if contact_type == "call":
            listing.call_clicks += 1
            listing.save(update_fields=["call_clicks"])
        elif contact_type == "whatsapp":
            listing.whatsapp_clicks += 1
            listing.save(update_fields=["whatsapp_clicks"])

        ListingContactEvent.objects.create(
            listing=listing,
            contact_type=contact_type if contact_type in ["call", "whatsapp"] else "call",
            ip_address=self.get_client_ip(request),
            session_key=request.session.session_key,
            user=request.user if request.user.is_authenticated else None,
        )

        create_notification(
            user=listing.owner,
            title="New Buyer Interest",
            message=f'Someone clicked {contact_type or "contact"} on your listing "{listing.title}".',
            notification_type="listing_contact",
            listing=listing,
        )

        return Response({"message": "Contact tracked"})


    @action(detail=True, methods=["post"], permission_classes=[AllowAny])
    def toggle_interest(self, request, pk=None):
        listing = self.get_object()

        if request.user.is_authenticated:
            interest = ListingInterest.objects.filter(
                listing=listing,
                user=request.user
            ).first()

            if interest:
                interest.delete()
                interested = False
            else:
                ListingInterest.objects.create(
                    listing=listing,
                    user=request.user
                )
                interested = True

                create_notification(
                    user=listing.owner,
                    title="New Interested User",
                    message=f'Someone marked interest on your listing "{listing.title}".',
                    notification_type="listing_interest",
                    listing=listing,
                )

        else:
            anonymous_user_id = request.data.get("anonymous_user_id")

            if not anonymous_user_id:
                return Response(
                    {"detail": "anonymous_user_id is required for unauthenticated users."},
                    status=400,
                )

            interest = ListingInterest.objects.filter(
                listing=listing,
                anonymous_user_id=anonymous_user_id
            ).first()

            if interest:
                interest.delete()
                interested = False
            else:
                ListingInterest.objects.create(
                    listing=listing,
                    anonymous_user_id=anonymous_user_id
                )
                interested = True

                create_notification(
                    user=listing.owner,
                    title="New Interested User",
                    message=f'Someone marked interest on your listing "{listing.title}".',
                    notification_type="listing_interest",
                    listing=listing,
                )

        count = listing.interests.count()

        return Response({
            "interested": interested,
            "interested_count": count
        })


    @action(detail=True, methods=["post"], permission_classes=[AllowAny])
    def track_view(self, request, pk=None):
        listing = self.get_object()

        if not request.session.session_key:
            request.session.create()

        session_key = request.session.session_key
        ip = self.get_client_ip(request)
        one_hour_ago = timezone.now() - timedelta(hours=1)

        exists = ListingViewLog.objects.filter(
            listing=listing,
            session_key=session_key,
            ip_address=ip,
            created_at__gte=one_hour_ago
        ).exists()

        if not exists:
            ListingViewLog.objects.create(
                listing=listing,
                session_key=session_key,
                ip_address=ip
            )

            listing.views_count += 1
            listing.save(update_fields=["views_count"])

            if listing.views_count in [10, 25, 50, 100]:
                create_notification(
                    user=listing.owner,
                    title="Listing Performance",
                    message=f'Your listing "{listing.title}" has reached {listing.views_count} views.',
                    notification_type="listing_view",
                    listing=listing,
                )

        return Response({"message": "View tracked"})




class FavoriteViewSet(viewsets.ModelViewSet):
    queryset = Favorite.objects.all()
    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user).select_related("listing")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        
        
        
        
class AdTickerView(generics.ListAPIView):
    serializer_class = AdTickerSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return (
            Listing.objects.filter(
                listing_type=Listing.ListingType.BUSINESS_AD,
                visibility_status=Listing.VisibilityStatus.ACTIVE,
                status=Listing.Status.APPROVED,
            )
            .order_by("-created_at")[:10]
        )



from django.http import JsonResponse
from django.views.decorators.http import require_GET
import requests


@require_GET
def search_location(request):
    q = request.GET.get("q", "").strip()
    if not q:
        return JsonResponse({"error": "Missing query"}, status=400)

    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": q,
        "format": "jsonv2",
        "limit": 5,
        "countrycodes": "rw",
        "addressdetails": 1,
    }
    headers = {
        "User-Agent": "my-django-app/1.0"
    }

    try:
        resp = requests.get(url, params=params, headers=headers, timeout=10)


        resp.raise_for_status()
        data = resp.json()

        if not data:
            return JsonResponse({
                "error": "Not found",
                "query": q,
            }, status=404)

        first = data[0]
        return JsonResponse({
            "lat": first["lat"],
            "lng": first["lon"],
            "display_name": first.get("display_name"),
            "raw": data[:3],
        })

    except requests.RequestException as e:
        return JsonResponse({
            "error": "Request failed",
            "details": str(e),
        }, status=500)
        
        
        


from rest_framework import viewsets, permissions
from rest_framework.response import Response

from .models import Category
from .serializers import CategorySerializer


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


# class CategoryViewSet(viewsets.ModelViewSet):
#     serializer_class = CategorySerializer
#     permission_classes = [IsAdminOrReadOnly]
#     queryset = Category.objects.select_related("parent").prefetch_related("children").all().order_by("name")

#     def get_queryset(self):
#         queryset = super().get_queryset()

#         parent = self.request.query_params.get("parent")
#         roots_only = self.request.query_params.get("roots_only")
#         search = self.request.query_params.get("search")

#         if parent not in [None, ""]:
#             if parent == "null":
#                 queryset = queryset.filter(parent__isnull=True)
#             else:
#                 queryset = queryset.filter(parent_id=parent)

#         if roots_only in ["1", "true", "True"]:
#             queryset = queryset.filter(parent__isnull=True)

#         if search:
#             queryset = queryset.filter(name__icontains=search)

#         return queryset
    


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    queryset = (
        Category.objects
        .select_related("parent")
        .prefetch_related("children")
        .all()
        .order_by("name")
    )

    def get_queryset(self):
        queryset = super().get_queryset()

        parent = self.request.query_params.get("parent")
        roots_only = self.request.query_params.get("roots_only")
        search = self.request.query_params.get("search")

        if parent not in [None, ""]:
            if parent == "null":
                queryset = queryset.filter(parent__isnull=True)
            else:
                queryset = queryset.filter(parent_id=parent)

        if roots_only in ["1", "true", "True"]:
            queryset = queryset.filter(parent__isnull=True)

        if search:
            queryset = queryset.filter(name__icontains=search)

        return queryset

    def perform_destroy(self, instance):
        if instance.children.exists():
            raise ValidationError(
                {"detail": "You cannot delete a category that has subcategories."}
            )
        instance.delete()


    

from .serializers import PartnerSerializer


class PartnerListView(generics.ListCreateAPIView):
    # queryset = Partner.objects.filter(is_active=True).order_by("name")
    serializer_class = PartnerSerializer
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]
class PartnerListView(generics.ListCreateAPIView):
    serializer_class = PartnerSerializer
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        user = self.request.user

        if user.is_authenticated and (user.is_staff or user.is_superuser):
            return Partner.objects.all().order_by("name")

        return Partner.objects.filter(is_active=True).order_by("name")

class PartnerDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Partner.objects.all()
    serializer_class = PartnerSerializer
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def get_permissions(self):
        if self.request.method in ["PATCH", "PUT", "DELETE"]:
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]
    
    
    
    
class SellerDashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        listings = Listing.objects.filter(owner=request.user)

        total_listings = listings.count()
        active_listings = listings.filter(
            visibility_status=Listing.VisibilityStatus.ACTIVE
        ).count()
        approved_listings = listings.filter(status=Listing.Status.APPROVED).count()
        pending_listings = listings.filter(status=Listing.Status.PENDING).count()
        rejected_listings = listings.filter(status=Listing.Status.REJECTED).count()

        total_views = listings.aggregate(total=Sum("views_count"))["total"] or 0
        total_call_clicks = listings.aggregate(total=Sum("call_clicks"))["total"] or 0
        total_whatsapp_clicks = listings.aggregate(total=Sum("whatsapp_clicks"))["total"] or 0

        top_listing = listings.order_by("-views_count").first()

        return Response({
            "total_listings": total_listings,
            "active_listings": active_listings,
            "approved_listings": approved_listings,
            "pending_listings": pending_listings,
            "rejected_listings": rejected_listings,
            "total_views": total_views,
            "total_call_clicks": total_call_clicks,
            "total_whatsapp_clicks": total_whatsapp_clicks,
            "top_listing": {
                "id": top_listing.id,
                "title": top_listing.title,
                "views_count": top_listing.views_count,
                "call_clicks": top_listing.call_clicks,
                "whatsapp_clicks": top_listing.whatsapp_clicks,
            } if top_listing else None,
        })


class PopularCategoriesView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        data = (
            Listing.objects.filter(
                status=Listing.Status.APPROVED,
                visibility_status=Listing.VisibilityStatus.ACTIVE,
                category__isnull=False,
            )
            .values("category__id", "category__name")
            .annotate(
                total_listings=Count("id"),
                total_views=Sum("views_count"),
            )
            .order_by("-total_views", "-total_listings")[:10]
        )

        return Response(list(data))


class AdminAnalyticsOverviewView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        listings = Listing.objects.all()

        return Response({
            "total_listings": listings.count(),
            "approved_listings": listings.filter(status=Listing.Status.APPROVED).count(),
            "pending_listings": listings.filter(status=Listing.Status.PENDING).count(),
            "rejected_listings": listings.filter(status=Listing.Status.REJECTED).count(),
            "active_listings": listings.filter(
                visibility_status=Listing.VisibilityStatus.ACTIVE
            ).count(),
            "inactive_listings": listings.filter(
                visibility_status=Listing.VisibilityStatus.INACTIVE
            ).count(),
            "total_views": listings.aggregate(total=Sum("views_count"))["total"] or 0,
            "total_call_clicks": listings.aggregate(total=Sum("call_clicks"))["total"] or 0,
            "total_whatsapp_clicks": listings.aggregate(total=Sum("whatsapp_clicks"))["total"] or 0,
        })
        
        
        
class PublicListingListView(generics.ListAPIView):
    serializer_class = ListingSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = [
        "listing_type",
        "district",
        "sector",
        "sale_mode",
        "is_featured",
        "category",
        "negotiable",
    ]
    search_fields = [
        "title",
        "description",
        "address",
        "district",
        "sector",
        "village",
        "contact_phone",
        "contact_email",
    ]
    ordering_fields = ["price", "created_at", "views_count"]

    def get_queryset(self):
        return (
            Listing.objects.select_related("owner", "category")
            .prefetch_related("images")
            .filter(
                status=Listing.Status.APPROVED,
                visibility_status=Listing.VisibilityStatus.ACTIVE,
            )
            .exclude(listing_type=Listing.ListingType.BUSINESS_AD)
            .order_by("-interested_count", "-created_at")
        )
        
        
class PublicBusinessAdListView(generics.ListAPIView):
    serializer_class = ListingSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["district", "sector", "category"]
    search_fields = [
        "title",
        "description",
        "address",
        "district",
        "sector",
        "village",
        "contact_phone",
        "contact_email",
    ]
    ordering_fields = ["created_at", "views_count"]

    def get_queryset(self):
        return (
            Listing.objects.select_related("owner", "category")
            .prefetch_related("images")
            .filter(
                status=Listing.Status.APPROVED,
                visibility_status=Listing.VisibilityStatus.ACTIVE,
                listing_type=Listing.ListingType.BUSINESS_AD,
            )
            .order_by("-interested_count", "-created_at")
        )
        
        
        
class PublicListingDetailView(generics.RetrieveAPIView):
    serializer_class = ListingSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "id"
    lookup_url_kwarg = "id"

    def get_queryset(self):
        return (
            Listing.objects.select_related("owner", "category")
            .prefetch_related("images")
            .filter(
                status=Listing.Status.APPROVED,
                visibility_status=Listing.VisibilityStatus.ACTIVE,
            )
        )
        
        
        
class PromoBannerViewSet(viewsets.ModelViewSet):
    serializer_class = PromoBannerSerializer
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_queryset(self):
        qs = PromoBanner.objects.all().order_by("-created_at")

        user = self.request.user
        if user.is_authenticated and (user.is_staff or user.is_superuser):
            return qs

        return qs.filter(is_active=True)

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]