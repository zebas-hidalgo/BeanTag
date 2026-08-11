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

export function RenderScaChips({ notesStr, maxChips = 4 }) {
  if (!notesStr) return null;
  let clean = String(notesStr);
  if (clean.includes('[Notas: ') && clean.includes(']')) {
    const match = clean.match(/\[Notas: (.*?)\]/);
    if (match) clean = match[1];
  }
  if (clean.includes(' | ')) clean = clean.split(' | ')[0];

  const notesList = clean.split(/[,|•]/).map(s => s.trim()).filter(Boolean).slice(0, maxChips);
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

