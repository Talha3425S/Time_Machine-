import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlanningService } from './planning.service';
import type { Hypothesis } from '../entities/hypothesis.entity';

@Controller('api/projects/:projectId/incidents/:incidentId/hypotheses')
@UseGuards(JwtAuthGuard)
export class PlanningController {
  constructor(private readonly planning: PlanningService) {}
  @Post('generate') generate(@Param('projectId') projectId: string, @Param('incidentId') incidentId: string) { return this.planning.generate(projectId, incidentId); }
  @Get() list(@Param('projectId') projectId: string, @Param('incidentId') incidentId: string) { return this.planning.list(projectId, incidentId); }
  @Post('plan') plan(@Param('projectId') projectId: string, @Param('incidentId') incidentId: string, @Body() body: { budget: number; maxExperiments?: number }) { return this.planning.plan(projectId, incidentId, Number(body.budget), body.maxExperiments); }
  @Patch(':hypothesisId') update(@Param('projectId') projectId: string, @Param('incidentId') incidentId: string, @Param('hypothesisId') hypothesisId: string, @Body('status') status: Hypothesis['status']) { return this.planning.updateStatus(projectId, incidentId, hypothesisId, status); }
}
