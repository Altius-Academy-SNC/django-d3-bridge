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

import json
from datetime import date, datetime
from decimal import Decimal

from django import template
from django.conf import settings
from django.utils.safestring import mark_safe

register = template.Library()

D3_VERSION = "7"
D3_CDN = f"https://cdn.jsdelivr.net/npm/d3@{D3_VERSION}"
MQTT_CDN = "https://cdn.jsdelivr.net/npm/mqtt@5/dist/mqtt.min.js"


class _BridgeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)


@register.simple_tag
def d3_scripts(cdn=True):
    """Load D3.js and the D3 Bridge runtime. Call once per page, in <head> or before charts.

    Args:
        cdn: If True (default), load D3 from CDN. If False, load from static files.
    """
    use_cdn = cdn
    # Allow settings override
    if hasattr(settings, "D3_BRIDGE"):
        use_cdn = settings.D3_BRIDGE.get("CDN", cdn)

    if use_cdn:
        d3_src = D3_CDN
    else:
        from django.templatetags.static import static
        d3_src = static("d3_bridge/js/d3.v7.min.js")

    from django.templatetags.static import static
    runtime_src = static("d3_bridge/js/d3-bridge.js")

    # Chart modules
    chart_types = [
        "bar", "line", "pie", "scatter", "geo", "network",
        "chord", "hierarchy", "contour", "voronoi",
    ]
    chart_scripts = "\n".join(
        f'<script src="{static(f"d3_bridge/js/charts/{ct}.js")}"></script>'
        for ct in chart_types
    )

    # Poll module (always included — no external dependency)
    poll_src = static("d3_bridge/js/poll.js")
    poll_script = f'<script src="{poll_src}"></script>'

    mqtt_script = ""
    if getattr(settings, "D3_BRIDGE", {}).get("MQTT", False):
        mqtt_src = static("d3_bridge/js/mqtt.js")
        mqtt_script = f"""<script src="{MQTT_CDN}"></script>
<script src="{mqtt_src}"></script>"""

    css_src = static("d3_bridge/css/d3-bridge.css")

    return mark_safe(f"""<link rel="stylesheet" href="{css_src}">
<script src="{d3_src}"></script>
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
    """
    # Apply overrides
    for key, val in kwargs.items():
        if key == "theme":
            chart.theme = val
        elif key == "palette":
            chart.palette = val
        elif key == "height":
            chart.height = int(val)
        elif key == "width":
            chart.width = int(val)
        elif key == "title":
            chart.title = val
        elif key == "animate":
            chart.animate = val

    config = chart.to_config()
    config_json = json.dumps(config, cls=_BridgeEncoder, ensure_ascii=False)

    # Build MQTT script tag if needed
    mqtt_tag = ""
    if chart.live and chart.mqtt_broker:
        mqtt_tag = f"""
<script src="{MQTT_CDN}"></script>"""

    html = f"""<div id="{chart.id}" class="d3b-chart d3b-{chart.chart_type}" data-d3b-type="{chart.chart_type}"></div>{mqtt_tag}
<script>
(function() {{
  var config = {config_json};
  if (typeof D3Bridge !== 'undefined') {{
    D3Bridge.render("{chart.id}", config);
  }} else {{
    document.addEventListener("DOMContentLoaded", function() {{
      D3Bridge.render("{chart.id}", config);
    }});
  }}
}})();
</script>"""

    return mark_safe(html)


@register.simple_tag
def d3_json(chart):
    """Output just the JSON config for a chart (useful for JS-side rendering)."""
    config = chart.to_config()
    return mark_safe(json.dumps(config, cls=_BridgeEncoder, ensure_ascii=False))
