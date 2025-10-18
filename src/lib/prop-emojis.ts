/**
 * Helper function to map prop codes to emojis
 * This ensures consistency across the application
 */
export function getEmojiForProp(code: string): string {
  const emojiMap: Record<string, string> = {
    balls: '⚽',
    blocks: '🧱',
    books: '📚',
    building_sets: '🏗️',
    coloring: '🖍️',
    costumes: '🎭',
    crafts: '✂️',
    dolls_figures: '🪆',
    drawing: '🎨',
    music_instruments: '🎵',
    none: '🚫',
    paper_pencil: '📝',
    playdough: '🧈',
    plush_toys: '🧸',
    puppets: '🎪',
    puzzles: '🧩',
    sand_water: '🏖️',
    storytelling: '📖',
    toy_cars: '🚗',
  };
  return emojiMap[code] || '🎯';
}
