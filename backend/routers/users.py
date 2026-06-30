from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter()


@router.post("/register", response_model=schemas.UserOut)
def register_user(
    user_in: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    if current_user.role not in (models.UserRole.admin, models.UserRole.it_manager):
        raise HTTPException(status_code=403, detail="دسترسی غیرمجاز.")

    existing = (
        db.query(models.User)
        .filter(
            (models.User.username == user_in.username)
            | (models.User.email == user_in.email)
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="کاربر با این نام کاربری/ایمیل وجود دارد.")

    hashed_password = auth.get_password_hash(user_in.password)
    db_user = models.User(
        username=user_in.username,
        full_name=user_in.full_name,
        email=user_in.email,
        role=user_in.role,
        hashed_password=hashed_password,
        is_active=user_in.is_active,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.post("/login", response_model=schemas.Token)
def login(
    login_req: schemas.LoginRequest,
    db: Session = Depends(get_db),
):
    user = auth.authenticate_user(db, login_req.username, login_req.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="نام کاربری یا رمز عبور اشتباه است.",
        )
    access_token = auth.create_access_token(data={"sub": user.username})
    return schemas.Token(access_token=access_token)


@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(auth.get_current_active_user)):
    return current_user


@router.get("/", response_model=List[schemas.UserOut])
def list_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    if current_user.role not in (models.UserRole.admin, models.UserRole.it_manager):
        raise HTTPException(status_code=403, detail="دسترسی غیرمجاز.")
    users = db.query(models.User).all()
    return users
