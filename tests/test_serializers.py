"""Tests for d3_bridge.data.serializers and the shared encoder."""

import json
from datetime import date, datetime
from decimal import Decimal

import pytest

from d3_bridge.core import Chart
from d3_bridge.data.serializers import serialize_data, serialize_queryset
from d3_bridge.encoders import BridgeJSONEncoder, dumps_script_safe
from tests.models import Sale


class TestSerializeData:
    def test_none(self):
        assert serialize_data(None) == []

    def test_list_passthrough(self):
        data = [{"a": 1}, {"a": 2}]
        assert serialize_data(data) == data

    def test_tuple_to_list(self):
        assert serialize_data(({"a": 1},)) == [{"a": 1}]

    def test_dict_passthrough(self):
        assert serialize_data({"a": 1}) == {"a": 1}

    def test_unsupported_type(self):
        with pytest.raises(ValueError):
            serialize_data("not-a-dataset")

    def test_queryset(self, db):
        Sale.objects.create(product="cacao", region="north",
                            amount=Decimal("10.50"), sold_on=date(2026, 1, 1))
        data = serialize_data(Sale.objects.all(), fields=["product", "amount"])
        assert data == [{"product": "cacao", "amount": Decimal("10.50")}]

    def test_serialize_queryset_all_fields(self, db):
        Sale.objects.create(product="cacao", region="north",
                            amount=Decimal("10.50"), sold_on=date(2026, 1, 1))
        rows = serialize_queryset(Sale.objects.all())
        assert rows[0]["region"] == "north"


class TestBridgeEncoder:
    def test_decimal(self):
        assert json.dumps(Decimal("1.5"), cls=BridgeJSONEncoder) == "1.5"

    def test_datetime(self):
        out = json.dumps(datetime(2026, 1, 1, 12, 30), cls=BridgeJSONEncoder)
        assert out == '"2026-01-01T12:30:00"'

    def test_date(self):
        assert json.dumps(date(2026, 1, 1), cls=BridgeJSONEncoder) == '"2026-01-01"'

    def test_geo_interface(self):
        class FakeGeom:
            __geo_interface__ = {"type": "Point", "coordinates": [0.0, 0.0]}

        out = json.loads(json.dumps(FakeGeom(), cls=BridgeJSONEncoder))
        assert out["type"] == "Point"

    def test_chart_to_json_handles_django_types(self):
        """Regression: to_json() used a bare json.dumps and crashed on
        Decimal/date while {% d3_render %} handled them fine."""
        c = Chart(data=[{"amount": Decimal("9.99"), "day": date(2026, 1, 1)}])
        parsed = json.loads(c.to_json())
        assert parsed["data"][0] == {"amount": 9.99, "day": "2026-01-01"}

    def test_dumps_script_safe_escapes(self):
        out = dumps_script_safe({"x": "</script> & <b>"})
        assert "<" not in out
        assert ">" not in out
        assert "&" not in out
        assert json.loads(out) == {"x": "</script> & <b>"}
