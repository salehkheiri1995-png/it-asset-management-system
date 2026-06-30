from sqlalchemy.orm import Session
from .database import Base, engine, SessionLocal
from . import models
from .auth import get_password_hash


def create_admin(db: Session):
    username = "admin"
    password = "Admin@123"
    existing = db.query(models.User).filter(models.User.username == username).first()
    if existing:
        print("Admin user already exists.")
        return

    admin_user = models.User(
        username=username,
        full_name="مدیر سیستم",
        email="admin@example.com",
        role=models.UserRole.admin,
        hashed_password=get_password_hash(password),
        is_active=True,
    )
    db.add(admin_user)
    db.commit()
    print("Admin user created:")
    print(f"  username: {username}")
    print(f"  password: {password}")


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    create_admin(db)
    db.close()
