# Riskier 2.0 Server Structure

## Directory Overview
```
server/
├── src/                   # Source code
│   ├── models/           # Data models and schemas
│   ├── game/             # Game logic and state management
│   ├── network/          # Network communication layer
│   ├── database/         # Database abstraction and implementations
│   │   ├── base.py      # Base database interface
│   │   └── sqlite.py    # SQLite implementation
│   └── server.py         # Core server implementation
├── requirements.txt      # Python dependencies
├── pyproject.toml       # Python project configuration
├── uv.lock             # Dependency lock file
├── .python-version     # Python version specification
└── .venv/              # Python virtual environment
```

## Component Details

### Source Code (`src/`)
- **server.py**: Core server implementation and entry point
- **models/**: Data models and schemas for game entities
- **game/**: Game logic and state management
- **network/**: Network communication layer
- **database/**: Database abstraction and implementations

### Database Layer (`database/`)
- **base.py**: Abstract base class defining database interface
  - Connection management
  - Lobby operations
  - Player operations
  - Game state persistence
- **sqlite.py**: SQLite implementation
  - Async SQLite operations
  - Table management
  - Data persistence
  - Transaction handling

### Database Schema
- **lobbies** table
  - id (TEXT PRIMARY KEY)
  - name (TEXT)
  - max_commanders (INTEGER)
  - max_pawns (INTEGER)
  - status (TEXT)
  - created_at (REAL)
  - data (TEXT)
- **players** table
  - id (TEXT PRIMARY KEY)
  - name (TEXT)
  - role (TEXT)
  - created_at (REAL)
  - data (TEXT)
- **lobby_players** table
  - lobby_id (TEXT)
  - player_id (TEXT)
  - joined_at (REAL)
  - PRIMARY KEY (lobby_id, player_id)
  - FOREIGN KEY constraints

### Game Logic (`game/`)
- Game state management
- Territory control tracking
- Resource management
- Battle instance handling

### Network Layer (`network/`)
- WebSocket/UDP server setup
- Connection management
- Message routing
- Protocol handling
- Lobby operations:
  - Create lobby
  - Join lobby
  - Leave lobby
  - List lobbies
  - Update lobby state

### Message Types
- **Lobby Messages**:
  - `create`: Create a new lobby
  - `join`: Join an existing lobby
  - `leave`: Leave a lobby
  - `list`: Get list of available lobbies
  - `update`: Update lobby state
- **Chat Messages**: In-lobby communication
- **Match Messages**: Game match information
- **Matchmaking Messages**: Player matchmaking status

### Models (`models/`)
- Data schemas
- Entity definitions
- State validation
- Data serialization

## Key Features

### Database Operations
- Async database operations
- Connection pooling
- Transaction management
- Data persistence
- Lobby and player state management

### Game State Management
- Territory control tracking
- Resource management
- Player state synchronization
- Battle instance management

### Network Communication
- WebSocket connections for real-time updates
- UDP for battle-specific communication
- Message serialization/deserialization
- Connection state management

### Message Processing
- Command validation
- State updates
- Event broadcasting
- Error handling

## Development Guidelines

### Adding New Features
1. Define data models in `models/`
2. Implement database operations in `database/`
3. Add network handlers in `network/`
4. Add game logic in `game/`
5. Update server implementation in `server.py`

### Database Operations
- Use async/await for all database operations
- Handle connection errors gracefully
- Implement proper transaction management
- Clean up resources on disconnect
- Validate data before persistence

### Testing
- Unit tests for game logic
- Integration tests for network communication
- Database operation tests
- End-to-end tests for complete features

### Performance Considerations
- Optimize state updates
- Efficient message broadcasting
- Resource cleanup for battle instances
- Connection pooling
- Database query optimization

## Dependencies
- Python 3.x
- WebSocket library
- AsyncIO for asynchronous operations
- JSON for message serialization
- Pydantic for data validation
- aiosqlite for async SQLite operations

## Development Workflow
1. Create virtual environment: `python -m venv .venv`
2. Install dependencies: `pip install -r requirements.txt`
3. Run development server: `python src/server.py`
4. Run tests: `pytest` 