# Riskier 2.0: Real-Time Commander & Pawns Multiplayer

## Vision Statement
Riskier 2.0 transforms the original territory control game into a fast-paced, real-time strategy experience where commanders direct overall strategy while pawns execute tactical battles simultaneously across the map. Games are designed to be completed within one hour, creating intense, collaborative sessions that blend strategic territory control with dynamic player-driven combat.

## Core Concept
Building on the original Riskier foundation, version 2.0 introduces a dual-layer real-time gameplay experience:
- **Commanders** manage grand strategy with territory control and resource allocation in real-time
- **Pawns** participate in tactical battles simultaneously across the map, replacing RNG with human decision-making
- **Compressed Timeline** ensures games conclude within one hour, creating focused play sessions

This creates an asymmetric multiplayer experience where multiple battles can unfold simultaneously, requiring commanders to make quick strategic decisions while pawns determine battle outcomes through skill and coordination.

## Game Structure

### Lobby System
- Players join game lobbies where they can:
  1. Create new game sessions with customizable parameters
  2. Join existing lobbies as either commander or pawn
  3. See real-time lobby status (commander assigned, pawn slots available)
  4. Chat with other players in the lobby
- Lobby states:
  - **Waiting**: Open for players to join
  - **In Progress**: Game has started
  - **Completed**: Game has ended

### Grand Board (Commander Layer)
- Real-time territory control map with resource-generating regions
- Streamlined continuous gameplay rather than distinct turn phases:
  1. **Continuous Resource Generation**: Resources accumulate over time based on controlled territories
  2. **Dynamic Unit Deployment**: Deploy units to territories as resources become available
  3. **Strategic Movement**: Issue movement orders in real-time
  4. **Simultaneous Battles**: Multiple conflicts can occur across the map at once

### Battle Board (Pawn Layer)
- When territories are contested, pawns join the battle board for that specific territory
- Fast-paced tactical combat with 3-5 minute time limits per battle
- Multiple battles can run concurrently, requiring pawn distribution and prioritization
- Battle outcomes immediately impact territory control on the grand board

## Real-Time Multiplayer Systems

### Player Roles & Collaboration
- **Commanders**: Issue orders, allocate resources, and prioritize territories in real-time
- **Pawns**: Join battles as they emerge, executing tactical combat to secure territories
- **Communication System**: Quick command system and voice chat options for coordination
- **Battle Prioritization**: Visual indicators showing strategic importance of each battle

### Session Structure
- **Game Duration**: 45-60 minutes maximum per full game
- **Battle Duration**: 3-5 minutes per individual battle
- **Victory Conditions**: Control specific percentage of map, eliminate opponents, or highest territory count when time expires

### Matchmaking & Deployment
- Lobby-based matchmaking system
- Players can join as either commander or pawn based on availability
- Automatic battle assignment based on pawn preferences and battle importance
- Real-time lobby status updates

## Gameplay Features

### Commander Features
- Real-time resource management dashboard
- Territory priority system to direct pawns to critical battles
- Special commander abilities with cooldowns (e.g., reinforcements, reconnaissance)
- Strategic overview showing all active battles and territory status

### Pawn Features
- Battle role selection (assault, defense, support)
- Quick-join system for active battles
- Performance-based rewards and bonuses
- Skill-based combat mechanics with unique abilities

### Battle Mechanics
- Objective-based battle scenarios (not just elimination)
- Terrain and positioning advantages
- Limited-time tactical encounters
- Resource control points within battle maps

## Technical Requirements
- Low-latency networking for real-time actions
- Battle instance management for multiple concurrent conflicts
- Dynamic resource calculation and distribution
- Synchronized timers and game state across all players
- WebSocket-based lobby system for real-time updates

## Progression Systems

### Within-Game Progression
- Resource accumulation curves
- Battle success bonuses
- Escalating unit strength and abilities as game progresses
- Commander momentum mechanics

### Cross-Game Progression
- Pawn combat role specialization
- Commander strategy profile development
- Cosmetic and ability unlocks
- Matchmaking rating for skill-based pairing

## Development Phases

### Phase 1: Core Real-Time Systems
- Lobby system implementation
- Simultaneous battle framework
- Real-time resource management
- Basic commander and pawn interfaces
- Time-limited game sessions

### Phase 2: Depth & Balance
- Multiple battle types and objectives
- Advanced commander tools and visualization
- Pawn specialization options
- Balance tuning for one-hour sessions

### Phase 3: Polish & Expansion
- Enhanced visualization and effects
- Expanded progression systems
- Tournament and competitive features
- Mobile-friendly interface options

## Project Structure

```
server/
├── main.py              # Main application entry point
├── server.py            # Core server implementation
├── pyproject.toml       # Python project configuration
├── uv.lock             # Dependency lock file
├── .python-version     # Python version specification
├── game/               # Game logic and state management
│   ├── __init__.py
│   ├── processor.py    # Game message processing
│   └── state.py        # Game state management
├── network/            # Network communication layer
│   ├── __init__.py
│   ├── config.py       # Network configuration
│   ├── handlers.py     # Connection handlers
│   └── server.py       # Network server implementation
└── .venv/              # Python virtual environment

client/
├── src/                    # Source code
│   ├── components/         # Reusable UI components
│   ├── services/          # API and game service integrations
│   ├── pages/             # Page components
│   ├── App.tsx            # Main application component
│   ├── theme.ts           # Theme configuration
│   ├── index.tsx          # Application entry point
│   ├── index.html         # HTML template
│   └── index.js           # JavaScript entry point
├── package.json           # Project dependencies and scripts
├── package-lock.json      # Dependency lock file
├── tsconfig.json          # TypeScript configuration
└── webpack.config.js      # Webpack configuration
```

## Development Guidelines

### Client Development
1. **Component Structure**
   - Reusable UI components in `components/`
   - Game-specific components for battles and maps
   - Layout components for different views
   - Battle interface components

2. **State Management**
   - WebSocket connection management
   - Game state synchronization
   - Local state management
   - Error state handling

3. **UI/UX Features**
   - Responsive design implementation
   - Real-time updates
   - Interactive maps
   - Battle visualization

### Server Development
1. **Core Components**
   - Main application entry point
   - WebSocket/UDP server setup
   - Connection management
   - Message routing

2. **Game Logic**
   - Territory control tracking
   - Resource management
   - Player state synchronization
   - Battle instance management

3. **Network Layer**
   - WebSocket connections for real-time updates
   - UDP for battle-specific communication
   - Message serialization/deserialization
   - Connection state management

### Performance Considerations
1. **Client Optimization**
   - Code splitting
   - Lazy loading
   - WebSocket optimization
   - State update batching

2. **Server Optimization**
   - State update optimization
   - Efficient message broadcasting
   - Resource cleanup for battle instances
   - Connection pooling

### Development Workflow
1. **Client Setup**
   - Install dependencies: `npm install`
   - Start development server: `npm run dev`
   - Build for production: `npm run build`
   - Run tests: `npm test`

2. **Server Setup**
   - Create virtual environment
   - Install dependencies
   - Run development server
   - Execute test suite
