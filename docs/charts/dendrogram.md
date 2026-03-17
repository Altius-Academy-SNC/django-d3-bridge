# Dendrogram

Cluster layout where leaves are aligned. Used for clustering results and taxonomies.

## When to Use

- Hierarchical clustering results
- Phylogenetic trees, taxonomies
- When leaf alignment is more important than even spacing

## Difference from Tree Diagram

A **tree** diagram spaces nodes evenly. A **dendrogram** (cluster layout) aligns all leaves at the same depth, making it better for showing clustering distances.

## Example

```python
from d3_bridge import Dendrogram

chart = Dendrogram(
    data={
        "name": "Animals",
        "children": [
            {"name": "Mammals", "children": [
                {"name": "Cat", "value": 1},
                {"name": "Dog", "value": 1},
                {"name": "Horse", "value": 1},
            ]},
            {"name": "Birds", "children": [
                {"name": "Eagle", "value": 1},
                {"name": "Sparrow", "value": 1},
            ]},
        ],
    },
    title="Animal Taxonomy",
)
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `data` | dict or list | — | Hierarchical data |
| `orientation` | str | `"horizontal"` | `"horizontal"` or `"vertical"` |
| `node_radius` | float | `4` | Node circle radius |
| `link_style` | str | `"curve"` | `"curve"`, `"step"`, `"straight"` |
| `value_field` | str | `"value"` | Value field |
| `name_field` | str | `"name"` | Label field |
| `labels` | bool | `True` | Show labels on leaf nodes |
