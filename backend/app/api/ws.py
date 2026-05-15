import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.notifications import manager
from app.db.session import SessionLocal
from app.models.user import User

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str, token: str = Query(...)):
    db: Session = SessionLocal()
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        subject = payload.get("sub")
        if subject != user_id:
            await websocket.close(code=4001)
            return
        user = db.query(User).filter(User.id == uuid.UUID(user_id)).first()
        if not user or not user.is_active:
            await websocket.close(code=4001)
            return
        role = user.role
    except JWTError:
        await websocket.close(code=4001)
        return
    finally:
        db.close()

    await manager.connect(user_id, role, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
