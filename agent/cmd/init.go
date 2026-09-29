package cmd

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/spf13/cobra"
)

var initCmd = &cobra.Command{
	Use:   "init",
	Short: "Initialize Software Time Machine agent",
	Long:  `Initialize the Software Time Machine agent in the current directory. This creates necessary configuration files and sets up the environment for state collection.`,
	Run: func(cmd *cobra.Command, args []string) {
		initializeAgent()
	},
}

var force bool

func init() {
	initCmd.Flags().BoolVarP(&force, "force", "f", false, "force overwrite existing configuration")
}

func initializeAgent() {
	if verbose {
		fmt.Println("Initializing Software Time Machine agent...")
	}

	// Create .stm directory
	stmDir := ".stm"
	if err := os.MkdirAll(stmDir, 0755); err != nil {
		checkError(fmt.Errorf("failed to create .stm directory: %w", err))
	}

	// Create config file
	configFile := filepath.Join(stmDir, "config.json")
	if _, err := os.Stat(configFile); err == nil && !force {
		fmt.Printf("Configuration file already exists at %s. Use --force to overwrite.\n", configFile)
		return
	}

	config := `{
  "project_id": "",
  "api_key": "",
  "api_endpoint": "http://localhost:3001",
  "test_command": "",
  "incident_id": "",
  "collectors": {
    "git": true,
    "php": true,
    "composer": true,
    "docker": true,
    "environment": true
  },
  "upload_frequency": "5m",
  "filters": {
    "exclude_paths": [
      "vendor/",
      "node_modules/",
      ".git/"
    ],
    "exclude_env_vars": [
      "password",
      "secret",
      "token"
    ]
  }
}`

	if err := os.WriteFile(configFile, []byte(config), 0644); err != nil {
		checkError(fmt.Errorf("failed to write config file: %w", err))
	}

	// Create .gitignore for .stm directory
	gitignore := filepath.Join(stmDir, ".gitignore")
	gitignoreContent := `# Ignore sensitive data
*.token
*.secret
cache/
`

	if err := os.WriteFile(gitignore, []byte(gitignoreContent), 0644); err != nil {
		checkError(fmt.Errorf("failed to write .gitignore: %w", err))
	}

	if verbose {
		fmt.Printf("Created configuration at %s\n", configFile)
		fmt.Printf("Created .gitignore at %s\n", gitignore)
		fmt.Println("Software Time Machine agent initialized successfully")
		fmt.Println("Next steps:")
		fmt.Println("1. Edit .stm/config.json to configure your project")
		fmt.Println("2. Run 'stm-agent collect' to test state collection")
		fmt.Println("3. Run 'stm-agent status' to check agent status")
	} else {
		fmt.Println("Software Time Machine agent initialized successfully")
	}
}
