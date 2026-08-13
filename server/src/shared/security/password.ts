import * as crypto from 'crypto';

const KEY_LEN = 64;
const SALT_LEN = 16;
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 };

export class PasswordService {
  public static hash(password: string): string {
    const salt = crypto.randomBytes(SALT_LEN);
    const derived = crypto.scryptSync(password, salt, KEY_LEN, SCRYPT_PARAMS);
    return `${salt.toString('hex')}:${derived.toString('hex')}`;
  }

  public static verify(password: string, stored: string): boolean {
    const [saltHex, hashHex] = stored.split(':');
    if (!saltHex || !hashHex) return false;
    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(hashHex, 'hex');
    const actual = crypto.scryptSync(password, salt, expected.length, SCRYPT_PARAMS);
    return crypto.timingSafeEqual(actual, expected);
  }
}