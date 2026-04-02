const CARD_THEMES = ['normal', 'wwe-legends', 'wwe-womans'] as const;

export type CardTheme = (typeof CARD_THEMES)[number];

export const DEFAULT_CARD_THEME: CardTheme = 'normal';

export function normalizeCardTheme(theme?: string | null): CardTheme {
  const value = theme?.trim();
  if (value && CARD_THEMES.includes(value as CardTheme)) {
    return value as CardTheme;
  }
  return DEFAULT_CARD_THEME;
}
