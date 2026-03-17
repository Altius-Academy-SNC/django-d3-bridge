"""Serialize Django data sources to JSON-ready structures for D3.js."""

from __future__ import annotations

import json
from datetime import date, datetime
from decimal import Decimal
from typing import Any


def _default_json(obj):
    """JSON encoder for Django types."""
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    if isinstance(obj, Decimal):
        return float(obj)
    if hasattr(obj, "__geo_interface__"):
        return obj.__geo_interface__
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")


def _is_geo_queryset(data) -> bool:
    """Check if data is a GeoQuerySet or contains geometry fields."""
    try:
        from django.contrib.gis.db.models import GeometryField

        if hasattr(data, "model"):
            for field in data.model._meta.get_fields():
                if isinstance(field, GeometryField):
                    return True
    except ImportError:
        pass
    return False


def serialize_queryset(qs, fields: list[str] | None = None) -> list[dict]:
    """Serialize a Django QuerySet to a list of dicts."""
    if fields:
        return list(qs.values(*fields))
    return list(qs.values())


def serialize_geojson(qs, geometry_field: str | None = None, properties: list[str] | None = None) -> dict:
    """Serialize a GeoQuerySet to a GeoJSON FeatureCollection."""
    try:
        from django.contrib.gis.db.models import GeometryField
    except ImportError:
        raise ImportError("django.contrib.gis is required for geo serialization")

    # Auto-detect geometry field
    if geometry_field is None:
        for field in qs.model._meta.get_fields():
            if isinstance(field, GeometryField):
                geometry_field = field.name
                break
        if geometry_field is None:
            raise ValueError(f"No geometry field found on {qs.model.__name__}")

    # Determine property fields
    if properties is None:
        properties = [
            f.name
            for f in qs.model._meta.get_fields()
            if hasattr(f, "column") and not isinstance(f, GeometryField) and f.name != "id"
        ]

    features = []
    for obj in qs.only(geometry_field, *properties):
        geom = getattr(obj, geometry_field)
        props = {}
        for prop in properties:
            val = getattr(obj, prop, None)
            # Ensure JSON serializable
            if isinstance(val, (datetime, date)):
                val = val.isoformat()
            elif isinstance(val, Decimal):
                val = float(val)
            props[prop] = val

        features.append({
            "type": "Feature",
            "id": obj.pk,
            "geometry": json.loads(geom.geojson) if geom else None,
            "properties": props,
        })

    return {
        "type": "FeatureCollection",
        "features": features,
    }


def serialize_data(data, fields: list[str] | None = None, **kw) -> Any:
    """Universal serializer — detects data type and serializes accordingly.

    Supports:
    - Django QuerySet → list of dicts
    - GeoQuerySet → GeoJSON FeatureCollection
    - list/tuple of dicts → passthrough
    - dict → wrap in list
    - pandas DataFrame → list of records (if pandas available)
    """
    if data is None:
        return []

    # Django QuerySet
    if hasattr(data, "model") and hasattr(data, "values"):
        if _is_geo_queryset(data) and kw.get("as_geojson", False):
            return serialize_geojson(
                data,
                geometry_field=kw.get("geometry_field"),
                properties=fields,
            )
        return serialize_queryset(data, fields=fields)

    # pandas DataFrame
    if hasattr(data, "to_dict") and hasattr(data, "columns"):
        if fields:
            data = data[fields]
        return data.to_dict("records")

    # list/tuple
    if isinstance(data, (list, tuple)):
        return list(data)

    # dict — single record
    if isinstance(data, dict):
        return data

    raise ValueError(f"Unsupported data type: {type(data).__name__}")
