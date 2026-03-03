import { Module } from '@nestjs/common';
// 1. Import LocationModule ของเราเข้ามา (พิมพ์เพิ่มบรรทัดนี้)
import { LocationModule } from './location/location.module'; 

// (อาจจะมี Import อื่นๆ ของพี่ยืมอยู่ด้วย ไม่ต้องไปลบของเขานะครับ)

@Module({
  imports: [
    // 2. เอา LocationModule มาใส่ใน Array นี้
    LocationModule, 
    
    // ... ด้านล่างนี้อาจจะมี Module อื่นๆ ของพี่ยืมอยู่ ปล่อยไว้เหมือนเดิมครับ
    // เช่น PrismaModule, UsersModule, AuthModule เป็นต้น
  ],
  controllers: [], // ของพี่ยืมมีอะไรปล่อยไว้อย่างนั้น
  providers: [],   // ของพี่ยืมมีอะไรปล่อยไว้อย่างนั้น
})
export class AppModule {}
