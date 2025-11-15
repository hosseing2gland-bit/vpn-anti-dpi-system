import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Card, Text, ActivityIndicator, Chip, Surface } from 'react-native-paper';
import VPNManager from '../services/VPNManager';
import SecurityService from '../services/SecurityService';
export default function HomeScreen() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [protocol, setProtocol] = useState('WebSocket');
  const [sessionInfo, setSessionInfo] = useState(null);
  useEffect(() => { checkSession(); }, []);
  const checkSession = async () => {
    const session = await SecurityService.getSecurely('session');
    if (session) { setSessionInfo(session); setIsConnected(true); }
  };
  const handleConnect = async () => {
    try {
      setIsConnecting(true); const connected = await VPNManager.connect(protocol);
      if (connected) {
        const authenticated = await VPNManager.authenticate('arash', 'arash');
        if (authenticated) { setIsConnected(true); Alert.alert('✅ Success', 'Connected to VPN successfully!'); await checkSession(); }
        else { Alert.alert('❌ Error', 'Authentication failed'); }
      } else { Alert.alert('❌ Error', 'Connection failed'); }
    } catch (error) { Alert.alert('❌ Error', error.message); } finally { setIsConnecting(false); }
  };
  const handleDisconnect = () => {
    VPNManager.disconnect(); setIsConnected(false); setSessionInfo(null); Alert.alert('🔌 Disconnected', 'VPN connection closed');
  };
  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineMedium" style={styles.title}>VPN Anti-DPI</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>Secure, Private, Uncensored</Text>
          <Surface style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text variant="titleMedium">Status:</Text>
              <Chip mode="flat" style={[styles.statusChip, { backgroundColor: isConnected ? '#10b981' : '#6b7280' }]} textStyle={{ color: '#fff' }}>{isConnected ? '🟢 Connected' : '⚪ Disconnected'}</Chip>
            </View>
            {sessionInfo && (<View style={styles.sessionInfo}>
              <Text variant="bodySmall">Session ID: {sessionInfo.sessionId}</Text>
              <Text variant="bodySmall">User ID: {sessionInfo.userId}</Text>
            </View>)}
          </Surface>
          <View style={styles.protocolSelector}>
            <Text variant="titleSmall" style={styles.label}>Protocol:</Text>
            <View style={styles.protocolButtons}>
              {(['TLS', 'WebSocket', 'QUIC']).map((p) => (
                <Chip key={p} selected={protocol === p} onPress={() => !isConnected && setProtocol(p)} disabled={isConnected} style={styles.protocolChip} mode={protocol === p ? 'flat' : 'outlined'}>{p}</Chip>))}
            </View>
          </View>
          {isConnecting ? (<ActivityIndicator animating={true} size="large" style={styles.loader} color="#00d4ff" />)
            : (<Button mode="contained" onPress={isConnected ? handleDisconnect : handleConnect} style={[styles.button, { backgroundColor: isConnected ? '#ef4444' : '#00d4ff' }]} labelStyle={styles.buttonLabel} icon={isConnected ? 'power' : 'power-plug'}>{isConnected ? 'Disconnect' : 'Connect'}</Button>)}
        </Card.Content>
      </Card>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>🔒 Security Features</Text>
          <View style={styles.featureList}>
            <Text style={styles.feature}>✓ ChaCha20-Poly1305 Encryption</Text>
            <Text style={styles.feature}>✓ Certificate Pinning</Text>
            <Text style={styles.feature}>✓ Traffic Obfuscation</Text>
            <Text style={styles.feature}>✓ Anti-DPI Technology</Text>
            <Text style={styles.feature}>✓ Zero-Log Policy</Text>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a', }, card: { margin: 16, backgroundColor: '#1a1a2e', }, title: { textAlign: 'center', color: '#00d4ff', fontWeight: 'bold', marginTop: 16, }, subtitle: { textAlign: 'center', color: '#9ca3af', marginTop: 8, marginBottom: 24, }, statusCard: { padding: 16, borderRadius: 12, backgroundColor: '#2a2a3e', marginVertical: 16, }, statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', }, statusChip: { paddingHorizontal: 12, }, sessionInfo: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#3a3a4e', }, protocolSelector: { marginVertical: 16, }, label: { marginBottom: 8, color: '#d1d5db', }, protocolButtons: { flexDirection: 'row', justifyContent: 'space-around', }, protocolChip: { flex: 1, marginHorizontal: 4, }, loader: { marginVertical: 24, }, button: { marginTop: 16, paddingVertical: 8, }, buttonLabel: { fontSize: 16, fontWeight: 'bold', }, sectionTitle: { marginBottom: 12, color: '#00d4ff', }, featureList: { gap: 8, }, feature: { color: '#d1d5db', fontSize: 14, lineHeight: 24, }, });
