# Contour Plot

Topographic-style heatmap showing iso-lines of value or density.

## When to Use

- Visualizing elevation, temperature, or pressure fields
- Showing value gradients over a 2D surface
- When scatter plots have too many overlapping points

## Example

```python
from d3_bridge import ContourPlot

chart = ContourPlot(
    data=SensorGrid.objects.values("x", "y", "temperature"),
    x="x",
    y="y",
    value="temperature",
    thresholds=15,
    title="Temperature Field",
    x_label="Longitude",
    y_label="Latitude",
)
```

## Without Value Field (Density Mode)

If no `value` is provided, contours are computed from point density:

```python
chart = ContourPlot(
    data=points,
    x="lon", y="lat",
    thresholds=10,
    title="Event Density",
)
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `x` | str | — | X-axis field |
| `y` | str | — | Y-axis field |
| `value` | str | `None` | Value field (None = density estimation) |
| `thresholds` | int | `10` | Number of contour levels |
| `color_scale` | str | `"sequential"` | Color scale type |
| `grid` | bool | `True` | Show axes grid |
| `x_label` | str | `None` | X-axis label |
| `y_label` | str | `None` | Y-axis label |
