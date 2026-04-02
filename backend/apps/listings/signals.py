from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Listing

@receiver(pre_save, sender=Listing)
def listing_pre_save(sender, instance, **kwargs):
    # print("PRE_SAVE SIGNAL:", instance.id, instance.status)

    pass

@receiver(post_save, sender=Listing)
def listing_post_save(sender, instance, created, **kwargs):
    # print("POST_SAVE SIGNAL:", instance.id, instance.status, "created=", created)
    pass