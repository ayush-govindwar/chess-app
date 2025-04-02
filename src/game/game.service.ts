import { Injectable } from '@nestjs/common';
import { GameState, MoveData } from '../interface/game.interface';
import { Chess } from 'chess.js';

@Injectable()
export class GameService {
  private games: Map<string, GameState> = new Map();

  createGame(gameId: string, playerId: string, initialTime: number = 600): GameState {
    const chess = new Chess();
    const game: GameState = {
      id: gameId,
      fen: chess.fen(),
      players: [playerId],
      currentTurn: 'w',
      isGameOver: false,
      capturedPieces: { w: [], b: [] },
      timeControl: {
        initialTime: initialTime, // Time in seconds
        timeLeft: { w: initialTime * 1000, b: initialTime * 1000 }, // Convert to milliseconds
        lastMoveTime: 0 // Will be set when game starts
      }
    };
    this.games.set(gameId, game);
    return game;
  }

  joinGame(gameId: string, playerId: string): GameState | null {
    const game = this.games.get(gameId);
    if (!game) {
      return null;
    }

    if (game.players.length < 2 && !game.players.includes(playerId)) {
      game.players.push(playerId);
      
      // If this is the second player joining, set the lastMoveTime
      if (game.players.length === 2 && game.timeControl) {
        game.timeControl.lastMoveTime = Date.now();
      }
    }

    return game;
  }

  validateMove(
    gameId: string, 
    fen: string, 
    playerId: string, 
    clientTimestamp?: number,
    serverTimestamp?: number
  ): { isValid: boolean; updatedGame?: GameState; message?: string } {
    const game = this.games.get(gameId);
    if (!game) {
      return { isValid: false, message: 'Game not found' };
    }

    // Check if it's the player's turn
    const playerIndex = game.players.indexOf(playerId);
    const playerColor = playerIndex === 0 ? 'w' : 'b';
    if (playerColor !== game.currentTurn) {
      return { isValid: false, message: 'Not your turn' };
    }

    // Validate the move using chess.js
    const prevChess = new Chess(game.fen);
    const newChess = new Chess(fen);

    // Check if the move is legal and identify any captures
    const legalMoves = prevChess.moves({ verbose: true });
    let capturedPiece;
    let isLegalMove = false;
    
    for (const move of legalMoves) {
      const tempChess = new Chess(prevChess.fen());
      tempChess.move(move);
      
      // Compare board positions (excluding move counters)
      const tempFenParts = tempChess.fen().split(' ').slice(0, 4).join(' ');
      const newFenParts = newChess.fen().split(' ').slice(0, 4).join(' ');
      
      if (tempFenParts === newFenParts) {
        isLegalMove = true;
        // If this move captured a piece, record it
        if (move.captured) {
          capturedPiece = move.captured;
        }
        break;
      }
    }
    
    if (!isLegalMove) {
      return { isValid: false, message: 'Illegal move' };
    }

    // Update the game state
    game.fen = fen;
    
    // Update timer data
    if (game.timeControl) {
      const now = serverTimestamp || Date.now();
      const lastMoveTime = game.timeControl.lastMoveTime;
      
      // If this isn't the first move of the game
      if (lastMoveTime > 0) {
        // Calculate elapsed time for the current player
        const timeElapsed = now - lastMoveTime;
        game.timeControl.timeLeft[playerColor] -= timeElapsed;
        
        // Check for timeout
        if (game.timeControl.timeLeft[playerColor] <= 0) {
          game.timeControl.timeLeft[playerColor] = 0;
          game.isGameOver = true;
          game.result = `Time out! ${playerColor === 'w' ? 'White' : 'Black'} loses on time.`;
          return { isValid: true, updatedGame: game };
        }
      }
      
      // Update the last move timestamp
      game.timeControl.lastMoveTime = now;
    }
    
    // Switch the turn
    game.currentTurn = game.currentTurn === 'w' ? 'b' : 'w';
    
    // Update captured pieces if a piece was captured
    if (capturedPiece) {
      if (!game.capturedPieces) {
        game.capturedPieces = { w: [], b: [] };
      }
      // Add the captured piece to the list for the player who made the capture
      game.capturedPieces[playerColor].push(capturedPiece);
    }
    
    // Check game status
    if (newChess.isGameOver()) {
      game.isGameOver = true;
      if (newChess.isCheckmate()) {
        game.result = `Checkmate! ${playerColor === 'w' ? 'White' : 'Black'} wins!`;
      } else if (newChess.isDraw()) {
        game.result = 'Draw!';
        if (newChess.isStalemate()) {
          game.result = 'Draw by stalemate!';
        } else if (newChess.isThreefoldRepetition()) {
          game.result = 'Draw by threefold repetition!';
        } else if (newChess.isInsufficientMaterial()) {
          game.result = 'Draw by insufficient material!';
        } else if (newChess.isDrawByFiftyMoves()) {
          game.result = 'Draw by fifty-move rule!';
        }
      }
    }

    this.games.set(gameId, game);
    return { isValid: true, updatedGame: game };
  }

  handlePlayerDisconnect(playerId: string): void {
    // Find games where this player is participating
    for (const [gameId, game] of this.games.entries()) {
      const playerIndex = game.players.indexOf(playerId);
      if (playerIndex !== -1) {
        // If the player is in this game, mark them as disconnected
        // You could also end the game if you want
        game.isGameOver = true;
        game.result = `Player ${playerIndex === 0 ? 'White' : 'Black'} disconnected`;
        
        // Notify other players in the game
        // This would need to be done via the Gateway - consider adding a method there
        // or injecting an event emitter service both services could use
        
        this.games.set(gameId, game);
      }
    }
  }

  private isLegalNextPosition(prevBoard: Chess, newBoard: Chess): boolean {
    // Get all legal moves from the previous position
    const legalMoves = prevBoard.moves({ verbose: true });
    
    // Try each legal move to see if any result in the new position
    for (const move of legalMoves) {
      const tempBoard = new Chess(prevBoard.fen());
      tempBoard.move(move);
      
      // If the FEN (excluding move counters) matches, it's a legal follow-up position
      const tempFenParts = tempBoard.fen().split(' ').slice(0, 4).join(' ');
      const newFenParts = newBoard.fen().split(' ').slice(0, 4).join(' ');
      
      if (tempFenParts === newFenParts) {
        return true;
      }
    }
    
    return false;
  }

  getGame(gameId: string): GameState | null {
    return this.games.get(gameId) || null;
  }
}