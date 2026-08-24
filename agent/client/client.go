package client

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// CloudClient handles communication with the Software Time Machine cloud API
type CloudClient struct {
	apiEndpoint string
	apiKey      string
	projectID   string
	httpClient  *http.Client
}

// NewCloudClient creates a new cloud client
func NewCloudClient(apiEndpoint, apiKey, projectID string) *CloudClient {
	return &CloudClient{
		apiEndpoint: apiEndpoint,
		apiKey:      apiKey,
		projectID:   projectID,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
			Transport: &http.Transport{
				TLSClientConfig: &tls.Config{
					InsecureSkipVerify: false, // Verify SSL certificates
				},
			},
		},
	}
}

// UploadState uploads the collected environment state to the cloud
func (c *CloudClient) UploadState(state interface{}) error {
	stateJSON, err := json.Marshal(state)
	if err != nil {
		return fmt.Errorf("failed to marshal state: %w", err)
	}

	url := fmt.Sprintf("%s/api/projects/%s/state", c.apiEndpoint, c.projectID)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(stateJSON))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.apiKey))
	req.Header.Set("User-Agent", "STM-Agent/1.0")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("API returned error %d: %s", resp.StatusCode, string(body))
	}

	return nil
}

// GetConfiguration fetches the agent configuration from the cloud
func (c *CloudClient) GetConfiguration() (map[string]interface{}, error) {
	url := fmt.Sprintf("%s/api/projects/%s/agent-config", c.apiEndpoint, c.projectID)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.apiKey))
	req.Header.Set("User-Agent", "STM-Agent/1.0")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API returned error %d: %s", resp.StatusCode, string(body))
	}

	var config map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&config); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return config, nil
}

// Heartbeat sends a heartbeat signal to the cloud to indicate the agent is active
func (c *CloudClient) Heartbeat() error {
	url := fmt.Sprintf("%s/api/projects/%s/heartbeat", c.apiEndpoint, c.projectID)
	req, err := http.NewRequest("POST", url, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.apiKey))
	req.Header.Set("User-Agent", "STM-Agent/1.0")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("API returned error %d: %s", resp.StatusCode, string(body))
	}

	return nil
}

// ReportError reports an error from the agent to the cloud
func (c *CloudClient) ReportError(errorMsg string, severity string) error {
	errorData := map[string]string{
		"error":    errorMsg,
		"severity": severity,
	}

	stateJSON, err := json.Marshal(errorData)
	if err != nil {
		return fmt.Errorf("failed to marshal error: %w", err)
	}

	url := fmt.Sprintf("%s/api/projects/%s/error", c.apiEndpoint, c.projectID)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(stateJSON))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.apiKey))
	req.Header.Set("User-Agent", "STM-Agent/1.0")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("API returned error %d: %s", resp.StatusCode, string(body))
	}

	return nil
}
