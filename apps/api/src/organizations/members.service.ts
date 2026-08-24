import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationMember } from '../entities/organization-member.entity';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import * as crypto from 'crypto';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(OrganizationMember)
    private membersRepository: Repository<OrganizationMember>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
  ) {}

  async inviteMember(organizationId: string, email: string, role: 'admin' | 'member' | 'viewer', invitedBy: string) {
    // Check if organization exists
    const organization = await this.organizationsRepository.findOne({ where: { id: organizationId } });
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Check if user already exists with this email
    const existingUser = await this.usersRepository.findOne({ where: { email } });
    
    // Check if already a member (if user exists)
    if (existingUser) {
      const existingMember = await this.membersRepository.findOne({
        where: { organizationId, userId: existingUser.id },
      });

      if (existingMember) {
        throw new BadRequestException('User is already a member of this organization');
      }
    }

    // Generate invite token
    const inviteToken = crypto.randomBytes(32).toString('hex');

    // Create pending member (userId will be set when they accept)
    const member = this.membersRepository.create({
      organizationId,
      userId: existingUser?.id || undefined,
      role,
      status: 'pending',
      invitedBy,
      inviteToken,
      invitedAt: new Date(),
    });

    await this.membersRepository.save(member);

    // In a real implementation, send email with invite link
    // For now, return the invite token
    return {
      member,
      inviteLink: `${process.env.FRONTEND_URL}/invites/${inviteToken}`,
    };
  }

  async acceptInvite(inviteToken: string, userId: string) {
    const member = await this.membersRepository.findOne({
      where: { inviteToken, status: 'pending' },
    });

    if (!member) {
      throw new NotFoundException('Invalid or expired invite');
    }

    // Update member status
    member.userId = userId;
    member.status = 'active';
    member.joinedAt = new Date();
    member.inviteToken = null;

    await this.membersRepository.save(member);

    return member;
  }

  async getMembers(organizationId: string) {
    const members = await this.membersRepository.find({
      where: { organizationId },
      relations: ['user'],
    });

    return members.map(member => ({
      id: member.id,
      userId: member.userId,
      username: member.user?.username || 'Pending',
      email: member.user?.email || 'Pending invite',
      avatarUrl: member.user?.avatarUrl,
      role: member.role,
      status: member.status,
      joinedAt: member.joinedAt,
    }));
  }

  async updateMemberRole(organizationId: string, memberId: string, role: 'admin' | 'member' | 'viewer') {
    const member = await this.membersRepository.findOne({
      where: { id: memberId, organizationId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    member.role = role;
    await this.membersRepository.save(member);

    return member;
  }

  async removeMember(organizationId: string, memberId: string) {
    const member = await this.membersRepository.findOne({
      where: { id: memberId, organizationId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    await this.membersRepository.remove(member);
  }
}
