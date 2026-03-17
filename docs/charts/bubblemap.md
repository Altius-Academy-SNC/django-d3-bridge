# Bubble Map

A choropleth with proportionally-sized circles at region centroids.

## When to Use

- Showing both a color metric and a size metric on a map
- When absolute values matter more than density (population, production volume)

## Example

```python
from d3_bridge import BubbleMap

chart = BubbleMap(
    geodata=Region.objects.all(),
    value_field="average_income",
    size_field="population",
    size_range=[3, 30],
    title="Income & Population by Region",
)
```

## Parameters

Inherits all [ChoroplethMap parameters](choropleth.md#parameters), plus:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `size_field` | str | `None` | Property to scale bubble radius by |
| `size_range` | list | `[3, 30]` | Min and max bubble radius in pixels |
