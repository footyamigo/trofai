// Carousel utility helpers

export function withPeriod(text) {
  if (!text) return '';
  const trimmed = text.trim();
  // If ends with ., !, ?, …, ..., or an emoji, do not add a period
  // Using \p{Emoji_Presentation} for common emojis. May need to expand if other emoji types are used.
  if (/[.!?…](\s*\p{Emoji_Presentation})?$|\p{Emoji_Presentation}$/u.test(trimmed) || trimmed.endsWith('...')) return trimmed;
  return trimmed + '.';
} 