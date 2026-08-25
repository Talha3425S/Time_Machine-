import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SemanticDiffService } from './semantic-diff.service';
import { StateGraphService } from './state-graph.service';
import { StateManifestService } from './state-manifest.service';

@Controller('api/projects/:projectId')
@UseGuards(JwtAuthGuard)
export class SemanticController {
  constructor(private readonly manifests: StateManifestService, private readonly diffs: SemanticDiffService, private readonly graphs: StateGraphService) {}
  @Get('manifests') list(@Param('projectId') projectId: string) { return this.manifests.findProjectManifests(projectId); }
  @Get('manifests/:manifestId') get(@Param('projectId') projectId: string, @Param('manifestId') manifestId: string) { return this.manifests.findOne(projectId, manifestId); }
  @Post('manifests/:sourceManifestId/compare/:targetManifestId') compare(@Param('sourceManifestId') source: string, @Param('targetManifestId') target: string) { return this.diffs.computeDiff(source, target); }
  @Post('state-graph/rebuild') rebuild(@Param('projectId') projectId: string) { return this.graphs.buildProjectGraph(projectId); }
  @Get('state-graph') graph(@Param('projectId') projectId: string) { return this.graphs.getProjectGraph(projectId); }
}
