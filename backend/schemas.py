from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field
from .models import (
    UserRole,
    AssetStatus,
    TicketPriority,
    TicketStatus,
    InspectionType,
    InspectionResult,
)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserBase(BaseModel):
    username: str
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: UserRole = UserRole.user
    is_active: bool = True


class UserCreate(UserBase):
    password: str = Field(min_length=6)


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class UserOut(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    username: str
    password: str


class DepartmentBase(BaseModel):
    name: str
    description: Optional[str] = None


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentOut(DepartmentBase):
    id: int

    class Config:
        from_attributes = True


class EmployeeBase(BaseModel):
    first_name: str
    last_name: str
    personnel_code: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    building: Optional[str] = None
    floor: Optional[str] = None
    room: Optional[str] = None
    is_active: bool = True
    department_id: Optional[int] = None


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    building: Optional[str] = None
    floor: Optional[str] = None
    room: Optional[str] = None
    is_active: Optional[bool] = None
    department_id: Optional[int] = None


class EmployeeOut(EmployeeBase):
    id: int

    class Config:
        from_attributes = True


class AssetTypeBase(BaseModel):
    name: str
    description: Optional[str] = None


class AssetTypeCreate(AssetTypeBase):
    pass


class AssetTypeOut(AssetTypeBase):
    id: int

    class Config:
        from_attributes = True


class AssetBase(BaseModel):
    code: str
    serial_number: Optional[str] = None
    type_id: int
    brand: Optional[str] = None
    model: Optional[str] = None
    cpu: Optional[str] = None
    ram: Optional[str] = None
    storage: Optional[str] = None
    os: Optional[str] = None
    mac_address: Optional[str] = None
    purchase_date: Optional[datetime] = None
    purchase_price: Optional[float] = None
    warranty_end_date: Optional[datetime] = None
    status: AssetStatus = AssetStatus.healthy


class AssetCreate(AssetBase):
    pass


class AssetUpdate(BaseModel):
    brand: Optional[str] = None
    model: Optional[str] = None
    cpu: Optional[str] = None
    ram: Optional[str] = None
    storage: Optional[str] = None
    os: Optional[str] = None
    mac_address: Optional[str] = None
    purchase_date: Optional[datetime] = None
    purchase_price: Optional[float] = None
    warranty_end_date: Optional[datetime] = None
    status: Optional[AssetStatus] = None


class AssetOut(AssetBase):
    id: int

    class Config:
        from_attributes = True


class AssignmentBase(BaseModel):
    asset_id: int
    employee_id: int
    expected_return_date: Optional[datetime] = None


class AssignmentCreate(AssignmentBase):
    pass


class AssignmentOut(AssignmentBase):
    id: int
    assigned_at: datetime
    returned_at: Optional[datetime] = None
    status: str

    class Config:
        from_attributes = True


class InspectionBase(BaseModel):
    asset_id: Optional[int] = None
    employee_id: Optional[int] = None
    type: InspectionType
    scheduled_at: datetime
    due_at: datetime


class InspectionCreate(InspectionBase):
    pass


class InspectionUpdate(BaseModel):
    completed_at: Optional[datetime] = None
    result: Optional[InspectionResult] = None
    notes: Optional[str] = None


class InspectionOut(InspectionBase):
    id: int
    completed_at: Optional[datetime] = None
    result: Optional[InspectionResult] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class TicketBase(BaseModel):
    title: str
    description: str
    priority: TicketPriority = TicketPriority.medium
    asset_id: Optional[int] = None


class TicketCreate(TicketBase):
    pass


class TicketUpdate(BaseModel):
    status: Optional[TicketStatus] = None
    priority: Optional[TicketPriority] = None
    assigned_to_user_id: Optional[int] = None


class TicketOut(TicketBase):
    id: int
    status: TicketStatus
    created_by_user_id: int
    assigned_to_user_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    closed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    total_assets: int
    assigned_assets: int
    open_tickets: int
    overdue_inspections: int


class ChartDataPoint(BaseModel):
    label: str
    value: int
