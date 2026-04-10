from datetime import date
from types import SimpleNamespace
from unittest.mock import Mock

import pytest
from app.core.errors import ConflictError, NotFoundError
from app.periods import services as periods_services
from app.periods.schemas import AcademicPeriodCreate, AcademicPeriodUpdate

pytestmark = [pytest.mark.unit]


def test_get_period_raises_not_found_when_missing():
    db = Mock()
    db.get.return_value = None

    with pytest.raises(NotFoundError, match="Periodo académico no encontrado"):
        periods_services.get_period(db, period_id=99)


def test_create_period_rejects_end_date_before_start_date():
    db = Mock()
    db.scalar.return_value = None
    data = AcademicPeriodCreate.model_construct(
        code="2026-A",
        name="Periodo inválido",
        start_date=date(2026, 5, 1),
        end_date=date(2026, 4, 1),
    )

    with pytest.raises(ConflictError, match="fecha de fin"):
        periods_services.create_period(db, data)


def test_create_period_rejects_same_day_end_when_start_is_today():
    db = Mock()
    db.scalar.return_value = None
    today = date.today()
    data = AcademicPeriodCreate.model_construct(
        code="2026-HOY",
        name="Periodo hoy",
        start_date=today,
        end_date=today,
    )

    with pytest.raises(ConflictError, match="fecha de inicio es hoy"):
        periods_services.create_period(db, data)


def test_update_period_rejects_start_date_after_existing_end(monkeypatch):
    db = Mock()
    period = SimpleNamespace(start_date=date(2026, 1, 1), end_date=date(2026, 3, 1))
    monkeypatch.setattr(periods_services, "get_period", lambda *_: period)

    with pytest.raises(ConflictError, match="fecha de fin"):
        periods_services.update_period(
            db,
            period_id=1,
            data=AcademicPeriodUpdate(start_date=date(2026, 4, 1)),
        )
