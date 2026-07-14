"""Tests for the d3_bridge template tags — XSS hardening, immutability, cdn=False."""

import json

import pytest
from django.contrib.staticfiles import finders

from d3_bridge import BarChart
from d3_bridge.templatetags.d3_bridge import d3_json, d3_render, d3_scripts


# ── XSS hardening ───────────────────────────────────────────

class TestScriptEscaping:
    def test_render_escapes_script_breakout(self):
        chart = BarChart(
            data=[{"name": "</script><script>alert(1)</script>", "value": 1}],
            x="name", y="value",
        )
        html = str(d3_render(chart))
        # The injected payload must not survive as live HTML
        assert "</script><script>alert(1)" not in html
        assert "\\u003C/script" in html

    def test_render_config_still_valid_json(self):
        payload = '</script><script>alert(1)</script>'
        chart = BarChart(data=[{"name": payload, "value": 1}], x="name", y="value")
        html = str(d3_render(chart))
        start = html.index("var config = ") + len("var config = ")
        end = html.index(";\n", start)
        config = json.loads(html[start:end])
        # Escaping must be transparent after JSON parsing
        assert config["data"][0]["name"] == payload

    def test_render_escapes_title_and_ampersand(self):
        chart = BarChart(
            data=[{"x": "a", "y": 1}], x="x", y="y",
            title="<img src=x onerror=alert(1)> & fin",
        )
        html = str(d3_render(chart))
        assert "<img" not in html
        assert "\\u0026" in html

    def test_render_escapes_chart_id(self):
        chart = BarChart(
            data=[{"x": "a", "y": 1}], x="x", y="y",
            id='"><script>alert(1)</script>',
        )
        html = str(d3_render(chart))
        assert "<script>alert(1)" not in html

    def test_d3_json_escaped(self):
        chart = BarChart(data=[{"x": "</script>", "y": 1}], x="x", y="y")
        out = str(d3_json(chart))
        assert "</script" not in out
        assert json.loads(out)["data"][0]["x"] == "</script>"


# ── d3_render must not mutate the chart instance ────────────

class TestRenderImmutability:
    def test_overrides_do_not_mutate_instance(self):
        chart = BarChart(data=[{"x": "a", "y": 1}], x="x", y="y", height=400)
        d3_render(chart, theme="dark", height=500, width=800, title="Override")
        assert chart.theme == "default"
        assert chart.height == 400
        assert chart.width is None
        assert chart.title is None

    def test_same_chart_renders_differently_twice(self):
        chart = BarChart(data=[{"x": "a", "y": 1}], x="x", y="y")
        html_dark = str(d3_render(chart, height=500))
        html_default = str(d3_render(chart))
        assert '"height": 500' in html_dark
        assert '"height": 400' in html_default

    def test_overrides_applied_to_output(self):
        chart = BarChart(data=[{"x": "a", "y": 1}], x="x", y="y")
        html = str(d3_render(chart, theme="dark", title="My Title"))
        config = json.loads(
            html[html.index("var config = ") + len("var config = "):html.index(";\n")]
        )
        assert config["title"] == "My Title"
        assert config["theme"] != BarChart(data=[], x="x", y="y").to_config()["theme"]


# ── d3_scripts ──────────────────────────────────────────────

class TestD3Scripts:
    def test_cdn_default(self):
        html = str(d3_scripts())
        assert "cdn.jsdelivr.net/npm/d3@7" in html

    def test_cdn_false_uses_vendored_files(self):
        html = str(d3_scripts(cdn=False))
        assert "cdn.jsdelivr.net" not in html
        assert "d3_bridge/js/d3.v7.min.js" in html

    @pytest.mark.parametrize("path", [
        "d3_bridge/js/d3.v7.min.js",
        "d3_bridge/js/d3-sankey.min.js",
        "d3_bridge/js/mqtt.min.js",
        "d3_bridge/js/d3-bridge.js",
        "d3_bridge/js/poll.js",
    ])
    def test_vendored_static_files_exist(self, path):
        assert finders.find(path), f"missing static file: {path}"

    def test_cdn_false_sankey_local(self):
        html = str(d3_scripts(cdn=False, sankey=True))
        assert "cdn.jsdelivr.net" not in html
        assert "d3_bridge/js/d3-sankey.min.js" in html

    def test_cdn_true_sankey_has_integrity(self):
        html = str(d3_scripts(sankey=True))
        assert "d3-sankey" in html
        assert "integrity=" in html


# ── charts= selective module loading ────────────────────────

class TestChartsSelection:
    def test_default_loads_all_modules(self):
        html = str(d3_scripts())
        for module in ["bar", "line", "pie", "scatter", "geo", "network",
                       "chord", "hierarchy", "contour", "voronoi"]:
            assert f"charts/{module}.js" in html

    def test_charts_param_limits_modules(self):
        html = str(d3_scripts(charts="bar,line"))
        assert "charts/bar.js" in html
        assert "charts/line.js" in html
        assert "charts/pie.js" not in html
        assert "charts/hierarchy.js" not in html

    def test_chart_type_resolves_to_module(self):
        # area is rendered by line.js, sunburst by hierarchy.js
        html = str(d3_scripts(charts="area,sunburst"))
        assert "charts/line.js" in html
        assert "charts/hierarchy.js" in html
        assert "charts/bar.js" not in html

    def test_donut_resolves_to_pie(self):
        html = str(d3_scripts(charts="donut"))
        assert "charts/pie.js" in html

    def test_sankey_autoloads_plugin(self):
        html = str(d3_scripts(charts="sankey"))
        assert "charts/network.js" in html
        assert "d3-sankey" in html

    def test_charts_accepts_list(self):
        html = str(d3_scripts(charts=["bar", "pie"]))
        assert "charts/bar.js" in html
        assert "charts/pie.js" in html
        assert "charts/geo.js" not in html

    def test_unknown_chart_raises(self):
        with pytest.raises(ValueError, match="unknown chart type"):
            d3_scripts(charts="bar,nonexistent")

    def test_charts_settings_override(self, settings):
        settings.D3_BRIDGE = {"CHARTS": ["bar"]}
        html = str(d3_scripts())
        assert "charts/bar.js" in html
        assert "charts/line.js" not in html

    def test_runtime_always_loaded(self):
        html = str(d3_scripts(charts="bar"))
        assert "d3-bridge.js" in html
        assert "poll.js" in html


# ── theme="auto" via d3_render ──────────────────────────────

class TestAutoThemeRender:
    def _config(self, html):
        return json.loads(
            html[html.index("var config = ") + len("var config = "):html.index(";\n")]
        )

    def test_render_override_theme_auto(self):
        chart = BarChart(data=[{"x": "a", "y": 1}], x="x", y="y")
        config = self._config(str(d3_render(chart, theme="auto")))
        assert "themeDark" in config
        assert config["themeDark"]["background"] != config["theme"]["background"]

    def test_render_override_back_to_fixed_theme(self):
        chart = BarChart(data=[{"x": "a", "y": 1}], x="x", y="y", theme="auto")
        config = self._config(str(d3_render(chart, theme="dark")))
        assert "themeDark" not in config

    def test_auto_chart_renders_theme_dark(self):
        chart = BarChart(data=[{"x": "a", "y": 1}], x="x", y="y", theme="auto")
        config = self._config(str(d3_render(chart)))
        assert "themeDark" in config
