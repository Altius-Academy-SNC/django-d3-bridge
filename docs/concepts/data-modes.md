# Data Modes

django-d3-bridge supports three ways to get data into charts.

## 1. Static (Page Load)

Data is serialized into the HTML at render time. Each page load re-evaluates the QuerySet.

```python
chart = BarChart(
    data=Product.objects.values("name", "price"),
    x="name", y="price",
)
```

**Pros**: Simplest. No extra endpoints. Works offline after initial load.
**Cons**: Requires page reload to see new data.

**Best for**: Dashboards, reports, admin pages.

## 2. Polling (HTTP Auto-refresh)

Chart fetches new data via HTTP at regular intervals.

```python
chart = LineChart(
    data=initial_data,
    x="time", y="value",
    poll_url="/api/chart/data/",
    poll_interval=30,
)
```

**Pros**: No infrastructure beyond Django. Pauses when tab is hidden. Exponential backoff on errors.
**Cons**: Not real-time (minimum practical interval ~5s). Each poll is an HTTP request.

**Best for**: Stock prices, inventory levels, queue lengths — anything that changes every few seconds to minutes.

## 3. MQTT (WebSocket Push)

Data is pushed to the chart in real-time via MQTT over WebSocket.

```python
chart = LineChart(
    data=initial_data,
    x="timestamp", y="temperature",
    live=True,
    mqtt_broker="ws://broker:8083/mqtt",
    mqtt_topic="sensors/+/data",
)
```

**Pros**: Millisecond latency. Server pushes data — no polling waste. Scales to many clients.
**Cons**: Requires an MQTT broker. More infrastructure to manage.

**Best for**: IoT sensors, live monitoring, real-time alerts.

## Combining Modes

A chart can use **static + polling** (initial data from QuerySet, then auto-refresh):

```python
chart = BarChart(
    data=Product.objects.values("name", "stock"),  # initial render
    x="name", y="stock",
    poll_url="/api/stock/",
    poll_interval=15,  # then refresh every 15s
)
```

Or **static + MQTT** (initial historical data, then live push):

```python
chart = LineChart(
    data=SensorReading.objects.last_hour().values("timestamp", "value"),
    x="timestamp", y="value",
    live=True,
    mqtt_broker="ws://broker:8083/mqtt",
    mqtt_topic="sensors/temp",
    mqtt_window=200,
)
```

## Data Sources

The `data` parameter accepts:

| Source | Serialization |
|--------|---------------|
| Django QuerySet | `.values()` → list of dicts |
| GeoQuerySet | → GeoJSON FeatureCollection |
| List of dicts | Passthrough |
| Single dict | Passthrough |
| pandas DataFrame | `.to_dict("records")` |

All datetime, date, and Decimal objects are auto-serialized.
