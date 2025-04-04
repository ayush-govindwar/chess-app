export interface GameState {
  id: string;
  fen: string;
  players: string[];
  currentTurn: 'w' | 'b';
  isGameOver: boolean;
  result?: string;
  capturedPieces: {
    w: string[];
    b: string[];
  };
  timeControl?: {
    initialTime: number;
    timeLeft: { w: number; b: number };
    lastMoveTime: number;
  };
  lastCommentary?: string; 
}

export interface MoveData {
  gameId: string;
  fen: string;
  playerId: string;
  timestamp?: number;
}