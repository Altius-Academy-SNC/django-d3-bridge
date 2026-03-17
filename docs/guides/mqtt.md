# MQTT Live Updates

For real-time data push — IoT sensors, live monitoring, streaming data.

## When to Use MQTT vs Polling

| | Polling | MQTT |
|---|---|---|
| Latency | Seconds (interval-based) | Milliseconds (push) |
| Infrastructure | None (just HTTP) | MQTT broker required |
| Use case | Dashboards, reports | IoT, live monitoring |
| Complexity | Simple | Moderate |

Use **polling** unless you need sub-second updates or already have an MQTT broker.

## Setup

### 1. Enable in Django settings

```python
# settings.py
D3_BRIDGE = {
    "MQTT": True,
}
```

### 2. Create a live chart

```python
from d3_bridge import LineChart

chart = LineChart(
    data=SensorReading.objects.last_hour().values("timestamp", "temperature"),
    x="timestamp",
    y="temperature",
    title="Temperature (Live)",
    live=True,
    mqtt_broker="ws://your-broker:8083/mqtt",
    mqtt_topic="sensors/+/temperature",
    mqtt_window=100,  # keep last 100 data points
)
```

### 3. MQTT message format

The broker should publish JSON matching your chart's data fields:

```json
{"timestamp": "2026-03-17T14:30:00", "temperature": 23.5}
```

## How It Works

```
Django View (initial data) ──→ Chart renders
                                   ↑
MQTT Broker (WebSocket) ──→ mqtt.js ──→ chart.update(newPoint)
```

1. Chart renders with initial data from the Django view
2. JavaScript connects to the MQTT broker via WebSocket
3. On each message, `chart.update()` is called with the new data point
4. The chart re-renders with a D3 transition

## Connection Status

A live indicator appears in the top-right corner of the chart:

- **LIVE** (green) — connected and receiving
- **LIVE** (red) — disconnected, attempting to reconnect

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `live` | bool | `False` | Enable MQTT |
| `mqtt_broker` | str | `None` | WebSocket URL (`ws://` or `wss://`) |
| `mqtt_topic` | str | `None` | MQTT topic (supports `+` and `#` wildcards) |
| `mqtt_window` | int | `100` | Max data points to keep |
| `mqtt_qos` | int | `0` | MQTT QoS level (0, 1, or 2) |

## Compatible Brokers

Any MQTT broker with WebSocket support:

- [EMQX](https://www.emqx.io/) — default WebSocket on port 8083
- [Mosquitto](https://mosquitto.org/) — with WebSocket listener configured
- [HiveMQ](https://www.hivemq.com/)
- Cloud services (AWS IoT, Azure IoT Hub, etc.)
