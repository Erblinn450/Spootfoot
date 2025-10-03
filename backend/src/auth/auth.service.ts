import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(private users: UsersService, private jwt: JwtService) {}

  async signup(email: string, password: string) {
    const existing = await this.users.findByEmail(email);
    if (existing) throw new UnauthorizedException('Email déjà utilisé');
    const isAdmin = process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL.toLowerCase() === email.toLowerCase();
    const user = await this.users.createUser(email, password, isAdmin ? ['user', 'admin'] : ['user']);
    const accessToken = await this.signAccess(user);
    return { user, accessToken };
  }

  async login(email: string, password: string) {
    const user = await this.users.verifyPassword(email, password);
    if (!user) throw new UnauthorizedException('Identifiants invalides');
    const accessToken = await this.signAccess(user);
    return { user, accessToken };
  }

  async signAccess(user: { _id: string; email: string; roles: string[] }) {
    const payload = { sub: user._id, email: user.email, roles: user.roles };
    return this.jwt.signAsync(payload);
  }

  // DEV ONLY: bascule le rôle admin pour un utilisateur
  async grantAdmin(userId: string) {
    const updated = await this.users.addRole(userId, 'admin');
    if (!updated) throw new UnauthorizedException('Utilisateur introuvable');
    const accessToken = await this.signAccess({
      _id: userId,
      email: updated.email,
      roles: updated.roles || [],
    });
    return { user: updated, accessToken };
  }

  async revokeAdmin(userId: string) {
    const updated = await this.users.removeRole(userId, 'admin');
    if (!updated) throw new UnauthorizedException('Utilisateur introuvable');
    const accessToken = await this.signAccess({
      _id: userId,
      email: updated.email,
      roles: updated.roles || [],
    });
    return { user: updated, accessToken };
  }
}
