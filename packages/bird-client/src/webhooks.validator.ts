import { createHmac, timingSafeEqual } from 'crypto';

export function validateBirdWebhookSignature(
  rawBody: Buffer,
  signatureHeader: string,
  secret: string,
): boolean {
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');

  try {
    return timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(signatureHeader.replace('sha256=', ''), 'hex'),
    );
  } catch {
    return false;
  }
}
