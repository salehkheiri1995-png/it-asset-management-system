from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Text,
    Float,
)
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base
import enum


class UserRole(str, enum.Enum):
    admin = "admin"
    it_manager = "it_manager"
    technician = "technician"
    user = "user"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100))
    email = Column(String(100), unique=True, index=True)
    is_active = Column(Boolean, default=True)
    role = Column(Enum(UserRole), default=UserRole.user)
    created_at = Column(DateTime, default=datetime.utcnow)


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)

    employees = relationship("Employee", back_populates="department")


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    personnel_code = Column(String(50), unique=True, index=True, nullable=False)
    phone = Column(String(20))
    email = Column(String(100))
    building = Column(String(100))
    floor = Column(String(50))
    room = Column(String(50))
    is_active = Column(Boolean, default=True)
    photo_path = Column(String(255), nullable=True)

    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    department = relationship("Department", back_populates="employees")

    assignments = relationship("AssetAssignment", back_populates="employee")


class AssetType(Base):
    __tablename__ = "asset_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(Text, nullable=True)

    assets = relationship("Asset", back_populates="asset_type")


class AssetStatus(str, enum.Enum):
    healthy = "healthy"
    needs_repair = "needs_repair"
    broken = "broken"
    retired = "retired"


class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(100), unique=True, index=True, nullable=False)
    serial_number = Column(String(100), nullable=True)
    type_id = Column(Integer, ForeignKey("asset_types.id"))
    brand = Column(String(100))
    model = Column(String(100))
    cpu = Column(String(100))
    ram = Column(String(100))
    storage = Column(String(100))
    os = Column(String(100))
    mac_address = Column(String(50))
    purchase_date = Column(DateTime)
    purchase_price = Column(Float)
    warranty_end_date = Column(DateTime)
    status = Column(Enum(AssetStatus), default=AssetStatus.healthy)
    image_path = Column(String(255), nullable=True)

    asset_type = relationship("AssetType", back_populates="assets")
    assignments = relationship("AssetAssignment", back_populates="asset")
    inspections = relationship("Inspection", back_populates="asset")
    tickets = relationship("Ticket", back_populates="asset")


class AssetAssignment(Base):
    __tablename__ = "asset_assignments"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow)
    expected_return_date = Column(DateTime, nullable=True)
    returned_at = Column(DateTime, nullable=True)
    status = Column(String(50), default="assigned")

    asset = relationship("Asset", back_populates="assignments")
    employee = relationship("Employee", back_populates="assignments")


class InspectionType(str, enum.Enum):
    hardware = "hardware"
    software = "software"
    security = "security"
    general = "general"


class InspectionResult(str, enum.Enum):
    ok = "ok"
    repair = "repair"
    replace = "replace"
    follow_up = "follow_up"
    issue_found = "issue_found"


class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=True)
    # inspector / responsible employee
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    type = Column(Enum(InspectionType), nullable=False)
    scheduled_at = Column(DateTime, nullable=False)
    due_at = Column(DateTime, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    result = Column(Enum(InspectionResult), nullable=True)
    notes = Column(Text, nullable=True)
    report_file_path = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # custody tracking ─────────────────────────────────────────────
    # who handed the device over for inspection
    received_from_employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    # who the device was returned / delivered to after inspection
    delivered_to_employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    # where the asset ended up: 'in_use' | 'in_storage' | 'repair'
    location_after = Column(String(50), nullable=True)

    asset = relationship("Asset", back_populates="inspections")
    inspector_employee = relationship("Employee", foreign_keys=[employee_id])
    received_from = relationship("Employee", foreign_keys=[received_from_employee_id])
    delivered_to = relationship("Employee", foreign_keys=[delivered_to_employee_id])


class TicketPriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"


class TicketStatus(str, enum.Enum):
    opened = "opened"
    in_review = "in_review"
    in_progress = "in_progress"
    done = "done"
    closed = "closed"


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(Enum(TicketPriority), default=TicketPriority.medium)
    status = Column(Enum(TicketStatus), default=TicketStatus.opened)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_to_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)

    asset = relationship("Asset", back_populates="tickets")
