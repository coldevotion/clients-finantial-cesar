import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request, Response, NextFunction } from 'express';
import type { JwtPayload } from '../../modules/auth/jwt.types';

export interface RequestWithTenant extends Request {
  tenantId: string;
  userId: string;
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly jwt: JwtService) {}

  use(req: RequestWithTenant, _res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing authorization token');
    }

    const token = authHeader.slice(7);

    try {
      const payload = this.jwt.verify(token, {
        secret: process.env.JWT_SECRET ?? 'changeme',
      }) as JwtPayload;

      if (payload.scope !== 'full') {
        throw new UnauthorizedException('Token scope insufficient');
      }

      if (!payload.tenantId) {
        throw new UnauthorizedException('No tenant associated with this account');
      }

      req.tenantId = payload.tenantId;
      req.userId = payload.sub;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    next();
  }
}
