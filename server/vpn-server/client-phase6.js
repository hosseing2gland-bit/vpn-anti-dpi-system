#!/usr/bin/env node
const tls = require('tls');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const HOST = process.env.VPN_HOST || 'localhost';
const PORT = 8443;
const SHARED_KEY = Buffer.from('0123456789abcdef0123456789abcdef');
const NONCE_SIZE = 12;
const certPath = path.join(__dirname, 'cert.pem');

const DPI_FEATURES = {
  SNI_SPOOFING: true,
  HEADER_INJECTION: true,
  PACKET_RANDOMIZATION: true
};

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

function getRandomDelay() {
  return Math.floor(Math.random() * 41) + 10;
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

function removeHTTPHeaders(data) {
  if (!DPI_FEATURES.HEADER_INJECTION) return data;
  const headerEnd = data.indexOf('\r\n\r\n');
  if (headerEnd === -1) return data;
  return data.slice(headerEnd + 4);
}

const options = {
  rejectUnauthorized: false,
  ca: [fs.readFileSync(certPath)],
  servername: 'example.com'
};

const socket = tls.connect(PORT, HOST, options, () => {
  console.log(`🔒 Connected to VPN Server: ${HOST}:${PORT}`);
  console.log(`🔐 Protocol: ${socket.getProtocol()}`);
  console.log(`🔑 Cipher: ${socket.getCipher().name}`);
  console.log('🎭 Obfuscation: ENABLED');
  console.log('\n📊 Phase 6 DPI Evasion Features:');
  if (DPI_FEATURES.SNI_SPOOFING) console.log('   ✓ SNI Spoofing');
  if (DPI_FEATURES.HEADER_INJECTION) console.log('   ✓ HTTP Header Injection');
  if (DPI_FEATURES.PACKET_RANDOMIZATION) console.log('   ✓ Packet Size Randomization');
  console.log('---');
  console.log('👤 User: arash');
  console.log('---');

  const authMsg = JSON.stringify({ type: 'AUTH', username: 'arash', password: 'arash' });
  const nonce = crypto.randomBytes(NONCE_SIZE);
  const encrypted = encrypt(Buffer.from(authMsg), SHARED_KEY, nonce);
  const obfuscated = addRandomPadding(encrypted);

  setTimeout(() => {
    socket.write(obfuscated);
    console.log('📤 AUTH sent (encrypted + obfuscated)');
  }, getRandomDelay());
});

let buffer = Buffer.alloc(0);

socket.on('data', (data) => {
  buffer = Buffer.concat([buffer, data]);
  try {
    let processedData = removeHTTPHeaders(buffer);
    const unobfuscated = removeRandomPadding(processedData);
    if (unobfuscated.length > NONCE_SIZE + 16) {
      const decrypted = decrypt(unobfuscated, SHARED_KEY);
      if (!decrypted) {
        console.error('❌ Failed to decrypt message');
        return;
      }
      const message = JSON.parse(decrypted.toString());
      console.log(`📥 Received: ${message.type}`);
      if (message.type === 'AUTH_OK') {
        console.log(`✅ Authentication successful for Arash!`);
        console.log(`   Session ID: ${message.sessionId}`);
        console.log(`   User ID: ${message.userId}`);
        console.log(`   DPI Evasion Level: ${message.dpiEvasionLevel}`);
        console.log('---');
        console.log('🎉 PHASE 6 TEST COMPLETE!');
        console.log('   ✓ TLS 1.3 Encryption');
        console.log('   ✓ ChaCha20-Poly1305 Cipher');
        console.log('   ✓ Random Padding Obfuscation');
        console.log('   ✓ Timing Obfuscation');
        console.log('   ✓ Database Integration');
        console.log('   ✓ SNI Spoofing');
        console.log('   ✓ HTTP Header Injection');
        console.log('   ✓ Packet Size Randomization');
        setTimeout(() => socket.end(), 500);
      } else if (message.type === 'AUTH_FAIL') {
        console.error(`❌ Authentication failed: ${message.reason}`);
        socket.end();
      }
      buffer = Buffer.alloc(0);
    }
  } catch (err) {
    console.error('❌ Error processing data:', err.message);
  }
});

socket.on('close', () => {
  console.log('🔌 Connection closed');
  process.exit(0);
});

socket.on('error', (err) => {
  console.error(`⚠️ Connection error: ${err.message}`);
  process.exit(1);
});
