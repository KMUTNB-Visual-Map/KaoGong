import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // เปลี่ยน path ให้ตรงกับของโปรเจกต์จริง

@Injectable()
export class LocationService {
  constructor(private prisma: PrismaService) {}

  // ---------------------------------------------------------
  // บันทึกหรืออัปเดตพิกัดลง Database (Persistence)
  // ---------------------------------------------------------
  async saveLocation(data: { guest_id: string; lat: number; lng: number }) {
    
    // ตรวจสอบข้อมูลเบื้องต้น (Validation)
    if (!data.guest_id || data.lat == null || data.lng == null) {
      throw new Error('Invalid GPS payload: Missing required fields');
    }

    // ใช้ Upsert: ถ้ามี guest_id นี้อยู่แล้วให้อัปเดต (Update) 
    // ถ้ายังไม่มีให้สร้างใหม่ (Create) ช่วยลด Error และประหยัดเวลาเขียนเช็ค
    const result = await this.prisma.guestLocation.upsert({
      where: { 
        guestId: data.guest_id // สมมติว่าใน Prisma Schema ใช้ฟิลด์ชื่อ guestId
      },
      update: { 
        lat: data.lat, 
        lng: data.lng, 
        updatedAt: new Date() 
      },
      create: { 
        guestId: data.guest_id, 
        lat: data.lat, 
        lng: data.lng 
      },
    });

    return result;
  }
}
