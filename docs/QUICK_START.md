# Quick Start Guide 🚀

## Getting Started in 5 Minutes

This guide will help you get the VPN Anti-DPI system running locally on your machine.

---

## Prerequisites

Before you begin, ensure you have:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Docker** & **Docker Compose** ([Download](https://www.docker.com/))
- **Git** ([Download](https://git-scm.com/))
- (Optional) **Expo CLI** for mobile development

---

## Step 1: Clone Repository

```bash
git clone https://github.com/hosseing2gland-bit/vpn-anti-dpi-system.git
cd vpn-anti-dpi-system
```

---

## Step 2: Start Backend Services

### Option A: Using Docker (Recommended)

```bash
cd server
docker-compose up -d
```

This will start:
- PostgreSQL database (port 5432)
- Redis cache (port 6379)
- VPN Server (ports 8443, 8444)

### Option B: Manual Setup

If you prefer manual setup:

```bash
# Install PostgreSQL and Redis manually
# Then:
cd server/vpn-server
npm install
cp .env.example .env
# Edit .env with your database credentials
```

---

## Step 3: Initialize Database

```bash
cd server/vpn-server
node setup-database.js
```

Expected output:
```
📦 Setting up database...
✅ Dropped existing tables
✅ Created users table
✅ Created sessions table
✅ Inserted test users (admin/admin123, arash/arash)
📈 Total users: 2
✨ Database setup complete!
```

---

## Step 4: Generate SSL Certificates

```bash
cd server/vpn-server
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes \
  -subj "/CN=example.com"
```

---

## Step 5: Start VPN Server

### Start Phase 7 Server (Multi-Protocol)

```bash
cd server/vpn-server
node server-phase7.js
```

Expected output:
```
🚀 VPN Server (Phase 7) - Multi-Protocol Support
   🔒 TLS Server: listening on port 8443
   🌐 WebSocket Server: listening on port 8444
   📈 Users in database: 2

✨ Features:
   ✓ TLS 1.3 + ChaCha20-Poly1305
   ✓ WebSocket Support
   ✓ Multi-Protocol Routing
   ✓ Database Integration
   ✓ Random Padding Obfuscation
   ✓ Timing Obfuscation

✅ Ready to accept connections
```

---

## Step 6: Test Server with Client

Open a new terminal:

```bash
cd server/vpn-server
npm install ws
node client-phase6.js
```

Expected output:
```
🔒 Connected to VPN Server: localhost:8443
🔐 Protocol: TLSv1.3
🔑 Cipher: TLS_AES_256_GCM_SHA384
🎭 Obfuscation: ENABLED
👤 User: arash
📤 AUTH sent (encrypted + obfuscated)
📥 Received: AUTH_OK
✅ Authentication successful for Arash!
   Session ID: 230cf9a3e3bec8bf7843f1f2b6086808
   User ID: 1
   DPI Evasion Level: 1

🎉 PHASE 6 TEST COMPLETE!
```

---

## Step 7: Run Mobile App

### Install Dependencies

```bash
cd mobile-app
npm install
```

### Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
API_BASE_URL=http://YOUR_SERVER_IP:8443
WS_URL=ws://YOUR_SERVER_IP:8444
```

### Start Expo

```bash
npm start
```

### Run on Device

- **Android**: Press `a` in terminal
- **iOS**: Press `i` in terminal
- **Web**: Press `w` in terminal

---

## Verify Everything Works

### 1. Check Database

```bash
docker exec -it vpn-postgres psql -U vpnuser -d vpndb -c "SELECT * FROM users;"
```

### 2. Check Server Logs

```bash
docker-compose logs -f vpn-server
```

### 3. Test API Endpoint

```bash
curl http://localhost:8444
# Should return: VPN Gateway - Multi-Protocol
```

---

## Default Credentials

**Test Users:**
- Username: `admin` / Password: `admin123` (Admin)
- Username: `arash` / Password: `arash` (User)

⚠️ **Important**: Change these in production!

---

## Common Issues

### Port Already in Use

```bash
# Find process using port
sudo lsof -i :8443

# Kill process
sudo kill -9 <PID>
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Restart database
docker-compose restart postgres
```

### Mobile App Can't Connect

1. Replace `localhost` with your computer's IP address in `.env`
2. Ensure firewall allows ports 8443, 8444
3. Use `http://` not `https://` for development

---

## Next Steps

✅ **Completed Quick Start!**

Now you can:

1. Read [Deployment Guide](./DEPLOYMENT.md) for production setup
2. Explore the [API Documentation](../README.md#api-documentation)
3. Customize the mobile app UI
4. Add more users to the database
5. Configure advanced DPI evasion techniques

---

## Need Help?

- 🐛 [Report Issues](https://github.com/hosseing2gland-bit/vpn-anti-dpi-system/issues)
- 📚 [Read Full Documentation](../README.md)
- 💬 [Community Discussions](https://github.com/hosseing2gland-bit/vpn-anti-dpi-system/discussions)

---

**Happy Coding! 🚀**
