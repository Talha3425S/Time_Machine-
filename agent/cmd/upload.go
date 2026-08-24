package cmd

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"github.com/software-time-machine/agent/client"
	"github.com/software-time-machine/agent/collector"
	"github.com/spf13/cobra"
)

var uploadCmd = &cobra.Command{
	Use:   "upload",
	Short: "Upload collected state to cloud",
	Long:  `Upload the collected environment state to the Software Time Machine cloud API.`,
	Run: func(cmd *cobra.Command, args []string) {
		uploadStateToCloud()
	},
}

func init() {
	uploadCmd.Flags().StringVarP(&apiKey, "api-key", "k", "", "API key for authentication")
	uploadCmd.Flags().StringVarP(&projectID, "project-id", "p", "", "Project ID")
	uploadCmd.Flags().StringVarP(&apiEndpoint, "endpoint", "e", "http://localhost:3001", "API endpoint")
}

var apiKey string
var projectID string
var apiEndpoint string

func uploadStateToCloud() {
	if verbose {
		fmt.Println("Uploading environment state to cloud...")
	}

	// Load configuration if not provided via flags
	if apiKey == "" || projectID == "" {
		config, err := loadAgentConfig()
		if err != nil {
			checkError(fmt.Errorf("failed to load configuration: %w (use --api-key and --project-id flags)", err))
		}

		if apiKey == "" {
			if key, ok := config["api_key"].(string); ok {
				apiKey = key
			}
		}
		if projectID == "" {
			if id, ok := config["project_id"].(string); ok {
				projectID = id
			}
		}
		if apiEndpoint == "http://localhost:3001" {
			if endpoint, ok := config["api_endpoint"].(string); ok {
				apiEndpoint = endpoint
			}
		}
	}

	if apiKey == "" {
		checkError(fmt.Errorf("API key is required (use --api-key flag or configure in .stm/config.json)"))
	}
	if projectID == "" {
		checkError(fmt.Errorf("Project ID is required (use --project-id flag or configure in .stm/config.json)"))
	}

	// Collect environment state
	if verbose {
		fmt.Println("Collecting environment state...")
	}

	gitCollector := collector.NewGitCollector()
	phpCollector := collector.NewPHPCollector()
	composerCollector := collector.NewComposerCollector()
	dockerCollector := collector.NewDockerCollector()
	envCollector := collector.NewEnvironmentCollector()

	state := &collector.EnvironmentState{
		Git:      gitCollector.Collect(),
		PHP:      phpCollector.Collect(),
		Composer: composerCollector.Collect(),
		Docker:   dockerCollector.Collect(),
		Env:      envCollector.Collect(),
	}

	// Create cloud client
	cloudClient := client.NewCloudClient(apiEndpoint, apiKey, projectID)

	// Upload state
	if verbose {
		fmt.Printf("Uploading to %s...\n", apiEndpoint)
	}

	if err := cloudClient.UploadState(state); err != nil {
		checkError(fmt.Errorf("failed to upload state: %w", err))
	}

	if verbose {
		fmt.Println("State uploaded successfully")
	} else {
		fmt.Println("State uploaded successfully")
	}
}

func loadAgentConfig() (map[string]interface{}, error) {
	configFile := filepath.Join(".stm", "config.json")
	data, err := os.ReadFile(configFile)
	if err != nil {
		return nil, err
	}

	var config map[string]interface{}
	if err := json.Unmarshal(data, &config); err != nil {
		return nil, err
	}

	return config, nil
}
