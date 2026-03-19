export type JwtScope = 'full' | 'pending_2fa';

export interface JwtPayload {
  sub: string;       // userId
  email: string;
  tenantId: string | null;
  role: string;
  scope: JwtScope;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
