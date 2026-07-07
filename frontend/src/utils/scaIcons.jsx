import React from 'react';
import { Cherry, Apple, Citrus, Flower2, Candy, Droplet, Cookie, Leaf, Sparkles, Flame, Wine, Coffee, AlertTriangle } from 'lucide-react';

export const getScaIcon = (tagLabel, size = 14, strokeWidth = 2.5) => {
  if (!tagLabel) return <Coffee size={size} strokeWidth={strokeWidth} />;
  
  const text = tagLabel.toLowerCase();
  
  if (text.includes('cereza') || text.includes('frutilla') || text.includes('arándano')) {
    return <Cherry size={size} strokeWidth={strokeWidth} />;
  }
  if (text.includes('cítrico') || text.includes('piña')) {
    return <Citrus size={size} strokeWidth={strokeWidth} />;
  }
  if (text.includes('manzana') || text.includes('uva') || text.includes('durazno')) {
    return <Apple size={size} strokeWidth={strokeWidth} />;
  }
  if (text.includes('jazmín') || text.includes('azahar') || text.includes('rosa') || text.includes('floral')) {
    return <Flower2 size={size} strokeWidth={strokeWidth} />;
  }
  if (text.includes('caramelo') || text.includes('vainilla') || text.includes('dulce') || text.includes('miel') || text.includes('melaza')) {
    return <Candy size={size} strokeWidth={strokeWidth} />;
  }
  if (text.includes('chocolate') || text.includes('cacao') || text.includes('maní') || text.includes('avellana') || text.includes('almendra') || text.includes('nuez')) {
    return <Cookie size={size} strokeWidth={strokeWidth} />;
  }
  if (text.includes('menta') || text.includes('verde') || text.includes('vegetal') || text.includes('té')) {
    return <Leaf size={size} strokeWidth={strokeWidth} />;
  }
  if (text.includes('canela') || text.includes('especia')) {
    return <Sparkles size={size} strokeWidth={strokeWidth} />;
  }
  if (text.includes('tostado') || text.includes('humo')) {
    return <Flame size={size} strokeWidth={strokeWidth} />;
  }
  if (text.includes('ácido') || text.includes('fermentado') || text.includes('vino')) {
    return <Wine size={size} strokeWidth={strokeWidth} />;
  }
  if (text.includes('defecto') || text.includes('otro')) {
    return <AlertTriangle size={size} strokeWidth={strokeWidth} />;
  }
  
  return <Coffee size={size} strokeWidth={strokeWidth} />;
};

export const stripEmojis = (text) => {
  if (!text) return '';
  // Removes standard emojis
  return text.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim();
};
