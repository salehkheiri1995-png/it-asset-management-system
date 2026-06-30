from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter()


@router.get("/", response_model=List[schemas.AssignmentOut])
def list_assignments(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    return db.query(models.AssetAssignment).all()


@router.post("/", response_model=schemas.AssignmentOut)
def create_assignment(
    assignment_in: schemas.AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    active_assignment = (
        db.query(models.AssetAssignment)
        .filter(
            models.AssetAssignment.asset_id == assignment_in.asset_id,
            models.AssetAssignment.status == "assigned",
        )
        .first()
    )
    if active_assignment:
        raise HTTPException(
            status_code=400,
            detail="این تجهیز هم‌اکنون به یک کارمند دیگر تخصیص داده شده است.",
        )

    assignment = models.AssetAssignment(**assignment_in.model_dump())
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


@router.post("/{assignment_id}/return", response_model=schemas.AssignmentOut)
def return_asset(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    assignment = db.query(models.AssetAssignment).get(assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="رکورد تخصیص یافت نشد.")
    assignment.returned_at = datetime.utcnow()
    assignment.status = "returned"
    db.commit()
    db.refresh(assignment)
    return assignment
