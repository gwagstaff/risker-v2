# Riskier 2.0 Server Structure

## Directory Overview
```
server/
├── src/                   # Source code
│   ├── models/           # Data models and schemas
│   ├── game/             # Game logic and state management
│   ├── network/          # Network communication layer
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

### Models (`models/`)
- Data schemas
- Entity definitions
- State validation
- Data serialization

## Key Features

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
2. Implement network handlers in `network/`
3. Add game logic in `game/`
4. Update server implementation in `server.py`

### Testing
- Unit tests for game logic
- Integration tests for network communication
- End-to-end tests for complete features

### Performance Considerations
- Optimize state updates
- Efficient message broadcasting
- Resource cleanup for battle instances
- Connection pooling

## Dependencies
- Python 3.x
- WebSocket library
- AsyncIO for asynchronous operations
- JSON for message serialization
- Pydantic for data validation

## Development Workflow
1. Create virtual environment: `python -m venv .venv`
2. Install dependencies: `pip install -r requirements.txt`
3. Run development server: `python src/server.py`
4. Run tests: `pytest` 