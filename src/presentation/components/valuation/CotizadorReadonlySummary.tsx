import { View } from 'react-native';
import { Text } from 'react-native-paper';
import type { ValuationDraft } from '../../../domain/models/draft';
import type { ValuationCalculationResult } from '../../../domain/models/calculation';
import { calculateTms } from '../../../domain/calculation/tms';
import { CotizadorSection } from '../ui/CotizadorSection';
import { TwoColumnGrid } from '../ui/TwoColumnGrid';
import { ReadonlyMetricField } from '../ui/ReadonlyMetricField';
import { cotizadorStyles, cotizadorColors } from '../../theme/cotizador-styles';
import { formatDisplayDate, formatMoney } from '../../utils/format';
import { ozTcToGrTmDisplay } from '../../utils/grade-display';

interface Props {
  draft: ValuationDraft;
  result: ValuationCalculationResult;
}

function MetalReadonlyCol({
  title,
  ozTc,
  grTm,
  rec,
  isGold,
}: {
  title: string;
  ozTc: string;
  grTm: string;
  rec: string;
  isGold: boolean;
}) {
  return (
    <View>
      <View
        style={[
          cotizadorStyles.metalHeader,
          isGold ? cotizadorStyles.metalHeaderGold : cotizadorStyles.metalHeaderSilver,
        ]}
      >
        <Text
          style={[
            cotizadorStyles.metalHeaderText,
            { color: isGold ? cotizadorColors.metalGold : cotizadorColors.metalSilver },
          ]}
        >
          {title}
        </Text>
      </View>
      <ReadonlyMetricField label="Ley oz/tc" value={ozTc} />
      <ReadonlyMetricField label="Ley gr/tm" value={grTm} />
      <ReadonlyMetricField label="REC %" value={rec} />
    </View>
  );
}

function MetalCommercialReadonlyCol({
  title,
  rc,
  inter,
  isGold,
}: {
  title: string;
  rc: string;
  inter: string;
  isGold: boolean;
}) {
  return (
    <View>
      <View
        style={[
          cotizadorStyles.metalHeader,
          isGold ? cotizadorStyles.metalHeaderGold : cotizadorStyles.metalHeaderSilver,
        ]}
      >
        <Text
          style={[
            cotizadorStyles.metalHeaderText,
            { color: isGold ? cotizadorColors.metalGold : cotizadorColors.metalSilver },
          ]}
        >
          {title}
        </Text>
      </View>
      <ReadonlyMetricField label="RC" value={rc} />
      <ReadonlyMetricField label="INTER" value={inter} />
    </View>
  );
}

export function CotizadorReadonlySummary({ draft, result }: Props) {
  const sc = draft.scenarios[draft.activeScenarioIndex];
  const tms = calculateTms(draft.tmh, draft.h2oPercent);

  return (
    <View>
      <View style={cotizadorStyles.headerBar}>
        <Text style={cotizadorStyles.headerCode}>{draft.code}</Text>
        <Text style={cotizadorStyles.headerMeta}>
          {formatDisplayDate(draft.fecha)} · Tipo MAT: {draft.materialTypeCode}
        </Text>
        {draft.providerName ? (
          <Text style={cotizadorStyles.headerMeta}>{draft.providerName}</Text>
        ) : null}
      </View>

      <CotizadorSection title="DATOS DEL LOTE">
        <View style={cotizadorStyles.inlineRow}>
          <View style={{ flex: 1 }}>
            <ReadonlyMetricField label="TMH" value={draft.tmh} />
          </View>
          <View style={{ flex: 1 }}>
            <ReadonlyMetricField label="H2O %" value={draft.h2oPercent} />
          </View>
        </View>
        <ReadonlyMetricField label="TMS" value={tms?.toFixed(3) ?? result.tms} highlight />
        <ReadonlyMetricField label="Factor" value={draft.factor} />
      </CotizadorSection>

      <CotizadorSection title="LEYES Y RECUPERACIÓN">
        <TwoColumnGrid
          left={
            <MetalReadonlyCol
              title="ORO (AU)"
              ozTc={draft.goldGradeOzTc}
              grTm={ozTcToGrTmDisplay(draft.goldGradeOzTc)}
              rec={draft.recPercentGold}
              isGold
            />
          }
          right={
            <MetalReadonlyCol
              title="PLATA (AG)"
              ozTc={draft.silverGradeOzTc}
              grTm={ozTcToGrTmDisplay(draft.silverGradeOzTc)}
              rec={draft.recPercentSilver}
              isGold={false}
            />
          }
        />
      </CotizadorSection>

      <CotizadorSection title="PARÁMETROS COMERCIALES">
        <TwoColumnGrid
          left={
            <MetalCommercialReadonlyCol
              title="ORO (AU)"
              rc={sc?.rcGold ?? ''}
              inter={sc?.interGold ?? ''}
              isGold
            />
          }
          right={
            <MetalCommercialReadonlyCol
              title="PLATA (AG)"
              rc={sc?.rcSilver ?? ''}
              inter={sc?.interSilver ?? ''}
              isGold={false}
            />
          }
        />
        <ReadonlyMetricField label="Maquila" value={sc?.maquila ?? ''} />
        <ReadonlyMetricField label="Consumos" value={sc?.consumos ?? ''} />
        <ReadonlyMetricField label="Flete" value={sc?.flete ?? ''} />
        <ReadonlyMetricField label="Otros costos" value={sc?.otrosCostos ?? '0'} />
      </CotizadorSection>
    </View>
  );
}
