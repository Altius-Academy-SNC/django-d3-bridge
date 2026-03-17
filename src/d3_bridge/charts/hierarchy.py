"""Hierarchy-based charts — Tree, Treemap, PackCircle, Sunburst, Dendrogram."""

from __future__ import annotations

from d3_bridge.core import Chart


class _HierarchyBase(Chart):
    """Base for all hierarchy charts.

    Data should be a nested dict::

        {
            "name": "root",
            "children": [
                {"name": "A", "value": 10},
                {"name": "B", "children": [...]},
            ]
        }

    Or a flat list with id/parent fields (stratify mode)::

        [
            {"id": "root", "parent": None},
            {"id": "A", "parent": "root", "value": 10},
        ]
    """

    def __init__(self, data=None, **kw):
        self.value_field: str = kw.pop("value_field", "value")
        self.name_field: str = kw.pop("name_field", "name")
        self.id_field: str | None = kw.pop("id_field", None)
        self.parent_field: str | None = kw.pop("parent_field", None)
        self.color_by: str | None = kw.pop("color_by", None)  # "depth", field name, None
        self.labels: bool = kw.pop("labels", True)
        super().__init__(data=data, **kw)

    def _build_config(self) -> dict:
        return {
            "valueField": self.value_field,
            "nameField": self.name_field,
            "idField": self.id_field,
            "parentField": self.parent_field,
            "colorBy": self.color_by,
            "labels": self.labels,
        }


class TreeDiagram(_HierarchyBase):
    chart_type = "tree"

    def __init__(self, data=None, **kw):
        self.orientation: str = kw.pop("orientation", "horizontal")  # "horizontal", "vertical", "radial"
        self.node_radius: float = kw.pop("node_radius", 5)
        self.link_style: str = kw.pop("link_style", "curve")  # "curve", "step", "straight"
        super().__init__(data=data, **kw)

    def _build_config(self) -> dict:
        config = super()._build_config()
        config.update({
            "orientation": self.orientation,
            "nodeRadius": self.node_radius,
            "linkStyle": self.link_style,
        })
        return config


class Treemap(_HierarchyBase):
    chart_type = "treemap"

    def __init__(self, data=None, **kw):
        self.tile: str = kw.pop("tile", "squarify")  # "squarify", "binary", "dice", "slice", "sliceDice"
        self.padding: int = kw.pop("padding", 2)
        self.inner_padding: int = kw.pop("inner_padding", 1)
        self.round: bool = kw.pop("round", True)
        super().__init__(data=data, **kw)

    def _build_config(self) -> dict:
        config = super()._build_config()
        config.update({
            "tile": self.tile,
            "padding": self.padding,
            "innerPadding": self.inner_padding,
            "round": self.round,
        })
        return config


class PackCircle(_HierarchyBase):
    chart_type = "pack"

    def __init__(self, data=None, **kw):
        self.padding: int = kw.pop("padding", 3)
        super().__init__(data=data, **kw)

    def _build_config(self) -> dict:
        config = super()._build_config()
        config["padding"] = self.padding
        return config


class Sunburst(_HierarchyBase):
    chart_type = "sunburst"

    def __init__(self, data=None, **kw):
        self.inner_radius: float = kw.pop("inner_radius", 0)
        self.pad_angle: float = kw.pop("pad_angle", 0.01)
        self.corner_radius: float = kw.pop("corner_radius", 4)
        super().__init__(data=data, **kw)

    def _build_config(self) -> dict:
        config = super()._build_config()
        config.update({
            "innerRadius": self.inner_radius,
            "padAngle": self.pad_angle,
            "cornerRadius": self.corner_radius,
        })
        return config


class Dendrogram(_HierarchyBase):
    chart_type = "dendrogram"

    def __init__(self, data=None, **kw):
        self.orientation: str = kw.pop("orientation", "horizontal")  # "horizontal", "vertical", "radial"
        self.node_radius: float = kw.pop("node_radius", 4)
        self.link_style: str = kw.pop("link_style", "curve")
        super().__init__(data=data, **kw)

    def _build_config(self) -> dict:
        config = super()._build_config()
        config.update({
            "orientation": self.orientation,
            "nodeRadius": self.node_radius,
            "linkStyle": self.link_style,
        })
        return config
