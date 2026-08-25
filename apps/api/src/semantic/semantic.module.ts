import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SemanticDiffService } from './semantic-diff.service';
import { LaravelAdapterService } from './laravel-adapter.service';
import { StateGraphService } from './state-graph.service';
import { StateManifest } from '../entities/state-manifest.entity';
import { StateGraph } from '../entities/state-graph.entity';
import { StateGraphNode } from '../entities/state-graph.entity';
import { StateGraphEdge } from '../entities/state-graph.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StateManifest, StateGraph, StateGraphNode, StateGraphEdge])],
  providers: [SemanticDiffService, LaravelAdapterService, StateGraphService],
  exports: [SemanticDiffService, LaravelAdapterService, StateGraphService],
})
export class SemanticModule {}
