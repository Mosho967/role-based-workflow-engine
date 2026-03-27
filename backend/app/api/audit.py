# Audit routes: read-only access to audit log entries
from fastapi import APIRouter

router = APIRouter(prefix="/audit", tags=["audit"])
