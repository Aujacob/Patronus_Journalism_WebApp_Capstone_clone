# Generated by Django 5.0.1 on 2024-02-03 21:52

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('patronusapplication', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='customuser',
            name='first_name',
        ),
        migrations.RemoveField(
            model_name='customuser',
            name='last_name',
        ),
    ]
