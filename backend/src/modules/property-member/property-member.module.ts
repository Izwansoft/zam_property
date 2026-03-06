import { Module } from '@nestjs/common';
import { DatabaseModule } from '@infrastructure/database';
import { PartnerContextModule } from '@core/partner-context';
import {
  PropertyMemberController,
  MyPropertiesController,
} from './property-member.controller';
import { PropertyMemberService } from './property-member.service';

@Module({
  imports: [DatabaseModule, PartnerContextModule],
  controllers: [PropertyMemberController, MyPropertiesController],
  providers: [PropertyMemberService],
  exports: [PropertyMemberService],
})
export class PropertyMemberModule {}
