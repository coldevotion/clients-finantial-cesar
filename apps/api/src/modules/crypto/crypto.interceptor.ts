import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CryptoService } from './crypto.service';

@Injectable()
export class CryptoInterceptor implements NestInterceptor {
  constructor(private readonly crypto: CryptoService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const clientKey = (req.headers as Record<string, string | undefined>)['x-client-key'];

    // Sin header → respuesta en claro (rutas excluidas o clientes sin crypto)
    if (!clientKey) return next.handle();

    let aesKey: Buffer;
    try {
      aesKey = this.crypto.deriveSessionKey(clientKey);
    } catch {
      return next.handle();
    }

    // Cifra la respuesta YA envuelta por ResponseInterceptor ({ data: ... })
    return next.handle().pipe(
      map((responseData) => this.crypto.encrypt(aesKey, responseData)),
    );
  }
}
