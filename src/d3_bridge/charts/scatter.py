"""Scatter plot."""

from __future__ import annotations

from d3_bridge.core import Chart


class ScatterPlot(Chart):
    chart_type = "scatter"

    def __init__(self, data=None, x: str = None, y: str = None, **kw):
        self.x = x
        self.y = y
        self.x_label: str | None = kw.pop("x_label", None)
        self.y_label: str | None = kw.pop("y_label", None)
        self.size: str | float = kw.pop("size", 5)  # field name or fixed radius
        self.color_by: str | None = kw.pop("color_by", None)  # field for color encoding
        self.shape: str = kw.pop("shape", "circle")  # "circle", "square", "cross"
        self.opacity: float = kw.pop("opacity", 0.7)
        self.grid: bool = kw.pop("grid", True)
        self.zoom: bool = kw.pop("zoom", False)
        self.regression: str | None = kw.pop("regression", None)  # "linear", None
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
        return config
