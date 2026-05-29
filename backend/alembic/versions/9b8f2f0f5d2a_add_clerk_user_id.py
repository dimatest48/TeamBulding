"""add clerk user id

Revision ID: 9b8f2f0f5d2a
Revises: 7c9d67cd34d4
Create Date: 2026-05-29 08:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "9b8f2f0f5d2a"
down_revision: Union[str, None] = "7c9d67cd34d4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.add_column(sa.Column("clerk_user_id", sa.String(length=80), nullable=True))
        batch_op.create_index(batch_op.f("ix_users_clerk_user_id"), ["clerk_user_id"], unique=True)


def downgrade() -> None:
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_users_clerk_user_id"))
        batch_op.drop_column("clerk_user_id")
