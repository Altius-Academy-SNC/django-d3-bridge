/**
 * D3 Bridge — Geo Chart Renderers (Choropleth & Bubble Map)
 * Supports: GeoJSON, projections, color scales, zoom, tooltips.
 */
(function () {
  function renderChoropleth(containerId, config) {
    var u = D3Bridge._;
    var geojson = config.data || { type: "FeatureCollection", features: [] };
    var theme = config.theme || {};
    var animate = config.animate !== false;
    var duration = config.animationDuration || 750;

    if (!geojson.features || !geojson.features.length) {
      d3.select("#" + containerId)
        .append("div")
        .attr("class", "d3b-empty")
        .text("No geographic data");
      return { svg: null, update: function () {}, destroy: function () {} };
    }

    var ctx = u.createSvg(containerId, config);
    var g = ctx.g;
    var iW = ctx.innerWidth;
    var iH = ctx.innerHeight;

    // Projection
    var projectionMap = {
      mercator: d3.geoMercator,
      albers: d3.geoAlbers,
      orthographic: d3.geoOrthographic,
      equirectangular: d3.geoEquirectangular,
      naturalEarth: d3.geoNaturalEarth1,
    };
    var projFn = projectionMap[config.projection] || d3.geoMercator;
    var projection = projFn().fitSize([iW, iH], geojson);

    if (config.center) {
      projection.center(config.center);
      if (config.scale) projection.scale(config.scale);
      projection.translate([iW / 2, iH / 2]);
    }

    var pathGen = d3.geoPath().projection(projection);

    // Color scale for choropleth
    var valueField = config.valueField;
    var colorScaleFn;

    if (valueField) {
      var values = geojson.features
        .map(function (f) { return f.properties ? +f.properties[valueField] : null; })
        .filter(function (v) { return v != null && !isNaN(v); });

      var extent = d3.extent(values);
      var palette = theme.palette || d3.schemeBlues[7];

      if (config.colorScale === "diverging") {
        colorScaleFn = d3
          .scaleDiverging()
          .domain([extent[0], (extent[0] + extent[1]) / 2, extent[1]])
          .interpolator(d3.interpolateRdYlGn);
      } else if (config.colorScale === "threshold") {
        var thresholds = config.colorDomain || d3.ticks(extent[0], extent[1], 5);
        colorScaleFn = d3
          .scaleThreshold()
          .domain(thresholds)
          .range(palette.slice(0, thresholds.length + 1));
      } else {
        colorScaleFn = d3
          .scaleSequential()
          .domain(extent)
          .interpolator(
            d3.interpolateRgbBasis(
              palette.length > 3 ? palette.slice(0, 5) : palette
            )
          );
      }
    }

    // Tooltip
    var tooltip =
      config.tooltip !== false ? u.createTooltip(containerId, theme) : null;

    // Render features
    var features = g
      .selectAll(".d3b-geo-feature")
      .data(geojson.features)
      .join("path")
      .attr("class", "d3b-geo-feature")
      .attr("d", pathGen)
      .attr("stroke", config.strokeColor || "#fff")
      .attr("stroke-width", config.strokeWidth || 0.5)
      .attr("fill", function (d) {
        if (!valueField || !d.properties) return config.nullColor || "#ccc";
        var val = +d.properties[valueField];
        if (isNaN(val)) return config.nullColor || "#ccc";
        return colorScaleFn(val);
      })
      .attr("opacity", animate ? 0 : 1)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        d3.select(this)
          .attr("stroke-width", 2)
          .attr("stroke", theme.textColor || "#333");
        if (!tooltip || !d.properties) return;
        tooltip.transition().duration(150).style("opacity", 1);
        var html = "";
        var tooltipFields =
          Array.isArray(config.tooltip) ? config.tooltip : Object.keys(d.properties);
        tooltipFields.forEach(function (key) {
          if (d.properties[key] != null) {
            html +=
              "<strong>" + key + ":</strong> " + u.formatValue(d.properties[key]) + "<br>";
          }
        });
        tooltip.html(html || "ID: " + (d.id || "—"));
      })
      .on("mousemove", function (event) {
        if (!tooltip) return;
        tooltip
          .style("left", event.pageX + 12 + "px")
          .style("top", event.pageY - 20 + "px");
      })
      .on("mouseout", function () {
        d3.select(this)
          .attr("stroke-width", config.strokeWidth || 0.5)
          .attr("stroke", config.strokeColor || "#fff");
        if (tooltip) tooltip.transition().duration(300).style("opacity", 0);
      });

    // Animate
    if (animate) {
      features
        .transition()
        .duration(duration)
        .ease(d3.easeCubicOut)
        .attr("opacity", 1);
    }

    // Zoom
    if (config.zoom !== false) {
      var zoom = d3
        .zoom()
        .scaleExtent([1, 12])
        .on("zoom", function (event) {
          g.attr("transform", event.transform);
        });
      ctx.svg.call(zoom);
    }

    // Color legend
    if (valueField && colorScaleFn) {
      var legendWidth = Math.min(200, iW * 0.4);
      var legendG = ctx.svg
        .append("g")
        .attr("class", "d3b-color-legend")
        .attr(
          "transform",
          "translate(" +
            (ctx.width - ctx.margin.right - legendWidth) +
            "," +
            (ctx.height - 30) +
            ")"
        );

      var legendScale = d3.scaleLinear().domain(d3.extent(values)).range([0, legendWidth]);
      var legendAxis = d3.axisBottom(legendScale).ticks(4).tickSize(6);

      // Gradient
      var defs = ctx.svg.select("defs").empty()
        ? ctx.svg.append("defs")
        : ctx.svg.select("defs");
      var gradId = u.uid("grad");
      var gradient = defs
        .append("linearGradient")
        .attr("id", gradId)
        .attr("x1", "0%")
        .attr("x2", "100%");

      var stops = 10;
      for (var i = 0; i <= stops; i++) {
        var t = i / stops;
        var val = d3.extent(values)[0] + t * (d3.extent(values)[1] - d3.extent(values)[0]);
        gradient
          .append("stop")
          .attr("offset", (t * 100) + "%")
          .attr("stop-color", colorScaleFn(val));
      }

      legendG
        .append("rect")
        .attr("width", legendWidth)
        .attr("height", 10)
        .attr("fill", "url(#" + gradId + ")");

      legendG
        .append("g")
        .attr("transform", "translate(0,10)")
        .call(legendAxis)
        .call(function (g) {
          g.select(".domain").remove();
          g.selectAll("text").attr("fill", theme.textColor || "#333").attr("font-size", 10);
        });
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
      projection: projection,
      pathGen: pathGen,
      update: update,
      destroy: destroy,
    };
  }

  // ── Bubble Map ───────────────────────────────────────────
  function renderBubbleMap(containerId, config) {
    // First render the base map
    var base = renderChoropleth(containerId, config);
    if (!base.svg) return base;

    var geojson = config.data || { type: "FeatureCollection", features: [] };
    var theme = config.theme || {};
    var sizeField = config.sizeField || config.valueField;
    var sizeRange = config.sizeRange || [3, 30];

    if (!sizeField) return base;

    var values = geojson.features
      .map(function (f) { return f.properties ? +f.properties[sizeField] : 0; })
      .filter(function (v) { return !isNaN(v); });

    var sizeScale = d3.scaleSqrt().domain(d3.extent(values)).range(sizeRange);

    // Add bubbles at centroids
    base.g
      .selectAll(".d3b-bubble")
      .data(
        geojson.features.filter(function (f) {
          return f.properties && f.properties[sizeField] != null;
        })
      )
      .join("circle")
      .attr("class", "d3b-bubble")
      .attr("cx", function (d) { return base.pathGen.centroid(d)[0]; })
      .attr("cy", function (d) { return base.pathGen.centroid(d)[1]; })
      .attr("r", function (d) { return sizeScale(+d.properties[sizeField]); })
      .attr("fill", theme.palette ? theme.palette[0] : "#e15759")
      .attr("fill-opacity", 0.6)
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.5);

    return base;
  }

  D3Bridge.register("choropleth", renderChoropleth);
  D3Bridge.register("bubblemap", renderBubbleMap);
})();
