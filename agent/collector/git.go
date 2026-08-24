package collector

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

// GitState represents the current state of the Git repository
type GitState struct {
	IsRepository      bool      `json:"is_repository"`
	CurrentBranch     string    `json:"current_branch"`
	CurrentCommit     string    `json:"current_commit"`
	CommitMessage     string    `json:"commit_message"`
	CommitAuthor      string    `json:"commit_author"`
	CommitDate        time.Time `json:"commit_date"`
	ModifiedFiles     []string  `json:"modified_files,omitempty"`
	UntrackedFiles    []string  `json:"untracked_files,omitempty"`
	StagedFiles       []string  `json:"staged_files,omitempty"`
	RemoteURL         string    `json:"remote_url,omitempty"`
	RemoteBranch      string    `json:"remote_branch,omitempty"`
	AheadBehind       string    `json:"ahead_behind,omitempty"`
	LastTag           string    `json:"last_tag,omitempty"`
	RepositoryRoot    string    `json:"repository_root,omitempty"`
	WorkTreeClean     bool      `json:"work_tree_clean"`
	StagingAreaClean  bool      `json:"staging_area_clean"`
	Branches          []string  `json:"branches,omitempty"`
	Remotes           []string  `json:"remotes,omitempty"`
}

// GitCollector collects Git repository state information
type GitCollector struct {
	repoPath string
}

// NewGitCollector creates a new Git collector for the current directory
func NewGitCollector() *GitCollector {
	repoPath, _ := findGitRepository()
	return &GitCollector{
		repoPath: repoPath,
	}
}

// Collect gathers the current Git state
func (g *GitCollector) Collect() *GitState {
	if g.repoPath == "" {
		return &GitState{IsRepository: false}
	}

	state := &GitState{
		IsRepository:   true,
		RepositoryRoot: g.repoPath,
	}

	// Collect basic Git information
	state.CurrentBranch = g.getCurrentBranch()
	state.CurrentCommit = g.getCurrentCommit()
	state.CommitMessage = g.getCommitMessage()
	state.CommitAuthor = g.getCommitAuthor()
	state.CommitDate = g.getCommitDate()
	state.RemoteURL = g.getRemoteURL()
	state.RemoteBranch = g.getRemoteBranch()
	state.AheadBehind = g.getAheadBehind()
	state.LastTag = g.getLastTag()

	// Collect file status
	state.ModifiedFiles = g.getModifiedFiles()
	state.UntrackedFiles = g.getUntrackedFiles()
	state.StagedFiles = g.getStagedFiles()
	state.WorkTreeClean = len(state.ModifiedFiles) == 0 && len(state.UntrackedFiles) == 0
	state.StagingAreaClean = len(state.StagedFiles) == 0

	// Collect branches and remotes
	state.Branches = g.getBranches()
	state.Remotes = g.getRemotes()

	return state
}

// IsAvailable checks if Git is available in the environment
func (g *GitCollector) IsAvailable() bool {
	_, err := exec.LookPath("git")
	return err == nil
}

func findGitRepository() (string, error) {
	dir, err := os.Getwd()
	if err != nil {
		return "", err
	}

	for {
		gitDir := filepath.Join(dir, ".git")
		if _, err := os.Stat(gitDir); err == nil {
			return dir, nil
		}

		parent := filepath.Dir(dir)
		if parent == dir {
			return "", fmt.Errorf("not a git repository")
		}
		dir = parent
	}
}

func (g *GitCollector) runGitCommand(args ...string) (string, error) {
	cmd := exec.Command("git", args...)
	cmd.Dir = g.repoPath
	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("git %s failed: %w", strings.Join(args, " "), err)
	}
	return strings.TrimSpace(string(output)), nil
}

func (g *GitCollector) getCurrentBranch() string {
	branch, err := g.runGitCommand("rev-parse", "--abbrev-ref", "HEAD")
	if err != nil {
		return ""
	}
	return branch
}

func (g *GitCollector) getCurrentCommit() string {
	commit, err := g.runGitCommand("rev-parse", "HEAD")
	if err != nil {
		return ""
	}
	return commit
}

func (g *GitCollector) getCommitMessage() string {
	message, err := g.runGitCommand("log", "-1", "--pretty=%B")
	if err != nil {
		return ""
	}
	return message
}

func (g *GitCollector) getCommitAuthor() string {
	author, err := g.runGitCommand("log", "-1", "--pretty=%an")
	if err != nil {
		return ""
	}
	return author
}

func (g *GitCollector) getCommitDate() time.Time {
	dateStr, err := g.runGitCommand("log", "-1", "--pretty=%ct")
	if err != nil {
		return time.Time{}
	}
	timestamp, err := time.Parse("2006-01-02 15:04:05 -0700", dateStr)
	if err != nil {
		// Try parsing as Unix timestamp
		var unix int64
		_, err = fmt.Sscanf(dateStr, "%d", &unix)
		if err != nil {
			return time.Time{}
		}
		return time.Unix(unix, 0)
	}
	return timestamp
}

func (g *GitCollector) getRemoteURL() string {
	url, err := g.runGitCommand("config", "--get", "remote.origin.url")
	if err != nil {
		return ""
	}
	return url
}

func (g *GitCollector) getRemoteBranch() string {
	branch, err := g.runGitCommand("rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}")
	if err != nil {
		return ""
	}
	return branch
}

func (g *GitCollector) getAheadBehind() string {
	ab, err := g.runGitCommand("rev-list", "--left-right", "--count", "@{u}...HEAD")
	if err != nil {
		return ""
	}
	return ab
}

func (g *GitCollector) getLastTag() string {
	tag, err := g.runGitCommand("describe", "--tags", "--abbrev=0")
	if err != nil {
		return ""
	}
	return tag
}

func (g *GitCollector) getModifiedFiles() []string {
	output, err := g.runGitCommand("diff", "--name-only")
	if err != nil {
		return []string{}
	}
	if output == "" {
		return []string{}
	}
	return strings.Split(output, "\n")
}

func (g *GitCollector) getUntrackedFiles() []string {
	output, err := g.runGitCommand("ls-files", "--others", "--exclude-standard")
	if err != nil {
		return []string{}
	}
	if output == "" {
		return []string{}
	}
	return strings.Split(output, "\n")
}

func (g *GitCollector) getStagedFiles() []string {
	output, err := g.runGitCommand("diff", "--cached", "--name-only")
	if err != nil {
		return []string{}
	}
	if output == "" {
		return []string{}
	}
	return strings.Split(output, "\n")
}

func (g *GitCollector) getBranches() []string {
	output, err := g.runGitCommand("branch", "--format=%(refname:short)")
	if err != nil {
		return []string{}
	}
	if output == "" {
		return []string{}
	}
	return strings.Split(output, "\n")
}

func (g *GitCollector) getRemotes() []string {
	output, err := g.runGitCommand("remote")
	if err != nil {
		return []string{}
	}
	if output == "" {
		return []string{}
	}
	return strings.Split(output, "\n")
}
