# Density Plot

2D kernel density estimation — shows where points concentrate.

## When to Use

- Visualizing point concentration (city events, species observations)
- When scatter plots are too dense to read
- Combining density visualization with point overlay

## Example

```python
from d3_bridge import DensityPlot

chart = DensityPlot(
    data=Observation.objects.values("longitude", "latitude"),
    x="longitude",
    y="latitude",
    bandwidth=25,
    title="Observation Density",
)
```

## With Point Overlay

```python
chart = DensityPlot(
    data=data,
    x="x", y="y",
    show_points=True,
    point_radius=2,
    point_opacity=0.3,
)
```

## Bandwidth

Controls the smoothing. Lower = more detail, higher = smoother:

```python
chart = DensityPlot(data=data, x="x", y="y", bandwidth=10)   # detailed
chart = DensityPlot(data=data, x="x", y="y", bandwidth=50)   # smooth
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `x` | str | — | X-axis field |
| `y` | str | — | Y-axis field |
| `bandwidth` | float | `20` | Kernel bandwidth (smoothing) |
| `thresholds` | int | `20` | Number of density levels |
| `color_scale` | str | `"sequential"` | Color scale type |
| `grid` | bool | `True` | Show axes grid |
| `show_points` | bool | `False` | Overlay scatter points |
| `point_radius` | float | `2` | Point radius |
| `point_opacity` | float | `0.3` | Point opacity |
| `x_label` | str | `None` | X-axis label |
| `y_label` | str | `None` | Y-axis label |
