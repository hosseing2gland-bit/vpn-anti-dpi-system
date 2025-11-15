# VPN Anti-DPI System 🚀

## Advanced VPN with Deep Packet Inspection Evasion & React Native Mobile App

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React Native](https://img.shields.io/badge/React%20Native-0.73-blue.svg)](https://reactnative.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://www.postgresql.org/)

### 🎯 Overview

A production-ready VPN system with advanced anti-censorship capabilities, featuring:
- **Anti-DPI Evasion**: SNI Spoofing, Protocol Obfuscation, Packet Randomization
- **Multi-Protocol Support**: TLS 1.3, WebSocket, Custom Binary Protocol
- **React Native Mobile App**: Cross-platform iOS/Android client with high security
- **Enterprise Security**: ChaCha20-Poly1305 encryption, JWT authentication, Certificate Pinning

---

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Mobile App](#-mobile-app)
- [Server Setup](#-server-setup)
- [Security](#-security)
- [API Documentation](#-api-documentation)
- [Roadmap](#-roadmap)

---

## ✨ Features

### 🔒 Security
- ✅ **TLS 1.3** with ChaCha20-Poly1305 AEAD cipher
- ✅ **Certificate Pinning** (MITM protection)
- ✅ **JWT Authentication** with automatic expiry and refresh
- ✅ **Secure Storage** using iOS Keychain / Android Keystore
- ✅ **Request Signing** with HMAC-SHA256
- ✅ **End-to-End Encryption** for all traffic

### 🎭 Anti-DPI Evasion
- ✅ **SNI Spoofing** (Domain Fronting)
- ✅ **HTTP Header Injection** (HTTPS-like traffic)
- ✅ **Random Padding Obfuscation** (10-100 bytes)
- ✅ **Timing Obfuscation** (Random delays 10-50ms)
- ✅ **Protocol Fingerprint Obfuscation**
- ✅ **Packet Size Randomization**

### 🌐 Multi-Protocol Support
- ✅ **TLS 1.3** (Port 8443)
- ✅ **WebSocket over HTTPS** (Port 8444)
- 🔜 **QUIC/HTTP3** (Port 8445)
- 🔜 **Custom Binary Protocol**

### 📱 React Native Mobile App
- ✅ Cross-platform (iOS & Android)
- ✅ Modern UI with React Native Paper
- ✅ Real-time connection status
- ✅ Server statistics dashboard
- ✅ Automatic reconnection
- ✅ Background connection support

### 🗄️ Backend
- ✅ **PostgreSQL** database
- ✅ **Redis** caching
- ✅ **Docker Compose** orchestration
- ✅ User management system
- ✅ Session tracking
- ✅ Real-time analytics

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Mobile Clients                          │
│              (iOS / Android - React Native)                 │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ TLS 1.3 / WebSocket
                        │ (Encrypted + Obfuscated)
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                   VPN Gateway Server                        │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ TLS Server  │  │ WS Server    │  │ QUIC Server  │      │
│  │ (Port 8443) │  │ (Port 8444)  │  │ (Port 8445)  │      │
│  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                │                  │               │
│         └────────────────┴──────────────────┘               │
│                          │                                  │
│              ┌───────────▼───────────┐                      │
│              │  Protocol Manager      │                      │
│              │  - Authentication      │                      │
│              │  - Session Management  │                      │
│              │  - DPI Evasion         │                      │
│              └───────────┬───────────┘                      │
└──────────────────────────┼──────────────────────────────────┘
                           │
           ┌───────────────┴────────────────┐
           │                                │
  ┌────────▼────────┐             ┌────────▼────────┐
  │   PostgreSQL    │             │     Redis       │
  │   (Users, Logs) │             │    (Sessions)   │
  └─────────────────┘             └─────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Git
- (For mobile) Expo CLI / React Native CLI

### 1. Clone Repository

```bash
git clone https://github.com/hosseing2gland-bit/vpn-anti-dpi-system.git
cd vpn-anti-dpi-system
```

### 2. Start Backend Services

```bash
cd server
docker-compose up -d
```

### 3. Initialize Database

```bash
cd server/vpn-server
npm install
node setup-database.js
```

### 4. Start VPN Server

```bash
# Terminal 1 - Main Server
node server-phase7.js

# Terminal 2 - Test Client (optional)
node client-phase7-ws.js
```

### 5. Run Mobile App

```bash
cd mobile-app
npm install
npm start

# Press 'a' for Android, 'i' for iOS
```

---

## 📱 Mobile App

### Features
- 🔐 Secure login with JWT
- 📊 Real-time connection dashboard
- 🌐 Multi-server selection
- ⚡ Protocol auto-selection (TLS/WebSocket/QUIC)
- 🔄 Automatic reconnection
- 📈 Bandwidth usage statistics
- ⚙️ Advanced settings

### Screenshots

_(Coming soon)_

### Build & Deploy

```bash
cd mobile-app

# Android APK
eas build --platform android

# iOS IPA
eas build --platform ios
```

---

## 🖥️ Server Setup

### Environment Variables

Create `.env` file in `server/` directory:

```env
# Database
POSTGRES_USER=vpnuser
POSTGRES_PASSWORD=yourpassword
POSTGRES_DB=vpndb
DB_HOST=localhost
DB_PORT=5432

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Server
VPN_PORT_TLS=8443
VPN_PORT_WS=8444
VPN_PORT_QUIC=8445

# Security
JWT_SECRET=your-jwt-secret-key-min-32-chars
ENCRYPTION_KEY=your-256-bit-encryption-key-32-chars
SHARED_KEY=0123456789abcdef0123456789abcdef

# TLS
TLS_CERT_PATH=./cert.pem
TLS_KEY_PATH=./key.pem
```

### SSL Certificate Generation

```bash
cd server/vpn-server
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes \
  -subj "/CN=example.com"
```

### Database Schema

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(64) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email VARCHAR(255),
  role VARCHAR(32) DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  server_ip VARCHAR(45),
  client_ip VARCHAR(45),
  protocol VARCHAR(32),
  status VARCHAR(32),
  bandwidth_used BIGINT DEFAULT 0,
  connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  disconnected_at TIMESTAMP
);
```

---

## 🔐 Security

### Encryption Stack

1. **Transport Layer**: TLS 1.3 with ChaCha20-Poly1305
2. **Application Layer**: Additional ChaCha20 encryption
3. **Obfuscation**: Random padding + timing delays
4. **Authentication**: JWT with HMAC-SHA256 signing

### Security Best Practices

✅ **Certificate Pinning** - Prevents MITM attacks  
✅ **Secure Storage** - Credentials stored in Keychain/Keystore  
✅ **Token Expiry** - Automatic session invalidation  
✅ **Request Signing** - HMAC verification on all requests  
✅ **No Plaintext Logs** - Sensitive data never logged  
✅ **Rate Limiting** - DDoS protection (planned)  

### Known Limitations

⚠️ **Development Mode**: Self-signed certificates (use proper CA in production)  
⚠️ **Local Database**: Use managed PostgreSQL in production  
⚠️ **No Load Balancing**: Single server instance (multi-instance planned)  

---

## 📚 API Documentation

### Authentication

#### POST `/api/auth/login`

**Request:**
```json
{
  "username": "arash",
  "password": "arash"
}
```

**Response:**
```json
{
  "type": "AUTH_OK",
  "sessionId": "230cf9a3e3bec8bf7843f1f2b6086808",
  "userId": 1,
  "token": "eyJhbGc...",
  "expiresIn": 3600
}
```

### Statistics

#### GET `/api/stats`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "activeUsers": 42,
  "totalConnections": 1523,
  "bandwidthUsed": "2.5 TB",
  "serverStatus": "online"
}
```

---

## 🗺️ Roadmap

### Phase 7: Multi-Protocol Support ✅
- [x] TLS 1.3 Server
- [x] WebSocket Server
- [ ] QUIC Server (HTTP/3)
- [ ] Custom Binary Protocol

### Phase 8: Mobile App MVP 🚧
- [x] React Native Setup
- [x] Authentication Flow
- [x] Dashboard UI
- [ ] Background Service
- [ ] Push Notifications

### Phase 9: Production Ready 🔜
- [ ] Docker Registry
- [ ] Nginx Reverse Proxy
- [ ] Load Balancing
- [ ] Health Monitoring
- [ ] CI/CD Pipeline
- [ ] Automated Testing

### Phase 10: Advanced Features 🔮
- [ ] Admin Dashboard (Web)
- [ ] User Management Panel
- [ ] Real-time Analytics
- [ ] Multi-region Deployment
- [ ] Automatic Failover

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Hossein Ghalandari**
- GitHub: [@hosseing2gland-bit](https://github.com/hosseing2gland-bit)

---

## 🙏 Acknowledgments

- Inspired by modern VPN protocols (WireGuard, Shadowsocks)
- Anti-DPI techniques from research papers
- React Native community

---

## 📞 Support

For issues and questions:
- Open an [Issue](https://github.com/hosseing2gland-bit/vpn-anti-dpi-system/issues)
- Email: your-email@example.com

---

**⭐ If you find this project useful, please give it a star!**
