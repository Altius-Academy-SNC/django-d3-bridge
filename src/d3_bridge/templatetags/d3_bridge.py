"""Template tags for django-d3-bridge.

Usage::

    {% load d3_bridge %}

    {# Load D3.js + runtime (once per page) #}
    {% d3_scripts %}

    {# Render a chart #}
    {% d3_render my_chart %}
    {% d3_render my_chart theme="dark" height=500 %}
"""

from __future__ import annotations

from django import template
from django.conf import settings
from django.utils.html import escape
from django.utils.safestring import mark_safe

from d3_bridge.encoders import dumps_script_safe
from d3_bridge.themes import resolve_theme_pair

register = template.Library()

D3_VERSION = "7"
D3_CDN = f"https://cdn.jsdelivr.net/npm/d3@{D3_VERSION}"
MQTT_CDN = "https://cdn.jsdelivr.net/npm/mqtt@5/dist/mqtt.min.js"
SANKEY_CDN = "https://cdn.jsdelivr.net/npm/d3-sankey@0.12.3/dist/d3-sankey.min.js"
SANKEY_INTEGRITY = "sha384-SM54CE5h+qdDI046d2Y5ym7wq1kq4uxcQ1cqGq5/+5jrE5tPLeDJSq711Q8sIska"

# JS chart modules, in load order
CHART_MODULES = [
    "bar", "line", "pie", "scatter", "geo", "network",
    "chord", "hierarchy", "contour", "voronoi",
]

# chart type (as users know them) → JS module that renders it
CHART_TYPE_TO_MODULE = {
    "bar": "bar",
    "line": "line",
    "area": "line",
    "pie": "pie",
    "donut": "pie",
    "scatter": "scatter",
    "density": "contour",
    "contour": "contour",
    "choropleth": "geo",
    "bubblemap": "geo",
    "force": "network",
    "sankey": "network",
    "chord": "chord",
    "tree": "hierarchy",
    "treemap": "hierarchy",
    "pack": "hierarchy",
    "sunburst": "hierarchy",
    "dendrogram": "hierarchy",
    "voronoi": "voronoi",
}


def _resolve_chart_modules(charts):
    """Resolve a charts selection (str or list of chart types / module names)
    to the JS modules to load, preserving CHART_MODULES order."""
    if isinstance(charts, str):
        names = [n.strip() for n in charts.split(",") if n.strip()]
    else:
        names = [str(n).strip() for n in charts]

    modules = set()
    for name in names:
        key = name.lower()
        if key in CHART_MODULES:
            modules.add(key)
        elif key in CHART_TYPE_TO_MODULE:
            modules.add(CHART_TYPE_TO_MODULE[key])
        else:
            valid = sorted(set(CHART_TYPE_TO_MODULE) | set(CHART_MODULES))
            raise ValueError(
                f"{{% d3_scripts %}}: unknown chart type {name!r}. "
                f"Valid names: {', '.join(valid)}"
            )
    return [m for m in CHART_MODULES if m in modules], names


@register.simple_tag
def d3_scripts(cdn=True, sankey=False, charts=None):
    """Load D3.js and the D3 Bridge runtime. Call once per page, in <head> or before charts.

    Args:
        cdn: If True (default), load D3 (and d3-sankey/mqtt.js when enabled)
            from CDN. If False, load the vendored copies from static files —
            fully offline, no external requests.
        sankey: If True, also load the d3-sankey plugin (required by the
            Sankey chart type, which is not part of core D3). Can also be enabled
            globally via ``D3_BRIDGE = {"SANKEY": True}`` in settings.
        charts: Restrict which chart modules are loaded. Comma-separated string
            (or list) of chart types, e.g. ``charts="bar,area"``. Default: all
            modules. Requesting ``sankey`` automatically loads the d3-sankey
            plugin. Can also be set globally via ``D3_BRIDGE = {"CHARTS": [...]}``.
    """
    use_cdn = cdn
    use_sankey = sankey
    use_charts = charts
    # Allow settings override
    if hasattr(settings, "D3_BRIDGE"):
        use_cdn = settings.D3_BRIDGE.get("CDN", cdn)
        use_sankey = settings.D3_BRIDGE.get("SANKEY", sankey)
        use_charts = settings.D3_BRIDGE.get("CHARTS", charts)

    if use_charts:
        chart_modules, requested = _resolve_chart_modules(use_charts)
        # The sankey chart type needs the d3-sankey plugin — load it implicitly
        if "sankey" in (n.lower() for n in requested):
            use_sankey = True
    else:
        chart_modules = CHART_MODULES

    from django.templatetags.static import static

    if use_cdn:
        d3_src = D3_CDN
    else:
        d3_src = static("d3_bridge/js/d3.v7.min.js")

    runtime_src = static("d3_bridge/js/d3-bridge.js")

    if use_sankey:
        if use_cdn:
            sankey_script = (
                f'<script src="{SANKEY_CDN}" integrity="{SANKEY_INTEGRITY}"'
                ' crossorigin="anonymous"></script>'
            )
        else:
            sankey_script = f'<script src="{static("d3_bridge/js/d3-sankey.min.js")}"></script>'
    else:
        sankey_script = ""

    chart_scripts = "\n".join(
        f'<script src="{static(f"d3_bridge/js/charts/{ct}.js")}"></script>'
        for ct in chart_modules
    )

    # Poll module (always included — no external dependency)
    poll_src = static("d3_bridge/js/poll.js")
    poll_script = f'<script src="{poll_src}"></script>'

    mqtt_script = ""
    if getattr(settings, "D3_BRIDGE", {}).get("MQTT", False):
        mqtt_lib_src = MQTT_CDN if use_cdn else static("d3_bridge/js/mqtt.min.js")
        mqtt_src = static("d3_bridge/js/mqtt.js")
        mqtt_script = f"""<script src="{mqtt_lib_src}"></script>
<script src="{mqtt_src}"></script>"""

    css_src = static("d3_bridge/css/d3-bridge.css")

    return mark_safe(f"""<link rel="stylesheet" href="{css_src}">
<script src="{d3_src}"></script>
{sankey_script}
<script src="{runtime_src}"></script>
{chart_scripts}
{poll_script}
{mqtt_script}""")


@register.simple_tag
def d3_render(chart, **kwargs):
    """Render a chart instance into a container div + initialization script.

    Args:
        chart: A d3_bridge.Chart instance.
        **kwargs: Override chart options (theme, height, width, palette, etc.).
            Overrides apply to this rendering only — the chart instance is
            never mutated, so the same chart can be rendered several times
            with different options.
    """
    config = chart.to_config()

    # Apply per-render overrides on the config copy, not on the instance
    if "theme" in kwargs or "palette" in kwargs:
        theme_resolved, theme_dark = resolve_theme_pair(
            kwargs.get("theme", chart.theme),
            palette_override=kwargs.get("palette", chart.palette),
        )
        config["theme"] = theme_resolved
        if theme_dark is not None:
            config["themeDark"] = theme_dark
        else:
            config.pop("themeDark", None)
    if "height" in kwargs:
        config["height"] = int(kwargs["height"])
    if "width" in kwargs:
        config["width"] = int(kwargs["width"])
    if "title" in kwargs:
        config["title"] = kwargs["title"]
    if "animate" in kwargs:
        config["animate"] = kwargs["animate"]

    config_json = dumps_script_safe(config)
    # chart.id may be user-supplied: escape for the HTML attribute, JSON-encode
    # for the JS string literal.
    id_attr = escape(chart.id)
    type_attr = escape(chart.chart_type)
    id_js = dumps_script_safe(chart.id)

    # Build MQTT script tag if needed
    mqtt_tag = ""
    if chart.live and chart.mqtt_broker:
        mqtt_tag = f"""
<script src="{MQTT_CDN}"></script>"""

    html = f"""<div id="{id_attr}" class="d3b-chart d3b-{type_attr}" data-d3b-type="{type_attr}"></div>{mqtt_tag}
<script>
(function() {{
  var config = {config_json};
  if (typeof D3Bridge !== 'undefined') {{
    D3Bridge.render({id_js}, config);
  }} else {{
    document.addEventListener("DOMContentLoaded", function() {{
      D3Bridge.render({id_js}, config);
    }});
  }}
}})();
</script>"""

    return mark_safe(html)


@register.simple_tag
def d3_json(chart):
    """Output the JSON config for a chart, escaped for safe inlining in <script>."""
    return mark_safe(dumps_script_safe(chart.to_config()))
