/**
 * D3 Bridge — Contour & Density Plot Renderers
 * Topographic heatmaps and 2D kernel density estimation.
 */
(function () {
  var u = D3Bridge._;

  // ── Contour Plot ─────────────────────────────────────────
  D3Bridge.register("contour", function (containerId, config) {
    var data = config.data || [];
    var theme = config.theme || {};
    var animate = config.animate !== false;
    var duration = config.animationDuration || 750;

    if (!data.length) {
      d3.select("#" + containerId).append("div").attr("class", "d3b-empty").text("No data");
      return { svg: null, update: function () {}, destroy: function () {} };
    }

    var ctx = u.createSvg(containerId, config);
    var g = ctx.g;
    var iW = ctx.innerWidth;
    var iH = ctx.innerHeight;
    var tooltip = config.tooltip !== false ? u.createTooltip(containerId, theme) : null;

    // Scales
    var xScale = d3.scaleLinear()
      .domain(d3.extent(data, function (d) { return +d[config.x]; })).nice()
      .range([0, iW]);
    var yScale = d3.scaleLinear()
      .domain(d3.extent(data, function (d) { return +d[config.y]; })).nice()
      .range([iH, 0]);

    if (config.grid !== false) u.addGrid(g, xScale, yScale, iW, iH, theme);
    u.addAxes(g, xScale, yScale, iW, iH, config);

    // Build value grid if value field provided, otherwise use density
    var contourGen;
    if (config.value) {
      // Grid-based contours (requires regular grid data)
      var values = data.map(function (d) { return +d[config.value]; });
      var n = Math.ceil(Math.sqrt(data.length));
      contourGen = d3.contours()
        .size([n, n])
        .thresholds(config.thresholds || 10);

      var contours = contourGen(values);
      var palette = theme.palette || d3.schemeBlues[9];
      var colorFn = d3.scaleSequential()
        .domain(d3.extent(values))
        .interpolator(d3.interpolateRgbBasis(palette.slice(0, 5)));

      g.selectAll(".d3b-contour")
        .data(contours)
        .join("path")
        .attr("class", "d3b-contour")
        .attr("d", d3.geoPath(d3.geoIdentity().scale(iW / n).translate([0, 0])))
        .attr("fill", function (d) { return colorFn(d.value); })
        .attr("fill-opacity", 0.6)
        .attr("stroke", function (d) { return colorFn(d.value); })
        .attr("stroke-width", 0.5)
        .attr("opacity", animate ? 0 : 1);
    } else {
      // Use density estimation (d3-contour density)
      var density = d3.contourDensity()
        .x(function (d) { return xScale(+d[config.x]); })
        .y(function (d) { return yScale(+d[config.y]); })
        .size([iW, iH])
        .bandwidth(20)
        .thresholds(config.thresholds || 10)(data);

      var palette = theme.palette || d3.schemeBlues[9];
      var maxDensity = d3.max(density, function (d) { return d.value; });
      var colorFn = d3.scaleSequential()
        .domain([0, maxDensity])
        .interpolator(d3.interpolateRgbBasis(palette.slice(0, 5)));

      g.selectAll(".d3b-contour")
        .data(density)
        .join("path")
        .attr("class", "d3b-contour")
        .attr("d", d3.geoPath())
        .attr("fill", function (d) { return colorFn(d.value); })
        .attr("fill-opacity", 0.6)
        .attr("stroke", function (d) { return d3.color(colorFn(d.value)).darker(0.5); })
        .attr("stroke-width", 0.5)
        .attr("opacity", animate ? 0 : 1);
    }

    if (animate) {
      g.selectAll(".d3b-contour")
        .transition().duration(duration).ease(d3.easeCubicOut).attr("opacity", 1);
    }

    function update(newData) { config.data = newData; D3Bridge.destroy(containerId); D3Bridge.render(containerId, config); }
    function destroy() { if (tooltip) tooltip.remove(); }
    return { svg: ctx.svg, g: g, xScale: xScale, yScale: yScale, update: update, destroy: destroy };
  });

  // ── Density Plot ─────────────────────────────────────────
  D3Bridge.register("density", function (containerId, config) {
    var data = config.data || [];
    var theme = config.theme || {};
    var animate = config.animate !== false;
    var duration = config.animationDuration || 750;

    if (!data.length) {
      d3.select("#" + containerId).append("div").attr("class", "d3b-empty").text("No data");
      return { svg: null, update: function () {}, destroy: function () {} };
    }

    var ctx = u.createSvg(containerId, config);
    var g = ctx.g;
    var iW = ctx.innerWidth;
    var iH = ctx.innerHeight;
    var tooltip = config.tooltip !== false ? u.createTooltip(containerId, theme) : null;

    // Scales
    var xScale = d3.scaleLinear()
      .domain(d3.extent(data, function (d) { return +d[config.x]; })).nice()
      .range([0, iW]);
    var yScale = d3.scaleLinear()
      .domain(d3.extent(data, function (d) { return +d[config.y]; })).nice()
      .range([iH, 0]);

    if (config.grid !== false) u.addGrid(g, xScale, yScale, iW, iH, theme);
    u.addAxes(g, xScale, yScale, iW, iH, config);

    // Density estimation
    var density = d3.contourDensity()
      .x(function (d) { return xScale(+d[config.x]); })
      .y(function (d) { return yScale(+d[config.y]); })
      .size([iW, iH])
      .bandwidth(config.bandwidth || 20)
      .thresholds(config.thresholds || 20)(data);

    var palette = theme.palette || d3.schemeBlues[9];
    var maxDensity = d3.max(density, function (d) { return d.value; });
    var colorFn = d3.scaleSequential()
      .domain([0, maxDensity])
      .interpolator(d3.interpolateRgbBasis(palette.slice(0, 5)));

    // Clip path
    var clipId = u.uid("clip");
    g.append("defs").append("clipPath").attr("id", clipId)
      .append("rect").attr("width", iW).attr("height", iH);

    var chartArea = g.append("g").attr("clip-path", "url(#" + clipId + ")");

    // Density contours
    chartArea.selectAll(".d3b-density")
      .data(density)
      .join("path")
      .attr("class", "d3b-density")
      .attr("d", d3.geoPath())
      .attr("fill", function (d) { return colorFn(d.value); })
      .attr("fill-opacity", 0.5)
      .attr("stroke", function (d) { return d3.color(colorFn(d.value)).darker(0.3); })
      .attr("stroke-width", 0.3)
      .attr("opacity", animate ? 0 : 1);

    // Optional scatter points overlay
    if (config.showPoints) {
      chartArea.selectAll(".d3b-density-point")
        .data(data)
        .join("circle")
        .attr("class", "d3b-density-point")
        .attr("cx", function (d) { return xScale(+d[config.x]); })
        .attr("cy", function (d) { return yScale(+d[config.y]); })
        .attr("r", config.pointRadius || 2)
        .attr("fill", theme.palette ? theme.palette[0] : "#333")
        .attr("opacity", config.pointOpacity || 0.3)
        .on("mouseover", function (event, d) {
          if (!tooltip) return;
          tooltip.transition().duration(150).style("opacity", 1);
          tooltip.html(
            "<strong>" + config.x + ":</strong> " + u.formatValue(d[config.x]) +
            "<br><strong>" + config.y + ":</strong> " + u.formatValue(d[config.y])
          );
        })
        .on("mousemove", function (event) {
          if (tooltip) tooltip.style("left", event.pageX + 12 + "px").style("top", event.pageY - 20 + "px");
        })
        .on("mouseout", function () {
          if (tooltip) tooltip.transition().duration(300).style("opacity", 0);
        });
    }

    if (animate) {
      chartArea.selectAll(".d3b-density")
        .transition().duration(duration).ease(d3.easeCubicOut).attr("opacity", 1);
    }

    function update(newData) { config.data = newData; D3Bridge.destroy(containerId); D3Bridge.render(containerId, config); }
    function destroy() { if (tooltip) tooltip.remove(); }
    return { svg: ctx.svg, g: g, xScale: xScale, yScale: yScale, update: update, destroy: destroy };
  });
})();
