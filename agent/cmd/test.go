package cmd

import (
	"fmt"
	"regexp"
	"time"

	"github.com/software-time-machine/agent/client"
	"github.com/software-time-machine/agent/collector"
	"github.com/software-time-machine/agent/oracle"
	"github.com/spf13/cobra"
)

var testCommand string
var testTimeout time.Duration
var secretAssignment = regexp.MustCompile(`(?i)\b(password|secret|token|api[_-]?key|private[_-]?key)\b\s*[:=]\s*[^\s]+`)

var testCmd = &cobra.Command{
	Use:   "test",
	Short: "Run the configured test command and capture its oracle result",
	Run:   func(cmd *cobra.Command, args []string) { runTestOracle() },
}

func init() {
	testCmd.Flags().StringVarP(&testCommand, "command", "c", "", "test command to execute")
	testCmd.Flags().DurationVar(&testTimeout, "timeout", 10*time.Minute, "maximum test duration")
	testCmd.Flags().StringVarP(&apiKey, "api-key", "k", "", "API key for authentication")
	testCmd.Flags().StringVarP(&projectID, "project-id", "p", "", "Project ID")
	testCmd.Flags().StringVarP(&apiEndpoint, "endpoint", "e", "http://localhost:3001", "API endpoint")
}

func runTestOracle() {
	config, err := loadAgentConfig()
	checkError(err)
	if testCommand == "" {
		testCommand, _ = config["test_command"].(string)
	}
	if testCommand == "" {
		checkError(fmt.Errorf("a test command is required (use --command or set test_command in .stm/config.json)"))
	}
	if apiKey == "" {
		apiKey, _ = config["api_key"].(string)
	}
	if projectID == "" {
		projectID, _ = config["project_id"].(string)
	}
	if endpoint, ok := config["api_endpoint"].(string); ok && apiEndpoint == "http://localhost:3001" {
		apiEndpoint = endpoint
	}
	if apiKey == "" || projectID == "" {
		checkError(fmt.Errorf("API key and project ID are required"))
	}

	result := oracle.Run(testCommand, testTimeout)
	state := collectState()
	payload := map[string]interface{}{
		"command": result.Command, "passed": result.Passed, "exitCode": result.ExitCode,
		"output": redactOutput(result.Output), "durationMs": result.Duration.Milliseconds(), "timedOut": result.TimedOut,
		"executedAt": result.ExecutedAt, "state": state,
	}
	cloud := client.NewCloudClient(apiEndpoint, apiKey, projectID)
	checkError(cloud.UploadOracleResult(payload))
	if result.Passed {
		fmt.Println("Test passed; baseline captured.")
	} else {
		fmt.Printf("Test failed; failure captured (exit code %d).\n", result.ExitCode)
	}
}

func redactOutput(output string) string {
	return secretAssignment.ReplaceAllStringFunc(output, func(match string) string {
		key := regexp.MustCompile(`[:=]`).Split(match, 2)[0]
		return key + "=[REDACTED]"
	})
}

func collectState() *collector.EnvironmentState {
	return &collector.EnvironmentState{Git: collector.NewGitCollector().Collect(), PHP: collector.NewPHPCollector().Collect(), Composer: collector.NewComposerCollector().Collect(), Docker: collector.NewDockerCollector().Collect(), Env: collector.NewEnvironmentCollector().Collect()}
}
