import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// เปลี่ยนรับค่าเป็น lat, lng ให้ชัดเจนไปเลย ป้องกันการสับสนแกน X, Y
export interface PositionPayload {
  guest_id: string;
  mode: string;
  geom: { lat: number; lng: number }; 
  floor_id: number;
}

@Injectable()
export class CoreLogicService {
  constructor(private prisma: PrismaService) {}

  async handlePositionUpdate(payload: PositionPayload) {
    const { guest_id, mode, geom, floor_id } = payload;

    // 1. Guest Management: Upsert (มีแล้วอัปเดตเวลา, ไม่มีให้สร้างใหม่)
    await this.prisma.$executeRaw`
      INSERT INTO guest_users (guest_id, created_at, last_active)
      VALUES (${guest_id}, NOW(), NOW())
      ON CONFLICT (guest_id) 
      DO UPDATE SET last_active = NOW();
    `;

    // 2. Data Persistence (PostGIS)
    // ⚠️ สำคัญ: ST_MakePoint ต้องรับค่าเป็น (Longitude, Latitude) เสมอ
    await this.prisma.$executeRaw`
      INSERT INTO calibrations (guest_id, floor_id, geom, created_at)
      VALUES (
        ${guest_id}, 
        ${floor_id}, 
        ST_SetSRID(ST_MakePoint(${geom.lng}, ${geom.lat}), 4326), 
        NOW()
      )
    `;

    return { success: true };
  }
}
