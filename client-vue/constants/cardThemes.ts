export type CardTheme = 'normal' | 'wwe-legends' | 'wwe-womans'

export type CardThemeOption = {
  value: CardTheme
  label: string
  description: string
  assetFolder: 'cards' | 'wwe-legends' | 'wwe-womans'
  fileExtension: 'png' | 'jpg'
}

export const CARD_THEME_OPTIONS: CardThemeOption[] = [
  {
    value: 'normal',
    label: 'Normal',
    description: 'Classic Sevens card faces.',
    assetFolder: 'cards',
    fileExtension: 'png',
  },
  {
    value: 'wwe-legends',
    label: 'WWE Legends',
    description: 'Legend-themed cards for every suit.',
    assetFolder: 'wwe-legends',
    fileExtension: 'jpg',
  },
  {
    value: 'wwe-womans',
    label: "WWE Women's",
    description: 'Women superstars themed card deck.',
    assetFolder: 'wwe-womans',
    fileExtension: 'jpg',
  },
]

export const CARD_THEME_DEFAULT: CardTheme = 'normal'

const cardThemeMap = new Map(CARD_THEME_OPTIONS.map(theme => [theme.value, theme]))

export function resolveCardTheme(theme?: string | null): CardThemeOption {
  return cardThemeMap.get((theme ?? '').trim() as CardTheme) ?? cardThemeMap.get(CARD_THEME_DEFAULT)!
}
