"""Network visualization — force-directed graph, sankey diagram."""

from __future__ import annotations

from d3_bridge.core import Chart


class ForceGraph(Chart):
    chart_type = "force"

    def __init__(self, nodes=None, links=None, **kw):
        self._nodes = nodes
        self._links = links
        self.node_id: str = kw.pop("node_id", "id")
        self.node_label: str = kw.pop("node_label", "name")
        self.node_group: str | None = kw.pop("node_group", None)
        self.node_size: str | float = kw.pop("node_size", 8)
        self.link_source: str = kw.pop("link_source", "source")
        self.link_target: str = kw.pop("link_target", "target")
        self.link_value: str | None = kw.pop("link_value", None)
        self.link_distance: float = kw.pop("link_distance", 80)
        self.charge_strength: float = kw.pop("charge_strength", -200)
        self.draggable: bool = kw.pop("draggable", True)
        self.zoom: bool = kw.pop("zoom", True)
        super().__init__(data=None, **kw)

    def _serialize_data(self):
        from d3_bridge.data.serializers import serialize_data

        nodes = serialize_data(self._nodes) if self._nodes else []
        links = serialize_data(self._links) if self._links else []
        return {"nodes": nodes, "links": links}

    def _build_config(self) -> dict:
        return {
            "nodeId": self.node_id,
            "nodeLabel": self.node_label,
            "nodeGroup": self.node_group,
            "nodeSize": self.node_size,
            "linkSource": self.link_source,
            "linkTarget": self.link_target,
            "linkValue": self.link_value,
            "linkDistance": self.link_distance,
            "chargeStrength": self.charge_strength,
            "draggable": self.draggable,
            "zoom": self.zoom,
        }


class Sankey(Chart):
    chart_type = "sankey"

    def __init__(self, nodes=None, links=None, **kw):
        self._nodes = nodes
        self._links = links
        self.node_id: str = kw.pop("node_id", "id")
        self.node_label: str = kw.pop("node_label", "name")
        self.link_source: str = kw.pop("link_source", "source")
        self.link_target: str = kw.pop("link_target", "target")
        self.link_value: str = kw.pop("link_value", "value")
        self.node_padding: int = kw.pop("node_padding", 10)
        self.node_width: int = kw.pop("node_width", 20)
        self.align: str = kw.pop("align", "justify")  # "left", "right", "center", "justify"
        super().__init__(data=None, **kw)

    def _serialize_data(self):
        from d3_bridge.data.serializers import serialize_data

        nodes = serialize_data(self._nodes) if self._nodes else []
        links = serialize_data(self._links) if self._links else []
        return {"nodes": nodes, "links": links}

    def _build_config(self) -> dict:
        return {
            "nodeId": self.node_id,
            "nodeLabel": self.node_label,
            "linkSource": self.link_source,
            "linkTarget": self.link_target,
            "linkValue": self.link_value,
            "nodePadding": self.node_padding,
            "nodeWidth": self.node_width,
            "align": self.align,
        }
