# Line Chart

Lines connecting data points, ideal for trends over time.

## When to Use

- Time series (daily sales, monthly revenue, sensor readings)
- Comparing trends across multiple series
- Continuous data with a natural ordering

## Basic Example

```python
from d3_bridge import LineChart

chart = LineChart(
    data=DailySales.objects.values("date", "amount"),
    x="date",
    y="amount",
    title="Daily Sales",
)
```

## Multi-Series

Split data into multiple lines by a field:

```python
chart = LineChart(
    data=SensorReading.objects.values("timestamp", "value", "sensor_name"),
    x="timestamp",
    y="value",
    series="sensor_name",
    title="Sensor Readings",
)
```

## Curve Types

Control the line interpolation:

```python
chart = LineChart(data=data, x="x", y="y", curve="curveNatural")
```

Available curves: `curveLinear`, `curveMonotoneX` (default), `curveBasis`, `curveCardinal`, `curveStep`, `curveCatmullRom`, `curveNatural`.

## Without Dots

```python
chart = LineChart(data=data, x="x", y="y", dots=False)
```

## With Fill (Shaded Area Under Line)

```python
chart = LineChart(data=data, x="x", y="y", fill=True, fill_opacity=0.2)
```

## Zoomable

```python
chart = LineChart(data=data, x="x", y="y", zoom=True)
```

## Time Axis

Automatically detected from ISO date strings. Force it explicitly:

```python
chart = LineChart(data=data, x="timestamp", y="value", x_type="time")
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `x` | str | — | Field for x-axis |
| `y` | str | — | Field for y-axis |
| `series` | str | `None` | Field to split into multiple lines |
| `x_type` | str | `"auto"` | `"auto"`, `"time"`, `"linear"`, `"band"` |
| `curve` | str | `"curveMonotoneX"` | D3 curve type |
| `stroke_width` | float | `2` | Line thickness |
| `dots` | bool | `True` | Show data point dots |
| `dot_radius` | float | `4` | Dot radius |
| `fill` | bool | `False` | Fill area under line |
| `fill_opacity` | float | `0.1` | Fill opacity |
| `grid` | bool | `True` | Show grid lines |
| `zoom` | bool | `False` | Enable x-axis zoom |
| `color` | str | `None` | Single color override |
| `x_label` | str | `None` | X-axis label |
| `y_label` | str | `None` | Y-axis label |
