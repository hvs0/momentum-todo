import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_API_BASE_URL, normaliseBaseUrl } from '../config';

const KEY = 'todo.serverUrl.v1';

export async function loadServerUrl(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(KEY);
    return stored ? normaliseBaseUrl(stored) : DEFAULT_API_BASE_URL;
  } catch {
    return DEFAULT_API_BASE_URL;
  }
}

export async function saveServerUrl(url: string): Promise<string> {
  const value = normaliseBaseUrl(url);
  await AsyncStorage.setItem(KEY, value);
  return value;
}

export async function clearServerUrl(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
