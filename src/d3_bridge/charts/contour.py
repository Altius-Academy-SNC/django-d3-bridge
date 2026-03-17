"""Contour and density plots."""

from __future__ import annotations

from d3_bridge.core import Chart


class ContourPlot(Chart):
    chart_type = "contour"

    def __init__(self, data=None, x: str = None, y: str = None, value: str = None, **kw):
        self.x = x
        self.y = y
        self.value = value
        self.x_label: str | None = kw.pop("x_label", None)
        self.y_label: str | None = kw.pop("y_label", None)
        self.thresholds: int = kw.pop("thresholds", 10)
        self.color_scale: str = kw.pop("color_scale", "sequential")
        self.grid: bool = kw.pop("grid", True)
        super().__init__(data=data, **kw)

    def _build_config(self) -> dict:
        config = {
            "x": self.x,
            "y": self.y,
            "value": self.value,
            "thresholds": self.thresholds,
            "colorScale": self.color_scale,
            "grid": self.grid,
        }
        if self.x_label:
            config["xLabel"] = self.x_label
        if self.y_label:
            config["yLabel"] = self.y_label
        return config


class DensityPlot(Chart):
    chart_type = "density"

    def __init__(self, data=None, x: str = None, y: str = None, **kw):
        self.x = x
        self.y = y
        self.x_label: str | None = kw.pop("x_label", None)
        self.y_label: str | None = kw.pop("y_label", None)
        self.bandwidth: float = kw.pop("bandwidth", 20)
        self.thresholds: int = kw.pop("thresholds", 20)
        self.color_scale: str = kw.pop("color_scale", "sequential")
        self.grid: bool = kw.pop("grid", True)
        self.show_points: bool = kw.pop("show_points", False)
        self.point_radius: float = kw.pop("point_radius", 2)
        self.point_opacity: float = kw.pop("point_opacity", 0.3)
        super().__init__(data=data, **kw)

    def _build_config(self) -> dict:
        config = {
            "x": self.x,
            "y": self.y,
            "bandwidth": self.bandwidth,
            "thresholds": self.thresholds,
            "colorScale": self.color_scale,
            "grid": self.grid,
            "showPoints": self.show_points,
            "pointRadius": self.point_radius,
            "pointOpacity": self.point_opacity,
        }
        if self.x_label:
            config["xLabel"] = self.x_label
        if self.y_label:
            config["yLabel"] = self.y_label
        return config
