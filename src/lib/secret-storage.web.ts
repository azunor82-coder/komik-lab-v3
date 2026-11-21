import AsyncStorage from '@react-native-async-storage/async-storage';

// Web preview: there is no secure keystore in the browser, so keys are kept in
// this browser's local storage only.

export function getSecret(key: string): Promise<string | null> {
  return AsyncStorage.getItem(key);
}

export async function setSecret(key: string, value: string | null): Promise<void> {
  if (value) await AsyncStorage.setItem(key, value);
  else await AsyncStorage.removeItem(key);
}
