import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const DEFAULT_KEY = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default_insecure_dev_key', 'salt', 32);

export interface EncryptedData {
  encrypted: string;
  iv: string;
  authTag?: string; // We can append auth tag to the encrypted string for simplicity, or just store it separately. Let's append it to encrypted string.
}

export class EncryptionService {
  /**
   * Encrypts plaintext string using AES-256-GCM.
   * Returns iv and ciphertext combined with auth tag.
   */
  public static encrypt(text: string): EncryptedData {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, DEFAULT_KEY, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    
    return {
      encrypted: `${encrypted}:${authTag}`,
      iv: iv.toString('hex')
    };
  }

  /**
   * Decrypts AES-256-GCM encrypted string given ciphertext and iv.
   */
  public static decrypt(encryptedText: string, ivHex: string): string {
    const [encrypted, authTag] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, DEFAULT_KEY, iv);
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
