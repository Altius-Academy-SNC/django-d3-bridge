# Treemap

Nested rectangles proportional to values. Space-efficient way to show hierarchies.

## When to Use

- Disk usage, portfolio allocation, market share
- Showing both hierarchy and magnitude at once
- When you need every leaf visible (unlike tree diagrams)

## Example

```python
from d3_bridge import Treemap

chart = Treemap(
    data={
        "name": "Portfolio",
        "children": [
            {"name": "Tech", "children": [
                {"name": "AAPL", "value": 450},
                {"name": "MSFT", "value": 380},
                {"name": "GOOG", "value": 290},
            ]},
            {"name": "Finance", "children": [
                {"name": "JPM", "value": 200},
                {"name": "GS", "value": 150},
            ]},
            {"name": "Energy", "children": [
                {"name": "XOM", "value": 180},
            ]},
        ],
    },
    title="Portfolio Allocation",
)
```

## Tiling Algorithms

```python
chart = Treemap(data=data, tile="squarify")    # best aspect ratios (default)
chart = Treemap(data=data, tile="binary")       # balanced binary split
chart = Treemap(data=data, tile="dice")         # horizontal slices
chart = Treemap(data=data, tile="slice")        # vertical slices
chart = Treemap(data=data, tile="sliceDice")    # alternating
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `data` | dict or list | — | Hierarchical data |
| `tile` | str | `"squarify"` | Tiling algorithm |
| `padding` | int | `2` | Outer padding |
| `inner_padding` | int | `1` | Padding between siblings |
| `round` | bool | `True` | Round pixel values |
| `value_field` | str | `"value"` | Value field |
| `name_field` | str | `"name"` | Label field |
| `labels` | bool | `True` | Show labels on cells |
