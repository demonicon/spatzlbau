// AES-256-GCM for backup files. The key is derived from BACKUP_KEY (any passphrase) with scrypt.
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

const SALT = 'spatzlbau-backup-v1';
const keyFrom = (passphrase) => scryptSync(String(passphrase), SALT, 32);

export function encrypt(text, passphrase) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', keyFrom(passphrase), iv);
  const data = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return { format: 'spatzlbau-backup-enc', v: 1, alg: 'aes-256-gcm', iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), data: data.toString('base64') };
}

export function decrypt(envelope, passphrase) {
  if (envelope.format !== 'spatzlbau-backup-enc') throw new Error('not an encrypted backup');
  const decipher = createDecipheriv('aes-256-gcm', keyFrom(passphrase), Buffer.from(envelope.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(envelope.tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(envelope.data, 'base64')), decipher.final()]).toString('utf8');
}
