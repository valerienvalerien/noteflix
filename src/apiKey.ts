import * as SecureStore from "expo-secure-store";

const KEY = "anthropic_api_key";

export async function getApiKey(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(KEY);
  } catch {
    return null;
  }
}

export async function setApiKey(value: string): Promise<void> {
  const trimmed = value.trim();
  if (!trimmed) {
    await SecureStore.deleteItemAsync(KEY);
    return;
  }
  await SecureStore.setItemAsync(KEY, trimmed);
}

export async function hasApiKey(): Promise<boolean> {
  return Boolean(await getApiKey());
}
