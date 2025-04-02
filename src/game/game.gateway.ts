import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
  } from '@nestjs/websockets';
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
    }
  
    @SubscribeMessage('createGame')
    handleCreateGame(client: Socket, gameId: string) {
      const game = this.gameService.createGame(gameId, client.id);
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
        } else {
            client.emit('joinGameResponse', { event: 'error', data: 'Game not found' });
        }
    }
    
  
    @SubscribeMessage('makeMove')
    handleMakeMove(client: Socket, data: MoveData) {
        const { gameId, fen, playerId } = data;
        const result = this.gameService.validateMove(gameId, fen, playerId);
    
        if (result.isValid && result.updatedGame) {
            this.server.to(gameId).emit('moveMade', result.updatedGame); // Broadcast move to all players
            
            if (result.updatedGame.isGameOver) {
                this.server.to(gameId).emit('gameOver', {
                    result: result.updatedGame.result,
                }); // Broadcast game over event
            }
    
            client.emit('moveResponse', { event: 'moveSuccess', data: result.updatedGame }); // Send response only to the player who made the move
        } else {
            client.emit('moveResponse', { event: 'moveRejected', data: result.message }); // Send rejection to the player who made the move
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
  }
  