package cmd

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"github.com/software-time-machine/agent/collector"
	"github.com/spf13/cobra"
)

var statusCmd = &cobra.Command{
	Use:   "status",
	Short: "Check agent and environment status",
	Long:  `Check the status of the Software Time Machine agent and verify that all collectors are available and functioning.`,
	Run: func(cmd *cobra.Command, args []string) {
		checkAgentStatus()
	},
}

func checkAgentStatus() {
	if verbose {
		fmt.Println("Checking Software Time Machine agent status...")
	}

	// Check if agent is initialized
	stmDir := ".stm"
	if _, err := os.Stat(stmDir); os.IsNotExist(err) {
		fmt.Println("❌ Agent not initialized. Run 'stm-agent init' first.")
		return
	}

	fmt.Println("✅ Agent initialized")

	// Check configuration
	configFile := filepath.Join(stmDir, "config.json")
	if _, err := os.Stat(configFile); os.IsNotExist(err) {
		fmt.Println("❌ Configuration file missing")
		return
	}

	// Load and check configuration
	configData, err := os.ReadFile(configFile)
	if err != nil {
		fmt.Printf("❌ Failed to read configuration: %v\n", err)
		return
	}

	var config map[string]interface{}
	if err := json.Unmarshal(configData, &config); err != nil {
		fmt.Printf("❌ Invalid configuration: %v\n", err)
		return
	}

	fmt.Println("✅ Configuration valid")

	// Check collectors
	type collectorCheck struct {
		name     string
		available bool
	}

	collectors := []collectorCheck{
		{"Git", collector.NewGitCollector().IsAvailable()},
		{"PHP", collector.NewPHPCollector().IsAvailable()},
		{"Composer", collector.NewComposerCollector().IsAvailable()},
		{"Docker", collector.NewDockerCollector().IsAvailable()},
		{"Environment", collector.NewEnvironmentCollector().IsAvailable()},
	}

	fmt.Println("\nCollector Status:")
	for _, c := range collectors {
		if c.available {
			fmt.Printf("✅ %s: Available\n", c.name)
		} else {
			fmt.Printf("❌ %s: Not available\n", c.name)
		}
	}

	// Test collection
	fmt.Println("\nTesting collection...")
	gitCollector := collector.NewGitCollector()
	gitState := gitCollector.Collect()
	
	if gitState.IsRepository {
		fmt.Printf("✅ Git repository detected: %s\n", gitState.CurrentBranch)
	} else {
		fmt.Println("⚠️  No Git repository detected")
	}

	phpCollector := collector.NewPHPCollector()
	phpState := phpCollector.Collect()
	
	if phpState.Available {
		fmt.Printf("✅ PHP detected: %s\n", phpState.Version)
	} else {
		fmt.Println("⚠️  PHP not available")
	}

	dockerCollector := collector.NewDockerCollector()
	dockerState := dockerCollector.Collect()
	
	if dockerState.Available {
		if dockerState.DaemonRunning {
			fmt.Printf("✅ Docker daemon running: %s\n", dockerState.Version)
		} else {
			fmt.Printf("⚠️  Docker available but daemon not running\n")
		}
	} else {
		fmt.Println("⚠️  Docker not available")
	}

	fmt.Println("\nAgent status check completed")
}
