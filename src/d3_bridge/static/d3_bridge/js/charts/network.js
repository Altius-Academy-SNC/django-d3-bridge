/**
 * D3 Bridge — Network Renderers (Force Graph & Sankey)
 * Supports: force simulation, drag, zoom, node groups, link values.
 */
(function () {
  // ── Force-directed Graph ─────────────────────────────────
  D3Bridge.register("force", function (containerId, config) {
    var u = D3Bridge._;
    var graphData = config.data || { nodes: [], links: [] };
    var theme = config.theme || {};
    var animate = config.animate !== false;

    if (!graphData.nodes.length) {
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

    // Deep copy to avoid mutation
    var nodes = graphData.nodes.map(function (d) { return Object.assign({}, d); });
    var links = graphData.links.map(function (d) { return Object.assign({}, d); });

    // Color by group
    var groups = config.nodeGroup
      ? Array.from(new Set(nodes.map(function (n) { return n[config.nodeGroup]; })))
      : null;
    var color = groups ? u.colorScale(theme, groups) : null;

    // Node size
    var nodeSizeScale = null;
    if (typeof config.nodeSize === "string") {
      nodeSizeScale = d3
        .scaleSqrt()
        .domain(d3.extent(nodes, function (n) { return +n[config.nodeSize]; }))
        .range([4, 20]);
    }

    // Force simulation
    var simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id(function (d) { return d[config.nodeId]; })
          .distance(config.linkDistance || 80)
      )
      .force("charge", d3.forceManyBody().strength(config.chargeStrength || -200))
      .force("center", d3.forceCenter(iW / 2, iH / 2))
      .force("collision", d3.forceCollide().radius(function (d) {
        var r = nodeSizeScale ? nodeSizeScale(+d[config.nodeSize]) : (config.nodeSize || 8);
        return r + 2;
      }));

    var tooltip =
      config.tooltip !== false ? u.createTooltip(containerId, theme) : null;

    // Links
    var linkElements = g
      .append("g")
      .attr("class", "d3b-links")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", theme.gridColor || "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", function (d) {
        return config.linkValue && d[config.linkValue]
          ? Math.sqrt(d[config.linkValue])
          : 1.5;
      });

    // Nodes
    var nodeElements = g
      .append("g")
      .attr("class", "d3b-nodes")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", function (d) {
        return nodeSizeScale
          ? nodeSizeScale(+d[config.nodeSize])
          : (typeof config.nodeSize === "number" ? config.nodeSize : 8);
      })
      .attr("fill", function (d) {
        if (color && config.nodeGroup) return color(d[config.nodeGroup]);
        return theme.palette ? theme.palette[0] : "#4e79a7";
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .style("cursor", config.draggable !== false ? "grab" : "default")
      .on("mouseover", function (event, d) {
        d3.select(this).attr("stroke-width", 3);
        if (!tooltip) return;
        tooltip.transition().duration(150).style("opacity", 1);
        var html = "<strong>" + (d[config.nodeLabel] || d[config.nodeId]) + "</strong>";
        if (config.nodeGroup && d[config.nodeGroup]) {
          html += "<br>" + config.nodeGroup + ": " + d[config.nodeGroup];
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
        d3.select(this).attr("stroke-width", 1.5);
        if (tooltip) tooltip.transition().duration(300).style("opacity", 0);
      });

    // Labels
    var labels = g
      .append("g")
      .attr("class", "d3b-node-labels")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .attr("text-anchor", "middle")
      .attr("dy", function (d) {
        var r = nodeSizeScale
          ? nodeSizeScale(+d[config.nodeSize])
          : (typeof config.nodeSize === "number" ? config.nodeSize : 8);
        return r + 14;
      })
      .attr("fill", theme.textColor || "#333")
      .attr("font-size", 10)
      .text(function (d) { return d[config.nodeLabel] || d[config.nodeId]; });

    // Drag behavior
    if (config.draggable !== false) {
      nodeElements.call(
        d3
          .drag()
          .on("start", function (event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
            d3.select(this).style("cursor", "grabbing");
          })
          .on("drag", function (event, d) {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", function (event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
            d3.select(this).style("cursor", "grab");
          })
      );
    }

    // Tick
    simulation.on("tick", function () {
      linkElements
        .attr("x1", function (d) { return d.source.x; })
        .attr("y1", function (d) { return d.source.y; })
        .attr("x2", function (d) { return d.target.x; })
        .attr("y2", function (d) { return d.target.y; });

      nodeElements.attr("cx", function (d) { return d.x; }).attr("cy", function (d) { return d.y; });

      labels.attr("x", function (d) { return d.x; }).attr("y", function (d) { return d.y; });
    });

    // Zoom
    if (config.zoom !== false) {
      var zoom = d3
        .zoom()
        .scaleExtent([0.3, 5])
        .on("zoom", function (event) {
          g.attr("transform", event.transform);
        });
      ctx.svg.call(zoom);
    }

    // Legend
    if (groups) {
      u.addLegend(ctx.svg, color, groups, config);
    }

    function update(newData) {
      simulation.stop();
      config.data = newData;
      D3Bridge.destroy(containerId);
      D3Bridge.render(containerId, config);
    }

    function destroy() {
      simulation.stop();
      if (tooltip) tooltip.remove();
    }

    return {
      svg: ctx.svg,
      g: g,
      simulation: simulation,
      update: update,
      destroy: destroy,
    };
  });

  // ── Sankey Diagram ───────────────────────────────────────
  D3Bridge.register("sankey", function (containerId, config) {
    var u = D3Bridge._;
    var theme = config.theme || {};

    // Sankey requires d3-sankey plugin — check availability
    if (typeof d3.sankey === "undefined") {
      d3.select("#" + containerId)
        .append("div")
        .attr("class", "d3b-empty")
        .html(
          'Sankey requires <a href="https://cdn.jsdelivr.net/npm/d3-sankey@0.12" target="_blank">d3-sankey</a> plugin'
        );
      return { svg: null, update: function () {}, destroy: function () {} };
    }

    var graphData = config.data || { nodes: [], links: [] };

    if (!graphData.nodes.length) {
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

    var alignMap = {
      left: d3.sankeyLeft,
      right: d3.sankeyRight,
      center: d3.sankeyCenter,
      justify: d3.sankeyJustify,
    };

    var sankey = d3
      .sankey()
      .nodeId(function (d) { return d[config.nodeId]; })
      .nodeWidth(config.nodeWidth || 20)
      .nodePadding(config.nodePadding || 10)
      .nodeAlign(alignMap[config.align] || d3.sankeyJustify)
      .extent([
        [0, 0],
        [iW, iH],
      ]);

    var graph = sankey({
      nodes: graphData.nodes.map(function (d) { return Object.assign({}, d); }),
      links: graphData.links.map(function (d) { return Object.assign({}, d); }),
    });

    var color = u.colorScale(
      theme,
      graph.nodes.map(function (n) { return n[config.nodeLabel]; })
    );

    var tooltip =
      config.tooltip !== false ? u.createTooltip(containerId, theme) : null;

    // Links
    g.append("g")
      .selectAll(".d3b-sankey-link")
      .data(graph.links)
      .join("path")
      .attr("class", "d3b-sankey-link")
      .attr("d", d3.sankeyLinkHorizontal())
      .attr("fill", "none")
      .attr("stroke", function (d) { return color(d.source[config.nodeLabel]); })
      .attr("stroke-width", function (d) { return Math.max(1, d.width); })
      .attr("stroke-opacity", 0.4)
      .on("mouseover", function (event, d) {
        d3.select(this).attr("stroke-opacity", 0.7);
        if (!tooltip) return;
        tooltip.transition().duration(150).style("opacity", 1);
        tooltip.html(
          d.source[config.nodeLabel] + " → " + d.target[config.nodeLabel] +
          "<br>" + u.formatValue(d.value)
        );
      })
      .on("mousemove", function (event) {
        if (!tooltip) return;
        tooltip
          .style("left", event.pageX + 12 + "px")
          .style("top", event.pageY - 20 + "px");
      })
      .on("mouseout", function () {
        d3.select(this).attr("stroke-opacity", 0.4);
        if (tooltip) tooltip.transition().duration(300).style("opacity", 0);
      });

    // Nodes
    g.append("g")
      .selectAll(".d3b-sankey-node")
      .data(graph.nodes)
      .join("rect")
      .attr("class", "d3b-sankey-node")
      .attr("x", function (d) { return d.x0; })
      .attr("y", function (d) { return d.y0; })
      .attr("width", function (d) { return d.x1 - d.x0; })
      .attr("height", function (d) { return Math.max(1, d.y1 - d.y0); })
      .attr("fill", function (d) { return color(d[config.nodeLabel]); })
      .attr("stroke", "#fff");

    // Node labels
    g.append("g")
      .selectAll(".d3b-sankey-label")
      .data(graph.nodes)
      .join("text")
      .attr("class", "d3b-sankey-label")
      .attr("x", function (d) { return d.x0 < iW / 2 ? d.x1 + 6 : d.x0 - 6; })
      .attr("y", function (d) { return (d.y1 + d.y0) / 2; })
      .attr("dy", "0.35em")
      .attr("text-anchor", function (d) { return d.x0 < iW / 2 ? "start" : "end"; })
      .attr("fill", theme.textColor || "#333")
      .attr("font-size", 11)
      .text(function (d) { return d[config.nodeLabel]; });

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
      update: update,
      destroy: destroy,
    };
  });
})();
