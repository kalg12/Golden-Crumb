const SESSION_SECRET = process.env.SESSION_SECRET || 'golden-crumb-super-secret-session-key-32-chars';

/**
 * Hashing a password using PBKDF2 (SHA-256) with Web Crypto API.
 * This is 100% compatible with Next.js Edge Middleware and Node.js.
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const salt = encoder.encode('golden_crumb_salt_key');

  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  const exportedKey = await crypto.subtle.exportKey('raw', derivedKey);
  const hashArray = Array.from(new Uint8Array(exportedKey));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computedHash = await hashPassword(password);
  return computedHash === hash;
}

/**
 * Base64URL encoding/decoding helpers
 */
function base64urlEncode(arr: Uint8Array): string {
  let bin = '';
  const len = arr.byteLength;
  for (let i = 0; i < len; i++) {
    bin += String.fromCharCode(arr[i]);
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64urlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const bin = atob(base64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    arr[i] = bin.charCodeAt(i);
  }
  return arr;
}

/**
 * Signs a payload using HMAC SHA-256 and returns a JWT token string.
 */
export async function signToken(payload: Record<string, unknown>): Promise<string> {
  const encoder = new TextEncoder();
  const secretKeyBuffer = encoder.encode(SESSION_SECRET);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    secretKeyBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const header = { alg: 'HS256', typ: 'JWT' };
  const serializedHeader = base64urlEncode(encoder.encode(JSON.stringify(header)));
  const serializedPayload = base64urlEncode(encoder.encode(JSON.stringify(payload)));

  const signatureInput = `${serializedHeader}.${serializedPayload}`;
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    encoder.encode(signatureInput)
  );

  const signature = base64urlEncode(new Uint8Array(signatureBuffer));
  return `${signatureInput}.${signature}`;
}

/**
 * Verifies a JWT token string and returns the payload if signature is valid.
 */
export async function verifyToken(token: string): Promise<Record<string, unknown> | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [serializedHeader, serializedPayload, signature] = parts;
  const encoder = new TextEncoder();
  const secretKeyBuffer = encoder.encode(SESSION_SECRET);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    secretKeyBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const signatureInput = `${serializedHeader}.${serializedPayload}`;
  const signatureBytes = base64urlDecode(signature);
  const signatureInputBytes = encoder.encode(signatureInput);

  const isValid = await crypto.subtle.verify(
    'HMAC',
    cryptoKey,
    signatureBytes as unknown as BufferSource,
    signatureInputBytes
  );

  if (!isValid) return null;

  const decoder = new TextDecoder();
  const decodedPayload = JSON.parse(decoder.decode(base64urlDecode(serializedPayload)));

  // Check expiration if 'exp' is present (in seconds)
  if (decodedPayload.exp && typeof decodedPayload.exp === 'number') {
    const currentSecs = Math.floor(Date.now() / 1000);
    if (currentSecs > decodedPayload.exp) {
      return null; // Expired!
    }
  }

  return decodedPayload as Record<string, unknown>;
}
