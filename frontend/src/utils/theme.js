export const THEME_OPTIONS = [
  { id: 'auto', label: 'Automático', desc: 'Según el sistema', swatch: 'linear-gradient(135deg, #FAF9F7 50%, #1C1815 50%)', accent: '#8E5226', mode: 'auto' },
  { id: 'light', label: 'Crema', desc: 'Claro cálido', swatch: '#FAF9F7', accent: '#8E5226', mode: 'light' },
  { id: 'dark', label: 'Tueste', desc: 'Oscuro tostado', swatch: '#1C1815', accent: '#E0A46A', mode: 'dark' },
  { id: 'matcha', label: 'Matcha Uji', desc: 'Claro ceremonial', swatch: '#F7FAF6', accent: '#2D6A4F', mode: 'light' },
  { id: 'gesha', label: 'Gesha Floral', desc: 'Claro rosado', swatch: '#FCF9FA', accent: '#B23A58', mode: 'light' },
  { id: 'nordic', label: 'Nórdico', desc: 'Claro pizarra', swatch: '#F6F9FC', accent: '#1D5B8C', mode: 'light' },
  { id: 'kissaten', label: 'Kissaten', desc: 'Noche & ámbar', swatch: '#161E29', accent: '#F2A65A', mode: 'dark' },
  { id: 'espresso', label: 'Espresso OLED', desc: 'Negro puro', swatch: '#000000', accent: '#E68A45', mode: 'dark' }
];

const VALID_THEMES = new Set(THEME_OPTIONS.map((t) => t.id));

export function normalizeTheme(value) {
  return VALID_THEMES.has(value) ? value : 'auto';
}
