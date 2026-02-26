from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("chat", "0008_medicalreportanalysis"),
    ]

    operations = [
        migrations.CreateModel(
            name="MedicalReportUpload",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("file", models.FileField(upload_to="medical_reports/%Y/%m/%d/")),
                ("original_name", models.CharField(max_length=255)),
                ("content_type", models.CharField(blank=True, default="", max_length=120)),
                ("size", models.BigIntegerField(default=0)),
                ("uploaded_at", models.DateTimeField(auto_now_add=True)),
                (
                    "report",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="uploads", to="chat.medicalreportanalysis"),
                ),
                (
                    "uploaded_by",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="medical_report_uploads", to="auth.user"),
                ),
            ],
        ),
    ]
