import { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import NetInfo from '@react-native-community/netinfo';
import { useFocusEffect } from 'expo-router';
import { useSyncStore } from '../../store/sync-store';
import { resolveMasterConfigBanner } from '../../utils/master-config-sync-banner';

export function MasterConfigStaleBanner() {
  const metadata = useSyncStore((s) => s.metadata);
  const [isConnected, setIsConnected] = useState(true);

  const refreshNet = useCallback(async () => {
    const net = await NetInfo.fetch();
    setIsConnected(net.isConnected ?? false);
  }, []);

  useEffect(() => {
    const sub = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? false);
    });
    return () => sub();
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshNet();
    }, [refreshNet])
  );

  const banner = resolveMasterConfigBanner({ isConnected, metadata });

  if (!banner) return null;

  const bg =
    banner.tone === 'error' ? '#fef2f2' : banner.tone === 'info' ? '#eff6ff' : '#fff7ed';
  const border =
    banner.tone === 'error' ? '#fecaca' : banner.tone === 'info' ? '#bfdbfe' : '#fed7aa';
  const textColor =
    banner.tone === 'error' ? '#991b1b' : banner.tone === 'info' ? '#1e40af' : '#9a3412';

  return (
    <View style={[styles.wrap, { backgroundColor: bg, borderColor: border }]}>
      <Text variant="bodySmall" style={[styles.text, { color: textColor }]}>
        {banner.message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  text: { lineHeight: 18 },
});
