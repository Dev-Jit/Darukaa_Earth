from typing import Any

from geoalchemy2.shape import from_shape, to_shape
from shapely.geometry import mapping, shape
from shapely.validation import explain_validity


class GeoJSONValidationError(ValueError):
    """Raised when GeoJSON polygon input is invalid."""


def validate_geojson_polygon(geojson: dict[str, Any]) -> dict[str, Any]:
    if geojson.get("type") != "Polygon":
        raise GeoJSONValidationError("Geometry must be a GeoJSON Polygon (type 'Polygon')")
    if "coordinates" not in geojson:
        raise GeoJSONValidationError("Polygon geometry must include coordinates")

    try:
        geom = shape(geojson)
    except (TypeError, ValueError) as exc:
        raise GeoJSONValidationError(f"Malformed GeoJSON coordinates: {exc}") from exc

    if geom.is_empty:
        raise GeoJSONValidationError("Polygon cannot be empty")
    if geom.geom_type != "Polygon":
        raise GeoJSONValidationError(f"Expected Polygon geometry, received {geom.geom_type}")
    if not geom.is_valid:
        reason = explain_validity(geom)
        raise GeoJSONValidationError(f"Invalid polygon geometry: {reason}")

    return mapping(geom)


def geojson_polygon_to_element(geojson: dict[str, Any]):
    validated = validate_geojson_polygon(geojson)
    return from_shape(shape(validated), srid=4326)


def geometry_element_to_geojson(geometry_element) -> dict[str, Any]:
    if geometry_element is None:
        raise GeoJSONValidationError("Geometry is missing")
    return mapping(to_shape(geometry_element))
