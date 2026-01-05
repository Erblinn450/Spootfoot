import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.strategy';
import { IsEmail, IsString, MinLength } from 'class-validator';

class AuthDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    roles: string[];
  };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('signup')
  @ApiBody({ type: AuthDto })
  async signup(@Body() body: AuthDto) {
    return this.auth.signup(body.email, body.password);
  }

  @Post('login')
  @ApiBody({ type: AuthDto })
  async login(@Body() body: AuthDto) {
    return this.auth.login(body.email, body.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: AuthenticatedRequest) {
    return { userId: req.user.userId, email: req.user.email, roles: req.user.roles };
  }
}
