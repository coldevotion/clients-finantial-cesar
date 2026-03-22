import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { prisma } from '@wa/database';

@Processor('bulk-uploads')
export class BulkUploadProcessor extends WorkerHost {
  private readonly logger = new Logger(BulkUploadProcessor.name);

  async process(job: Job<{ tenantId: string; uploadId: string }>) {
    const { tenantId, uploadId } = job.data;

    const upload = await prisma.bulkUpload.findUnique({ where: { id: uploadId } });
    if (!upload) return;

    await prisma.bulkUpload.update({ where: { id: uploadId }, data: { status: 'PROCESSING' } });

    try {
      const rows = await this.parseFile(upload.storagePath, upload.mimeType);
      const total = rows.length;
      let processed = 0;
      let failed = 0;

      await prisma.bulkUpload.update({ where: { id: uploadId }, data: { totalRows: total } });

      for (const row of rows) {
        try {
          const phone = (row['phone'] ?? row['Phone'] ?? row['telefono'] ?? '').toString().trim();
          if (!phone) { failed++; continue; }

          const name = (row['name'] ?? row['Name'] ?? row['nombre'] ?? '').toString().trim() || undefined;
          const metadata = row['metadata'] ? JSON.parse(row['metadata']) : undefined;

          await prisma.contact.upsert({
            where: { tenantId_phone: { tenantId, phone } },
            create: { tenantId, phone, name, metadata },
            update: { name, metadata },
          });

          // Optionally add to list
          if (upload.listId) {
            const contact = await prisma.contact.findUnique({ where: { tenantId_phone: { tenantId, phone } } });
            if (contact) {
              await prisma.contactListItem.upsert({
                where: { listId_contactId: { listId: upload.listId, contactId: contact.id } },
                create: { listId: upload.listId, contactId: contact.id },
                update: {},
              });
            }
          }

          processed++;
        } catch (err) {
          failed++;
          this.logger.warn(`Row error in upload ${uploadId}: ${err}`);
        }

        // Update progress every 50 rows
        if ((processed + failed) % 50 === 0) {
          await prisma.bulkUpload.update({
            where: { id: uploadId },
            data: { processedRows: processed, failedRows: failed },
          });
        }
      }

      await prisma.bulkUpload.update({
        where: { id: uploadId },
        data: { status: 'COMPLETED', processedRows: processed, failedRows: failed },
      });

      this.logger.log(`BulkUpload ${uploadId} done: ${processed} ok, ${failed} failed`);
    } catch (err) {
      this.logger.error(`BulkUpload ${uploadId} failed: ${err}`);
      await prisma.bulkUpload.update({ where: { id: uploadId }, data: { status: 'FAILED' } });
      throw err;
    }
  }

  private async parseFile(filePath: string, mimeType: string): Promise<Record<string, string>[]> {
    // For simplicity, handle CSV/TXT (tab or comma separated)
    // For Excel (.xlsx) you'd add a library like xlsx/exceljs
    return new Promise((resolve, reject) => {
      const rows: Record<string, string>[] = [];
      const rl = createInterface({ input: createReadStream(filePath), crlfDelay: Infinity });
      let headers: string[] = [];

      rl.on('line', (line) => {
        const cols = line.split(/,|\t/).map(c => c.trim().replace(/^"|"$/g, ''));
        if (!headers.length) {
          headers = cols;
        } else {
          const row: Record<string, string> = {};
          headers.forEach((h, i) => { row[h] = cols[i] ?? ''; });
          rows.push(row);
        }
      });

      rl.on('close', () => resolve(rows));
      rl.on('error', reject);
    });
  }
}
