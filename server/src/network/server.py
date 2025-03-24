import asyncio
import json
import logging
from typing import Dict, Optional
from uuid import UUID
import websockets
from websockets.server import WebSocketServerProtocol

from src.models import GameState, Player, PlayerRole, GameSession

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GameServer:
    def __init__(self, host: str = "localhost", port: int = 8000):
        self.host = host
        self.port = port
        self.game_state = GameState()
        self.connections: Dict[UUID, WebSocketServerProtocol] = {}
        
    async def handle_connection(self, websocket: WebSocketServerProtocol):
        player_id = None
        try:
            async for message in websocket:
                data = json.loads(message)
                response = await self.handle_message(data, websocket)
                if response:
                    await websocket.send(json.dumps(response))
        except websockets.exceptions.ConnectionClosed:
            logger.info(f"Connection closed for player {player_id}")
        finally:
            if player_id:
                self.handle_disconnect(player_id)

    async def handle_message(self, data: dict, websocket: WebSocketServerProtocol) -> Optional[dict]:
        message_type = data.get("type")
        player_id = data.get("player_id")
        
        if message_type == "join":
            return await self.handle_join(data, websocket)
        elif message_type == "create_session":
            return await self.handle_create_session(data)
        elif message_type == "leave":
            return await self.handle_leave(data)
        else:
            return {"type": "error", "message": "Unknown message type"}

    async def handle_join(self, data: dict, websocket: WebSocketServerProtocol) -> dict:
        name = data.get("name")
        role = PlayerRole(data.get("role"))
        session_id = UUID(data.get("session_id"))
        
        player = self.game_state.create_player(name, role)
        self.connections[player.id] = websocket
        
        if self.game_state.join_session(player.id, session_id):
            return {
                "type": "joined",
                "player_id": str(player.id),
                "session_id": str(session_id)
            }
        return {"type": "error", "message": "Failed to join session"}

    async def handle_create_session(self, data: dict) -> dict:
        name = data.get("name")
        session = self.game_state.create_session(name)
        return {
            "type": "session_created",
            "session_id": str(session.id)
        }

    async def handle_leave(self, data: dict) -> dict:
        player_id = UUID(data.get("player_id"))
        if self.game_state.leave_session(player_id):
            return {"type": "left", "player_id": str(player_id)}
        return {"type": "error", "message": "Failed to leave session"}

    def handle_disconnect(self, player_id: UUID):
        self.game_state.leave_session(player_id)
        self.connections.pop(player_id, None)

    async def start(self):
        async with websockets.serve(self.handle_connection, self.host, self.port):
            logger.info(f"Game server started on ws://{self.host}:{self.port}")
            await asyncio.Future()  # run forever 