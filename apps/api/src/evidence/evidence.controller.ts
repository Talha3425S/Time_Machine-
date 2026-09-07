import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EvidenceService } from './evidence.service';

@Controller('api/projects/:projectId/incidents/:incidentId')
@UseGuards(JwtAuthGuard)
export class EvidenceController {
  constructor(private readonly evidence: EvidenceService) {}

  @Post('evidence/collect')
  collect(@Param('projectId') projectId: string, @Param('incidentId') incidentId: string) { return this.evidence.collect(projectId, incidentId); }

  @Get('evidence')
  list(@Param('projectId') projectId: string, @Param('incidentId') incidentId: string) { return this.evidence.list(projectId, incidentId); }

  @Get('evidence/history')
  history(@Param('projectId') projectId: string, @Param('incidentId') incidentId: string) { return this.evidence.history(projectId, incidentId); }

  @Post('proof-reports')
  generateReport(@Param('projectId') projectId: string, @Param('incidentId') incidentId: string) { return this.evidence.generateReport(projectId, incidentId); }

  @Get('proof-reports')
  listReports(@Param('projectId') projectId: string, @Param('incidentId') incidentId: string) { return this.evidence.listReports(projectId, incidentId); }
}
