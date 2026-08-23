import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateGitHubUser(profile: any): Promise<User> {
    const { id, username, emails, photos } = profile;
    
    let user = await this.usersRepository.findOne({ 
      where: { githubId: id.toString() } 
    });

    if (!user) {
      user = this.usersRepository.create({
        githubId: id.toString(),
        username,
        email: emails[0].value,
        avatarUrl: photos[0].value,
        role: 'member',
      });
      await this.usersRepository.save(user);
    } else {
      // Update user info if changed
      user.username = username;
      user.email = emails[0].value;
      user.avatarUrl = photos[0].value;
      await this.usersRepository.save(user);
    }

    return user;
  }

  async login(user: User) {
    const payload = { sub: user.id, username: user.username, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
    };
  }

  async validateUser(userId: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
