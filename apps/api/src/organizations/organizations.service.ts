import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../entities/organization.entity';
import { Project } from '../entities/project.entity';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
  ) {}

  async create(createOrganizationDto: { name: string; slug: string }) {
    const organization = this.organizationsRepository.create(createOrganizationDto);
    return this.organizationsRepository.save(organization);
  }

  async findAll() {
    return this.organizationsRepository.find();
  }

  async findOne(id: string) {
    const organization = await this.organizationsRepository.findOne({ where: { id } });
    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }
    return organization;
  }

  async findBySlug(slug: string) {
    return this.organizationsRepository.findOne({ where: { slug } });
  }

  async update(id: string, updateOrganizationDto: { name?: string; slug?: string }) {
    const organization = await this.findOne(id);
    Object.assign(organization, updateOrganizationDto);
    return this.organizationsRepository.save(organization);
  }

  async remove(id: string) {
    const organization = await this.findOne(id);
    await this.organizationsRepository.remove(organization);
    return { message: 'Organization deleted successfully' };
  }

  // Project management within organizations
  async createProject(organizationId: string, createProjectDto: { name: string; repositoryUrl: string; defaultTestCommand?: string }) {
    const organization = await this.findOne(organizationId);
    const project = this.projectsRepository.create({
      ...createProjectDto,
      organizationId,
    });
    return this.projectsRepository.save(project);
  }

  async findProjects(organizationId: string) {
    return this.projectsRepository.find({ where: { organizationId } });
  }

  async findProject(id: string) {
    const project = await this.projectsRepository.findOne({ where: { id } });
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return project;
  }

  async updateProject(id: string, updateProjectDto: { name?: string; repositoryUrl?: string; defaultTestCommand?: string }) {
    const project = await this.findProject(id);
    Object.assign(project, updateProjectDto);
    return this.projectsRepository.save(project);
  }

  async removeProject(id: string) {
    const project = await this.findProject(id);
    await this.projectsRepository.remove(project);
    return { message: 'Project deleted successfully' };
  }
}
