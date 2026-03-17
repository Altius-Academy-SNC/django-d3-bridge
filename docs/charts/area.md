# Area Chart

A line chart with the area below filled. Good for emphasizing volume.

## When to Use

- Showing magnitude over time (revenue, traffic, inventory)
- Stacked composition over time
- When the "filled" visual gives a stronger sense of quantity than a line

## Basic Example

```python
from d3_bridge import AreaChart

chart = AreaChart(
    data=MonthlySales.objects.values("month", "total"),
    x="month",
    y="total",
    title="Monthly Revenue",
)
```

## Customizing Fill

```python
chart = AreaChart(
    data=data, x="date", y="value",
    fill_opacity=0.6,   # default is 0.4
    stroke_width=1.5,
)
```

## Parameters

`AreaChart` inherits all parameters from [LineChart](line.md) with these defaults changed:

| Parameter | Default (AreaChart) | Default (LineChart) |
|-----------|-------------------|-------------------|
| `fill` | `True` | `False` |
| `fill_opacity` | `0.4` | `0.1` |
| `dots` | `False` | `True` |

All other [LineChart parameters](line.md#parameters) apply.
