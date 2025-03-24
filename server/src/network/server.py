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
        elif message_type == "lobby":
            return await self.handle_lobby(data, websocket)
        elif message_type == "chat":
            return await self.handle_chat(data)
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

    async def handle_lobby(self, data: dict, websocket: WebSocketServerProtocol) -> dict:
        action = data.get("action")
        
        if action == "create":
            name = data.get("name")
            max_commanders = data.get("maxCommanders", 2)
            max_pawns = data.get("maxPawns", 4)
            session = self.game_state.create_session(name)
            session.max_commanders = max_commanders
            session.max_pawns = max_pawns
            return {
                "type": "lobby",
                "action": "update",
                "lobby": {
                    "id": str(session.id),
                    "name": session.name,
                    "commanders": [],
                    "pawns": [],
                    "maxCommanders": session.max_commanders,
                    "maxPawns": session.max_pawns,
                    "status": "waiting",
                    "created_at": session.created_at
                }
            }
            
        elif action == "join":
            lobby_id = UUID(data.get("lobby_id"))
            role = PlayerRole(data.get("role"))
            player = self.game_state.create_player(str(player_id), role)
            self.connections[player.id] = websocket
            
            if self.game_state.join_session(player.id, lobby_id):
                session = self.game_state.get_session(lobby_id)
                return {
                    "type": "lobby",
                    "action": "update",
                    "lobby": {
                        "id": str(session.id),
                        "name": session.name,
                        "commanders": [str(p.id) for p in session.players.values() if p.role == PlayerRole.COMMANDER],
                        "pawns": [str(p.id) for p in session.players.values() if p.role == PlayerRole.PAWN],
                        "maxCommanders": session.max_commanders,
                        "maxPawns": session.max_pawns,
                        "status": "waiting",
                        "created_at": session.created_at
                    }
                }
            return {"type": "error", "message": "Failed to join lobby"}
            
        elif action == "leave":
            lobby_id = UUID(data.get("lobby_id"))
            if player_id:
                if self.game_state.leave_session(UUID(player_id)):
                    return {"type": "lobby", "action": "update", "lobby_id": str(lobby_id)}
            return {"type": "error", "message": "Failed to leave lobby"}
            
        elif action == "list":
            return {
                "type": "lobby",
                "action": "list",
                "lobbies": [
                    {
                        "id": str(session.id),
                        "name": session.name,
                        "commanders": [str(p.id) for p in session.players.values() if p.role == PlayerRole.COMMANDER],
                        "pawns": [str(p.id) for p in session.players.values() if p.role == PlayerRole.PAWN],
                        "maxCommanders": session.max_commanders,
                        "maxPawns": session.max_pawns,
                        "status": "waiting" if not session.is_active else "in_progress",
                        "created_at": session.created_at
                    }
                    for session in self.game_state.sessions.values()
                ]
            }
            
        return {"type": "error", "message": "Unknown lobby action"}

    async def handle_chat(self, data: dict) -> dict:
        lobby_id = UUID(data.get("lobby_id"))
        sender = data.get("sender")
        message = data.get("message")
        
        session = self.game_state.get_session(lobby_id)
        if not session:
            return {"type": "error", "message": "Lobby not found"}
            
        # Broadcast the message to all players in the lobby
        for player_id in session.players:
            if player_id in self.connections:
                await self.connections[player_id].send(json.dumps({
                    "type": "chat",
                    "lobby_id": str(lobby_id),
                    "sender": sender,
                    "message": message
                }))
                
        return {"type": "chat", "status": "sent"}

    def handle_disconnect(self, player_id: UUID):
        self.game_state.leave_session(player_id)
        self.connections.pop(player_id, None)

    async def start(self):
        async with websockets.serve(self.handle_connection, self.host, self.port):
            logger.info(f"Game server started on ws://{self.host}:{self.port}")
            await asyncio.Future()  # run forever 