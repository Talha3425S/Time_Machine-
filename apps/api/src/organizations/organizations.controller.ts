import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OrganizationsService } from './organizations.service';

@Controller('organizations')
@UseGuards(AuthGuard('jwt'))
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  create(@Body() createOrganizationDto: { name: string; slug: string }) {
    return this.organizationsService.create(createOrganizationDto);
  }

  @Get()
  findAll() {
    return this.organizationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(id);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.organizationsService.findBySlug(slug);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateOrganizationDto: { name?: string; slug?: string }) {
    return this.organizationsService.update(id, updateOrganizationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.organizationsService.remove(id);
  }

  // Project endpoints
  @Post(':id/projects')
  createProject(
    @Param('id') organizationId: string,
    @Body() createProjectDto: { name: string; repositoryUrl: string; defaultTestCommand?: string }
  ) {
    return this.organizationsService.createProject(organizationId, createProjectDto);
  }

  @Get(':id/projects')
  findProjects(@Param('id') organizationId: string) {
    return this.organizationsService.findProjects(organizationId);
  }

  @Get('projects/:projectId')
  findProject(@Param('projectId') projectId: string) {
    return this.organizationsService.findProject(projectId);
  }

  @Put('projects/:projectId')
  updateProject(
    @Param('projectId') projectId: string,
    @Body() updateProjectDto: { name?: string; repositoryUrl?: string; defaultTestCommand?: string }
  ) {
    return this.organizationsService.updateProject(projectId, updateProjectDto);
  }

  @Delete('projects/:projectId')
  removeProject(@Param('projectId') projectId: string) {
    return this.organizationsService.removeProject(projectId);
  }
}
