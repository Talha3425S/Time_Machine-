import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExperimentsService } from './experiments.service';
import type { CreateExperimentInput } from './experiments.service';

@Controller('api/projects/:projectId/experiments')
@UseGuards(JwtAuthGuard)
export class ExperimentsController {
  constructor(private readonly experiments: ExperimentsService) {}
  @Post() create(@Param('projectId') projectId: string, @Body() input: CreateExperimentInput) { return this.experiments.create(projectId, input); }
  @Get() list(@Param('projectId') projectId: string) { return this.experiments.list(projectId); }
  @Get(':id') get(@Param('id') id: string) { return this.experiments.get(id); }
  @Post(':id/restore') restore(@Param('id') id: string) { return this.experiments.restore(id); }
  @Delete(':id') remove(@Param('id') id: string) { return this.experiments.remove(id); }
}
