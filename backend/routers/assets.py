from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter()


# ── Asset Types ─────────────────────────────────────────────────────────────

@router.get("/types/", response_model=List[schemas.AssetTypeOut])
def list_asset_types(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    return db.query(models.AssetType).all()


@router.post("/types/", response_model=schemas.AssetTypeOut)
def create_asset_type(
    type_in: schemas.AssetTypeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    existing = db.query(models.AssetType).filter(models.AssetType.name == type_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="نوع تجهیز با این نام وجود دارد.")
    obj = models.AssetType(**type_in.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/types/{type_id}", response_model=schemas.AssetTypeOut)
def update_asset_type(
    type_id: int,
    type_in: schemas.AssetTypeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    obj = db.query(models.AssetType).get(type_id)
    if not obj:
        raise HTTPException(status_code=404, detail="نوع تجهیز یافت نشد.")
    for k, v in type_in.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/types/{type_id}")
def delete_asset_type(
    type_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    obj = db.query(models.AssetType).get(type_id)
    if not obj:
        raise HTTPException(status_code=404, detail="نوع تجهیز یافت نشد.")
    db.delete(obj)
    db.commit()
    return {"detail": "حذف شد."}


# ── Assets ───────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[schemas.AssetOut])
def list_assets(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    return db.query(models.Asset).all()


@router.post("/", response_model=schemas.AssetOut)
def create_asset(
    asset_in: schemas.AssetCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    existing = db.query(models.Asset).filter(models.Asset.code == asset_in.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="تجهیزی با این کد وجود دارد.")
    # Validate type_id exists
    if not db.query(models.AssetType).get(asset_in.type_id):
        raise HTTPException(status_code=400, detail="نوع تجهیز انتخاب شده وجود ندارد.")
    asset = models.Asset(**asset_in.model_dump())
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset


@router.get("/{asset_id}", response_model=schemas.AssetOut)
def get_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    asset = db.query(models.Asset).get(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="تجهیز یافت نشد.")
    return asset


@router.put("/{asset_id}", response_model=schemas.AssetOut)
def update_asset(
    asset_id: int,
    asset_in: schemas.AssetUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    asset = db.query(models.Asset).get(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="تجهیز یافت نشد.")
    for k, v in asset_in.model_dump(exclude_unset=True).items():
        setattr(asset, k, v)
    db.commit()
    db.refresh(asset)
    return asset


@router.delete("/{asset_id}")
def delete_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    asset = db.query(models.Asset).get(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="تجهیز یافت نشد.")
    db.delete(asset)
    db.commit()
    return {"detail": "حذف شد."}
