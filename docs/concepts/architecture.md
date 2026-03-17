# Architecture

How django-d3-bridge works under the hood.

## The Pipeline

```
Python (Django view)          Template                  Browser
─────────────────────    ─────────────────────    ─────────────────────
BarChart(data=qs, ...)   {% d3_render chart %}    D3Bridge.render(id, config)
        │                        │                        │
        ▼                        ▼                        ▼
   Chart.to_config()        <div id="d3b-xxx">      Pure D3.js DOM
   → JSON dict              <script>config=...      (SVG, tooltips,
                            D3Bridge.render()        animations)
```

1. **Python**: You create a `Chart` instance. Data is serialized (QuerySet → list of dicts, GeoQuerySet → GeoJSON).
2. **Template tag**: `{% d3_render %}` serializes the config to JSON and outputs a `<div>` + `<script>`.
3. **Browser**: The JS runtime reads the config and calls the appropriate chart renderer, which creates pure D3.js DOM elements.

## No Abstraction at Runtime

The generated JavaScript is **not** a wrapper around D3 — it **is** D3. The runtime is a thin dispatcher:

```javascript
D3Bridge.render("chart-id", config)
  → looks up renderers["bar"]
  → calls the bar renderer with (containerId, config)
  → the renderer creates d3.select(), d3.scaleBand(), d3.axisBottom(), etc.
  → returns { svg, g, xScale, yScale, update, destroy }
```

You can inspect the SVG in DevTools, access the D3 selections via `D3Bridge.getChart()`, or inject custom code via `extra_js()`.

## File Structure

```
d3_bridge/
├── core.py              # Base Chart class
├── charts/              # One Python file per chart type
│   ├── bar.py
│   ├── line.py
│   └── ...
├── data/
│   └── serializers.py   # QuerySet → JSON, GeoQuerySet → GeoJSON
├── themes.py            # Theme and palette definitions
├── views.py             # ChartDataView for polling endpoints
├── templatetags/
│   └── d3_bridge.py     # {% d3_scripts %}, {% d3_render %}, {% d3_json %}
└── static/d3_bridge/
    ├── js/
    │   ├── d3-bridge.js     # Runtime (utilities, render, register)
    │   ├── poll.js          # Polling module
    │   ├── mqtt.js          # MQTT module
    │   └── charts/          # One JS file per chart type
    │       ├── bar.js
    │       ├── line.js
    │       └── ...
    └── css/
        └── d3-bridge.css   # Base styles, tooltips, indicators
```

## Design Decisions

**Why generate D3.js instead of using a higher-level library?**

Libraries like Plotly, Chart.js, or NVD3 are opinionated — they decide what's possible. D3.js decides nothing; it gives you the DOM. django-d3-bridge generates D3.js code directly, so you get the full power of D3 with the convenience of Python configuration.

**Why JSON config instead of Python string templates?**

The config is data, not code. This means:

- It's serializable (cache it, store it, send it over an API)
- The JS runtime can be cached by the browser
- The escape hatch (`extra_js`) is explicit and contained

**Why not a REST API for all data?**

For most charts, inline data in the `<script>` tag is simpler and faster — one HTTP request, no CORS, no auth. The polling API exists for when you need live updates without page reload.
