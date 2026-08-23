# Software Time Machine

A developer-focused causal debugging SaaS that uses Environment Bisect to detect meaningful changes, generate competing hypotheses, select cost-effective experiments, and produce evidence-backed conclusions.

## Week 1 Status: ✅ Foundation Complete

**Completed Tasks:**
- ✅ Monorepo structure setup (apps/, packages/, agent/, infra/, research/)
- ✅ Next.js dashboard scaffold initialized
- ✅ NestJS API scaffold initialized  
- ✅ PostgreSQL database schema and migrations
- ✅ Redis caching configuration
- ✅ Docker Compose for local development
- ✅ CI/CD pipeline foundation (GitHub Actions)
- ✅ Simplified dependency management for easier setup
- ✅ All services tested and running locally

## Week 2 Status: ✅ Authentication & Project Management Complete

**Completed Tasks:**
- ✅ GitHub OAuth authentication system
- ✅ JWT token-based authentication
- ✅ User entity with GitHub integration
- ✅ Organization & project management API
- ✅ GitHub repository connection with Octokit
- ✅ Authentication UI (GitHub login, callback, profile)
- ✅ Organization dashboard UI
- ✅ Project management UI with GitHub validation
- ✅ Project settings screens
- ✅ Organization detail and settings pages
- ✅ Responsive dashboard layout with navigation

**Current Services:**
- 🌐 Web Dashboard: http://localhost:3002
- 🔧 API Server: http://localhost:3001
- 🗄️ PostgreSQL: localhost:5433
- ⚡ Redis: localhost:6380

**Available Pages:**
- `/login` - GitHub OAuth login
- `/dashboard` - Main dashboard with stats
- `/dashboard/organizations` - Organization list
- `/dashboard/organizations/new` - Create organization
- `/dashboard/organizations/[id]` - Organization details
- `/dashboard/organizations/[id]/settings` - Organization settings
- `/dashboard/projects` - Project list
- `/dashboard/projects/new` - Create project with GitHub validation
- `/dashboard/projects/[id]` - Project details
- `/dashboard/projects/[id]/settings` - Project settings

**Remaining Week 2 Tasks:**
- User roles and permissions UI (lower priority)
- Team member management (lower priority)

## Architecture

```
software-time-machine/
├── apps/
│   ├── web/                 # Next.js SaaS dashboard ✅
│   └── api/                 # NestJS API ✅
├── packages/
│   ├── shared-types/        # Shared TypeScript types ✅
│   ├── state-schema/        # State manifest schemas ✅
│   ├── planner-core/        # Hypothesis planning algorithms ✅
│   └── ui/                  # Shared UI components ✅
├── agent/                   # Go local agent
│   ├── collector/           # Environment state collectors
│   ├── adapters/            # Semantic normalizers
│   ├── sandbox/             # Isolation adapters
│   └── oracle/              # Test execution framework
├── infra/
│   ├── docker/              # Docker configurations ✅
│   ├── terraform/           # Infrastructure as code
│   └── github-actions/      # CI/CD pipelines ✅
└── research/
    ├── benchmark-cases/     # Test scenarios
    ├── experiment-results/  # Benchmark data
    └── evaluation/          # Analysis scripts
```

## Getting Started

### Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0
- Go 1.21+ (for agent)
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### Installation

```bash
# Install all dependencies
npm run install:all

# Copy environment variables
cp .env.example .env

# Start infrastructure services
docker-compose up -d

# Start individual services
npm run dev:web  # Web dashboard on http://localhost:3000
npm run dev:api  # API on http://localhost:3001
```

### Development

#### Web Dashboard (Next.js)
```bash
cd apps/web
npm install
npm run dev
```

#### API (NestJS)
```bash
cd apps/api
npm install
npx @nestjs/cli start --watch
```

#### Infrastructure Only
```bash
docker-compose up -d  # Start PostgreSQL and Redis
```

### Quick Start Commands

```bash
# Start everything (requires separate terminals)
docker-compose up -d                    # Start PostgreSQL (port 5433) and Redis (port 6380)
cd apps/web && npm run dev             # Start Web Dashboard on http://localhost:3000
cd apps/api && npx @nestjs/cli start --watch  # Start API on http://localhost:3001
```

### Testing

```bash
# Run all tests
npm run test

# Run specific package tests
cd packages/planner-core && npm test

# Run CI pipeline locally
npm run lint && npm run build
```

## Core Concepts

- **Environment Bisect**: Causal experimentation engine that detects changes and tests hypotheses
- **State Manifest**: Structured representation of environment state (runtime, dependencies, config, etc.)
- **Hypothesis Planning**: Cost-effective experiment selection based on expected information gain
- **Evidence Provenance**: Complete audit trail of state, intervention, and results

## Week 2 Preview: Authentication & Project Management

Next week will focus on:
- GitHub OAuth integration
- Organization/project management
- Repository connection workflow
- User roles and permissions

## License

Proprietary - All rights reserved
