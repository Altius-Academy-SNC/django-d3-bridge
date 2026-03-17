# Tree Diagram

Hierarchical tree layout — horizontal, vertical, or radial.

## When to Use

- Org charts, file system trees, category taxonomies
- Any parent-child hierarchical data
- Decision trees, family trees

## Nested Data

```python
from d3_bridge import TreeDiagram

chart = TreeDiagram(
    data={
        "name": "CEO",
        "children": [
            {"name": "CTO", "children": [
                {"name": "Engineering"},
                {"name": "DevOps"},
            ]},
            {"name": "CFO", "children": [
                {"name": "Accounting"},
                {"name": "Finance"},
            ]},
        ],
    },
    title="Organization",
)
```

## Flat Data (Stratify)

If your data is a flat list with id/parent references:

```python
chart = TreeDiagram(
    data=[
        {"id": "CEO", "parent": None},
        {"id": "CTO", "parent": "CEO"},
        {"id": "Engineering", "parent": "CTO"},
        {"id": "DevOps", "parent": "CTO"},
    ],
    id_field="id",
    parent_field="parent",
)
```

## Orientations

```python
# Horizontal (default) — root on left
chart = TreeDiagram(data=data, orientation="horizontal")

# Vertical — root on top
chart = TreeDiagram(data=data, orientation="vertical")

# Radial — root in center
chart = TreeDiagram(data=data, orientation="radial")
```

## Link Styles

```python
chart = TreeDiagram(data=data, link_style="curve")    # smooth curves (default)
chart = TreeDiagram(data=data, link_style="step")      # right-angle steps
chart = TreeDiagram(data=data, link_style="straight")   # straight lines
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `data` | dict or list | — | Nested dict or flat list (stratify) |
| `orientation` | str | `"horizontal"` | `"horizontal"`, `"vertical"`, `"radial"` |
| `node_radius` | float | `5` | Node circle radius |
| `link_style` | str | `"curve"` | `"curve"`, `"step"`, `"straight"` |
| `value_field` | str | `"value"` | Field for node value |
| `name_field` | str | `"name"` | Field for node label |
| `id_field` | str | `None` | Field for node id (flat data) |
| `parent_field` | str | `None` | Field for parent id (flat data) |
| `color_by` | str | `None` | Field or `"depth"` for color |
| `labels` | bool | `True` | Show node labels |
