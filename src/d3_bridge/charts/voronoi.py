"""Voronoi diagram — spatial partitioning."""

from __future__ import annotations

from d3_bridge.core import Chart


class VoronoiDiagram(Chart):
    chart_type = "voronoi"

    def __init__(self, data=None, x: str = None, y: str = None, **kw):
        self.x = x
        self.y = y
        self.x_label: str | None = kw.pop("x_label", None)
        self.y_label: str | None = kw.pop("y_label", None)
        self.color_by: str | None = kw.pop("color_by", None)
        self.show_points: bool = kw.pop("show_points", True)
        self.show_delaunay: bool = kw.pop("show_delaunay", False)
        self.point_radius: float = kw.pop("point_radius", 4)
        self.stroke_color: str = kw.pop("stroke_color", "#666")
        self.stroke_width: float = kw.pop("stroke_width", 0.5)
        self.cell_opacity: float = kw.pop("cell_opacity", 0.3)
        super().__init__(data=data, **kw)

    def _build_config(self) -> dict:
        config = {
            "x": self.x,
            "y": self.y,
            "showPoints": self.show_points,
            "showDelaunay": self.show_delaunay,
            "pointRadius": self.point_radius,
            "strokeColor": self.stroke_color,
            "strokeWidth": self.stroke_width,
            "cellOpacity": self.cell_opacity,
        }
        if self.color_by:
            config["colorBy"] = self.color_by
        if self.x_label:
            config["xLabel"] = self.x_label
        if self.y_label:
            config["yLabel"] = self.y_label
        return config
