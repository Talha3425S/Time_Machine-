package collector

// EnvironmentState represents the complete state of the development environment
type EnvironmentState struct {
	Git      *GitState      `json:"git,omitempty"`
	PHP      *PHPState      `json:"php,omitempty"`
	Composer *ComposerState `json:"composer,omitempty"`
	Docker   *DockerState   `json:"docker,omitempty"`
	Env      *EnvState      `json:"env,omitempty"`
}

// Collector interface defines the contract for all environment collectors
type Collector interface {
	Collect() interface{}
	IsAvailable() bool
}
