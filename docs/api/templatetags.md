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
| `cdn` | bool | `True` | Load D3 from CDN. If `False`, serve the copies vendored in the package's static files (D3 v7, and d3-sankey / mqtt.js when enabled) — fully offline, no external requests. |
| `sankey` | bool | `False` | Also load the [d3-sankey](https://github.com/d3/d3-sankey) plugin. Required by the [Sankey](../charts/sankey.md) chart type, which is not part of core D3. Can also be enabled globally via `D3_BRIDGE = {"SANKEY": True}` in settings. |

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

Overrides apply to that rendering only — the chart instance is never mutated,
so the same chart can be rendered several times with different options on one page.

!!! note "XSS-safe output"
    The JSON config is escaped before being inlined in the `<script>` block
    (`<`, `>`, `&` become `\u003C`, `\u003E`, `\u0026`, like Django's
    `json_script`), so data values coming from the database cannot break out
    of the script and inject markup.

### `{% d3_json chart %}`

Output the JSON config for client-side rendering. The output is escaped the
same way as `{% d3_render %}`, so it is safe to inline inside a `<script>` block.

```html
<script>
    var config = {% d3_json chart %};
    D3Bridge.render("my-div", config);
</script>
```
