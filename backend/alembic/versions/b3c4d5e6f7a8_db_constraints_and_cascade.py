"""db constraints and cascade

Revision ID: b3c4d5e6f7a8
Revises: a1b2c3d4e5f6
Create Date: 2026-05-20 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b3c4d5e6f7a8'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Unique workflow names
    op.create_unique_constraint('uq_workflow_name', 'workflows', ['name'])

    # One initial state per workflow at DB level
    op.create_index(
        'uq_one_initial_per_workflow',
        'states',
        ['workflow_id'],
        unique=True,
        postgresql_where=sa.text('is_initial = true'),
    )

    # audit_logs.from_state_id → SET NULL on state delete (column is already nullable)
    op.drop_constraint('audit_logs_from_state_id_fkey', 'audit_logs', type_='foreignkey')
    op.create_foreign_key(
        'audit_logs_from_state_id_fkey',
        'audit_logs', 'states',
        ['from_state_id'], ['id'],
        ondelete='SET NULL',
    )


def downgrade() -> None:
    op.drop_constraint('audit_logs_from_state_id_fkey', 'audit_logs', type_='foreignkey')
    op.create_foreign_key(
        'audit_logs_from_state_id_fkey',
        'audit_logs', 'states',
        ['from_state_id'], ['id'],
    )

    op.drop_index('uq_one_initial_per_workflow', table_name='states')

    op.drop_constraint('uq_workflow_name', 'workflows', type_='unique')
