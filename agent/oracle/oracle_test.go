package oracle

import (
	"runtime"
	"testing"
	"time"
)

func command(success bool) string {
	if runtime.GOOS == "windows" {
		if success {
			return "exit 0"
		}
		return "exit 7"
	}
	if success {
		return "true"
	}
	return "false"
}

func TestRunUsesExitCodeAsTheOracle(t *testing.T) {
	if result := Run(command(true), time.Second); !result.Passed || result.ExitCode != 0 {
		t.Fatalf("expected passing result, got %#v", result)
	}
	if result := Run(command(false), time.Second); result.Passed || result.ExitCode == 0 {
		t.Fatalf("expected failing result, got %#v", result)
	}
}
