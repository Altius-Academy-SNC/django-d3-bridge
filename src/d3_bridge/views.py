"""View helpers for django-d3-bridge.

Provides ChartDataView — a lightweight JSON endpoint for chart polling.
No dependency on Django REST Framework; works with plain Django.

Usage::

    # urls.py
    from d3_bridge.views import ChartDataView
    from myapp.models import Product

    urlpatterns = [
        path("api/chart/products/", ChartDataView.as_view(
            queryset=Product.objects.all(),
            fields=["name", "price"],
        )),
    ]

    # views.py (or inline)
    chart = BarChart(
        data=Product.objects.values("name", "price"),
        x="name", y="price",
        poll_url="/api/chart/products/",
        poll_interval=30,
    )
"""

from __future__ import annotations

import json
from datetime import date, datetime
from decimal import Decimal
from django.http import JsonResponse
from django.views import View

from d3_bridge.data.serializers import serialize_data


class _ChartEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)


class ChartDataView(View):
    """Lightweight JSON endpoint that serves chart-ready data.

    Class attributes (set via as_view() or subclass):
        queryset:       Django QuerySet (evaluated fresh each request).
        fields:         List of field names to include. None = all.
        geojson:        If True, serialize as GeoJSON FeatureCollection.
        geometry_field: Name of geometry field (auto-detected if None).
        ordering:       Field(s) to order by. None = queryset default.
        limit:          Max number of records. None = no limit.
    """

    queryset = None
    fields: list[str] | None = None
    geojson: bool = False
    geometry_field: str | None = None
    ordering: str | list[str] | None = None
    limit: int | None = None

    def get_queryset(self):
        """Override for dynamic querysets based on request."""
        qs = self.queryset
        if qs is None:
            raise ValueError("ChartDataView requires a queryset")
        # Clone to avoid mutating the class-level queryset
        qs = qs.all()
        if self.ordering:
            qs = qs.order_by(self.ordering) if isinstance(self.ordering, str) else qs.order_by(*self.ordering)
        if self.limit:
            qs = qs[:self.limit]
        return qs

    def filter_queryset(self, qs):
        """Override to add request-based filtering (query params, etc.)."""
        return qs

    def get(self, request, *args, **kwargs):
        qs = self.get_queryset()
        qs = self.filter_queryset(qs)

        data = serialize_data(
            qs,
            fields=self.fields,
            as_geojson=self.geojson,
            geometry_field=self.geometry_field,
        )

        return JsonResponse(
            data,
            safe=False,
            encoder=_ChartEncoder,
        )
