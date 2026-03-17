# Charts Overview

django-d3-bridge provides 19 chart types organized in 5 categories.
All charts share the same API: declare in Python, render with `{% d3_render %}`.

## Basic Charts

| Chart | Class | Best for |
|-------|-------|----------|
| [Bar](bar.md) | `BarChart` | Comparing categories, rankings |
| [Line](line.md) | `LineChart` | Trends over time, multi-series |
| [Area](area.md) | `AreaChart` | Volume over time, stacked composition |
| [Pie & Donut](pie.md) | `PieChart` / `DonutChart` | Part-of-whole, proportions |
| [Scatter](scatter.md) | `ScatterPlot` | Correlations, distributions |

## Geographic Charts

| Chart | Class | Best for |
|-------|-------|----------|
| [Choropleth](choropleth.md) | `ChoroplethMap` | Coloring regions by value |
| [Bubble Map](bubblemap.md) | `BubbleMap` | Sized markers on a map |

## Network Charts

| Chart | Class | Best for |
|-------|-------|----------|
| [Force Graph](force.md) | `ForceGraph` | Relationships, social networks |
| [Sankey](sankey.md) | `Sankey` | Flow quantities between stages |
| [Chord](chord.md) | `ChordDiagram` | Bi-directional flows between entities |

## Hierarchy Charts

| Chart | Class | Best for |
|-------|-------|----------|
| [Tree](tree.md) | `TreeDiagram` | Org charts, file trees, taxonomies |
| [Treemap](treemap.md) | `Treemap` | Proportional nested rectangles |
| [Circle Packing](pack.md) | `PackCircle` | Nested proportions as circles |
| [Sunburst](sunburst.md) | `Sunburst` | Hierarchical drill-down |
| [Dendrogram](dendrogram.md) | `Dendrogram` | Clustering, phylogenetics |

## Statistical Charts

| Chart | Class | Best for |
|-------|-------|----------|
| [Contour](contour.md) | `ContourPlot` | Topographic heatmaps |
| [Density](density.md) | `DensityPlot` | 2D point density estimation |
| [Voronoi](voronoi.md) | `VoronoiDiagram` | Spatial partitioning, nearest-neighbor |

## Common Parameters

All charts inherit these from the base `Chart` class:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `data` | QuerySet, list, dict | `None` | The data source |
| `height` | int | `400` | Chart height in pixels |
| `width` | int | `None` | Chart width (`None` = fill container) |
| `title` | str | `None` | Chart title |
| `subtitle` | str | `None` | Subtitle below the title |
| `theme` | str | `"default"` | Theme name |
| `palette` | str or list | `None` | Override the theme's color palette |
| `animate` | bool | `True` | Enable entry animations |
| `tooltip` | bool or list | `True` | Enable tooltips (`True`, `False`, or list of fields) |
| `legend` | bool | `True` | Show legend |
| `responsive` | bool | `True` | Auto-resize on container change |
| `poll_url` | str | `None` | URL for auto-refresh polling |
| `poll_interval` | int | `0` | Polling interval in seconds (0 = disabled) |
| `live` | bool | `False` | Enable MQTT live updates |
| `mqtt_broker` | str | `None` | MQTT WebSocket broker URL |
| `mqtt_topic` | str | `None` | MQTT topic to subscribe |
