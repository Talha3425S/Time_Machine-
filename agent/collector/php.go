package collector

import (
	"encoding/json"
	"fmt"
	"os/exec"
	"regexp"
	"strings"
)

// PHPState represents the PHP runtime state
type PHPState struct {
	Available    bool              `json:"available"`
	Version      string            `json:"version,omitempty"`
	SAPI         string            `json:"sapi,omitempty"`
	Extensions   []string          `json:"extensions,omitempty"`
	Configuration map[string]string `json:"configuration,omitempty"`
	INIPath      string            `json:"ini_path,omitempty"`
	INIFiles     []string          `json:"ini_files,omitempty"`
	LoadedINI    map[string]string `json:"loaded_ini,omitempty"`
	Xdebug       *XdebugState      `json:"xdebug,omitempty"`
	Opcache      *OpcacheState     `json:"opcache,omitempty"`
}

// XdebugState represents Xdebug debugging tool state
type XdebugState struct {
	Enabled     bool   `json:"enabled"`
	Version     string `json:"version,omitempty"`
	Mode        string `json:"mode,omitempty"`
	IDEKey      string `json:"ide_key,omitempty"`
	RemoteHost  string `json:"remote_host,omitempty"`
	RemotePort  string `json:"remote_port,omitempty"`
	ProfilerDir string `json:"profiler_dir,omitempty"`
}

// OpcacheState represents OPcache state
type OpcacheState struct {
	Enabled          bool   `json:"enabled"`
	Full             bool   `json:"full"`
	CacheFull        bool   `json:"cache_full"`
	UsedMemory       string `json:"used_memory,omitempty"`
	FreeMemory       string `json:"free_memory,omitempty"`
	WastedMemory     string `json:"wasted_memory,omitempty"`
	Scripts          int    `json:"scripts,omitempty"`
	Hits             int    `json:"hits,omitempty"`
	Misses           int    `json:"misses,omitempty"`
	Blacklist        int    `json:"blacklist,omitempty"`
	OpcacheStartTime string `json:"opcache_start_time,omitempty"`
}

// PHPCollector collects PHP runtime information
type PHPCollector struct{}

// NewPHPCollector creates a new PHP collector
func NewPHPCollector() *PHPCollector {
	return &PHPCollector{}
}

// Collect gathers the current PHP state
func (p *PHPCollector) Collect() *PHPState {
	state := &PHPState{
		Available: p.IsAvailable(),
	}

	if !state.Available {
		return state
	}

	state.Version = p.getPHPVersion()
	state.SAPI = p.getSAPI()
	state.Extensions = p.getExtensions()
	state.Configuration = p.getConfiguration()
	state.INIPath = p.getINIPath()
	state.INIFiles = p.getINIFiles()
	state.LoadedINI = p.getLoadedINI()
	state.Xdebug = p.getXdebugState()
	state.Opcache = p.getOpcacheState()

	return state
}

// IsAvailable checks if PHP is available in the environment
func (p *PHPCollector) IsAvailable() bool {
	_, err := exec.LookPath("php")
	return err == nil
}

func (p *PHPCollector) runPHPCommand(args ...string) (string, error) {
	cmd := exec.Command("php", args...)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("php %s failed: %w", strings.Join(args, " "), err)
	}
	return strings.TrimSpace(string(output)), nil
}

func (p *PHPCollector) getPHPVersion() string {
	version, err := p.runPHPCommand("-v")
	if err != nil {
		return ""
	}
	// Extract version number (e.g., "PHP 8.2.1" -> "8.2.1")
	re := regexp.MustCompile(`PHP (\d+\.\d+\.\d+)`)
	matches := re.FindStringSubmatch(version)
	if len(matches) > 1 {
		return matches[1]
	}
	return version
}

func (p *PHPCollector) getSAPI() string {
	sapi, err := p.runPHPCommand("-i")
	if err != nil {
		return ""
	}
	// Extract SAPI from phpinfo output
	re := regexp.MustCompile(`Server API => ([^\s]+)`)
	matches := re.FindStringSubmatch(sapi)
	if len(matches) > 1 {
		return matches[1]
	}
	return ""
}

func (p *PHPCollector) getExtensions() []string {
	output, err := p.runPHPCommand("-m")
	if err != nil {
		return []string{}
	}
	if output == "" {
		return []string{}
	}
	lines := strings.Split(output, "\n")
	extensions := []string{}
	for _, line := range lines {
		if line != "" && !strings.HasPrefix(line, "[") {
			extensions = append(extensions, line)
		}
	}
	return extensions
}

func (p *PHPCollector) getConfiguration() map[string]string {
	config := make(map[string]string)
	
	// Try to get configuration via php -i
	output, err := p.runPHPCommand("-i")
	if err != nil {
		return config
	}

	// Parse common configuration values
	configMap := map[string]string{
		"memory_limit":         "memory_limit => ([^\\s]+)",
		"max_execution_time":  "max_execution_time => ([^\\s]+)",
		"upload_max_filesize": "upload_max_filesize => ([^\\s]+)",
		"post_max_size":       "post_max_size => ([^\\s]+)",
		"display_errors":      "display_errors => ([^\\s]+)",
		"error_reporting":     "error_reporting => ([^\\s]+)",
		"date.timezone":       "date.timezone => ([^\\s]+)",
	}

	for key, pattern := range configMap {
		re := regexp.MustCompile(pattern)
		matches := re.FindStringSubmatch(output)
		if len(matches) > 1 {
			config[key] = matches[1]
		}
	}

	return config
}

func (p *PHPCollector) getINIPath() string {
	path, err := p.runPHPCommand("--ini")
	if err != nil {
		return ""
	}
	// Extract the path from the output
	re := regexp.MustCompile(`Loaded Configuration File => ([^\s]+)`)
	matches := re.FindStringSubmatch(path)
	if len(matches) > 1 {
		return matches[1]
	}
	return ""
}

func (p *PHPCollector) getINIFiles() []string {
	output, err := p.runPHPCommand("--ini")
	if err != nil {
		return []string{}
	}
	lines := strings.Split(output, "\n")
	files := []string{}
	for _, line := range lines {
		if strings.Contains(line, ".ini") {
			re := regexp.MustCompile(`(/[^\s]+\.ini)`)
			matches := re.FindAllString(line, -1)
			files = append(files, matches...)
		}
	}
	return files
}

func (p *PHPCollector) getLoadedINI() map[string]string {
	ini := make(map[string]string)
	
	output, err := p.runPHPCommand("-i")
	if err != nil {
		return ini
	}

	// Parse ini directives from phpinfo output
	re := regexp.MustCompile(`(\w+)\s+=>\s+([^<]+)`)
	matches := re.FindAllStringSubmatch(output, -1)
	
	for _, match := range matches {
		if len(match) > 2 {
			key := strings.TrimSpace(match[1])
			value := strings.TrimSpace(match[2])
			if key != "" && value != "" {
				ini[key] = value
			}
		}
	}

	return ini
}

func (p *PHPCollector) getXdebugState() *XdebugState {
	// Check if xdebug is loaded
	extensions := p.getExtensions()
	hasXdebug := false
	for _, ext := range extensions {
		if strings.Contains(strings.ToLower(ext), "xdebug") {
			hasXdebug = true
			break
		}
	}

	if !hasXdebug {
		return &XdebugState{Enabled: false}
	}

	state := &XdebugState{Enabled: true}
	
	// Try to get xdebug configuration
	output, err := p.runPHPCommand("-i")
	if err != nil {
		return state
	}

	// Parse xdebug configuration
	state.Version = p.extractINIValue(output, "xdebug.version")
	state.Mode = p.extractINIValue(output, "xdebug.mode")
	state.IDEKey = p.extractINIValue(output, "xdebug.idekey")
	state.RemoteHost = p.extractINIValue(output, "xdebug.client_host")
	state.RemotePort = p.extractINIValue(output, "xdebug.client_port")
	state.ProfilerDir = p.extractINIValue(output, "xdebug.output_dir")

	return state
}

func (p *PHPCollector) getOpcacheState() *OpcacheState {
	// Check if opcache is loaded
	extensions := p.getExtensions()
	hasOpcache := false
	for _, ext := range extensions {
		if strings.Contains(strings.ToLower(ext), "opcache") {
			hasOpcache = true
			break
		}
	}

	if !hasOpcache {
		return &OpcacheState{Enabled: false}
	}

	state := &OpcacheState{Enabled: true}
	
	// Try to get opcache status via script
	script := `
	<?php
	if (function_exists('opcache_get_status')) {
		$status = opcache_get_status(false);
		echo json_encode($status);
	} else {
		echo json_encode(['enabled' => false]);
	}
	?>`

	cmd := exec.Command("php", "-r", script)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return state
	}

	var status map[string]interface{}
	if err := json.Unmarshal(output, &status); err != nil {
		return state
	}

	if enabled, ok := status["opcache_enabled"].(bool); ok {
		state.Enabled = enabled
	}

	if memoryUsage, ok := status["memory_usage"].(map[string]interface{}); ok {
		if used, ok := memoryUsage["used_memory"].(float64); ok {
			state.UsedMemory = fmt.Sprintf("%.2f MB", used/1024/1024)
		}
		if free, ok := memoryUsage["free_memory"].(float64); ok {
			state.FreeMemory = fmt.Sprintf("%.2f MB", free/1024/1024)
		}
		if wasted, ok := memoryUsage["wasted_memory"].(float64); ok {
			state.WastedMemory = fmt.Sprintf("%.2f MB", wasted/1024/1024)
		}
	}

	if stats, ok := status["opcache_statistics"].(map[string]interface{}); ok {
		if numCached, ok := stats["num_cached_scripts"].(float64); ok {
			state.Scripts = int(numCached)
		}
		if hits, ok := stats["hits"].(float64); ok {
			state.Hits = int(hits)
		}
		if misses, ok := stats["misses"].(float64); ok {
			state.Misses = int(misses)
		}
		if blacklist, ok := stats["blacklist_miss_ratio"].(float64); ok {
			state.Blacklist = int(blacklist)
		}
		if startTime, ok := stats["opcache_start_time"].(float64); ok {
			state.OpcacheStartTime = fmt.Sprintf("%.0f", startTime)
		}
	}

	return state
}

func (p *PHPCollector) extractINIValue(output, key string) string {
	re := regexp.MustCompile(key + `\s+=>\s+([^<\s]+)`)
	matches := re.FindStringSubmatch(output)
	if len(matches) > 1 {
		return matches[1]
	}
	return ""
}
