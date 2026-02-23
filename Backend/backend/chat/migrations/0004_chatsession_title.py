from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("chat", "0003_chatsession_user"),
    ]

    operations = [
        migrations.AddField(
            model_name="chatsession",
            name="title",
            field=models.CharField(blank=True, default="", max_length=120),
        ),
    ]
