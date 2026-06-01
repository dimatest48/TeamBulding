"""add collaboration and study sessions

Revision ID: c3a2f1d9e8b4
Revises: 9b8f2f0f5d2a
Create Date: 2026-06-01 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c3a2f1d9e8b4"
down_revision: Union[str, None] = "9b8f2f0f5d2a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "subject_members",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("subject_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("joined_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["subject_id"], ["subjects.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("subject_id", "user_id", name="uq_subject_members_subject_user"),
    )
    with op.batch_alter_table("subject_members", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_subject_members_id"), ["id"], unique=False)
        batch_op.create_index(batch_op.f("ix_subject_members_subject_id"), ["subject_id"], unique=False)
        batch_op.create_index(batch_op.f("ix_subject_members_user_id"), ["user_id"], unique=False)

    op.create_table(
        "subject_invites",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("subject_id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("token", sa.String(length=64), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("invited_by_user_id", sa.Integer(), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["invited_by_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["subject_id"], ["subjects.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("subject_invites", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_subject_invites_email"), ["email"], unique=False)
        batch_op.create_index(batch_op.f("ix_subject_invites_id"), ["id"], unique=False)
        batch_op.create_index(batch_op.f("ix_subject_invites_invited_by_user_id"), ["invited_by_user_id"], unique=False)
        batch_op.create_index(batch_op.f("ix_subject_invites_subject_id"), ["subject_id"], unique=False)
        batch_op.create_index(batch_op.f("ix_subject_invites_token"), ["token"], unique=True)

    op.create_table(
        "study_sessions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("task_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("planned_for", sa.DateTime(), nullable=True),
        sa.Column("completed", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["task_id"], ["tasks.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("study_sessions", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_study_sessions_id"), ["id"], unique=False)
        batch_op.create_index(batch_op.f("ix_study_sessions_task_id"), ["task_id"], unique=False)


def downgrade() -> None:
    with op.batch_alter_table("study_sessions", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_study_sessions_task_id"))
        batch_op.drop_index(batch_op.f("ix_study_sessions_id"))
    op.drop_table("study_sessions")

    with op.batch_alter_table("subject_invites", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_subject_invites_token"))
        batch_op.drop_index(batch_op.f("ix_subject_invites_subject_id"))
        batch_op.drop_index(batch_op.f("ix_subject_invites_invited_by_user_id"))
        batch_op.drop_index(batch_op.f("ix_subject_invites_id"))
        batch_op.drop_index(batch_op.f("ix_subject_invites_email"))
    op.drop_table("subject_invites")

    with op.batch_alter_table("subject_members", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_subject_members_user_id"))
        batch_op.drop_index(batch_op.f("ix_subject_members_subject_id"))
        batch_op.drop_index(batch_op.f("ix_subject_members_id"))
    op.drop_table("subject_members")
