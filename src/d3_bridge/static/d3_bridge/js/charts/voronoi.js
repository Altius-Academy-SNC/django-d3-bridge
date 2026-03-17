/**
 * D3 Bridge — Voronoi Diagram Renderer
 * Spatial partitioning with optional Delaunay triangulation overlay.
 */
D3Bridge.register("voronoi", function (containerId, config) {
  var u = D3Bridge._;
  var data = config.data || [];
  var theme = config.theme || {};
  var animate = config.animate !== false;
  var duration = config.animationDuration || 750;

  if (!data.length) {
    d3.select("#" + containerId)
      .append("div")
      .attr("class", "d3b-empty")
      .text("No data");
    return { svg: null, update: function () {}, destroy: function () {} };
  }

  var ctx = u.createSvg(containerId, config);
  var g = ctx.g;
  var iW = ctx.innerWidth;
  var iH = ctx.innerHeight;
  var tooltip =
    config.tooltip !== false ? u.createTooltip(containerId, theme) : null;

  // Scales
  var xScale = d3
    .scaleLinear()
    .domain(d3.extent(data, function (d) { return +d[config.x]; }))
    .nice()
    .range([0, iW]);
  var yScale = d3
    .scaleLinear()
    .domain(d3.extent(data, function (d) { return +d[config.y]; }))
    .nice()
    .range([iH, 0]);

  u.addAxes(g, xScale, yScale, iW, iH, config);

  // Compute Delaunay/Voronoi
  var points = data.map(function (d) {
    return [xScale(+d[config.x]), yScale(+d[config.y])];
  });
  var delaunay = d3.Delaunay.from(points);
  var voronoi = delaunay.voronoi([0, 0, iW, iH]);

  // Color
  var colorDomain = config.colorBy
    ? Array.from(new Set(data.map(function (d) { return d[config.colorBy]; })))
    : null;
  var color = colorDomain ? u.colorScale(theme, colorDomain) : null;

  // Clip path
  var clipId = u.uid("clip");
  g.append("defs")
    .append("clipPath")
    .attr("id", clipId)
    .append("rect")
    .attr("width", iW)
    .attr("height", iH);

  var chartArea = g.append("g").attr("clip-path", "url(#" + clipId + ")");

  // Voronoi cells
  chartArea
    .selectAll(".d3b-voronoi-cell")
    .data(data)
    .join("path")
    .attr("class", "d3b-voronoi-cell")
    .attr("d", function (d, i) {
      return voronoi.renderCell(i);
    })
    .attr("fill", function (d, i) {
      if (color && config.colorBy) return color(d[config.colorBy]);
      var palette = theme.palette || d3.schemeTableau10;
      return palette[i % palette.length];
    })
    .attr("fill-opacity", config.cellOpacity || 0.3)
    .attr("stroke", config.strokeColor || "#666")
    .attr("stroke-width", config.strokeWidth || 0.5)
    .attr("opacity", animate ? 0 : 1)
    .on("mouseover", function (event, d) {
      d3.select(this).attr("fill-opacity", (config.cellOpacity || 0.3) + 0.3);
      if (!tooltip) return;
      tooltip.transition().duration(150).style("opacity", 1);
      var html =
        "<strong>" + config.x + ":</strong> " + u.formatValue(d[config.x]) +
        "<br><strong>" + config.y + ":</strong> " + u.formatValue(d[config.y]);
      if (config.colorBy) {
        html += "<br><strong>" + config.colorBy + ":</strong> " + d[config.colorBy];
      }
      tooltip.html(html);
    })
    .on("mousemove", function (event) {
      if (tooltip)
        tooltip
          .style("left", event.pageX + 12 + "px")
          .style("top", event.pageY - 20 + "px");
    })
    .on("mouseout", function () {
      d3.select(this).attr("fill-opacity", config.cellOpacity || 0.3);
      if (tooltip) tooltip.transition().duration(300).style("opacity", 0);
    });

  // Delaunay triangulation overlay
  if (config.showDelaunay) {
    chartArea
      .append("path")
      .attr("class", "d3b-delaunay")
      .attr("d", delaunay.render())
      .attr("fill", "none")
      .attr("stroke", theme.gridColor || "#999")
      .attr("stroke-width", 0.3)
      .attr("stroke-opacity", 0.5);
  }

  // Points
  if (config.showPoints !== false) {
    chartArea
      .selectAll(".d3b-voronoi-point")
      .data(data)
      .join("circle")
      .attr("class", "d3b-voronoi-point")
      .attr("cx", function (d) { return xScale(+d[config.x]); })
      .attr("cy", function (d) { return yScale(+d[config.y]); })
      .attr("r", config.pointRadius || 4)
      .attr("fill", function (d) {
        if (color && config.colorBy) return color(d[config.colorBy]);
        return theme.palette ? theme.palette[0] : "#333";
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 1);
  }

  // Animate
  if (animate) {
    chartArea
      .selectAll(".d3b-voronoi-cell")
      .transition()
      .duration(duration)
      .ease(d3.easeCubicOut)
      .attr("opacity", 1);
  }

  // Legend
  if (colorDomain) {
    u.addLegend(ctx.svg, color, colorDomain, config);
  }

  function update(newData) {
    config.data = newData;
    D3Bridge.destroy(containerId);
    D3Bridge.render(containerId, config);
  }

  function destroy() {
    if (tooltip) tooltip.remove();
  }

  return {
    svg: ctx.svg,
    g: g,
    delaunay: delaunay,
    voronoi: voronoi,
    xScale: xScale,
    yScale: yScale,
    update: update,
    destroy: destroy,
  };
});
