import { Platform } from 'react-native';
import api, { storage } from './api';
import { ENDPOINTS } from './endpoints';
import { KEYS } from '../constants';

/** Matches native marketing version (Android versionName / iOS 1.0). */
export const PUSH_APP_VERSION = '1.0.0';

export function getPushPlatform() {
  return Platform.OS === 'ios' ? 'ios' : 'android';
}

export function getOrCreateDeviceId() {
  let id = storage.getString(KEYS.DEVICE_ID);
  if (id) {
    return id;
  }
  id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
  storage.set(KEYS.DEVICE_ID, id);
  return id;
}

export function getStoredFcmToken() {
  return storage.getString(KEYS.FCM_TOKEN) ?? null;
}

/**
 * POST /push/register — after login, token refresh, version/account change.
 */
export async function registerCurrentPushToken() {
  const token = getStoredFcmToken();
  const access = storage.getString(KEYS.ACCESS_TOKEN);
  if (!token || !access) {
    return null;
  }

  const response = await api.post(ENDPOINTS.PUSH_REGISTER, {
    token,
    platform: getPushPlatform(),
    device_id: getOrCreateDeviceId(),
    app_version: PUSH_APP_VERSION,
  });
  return response.data;
}

/**
 * DELETE /push/unregister — call before logout when possible. Idempotent.
 */
export async function unregisterCurrentPushToken() {
  const token = getStoredFcmToken();
  if (!token) {
    return null;
  }

  const response = await api.delete(ENDPOINTS.PUSH_UNREGISTER, {
    data: { token },
  });
  return response.data;
}

/**
 * POST /push/test — sends only to this user's registered devices.
 */
export async function sendTestPush(body = {}) {
  const response = await api.post(ENDPOINTS.PUSH_TEST, {
    title: body.title || 'SLife test',
    body: body.body || 'Push notifications are connected.',
    data: body.data || { screen: 'home' },
  });
  return response.data;
}
