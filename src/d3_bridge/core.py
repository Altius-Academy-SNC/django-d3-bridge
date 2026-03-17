"""Base Chart class — foundation for all D3 Bridge visualizations."""

from __future__ import annotations

import json
from typing import Any
from uuid import uuid4

from d3_bridge.data.serializers import serialize_data
from d3_bridge.themes import resolve_theme


class Chart:
    """Base class for all chart types.

    Subclasses set ``chart_type`` and override ``_build_config()``
    to add chart-specific options.
    """

    chart_type: str = "base"

    def __init__(self, data=None, **kw):
        self.id: str = kw.pop("id", f"d3b-{uuid4().hex[:8]}")
        self._raw_data = data
        self._fields: list[str] | None = None

        # Dimensions
        self.width: int | None = kw.pop("width", None)
        self.height: int = kw.pop("height", 400)
        self.responsive: bool = kw.pop("responsive", True)

        # Appearance
        self.theme: str = kw.pop("theme", "default")
        self.palette: str | list[str] | None = kw.pop("palette", None)
        self.title: str | None = kw.pop("title", None)
        self.subtitle: str | None = kw.pop("subtitle", None)
        self.animate: bool = kw.pop("animate", True)
        self.animation_duration: int = kw.pop("animation_duration", 750)

        # Margins
        self.margin: dict = kw.pop("margin", {"top": 40, "right": 30, "bottom": 50, "left": 60})

        # MQTT live
        self.live: bool = kw.pop("live", False)
        self.mqtt_topic: str | None = kw.pop("mqtt_topic", None)
        self.mqtt_broker: str | None = kw.pop("mqtt_broker", None)
        self.mqtt_window: int = kw.pop("mqtt_window", 100)
        self.mqtt_qos: int = kw.pop("mqtt_qos", 0)

        # Polling
        self.poll_url: str | None = kw.pop("poll_url", None)
        self.poll_interval: int = kw.pop("poll_interval", 0)  # seconds, 0 = disabled
        self.poll_replace: bool = kw.pop("poll_replace", True)  # True = replace data, False = append
        self.poll_window: int | None = kw.pop("poll_window", None)  # max data points when appending
        self.poll_headers: dict | None = kw.pop("poll_headers", None)

        # Escape hatch
        self._extra_js: str | None = None

        # Tooltip
        self.tooltip: bool | list[str] = kw.pop("tooltip", True)

        # Legend
        self.legend: bool = kw.pop("legend", True)

        # Store remaining kwargs for subclass use
        self._extra_kw = kw

    # ── Fluent API ──────────────────────────────────────────────

    def fields(self, *names: str) -> Chart:
        """Limit which fields are serialized from the data source."""
        self._fields = list(names)
        return self

    def extra_js(self, code: str) -> Chart:
        """Inject custom D3.js code (escape hatch)."""
        self._extra_js = code
        return self

    def set_theme(self, name: str) -> Chart:
        self.theme = name
        return self

    def set_margin(self, top=None, right=None, bottom=None, left=None) -> Chart:
        if top is not None:
            self.margin["top"] = top
        if right is not None:
            self.margin["right"] = right
        if bottom is not None:
            self.margin["bottom"] = bottom
        if left is not None:
            self.margin["left"] = left
        return self

    # ── Serialization ───────────────────────────────────────────

    def _serialize_data(self) -> Any:
        """Convert raw data to JSON-serializable format."""
        if self._raw_data is None:
            return []
        return serialize_data(self._raw_data, fields=self._fields)

    def _build_config(self) -> dict:
        """Override in subclasses to add chart-specific config keys."""
        return {}

    def to_config(self) -> dict:
        """Full config dict ready for JSON serialization to JS runtime."""
        theme_resolved = resolve_theme(self.theme, palette_override=self.palette)

        config = {
            "id": self.id,
            "type": self.chart_type,
            "data": self._serialize_data(),
            "width": self.width,
            "height": self.height,
            "responsive": self.responsive,
            "margin": self.margin,
            "theme": theme_resolved,
            "title": self.title,
            "subtitle": self.subtitle,
            "animate": self.animate,
            "animationDuration": self.animation_duration,
            "tooltip": self.tooltip,
            "legend": self.legend,
        }

        # MQTT
        if self.live:
            config["live"] = True
            config["mqtt"] = {
                "broker": self.mqtt_broker,
                "topic": self.mqtt_topic,
                "window": self.mqtt_window,
                "qos": self.mqtt_qos,
            }

        # Polling
        if self.poll_url and self.poll_interval > 0:
            config["poll"] = {
                "url": self.poll_url,
                "interval": self.poll_interval,
                "replace": self.poll_replace,
                "window": self.poll_window,
                "headers": self.poll_headers,
            }

        # Escape hatch
        if self._extra_js:
            config["extraJs"] = self._extra_js

        # Subclass-specific config
        config.update(self._build_config())

        return config

    def to_json(self, **kw) -> str:
        return json.dumps(self.to_config(), **kw)

    def __repr__(self):
        return f"<{self.__class__.__name__} id={self.id!r} type={self.chart_type!r}>"
