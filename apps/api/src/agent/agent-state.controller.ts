import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request, Headers } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AgentStateService } from './agent-state.service';
import { OracleService } from './oracle.service';
import type { OraclePayload } from './oracle.service';

interface RequestWithUser extends Request {
  user: {
    id: string;
    githubId: string;
    username: string;
    email: string;
  };
}

@Controller('api/projects/:projectId')
@UseGuards(JwtAuthGuard)
export class AgentStateController {
  constructor(private readonly agentStateService: AgentStateService, private readonly oracleService: OracleService) {}

  @Post('state')
  async uploadState(
    @Param('projectId') projectId: string,
    @Body() stateData: any,
    @Headers('user-agent') userAgent: string,
    @Request() req: RequestWithUser,
  ) {
    const metadata = {
      userId: req.user.id,
      agentVersion: this.extractAgentVersion(userAgent),
      hostname: req.headers.get('x-forwarded-host') || req.headers.get('host'),
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      collectionTrigger: 'manual',
    };

    return this.agentStateService.uploadState(projectId, stateData, metadata);
  }

  @Get('agent-config')
  async getAgentConfig(@Param('projectId') projectId: string) {
    return this.agentStateService.getAgentConfiguration(projectId);
  }

  @Post('heartbeat')
  async heartbeat(
    @Param('projectId') projectId: string,
    @Body() heartbeatData: any,
    @Headers('user-agent') userAgent: string,
  ) {
    const enhancedHeartbeat = {
      ...heartbeatData,
      agentVersion: this.extractAgentVersion(userAgent),
      timestamp: new Date().toISOString(),
    };

    return this.agentStateService.recordHeartbeat(projectId, enhancedHeartbeat);
  }

  @Post('error')
  async reportError(
    @Param('projectId') projectId: string,
    @Body() errorData: any,
  ) {
    return this.agentStateService.reportError(projectId, errorData);
  }

  @Post('oracle-results')
  async recordOracleResult(@Param('projectId') projectId: string, @Body() payload: OraclePayload) {
    return this.oracleService.record(projectId, payload);
  }

  @Get('incidents')
  async getIncidents(@Param('projectId') projectId: string) { return this.oracleService.incidentsForProject(projectId); }

  @Get('states')
  async getProjectStates(
    @Param('projectId') projectId: string,
    @Query('limit') limit: string = '50',
    @Query('offset') offset: string = '0',
  ) {
    const limitNum = parseInt(limit, 10);
    const offsetNum = parseInt(offset, 10);
    return this.agentStateService.getProjectStates(projectId, limitNum, offsetNum);
  }

  @Get('states/latest')
  async getLatestState(@Param('projectId') projectId: string) {
    return this.agentStateService.getLatestState(projectId);
  }

  private extractAgentVersion(userAgent: string): string | null {
    if (!userAgent) return null;
    
    // Expected format: "STM-Agent/1.0"
    const match = userAgent.match(/STM-Agent\/([\d.]+)/);
    return match ? match[1] : null;
  }
}

@Controller('api/states')
@UseGuards(JwtAuthGuard)
export class StatesController {
  constructor(private readonly agentStateService: AgentStateService) {}

  @Get(':id')
  async getState(@Param('id') id: string) {
    return this.agentStateService.getAgentState(id);
  }

  @Delete(':id')
  async deleteState(@Param('id') id: string) {
    return this.agentStateService.deleteState(id);
  }
}
