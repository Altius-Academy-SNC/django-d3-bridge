/**
 * D3 Bridge — Scatter Plot Renderer
 * Supports: color-by field, size field, shapes, zoom, regression line.
 */
D3Bridge.register("scatter", function (containerId, config) {
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

  // Color
  var colorDomain = config.colorBy
    ? Array.from(new Set(data.map(function (d) { return d[config.colorBy]; })))
    : null;
  var color = colorDomain ? u.colorScale(theme, colorDomain) : null;

  // Size scale
  var sizeScale = null;
  if (typeof config.size === "string") {
    sizeScale = d3
      .scaleSqrt()
      .domain(d3.extent(data, function (d) { return +d[config.size]; }))
      .range([3, 20]);
  }

  // Grid
  if (config.grid !== false) {
    u.addGrid(g, xScale, yScale, iW, iH, theme);
  }

  // Axes
  u.addAxes(g, xScale, yScale, iW, iH, config);

  // Tooltip
  var tooltip =
    config.tooltip !== false ? u.createTooltip(containerId, theme) : null;

  // Clip path
  var clipId = u.uid("clip");
  g.append("defs")
    .append("clipPath")
    .attr("id", clipId)
    .append("rect")
    .attr("width", iW)
    .attr("height", iH);

  var chartArea = g.append("g").attr("clip-path", "url(#" + clipId + ")");

  // Points
  var points = chartArea
    .selectAll(".d3b-point")
    .data(data)
    .join("circle")
    .attr("class", "d3b-point")
    .attr("cx", function (d) { return xScale(+d[config.x]); })
    .attr("cy", function (d) { return yScale(+d[config.y]); })
    .attr("fill", function (d) {
      if (color && config.colorBy) return color(d[config.colorBy]);
      return theme.palette ? theme.palette[0] : "#4e79a7";
    })
    .attr("opacity", config.opacity || 0.7)
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.5)
    .attr("r", animate ? 0 : function (d) {
      return sizeScale ? sizeScale(+d[config.size]) : (config.size || 5);
    })
    .on("mouseover", function (event, d) {
      d3.select(this).attr("opacity", 1).attr("stroke-width", 2);
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
      if (!tooltip) return;
      tooltip
        .style("left", event.pageX + 12 + "px")
        .style("top", event.pageY - 20 + "px");
    })
    .on("mouseout", function () {
      d3.select(this)
        .attr("opacity", config.opacity || 0.7)
        .attr("stroke-width", 0.5);
      if (tooltip) tooltip.transition().duration(300).style("opacity", 0);
    });

  // Animate
  if (animate) {
    points
      .transition()
      .duration(duration)
      .ease(d3.easeCubicOut)
      .attr("r", function (d) {
        return sizeScale ? sizeScale(+d[config.size]) : (config.size || 5);
      });
  }

  // Linear regression
  if (config.regression === "linear") {
    var xMean = d3.mean(data, function (d) { return +d[config.x]; });
    var yMean = d3.mean(data, function (d) { return +d[config.y]; });
    var num = d3.sum(data, function (d) {
      return (+d[config.x] - xMean) * (+d[config.y] - yMean);
    });
    var den = d3.sum(data, function (d) {
      return (+d[config.x] - xMean) * (+d[config.x] - xMean);
    });
    var slope = den ? num / den : 0;
    var intercept = yMean - slope * xMean;

    var xExtent = d3.extent(data, function (d) { return +d[config.x]; });
    chartArea
      .append("line")
      .attr("class", "d3b-regression")
      .attr("x1", xScale(xExtent[0]))
      .attr("y1", yScale(slope * xExtent[0] + intercept))
      .attr("x2", xScale(xExtent[1]))
      .attr("y2", yScale(slope * xExtent[1] + intercept))
      .attr("stroke", theme.palette ? theme.palette[1] : "#e15759")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "6,3")
      .attr("opacity", animate ? 0 : 0.8);

    if (animate) {
      chartArea
        .select(".d3b-regression")
        .transition()
        .delay(duration * 0.5)
        .duration(400)
        .attr("opacity", 0.8);
    }
  }

  // Legend
  if (colorDomain) {
    u.addLegend(ctx.svg, color, colorDomain, config);
  }

  // Zoom
  if (config.zoom) {
    var zoom = d3
      .zoom()
      .scaleExtent([0.5, 20])
      .on("zoom", function (event) {
        var newX = event.transform.rescaleX(xScale);
        var newY = event.transform.rescaleY(yScale);
        chartArea
          .selectAll(".d3b-point")
          .attr("cx", function (d) { return newX(+d[config.x]); })
          .attr("cy", function (d) { return newY(+d[config.y]); });
        g.select(".d3b-axis-x").call(d3.axisBottom(newX));
        g.select(".d3b-axis-y").call(d3.axisLeft(newY));
      });
    ctx.svg.call(zoom);
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
    xScale: xScale,
    yScale: yScale,
    update: update,
    destroy: destroy,
  };
});
