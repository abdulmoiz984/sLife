/**
 * Legacy AsyncStorage helpers — prefer MMKV `storage` from `src/api/api.js`
 * (ClayMaster pattern) for tokens and session data.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export const asyncStorage = {
  getItem: key => AsyncStorage.getItem(key),
  set: (key, value) => AsyncStorage.setItem(key, String(value)),
  remove: key => AsyncStorage.removeItem(key),
};
