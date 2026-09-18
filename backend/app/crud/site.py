from uuid import UUID

from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.site import Site
from app.services.site_metrics_seed import seed_site_metrics
from app.utils.geo import geojson_polygon_to_element


def create_site(
    db: Session,
    *,
    project: Project,
    name: str,
    geometry_geojson: dict,
) -> Site:
    site = Site(
        project_id=project.id,
        name=name.strip(),
        geometry=geojson_polygon_to_element(geometry_geojson),
    )
    db.add(site)
    db.commit()
    db.refresh(site)
    seed_site_metrics(db, site, replace=False, seed=None)
    db.refresh(site)
    return site


def get_site_for_owner(
    db: Session,
    site_id: UUID,
    owner_id: UUID,
) -> Site | None:
    return (
        db.query(Site)
        .join(Project, Site.project_id == Project.id)
        .filter(Site.id == site_id, Project.owner_id == owner_id)
        .first()
    )
