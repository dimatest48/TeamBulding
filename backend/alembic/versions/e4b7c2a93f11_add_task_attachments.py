"""add task attachments

Revision ID: e4b7c2a93f11
Revises: c3a2f1d9e8b4
Create Date: 2026-06-01 18:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e4b7c2a93f11"
down_revision: Union[str, None] = "c3a2f1d9e8b4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "task_attachments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("task_id", sa.Integer(), nullable=False),
        sa.Column("filename", sa.String(length=200), nullable=False),
        sa.Column("mime_type", sa.String(length=80), nullable=False),
        sa.Column("data_url", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["task_id"], ["tasks.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("task_attachments", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_task_attachments_id"), ["id"], unique=False)
        batch_op.create_index(batch_op.f("ix_task_attachments_task_id"), ["task_id"], unique=False)


def downgrade() -> None:
    with op.batch_alter_table("task_attachments", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_task_attachments_task_id"))
        batch_op.drop_index(batch_op.f("ix_task_attachments_id"))
    op.drop_table("task_attachments")
