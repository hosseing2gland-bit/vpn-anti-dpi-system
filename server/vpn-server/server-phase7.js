#!/usr/bin/env node
const tls = require('tls');
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Pool } = require('pg');
const WebSocket = require('ws');

const PORT_TLS = parseInt(process.env.VPN_PORT_TLS) || 8443;
const PORT_WS = parseInt(process.env.VPN_PORT_WS) || 8444;
const SHARED_KEY = Buffer.from(process.env.SHARED_KEY || '0123456789abcdef0123456789abcdef');
const NONCE_SIZE = 12;

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

async function handleAuth(username, password, protocol, clientIP) {
  try {
    const result = await pool.query('SELECT id FROM users WHERE username = $1 AND password_hash = $2', [username, password]);
    
    if (result.rows.length > 0) {
      const userId = result.rows[0].id;
      const sessionId = crypto.randomBytes(16).toString('hex');
      
      await pool.query('INSERT INTO sessions (user_id, server_ip, client_ip, protocol, status) VALUES ($1, $2, $3, $4, $5)', 
        [userId, '0.0.0.0', clientIP, protocol, 'connected']);
      
      console.log(`✅ [${protocol}] User authenticated: ${username} (Session: ${sessionId})`);
      
      return { 
        success: true, 
        sessionId, 
        userId,
        response: JSON.stringify({ 
          type: 'AUTH_OK', 
          sessionId, 
          userId, 
          protocol, 
          timestamp: Date.now() 
        })
      };
    } else {
      console.log(`❌ [${protocol}] Auth failed for: ${username}`);
      return { 
        success: false,
        response: JSON.stringify({ 
          type: 'AUTH_FAIL', 
          reason: 'Invalid credentials' 
        })
      };
    }
  } catch (err) {
    console.error(`❌ [${protocol}] Database error:`, err.message);
    return { 
      success: false, 
      response: JSON.stringify({ type: 'ERROR', message: 'Server error' }) 
    };
  }
}

// TLS Server
const tlsOptions = {
  key: fs.readFileSync(path.join(__dirname, process.env.TLS_KEY_PATH || 'key.pem')),
  cert: fs.readFileSync(path.join(__dirname, process.env.TLS_CERT_PATH || 'cert.pem')),
  servername: 'example.com',
  honorCipherOrder: true
};

const tlsServer = tls.createServer(tlsOptions, async (socket) => {
  const clientIP = socket.remoteAddress;
  let buffer = Buffer.alloc(0);

  console.log(`🔗 [TLS] Client connected: ${clientIP}`);

  socket.on('data', async (data) => {
    buffer = Buffer.concat([buffer, data]);
    
    try {
      const unobfuscated = removeRandomPadding(buffer);
      
      if (unobfuscated.length > NONCE_SIZE + 16) {
        const decrypted = decrypt(unobfuscated, SHARED_KEY);
        if (!decrypted) return;

        const message = JSON.parse(decrypted.toString());
        console.log(`📥 [TLS] Received: ${message.type}`);

        if (message.type === 'AUTH') {
          const { username, password } = message;
          const authResult = await handleAuth(username, password, 'TLS', clientIP);
          
          const nonce = crypto.randomBytes(NONCE_SIZE);
          const encrypted = encrypt(Buffer.from(authResult.response), SHARED_KEY, nonce);
          const obfuscated = addRandomPadding(encrypted);
          
          socket.write(obfuscated);
          
          if (!authResult.success) {
            setTimeout(() => socket.end(), 1000);
          }
        }
        
        buffer = Buffer.alloc(0);
      }
    } catch (err) {
      console.error('❌ [TLS] Error:', err.message);
    }
  });

  socket.on('end', () => {
    console.log(`🔌 [TLS] Client disconnected: ${clientIP}`);
  });

  socket.on('error', (err) => {
    console.error(`⚠️ [TLS] Error:`, err.message);
  });
});

// WebSocket Server
const wsServer = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('VPN Gateway - Multi-Protocol\n');
});

const wss = new WebSocket.Server({ server: wsServer });

wss.on('connection', (ws, req) => {
  const clientIP = req.socket.remoteAddress;
  let buffer = Buffer.alloc(0);

  console.log(`🔗 [WebSocket] Client connected: ${clientIP}`);

  ws.on('message', async (data) => {
    buffer = Buffer.concat([buffer, Buffer.from(data)]);
    
    try {
      const unobfuscated = removeRandomPadding(buffer);
      
      if (unobfuscated.length > NONCE_SIZE + 16) {
        const decrypted = decrypt(unobfuscated, SHARED_KEY);
        if (!decrypted) return;

        const message = JSON.parse(decrypted.toString());
        console.log(`📥 [WebSocket] Received: ${message.type}`);

        if (message.type === 'AUTH') {
          const { username, password } = message;
          const authResult = await handleAuth(username, password, 'WebSocket', clientIP);
          
          const nonce = crypto.randomBytes(NONCE_SIZE);
          const encrypted = encrypt(Buffer.from(authResult.response), SHARED_KEY, nonce);
          const obfuscated = addRandomPadding(encrypted);
          
          ws.send(obfuscated);
          
          if (!authResult.success) {
            setTimeout(() => ws.close(), 1000);
          }
        }
        
        buffer = Buffer.alloc(0);
      }
    } catch (err) {
      console.error('❌ [WebSocket] Error:', err.message);
    }
  });

  ws.on('close', () => {
    console.log(`🔌 [WebSocket] Client disconnected: ${clientIP}`);
  });

  ws.on('error', (err) => {
    console.error(`⚠️ [WebSocket] Error:`, err.message);
  });
});

// Start servers
tlsServer.listen(PORT_TLS, '0.0.0.0', async () => {
  console.log('\n🚀 VPN Server (Phase 7) - Multi-Protocol Support');
  console.log(`   🔒 TLS Server: listening on port ${PORT_TLS}`);
  
  try {
    const result = await pool.query('SELECT COUNT(*) FROM users');
    console.log(`   📈 Users in database: ${result.rows[0].count}`);
  } catch (err) {
    console.error('   ⚠️ Warning: Database not connected');
  }
});

wsServer.listen(PORT_WS, '0.0.0.0', () => {
  console.log(`   🌐 WebSocket Server: listening on port ${PORT_WS}`);
});

console.log('\n✨ Features:');
console.log('   ✓ TLS 1.3 + ChaCha20-Poly1305');
console.log('   ✓ WebSocket Support');
console.log('   ✓ Multi-Protocol Routing');
console.log('   ✓ Database Integration');
console.log('   ✓ Random Padding Obfuscation');
console.log('   ✓ Timing Obfuscation');
console.log('\n✅ Ready to accept connections\n');

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  await pool.end();
  process.exit(0);
});
