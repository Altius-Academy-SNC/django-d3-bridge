# GeoDjango & GeoJSON

django-d3-bridge integrates with GeoDjango for geographic visualizations.

## Auto-Serialization

Pass a GeoQuerySet directly — the geometry field is auto-detected and serialized to GeoJSON:

```python
from d3_bridge import ChoroplethMap

chart = ChoroplethMap(
    geodata=Region.objects.filter(country="CI"),
    value_field="population",
    title="Population by Region",
)
```

This automatically:

1. Finds the geometry field on the model
2. Serializes all non-geometry fields as GeoJSON properties
3. Builds a `FeatureCollection` with `id`, `geometry`, and `properties`

## Controlling Fields

Limit which fields are included in properties:

```python
chart = ChoroplethMap(
    geodata=Region.objects.all(),
    value_field="gdp",
    properties=["name", "gdp", "population"],  # only these in tooltip
)
```

## Specify Geometry Field

If your model has multiple geometry fields:

```python
chart = ChoroplethMap(
    geodata=Parcel.objects.all(),
    value_field="risk_score",
    geometry_field="polygon",  # use this specific geometry
)
```

## Raw GeoJSON

You can also pass pre-built GeoJSON:

```python
import json

with open("boundaries.geojson") as f:
    geojson = json.load(f)

chart = ChoroplethMap(geodata=geojson, value_field="score")
```

## GeoJSON via API (Polling)

For large datasets, serve GeoJSON via an endpoint:

```python
from d3_bridge.views import ChartDataView

urlpatterns = [
    path("api/geo/regions/", ChartDataView.as_view(
        queryset=Region.objects.all(),
        geojson=True,
        geometry_field="geom",
    )),
]
```

```python
chart = ChoroplethMap(
    geodata=Region.objects.all(),
    value_field="score",
    poll_url="/api/geo/regions/",
    poll_interval=60,
)
```

## Projections

| Projection | Best for |
|------------|----------|
| `mercator` | General purpose (default) |
| `naturalEarth` | World maps |
| `albers` | USA/continental |
| `equirectangular` | Simple lat/lon grid |
| `orthographic` | Globe view |

```python
chart = ChoroplethMap(
    geodata=data,
    value_field="value",
    projection="naturalEarth",
)
```

## Centering on a Region

```python
chart = ChoroplethMap(
    geodata=data,
    value_field="value",
    center=[-5.5, 7.5],  # [longitude, latitude]
    scale=3000,
)
```

Without `center`, the map auto-fits to the data extent.
