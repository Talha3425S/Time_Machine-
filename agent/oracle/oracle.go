// Package oracle executes a user-selected test command and deterministically
// decides whether that command passed or failed.
package oracle

import (
	"context"
	"os/exec"
	"runtime"
	"strings"
	"time"
)

type Result struct {
	Command    string        `json:"command"`
	Passed     bool          `json:"passed"`
	ExitCode   int           `json:"exitCode"`
	Output     string        `json:"output"`
	Duration   time.Duration `json:"duration"`
	TimedOut   bool          `json:"timedOut"`
	ExecutedAt time.Time     `json:"executedAt"`
}

// Run evaluates a test command. A zero exit code is the oracle's success
// predicate; timeout and any non-zero exit code are failures.
func Run(command string, timeout time.Duration) Result {
	started := time.Now().UTC()
	result := Result{Command: command, ExecutedAt: started}
	if timeout <= 0 {
		timeout = 10 * time.Minute
	}

	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	var cmd *exec.Cmd
	if runtime.GOOS == "windows" {
		cmd = exec.CommandContext(ctx, "cmd", "/C", command)
	} else {
		cmd = exec.CommandContext(ctx, "sh", "-c", command)
	}
	output, err := cmd.CombinedOutput()
	result.Duration = time.Since(started)
	result.Output = strings.TrimSpace(string(output))
	result.TimedOut = ctx.Err() == context.DeadlineExceeded
	result.Passed = err == nil && !result.TimedOut
	if exitError, ok := err.(*exec.ExitError); ok {
		result.ExitCode = exitError.ExitCode()
	} else if result.TimedOut {
		result.ExitCode = -1
	}
	return result
}
