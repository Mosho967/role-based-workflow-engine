# Transition routes: trigger and validate state transitions on tasks
from fastapi import APIRouter

router = APIRouter(prefix="/transitions", tags=["transitions"])
