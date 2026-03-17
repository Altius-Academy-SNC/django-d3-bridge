"""Chord diagram — flows between entities."""

from __future__ import annotations

from d3_bridge.core import Chart


class ChordDiagram(Chart):
    chart_type = "chord"

    def __init__(self, matrix=None, names=None, **kw):
        self._matrix = matrix
        self._names = names
        self.pad_angle: float = kw.pop("pad_angle", 0.05)
        self.inner_radius_ratio: float = kw.pop("inner_radius_ratio", 0.9)
        self.label_offset: int = kw.pop("label_offset", 10)
        self.directed: bool = kw.pop("directed", False)
        super().__init__(data=None, **kw)

    def _serialize_data(self):
        return {
            "matrix": self._matrix or [],
            "names": self._names or [],
        }

    def _build_config(self) -> dict:
        return {
            "padAngle": self.pad_angle,
            "innerRadiusRatio": self.inner_radius_ratio,
            "labelOffset": self.label_offset,
            "directed": self.directed,
        }
