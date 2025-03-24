import sqlite3
import aiosqlite
import time
import logging
from typing import Optional, List, Dict, Any
from uuid import uuid4
import json
from pathlib import Path

from .base import Database

logger = logging.getLogger(__name__)

class SQLiteDatabase(Database):
    def __init__(self, db_path: str = "risker.db"):
        self.db_path = db_path
        self.conn: Optional[aiosqlite.Connection] = None

    async def connect(self) -> None:
        """Establish database connection"""
        self.conn = await aiosqlite.connect(self.db_path)
        await self.create_tables()

    async def disconnect(self) -> None:
        """Close database connection"""
        if self.conn:
            await self.conn.close()
            self.conn = None

    async def create_tables(self) -> None:
        """Create necessary database tables if they don't exist"""
        if not self.conn:
            raise RuntimeError("Database not connected")

        async with self.conn.cursor() as cursor:
            # Create lobbies table
            await cursor.execute('''
                CREATE TABLE IF NOT EXISTS lobbies (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    max_commanders INTEGER NOT NULL,
                    max_pawns INTEGER NOT NULL,
                    status TEXT NOT NULL DEFAULT 'waiting',
                    created_at REAL NOT NULL,
                    data TEXT
                )
            ''')

            # Create players table
            await cursor.execute('''
                CREATE TABLE IF NOT EXISTS players (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    role TEXT NOT NULL,
                    created_at REAL NOT NULL,
                    data TEXT
                )
            ''')

            # Create lobby_players table (many-to-many relationship)
            await cursor.execute('''
                CREATE TABLE IF NOT EXISTS lobby_players (
                    lobby_id TEXT NOT NULL,
                    player_id TEXT NOT NULL,
                    joined_at REAL NOT NULL,
                    PRIMARY KEY (lobby_id, player_id),
                    FOREIGN KEY (lobby_id) REFERENCES lobbies(id),
                    FOREIGN KEY (player_id) REFERENCES players(id)
                )
            ''')

            # Create websocket_commands table
            await cursor.execute('''
                CREATE TABLE IF NOT EXISTS websocket_commands (
                    id TEXT PRIMARY KEY,
                    client_id TEXT NOT NULL,
                    message_type TEXT NOT NULL,
                    action TEXT NOT NULL,
                    payload TEXT NOT NULL,
                    timestamp REAL NOT NULL,
                    processed BOOLEAN DEFAULT FALSE,
                    FOREIGN KEY (client_id) REFERENCES players(id)
                )
            ''')

            await self.conn.commit()

    async def create_lobby(self, name: str, max_commanders: int, max_pawns: int) -> Dict[str, Any]:
        """Create a new lobby"""
        if not self.conn:
            raise RuntimeError("Database not connected")

        lobby_id = str(uuid4())
        created_at = time.time()

        async with self.conn.cursor() as cursor:
            await cursor.execute('''
                INSERT INTO lobbies (id, name, max_commanders, max_pawns, created_at)
                VALUES (?, ?, ?, ?, ?)
            ''', (lobby_id, name, max_commanders, max_pawns, created_at))
            await self.conn.commit()
        logger.info(f"Lobby created: {lobby_id}")

        return {
            "id": lobby_id,
            "name": name,
            "max_commanders": max_commanders,
            "max_pawns": max_pawns,
            "status": "waiting",
            "created_at": created_at,
            "commanders": [],
            "pawns": []
        }

    async def get_lobby(self, lobby_id: str) -> Optional[Dict[str, Any]]:
        """Get lobby by ID"""
        if not self.conn:
            raise RuntimeError("Database not connected")

        async with self.conn.cursor() as cursor:
            await cursor.execute('''
                SELECT * FROM lobbies WHERE id = ?
            ''', (lobby_id,))
            row = await cursor.fetchone()

            if not row:
                return None

            # Get players in the lobby
            await cursor.execute('''
                SELECT p.*, lp.joined_at
                FROM players p
                JOIN lobby_players lp ON p.id = lp.player_id
                WHERE lp.lobby_id = ?
            ''', (lobby_id,))
            players = await cursor.fetchall()

            commanders = []
            pawns = []
            for player in players:
                if player[2] == "commander":
                    commanders.append(player[0])
                else:
                    pawns.append(player[0])

            return {
                "id": row[0],
                "name": row[1],
                "max_commanders": row[2],
                "max_pawns": row[3],
                "status": row[4],
                "created_at": row[5],
                "commanders": commanders,
                "pawns": pawns
            }

    async def list_lobbies(self) -> List[Dict[str, Any]]:
        """List all lobbies"""
        if not self.conn:
            raise RuntimeError("Database not connected")

        async with self.conn.cursor() as cursor:
            await cursor.execute('SELECT * FROM lobbies')
            rows = await cursor.fetchall()

            lobbies = []
            for row in rows:
                lobby_id = row[0]
                # Get players for each lobby
                await cursor.execute('''
                    SELECT p.*, lp.joined_at
                    FROM players p
                    JOIN lobby_players lp ON p.id = lp.player_id
                    WHERE lp.lobby_id = ?
                ''', (lobby_id,))
                players = await cursor.fetchall()

                commanders = []
                pawns = []
                for player in players:
                    if player[2] == "commander":
                        commanders.append(player[0])
                    else:
                        pawns.append(player[0])

                lobbies.append({
                    "id": row[0],
                    "name": row[1],
                    "max_commanders": row[2],
                    "max_pawns": row[3],
                    "status": row[4],
                    "created_at": row[5],
                    "commanders": commanders,
                    "pawns": pawns
                })

            return lobbies

    async def update_lobby(self, lobby_id: str, data: Dict[str, Any]) -> bool:
        """Update lobby data"""
        if not self.conn:
            raise RuntimeError("Database not connected")

        async with self.conn.cursor() as cursor:
            await cursor.execute('''
                UPDATE lobbies
                SET name = ?, max_commanders = ?, max_pawns = ?, status = ?
                WHERE id = ?
            ''', (
                data.get("name"),
                data.get("max_commanders"),
                data.get("max_pawns"),
                data.get("status"),
                lobby_id
            ))
            await self.conn.commit()
            return cursor.rowcount > 0

    async def delete_lobby(self, lobby_id: str) -> bool:
        """Delete a lobby"""
        if not self.conn:
            raise RuntimeError("Database not connected")

        async with self.conn.cursor() as cursor:
            # First remove all player associations
            await cursor.execute('DELETE FROM lobby_players WHERE lobby_id = ?', (lobby_id,))
            # Then delete the lobby
            await cursor.execute('DELETE FROM lobbies WHERE id = ?', (lobby_id,))
            await self.conn.commit()
            return cursor.rowcount > 0

    async def create_player(self, name: str, role: str) -> Dict[str, Any]:
        """Create a new player"""
        if not self.conn:
            raise RuntimeError("Database not connected")

        player_id = str(uuid4())
        created_at = time.time()

        async with self.conn.cursor() as cursor:
            await cursor.execute('''
                INSERT INTO players (id, name, role, created_at)
                VALUES (?, ?, ?, ?)
            ''', (player_id, name, role, created_at))
            await self.conn.commit()

        return {
            "id": player_id,
            "name": name,
            "role": role,
            "created_at": created_at
        }

    async def get_player(self, player_id: str) -> Optional[Dict[str, Any]]:
        """Get player by ID"""
        if not self.conn:
            raise RuntimeError("Database not connected")

        async with self.conn.cursor() as cursor:
            await cursor.execute('SELECT * FROM players WHERE id = ?', (player_id,))
            row = await cursor.fetchone()

            if not row:
                return None

            return {
                "id": row[0],
                "name": row[1],
                "role": row[2],
                "created_at": row[3]
            }

    async def update_player(self, player_id: str, data: Dict[str, Any]) -> bool:
        """Update player data"""
        if not self.conn:
            raise RuntimeError("Database not connected")

        async with self.conn.cursor() as cursor:
            await cursor.execute('''
                UPDATE players
                SET name = ?, role = ?
                WHERE id = ?
            ''', (
                data.get("name"),
                data.get("role"),
                player_id
            ))
            await self.conn.commit()
            return cursor.rowcount > 0

    async def delete_player(self, player_id: str) -> bool:
        """Delete a player"""
        if not self.conn:
            raise RuntimeError("Database not connected")

        async with self.conn.cursor() as cursor:
            # First remove all lobby associations
            await cursor.execute('DELETE FROM lobby_players WHERE player_id = ?', (player_id,))
            # Then delete the player
            await cursor.execute('DELETE FROM players WHERE id = ?', (player_id,))
            await self.conn.commit()
            return cursor.rowcount > 0

    async def add_player_to_lobby(self, player_id: str, lobby_id: str) -> bool:
        """Add a player to a lobby"""
        if not self.conn:
            raise RuntimeError("Database not connected")

        async with self.conn.cursor() as cursor:
            try:
                await cursor.execute('''
                    INSERT INTO lobby_players (lobby_id, player_id, joined_at)
                    VALUES (?, ?, ?)
                ''', (lobby_id, player_id, time.time()))
                await self.conn.commit()
                return True
            except sqlite3.IntegrityError:
                return False

    async def remove_player_from_lobby(self, player_id: str, lobby_id: str) -> bool:
        """Remove a player from a lobby"""
        if not self.conn:
            raise RuntimeError("Database not connected")

        async with self.conn.cursor() as cursor:
            await cursor.execute('''
                DELETE FROM lobby_players
                WHERE lobby_id = ? AND player_id = ?
            ''', (lobby_id, player_id))
            await self.conn.commit()
            return cursor.rowcount > 0

    async def get_lobby_players(self, lobby_id: str) -> List[Dict[str, Any]]:
        """Get all players in a lobby"""
        if not self.conn:
            raise RuntimeError("Database not connected")

        async with self.conn.cursor() as cursor:
            await cursor.execute('''
                SELECT p.*, lp.joined_at
                FROM players p
                JOIN lobby_players lp ON p.id = lp.player_id
                WHERE lp.lobby_id = ?
            ''', (lobby_id,))
            rows = await cursor.fetchall()

            return [{
                "id": row[0],
                "name": row[1],
                "role": row[2],
                "created_at": row[3],
                "joined_at": row[4]
            } for row in rows]

    async def store_websocket_command(self, client_id: str, message_type: str, action: str, payload: Dict[str, Any]) -> str:
        """Store a WebSocket command in the database"""
        if not self.conn:
            raise RuntimeError("Database not connected")

        command_id = str(uuid4())
        timestamp = time.time()
        payload_json = json.dumps(payload)

        async with self.conn.cursor() as cursor:
            await cursor.execute('''
                INSERT INTO websocket_commands (id, client_id, message_type, action, payload, timestamp)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (command_id, client_id, message_type, action, payload_json, timestamp))
            await self.conn.commit()

        return command_id

    async def get_unprocessed_commands(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get unprocessed WebSocket commands"""
        if not self.conn:
            raise RuntimeError("Database not connected")

        async with self.conn.cursor() as cursor:
            await cursor.execute('''
                SELECT * FROM websocket_commands
                WHERE processed = FALSE
                ORDER BY timestamp ASC
                LIMIT ?
            ''', (limit,))
            rows = await cursor.fetchall()

            return [{
                "id": row[0],
                "client_id": row[1],
                "message_type": row[2],
                "action": row[3],
                "payload": json.loads(row[4]),
                "timestamp": row[5],
                "processed": bool(row[6])
            } for row in rows]

    async def mark_command_processed(self, command_id: str) -> bool:
        """Mark a WebSocket command as processed"""
        if not self.conn:
            raise RuntimeError("Database not connected")

        async with self.conn.cursor() as cursor:
            await cursor.execute('''
                UPDATE websocket_commands
                SET processed = TRUE
                WHERE id = ?
            ''', (command_id,))
            await self.conn.commit()
            return cursor.rowcount > 0 