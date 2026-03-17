/**
 * D3 Bridge — Line & Area Chart Renderer
 * Supports: multi-series, time axis, area fill, dots, zoom, curves.
 */
(function () {
  function renderLine(containerId, config) {
    var u = D3Bridge._;
    var data = config.data || [];
    var theme = config.theme || {};
    var animate = config.animate !== false;
    var duration = config.animationDuration || 750;
    var isArea = config.type === "area";

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

    // Detect time axis
    var isTime =
      config.xType === "time" || (config.xType === "auto" && u.isDateField(data, config.x));

    // Parse dates if time axis
    if (isTime) {
      var parseTime = d3.isoParse;
      data.forEach(function (d) {
        if (typeof d[config.x] === "string") {
          d[config.x] = parseTime(d[config.x]);
        }
      });
    }

    // Split into series
    var seriesField = config.series;
    var seriesNames;
    var seriesData;

    if (seriesField) {
      seriesNames = Array.from(new Set(data.map(function (d) { return d[seriesField]; })));
      seriesData = seriesNames.map(function (name) {
        return {
          name: name,
          values: data.filter(function (d) { return d[seriesField] === name; }),
        };
      });
    } else {
      seriesNames = [config.y];
      seriesData = [{ name: config.y, values: data }];
    }

    var color = u.colorScale(theme, seriesNames);

    // Scales
    var xScale = isTime
      ? d3
          .scaleTime()
          .domain(d3.extent(data, function (d) { return d[config.x]; }))
          .range([0, iW])
      : d3
          .scaleLinear()
          .domain(d3.extent(data, function (d) { return +d[config.x]; }))
          .range([0, iW]);

    var yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, function (d) { return +d[config.y]; }) * 1.05])
      .nice()
      .range([iH, 0]);

    // Grid
    if (config.grid !== false) {
      u.addGrid(g, xScale, yScale, iW, iH, theme);
    }

    // Axes
    u.addAxes(g, xScale, yScale, iW, iH, config);

    // Curve type
    var curveMap = {
      curveLinear: d3.curveLinear,
      curveMonotoneX: d3.curveMonotoneX,
      curveBasis: d3.curveBasis,
      curveCardinal: d3.curveCardinal,
      curveStep: d3.curveStep,
      curveCatmullRom: d3.curveCatmullRom,
      curveNatural: d3.curveNatural,
    };
    var curveType = curveMap[config.curve] || d3.curveMonotoneX;

    // Line generator
    var lineGen = d3
      .line()
      .defined(function (d) { return d[config.y] != null; })
      .x(function (d) { return xScale(isTime ? d[config.x] : +d[config.x]); })
      .y(function (d) { return yScale(+d[config.y]); })
      .curve(curveType);

    // Area generator (for area charts or fill)
    var areaGen = null;
    if (isArea || config.fill) {
      areaGen = d3
        .area()
        .defined(function (d) { return d[config.y] != null; })
        .x(function (d) { return xScale(isTime ? d[config.x] : +d[config.x]); })
        .y0(iH)
        .y1(function (d) { return yScale(+d[config.y]); })
        .curve(curveType);
    }

    // Tooltip
    var tooltip =
      config.tooltip !== false ? u.createTooltip(containerId, theme) : null;

    // Clip path for zoom
    var clipId = u.uid("clip");
    g.append("defs")
      .append("clipPath")
      .attr("id", clipId)
      .append("rect")
      .attr("width", iW)
      .attr("height", iH);

    var chartArea = g.append("g").attr("clip-path", "url(#" + clipId + ")");

    // Render each series
    seriesData.forEach(function (series, si) {
      var seriesColor = config.color || color(series.name);

      // Area fill
      if (areaGen) {
        chartArea
          .append("path")
          .datum(series.values)
          .attr("class", "d3b-area")
          .attr("fill", seriesColor)
          .attr("fill-opacity", config.fillOpacity || 0.15)
          .attr("d", areaGen);
      }

      // Line path
      var path = chartArea
        .append("path")
        .datum(series.values)
        .attr("class", "d3b-line")
        .attr("fill", "none")
        .attr("stroke", seriesColor)
        .attr("stroke-width", config.strokeWidth || 2)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("d", lineGen);

      // Animate line drawing
      if (animate) {
        var totalLength = path.node().getTotalLength();
        path
          .attr("stroke-dasharray", totalLength)
          .attr("stroke-dashoffset", totalLength)
          .transition()
          .duration(duration)
          .ease(d3.easeCubicOut)
          .attr("stroke-dashoffset", 0);
      }

      // Dots
      if (config.dots !== false) {
        chartArea
          .selectAll(".d3b-dot-" + si)
          .data(series.values.filter(function (d) { return d[config.y] != null; }))
          .join("circle")
          .attr("class", "d3b-dot d3b-dot-" + si)
          .attr("cx", function (d) {
            return xScale(isTime ? d[config.x] : +d[config.x]);
          })
          .attr("cy", function (d) { return yScale(+d[config.y]); })
          .attr("r", config.dotRadius || 4)
          .attr("fill", seriesColor)
          .attr("stroke", "#fff")
          .attr("stroke-width", 1.5)
          .attr("opacity", animate ? 0 : 1)
          .on("mouseover", function (event, d) {
            if (!tooltip) return;
            d3.select(this).attr("r", (config.dotRadius || 4) + 2);
            tooltip.transition().duration(150).style("opacity", 1);
            var label = seriesField ? series.name + "<br>" : "";
            tooltip.html(
              label +
              "<strong>" + config.x + ":</strong> " + u.formatValue(d[config.x]) + "<br>" +
              "<strong>" + config.y + ":</strong> " + u.formatValue(d[config.y])
            );
          })
          .on("mousemove", function (event) {
            if (!tooltip) return;
            tooltip
              .style("left", event.pageX + 12 + "px")
              .style("top", event.pageY - 20 + "px");
          })
          .on("mouseout", function () {
            d3.select(this).attr("r", config.dotRadius || 4);
            if (tooltip)
              tooltip.transition().duration(300).style("opacity", 0);
          });

        if (animate) {
          chartArea
            .selectAll(".d3b-dot-" + si)
            .transition()
            .delay(duration * 0.7)
            .duration(300)
            .attr("opacity", 1);
        }
      }
    });

    // Legend
    if (seriesField) {
      u.addLegend(ctx.svg, color, seriesNames, config);
    }

    // Zoom
    if (config.zoom) {
      var zoom = d3
        .zoom()
        .scaleExtent([1, 10])
        .translateExtent([
          [0, 0],
          [iW, iH],
        ])
        .on("zoom", function (event) {
          var newX = event.transform.rescaleX(xScale);
          chartArea.selectAll(".d3b-line").attr(
            "d",
            d3
              .line()
              .defined(function (d) { return d[config.y] != null; })
              .x(function (d) { return newX(isTime ? d[config.x] : +d[config.x]); })
              .y(function (d) { return yScale(+d[config.y]); })
              .curve(curveType)
          );
          chartArea
            .selectAll(".d3b-dot")
            .attr("cx", function (d) { return newX(isTime ? d[config.x] : +d[config.x]); });
          g.select(".d3b-axis-x").call(d3.axisBottom(newX));
        });

      ctx.svg.call(zoom);
    }

    // ── Update method (for MQTT live) ──────────────────────
    function update(newPoint) {
      if (!newPoint) return;
      data.push(newPoint);

      // Sliding window
      if (config.mqtt && config.mqtt.window && data.length > config.mqtt.window) {
        data.shift();
      }

      config.data = data;
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
      data: data,
      update: update,
      destroy: destroy,
    };
  }

  D3Bridge.register("line", renderLine);
  D3Bridge.register("area", renderLine);
})();
