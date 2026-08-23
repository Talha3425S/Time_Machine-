import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GithubService } from './github.service';

@Controller('github')
@UseGuards(AuthGuard('jwt'))
export class GithubController {
  constructor(private readonly githubService: GithubService) {}

  @Post('validate')
  async validateRepository(@Body() body: { owner: string; repo: string }) {
    return this.githubService.validateRepository(body.owner, body.repo);
  }

  @Post('webhook')
  async createWebhook(
    @Body() body: { owner: string; repo: string; webhookUrl: string; secret?: string }
  ) {
    return this.githubService.createWebhook(body.owner, body.repo, body.webhookUrl, body.secret);
  }

  @Get('commits/:owner/:repo')
  async getCommits(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Query('branch') branch?: string
  ) {
    return this.githubService.getRepositoryCommits(owner, repo, branch);
  }

  @Get('branches/:owner/:repo')
  async getBranches(@Param('owner') owner: string, @Param('repo') repo: string) {
    return this.githubService.getRepositoryBranches(owner, repo);
  }

  @Get('file')
  async getFile(
    @Query('owner') owner: string,
    @Query('repo') repo: string,
    @Query('path') path: string,
    @Query('ref') ref?: string
  ) {
    return this.githubService.getFileContent(owner, repo, path, ref);
  }
}
