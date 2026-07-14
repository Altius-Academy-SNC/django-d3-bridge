"""Minimal model used by the ChartDataView / serializer tests."""

from django.db import models


class Sale(models.Model):
    product = models.CharField(max_length=50)
    region = models.CharField(max_length=50)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    sold_on = models.DateField()

    class Meta:
        app_label = "tests"
