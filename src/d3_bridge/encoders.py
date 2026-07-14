"""Shared JSON encoding for chart configs.

Single source of truth used by ``Chart.to_json()``, the template tags and
``ChartDataView`` — so every output path serializes Decimal, date/datetime
and geometries the same way.
"""

from __future__ import annotations

import json
from datetime import date, datetime
from decimal import Decimal

# Same escapes as django.utils.html.json_script: a "</script>" (or an HTML
# comment opener) inside a JSON string must not be able to terminate the
# surrounding <script> block. Escaping <, >, & as \uXXXX keeps the payload
# valid JSON/JS while making it inert as HTML.
_SCRIPT_ESCAPES = {
    ord("<"): "\\u003C",
    ord(">"): "\\u003E",
    ord("&"): "\\u0026",
}


class BridgeJSONEncoder(json.JSONEncoder):
    """JSON encoder handling the Django types that show up in chart data."""

    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        if isinstance(obj, Decimal):
            return float(obj)
        if hasattr(obj, "__geo_interface__"):
            return obj.__geo_interface__
        return super().default(obj)


def dumps_script_safe(value, **kw) -> str:
    """``json.dumps`` whose output is safe to inline inside a <script> block."""
    kw.setdefault("cls", BridgeJSONEncoder)
    kw.setdefault("ensure_ascii", False)
    return json.dumps(value, **kw).translate(_SCRIPT_ESCAPES)
