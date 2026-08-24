# Testing Guide for Software Time Machine Agent

## Prerequisites for Testing

1. **Go Installation**: Install Go 1.21 or higher from https://golang.org/dl/
2. **Git**: Ensure Git is installed and available in PATH
3. **PHP** (optional): For testing PHP collector
4. **Composer** (optional): For testing Composer collector
5. **Docker** (optional): For testing Docker collector

## Building the Agent

```bash
cd agent
go mod tidy
go build -o stm-agent main.go
```

## Test Scenarios

### 1. Basic Agent Initialization

```bash
# Test initialization
./stm-agent init

# Verify .stm directory was created
ls -la .stm/

# Check configuration file
cat .stm/config.json
```

**Expected Results:**
- `.stm` directory created
- `config.json` file created with default configuration
- `.gitignore` file created in `.stm` directory

### 2. Agent Status Check

```bash
# Check agent status
./stm-agent status

# Verbose status check
./stm-agent -v status
```

**Expected Results:**
- Agent initialization status
- Configuration validation
- Collector availability status
- Basic environment detection

### 3. Git Collector Testing

```bash
# Test in a Git repository
cd /path/to/git/repo
./stm-agent collect

# Test outside Git repository
cd /tmp
./stm-agent collect
```

**Expected Results:**
- In Git repo: Should detect branch, commit, file status
- Outside Git repo: Should report "is_repository": false

### 4. PHP Collector Testing

```bash
# Test with PHP installed
php --version
./stm-agent collect

# Verify PHP information in output
./stm-agent collect | grep php
```

**Expected Results:**
- PHP version detected
- Extensions listed
- Configuration values collected
- Xdebug status (if installed)
- OPcache status (if enabled)

### 5. Composer Collector Testing

```bash
# Test in a Composer project
cd /path/to/composer/project
./stm-agent collect

# Verify Composer information
./stm-agent collect | grep composer
```

**Expected Results:**
- Composer version detected
- composer.json parsed
- composer.lock parsed (if exists)
- Installed packages listed
- Autoload configuration collected

### 6. Docker Collector Testing

```bash
# Test with Docker running
docker --version
docker ps
./stm-agent collect

# Test with Docker not running
docker stop $(docker ps -q)
./stm-agent collect
```

**Expected Results:**
- Docker version detected
- Container information collected
- Image information collected
- Volume/network information collected
- Docker Compose services detected (if applicable)

### 7. Environment Collector Testing

```bash
# Test environment collection
./stm-agent collect

# Set a test environment variable
export TEST_VAR="test_value"
./stm-agent collect

# Verify sensitive key detection
export TEST_PASSWORD="secret123"
./stm-agent collect
```

**Expected Results:**
- Environment variables collected
- Sensitive keys detected
- Configuration files detected
- System information collected
- PATH analysis performed

### 8. Complete Collection Test

```bash
# Full collection with verbose output
./stm-agent -v collect

# Save to file
./stm-agent collect --output test-state.json

# Verify JSON output
cat test-state.json | jq .
```

**Expected Results:**
- All collectors run successfully
- Valid JSON output
- All expected fields present
- No errors or warnings

### 9. Cloud Client Testing

```bash
# Test with local API
./stm-agent upload --api-key test-key --project-id test-project --endpoint http://localhost:3001

# Test with configuration file
# Edit .stm/config.json to add api_key and project_id
./stm-agent upload
```

**Expected Results:**
- State collected and uploaded
- API authentication working
- Error handling for network issues
- Proper error messages for invalid configuration

### 10. Integration Testing

```bash
# Initialize in a real project
cd /path/to/your/project
./stm-agent init

# Configure the agent
# Edit .stm/config.json with your project details

# Test collection
./stm-agent status
./stm-agent collect -v

# Test upload (if API is available)
./stm-agent upload
```

## Automated Testing

Create a test script:

```bash
#!/bin/bash
# test-agent.sh

echo "Building agent..."
cd agent
go build -o stm-agent main.go

echo "Testing initialization..."
./stm-agent init

echo "Testing status..."
./stm-agent status

echo "Testing collection..."
./stm-agent collect -v

echo "Testing file output..."
./stm-agent collect --output test-state.json

echo "Verifying JSON output..."
if command -v jq &> /dev/null; then
    jq . test-state.json > /dev/null
    if [ $? -eq 0 ]; then
        echo "✅ JSON output is valid"
    else
        echo "❌ JSON output is invalid"
    fi
else
    echo "⚠️  jq not available, skipping JSON validation"
fi

echo "Cleanup..."
rm -f stm-agent test-state.json
rm -rf .stm

echo "Test completed"
```

Run the test script:

```bash
chmod +x test-agent.sh
./test-agent.sh
```

## Performance Testing

```bash
# Measure collection time
time ./stm-agent collect

# Test with large projects
cd /path/to/large/project
time ./stm-agent collect

# Test with many environment variables
for i in {1..1000}; do export TEST_VAR_$i="value_$i"; done
time ./stm-agent collect
```

## Error Handling Testing

```bash
# Test with invalid configuration
echo "invalid json" > .stm/config.json
./stm-agent status

# Test with missing configuration
rm .stm/config.json
./stm-agent upload

# Test with invalid API endpoint
./stm-agent upload --endpoint http://invalid-endpoint:9999

# Test network failure
./stm-agent upload --endpoint http://localhost:9999
```

## Security Testing

```bash
# Test sensitive data filtering
export SECRET_PASSWORD="my_secret"
export API_KEY="12345"
./stm-agent collect | grep -i secret

# Verify sensitive keys are detected
./stm-agent collect | jq '.env.sensitive_keys'

# Test configuration file permissions
ls -la .stm/config.json
```

## Expected Test Results Summary

- ✅ Agent initializes correctly
- ✅ All collectors detect when their tools are available
- ✅ Collectors handle missing tools gracefully
- ✅ JSON output is valid and complete
- ✅ Cloud client handles network errors
- ✅ Sensitive data is detected and can be filtered
- ✅ Configuration files are created and parsed correctly
- ✅ CLI commands provide helpful error messages
- ✅ Verbose mode provides useful debugging information

## Known Limitations

1. **Go Required**: Agent requires Go to be installed and built
2. **Tool Dependencies**: Collectors only work if their respective tools are installed
3. **Platform Specific**: Some collectors may have platform-specific behavior
4. **Network Required**: Cloud client requires network connectivity

## Troubleshooting

### Build Issues

```bash
# If go build fails
go mod tidy
go build -v main.go

# Check Go version
go version
```

### Collector Issues

```bash
# If collectors don't detect tools
which git
which php
which composer
which docker

# Add tools to PATH if needed
export PATH=$PATH:/path/to/tool
```

### Permission Issues

```bash
# If agent can't write files
chmod +x stm-agent
chmod 755 .stm
```

## Continuous Integration

Add to CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Test Agent
  run: |
    cd agent
    go build -o stm-agent main.go
    ./stm-agent init
    ./stm-agent status
    ./stm-agent collect --output test-state.json
    cat test-state.json | jq .
```

## Next Steps

After successful testing:

1. Package the agent for distribution
2. Create installation scripts
3. Add integration tests
4. Performance optimization
5. Add monitoring and logging
6. Create user documentation
7. Set up automated testing in CI/CD
