import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BulkUploadsController } from './bulk-uploads.controller';
import { BulkUploadsService } from './bulk-uploads.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'bulk-uploads' }),
  ],
  controllers: [BulkUploadsController],
  providers: [BulkUploadsService],
  exports: [BulkUploadsService],
})
export class BulkUploadsModule {}
