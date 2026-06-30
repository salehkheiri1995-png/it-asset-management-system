from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter()


@router.get("/", response_model=List[schemas.TicketOut])
def list_tickets(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    return db.query(models.Ticket).all()


@router.post("/", response_model=schemas.TicketOut)
def create_ticket(
    ticket_in: schemas.TicketCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    ticket = models.Ticket(
        title=ticket_in.title,
        description=ticket_in.description,
        priority=ticket_in.priority,
        asset_id=ticket_in.asset_id,
        created_by_user_id=current_user.id,
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


@router.put("/{ticket_id}", response_model=schemas.TicketOut)
def update_ticket(
    ticket_id: int,
    ticket_in: schemas.TicketUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    ticket = db.query(models.Ticket).get(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="تیکت یافت نشد.")
    data = ticket_in.model_dump(exclude_unset=True)
    if "status" in data and data["status"] == models.TicketStatus.closed:
        ticket.closed_at = datetime.utcnow()
    for k, v in data.items():
        setattr(ticket, k, v)
    ticket.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(ticket)
    return ticket
