/**
 * D3 Bridge — Polling Module
 *
 * Auto-refreshes chart data via fetch() at a configurable interval.
 * No MQTT, no WebSocket — just plain HTTP.
 *
 * Features:
 *   - Configurable interval (seconds)
 *   - Replace or append mode
 *   - Sliding window (max data points)
 *   - Pauses when tab is hidden (Page Visibility API)
 *   - Exponential backoff on errors
 *   - CSRF token support (Django-friendly)
 *   - Custom headers
 */
var D3BridgePoll = (function () {
  "use strict";

  var _pollers = {};

  /**
   * Get Django CSRF token from cookie.
   */
  function getCsrfToken() {
    var match = document.cookie.match(/csrftoken=([^;]+)/);
    return match ? match[1] : null;
  }

  /**
   * Start polling for a chart.
   *
   * @param {string} chartId - The chart container ID.
   * @param {object} pollConfig - { url, interval, replace, window, headers }
   * @param {object} chartInstance - The chart instance with update() method.
   */
  function start(chartId, pollConfig, chartInstance) {
    if (!pollConfig || !pollConfig.url || !pollConfig.interval) {
      return null;
    }

    // Stop existing poller if any
    stop(chartId);

    var intervalMs = pollConfig.interval * 1000;
    var baseInterval = intervalMs;
    var currentInterval = intervalMs;
    var maxBackoff = intervalMs * 16; // max 16x the base interval
    var consecutiveErrors = 0;
    var timerId = null;
    var paused = false;
    var destroyed = false;
    var accumulatedData = null; // for append mode

    // Build headers
    var headers = { Accept: "application/json" };
    var csrf = getCsrfToken();
    if (csrf) {
      headers["X-CSRFToken"] = csrf;
    }
    if (pollConfig.headers) {
      Object.keys(pollConfig.headers).forEach(function (k) {
        headers[k] = pollConfig.headers[k];
      });
    }

    function doFetch() {
      if (destroyed || paused) return;

      fetch(pollConfig.url, {
        method: "GET",
        headers: headers,
        credentials: "same-origin",
      })
        .then(function (response) {
          if (!response.ok) {
            throw new Error("HTTP " + response.status);
          }
          return response.json();
        })
        .then(function (newData) {
          consecutiveErrors = 0;
          currentInterval = baseInterval;

          var instance = D3Bridge.getChart(chartId) || chartInstance;
          if (!instance || !instance.update) return;

          if (pollConfig.replace) {
            // Replace mode: full data swap
            instance.update(newData);
          } else {
            // Append mode: add new data points
            if (accumulatedData === null) {
              // First fetch in append mode — use as base
              accumulatedData = Array.isArray(newData) ? newData : [];
            } else {
              var incoming = Array.isArray(newData) ? newData : [newData];
              accumulatedData = accumulatedData.concat(incoming);
            }

            // Sliding window
            if (pollConfig.window && accumulatedData.length > pollConfig.window) {
              accumulatedData = accumulatedData.slice(
                accumulatedData.length - pollConfig.window
              );
            }

            instance.update(accumulatedData);
          }

          scheduleNext();
        })
        .catch(function (err) {
          console.warn(
            "[D3BridgePoll] Error fetching " + pollConfig.url + ":",
            err.message
          );
          consecutiveErrors++;
          // Exponential backoff
          currentInterval = Math.min(
            baseInterval * Math.pow(2, consecutiveErrors),
            maxBackoff
          );
          scheduleNext();
        });
    }

    function scheduleNext() {
      if (destroyed) return;
      timerId = setTimeout(doFetch, currentInterval);
    }

    // ── Page Visibility: pause when tab is hidden ────────
    function onVisibilityChange() {
      if (document.hidden) {
        paused = true;
        if (timerId) {
          clearTimeout(timerId);
          timerId = null;
        }
      } else {
        paused = false;
        // Fetch immediately on tab return, then resume schedule
        doFetch();
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    // Start first fetch after one interval
    scheduleNext();

    // Add status indicator
    var container = document.getElementById(chartId);
    if (container) {
      var indicator = document.createElement("div");
      indicator.className = "d3b-poll-status";
      indicator.title = "Polling every " + pollConfig.interval + "s: " + pollConfig.url;
      indicator.innerHTML = "&#8635; " + pollConfig.interval + "s";
      container.style.position = "relative";
      container.appendChild(indicator);
    }

    var poller = {
      stop: function () {
        destroyed = true;
        if (timerId) clearTimeout(timerId);
        document.removeEventListener("visibilitychange", onVisibilityChange);
      },
      pause: function () {
        paused = true;
        if (timerId) {
          clearTimeout(timerId);
          timerId = null;
        }
      },
      resume: function () {
        paused = false;
        doFetch();
      },
      setInterval: function (seconds) {
        baseInterval = seconds * 1000;
        currentInterval = baseInterval;
      },
    };

    _pollers[chartId] = poller;
    return poller;
  }

  function stop(chartId) {
    var poller = _pollers[chartId];
    if (poller) {
      poller.stop();
      delete _pollers[chartId];
    }
  }

  function stopAll() {
    Object.keys(_pollers).forEach(function (id) {
      stop(id);
    });
  }

  function getPoller(chartId) {
    return _pollers[chartId] || null;
  }

  return {
    start: start,
    stop: stop,
    stopAll: stopAll,
    getPoller: getPoller,
    pollers: _pollers,
  };
})();
