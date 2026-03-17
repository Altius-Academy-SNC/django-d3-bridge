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
