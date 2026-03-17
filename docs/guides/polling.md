# Polling (Auto-refresh)

Charts can auto-refresh by fetching new data via HTTP at regular intervals. No WebSocket, no MQTT — just plain `fetch()`.

## How It Works

1. Chart renders with initial data from the Django view
2. JavaScript fetches the `poll_url` every `poll_interval` seconds
3. Chart re-renders with new data (animated transition)

## Quick Example

```python
# views.py
from d3_bridge import BarChart
from d3_bridge.views import ChartDataView

def dashboard(request):
    chart = BarChart(
        data=Product.objects.values("name", "stock"),
        x="name", y="stock",
        title="Current Stock",
        poll_url="/api/chart/stock/",
        poll_interval=15,  # refresh every 15 seconds
    )
    return render(request, "dashboard.html", {"chart": chart})
```

```python
# urls.py
from d3_bridge.views import ChartDataView

urlpatterns = [
    path("api/chart/stock/", ChartDataView.as_view(
        queryset=Product.objects.all(),
        fields=["name", "stock"],
        ordering="-stock",
    )),
]
```

## Replace vs Append Mode

### Replace (default)

Each poll replaces all chart data:

```python
chart = BarChart(
    data=data, x="x", y="y",
    poll_url="/api/data/",
    poll_interval=30,
    poll_replace=True,  # default
)
```

### Append

New data is appended to existing data, with a sliding window:

```python
chart = LineChart(
    data=initial_readings,
    x="timestamp", y="value",
    poll_url="/api/latest-reading/",
    poll_interval=5,
    poll_replace=False,   # append mode
    poll_window=100,      # keep last 100 points
)
```

## Custom Headers

```python
chart = BarChart(
    data=data, x="x", y="y",
    poll_url="/api/data/",
    poll_interval=30,
    poll_headers={"Authorization": "Bearer my-token"},
)
```

## ChartDataView

A lightweight JSON endpoint included in the package. No Django REST Framework required.

```python
from d3_bridge.views import ChartDataView

urlpatterns = [
    path("api/chart/sales/", ChartDataView.as_view(
        queryset=Sale.objects.all(),
        fields=["date", "amount", "product"],
        ordering="-date",
        limit=100,
    )),
]
```

| Option | Type | Description |
|--------|------|-------------|
| `queryset` | QuerySet | Data source (re-evaluated each request) |
| `fields` | list | Fields to include |
| `ordering` | str or list | Order by field(s) |
| `limit` | int | Max records |
| `geojson` | bool | Serialize as GeoJSON |

Override `get_queryset()` or `filter_queryset()` for dynamic filtering:

```python
class SalesByRegion(ChartDataView):
    queryset = Sale.objects.all()
    fields = ["product", "amount"]

    def filter_queryset(self, qs):
        region = self.request.GET.get("region")
        if region:
            qs = qs.filter(region=region)
        return qs
```

## Smart Behavior

- **Pauses when tab is hidden** — saves bandwidth (Page Visibility API)
- **Exponential backoff** — on network errors, waits progressively longer before retrying
- **CSRF token** — auto-detected from Django's cookie
- **Same-origin credentials** — included automatically

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `poll_url` | str | `None` | URL to fetch data from |
| `poll_interval` | int | `0` | Seconds between fetches (0 = disabled) |
| `poll_replace` | bool | `True` | Replace all data (`True`) or append (`False`) |
| `poll_window` | int | `None` | Max data points in append mode |
| `poll_headers` | dict | `None` | Custom HTTP headers |
