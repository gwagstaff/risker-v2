import asyncio
import json
import logging
from typing import Dict, Optional
from uuid import UUID
import websockets
from websockets.server import WebSocketServerProtocol

from src.models import GameState, Player, PlayerRole, GameSession
from src.database.sqlite import SQLiteDatabase

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GameServer:
    def __init__(self, host: str = "localhost", port: int = 8000):
        self.host = host
        self.port = port
        self.game_state = GameState()
        self.connections: Dict[UUID, WebSocketServerProtocol] = {}
        self.db = SQLiteDatabase()
        self.server = None
        self._running = False
        logger.info("GameServer initialized")
        
    async def start(self):
        if self._running:
            return
            
        self._running = True
        # Initialize database connection
        try:
            await self.db.connect()
            logger.info("Database connection established")
            
            # Load existing sessions from database
            db_sessions = await self.db.list_lobbies()
            for session_data in db_sessions:
                session = GameSession(
                    id=UUID(session_data["id"]),
                    name=session_data["name"],
                    max_commanders=session_data["max_commanders"],
                    max_pawns=session_data["max_pawns"]
                )
                self.game_state.sessions[session.id] = session
                logger.info(f"Loaded existing session from database: {session.id}")
                
        except Exception as e:
            logger.error(f"Failed to connect to database: {str(e)}", exc_info=True)
            raise
        try:
            self.server = await websockets.serve(self.handle_connection, self.host, self.port)
            logger.info(f"Game server started on ws://{self.host}:{self.port}")
            await asyncio.Future()  # run forever
        finally:
            await self.stop()
            
    async def stop(self):
        if not self._running:
            return
            
        self._running = False
        if self.server:
            self.server.close()
            await self.server.wait_closed()
        # Clean up database connection
        await self.db.disconnect()
        # Clear all connections
        self.connections.clear()
        logger.info("Server stopped")
        
    async def restart(self):
        logger.info("Restarting server...")
        await self.stop()
        await self.start()
        
    async def handle_connection(self, websocket: WebSocketServerProtocol):
        player_id = None
        try:
            async for message in websocket:
                try:
                    data = json.loads(message)
                    logger.debug(f"Received message: {data}")
                    
                    # Store the WebSocket command if we have a player_id
                    if player_id:
                        try:
                            await self.db.store_websocket_command(
                                client_id=str(player_id),
                                message_type=data.get("type", "unknown"),
                                action=data.get("action", "unknown"),
                                payload=data
                            )
                        except Exception as e:
                            logger.error(f"Failed to store WebSocket command: {e}")
                    
                    response = await self.handle_message(data, websocket)
                    if response:
                        await websocket.send(json.dumps(response))
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse message: {e}")
                    await websocket.send(json.dumps({"type": "error", "message": "Invalid JSON"}))
                except Exception as e:
                    logger.error(f"Error handling message: {e}")
                    await websocket.send(json.dumps({"type": "error", "message": "Internal server error"}))
        except websockets.exceptions.ConnectionClosed:
            logger.info(f"Connection closed for player {player_id}")
        except Exception as e:
            logger.error(f"Connection error: {e}")
        finally:
            if player_id:
                self.handle_disconnect(player_id)

    async def handle_message(self, data: dict, websocket: WebSocketServerProtocol) -> Optional[dict]:
        message_type = data.get("type")
        
        if message_type == "lobby":
            return await self.handle_lobby(data, websocket)
        elif message_type == "chat":
            return await self.handle_chat(data)
        else:
            return {"type": "error", "message": "Unknown message type"}

    async def handle_lobby(self, data: dict, websocket: WebSocketServerProtocol) -> dict:
        action = data.get("action")
        logger.info(f"Handling lobby action: {action} with data: {data}")
        
        if action == "create":
            try:
                name = data.get("name")
                max_commanders = data.get("maxCommanders", 2)
                max_pawns = data.get("maxPawns", 4)
                
                logger.info(f"Creating lobby with name: {name}, max_commanders: {max_commanders}, max_pawns: {max_pawns}")
                
                # Create session in database
                db_session = await self.db.create_lobby(name, max_commanders, max_pawns)
                logger.info(f"Database session created: {db_session}")
                
                session = GameSession(
                    id=UUID(db_session["id"]),
                    name=name,
                    max_commanders=max_commanders,
                    max_pawns=max_pawns
                )
                self.game_state.sessions[session.id] = session
                logger.info(f"Game session created and added to state: {session.id}")
                
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
            except Exception as e:
                logger.error(f"Error creating lobby: {str(e)}", exc_info=True)
                return {"type": "error", "message": f"Failed to create lobby: {str(e)}"}
            
        elif action == "join":
            lobby_id = UUID(data.get("lobby_id"))
            role = PlayerRole(data.get("role"))
            name = data.get("name")
            
            logger.info(f"Attempting to join lobby - lobby_id: {lobby_id}, role: {role}, name: {name}")
            
            # Create player in database
            try:
                db_player = await self.db.create_player(name, role.value)
                logger.info(f"Player created in database: {db_player}")
                player = Player(id=UUID(db_player["id"]), name=name, role=role)
            except Exception as e:
                logger.error(f"Failed to create player in database: {str(e)}", exc_info=True)
                return {"type": "error", "message": f"Failed to create player: {str(e)}"}
            
            # Add player to game state
            try:
                self.game_state.players[player.id] = player
                self.connections[player.id] = websocket
                logger.info(f"Player added to game state and connections: {player.id}")
            except Exception as e:
                logger.error(f"Failed to add player to game state: {str(e)}", exc_info=True)
                return {"type": "error", "message": f"Failed to add player to game state: {str(e)}"}
            
            if self.game_state.join_session(player.id, lobby_id):
                try:
                    # Add player to lobby in database - convert UUIDs to strings
                    await self.db.add_player_to_lobby(str(player.id), str(lobby_id))
                    logger.info(f"Player added to lobby in database: {player.id} -> {lobby_id}")
                    session = self.game_state.get_session(lobby_id)
                    if not session:
                        logger.error(f"Session not found after join: {lobby_id}")
                        return {"type": "error", "message": "Session not found after join"}
                        
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
                except Exception as e:
                    logger.error(f"Failed to add player to lobby in database: {str(e)}", exc_info=True)
                    return {"type": "error", "message": f"Failed to add player to lobby: {str(e)}"}
            else:
                logger.error(f"Failed to join session in game state: {player.id} -> {lobby_id}")
            return {"type": "error", "message": "Failed to join lobby"}
            
        elif action == "leave":
            lobby_id = UUID(data.get("lobby_id"))
            player_id = UUID(data.get("player_id"))
            if player_id:
                # Remove player from lobby in database - convert UUIDs to strings
                await self.db.remove_player_from_lobby(str(player_id), str(lobby_id))
                if self.game_state.leave_session(player_id):
                    return {"type": "lobby", "action": "update", "lobby_id": str(lobby_id)}
            return {"type": "error", "message": "Failed to leave lobby"}
            
        elif action == "list":
            # Get lobbies from database
            db_lobbies = await self.db.list_lobbies()
            return {
                "type": "lobby",
                "action": "list",
                "lobbies": db_lobbies
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