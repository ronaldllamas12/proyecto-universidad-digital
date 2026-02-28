from __future__ import annotations
from decimal import Decimal
from typing import Annotated
from pydantic import BaseModel, Field
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class GradeCreate(BaseModel):
    """Datos requeridos para registrar una calificación."""

    enrollment_id: int = Field(ge=1)

    value: Annotated[
        Decimal,
        Field(ge=0, le=100, max_digits=5, decimal_places=2)
    ]

    notes: str | None = Field(default=None, max_length=255)


class GradeUpdate(BaseModel):
    """Datos permitidos para actualizar una calificación."""

    value: Annotated[
        Decimal,
        Field(ge=0, le=100, max_digits=5, decimal_places=2)
    ] | None = None

    notes: str | None = Field(default=None, max_length=255)
class GradeResponse(BaseModel):
    """Datos expuestos al cliente.

    - value=None cuando el usuario es Administrador.
    - subject_name y user_name se rellenan desde las relaciones.
    """

    model_config = ConfigDict(from_attributes=True)

    id: int
    enrollment_id: int
    value: Decimal | None = None
    notes: str | None = None
    created_at: datetime
    user_name: str | None = None
    subject_name: str | None = None
