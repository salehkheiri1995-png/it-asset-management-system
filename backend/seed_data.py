from sqlalchemy.orm import Session
from .database import Base, engine, SessionLocal
from . import models


def seed(db: Session):
    if db.query(models.AssetType).count() == 0:
        asset_types = [
            models.AssetType(name="لپ‌تاپ"),
            models.AssetType(name="دسکتاپ"),
            models.AssetType(name="مانیتور"),
            models.AssetType(name="پرینتر"),
            models.AssetType(name="سوئیچ"),
            models.AssetType(name="روتر"),
        ]
        db.add_all(asset_types)

    if db.query(models.Department).count() == 0:
        departments = [
            models.Department(name="فناوری اطلاعات"),
            models.Department(name="اداره بهره‌برداری"),
            models.Department(name="اداره مالی"),
        ]
        db.add_all(departments)

    db.commit()


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed(db)
    db.close()
