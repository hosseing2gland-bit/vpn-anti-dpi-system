# VPN Anti-DPI Mobile App

## React Native Mobile Client with High Security

### Features

✅ **Secure Authentication**: JWT with expiry and refresh
✅ **Encrypted Communication**: ChaCha20-Poly1305 + TLS 1.3
✅ **Certificate Pinning**: MITM protection
✅ **Secure Storage**: iOS Keychain / Android Keystore
✅ **Multi-Protocol**: TLS, WebSocket, QUIC
✅ **Auto-Reconnection**: Network failure handling

---

## Installation

### 1. Install Dependencies

```bash
cd mobile-app
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your server details
```

### 3. Start Development Server

```bash
npm start
```

### 4. Run on Device/Emulator

```bash
# Android
npm run android

# iOS
npm run ios
```

---

## Project Structure

```
mobile-app/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Auth screens
│   ├── (tabs)/            # Main app tabs
│   └── _layout.tsx        # Root layout
├── src/
│   ├── components/        # Reusable components
│   ├── services/          # Security & API services
│   │   ├── SecurityService.ts
│   │   ├── CryptoService.ts
│   │   ├── APIService.ts
│   │   └── VPNManager.ts
│   ├── context/           # React Context
│   └── utils/             # Helpers
├── assets/                # Images & fonts
└── app.json               # Expo config
```

---

## Security Services

### SecurityService

- TLS Certificate Pinning
- Secure Storage (Keychain/Keystore)
- JWT Management
- Session Validation
- Device Fingerprinting

### CryptoService

- ChaCha20-Poly1305 Encryption
- Random Padding
- Timing Obfuscation
- HMAC Signing

### VPNManager

- Protocol Selection (TLS/WebSocket)
- Connection Management
- Auto-Reconnection
- Bandwidth Tracking

---

## Usage

### 1. Login

```typescript
import SecurityService from '@/services/SecurityService';

const login = async (username: string, password: string) => {
  const token = await SecurityService.generateJWT({ username });
  await SecurityService.saveSecurely('jwt_token', { token });
};
```

### 2. Connect to VPN

```typescript
import VPNManager from '@/services/VPNManager';

const connect = async () => {
  await VPNManager.connect('TLS');
};
```

### 3. Encrypted API Call

```typescript
import APIService from '@/services/APIService';

const stats = await APIService.get('/api/stats');
```

---

## Build for Production

### Android APK

```bash
eas build --platform android --profile production
```

### iOS IPA

```bash
eas build --platform ios --profile production
```

---

## Security Checklist

- [ ] Replace default `SHARED_KEY` and `JWT_SECRET`
- [ ] Enable TLS Certificate Pinning in production
- [ ] Use proper SSL certificates (not self-signed)
- [ ] Configure proper `.env` for production
- [ ] Test on real devices
- [ ] Enable ProGuard (Android) and bitcode (iOS)

---

## Troubleshooting

### Connection Failed

1. Check server is running (`docker-compose up`)
2. Verify `.env` has correct server URL
3. Check firewall allows ports 8443, 8444

### Certificate Error

Disable certificate pinning in development:
```env
ENABLE_TLS_PINNING=false
```

---

## License

MIT
