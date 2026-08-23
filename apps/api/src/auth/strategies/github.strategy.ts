import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get('GITHUB_CLIENT_ID', 'placeholder'),
      clientSecret: configService.get('GITHUB_CLIENT_SECRET', 'placeholder'),
      callbackURL: configService.get('GITHUB_CALLBACK_URL', 'http://localhost:3001/auth/github/callback'),
      scope: ['user:email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    const user = await this.authService.validateGitHubUser(profile);
    user.accessToken = accessToken;
    return user;
  }
}
