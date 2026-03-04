import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LocationService, SyncPositionDto } from './location.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/location', // ให้หน้าบ้านต่อมาที่ ws://.../location
})
export class LocationGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly locationService: LocationService) {}

  // รับ Event 'sync_location' 
  @SubscribeMessage('sync_location')
  async handleSyncLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SyncPositionDto // รับ Payload เป็น x, y
  ) {
    try {
      // 1. บันทึกลง Database (เรียกใช้ Service ด้านบน)
      await this.locationService.saveLocation(payload);

      // 2. กระจายข้อมูลให้คนอื่น (Broadcast) เผื่อมีคนอื่นเปิดแผนที่อยู่
      client.broadcast.emit('update_map', {
        guest_id: payload.guest_id,
        mode: payload.mode,
        geom: payload.geom, // ส่ง x, y กลับไปให้หน้าบ้านอัปเดตแผนที่
        floor_id: payload.floor_id,
        timestamp: new Date().toISOString(),
      });

      return { status: 'success' };
    } catch (error) {
      console.error(`❌ Socket Error [${payload.guest_id}]:`, error.message);
      return { status: 'error', message: 'Failed to sync position' };
    }
  }
}
