# Positioning Matrix

A positioning matrix places items on two fixed axes, over named zones, and
often follows a path through them: questions of a sales meeting on trust ×
relevance, risks on likelihood × impact, products on effort × value. Since
0.3, `ScatterPlot` draws it directly.

## What makes a scatter a matrix

| Need | Option |
|------|--------|
| The frame does not move with the data | `x_domain`, `y_domain` |
| Named areas with their own meaning | `regions` |
| An order, a path from start to finish | `connect` |
| Each point identifiable at a glance | `label` |
| Colours and shapes that carry meaning | `color_field`, `shape_field` |
| A readable tooltip | `tooltip=[...]`, `field_labels` |

## Example: questions of a meeting, trust × relevance

The models only store business data; the chart is built in the view.

```python
# models.py
class Zone(models.Model):
    name = models.CharField(max_length=100)
    colour = models.CharField(max_length=30)          # "#e15759" or "rgb(var(--danger))"
    x_min = models.DecimalField(max_digits=3, decimal_places=1)
    x_max = models.DecimalField(max_digits=3, decimal_places=1)
    y_min = models.DecimalField(max_digits=3, decimal_places=1)
    y_max = models.DecimalField(max_digits=3, decimal_places=1)


class Question(models.Model):
    text = models.TextField()
    order = models.PositiveSmallIntegerField()
    trust = models.DecimalField(max_digits=3, decimal_places=1)       # 0 – 10
    relevance = models.DecimalField(max_digits=3, decimal_places=1)   # 0 – 10
    pitfall = models.BooleanField(default=False)
```

```python
# views.py
from d3_bridge import ScatterPlot


def matrix(request):
    regions = [
        {"x0": float(z.x_min), "x1": float(z.x_max),
         "y0": float(z.y_min), "y1": float(z.y_max),
         "label": z.name, "color": z.colour, "opacity": 0.14}
        for z in Zone.objects.all()
    ]
    points = [
        {
            "x": float(q.trust), "y": float(q.relevance),
            "number": str(rank),
            "text": q.text,
            # A pitfall shows as a red X and stays off the path.
            "colour": "#e15759" if q.pitfall else "#4e79a7",
            "shape": "x" if q.pitfall else "circle",
            "on_path": not q.pitfall,
        }
        for rank, q in enumerate(Question.objects.order_by("order"), start=1)
    ]
    chart = ScatterPlot(
        data=points, x="x", y="y",
        x_domain=(0, 10), y_domain=(0, 10),
        regions=regions,
        connect="on_path",
        label="number",
        color_field="colour",
        shape_field="shape",
        size=10,                       # radius ≥ 8: the number sits inside the point
        opacity=0.9,
        legend=False,
        tooltip=["number", "text"],
        field_labels={"number": "Question", "text": "Text"},
        x_label="Trust", y_label="Relevance",
        theme="auto",
    )
    return render(request, "matrix.html", {"chart": chart})
```

```html
<!-- matrix.html -->
{% load d3_bridge %}
{% d3_render chart %}

{% d3_scripts cdn=False charts="scatter" %}
```

`cdn=False` serves the vendored D3 from your static files, with no external
request; `charts="scatter"` loads only the scatter renderer.

## Colours from your CSS theme

`color_field` and region `color` accept any CSS colour, including CSS
variables. A Bootstrap-like theme that defines `--primary: 15, 98, 106` can be
used as `"rgb(var(--primary))"`: the runtime resolves it in the page, so the
chart follows the theme and its dark mode.

## Shapes

`circle`, `square`, `cross` (a plus), `x` (a rotated cross), `diamond`,
`triangle`, `star`, `wye`. Use `shape_field` to give each point its own
shape, `shape` for all of them. An unknown shape raises `ValueError`.

## Paths

- `connect=True` joins every point, in the order of `data`.
- `connect="field"` joins only the points where `field` is truthy, still in
  data order: the other points stay visible but off the path.

Sort `data` in the order the path should follow.

## Matrix in a hidden tab

A chart measures its container when it renders. Inside a Bootstrap tab that
is hidden at load, trigger a resize when the tab opens:

```html
<script>
document.querySelector('[data-bs-target="#matrix-tab"]')
  .addEventListener("shown.bs.tab", () => window.dispatchEvent(new Event("resize")));
</script>
```

## Security

Tooltip values are HTML-escaped: text typed by users (a question, a comment)
is shown as text, never interpreted as HTML.
