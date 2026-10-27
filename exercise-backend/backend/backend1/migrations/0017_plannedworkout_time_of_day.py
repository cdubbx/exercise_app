from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('backend1', '0016_spotifyconnection'),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name='plannedworkout',
            name='unique_saved_plan_day',
        ),
        migrations.RemoveConstraint(
            model_name='plannedworkout',
            name='unique_custom_plan_day',
        ),
        migrations.AddField(
            model_name='plannedworkout',
            name='time_of_day',
            field=models.CharField(choices=[('Morning', 'Morning'), ('Afternoon', 'Afternoon'), ('Evening', 'Evening'), ('Anytime', 'Anytime')], default='Anytime', max_length=10),
        ),
        migrations.AddConstraint(
            model_name='plannedworkout',
            constraint=models.UniqueConstraint(fields=('user', 'saved_workout', 'day_of_the_week', 'time_of_day'), name='unique_saved_plan_day_time'),
        ),
        migrations.AddConstraint(
            model_name='plannedworkout',
            constraint=models.UniqueConstraint(fields=('user', 'custom_workout', 'day_of_the_week', 'time_of_day'), name='unique_custom_plan_day_time'),
        ),
    ]
