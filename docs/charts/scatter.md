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
