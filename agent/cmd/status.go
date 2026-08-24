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
	collectors := map[string]collector.Collector{
		"Git":       collector.NewGitCollector(),
		"PHP":       collector.NewPHPCollector(),
		"Composer":  collector.NewComposerCollector(),
		"Docker":    collector.NewDockerCollector(),
		"Environment": collector.NewEnvironmentCollector(),
	}

	fmt.Println("\nCollector Status:")
	for name, col := range collectors {
		if col.IsAvailable() {
			fmt.Printf("✅ %s: Available\n", name)
		} else {
			fmt.Printf("❌ %s: Not available\n", name)
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
