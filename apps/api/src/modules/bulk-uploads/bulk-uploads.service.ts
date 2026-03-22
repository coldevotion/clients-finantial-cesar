import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { prisma } from '@wa/database';

@Injectable()
export class BulkUploadsService {
  constructor(
    @InjectQueue('bulk-uploads') private readonly queue: Queue,
  ) {}

  list(tenantId: string, page = 1, limit = 20) {
    return prisma.bulkUpload.findMany({
      where: { tenantId },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const upload = await prisma.bulkUpload.findFirst({ where: { id, tenantId } });
    if (!upload) throw new NotFoundException('Upload not found');
    return upload;
  }

  async create(tenantId: string, data: {
    fileName: string;
    fileSize: number;
    mimeType: string;
    storagePath: string;
    listId?: string;
  }) {
    const upload = await prisma.bulkUpload.create({
      data: { tenantId, ...data },
    });

    // Enqueue background processing
    await this.queue.add('process', { tenantId, uploadId: upload.id }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });

    return upload;
  }

  async updateStatus(id: string, status: string, counts?: { total?: number; processed?: number; failed?: number }) {
    return prisma.bulkUpload.update({
      where: { id },
      data: {
        status: status as any,
        ...(counts?.total !== undefined ? { totalRows: counts.total } : {}),
        ...(counts?.processed !== undefined ? { processedRows: counts.processed } : {}),
        ...(counts?.failed !== undefined ? { failedRows: counts.failed } : {}),
      },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return prisma.bulkUpload.delete({ where: { id } });
  }
}
