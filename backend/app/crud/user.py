from uuid import UUID

from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.user import User


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email.lower()).first()


def get_user_by_id(db: Session, user_id: UUID) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def create_user(db: Session, *, email: str, password: str, name: str) -> User:
    user = User(
        email=email.lower(),
        hashed_password=get_password_hash(password),
        name=name.strip(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
