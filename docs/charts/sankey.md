# Sankey Diagram

Flow diagram showing quantities transferred between stages.

## When to Use

- Supply chain flows (raw material → factory → distributor → retail)
- Budget allocation (income → categories → subcategories)
- User journey funnels

## Example

```python
from d3_bridge import Sankey

chart = Sankey(
    nodes=[
        {"id": "Farms", "name": "Farms"},
        {"id": "Cooperative", "name": "Cooperative"},
        {"id": "Export", "name": "Export"},
        {"id": "Local", "name": "Local Market"},
    ],
    links=[
        {"source": "Farms", "target": "Cooperative", "value": 80},
        {"source": "Cooperative", "target": "Export", "value": 60},
        {"source": "Cooperative", "target": "Local", "value": 20},
    ],
    title="Cacao Supply Chain",
)
```

!!! note
    Sankey requires the [d3-sankey](https://github.com/d3/d3-sankey) plugin.
    Add it before `{% d3_scripts %}`:
    ```html
    <script src="https://cdn.jsdelivr.net/npm/d3-sankey@0.12"></script>
    ```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `nodes` | list or QuerySet | — | Node data |
| `links` | list or QuerySet | — | Link data with `value` |
| `node_id` | str | `"id"` | Node identifier field |
| `node_label` | str | `"name"` | Node label field |
| `link_source` | str | `"source"` | Link source field |
| `link_target` | str | `"target"` | Link target field |
| `link_value` | str | `"value"` | Link value field |
| `node_padding` | int | `10` | Vertical padding between nodes |
| `node_width` | int | `20` | Width of node rectangles |
| `align` | str | `"justify"` | `"left"`, `"right"`, `"center"`, `"justify"` |
