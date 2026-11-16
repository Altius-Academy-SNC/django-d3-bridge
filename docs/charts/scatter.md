# Scatter Plot

Points plotted on two continuous axes. Reveals correlations and distributions.

## When to Use

- Finding correlations between two variables
- Spotting clusters and outliers
- Encoding a third dimension via color or size

## Basic Example

```python
from d3_bridge import ScatterPlot

chart = ScatterPlot(
    data=Parcel.objects.values("area_ha", "yield_kg"),
    x="area_ha",
    y="yield_kg",
    title="Yield vs Area",
    x_label="Area (ha)",
    y_label="Yield (kg)",
)
```

## Color by Category

```python
chart = ScatterPlot(
    data=data,
    x="area", y="yield",
    color_by="region",
)
```

## Size by Value (Bubble)

```python
chart = ScatterPlot(
    data=data,
    x="longitude", y="latitude",
    size="population",  # field name → proportional radius
)
```

## Linear Regression Line

```python
chart = ScatterPlot(
    data=data,
    x="study_hours", y="score",
    regression="linear",
)
```

## Zoomable

```python
chart = ScatterPlot(data=data, x="x", y="y", zoom=True)
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `x` | str | — | Field for x-axis |
| `y` | str | — | Field for y-axis |
| `size` | str or float | `5` | Field name for proportional radius, or fixed radius |
| `color_by` | str | `None` | Field for color encoding |
| `opacity` | float | `0.7` | Point opacity |
| `grid` | bool | `True` | Show grid lines |
| `zoom` | bool | `False` | Enable zoom/pan |
| `regression` | str | `None` | `"linear"` or `None` |
| `x_label` | str | `None` | X-axis label |
| `y_label` | str | `None` | Y-axis label |

## Positioning Matrix

Fixed axis bounds, background regions, a trajectory through some of the
points, a number on each point and per-point colours and shapes turn a
scatter into a positioning matrix (e.g. trust × relevance).

```python
chart = ScatterPlot(
    data=[
        {"x": 1.5, "y": 2, "n": "1", "colour": "#4e79a7", "shape": "circle", "path": True,
         "text": "How do you work today?"},
        {"x": 7.0, "y": 7, "n": "2", "colour": "#e15759", "shape": "circle", "path": True,
         "text": "What does it cost you each year?"},
        {"x": 1.0, "y": 9, "n": "3", "colour": "#e15759", "shape": "x", "path": False,
         "text": "What is your budget?"},
    ],
    x="x", y="y",
    x_domain=(0, 10), y_domain=(0, 10),
    regions=[
        {"x0": 0, "x1": 5, "y0": 6, "y1": 10, "label": "Unease", "color": "#e15759"},
        {"x0": 6, "x1": 10, "y0": 6, "y1": 10, "label": "Virtuous circle", "color": "#59a14f"},
    ],
    connect="path",          # True joins every point; a field joins only truthy ones
    label="n",               # written on each point
    color_field="colour",    # literal CSS colour per point (CSS variables work too)
    shape_field="shape",     # circle, square, cross, x, diamond, triangle, star, wye
    size=9,
    tooltip=["text"],        # fields shown on hover
    field_labels={"text": "Question"},
    x_label="Trust", y_label="Relevance",
)
```

Tooltip values are HTML-escaped.
