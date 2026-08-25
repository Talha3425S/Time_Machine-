package collector

import (
	"os"
	"strings"
)

var sensitivePatterns = []string{
	"password", "secret", "token", "key", "api_key", "private_key",
	"aws_secret", "google_key", "github_token", "database_url", "stripe_key",
	"paypal_secret", "jwt_secret", "oauth_secret",
}

// EnvState represents the environment variables state
type EnvState struct {
	Variables     map[string]string `json:"variables,omitempty"`
	SensitiveKeys []string          `json:"sensitive_keys,omitempty"`
	ConfigFiles   []ConfigFile      `json:"config_files,omitempty"`
	SystemEnv     *SystemEnv        `json:"system_env,omitempty"`
	UserEnv       *UserEnv          `json:"user_env,omitempty"`
	Path          *PathEnv          `json:"path,omitempty"`
	Shell         *ShellEnv         `json:"shell,omitempty"`
}

// ConfigFile represents a configuration file detected in the environment
type ConfigFile struct {
	Path     string `json:"path,omitempty"`
	Type     string `json:"type,omitempty"`
	Exists   bool   `json:"exists"`
	Size     int64  `json:"size,omitempty"`
	Modified string `json:"modified,omitempty"`
}

// SystemEnv represents system-level environment information
type SystemEnv struct {
	OS           string `json:"os,omitempty"`
	Architecture string `json:"architecture,omitempty"`
	Hostname     string `json:"hostname,omitempty"`
	Username     string `json:"username,omitempty"`
	HomeDir      string `json:"home_dir,omitempty"`
	TempDir      string `json:"temp_dir,omitempty"`
	WorkDir      string `json:"work_dir,omitempty"`
}

// UserEnv represents user-specific environment information
type UserEnv struct {
	Shell    string `json:"shell,omitempty"`
	Term     string `json:"term,omitempty"`
	Editor   string `json:"editor,omitempty"`
	Language string `json:"language,omitempty"`
	Timezone string `json:"timezone,omitempty"`
	Locale   string `json:"locale,omitempty"`
}

// PathEnv represents PATH environment variable information
type PathEnv struct {
	Entries    []string `json:"entries,omitempty"`
	Count      int      `json:"count,omitempty"`
	Duplicates []string `json:"duplicates,omitempty"`
}

// ShellEnv represents shell environment information
type ShellEnv struct {
	Type      string `json:"type,omitempty"`
	Version   string `json:"version,omitempty"`
	PID       int    `json:"pid,omitempty"`
	ParentPID int    `json:"parent_pid,omitempty"`
}

// EnvironmentCollector collects environment variable and configuration information
type EnvironmentCollector struct{}

// NewEnvironmentCollector creates a new environment collector
func NewEnvironmentCollector() *EnvironmentCollector {
	return &EnvironmentCollector{}
}

// Collect gathers the current environment state
func (e *EnvironmentCollector) Collect() *EnvState {
	state := &EnvState{
		Variables:     e.getEnvironmentVariables(),
		SensitiveKeys: e.detectSensitiveKeys(),
		ConfigFiles:   e.detectConfigFiles(),
		SystemEnv:     e.getSystemEnv(),
		UserEnv:       e.getUserEnv(),
		Path:          e.getPathEnv(),
		Shell:         e.getShellEnv(),
	}

	return state
}

// IsAvailable always returns true since environment is always available
func (e *EnvironmentCollector) IsAvailable() bool {
	return true
}

func (e *EnvironmentCollector) getEnvironmentVariables() map[string]string {
	env := make(map[string]string)

	// Collect all environment variables
	for _, envVar := range os.Environ() {
		parts := strings.SplitN(envVar, "=", 2)
		if len(parts) == 2 {
			key := parts[0]
			value := parts[1]
			if isSensitiveKey(key) {
				value = "[REDACTED]"
			}
			env[key] = value
		}
	}

	return env
}

func (e *EnvironmentCollector) detectSensitiveKeys() []string {
	sensitiveKeys := []string{}
	envVars := os.Environ()

	for _, envVar := range envVars {
		parts := strings.SplitN(envVar, "=", 2)
		if len(parts) == 2 {
			if isSensitiveKey(parts[0]) {
				sensitiveKeys = append(sensitiveKeys, parts[0])
			}
		}
	}

	return sensitiveKeys
}

func isSensitiveKey(key string) bool {
	lowerKey := strings.ToLower(key)
	for _, pattern := range sensitivePatterns {
		if strings.Contains(lowerKey, pattern) {
			return true
		}
	}
	return false
}

func (e *EnvironmentCollector) detectConfigFiles() []ConfigFile {
	configFiles := []ConfigFile{}

	// Common configuration files to detect
	configPatterns := []struct {
		path     string
		fileType string
	}{
		{".env", "dotenv"},
		{".env.local", "dotenv"},
		{".env.development", "dotenv"},
		{".env.production", "dotenv"},
		{"config/.env", "dotenv"},
		{".envrc", "direnv"},
		{".bashrc", "bash"},
		{".zshrc", "zsh"},
		{".profile", "shell"},
		{".bash_profile", "bash"},
		{".gitconfig", "git"},
		{".npmrc", "npm"},
		{".yarnrc", "yarn"},
		{"package.json", "node"},
		{"pom.xml", "maven"},
		{"build.gradle", "gradle"},
		{"requirements.txt", "python"},
		{"Gemfile", "ruby"},
		{"go.mod", "go"},
		{"Cargo.toml", "rust"},
		{"docker-compose.yml", "docker"},
		{"docker-compose.yaml", "docker"},
		{"Dockerfile", "docker"},
		{"php.ini", "php"},
		{"composer.json", "php"},
		{"my.cnf", "mysql"},
		{"postgresql.conf", "postgresql"},
	}

	// Check for config files in current directory
	for _, pattern := range configPatterns {
		filePath := pattern.path

		// Try current directory first
		fullPath := filePath
		if _, err := os.Stat(fullPath); err == nil {
			info, _ := os.Stat(fullPath)
			configFiles = append(configFiles, ConfigFile{
				Path:     fullPath,
				Type:     pattern.fileType,
				Exists:   true,
				Size:     info.Size(),
				Modified: info.ModTime().String(),
			})
		} else {
			configFiles = append(configFiles, ConfigFile{
				Path:   fullPath,
				Type:   pattern.fileType,
				Exists: false,
			})
		}
	}

	return configFiles
}

func (e *EnvironmentCollector) getSystemEnv() *SystemEnv {
	systemEnv := &SystemEnv{}

	// Try to get OS information
	if osName := os.Getenv("OS"); osName != "" {
		systemEnv.OS = osName
	} else if osName := os.Getenv("GOOS"); osName != "" {
		systemEnv.OS = osName
	}

	// Architecture
	if arch := os.Getenv("GOARCH"); arch != "" {
		systemEnv.Architecture = arch
	}

	// Hostname
	if hostname := os.Getenv("HOSTNAME"); hostname != "" {
		systemEnv.Hostname = hostname
	} else if hostname := os.Getenv("COMPUTERNAME"); hostname != "" {
		systemEnv.Hostname = hostname
	}

	// Username
	if username := os.Getenv("USER"); username != "" {
		systemEnv.Username = username
	} else if username := os.Getenv("USERNAME"); username != "" {
		systemEnv.Username = username
	}

	// Home directory
	if homeDir := os.Getenv("HOME"); homeDir != "" {
		systemEnv.HomeDir = homeDir
	} else if homeDir := os.Getenv("USERPROFILE"); homeDir != "" {
		systemEnv.HomeDir = homeDir
	}

	// Temp directory
	if tempDir := os.Getenv("TEMP"); tempDir != "" {
		systemEnv.TempDir = tempDir
	} else if tempDir := os.Getenv("TMP"); tempDir != "" {
		systemEnv.TempDir = tempDir
	} else if tempDir := os.Getenv("TMPDIR"); tempDir != "" {
		systemEnv.TempDir = tempDir
	}

	// Work directory
	if workDir, err := os.Getwd(); err == nil {
		systemEnv.WorkDir = workDir
	}

	return systemEnv
}

func (e *EnvironmentCollector) getUserEnv() *UserEnv {
	userEnv := &UserEnv{}

	if shell := os.Getenv("SHELL"); shell != "" {
		userEnv.Shell = shell
	}

	if term := os.Getenv("TERM"); term != "" {
		userEnv.Term = term
	}

	if editor := os.Getenv("EDITOR"); editor != "" {
		userEnv.Editor = editor
	} else if editor := os.Getenv("VISUAL"); editor != "" {
		userEnv.Editor = editor
	}

	if language := os.Getenv("LANG"); language != "" {
		userEnv.Language = language
	}

	if timezone := os.Getenv("TZ"); timezone != "" {
		userEnv.Timezone = timezone
	}

	if locale := os.Getenv("LC_ALL"); locale != "" {
		userEnv.Locale = locale
	} else if locale := os.Getenv("LC_CTYPE"); locale != "" {
		userEnv.Locale = locale
	}

	return userEnv
}

func (e *EnvironmentCollector) getPathEnv() *PathEnv {
	pathEnv := &PathEnv{}

	path := os.Getenv("PATH")
	if path == "" {
		return pathEnv
	}

	entries := strings.Split(path, string(os.PathListSeparator))
	pathEnv.Entries = entries
	pathEnv.Count = len(entries)

	// Find duplicates
	seen := make(map[string]bool)
	duplicates := []string{}
	for _, entry := range entries {
		if seen[entry] {
			duplicates = append(duplicates, entry)
		}
		seen[entry] = true
	}
	pathEnv.Duplicates = duplicates

	return pathEnv
}

func (e *EnvironmentCollector) getShellEnv() *ShellEnv {
	shellEnv := &ShellEnv{}

	// Try to determine shell type
	if shell := os.Getenv("SHELL"); shell != "" {
		if strings.Contains(shell, "bash") {
			shellEnv.Type = "bash"
		} else if strings.Contains(shell, "zsh") {
			shellEnv.Type = "zsh"
		} else if strings.Contains(shell, "fish") {
			shellEnv.Type = "fish"
		} else if strings.Contains(shell, "powershell") || strings.Contains(shell, "pwsh") {
			shellEnv.Type = "powershell"
		} else {
			shellEnv.Type = shell
		}
	}

	// Get current process PID
	shellEnv.PID = os.Getpid()

	// Try to get parent PID (platform-specific)
	// This is a simplified version - in production you'd use platform-specific code

	return shellEnv
}
