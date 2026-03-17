# Installation

## Requirements

- Python 3.10+
- Django 4.2+

## Install

```bash
pip install django-d3-bridge
```

### Optional extras

```bash
# GeoDjango support (for ChoroplethMap, BubbleMap)
pip install django-d3-bridge[geo]

# MQTT live updates
pip install django-d3-bridge[mqtt]

# Everything
pip install django-d3-bridge[all]
```

## Django Configuration

Add `d3_bridge` to your `INSTALLED_APPS`:

```python
# settings.py
INSTALLED_APPS = [
    ...
    "d3_bridge",
]
```

That's the minimum. No database migrations, no middleware, no extra config.

## Optional Settings

```python
# settings.py
D3_BRIDGE = {
    "CDN": True,       # Load D3.js from CDN (default: True)
    "MQTT": False,     # Include MQTT.js globally (default: False)
}
```

| Setting | Default | Description |
|---------|---------|-------------|
| `CDN` | `True` | If `True`, loads D3.js from jsDelivr CDN. Set `False` to serve from your own static files. |
| `MQTT` | `False` | If `True`, includes the MQTT.js client globally via `{% d3_scripts %}`. Only needed if you use `live=True` on charts. |

## Verify Installation

```python
python -c "import d3_bridge; print(d3_bridge.__version__)"
```

## Next Steps

[Quick Start →](quickstart.md){ .md-button .md-button--primary }
