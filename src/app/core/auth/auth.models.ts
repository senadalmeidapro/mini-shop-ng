import type { Role, User } from '../models';

export type { Role, User };

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends AuthTokens {
  user: User;
}

export interface JwtPayload {
  sub?: string;
  role?: Role;
  exp?: number;
}

export interface RegisterDto {
  email: string;
  password: string;
  fullName?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}
