package manifest

import (
	"encoding/json"
	"testing"
	"time"
)

func TestNewBuilder(t *testing.T) {
	projectID := "test-project-123"
	builder := NewBuilder(projectID)

	if builder.manifest.Manifest.ProjectID != projectID {
		t.Errorf("Expected ProjectID %s, got %s", projectID, builder.manifest.Manifest.ProjectID)
	}

	if builder.manifest.Manifest.Version != "1.0.0" {
		t.Errorf("Expected Version 1.0.0, got %s", builder.manifest.Manifest.Version)
	}

	if builder.manifest.Manifest.ID == "" {
		t.Error("Expected ID to be generated")
	}
}

func TestBuilderWithMetadata(t *testing.T) {
	builder := NewBuilder("test-project")
	builder.WithMetadata("test-host", "linux")

	if builder.manifest.Manifest.Metadata.Hostname != "test-host" {
		t.Errorf("Expected Hostname test-host, got %s", builder.manifest.Manifest.Metadata.Hostname)
	}

	if builder.manifest.Manifest.Metadata.Platform != "linux" {
		t.Errorf("Expected Platform linux, got %s", builder.manifest.Manifest.Metadata.Platform)
	}
}

func TestBuilderWithEnvironment(t *testing.T) {
	builder := NewBuilder("test-project")

	env := Environment{
		System: SystemInfo{
			OS: OSInfo{
				Name:    "Linux",
				Version: "5.15.0",
			},
			Runtime: RuntimeInfo{
				Name:    "PHP",
				Version: "8.2.0",
			},
		},
	}

	builder.WithEnvironment(env)

	if builder.manifest.Environment.System.OS.Name != "Linux" {
		t.Errorf("Expected OS Name Linux, got %s", builder.manifest.Environment.System.OS.Name)
	}
}

func TestBuilderFinalize(t *testing.T) {
	builder := NewBuilder("test-project")
	builder.WithMetadata("test-host", "linux")

	manifest := builder.Finalize()

	if manifest.Manifest.Metadata.CollectionDuration == 0 {
		t.Error("Expected CollectionDuration to be set")
	}

	if manifest.Semantic.Fingerprint.Combined == "" {
		t.Error("Expected Fingerprint to be generated")
	}
}

func TestFingerprintGeneration(t *testing.T) {
	builder := NewBuilder("test-project")
	builder.WithEnvironment(Environment{
		System: SystemInfo{
			OS: OSInfo{
				Name:    "Linux",
				Version: "5.15.0",
			},
			Runtime: RuntimeInfo{
				Name:    "PHP",
				Version: "8.2.0",
			},
		},
	})

	manifest := builder.Finalize()

	if manifest.Semantic.Fingerprint.Environment == "" {
		t.Error("Expected Environment fingerprint to be generated")
	}

	if manifest.Semantic.Fingerprint.Dependencies == "" {
		t.Error("Expected Dependencies fingerprint to be generated")
	}

	if manifest.Semantic.Fingerprint.Configuration == "" {
		t.Error("Expected Configuration fingerprint to be generated")
	}

	if manifest.Semantic.Fingerprint.Combined == "" {
		t.Error("Expected Combined fingerprint to be generated")
	}
}

func TestManifestToJSON(t *testing.T) {
	builder := NewBuilder("test-project")
	builder.WithMetadata("test-host", "linux")
	builder.WithEnvironment(Environment{
		System: SystemInfo{
			OS: OSInfo{
				Name:    "Linux",
				Version: "5.15.0",
			},
		},
	})

	manifest := builder.Finalize()
	jsonData, err := manifest.ToJSON()

	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if len(jsonData) == 0 {
		t.Error("Expected JSON data to be generated")
	}

	// Verify it's valid JSON
	var parsed map[string]interface{}
	err = json.Unmarshal(jsonData, &parsed)
	if err != nil {
		t.Errorf("Expected valid JSON, got error: %v", err)
	}
}

func TestManifestFromJSON(t *testing.T) {
	builder := NewBuilder("test-project")
	builder.WithMetadata("test-host", "linux")
	builder.WithEnvironment(Environment{
		System: SystemInfo{
			OS: OSInfo{
				Name:    "Linux",
				Version: "5.15.0",
			},
		},
	})

	originalManifest := builder.Finalize()
	jsonData, _ := originalManifest.ToJSON()

	restoredManifest, err := FromJSON(jsonData)

	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if restoredManifest.Manifest.ID != originalManifest.Manifest.ID {
		t.Errorf("Expected ID %s, got %s", originalManifest.Manifest.ID, restoredManifest.Manifest.ID)
	}

	if restoredManifest.Manifest.ProjectID != originalManifest.Manifest.ProjectID {
		t.Errorf("Expected ProjectID %s, got %s", originalManifest.Manifest.ProjectID, restoredManifest.Manifest.ProjectID)
	}
}

func TestCompleteManifestBuild(t *testing.T) {
	builder := NewBuilder("test-project-123")
	builder.WithMetadata("dev-machine", "windows")

	// Add environment
	builder.WithEnvironment(Environment{
		System: SystemInfo{
			OS: OSInfo{
				Name:         "Windows",
				Version:      "10",
				Architecture: "x64",
			},
			Runtime: RuntimeInfo{
				Name:       "PHP",
				Version:    "8.2.12",
				Extensions: []string{"pdo", "redis", "json"},
			},
			Variables: map[string]string{
				"APP_ENV":  "local",
				"APP_DEBUG": "true",
			},
		},
		Dependencies: Dependencies{
			Runtime: PackageManager{
				Name:    "Composer",
				Version: "2.5.0",
				Packages: []Package{
					{Name: "laravel/framework", Version: "10.0.0", Type: "composer"},
					{Name: "guzzlehttp/guzzle", Version: "7.5.0", Type: "composer"},
				},
			},
		},
	})

	// Add codebase
	builder.WithCodebase(Codebase{
		Git: GitInfo{
			Repository: "https://github.com/test/repo",
			Branch:     "main",
			Commit: CommitInfo{
				Hash:      "abc123",
				Message:   "Test commit",
				Author:    "Test Author",
				Timestamp: time.Now(),
			},
		},
	})

	// Add infrastructure
	builder.WithInfrastructure(Infrastructure{
		Docker: DockerInfo{
			Daemon: DockerDaemon{
				Version:    "24.0.0",
				APIVersion: "1.43",
			},
		},
	})

	// Add runtime
	builder.WithRuntime(Runtime{
		Application: Application{
			Framework: Framework{
				Name:    "Laravel",
				Version: "10.0.0",
			},
		},
	})

	manifest := builder.Finalize()

	// Verify all sections are populated
	if manifest.Environment.System.OS.Name == "" {
		t.Error("Expected Environment.OS.Name to be set")
	}

	if manifest.Codebase.Git.Repository == "" {
		t.Error("Expected Codebase.Git.Repository to be set")
	}

	if manifest.Infrastructure.Docker.Daemon.Version == "" {
		t.Error("Expected Infrastructure.Docker.Daemon.Version to be set")
	}

	if manifest.Runtime.Application.Framework.Name == "" {
		t.Error("Expected Runtime.Application.Framework.Name to be set")
	}

	// Verify fingerprints are generated
	if manifest.Semantic.Fingerprint.Combined == "" {
		t.Error("Expected Fingerprint.Combined to be generated")
	}

	// Verify JSON serialization works
	jsonData, err := manifest.ToJSON()
	if err != nil {
		t.Errorf("Expected JSON serialization to work, got error: %v", err)
	}

	if len(jsonData) < 100 {
		t.Error("Expected JSON data to be substantial")
	}
}

func TestFingerprintConsistency(t *testing.T) {
	// Test that identical manifests produce identical fingerprints
	builder1 := NewBuilder("test-project")
	builder1.WithEnvironment(Environment{
		System: SystemInfo{
			OS: OSInfo{
				Name:    "Linux",
				Version: "5.15.0",
			},
		},
	})

	builder2 := NewBuilder("test-project")
	builder2.WithEnvironment(Environment{
		System: SystemInfo{
			OS: OSInfo{
				Name:    "Linux",
				Version: "5.15.0",
			},
		},
	})

	manifest1 := builder1.Finalize()
	manifest2 := builder2.Finalize()

	if manifest1.Semantic.Fingerprint.Environment != manifest2.Semantic.Fingerprint.Environment {
		t.Error("Expected identical environment fingerprints for identical environments")
	}

	// Test that different manifests produce different fingerprints
	builder3 := NewBuilder("test-project")
	builder3.WithEnvironment(Environment{
		System: SystemInfo{
			OS: OSInfo{
				Name:    "Windows",
				Version: "10",
			},
		},
	})

	manifest3 := builder3.Finalize()

	if manifest1.Semantic.Fingerprint.Environment == manifest3.Semantic.Fingerprint.Environment {
		t.Error("Expected different environment fingerprints for different environments")
	}
}
