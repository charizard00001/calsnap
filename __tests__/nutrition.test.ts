import { describe, expect, it } from 'vitest';
import { buildPrompt, parseNutritionJson } from '@/api/_lib/nutrition';

describe('parseNutritionJson', () => {
  const valid = {
    foodName: 'Grilled chicken salad',
    description: 'Chicken breast, greens, vinaigrette',
    servingSize: '1 bowl',
    calories: 420,
    protein: 38,
    carbs: 12,
    fat: 22,
    confidence: 'high',
  };

  it('parses a clean JSON object', () => {
    const result = parseNutritionJson(JSON.stringify(valid));
    expect(result).toEqual(valid);
  });

  it('strips a ```json fenced block', () => {
    const fenced = '```json\n' + JSON.stringify(valid) + '\n```';
    expect(parseNutritionJson(fenced).foodName).toBe('Grilled chicken salad');
  });

  it('strips a bare ``` fence', () => {
    const fenced = '```\n' + JSON.stringify(valid) + '\n```';
    expect(parseNutritionJson(fenced).calories).toBe(420);
  });

  it('clamps negative macros to 0 and rounds', () => {
    const result = parseNutritionJson(
      JSON.stringify({ ...valid, calories: 421.6, protein: -3, fat: 22.2 })
    );
    expect(result.calories).toBe(422);
    expect(result.protein).toBe(0);
    expect(result.fat).toBe(22);
  });

  it('falls back to low confidence for an unexpected value', () => {
    const result = parseNutritionJson(JSON.stringify({ ...valid, confidence: 'S-tier' }));
    expect(result.confidence).toBe('low');
  });

  it('defaults description and servingSize when missing', () => {
    const { description, ...rest } = valid;
    const result = parseNutritionJson(JSON.stringify({ ...rest, servingSize: '' }));
    expect(result.description).toBe('');
    expect(result.servingSize).toBe('Unknown');
  });

  it('throws when a macro is missing', () => {
    const { fat, ...rest } = valid;
    expect(() => parseNutritionJson(JSON.stringify(rest))).toThrow(/Invalid nutrition data/);
  });

  it('throws when a macro is not finite', () => {
    expect(() =>
      parseNutritionJson(JSON.stringify({ ...valid, carbs: 'lots' }))
    ).toThrow(/Invalid nutrition data/);
  });

  it('throws on non-JSON text', () => {
    expect(() => parseNutritionJson('I could not identify the food.')).toThrow();
  });
});

describe('buildPrompt', () => {
  it('embeds the user note', () => {
    expect(buildPrompt('half portion')).toContain('half portion');
  });

  it('asks for JSON only', () => {
    expect(buildPrompt('')).toMatch(/ONLY a valid JSON object/);
  });
});
