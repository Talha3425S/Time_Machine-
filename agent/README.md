# Software Time Machine Local Agent

A Go-based local agent for collecting environment state information for the Software Time Machine causal debugging platform.

## Features

- **Git Collector**: Collects repository state, commit information, branch details, and file status
- **PHP Collector**: Detects PHP runtime version, extensions, configuration, Xdebug, and OPcache status
- **Composer Collector**: Gathers Composer package manager state, dependencies, and project configuration
- **Docker Collector**: Monitors Docker containers, images, volumes, networks, and system information
- **Environment Collector**: Detects environment variables, configuration files, and system information
- **Secure Cloud Client**: HTTPS-based communication with the Software Time Machine cloud API

## Installation

### Prerequisites

- Go 1.21 or higher
- Git (for Git collector)
- PHP (for PHP collector - optional)
- Composer (for Composer collector - optional)
- Docker (for Docker collector - optional)

### Building the Agent

```bash
cd agent
go mod tidy
go build -o stm-agent main.go
```

## Usage

### Initialize the Agent

```bash
./stm-agent init
```

This creates a `.stm` directory with configuration files.

### Collect Environment State

```bash
./stm-agent collect
```

Collect state from all available collectors and output as JSON.

```bash
./stm-agent collect --output state.json
```

Save collected state to a file.

### Check Agent Status

```bash
./stm-agent status
```

Check if the agent is properly initialized and all collectors are available.

### Verbose Mode

```bash
./stm-agent -v collect
```

Enable verbose output for debugging.

## Configuration

The agent configuration is stored in `.stm/config.json`:

```json
{
  "project_id": "",
  "api_endpoint": "http://localhost:3001",
  "collectors": {
    "git": true,
    "php": true,
    "composer": true,
    "docker": true,
    "environment": true
  },
  "upload_frequency": "5m",
  "filters": {
    "exclude_paths": [
      "vendor/",
      "node_modules/",
      ".git/"
    ],
    "exclude_env_vars": [
      "password",
      "secret",
      "token"
    ]
  }
}
```

## Collectors

### Git Collector

Collects:
- Current branch and commit
- Commit message and author
- Modified, untracked, and staged files
- Remote URL and branch
- All branches and remotes
- Repository status (clean/dirty)

### PHP Collector

Collects:
- PHP version and SAPI
- Loaded extensions
- Configuration values
- INI file locations
- Xdebug status and configuration
- OPcache status and statistics

### Composer Collector

Collects:
- Composer version
- Project dependencies (composer.json)
- Lock file information (composer.lock)
- Installed packages
- Outdated packages
- Autoload configuration
- Custom scripts

### Docker Collector

Collects:
- Docker version and daemon status
- Running and stopped containers
- Available images
- Volumes and networks
- Docker Compose services
- System information
- Registry configuration

### Environment Collector

Collects:
- All environment variables
- Sensitive key detection
- Configuration file detection
- System information (OS, hostname, etc.)
- User environment (shell, editor, etc.)
- PATH environment variable analysis
- Shell environment information

## Cloud Communication

The agent includes a secure HTTPS client for communicating with the Software Time Machine cloud API:

- State upload with authentication
- Configuration synchronization
- Heartbeat signals
- Error reporting

## Security

- HTTPS communication with SSL certificate verification
- API key authentication
- Sensitive data detection and filtering
- Secure token storage in `.stm` directory (gitignored)

## Development

### Project Structure

```
agent/
├── main.go              # Entry point
├── cmd/                 # CLI commands
│   ├── root.go         # Root command
│   ├── collect.go      # Collect command
│   ├── init.go         # Init command
│   └── status.go       # Status command
├── collector/          # Environment collectors
│   ├── collector.go    # Base collector interface
│   ├── git.go         # Git collector
│   ├── php.go         # PHP collector
│   ├── composer.go    # Composer collector
│   ├── docker.go      # Docker collector
│   └── environment.go # Environment collector
├── client/             # Cloud API client
│   └── client.go      # HTTP client for cloud communication
└── go.mod             # Go module definition
```

### Adding New Collectors

1. Create a new file in `collector/` directory
2. Implement the `Collector` interface:
   ```go
   type YourCollector struct {}
   
   func (c *YourCollector) Collect() interface{} {
       // Collection logic
   }
   
   func (c *YourCollector) IsAvailable() bool {
       // Availability check
   }
   ```
3. Add the collector to the main collection logic in `cmd/collect.go`
4. Add status check in `cmd/status.go`

## Testing

Run the agent in a test environment:

```bash
./stm-agent status
./stm-agent collect -v
```

Verify that collectors detect the expected environment state.

## License

MIT License - See LICENSE file for details
