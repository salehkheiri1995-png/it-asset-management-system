from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter()


@router.get("/", response_model=List[schemas.InspectionOut])
def list_inspections(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    return db.query(models.Inspection).all()


@router.post("/", response_model=schemas.InspectionOut)
def create_inspection(
    inspection_in: schemas.InspectionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    inspection = models.Inspection(**inspection_in.model_dump())
    db.add(inspection)
    db.commit()
    db.refresh(inspection)
    return inspection


@router.get("/alerts/today", response_model=List[schemas.InspectionOut])
def today_alerts(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    now = datetime.utcnow()
    soon = now + timedelta(days=1)
    inspections = (
        db.query(models.Inspection)
        .filter(
            models.Inspection.due_at <= soon,
            models.Inspection.completed_at.is_(None),
        )
        .all()
    )
    return inspections
