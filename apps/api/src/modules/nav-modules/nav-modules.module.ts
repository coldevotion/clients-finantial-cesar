import { Module } from '@nestjs/common';
import { NavModulesController } from './nav-modules.controller';
import { NavModulesService } from './nav-modules.service';

@Module({
  controllers: [NavModulesController],
  providers: [NavModulesService],
})
export class NavModulesModule {}
