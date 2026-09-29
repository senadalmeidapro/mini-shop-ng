const DEV_PROXY_PREFIX = '/api';

const resolveBaseURL = (): string => {
  if (typeof window === 'undefined') {
    return 'http://localhost:3000';
  }

  const isDevServer = window.location.port === '4200';

  return isDevServer ? DEV_PROXY_PREFIX : 'http://localhost:3000';
};

export const API_CONFIG = {
  baseURL: resolveBaseURL(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
} as const;

export const TOKEN_STORAGE_KEYS = {
  ACCESS: 'access_token',
  REFRESH: 'refresh_token',
} as const;
