from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import users, employees, assets, assignments, inspections, tickets, reports

app = FastAPI(title="IT Asset Management & Support System", version="1.0.0")

Base.metadata.create_all(bind=engine)

origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(employees.router, prefix="/api/employees", tags=["Employees"])
app.include_router(assets.router, prefix="/api/assets", tags=["Assets"])
app.include_router(assignments.router, prefix="/api/assignments", tags=["Assignments"])
app.include_router(inspections.router, prefix="/api/inspections", tags=["Inspections"])
app.include_router(tickets.router, prefix="/api/tickets", tags=["Tickets"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
