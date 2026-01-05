import { Body, Controller, HttpException, HttpStatus, Post } from '@nestjs/common';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

@ApiTags('auth-dev')
@Controller('auth/dev')
export class AuthDevController {
  constructor(private auth: AuthService, private users: UsersService) {}

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

  @Post('reset-password')
  @ApiBody({ schema: { properties: { email: { type: 'string' }, password: { type: 'string', minLength: 6 } }, required: ['email','password'] } })
  @ApiResponse({ status: 200, description: 'Password reset for given email' })
  async resetPassword(@Body() body: { email: string; password: string }) {
    this.ensureEnabled();
    if (!body?.email || !body?.password) throw new HttpException('email and password required', HttpStatus.BAD_REQUEST);
    const updated = await this.users.updatePasswordByEmail(body.email, body.password);
    if (!updated) throw new HttpException('user not found', HttpStatus.NOT_FOUND);
    return { ok: true, email: updated.email };
  }

  @Post('grant-admin-by-email')
  @ApiBody({ schema: { properties: { email: { type: 'string' } }, required: ['email'] } })
  @ApiResponse({ status: 200, description: 'Admin role granted by email; returns new accessToken' })
  async grantByEmail(@Body() body: { email: string }) {
    this.ensureEnabled();
    if (!body?.email) throw new HttpException('email required', HttpStatus.BAD_REQUEST);
    const user = await this.users.findByEmail(body.email);
    if (!user) throw new HttpException('user not found', HttpStatus.NOT_FOUND);
    const granted = await this.users.addRole(user._id.toString(), 'admin');
    if (!granted) throw new HttpException('failed to grant', HttpStatus.INTERNAL_SERVER_ERROR);
    const accessToken = await this.auth.signAccess({ 
      _id: granted._id.toString(), 
      email: granted.email, 
      roles: granted.roles || [] 
    });
    return { user: granted, accessToken };
  }
}
