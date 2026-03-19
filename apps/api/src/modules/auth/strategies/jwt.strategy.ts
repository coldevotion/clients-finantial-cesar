import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { prisma } from '@wa/database';
import type { JwtPayload } from '../jwt.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret') ?? process.env.JWT_SECRET ?? 'changeme',
    });
  }

  async validate(payload: JwtPayload) {
    if (payload.scope !== 'full') {
      throw new UnauthorizedException('Token scope insufficient');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, tenantId: true, isEmailVerified: true },
    });

    if (!user) throw new UnauthorizedException('User not found');

    return user; // se inyecta en req.user
  }
}
