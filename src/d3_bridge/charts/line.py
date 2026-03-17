"""Line and area chart variants."""

from __future__ import annotations

from d3_bridge.core import Chart


class LineChart(Chart):
    chart_type = "line"

    def __init__(self, data=None, x: str = None, y: str = None, **kw):
        self.x = x
        self.y = y
        self.x_label: str | None = kw.pop("x_label", None)
        self.y_label: str | None = kw.pop("y_label", None)
        self.x_type: str = kw.pop("x_type", "auto")  # "auto", "time", "linear", "band"
        self.curve: str = kw.pop("curve", "curveMonotoneX")
        self.stroke_width: float = kw.pop("stroke_width", 2)
        self.dots: bool = kw.pop("dots", True)
        self.dot_radius: float = kw.pop("dot_radius", 4)
        self.series: str | None = kw.pop("series", None)  # field to split into multiple lines
        self.fill: bool = kw.pop("fill", False)
        self.fill_opacity: float = kw.pop("fill_opacity", 0.1)
        self.grid: bool = kw.pop("grid", True)
        self.zoom: bool = kw.pop("zoom", False)
        self.color: str | None = kw.pop("color", None)
        super().__init__(data=data, **kw)

    def _build_config(self) -> dict:
        config = {
            "x": self.x,
            "y": self.y,
            "xType": self.x_type,
            "curve": self.curve,
            "strokeWidth": self.stroke_width,
            "dots": self.dots,
            "dotRadius": self.dot_radius,
            "fill": self.fill,
            "fillOpacity": self.fill_opacity,
            "grid": self.grid,
            "zoom": self.zoom,
        }
        if self.series:
            config["series"] = self.series
        if self.x_label:
            config["xLabel"] = self.x_label
        if self.y_label:
            config["yLabel"] = self.y_label
        if self.color:
            config["color"] = self.color
        return config


class AreaChart(LineChart):
    chart_type = "area"

    def __init__(self, data=None, x: str = None, y: str = None, **kw):
        kw.setdefault("fill", True)
        kw.setdefault("fill_opacity", 0.4)
        kw.setdefault("dots", False)
        super().__init__(data=data, x=x, y=y, **kw)
