import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';
import { Organization } from '../entities/organization.entity';
import { Project } from '../entities/project.entity';
import { OrganizationMember } from '../entities/organization-member.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Organization, Project, OrganizationMember, User])],
  controllers: [OrganizationsController, MembersController],
  providers: [OrganizationsService, MembersService],
  exports: [OrganizationsService, MembersService],
})
export class OrganizationsModule {}
