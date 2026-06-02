"""add task sharing (EP-06)

Revision ID: f1a8d4c5b210
Revises: e4b7c2a93f11
Create Date: 2026-06-02 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f1a8d4c5b210"
down_revision: Union[str, None] = "e4b7c2a93f11"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "task_collaborators",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("task_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["task_id"], ["tasks.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("task_id", "user_id", name="uq_task_collaborators_task_user"),
    )
    with op.batch_alter_table("task_collaborators", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_task_collaborators_id"), ["id"], unique=False)
        batch_op.create_index(batch_op.f("ix_task_collaborators_task_id"), ["task_id"], unique=False)
        batch_op.create_index(batch_op.f("ix_task_collaborators_user_id"), ["user_id"], unique=False)

    op.create_table(
        "task_share_invites",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("task_id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("token", sa.String(length=64), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("invited_by_user_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["invited_by_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["task_id"], ["tasks.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("task_share_invites", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_task_share_invites_email"), ["email"], unique=False)
        batch_op.create_index(batch_op.f("ix_task_share_invites_id"), ["id"], unique=False)
        batch_op.create_index(
            batch_op.f("ix_task_share_invites_invited_by_user_id"), ["invited_by_user_id"], unique=False
        )
        batch_op.create_index(batch_op.f("ix_task_share_invites_task_id"), ["task_id"], unique=False)
        batch_op.create_index(batch_op.f("ix_task_share_invites_token"), ["token"], unique=True)

    op.create_table(
        "task_share_links",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("task_id", sa.Integer(), nullable=False),
        sa.Column("token", sa.String(length=64), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("created_by_user_id", sa.Integer(), nullable=False),
        sa.Column("revoked_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["task_id"], ["tasks.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("task_share_links", schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f("ix_task_share_links_created_by_user_id"), ["created_by_user_id"], unique=False
        )
        batch_op.create_index(batch_op.f("ix_task_share_links_id"), ["id"], unique=False)
        batch_op.create_index(batch_op.f("ix_task_share_links_task_id"), ["task_id"], unique=False)
        batch_op.create_index(batch_op.f("ix_task_share_links_token"), ["token"], unique=True)


def downgrade() -> None:
    with op.batch_alter_table("task_share_links", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_task_share_links_token"))
        batch_op.drop_index(batch_op.f("ix_task_share_links_task_id"))
        batch_op.drop_index(batch_op.f("ix_task_share_links_id"))
        batch_op.drop_index(batch_op.f("ix_task_share_links_created_by_user_id"))
    op.drop_table("task_share_links")

    with op.batch_alter_table("task_share_invites", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_task_share_invites_token"))
        batch_op.drop_index(batch_op.f("ix_task_share_invites_task_id"))
        batch_op.drop_index(batch_op.f("ix_task_share_invites_invited_by_user_id"))
        batch_op.drop_index(batch_op.f("ix_task_share_invites_id"))
        batch_op.drop_index(batch_op.f("ix_task_share_invites_email"))
    op.drop_table("task_share_invites")

    with op.batch_alter_table("task_collaborators", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_task_collaborators_user_id"))
        batch_op.drop_index(batch_op.f("ix_task_collaborators_task_id"))
        batch_op.drop_index(batch_op.f("ix_task_collaborators_id"))
    op.drop_table("task_collaborators")
