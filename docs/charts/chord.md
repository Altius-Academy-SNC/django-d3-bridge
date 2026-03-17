# Chord Diagram

Circular layout showing flows between entities. The arc thickness represents the total flow, ribbons show pairwise relationships.

## When to Use

- Trade flows between countries
- Communication patterns between departments
- Any square matrix of interactions

## Example

```python
from d3_bridge import ChordDiagram

chart = ChordDiagram(
    matrix=[
        [0, 50, 30, 10],
        [50, 0, 20, 40],
        [30, 20, 0, 15],
        [10, 40, 15, 0],
    ],
    names=["North", "South", "East", "West"],
    title="Inter-Regional Trade",
)
```

## Directed Flows

```python
chart = ChordDiagram(
    matrix=asymmetric_matrix,
    names=names,
    directed=True,
)
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `matrix` | list[list] | — | Square matrix of flow values |
| `names` | list[str] | — | Labels for each row/column |
| `pad_angle` | float | `0.05` | Gap angle between arcs |
| `inner_radius_ratio` | float | `0.9` | Inner radius as ratio of outer |
| `label_offset` | int | `10` | Distance of labels from arcs |
| `directed` | bool | `False` | If `True`, chord widths differ by direction |
