import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 32;

// Get encryption key from environment or generate one
const getEncryptionKey = (): Buffer => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }
  return Buffer.from(key, 'hex');
};

// Generate a random key (for initial setup)
export const generateEncryptionKey = (): string => {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
};

// Encrypt data
export const encrypt = (text: string): string => {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipher(ALGORITHM, key);
    cipher.setAAD(Buffer.from('analytics-hub'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Combine iv, tag, and encrypted data
    const result = iv.toString('hex') + tag.toString('hex') + encrypted;
    return Buffer.from(result, 'hex').toString('base64url');
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Encryption failed');
  }
};

// Decrypt data
export const decrypt = (encryptedData: string): string => {
  try {
    const key = getEncryptionKey();
    const buffer = Buffer.from(encryptedData, 'base64url');
    const data = buffer.toString('hex');
    
    // Extract iv, tag, and encrypted data
    const iv = Buffer.from(data.slice(0, IV_LENGTH * 2), 'hex');
    const tag = Buffer.from(data.slice(IV_LENGTH * 2, (IV_LENGTH + TAG_LENGTH) * 2), 'hex');
    const encrypted = data.slice((IV_LENGTH + TAG_LENGTH) * 2);
    
    const decipher = crypto.createDecipher(ALGORITHM, key);
    decipher.setAAD(Buffer.from('analytics-hub'));
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Decryption failed');
  }
};

// Hash data using SHA-256
export const hash = (data: string): string => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

// Hash data with salt
export const hashWithSalt = (data: string, salt?: string): { hash: string; salt: string } => {
  const saltBuffer = salt ? Buffer.from(salt, 'hex') : crypto.randomBytes(SALT_LENGTH);
  const hash = crypto.pbkdf2Sync(data, saltBuffer, 10000, 64, 'sha512').toString('hex');
  return {
    hash,
    salt: saltBuffer.toString('hex'),
  };
};

// Verify hash with salt
export const verifyHash = (data: string, hash: string, salt: string): boolean => {
  try {
    const saltBuffer = Buffer.from(salt, 'hex');
    const computedHash = crypto.pbkdf2Sync(data, saltBuffer, 10000, 64, 'sha512').toString('hex');
    return computedHash === hash;
  } catch (error) {
    return false;
  }
};

// Generate HMAC
export const generateHMAC = (data: string, secret?: string): string => {
  const key = secret || process.env.HMAC_SECRET || 'default-secret';
  return crypto.createHmac('sha256', key).update(data).digest('hex');
};

// Verify HMAC
export const verifyHMAC = (data: string, signature: string, secret?: string): boolean => {
  try {
    const expectedSignature = generateHMAC(data, secret);
    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
  } catch (error) {
    return false;
  }
};

// URL-safe encryption for tokens and IDs
export const encryptUrl = (data: string): string => {
  try {
    const timestamp = Date.now().toString();
    const payload = JSON.stringify({ data, timestamp });
    return encrypt(payload);
  } catch (error) {
    console.error('URL encryption failed:', error);
    throw new Error('URL encryption failed');
  }
};

// URL-safe decryption with expiry check
export const decryptUrl = (encryptedData: string, maxAge: number = 3600000): string => {
  try {
    const payload = decrypt(encryptedData);
    const { data, timestamp } = JSON.parse(payload);
    
    // Check if token has expired
    if (Date.now() - parseInt(timestamp) > maxAge) {
      throw new Error('Token has expired');
    }
    
    return data;
  } catch (error) {
    console.error('URL decryption failed:', error);
    throw new Error('URL decryption failed');
  }
};

// Generate secure random token
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

// Generate URL-safe token
export const generateUrlSafeToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('base64url');
};

// Generate UUID v4
export const generateUUID = (): string => {
  return crypto.randomUUID();
};

// Encrypt object data
export const encryptObject = (obj: any): string => {
  try {
    const jsonString = JSON.stringify(obj);
    return encrypt(jsonString);
  } catch (error) {
    console.error('Object encryption failed:', error);
    throw new Error('Object encryption failed');
  }
};

// Decrypt object data
export const decryptObject = <T = any>(encryptedData: string): T => {
  try {
    const jsonString = decrypt(encryptedData);
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('Object decryption failed:', error);
    throw new Error('Object decryption failed');
  }
};

// Create signed URL with expiration
export const createSignedUrl = (
  baseUrl: string,
  params: Record<string, string>,
  expiresIn: number = 3600000 // 1 hour
): string => {
  try {
    const expiry = Date.now() + expiresIn;
    const urlParams = new URLSearchParams({
      ...params,
      expires: expiry.toString(),
    });
    
    const dataToSign = `${baseUrl}?${urlParams.toString()}`;
    const signature = generateHMAC(dataToSign);
    
    urlParams.append('signature', signature);
    
    return `${baseUrl}?${urlParams.toString()}`;
  } catch (error) {
    console.error('Signed URL creation failed:', error);
    throw new Error('Signed URL creation failed');
  }
};

// Verify signed URL
export const verifySignedUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    const signature = urlObj.searchParams.get('signature');
    const expires = urlObj.searchParams.get('expires');
    
    if (!signature || !expires) {
      return false;
    }
    
    // Check expiration
    if (Date.now() > parseInt(expires)) {
      return false;
    }
    
    // Remove signature from URL for verification
    urlObj.searchParams.delete('signature');
    const dataToVerify = urlObj.toString();
    
    return verifyHMAC(dataToVerify, signature);
  } catch (error) {
    console.error('Signed URL verification failed:', error);
    return false;
  }
};

// Encrypt file content
export const encryptFile = async (filePath: string, outputPath: string): Promise<void> => {
  try {
    const fs = await import('fs/promises');
    const content = await fs.readFile(filePath, 'utf8');
    const encrypted = encrypt(content);
    await fs.writeFile(outputPath, encrypted);
  } catch (error) {
    console.error('File encryption failed:', error);
    throw new Error('File encryption failed');
  }
};

// Decrypt file content
export const decryptFile = async (filePath: string, outputPath: string): Promise<void> => {
  try {
    const fs = await import('fs/promises');
    const encryptedContent = await fs.readFile(filePath, 'utf8');
    const decrypted = decrypt(encryptedContent);
    await fs.writeFile(outputPath, decrypted);
  } catch (error) {
    console.error('File decryption failed:', error);
    throw new Error('File decryption failed');
  }
};

// Key derivation function
export const deriveKey = (password: string, salt: string, iterations: number = 10000): Buffer => {
  return crypto.pbkdf2Sync(password, salt, iterations, KEY_LENGTH, 'sha256');
};

// Generate key pair for asymmetric encryption
export const generateKeyPair = (): { publicKey: string; privateKey: string } => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });
  
  return { publicKey, privateKey };
};

// RSA encryption
export const encryptRSA = (data: string, publicKey: string): string => {
  try {
    const encrypted = crypto.publicEncrypt(publicKey, Buffer.from(data, 'utf8'));
    return encrypted.toString('base64');
  } catch (error) {
    console.error('RSA encryption failed:', error);
    throw new Error('RSA encryption failed');
  }
};

// RSA decryption
export const decryptRSA = (encryptedData: string, privateKey: string): string => {
  try {
    const decrypted = crypto.privateDecrypt(privateKey, Buffer.from(encryptedData, 'base64'));
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('RSA decryption failed:', error);
    throw new Error('RSA decryption failed');
  }
};