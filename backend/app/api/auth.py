# Auth routes: register, login, token refresh
from fastapi import APIRouter

router = APIRouter(prefix="/auth", tags=["auth"])
