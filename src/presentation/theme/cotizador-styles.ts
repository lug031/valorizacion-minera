import { StyleSheet } from 'react-native';

/** Estilo hoja comercial / Excel — compacto, legible en campo. */
export const cotizadorColors = {
  headerBg: '#1a3a5c',
  headerText: '#ffffff',
  sectionBg: '#ffffff',
  sectionBorder: '#b8c4d0',
  sectionTitleBg: '#dce6f0',
  metalGold: '#8b6914',
  metalSilver: '#5c6b7a',
  metalGoldBg: '#fff8e6',
  metalSilverBg: '#f0f4f8',
  readonlyBg: '#eef2f6',
  readonlyBorder: '#c5d0db',
  resultsBg: '#e8f0f8',
  resultsTotalBg: '#1a3a5c',
  resultsTotalText: '#ffffff',
  highlightRow: '#f5f9fc',
};

export const cotizadorStyles = StyleSheet.create({
  sheet: {
    backgroundColor: cotizadorColors.sectionBg,
    borderWidth: 1,
    borderColor: cotizadorColors.sectionBorder,
    borderRadius: 4,
    marginBottom: 10,
    overflow: 'hidden',
  },
  sectionTitleBar: {
    backgroundColor: cotizadorColors.sectionTitleBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: cotizadorColors.sectionBorder,
  },
  sectionTitleText: {
    fontWeight: '700',
    fontSize: 13,
    color: '#1a3a5c',
    letterSpacing: 0.3,
  },
  sectionBody: {
    padding: 8,
  },
  headerBar: {
    backgroundColor: cotizadorColors.headerBg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 4,
    marginBottom: 10,
  },
  headerCode: {
    color: cotizadorColors.headerText,
    fontWeight: '800',
    fontSize: 18,
  },
  headerMeta: {
    color: '#c8d8e8',
    fontSize: 13,
    marginTop: 2,
  },
  headerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 6,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 8,
  },
  col: {
    flex: 1,
    minWidth: 0,
  },
  metalHeader: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 3,
    marginBottom: 6,
    alignItems: 'center',
  },
  metalHeaderGold: {
    backgroundColor: cotizadorColors.metalGoldBg,
    borderWidth: 1,
    borderColor: '#e8d4a0',
  },
  metalHeaderSilver: {
    backgroundColor: cotizadorColors.metalSilverBg,
    borderWidth: 1,
    borderColor: '#c5d0db',
  },
  metalHeaderText: {
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 1,
  },
  inlineRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  globalField: {
    marginBottom: 4,
  },
  resultsHero: {
    backgroundColor: cotizadorColors.resultsTotalBg,
    padding: 12,
    borderRadius: 4,
    marginTop: 8,
    alignItems: 'center',
  },
  resultsHeroLabel: {
    color: '#a8c4dc',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultsHeroValue: {
    color: cotizadorColors.resultsTotalText,
    fontWeight: '800',
    fontSize: 26,
    marginTop: 4,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  resultRowAlt: {
    backgroundColor: cotizadorColors.highlightRow,
  },
  comparisonToggle: {
    marginVertical: 6,
    alignSelf: 'flex-start',
  },
});
