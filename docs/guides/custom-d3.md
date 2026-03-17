# Custom D3.js (Escape Hatch)

When you need to go beyond the built-in chart types, django-d3-bridge provides two escape hatches.

## 1. `extra_js()` — Inject Custom Code

Add custom D3.js code that runs after the chart renders:

```python
chart = BarChart(
    data=data, x="name", y="value",
)
chart.extra_js("""
    // 'chart' is the chart instance, 'd3' is D3.js, 'config' is the full config
    chart.g.append("line")
        .attr("x1", 0)
        .attr("x2", config.margin.left + 500)
        .attr("y1", chart.yScale(50))
        .attr("y2", chart.yScale(50))
        .attr("stroke", "red")
        .attr("stroke-dasharray", "5,5")
        .attr("stroke-width", 2);

    chart.g.append("text")
        .attr("x", 5)
        .attr("y", chart.yScale(50) - 5)
        .attr("fill", "red")
        .attr("font-size", 11)
        .text("Target: 50");
""")
```

The function receives three arguments:

| Argument | Description |
|----------|-------------|
| `chart` | The chart instance (`{ svg, g, xScale, yScale, update, destroy }`) |
| `d3` | The D3.js library |
| `config` | The full JSON config |

## 2. `{% d3_json %}` — Full Client-Side Control

For complete control, use `{% d3_json %}` and render manually:

```html
{% load d3_bridge %}
{% d3_scripts %}

<div id="custom-chart"></div>

<script>
    var config = {% d3_json chart %};

    // Modify config before rendering
    config.margin.left = 100;

    var instance = D3Bridge.render("custom-chart", config);

    // Access D3 selections directly
    instance.g.selectAll(".d3b-bar")
        .on("click", function(event, d) {
            alert("Clicked: " + d.name);
        });
</script>
```

## 3. Access Chart Instances from JS

Any rendered chart is accessible via `D3Bridge.getChart(id)`:

```html
{% d3_render my_chart %}

<script>
    // After render
    var chart = D3Bridge.getChart("{{ my_chart.id }}");
    chart.svg;          // the SVG element
    chart.g;            // the main group
    chart.xScale;       // the x scale
    chart.yScale;       // the y scale
    chart.update(data); // update with new data
    chart.destroy();    // clean up
</script>
```

## 4. Register Custom Chart Types

Create entirely new chart types in JavaScript:

```javascript
D3Bridge.register("waterfall", function(containerId, config) {
    var u = D3Bridge._;
    var ctx = u.createSvg(containerId, config);

    // Your D3 code here...

    return {
        svg: ctx.svg,
        g: ctx.g,
        update: function(newData) { /* ... */ },
        destroy: function() { /* ... */ },
    };
});
```

Then use it from Python:

```python
from d3_bridge.core import Chart

class WaterfallChart(Chart):
    chart_type = "waterfall"

    def __init__(self, data=None, **kw):
        # your custom parameters
        super().__init__(data=data, **kw)
```
