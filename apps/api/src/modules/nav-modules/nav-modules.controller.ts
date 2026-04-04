import { Controller, Get, UseGuards } from '@nestjs/common';
import { NavModulesService } from './nav-modules.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('nav-modules')
@UseGuards(JwtAuthGuard)
export class NavModulesController {
  constructor(private readonly navModulesService: NavModulesService) {}

  /** GET /nav-modules — catálogo completo de módulos (cualquier usuario autenticado) */
  @Get()
  findAll() {
    return this.navModulesService.findAll();
  }
}
