"""Import all the models so that Base has them registered before being
imported by Alembic or the runtime application.
"""

from app.db.base_class import Base
from app.models.project import Project
from app.models.site import Site
from app.models.site_metric import SiteMetric
from app.models.user import User

__all__ = ["Base", "User", "Project", "Site", "SiteMetric"]
