"""django-d3-bridge — Declarative D3.js visualizations for Django."""

__version__ = "0.3.0"

default_app_config = "d3_bridge.apps.D3BridgeConfig"

from d3_bridge.charts import (  # noqa: F401
    AreaChart,
    BarChart,
    BubbleMap,
    ChordDiagram,
    ChoroplethMap,
    ContourPlot,
    Dendrogram,
    DensityPlot,
    DonutChart,
    ForceGraph,
    LineChart,
    PackCircle,
    PieChart,
    Sankey,
    ScatterPlot,
    Sunburst,
    TreeDiagram,
    Treemap,
    VoronoiDiagram,
)
from d3_bridge.core import Chart  # noqa: F401
