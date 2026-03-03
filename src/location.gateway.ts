import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CoreLogicService, PositionPayload } from './core-logic.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/location', // ให้หน้าบ้านต่อมาที่ ws://domain/location
})
export class LocationGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly coreLogicService: CoreLogicService) {}

  // รับ Event 'sync_location' จากที่ Frontend (นาย) ยิงมา
  @SubscribeMessage('sync_location')
  async handleSyncLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: PositionPayload
  ) {
    try {
      // 1. เรียก Service เพื่อจัดการ Guest และเซฟลง DB [cite: 141, 142, 289]
      await this.coreLogicService.handlePositionUpdate(payload);

      // 2. Broadcast พิกัดนี้ให้คนอื่นใน 3D Scene เห็น 
      client.broadcast.emit('update_map', {
        guest_id: payload.guest_id,
        mode: payload.mode,
        geom: payload.geom,
        floor_id: payload.floor_id,
        timestamp: new Date().toISOString(),
      });

      // ตอบกลับให้หน้าบ้านรู้ว่าเซฟสำเร็จ
      return { status: 'success' };
      
    } catch (error) {
      console.error(`❌ Socket Error [${payload.guest_id}]:`, error.message);
      return { status: 'error', message: 'Failed to sync position' };
    }
  }
}
