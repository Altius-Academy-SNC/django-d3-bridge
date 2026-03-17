# Themes & Palettes

django-d3-bridge includes a theme system that controls colors, typography, and styling.

## Built-in Themes

| Theme | Description |
|-------|-------------|
| `default` | Neutral, Tableau 10 palette, transparent background |
| `dark` | Dark background, cool palette |
| `bootstrap` | Matches Bootstrap 5 colors |
| `terraf` | Earth tones, DM Sans font |

```python
chart = BarChart(data=data, x="x", y="y", theme="dark")
```

Or override in the template:

```html
{% d3_render chart theme="bootstrap" %}
```

## Built-in Palettes

| Palette | Colors |
|---------|--------|
| `tableau10` | Classic 10-color categorical (default) |
| `warm` | Oranges and reds |
| `cool` | Blues |
| `earth` | Greens (agriculture, environment) |
| `sahel` | Warm browns and oranges |
| `ocean` | Deep blues and teals |
| `categorical8` | 8-color categorical |

Override the palette independently of the theme:

```python
chart = BarChart(data=data, x="x", y="y", palette="earth")
```

Or pass a custom list:

```python
chart = BarChart(
    data=data, x="x", y="y",
    palette=["#e63946", "#457b9d", "#1d3557", "#a8dadc"],
)
```

## Theme Properties

Each theme is a dictionary with these keys:

| Property | Description |
|----------|-------------|
| `palette` | List of hex colors for data encoding |
| `background` | Chart background (`"transparent"` or hex) |
| `fontFamily` | Font family (`"inherit"` = from page CSS) |
| `fontSize` | Base font size (px) |
| `titleFontSize` | Title font size (px) |
| `axisColor` | Axis line color |
| `gridColor` | Grid line color |
| `gridOpacity` | Grid line opacity |
| `textColor` | Text color |
| `tooltipBg` | Tooltip background |
| `tooltipBorder` | Tooltip border color |
| `tooltipColor` | Tooltip text color |
| `animationDuration` | Default animation duration (ms) |
| `animationEasing` | D3 easing function name |

## Register Custom Themes

```python
from d3_bridge.themes import register_theme, register_palette

# Custom palette
register_palette("brand", ["#1a1a2e", "#16213e", "#0f3460", "#e94560"])

# Custom theme
register_theme("brand_theme", {
    "palette": ["#1a1a2e", "#16213e", "#0f3460", "#e94560"],
    "background": "transparent",
    "fontFamily": "'Inter', sans-serif",
    "fontSize": 13,
    "titleFontSize": 18,
    "axisColor": "#555",
    "gridColor": "#ddd",
    "gridOpacity": 0.3,
    "textColor": "#1a1a2e",
    "tooltipBg": "#fff",
    "tooltipBorder": "#ddd",
    "tooltipColor": "#1a1a2e",
    "animationDuration": 600,
    "animationEasing": "easeCubicOut",
})
```

Then use it:

```python
chart = BarChart(data=data, x="x", y="y", theme="brand_theme")
```

!!! tip
    Register themes in your Django app's `AppConfig.ready()` method so they're available everywhere.
