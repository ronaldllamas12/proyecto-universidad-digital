"""add teacher_id to enrollments

Revision ID: 001_teacher_id
Revises:
Create Date: 2025-02-15

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "001_teacher_id"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "enrollments",
        sa.Column("teacher_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "fk_enrollments_teacher_id_users",
        "enrollments",
        "users",
        ["teacher_id"],
        ["id"],
    )
    op.create_index(
        op.f("ix_enrollments_teacher_id"),
        "enrollments",
        ["teacher_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_enrollments_teacher_id"), table_name="enrollments")
    op.drop_constraint(
        "fk_enrollments_teacher_id_users",
        "enrollments",
        type_="foreignkey",
    )
    op.drop_column("enrollments", "teacher_id")
