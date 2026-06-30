from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter()


@router.get("/dashboard", response_model=schemas.DashboardStats)
def dashboard_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    total_assets = db.query(models.Asset).count()
    assigned_assets = (
        db.query(models.AssetAssignment)
        .filter(models.AssetAssignment.status == "assigned")
        .count()
    )
    open_tickets = (
        db.query(models.Ticket)
        .filter(models.Ticket.status != models.TicketStatus.closed)
        .count()
    )
    overdue_inspections = (
        db.query(models.Inspection)
        .filter(
            models.Inspection.due_at < datetime.utcnow(),
            models.Inspection.completed_at.is_(None),
        )
        .count()
    )

    return schemas.DashboardStats(
        total_assets=total_assets,
        assigned_assets=assigned_assets,
        open_tickets=open_tickets,
        overdue_inspections=overdue_inspections,
    )


@router.get("/tickets/monthly", response_model=list[schemas.ChartDataPoint])
def tickets_by_month(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    now = datetime.utcnow()
    points: list[schemas.ChartDataPoint] = []
    for i in range(5, -1, -1):
        start = datetime(now.year, now.month, 1) - timedelta(days=30 * i)
        end = start + timedelta(days=30)
        count = (
            db.query(models.Ticket)
            .filter(models.Ticket.created_at >= start, models.Ticket.created_at < end)
            .count()
        )
        label = f"{start.year}-{start.month:02d}"
        points.append(schemas.ChartDataPoint(label=label, value=count))
    return points
