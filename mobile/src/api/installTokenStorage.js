import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { setTokenStorage } from './token.js';

/**
 * Native: JWT in hardware-backed SecureStore (not plain AsyncStorage).
 * Web: keep localStorage via token.js default (Metro / browser preview).
 */
export function installNativeTokenStorage() {
  if (Platform.OS === 'web') return;

  setTokenStorage({
    async getItem(key) {
      return SecureStore.getItemAsync(key);
    },
    async setItem(key, value) {
      await SecureStore.setItemAsync(key, value);
    },
    async removeItem(key) {
      await SecureStore.deleteItemAsync(key);
    },
  });
}
