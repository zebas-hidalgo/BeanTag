// V5 themes: 'auto' (follows the OS), 'light' (Crema), 'dark' (Tueste).
// Any legacy id (classic, studio, matcha, cyber, sakura, caramel, frost, espresso, kissaten) maps to 'auto'.
export function normalizeTheme(value) {
  return value === 'light' || value === 'dark' ? value : 'auto';
}
