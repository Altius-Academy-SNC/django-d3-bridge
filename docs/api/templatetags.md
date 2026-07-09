# Template Tags API

## Loading

```html
{% load d3_bridge %}
```

## Tags

### `{% d3_scripts %}`

Load D3.js and all chart modules. Call once per page.

```html
{% d3_scripts %}
{% d3_scripts cdn=True %}
{% d3_scripts cdn=False %}
{% d3_scripts sankey=True %}
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `cdn` | bool | `True` | Load D3 from CDN. If `False`, load from static files instead. |
| `sankey` | bool | `False` | Also load the [d3-sankey](https://github.com/d3/d3-sankey) plugin from CDN. Required by the [Sankey](../charts/sankey.md) chart type, which is not part of core D3. Can also be enabled globally via `D3_BRIDGE = {"SANKEY": True}` in settings. |

Both can also be set globally in settings:

```python
D3_BRIDGE = {
    "CDN": True,
    "SANKEY": False,
}
```

### `{% d3_render chart %}`

Render a chart instance.

```html
{% d3_render chart %}
{% d3_render chart theme="dark" %}
{% d3_render chart theme="bootstrap" height=500 width=800 %}
```

**Overridable parameters:** `theme`, `palette`, `height`, `width`, `title`, `animate`.

### `{% d3_json chart %}`

Output raw JSON config for client-side rendering.

```html
<script>
    var config = {% d3_json chart %};
    D3Bridge.render("my-div", config);
</script>
```
