import { Injectable } from '@nestjs/common';
import { prisma } from '@wa/database';
import type { Prisma } from '@wa/database';

@Injectable()
export class LogsService {
  create(params: Prisma.LogUncheckedCreateInput) {
    return prisma.log.create({ data: params });
  }
}
