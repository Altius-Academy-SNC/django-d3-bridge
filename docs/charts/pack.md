# Circle Packing

Nested circles representing hierarchy. Size encodes value.

## When to Use

- When you want a softer, more organic look than treemaps
- Showing nested groups with relative sizes
- Bubble-chart style comparisons with hierarchy

## Example

```python
from d3_bridge import PackCircle

chart = PackCircle(
    data={
        "name": "World",
        "children": [
            {"name": "Africa", "children": [
                {"name": "Nigeria", "value": 206},
                {"name": "Ethiopia", "value": 115},
                {"name": "Egypt", "value": 102},
            ]},
            {"name": "Asia", "children": [
                {"name": "China", "value": 1412},
                {"name": "India", "value": 1408},
            ]},
        ],
    },
    title="Population by Region",
    padding=5,
)
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `data` | dict or list | — | Hierarchical data |
| `padding` | int | `3` | Spacing between circles |
| `value_field` | str | `"value"` | Value field |
| `name_field` | str | `"name"` | Label field |
| `labels` | bool | `True` | Show labels (on circles large enough) |
