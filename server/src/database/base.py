from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any
from uuid import UUID

class Database(ABC):
    @abstractmethod
    async def connect(self) -> None:
        """Establish database connection"""
        pass

    @abstractmethod
    async def disconnect(self) -> None:
        """Close database connection"""
        pass

    @abstractmethod
    async def create_tables(self) -> None:
        """Create necessary database tables if they don't exist"""
        pass

    # Lobby operations
    @abstractmethod
    async def create_lobby(self, name: str, max_commanders: int, max_pawns: int) -> Dict[str, Any]:
        """Create a new lobby"""
        pass

    @abstractmethod
    async def get_lobby(self, lobby_id: UUID) -> Optional[Dict[str, Any]]:
        """Get lobby by ID"""
        pass

    @abstractmethod
    async def list_lobbies(self) -> List[Dict[str, Any]]:
        """List all lobbies"""
        pass

    @abstractmethod
    async def update_lobby(self, lobby_id: UUID, data: Dict[str, Any]) -> bool:
        """Update lobby data"""
        pass

    @abstractmethod
    async def delete_lobby(self, lobby_id: UUID) -> bool:
        """Delete a lobby"""
        pass

    # Player operations
    @abstractmethod
    async def create_player(self, name: str, role: str) -> Dict[str, Any]:
        """Create a new player"""
        pass

    @abstractmethod
    async def get_player(self, player_id: UUID) -> Optional[Dict[str, Any]]:
        """Get player by ID"""
        pass

    @abstractmethod
    async def update_player(self, player_id: UUID, data: Dict[str, Any]) -> bool:
        """Update player data"""
        pass

    @abstractmethod
    async def delete_player(self, player_id: UUID) -> bool:
        """Delete a player"""
        pass

    # Lobby-Player relationship operations
    @abstractmethod
    async def add_player_to_lobby(self, player_id: UUID, lobby_id: UUID) -> bool:
        """Add a player to a lobby"""
        pass

    @abstractmethod
    async def remove_player_from_lobby(self, player_id: UUID, lobby_id: UUID) -> bool:
        """Remove a player from a lobby"""
        pass

    @abstractmethod
    async def get_lobby_players(self, lobby_id: UUID) -> List[Dict[str, Any]]:
        """Get all players in a lobby"""
        pass 