import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LocationService } from './location.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/location', // Endpoint: ws://domain/location
})
export class LocationGateway {
  @WebSocketServer()
  server: Server;

  // Inject Service เข้ามาเพื่อเอาไว้คุยกับ Database
  constructor(private readonly locationService: LocationService) {}

  // ---------------------------------------------------------
  // รับ Event 'sync_gps' จาก Frontend
  // ---------------------------------------------------------
  @SubscribeMessage('sync_gps')
  async handleSyncGps(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { guest_id: string; lat: number; lng: number }
  ) {
    try {
      // 1. Persistence: โยนข้อมูลไปให้ Service บันทึกลง Database
      await this.locationService.saveLocation(payload);

      // 2. Broadcast: กระจายพิกัดใหม่ไปให้ "ทุกคนยกเว้นคนส่ง" (เพื่อประหยัดแบนด์วิดท์)
      // ถ้าอยากให้ส่งหาทุกคนรวมถึงตัวเองด้วย ให้ใช้ this.server.emit(...)
      client.broadcast.emit('update_map', {
        guest_id: payload.guest_id,
        lat: payload.lat,
        lng: payload.lng,
        timestamp: new Date().toISOString(),
      });

      // 3. Acknowledge: ตอบกลับคนส่งว่า "ระบบบันทึกและกระจายให้แล้วนะ"
      return { status: 'success', message: 'GPS synced and broadcasted' };

    } catch (error) {
      console.error(`❌ Error syncing GPS for ${payload.guest_id}:`, error.message);
      return { status: 'error', message: 'Failed to sync GPS' };
    }
  }
}
