"""add comment to audit_logs

Revision ID: a1b2c3d4e5f6
Revises: 96521092a332
Create Date: 2026-05-06 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '96521092a332'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('audit_logs', sa.Column('comment', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('audit_logs', 'comment')
