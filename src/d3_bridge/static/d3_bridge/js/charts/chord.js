/**
 * D3 Bridge — Chord Diagram Renderer
 * Visualizes flows/relationships between entities using a circular layout.
 */
D3Bridge.register("chord", function (containerId, config) {
  var u = D3Bridge._;
  var raw = config.data || {};
  var matrix = raw.matrix || [];
  var names = raw.names || [];
  var theme = config.theme || {};
  var animate = config.animate !== false;
  var duration = config.animationDuration || 750;

  if (!matrix.length) {
    d3.select("#" + containerId)
      .append("div")
      .attr("class", "d3b-empty")
      .text("No data");
    return { svg: null, update: function () {}, destroy: function () {} };
  }

  var ctx = u.createSvg(containerId, config);
  var radius = Math.min(ctx.innerWidth, ctx.innerHeight) / 2;
  var innerRadius = radius * (config.innerRadiusRatio || 0.9);
  var outerRadius = radius;

  var chartG = ctx.g
    .append("g")
    .attr(
      "transform",
      "translate(" + ctx.innerWidth / 2 + "," + ctx.innerHeight / 2 + ")"
    );

  var color = u.colorScale(theme, names);

  // Chord layout
  var chord = d3
    .chord()
    .padAngle(config.padAngle || 0.05)
    .sortSubgroups(d3.descending);

  if (config.directed) {
    chord.sortChords(d3.descending);
  }

  var chords = chord(matrix);

  // Arcs (outer ring)
  var arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);

  var tooltip =
    config.tooltip !== false ? u.createTooltip(containerId, theme) : null;

  var groups = chartG
    .selectAll(".d3b-chord-group")
    .data(chords.groups)
    .join("g")
    .attr("class", "d3b-chord-group");

  groups
    .append("path")
    .attr("d", arc)
    .attr("fill", function (d) {
      return color(names[d.index] || d.index);
    })
    .attr("stroke", "#fff")
    .attr("stroke-width", 1)
    .attr("opacity", animate ? 0 : 1)
    .on("mouseover", function (event, d) {
      // Fade non-related chords
      chartG
        .selectAll(".d3b-ribbon")
        .attr("opacity", function (r) {
          return r.source.index === d.index || r.target.index === d.index
            ? 0.8
            : 0.1;
        });
      if (!tooltip) return;
      tooltip.transition().duration(150).style("opacity", 1);
      tooltip.html(
        "<strong>" + (names[d.index] || d.index) + "</strong><br>" +
        "Total: " + u.formatValue(d.value)
      );
    })
    .on("mousemove", function (event) {
      if (!tooltip) return;
      tooltip
        .style("left", event.pageX + 12 + "px")
        .style("top", event.pageY - 20 + "px");
    })
    .on("mouseout", function () {
      chartG.selectAll(".d3b-ribbon").attr("opacity", 0.65);
      if (tooltip) tooltip.transition().duration(300).style("opacity", 0);
    });

  // Labels
  groups
    .append("text")
    .each(function (d) {
      d.angle = (d.startAngle + d.endAngle) / 2;
    })
    .attr("dy", "0.35em")
    .attr("transform", function (d) {
      return (
        "rotate(" + ((d.angle * 180) / Math.PI - 90) + ") " +
        "translate(" + (outerRadius + (config.labelOffset || 10)) + ")" +
        (d.angle > Math.PI ? " rotate(180)" : "")
      );
    })
    .attr("text-anchor", function (d) {
      return d.angle > Math.PI ? "end" : "start";
    })
    .attr("fill", theme.textColor || "#333")
    .attr("font-size", 11)
    .text(function (d) {
      return names[d.index] || d.index;
    });

  // Ribbons
  var ribbon = d3.ribbon().radius(innerRadius);

  chartG
    .selectAll(".d3b-ribbon")
    .data(chords)
    .join("path")
    .attr("class", "d3b-ribbon")
    .attr("d", ribbon)
    .attr("fill", function (d) {
      return color(names[d.source.index] || d.source.index);
    })
    .attr("stroke", "none")
    .attr("opacity", animate ? 0 : 0.65)
    .on("mouseover", function (event, d) {
      d3.select(this).attr("opacity", 0.9);
      if (!tooltip) return;
      tooltip.transition().duration(150).style("opacity", 1);
      tooltip.html(
        "<strong>" +
        (names[d.source.index] || d.source.index) +
        " → " +
        (names[d.target.index] || d.target.index) +
        "</strong><br>" +
        u.formatValue(d.source.value)
      );
    })
    .on("mousemove", function (event) {
      if (!tooltip) return;
      tooltip
        .style("left", event.pageX + 12 + "px")
        .style("top", event.pageY - 20 + "px");
    })
    .on("mouseout", function () {
      d3.select(this).attr("opacity", 0.65);
      if (tooltip) tooltip.transition().duration(300).style("opacity", 0);
    });

  // Animate
  if (animate) {
    groups
      .selectAll("path")
      .transition()
      .duration(duration)
      .ease(d3.easeCubicOut)
      .attr("opacity", 1);

    chartG
      .selectAll(".d3b-ribbon")
      .transition()
      .delay(duration * 0.3)
      .duration(duration)
      .ease(d3.easeCubicOut)
      .attr("opacity", 0.65);
  }

  function update(newData) {
    config.data = newData;
    D3Bridge.destroy(containerId);
    D3Bridge.render(containerId, config);
  }

  function destroy() {
    if (tooltip) tooltip.remove();
  }

  return { svg: ctx.svg, g: chartG, update: update, destroy: destroy };
});
