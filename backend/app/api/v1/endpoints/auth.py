from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.security import create_access_token, verify_password
from app.crud import user as user_crud
from app.models.user import User
from app.schemas.auth import Token
from app.schemas.user import UserLogin, UserRegister, UserResponse

router = APIRouter()


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
)
def register(user_in: UserRegister, db: Session = Depends(get_db)) -> UserResponse:
    if user_crud.get_user_by_email(db, user_in.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        )
    user = user_crud.create_user(
        db,
        email=user_in.email,
        password=user_in.password,
        name=user_in.name,
    )
    return user


@router.post(
    "/login",
    response_model=Token,
    summary="Authenticate and receive a JWT access token",
)
def login(credentials: UserLogin, db: Session = Depends(get_db)) -> Token:
    user = user_crud.get_user_by_email(db, credentials.email)
    if user is None or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(user.id)
    return Token(access_token=access_token)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Return the currently authenticated user",
)
def read_current_user(current_user: User = Depends(get_current_user)) -> UserResponse:
    return current_user
