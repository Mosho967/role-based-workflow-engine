import time
from collections import defaultdict, deque
from fastapi import WebSocket

MAX_NOTIFICATIONS = 30


class ConnectionManager:
    def __init__(self):
        self._connections: dict[str, list[WebSocket]] = defaultdict(list)
        self._roles: dict[str, str] = {}
        self._history: dict[str, deque] = defaultdict(lambda: deque(maxlen=MAX_NOTIFICATIONS))

    async def connect(self, user_id: str, role: str, websocket: WebSocket):
        await websocket.accept()
        self._connections[user_id].append(websocket)
        self._roles[user_id] = role
        for notification in self._history[user_id]:
            await websocket.send_json(notification)

    def disconnect(self, user_id: str, websocket: WebSocket):
        if websocket in self._connections[user_id]:
            self._connections[user_id].remove(websocket)

    async def send(self, user_id: str, data: dict):
        stamped = {**data, "ts": int(time.time() * 1000)}
        self._history[user_id].append(stamped)
        for ws in list(self._connections[user_id]):
            try:
                await ws.send_json(stamped)
            except Exception:
                self._connections[user_id].remove(ws)

    async def broadcast_to_role(self, role: str, data: dict, exclude_id: str | None = None):
        for user_id, user_role in list(self._roles.items()):
            if user_role == role and user_id != exclude_id:
                await self.send(user_id, data)


manager = ConnectionManager()
