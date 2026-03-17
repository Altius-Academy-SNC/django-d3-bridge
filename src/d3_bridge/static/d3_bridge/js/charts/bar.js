/**
 * D3 Bridge — Bar Chart Renderer
 * Supports: vertical, horizontal, stacked, grouped, value labels, sorting.
 */
D3Bridge.register("bar", function (containerId, config) {
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

  // Sort data
  if (config.sort === "asc") {
    data.sort(function (a, b) { return d3.ascending(a[config.y], b[config.y]); });
  } else if (config.sort === "desc") {
    data.sort(function (a, b) { return d3.descending(a[config.y], b[config.y]); });
  }

  var isHorizontal = config.orientation === "horizontal";
  var ctx = u.createSvg(containerId, config);
  var g = ctx.g;
  var iW = ctx.innerWidth;
  var iH = ctx.innerHeight;

  // Detect if grouped/stacked
  var isGrouped = config.grouped && config.groupBy;
  var isStacked = config.stacked && config.groupBy;
  var categories = Array.from(new Set(data.map(function (d) { return d[config.x]; })));
  var groups = config.groupBy
    ? Array.from(new Set(data.map(function (d) { return d[config.groupBy]; })))
    : null;

  var color = u.colorScale(theme, groups || categories);
  var tooltip = config.tooltip !== false ? u.createTooltip(containerId, theme) : null;

  var xScale, yScale;

  if (isStacked && groups) {
    // ── Stacked bar ────────────────────────────────────────
    var stackedData = d3.rollups(
      data,
      function (v) {
        var obj = {};
        obj[config.x] = v[0][config.x];
        v.forEach(function (d) { obj[d[config.groupBy]] = d[config.y]; });
        return obj;
      },
      function (d) { return d[config.x]; }
    ).map(function (d) { return d[1]; });

    var stack = d3.stack().keys(groups);
    var series = stack(stackedData);

    xScale = d3.scaleBand().domain(categories).range([0, iW]).padding(config.barPadding || 0.2);
    var maxY = d3.max(series, function (s) { return d3.max(s, function (d) { return d[1]; }); });
    yScale = d3.scaleLinear().domain([0, maxY]).nice().range([iH, 0]);

    u.addGrid(g, xScale, yScale, iW, iH, theme);
    u.addAxes(g, xScale, yScale, iW, iH, config);

    g.selectAll(".d3b-series")
      .data(series)
      .join("g")
      .attr("class", "d3b-series")
      .attr("fill", function (d) { return color(d.key); })
      .selectAll("rect")
      .data(function (d) { return d; })
      .join("rect")
      .attr("x", function (d) { return xScale(d.data[config.x]); })
      .attr("width", xScale.bandwidth())
      .attr("rx", config.barRadius || 0)
      .attr("y", animate ? iH : function (d) { return yScale(d[1]); })
      .attr("height", animate ? 0 : function (d) { return yScale(d[0]) - yScale(d[1]); })
      .on("mouseover", function (event, d) {
        if (!tooltip) return;
        tooltip.transition().duration(150).style("opacity", 1);
        tooltip.html(
          "<strong>" + d.data[config.x] + "</strong><br>" +
          u.formatValue(d[1] - d[0])
        );
      })
      .on("mousemove", function (event) {
        if (!tooltip) return;
        tooltip.style("left", (event.pageX + 12) + "px").style("top", (event.pageY - 20) + "px");
      })
      .on("mouseout", function () {
        if (tooltip) tooltip.transition().duration(300).style("opacity", 0);
      });

    if (animate) {
      g.selectAll("rect")
        .transition()
        .duration(duration)
        .ease(d3.easeCubicOut)
        .attr("y", function (d) { return yScale(d[1]); })
        .attr("height", function (d) { return yScale(d[0]) - yScale(d[1]); });
    }

    u.addLegend(ctx.svg, color, groups, config);

  } else if (isGrouped && groups) {
    // ── Grouped bar ────────────────────────────────────────
    xScale = d3.scaleBand().domain(categories).range([0, iW]).padding(config.barPadding || 0.2);
    var x1 = d3.scaleBand().domain(groups).range([0, xScale.bandwidth()]).padding(0.05);
    var maxY = d3.max(data, function (d) { return d[config.y]; });
    yScale = d3.scaleLinear().domain([0, maxY]).nice().range([iH, 0]);

    u.addGrid(g, xScale, yScale, iW, iH, theme);
    u.addAxes(g, xScale, yScale, iW, iH, config);

    var catGroups = g.selectAll(".d3b-cat")
      .data(categories)
      .join("g")
      .attr("class", "d3b-cat")
      .attr("transform", function (d) { return "translate(" + xScale(d) + ",0)"; });

    catGroups
      .selectAll("rect")
      .data(function (cat) {
        return data.filter(function (d) { return d[config.x] === cat; });
      })
      .join("rect")
      .attr("x", function (d) { return x1(d[config.groupBy]); })
      .attr("width", x1.bandwidth())
      .attr("rx", config.barRadius || 0)
      .attr("fill", function (d) { return color(d[config.groupBy]); })
      .attr("y", animate ? iH : function (d) { return yScale(d[config.y]); })
      .attr("height", animate ? 0 : function (d) { return iH - yScale(d[config.y]); })
      .on("mouseover", function (event, d) {
        if (!tooltip) return;
        tooltip.transition().duration(150).style("opacity", 1);
        tooltip.html(
          "<strong>" + d[config.x] + " — " + d[config.groupBy] + "</strong><br>" +
          u.formatValue(d[config.y])
        );
      })
      .on("mousemove", function (event) {
        if (!tooltip) return;
        tooltip.style("left", (event.pageX + 12) + "px").style("top", (event.pageY - 20) + "px");
      })
      .on("mouseout", function () {
        if (tooltip) tooltip.transition().duration(300).style("opacity", 0);
      });

    if (animate) {
      catGroups
        .selectAll("rect")
        .transition()
        .duration(duration)
        .ease(d3.easeCubicOut)
        .attr("y", function (d) { return yScale(d[config.y]); })
        .attr("height", function (d) { return iH - yScale(d[config.y]); });
    }

    u.addLegend(ctx.svg, color, groups, config);

  } else {
    // ── Simple bar ─────────────────────────────────────────
    if (isHorizontal) {
      yScale = d3.scaleBand().domain(categories).range([0, iH]).padding(config.barPadding || 0.2);
      xScale = d3.scaleLinear()
        .domain([0, d3.max(data, function (d) { return d[config.y]; })])
        .nice()
        .range([0, iW]);

      u.addAxes(g, xScale, yScale, iW, iH, config);

      g.selectAll(".d3b-bar")
        .data(data)
        .join("rect")
        .attr("class", "d3b-bar")
        .attr("y", function (d) { return yScale(d[config.x]); })
        .attr("height", yScale.bandwidth())
        .attr("rx", config.barRadius || 0)
        .attr("fill", function (d, i) { return config.color || color(d[config.x]); })
        .attr("x", 0)
        .attr("width", animate ? 0 : function (d) { return xScale(d[config.y]); });

      if (animate) {
        g.selectAll(".d3b-bar")
          .transition()
          .duration(duration)
          .ease(d3.easeCubicOut)
          .attr("width", function (d) { return xScale(d[config.y]); });
      }

    } else {
      xScale = d3.scaleBand().domain(categories).range([0, iW]).padding(config.barPadding || 0.2);
      yScale = d3.scaleLinear()
        .domain([0, d3.max(data, function (d) { return d[config.y]; })])
        .nice()
        .range([iH, 0]);

      u.addGrid(g, xScale, yScale, iW, iH, theme);
      u.addAxes(g, xScale, yScale, iW, iH, config);

      g.selectAll(".d3b-bar")
        .data(data)
        .join("rect")
        .attr("class", "d3b-bar")
        .attr("x", function (d) { return xScale(d[config.x]); })
        .attr("width", xScale.bandwidth())
        .attr("rx", config.barRadius || 0)
        .attr("fill", function (d, i) { return config.color || color(d[config.x]); })
        .attr("y", animate ? iH : function (d) { return yScale(d[config.y]); })
        .attr("height", animate ? 0 : function (d) { return iH - yScale(d[config.y]); })
        .on("mouseover", function (event, d) {
          if (!tooltip) return;
          d3.select(this).attr("opacity", 0.8);
          tooltip.transition().duration(150).style("opacity", 1);
          tooltip.html(
            "<strong>" + d[config.x] + "</strong><br>" +
            (config.yLabel || config.y) + ": " + u.formatValue(d[config.y])
          );
        })
        .on("mousemove", function (event) {
          if (!tooltip) return;
          tooltip.style("left", (event.pageX + 12) + "px").style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", function () {
          d3.select(this).attr("opacity", 1);
          if (tooltip) tooltip.transition().duration(300).style("opacity", 0);
        });

      if (animate) {
        g.selectAll(".d3b-bar")
          .transition()
          .duration(duration)
          .ease(d3.easeCubicOut)
          .attr("y", function (d) { return yScale(d[config.y]); })
          .attr("height", function (d) { return iH - yScale(d[config.y]); });
      }

      // Value labels
      if (config.valueLabels) {
        g.selectAll(".d3b-val")
          .data(data)
          .join("text")
          .attr("class", "d3b-val")
          .attr("x", function (d) { return xScale(d[config.x]) + xScale.bandwidth() / 2; })
          .attr("y", function (d) { return yScale(d[config.y]) - 5; })
          .attr("text-anchor", "middle")
          .attr("fill", theme.textColor || "#333")
          .attr("font-size", 11)
          .text(function (d) { return u.formatValue(d[config.y]); })
          .attr("opacity", animate ? 0 : 1);

        if (animate) {
          g.selectAll(".d3b-val")
            .transition()
            .delay(duration * 0.6)
            .duration(300)
            .attr("opacity", 1);
        }
      }
    }
  }

  // ── Update method (for MQTT live) ────────────────────────
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
