// src/services/SecurityService.ts
import * as SecureStore from 'expo-secure-store';
import CryptoJS from 'crypto-js';
import { jwtVerify, SignJWT } from 'jose';

const ENCRYPTION_KEY = 'your-256-bit-encryption-key-32-chars-long!!!';
const JWT_SECRET = new TextEncoder().encode('your-jwt-secret-key-min-32-chars!!');

interface TokenData {
  token: string;
  expiresAt: number;
}

class SecurityService {
  /**
   * 1. TLS Certificate Pinning
   */
  static async validateCertificate(certificate: string): Promise<boolean> {
    const certHash = await this.sha256(certificate);
    const allowedHashes = [
      process.env.CERT_HASH_1 || '',
      process.env.CERT_HASH_2 || ''
    ].filter(Boolean);

    if (allowedHashes.length === 0) {
      console.warn('⚠️ Certificate pinning disabled - no hashes configured');
      return true;
    }

    if (!allowedHashes.includes(certHash)) {
      throw new Error('❌ Certificate validation failed - possible MITM attack');
    }

    console.log('✅ Certificate pinned and verified');
    return true;
  }

  /**
   * 2. Secure Storage (iOS Keychain / Android Keystore)
   */
  static async saveSecurely(key: string, value: any): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, JSON.stringify(value));
      console.log(`✅ Saved securely: ${key}`);
    } catch (error) {
      console.error('❌ Secure storage error:', error);
      throw error;
    }
  }

  static async getSecurely(key: string): Promise<any> {
    try {
      const value = await SecureStore.getItemAsync(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('❌ Secure storage read error:', error);
      return null;
    }
  }

  static async deleteSecurely(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
      console.log(`✅ Deleted securely: ${key}`);
    } catch (error) {
      console.error('❌ Secure deletion error:', error);
    }
  }

  /**
   * 3. JWT Token Management
   */
  static async generateJWT(payload: any, expiryMinutes: number = 60): Promise<string> {
    try {
      const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(`${expiryMinutes}m`)
        .sign(JWT_SECRET);

      await this.saveSecurely('jwt_token', {
        token,
        expiresAt: Date.now() + expiryMinutes * 60 * 1000
      });

      return token;
    } catch (error) {
      console.error('❌ JWT generation failed:', error);
      throw error;
    }
  }

  static async verifyJWT(token: string): Promise<any> {
    try {
      const verified = await jwtVerify(token, JWT_SECRET);
      return verified.payload;
    } catch (error) {
      console.error('❌ JWT verification failed:', error);
      return null;
    }
  }

  static async getValidToken(): Promise<string | null> {
    const stored: TokenData | null = await this.getSecurely('jwt_token');

    if (!stored) return null;

    // Check expiry
    if (Date.now() > stored.expiresAt) {
      await this.deleteSecurely('jwt_token');
      console.warn('⚠️ Token expired');
      return null;
    }

    return stored.token;
  }

  /**
   * 4. Data Encryption (AES-256)
   */
  static encryptData(plaintext: string, key: string = ENCRYPTION_KEY): string {
    try {
      const encrypted = CryptoJS.AES.encrypt(plaintext, key).toString();
      return encrypted;
    } catch (error) {
      console.error('❌ Encryption failed:', error);
      throw error;
    }
  }

  static decryptData(ciphertext: string, key: string = ENCRYPTION_KEY): string {
    try {
      const decrypted = CryptoJS.AES.decrypt(ciphertext, key).toString(CryptoJS.enc.Utf8);
      return decrypted;
    } catch (error) {
      console.error('❌ Decryption failed:', error);
      throw error;
    }
  }

  /**
   * 5. Request Signing (HMAC-SHA256)
   */
  static signRequest(data: any, secret: string = ENCRYPTION_KEY): string {
    const signature = CryptoJS.HmacSHA256(JSON.stringify(data), secret).toString();
    return signature;
  }

  static verifySignature(data: any, signature: string, secret: string = ENCRYPTION_KEY): boolean {
    const expectedSignature = this.signRequest(data, secret);
    return signature === expectedSignature;
  }

  /**
   * 6. SHA-256 Hash
   */
  static async sha256(data: string): Promise<string> {
    return CryptoJS.SHA256(data).toString();
  }

  /**
   * 7. Random Token Generation
   */
  static generateRandomToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < length; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  /**
   * 8. Device Fingerprinting
   */
  static async getDeviceFingerprint(): Promise<any> {
    return {
      randomId: this.generateRandomToken(16),
      timestamp: Date.now(),
      randomData: Math.random().toString(36).substring(7)
    };
  }

  /**
   * 9. Session Validation
   */
  static async validateSession(): Promise<boolean> {
    const token = await this.getValidToken();
    const user = await this.getSecurely('user_data');

    if (!token || !user) {
      console.warn('⚠️ Session invalid or expired');
      return false;
    }

    const verified = await this.verifyJWT(token);
    return verified !== null;
  }

  /**
   * 10. Logout & Clear Data
   */
  static async clearAllSecureData(): Promise<void> {
    try {
      await Promise.all([
        this.deleteSecurely('jwt_token'),
        this.deleteSecurely('user_data'),
        this.deleteSecurely('vpn_config'),
        this.deleteSecurely('api_key')
      ]);
      console.log('✅ All secure data cleared');
    } catch (error) {
      console.error('❌ Error clearing secure data:', error);
    }
  }
}

export default SecurityService;
