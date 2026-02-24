from django.db import models
from django.contrib.auth.models import User

# Create your models here.
# class ChatSession(models.Model):
#     created_at = models.DateTimeField(auto_now_add=True)

# class ChatMessage(models.Model):
#     session = models.ForeignKey(ChatSession, on_delete=models.CASCADE)
#     user_message = models.TextField()
#     bot_response = models.TextField()
#     created_at = models.DateTimeField(auto_now_add=True)

class ChatSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="chat_sessions", null=True, blank=True)
    title = models.CharField(max_length=120, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)


class ChatMessage(models.Model):
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name="messages")
    sender = models.CharField(max_length=10)  # "user" or "bot"
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)


class UserProfile(models.Model):
    GENDER_CHOICES = [
        ("male", "Male"),
        ("female", "Female"),
        ("other", "Other"),
        ("prefer_not_to_say", "Prefer not to say"),
    ]

    THEME_CHOICES = [
        ("light", "Light"),
        ("dark", "Dark"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    birth_date = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, default="prefer_not_to_say")
    preferred_theme = models.CharField(max_length=20, choices=THEME_CHOICES, default="light")


class AdminAuditLog(models.Model):
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="admin_audit_logs")
    action = models.CharField(max_length=120)
    entity_type = models.CharField(max_length=60, blank=True, default="")
    entity_id = models.CharField(max_length=60, blank=True, default="")
    details = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class MedicalDataVersion(models.Model):
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="medical_data_versions")
    note = models.CharField(max_length=255, blank=True, default="")
    snapshot = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class MedicalReportAnalysis(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="medical_report_analyses")
    title = models.CharField(max_length=180, blank=True, default="")
    file_names = models.JSONField(default=list, blank=True)
    extracted_text = models.TextField(blank=True, default="")
    analysis = models.TextField(blank=True, default="")
    warnings = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
