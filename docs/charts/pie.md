# Pie & Donut Charts

Circular charts showing part-of-whole proportions.

## When to Use

- Showing composition (market share, budget allocation)
- Comparing a small number of categories (2–8 slices)
- Use `DonutChart` when you want a center metric display

## Pie Chart

```python
from d3_bridge import PieChart

chart = PieChart(
    data=Order.objects.values("category").annotate(total=Sum("amount")),
    value="total",
    label="category",
    title="Orders by Category",
)
```

## Donut Chart

A pie with a hole — lets you show a total or KPI in the center:

```python
from d3_bridge import DonutChart

chart = DonutChart(
    data=data,
    value="amount",
    label="category",
    title="Revenue Breakdown",
)
```

## Label Types

```python
# Show percentages (default)
chart = PieChart(data=data, value="v", label="l", label_type="percent")

# Show raw values
chart = PieChart(data=data, value="v", label="l", label_type="value")

# Show category names
chart = PieChart(data=data, value="v", label="l", label_type="label")

# No labels
chart = PieChart(data=data, value="v", label="l", label_type="none")
```

## Sorted

```python
chart = PieChart(data=data, value="v", label="l", sort="desc")
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `value` | str | — | Field for the slice value |
| `label` | str | — | Field for the slice label |
| `inner_radius` | float | `0` (pie) / `0.6` (donut) | Inner radius ratio (0 = pie, 0–1 = donut) |
| `pad_angle` | float | `0.02` | Gap angle between slices |
| `corner_radius` | float | `4` | Rounded corners on slices |
| `sort` | str | `None` | `"asc"`, `"desc"`, or `None` |
| `label_type` | str | `"percent"` | `"percent"`, `"value"`, `"label"`, `"none"` |
