import { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import NetInfo from '@react-native-community/netinfo';
import { useFocusEffect } from 'expo-router';
import { useSyncStore } from '../../store/sync-store';
import { valuationRepository } from '../../../data/repositories';
import { formatSyncQueueBanner } from '../../utils/format-sync-queue-summary';
import { resolveMasterConfigBanner } from '../../utils/master-config-sync-banner';

type BannerTone = 'error' | 'warning' | 'info';

interface BannerItem {
  tone: BannerTone;
  message: string;
  priority: number;
}

const TONE_STYLE: Record<
  BannerTone,
  { bg: string; border: string; text: string }
> = {
  error: { bg: '#fef2f2', border: '#fecaca', text: '#991b1b' },
  warning: { bg: '#fffbeb', border: '#fde68a', text: '#92400e' },
  info: { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af' },
};

const TONE_PRIORITY: Record<BannerTone, number> = {
  error: 0,
  warning: 1,
  info: 2,
};

interface Props {
  /** Si false, no muestra aviso de cola de envío de cotizaciones. */
  showValuationOutbox?: boolean;
  /** Solo en Actualizaciones comerciales: avisos de sync de valores maestros. */
  showCommercialConfigStatus?: boolean;
}

/**
 * Banners de sync: cola de cotizaciones; opcionalmente estado de config maestra.
 */
export function SyncStatusBanners({
  showValuationOutbox = true,
  showCommercialConfigStatus = false,
}: Props) {
  const metadata = useSyncStore((s) => s.metadata);
  const [isConnected, setIsConnected] = useState(true);
  const [outboxBanner, setOutboxBanner] = useState<string | null>(null);

  const refreshNet = useCallback(async () => {
    const net = await NetInfo.fetch();
    setIsConnected(net.isConnected ?? false);
  }, []);

  const refreshOutbox = useCallback(async () => {
    if (!showValuationOutbox) {
      setOutboxBanner(null);
      return;
    }
    const [q, net] = await Promise.all([
      valuationRepository.countSyncQueue(),
      NetInfo.fetch(),
    ]);
    setOutboxBanner(
      formatSyncQueueBanner(q, {
        context: 'dashboard',
        isConnected: net.isConnected ?? false,
      })
    );
  }, [showValuationOutbox]);

  useEffect(() => {
    const sub = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? false);
      if (showValuationOutbox) void refreshOutbox();
    });
    return () => sub();
  }, [refreshOutbox, showValuationOutbox]);

  useFocusEffect(
    useCallback(() => {
      void refreshNet();
      void refreshOutbox();
    }, [refreshNet, refreshOutbox])
  );

  const items: BannerItem[] = [];

  const configBanner = showCommercialConfigStatus
    ? resolveMasterConfigBanner({ isConnected, metadata })
    : null;
  if (configBanner) {
    items.push({
      tone: configBanner.tone,
      message: configBanner.message,
      priority: TONE_PRIORITY[configBanner.tone],
    });
  }

  if (outboxBanner) {
    items.push({
      tone: 'warning',
      message: outboxBanner,
      priority: TONE_PRIORITY.warning + 1,
    });
  }

  items.sort((a, b) => a.priority - b.priority);
  const visible = items.slice(0, 2);

  if (!visible.length) return null;

  return (
    <View style={styles.stack}>
      {visible.map((item) => {
        const style = TONE_STYLE[item.tone];
        return (
          <View
            key={`${item.tone}-${item.message.slice(0, 24)}`}
            style={[styles.wrap, { backgroundColor: style.bg, borderColor: style.border }]}
          >
            <Text variant="bodySmall" style={[styles.text, { color: style.text }]}>
              {item.message}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 10, marginBottom: 12 },
  wrap: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  text: { lineHeight: 18 },
});
