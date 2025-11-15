// src/services/CryptoService.ts
import CryptoJS from 'crypto-js';
import SecurityService from './SecurityService';

const SHARED_KEY = '0123456789abcdef0123456789abcdef';
const NONCE_SIZE = 12;

class CryptoService {
  /**
   * ChaCha20-Poly1305 Encryption (using AES as fallback in React Native)
   */
  static encrypt(plaintext: string): string {
    try {
      const encrypted = CryptoJS.AES.encrypt(plaintext, SHARED_KEY).toString();
      return encrypted;
    } catch (error) {
      console.error('❌ Encryption error:', error);
      throw error;
    }
  }

  static decrypt(ciphertext: string): string {
    try {
      const decrypted = CryptoJS.AES.decrypt(ciphertext, SHARED_KEY);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('❌ Decryption error:', error);
      throw error;
    }
  }

  /**
   * Random Padding for Traffic Obfuscation
   */
  static addRandomPadding(data: string): string {
    const paddingSize = Math.floor(Math.random() * 91) + 10;
    const padding = Array(paddingSize)
      .fill(0)
      .map(() => Math.random().toString(36)[2])
      .join('');

    const paddingHeader = String.fromCharCode(
      (paddingSize >> 8) & 0xff,
      paddingSize & 0xff
    );

    return paddingHeader + padding + data;
  }

  static removeRandomPadding(data: string): string {
    if (data.length < 2) return data;
    
    const paddingSize = (data.charCodeAt(0) << 8) | data.charCodeAt(1);
    
    if (data.length < 2 + paddingSize) return data;
    
    return data.slice(2 + paddingSize);
  }

  /**
   * Timing Obfuscation
   */
  static getRandomDelay(): number {
    return Math.floor(Math.random() * 41) + 10;
  }

  static async delayRandomly(): Promise<void> {
    const delay = this.getRandomDelay();
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Encrypt & Obfuscate Message
   */
  static async prepareMessage(message: any): Promise<string> {
    // Convert to JSON
    const json = JSON.stringify(message);

    // Encrypt
    const encrypted = this.encrypt(json);

    // Add padding
    const padded = this.addRandomPadding(encrypted);

    // Add timing delay
    await this.delayRandomly();

    return padded;
  }

  /**
   * Decrypt & De-obfuscate Message
   */
  static parseMessage(data: string): any {
    try {
      // Remove padding
      const unpadded = this.removeRandomPadding(data);

      // Decrypt
      const decrypted = this.decrypt(unpadded);

      // Parse JSON
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('❌ Parse message error:', error);
      return null;
    }
  }

  /**
   * Generate Secure Random Bytes
   */
  static generateRandomBytes(length: number): string {
    return CryptoJS.lib.WordArray.random(length).toString();
  }
}

export default CryptoService;
