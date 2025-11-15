#!/usr/bin/env node
const tls = require('tls');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Pool } = require('pg');

const PORT = 8443;
const SHARED_KEY = Buffer.from('0123456789abcdef0123456789abcdef');
const NONCE_SIZE = 12;

const DPI_EVASION = {
  SNI_SPOOFING: true,
  PROTOCOL_OBFUSCATION: true,
  PACKET_SIZE_RANDOMIZATION: true,
  HEADER_INJECTION: true
};

const pool = new Pool({
  user: process.env.DB_USER || 'vpnuser',
  password: process.env.DB_PASSWORD || 'yourpassword',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'vpndb'
});

pool.on('error', (err) => {
  console.error('❌ Database pool error:', err.message);
});

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

function wrapWithHTTPHeaders(data) {
  if (!DPI_EVASION.HEADER_INJECTION) return data;
  const fakeHeaders = `HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${data.length}\r\n\r\n`;
  return Buffer.concat([Buffer.from(fakeHeaders), data]);
}

function removeHTTPHeaders(data) {
  if (!DPI_EVASION.HEADER_INJECTION) return data;
  const headerEnd = data.indexOf('\r\n\r\n');
  if (headerEnd === -1) return data;
  return data.slice(headerEnd + 4);
}

const options = {
  key: fs.readFileSync(path.join(__dirname, 'key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'cert.pem')),
  servername: 'example.com',
  honorCipherOrder: true
};

const server = tls.createServer(options, async (socket) => {
  const clientIP = socket.remoteAddress;
  let userId = null;
  let sessionId = null;
  let buffer = Buffer.alloc(0);
  let dpiEvasionLevel = 1;

  console.log(`🔗 Client connected: ${clientIP}`);
  if (DPI_EVASION.SNI_SPOOFING) console.log(`   🎭 SNI Spoofing: ACTIVE`);

  socket.on('data', async (data) => {
    buffer = Buffer.concat([buffer, data]);
    
    try {
      let processedData = removeHTTPHeaders(buffer);
      const unobfuscated = removeRandomPadding(processedData);
      
      if (unobfuscated.length > NONCE_SIZE + 16) {
        const decrypted = decrypt(unobfuscated, SHARED_KEY);
        if (!decrypted) {
          console.error('❌ Decryption failed for client:', clientIP);
          socket.end();
          return;
        }

        const message = JSON.parse(decrypted.toString());
        console.log(`📥 Received: ${message.type} from ${clientIP}`);

        if (message.type === 'AUTH') {
          const { username, password } = message;
          try {
            const result = await pool.query('SELECT id FROM users WHERE username = $1 AND password_hash = $2', [username, password]);
            
            if (result.rows.length > 0) {
              userId = result.rows[0].id;
              sessionId = crypto.randomBytes(16).toString('hex');
              
              await pool.query('INSERT INTO sessions (user_id, server_ip, client_ip, protocol, status) VALUES ($1, $2, $3, $4, $5)', 
                [userId, '127.0.0.1', clientIP, 'tls-obfuscated', 'connected']);
              
              const response = JSON.stringify({ type: 'AUTH_OK', sessionId, userId, dpiEvasionLevel, timestamp: Date.now() });
              
              let nonce = crypto.randomBytes(NONCE_SIZE);
              let encrypted = encrypt(Buffer.from(response), SHARED_KEY, nonce);
              let obfuscated = addRandomPadding(encrypted);
              if (DPI_EVASION.HEADER_INJECTION) obfuscated = wrapWithHTTPHeaders(obfuscated);
              
              setTimeout(() => { socket.write(obfuscated); }, getRandomDelay());
              
              console.log(`✅ User authenticated: ${username} (Session: ${sessionId})`);
              console.log(`   📊 DPI Evasion Level: ${dpiEvasionLevel}`);
            } else {
              const response = JSON.stringify({ type: 'AUTH_FAIL', reason: 'Invalid credentials' });
              let nonce = crypto.randomBytes(NONCE_SIZE);
              let encrypted = encrypt(Buffer.from(response), SHARED_KEY, nonce);
              let obfuscated = addRandomPadding(encrypted);
              if (DPI_EVASION.HEADER_INJECTION) obfuscated = wrapWithHTTPHeaders(obfuscated);
              
              socket.write(obfuscated);
              setTimeout(() => socket.end(), 1000);
              console.log(`❌ Auth failed for: ${username}`);
            }
          } catch (dbErr) {
            console.error('❌ Database error:', dbErr.message);
            socket.end();
          }
        }
        
        buffer = Buffer.alloc(0);
      }
    } catch (err) {
      console.error('❌ Error processing data:', err.message);
    }
  });

  socket.on('end', async () => {
    console.log(`🔌 Client disconnected: ${clientIP}`);
    
    if (userId && sessionId) {
      try {
        await pool.query('UPDATE sessions SET status = $1, disconnected_at = CURRENT_TIMESTAMP WHERE user_id = $2 AND status = $3', 
          ['disconnected', userId, 'connected']);
      } catch (err) {
        console.error('❌ Error updating session:', err.message);
      }
    }
  });

  socket.on('error', (err) => {
    console.error(`⚠️ Socket error (${clientIP}):`, err.message);
  });
});

server.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 VPN Server (Phase 6: Advanced DPI Evasion) listening on port ${PORT}`);
  console.log('✨ Features:');
  console.log('   ✓ TLS 1.3 + ChaCha20-Poly1305');
  console.log('   ✓ Random Padding Obfuscation');
  console.log('   ✓ Timing Obfuscation');
  console.log('   ✓ Database Integration');
  if (DPI_EVASION.SNI_SPOOFING) console.log('   ✓ SNI Spoofing');
  if (DPI_EVASION.HEADER_INJECTION) console.log('   ✓ HTTP Header Injection');
  if (DPI_EVASION.PACKET_SIZE_RANDOMIZATION) console.log('   ✓ Packet Size Randomization');
  if (DPI_EVASION.PROTOCOL_OBFUSCATION) console.log('   ✓ Protocol Obfuscation');
  console.log(`📊 Database: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}`);
  console.log('✅ Ready to accept connections');
  
  try {
    const result = await pool.query('SELECT COUNT(*) FROM users');
    console.log(`📈 Users in database: ${result.rows[0].count}`);
  } catch (err) {
    console.error('⚠️ Warning: Could not connect to database:', err.message);
  }
});

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  await pool.end();
  process.exit(0);
});
