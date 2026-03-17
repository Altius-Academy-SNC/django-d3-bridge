# Django Integration

How django-d3-bridge fits into your Django project.

## Template Tags

After adding `"d3_bridge"` to `INSTALLED_APPS`, three template tags are available:

```html
{% load d3_bridge %}
```

### `{% d3_scripts %}`

Loads D3.js, the runtime, all chart modules, and the CSS. Call it **once per page**, in `<head>` or before any charts.

```html
<head>
    {% d3_scripts %}
</head>
```

Options:

```html
{% d3_scripts cdn=True %}   {# CDN (default) #}
{% d3_scripts cdn=False %}  {# Local static files #}
```

### `{% d3_render chart %}`

Renders a chart instance. Outputs a `<div>` container and a `<script>` block.

```html
{% d3_render my_chart %}
{% d3_render my_chart theme="dark" height=500 %}
```

Override parameters: `theme`, `palette`, `height`, `width`, `title`, `animate`.

### `{% d3_json chart %}`

Outputs just the JSON config. Useful when you want to render client-side:

```html
<script>
    var config = {% d3_json my_chart %};
    D3Bridge.render("my-container", config);
</script>
```

## Views Pattern

The recommended pattern is to create chart instances in the view:

```python
# views.py
from d3_bridge import BarChart, LineChart

def dashboard(request):
    sales = BarChart(
        data=Order.objects.values("product__name").annotate(total=Sum("amount")),
        x="product__name", y="total",
    )
    trend = LineChart(
        data=Order.objects.values("date").annotate(daily=Sum("amount")),
        x="date", y="daily",
    )
    return render(request, "dashboard.html", {
        "sales": sales,
        "trend": trend,
    })
```

## Class-Based Views

```python
from django.views.generic import TemplateView
from d3_bridge import PieChart

class DashboardView(TemplateView):
    template_name = "dashboard.html"

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx["chart"] = PieChart(
            data=Category.objects.values("name").annotate(count=Count("id")),
            value="count", label="name",
        )
        return ctx
```

## Static Data (No Database)

Charts work with plain lists too — no Django models required:

```python
chart = BarChart(
    data=[
        {"month": "Jan", "value": 100},
        {"month": "Feb", "value": 120},
    ],
    x="month", y="value",
)
```

## Bootstrap Grid

Charts auto-fill their container. Works naturally with Bootstrap:

```html
<div class="row">
    <div class="col-md-4">{% d3_render chart_a %}</div>
    <div class="col-md-4">{% d3_render chart_b %}</div>
    <div class="col-md-4">{% d3_render chart_c %}</div>
</div>
```

## CSRF and Polling

The polling module auto-detects Django's CSRF token from cookies. No extra configuration needed for same-origin `fetch()` calls.
