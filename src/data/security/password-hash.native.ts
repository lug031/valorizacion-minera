import * as Crypto from 'expo-crypto';

const PREFIX = 'vm-sha256:';

export async function hashPassword(password: string): Promise<string> {
  const hex = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password,
    { encoding: Crypto.CryptoEncoding.HEX }
  );
  return PREFIX + hex;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const computed = await hashPassword(password);
  return computed === storedHash;
}
