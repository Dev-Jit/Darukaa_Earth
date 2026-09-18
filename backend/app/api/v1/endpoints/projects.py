from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.crud import project as project_crud
from app.crud import site as site_crud
from app.models.user import User
from app.schemas.project import (
    ProjectCreate,
    ProjectDetailResponse,
    ProjectListItem,
    ProjectResponse,
)
from app.schemas.site import SiteCreateBody, SiteResponse
from app.services.serialization import (
    project_detail_to_response,
    project_to_list_item,
    project_to_response,
    site_to_response,
)

router = APIRouter()


@router.post(
    "",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a project owned by the current user",
)
def create_project(
    project_in: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProjectResponse:
    project = project_crud.create_project(
        db,
        owner_id=current_user.id,
        name=project_in.name,
        description=project_in.description,
    )
    return project_to_response(project)


@router.get(
    "",
    response_model=list[ProjectListItem],
    summary="List projects owned by the current user",
)
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ProjectListItem]:
    projects = project_crud.list_projects_for_owner(
        db,
        current_user.id,
        load_sites=True,
    )
    return [project_to_list_item(project) for project in projects]


@router.get(
    "/{project_id}",
    response_model=ProjectDetailResponse,
    summary="Get project detail including sites",
)
def get_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProjectDetailResponse:
    project = project_crud.get_project_for_owner(
        db,
        project_id,
        current_user.id,
        load_sites=True,
    )
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    return project_detail_to_response(project)


@router.post(
    "/{project_id}/sites",
    response_model=SiteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a site with GeoJSON polygon boundary to a project",
)
def create_site_for_project(
    project_id: UUID,
    site_in: SiteCreateBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SiteResponse:
    project = project_crud.get_project_for_owner(db, project_id, current_user.id)
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    site = site_crud.create_site(
        db,
        project=project,
        name=site_in.name,
        geometry_geojson=site_in.geometry.to_geojson_dict(),
    )
    return site_to_response(site)
