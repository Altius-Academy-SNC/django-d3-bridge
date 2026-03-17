# Bar Chart

Vertical or horizontal bars for comparing categories.

## When to Use

- Comparing values across categories (products, regions, teams)
- Rankings (sort ascending/descending)
- Grouped or stacked comparisons over a secondary dimension

## Basic Example

```python
from d3_bridge import BarChart

chart = BarChart(
    data=Product.objects.values("name", "revenue"),
    x="name",
    y="revenue",
    title="Revenue by Product",
)
```

## Horizontal Bars

```python
chart = BarChart(
    data=data,
    x="country", y="population",
    orientation="horizontal",
)
```

## Sorted

```python
chart = BarChart(data=data, x="name", y="sales", sort="desc")
```

## Grouped Bars

Compare multiple series side by side:

```python
chart = BarChart(
    data=[
        {"quarter": "Q1", "region": "North", "sales": 120},
        {"quarter": "Q1", "region": "South", "sales": 95},
        {"quarter": "Q2", "region": "North", "sales": 140},
        {"quarter": "Q2", "region": "South", "sales": 110},
    ],
    x="quarter",
    y="sales",
    grouped=True,
    group_by="region",
)
```

## Stacked Bars

```python
chart = BarChart(
    data=data,
    x="quarter", y="sales",
    stacked=True, group_by="region",
)
```

## Value Labels

Display the value above each bar:

```python
chart = BarChart(data=data, x="name", y="value", value_labels=True)
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `x` | str | — | Field for the x-axis (categories) |
| `y` | str | — | Field for the y-axis (values) |
| `orientation` | str | `"vertical"` | `"vertical"` or `"horizontal"` |
| `sort` | str | `None` | `"asc"`, `"desc"`, or `None` |
| `stacked` | bool | `False` | Stack bars by `group_by` field |
| `grouped` | bool | `False` | Group bars by `group_by` field |
| `group_by` | str | `None` | Field to group/stack by |
| `bar_padding` | float | `0.2` | Padding between bars (0–1) |
| `bar_radius` | int | `2` | Corner radius of bars |
| `value_labels` | bool | `False` | Show value labels on bars |
| `color` | str | `None` | Single color override (hex) |
| `x_label` | str | `None` | X-axis label |
| `y_label` | str | `None` | Y-axis label |
