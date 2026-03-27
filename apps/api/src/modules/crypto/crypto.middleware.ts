import { Injectable, NestMiddleware, BadRequestException, UnauthorizedException } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { CryptoService } from './crypto.service';

@Injectable()
export class CryptoMiddleware implements NestMiddleware {
  constructor(private readonly crypto: CryptoService) {}

  use(req: Request, _res: Response, next: NextFunction) {
    const clientKey = req.headers['x-client-key'] as string | undefined;

    // Sin header → request no cifrado, pasar sin tocar (rutas excluidas: auth, webhooks, crypto)
    if (!clientKey) return next();

    // GET / DELETE / HEAD no traen body → solo verificar que el header esté presente
    // El CryptoInterceptor cifrará la respuesta igualmente
    const hasEncryptedBody =
      req.body &&
      typeof req.body === 'object' &&
      'iv' in req.body &&
      'data' in req.body &&
      typeof (req.body as Record<string, unknown>).iv === 'string' &&
      typeof (req.body as Record<string, unknown>).data === 'string';

    if (!hasEncryptedBody) return next();

    try {
      const aesKey = this.crypto.deriveSessionKey(clientKey);
      req.body = this.crypto.decrypt(aesKey, req.body as { iv: string; data: string });
    } catch {
      // La clave derivada no coincide → el servidor fue reiniciado y el cliente
      // tiene un keypair viejo. El cliente detecta SESSION_INVALID y renegocia.
      throw new UnauthorizedException({ code: 'SESSION_INVALID', message: 'Crypto session expired — please re-establish session' });
    }

    next();
  }
}
