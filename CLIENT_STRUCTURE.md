# Riskier 2.0 Client Structure

## Directory Overview
```
client/
├── src/                    # Source code
│   ├── components/         # Reusable UI components
│   ├── hooks/             # Custom React hooks
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

## Component Details

### Core Application Files
- **App.tsx**: Main application component and routing
- **index.tsx**: React application entry point
- **theme.ts**: Global theme configuration and styling
- **index.html**: HTML template with meta tags and root element
- **index.js**: JavaScript entry point with initialization code

### Components (`components/`)
- Reusable UI components
- Game-specific components
- Layout components
- Battle interface components

### Hooks (`hooks/`)
- Custom React hooks for game logic
- State management hooks
- WebSocket connection hooks
- Game state synchronization hooks

### Services (`services/`)
- WebSocket connection management
- Game state synchronization
- API integration
- Authentication services
- Lobby management:
  - Create/join/leave lobbies
  - List available lobbies
  - Handle lobby updates
  - Manage player roles (Commander/Pawn)

### Pages (`pages/`)
- **Home.tsx**: Landing page
- **Game.tsx**: Main game interface
- **Battle.tsx**: Battle interface

## Key Features

### Game Interface
- Real-time territory visualization
- Resource management dashboard
- Battle interface
- Player communication system

### State Management
- Game state synchronization
- Local state management
- WebSocket message handling
- Error state handling

### Message Handling
- **WebSocket Messages**:
  - Lobby operations (create, join, leave, list)
  - Chat messages
  - Match updates
  - Matchmaking status
- **State Management**:
  - Lobby state
  - Player state
  - Game state
  - Connection state

### UI/UX Features
- Responsive design
- Real-time updates
- Interactive maps
- Battle visualization

## Development Guidelines

### Adding New Features
1. Create components in `components/`
2. Add custom hooks in `hooks/`
3. Add services in `services/`
4. Create pages in `pages/`
5. Update routing in `App.tsx`

### Styling
- Use theme configuration
- Follow component-based styling
- Maintain responsive design
- Support dark/light modes

### Performance Optimization
- Code splitting
- Lazy loading
- WebSocket optimization
- State update batching

## Dependencies
- React
- TypeScript
- WebSocket client
- Three.js (for 3D visualization)
- Styled-components
- Webpack

## Build Process
1. TypeScript compilation
2. Webpack bundling
3. Asset optimization
4. Development server

## Development Workflow
1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Build for production: `npm run build`
4. Run tests: `npm test` 