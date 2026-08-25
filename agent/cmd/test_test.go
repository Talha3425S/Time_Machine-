package cmd

import (
	"strings"
	"testing"
)

func TestRedactOutput(t *testing.T) {
	output := redactOutput("DATABASE_PASSWORD=sup3r-secret\nAPI_KEY: abc123")
	if strings.Contains(output, "sup3r-secret") || strings.Contains(output, "abc123") || !strings.Contains(output, "[REDACTED]") {
		t.Fatalf("expected output to be redacted, got %q", output)
	}
}
