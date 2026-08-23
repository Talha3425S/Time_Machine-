import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Octokit } from 'octokit';

@Injectable()
export class GithubService {
  private octokit: Octokit;

  constructor(private configService: ConfigService) {
    const accessToken = this.configService.get('GITHUB_ACCESS_TOKEN');
    if (accessToken) {
      this.octokit = new Octokit({ auth: accessToken });
    }
  }

  async validateRepository(owner: string, repo: string) {
    if (!this.octokit) {
      throw new Error('GitHub access token not configured');
    }

    try {
      const { data } = await this.octokit.rest.repos.get({
        owner,
        repo,
      });
      return {
        valid: true,
        repository: {
          name: data.name,
          full_name: data.full_name,
          description: data.description,
          default_branch: data.default_branch,
          private: data.private,
          language: data.language,
          updated_at: data.updated_at,
        },
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Repository not found or access denied',
      };
    }
  }

  async createWebhook(owner: string, repo: string, webhookUrl: string, secret?: string) {
    if (!this.octokit) {
      throw new Error('GitHub access token not configured');
    }

    try {
      const { data } = await this.octokit.rest.repos.createWebhook({
        owner,
        repo,
        name: 'web',
        active: true,
        config: {
          url: webhookUrl,
          content_type: 'json',
          secret: secret || '',
          insecure_ssl: '0',
        },
        events: ['push', 'pull_request', 'issues'],
      });

      return {
        success: true,
        webhook: {
          id: data.id,
          url: data.url,
          active: data.active,
          events: data.events,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create webhook',
      };
    }
  }

  async getRepositoryCommits(owner: string, repo: string, branch?: string) {
    if (!this.octokit) {
      throw new Error('GitHub access token not configured');
    }

    try {
      const { data } = await this.octokit.rest.repos.listCommits({
        owner,
        repo,
        sha: branch,
        per_page: 10,
      });

      return data.map(commit => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: commit.commit.author?.name || 'Unknown',
        date: commit.commit.author?.date || new Date().toISOString(),
        url: commit.html_url,
      }));
    } catch (error) {
      throw new NotFoundException('Failed to fetch commits');
    }
  }

  async getRepositoryBranches(owner: string, repo: string) {
    if (!this.octokit) {
      throw new Error('GitHub access token not configured');
    }

    try {
      const { data } = await this.octokit.rest.repos.listBranches({
        owner,
        repo,
        per_page: 100,
      });

      return data.map(branch => ({
        name: branch.name,
        commit: branch.commit.sha,
        protected: branch.protected,
      }));
    } catch (error) {
      throw new NotFoundException('Failed to fetch branches');
    }
  }

  async getFileContent(owner: string, repo: string, path: string, ref?: string) {
    if (!this.octokit) {
      throw new Error('GitHub access token not configured');
    }

    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path,
        ref,
      });

      if ('content' in data && data.content) {
        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        return {
          content,
          encoding: data.encoding,
          size: data.size,
          sha: data.sha,
        };
      }

      return null;
    } catch (error) {
      throw new NotFoundException('File not found');
    }
  }
}
