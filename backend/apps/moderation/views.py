from datetime import timedelta

from django.contrib.gis.geoip2 import GeoIP2
from django.db.models import Count, Q
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth
from django.utils import timezone

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.response import Response

from apps.listings.models import Listing
from .models import ModerationAction, VisitorLog


class ModerateListingView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, listing_id):
        if getattr(request.user, "role", None) not in ["admin", "moderator"]:
            return Response({"detail": "Not allowed"}, status=403)

        listing = Listing.objects.get(id=listing_id)
        action = request.data.get("action")
        reason = request.data.get("reason", "")

        if action == "approve":
            listing.status = Listing.Status.APPROVED
            action_value = "approved"
        else:
            listing.status = Listing.Status.REJECTED
            action_value = "rejected"

        listing.save(update_fields=["status"])

        ModerationAction.objects.create(
            moderator=request.user,
            listing=listing,
            action=action_value,
            reason=reason,
        )

        return Response({"message": f"Listing {action_value}"})


class TrackVisitorView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
        if forwarded:
            ip = forwarded.split(",")[0].strip()
        else:
            ip = request.META.get("REMOTE_ADDR")

        session_key = request.session.session_key
        if not session_key:
            request.session.create()
            session_key = request.session.session_key

        user_agent = request.META.get("HTTP_USER_AGENT", "")
        path = request.data.get("path", "") or ""

        country = ""
        city = ""

        try:
            if ip and ip not in ["127.0.0.1", "::1"]:
                g = GeoIP2()
                city_data = g.city(ip)
                country = city_data.get("country_name", "") or ""
                city = city_data.get("city", "") or ""
        except Exception:
            pass

        now = timezone.now()
        one_hour_ago = now - timedelta(hours=1)

        recent_visit_exists = VisitorLog.objects.filter(
            ip_address=ip,
            session_key=session_key or "",
            user_agent=user_agent,
            path=path,
            visited_at__gte=one_hour_ago,
        ).exists()

        if not recent_visit_exists:
            VisitorLog.objects.create(
                path=path,
                ip_address=ip,
                country=country,
                city=city,
                session_key=session_key or "",
                user_agent=user_agent,
                is_authenticated=request.user.is_authenticated,
            )

        return Response({"message": "tracked"})


class VisitorStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, *args, **kwargs):
        qs = VisitorLog.objects.all()
        now = timezone.localtime()
        today = timezone.localdate()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        daily_qs = (
            qs.annotate(period=TruncDate("visited_at"))
            .values("period")
            .annotate(total=Count("id"))
            .order_by("-period")[:30]
        )

        weekly_qs = (
            qs.annotate(period=TruncWeek("visited_at"))
            .values("period")
            .annotate(total=Count("id"))
            .order_by("-period")[:12]
        )

        monthly_qs = (
            qs.annotate(period=TruncMonth("visited_at"))
            .values("period")
            .annotate(total=Count("id"))
            .order_by("-period")[:12]
        )

        by_country_qs = (
            qs.exclude(country="")
            .values("country")
            .annotate(total=Count("id"))
            .order_by("-total")[:10]
        )

        daily = [
            {
                "period": item["period"].strftime("%Y-%m-%d") if item["period"] else "",
                "total": item["total"],
            }
            for item in reversed(daily_qs)
        ]

        weekly = [
            {
                "period": item["period"].strftime("%Y-%m-%d") if item["period"] else "",
                "total": item["total"],
            }
            for item in reversed(weekly_qs)
        ]

        monthly = [
            {
                "period": item["period"].strftime("%Y-%m") if item["period"] else "",
                "total": item["total"],
            }
            for item in reversed(monthly_qs)
        ]

        by_country = list(by_country_qs)

        total_visits = qs.count()
        today_visits = qs.filter(visited_at__date=today).count()
        this_month_visits = qs.filter(visited_at__gte=month_start).count()

        unique_visitors = (
            qs.values("ip_address", "session_key", "user_agent")
            .distinct()
            .count()
        )

        return Response({
            "total_visits": total_visits,
            "unique_visitors": unique_visitors,
            "today_visits": today_visits,
            "this_month_visits": this_month_visits,
            "daily": daily,
            "weekly": weekly,
            "monthly": monthly,
            "by_country": by_country,
        })