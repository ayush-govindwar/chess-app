export interface GameState {
    id: string;
    fen: string;
    players: string[];
    currentTurn: 'w' | 'b';
    isGameOver: boolean;
    result?: string;
    // Add this new property
    capturedPieces?: {
      w: string[]; // Pieces captured by white
      b: string[]; // Pieces captured by black
    };
  }
  
  export interface MoveData {
    gameId: string;
    fen: string;
    playerId: string;
  }
  