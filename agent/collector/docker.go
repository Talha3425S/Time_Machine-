package collector

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"strings"
)

// DockerState represents the Docker environment state
type DockerState struct {
	Available      bool              `json:"available"`
	Version        string            `json:"version,omitempty"`
	DaemonRunning  bool              `json:"daemon_running"`
	Containers     []ContainerInfo   `json:"containers,omitempty"`
	Images         []ImageInfo       `json:"images,omitempty"`
	Volumes        []VolumeInfo      `json:"volumes,omitempty"`
	Networks       []NetworkInfo     `json:"networks,omitempty"`
	ComposeServices map[string]string `json:"compose_services,omitempty"`
	SystemInfo     *DockerSystemInfo `json:"system_info,omitempty"`
	RegistryConfig *RegistryConfig   `json:"registry_config,omitempty"`
}

// ContainerInfo represents a Docker container
type ContainerInfo struct {
	ID         string   `json:"id,omitempty"`
	Name       string   `json:"name,omitempty"`
	Image      string   `json:"image,omitempty"`
	Status     string   `json:"status,omitempty"`
	State      string   `json:"state,omitempty"`
	Created    string   `json:"created,omitempty"`
	Ports      []string `json:"ports,omitempty"`
	Labels     map[string]string `json:"labels,omitempty"`
	Mounts     []string `json:"mounts,omitempty"`
	Networks   []string `json:"networks,omitempty"`
	Command    string   `json:"command,omitempty"`
}

// ImageInfo represents a Docker image
type ImageInfo struct {
	ID       string   `json:"id,omitempty"`
	Repository string `json:"repository,omitempty"`
	Tag      string   `json:"tag,omitempty"`
	Size     string   `json:"size,omitempty"`
	Created  string   `json:"created,omitempty"`
	Digest   string   `json:"digest,omitempty"`
}

// VolumeInfo represents a Docker volume
type VolumeInfo struct {
	Name       string `json:"name,omitempty"`
	Driver     string `json:"driver,omitempty"`
	Mountpoint string `json:"mountpoint,omitempty"`
	Size       string `json:"size,omitempty"`
	Status     string `json:"status,omitempty"`
}

// NetworkInfo represents a Docker network
type NetworkInfo struct {
	ID       string   `json:"id,omitempty"`
	Name     string   `json:"name,omitempty"`
	Driver   string   `json:"driver,omitempty"`
	Scope    string   `json:"scope,omitempty"`
	Subnets  []string `json:"subnets,omitempty"`
	Gateway  string   `json:"gateway,omitempty"`
}

// DockerSystemInfo represents Docker system information
type DockerSystemInfo struct {
	OS           string            `json:"os,omitempty"`
	Architecture string            `json:"architecture,omitempty"`
	CPUCount     int               `json:"cpu_count,omitempty"`
	Memory       string            `json:"memory,omitempty"`
	Kernel       string            `json:"kernel,omitempty"`
	Servers      map[string]string `json:"servers,omitempty"`
	Registry     string            `json:"registry,omitempty"`
}

// RegistryConfig represents Docker registry configuration
type RegistryConfig struct {
	Mirrors      []string `json:"mirrors,omitempty"`
	InsecureRegistries []string `json:"insecure_registries,omitempty"`
	Experimental bool     `json:"experimental,omitempty"`
}

// DockerCollector collects Docker environment information
type DockerCollector struct{}

// NewDockerCollector creates a new Docker collector
func NewDockerCollector() *DockerCollector {
	return &DockerCollector{}
}

// Collect gathers the current Docker state
func (d *DockerCollector) Collect() *DockerState {
	state := &DockerState{
		Available: d.IsAvailable(),
	}

	if !state.Available {
		return state
	}

	state.Version = d.getDockerVersion()
	state.DaemonRunning = d.isDaemonRunning()
	state.Containers = d.getContainers()
	state.Images = d.getImages()
	state.Volumes = d.getVolumes()
	state.Networks = d.getNetworks()
	state.ComposeServices = d.getComposeServices()
	state.SystemInfo = d.getSystemInfo()
	state.RegistryConfig = d.getRegistryConfig()

	return state
}

// IsAvailable checks if Docker is available in the environment
func (d *DockerCollector) IsAvailable() bool {
	_, err := exec.LookPath("docker")
	return err == nil
}

func (d *DockerCollector) runDockerCommand(args ...string) (string, error) {
	cmd := exec.Command("docker", args...)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("docker %s failed: %w", strings.Join(args, " "), err)
	}
	return strings.TrimSpace(string(output)), nil
}

func (d *DockerCollector) getDockerVersion() string {
	version, err := d.runDockerCommand("--version")
	if err != nil {
		return ""
	}
	// Extract version number (e.g., "Docker version 24.0.5" -> "24.0.5")
	parts := strings.Fields(version)
	if len(parts) >= 3 {
		return parts[2]
	}
	return version
}

func (d *DockerCollector) isDaemonRunning() bool {
	_, err := d.runDockerCommand("info")
	return err == nil
}

func (d *DockerCollector) getContainers() []ContainerInfo {
	output, err := d.runDockerCommand("ps", "-a", "--format", "json")
	if err != nil {
		return []ContainerInfo{}
	}

	var containers []ContainerInfo
	if err := json.Unmarshal([]byte(output), &containers); err != nil {
		return []ContainerInfo{}
	}

	return containers
}

func (d *DockerCollector) getImages() []ImageInfo {
	output, err := d.runDockerCommand("images", "--format", "json")
	if err != nil {
		return []ImageInfo{}
	}

	var images []ImageInfo
	if err := json.Unmarshal([]byte(output), &images); err != nil {
		return []ImageInfo{}
	}

	return images
}

func (d *DockerCollector) getVolumes() []VolumeInfo {
	output, err := d.runDockerCommand("volume", "ls", "--format", "json")
	if err != nil {
		return []VolumeInfo{}
	}

	var volumes []VolumeInfo
	if err := json.Unmarshal([]byte(output), &volumes); err != nil {
		return []VolumeInfo{}
	}

	return volumes
}

func (d *DockerCollector) getNetworks() []NetworkInfo {
	output, err := d.runDockerCommand("network", "ls", "--format", "json")
	if err != nil {
		return []NetworkInfo{}
	}

	var networks []NetworkInfo
	if err := json.Unmarshal([]byte(output), &networks); err != nil {
		return []NetworkInfo{}
	}

	return networks
}

func (d *DockerCollector) getComposeServices() map[string]string {
	// Check if docker-compose is available
	_, err := exec.LookPath("docker-compose")
	if err != nil {
		// Try docker compose (newer versions)
		_, err = exec.LookPath("docker")
		if err != nil {
			return nil
		}
		// Try docker compose subcommand
		_, err = d.runDockerCommand("compose", "ps")
		if err != nil {
			return nil
		}
	} else {
		// Use docker-compose
		cmd := exec.Command("docker-compose", "ps")
		output, err := cmd.CombinedOutput()
		if err != nil {
			return nil
		}
		return d.parseComposeOutput(string(output))
	}

	// Use docker compose
	output, err := d.runDockerCommand("compose", "ps")
	if err != nil {
		return nil
	}
	return d.parseComposeOutput(output)
}

func (d *DockerCollector) parseComposeOutput(output string) map[string]string {
	services := make(map[string]string)
	lines := strings.Split(output, "\n")
	
	// Skip header line
	if len(lines) > 0 {
		lines = lines[1:]
	}

	for _, line := range lines {
		if strings.TrimSpace(line) == "" {
			continue
		}
		parts := strings.Fields(line)
		if len(parts) >= 2 {
			serviceName := parts[0]
			status := parts[1]
			services[serviceName] = status
		}
	}

	return services
}

func (d *DockerCollector) getSystemInfo() *DockerSystemInfo {
	output, err := d.runDockerCommand("info", "--format", "json")
	if err != nil {
		return nil
	}

	var info map[string]interface{}
	if err := json.Unmarshal([]byte(output), &info); err != nil {
		return nil
	}

	systemInfo := &DockerSystemInfo{}

	if os, ok := info["OperatingSystem"].(string); ok {
		systemInfo.OS = os
	}
	if arch, ok := info["Architecture"].(string); ok {
		systemInfo.Architecture = arch
	}
	if cpus, ok := info["NCPU"].(float64); ok {
		systemInfo.CPUCount = int(cpus)
	}
	if mem, ok := info["MemTotal"].(float64); ok {
		systemInfo.Memory = fmt.Sprintf("%.2f GB", mem/1024/1024/1024)
	}
	if kernel, ok := info["KernelVersion"].(string); ok {
		systemInfo.Kernel = kernel
	}

	if servers, ok := info["ServerVersion"].(string); ok {
		if systemInfo.Servers == nil {
			systemInfo.Servers = make(map[string]string)
		}
		systemInfo.Servers["version"] = servers
	}

	return systemInfo
}

func (d *DockerCollector) getRegistryConfig() *RegistryConfig {
	// Try to read Docker config
	configPath := os.Getenv("DOCKER_CONFIG")
	if configPath == "" {
		homeDir, err := os.UserHomeDir()
		if err != nil {
			return nil
		}
		configPath = homeDir + "/.docker"
	}

	configFile := configPath + "/config.json"
	data, err := os.ReadFile(configFile)
	if err != nil {
		return nil
	}

	var config map[string]interface{}
	if err := json.Unmarshal(data, &config); err != nil {
		return nil
	}

	registryConfig := &RegistryConfig{}

	if mirrors, ok := config["registry-mirrors"].([]interface{}); ok {
		for _, mirror := range mirrors {
			if mirrorStr, ok := mirror.(string); ok {
				registryConfig.Mirrors = append(registryConfig.Mirrors, mirrorStr)
			}
		}
	}

	if insecure, ok := config["insecure-registries"].([]interface{}); ok {
		for _, reg := range insecure {
			if regStr, ok := reg.(string); ok {
				registryConfig.InsecureRegistries = append(registryConfig.InsecureRegistries, regStr)
			}
		}
	}

	if experimental, ok := config["experimental"].(string); ok {
		registryConfig.Experimental = experimental == "enabled"
	}

	return registryConfig
}
