import { Injectable } from '@nestjs/common';
import { prisma } from '@wa/database';

@Injectable()
export class NavModulesService {
  findAll() {
    return prisma.navModule.findMany({ orderBy: { order: 'asc' } });
  }
}
