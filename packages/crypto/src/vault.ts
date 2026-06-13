/** Matches production secretlayer.net: PBKDF2-SHA256 + AES-GCM-256 */

export const PBKDF2_ITERATIONS = 210_000;

export interface VaultItemPlaintext {
  id: string;
  projectId?: string;
  secretName: string;
  providerName?: string;
  secret: string;
  vaultLabel?: string;
  vaultContent?: string;
  notes?: string;
  updatedAt: string;
}

export interface EncryptedBlob {
  version: 1;
  kdf: "PBKDF2-SHA256";
  iterations: number;
  salt: string;
  iv: string;
  cipherText: string;
  updatedAt: string;
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

function saltFromEmail(email: string): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(`secretlayer:${email.toLowerCase()}`) as Uint8Array<ArrayBuffer>;
}

function bytes(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  return new Uint8Array(bytes) as Uint8Array<ArrayBuffer>;
}

export async function deriveVaultKey(password: string, email: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const base = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: saltFromEmail(email), iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptVaultItem(
  password: string,
  email: string,
  item: VaultItemPlaintext,
): Promise<EncryptedBlob> {
  const salt = bytes(crypto.getRandomValues(new Uint8Array(16)));
  const iv = bytes(crypto.getRandomValues(new Uint8Array(12)));
  const enc = new TextEncoder();
  const base = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
  const payload = enc.encode(JSON.stringify(item));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, payload);
  return {
    version: 1,
    kdf: "PBKDF2-SHA256",
    iterations: PBKDF2_ITERATIONS,
    salt: toBase64(salt),
    iv: toBase64(iv),
    cipherText: toBase64(new Uint8Array(cipher)),
    updatedAt: item.updatedAt,
  };
}

export async function decryptVaultItem(
  password: string,
  blob: EncryptedBlob,
): Promise<VaultItemPlaintext> {
  if (blob.version !== 1 || blob.kdf !== "PBKDF2-SHA256") {
    throw new Error("Unsupported vault format");
  }
  const enc = new TextEncoder();
  const salt = bytes(fromBase64(blob.salt));
  const iv = bytes(fromBase64(blob.iv));
  const cipherText = bytes(fromBase64(blob.cipherText));
  const base = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: blob.iterations, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    cipherText as BufferSource,
  );
  return JSON.parse(new TextDecoder().decode(plain)) as VaultItemPlaintext;
}

export function isEncryptedBlob(value: unknown): value is EncryptedBlob {
  if (!value || typeof value !== "object") return false;
  const b = value as EncryptedBlob;
  return (
    b.version === 1 &&
    b.kdf === "PBKDF2-SHA256" &&
    typeof b.salt === "string" &&
    typeof b.iv === "string" &&
    typeof b.cipherText === "string"
  );
}
