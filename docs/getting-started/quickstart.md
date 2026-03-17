# Quick Start

A complete example from zero to chart in 3 steps.

## 1. Create the chart in your view

```python
# views.py
from django.shortcuts import render
from d3_bridge import BarChart

def dashboard(request):
    chart = BarChart(
        data=[
            {"product": "Widget A", "revenue": 12400},
            {"product": "Widget B", "revenue": 8300},
            {"product": "Widget C", "revenue": 15600},
            {"product": "Widget D", "revenue": 6100},
            {"product": "Widget E", "revenue": 9800},
        ],
        x="product",
        y="revenue",
        title="Revenue by Product",
        sort="desc",
        value_labels=True,
        theme="bootstrap",
    )
    return render(request, "dashboard.html", {"chart": chart})
```

## 2. Render in your template

```html
{% load d3_bridge %}
<!DOCTYPE html>
<html>
<head>
    <title>Dashboard</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5/dist/css/bootstrap.min.css">
    {% d3_scripts %}
</head>
<body>
    <div class="container mt-4">
        <div class="row">
            <div class="col-md-8">
                {% d3_render chart %}
            </div>
        </div>
    </div>
</body>
</html>
```

## 3. Wire the URL

```python
# urls.py
from django.urls import path
from . import views

urlpatterns = [
    path("dashboard/", views.dashboard, name="dashboard"),
]
```

Done. Visit `/dashboard/` and you'll see an animated bar chart.

---

## Using Django QuerySets

The real power comes from connecting to your database:

```python
from d3_bridge import PieChart

def sales_breakdown(request):
    chart = PieChart(
        data=Order.objects.values("category").annotate(
            total=Sum("amount")
        ),
        value="total",
        label="category",
        title="Sales by Category",
    )
    return render(request, "sales.html", {"chart": chart})
```

The QuerySet is evaluated fresh on each page load — new data appears automatically.

---

## Multiple Charts on One Page

```python
def analytics(request):
    revenue = BarChart(
        data=Product.objects.values("name", "revenue"),
        x="name", y="revenue", title="Revenue",
    )
    trend = LineChart(
        data=DailySales.objects.values("date", "amount"),
        x="date", y="amount", title="Sales Trend",
    )
    breakdown = DonutChart(
        data=Product.objects.values("category").annotate(total=Sum("revenue")),
        value="total", label="category", title="By Category",
    )
    return render(request, "analytics.html", {
        "revenue": revenue,
        "trend": trend,
        "breakdown": breakdown,
    })
```

```html
{% load d3_bridge %}
{% d3_scripts %}

<div class="row">
    <div class="col-md-6">{% d3_render revenue %}</div>
    <div class="col-md-6">{% d3_render trend %}</div>
</div>
<div class="row mt-3">
    <div class="col-md-6 mx-auto">{% d3_render breakdown %}</div>
</div>
```

Call `{% d3_scripts %}` once. Call `{% d3_render %}` for each chart.

---

## Overriding Options in the Template

```html
{% d3_render chart theme="dark" height=500 %}
```

Available overrides: `theme`, `palette`, `height`, `width`, `title`, `animate`.

---

## Next Steps

- [Browse all 19 chart types →](../charts/index.md)
- [Themes & Palettes →](../guides/themes.md)
- [Auto-refresh with Polling →](../guides/polling.md)
