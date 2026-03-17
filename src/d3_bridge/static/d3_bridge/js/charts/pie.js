/**
 * D3 Bridge — Pie & Donut Chart Renderer
 * Supports: inner radius (donut), pad angle, corner radius, labels, sorting.
 */
D3Bridge.register("pie", function (containerId, config) {
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
  var radius = Math.min(ctx.innerWidth, ctx.innerHeight) / 2;
  var innerRadius =
    typeof config.innerRadius === "number" && config.innerRadius < 1
      ? radius * config.innerRadius
      : config.innerRadius || 0;

  var chartG = ctx.g
    .append("g")
    .attr(
      "transform",
      "translate(" + ctx.innerWidth / 2 + "," + ctx.innerHeight / 2 + ")"
    );

  var color = u.colorScale(
    theme,
    data.map(function (d) { return d[config.label]; })
  );

  // Pie layout
  var pieLayout = d3
    .pie()
    .value(function (d) { return +d[config.value]; })
    .padAngle(config.padAngle || 0.02);

  if (config.sort === "asc") {
    pieLayout.sort(function (a, b) { return d3.ascending(a[config.value], b[config.value]); });
  } else if (config.sort === "desc") {
    pieLayout.sort(function (a, b) { return d3.descending(a[config.value], b[config.value]); });
  } else {
    pieLayout.sort(null);
  }

  var arcGen = d3
    .arc()
    .innerRadius(innerRadius)
    .outerRadius(radius)
    .cornerRadius(config.cornerRadius || 4);

  var labelArc = d3
    .arc()
    .innerRadius(radius * 0.7)
    .outerRadius(radius * 0.7);

  var tooltip =
    config.tooltip !== false ? u.createTooltip(containerId, theme) : null;

  var arcs = pieLayout(data);
  var total = d3.sum(data, function (d) { return +d[config.value]; });

  // Slices
  var slices = chartG
    .selectAll(".d3b-slice")
    .data(arcs)
    .join("path")
    .attr("class", "d3b-slice")
    .attr("fill", function (d) { return color(d.data[config.label]); })
    .attr("stroke", theme.background === "transparent" ? "#fff" : theme.background)
    .attr("stroke-width", 1.5)
    .style("cursor", "pointer")
    .on("mouseover", function (event, d) {
      d3.select(this)
        .transition()
        .duration(150)
        .attr(
          "transform",
          "translate(" +
            d3.arc().innerRadius(0).outerRadius(8).centroid(d) +
            ")"
        );
      if (!tooltip) return;
      var pct = ((d.data[config.value] / total) * 100).toFixed(1);
      tooltip.transition().duration(150).style("opacity", 1);
      tooltip.html(
        "<strong>" + d.data[config.label] + "</strong><br>" +
        u.formatValue(d.data[config.value]) + " (" + pct + "%)"
      );
    })
    .on("mousemove", function (event) {
      if (!tooltip) return;
      tooltip
        .style("left", event.pageX + 12 + "px")
        .style("top", event.pageY - 20 + "px");
    })
    .on("mouseout", function () {
      d3.select(this)
        .transition()
        .duration(150)
        .attr("transform", "translate(0,0)");
      if (tooltip) tooltip.transition().duration(300).style("opacity", 0);
    });

  // Animate slices
  if (animate) {
    slices
      .transition()
      .duration(duration)
      .ease(d3.easeCubicOut)
      .attrTween("d", function (d) {
        var interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return function (t) { return arcGen(interpolate(t)); };
      });
  } else {
    slices.attr("d", arcGen);
  }

  // Labels
  if (config.labelType && config.labelType !== "none") {
    var labels = chartG
      .selectAll(".d3b-pie-label")
      .data(arcs)
      .join("text")
      .attr("class", "d3b-pie-label")
      .attr("transform", function (d) {
        return "translate(" + labelArc.centroid(d) + ")";
      })
      .attr("text-anchor", "middle")
      .attr("fill", theme.textColor || "#333")
      .attr("font-size", 11)
      .attr("opacity", animate ? 0 : 1);

    if (config.labelType === "percent") {
      labels.text(function (d) {
        var pct = ((d.data[config.value] / total) * 100).toFixed(0);
        return pct > 4 ? pct + "%" : "";
      });
    } else if (config.labelType === "value") {
      labels.text(function (d) { return u.formatValue(d.data[config.value]); });
    } else if (config.labelType === "label") {
      labels.text(function (d) { return d.data[config.label]; });
    }

    if (animate) {
      labels
        .transition()
        .delay(duration * 0.7)
        .duration(300)
        .attr("opacity", 1);
    }
  }

  // Legend
  u.addLegend(
    ctx.svg,
    color,
    data.map(function (d) { return d[config.label]; }),
    config
  );

  // Center text for donut
  if (innerRadius > 0 && config.title) {
    chartG
      .append("text")
      .attr("class", "d3b-donut-center")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("fill", theme.textColor || "#333")
      .attr("font-size", 14)
      .attr("font-weight", 600)
      .text(u.formatValue(total));
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
    g: chartG,
    update: update,
    destroy: destroy,
  };
});
