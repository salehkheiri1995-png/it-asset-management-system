from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timedelta
from typing import List

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter()


def _load(db, inspection_id):
    ins = (
        db.query(models.Inspection)
        .options(
            joinedload(models.Inspection.asset).joinedload(models.Asset.asset_type),
            joinedload(models.Inspection.inspector_employee).joinedload(models.Employee.department),
            joinedload(models.Inspection.received_from).joinedload(models.Employee.department),
            joinedload(models.Inspection.delivered_to).joinedload(models.Employee.department),
        )
        .get(inspection_id)
    )
    if not ins:
        return None
    # attach current_holder (active assignment holder at query time)
    if ins.asset_id:
        active = (
            db.query(models.AssetAssignment)
            .filter(
                models.AssetAssignment.asset_id == ins.asset_id,
                models.AssetAssignment.status == "assigned",
            )
            .options(joinedload(models.AssetAssignment.employee).joinedload(models.Employee.department))
            .first()
        )
        ins.current_holder = active.employee if active else None
    else:
        ins.current_holder = None
    return ins


@router.get("/", response_model=List[schemas.InspectionOut])
def list_inspections(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    rows = (
        db.query(models.Inspection)
        .options(
            joinedload(models.Inspection.asset).joinedload(models.Asset.asset_type),
            joinedload(models.Inspection.inspector_employee).joinedload(models.Employee.department),
            joinedload(models.Inspection.received_from).joinedload(models.Employee.department),
            joinedload(models.Inspection.delivered_to).joinedload(models.Employee.department),
        )
        .order_by(models.Inspection.due_at.asc())
        .all()
    )
    # enrich with current_holder
    for ins in rows:
        if ins.asset_id:
            active = (
                db.query(models.AssetAssignment)
                .filter(
                    models.AssetAssignment.asset_id == ins.asset_id,
                    models.AssetAssignment.status == "assigned",
                )
                .options(joinedload(models.AssetAssignment.employee).joinedload(models.Employee.department))
                .first()
            )
            ins.current_holder = active.employee if active else None
        else:
            ins.current_holder = None
    return rows


@router.post("/", response_model=schemas.InspectionOut)
def create_inspection(
    inspection_in: schemas.InspectionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    data = inspection_in.model_dump()
    inspection = models.Inspection(**data)
    db.add(inspection)
    db.commit()
    db.refresh(inspection)
    return _load(db, inspection.id)


@router.put("/{inspection_id}", response_model=schemas.InspectionOut)
def update_inspection(
    inspection_id: int,
    update_in: schemas.InspectionUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    inspection = db.query(models.Inspection).get(inspection_id)
    if not inspection:
        raise HTTPException(status_code=404, detail="بازرسی یافت نشد.")
    for k, v in update_in.model_dump(exclude_unset=True).items():
        setattr(inspection, k, v)
    db.commit()
    return _load(db, inspection.id)


@router.post("/{inspection_id}/complete", response_model=schemas.InspectionOut)
def complete_inspection(
    inspection_id: int,
    update_in: schemas.InspectionUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    """Mark an inspection as completed and record custody info."""
    inspection = db.query(models.Inspection).get(inspection_id)
    if not inspection:
        raise HTTPException(status_code=404, detail="بازرسی یافت نشد.")
    for k, v in update_in.model_dump(exclude_unset=True).items():
        setattr(inspection, k, v)
    if not inspection.completed_at:
        inspection.completed_at = datetime.utcnow()
    db.commit()
    # if asset result is repair/replace, update asset status
    if inspection.asset_id and inspection.result in (models.InspectionResult.repair, models.InspectionResult.replace):
        asset = db.query(models.Asset).get(inspection.asset_id)
        if asset:
            asset.status = models.AssetStatus.needs_repair
            db.commit()
    return _load(db, inspection.id)


@router.get("/alerts/today", response_model=List[schemas.InspectionOut])
def today_alerts(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    now = datetime.utcnow()
    soon = now + timedelta(days=3)
    rows = (
        db.query(models.Inspection)
        .filter(
            models.Inspection.due_at <= soon,
            models.Inspection.completed_at.is_(None),
        )
        .options(
            joinedload(models.Inspection.asset).joinedload(models.Asset.asset_type),
            joinedload(models.Inspection.inspector_employee),
        )
        .all()
    )
    for ins in rows:
        ins.current_holder = None
    return rows
