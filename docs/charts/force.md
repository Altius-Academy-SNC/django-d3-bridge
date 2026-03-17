# Force Graph

Force-directed graph for visualizing relationships and networks.

## When to Use

- Social networks, co-authorship, collaboration graphs
- Entity relationships (products ↔ suppliers, users ↔ groups)
- Any data with nodes and edges

## Basic Example

```python
from d3_bridge import ForceGraph

chart = ForceGraph(
    nodes=[
        {"id": "Alice", "name": "Alice", "group": "Engineering"},
        {"id": "Bob", "name": "Bob", "group": "Engineering"},
        {"id": "Carol", "name": "Carol", "group": "Sales"},
        {"id": "Dave", "name": "Dave", "group": "Sales"},
    ],
    links=[
        {"source": "Alice", "target": "Bob"},
        {"source": "Alice", "target": "Carol"},
        {"source": "Bob", "target": "Dave"},
        {"source": "Carol", "target": "Dave"},
    ],
    node_group="group",
    title="Team Network",
)
```

## From Django QuerySets

```python
chart = ForceGraph(
    nodes=Person.objects.values("id", "name", "department"),
    links=Collaboration.objects.values("source_id", "target_id", "weight"),
    node_group="department",
    link_value="weight",
    link_source="source_id",
    link_target="target_id",
)
```

## Node Sizing by Value

```python
chart = ForceGraph(
    nodes=nodes, links=links,
    node_size="influence_score",  # field → proportional radius
)
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `nodes` | list or QuerySet | — | Node data |
| `links` | list or QuerySet | — | Edge data |
| `node_id` | str | `"id"` | Field for node identifier |
| `node_label` | str | `"name"` | Field for node label |
| `node_group` | str | `None` | Field for color grouping |
| `node_size` | str or float | `8` | Field for proportional size, or fixed radius |
| `link_source` | str | `"source"` | Field for edge source |
| `link_target` | str | `"target"` | Field for edge target |
| `link_value` | str | `None` | Field for edge weight (affects thickness) |
| `link_distance` | float | `80` | Target distance between linked nodes |
| `charge_strength` | float | `-200` | Repulsion force (more negative = more spread) |
| `draggable` | bool | `True` | Allow dragging nodes |
| `zoom` | bool | `True` | Enable zoom/pan |
