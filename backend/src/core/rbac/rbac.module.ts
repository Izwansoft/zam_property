import { Module } from '@nestjs/common';

import { PermissionsGuard } from './guards/permissions.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  providers: [RolesGuard, PermissionsGuard],
  exports: [RolesGuard, PermissionsGuard],
})
export class RbacModule {}
