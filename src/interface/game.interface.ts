export interface MoveData {
  gameId: string;
  fen: string;
  playerId: string;
  timestamp?: number; // When move was made client-side
}

export interface GameState {
  id: string;
  fen: string;
  players: string[];
  currentTurn: 'w' | 'b';
  isGameOver: boolean;
  capturedPieces: { w: string[], b: string[] };
  result?: string;
  timeControl?: {
    initialTime: number;  // Initial time in seconds
    timeLeft: { w: number, b: number }; // Time left in milliseconds
    lastMoveTime: number; // Timestamp of the last move
  };
}