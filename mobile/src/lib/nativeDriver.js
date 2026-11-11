import { Platform } from 'react-native';

/**
 * Native driver nije dostupan na webu (nema RCTAnimation) —
 * tamo koristimo JS animacije bez konzolnog upozorenja.
 */
export const USE_NATIVE_DRIVER = Platform.OS !== 'web';
