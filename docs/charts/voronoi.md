# Voronoi Diagram

Spatial partitioning where each cell contains the area closest to its point.

## When to Use

- Nearest-neighbor regions (service areas, coverage zones)
- Spatial analysis and territory partitioning
- Artistic/generative visualizations

## Example

```python
from d3_bridge import VoronoiDiagram

chart = VoronoiDiagram(
    data=Warehouse.objects.values("longitude", "latitude", "region"),
    x="longitude",
    y="latitude",
    color_by="region",
    title="Service Areas",
)
```

## With Delaunay Triangulation

Show the dual triangulation overlay:

```python
chart = VoronoiDiagram(
    data=data,
    x="x", y="y",
    show_delaunay=True,
)
```

## Cell Styling

```python
chart = VoronoiDiagram(
    data=data,
    x="x", y="y",
    cell_opacity=0.5,
    stroke_color="#333",
    stroke_width=1,
)
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `x` | str | — | X-axis field |
| `y` | str | — | Y-axis field |
| `color_by` | str | `None` | Field for cell color |
| `show_points` | bool | `True` | Show generator points |
| `show_delaunay` | bool | `False` | Show Delaunay triangulation |
| `point_radius` | float | `4` | Point radius |
| `stroke_color` | str | `"#666"` | Cell border color |
| `stroke_width` | float | `0.5` | Cell border width |
| `cell_opacity` | float | `0.3` | Cell fill opacity |
| `x_label` | str | `None` | X-axis label |
| `y_label` | str | `None` | Y-axis label |
