# django-d3-bridge

**Declarative D3.js visualizations for Django.**

Write Python, render D3.js — no JavaScript required.

---

## What is django-d3-bridge?

django-d3-bridge is a Python package that lets you create D3.js visualizations entirely from Python.
You declare your chart in a Django view, pass it to the template, and the package generates
pure D3.js code — fully interactive, animated, and responsive.

```python
from d3_bridge import BarChart

chart = BarChart(
    data=Product.objects.values("name", "sales"),
    x="name", y="sales",
    title="Sales by Product",
    theme="bootstrap",
)
```

```html
{% load d3_bridge %}
{% d3_scripts %}
{% d3_render chart %}
```

That's it. No JavaScript to write.

---

## 19 Chart Types

| Category | Charts |
|----------|--------|
| **Basic** | Bar, Line, Area, Pie, Donut, Scatter |
| **Geographic** | Choropleth Map, Bubble Map |
| **Network** | Force Graph, Sankey, Chord Diagram |
| **Hierarchy** | Tree, Treemap, Circle Packing, Sunburst, Dendrogram |
| **Statistical** | Contour Plot, Density Plot, Voronoi Diagram |

All 19 types share the same API pattern: declare in Python, render in template.

---

## 3 Data Modes

=== "Static"

    Data comes from a Django QuerySet, evaluated at each page load.

    ```python
    chart = BarChart(
        data=Product.objects.values("name", "price"),
        x="name", y="price",
    )
    ```

=== "Polling"

    Chart auto-refreshes via HTTP fetch at a configurable interval. No WebSocket needed.

    ```python
    chart = LineChart(
        data=initial_data,
        x="timestamp", y="value",
        poll_url="/api/chart/data/",
        poll_interval=30,  # seconds
    )
    ```

=== "MQTT"

    Real-time push via WebSocket. For IoT sensors, live monitoring.

    ```python
    chart = LineChart(
        data=initial_data,
        x="timestamp", y="temperature",
        live=True,
        mqtt_broker="ws://broker:8083/mqtt",
        mqtt_topic="sensors/+/data",
    )
    ```

---

## Key Features

- **Pure D3.js output** — no abstraction layer at runtime, inspectable in DevTools
- **Django-native** — works with QuerySets, GeoQuerySets, template tags
- **Zero JS dependencies** beyond D3.js v7
- **Bootstrap-aware** — charts adapt to `col-*` grid, inherit fonts
- **4 built-in themes** — default, dark, bootstrap, terraf
- **7 color palettes** — tableau10, warm, cool, earth, sahel, ocean, categorical8
- **Responsive** — auto-resize on container change
- **Animated** — smooth D3 transitions on load
- **Tooltips** — interactive tooltips on all chart types
- **Escape hatch** — inject custom D3.js when you need full control

---

## Quick Install

```bash
pip install django-d3-bridge
```

```python
# settings.py
INSTALLED_APPS = [
    ...
    "d3_bridge",
]
```

[Get started →](getting-started/install.md){ .md-button .md-button--primary }
[Browse charts →](charts/index.md){ .md-button }
