import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // เปลี่ยน path ให้ตรงกับของโปรเจกต์จริง

// รับ Payload เป็น x, y ตามที่นาย (Frontend) สะดวกส่งมา
export interface SyncPositionDto {
  guest_id: string;
  mode: string;
  geom: { x: number; y: number }; 
  floor_id: number;
}

@Injectable()
export class LocationService {
  constructor(private prisma: PrismaService) {}

  async saveLocation(data: SyncPositionDto) {
    // 1. ตรวจสอบข้อมูลเบื้องต้น
    if (!data.guest_id || !data.geom || data.geom.x == null || data.geom.y == null || data.floor_id == null) {
      throw new Error('Invalid GPS payload: Missing required fields');
    }

    try {
      // 2. Guest Management: Upsert ข้อมูลผู้ใช้
      await this.prisma.$executeRaw`
        INSERT INTO guest_users (guest_id, created_at, last_active)
        VALUES (${data.guest_id}, NOW(), NOW())
        ON CONFLICT (guest_id) 
        DO UPDATE SET last_active = NOW();
      `;

      // 3. Data Persistence: บันทึกพิกัดลง PostGIS
      // ⚠️ ถ้านายส่ง x = ละติจูด, y = ลองติจูด เราจะสลับเอา y ขึ้นก่อน x ตรง ST_MakePoint
      await this.prisma.$executeRaw`
        INSERT INTO calibrations (guest_id, floor_id, geom, created_at)
        VALUES (
          ${data.guest_id}, 
          ${data.floor_id}, 
          ST_SetSRID(ST_MakePoint(${data.geom.y}, ${data.geom.x}), 4326), 
          NOW()
        )
      `;

      return { success: true };
    } catch (error) {
      console.error('Database Error in saveLocation:', error);
      throw new Error('Failed to save location to database');
    }
  }
}
