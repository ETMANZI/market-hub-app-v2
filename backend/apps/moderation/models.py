from django.conf import settings
from django.db import models
from apps.common.models import TimeStampedModel


class ModerationAction(TimeStampedModel):
    class Action(models.TextChoices):
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    moderator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    listing = models.ForeignKey("listings.Listing", on_delete=models.CASCADE, related_name="moderation_actions")
    action = models.CharField(max_length=20, choices=Action.choices)
    reason = models.TextField(blank=True)
    
    
    
    

class VisitorLog(models.Model):
    path = models.CharField(max_length=500, blank=True, default="")
    ip_address = models.CharField(max_length=100, blank=True, default="")
    country = models.CharField(max_length=100, blank=True, default="")
    city = models.CharField(max_length=100, blank=True, default="")
    session_key = models.CharField(max_length=100, blank=True, default="")
    user_agent = models.TextField(blank=True, default="")
    is_authenticated = models.BooleanField(default=False)
    visited_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["visited_at"]),
            models.Index(fields=["ip_address"]),
            models.Index(fields=["session_key"]),
        ]

    def __str__(self):
        return f"{self.ip_address} - {self.path} - {self.visited_at}"