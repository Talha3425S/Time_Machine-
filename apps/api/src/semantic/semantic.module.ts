import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SemanticDiffService } from './semantic-diff.service';
import { LaravelAdapterService } from './laravel-adapter.service';
import { StateGraphService } from './state-graph.service';
import { StateManifest } from '../entities/state-manifest.entity';
import { StateGraph } from '../entities/state-graph.entity';
import { StateGraphNode } from '../entities/state-graph.entity';
import { StateGraphEdge } from '../entities/state-graph.entity';
import { StateManifestService } from './state-manifest.service';
import { SemanticController } from './semantic.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StateManifest, StateGraph, StateGraphNode, StateGraphEdge])],
  controllers: [SemanticController],
  providers: [SemanticDiffService, LaravelAdapterService, StateGraphService, StateManifestService],
  exports: [SemanticDiffService, LaravelAdapterService, StateGraphService, StateManifestService],
})
export class SemanticModule {}
