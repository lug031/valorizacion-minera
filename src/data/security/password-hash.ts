import { createHash } from 'crypto';

const PREFIX = 'vm-sha256:';

/** Hash local MVP (Node/Jest y herramientas). En dispositivo se usa `password-hash.native.ts`. */
export function hashPasswordSync(password: string): string {
  return PREFIX + createHash('sha256').update(password, 'utf8').digest('hex');
}

export async function hashPassword(password: string): Promise<string> {
  return hashPasswordSync(password);
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const computed = await hashPassword(password);
  return computed === storedHash;
}
