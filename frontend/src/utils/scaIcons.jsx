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
  },
  // 5. STUDIO: Swiss minimalist typographical symbols & geometric micro-indicators
  studio: {
    floral: '◇',
    herbal: '◈',
    berries: '◉',
    citrus: '◎',
    fruit: '⊛',
    sweet: '◇',
    nuts: '▪',
    chocolate: '▫',
    spices: '✦',
    cereals: '✧',
    roasted: '▲',
    tobacco: '■',
    vegetal: '◆',
    fermented: '❖',
    acidity: '⚡',
    default: '◈'
  }
};

/**
 * Maps flavor note descriptors to corresponding SCA Flavor Wheel icons,
 * optionally styled for 'blueprint' | 'neobrutalist' | 'diner' | 'kissaten' | 'studio'
 */
export function getScaWheelIcon(tagLabel, style = null) {
  const cat = getScaCategory(tagLabel);

  if (style) {
    const s = String(style).toLowerCase();
    let norm = 'blueprint';
    if (s.includes('studio') || s.includes('mono') || s.includes('swiss') || s.includes('grid')) norm = 'studio';
    else if (s.includes('blue') || s.includes('cyan') || s.includes('tech')) norm = 'blueprint';
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
    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '4px' }}>
      {notesList.map((note, idx) => {
        const colors = getScaColorForNote(note);
        return (
          <span key={idx} style={{
            fontSize: '10px',
            fontWeight: '800',
            padding: '3px 7px',
            borderRadius: '6px',
            backgroundColor: colors.bg,
            border: `1.5px solid ${colors.border}`,
            color: colors.text,
            textTransform: 'uppercase',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {getScaIcon(note, 12, 2.5)}
            {note}
          </span>
        );
      })}
    </div>
  );
}

export const SCA_CANVAS_PALETTE = {
  floral:    { bg: '#F3E8FF', border: '#9333EA', icon: '#7E22CE', badgeBg: '#9333EA', badgeIcon: '#FFFFFF' },
  herbal:    { bg: '#DCFCE7', border: '#16A34A', icon: '#15803D', badgeBg: '#16A34A', badgeIcon: '#FFFFFF' },
  berries:   { bg: '#FFE4E6', border: '#E11D48', icon: '#BE123C', badgeBg: '#E11D48', badgeIcon: '#FFFFFF' },
  citrus:    { bg: '#FEF3C7', border: '#D97706', icon: '#B45309', badgeBg: '#EA580C', badgeIcon: '#FFFFFF' },
  fruit:     { bg: '#FFEDD5', border: '#EA580C', icon: '#C2410C', badgeBg: '#F97316', badgeIcon: '#FFFFFF' },
  sweet:     { bg: '#FEF9C3', border: '#CA8A04', icon: '#A16207', badgeBg: '#D97706', badgeIcon: '#FFFFFF' },
  nuts:      { bg: '#FDE68A', border: '#92400E', icon: '#78350F', badgeBg: '#92400E', badgeIcon: '#FFFFFF' },
  chocolate: { bg: '#F5EFE6', border: '#57534E', icon: '#44403C', badgeBg: '#57361C', badgeIcon: '#FFFFFF' },
  spices:    { bg: '#FEE2E2', border: '#DC2626', icon: '#B91C1C', badgeBg: '#DC2626', badgeIcon: '#FFFFFF' },
  cereals:   { bg: '#FEF3C7', border: '#B45309', icon: '#92400E', badgeBg: '#B45309', badgeIcon: '#FFFFFF' },
  roasted:   { bg: '#FFEDD5', border: '#C2410C', icon: '#9A3412', badgeBg: '#C2410C', badgeIcon: '#FFFFFF' },
  tobacco:   { bg: '#E7E5E4', border: '#57534E', icon: '#44403C', badgeBg: '#57534E', badgeIcon: '#FFFFFF' },
  vegetal:   { bg: '#D1FAE5', border: '#059669', icon: '#047857', badgeBg: '#059669', badgeIcon: '#FFFFFF' },
  fermented: { bg: '#FCE7F3', border: '#BE185D', icon: '#9D174D', badgeBg: '#BE185D', badgeIcon: '#FFFFFF' },
  acidity:   { bg: '#E0F2FE', border: '#0284C7', icon: '#0369A1', badgeBg: '#0284C7', badgeIcon: '#FFFFFF' },
  default:   { bg: '#F1F5F9', border: '#475569', icon: '#334155', badgeBg: '#334155', badgeIcon: '#FFFFFF' }
};

export function getScaCanvasPalette(tagLabel) {
  const cat = getScaCategory(tagLabel);
  return SCA_CANVAS_PALETTE[cat] || SCA_CANVAS_PALETTE.default;
}

/**
 * Draws a crisp, custom-illustrated SCA Flavor Wheel vector icon inside a semantic circular badge on Canvas 2D.
 * Supports all 15 SCA Flavor families + default Coffee Bean.
 */
export function drawScaCanvasIcon(ctx, tagLabel, cx, cy, radius = 15, options = {}) {
  const cat = getScaCategory(tagLabel);
  const pal = SCA_CANVAS_PALETTE[cat] || SCA_CANVAS_PALETTE.default;
  const badgeBg = options.badgeBg || pal.badgeBg;
  const fg = options.iconColor || '#FFFFFF';

  ctx.save();

  // 1. Semantic Circular Badge Container with subtle inner highlight ring
  ctx.fillStyle = badgeBg;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = options.borderColor || 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = options.borderWidth || 1.5;
  ctx.stroke();

  // 2. Crisp, Bold Vector Silhouette Icon inside Badge
  ctx.strokeStyle = fg;
  ctx.fillStyle = fg;
  ctx.lineWidth = Math.max(2.0, radius * 0.16);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const r = radius * 0.64;

  switch (cat) {
    case 'floral': {
      // Bold 5-petal blossom with contrasting pistil
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
        const px = cx + Math.cos(a) * (r * 0.56);
        const py = cy + Math.sin(a) * (r * 0.56);
        ctx.beginPath();
        ctx.arc(px, py, r * 0.42, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = badgeBg;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'berries': {
      // Twin cherries with joined stems & leaf
      const c1x = cx - r * 0.42;
      const c2x = cx + r * 0.42;
      const cyBerry = cy + r * 0.38;
      const stemTopX = cx + r * 0.1;
      const stemTopY = cy - r * 0.85;
      ctx.beginPath();
      ctx.moveTo(c1x, cyBerry - r * 0.2);
      ctx.quadraticCurveTo(cx - r * 0.2, cy - r * 0.45, stemTopX, stemTopY);
      ctx.moveTo(c2x, cyBerry - r * 0.2);
      ctx.quadraticCurveTo(cx + r * 0.25, cy - r * 0.45, stemTopX, stemTopY);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(c1x, cyBerry, r * 0.42, 0, Math.PI * 2);
      ctx.arc(c2x, cyBerry, r * 0.42, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'citrus': {
      // Bold Citrus Wedge / Wheel with segments
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.92, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = badgeBg;
      for (let i = 0; i < 6; i++) {
        const a1 = (i * Math.PI) / 3 + 0.14;
        const a2 = ((i + 1) * Math.PI) / 3 - 0.14;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos((a1 + a2) / 2) * r * 0.16, cy + Math.sin((a1 + a2) / 2) * r * 0.16);
        ctx.arc(cx, cy, r * 0.72, a1, a2);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case 'fruit': {
      // Peach / Apple silhouette with top leaf
      ctx.beginPath();
      ctx.arc(cx - r * 0.22, cy + r * 0.18, r * 0.56, 0, Math.PI * 2);
      ctx.arc(cx + r * 0.22, cy + r * 0.18, r * 0.56, 0, Math.PI * 2);
      ctx.fill();
      // Stem & Leaf
      ctx.beginPath();
      ctx.moveTo(cx, cy - r * 0.35);
      ctx.lineTo(cx, cy - r * 0.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx + r * 0.32, cy - r * 0.72, r * 0.32, r * 0.16, -Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'sweet': {
      // Golden Honey Drop with inner highlight
      ctx.beginPath();
      ctx.moveTo(cx, cy - r * 0.95);
      ctx.bezierCurveTo(cx + r * 0.92, cy - r * 0.05, cx + r * 0.82, cy + r * 0.95, cx, cy + r * 0.95);
      ctx.bezierCurveTo(cx - r * 0.82, cy + r * 0.95, cx - r * 0.92, cy - r * 0.05, cx, cy - r * 0.95);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = badgeBg;
      ctx.lineWidth = Math.max(1.6, radius * 0.12);
      ctx.beginPath();
      ctx.arc(cx - r * 0.18, cy + r * 0.22, r * 0.28, Math.PI * 0.55, Math.PI * 1.15);
      ctx.stroke();
      break;
    }
    case 'chocolate': {
      // Solid Chocolate Bar Grid (2x2 squares)
      const s = r * 0.68;
      const g = r * 0.14;
      ctx.fillRect(cx - s - g / 2, cy - s - g / 2, s, s);
      ctx.fillRect(cx + g / 2, cy - s - g / 2, s, s);
      ctx.fillRect(cx - s - g / 2, cy + g / 2, s, s);
      ctx.fillRect(cx + g / 2, cy + g / 2, s, s);
      break;
    }
    case 'nuts': {
      // Acorn / Hazelnut with textured dome cap
      ctx.beginPath();
      ctx.arc(cx, cy + r * 0.15, r * 0.68, 0, Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx, cy - r * 0.15, r * 0.82, r * 0.38, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx, cy - r * 0.5);
      ctx.lineTo(cx + r * 0.2, cy - r * 0.9);
      ctx.stroke();
      break;
    }
    case 'spices': {
      // 4-point star burst + satellite sparkles
      ctx.beginPath();
      ctx.moveTo(cx, cy - r);
      ctx.quadraticCurveTo(cx, cy, cx + r, cy);
      ctx.quadraticCurveTo(cx, cy, cx, cy + r);
      ctx.quadraticCurveTo(cx, cy, cx - r, cy);
      ctx.quadraticCurveTo(cx, cy, cx, cy - r);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + r * 0.62, cy - r * 0.62, r * 0.18, 0, Math.PI * 2);
      ctx.arc(cx - r * 0.62, cy + r * 0.62, r * 0.18, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'herbal':
    case 'vegetal': {
      // Bold Botanical Leaf with cut-out central vein
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.8, cy + r * 0.8);
      ctx.quadraticCurveTo(cx - r * 0.85, cy - r * 0.85, cx + r * 0.85, cy - r * 0.85);
      ctx.quadraticCurveTo(cx + r * 0.85, cy + r * 0.85, cx - r * 0.8, cy + r * 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = badgeBg;
      ctx.lineWidth = Math.max(1.8, radius * 0.14);
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.75, cy + r * 0.75);
      ctx.lineTo(cx + r * 0.45, cy - r * 0.45);
      ctx.stroke();
      break;
    }
    case 'fermented': {
      // Filled Wine / Goblet Chalice
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.72, cy - r * 0.85);
      ctx.lineTo(cx + r * 0.72, cy - r * 0.85);
      ctx.quadraticCurveTo(cx + r * 0.72, cy + r * 0.2, cx, cy + r * 0.2);
      ctx.quadraticCurveTo(cx - r * 0.72, cy + r * 0.2, cx - r * 0.72, cy - r * 0.85);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx, cy + r * 0.15);
      ctx.lineTo(cx, cy + r * 0.88);
      ctx.moveTo(cx - r * 0.52, cy + r * 0.88);
      ctx.lineTo(cx + r * 0.52, cy + r * 0.88);
      ctx.stroke();
      break;
    }
    case 'acidity': {
      // Bright Acidity Lightning Bolt
      ctx.beginPath();
      ctx.moveTo(cx + r * 0.2, cy - r);
      ctx.lineTo(cx - r * 0.68, cy + r * 0.1);
      ctx.lineTo(cx + r * 0.05, cy + r * 0.1);
      ctx.lineTo(cx - r * 0.2, cy + r);
      ctx.lineTo(cx + r * 0.68, cy - r * 0.1);
      ctx.lineTo(cx - r * 0.05, cy - r * 0.1);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'cereals': {
      // Bold Wheat Ear
      ctx.beginPath();
      ctx.moveTo(cx, cy + r * 0.95);
      ctx.lineTo(cx, cy - r * 0.9);
      ctx.stroke();
      [-0.35, 0.25].forEach(offsetY => {
        ctx.beginPath();
        ctx.ellipse(cx - r * 0.42, cy + r * offsetY, r * 0.35, r * 0.18, Math.PI / 4, 0, Math.PI * 2);
        ctx.ellipse(cx + r * 0.42, cy + r * offsetY, r * 0.35, r * 0.18, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
    }
    case 'roasted':
    case 'tobacco': {
      // Bold Roast Flame Silhouette
      ctx.beginPath();
      ctx.moveTo(cx, cy - r * 0.98);
      ctx.bezierCurveTo(cx + r * 0.95, cy - r * 0.15, cx + r * 0.78, cy + r * 0.95, cx, cy + r * 0.95);
      ctx.bezierCurveTo(cx - r * 0.78, cy + r * 0.95, cx - r * 0.95, cy - r * 0.15, cx, cy - r * 0.98);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = badgeBg;
      ctx.beginPath();
      ctx.arc(cx, cy + r * 0.35, r * 0.32, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    default: {
      // Solid Coffee Bean with S-crease
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * 0.86, r * 0.62, -Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = badgeBg;
      ctx.lineWidth = Math.max(1.8, radius * 0.15);
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.65, cy + r * 0.32);
      ctx.bezierCurveTo(cx - r * 0.15, cy - r * 0.35, cx + r * 0.15, cy + r * 0.35, cx + r * 0.65, cy - r * 0.32);
      ctx.stroke();
      break;
    }
  }

  ctx.restore();
}



