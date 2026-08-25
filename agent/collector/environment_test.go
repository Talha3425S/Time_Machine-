package collector

import "testing"

func TestSensitiveEnvironmentKeysAreRedacted(t *testing.T) {
	if !isSensitiveKey("DATABASE_PASSWORD") || isSensitiveKey("APP_ENV") {
		t.Fatal("sensitive-key classification is incorrect")
	}
}
