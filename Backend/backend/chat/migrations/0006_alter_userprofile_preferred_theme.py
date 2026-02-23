from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("chat", "0005_userprofile"),
    ]

    operations = [
        migrations.AlterField(
            model_name="userprofile",
            name="preferred_theme",
            field=models.CharField(
                choices=[("light", "Light"), ("dark", "Dark")],
                default="light",
                max_length=20,
            ),
        ),
    ]
