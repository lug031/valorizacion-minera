import { SegmentedButtons } from 'react-native-paper';
import type { ScenarioLabel } from '../../../domain/models/enums';

interface Props {
  labels: Array<{ label: ScenarioLabel; name: string }>;
  activeIndex: number;
  onChange: (index: number) => void;
}

/**
 * Selector A/B/C para alternar escenarios en cotización.
 * Feature preparada para futuras versiones comerciales; oculta en V1 vía flag centralizado.
 */
export function ScenarioTabs({ labels, activeIndex, onChange }: Props) {
  const buttons = labels.map((item, index) => ({
    value: String(index),
    label: `${item.label}`,
    accessibilityLabel: `${item.label}: ${item.name}`,
  }));

  return (
    <SegmentedButtons
      value={String(activeIndex)}
      onValueChange={(v) => onChange(parseInt(v, 10))}
      buttons={buttons}
      style={{ marginBottom: 8 }}
    />
  );
}
