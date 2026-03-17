# Sunburst

Concentric rings showing hierarchy from center outward. Interactive drill-down.

## When to Use

- Exploring nested categories (file system, org structure, classification)
- When breadcrumb-style navigation through levels is useful
- Showing depth and proportion simultaneously

## Example

```python
from d3_bridge import Sunburst

chart = Sunburst(
    data={
        "name": "Sales",
        "children": [
            {"name": "Online", "children": [
                {"name": "Desktop", "value": 450},
                {"name": "Mobile", "value": 320},
                {"name": "Tablet", "value": 80},
            ]},
            {"name": "Retail", "children": [
                {"name": "Store A", "value": 200},
                {"name": "Store B", "value": 150},
            ]},
        ],
    },
    title="Sales Channels",
)
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `data` | dict or list | — | Hierarchical data |
| `inner_radius` | float | `0` | Inner radius (0 = from center) |
| `pad_angle` | float | `0.01` | Gap between slices |
| `corner_radius` | float | `4` | Rounded corners on arcs |
| `value_field` | str | `"value"` | Value field |
| `name_field` | str | `"name"` | Label field |
| `labels` | bool | `True` | Show labels on arcs |
