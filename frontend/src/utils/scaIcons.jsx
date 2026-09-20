import React from 'react';
import { 
  Cherry, Apple, Citrus, Flower2, Candy, Droplet, 
  Cookie, Leaf, Sparkles, Flame, Wine, Coffee, 
  AlertTriangle, Bean, Wheat, Sprout, Cigarette 
} from 'lucide-react';

export const getScaIcon = (tagLabel, size = 14, strokeWidth = 2.5) => {
  if (!tagLabel) return <Coffee size={size} strokeWidth={strokeWidth} />;
  
  const text = tagLabel.toLowerCase();
  
  // 1. Floral
  if (text.includes('flores') || text.includes('rosa') || text.includes('jazmín') || text.includes('flor de café') || text.includes('floral')) {
    return <Flower2 size={size} strokeWidth={strokeWidth} />;
  }
  
  // 2. Té / Hierbas
  if (text.includes('té') || text.includes('hierba') || text.includes('heno') || text.includes('menta') || text.includes('romero')) {
    return <Leaf size={size} strokeWidth={strokeWidth} />;
  }
  
  // 3. Bayas / Frutos rojos
  if (text.includes('mora') || text.includes('frambuesa') || text.includes('arándano') || text.includes('fresa') || text.includes('frutilla') || text.includes('cereza') || text.includes('bayas')) {
    return <Cherry size={size} strokeWidth={strokeWidth} />;
  }
  
  // 4. Cítricos
  if (text.includes('limón') || text.includes('lima') || text.includes('naranja') || text.includes('pomelo') || text.includes('toronja') || text.includes('cítrico') || text.includes('cítricos')) {
    return <Citrus size={size} strokeWidth={strokeWidth} />;
  }
  
  // 5. Frutas dulces / secas / otras
  if (
    text.includes('pasa') || text.includes('higo') || text.includes('ciruela') || 
    text.includes('manzana') || text.includes('pera') || text.includes('uva') || 
    text.includes('melocotón') || text.includes('durazno') || text.includes('piña') || 
    text.includes('coco') || text.includes('granada')
  ) {
    return <Apple size={size} strokeWidth={strokeWidth} />;
  }
  
  // 6. Dulces / Caramelos / Azúcares
  if (
    text.includes('melaza') || text.includes('arce') || text.includes('caramelo') || 
    text.includes('miel') || text.includes('panela') || text.includes('vainilla') || 
    text.includes('azúcar') || text.includes('dulce') || text.includes('malvavisco')
  ) {
    return <Candy size={size} strokeWidth={strokeWidth} />;
  }
  
  // 7. Frutos secos
  if (
    text.includes('almendra') || text.includes('avellana') || text.includes('nuez') || 
    text.includes('pecana') || text.includes('maní') || text.includes('cacahuate') || 
    text.includes('frutos secos')
  ) {
    return <Cookie size={size} strokeWidth={strokeWidth} />;
  }
  
  // 8. Cacao / Chocolate
  if (text.includes('chocolate') || text.includes('cacao') || text.includes('nibs')) {
    return <Bean size={size} strokeWidth={strokeWidth} />;
  }
  
  // 9. Especias
  if (
    text.includes('canela') || text.includes('clavo') || text.includes('moscada') || 
    text.includes('anís') || text.includes('pimienta') || text.includes('curri') || 
    text.includes('especias')
  ) {
    return <Sparkles size={size} strokeWidth={strokeWidth} />;
  }
  
  // 10. Cereales
  if (text.includes('malta') || text.includes('cebada') || text.includes('avena') || text.includes('grano') || text.includes('cereales')) {
    return <Wheat size={size} strokeWidth={strokeWidth} />;
  }
  
  // 11. Ahumado / Tostado
  if (text.includes('humo') || text.includes('ceniza') || text.includes('quemada') || text.includes('acre') || text.includes('tostado')) {
    return <Flame size={size} strokeWidth={strokeWidth} />;
  }
  
  // 12. Tabaco
  if (text.includes('tabaco') || text.includes('pipa')) {
    return <Cigarette size={size} strokeWidth={strokeWidth} />;
  }
  
  // 13. Vegetal / Crudos
  if (
    text.includes('vegetal') || text.includes('vaina') || text.includes('aceite') || 
    text.includes('tierra') || text.includes('humedad') || text.includes('fresca') || 
    text.includes('crudos')
  ) {
    return <Sprout size={size} strokeWidth={strokeWidth} />;
  }
  
  // 14. Alcohol / Fermentado
  if (text.includes('vino') || text.includes('whiskey') || text.includes('alcohol') || text.includes('fermentado') || text.includes('licorosa')) {
    return <Wine size={size} strokeWidth={strokeWidth} />;
  }
  
  // 15. Ácidos
  if (text.includes('ácido') || text.includes('málico') || text.includes('acético') || text.includes('vinagre')) {
    return <Droplet size={size} strokeWidth={strokeWidth} />;
  }
  
  return <Coffee size={size} strokeWidth={strokeWidth} />;
};

export const stripEmojis = (text) => {
  if (!text) return '';
  return text.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim();
};

export function getScaColorForNote(note) {
  const n = String(note || '').toLowerCase().trim();
  if (!n) return { bg: 'var(--bg-canvas)', border: 'var(--border-color)', text: 'var(--color-text)' };

  // 1. Floral (Purple / Violet)
  if (/jazmín|jazmin|flor|rosa|lavanda|hibisco|violeta|manzanilla|té|te|floral/i.test(n)) {
    return { bg: '#FAF5FF', border: '#9333EA', text: '#6B21A8' };
  }

  // 2. Afrutado - Bayas & Frutos Rojos (Carmesí / Magenta)
  if (/fresa|frutilla|mora|frambuesa|arándano|berry|frutos rojos|cereza|grosella/i.test(n)) {
    return { bg: '#FFF1F2', border: '#E11D48', text: '#9F1239' };
  }

  // 3. Afrutado - Cítricos & Frutas Frescas (Naranja / Amarillo Dorado)
  if (/limón|limon|lima|naranja|mandarina|pomelo|toronja|bergamota|cítrico|citrico|manzana|pera|uva/i.test(n)) {
    return { bg: '#FFFBEB', border: '#D97706', text: '#92400E' };
  }

  // 4. Afrutado - Frutas Tropicales & Deshidratadas (Coral / Maracuyá)
  if (/mango|maracuyá|maracuya|parchita|papaya|piña|pina|guayaba|lichi|coco|higo|dátil|datil|pasa|durazno|melocotón|albaricoque/i.test(n)) {
    return { bg: '#FFF7ED', border: '#EA580C', text: '#C2410C' };
  }

  // 5. Dulce - Azúcares & Confitería (Ámbar / Miel)
  if (/melaza|arce|maple|caramelo|miel|panela|chancaca|azúcar|azucar|vainilla|malvavisco|arequipe|dulce/i.test(n)) {
    return { bg: '#FEF3C7', border: '#B45309', text: '#78350F' };
  }

  // 6. Frutos Secos & Cacao (Marrón Cacao / Nutty)
  if (/chocolate|cacao|nibs|almendra|avellana|nuez|pecana|anacardo|pistacho|macadamia|maní|cacahuate/i.test(n)) {
    return { bg: '#FDF6E2', border: '#78350F', text: '#451A03' };
  }

  // 7. Especias (Rojo Canela / Dorado)
  if (/canela|clavo|moscada|anís|anis|cardamomo|pimienta|jengibre|curri|especias/i.test(n)) {
    return { bg: '#FEF2F2', border: '#DC2626', text: '#991B1B' };
  }

  // 8. Tostado & Cereales (Tostado / Tabaco)
  if (/malta|cebada|avena|pan|tostado|humo|ceniza|tabaco|cuero|graham/i.test(n)) {
    return { bg: '#F5F5F4', border: '#78716C', text: '#292524' };
  }

  // 9. Verde / Vegetal & Hierbas (Verde Menta / Botánico)
  if (/hierba|heno|menta|eucalipto|romero|salvia|lúpulo|lupulo|guisante|aceite|oliva|tierra|madera|cedro|musgo/i.test(n)) {
    return { bg: '#ECFDF5', border: '#059669', text: '#064E3B' };
  }

  // 10. Ácido / Fermentado (Vino / Borgoña)
  if (/vino|champagne|whiskey|bourbon|ron|kombucha|licorosa|anaeróbico|anaerobico|maceración|maceracion|fermentado|vinagre/i.test(n)) {
    return { bg: '#FFF5F7', border: '#BE123C', text: '#881337' };
  }

  return { bg: '#F1F5F9', border: '#64748B', text: '#0F172A' };
}

export function cleanNotesString(notes) {
  if (!notes) return '';
  let str = stripEmojis(String(notes)).trim();
  // Strip [Notas: ...] or [Nota: ...] or [Notes: ...]
  str = str.replace(/\[\s*(?:notas?|notes?)\s*:\s*([^\]]+)\]/gi, '$1');
  // Strip leading [Notas: or Notas: or [Nota: or Nota: or [Notes: or Notes: or [
  str = str.replace(/^\s*\[?\s*(?:notas?|notes?)\s*:?\s*/gi, '');
  // Strip closing ] or dangling brackets
  str = str.replace(/[\[\]]/g, '');
  return str.trim();
}

/**
 * Classifies a flavor descriptor into one of the official SCA categories
 */
export function getScaCategory(tagLabel) {
  if (!tagLabel) return 'default';
  const text = String(tagLabel).toLowerCase().trim();

  // 1. Floral (Flores, Jazmín, Rosa, Lavanda, Manzanilla, Hibisco)
  if (text.includes('flor') || text.includes('rosa') || text.includes('jazm') || text.includes('lavand') || text.includes('hibisc') || text.includes('violeta') || text.includes('manzanilla')) {
    return 'floral';
  }

  // 2. Té / Hierbas (Té negro, Té verde, Hierba, Menta, Romero, etc.)
  if (text.includes('té') || text.includes('te ') || text.includes('hierba') || text.includes('heno') || text.includes('menta') || text.includes('romero') || text.includes('eucalipto') || text.includes('salvia') || text.includes('lúpulo') || text.includes('lupulo')) {
    return 'herbal';
  }

  // 3. Bayas / Frutos rojos (Mora, Frambuesa, Arándano, Fresa, Cereza, Grosella)
  if (text.includes('mora') || text.includes('frambuesa') || text.includes('arándano') || text.includes('arandano') || text.includes('fresa') || text.includes('frutilla') || text.includes('cereza') || text.includes('baya') || text.includes('berry') || text.includes('grosella')) {
    return 'berries';
  }

  // 4. Cítricos (Limón, Lima, Naranja, Mandarina, Pomelo, Toronja, Bergamota)
  if (text.includes('limón') || text.includes('limon') || text.includes('lima') || text.includes('naranja') || text.includes('mandarina') || text.includes('pomelo') || text.includes('toronja') || text.includes('bergamota') || text.includes('cítric') || text.includes('citric')) {
    return 'citrus';
  }

  // 5. Frutas dulces / hueso / tropicales (Melocotón, Durazno, Mango, Maracuyá, Piña, Papaya, Manzana, Pera, Uva, etc.)
  if (
    text.includes('melocotón') || text.includes('melocoton') || text.includes('durazno') || text.includes('albaricoque') || text.includes('damasco') ||
    text.includes('mango') || text.includes('maracuyá') || text.includes('maracuya') || text.includes('parchita') || text.includes('papaya') ||
    text.includes('piña') || text.includes('pina') || text.includes('guayaba') || text.includes('lichi') || text.includes('coco') ||
    text.includes('manzana') || text.includes('pera') || text.includes('uva') || text.includes('higo') || text.includes('dátil') || text.includes('datil') ||
    text.includes('ciruela') || text.includes('pasa') || text.includes('granada') || text.includes('fruta')
  ) {
    return 'fruit';
  }

  // 6. Dulces / Caramelos / Azúcares / Miel
  if (
    text.includes('melaza') || text.includes('arce') || text.includes('maple') || text.includes('caramelo') ||
    text.includes('miel') || text.includes('panela') || text.includes('chancaca') || text.includes('azúcar') || text.includes('azucar') ||
    text.includes('vainilla') || text.includes('malvavisco') || text.includes('arequipe') || text.includes('dulce') || text.includes('toffee') ||
    text.includes('turrón') || text.includes('turron')
  ) {
    return 'sweet';
  }

  // 7. Frutos secos
  if (
    text.includes('almendra') || text.includes('avellana') || text.includes('nuez') || text.includes('pecana') ||
    text.includes('maní') || text.includes('mani') || text.includes('cacahuate') || text.includes('pistacho') ||
    text.includes('macadamia') || text.includes('anacardo') || text.includes('castaña') || text.includes('caju') ||
    text.includes('frutos secos')
  ) {
    return 'nuts';
  }

  // 8. Cacao / Chocolate
  if (text.includes('chocolate') || text.includes('cacao') || text.includes('nibs')) {
    return 'chocolate';
  }

  // 9. Especias
  if (
    text.includes('canela') || text.includes('clavo') || text.includes('moscada') || text.includes('anís') || text.includes('anis') ||
    text.includes('cardamomo') || text.includes('pimienta') || text.includes('jengibre') || text.includes('curri') || text.includes('especias')
  ) {
    return 'spices';
  }

  // 10. Cereales
  if (text.includes('malta') || text.includes('cebada') || text.includes('avena') || text.includes('grano') || text.includes('pan') || text.includes('graham') || text.includes('cereal')) {
    return 'cereals';
  }

  // 11. Ahumado / Tostado
  if (text.includes('humo') || text.includes('ceniza') || text.includes('quemad') || text.includes('acre') || text.includes('tostado')) {
    return 'roasted';
  }

  // 12. Tabaco
  if (text.includes('tabaco') || text.includes('pipa') || text.includes('cuero')) {
    return 'tobacco';
  }

  // 13. Vegetal / Crudos
  if (text.includes('vegetal') || text.includes('vaina') || text.includes('aceite') || text.includes('tierra') || text.includes('humedad') || text.includes('fresca') || text.includes('crudos') || text.includes('oliva') || text.includes('musgo') || text.includes('cedro')) {
    return 'vegetal';
  }

  // 14. Alcohol / Fermentado
  if (text.includes('vino') || text.includes('whiskey') || text.includes('alcohol') || text.includes('fermentado') || text.includes('licor') || text.includes('ron') || text.includes('bourbon') || text.includes('champagne') || text.includes('kombucha') || text.includes('anaerób') || text.includes('anaerob') || text.includes('maceraci')) {
    return 'fermented';
  }

  // 15. Ácidos
  if (text.includes('ácido') || text.includes('acido') || text.includes('málico') || text.includes('malico') || text.includes('acético') || text.includes('acetico') || text.includes('vinagre') || text.includes('acidez')) {
    return 'acidity';
  }

  return 'default';
}

/**
 * Curated, aesthetic icon sets tailored to each visual style
 */
export const STYLE_SCA_ICONS = {
  // 1. BLUEPRINT: Technical CAD, schematic drafting, patent engineering markers
  blueprint: {
    floral: '⊛',
    herbal: '☘',
    berries: '◈',
    citrus: '◐',
    fruit: '◉',
    sweet: '◇',
    nuts: '⬡',
    chocolate: '▦',
    spices: '✦',
    cereals: '◬',
    roasted: '▲',
    tobacco: '▰',
    vegetal: '⌖',
    fermented: '▽',
    acidity: '⚡',
    default: '◈'
  },
  // 2. NEOBRUTALIST: Chunky, pop-art bold stamps, high-contrast graphic punch
  neobrutalist: {
    floral: '✿',
    herbal: '☘',
    berries: '🍒',
    citrus: '⚡',
    fruit: '★',
    sweet: '🍯',
    nuts: '🥜',
    chocolate: '🍫',
    spices: '✦',
    cereals: '▲',
    roasted: '🔥',
    tobacco: '◼',
    vegetal: '🌱',
    fermented: '🍷',
    acidity: '⚡',
    default: '★'
  },
  // 3. DINER: Mid-century 1950s Atomic Age starbursts, Googie motel symbols, retro americana
  diner: {
    floral: '✻',
    herbal: '☘',
    berries: '✶',
    citrus: '✧',
    fruit: '✪',
    sweet: '✦',
    nuts: '✮',
    chocolate: '★',
    spices: '✴',
    cereals: '✲',
    roasted: '♨',
    tobacco: '✧',
    vegetal: '❆',
    fermented: '🍸',
    acidity: '⚡',
    default: '★'
  },
  // 4. KISSATEN: Tokyo 1960s Showa-era botanical sumi-e crests, washi paper emblems
  kissaten: {
    floral: '❀',
    herbal: '❋',
    berries: '◈',
    citrus: '❂',
    fruit: '✿',
    sweet: '◇',
    nuts: '❖',
    chocolate: '◆',
    spices: '✦',
    cereals: '❊',
    roasted: '♨',
    tobacco: '🍂',
    vegetal: '🌱',
    fermented: '❖',
    acidity: '✧',
    default: '✿'
  }
};

/**
 * Maps flavor note descriptors to corresponding SCA Flavor Wheel icons,
 * optionally styled for 'blueprint' | 'neobrutalist' | 'diner' | 'kissaten'
 */
export function getScaWheelIcon(tagLabel, style = null) {
  const cat = getScaCategory(tagLabel);

  if (style) {
    const s = String(style).toLowerCase();
    let norm = 'blueprint';
    if (s.includes('blue') || s.includes('cyan') || s.includes('tech')) norm = 'blueprint';
    else if (s.includes('neo') || s.includes('brutal') || s.includes('pop')) norm = 'neobrutalist';
    else if (s.includes('diner') || s.includes('retro') || s.includes('1950') || s.includes('aurora')) norm = 'diner';
    else if (s.includes('kissa') || s.includes('japan') || s.includes('tokyo') || s.includes('hang')) norm = 'kissaten';

    const styleSet = STYLE_SCA_ICONS[norm] || STYLE_SCA_ICONS.blueprint;
    return styleSet[cat] || styleSet.default;
  }

  // Standard colorful wheel emoji fallback if no card style specified
  const EMOJI_MAP = {
    floral: '🌸',
    herbal: '🌿',
    berries: '🍒',
    citrus: '🍋',
    fruit: '🍑',
    sweet: '🍯',
    nuts: '🥜',
    chocolate: '🍫',
    spices: '✨',
    cereals: '🌾',
    roasted: '🔥',
    tobacco: '🍂',
    vegetal: '🌱',
    fermented: '🍷',
    acidity: '💧',
    default: '☕'
  };
  return EMOJI_MAP[cat] || '☕';
}

export function RenderScaChips({ notesStr, maxChips = 4 }) {
  if (!notesStr) return null;
  const clean = cleanNotesString(notesStr);
  const notesPart = clean.includes(' | ') ? clean.split(' | ')[0] : clean;
  const notesList = notesPart.split(/[,|•]/).map(s => s.trim()).filter(Boolean).slice(0, maxChips);
  if (notesList.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
      {notesList.map((note, idx) => {
        const colors = getScaColorForNote(note);
        return (
          <span key={idx} style={{
            fontSize: '9.5px',
            fontWeight: '800',
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: colors.bg,
            border: `1.5px solid ${colors.border}`,
            color: colors.text,
            textTransform: 'uppercase',
            display: 'inline-block'
          }}>
            {note}
          </span>
        );
      })}
    </div>
  );
}


