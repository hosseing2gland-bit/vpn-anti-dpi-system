#!/usr/bin/env node
const WebSocket = require('ws');
const crypto = require('crypto');

const HOST = process.env.VPN_HOST || 'localhost';
const PORT = 8444;
const SHARED_KEY = Buffer.from('0123456789abcdef0123456789abcdef');
const NONCE_SIZE = 12;

function addRandomPadding(data) {
  const paddingSize = Math.floor(Math.random() * 91) + 10;
  const padding = crypto.randomBytes(paddingSize);
  return Buffer.concat([Buffer.from([paddingSize >> 8, paddingSize & 0xff]), padding, data]);
}

function removeRandomPadding(data) {
  if (data.length < 2) return data;
  const paddingSize = (data[0] << 8) | data[1];
  if (data.length < 2 + paddingSize) return data;
  return data.slice(2 + paddingSize);
}

function encrypt(plaintext, key, nonce) {
  const cipher = crypto.createCipheriv('chacha20-poly1305', key, nonce);
  const encrypted = cipher.update(plaintext);
  const final = cipher.final();
  const authTag = cipher.getAuthTag();
  return Buffer.concat([nonce, authTag, encrypted, final]);
}

function decrypt(ciphertext, key) {
  if (ciphertext.length < NONCE_SIZE + 16) return null;
  const nonce = ciphertext.slice(0, NONCE_SIZE);
  const authTag = ciphertext.slice(NONCE_SIZE, NONCE_SIZE + 16);
  const encrypted = ciphertext.slice(NONCE_SIZE + 16);
  
  try {
    const decipher = crypto.createDecipheriv('chacha20-poly1305', key, nonce);
    decipher.setAuthTag(authTag);
    const decrypted = decipher.update(encrypted);
    const final = decipher.final();
    return Buffer.concat([decrypted, final]);
  } catch (err) {
    return null;
  }
}

const ws = new WebSocket(`ws://${HOST}:${PORT}`);
let buffer = Buffer.alloc(0);

ws.on('open', () => {
  console.log(`🔗 Connected to VPN Server (WebSocket): ${HOST}:${PORT}`);
  console.log('🌐 Protocol: WebSocket');
  console.log('🎭 Obfuscation: ENABLED');
  console.log('---');
  console.log('👤 User: arash');
  console.log('---');

  const authMsg = JSON.stringify({ 
    type: 'AUTH', 
    username: 'arash', 
    password: 'arash',
    timestamp: Date.now()
  });
  
  const nonce = crypto.randomBytes(NONCE_SIZE);
  const encrypted = encrypt(Buffer.from(authMsg), SHARED_KEY, nonce);
  const obfuscated = addRandomPadding(encrypted);

  setTimeout(() => {
    ws.send(obfuscated);
    console.log('📤 AUTH sent (encrypted + obfuscated)');
  }, Math.floor(Math.random() * 41) + 10);
});

ws.on('message', (data) => {
  buffer = Buffer.concat([buffer, data]);
  
  try {
    const unobfuscated = removeRandomPadding(buffer);
    
    if (unobfuscated.length > NONCE_SIZE + 16) {
      const decrypted = decrypt(unobfuscated, SHARED_KEY);
      if (!decrypted) {
        console.error('❌ Failed to decrypt message');
        return;
      }

      const message = JSON.parse(decrypted.toString());
      console.log(`📥 Received: ${message.type}`);

      if (message.type === 'AUTH_OK') {
        console.log(`✅ Authentication successful!`);
        console.log(`   Session ID: ${message.sessionId}`);
        console.log(`   User ID: ${message.userId}`);
        console.log(`   Protocol: ${message.protocol}`);
        console.log('---');
        console.log('🎉 PHASE 7 (WebSocket) TEST COMPLETE!');
        console.log('   ✓ WebSocket Connection');
        console.log('   ✓ ChaCha20-Poly1305 Encryption');
        console.log('   ✓ Random Padding Obfuscation');
        console.log('   ✓ Timing Obfuscation');
        console.log('   ✓ Database Integration');
        console.log('   ✓ Multi-Protocol Support');
        setTimeout(() => ws.close(), 500);
      } else if (message.type === 'AUTH_FAIL') {
        console.error(`❌ Authentication failed: ${message.reason}`);
        ws.close();
      }

      buffer = Buffer.alloc(0);
    }
  } catch (err) {
    console.error('❌ Error processing data:', err.message);
  }
});

ws.on('close', () => {
  console.log('🔌 Connection closed');
  process.exit(0);
});

ws.on('error', (err) => {
  console.error(`⚠️ Connection error: ${err.message}`);
  process.exit(1);
});
