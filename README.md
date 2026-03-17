# django-d3-bridge

[![PyPI](https://img.shields.io/pypi/v/django-d3-bridge)](https://pypi.org/project/django-d3-bridge/)
[![Tests](https://github.com/Altius-Academy-SNC/django-d3-bridge/actions/workflows/tests.yml/badge.svg)](https://github.com/Altius-Academy-SNC/django-d3-bridge/actions/workflows/tests.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.10+](https://img.shields.io/badge/python-3.10%2B-blue)](https://www.python.org/)
[![Django 4.2+](https://img.shields.io/badge/django-4.2%2B-green)](https://www.djangoproject.com/)

Declarative D3.js visualizations for Django — charts, maps, networks, with MQTT live updates.

Write Python, render D3.js. No JavaScript required.

**[Documentation](https://altius-academy-snc.github.io/django-d3-bridge)** | **[GitHub](https://github.com/Altius-Academy-SNC/django-d3-bridge)** | **[PyPI](https://pypi.org/project/django-d3-bridge/)**

## Install

```bash
pip install django-d3-bridge
```

## Quick Start

```python
# settings.py
INSTALLED_APPS = [
    ...
    "d3_bridge",
]

# views.py
from d3_bridge import BarChart

def dashboard(request):
    chart = BarChart(
        data=Product.objects.values("name", "sales"),
        x="name", y="sales",
        title="Sales by Product",
    )
    return render(request, "dashboard.html", {"chart": chart})
```

```html
{% load d3_bridge %}
{% d3_scripts %}

<div class="col-md-6">
    {% d3_render chart %}
</div>
```

## 19 Chart Types

| Category | Charts |
|----------|--------|
| **Basic** | Bar, Line, Area, Pie, Donut, Scatter |
| **Geographic** | Choropleth Map, Bubble Map |
| **Network** | Force Graph, Sankey, Chord Diagram |
| **Hierarchy** | Tree, Treemap, Circle Packing, Sunburst, Dendrogram |
| **Statistical** | Contour Plot, Density Plot, Voronoi Diagram |

## 3 Data Modes

- **Static** — QuerySet evaluated at each page load
- **Polling** — auto-refresh via HTTP fetch every N seconds
- **MQTT** — real-time push via WebSocket

```python
# Polling example — no WebSocket, no infrastructure
chart = LineChart(
    data=initial_data,
    x="timestamp", y="value",
    poll_url="/api/chart/data/",
    poll_interval=30,
)
```

## Features

- Pure D3.js v7 output — inspectable, no abstraction layer
- Django QuerySet + GeoQuerySet + DataFrame serialization
- 4 themes (default, dark, bootstrap, terraf) + 7 color palettes
- Responsive, animated, with tooltips
- Bootstrap grid compatible
- Escape hatch for custom D3.js code

## Documentation

Full documentation with examples for every chart type:

**https://altius-academy-snc.github.io/django-d3-bridge**

## License

MIT — [Paul Guindo](https://github.com/Altius-Academy-SNC) / Altius Academy SNC
