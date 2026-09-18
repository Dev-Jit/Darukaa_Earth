from typing import Any

from pydantic import BaseModel, field_validator

from app.utils.geo import GeoJSONValidationError, validate_geojson_polygon


class GeoJSONPolygon(BaseModel):
    type: str
    coordinates: list[Any]

    @field_validator("type")
    @classmethod
    def polygon_type(cls, value: str) -> str:
        if value != "Polygon":
            raise ValueError("Geometry type must be 'Polygon'")
        return value

    @field_validator("coordinates")
    @classmethod
    def validate_coordinates(cls, value: list[Any]) -> list[Any]:
        try:
            validate_geojson_polygon({"type": "Polygon", "coordinates": value})
        except GeoJSONValidationError as exc:
            raise ValueError(str(exc)) from exc
        return value

    def to_geojson_dict(self) -> dict[str, Any]:
        return {"type": "Polygon", "coordinates": self.coordinates}
