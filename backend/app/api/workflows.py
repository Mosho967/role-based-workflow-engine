# Workflow routes: CRUD for workflow definitions and states
from fastapi import APIRouter

router = APIRouter(prefix="/workflows", tags=["workflows"])
