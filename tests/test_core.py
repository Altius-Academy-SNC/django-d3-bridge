"""Tests for d3_bridge core classes and serialization."""

import json

import pytest

from d3_bridge import (
    BarChart, LineChart, PieChart, ScatterPlot, ForceGraph,
    ChordDiagram, TreeDiagram, Treemap, PackCircle, Sunburst,
    Dendrogram, ContourPlot, DensityPlot, VoronoiDiagram,
)
from d3_bridge.core import Chart
from d3_bridge.themes import THEMES, resolve_theme, register_theme, register_palette


# ── Chart base ──────────────────────────────────────────────

class TestChartBase:
    def test_chart_id_generation(self):
        c = Chart()
        assert c.id.startswith("d3b-")
        assert len(c.id) == 12  # "d3b-" + 8 hex chars

    def test_chart_custom_id(self):
        c = Chart(id="my-chart")
        assert c.id == "my-chart"

    def test_chart_defaults(self):
        c = Chart()
        assert c.height == 400
        assert c.width is None
        assert c.responsive is True
        assert c.theme == "default"
        assert c.animate is True
        assert c.live is False

    def test_to_config_structure(self):
        c = Chart(data=[{"a": 1}], title="Test")
        config = c.to_config()
        assert config["type"] == "base"
        assert config["title"] == "Test"
        assert config["data"] == [{"a": 1}]
        assert "theme" in config
        assert config["theme"]["palette"] is not None

    def test_to_json(self):
        c = Chart(data=[{"x": 1}])
        j = c.to_json()
        parsed = json.loads(j)
        assert parsed["data"] == [{"x": 1}]

    def test_fluent_api(self):
        c = Chart().fields("a", "b").set_theme("dark").set_margin(top=10)
        assert c._fields == ["a", "b"]
        assert c.theme == "dark"
        assert c.margin["top"] == 10

    def test_extra_js_escape_hatch(self):
        c = Chart()
        c.extra_js("console.log('hello');")
        config = c.to_config()
        assert config["extraJs"] == "console.log('hello');"

    def test_mqtt_config(self):
        c = Chart(
            live=True,
            mqtt_broker="ws://localhost:8085/mqtt",
            mqtt_topic="sensors/+/data",
            mqtt_window=50,
        )
        config = c.to_config()
        assert config["live"] is True
        assert config["mqtt"]["broker"] == "ws://localhost:8085/mqtt"
        assert config["mqtt"]["topic"] == "sensors/+/data"
        assert config["mqtt"]["window"] == 50

    def test_poll_config(self):
        c = Chart(
            data=[{"x": 1}],
            poll_url="/api/chart/data/",
            poll_interval=30,
        )
        config = c.to_config()
        assert config["poll"]["url"] == "/api/chart/data/"
        assert config["poll"]["interval"] == 30
        assert config["poll"]["replace"] is True

    def test_poll_append_mode(self):
        c = Chart(
            poll_url="/api/data/",
            poll_interval=10,
            poll_replace=False,
            poll_window=200,
        )
        config = c.to_config()
        assert config["poll"]["replace"] is False
        assert config["poll"]["window"] == 200

    def test_poll_custom_headers(self):
        c = Chart(
            poll_url="/api/data/",
            poll_interval=5,
            poll_headers={"Authorization": "Bearer xxx"},
        )
        config = c.to_config()
        assert config["poll"]["headers"]["Authorization"] == "Bearer xxx"

    def test_no_poll_when_disabled(self):
        c = Chart(data=[{"x": 1}])
        config = c.to_config()
        assert "poll" not in config

    def test_no_poll_when_interval_zero(self):
        c = Chart(poll_url="/api/data/", poll_interval=0)
        config = c.to_config()
        assert "poll" not in config

    def test_repr(self):
        c = Chart(id="test")
        assert "Chart" in repr(c)
        assert "test" in repr(c)


# ── Bar Chart ───────────────────────────────────────────────

class TestBarChart:
    def test_bar_config(self):
        data = [{"name": "A", "val": 10}, {"name": "B", "val": 20}]
        chart = BarChart(data=data, x="name", y="val", sort="desc")
        config = chart.to_config()
        assert config["type"] == "bar"
        assert config["x"] == "name"
        assert config["y"] == "val"
        assert config["sort"] == "desc"
        assert config["orientation"] == "vertical"

    def test_bar_horizontal(self):
        chart = BarChart(orientation="horizontal")
        config = chart.to_config()
        assert config["orientation"] == "horizontal"

    def test_bar_stacked(self):
        chart = BarChart(stacked=True, group_by="region")
        config = chart.to_config()
        assert config["stacked"] is True
        assert config["groupBy"] == "region"

    def test_bar_value_labels(self):
        chart = BarChart(value_labels=True)
        config = chart.to_config()
        assert config["valueLabels"] is True


# ── Line Chart ──────────────────────────────────────────────

class TestLineChart:
    def test_line_config(self):
        chart = LineChart(x="date", y="value", curve="curveNatural")
        config = chart.to_config()
        assert config["type"] == "line"
        assert config["curve"] == "curveNatural"
        assert config["dots"] is True

    def test_area_chart(self):
        from d3_bridge import AreaChart
        chart = AreaChart(x="date", y="value")
        config = chart.to_config()
        assert config["type"] == "area"
        assert config["fill"] is True
        assert config["fillOpacity"] == 0.4

    def test_multi_series(self):
        chart = LineChart(series="category")
        config = chart.to_config()
        assert config["series"] == "category"


# ── Pie Chart ───────────────────────────────────────────────

class TestPieChart:
    def test_pie_config(self):
        data = [{"crop": "Cacao", "amount": 100}, {"crop": "Cafe", "amount": 50}]
        chart = PieChart(data=data, value="amount", label="crop")
        config = chart.to_config()
        assert config["type"] == "pie"
        assert config["value"] == "amount"
        assert config["label"] == "crop"
        assert config["innerRadius"] == 0

    def test_donut(self):
        from d3_bridge import DonutChart
        chart = DonutChart(value="amount", label="crop")
        config = chart.to_config()
        assert config["innerRadius"] == 0.6


# ── Scatter Plot ────────────────────────────────────────────

class TestScatterPlot:
    def test_scatter_config(self):
        chart = ScatterPlot(x="area", y="yield", color_by="region")
        config = chart.to_config()
        assert config["type"] == "scatter"
        assert config["colorBy"] == "region"

    def test_regression(self):
        chart = ScatterPlot(regression="linear")
        config = chart.to_config()
        assert config["regression"] == "linear"


# ── Force Graph ─────────────────────────────────────────────

class TestForceGraph:
    def test_force_config(self):
        nodes = [{"id": "A", "name": "Node A"}, {"id": "B", "name": "Node B"}]
        links = [{"source": "A", "target": "B"}]
        chart = ForceGraph(nodes=nodes, links=links, charge_strength=-300)
        config = chart.to_config()
        assert config["type"] == "force"
        assert config["data"]["nodes"] == nodes
        assert config["data"]["links"] == links
        assert config["chargeStrength"] == -300


# ── Chord Diagram ──────────────────────────────────────────

class TestChordDiagram:
    def test_chord_config(self):
        matrix = [[0, 5, 3], [5, 0, 2], [3, 2, 0]]
        names = ["A", "B", "C"]
        chart = ChordDiagram(matrix=matrix, names=names, pad_angle=0.1)
        config = chart.to_config()
        assert config["type"] == "chord"
        assert config["data"]["matrix"] == matrix
        assert config["data"]["names"] == names
        assert config["padAngle"] == 0.1

    def test_chord_directed(self):
        chart = ChordDiagram(matrix=[[0, 10], [2, 0]], names=["X", "Y"], directed=True)
        config = chart.to_config()
        assert config["directed"] is True


# ── Tree Diagram ───────────────────────────────────────────

class TestTreeDiagram:
    TREE_DATA = {
        "name": "root",
        "children": [
            {"name": "A", "value": 10},
            {"name": "B", "children": [
                {"name": "B1", "value": 5},
                {"name": "B2", "value": 8},
            ]},
        ],
    }

    def test_tree_config(self):
        chart = TreeDiagram(data=self.TREE_DATA, orientation="radial")
        config = chart.to_config()
        assert config["type"] == "tree"
        assert config["orientation"] == "radial"
        assert config["nameField"] == "name"

    def test_tree_link_style(self):
        chart = TreeDiagram(data=self.TREE_DATA, link_style="step")
        config = chart.to_config()
        assert config["linkStyle"] == "step"


# ── Treemap ────────────────────────────────────────────────

class TestTreemap:
    def test_treemap_config(self):
        data = {"name": "root", "children": [{"name": "A", "value": 100}]}
        chart = Treemap(data=data, tile="binary", padding=4)
        config = chart.to_config()
        assert config["type"] == "treemap"
        assert config["tile"] == "binary"
        assert config["padding"] == 4


# ── Pack Circle ────────────────────────────────────────────

class TestPackCircle:
    def test_pack_config(self):
        data = {"name": "root", "children": [{"name": "A", "value": 50}]}
        chart = PackCircle(data=data, padding=5)
        config = chart.to_config()
        assert config["type"] == "pack"
        assert config["padding"] == 5


# ── Sunburst ───────────────────────────────────────────────

class TestSunburst:
    def test_sunburst_config(self):
        data = {"name": "root", "children": [{"name": "A", "value": 30}]}
        chart = Sunburst(data=data, corner_radius=6)
        config = chart.to_config()
        assert config["type"] == "sunburst"
        assert config["cornerRadius"] == 6


# ── Dendrogram ─────────────────────────────────────────────

class TestDendrogram:
    def test_dendrogram_config(self):
        data = {"name": "root", "children": [{"name": "A", "value": 1}]}
        chart = Dendrogram(data=data, orientation="vertical")
        config = chart.to_config()
        assert config["type"] == "dendrogram"
        assert config["orientation"] == "vertical"


# ── Contour Plot ───────────────────────────────────────────

class TestContourPlot:
    def test_contour_config(self):
        chart = ContourPlot(x="lon", y="lat", value="elevation", thresholds=15)
        config = chart.to_config()
        assert config["type"] == "contour"
        assert config["thresholds"] == 15
        assert config["value"] == "elevation"


# ── Density Plot ───────────────────────────────────────────

class TestDensityPlot:
    def test_density_config(self):
        chart = DensityPlot(x="x", y="y", bandwidth=30, show_points=True)
        config = chart.to_config()
        assert config["type"] == "density"
        assert config["bandwidth"] == 30
        assert config["showPoints"] is True


# ── Voronoi Diagram ────────────────────────────────────────

class TestVoronoiDiagram:
    def test_voronoi_config(self):
        chart = VoronoiDiagram(x="lon", y="lat", color_by="region", show_delaunay=True)
        config = chart.to_config()
        assert config["type"] == "voronoi"
        assert config["colorBy"] == "region"
        assert config["showDelaunay"] is True

    def test_voronoi_cell_opacity(self):
        chart = VoronoiDiagram(x="x", y="y", cell_opacity=0.5)
        config = chart.to_config()
        assert config["cellOpacity"] == 0.5


# ── Themes ──────────────────────────────────────────────────

class TestThemes:
    def test_default_theme(self):
        theme = resolve_theme("default")
        assert "palette" in theme
        assert len(theme["palette"]) >= 5

    def test_theme_palette_override_by_name(self):
        theme = resolve_theme("default", palette_override="earth")
        assert theme["palette"][0] == "#2d6a4f"

    def test_theme_palette_override_by_list(self):
        custom = ["#ff0000", "#00ff00"]
        theme = resolve_theme("default", palette_override=custom)
        assert theme["palette"] == custom

    def test_register_custom_theme(self):
        register_theme("custom", {"palette": ["#111"], "background": "#000"})
        assert "custom" in THEMES
        theme = resolve_theme("custom")
        assert theme["background"] == "#000"

    def test_register_custom_palette(self):
        register_palette("test_pal", ["#aaa", "#bbb"])
        theme = resolve_theme("default", palette_override="test_pal")
        assert theme["palette"] == ["#aaa", "#bbb"]

    def test_unknown_theme_falls_back(self):
        theme = resolve_theme("nonexistent")
        assert theme == resolve_theme("default")


# ── Serializers ─────────────────────────────────────────────

class TestSerializers:
    def test_list_passthrough(self):
        from d3_bridge.data.serializers import serialize_data
        data = [{"a": 1}, {"a": 2}]
        assert serialize_data(data) == data

    def test_dict_passthrough(self):
        from d3_bridge.data.serializers import serialize_data
        data = {"a": 1}
        assert serialize_data(data) == {"a": 1}

    def test_none_returns_empty(self):
        from d3_bridge.data.serializers import serialize_data
        assert serialize_data(None) == []

    def test_unsupported_type_raises(self):
        from d3_bridge.data.serializers import serialize_data
        with pytest.raises(ValueError, match="Unsupported"):
            serialize_data(42)
