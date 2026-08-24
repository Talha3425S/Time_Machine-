# Software Time Machine - Startup Guide

## Quick Start (Recommended)

### Option 1: Automated Startup (Windows)
```batch
cd C:\Users\Dell\projects\software-time-machine
start.bat
```

### Option 2: Manual Startup

#### Step 1: Start Docker Infrastructure
```bash
cd C:\Users\Dell\projects\software-time-machine
docker-compose up -d
```
**Expected Output:**
```
[+] up 2/2
✔ Container software-time-machine-db    Running
✔ Container software-time-machine-redis Running
```

#### Step 2: Start API Server
```bash
cd apps\api
npm run start
```
**Expected Output:**
```
Nest application successfully started
```
**API URL:** http://localhost:3001

#### Step 3: Start Web Dashboard
```bash
cd apps\web
npm run dev
```
**Expected Output:**
```
ready - started server on 0.0.0.0:3002
```
**Web URL:** http://localhost:3002

## Verification

### Check Docker Status
```bash
docker ps
```
**Expected:** Both postgres and redis containers should be running

### Check API Server
```bash
curl http://localhost:3001
```
**Expected:** "Hello World!"

### Check Web Dashboard
Open browser to http://localhost:3002
**Expected:** Login page with GitHub OAuth button

### Check Redis Connection
```bash
docker exec software-time-machine-redis redis-cli ping
```
**Expected:** PONG

## Test the Agent

### Initialize Agent
```bash
cd agent
.\stm-agent.exe init
```

### Check Agent Status
```bash
.\stm-agent.exe status
```

### Collect Environment State
```bash
.\stm-agent.exe collect -v
```

## Configuration Files

### API Configuration
- **File:** `apps/api/.env`
- **Database:** PostgreSQL on port 5433
- **Redis:** Redis on port 16379
- **GitHub OAuth:** Configured (rotate the secret)

### Web Configuration
- **File:** `apps/web/.env.local`
- **Port:** 3002
- **API URL:** http://localhost:3001

### Docker Configuration
- **File:** `docker-compose.yml`
- **PostgreSQL:** Port 5433 (host) → 5432 (container)
- **Redis:** Port 16379 (host) → 6379 (container)

## Common Issues

### Port Conflicts
If you see "EADDRINUSE" errors:
```bash
# Kill processes on port 3001 (API)
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Kill processes on port 3002 (Web)
netstat -ano | findstr :3002
taskkill /PID <PID> /F
```

### Docker Issues
```bash
# Restart Docker containers
docker-compose restart

# Recreate containers (loses data)
docker-compose down
docker-compose up -d
```

### Redis Connection Issues
```bash
# Restart Redis container
docker restart software-time-machine-redis

# Test Redis connection
docker exec software-time-machine-redis redis-cli ping
```

## Current Status

✅ **Docker Infrastructure:** PostgreSQL and Redis running  
✅ **API Server:** Running on http://localhost:3001  
✅ **Web Dashboard:** Should run on http://localhost:3002  
✅ **Local Agent:** Built and functional  
✅ **Database Tables:** All tables including agent_states created  
✅ **Redis:** Connected and operational  

## Next Steps

1. **Access the dashboard** at http://localhost:3002
2. **Login with GitHub** to test authentication
3. **Create organizations and projects** 
4. **Test the agent** by running the CLI commands
5. **Upload agent state** to test the complete integration

## Development Notes

- **API Watch Mode:** Use `npm run start --watch` in API directory for auto-reload
- **Web Watch Mode:** Use `npm run dev` in Web directory for hot-reload
- **Agent Rebuild:** Run `go build -o stm-agent.exe main.go` in agent directory after code changes
- **Database Schema:** TypeORM auto-syncs in development mode
- **GitHub OAuth:** Callback URL is configured to http://localhost:3002/auth/callback
- **Redis Port:** Changed from 6380 to 16379 due to Windows port conflicts
