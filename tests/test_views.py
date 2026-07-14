"""Tests for ChartDataView — filtering/limit ordering, JSON encoding."""

import json
from datetime import date
from decimal import Decimal

import pytest
from django.test import RequestFactory

from d3_bridge.views import ChartDataView
from tests.models import Sale


@pytest.fixture
def sales(db):
    return [
        Sale.objects.create(product="cacao", region="north", amount=Decimal("10.50"),
                            sold_on=date(2026, 1, 1)),
        Sale.objects.create(product="cajou", region="south", amount=Decimal("20.00"),
                            sold_on=date(2026, 1, 2)),
        Sale.objects.create(product="karite", region="north", amount=Decimal("30.25"),
                            sold_on=date(2026, 1, 3)),
    ]


def _get(view_cls, **initkwargs):
    request = RequestFactory().get("/api/chart/")
    response = view_cls.as_view(**initkwargs)(request)
    return json.loads(response.content)


class TestChartDataView:
    def test_basic(self, sales):
        data = _get(ChartDataView, queryset=Sale.objects.all(),
                    fields=["product", "amount"])
        assert len(data) == 3
        assert set(data[0]) == {"product", "amount"}

    def test_decimal_and_date_encoded(self, sales):
        data = _get(ChartDataView, queryset=Sale.objects.all(),
                    fields=["amount", "sold_on"])
        assert data[0]["amount"] == 10.5
        assert data[0]["sold_on"] == "2026-01-01"

    def test_limit(self, sales):
        data = _get(ChartDataView, queryset=Sale.objects.all(), limit=2)
        assert len(data) == 2

    def test_ordering(self, sales):
        data = _get(ChartDataView, queryset=Sale.objects.all(),
                    fields=["product"], ordering="-sold_on")
        assert data[0]["product"] == "karite"

    def test_filter_queryset_with_limit(self, sales):
        """Regression: limit sliced the queryset before filter_queryset(),
        so any .filter() override raised 'Cannot filter a query once a
        slice has been taken'."""

        class RegionView(ChartDataView):
            queryset = Sale.objects.all()
            fields = ["product", "region"]
            limit = 10

            def filter_queryset(self, qs):
                return qs.filter(region="north")

        data = _get(RegionView)
        assert len(data) == 2
        assert all(row["region"] == "north" for row in data)

    def test_limit_applied_after_filter(self, sales):
        class RegionView(ChartDataView):
            queryset = Sale.objects.all()
            fields = ["product"]
            ordering = "sold_on"
            limit = 1

            def filter_queryset(self, qs):
                return qs.filter(region="north")

        data = _get(RegionView)
        # 1 record out of the 2 "north" rows — not the unfiltered first row only
        assert len(data) == 1
        assert data[0]["product"] == "cacao"

    def test_missing_queryset_raises(self):
        request = RequestFactory().get("/api/chart/")
        with pytest.raises(ValueError):
            ChartDataView.as_view()(request)
