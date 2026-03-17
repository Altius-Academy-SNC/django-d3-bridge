"""Theme definitions for D3 Bridge charts."""

from __future__ import annotations

from copy import deepcopy

# ── Palettes ────────────────────────────────────────────────────

PALETTES = {
    "tableau10": [
        "#4e79a7", "#f28e2b", "#e15759", "#76b7b2", "#59a14f",
        "#edc948", "#b07aa1", "#ff9da7", "#9c755f", "#bab0ac",
    ],
    "warm": [
        "#e6550d", "#fd8d3c", "#fdae6b", "#fdd0a2", "#feedde",
        "#d94701", "#a63603", "#7f2704", "#fee0b6", "#f5c98a",
    ],
    "cool": [
        "#3182bd", "#6baed6", "#9ecae1", "#c6dbef", "#deebf7",
        "#2171b5", "#08519c", "#08306b", "#bdd7e7", "#74add1",
    ],
    "earth": [
        "#2d6a4f", "#40916c", "#52b788", "#74c69d", "#95d5b2",
        "#b7e4c7", "#d8f3dc", "#1b4332", "#081c15", "#a7c957",
    ],
    "sahel": [
        "#e65100", "#f57c00", "#ff9800", "#ffb74d", "#ffe0b2",
        "#795548", "#a1887f", "#4e342e", "#bf360c", "#d84315",
    ],
    "ocean": [
        "#023e8a", "#0077b6", "#0096c7", "#00b4d8", "#48cae4",
        "#90e0ef", "#ade8f4", "#caf0f8", "#03045e", "#0466c8",
    ],
    "categorical8": [
        "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728",
        "#9467bd", "#8c564b", "#e377c2", "#7f7f7f",
    ],
}

# ── Themes ──────────────────────────────────────────────────────

THEMES = {
    "default": {
        "palette": PALETTES["tableau10"],
        "background": "transparent",
        "fontFamily": "inherit",
        "fontSize": 12,
        "titleFontSize": 16,
        "axisColor": "#666",
        "gridColor": "#e0e0e0",
        "gridOpacity": 0.4,
        "textColor": "#333",
        "tooltipBg": "#fff",
        "tooltipBorder": "#ccc",
        "tooltipColor": "#333",
        "animationDuration": 750,
        "animationEasing": "easeCubicOut",
    },
    "dark": {
        "palette": PALETTES["cool"],
        "background": "#1e1e2e",
        "fontFamily": "inherit",
        "fontSize": 12,
        "titleFontSize": 16,
        "axisColor": "#888",
        "gridColor": "#333",
        "gridOpacity": 0.3,
        "textColor": "#cdd6f4",
        "tooltipBg": "#313244",
        "tooltipBorder": "#45475a",
        "tooltipColor": "#cdd6f4",
        "animationDuration": 750,
        "animationEasing": "easeCubicOut",
    },
    "terraf": {
        "palette": PALETTES["earth"],
        "background": "transparent",
        "fontFamily": "'DM Sans', sans-serif",
        "fontSize": 12,
        "titleFontSize": 16,
        "axisColor": "#555",
        "gridColor": "#c8e6c9",
        "gridOpacity": 0.3,
        "textColor": "#1b4332",
        "tooltipBg": "#f1f8e9",
        "tooltipBorder": "#a5d6a7",
        "tooltipColor": "#1b4332",
        "animationDuration": 750,
        "animationEasing": "easeCubicOut",
    },
    "bootstrap": {
        "palette": [
            "#0d6efd", "#6610f2", "#6f42c1", "#d63384", "#dc3545",
            "#fd7e14", "#ffc107", "#198754", "#20c997", "#0dcaf0",
        ],
        "background": "transparent",
        "fontFamily": "inherit",
        "fontSize": 12,
        "titleFontSize": 16,
        "axisColor": "#6c757d",
        "gridColor": "#dee2e6",
        "gridOpacity": 0.4,
        "textColor": "#212529",
        "tooltipBg": "#fff",
        "tooltipBorder": "#dee2e6",
        "tooltipColor": "#212529",
        "animationDuration": 750,
        "animationEasing": "easeCubicOut",
    },
}


def resolve_theme(name: str = "default", palette_override: str | list | None = None) -> dict:
    """Return a theme dict, optionally overriding the palette."""
    theme = deepcopy(THEMES.get(name, THEMES["default"]))

    if palette_override:
        if isinstance(palette_override, str):
            theme["palette"] = PALETTES.get(palette_override, theme["palette"])
        elif isinstance(palette_override, list):
            theme["palette"] = palette_override

    return theme


def register_theme(name: str, config: dict) -> None:
    """Register a custom theme."""
    THEMES[name] = config


def register_palette(name: str, colors: list[str]) -> None:
    """Register a custom palette."""
    PALETTES[name] = colors
