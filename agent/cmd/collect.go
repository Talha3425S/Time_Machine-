package cmd

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/software-time-machine/agent/collector"
	"github.com/spf13/cobra"
)

var collectCmd = &cobra.Command{
	Use:   "collect",
	Short: "Collect environment state information",
	Long:  `Collect and output environment state information including Git, PHP, Composer, Docker, and environment variables.`,
	Run: func(cmd *cobra.Command, args []string) {
		collectEnvironmentState()
	},
}

var outputFile string
var format string

func init() {
	collectCmd.Flags().StringVarP(&outputFile, "output", "o", "", "output file (default: stdout)")
	collectCmd.Flags().StringVarP(&format, "format", "f", "json", "output format (json, yaml)")
}

func collectEnvironmentState() {
	if verbose {
		fmt.Println("Starting environment state collection...")
	}

	// Initialize collectors
	gitCollector := collector.NewGitCollector()
	phpCollector := collector.NewPHPCollector()
	composerCollector := collector.NewComposerCollector()
	dockerCollector := collector.NewDockerCollector()
	envCollector := collector.NewEnvironmentCollector()

	// Collect state from all collectors
	state := &collector.EnvironmentState{
		Git:      gitCollector.Collect(),
		PHP:      phpCollector.Collect(),
		Composer: composerCollector.Collect(),
		Docker:   dockerCollector.Collect(),
		Env:      envCollector.Collect(),
	}

	// Output the collected state
	var output []byte
	var err error

	switch format {
	case "json":
		output, err = json.MarshalIndent(state, "", "  ")
	default:
		checkError(fmt.Errorf("unsupported format: %s (only json is supported)", format))
	}

	checkError(err)

	if outputFile != "" {
		err = os.WriteFile(outputFile, output, 0644)
		checkError(err)
		if verbose {
			fmt.Printf("State written to %s\n", outputFile)
		}
	} else {
		fmt.Println(string(output))
	}

	if verbose {
		fmt.Println("Environment state collection completed successfully")
	}
}
