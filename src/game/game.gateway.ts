import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
 ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { MoveData } from '../interface/game.interface';

@WebSocketGateway({ cors: true })
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(private gameService: GameService) {}

  afterInit(server: Server) {
    console.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // Handle player disconnection and update timers
    this.gameService.handlePlayerDisconnect(client.id);
  }

  @SubscribeMessage('createGame')
  handleCreateGame(client: Socket, payload: { gameId: string, timeControl?: number }) {
    const { gameId, timeControl } = payload;
    const game = this.gameService.createGame(gameId, client.id, timeControl || 600); // Default 10 minutes
    client.join(gameId);
    client.emit('createGameResponse', { event: 'gameCreated', data: game });
  }

  @SubscribeMessage('joinGame')
  handleJoinGame(client: Socket, gameId: string) {
    const game = this.gameService.joinGame(gameId, client.id);

    if (game) {
      client.join(gameId);
      this.server.to(gameId).emit('playerJoined', game); // Notify other players
      client.emit('joinGameResponse', { event: 'gameJoined', data: game }); // Send response only to the requester
      
      // If this is the second player joining, start the timer for white
      if (game.players.length === 2) {
        this.server.to(gameId).emit('gameStarted', {
          timeControl: game.timeControl
        });
      }
    } else {
      client.emit('joinGameResponse', { event: 'error', data: 'Game not found' });
    }
  }

  @SubscribeMessage('makeMove')
  async handleMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string; fen: string; playerId: string; timestamp?: number }
  ) {
    const serverTimestamp = Date.now();
    const result = await this.gameService.validateMove(
      data.gameId,
      data.fen,
      data.playerId,
      data.timestamp,
      serverTimestamp
    );

    if (result.isValid && result.updatedGame) {
      // Send the updated game state to all players in the game
      this.server.to(data.gameId).emit('moveMade', {
        ...result.updatedGame,
        moveTimestamp: serverTimestamp
      });

      // Check if the game includes a commentary and emit it
      if (result.updatedGame.lastCommentary) {
        this.server.to(data.gameId).emit('commentary', {
          gameId: data.gameId,
          commentary: result.updatedGame.lastCommentary
        });
      }

      // Check if the game is over
      if (result.updatedGame.isGameOver) {
        this.server.to(data.gameId).emit('gameOver', {
          gameId: data.gameId,
          result: result.updatedGame.result
        });
      }
    } else {
      // Send a move rejection event to the client
      client.emit('moveResponse', {
        event: 'moveRejected',
        data: result.message
      });
    }
  }

  @SubscribeMessage('getGameState')
  handleGetGameState(client: Socket, gameId: string) {
    const game = this.gameService.getGame(gameId);
    if (game) {
      return { event: 'gameState', data: game };
    } else {
      return { event: 'error', data: 'Game not found' };
    }
  }
  
  @SubscribeMessage('timerSync')
  handleTimerSync(client: Socket, data: { gameId: string, clientTime: number }) {
    // Allow clients to sync their time with the server
    const { gameId } = data;
    const game = this.gameService.getGame(gameId);
    
    if (game && game.timeControl) {
      client.emit('timerUpdate', {
        serverTime: Date.now(),
        timeLeft: game.timeControl.timeLeft
      });
    }
  }
}
