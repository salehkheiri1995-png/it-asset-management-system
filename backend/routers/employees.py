from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter()


# ── Departments ─────────────────────────────────────────────────────────────

@router.get("/departments/", response_model=List[schemas.DepartmentOut])
def list_departments(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    return db.query(models.Department).all()


@router.post("/departments/", response_model=schemas.DepartmentOut)
def create_department(
    dept_in: schemas.DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    existing = db.query(models.Department).filter(models.Department.name == dept_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="واحدی با این نام وجود دارد.")
    obj = models.Department(**dept_in.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/departments/{dept_id}", response_model=schemas.DepartmentOut)
def update_department(
    dept_id: int,
    dept_in: schemas.DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    obj = db.query(models.Department).get(dept_id)
    if not obj:
        raise HTTPException(status_code=404, detail="واحد یافت نشد.")
    for k, v in dept_in.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/departments/{dept_id}")
def delete_department(
    dept_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    obj = db.query(models.Department).get(dept_id)
    if not obj:
        raise HTTPException(status_code=404, detail="واحد یافت نشد.")
    if db.query(models.Employee).filter(models.Employee.department_id == dept_id).count() > 0:
        raise HTTPException(status_code=400, detail="ابتدا کارمندان این واحد را جابجا کنید.")
    db.delete(obj)
    db.commit()
    return {"detail": "حذف شد."}


# ── Employees ───────────────────────────────────────────────────────────────

@router.get("/", response_model=List[schemas.EmployeeOut])
def list_employees(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    return (
        db.query(models.Employee)
        .options(joinedload(models.Employee.department))
        .all()
    )


@router.post("/", response_model=schemas.EmployeeOut)
def create_employee(
    employee_in: schemas.EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    if employee_in.department_id and not db.query(models.Department).get(employee_in.department_id):
        raise HTTPException(status_code=400, detail="واحد سازمانی انتخاب شده وجود ندارد.")
    db_employee = models.Employee(**employee_in.model_dump())
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    db.refresh(db_employee, ['department'])
    return db_employee


@router.get("/{employee_id}/profile")
def get_employee_profile(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    """Full profile: employee info + current assets + all assignments history + inspections + tickets."""
    emp = (
        db.query(models.Employee)
        .options(joinedload(models.Employee.department))
        .get(employee_id)
    )
    if not emp:
        raise HTTPException(status_code=404, detail="کارمند یافت نشد.")

    # ─ assignments (all history) ────────────────────────────────────────
    assignments = (
        db.query(models.AssetAssignment)
        .filter(models.AssetAssignment.employee_id == employee_id)
        .options(
            joinedload(models.AssetAssignment.asset).joinedload(models.Asset.asset_type)
        )
        .order_by(models.AssetAssignment.assigned_at.desc())
        .all()
    )

    # ─ inspections related to this employee's assets ──────────────────
    # inspections where employee_id matches OR asset is currently/was assigned to them
    asset_ids = list({a.asset_id for a in assignments})
    inspections = []
    if asset_ids:
        inspections = (
            db.query(models.Inspection)
            .filter(models.Inspection.asset_id.in_(asset_ids))
            .options(
                joinedload(models.Inspection.asset).joinedload(models.Asset.asset_type),
                joinedload(models.Inspection.inspector_employee),
            )
            .order_by(models.Inspection.due_at.desc())
            .all()
        )

    # ─ tickets related to assets assigned to this employee ─────────
    tickets = []
    if asset_ids:
        tickets = (
            db.query(models.Ticket)
            .filter(models.Ticket.asset_id.in_(asset_ids))
            .options(joinedload(models.Ticket.asset).joinedload(models.Asset.asset_type))
            .order_by(models.Ticket.created_at.desc())
            .all()
        )

    def asset_mini(a):
        if not a:
            return None
        return {
            "id": a.id,
            "code": a.code,
            "brand": a.brand,
            "model": a.model,
            "status": a.status,
            "asset_type": {"id": a.asset_type.id, "name": a.asset_type.name} if a.asset_type else None,
        }

    return {
        "employee": {
            "id": emp.id,
            "first_name": emp.first_name,
            "last_name": emp.last_name,
            "personnel_code": emp.personnel_code,
            "phone": emp.phone,
            "email": emp.email,
            "building": emp.building,
            "floor": emp.floor,
            "room": emp.room,
            "is_active": emp.is_active,
            "department": {"id": emp.department.id, "name": emp.department.name} if emp.department else None,
        },
        "assignments": [
            {
                "id": a.id,
                "asset": asset_mini(a.asset),
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
                "asset": asset_mini(ins.asset),
                "type": ins.type,
                "scheduled_at": ins.scheduled_at,
                "due_at": ins.due_at,
                "completed_at": ins.completed_at,
                "result": ins.result,
                "notes": ins.notes,
                "inspector": (
                    f"{ins.inspector_employee.first_name} {ins.inspector_employee.last_name}"
                    if ins.inspector_employee else None
                ),
            }
            for ins in inspections
        ],
        "tickets": [
            {
                "id": t.id,
                "title": t.title,
                "description": t.description,
                "priority": t.priority,
                "status": t.status,
                "asset": asset_mini(t.asset),
                "created_at": t.created_at,
                "closed_at": t.closed_at,
            }
            for t in tickets
        ],
        "stats": {
            "total_assignments": len(assignments),
            "active_assignments": sum(1 for a in assignments if a.status == "assigned"),
            "total_inspections": len(inspections),
            "pending_inspections": sum(1 for i in inspections if not i.completed_at),
            "total_tickets": len(tickets),
            "open_tickets": sum(1 for t in tickets if t.status not in ("done", "closed")),
        },
    }


@router.get("/{employee_id}", response_model=schemas.EmployeeOut)
def get_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    employee = (
        db.query(models.Employee)
        .options(joinedload(models.Employee.department))
        .get(employee_id)
    )
    if not employee:
        raise HTTPException(status_code=404, detail="کارمند یافت نشد.")
    return employee


@router.put("/{employee_id}", response_model=schemas.EmployeeOut)
def update_employee(
    employee_id: int,
    employee_in: schemas.EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    employee = db.query(models.Employee).get(employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="کارمند یافت نشد.")
    for k, v in employee_in.model_dump(exclude_unset=True).items():
        setattr(employee, k, v)
    db.commit()
    db.refresh(employee)
    return employee


@router.delete("/{employee_id}")
def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    employee = db.query(models.Employee).get(employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="کارمند یافت نشد.")
    db.delete(employee)
    db.commit()
    return {"detail": "حذف شد."}
