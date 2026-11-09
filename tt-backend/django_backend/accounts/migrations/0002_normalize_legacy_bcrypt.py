from django.db import migrations


def normalize_bcrypt_hashes(apps, schema_editor):
    Reader = apps.get_model("accounts", "Reader")
    alias = schema_editor.connection.alias
    for reader in Reader.objects.using(alias).filter(password__startswith="$2").iterator():
        Reader.objects.using(alias).filter(pk=reader.pk).update(password=f"bcrypt${reader.password}")


class Migration(migrations.Migration):
    dependencies = [("accounts", "0001_initial")]

    operations = [migrations.RunPython(normalize_bcrypt_hashes, migrations.RunPython.noop)]
