package manifest

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"time"
)

// Manifest represents the complete state manifest
type Manifest struct {
	Manifest     CoreManifest    `json:"manifest"`
	Environment  Environment    `json:"environment"`
	Codebase     Codebase       `json:"codebase"`
	Infrastructure Infrastructure `json:"infrastructure"`
	Runtime      Runtime        `json:"runtime"`
	Semantic     Semantic       `json:"semantic"`
}

// CoreManifest contains manifest metadata
type CoreManifest struct {
	Version    string    `json:"version"`
	ID         string    `json:"id"`
	ProjectID  string    `json:"projectId"`
	Timestamp  time.Time `json:"timestamp"`
	Metadata   Metadata  `json:"metadata"`
}

// Metadata contains collection metadata
type Metadata struct {
	Source            string `json:"source"`
	AgentVersion      string `json:"agentVersion"`
	Hostname          string `json:"hostname"`
	Platform          string `json:"platform"`
	CollectionDuration int64  `json:"collectionDuration"`
}

// Environment represents system environment
type Environment struct {
	System       SystemInfo       `json:"system"`
	Dependencies Dependencies    `json:"dependencies"`
}

// SystemInfo contains OS and runtime information
type SystemInfo struct {
	OS        OSInfo        `json:"os"`
	Runtime   RuntimeInfo   `json:"runtime"`
	Variables map[string]string `json:"variables"`
}

// OSInfo contains operating system details
type OSInfo struct {
	Name         string `json:"name"`
	Version      string `json:"version"`
	Architecture string `json:"architecture"`
}

// RuntimeInfo contains runtime details
type RuntimeInfo struct {
	Name       string   `json:"name"`
	Version    string   `json:"version"`
	Extensions []string `json:"extensions"`
}

// Dependencies contains package dependencies
type Dependencies struct {
	Runtime PackageManager `json:"runtime"`
	System  PackageManager `json:"system"`
}

// PackageManager represents a package manager
type PackageManager struct {
	Name     string    `json:"name"`
	Version  string    `json:"version"`
	Packages []Package `json:"packages"`
}

// Package represents a single package
type Package struct {
	Name   string `json:"name"`
	Version string `json:"version"`
	Type   string `json:"type"`
	Source string `json:"source"`
}

// Codebase represents source code state
type Codebase struct {
	Git          GitInfo         `json:"git"`
	Configuration []ConfigFile `json:"configuration"`
}

// GitInfo contains git repository state
type GitInfo struct {
	Repository string       `json:"repository"`
	Branch     string       `json:"branch"`
	Commit     CommitInfo   `json:"commit"`
	Status     GitStatus    `json:"status"`
}

// CommitInfo contains git commit details
type CommitInfo struct {
	Hash      string    `json:"hash"`
	Message   string    `json:"message"`
	Author    string    `json:"author"`
	Timestamp time.Time `json:"timestamp"`
}

// GitStatus contains working tree status
type GitStatus struct {
	Modified  []string `json:"modified"`
	Staged    []string `json:"staged"`
	Untracked []string `json:"untracked"`
}

// ConfigFile represents a configuration file
type ConfigFile struct {
	Path    string `json:"path"`
	Hash    string `json:"hash"`
	Content string `json:"content"`
	Type    string `json:"type"`
}

// Infrastructure represents infrastructure state
type Infrastructure struct {
	Docker   DockerInfo `json:"docker"`
	Services []Service  `json:"services"`
}

// DockerInfo contains Docker daemon and container information
type DockerInfo struct {
	Daemon     DockerDaemon    `json:"daemon"`
	Containers []DockerContainer `json:"containers"`
	Images     []DockerImage   `json:"images"`
}

// DockerDaemon contains Docker daemon information
type DockerDaemon struct {
	Version    string `json:"version"`
	APIVersion string `json:"apiVersion"`
}

// DockerContainer represents a Docker container
type DockerContainer struct {
	ID      string   `json:"id"`
	Name    string   `json:"name"`
	Image   string   `json:"image"`
	Status  string   `json:"status"`
	Ports   []string `json:"ports"`
	Volumes []string `json:"volumes"`
}

// DockerImage represents a Docker image
type DockerImage struct {
	ID         string `json:"id"`
	Repository string `json:"repository"`
	Tag        string `json:"tag"`
	Size       int64  `json:"size"`
}

// Service represents an external service
type Service struct {
	Name       string `json:"name"`
	Type       string `json:"type"`
	Version    string `json:"version"`
	Connection string `json:"connection"`
	Status     string `json:"status"`
}

// Runtime represents application runtime state
type Runtime struct {
	Application Application   `json:"application"`
	Extensions  []Extension  `json:"extensions"`
}

// Application contains application framework information
type Application struct {
	Framework     Framework     `json:"framework"`
	Configuration AppConfig    `json:"configuration"`
}

// Framework represents the application framework
type Framework struct {
	Name    string `json:"name"`
	Version string `json:"version"`
}

// AppConfig contains application configuration
type AppConfig struct {
	Environment string `json:"environment"`
	Debug       bool   `json:"debug"`
	Cache       Cache  `json:"cache"`
}

// Cache represents cache configuration
type Cache struct {
	Enabled bool   `json:"enabled"`
	Driver  string `json:"driver"`
}

// Extension represents a runtime extension
type Extension struct {
	Name         string                 `json:"name"`
	Version      string                 `json:"version"`
	Enabled      bool                   `json:"enabled"`
	Configuration map[string]interface{} `json:"configuration"`
}

// Semantic contains semantic analysis results
type Semantic struct {
	Normalized  NormalizedState `json:"normalized"`
	Fingerprint Fingerprint    `json:"fingerprint"`
}

// NormalizedState contains framework-specific normalized state
type NormalizedState struct {
	Framework    string            `json:"framework"`
	Dependencies NormalizedDeps   `json:"dependencies"`
	Configuration map[string]string `json:"configuration"`
}

// NormalizedDeps contains normalized dependency classification
type NormalizedDeps struct {
	Critical []string `json:"critical"`
	Optional []string `json:"optional"`
	Dev      []string `json:"dev"`
}

// Fingerprint contains hash-based fingerprints
type Fingerprint struct {
	Environment string `json:"environment"`
	Dependencies string `json:"dependencies"`
	Configuration string `json:"configuration"`
	Combined    string `json:"combined"`
}

// Builder builds state manifests
type Builder struct {
	manifest *Manifest
	startTime time.Time
}

// NewBuilder creates a new manifest builder
func NewBuilder(projectID string) *Builder {
	now := time.Now()
	return &Builder{
		manifest: &Manifest{
			Manifest: CoreManifest{
				Version:   "1.0.0",
				ID:        generateUUID(),
				ProjectID: projectID,
				Timestamp: now,
				Metadata: Metadata{
					Source:       "agent",
					AgentVersion: "1.0.0",
				},
			},
		},
		startTime: now,
	}
}

// WithMetadata sets collection metadata
func (b *Builder) WithMetadata(hostname, platform string) *Builder {
	b.manifest.Manifest.Metadata.Hostname = hostname
	b.manifest.Manifest.Metadata.Platform = platform
	return b
}

// WithEnvironment sets environment information
func (b *Builder) WithEnvironment(env Environment) *Builder {
	b.manifest.Environment = env
	return b
}

// WithCodebase sets codebase information
func (b *Builder) WithCodebase(codebase Codebase) *Builder {
	b.manifest.Codebase = codebase
	return b
}

// WithInfrastructure sets infrastructure information
func (b *Builder) WithInfrastructure(infra Infrastructure) *Builder {
	b.manifest.Infrastructure = infra
	return b
}

// WithRuntime sets runtime information
func (b *Builder) WithRuntime(runtime Runtime) *Builder {
	b.manifest.Runtime = runtime
	return b
}

// WithSemantic sets semantic analysis results
func (b *Builder) WithSemantic(semantic Semantic) *Builder {
	b.manifest.Semantic = semantic
	return b
}

// Finalize completes the manifest building process
func (b *Builder) Finalize() *Manifest {
	duration := time.Since(b.startTime).Milliseconds()
	b.manifest.Manifest.Metadata.CollectionDuration = duration
	
	// Generate fingerprints if not set
	if b.manifest.Semantic.Fingerprint.Combined == "" {
		b.manifest.Semantic.Fingerprint = b.generateFingerprints()
	}
	
	return b.manifest
}

// generateFingerprints creates hash-based fingerprints
func (b *Builder) generateFingerprints() Fingerprint {
	envHash := b.hashEnvironment()
	depHash := b.hashDependencies()
	configHash := b.hashConfiguration()
	
	combined := envHash + depHash + configHash
	combinedHash := sha256.Sum256([]byte(combined))
	
	return Fingerprint{
		Environment:  envHash,
		Dependencies: depHash,
		Configuration: configHash,
		Combined:    hex.EncodeToString(combinedHash[:]),
	}
}

// hashEnvironment creates environment fingerprint
func (b *Builder) hashEnvironment() string {
	data := fmt.Sprintf("%s-%s-%s", 
		b.manifest.Environment.System.OS.Name,
		b.manifest.Environment.System.OS.Version,
		b.manifest.Environment.System.Runtime.Version,
	)
	hash := sha256.Sum256([]byte(data))
	return hex.EncodeToString(hash[:])
}

// hashDependencies creates dependencies fingerprint
func (b *Builder) hashDependencies() string {
	data, _ := json.Marshal(b.manifest.Environment.Dependencies)
	hash := sha256.Sum256(data)
	return hex.EncodeToString(hash[:])
}

// hashConfiguration creates configuration fingerprint
func (b *Builder) hashConfiguration() string {
	data, _ := json.Marshal(b.manifest.Runtime.Application.Configuration)
	hash := sha256.Sum256(data)
	return hex.EncodeToString(hash[:])
}

// ToJSON converts manifest to JSON
func (m *Manifest) ToJSON() ([]byte, error) {
	return json.MarshalIndent(m, "", "  ")
}

// FromJSON creates manifest from JSON
func FromJSON(data []byte) (*Manifest, error) {
	var manifest Manifest
	err := json.Unmarshal(data, &manifest)
	if err != nil {
		return nil, err
	}
	return &manifest, nil
}

// generateUUID generates a simple UUID (placeholder - use proper UUID library in production)
func generateUUID() string {
	return fmt.Sprintf("%x-%x-%x-%x-%x",
		time.Now().UnixNano(),
		time.Now().UnixNano()>>16,
		time.Now().UnixNano()>>32,
		time.Now().UnixNano()>>48,
		time.Now().UnixNano()>>64,
	)
}
