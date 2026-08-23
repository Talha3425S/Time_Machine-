export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  role: 'admin' | 'member' | 'viewer';
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  repositoryUrl: string;
  defaultTestCommand?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface GitHubRepoValidation {
  valid: boolean;
  repository?: {
    name: string;
    full_name: string;
    description: string;
    default_branch: string;
    private: boolean;
    language: string;
    updated_at: string;
  };
  error?: string;
}
