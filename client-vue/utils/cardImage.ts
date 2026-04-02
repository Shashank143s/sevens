import type { Suit } from '@shared/types'
import { resolveCardTheme, type CardTheme } from '~/constants/cardThemes'

const cardAssetModules = import.meta.glob('../assets/images/{cards,wwe-legends,wwe-womans}/*.{png,jpg}', {
  eager: true,
  import: 'default',
}) as Record<string, string>

export function getCardImageSrc(card: { suit: Suit; rank: number }, theme?: CardTheme | string | null) {
  const resolvedTheme = resolveCardTheme(theme)
  const assetPath = `../assets/images/${resolvedTheme.assetFolder}/${card.suit}-${card.rank}.${resolvedTheme.fileExtension}`

  return cardAssetModules[assetPath]
    ?? cardAssetModules[`../assets/images/cards/${card.suit}-${card.rank}.png`]
}
