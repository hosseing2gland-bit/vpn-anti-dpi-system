// src/services/VPNManager.ts
import CryptoService from './CryptoService';
import SecurityService from './SecurityService';

type Protocol = 'TLS' | 'WebSocket' | 'QUIC';
type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface VPNConfig {
  serverHost: string;
  tlsPort: number;
  wsPort: number;
  protocol: Protocol;
}

class VPNManager {
  private static connection: any = null;
  private static status: ConnectionStatus = 'disconnected';
  private static config: VPNConfig = {
    serverHost: process.env.API_BASE_URL || 'localhost',
    tlsPort: 8443,
    wsPort: 8444,
    protocol: 'WebSocket'
  };

  /**
   * Connect to VPN Server
   */
  static async connect(protocol: Protocol = 'WebSocket'): Promise<boolean> {
    try {
      this.status = 'connecting';
      this.config.protocol = protocol;

      console.log(`🔗 Connecting to VPN (${protocol})...`);

      if (protocol === 'WebSocket') {
        return await this.connectWebSocket();
      } else if (protocol === 'TLS') {
        return await this.connectTLS();
      }

      return false;
    } catch (error) {
      console.error('❌ Connection error:', error);
      this.status = 'error';
      return false;
    }
  }

  /**
   * WebSocket Connection
   */
  private static async connectWebSocket(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `ws://${this.config.serverHost}:${this.config.wsPort}`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('✅ WebSocket connected');
          this.connection = ws;
          this.status = 'connected';
          resolve(true);
        };

        ws.onmessage = async (event) => {
          const data = event.data.toString();
          const message = CryptoService.parseMessage(data);
          
          if (message) {
            console.log('📥 Received:', message.type);
            this.handleMessage(message);
          }
        };

        ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.status = 'error';
          reject(error);
        };

        ws.onclose = () => {
          console.log('🔌 WebSocket closed');
          this.status = 'disconnected';
        };

        // Set timeout
        setTimeout(() => {
          if (this.status !== 'connected') {
            ws.close();
            reject(new Error('Connection timeout'));
          }
        }, 10000);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * TLS Connection (TCP Socket)
   */
  private static async connectTLS(): Promise<boolean> {
    // TLS connection implementation
    // Requires react-native-tcp-socket
    console.warn('⚠️ TLS connection not yet implemented');
    return false;
  }

  /**
   * Authenticate User
   */
  static async authenticate(username: string, password: string): Promise<boolean> {
    try {
      if (!this.connection) {
        throw new Error('Not connected to VPN server');
      }

      const authMessage = {
        type: 'AUTH',
        username,
        password,
        timestamp: Date.now()
      };

      const encrypted = await CryptoService.prepareMessage(authMessage);

      if (this.config.protocol === 'WebSocket') {
        this.connection.send(encrypted);
      }

      console.log('📤 Auth sent');
      return true;
    } catch (error) {
      console.error('❌ Auth error:', error);
      return false;
    }
  }

  /**
   * Handle Server Messages
   */
  private static handleMessage(message: any): void {
    switch (message.type) {
      case 'AUTH_OK':
        console.log('✅ Authentication successful');
        SecurityService.saveSecurely('session', {
          sessionId: message.sessionId,
          userId: message.userId,
          timestamp: Date.now()
        });
        break;

      case 'AUTH_FAIL':
        console.log('❌ Authentication failed:', message.reason);
        this.disconnect();
        break;

      default:
        console.log('📨 Message:', message);
    }
  }

  /**
   * Disconnect from VPN
   */
  static disconnect(): void {
    if (this.connection) {
      if (this.config.protocol === 'WebSocket') {
        this.connection.close();
      }
      this.connection = null;
    }
    this.status = 'disconnected';
    console.log('🔌 Disconnected from VPN');
  }

  /**
   * Get Connection Status
   */
  static getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Change Protocol
   */
  static setProtocol(protocol: Protocol): void {
    if (this.status === 'connected') {
      console.warn('⚠️ Disconnect first before changing protocol');
      return;
    }
    this.config.protocol = protocol;
  }

  /**
   * Get Current Config
   */
  static getConfig(): VPNConfig {
    return { ...this.config };
  }
}

export default VPNManager;
