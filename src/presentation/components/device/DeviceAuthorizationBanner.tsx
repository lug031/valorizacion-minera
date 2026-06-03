import { useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useFocusEffect } from 'expo-router';
import { deviceRepository } from '../../../data/repositories';
import { getCloudDeviceId, getEnrollmentMode } from '../../../infrastructure/device/enrollment-store';
import {
  buildDeviceAuthorizationBanner,
  type DeviceAuthorizationBannerModel,
} from '../../utils/device-binding-status';

const TONE_STYLE = {
  info: { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af' },
  warning: { bg: '#fffbeb', border: '#fde68a', text: '#92400e' },
} as const;

export function DeviceAuthorizationBanner() {
  const [model, setModel] = useState<DeviceAuthorizationBannerModel | null>(null);

  const refresh = useCallback(async () => {
    const mode = await getEnrollmentMode();
    if (mode !== 'enrolled') {
      setModel(null);
      return;
    }
    const cloudDeviceId = await getCloudDeviceId();
    if (!cloudDeviceId) {
      setModel(null);
      return;
    }
    const device = await deviceRepository.getBindingDevice(cloudDeviceId);
    setModel(buildDeviceAuthorizationBanner(device));
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  if (!model) {
    return null;
  }

  const palette = TONE_STYLE[model.tone];

  return (
    <View style={[styles.banner, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      {model.lines.map((line) => (
        <Text key={line} variant="bodySmall" style={[styles.line, { color: palette.text }]}>
          {line}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  line: { lineHeight: 18 },
});
