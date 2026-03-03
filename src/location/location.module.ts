import { Module } from '@nestjs/common';
import { LocationService } from './location.service';
import { LocationGateway } from './location.gateway';
// import { PrismaModule } from '../prisma/prisma.module'; // เอาคอมเมนต์ออกถ้าพี่ยืมมี PrismaModule แยกไว้

@Module({
  // imports: [PrismaModule], // เอาคอมเมนต์ออกถ้าพี่ยืมมี PrismaModule
  providers: [LocationGateway, LocationService],
})
export class LocationModule {}
