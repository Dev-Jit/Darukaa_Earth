from uuid import UUID

from sqlalchemy.orm import Session, selectinload

from app.models.project import Project


def create_project(
    db: Session,
    *,
    owner_id: UUID,
    name: str,
    description: str | None = None,
) -> Project:
    project = Project(
        owner_id=owner_id,
        name=name.strip(),
        description=description.strip() if description else None,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def list_projects_for_owner(
    db: Session,
    owner_id: UUID,
    *,
    load_sites: bool = False,
) -> list[Project]:
    query = db.query(Project).filter(Project.owner_id == owner_id)
    if load_sites:
        query = query.options(selectinload(Project.sites))
    return query.order_by(Project.created_at.desc()).all()


def get_project_for_owner(
    db: Session,
    project_id: UUID,
    owner_id: UUID,
    *,
    load_sites: bool = False,
) -> Project | None:
    query = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == owner_id,
    )
    if load_sites:
        query = query.options(selectinload(Project.sites))
    return query.first()
