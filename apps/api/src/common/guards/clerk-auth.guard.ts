import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization as string | undefined;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing Bearer token');
    }

    // TODO: verify JWT with Clerk SDK (@clerk/backend)
    // const { verifyToken } = await import('@clerk/backend');
    // const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
    // request.user = payload;

    return true;
  }
}
