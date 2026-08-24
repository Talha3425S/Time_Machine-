import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MembersService } from './members.service';

interface RequestWithUser extends Request {
  user: {
    id: string;
    githubId: string;
    username: string;
    email: string;
  };
}

@Controller('organizations/:organizationId/members')
@UseGuards(JwtAuthGuard)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  async inviteMember(
    @Param('organizationId') organizationId: string,
    @Body() body: { email: string; role: 'admin' | 'member' | 'viewer' },
    @Request() req: RequestWithUser,
  ) {
    return this.membersService.inviteMember(
      organizationId,
      body.email,
      body.role,
      req.user.id,
    );
  }

  @Get()
  async getMembers(@Param('organizationId') organizationId: string) {
    return this.membersService.getMembers(organizationId);
  }

  @Patch(':memberId')
  async updateMemberRole(
    @Param('organizationId') organizationId: string,
    @Param('memberId') memberId: string,
    @Body() body: { role: 'admin' | 'member' | 'viewer' },
  ) {
    return this.membersService.updateMemberRole(organizationId, memberId, body.role);
  }

  @Delete(':memberId')
  async removeMember(
    @Param('organizationId') organizationId: string,
    @Param('memberId') memberId: string,
  ) {
    await this.membersService.removeMember(organizationId, memberId);
    return { success: true };
  }

  @Post('accept/:inviteToken')
  async acceptInvite(
    @Param('inviteToken') inviteToken: string,
    @Request() req: RequestWithUser,
  ) {
    return this.membersService.acceptInvite(inviteToken, req.user.id);
  }
}
