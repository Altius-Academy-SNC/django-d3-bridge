/**
 * D3 Bridge — Hierarchy Renderers
 * Tree, Treemap, PackCircle, Sunburst, Dendrogram
 */
(function () {
  var u = D3Bridge._;

  /**
   * Build d3.hierarchy from data.
   * Supports nested dict or flat array (stratify).
   */
  function buildHierarchy(data, config) {
    if (Array.isArray(data)) {
      // Stratify from flat array
      return d3
        .stratify()
        .id(function (d) { return d[config.idField || "id"]; })
        .parentId(function (d) { return d[config.parentField || "parent"]; })(data)
        .sum(function (d) { return +d[config.valueField || "value"] || 0; })
        .sort(function (a, b) { return b.value - a.value; });
    }
    // Nested object
    return d3
      .hierarchy(data)
      .sum(function (d) { return +d[config.valueField || "value"] || 0; })
      .sort(function (a, b) { return b.value - a.value; });
  }

  function getName(d, config) {
    return d.data[config.nameField || "name"] || d.data.id || "";
  }

  function depthColor(theme, maxDepth) {
    var palette = theme.palette || d3.schemeTableau10;
    return function (depth) {
      return palette[depth % palette.length];
    };
  }

  // ── Tree Diagram ─────────────────────────────────────────
  D3Bridge.register("tree", function (containerId, config) {
    var data = config.data;
    var theme = config.theme || {};
    var animate = config.animate !== false;
    var duration = config.animationDuration || 750;

    if (!data) {
      d3.select("#" + containerId).append("div").attr("class", "d3b-empty").text("No data");
      return { svg: null, update: function () {}, destroy: function () {} };
    }

    var ctx = u.createSvg(containerId, config);
    var g = ctx.g;
    var iW = ctx.innerWidth;
    var iH = ctx.innerHeight;
    var root = buildHierarchy(data, config);
    var orientation = config.orientation || "horizontal";
    var isRadial = orientation === "radial";

    var tooltip = config.tooltip !== false ? u.createTooltip(containerId, theme) : null;
    var dColor = depthColor(theme, root.height);

    if (isRadial) {
      var radius = Math.min(iW, iH) / 2;
      var treeLayout = d3.tree().size([2 * Math.PI, radius * 0.75]).separation(function (a, b) {
        return (a.parent === b.parent ? 1 : 2) / a.depth;
      });
      treeLayout(root);

      var radialG = g.append("g").attr("transform", "translate(" + iW / 2 + "," + iH / 2 + ")");

      // Links
      radialG.selectAll(".d3b-tree-link")
        .data(root.links())
        .join("path")
        .attr("class", "d3b-tree-link")
        .attr("fill", "none")
        .attr("stroke", theme.gridColor || "#ccc")
        .attr("stroke-width", 1.5)
        .attr("d", d3.linkRadial().angle(function (d) { return d.x; }).radius(function (d) { return d.y; }));

      // Nodes
      var nodes = radialG.selectAll(".d3b-tree-node")
        .data(root.descendants())
        .join("g")
        .attr("class", "d3b-tree-node")
        .attr("transform", function (d) {
          return "rotate(" + ((d.x * 180) / Math.PI - 90) + ") translate(" + d.y + ",0)";
        });

      nodes.append("circle")
        .attr("r", config.nodeRadius || 5)
        .attr("fill", function (d) { return dColor(d.depth); })
        .attr("stroke", "#fff").attr("stroke-width", 1.5);

      if (config.labels !== false) {
        nodes.append("text")
          .attr("dy", "0.31em")
          .attr("x", function (d) { return d.x < Math.PI === !d.children ? 8 : -8; })
          .attr("text-anchor", function (d) { return d.x < Math.PI === !d.children ? "start" : "end"; })
          .attr("transform", function (d) { return d.x >= Math.PI ? "rotate(180)" : null; })
          .attr("fill", theme.textColor || "#333").attr("font-size", 10)
          .text(function (d) { return getName(d, config); });
      }
    } else {
      var isHoriz = orientation === "horizontal";
      var treeLayout = d3.tree().size(isHoriz ? [iH, iW * 0.85] : [iW, iH * 0.85]);
      treeLayout(root);

      // Links
      var linkGen = isHoriz
        ? d3.linkHorizontal().x(function (d) { return d.y; }).y(function (d) { return d.x; })
        : d3.linkVertical().x(function (d) { return d.x; }).y(function (d) { return d.y; });

      if (config.linkStyle === "step") {
        linkGen = isHoriz
          ? function (d) { return "M" + d.source.y + "," + d.source.x + "H" + ((d.source.y + d.target.y) / 2) + "V" + d.target.x + "H" + d.target.y; }
          : function (d) { return "M" + d.source.x + "," + d.source.y + "V" + ((d.source.y + d.target.y) / 2) + "H" + d.target.x + "V" + d.target.y; };
      }

      g.selectAll(".d3b-tree-link")
        .data(root.links())
        .join("path")
        .attr("class", "d3b-tree-link")
        .attr("fill", "none")
        .attr("stroke", theme.gridColor || "#ccc")
        .attr("stroke-width", 1.5)
        .attr("d", linkGen);

      // Nodes
      var nodes = g.selectAll(".d3b-tree-node")
        .data(root.descendants())
        .join("g")
        .attr("class", "d3b-tree-node")
        .attr("transform", function (d) {
          return isHoriz
            ? "translate(" + d.y + "," + d.x + ")"
            : "translate(" + d.x + "," + d.y + ")";
        });

      nodes.append("circle")
        .attr("r", config.nodeRadius || 5)
        .attr("fill", function (d) { return dColor(d.depth); })
        .attr("stroke", "#fff").attr("stroke-width", 1.5)
        .on("mouseover", function (event, d) {
          if (!tooltip) return;
          tooltip.transition().duration(150).style("opacity", 1);
          tooltip.html("<strong>" + getName(d, config) + "</strong><br>Value: " + u.formatValue(d.value));
        })
        .on("mousemove", function (event) {
          if (tooltip) tooltip.style("left", event.pageX + 12 + "px").style("top", event.pageY - 20 + "px");
        })
        .on("mouseout", function () {
          if (tooltip) tooltip.transition().duration(300).style("opacity", 0);
        });

      if (config.labels !== false) {
        nodes.append("text")
          .attr("dy", "0.31em")
          .attr("x", function (d) { return d.children ? -8 : 8; })
          .attr("text-anchor", function (d) { return d.children ? "end" : "start"; })
          .attr("fill", theme.textColor || "#333").attr("font-size", 10)
          .text(function (d) { return getName(d, config); });
      }
    }

    // Animate
    if (animate) {
      g.attr("opacity", 0).transition().duration(duration).attr("opacity", 1);
    }

    function update(newData) { config.data = newData; D3Bridge.destroy(containerId); D3Bridge.render(containerId, config); }
    function destroy() { if (tooltip) tooltip.remove(); }
    return { svg: ctx.svg, g: g, root: root, update: update, destroy: destroy };
  });

  // ── Dendrogram ───────────────────────────────────────────
  D3Bridge.register("dendrogram", function (containerId, config) {
    // Dendrogram is a cluster layout (leaf-aligned) — reuse tree with d3.cluster
    var data = config.data;
    var theme = config.theme || {};
    var animate = config.animate !== false;
    var duration = config.animationDuration || 750;

    if (!data) {
      d3.select("#" + containerId).append("div").attr("class", "d3b-empty").text("No data");
      return { svg: null, update: function () {}, destroy: function () {} };
    }

    var ctx = u.createSvg(containerId, config);
    var g = ctx.g;
    var iW = ctx.innerWidth;
    var iH = ctx.innerHeight;
    var root = buildHierarchy(data, config);
    var orientation = config.orientation || "horizontal";
    var isHoriz = orientation === "horizontal";
    var tooltip = config.tooltip !== false ? u.createTooltip(containerId, theme) : null;
    var dColor = depthColor(theme, root.height);

    var clusterLayout = d3.cluster().size(isHoriz ? [iH, iW * 0.85] : [iW, iH * 0.85]);
    clusterLayout(root);

    var linkGen = isHoriz
      ? function (d) { return "M" + d.source.y + "," + d.source.x + "H" + d.target.y + "V" + d.target.x; }
      : function (d) { return "M" + d.source.x + "," + d.source.y + "V" + d.target.y + "H" + d.target.x; };

    g.selectAll(".d3b-dendro-link")
      .data(root.links())
      .join("path")
      .attr("class", "d3b-dendro-link")
      .attr("fill", "none")
      .attr("stroke", theme.gridColor || "#ccc")
      .attr("stroke-width", 1.5)
      .attr("d", linkGen);

    var nodes = g.selectAll(".d3b-dendro-node")
      .data(root.descendants())
      .join("g")
      .attr("class", "d3b-dendro-node")
      .attr("transform", function (d) {
        return isHoriz ? "translate(" + d.y + "," + d.x + ")" : "translate(" + d.x + "," + d.y + ")";
      });

    nodes.append("circle")
      .attr("r", config.nodeRadius || 4)
      .attr("fill", function (d) { return d.children ? "#fff" : dColor(d.depth); })
      .attr("stroke", function (d) { return dColor(d.depth); })
      .attr("stroke-width", 1.5);

    if (config.labels !== false) {
      nodes.filter(function (d) { return !d.children; })
        .append("text")
        .attr("dy", "0.31em")
        .attr("x", isHoriz ? 8 : 0).attr("y", isHoriz ? 0 : 12)
        .attr("text-anchor", isHoriz ? "start" : "middle")
        .attr("fill", theme.textColor || "#333").attr("font-size", 10)
        .text(function (d) { return getName(d, config); });
    }

    if (animate) {
      g.attr("opacity", 0).transition().duration(duration).attr("opacity", 1);
    }

    function update(newData) { config.data = newData; D3Bridge.destroy(containerId); D3Bridge.render(containerId, config); }
    function destroy() { if (tooltip) tooltip.remove(); }
    return { svg: ctx.svg, g: g, root: root, update: update, destroy: destroy };
  });

  // ── Treemap ──────────────────────────────────────────────
  D3Bridge.register("treemap", function (containerId, config) {
    var data = config.data;
    var theme = config.theme || {};
    var animate = config.animate !== false;
    var duration = config.animationDuration || 750;

    if (!data) {
      d3.select("#" + containerId).append("div").attr("class", "d3b-empty").text("No data");
      return { svg: null, update: function () {}, destroy: function () {} };
    }

    var ctx = u.createSvg(containerId, config);
    var g = ctx.g;
    var iW = ctx.innerWidth;
    var iH = ctx.innerHeight;
    var root = buildHierarchy(data, config);
    var tooltip = config.tooltip !== false ? u.createTooltip(containerId, theme) : null;

    var tileMap = {
      squarify: d3.treemapSquarify,
      binary: d3.treemapBinary,
      dice: d3.treemapDice,
      slice: d3.treemapSlice,
      sliceDice: d3.treemapSliceDice,
    };

    d3.treemap()
      .size([iW, iH])
      .tile(tileMap[config.tile] || d3.treemapSquarify)
      .padding(config.padding || 2)
      .paddingInner(config.innerPadding || 1)
      .round(config.round !== false)(root);

    var color = u.colorScale(
      theme,
      root.children ? root.children.map(function (d) { return getName(d, config); }) : []
    );

    // Cells
    var cells = g.selectAll(".d3b-treemap-cell")
      .data(root.leaves())
      .join("g")
      .attr("class", "d3b-treemap-cell")
      .attr("transform", function (d) { return "translate(" + d.x0 + "," + d.y0 + ")"; });

    cells.append("rect")
      .attr("width", function (d) { return Math.max(0, d.x1 - d.x0); })
      .attr("height", function (d) { return Math.max(0, d.y1 - d.y0); })
      .attr("rx", 2)
      .attr("fill", function (d) {
        // Color by top-level parent
        var node = d;
        while (node.depth > 1) node = node.parent;
        return color(getName(node, config));
      })
      .attr("opacity", animate ? 0 : 0.85)
      .on("mouseover", function (event, d) {
        d3.select(this).attr("opacity", 1);
        if (!tooltip) return;
        tooltip.transition().duration(150).style("opacity", 1);
        tooltip.html("<strong>" + getName(d, config) + "</strong><br>" + u.formatValue(d.value));
      })
      .on("mousemove", function (event) {
        if (tooltip) tooltip.style("left", event.pageX + 12 + "px").style("top", event.pageY - 20 + "px");
      })
      .on("mouseout", function () {
        d3.select(this).attr("opacity", 0.85);
        if (tooltip) tooltip.transition().duration(300).style("opacity", 0);
      });

    // Labels
    if (config.labels !== false) {
      cells.append("text")
        .attr("x", 4).attr("y", 14)
        .attr("fill", "#fff").attr("font-size", 10).attr("font-weight", 500)
        .text(function (d) {
          var w = d.x1 - d.x0;
          var name = getName(d, config);
          return w > 40 ? name : "";
        })
        .attr("pointer-events", "none");
    }

    if (animate) {
      cells.selectAll("rect").transition().duration(duration).ease(d3.easeCubicOut).attr("opacity", 0.85);
    }

    function update(newData) { config.data = newData; D3Bridge.destroy(containerId); D3Bridge.render(containerId, config); }
    function destroy() { if (tooltip) tooltip.remove(); }
    return { svg: ctx.svg, g: g, root: root, update: update, destroy: destroy };
  });

  // ── Pack (Circle Packing) ────────────────────────────────
  D3Bridge.register("pack", function (containerId, config) {
    var data = config.data;
    var theme = config.theme || {};
    var animate = config.animate !== false;
    var duration = config.animationDuration || 750;

    if (!data) {
      d3.select("#" + containerId).append("div").attr("class", "d3b-empty").text("No data");
      return { svg: null, update: function () {}, destroy: function () {} };
    }

    var ctx = u.createSvg(containerId, config);
    var g = ctx.g;
    var iW = ctx.innerWidth;
    var iH = ctx.innerHeight;
    var root = buildHierarchy(data, config);
    var tooltip = config.tooltip !== false ? u.createTooltip(containerId, theme) : null;
    var dColor = depthColor(theme, root.height);

    d3.pack()
      .size([iW, iH])
      .padding(config.padding || 3)(root);

    var nodes = g.selectAll(".d3b-pack-node")
      .data(root.descendants())
      .join("g")
      .attr("class", "d3b-pack-node")
      .attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });

    nodes.append("circle")
      .attr("r", function (d) { return d.r; })
      .attr("fill", function (d) { return d.children ? "none" : dColor(d.depth); })
      .attr("stroke", function (d) { return dColor(d.depth); })
      .attr("stroke-width", function (d) { return d.children ? 1 : 0; })
      .attr("fill-opacity", function (d) { return d.children ? 0 : 0.7; })
      .attr("opacity", animate ? 0 : 1)
      .on("mouseover", function (event, d) {
        if (!tooltip) return;
        tooltip.transition().duration(150).style("opacity", 1);
        tooltip.html("<strong>" + getName(d, config) + "</strong><br>" + u.formatValue(d.value));
      })
      .on("mousemove", function (event) {
        if (tooltip) tooltip.style("left", event.pageX + 12 + "px").style("top", event.pageY - 20 + "px");
      })
      .on("mouseout", function () {
        if (tooltip) tooltip.transition().duration(300).style("opacity", 0);
      });

    // Labels on leaves
    if (config.labels !== false) {
      nodes.filter(function (d) { return !d.children && d.r > 15; })
        .append("text")
        .attr("text-anchor", "middle").attr("dy", "0.31em")
        .attr("fill", theme.textColor || "#333").attr("font-size", 10)
        .text(function (d) { return getName(d, config); })
        .attr("pointer-events", "none");
    }

    if (animate) {
      nodes.selectAll("circle").transition().duration(duration).ease(d3.easeCubicOut).attr("opacity", 1);
    }

    function update(newData) { config.data = newData; D3Bridge.destroy(containerId); D3Bridge.render(containerId, config); }
    function destroy() { if (tooltip) tooltip.remove(); }
    return { svg: ctx.svg, g: g, root: root, update: update, destroy: destroy };
  });

  // ── Sunburst ─────────────────────────────────────────────
  D3Bridge.register("sunburst", function (containerId, config) {
    var data = config.data;
    var theme = config.theme || {};
    var animate = config.animate !== false;
    var duration = config.animationDuration || 750;

    if (!data) {
      d3.select("#" + containerId).append("div").attr("class", "d3b-empty").text("No data");
      return { svg: null, update: function () {}, destroy: function () {} };
    }

    var ctx = u.createSvg(containerId, config);
    var radius = Math.min(ctx.innerWidth, ctx.innerHeight) / 2;
    var root = buildHierarchy(data, config);
    var tooltip = config.tooltip !== false ? u.createTooltip(containerId, theme) : null;
    var dColor = depthColor(theme, root.height);

    var chartG = ctx.g.append("g")
      .attr("transform", "translate(" + ctx.innerWidth / 2 + "," + ctx.innerHeight / 2 + ")");

    d3.partition().size([2 * Math.PI, radius])(root);

    var arcGen = d3.arc()
      .startAngle(function (d) { return d.x0; })
      .endAngle(function (d) { return d.x1; })
      .padAngle(config.padAngle || 0.01)
      .padRadius(radius / 2)
      .innerRadius(function (d) { return d.y0; })
      .outerRadius(function (d) { return d.y1 - 1; })
      .cornerRadius(config.cornerRadius || 4);

    var slices = chartG.selectAll(".d3b-sunburst-slice")
      .data(root.descendants().filter(function (d) { return d.depth; }))
      .join("path")
      .attr("class", "d3b-sunburst-slice")
      .attr("fill", function (d) { return dColor(d.depth); })
      .attr("fill-opacity", function (d) { return 1 - d.depth * 0.15; })
      .attr("stroke", theme.background === "transparent" ? "#fff" : theme.background)
      .attr("stroke-width", 0.5)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        d3.select(this).attr("fill-opacity", 1);
        if (!tooltip) return;
        tooltip.transition().duration(150).style("opacity", 1);
        // Build breadcrumb path
        var path = d.ancestors().reverse().slice(1).map(function (n) { return getName(n, config); }).join(" → ");
        tooltip.html("<strong>" + path + "</strong><br>" + u.formatValue(d.value));
      })
      .on("mousemove", function (event) {
        if (tooltip) tooltip.style("left", event.pageX + 12 + "px").style("top", event.pageY - 20 + "px");
      })
      .on("mouseout", function () {
        d3.select(this).attr("fill-opacity", function (d) { return 1 - d.depth * 0.15; });
        if (tooltip) tooltip.transition().duration(300).style("opacity", 0);
      });

    if (animate) {
      slices
        .transition().duration(duration).ease(d3.easeCubicOut)
        .attrTween("d", function (d) {
          var i = d3.interpolate({ x0: 0, x1: 0, y0: d.y0, y1: d.y1 }, d);
          return function (t) { return arcGen(i(t)); };
        });
    } else {
      slices.attr("d", arcGen);
    }

    // Labels
    if (config.labels !== false) {
      chartG.selectAll(".d3b-sunburst-label")
        .data(root.descendants().filter(function (d) { return d.depth && (d.x1 - d.x0) > 0.08; }))
        .join("text")
        .attr("class", "d3b-sunburst-label")
        .attr("transform", function (d) {
          var angle = ((d.x0 + d.x1) / 2) * (180 / Math.PI);
          var r = (d.y0 + d.y1) / 2;
          return "rotate(" + (angle - 90) + ") translate(" + r + ",0) rotate(" + (angle < 180 ? 0 : 180) + ")";
        })
        .attr("text-anchor", "middle").attr("dy", "0.35em")
        .attr("fill", theme.textColor || "#333").attr("font-size", 9)
        .attr("pointer-events", "none")
        .text(function (d) { return getName(d, config); });
    }

    function update(newData) { config.data = newData; D3Bridge.destroy(containerId); D3Bridge.render(containerId, config); }
    function destroy() { if (tooltip) tooltip.remove(); }
    return { svg: ctx.svg, g: chartG, root: root, update: update, destroy: destroy };
  });
})();
