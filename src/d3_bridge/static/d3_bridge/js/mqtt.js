/**
 * D3 Bridge — MQTT Live Update Module
 *
 * Connects to an MQTT broker via WebSocket and pushes new data points
 * into chart instances. Requires mqtt.js loaded before this script.
 *
 * Usage (automatic via config.live = true):
 *   D3BridgeMQTT.connect("chart-id", { broker, topic, window, qos }, chartInstance)
 */
var D3BridgeMQTT = (function () {
  "use strict";

  var _connections = {};

  function connect(chartId, mqttConfig, chartInstance) {
    if (!mqttConfig || !mqttConfig.broker || !mqttConfig.topic) {
      console.warn("[D3BridgeMQTT] Missing broker or topic for chart:", chartId);
      return null;
    }

    // Check mqtt.js availability
    if (typeof mqtt === "undefined") {
      console.error(
        "[D3BridgeMQTT] mqtt.js not loaded. Add <script src=\"https://cdn.jsdelivr.net/npm/mqtt@5/dist/mqtt.min.js\"></script>"
      );
      return null;
    }

    var client = mqtt.connect(mqttConfig.broker, {
      clientId: "d3b_" + chartId + "_" + Math.random().toString(36).slice(2, 8),
      clean: true,
      connectTimeout: 10000,
      reconnectPeriod: 5000,
    });

    client.on("connect", function () {
      console.log("[D3BridgeMQTT] Connected for chart:", chartId);
      client.subscribe(mqttConfig.topic, { qos: mqttConfig.qos || 0 });
    });

    client.on("message", function (topic, payload) {
      try {
        var message = JSON.parse(payload.toString());
        var instance = D3Bridge.getChart(chartId) || chartInstance;
        if (instance && instance.update) {
          instance.update(message);
        }
      } catch (e) {
        console.error("[D3BridgeMQTT] Parse error:", e);
      }
    });

    client.on("error", function (err) {
      console.error("[D3BridgeMQTT] Error for chart " + chartId + ":", err);
    });

    client.on("reconnect", function () {
      console.log("[D3BridgeMQTT] Reconnecting for chart:", chartId);
    });

    _connections[chartId] = client;

    // Add status indicator to chart container
    var container = document.getElementById(chartId);
    if (container) {
      var indicator = document.createElement("div");
      indicator.className = "d3b-mqtt-status d3b-mqtt-connected";
      indicator.title = "Live: " + mqttConfig.topic;
      indicator.innerHTML = "&#9679; LIVE";
      container.style.position = "relative";
      container.appendChild(indicator);

      client.on("close", function () {
        indicator.className = "d3b-mqtt-status d3b-mqtt-disconnected";
      });
      client.on("connect", function () {
        indicator.className = "d3b-mqtt-status d3b-mqtt-connected";
      });
    }

    return client;
  }

  function disconnect(chartId) {
    var client = _connections[chartId];
    if (client) {
      client.end();
      delete _connections[chartId];
    }
  }

  function disconnectAll() {
    Object.keys(_connections).forEach(function (id) {
      disconnect(id);
    });
  }

  return {
    connect: connect,
    disconnect: disconnect,
    disconnectAll: disconnectAll,
    connections: _connections,
  };
})();
