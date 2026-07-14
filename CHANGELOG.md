# Changelog

All notable changes to django-d3-bridge are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.4] - 2026-07-14

### Security

- **XSS fix**: `{% d3_render %}` and `{% d3_json %}` now escape `<`, `>` and
  `&` (as `\u003C`, `\u003E`, `\u0026`) in the JSON config before inlining it
  in a `<script>` block — the same hardening as Django's `json_script`.
  Previously, a data value containing `</script><script>…` would break out of
  the script block and execute. The chart `id` is also escaped in the
  container's HTML attributes and JSON-encoded in the init script.

### Fixed

- `{% d3_scripts cdn=False %}` no longer references a missing file: D3 v7,
  mqtt.js v5 and d3-sankey 0.12.3 are now vendored in the package's static
  files, enabling a fully offline, CDN-free setup (including Sankey and MQTT).
- `ChartDataView`: `limit` is now applied **after** `filter_queryset()`.
  Overriding `filter_queryset()` with a `.filter()` call used to raise
  *"Cannot filter a query once a slice has been taken"* whenever `limit` was set.
- `Chart.to_json()` now uses the shared bridge encoder and therefore handles
  `Decimal`, `date`/`datetime` and geometry values, consistently with
  `{% d3_render %}` and `ChartDataView`.
- `{% d3_render %}` no longer mutates the chart instance: per-render overrides
  (`theme=`, `height=`, …) are applied to the rendered config only, so the
  same chart can be rendered multiple times with different options.

### Added

- `d3_bridge.encoders.BridgeJSONEncoder` — single JSON encoder shared by the
  template tags, `ChartDataView` and `Chart.to_json()` (previously duplicated
  in three modules).
- Accessibility: every chart SVG now carries `role="img"`, an `aria-label`
  derived from the chart title (or chart type), and a `<title>` element.
- Test coverage for the template tags, `ChartDataView` and the serializers.
- This changelog (retroactive for 0.1.0 → 0.1.3).

### Documentation

- Polling guide: warning that `poll_headers` values end up in the page's HTML
  in clear text — don't put secrets there; prefer session/cookie auth.

## [0.1.3] - 2026-07-09

### Fixed

- Sankey plugin loading (d3-sankey is not part of core D3; now loaded via the
  `sankey` option of `{% d3_scripts %}` or the `D3_BRIDGE["SANKEY"]` setting).
- Sequential color scales: CSS custom properties (`var(--x)`) and modern color
  functions (`oklch()`, `color-mix()`) are resolved through the browser before
  being handed to d3-color, instead of silently interpolating to black.
- Choropleth rendering: Polygon/MultiPolygon winding order is normalized to
  what d3-geo's spherical clipping expects (RFC 7946 exports rendered as
  corrupted shapes / collapsed `fitSize` scale).
- Force graph layout.

## [0.1.2] - 2026-07-02

### Fixed

- Infinite "No data" loop when a chart dataset is empty: the empty-state
  placeholder now keeps the container height stable so the responsive
  `ResizeObserver` no longer retriggers rendering forever.

## [0.1.1] - 2026-03-17

### Fixed

- Lint errors.

### Documentation

- Improved README with links and badges.

## [0.1.0] - 2026-03-17

### Added

- Initial release: declarative D3.js visualizations for Django.
- 19 chart types (bar, line, area, pie, donut, scatter, density, choropleth,
  bubble map, force graph, sankey, chord, tree, dendrogram, treemap, pack,
  sunburst, contour, voronoi).
- `{% d3_scripts %}` and `{% d3_render %}` template tags.
- Themes and palettes, MQTT live updates, HTTP polling, GeoJSON serialization.
- `ChartDataView` JSON endpoint (no DRF dependency).
- Documentation site (30 pages) and CI/CD with PyPI trusted publishing.
