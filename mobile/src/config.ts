import { NativeModules, Platform } from 'react-native';

const HOSTED_API_URL = 'https://momentum-api-9osq.onrender.com/api';
const LAN_HOST = '192.168.1.3';
const EMULATOR_HOST = '10.0.2.2';
const PORT = 4000;

function metroHost(): string | null {
  const scriptURL: string | undefined = NativeModules?.SourceCode?.getConstants?.().scriptURL;
  if (!scriptURL) return null;

  const afterScheme = scriptURL.split('://')[1];
  if (!afterScheme) return null;

  const host = afterScheme.split('/')[0].split(':')[0];
  return host || null;
}

function resolveHost(): string {
  const fromMetro = metroHost();
  if (fromMetro && fromMetro !== 'localhost' && fromMetro !== '127.0.0.1') {
    return fromMetro;
  }

  return Platform.OS === 'android' ? EMULATOR_HOST : LAN_HOST;
}

export const DEFAULT_API_BASE_URL = __DEV__
  ? 'http://' + resolveHost() + ':' + PORT + '/api'
  : HOSTED_API_URL;

export const REQUEST_TIMEOUT_MS = 30000;

export function normaliseBaseUrl(raw: string): string {
  let value = raw.trim();
  if (!value) return DEFAULT_API_BASE_URL;

  if (!value.startsWith('http://') && !value.startsWith('https://')) {
    value = 'http://' + value;
  }

  while (value.endsWith('/')) {
    value = value.slice(0, -1);
  }

  if (!value.endsWith('/api')) {
    value = value + '/api';
  }

  return value;
}
