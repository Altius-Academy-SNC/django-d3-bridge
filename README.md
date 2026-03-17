# django-d3-bridge

Declarative D3.js visualizations for Django — charts, maps, networks, with MQTT live updates.

## Quick Start

```python
# settings.py
INSTALLED_APPS = [
    ...
    "d3_bridge",
]

# views.py
from d3_bridge import BarChart

def dashboard(request):
    chart = BarChart(
        data=Product.objects.values("name", "sales"),
        x="name", y="sales",
        title="Sales by Product",
    )
    return render(request, "dashboard.html", {"chart": chart})
```

```html
{% load d3_bridge %}
{% d3_scripts %}

<div class="col-md-6">
    {% d3_render chart %}
</div>
```

## License

MIT
