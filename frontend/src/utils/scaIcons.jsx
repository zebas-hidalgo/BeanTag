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
