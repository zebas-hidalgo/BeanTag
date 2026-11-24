export const THEME_OPTIONS = [
  { id: 'auto', label: 'Automático', desc: 'Según el sistema', swatch: 'linear-gradient(135deg, #FAF9F7 50%, #1C1815 50%)', accent: '#8E5226', mode: 'auto' },
  { id: 'light', label: 'Crema', desc: 'Claro cálido', swatch: '#FAF9F7', accent: '#8E5226', mode: 'light' },
  { id: 'terracotta', label: 'Terracota', desc: 'Arcilla artesanal', swatch: '#FAF4EE', accent: '#B84A2E', mode: 'light' },
  { id: 'matcha', label: 'Matcha Uji', desc: 'Claro ceremonial', swatch: '#F7FAF6', accent: '#2D6A4F', mode: 'light' },
  { id: 'sakura', label: 'Sakura', desc: 'Papel rosado', swatch: '#FDF6F8', accent: '#C95476', mode: 'light' },
  { id: 'yuzu', label: 'Yuzu Crema', desc: 'Cítrico suave', swatch: '#FCFBF2', accent: '#A97810', mode: 'light' },
  { id: 'lavanda', label: 'Lavanda', desc: 'Floral editorial', swatch: '#F7F4FC', accent: '#6D4C9E', mode: 'light' },
  { id: 'porcelana', label: 'Porcelana', desc: 'Cerámica azul', swatch: '#F4F8FC', accent: '#285C84', mode: 'light' },
  { id: 'gesha', label: 'Gesha Floral', desc: 'Botánico claro', swatch: '#FCF9FA', accent: '#B23A58', mode: 'light' },
  { id: 'nordic', label: 'Nórdico', desc: 'Pizarra clara', swatch: '#F6F9FC', accent: '#1D5B8C', mode: 'light' },
  { id: 'dark', label: 'Tueste', desc: 'Oscuro tostado', swatch: '#1C1815', accent: '#E0A46A', mode: 'dark' },
  { id: 'bosque', label: 'Bosque', desc: 'Pino nocturno', swatch: '#101915', accent: '#62BA90', mode: 'dark' },
  { id: 'cobre', label: 'Cobre', desc: 'Grafito & cobre', swatch: '#151517', accent: '#D88557', mode: 'dark' },
  { id: 'borgona', label: 'Borgoña', desc: 'Vino oscuro', swatch: '#1B1115', accent: '#DE6D88', mode: 'dark' },
  { id: 'indigo', label: 'Medianoche', desc: 'Índigo profundo', swatch: '#101423', accent: '#7E9CF8', mode: 'dark' },
  { id: 'kissaten', label: 'Kissaten', desc: 'Noche & ámbar', swatch: '#161E29', accent: '#F2A65A', mode: 'dark' },
  { id: 'espresso', label: 'Espresso OLED', desc: 'Negro puro', swatch: '#000000', accent: '#E68A45', mode: 'dark' }
];

const VALID_THEMES = new Set(THEME_OPTIONS.map((t) => t.id));

export function normalizeTheme(value) {
  return VALID_THEMES.has(value) ? value : 'auto';
}
