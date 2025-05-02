# Chess-App

## Overview

Chess Master is a full-stack multiplayer chess application featuring real-time gameplay with precise timer synchronization. Built with NestJS backend and modern JavaScript frontend, this application provides a seamless chess experience for players of all skill levels.

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)


## Features

### Core Functionality
- **Real-time Multiplayer**: Play with opponents anywhere in the world
- **Game Creation & Joining**: Easy game setup with shareable IDs
- **Complete Chess Rules**: Full implementation of standard chess rules
- **Responsive Design**: Play on any device, any screen size

### Enhanced Gameplay
- **Precise Timer Synchronization**: Server-synchronized chess clocks with millisecond precision
- **Server-side Move Validation**: Prevents cheating and ensures fair play
- **PGN Notation**: Complete move history in standard chess notation
- **Captured Pieces Display**: Visual tracking of captured pieces

### User Experience
- **Game Commentary**: AI-generated commentary on significant moves
- **Visual Notifications**: Clear feedback for game events
- **Time Management**: Multiple time control options
- **Intuitive Interface**: Drag-and-drop piece movement

## Technology Stack

### Frontend
- **Core**: HTML5, CSS3, JavaScript (ES6+)
- **Chess Logic**: chess.js
- **UI Components**: chessboard.js
- **Real-time Communication**: Socket.IO client
- **Hosting**: Render (Static Site)

### Backend
- **Framework**: NestJS (Node.js)
- **Language**: TypeScript
- **Real-time Server**: Socket.IO
- **Chess Engine Integration**: chess.js
- **Game State Management**: Custom implementation with WebSockets
- **Hosting**: Render (Web Service)

### Development Tools
- **Version Control**: Git
- **Package Management**: npm
- **Build Tools**: Webpack
- **Testing**: Jest (Backend), Cypress (Frontend)

## Installation

### Prerequisites
- Node.js (v14.x or later)
- npm (v6.x or later) or yarn (v1.22.x or later)

### Backend Setup
```bash
# Clone repository
git clone https://github.com/yourusername/chess-master.git
cd chess-master/backend

# Install dependencies
npm install

# Start development server
npm run start:dev

# For production build
npm run build
npm run start:prod
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Run development server
npm run start

# Build for production
npm run build
```

## Configuration

### Environment Variables

#### Backend (.env file)
```
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:8080
```

#### Frontend (.env file)
```
API_URL=http://localhost:3000
WS_URL=ws://localhost:3000
```

## Deployment

The application is deployed on Render:

1. **Backend**: NestJS application as a Web Service
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start:prod`
   - Environment Variables: Set as described above

2. **Frontend**: Static site hosting
   - Build Command: `npm install && npm run build`
   - Output Directory: `dist` or `build`
   - Environment Variables: Configure for production endpoints

## API Documentation

### WebSocket Events

#### Client to Server
| Event | Payload | Description |
|-------|---------|-------------|
| `createGame` | `{ gameId, timeControl }` | Create a new game with specified time control |
| `joinGame` | `gameId` | Join an existing game by ID |
| `makeMove` | `{ gameId, fen, playerId, timestamp }` | Make a move and update game state |
| `timerSync` | `{ gameId, clientTime }` | Request timer synchronization |
| `timeOut` | `{ gameId, color }` | Notify server of a time-out |

#### Server to Client
| Event | Payload | Description |
|-------|---------|-------------|
| `playerJoined` | `game` | New player joined the game |
| `gameStarted` | `{ timeControl }` | Game has started with time controls |
| `moveMade` | `game` | Move was accepted and board updated |
| `gameOver` | `{ result }` | Game has ended with result |
| `moveRejected` | `message` | Move was rejected with reason |
| `timerUpdate` | `{ timeLeft }` | Updated timer values from server |
| `commentary` | `{ commentary }` | Move commentary |

### Timer Synchronization System

The timer synchronization system is the cornerstone of this application:

1. **Server Authority**: Server maintains the definitive time for both players
2. **Client Prediction**: Client timers update locally for UI responsiveness
3. **Synchronization Protocol**:
   - Regular sync packets (every 10 seconds)
   - Move timestamps sent with each move
   - Server validation of time remaining
4. **Anti-Cheat Measures**: Server validates all time-related events

