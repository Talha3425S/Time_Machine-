import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StateManifest } from '../entities/state-manifest.entity';
import * as crypto from 'crypto';

export interface Change {
  type: 'environment' | 'dependency' | 'configuration' | 'infrastructure';
  category: string;
  path: string;
  before: any;
  after: any;
  severity: 'critical' | 'major' | 'minor' | 'info';
  impact: 'breaking' | 'compatible' | 'unknown';
}

export interface DiffResult {
  manifestA: string;
  manifestB: string;
  timestamp: Date;
  changes: Change[];
  summary: {
    totalChanges: number;
    criticalChanges: number;
    breakingChanges: number;
    compatibleChanges: number;
  };
}

export interface NormalizedState {
  framework: string;
  dependencies: {
    critical: string[];
    optional: string[];
    dev: string[];
  };
  configuration: Record<string, any>;
}

@Injectable()
export class SemanticDiffService {
  constructor(
    @InjectRepository(StateManifest)
    private stateManifestRepository: Repository<StateManifest>,
  ) {}

  /**
   * Compute semantic diff between two state manifests
   */
  async computeDiff(manifestAId: string, manifestBId: string): Promise<DiffResult> {
    const manifestA = await this.stateManifestRepository.findOne({ 
      where: { id: manifestAId } 
    });
    const manifestB = await this.stateManifestRepository.findOne({ 
      where: { id: manifestBId } 
    });

    if (!manifestA || !manifestB) {
      throw new Error('One or both manifests not found');
    }

    const changes: Change[] = [];

    // Compare environments
    const envChanges = this.compareEnvironments(
      manifestA.environment,
      manifestB.environment
    );
    changes.push(...envChanges);

    // Compare dependencies
    const depChanges = this.compareDependencies(
      manifestA.dependencies,
      manifestB.dependencies
    );
    changes.push(...depChanges);

    // Compare configuration
    const configChanges = this.compareConfiguration(
      manifestA.configuration,
      manifestB.configuration
    );
    changes.push(...configChanges);

    // Compare infrastructure
    const infraChanges = this.compareInfrastructure(
      manifestA.infrastructure,
      manifestB.infrastructure
    );
    changes.push(...infraChanges);

    return {
      manifestA: manifestAId,
      manifestB: manifestBId,
      timestamp: new Date(),
      changes,
      summary: this.calculateSummary(changes),
    };
  }

  /**
   * Compare environment information
   */
  private compareEnvironments(envA: any, envB: any): Change[] {
    const changes: Change[] = [];

    // Compare OS
    if (envA?.system?.os?.name !== envB?.system?.os?.name) {
      changes.push({
        type: 'environment',
        category: 'os',
        path: 'system.os.name',
        before: envA?.system?.os?.name,
        after: envB?.system?.os?.name,
        severity: 'critical',
        impact: 'breaking',
      });
    }

    // Compare runtime version
    if (envA?.system?.runtime?.version !== envB?.system?.runtime?.version) {
      changes.push({
        type: 'environment',
        category: 'runtime',
        path: 'system.runtime.version',
        before: envA?.system?.runtime?.version,
        after: envB?.system?.runtime?.version,
        severity: 'major',
        impact: 'breaking',
      });
    }

    // Compare environment variables
    const varsA = envA?.variables || {};
    const varsB = envB?.variables || {};
    const allVarKeys = new Set([...Object.keys(varsA), ...Object.keys(varsB)]);

    allVarKeys.forEach(key => {
      if (varsA[key] !== varsB[key]) {
        changes.push({
          type: 'environment',
          category: 'variables',
          path: `variables.${key}`,
          before: this.sanitizeValue(varsA[key]),
          after: this.sanitizeValue(varsB[key]),
          severity: this.determineEnvVarSeverity(key),
          impact: 'unknown',
        });
      }
    });

    return changes;
  }

  /**
   * Compare package dependencies
   */
  private compareDependencies(depsA: any, depsB: any): Change[] {
    const changes: Change[] = [];

    // Compare runtime packages
    const runtimeA = depsA?.runtime?.packages || [];
    const runtimeB = depsB?.runtime?.packages || [];
    
    const packageChanges = this.comparePackageLists(runtimeA, runtimeB, 'runtime');
    changes.push(...packageChanges);

    // Compare system packages
    const systemA = depsA?.system?.packages || [];
    const systemB = depsB?.system?.packages || [];
    
    const systemChanges = this.comparePackageLists(systemA, systemB, 'system');
    changes.push(...systemChanges);

    return changes;
  }

  /**
   * Compare package lists
   */
  private comparePackageLists(packagesA: any[], packagesB: any[], category: string): Change[] {
    const changes: Change[] = [];
    const mapA = new Map(packagesA.map(p => [p.name, p]));
    const mapB = new Map(packagesB.map(p => [p.name, p]));

    // Check for added packages
    packagesB.forEach(pkgB => {
      if (!mapA.has(pkgB.name)) {
        changes.push({
          type: 'dependency',
          category,
          path: `packages.${pkgB.name}`,
          before: null,
          after: pkgB.version,
          severity: this.determinePackageSeverity(pkgB.name, category),
          impact: 'compatible',
        });
      }
    });

    // Check for removed packages
    packagesA.forEach(pkgA => {
      if (!mapB.has(pkgA.name)) {
        changes.push({
          type: 'dependency',
          category,
          path: `packages.${pkgA.name}`,
          before: pkgA.version,
          after: null,
          severity: this.determinePackageSeverity(pkgA.name, category),
          impact: 'breaking',
        });
      }
    });

    // Check for version changes
    packagesA.forEach(pkgA => {
      const pkgB = mapB.get(pkgA.name);
      if (pkgB && pkgA.version !== pkgB.version) {
        changes.push({
          type: 'dependency',
          category,
          path: `packages.${pkgA.name}`,
          before: pkgA.version,
          after: pkgB.version,
          severity: this.determineVersionChangeSeverity(pkgA.version, pkgB.version),
          impact: this.determineVersionImpact(pkgA.version, pkgB.version),
        });
      }
    });

    return changes;
  }

  /**
   * Compare configuration
   */
  private compareConfiguration(configA: any, configB: any): Change[] {
    const changes: Change[] = [];

    // Compare application configuration
    const appA = configA?.application || {};
    const appB = configB?.application || {};

    if (appA.environment !== appB.environment) {
      changes.push({
        type: 'configuration',
        category: 'application',
        path: 'application.environment',
        before: appA.environment,
        after: appB.environment,
        severity: 'major',
        impact: 'breaking',
      });
    }

    if (appA.debug !== appB.debug) {
      changes.push({
        type: 'configuration',
        category: 'application',
        path: 'application.debug',
        before: appA.debug,
        after: appB.debug,
        severity: 'minor',
        impact: 'compatible',
      });
    }

    // Compare extension configurations
    const extA = configA?.extensions || [];
    const extB = configB?.extensions || [];

    const extChanges = this.compareExtensions(extA, extB);
    changes.push(...extChanges);

    return changes;
  }

  /**
   * Compare extensions
   */
  private compareExtensions(extA: any[], extB: any[]): Change[] {
    const changes: Change[] = [];
    const mapA = new Map(extA.map(e => [e.name, e]));
    const mapB = new Map(extB.map(e => [e.name, e]));

    // Check for added/removed extensions
    extB.forEach(extB => {
      if (!mapA.has(extB.name)) {
        changes.push({
          type: 'configuration',
          category: 'extensions',
          path: `extensions.${extB.name}`,
          before: null,
          after: { enabled: extB.enabled, version: extB.version },
          severity: 'major',
          impact: 'breaking',
        });
      }
    });

    extA.forEach(extA => {
      if (!mapB.has(extA.name)) {
        changes.push({
          type: 'configuration',
          category: 'extensions',
          path: `extensions.${extA.name}`,
          before: { enabled: extA.enabled, version: extA.version },
          after: null,
          severity: 'major',
          impact: 'breaking',
        });
      }
    });

    // Check for enabled/disabled changes
    extA.forEach(extA => {
      const extB = mapB.get(extA.name);
      if (extB && extA.enabled !== extB.enabled) {
        changes.push({
          type: 'configuration',
          category: 'extensions',
          path: `extensions.${extA.name}.enabled`,
          before: extA.enabled,
          after: extB.enabled,
          severity: 'minor',
          impact: 'compatible',
        });
      }
    });

    return changes;
  }

  /**
   * Compare infrastructure
   */
  private compareInfrastructure(infraA: any, infraB: any): Change[] {
    const changes: Change[] = [];

    // Compare Docker daemon
    if (infraA?.docker?.daemon?.version !== infraB?.docker?.daemon?.version) {
      changes.push({
        type: 'infrastructure',
        category: 'docker',
        path: 'docker.daemon.version',
        before: infraA?.docker?.daemon?.version,
        after: infraB?.docker?.daemon?.version,
        severity: 'minor',
        impact: 'compatible',
      });
    }

    // Compare containers
    const containersA = infraA?.docker?.containers || [];
    const containersB = infraB?.docker?.containers || [];

    const containerChanges = this.compareContainers(containersA, containersB);
    changes.push(...containerChanges);

    // Compare services
    const servicesA = infraA?.services || [];
    const servicesB = infraB?.services || [];

    const serviceChanges = this.compareServices(servicesA, servicesB);
    changes.push(...serviceChanges);

    return changes;
  }

  /**
   * Compare Docker containers
   */
  private compareContainers(containersA: any[], containersB: any[]): Change[] {
    const changes: Change[] = [];
    const mapA = new Map(containersA.map(c => [c.id, c]));
    const mapB = new Map(containersB.map(c => [c.id, c]));

    // Check for added/removed containers
    containersB.forEach(containerB => {
      if (!mapA.has(containerB.id)) {
        changes.push({
          type: 'infrastructure',
          category: 'docker.containers',
          path: `containers.${containerB.name}`,
          before: null,
          after: { status: containerB.status, image: containerB.image },
          severity: 'major',
          impact: 'breaking',
        });
      }
    });

    containersA.forEach(containerA => {
      if (!mapB.has(containerA.id)) {
        changes.push({
          type: 'infrastructure',
          category: 'docker.containers',
          path: `containers.${containerA.name}`,
          before: { status: containerA.status, image: containerA.image },
          after: null,
          severity: 'major',
          impact: 'breaking',
        });
      }
    });

    // Check for status changes
    containersA.forEach(containerA => {
      const containerB = mapB.get(containerA.id);
      if (containerB && containerA.status !== containerB.status) {
        changes.push({
          type: 'infrastructure',
          category: 'docker.containers',
          path: `containers.${containerA.name}.status`,
          before: containerA.status,
          after: containerB.status,
          severity: 'major',
          impact: 'breaking',
        });
      }
    });

    return changes;
  }

  /**
   * Compare services
   */
  private compareServices(servicesA: any[], servicesB: any[]): Change[] {
    const changes: Change[] = [];
    const mapA = new Map(servicesA.map(s => [s.name, s]));
    const mapB = new Map(servicesB.map(s => [s.name, s]));

    // Check for added/removed services
    servicesB.forEach(serviceB => {
      if (!mapA.has(serviceB.name)) {
        changes.push({
          type: 'infrastructure',
          category: 'services',
          path: `services.${serviceB.name}`,
          before: null,
          after: { status: serviceB.status, version: serviceB.version },
          severity: 'major',
          impact: 'breaking',
        });
      }
    });

    servicesA.forEach(serviceA => {
      if (!mapB.has(serviceA.name)) {
        changes.push({
          type: 'infrastructure',
          category: 'services',
          path: `services.${serviceA.name}`,
          before: { status: serviceA.status, version: serviceA.version },
          after: null,
          severity: 'major',
          impact: 'breaking',
        });
      }
    });

    // Check for status changes
    servicesA.forEach(serviceA => {
      const serviceB = mapB.get(serviceA.name);
      if (serviceB && serviceA.status !== serviceB.status) {
        changes.push({
          type: 'infrastructure',
          category: 'services',
          path: `services.${serviceA.name}.status`,
          before: serviceA.status,
          after: serviceB.status,
          severity: 'critical',
          impact: 'breaking',
        });
      }
    });

    return changes;
  }

  /**
   * Calculate summary of changes
   */
  private calculateSummary(changes: Change[]): DiffResult['summary'] {
    return {
      totalChanges: changes.length,
      criticalChanges: changes.filter(c => c.severity === 'critical').length,
      breakingChanges: changes.filter(c => c.impact === 'breaking').length,
      compatibleChanges: changes.filter(c => c.impact === 'compatible').length,
    };
  }

  /**
   * Sanitize sensitive values
   */
  private sanitizeValue(value: any): any {
    if (value === null || value === undefined) {
      return value;
    }

    const strValue = String(value);
    const sensitiveKeys = ['password', 'secret', 'key', 'token', 'api', 'auth'];
    
    if (sensitiveKeys.some(key => strValue.toLowerCase().includes(key))) {
      return '*****';
    }

    return value;
  }

  /**
   * Determine environment variable severity
   */
  private determineEnvVarSeverity(key: string): Change['severity'] {
    const criticalKeys = ['app_env', 'node_env', 'rails_env', 'debug'];
    if (criticalKeys.some(k => key.toLowerCase().includes(k))) {
      return 'critical';
    }
    return 'minor';
  }

  /**
   * Determine package severity
   */
  private determinePackageSeverity(name: string, category: string): Change['severity'] {
    const criticalPackages = ['laravel/framework', 'symfony/http-kernel', 'express', 'react'];
    if (criticalPackages.includes(name.toLowerCase())) {
      return 'critical';
    }
    return 'major';
  }

  /**
   * Determine version change severity
   */
  private determineVersionChangeSeverity(before: string, after: string): Change['severity'] {
    const majorBefore = parseInt(before.split('.')[0]);
    const majorAfter = parseInt(after.split('.')[0]);

    if (majorBefore !== majorAfter) {
      return 'critical';
    }
    return 'major';
  }

  /**
   * Determine version impact
   */
  private determineVersionImpact(before: string, after: string): Change['impact'] {
    const majorBefore = parseInt(before.split('.')[0]);
    const majorAfter = parseInt(after.split('.')[0]);

    if (majorAfter > majorBefore) {
      return 'breaking';
    }
    return 'compatible';
  }

  /**
   * Normalize state for semantic comparison
   */
  normalizeState(manifest: StateManifest): NormalizedState {
    const framework = this.detectFramework(manifest);
    const dependencies = this.normalizeDependencies(manifest);
    const configuration = this.normalizeConfiguration(manifest);

    return {
      framework,
      dependencies,
      configuration,
    };
  }

  /**
   * Detect framework from manifest
   */
  private detectFramework(manifest: StateManifest): string {
    const deps = manifest.dependencies?.runtime?.packages || [];
    
    if (deps.some((d: any) => d.name.includes('laravel'))) {
      return 'laravel';
    }
    if (deps.some((d: any) => d.name.includes('symfony'))) {
      return 'symfony';
    }
    if (deps.some((d: any) => d.name.includes('wordpress'))) {
      return 'wordpress';
    }
    
    return 'generic';
  }

  /**
   * Normalize dependencies for semantic comparison
   */
  private normalizeDependencies(manifest: StateManifest): NormalizedState['dependencies'] {
    const packages = manifest.dependencies?.runtime?.packages || [];
    
    return {
      critical: packages
        .filter((p: any) => this.isCriticalPackage(p.name))
        .map((p: any) => p.name),
      optional: packages
        .filter((p: any) => !this.isCriticalPackage(p.name))
        .map((p: any) => p.name),
      dev: packages
        .filter((p: any) => p.type === 'dev')
        .map((p: any) => p.name),
    };
  }

  /**
   * Normalize configuration for semantic comparison
   */
  private normalizeConfiguration(manifest: StateManifest): Record<string, any> {
    const config = manifest.configuration || {};
    
    return {
      environment: config.application?.environment || 'unknown',
      debug: config.application?.debug || false,
      cache: config.application?.cache?.driver || 'unknown',
      queue: config.application?.queue?.driver || 'unknown',
    };
  }

  /**
   * Check if package is critical
   */
  private isCriticalPackage(name: string): boolean {
    const criticalPatterns = [
      /laravel\/framework/,
      /symfony\/http-kernel/,
      /express/,
      /react/,
      /vue/,
      /angular/,
    ];
    
    return criticalPatterns.some(pattern => pattern.test(name));
  }

  /**
   * Generate fingerprint for manifest
   */
  generateFingerprint(manifest: StateManifest): string {
    const normalized = this.normalizeState(manifest);
    const fingerprint = JSON.stringify(normalized);
    return crypto.createHash('sha256').update(fingerprint).digest('hex');
  }
}
