/**
 * D3 Bridge — Scatter Plot Renderer
 * Supports: color-by field, size field, shapes, zoom, regression line,
 * fixed domains, background regions, connecting line, point labels,
 * per-point colour and shape.
 */
D3Bridge.register("scatter", function (containerId, config) {
  var u = D3Bridge._;
  var data = config.data || [];
  var theme = config.theme || {};
  var animate = config.animate !== false;
  var duration = config.animationDuration || 750;

  if (!data.length && !(config.regions && config.regions.length)) {
    return u.renderEmpty(containerId, config);
  }

  var ctx = u.createSvg(containerId, config);
  var g = ctx.g;
  var iW = ctx.innerWidth;
  var iH = ctx.innerHeight;

  function esc(v) {
    return String(v === null || v === undefined ? "" : v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // Scales — a fixed domain keeps a matrix stable; otherwise the data extent.
  var xScale = d3.scaleLinear().range([0, iW]);
  if (config.xDomain) {
    xScale.domain(config.xDomain);
  } else {
    xScale.domain(d3.extent(data, function (d) { return +d[config.x]; })).nice();
  }

  var yScale = d3.scaleLinear().range([iH, 0]);
  if (config.yDomain) {
    yScale.domain(config.yDomain);
  } else {
    yScale.domain(d3.extent(data, function (d) { return +d[config.y]; })).nice();
  }

  // Color
  var colorDomain = config.colorBy
    ? Array.from(new Set(data.map(function (d) { return d[config.colorBy]; })))
    : null;
  var color = colorDomain ? u.colorScale(theme, colorDomain) : null;
  var defaultFill = theme.palette ? theme.palette[0] : "#4e79a7";

  function fillOf(d) {
    if (config.colorField && d[config.colorField]) return u.resolveColor(d[config.colorField]);
    if (color && config.colorBy) return color(d[config.colorBy]);
    return defaultFill;
  }

  // Size scale
  var sizeScale = null;
  if (typeof config.size === "string") {
    sizeScale = d3
      .scaleSqrt()
      .domain(d3.extent(data, function (d) { return +d[config.size]; }))
      .range([3, 20]);
  }

  function radius(d) {
    return sizeScale ? sizeScale(+d[config.size]) : (config.size || 5);
  }

  // Clip path
  var clipId = u.uid("clip");
  g.append("defs")
    .append("clipPath")
    .attr("id", clipId)
    .append("rect")
    .attr("width", iW)
    .attr("height", iH);

  // Background regions, behind the grid and the points
  var regionLayer = g.append("g").attr("class", "d3b-regions").attr("clip-path", "url(#" + clipId + ")");
  var regions = config.regions || [];
  var regionRects = regionLayer
    .selectAll(".d3b-region")
    .data(regions)
    .join("rect")
    .attr("class", "d3b-region")
    .attr("fill", function (r) { return u.resolveColor(r.color || defaultFill); })
    .attr("opacity", function (r) { return r.opacity !== undefined ? r.opacity : 0.12; });
  var regionLabels = regionLayer
    .selectAll(".d3b-region-label")
    .data(regions.filter(function (r) { return r.label; }))
    .join("text")
    .attr("class", "d3b-region-label")
    .attr("fill", function (r) { return u.resolveColor(r.color || theme.textColor || "#333"); })
    .attr("font-weight", 600)
    .attr("font-size", 11)
    .text(function (r) { return r.label; });

  // Grid
  if (config.grid !== false) {
    u.addGrid(g, xScale, yScale, iW, iH, theme);
  }

  // Axes
  u.addAxes(g, xScale, yScale, iW, iH, config);

  // Tooltip
  var tooltip =
    config.tooltip !== false ? u.createTooltip(containerId, theme) : null;
  var labels = config.fieldLabels || {};
  function nameOf(field) { return labels[field] || field; }
  function tooltipHtml(d) {
    var fields = Array.isArray(config.tooltip)
      ? config.tooltip
      : [config.x, config.y].concat(config.colorBy ? [config.colorBy] : []);
    return fields
      .filter(function (f) { return d[f] !== undefined && d[f] !== null && d[f] !== ""; })
      .map(function (f) {
        return "<strong>" + esc(nameOf(f)) + ":</strong> " + esc(u.formatValue(d[f]));
      })
      .join("<br>");
  }

  var chartArea = g.append("g").attr("clip-path", "url(#" + clipId + ")");

  // Connecting line (a trajectory), under the points
  var pathLine = null;
  if (config.connect) {
    var joined = typeof config.connect === "string"
      ? data.filter(function (d) { return !!d[config.connect]; })
      : data;
    pathLine = chartArea
      .append("path")
      .datum(joined)
      .attr("class", "d3b-connect")
      .attr("fill", "none")
      .attr("stroke", theme.axisColor || "#666")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "4,3")
      .attr("opacity", animate ? 0 : 0.7);
  }

  // Points — circles, or symbols when a shape is asked for
  var useSymbols = !!config.shapeField || (config.shape && config.shape !== "circle");
  var SYMBOLS = {
    circle: d3.symbolCircle, square: d3.symbolSquare, cross: d3.symbolCross,
    x: d3.symbolCross, diamond: d3.symbolDiamond, triangle: d3.symbolTriangle,
    star: d3.symbolStar, wye: d3.symbolWye,
  };
  function shapeOf(d) {
    var name = (config.shapeField && d[config.shapeField]) || config.shape || "circle";
    return SYMBOLS[name] ? name : "circle";
  }
  function symbolPath(d, scale) {
    var r = radius(d) * scale;
    return d3.symbol().type(SYMBOLS[shapeOf(d)]).size(Math.PI * r * r * 1.3)();
  }

  var points = chartArea
    .selectAll(".d3b-point")
    .data(data)
    .join(useSymbols ? "path" : "circle")
    .attr("class", "d3b-point")
    .attr("fill", fillOf)
    .attr("opacity", config.opacity || 0.7)
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.5);

  if (useSymbols) {
    points.attr("d", function (d) { return symbolPath(d, animate ? 0.01 : 1); });
  } else {
    points.attr("r", animate ? 0 : radius);
  }

  points
    .on("mouseover", function (event, d) {
      d3.select(this).attr("opacity", 1).attr("stroke-width", 2);
      if (!tooltip) return;
      tooltip.transition().duration(150).style("opacity", 1);
      tooltip.html(tooltipHtml(d));
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

  // Point labels: inside a large point, beside a small one
  var pointLabels = null;
  if (config.label) {
    pointLabels = chartArea
      .selectAll(".d3b-point-label")
      .data(data)
      .join("text")
      .attr("class", "d3b-point-label")
      .attr("font-size", 10)
      .attr("font-weight", 600)
      .attr("pointer-events", "none")
      .attr("dy", "0.35em")
      .attr("text-anchor", function (d) { return radius(d) >= 8 ? "middle" : "start"; })
      .attr("fill", function (d) { return radius(d) >= 8 ? "#fff" : (theme.textColor || "#333"); })
      .text(function (d) { return d[config.label]; });
  }

  // Positions — shared by the first render and the zoom
  function place(xs, ys) {
    regionRects
      .attr("x", function (r) { return xs(Math.min(r.x0, r.x1)); })
      .attr("y", function (r) { return ys(Math.max(r.y0, r.y1)); })
      .attr("width", function (r) { return Math.abs(xs(r.x1) - xs(r.x0)); })
      .attr("height", function (r) { return Math.abs(ys(r.y0) - ys(r.y1)); });
    regionLabels
      .attr("x", function (r) { return xs(Math.min(r.x0, r.x1)) + 6; })
      .attr("y", function (r) { return ys(Math.max(r.y0, r.y1)) + 14; });
    if (useSymbols) {
      points.attr("transform", function (d) {
        var t = "translate(" + xs(+d[config.x]) + "," + ys(+d[config.y]) + ")";
        return shapeOf(d) === "x" ? t + " rotate(45)" : t;
      });
    } else {
      points
        .attr("cx", function (d) { return xs(+d[config.x]); })
        .attr("cy", function (d) { return ys(+d[config.y]); });
    }
    if (pointLabels) {
      pointLabels
        .attr("x", function (d) {
          return xs(+d[config.x]) + (radius(d) >= 8 ? 0 : radius(d) + 3);
        })
        .attr("y", function (d) { return ys(+d[config.y]); });
    }
    if (pathLine) {
      pathLine.attr("d", d3.line()
        .x(function (d) { return xs(+d[config.x]); })
        .y(function (d) { return ys(+d[config.y]); }));
    }
  }
  place(xScale, yScale);

  // Animate
  if (animate) {
    var grow = points.transition().duration(duration).ease(d3.easeCubicOut);
    if (useSymbols) {
      grow.attr("d", function (d) { return symbolPath(d, 1); });
    } else {
      grow.attr("r", radius);
    }
    if (pathLine) {
      pathLine.transition().delay(duration * 0.5).duration(400).attr("opacity", 0.7);
    }
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
        place(newX, newY);
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
