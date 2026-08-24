package collector

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
)

// ComposerState represents the Composer package manager state
type ComposerState struct {
	Available      bool              `json:"available"`
	Version        string            `json:"version,omitempty"`
	LockFileExists bool              `json:"lock_file_exists"`
	ComposerJSON   *ComposerJSON     `json:"composer_json,omitempty"`
	ComposerLock   *ComposerLock     `json:"composer_lock,omitempty"`
	Installed      map[string]string `json:"installed,omitempty"`
	Outdated       map[string]string `json:"outdated,omitempty"`
	PHPVersions    []string          `json:"php_versions,omitempty"`
	Globals        map[string]string `json:"globals,omitempty"`
	Autoload       *AutoloadConfig   `json:"autoload,omitempty"`
	Scripts        map[string]string `json:"scripts,omitempty"`
	Config         map[string]string `json:"config,omitempty"`
	Repository     string            `json:"repository,omitempty"`
}

// ComposerJSON represents composer.json structure
type ComposerJSON struct {
	Name        string            `json:"name,omitempty"`
	Description string            `json:"description,omitempty"`
	Type        string            `json:"type,omitempty"`
	License     string            `json:"license,omitempty"`
	Require     map[string]string `json:"require,omitempty"`
	RequireDev  map[string]string `json:"require-dev,omitempty"`
	Autoload    *AutoloadConfig   `json:"autoload,omitempty"`
	Scripts     map[string]string `json:"scripts,omitempty"`
	Config      map[string]string `json:"config,omitempty"`
	Repositories []Repository    `json:"repositories,omitempty"`
}

// ComposerLock represents composer.lock structure
type ComposerLock struct {
	Packages      []PackageInfo `json:"packages,omitempty"`
	PackagesDev   []PackageInfo `json:"packages-dev,omitempty"`
	Platform      map[string]string `json:"platform,omitempty"`
	PlatformDev   map[string]string `json:"platform-dev,omitempty"`
	Aliases       []AliasInfo   `json:"aliases,omitempty"`
	MinimumStability string      `json:"minimum-stability,omitempty"`
	PHP           string        `json:"php,omitempty"`
}

// PackageInfo represents a package in composer.lock
type PackageInfo struct {
	Name     string   `json:"name,omitempty"`
	Version  string   `json:"version,omitempty"`
	Type     string   `json:"type,omitempty"`
	Require  map[string]string `json:"require,omitempty"`
	Authors  []Author `json:"authors,omitempty"`
	Source   *Source  `json:"source,omitempty"`
	Dist     *Dist    `json:"dist,omitempty"`
}

// Author represents package author
type Author struct {
	Name  string `json:"name,omitempty"`
	Email string `json:"email,omitempty"`
}

// Source represents package source information
type Source struct {
	Type string `json:"type,omitempty"`
	URL  string `json:"url,omitempty"`
	Ref  string `json:"ref,omitempty"`
}

// Dist represents package distribution information
type Dist struct {
	Type string `json:"type,omitempty"`
	URL  string `json:"url,omitempty"`
	Ref  string `json:"ref,omitempty"`
	SHA1 string `json:"shasum,omitempty"`
}

// AutoloadConfig represents autoload configuration
type AutoloadConfig struct {
	PSR4    map[string]string `json:"psr-4,omitempty"`
	PSR0    map[string]string `json:"psr-0,omitempty"`
	Classmap []string         `json:"classmap,omitempty"`
	Files   []string         `json:"files,omitempty"`
}

// Repository represents composer repository
type Repository struct {
	Type string `json:"type,omitempty"`
	URL  string `json:"url,omitempty"`
}

// ComposerCollector collects Composer package manager information
type ComposerCollector struct {
	projectPath string
}

// NewComposerCollector creates a new Composer collector
func NewComposerCollector() *ComposerCollector {
	projectPath, _ := findComposerProject()
	return &ComposerCollector{
		projectPath: projectPath,
	}
}

// Collect gathers the current Composer state
func (c *ComposerCollector) Collect() *ComposerState {
	state := &ComposerState{
		Available: c.IsAvailable(),
	}

	if !state.Available {
		return state
	}

	state.Version = c.getComposerVersion()
	state.LockFileExists = c.lockFileExists()
	state.ComposerJSON = c.getComposerJSON()
	state.ComposerLock = c.getComposerLock()
	state.Installed = c.getInstalledPackages()
	state.Outdated = c.getOutdatedPackages()
	state.PHPVersions = c.getPHPVersions()
	state.Globals = c.getGlobalPackages()
	state.Config = c.getComposerConfig()
	state.Repository = c.getRepositoryURL()

	if state.ComposerJSON != nil {
		state.Autoload = state.ComposerJSON.Autoload
		state.Scripts = state.ComposerJSON.Scripts
	}

	return state
}

// IsAvailable checks if Composer is available in the environment
func (c *ComposerCollector) IsAvailable() bool {
	_, err := exec.LookPath("composer")
	return err == nil
}

func findComposerProject() (string, error) {
	dir, err := os.Getwd()
	if err != nil {
		return "", err
	}

	for {
		composerJSON := filepath.Join(dir, "composer.json")
		if _, err := os.Stat(composerJSON); err == nil {
			return dir, nil
		}

		parent := filepath.Dir(dir)
		if parent == dir {
			return "", fmt.Errorf("not a composer project")
		}
		dir = parent
	}
}

func (c *ComposerCollector) runComposerCommand(args ...string) (string, error) {
	cmd := exec.Command("composer", args...)
	cmd.Dir = c.projectPath
	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("composer %s failed: %w", strings.Join(args, " "), err)
	}
	return strings.TrimSpace(string(output)), nil
}

func (c *ComposerCollector) getComposerVersion() string {
	version, err := c.runComposerCommand("--version")
	if err != nil {
		return ""
	}
	// Extract version number (e.g., "Composer version 2.5.1" -> "2.5.1")
	parts := strings.Fields(version)
	if len(parts) >= 3 {
		return parts[2]
	}
	return version
}

func (c *ComposerCollector) lockFileExists() bool {
	if c.projectPath == "" {
		return false
	}
	lockFile := filepath.Join(c.projectPath, "composer.lock")
	_, err := os.Stat(lockFile)
	return err == nil
}

func (c *ComposerCollector) getComposerJSON() *ComposerJSON {
	if c.projectPath == "" {
		return nil
	}

	composerJSON := filepath.Join(c.projectPath, "composer.json")
	data, err := os.ReadFile(composerJSON)
	if err != nil {
		return nil
	}

	var json ComposerJSON
	if err := json.Unmarshal(data, &json); err != nil {
		return nil
	}

	return &json
}

func (c *ComposerCollector) getComposerLock() *ComposerLock {
	if c.projectPath == "" {
		return nil
	}

	composerLock := filepath.Join(c.projectPath, "composer.lock")
	data, err := os.ReadFile(composerLock)
	if err != nil {
		return nil
	}

	var lock ComposerLock
	if err := json.Unmarshal(data, &lock); err != nil {
		return nil
	}

	return &lock
}

func (c *ComposerCollector) getInstalledPackages() map[string]string {
	if c.projectPath == "" {
		return nil
	}

	output, err := c.runComposerCommand("show", "--direct")
	if err != nil {
		return nil
	}

	packages := make(map[string]string)
	lines := strings.Split(output, "\n")
	for _, line := range lines {
		if strings.Contains(line, ":") {
			parts := strings.SplitN(line, ":", 2)
			if len(parts) == 2 {
				name := strings.TrimSpace(parts[0])
				version := strings.TrimSpace(parts[1])
				packages[name] = version
			}
		}
	}

	return packages
}

func (c *ComposerCollector) getOutdatedPackages() map[string]string {
	if c.projectPath == "" {
		return nil
	}

	output, err := c.runComposerCommand("outdated", "--direct")
	if err != nil {
		// No outdated packages or command failed
		return nil
	}

	packages := make(map[string]string)
	lines := strings.Split(output, "\n")
	for _, line := range lines {
		if strings.Contains(line, ":") {
			parts := strings.SplitN(line, ":", 2)
			if len(parts) == 2 {
				name := strings.TrimSpace(parts[0])
				version := strings.TrimSpace(parts[1])
				packages[name] = version
			}
		}
	}

	return packages
}

func (c *ComposerCollector) getPHPVersions() []string {
	output, err := c.runComposerCommand("about")
	if err != nil {
		return []string{}
	}

	// Parse PHP versions from composer about output
	versions := []string{}
	if strings.Contains(output, "PHP") {
		re := regexp.MustCompile(`PHP (\d+\.\d+\.\d+)`)
		matches := re.FindAllStringSubmatch(output, -1)
		for _, match := range matches {
			if len(match) > 1 {
				versions = append(versions, match[1])
			}
		}
	}

	return versions
}

func (c *ComposerCollector) getGlobalPackages() map[string]string {
	output, err := c.runComposerCommand("global", "show")
	if err != nil {
		return nil
	}

	packages := make(map[string]string)
	lines := strings.Split(output, "\n")
	for _, line := range lines {
		if strings.Contains(line, ":") {
			parts := strings.SplitN(line, ":", 2)
			if len(parts) == 2 {
				name := strings.TrimSpace(parts[0])
				version := strings.TrimSpace(parts[1])
				packages[name] = version
			}
		}
	}

	return packages
}

func (c *ComposerCollector) getComposerConfig() map[string]string {
	if c.projectPath == "" {
		return nil
	}

	output, err := c.runComposerCommand("config", "--list")
	if err != nil {
		return nil
	}

	config := make(map[string]string)
	lines := strings.Split(output, "\n")
	for _, line := range lines {
		if strings.Contains(line, "[") {
			parts := strings.SplitN(line, " ", 2)
			if len(parts) == 2 {
				key := strings.TrimSpace(parts[0])
				value := strings.TrimSpace(parts[1])
				config[key] = value
			}
		}
	}

	return config
}

func (c *ComposerCollector) getRepositoryURL() string {
	if c.projectPath == "" {
		return ""
	}

	json := c.getComposerJSON()
	if json == nil {
		return ""
	}

	// Check for repositories
	for _, repo := range json.Repositories {
		if repo.Type == "git" || repo.Type == "vcs" {
			return repo.URL
		}
	}

	// Try to get from composer.lock
	lock := c.getComposerLock()
	if lock != nil && len(lock.Packages) > 0 {
		for _, pkg := range lock.Packages {
			if pkg.Source != nil && pkg.Source.URL != "" {
				return pkg.Source.URL
			}
		}
	}

	return ""
}
