import { Injectable } from '@nestjs/common';
import { StateManifest } from '../entities/state-manifest.entity';

export interface LaravelNormalizedState {
  framework: 'laravel';
  version: string;
  dependencies: {
    critical: string[];
    optional: string[];
    dev: string[];
  };
  configuration: {
    'app.env': string;
    'app.debug': boolean;
    'cache.driver': string;
    'queue.driver': string;
    'session.driver': string;
    'database.default': string;
  };
}

@Injectable()
export class LaravelAdapterService {
  /**
   * Normalize Laravel state for semantic comparison
   */
  normalizeLaravelState(manifest: StateManifest): LaravelNormalizedState {
    const version = this.extractLaravelVersion(manifest);
    const dependencies = this.normalizeLaravelDependencies(manifest);
    const configuration = this.normalizeLaravelConfiguration(manifest);

    return {
      framework: 'laravel',
      version,
      dependencies,
      configuration,
    };
  }

  /**
   * Extract Laravel version from dependencies
   */
  private extractLaravelVersion(manifest: StateManifest): string {
    const packages = manifest.dependencies?.runtime?.packages || [];
    const laravelPackage = packages.find((p: any) => 
      p.name === 'laravel/framework' || p.name.includes('laravel')
    );

    return laravelPackage?.version || 'unknown';
  }

  /**
   * Normalize Laravel dependencies
   */
  private normalizeLaravelDependencies(manifest: StateManifest): LaravelNormalizedState['dependencies'] {
    const packages = manifest.dependencies?.runtime?.packages || [];
    
    // Laravel critical packages
    const criticalPackages = [
      'laravel/framework',
      'illuminate/database',
      'illuminate/routing',
      'illuminate/http',
      'illuminate/console',
    ];

    // Laravel ecosystem packages
    const ecosystemPackages = [
      'laravel/sanctum',
      'laravel/passport',
      'laravel/horizon',
      'laravel/telescope',
      'laravel/vapor',
    ];

    return {
      critical: packages
        .filter((p: any) => criticalPackages.includes(p.name) || p.name.startsWith('illuminate/'))
        .map((p: any) => p.name),
      optional: packages
        .filter((p: any) => 
          ecosystemPackages.some(ep => p.name.includes(ep)) ||
          p.name.startsWith('laravel/')
        )
        .map((p: any) => p.name),
      dev: packages
        .filter((p: any) => p.type === 'dev' || p.name.includes('phpunit'))
        .map((p: any) => p.name),
    };
  }

  /**
   * Normalize Laravel configuration
   */
  private normalizeLaravelConfiguration(manifest: StateManifest): LaravelNormalizedState['configuration'] {
    const envVars = manifest.environment?.variables || {};
    const config = manifest.configuration || {};

    return {
      'app.env': envVars['APP_ENV'] || config.application?.environment || 'local',
      'app.debug': this.parseBoolean(envVars['APP_DEBUG'] || config.application?.debug),
      'cache.driver': envVars['CACHE_DRIVER'] || config.application?.cache?.driver || 'file',
      'queue.driver': envVars['QUEUE_CONNECTION'] || config.application?.queue?.driver || 'sync',
      'session.driver': envVars['SESSION_DRIVER'] || 'file',
      'database.default': envVars['DB_CONNECTION'] || 'mysql',
    };
  }

  /**
   * Parse boolean values from various formats
   */
  private parseBoolean(value: any): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true' || value === '1';
    }
    return false;
  }

  /**
   * Detect if manifest is from Laravel application
   */
  isLaravelApplication(manifest: StateManifest): boolean {
    const packages = manifest.dependencies?.runtime?.packages || [];
    const configFiles = manifest.configuration || [];

    // Check for Laravel packages
    const hasLaravelPackages = packages.some((p: any) => 
      p.name === 'laravel/framework' || p.name.startsWith('illuminate/')
    );

    // Check for Laravel configuration files
    const hasLaravelConfig = configFiles.some((c: any) => 
      c.path.includes('.env') || 
      c.path.includes('config/') ||
      c.path.includes('artisan')
    );

    // Check for Laravel environment variables
    const envVars = manifest.environment?.variables || {};
    const hasLaravelEnv = envVars['APP_NAME'] || envVars['APP_KEY'] || envVars['APP_ENV'];

    return hasLaravelPackages || hasLaravelConfig || hasLaravelEnv;
  }

  /**
   * Get Laravel-specific fingerprint
   */
  getLaravelFingerprint(manifest: StateManifest): string {
    const normalized = this.normalizeLaravelState(manifest);
    const criticalData = {
      version: normalized.version,
      critical: normalized.dependencies.critical.sort(),
      configuration: normalized.configuration,
    };
    
    return JSON.stringify(criticalData);
  }

  /**
   * Compare Laravel versions for compatibility
   */
  compareLaravelVersions(versionA: string, versionB: string): 'compatible' | 'breaking' | 'unknown' {
    const majorA = parseInt(versionA.split('.')[0]);
    const majorB = parseInt(versionB.split('.')[0]);

    if (majorA === majorB) {
      return 'compatible';
    }

    // Laravel follows semantic versioning with major version changes being breaking
    if (Math.abs(majorA - majorB) === 1) {
      return 'breaking';
    }

    return 'unknown';
  }

  /**
   * Get Laravel-specific change recommendations
   */
  getLaravelChangeRecommendations(changes: any[]): string[] {
    const recommendations: string[] = [];

    changes.forEach(change => {
      if (change.category === 'environment' && change.path.includes('APP_ENV')) {
        recommendations.push('Review environment-specific configuration changes');
      }

      if (change.category === 'environment' && change.path.includes('APP_DEBUG')) {
        recommendations.push('Debug mode change may affect performance and security');
      }

      if (change.category === 'dependency' && change.path.includes('laravel/framework')) {
        recommendations.push('Laravel framework version change - review upgrade guide');
      }

      if (change.category === 'configuration' && change.path.includes('cache')) {
        recommendations.push('Cache driver change may require cache invalidation');
      }

      if (change.category === 'configuration' && change.path.includes('database')) {
        recommendations.push('Database configuration change may require migration');
      }
    });

    return recommendations;
  }
}
