import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  getItem: key => AsyncStorage.getItem(key),
  set: (key, value) => AsyncStorage.setItem(key, String(value)),
  remove: key => AsyncStorage.removeItem(key),
};
