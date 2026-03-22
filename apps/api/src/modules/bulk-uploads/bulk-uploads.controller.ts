import {
  Controller, Get, Post, Delete,
  Param, Query, UploadedFile, UseGuards, UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { BulkUploadsService } from './bulk-uploads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenantId } from '../../common/decorators/current-tenant.decorator';

const ALLOWED_MIME = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
];

@Controller('bulk-uploads')
@UseGuards(JwtAuthGuard, TenantGuard)
export class BulkUploadsController {
  constructor(private readonly bulkUploadsService: BulkUploadsService) {}

  @Get()
  list(@CurrentTenantId() tenantId: string, @Query('page') page?: string) {
    return this.bulkUploadsService.list(tenantId, Number(page ?? 1));
  }

  @Get(':id')
  findOne(@CurrentTenantId() tenantId: string, @Param('id') id: string) {
    return this.bulkUploadsService.findOne(tenantId, id);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads'),
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
    }),
  )
  async upload(
    @CurrentTenantId() tenantId: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('listId') listId?: string,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      throw new BadRequestException('Only CSV and Excel files are allowed');
    }

    return this.bulkUploadsService.create(tenantId, {
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      storagePath: file.path,
      listId,
    });
  }

  @Delete(':id')
  remove(@CurrentTenantId() tenantId: string, @Param('id') id: string) {
    return this.bulkUploadsService.remove(tenantId, id);
  }
}
