import { HttpErrorResponse } from '@angular/common/http';

export class ApiError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Non autorisé') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Accès refusé') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Ressource introuvable') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends ApiError {
  readonly fields: string[];

  constructor(messages: string | string[], statusCode = 422) {
    const fields = Array.isArray(messages) ? messages : [messages];
    super(fields.join(', '), statusCode);
    this.name = 'ValidationError';
    this.fields = fields;
  }
}

export class NetworkError extends ApiError {
  constructor(message = 'Erreur réseau — vérifiez votre connexion') {
    super(message, 0);
    this.name = 'NetworkError';
  }
}

function extractMessages(body: unknown): string | string[] {
  if (typeof body === 'string' && body.trim()) {
    return body;
  }

  if (body && typeof body === 'object') {
    const payload = body as { message?: unknown; error?: unknown };

    for (const candidate of [payload.message, payload.error]) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate;
      }
      if (Array.isArray(candidate) && candidate.length) {
        return candidate.map(String);
      }
    }
  }

  return 'Une erreur est survenue';
}

export function parseApiError(response: HttpErrorResponse): ApiError {
  if (response.status === 0) {
    return new NetworkError();
  }

  const message = extractMessages(response.error);

  switch (response.status) {
    case 401:
      return new UnauthorizedError(Array.isArray(message) ? message[0] : message);
    case 403:
      return new ForbiddenError(Array.isArray(message) ? message[0] : message);
    case 404:
      return new NotFoundError(Array.isArray(message) ? message[0] : message);
    case 400:
    case 422:
      return new ValidationError(message, response.status);
    default:
      return new ApiError(Array.isArray(message) ? message.join(', ') : message, response.status);
  }
}

export function toApiError(error: unknown, fallback = 'Une erreur est survenue'): ApiError {
  if (error instanceof HttpErrorResponse) {
    return parseApiError(error);
  }
  if (error instanceof ApiError) {
    return error;
  }
  return new ApiError(fallback, 0);
}
