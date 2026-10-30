import { Module } from '@nestjs/common';
import { SOPController } from './sop.controller';
import { SOPService } from './sop.service';

@Module({
  controllers: [SOPController],
  providers: [SOPService],
})
export class SOPModule {}
