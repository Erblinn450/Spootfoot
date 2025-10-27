import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const secret = process.env.JWT_SECRET || 'change-me';
    console.log('[JwtStrategy] Using JWT secret:', secret.substring(0, 5) + '...');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    // payload: { sub, email, roles }
    console.log('[JwtStrategy] validate called with payload:', JSON.stringify(payload));
    if (!payload || !payload.sub) {
      console.error('[JwtStrategy] Invalid payload:', payload);
      return null;
    }
    console.log('[JwtStrategy] Returning user:', { sub: payload.sub, email: payload.email, roles: payload.roles });
    return { userId: payload.sub, email: payload.email, roles: payload.roles };
  }
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    console.log('[JwtAuthGuard] Auth header:', authHeader ? `Bearer ${authHeader.substring(7, 20)}...` : 'MISSING');
    return super.canActivate(context);
  }
  handleRequest(err: any, user: any) {
    console.log('[JwtAuthGuard] handleRequest:', { err: err?.message, user: user?.email || 'NO_USER' });
    if (err || !user) {
      throw err || new UnauthorizedException('Token invalide ou expiré');
    }
    return user;
  }
}
