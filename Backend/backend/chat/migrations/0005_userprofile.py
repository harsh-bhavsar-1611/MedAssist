from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("chat", "0004_chatsession_title"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="UserProfile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("birth_date", models.DateField(blank=True, null=True)),
                (
                    "gender",
                    models.CharField(
                        choices=[
                            ("male", "Male"),
                            ("female", "Female"),
                            ("other", "Other"),
                            ("prefer_not_to_say", "Prefer not to say"),
                        ],
                        default="prefer_not_to_say",
                        max_length=20,
                    ),
                ),
                (
                    "preferred_theme",
                    models.CharField(
                        choices=[
                            ("light", "Light"),
                            ("dark", "Dark"),
                            ("ocean", "Ocean"),
                            ("forest", "Forest"),
                            ("sunset", "Sunset"),
                        ],
                        default="light",
                        max_length=20,
                    ),
                ),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="profile",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
    ]
