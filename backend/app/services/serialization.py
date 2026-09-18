from app.models.project import Project
from app.models.site import Site
from app.schemas.project import ProjectDetailResponse, ProjectListItem, ProjectResponse
from app.schemas.site import SiteResponse
from app.utils.geo import geometry_element_to_geojson


def site_to_response(site: Site) -> SiteResponse:
    return SiteResponse(
        id=site.id,
        project_id=site.project_id,
        name=site.name,
        geometry=geometry_element_to_geojson(site.geometry),
        created_at=site.created_at,
        updated_at=site.updated_at,
    )


def project_to_response(project: Project) -> ProjectResponse:
    return ProjectResponse.model_validate(project)


def project_to_list_item(project: Project) -> ProjectListItem:
    site_count = len(project.sites) if project.sites is not None else 0
    return ProjectListItem(
        id=project.id,
        name=project.name,
        description=project.description,
        owner_id=project.owner_id,
        created_at=project.created_at,
        updated_at=project.updated_at,
        site_count=site_count,
    )


def project_detail_to_response(project: Project) -> ProjectDetailResponse:
    return ProjectDetailResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        owner_id=project.owner_id,
        created_at=project.created_at,
        updated_at=project.updated_at,
        sites=[site_to_response(site) for site in project.sites],
    )
