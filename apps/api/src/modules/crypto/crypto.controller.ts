import { Controller, Get } from '@nestjs/common';
import { CryptoService } from './crypto.service';

@Controller('crypto')
export class CryptoController {
  constructor(private readonly crypto: CryptoService) {}

  // Endpoint público — devuelve la clave pública ECDH del servidor.
  // El cliente la usa para derivar el shared secret AES-256-GCM.
  @Get('pubkey')
  pubkey() {
    return { publicKey: this.crypto.getServerPublicKey() };
  }
}
