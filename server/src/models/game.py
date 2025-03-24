from enum import Enum
from typing import Dict, Optional
from uuid import UUID, uuid4
from pydantic import BaseModel, Field
import time

class PlayerRole(str, Enum):
    COMMANDER = "commander"
    PAWN = "pawn"

class Player(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    name: str
    role: PlayerRole
    session_id: Optional[UUID] = None

class GameSession(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    name: str
    players: Dict[UUID, Player] = Field(default_factory=dict)
    max_commanders: int = Field(default=2)  # Minimum 2, maximum 4
    max_pawns: int = Field(default=4)  # Default max pawns
    is_active: bool = False
    created_at: float = Field(default_factory=lambda: time.time())

    def get_commander_count(self) -> int:
        return sum(1 for player in self.players.values() if player.role == PlayerRole.COMMANDER)

    def get_pawn_count(self) -> int:
        return sum(1 for player in self.players.values() if player.role == PlayerRole.PAWN)

    def can_join_as_commander(self) -> bool:
        return self.get_commander_count() < self.max_commanders

    def can_join_as_pawn(self) -> bool:
        return self.get_pawn_count() < self.max_pawns

    def is_full(self) -> bool:
        return not (self.can_join_as_commander() or self.can_join_as_pawn())

class GameState(BaseModel):
    sessions: Dict[UUID, GameSession] = Field(default_factory=dict)
    players: Dict[UUID, Player] = Field(default_factory=dict)

    def create_session(self, name: str) -> GameSession:
        session = GameSession(name=name)
        self.sessions[session.id] = session
        return session

    def get_session(self, session_id: UUID) -> Optional[GameSession]:
        return self.sessions.get(session_id)

    def create_player(self, name: str, role: PlayerRole) -> Player:
        player = Player(name=name, role=role)
        self.players[player.id] = player
        return player

    def join_session(self, player_id: UUID, session_id: UUID) -> bool:
        player = self.players.get(player_id)
        session = self.sessions.get(session_id)
        
        if not player or not session:
            return False
            
        if session.is_full():
            return False
            
        if player.role == PlayerRole.COMMANDER and not session.can_join_as_commander():
            return False
            
        if player.role == PlayerRole.PAWN and not session.can_join_as_pawn():
            return False
            
        player.session_id = session_id
        session.players[player_id] = player
        return True

    def leave_session(self, player_id: UUID) -> bool:
        player = self.players.get(player_id)
        if not player or not player.session_id:
            return False
            
        session = self.sessions.get(player.session_id)
        if session:
            session.players.pop(player_id, None)
            player.session_id = None
            return True
        return False 