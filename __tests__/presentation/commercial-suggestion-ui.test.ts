import {
  valuesMatchCommercial,
  formatMaquilaSuggestionLabel,
} from '../../src/presentation/utils/commercial-suggestion-ui';

describe('commercial-suggestion-ui', () => {
  it('valuesMatchCommercial compara números', () => {
    expect(valuesMatchCommercial('140', '140')).toBe(true);
    expect(valuesMatchCommercial('175', '140')).toBe(false);
    expect(valuesMatchCommercial('140.0', '140')).toBe(true);
  });

  it('formatMaquilaSuggestionLabel incluye ley y valor', () => {
    expect(formatMaquilaSuggestionLabel('1.012', '140')).toBe(
      'Sugerido según ley 1.012 oz/tc: 140'
    );
  });
});
