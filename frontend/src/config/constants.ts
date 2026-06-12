import { Platform } from 'react-native';

const ENV_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const LOCAL_HOST = Platform.select({
  android: 'http://10.0.2.2:8000',
  ios: 'http://localhost:8000',
  default: 'http://localhost:8000',
});

const BASE_URL = ENV_BASE_URL || LOCAL_HOST;

export const API_BASE_URL = `${BASE_URL}/api`;
export const STATIC_BASE_URL = BASE_URL;

export const APP_VERSION = '1.0.0';
export const SUPPORT_EMAIL = 'support@dermscreen.org';
