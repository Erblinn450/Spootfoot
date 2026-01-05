import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthGuard } from '@nestjs/passport';

const isDev = process.env.NODE_ENV !== 'production';

interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const secret = process.env.JWT_SECRET || 'change-me';
    if (isDev) {
      console.log('[JwtStrategy] Using JWT secret:', secret.substring(0, 5) + '...');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: JwtPayload): { userId: string; email: string; roles: string[] } | null {
    if (!payload || !payload.sub) {
      if (isDev) console.error('[JwtStrategy] Invalid payload:', payload);
      return null;
    }
    return { userId: payload.sub, email: payload.email, roles: payload.roles };
  }
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
  
  handleRequest<TUser = { userId: string; email: string; roles: string[] }>(err: Error | null, user: TUser | false): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException('Token invalide ou expiré');
    }
    return user;
  }
}
