"""Scatter plot."""

from __future__ import annotations

from d3_bridge.core import Chart

#: Point shapes the renderer knows (``shape`` / ``shape_field`` values).
SHAPES = ("circle", "square", "cross", "x", "diamond", "triangle", "star", "wye")


def _domain(value, name):
    if value is None:
        return None
    lo, hi = value
    if hi <= lo:
        raise ValueError(f"{name} must be (min, max) with max > min, got {value!r}")
    return [lo, hi]


def _region(region: dict) -> dict:
    missing = {"x0", "x1", "y0", "y1"} - set(region)
    if missing:
        raise ValueError(f"region is missing {sorted(missing)}: {region!r}")
    out = {k: region[k] for k in ("x0", "x1", "y0", "y1")}
    for key in ("label", "color", "opacity"):
        if region.get(key) is not None:
            out[key] = region[key]
    return out


class ScatterPlot(Chart):
    """Scatter plot.

    Besides the usual options, a scatter can be a positioning matrix:

    - ``x_domain`` / ``y_domain``: fixed axis bounds ``(min, max)`` instead of
      the data extent, so points sit in a stable frame (e.g. 0 to 10).
    - ``regions``: background rectangles drawn behind the points, each a dict
      with ``x0``, ``x1``, ``y0``, ``y1`` in data units and optional
      ``label``, ``color`` and ``opacity``.
    - ``connect``: draw a line through the points in data order. ``True``
      joins every point; a field name joins only the points where that field
      is truthy (a trajectory that skips some points).
    - ``label``: field whose value is written on each point (e.g. a number).
    - ``color_field``: field holding a literal CSS colour per point; wins
      over ``color_by``.
    - ``shape_field``: field holding a shape name per point (see ``SHAPES``).
    - ``field_labels``: display names for fields in the tooltip.
      ``tooltip`` may also be a list of field names to show.
    """

    chart_type = "scatter"

    def __init__(self, data=None, x: str = None, y: str = None, **kw):
        self.x = x
        self.y = y
        self.x_label: str | None = kw.pop("x_label", None)
        self.y_label: str | None = kw.pop("y_label", None)
        self.size: str | float = kw.pop("size", 5)  # field name or fixed radius
        self.color_by: str | None = kw.pop("color_by", None)  # field for color encoding
        self.shape: str = kw.pop("shape", "circle")  # see SHAPES
        self.opacity: float = kw.pop("opacity", 0.7)
        self.grid: bool = kw.pop("grid", True)
        self.zoom: bool = kw.pop("zoom", False)
        self.regression: str | None = kw.pop("regression", None)  # "linear", None
        self.x_domain = _domain(kw.pop("x_domain", None), "x_domain")
        self.y_domain = _domain(kw.pop("y_domain", None), "y_domain")
        self.regions: list[dict] = [_region(r) for r in kw.pop("regions", None) or []]
        self.connect: bool | str = kw.pop("connect", False)
        self.label: str | None = kw.pop("label", None)
        self.color_field: str | None = kw.pop("color_field", None)
        self.shape_field: str | None = kw.pop("shape_field", None)
        self.field_labels: dict | None = kw.pop("field_labels", None)
        if self.shape not in SHAPES:
            raise ValueError(f"shape must be one of {SHAPES}, got {self.shape!r}")
        super().__init__(data=data, **kw)

    def _build_config(self) -> dict:
        config = {
            "x": self.x,
            "y": self.y,
            "size": self.size,
            "shape": self.shape,
            "opacity": self.opacity,
            "grid": self.grid,
            "zoom": self.zoom,
        }
        if self.color_by:
            config["colorBy"] = self.color_by
        if self.x_label:
            config["xLabel"] = self.x_label
        if self.y_label:
            config["yLabel"] = self.y_label
        if self.regression:
            config["regression"] = self.regression
        if self.x_domain:
            config["xDomain"] = self.x_domain
        if self.y_domain:
            config["yDomain"] = self.y_domain
        if self.regions:
            config["regions"] = self.regions
        if self.connect:
            config["connect"] = self.connect
        if self.label:
            config["label"] = self.label
        if self.color_field:
            config["colorField"] = self.color_field
        if self.shape_field:
            config["shapeField"] = self.shape_field
        if self.field_labels:
            config["fieldLabels"] = dict(self.field_labels)
        return config
