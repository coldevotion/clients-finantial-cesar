import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: '/conversations', cors: { origin: '*' } })
export class ConversationsGateway {
  @WebSocketServer()
  server!: Server;

  @SubscribeMessage('join')
  handleJoin(@MessageBody() conversationId: string, @ConnectedSocket() client: Socket) {
    client.join(`conv:${conversationId}`);
  }

  @SubscribeMessage('leave')
  handleLeave(@MessageBody() conversationId: string, @ConnectedSocket() client: Socket) {
    client.leave(`conv:${conversationId}`);
  }

  notifyNewMessage(conversationId: string, message: unknown) {
    this.server.to(`conv:${conversationId}`).emit('new_message', message);
  }

  notifyMessageStatusUpdate(conversationId: string, update: unknown) {
    this.server.to(`conv:${conversationId}`).emit('message_status', update);
  }
}
