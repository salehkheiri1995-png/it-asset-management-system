from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter()


# helper: attach current_holder + location_status to an asset
def _enrich_asset(asset: models.Asset, db: Session) -> dict:
    active = (
        db.query(models.AssetAssignment)
        .filter(
            models.AssetAssignment.asset_id == asset.id,
            models.AssetAssignment.status == "assigned",
        )
        .options(joinedload(models.AssetAssignment.employee).joinedload(models.Employee.department))
        .first()
    )
    d = {c.name: getattr(asset, c.name) for c in asset.__table__.columns}
    d["asset_type"] = asset.asset_type
    d["current_holder"] = active.employee if active else None
    d["location_status"] = "in_use" if active else "in_storage"
    return d


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
    assets = (
        db.query(models.Asset)
        .options(joinedload(models.Asset.asset_type))
        .all()
    )
    return [_enrich_asset(a, db) for a in assets]


@router.post("/", response_model=schemas.AssetOut)
def create_asset(
    asset_in: schemas.AssetCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    existing = db.query(models.Asset).filter(models.Asset.code == asset_in.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="تجهیزی با این کد وجود دارد.")
    if not db.query(models.AssetType).get(asset_in.type_id):
        raise HTTPException(status_code=400, detail="نوع تجهیز انتخاب شده وجود ندارد.")
    asset = models.Asset(**asset_in.model_dump())
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return _enrich_asset(asset, db)


@router.get("/{asset_id}", response_model=schemas.AssetOut)
def get_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    asset = db.query(models.Asset).options(joinedload(models.Asset.asset_type)).get(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="تجهیز یافت نشد.")
    return _enrich_asset(asset, db)


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
    return _enrich_asset(asset, db)


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


@router.get("/{asset_id}/history")
def asset_history(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    """Full custody + inspection history for an asset."""
    asset = db.query(models.Asset).options(joinedload(models.Asset.asset_type)).get(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="تجهیز یافت نشد.")

    assignments = (
        db.query(models.AssetAssignment)
        .filter(models.AssetAssignment.asset_id == asset_id)
        .options(joinedload(models.AssetAssignment.employee).joinedload(models.Employee.department))
        .order_by(models.AssetAssignment.assigned_at.desc())
        .all()
    )
    inspections = (
        db.query(models.Inspection)
        .filter(models.Inspection.asset_id == asset_id)
        .options(
            joinedload(models.Inspection.inspector_employee),
            joinedload(models.Inspection.received_from),
            joinedload(models.Inspection.delivered_to),
        )
        .order_by(models.Inspection.scheduled_at.desc())
        .all()
    )

    def emp_mini(e):
        if not e:
            return None
        return {
            "id": e.id,
            "first_name": e.first_name,
            "last_name": e.last_name,
            "personnel_code": e.personnel_code,
            "department": {"id": e.department.id, "name": e.department.name} if e.department else None,
            "building": e.building,
            "floor": e.floor,
            "room": e.room,
        }

    return {
        "asset": {
            "id": asset.id,
            "code": asset.code,
            "brand": asset.brand,
            "model": asset.model,
            "status": asset.status,
            "asset_type": {"id": asset.asset_type.id, "name": asset.asset_type.name} if asset.asset_type else None,
        },
        "assignments": [
            {
                "id": a.id,
                "employee": emp_mini(a.employee),
                "assigned_at": a.assigned_at,
                "expected_return_date": a.expected_return_date,
                "returned_at": a.returned_at,
                "status": a.status,
            }
            for a in assignments
        ],
        "inspections": [
            {
                "id": ins.id,
                "type": ins.type,
                "scheduled_at": ins.scheduled_at,
                "due_at": ins.due_at,
                "completed_at": ins.completed_at,
                "result": ins.result,
                "notes": ins.notes,
                "inspector": emp_mini(ins.inspector_employee),
                "received_from": emp_mini(ins.received_from),
                "delivered_to": emp_mini(ins.delivered_to),
                "location_after": ins.location_after,
            }
            for ins in inspections
        ],
    }
