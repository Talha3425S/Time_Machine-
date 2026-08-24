import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from './organization.entity';
import { User } from './user.entity';

@Entity('organization_members')
export class OrganizationMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ nullable: true })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ default: 'member' })
  role: 'admin' | 'member' | 'viewer';

  @Column({ default: 'pending' })
  status: 'pending' | 'active' | 'removed';

  @Column({ nullable: true })
  invitedBy: string;

  @Column({ type: 'text', nullable: true })
  inviteToken: string | null;

  @Column({ nullable: true })
  invitedAt: Date;

  @Column({ nullable: true })
  joinedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
