"""Pie and donut chart variants."""

from __future__ import annotations

from d3_bridge.core import Chart


class PieChart(Chart):
    chart_type = "pie"

    def __init__(self, data=None, value: str = None, label: str = None, **kw):
        self.value = value
        self.label = label
        self.inner_radius: float = kw.pop("inner_radius", 0)
        self.pad_angle: float = kw.pop("pad_angle", 0.02)
        self.corner_radius: float = kw.pop("corner_radius", 4)
        self.sort: str | None = kw.pop("sort", None)  # "asc", "desc", None
        self.label_type: str = kw.pop("label_type", "percent")  # "percent", "value", "label"
        super().__init__(data=data, **kw)

    def _build_config(self) -> dict:
        return {
            "value": self.value,
            "label": self.label,
            "innerRadius": self.inner_radius,
            "padAngle": self.pad_angle,
            "cornerRadius": self.corner_radius,
            "sort": self.sort,
            "labelType": self.label_type,
        }


class DonutChart(PieChart):
    chart_type = "pie"

    def __init__(self, data=None, value: str = None, label: str = None, **kw):
        kw.setdefault("inner_radius", 0.6)
        super().__init__(data=data, value=value, label=label, **kw)
