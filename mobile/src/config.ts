import { NativeModules, Platform } from 'react-native';

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
  if (!__DEV__) return LAN_HOST;

  const fromMetro = metroHost();
  if (fromMetro && fromMetro !== 'localhost' && fromMetro !== '127.0.0.1') {
    return fromMetro;
  }

  return Platform.OS === 'android' ? EMULATOR_HOST : 'localhost';
}

export const DEFAULT_API_BASE_URL = 'http://' + resolveHost() + ':' + PORT + '/api';

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
