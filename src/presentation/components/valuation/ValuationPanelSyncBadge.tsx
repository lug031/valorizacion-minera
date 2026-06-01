import { Text } from 'react-native-paper';
import {
  valuationPanelSyncColor,
  valuationPanelSyncLabel,
  type ValuationOutboxStatus,
} from '../../utils/valuation-sync-status';

interface Props {
  status: ValuationOutboxStatus | null | undefined;
  errorMessage?: string | null;
  variant?: 'bodySmall' | 'bodyMedium';
}

export function ValuationPanelSyncBadge({ status, errorMessage, variant = 'bodySmall' }: Props) {
  const label = valuationPanelSyncLabel(status);
  const color = valuationPanelSyncColor(status);

  return (
    <>
      <Text variant={variant} style={{ color, fontWeight: '600', marginTop: 4 }}>
        {label}
      </Text>
      {status === 'error' && errorMessage ? (
        <Text variant="bodySmall" style={{ color: '#b42318', marginTop: 2 }}>
          {errorMessage}
        </Text>
      ) : null}
    </>
  );
}
