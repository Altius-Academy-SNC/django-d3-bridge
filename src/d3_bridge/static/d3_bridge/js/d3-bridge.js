/**
 * D3 Bridge — Lightweight runtime for django-d3-bridge.
 *
 * Architecture:
 *   Python Chart class → JSON config → D3Bridge.render() → Pure D3.js DOM
 *
 * Each chart type registers itself via D3Bridge.register(type, renderFn).
 * The render function receives (containerId, config) and returns a chart
 * instance with { svg, update, destroy } methods.
 */
var D3Bridge = (function () {
  "use strict";

  var _renderers = {};
  var _charts = {};

  // ── Utilities ──────────────────────────────────────────────

  function uid(prefix) {
    return (prefix || "d3b") + "-" + Math.random().toString(36).slice(2, 10);
  }

  /**
   * Create a responsive SVG inside the container.
   */
  function createSvg(containerId, config) {
    var container = d3.select("#" + containerId);
    container.selectAll("*").remove();

    var theme = config.theme || {};
    var margin = config.margin || { top: 40, right: 30, bottom: 50, left: 60 };
    var containerWidth =
      config.width || container.node().getBoundingClientRect().width || 600;
    var height = config.height || 400;
    var width = containerWidth;
    var innerWidth = width - margin.left - margin.right;
    var innerHeight = height - margin.top - margin.bottom;

    // Apply background
    if (theme.background && theme.background !== "transparent") {
      container.style("background-color", theme.background);
    }

    var svg = container
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("class", "d3b-svg")
      .attr("font-family", theme.fontFamily || "inherit")
      .attr("font-size", theme.fontSize || 12);

    var g = svg
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Title
    if (config.title) {
      svg
        .append("text")
        .attr("class", "d3b-title")
        .attr("x", width / 2)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .attr("fill", theme.textColor || "#333")
        .attr("font-size", theme.titleFontSize || 16)
        .attr("font-weight", 600)
        .text(config.title);
    }

    // Subtitle
    if (config.subtitle) {
      svg
        .append("text")
        .attr("class", "d3b-subtitle")
        .attr("x", width / 2)
        .attr("y", config.title ? 36 : 20)
        .attr("text-anchor", "middle")
        .attr("fill", theme.textColor || "#666")
        .attr("font-size", (theme.fontSize || 12) - 1)
        .text(config.subtitle);
    }

    return {
      svg: svg,
      g: g,
      width: width,
      height: height,
      innerWidth: innerWidth,
      innerHeight: innerHeight,
      margin: margin,
      theme: theme,
    };
  }

  /**
   * Create a tooltip div attached to the container.
   */
  function createTooltip(containerId, theme) {
    // Remove any existing tooltip
    d3.select("#" + containerId + "-tooltip").remove();

    var tooltip = d3
      .select("body")
      .append("div")
      .attr("id", containerId + "-tooltip")
      .attr("class", "d3b-tooltip")
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("background", theme.tooltipBg || "#fff")
      .style("border", "1px solid " + (theme.tooltipBorder || "#ccc"))
      .style("color", theme.tooltipColor || "#333")
      .style("padding", "8px 12px")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("box-shadow", "0 2px 8px rgba(0,0,0,0.15)")
      .style("z-index", "10000")
      .style("max-width", "300px");

    return tooltip;
  }

  /**
   * Format a value for display.
   */
  function formatValue(v) {
    if (v === null || v === undefined) return "—";
    if (typeof v === "number") {
      if (Number.isInteger(v)) return d3.format(",")(v);
      return d3.format(",.2f")(v);
    }
    return String(v);
  }

  /**
   * Get color scale from theme palette.
   */
  function colorScale(theme, domain) {
    var palette = theme.palette || d3.schemeTableau10;
    return d3.scaleOrdinal().domain(domain || []).range(palette);
  }

  /**
   * Add grid lines to a chart.
   */
  function addGrid(g, xScale, yScale, innerWidth, innerHeight, theme) {
    // Horizontal grid lines
    g.append("g")
      .attr("class", "d3b-grid d3b-grid-y")
      .call(d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat(""))
      .call(function (g) {
        g.select(".domain").remove();
        g.selectAll(".tick line")
          .attr("stroke", theme.gridColor || "#e0e0e0")
          .attr("stroke-opacity", theme.gridOpacity || 0.4);
      });
  }

  /**
   * Add axes with styling.
   */
  function addAxes(g, xScale, yScale, innerWidth, innerHeight, config) {
    var theme = config.theme || {};

    // X axis
    var xAxis = g
      .append("g")
      .attr("class", "d3b-axis d3b-axis-x")
      .attr("transform", "translate(0," + innerHeight + ")")
      .call(d3.axisBottom(xScale));

    xAxis
      .selectAll("text")
      .attr("fill", theme.textColor || "#333")
      .attr("font-size", theme.fontSize || 12);
    xAxis.selectAll("line").attr("stroke", theme.axisColor || "#666");
    xAxis.select(".domain").attr("stroke", theme.axisColor || "#666");

    // Rotate labels if many categories
    if (xScale.bandwidth && xScale.domain().length > 8) {
      xAxis
        .selectAll("text")
        .attr("transform", "rotate(-40)")
        .attr("text-anchor", "end")
        .attr("dx", "-0.5em")
        .attr("dy", "0.15em");
    }

    // X label
    if (config.xLabel) {
      g.append("text")
        .attr("class", "d3b-label d3b-label-x")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight + 40)
        .attr("text-anchor", "middle")
        .attr("fill", theme.textColor || "#666")
        .attr("font-size", theme.fontSize || 12)
        .text(config.xLabel);
    }

    // Y axis
    var yAxis = g
      .append("g")
      .attr("class", "d3b-axis d3b-axis-y")
      .call(d3.axisLeft(yScale));

    yAxis
      .selectAll("text")
      .attr("fill", theme.textColor || "#333")
      .attr("font-size", theme.fontSize || 12);
    yAxis.selectAll("line").attr("stroke", theme.axisColor || "#666");
    yAxis.select(".domain").attr("stroke", theme.axisColor || "#666");

    // Y label
    if (config.yLabel) {
      g.append("text")
        .attr("class", "d3b-label d3b-label-y")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerHeight / 2)
        .attr("y", -45)
        .attr("text-anchor", "middle")
        .attr("fill", theme.textColor || "#666")
        .attr("font-size", theme.fontSize || 12)
        .text(config.yLabel);
    }

    return { xAxis: xAxis, yAxis: yAxis };
  }

  /**
   * Add a color legend.
   */
  function addLegend(svg, colorFn, domain, config) {
    if (!config.legend || !domain || domain.length <= 1) return;

    var theme = config.theme || {};
    var legendX = config.margin.left + 10;
    var legendY = config.height - 15;

    var legend = svg
      .append("g")
      .attr("class", "d3b-legend")
      .attr("transform", "translate(" + legendX + "," + legendY + ")");

    var offset = 0;
    domain.forEach(function (d) {
      var item = legend
        .append("g")
        .attr("transform", "translate(" + offset + ",0)");

      item
        .append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("rx", 2)
        .attr("fill", colorFn(d));

      item
        .append("text")
        .attr("x", 16)
        .attr("y", 10)
        .attr("fill", theme.textColor || "#333")
        .attr("font-size", 11)
        .text(d);

      offset += 16 + String(d).length * 7 + 12;
    });
  }

  /**
   * Detect if a field contains date strings.
   */
  function isDateField(data, field) {
    if (!data || !data.length) return false;
    var sample = data[0][field];
    if (typeof sample === "string" && /^\d{4}-\d{2}/.test(sample)) return true;
    return false;
  }

  /**
   * Handle responsive resize.
   */
  function makeResponsive(containerId, config, renderFn) {
    if (!config.responsive) return;

    var resizeTimer;
    var observer = new ResizeObserver(function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        var instance = _charts[containerId];
        if (instance && instance.destroy) instance.destroy();
        var newInstance = renderFn(containerId, config);
        _charts[containerId] = newInstance;
      }, 200);
    });

    var el = document.getElementById(containerId);
    if (el) observer.observe(el);
  }

  // ── Public API ─────────────────────────────────────────────

  function register(type, renderFn) {
    _renderers[type] = renderFn;
  }

  function render(containerId, config) {
    var type = config.type;
    var renderFn = _renderers[type];
    if (!renderFn) {
      console.error("[D3Bridge] Unknown chart type: " + type);
      return null;
    }

    var instance = renderFn(containerId, config);
    _charts[containerId] = instance;

    // Set up MQTT live updates
    if (config.live && config.mqtt && typeof D3BridgeMQTT !== "undefined") {
      D3BridgeMQTT.connect(containerId, config.mqtt, instance);
    }

    // Set up polling
    if (config.poll && config.poll.url && typeof D3BridgePoll !== "undefined") {
      D3BridgePoll.start(containerId, config.poll, instance);
    }

    // Responsive resize
    makeResponsive(containerId, config, renderFn);

    // Execute extra JS escape hatch
    if (config.extraJs) {
      try {
        var fn = new Function("chart", "d3", "config", config.extraJs);
        fn(instance, d3, config);
      } catch (e) {
        console.error("[D3Bridge] Error in extraJs:", e);
      }
    }

    return instance;
  }

  function getChart(containerId) {
    return _charts[containerId] || null;
  }

  function destroyChart(containerId) {
    // Stop polling if active
    if (typeof D3BridgePoll !== "undefined") {
      D3BridgePoll.stop(containerId);
    }
    // Disconnect MQTT if active
    if (typeof D3BridgeMQTT !== "undefined") {
      D3BridgeMQTT.disconnect(containerId);
    }
    var instance = _charts[containerId];
    if (instance && instance.destroy) instance.destroy();
    delete _charts[containerId];
    d3.select("#" + containerId).selectAll("*").remove();
    d3.select("#" + containerId + "-tooltip").remove();
  }

  return {
    render: render,
    register: register,
    getChart: getChart,
    destroy: destroyChart,
    charts: _charts,
    // Expose utilities for chart modules
    _: {
      createSvg: createSvg,
      createTooltip: createTooltip,
      formatValue: formatValue,
      colorScale: colorScale,
      addGrid: addGrid,
      addAxes: addAxes,
      addLegend: addLegend,
      isDateField: isDateField,
      uid: uid,
    },
  };
})();
