// src/security.ts
import crypto from "crypto";
import "dotenv/config";

const KEY_B64 = process.env.SECRET_KEY;
const IV_B64 = process.env.IV;

if (!KEY_B64 || !IV_B64) {
  throw new Error("Missing SECRET_KEY or IV in environment");
}

function getKeyIv() {
  const key = Buffer.from(KEY_B64, "base64"); // 32 bytes
  const iv = Buffer.from(IV_B64, "base64");   // 12 หรือ 16 bytes
  if (key.length !== 32) throw new Error("SECRET_KEY must be 32 bytes (base64)");
  if (iv.length !== 12 && iv.length !== 16) throw new Error("IV must be 12 or 16 bytes (base64)");
  return { key, iv };
}

export function encryptJSON(obj: any): string {
  const { key, iv } = getKeyIv();
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(JSON.stringify(obj), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString("base64");
}

export function decryptJSON(b64: string): any {
  const { key } = getKeyIv();
  const raw = Buffer.from(b64, "base64");
  const iv = raw.subarray(0, 12);   // ถ้า iv 16 bytes ให้เปลี่ยนเป็น 16
  const tag = raw.subarray(12, 28);
  const ct = raw.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return JSON.parse(pt.toString("utf8"));
}
