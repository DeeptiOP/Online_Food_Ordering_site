import { pbkdf2Sync, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function verifyPassword(password: string, stored: string): boolean {
  if (!stored.includes("$")) return stored === password;

  const [method, salt, encodedHash] = stored.split("$");
  if (!method || !salt || !encodedHash) return false;

  try {
    const expected = Buffer.from(encodedHash, "hex");
    let actual: Buffer;
    if (method.startsWith("scrypt:")) {
      const [, n, r, p] = method.split(":");
      const N = Number(n);
      const blockSize = Number(r);
      const parallelization = Number(p);
      actual = scryptSync(password, salt, expected.length, {
        N,
        r: blockSize,
        p: parallelization,
        maxmem: 128 * 1024 * 1024,
      });
    } else if (method.startsWith("pbkdf2:sha256:")) {
      const iterations = Number(method.split(":")[2]);
      actual = pbkdf2Sync(password, salt, iterations, expected.length, "sha256");
    } else {
      return false;
    }
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const key = scryptSync(password, salt, 64, {
    N: 32768,
    r: 8,
    p: 1,
    maxmem: 128 * 1024 * 1024,
  });
  return `scrypt:32768:8:1$${salt}$${key.toString("hex")}`;
}
