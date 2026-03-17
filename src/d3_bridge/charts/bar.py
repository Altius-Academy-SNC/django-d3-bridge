"""Bar chart variants — vertical, horizontal, stacked, grouped."""

from __future__ import annotations

from d3_bridge.core import Chart


class BarChart(Chart):
    chart_type = "bar"

    def __init__(self, data=None, x: str = None, y: str = None, **kw):
        self.x = x
        self.y = y
        self.orientation: str = kw.pop("orientation", "vertical")
        self.stacked: bool = kw.pop("stacked", False)
        self.grouped: bool = kw.pop("grouped", False)
        self.group_by: str | None = kw.pop("group_by", None)
        self.x_label: str | None = kw.pop("x_label", None)
        self.y_label: str | None = kw.pop("y_label", None)
        self.sort: str | None = kw.pop("sort", None)  # "asc", "desc", None
        self.bar_padding: float = kw.pop("bar_padding", 0.2)
        self.bar_radius: int = kw.pop("bar_radius", 2)
        self.color: str | None = kw.pop("color", None)
        self.value_labels: bool = kw.pop("value_labels", False)
        super().__init__(data=data, **kw)

    def _build_config(self) -> dict:
        config = {
            "x": self.x,
            "y": self.y,
            "orientation": self.orientation,
            "stacked": self.stacked,
            "grouped": self.grouped,
            "barPadding": self.bar_padding,
            "barRadius": self.bar_radius,
            "valueLabels": self.value_labels,
        }
        if self.group_by:
            config["groupBy"] = self.group_by
        if self.x_label:
            config["xLabel"] = self.x_label
        if self.y_label:
            config["yLabel"] = self.y_label
        if self.sort:
            config["sort"] = self.sort
        if self.color:
            config["color"] = self.color
        return config
