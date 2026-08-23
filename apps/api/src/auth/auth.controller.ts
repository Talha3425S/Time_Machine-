import { Controller, Get, UseGuards, Request, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubAuth() {
    // Initiates GitHub OAuth flow
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubAuthCallback(@Request() req: any, @Res() res: Response) {
    const result = await this.authService.login(req.user);
    
    // Redirect to frontend with token and user data
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3002';
    const redirectUrl = `${frontendUrl}/auth/callback?token=${result.access_token}&user=${encodeURIComponent(JSON.stringify(result.user))}`;
    
    return res.redirect(redirectUrl);
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@Request() req: any) {
    return req.user;
  }
}
