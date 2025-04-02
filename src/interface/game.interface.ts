export interface GameState {
    id: string;
    fen: string;
    players: string[];
    currentTurn: 'w' | 'b';
    isGameOver: boolean;
    result?: string;
  }
  
  export interface MoveData {
    gameId: string;
    fen: string;
    playerId: string;
  }
  