"""Geographic chart types — choropleth, bubble map."""

from __future__ import annotations

from d3_bridge.core import Chart
from d3_bridge.data.serializers import serialize_geojson


class ChoroplethMap(Chart):
    chart_type = "choropleth"

    def __init__(self, geodata=None, value_field: str = None, **kw):
        self.value_field = value_field
        self.geometry_field: str | None = kw.pop("geometry_field", None)
        self.properties: list[str] | None = kw.pop("properties", None)
        self.projection: str = kw.pop("projection", "mercator")
        self.center: list[float] | None = kw.pop("center", None)
        self.scale: float | None = kw.pop("scale", None)
        self.color_scale: str = kw.pop("color_scale", "sequential")  # "sequential", "diverging", "threshold"
        self.color_domain: list | None = kw.pop("color_domain", None)
        self.stroke_color: str = kw.pop("stroke_color", "#fff")
        self.stroke_width: float = kw.pop("stroke_width", 0.5)
        self.zoom: bool = kw.pop("zoom", True)
        self.null_color: str = kw.pop("null_color", "#ccc")
        super().__init__(data=geodata, **kw)

    def _serialize_data(self):
        """Geo charts always serialize as GeoJSON."""
        if self._raw_data is None:
            return {"type": "FeatureCollection", "features": []}

        # Already a GeoJSON dict
        if isinstance(self._raw_data, dict) and self._raw_data.get("type") == "FeatureCollection":
            return self._raw_data

        # Django GeoQuerySet
        if hasattr(self._raw_data, "model"):
            return serialize_geojson(
                self._raw_data,
                geometry_field=self.geometry_field,
                properties=self.properties,
            )

        return self._raw_data

    def _build_config(self) -> dict:
        config = {
            "valueField": self.value_field,
            "projection": self.projection,
            "colorScale": self.color_scale,
            "strokeColor": self.stroke_color,
            "strokeWidth": self.stroke_width,
            "zoom": self.zoom,
            "nullColor": self.null_color,
        }
        if self.center:
            config["center"] = self.center
        if self.scale:
            config["scale"] = self.scale
        if self.color_domain:
            config["colorDomain"] = self.color_domain
        return config


class BubbleMap(ChoroplethMap):
    chart_type = "bubblemap"

    def __init__(self, geodata=None, value_field: str = None, **kw):
        self.size_field: str | None = kw.pop("size_field", None)
        self.size_range: list[float] = kw.pop("size_range", [3, 30])
        super().__init__(geodata=geodata, value_field=value_field, **kw)

    def _build_config(self) -> dict:
        config = super()._build_config()
        if self.size_field:
            config["sizeField"] = self.size_field
        config["sizeRange"] = self.size_range
        return config
