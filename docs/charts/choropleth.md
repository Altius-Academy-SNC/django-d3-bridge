# Choropleth Map

Color geographic regions by a data value. Works with GeoJSON and GeoDjango.

## When to Use

- Visualizing a metric across regions (risk scores, population, revenue)
- Any GeoJSON FeatureCollection with a numeric property

## With GeoDjango

```python
from d3_bridge import ChoroplethMap

chart = ChoroplethMap(
    geodata=AdminBoundary.objects.filter(level=2),
    value_field="deforestation_risk",
    tooltip=["name", "area_ha", "risk_score"],
    projection="mercator",
    center=[-5.5, 7.5],
    title="Deforestation Risk",
)
```

The GeoQuerySet is automatically serialized to GeoJSON.

## With Raw GeoJSON

```python
import json

with open("regions.geojson") as f:
    geojson = json.load(f)

chart = ChoroplethMap(
    geodata=geojson,
    value_field="gdp_per_capita",
    title="GDP per Capita",
)
```

## Color Scales

```python
# Sequential (default) — light to dark
chart = ChoroplethMap(geodata=qs, value_field="value", color_scale="sequential")

# Diverging — red-yellow-green
chart = ChoroplethMap(geodata=qs, value_field="value", color_scale="diverging")

# Threshold — discrete buckets
chart = ChoroplethMap(
    geodata=qs, value_field="value",
    color_scale="threshold",
    color_domain=[10, 25, 50, 75, 90],
)
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `geodata` | GeoQuerySet or dict | — | GeoJSON data source |
| `value_field` | str | — | Property to color by |
| `geometry_field` | str | `None` | Geometry field name (auto-detected) |
| `properties` | list | `None` | Fields to include in GeoJSON properties |
| `projection` | str | `"mercator"` | `"mercator"`, `"albers"`, `"naturalEarth"`, `"equirectangular"`, `"orthographic"` |
| `center` | list | `None` | `[longitude, latitude]` center point |
| `scale` | float | `None` | Projection scale |
| `color_scale` | str | `"sequential"` | `"sequential"`, `"diverging"`, `"threshold"` |
| `color_domain` | list | `None` | Thresholds for threshold scale |
| `stroke_color` | str | `"#fff"` | Border color |
| `stroke_width` | float | `0.5` | Border width |
| `null_color` | str | `"#ccc"` | Color for missing values |
| `zoom` | bool | `True` | Enable zoom/pan |
