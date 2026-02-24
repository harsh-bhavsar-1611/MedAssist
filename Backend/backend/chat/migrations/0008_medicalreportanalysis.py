from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("chat", "0007_adminauditlog_medicaldataversion"),
    ]

    operations = [
        migrations.CreateModel(
            name="MedicalReportAnalysis",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(blank=True, default="", max_length=180)),
                ("file_names", models.JSONField(blank=True, default=list)),
                ("extracted_text", models.TextField(blank=True, default="")),
                ("analysis", models.TextField(blank=True, default="")),
                ("warnings", models.JSONField(blank=True, default=list)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "user",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="medical_report_analyses", to="auth.user"),
                ),
            ],
        ),
    ]
