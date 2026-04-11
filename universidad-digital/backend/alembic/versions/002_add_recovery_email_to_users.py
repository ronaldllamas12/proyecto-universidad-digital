"""add recovery_email to users

Revision ID: 002_recovery_email
Revises: 001_teacher_id
Create Date: 2026-04-10

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "002_recovery_email"
down_revision = "001_teacher_id"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("recovery_email", sa.String(length=255), nullable=True),
    )
    op.create_index(
        op.f("ix_users_recovery_email"),
        "users",
        ["recovery_email"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_users_recovery_email"), table_name="users")
    op.drop_column("users", "recovery_email")
