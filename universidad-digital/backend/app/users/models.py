from __future__ import annotations

from datetime import datetime

from app.core.database import Base
from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship, validates


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    recovery_email: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=func.now()
    )

    roles = relationship("Role", secondary="user_roles", back_populates="users")
    enrollments = relationship(
        "Enrollment",
        back_populates="user",
        foreign_keys="Enrollment.user_id",
    )

    @validates("email")
    def _normalize_email(self, _: str, value: str) -> str:
        if email := value.strip().lower():
            return email
        else:
            raise ValueError("El email institucional es obligatorio.")

    @validates("recovery_email")
    def _normalize_recovery_email(self, _: str, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip().lower()
        return normalized or None

    @validates("full_name")
    def _normalize_full_name(self, _: str, value: str) -> str:
        name = value.strip()
        if name:= value.strip():
            return name
        else:
            raise ValueError("El nombre es obligatorio.")
        
