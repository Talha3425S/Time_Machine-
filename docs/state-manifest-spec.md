# State Manifest Format Specification

## Overview
The State Manifest is a structured representation of the software environment state at a specific point in time. It serves as the foundational data structure for causal debugging and environment comparison.

## Schema Version
Current version: `1.0.0`

## Core Structure

```json
{
  "manifest": {
    "version": "1.0.0",
    "id": "uuid",
    "projectId": "uuid",
    "timestamp": "ISO8601",
    "metadata": {
      "source": "agent",
      "agentVersion": "1.0.0",
      "hostname": "string",
      "platform": "string",
      "collectionDuration": "number"
    }
  },
  "environment": {
    "system": {
      "os": {
        "name": "string",
        "version": "string",
        "architecture": "string"
      },
      "runtime": {
        "name": "string",
        "version": "string",
        "extensions": ["string"]
      },
      "variables": {
        "key": "value"
      }
    },
    "dependencies": {
      "runtime": {
        "name": "string",
        "version": "string",
        "packages": [
          {
            "name": "string",
            "version": "string",
            "type": "pecl|composer|system",
            "source": "string"
          }
        ]
      },
      "system": {
        "name": "string",
        "version": "string",
        "packages": [
          {
            "name": "string",
            "version": "string"
          }
        ]
      }
    }
  },
  "codebase": {
    "git": {
      "repository": "string",
      "branch": "string",
      "commit": {
        "hash": "string",
        "message": "string",
        "author": "string",
        "timestamp": "ISO8601"
      },
      "status": {
        "modified": ["string"],
        "staged": ["string"],
        "untracked": ["string"]
      }
    },
    "configuration": {
      "files": [
        {
          "path": "string",
          "hash": "sha256",
          "content": "base64_encoded",
          "type": "config|env|ini"
        }
      ]
    }
  },
  "infrastructure": {
    "docker": {
      "daemon": {
        "version": "string",
        "apiVersion": "string"
      },
      "containers": [
        {
          "id": "string",
          "name": "string",
          "image": "string",
          "status": "string",
          "ports": ["string"],
          "volumes": ["string"]
        }
      ],
      "images": [
        {
          "id": "string",
          "repository": "string",
          "tag": "string",
          "size": "number"
        }
      ]
    },
    "services": [
      {
        "name": "string",
        "type": "database|cache|queue|search",
        "version": "string",
        "connection": "string",
        "status": "running|stopped|error"
      }
    ]
  },
  "runtime": {
    "application": {
      "framework": {
        "name": "string",
        "version": "string"
      },
      "configuration": {
        "environment": "string",
        "debug": "boolean",
        "cache": {
          "enabled": "boolean",
          "driver": "string"
        }
      }
    },
    "extensions": [
      {
        "name": "string",
        "version": "string",
        "enabled": "boolean",
        "configuration": {}
      }
    ]
  },
  "semantic": {
    "normalized": {
      "framework": "laravel|symfony|wordpress|custom",
      "dependencies": {
        "critical": ["string"],
        "optional": ["string"],
        "dev": ["string"]
      },
      "configuration": {
        "key": "value"
      }
    },
    "fingerprint": {
      "environment": "sha256",
      "dependencies": "sha256",
      "configuration": "sha256",
      "combined": "sha256"
    }
  }
}
```

## Field Descriptions

### Manifest
- `version`: Schema version identifier
- `id`: Unique identifier for this manifest
- `projectId`: Associated project UUID
- `timestamp`: ISO8601 timestamp of collection
- `metadata`: Collection metadata and provenance

### Environment
- `system`: Operating system and runtime information
- `dependencies`: Package dependencies (runtime and system)
- `variables`: Environment variables (sanitized)

### Codebase
- `git`: Git repository state and commit information
- `configuration`: Configuration file hashes and content

### Infrastructure
- `docker`: Docker daemon, containers, and images
- `services`: External services (databases, caches, etc.)

### Runtime
- `application`: Application framework and configuration
- `extensions`: Runtime extensions and their status

### Semantic
- `normalized`: Framework-specific normalized representation
- `fingerprint`: Hash-based fingerprints for comparison

## Semantic Normalization

### Laravel Adapter
```json
{
  "framework": "laravel",
  "version": "10.x",
  "dependencies": {
    "critical": ["laravel/framework", "illuminate/*"],
    "optional": ["league/*", "symfony/*"],
    "dev": ["phpunit/phpunit", "pestphp/pest"]
  },
  "configuration": {
    "app.env": "production",
    "app.debug": false,
    "cache.driver": "redis",
    "queue.driver": "redis"
  }
}
```

### Generic PHP Adapter
```json
{
  "framework": "generic",
  "version": "8.2",
  "dependencies": {
    "critical": ["composer/*"],
    "optional": ["vendor/*"],
    "dev": ["dev-*"]
  },
  "configuration": {
    "php.version": "8.2",
    "extensions": ["pdo", "redis", "json"]
  }
}
```

## Fingerprint Generation

### Environment Fingerprint
- Hash of normalized system information
- Includes OS, runtime, and critical packages

### Dependencies Fingerprint
- Hash of normalized dependency tree
- Includes package names, versions, and types

### Configuration Fingerprint
- Hash of normalized configuration values
- Excludes sensitive data (passwords, keys)

### Combined Fingerprint
- Hash of all three fingerprints combined
- Used for quick state comparison

## Semantic Diff Format

```json
{
  "diff": {
    "manifestA": "uuid",
    "manifestB": "uuid",
    "timestamp": "ISO8601",
    "changes": [
      {
        "type": "environment|dependency|configuration|infrastructure",
        "category": "string",
        "path": "string",
        "before": "any",
        "after": "any",
        "severity": "critical|major|minor|info",
        "impact": "breaking|compatible|unknown"
      }
    ],
    "summary": {
      "totalChanges": 0,
      "criticalChanges": 0,
      "breakingChanges": 0,
      "compatibleChanges": 0
    }
  }
}
```

## Change Severity Levels

- **critical**: Core framework or runtime changes
- **major**: Dependency version changes
- **minor**: Configuration changes
- **info**: Non-impacting changes

## Impact Classification

- **breaking**: Likely to cause application failure
- **compatible**: Backward compatible changes
- **unknown**: Cannot determine impact

## Collection Metadata

- `source`: Collection method (agent, manual, api)
- `agentVersion`: Agent software version
- `hostname`: System hostname
- `platform`: Operating system platform
- `collectionDuration`: Time taken to collect state (ms)

## Privacy and Security

- Sensitive values are redacted or hashed
- Configuration passwords are replaced with `*****`
- API keys are removed or masked
- User data is anonymized

## Validation Rules

1. All UUID fields must be valid UUID v4
2. Timestamps must be valid ISO8601 format
3. Version strings must follow semantic versioning
4. Hash values must be valid SHA256 hex strings
5. Required fields cannot be null or empty

## Extensibility

The schema supports custom fields through:
- Additional metadata in the `metadata` section
- Custom semantic adapters in the `semantic` section
- Extended infrastructure definitions
- Custom runtime configurations
