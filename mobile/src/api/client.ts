import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { DEFAULT_API_BASE_URL, normaliseBaseUrl, REQUEST_TIMEOUT_MS } from '../config';
import { ApiEnvelope } from '../types';

type TokenGetter = () => { accessToken: string | null; refreshToken: string | null };
type TokenSetter = (tokens: { accessToken: string; refreshToken: string }) => void;
type SessionExpiredHandler = () => void;

let getTokens: TokenGetter = () => ({ accessToken: null, refreshToken: null });
let onTokensRefreshed: TokenSetter = () => {};
let onSessionExpired: SessionExpiredHandler = () => {};

let baseUrl = DEFAULT_API_BASE_URL;

export const api = axios.create({
  baseURL: baseUrl,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

export function setApiBaseUrl(url: string): string {
  baseUrl = normaliseBaseUrl(url);
  api.defaults.baseURL = baseUrl;
  return baseUrl;
}

export function getApiBaseUrl(): string {
  return baseUrl;
}

export function configureApiClient(options: {
  getTokens: TokenGetter;
  onTokensRefreshed: TokenSetter;
  onSessionExpired: SessionExpiredHandler;
}) {
  getTokens = options.getTokens;
  onTokensRefreshed = options.onTokensRefreshed;
  onSessionExpired = options.onSessionExpired;
}

export async function pingServer(url: string): Promise<{ ok: boolean; message: string }> {
  const target = normaliseBaseUrl(url);

  try {
    const response = await axios.get(target + '/health', { timeout: 30000 });

    if (response.data?.data?.status === 'ok') {
      return { ok: true, message: 'Connected to ' + target };
    }

    return { ok: false, message: 'That server answered but is not the To-Do API' };
  } catch (error) {
    return { ok: false, message: readErrorMessage(error, 'Could not reach ' + target) };
  }
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const { accessToken } = getTokens();

  if (accessToken && config.headers) {
    config.headers.Authorization = 'Bearer ' + accessToken;
  }

  return config;
});

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken } = getTokens();
  if (!refreshToken) return null;

  try {
    const response = await axios.post(
      baseUrl + '/auth/refresh',
      { refreshToken },
      { timeout: REQUEST_TIMEOUT_MS, headers: { 'Content-Type': 'application/json' } },
    );

    const data = response.data?.data;
    if (!data?.accessToken || !data?.refreshToken) return null;

    onTokensRefreshed({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    return data.accessToken as string;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retried?: boolean }) | undefined;
    const status = error.response?.status;
    const isAuthCall = original?.url?.includes('/auth/');

    if (status !== 401 || !original || original._retried || isAuthCall) {
      return Promise.reject(error);
    }

    original._retried = true;

    if (!refreshInFlight) {
      refreshInFlight = refreshAccessToken().finally(() => {
        refreshInFlight = null;
      });
    }

    const token = await refreshInFlight;

    if (!token) {
      onSessionExpired();
      return Promise.reject(error);
    }

    original.headers = { ...(original.headers ?? {}), Authorization: 'Bearer ' + token };
    return api.request(original);
  },
);

export function readErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  const axiosError = error as AxiosError<ApiEnvelope<unknown>>;

  if (axiosError?.response?.data) {
    const body = axiosError.response.data;
    if (body.details?.length) return body.details[0].message;
    if (body.message) return body.message;
  }

  if (axiosError?.code === 'ECONNABORTED')
    return 'The server took too long. A free host may be waking up, try again.';
  if (axiosError?.message === 'Network Error') return 'Cannot reach the server. Check the address.';

  return fallback;
}
