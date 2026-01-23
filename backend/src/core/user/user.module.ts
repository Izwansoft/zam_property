import { Module } from '@nestjs/common';

import { RbacModule } from '@core/rbac';
import { DatabaseModule } from '@infrastructure/database';

import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

@Module({
  imports: [RbacModule, DatabaseModule],
  controllers: [UserController],
  providers: [UserRepository, UserService],
  exports: [UserRepository, UserService],
})
export class UserModule {}
