import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

export type SavedLogin = { id: string; origin: string; username: string; password: string; createdAt: number };
const KEY = 'nova.password-vault.v1';

export async function authenticateVault(): Promise<boolean> {
  const available = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  if (!available || !enrolled) return false;
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Unlock NOVA passwords',
    cancelLabel: 'Cancel',
    disableDeviceFallback: false
  });
  return result.success;
}
export async function readVault(): Promise<SavedLogin[]> {
  const raw = await SecureStore.getItemAsync(KEY, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
  if (!raw) return [];
  try { const value = JSON.parse(raw); return Array.isArray(value) ? value : []; } catch { return []; }
}
export async function saveLogin(login: SavedLogin): Promise<void> {
  const entries = await readVault();
  const next = [login, ...entries.filter(x => x.origin !== login.origin || x.username !== login.username)];
  await SecureStore.setItemAsync(KEY, JSON.stringify(next), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY
  });
}
export async function deleteLogin(id: string): Promise<void> {
  const entries = await readVault();
  await SecureStore.setItemAsync(KEY, JSON.stringify(entries.filter(x => x.id !== id)), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY
  });
}
