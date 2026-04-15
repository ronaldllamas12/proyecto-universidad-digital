from datetime import date, timedelta

import pytest
from app.core.errors import ConflictError, NotFoundError
from app.periods.schemas import AcademicPeriodCreate, AcademicPeriodUpdate
from app.periods.services import (create_period, deactivate_period, get_period,
                                  list_periods, update_period)
from pydantic import ValidationError
from sqlalchemy.orm import Session

pytestmark = [pytest.mark.integration, pytest.mark.db]


def _period_data(
    code: str = "2026-1",
    name: str = "Periodo 2026-1",
    start: date | None = None,
    end: date | None = None,
) -> AcademicPeriodCreate:
    if start is None:
        start = date.today() + timedelta(days=1)
    if end is None:
        end = start + timedelta(days=180)
    return AcademicPeriodCreate(
        code=code,
        name=name,
        start_date=start,
        end_date=end,
    )


def test_create_period_success(db: Session) -> None:
    created = create_period(db, _period_data())

    assert created.id is not None
    assert created.code == "2026-1"
    assert created.name == "Periodo 2026-1"
    assert created.is_active is True


def test_create_period_raises_conflict_on_duplicate_code(db: Session) -> None:
    create_period(db, _period_data(code="2026-A"))

    with pytest.raises(ConflictError, match="código de periodo ya existe"):
        create_period(db, _period_data(code="2026-A"))


def test_create_period_rejects_start_date_in_past(db: Session) -> None:
    with pytest.raises(ConflictError, match="fecha de inicio no puede ser anterior"):
        create_period(
            db,
            _period_data(
                code="2026-PAST",
                start=date.today() - timedelta(days=1),
                end=date.today(),
            ),
        )


def test_create_period_schema_rejects_invalid_date_range() -> None:
    with pytest.raises(ValidationError, match="fecha de fin"):
        _period_data(
            code="2026-B",
            start=date(2026, 7, 1),
            end=date(2026, 1, 1),
        )


def test_list_periods_returns_ordered_periods(db: Session) -> None:
    create_period(db, _period_data(code="2026-1"))
    create_period(db, _period_data(code="2026-2", name="Periodo 2026-2"))

    periods = list_periods(db)

    assert len(periods) == 2
    assert periods[0].code == "2026-1"
    assert periods[1].code == "2026-2"


def test_get_period_raises_not_found_for_missing_id(db: Session) -> None:
    with pytest.raises(NotFoundError, match="Periodo académico no encontrado"):
        get_period(db, period_id=9999)


def test_update_period_allows_name_and_dates_change(db: Session) -> None:
    period = create_period(db, _period_data(code="2027-1"))

    updated = update_period(
        db,
        period_id=period.id,
        data=AcademicPeriodUpdate(
            name="Periodo Actualizado",
            start_date=date(2027, 2, 1),
            end_date=date(2027, 7, 1),
        ),
    )

    assert updated.name == "Periodo Actualizado"
    assert updated.start_date == date(2027, 2, 1)
    assert updated.end_date == date(2027, 7, 1)


def test_update_period_raises_conflict_when_only_end_date_is_invalid(db: Session) -> None:
    period = create_period(db, _period_data(code="2027-2"))

    with pytest.raises(ConflictError, match="fecha de fin"):
        update_period(
            db,
            period_id=period.id,
            data=AcademicPeriodUpdate(end_date=date(2025, 12, 31)),
        )


def test_deactivate_period_marks_period_inactive(db: Session) -> None:
    period = create_period(db, _period_data(code="2028-1"))

    deactivated = deactivate_period(db, period_id=period.id)

    assert deactivated.is_active is False
