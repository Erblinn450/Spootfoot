import { Body, Controller, HttpException, HttpStatus, Post } from '@nestjs/common';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('auth-dev')
@Controller('auth/dev')
export class AuthDevController {
  constructor(private auth: AuthService) {}

  private ensureEnabled() {
    if (process.env.DEV_ADMIN_SWITCH !== '1') {
      throw new HttpException('Disabled', HttpStatus.NOT_FOUND);
    }
  }

  @Post('grant-admin')
  @ApiBody({ schema: { properties: { userId: { type: 'string' } }, required: ['userId'] } })
  @ApiResponse({ status: 200, description: 'Admin role granted; returns new accessToken' })
  async grant(@Body() body: { userId: string }) {
    this.ensureEnabled();
    if (!body?.userId) throw new HttpException('userId required', HttpStatus.BAD_REQUEST);
    return this.auth.grantAdmin(body.userId);
  }

  @Post('revoke-admin')
  @ApiBody({ schema: { properties: { userId: { type: 'string' } }, required: ['userId'] } })
  @ApiResponse({ status: 200, description: 'Admin role revoked; returns new accessToken' })
  async revoke(@Body() body: { userId: string }) {
    this.ensureEnabled();
    if (!body?.userId) throw new HttpException('userId required', HttpStatus.BAD_REQUEST);
    return this.auth.revokeAdmin(body.userId);
  }
}
