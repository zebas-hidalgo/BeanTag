/**
 * BeanTag AI Core Engine & Resilient Barista Fallback System
 * Handles Gemini API requests with retry backoff, model cascading,
 * and deterministic offline barista extraction physics.
 */

const VALID_GEMINI_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.5-pro'
];

const DEFAULT_GEMINI_MODEL = 'gemini-3.6-flash';
const FALLBACK_GEMINI_MODEL = 'gemini-3.5-flash-lite';

/**
 * Sanitizes model name: maps deprecated/invalid model names to supported Google AI Studio models.
 */
function sanitizeModel(requestedModel) {
  if (!requestedModel || typeof requestedModel !== 'string' || requestedModel.trim() === '') {
    return DEFAULT_GEMINI_MODEL;
  }
  const clean = requestedModel.trim().toLowerCase();
  // Map legacy / discontinued model IDs (2.0, 1.5, 3.7) to active models
  if (clean.includes('2.0') || clean.includes('1.5') || clean.includes('3.7')) {
    if (clean.includes('lite')) return 'gemini-3.5-flash-lite';
    if (clean.includes('pro')) return 'gemini-2.5-pro';
    return 'gemini-3.6-flash';
  }
  if (VALID_GEMINI_MODELS.includes(clean)) {
    return clean;
  }
  return DEFAULT_GEMINI_MODEL;
}

/**
 * Converts 1Zpresso J-Max total clicks to { rot, num, click, string }
 * J-Max specs: 90 clicks per rotation, 10 clicks per number, 8.8 microns per click.
 */
function clicksToJMax(totalClicks) {
  const safeClicks = Math.max(0, Math.round(totalClicks));
  const rot = Math.floor(safeClicks / 90);
  const rem = safeClicks % 90;
  const num = Math.floor(rem / 10);
  const click = rem % 10;
  return {
    rot,
    num,
    click,
    display: `${rot}.${num}.${click}`
  };
}

/**
 * Converts J-Max { rot, num, click } to total clicks from zero
 */
function jMaxToClicks(rot = 0, num = 0, click = 0) {
  return (parseInt(rot, 10) || 0) * 90 + (parseInt(num, 10) || 0) * 10 + (parseInt(click, 10) || 0);
}

/**
 * Calculates days elapsed since roast date.
 * Returns null if roastDateStr is null, undefined, or invalid.
 */
function calculateDaysSinceRoast(roastDateStr, refDate = new Date()) {
  if (!roastDateStr || typeof roastDateStr !== 'string' || roastDateStr.trim() === '') return null;
  const roastTime = new Date(roastDateStr).getTime();
  if (isNaN(roastTime)) return null;
  const now = refDate.getTime();
  const diffDays = Math.floor((now - roastTime) / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Checks whether the batch is stored frozen in cellar (cava at -18°C).
 */
function isFrozenBatch(batch) {
  if (!batch) return false;
  return Boolean(batch.freeze_date && String(batch.freeze_date).trim() !== '');
}

/**
 * Converts physical target microns (D50) to 1Zpresso J-Max setting.
 * Range: Espresso 1.0.0-1.5.0 (~100-140 clics), Pour-over 2.0.0-2.5.0 (~180-225 clics), French Press 2.7.0-3.2.0.
 */
function micronsToJMax(microns) {
  const safeM = Math.max(180, Math.min(1300, microns));
  let clicks;
  if (safeM <= 380) {
    clicks = Math.round(90 + ((safeM - 200) / 180) * 55);
  } else {
    clicks = Math.round(150 + ((safeM - 380) / 620) * 115);
  }
  const clampedClicks = Math.max(70, Math.min(330, clicks));
  const jmaxObj = clicksToJMax(clampedClicks);
  return {
    ...jmaxObj,
    totalClicks: clampedClicks
  };
}

/**
 * Converts physical target microns (D50) to 1Zpresso K-Ultra dial setting (0.0 to 15.0).
 * 100 clicks per rotation, 10 divisions per number.
 * Espresso: 3.0 - 4.2 | AeroPress: 5.5 - 6.8 | Pour-over (V60): 7.2 - 8.8 | Cupping/French Press: 9.5 - 10.8
 */
function micronsToKUltra(microns) {
  const safeM = Math.max(180, Math.min(1300, microns));
  let dial;
  if (safeM <= 380) {
    dial = 2.5 + ((safeM - 180) / 200) * 1.7; // ~2.5 to 4.2
  } else {
    dial = 4.5 + ((safeM - 380) / 600) * 5.5; // ~4.5 to 10.0+
  }
  const clampedDial = Math.max(2.0, Math.min(13.0, dial));
  const rounded = Math.round(clampedDial * 10) / 10;
  const clicks = Math.round(rounded * 10);
  return `${rounded.toFixed(1)} (${clicks} clics)`;
}

/**
 * Converts physical target microns (D50) to Fellow Ode Gen 2 dial setting (1.0 to 11.0).
 * Flat 64mm Gen 2 stainless burrs with 1/3 micro-clicks.
 * Factory note: Not suitable for espresso (<450 µm).
 * AeroPress: 1.2 - 2.2 | V60 / Pour-over: 3.1 - 5.2 | Chemex: 5.2 - 7.0 | French Press: 7.1 - 8.2
 */
function micronsToOdeGen2(microns, isPulsar = false) {
  if (microns < 450) return 'No apto para espresso';
  if (isPulsar) return '3.0';
  const safeM = Math.max(450, Math.min(1250, microns));
  const dialVal = 1.0 + ((safeM - 450) / 750) * 8.5;
  const clamped = Math.max(1.0, Math.min(11.0, dialVal));
  const intPart = Math.floor(clamped);
  const frac = clamped - intPart;
  const sub = frac < 0.33 ? 0 : (frac < 0.66 ? 1 : 2);
  return `${intPart}.${sub}`;
}

/**
 * Converts physical target microns (D50) to Comandante C40 MK3/MK4 clicks.
 * Espresso: 8 - 12 clics | AeroPress: 13 - 17 clics | V60: 20 - 26 clics | Cupping/French Press: 28 - 34 clics
 */
function micronsToComandante(microns) {
  const safeM = Math.max(180, Math.min(1300, microns));
  let clicks;
  if (safeM <= 380) {
    clicks = Math.round(7 + ((safeM - 180) / 200) * 5); // 7 to 12
  } else {
    clicks = Math.round(12 + ((safeM - 380) / 600) * 18); // 12 to 30+
  }
  const clamped = Math.max(6, Math.min(42, clicks));
  return `${clamped} clics`;
}

/**
 * Converts physical target microns (D50) to Femobook A2 clicks.
 * 40 clicks per rotation.
 * Espresso: 6 - 11 clics | AeroPress: 34 - 44 clics | V60: 54 - 68 clics | French Press: 78 - 92 clics
 */
function micronsToFemobook(microns) {
  const safeM = Math.max(180, Math.min(1300, microns));
  let clicks;
  if (safeM <= 350) {
    clicks = Math.round(5 + ((safeM - 180) / 170) * 6); // 5 to 11
  } else {
    clicks = Math.round(20 + ((safeM - 350) / 650) * 65); // 20 to 85+
  }
  const clamped = Math.max(4, Math.min(115, clicks));
  const rot = (clamped / 40).toFixed(1);
  return `${clamped} clics (~${rot} Rot.)`;
}

/**
 * Converts physical target microns (D50) to Kingrinder K6 clicks.
 * 60 clicks per rotation.
 * Espresso: 18 - 35 clics | AeroPress: 60 - 75 clics | V60: 85 - 105 clics | French Press: 120 - 140 clics
 */
function micronsToKingrinder(microns) {
  const safeM = Math.max(180, Math.min(1300, microns));
  let clicks;
  if (safeM <= 350) {
    clicks = Math.round(15 + ((safeM - 180) / 170) * 18); // 15 to 33
  } else {
    clicks = Math.round(45 + ((safeM - 350) / 650) * 80); // 45 to 125+
  }
  const clamped = Math.max(12, Math.min(170, clicks));
  const rot = Math.floor(clamped / 60);
  const rem = clamped % 60;
  return `${clamped} clics (${rot} Rot. ${rem} Clics)`;
}

/**
 * Converts physical target microns (D50) to Timemore C2/C3 clicks.
 * Espresso: 7 - 9 clics | AeroPress: 11 - 14 clics | V60: 15 - 20 clics | French Press: 23 - 27 clics
 */
function micronsToTimemore(microns) {
  const safeM = Math.max(180, Math.min(1300, microns));
  let clicks;
  if (safeM <= 350) {
    clicks = Math.round(6 + ((safeM - 180) / 170) * 3); // 6 to 9
  } else {
    clicks = Math.round(10 + ((safeM - 350) / 650) * 15); // 10 to 25+
  }
  const clamped = Math.max(6, Math.min(34, clicks));
  return `${clamped} clics`;
}

/**
 * Converts physical target microns (D50) to Baratza Encore / Encore ESP dial.
 * Espresso: ESP 8 - 14 | V60: Classic 14 - 18 / ESP 24 - 28 | French Press: Classic 26 - 32 / ESP 32 - 36
 */
function micronsToBaratza(microns, isEspresso = false) {
  const safeM = Math.max(180, Math.min(1300, microns));
  if (isEspresso || safeM <= 380) {
    const espStep = Math.max(6, Math.min(16, Math.round(8 + ((safeM - 180) / 180) * 6)));
    return `ESP Ajuste ${espStep} (Pasos micro 8-14)`;
  }
  const classicStep = Math.max(10, Math.min(36, Math.round(10 + ((safeM - 450) / 650) * 17)));
  const espFilterStep = Math.min(40, classicStep + 10);
  return `Ajuste ${classicStep} (ESP: ${espFilterStep})`;
}

/**
 * Deterministic Barista Extraction Physics Engine
 * Computes an optimal recipe based on coffee bean terroir, process, roast level, and brew method.
 */
function computeOfflineRecipe(batch) {
  const origin = batch.origin || 'Origen Especialidad';
  const variety = batch.variety || 'Variedad Arábica';
  const process = (batch.process || '').toLowerCase();
  const roast = (batch.roast_level || 'Medio').toLowerCase();
  const rawAltitude = batch.altitude || '';
  const method = batch.method || 'V60 (Filtrado)';
  const dose = parseFloat(batch.dose_in_g) || 20.0;

  const roastDateStr = batch.roast_date || null;
  const daysSinceRoast = calculateDaysSinceRoast(roastDateStr);
  const isFrozen = isFrozenBatch(batch);
  const scaScore = parseFloat(batch.sca_score) || null;
  const activeGrinderRaw = (batch.grinder || 'jmax').toLowerCase();

  // Extract numeric altitude (e.g. "1850m", "1,900 msnm" -> 1850)
  const altitudeMatch = String(rawAltitude).replace(/,/g, '').match(/\d{3,4}/);
  const altitudeMeters = altitudeMatch ? parseInt(altitudeMatch[0], 10) : 1500;

  // 1. Method base parameters according to physical SCA / Kruve D50 guidelines
  let ratioStr = '1:15';
  let ratioMultiplier = 15;
  let baseMicrons = 720;
  let baseTemp = 92;
  let brewTime = '2:45 min';
  let grindDesc = 'Medio-Fino';

  const isEspresso = method.toLowerCase().includes('espresso');
  const isPulsar = method.toLowerCase().includes('pulsar');
  const isAeropressGo = method.toLowerCase().includes('go');
  const isAeropress = !isAeropressGo && method.toLowerCase().includes('aero');
  const isFrench = method.toLowerCase().includes('prensa') || method.toLowerCase().includes('french');

  const isLightRoast = roast.includes('claro') || roast.includes('light');
  const isDarkRoast = roast.includes('oscuro') || roast.includes('dark');
  const isWashed = process.includes('lavad') || process.includes('wash');
  const isNaturalOrAnaerobic = process.includes('natural') || process.includes('anaerob') || process.includes('macer') || process.includes('ferment') || process.includes('honey');

  if (isEspresso) {
    ratioMultiplier = isLightRoast ? 2.4 : (isDarkRoast ? 2.0 : 2.2);
    ratioStr = `1:${ratioMultiplier}`;
    baseMicrons = 270;
    baseTemp = isLightRoast ? 94 : (isDarkRoast ? 90 : 92);
    brewTime = isLightRoast ? '30s' : '26s';
    grindDesc = 'Espresso Fino';
  } else if (isPulsar) {
    ratioMultiplier = (isLightRoast && isWashed) ? 16.6 : 16.0;
    ratioStr = `1:${ratioMultiplier}`;
    baseMicrons = 620;
    baseTemp = isLightRoast ? 95 : 93;
    brewTime = '3:20 min';
    grindDesc = 'Medio No-Bypass';
  } else if (isAeropressGo) {
    // AeroPress Go compact chamber (max ~220ml water)
    ratioMultiplier = isLightRoast ? 14.5 : (isDarkRoast ? 13.0 : 14.3);
    ratioStr = `1:${ratioMultiplier}`;
    baseMicrons = 560;
    baseTemp = isLightRoast ? 92 : (isDarkRoast ? 87 : 90);
    brewTime = '1:45 min';
    grindDesc = 'Medio-Fina (AeroPress Go)';
  } else if (isAeropress) {
    ratioMultiplier = isLightRoast ? 15.0 : 14.0;
    ratioStr = `1:${ratioMultiplier}`;
    baseMicrons = 580;
    baseTemp = isLightRoast ? 92 : (isDarkRoast ? 88 : 91);
    brewTime = '2:15 min';
    grindDesc = 'Medio Fino (AeroPress)';
  } else if (isFrench) {
    ratioMultiplier = isDarkRoast ? 14.0 : 15.0;
    ratioStr = `1:${ratioMultiplier}`;
    baseMicrons = 1000;
    baseTemp = isLightRoast ? 95 : 92;
    brewTime = '4:00 min';
    grindDesc = 'Grueso (Inmersión)';
  } else {
    // V60 / Pour-over adaptive ratio & temp
    baseMicrons = 720;
    grindDesc = 'Medio-Fino';
    if (isLightRoast && isWashed) {
      ratioMultiplier = 16.6;
      ratioStr = '1:16.6';
      baseTemp = 95;
      brewTime = '3:00 min';
    } else if (isLightRoast && isNaturalOrAnaerobic) {
      ratioMultiplier = 15.5;
      ratioStr = '1:15.5';
      baseTemp = 93;
      brewTime = '2:45 min';
    } else if (isDarkRoast) {
      ratioMultiplier = 14.5;
      ratioStr = '1:14.5';
      baseTemp = 89;
      brewTime = '2:25 min';
    } else {
      ratioMultiplier = 15.0;
      ratioStr = '1:15';
      baseTemp = 92;
      brewTime = '2:45 min';
    }
  }

  // 2. Physical Terroir & Roast Adjustments to Particle Size (D50)
  let deltaMicrons = 0;
  const reasons = [];

  // Roast level adjustment
  if (isLightRoast) {
    deltaMicrons -= 40; // Finer grind for dense bean
    reasons.push('Tueste claro (grano denso: molienda fina y alta temp para maximizar solubilidad)');
  } else if (isDarkRoast) {
    deltaMicrons += 60; // Coarser grind for brittle bean
    reasons.push('Tueste oscuro (grano poroso y soluble: molienda abierta y temp moderada para evitar amargor)');
  }

  // Process adjustment
  if (isNaturalOrAnaerobic) {
    deltaMicrons += 30; // Naturals produce more fines
    reasons.push('Proceso fermentativo/natural (alta carga de azúcares y finos: molienda ligeramente abierta)');
  } else if (isWashed) {
    reasons.push('Proceso lavado (taza limpia y acidez brillante: favorece percolación continua)');
  }

  // Altitude adjustment
  if (altitudeMeters > 1700) {
    deltaMicrons -= 20;
    baseTemp = Math.min(96, baseTemp + 1);
    reasons.push(`Altitud SHB (${altitudeMeters}m: densidad celular alta)`);
  }

  // Días de Reposo / Desgasificación de CO2
  const isVeryFresh = daysSinceRoast !== null && daysSinceRoast < 7;
  if (daysSinceRoast !== null) {
    if (daysSinceRoast < 7) {
      deltaMicrons += 20; // Compensate violent CO2 bubbling
      reasons.push(`Grano fresco (${daysSinceRoast} días de tueste: alta presión de CO₂, bloom extendido a 50s para desgasificar sin canalizaciones)`);
    } else if (daysSinceRoast >= 12 && daysSinceRoast <= 30) {
      reasons.push(`Ventana de tueste óptima (${daysSinceRoast} días: pico de solubilidad y balance aromático)`);
    } else if (daysSinceRoast > 45) {
      deltaMicrons -= 15;
      reasons.push(`Tueste maduro (${daysSinceRoast} días: baja presión de gas, molienda levemente más cerrada para sostener extracción)`);
    }
  }

  // Grano Congelado en Cava (-18°C)
  if (isFrozen) {
    deltaMicrons -= 15; // Unimodal fracture, fewer erratic fines
    reasons.push('Grano congelado en cava a -18°C (fractura criogénica unimodal con menor producción de finos)');
  }

  // Puntaje SCA y Variedades de Alta Gama
  if (scaScore && scaScore >= 88) {
    reasons.push(`Lote de alta gama (SCA ${scaScore}: protocolo de vertidos suaves para preservar volátiles aromáticos)`);
  } else if (/geisha|chiroso|sidra|pink bourbon|bourbon rosado|eugenioides|wush wush/i.test(variety)) {
    reasons.push(`Variedad floral/frutal delicada (${variety}: agitación suave para proteger volátiles aromáticos)`);
  }

  // Clamping within safe physical SCA particle size boundaries
  let minSafeM = 200;
  let maxSafeM = 1250;
  if (isEspresso) { minSafeM = 180; maxSafeM = 360; }
  else if (isFrench) { minSafeM = 850; maxSafeM = 1250; }
  else if (isAeropressGo || isAeropress || isPulsar) { minSafeM = 480; maxSafeM = 720; }
  else { minSafeM = 580; maxSafeM = 880; } // V60 / Pour-over

  const finalMicrons = Math.max(minSafeM, Math.min(maxSafeM, Math.round(baseMicrons + deltaMicrons)));
  const jmaxObj = micronsToJMax(finalMicrons);
  const finalKUltra = micronsToKUltra(finalMicrons);
  const finalOde = micronsToOdeGen2(finalMicrons, isPulsar);
  const finalComandante = micronsToComandante(finalMicrons);
  const finalFemobook = micronsToFemobook(finalMicrons);
  const finalKingrinder = micronsToKingrinder(finalMicrons);
  const finalTimemore = micronsToTimemore(finalMicrons);
  const finalBaratza = micronsToBaratza(finalMicrons, isEspresso);

  // Compute total water (respect AeroPress Go chamber limit of ~210g)
  let totalWaterG = Math.round(dose * ratioMultiplier);
  if (isAeropressGo && totalWaterG > 215) {
    totalWaterG = 210;
    ratioStr = `1:${(totalWaterG / dose).toFixed(1)}`;
  }

  const bloomWaterG = isEspresso 
    ? Math.round(dose * 0.5) 
    : (isPulsar 
      ? Math.round(dose * 3) 
      : (isAeropressGo ? Math.min(40, Math.round(dose * 2.8)) : Math.min(65, Math.round(dose * (isVeryFresh ? 3.3 : 3.0)))));
  const remainingWaterG = totalWaterG - bloomWaterG;

  // 3. Pour sequences
  let pours = [];
  let steps = [];

  const bloomTimeStr = isVeryFresh ? '0:00 - 0:50' : '0:00 - 0:45';
  const bloomDesc = isVeryFresh
    ? 'Bloom extendido (50s) en espiral suave para evacuar abundante CO₂ de grano fresco sin canalizaciones.'
    : 'Verter en espiral suave asegurando humectación completa para desgasificación.';

  if (isEspresso) {
    pours = [
      { step: 1, label: 'Pre-infusión Espresso', water_g: bloomWaterG, total_water_g: bloomWaterG, time: '0s - 6s', description: 'Pre-infusión suave a 2-3 bar para saturar homogéneamente la pastilla.' },
      { step: 2, label: 'Extracción Principal', water_g: remainingWaterG, total_water_g: totalWaterG, time: `6s - ${brewTime}`, description: 'Rampa de presión constante hasta alcanzar el rendimiento objetivo.' }
    ];
    steps = [
      `Distribuir uniformemente ${dose}g de café molido en portafiltro y tampear nivelado.`,
      `Ajustar molino J-Max a ${jmaxObj.display} o Femobook A2 a ${finalFemobook}.`,
      `Iniciar extracción con pre-infusión hasta alcanzar ${totalWaterG}g en taza.`,
      `Servir inmediatamente en taza pre-calentada y evaluar balance de crema.`
    ];
  } else if (isPulsar) {
    const pulse1 = Math.round(remainingWaterG * 0.5);
    const pulse2 = totalWaterG - bloomWaterG - pulse1;
    pours = [
      { step: 1, label: 'Bloom / Válvula Cerrada', water_g: bloomWaterG, total_water_g: bloomWaterG, time: isVeryFresh ? '0:00 - 0:50' : '0:00 - 0:45', description: '🔒 Válvula cerrada. Verter agua con dispersor y aplicar Wet-WDT suave.' },
      { step: 2, label: '1º Pulso / Válvula Media', water_g: pulse1, total_water_g: bloomWaterG + pulse1, time: isVeryFresh ? '0:50 - 1:45' : '0:45 - 1:45', description: '⚡ Abrir válvula al 50%. Mantener nivel de agua constante.' },
      { step: 3, label: '2º Pulso / Válvula Abierta', water_g: pulse2, total_water_g: totalWaterG, time: '1:45 - 3:20', description: '🔓 Válvula al 100%. Dejar drenar por gravedad sin bypass.' }
    ];
    steps = [
      `Colocar filtro de papel enjuagado en NextLevel Pulsar Mini y cerrar la válvula de control.`,
      `Añadir ${dose}g con molienda calibrada en ${jmaxObj.display} (J-Max) o ${finalFemobook} (Femobook).`,
      `Colocar dispersor de agua. Verter ${bloomWaterG}g a ${baseTemp}°C y dejar florecer ${isVeryFresh ? '50s' : '45s'}.`,
      `Seguir la secuencia de apertura de válvula para máxima extracción homogénea.`
    ];
  } else if (isAeropressGo) {
    pours = [
      { step: 1, label: 'Bloom / Pre-infusión', water_g: bloomWaterG, total_water_g: bloomWaterG, time: '0:00 - 0:30', description: 'Verter agua y agitar suavemente 3 veces con la paleta para saturación total.' },
      { step: 2, label: 'Llenado Cámara Go', water_g: remainingWaterG, total_water_g: totalWaterG, time: '0:30 - 1:15', description: `Completar agua hasta ${totalWaterG}g (capacidad cámara compacta). Colocar émbolo para retención térmica.` },
      { step: 3, label: 'Prensado Suave', water_g: 0, total_water_g: totalWaterG, time: '1:15 - 1:45', description: 'Prensado uniforme durante 30 segundos hasta escuchar el primer silbido de aire.' }
    ];
    steps = [
      `Colocar filtro de papel en la tapa compacta de AeroPress Go y enjuagar con agua caliente.`,
      `Añadir ${dose}g molidos a ajuste ${jmaxObj.display} (J-Max) o ${finalFemobook} (Femobook A2).`,
      `Verter ${bloomWaterG}g a ${baseTemp}°C, agitar 3 veces y verter el resto hasta alcanzar ${totalWaterG}g.`,
      `Colocar el émbolo para generar vacío y reposar hasta el minuto 1:15.`,
      `Prensar suavemente durante 30 segundos directo en la taza Go.`
    ];
  } else if (isAeropress) {
    pours = [
      { step: 1, label: 'Bloom / Saturación', water_g: bloomWaterG, total_water_g: bloomWaterG, time: '0:00 - 0:35', description: 'Saturación homogénea y agitación circular breve.' },
      { step: 2, label: 'Infusión Principal', water_g: remainingWaterG, total_water_g: totalWaterG, time: '0:35 - 1:30', description: `Llenar hasta ${totalWaterG}g. Colocar émbolo para crear sello de vacío.` },
      { step: 3, label: 'Prensado Controlado', water_g: 0, total_water_g: totalWaterG, time: '1:30 - 2:15', description: 'Prensado suave constante de 45 segundos deteniéndose al primer escape de aire.' }
    ];
    steps = [
      `Preparar AeroPress en posición estándar o invertida con filtro enjuagado.`,
      `Dosificar ${dose}g con molienda ${jmaxObj.display} (J-Max) o ${finalFemobook} (Femobook).`,
      `Verter agua a ${baseTemp}°C en 2 fases y dejar reposar en inmersión.`,
      `Prensar suave y servir en taza precalentada.`
    ];
  } else if (isFrench) {
    pours = [
      { step: 1, label: 'Infusión Total Inmersión', water_g: totalWaterG, total_water_g: totalWaterG, time: '0:00 - 0:45', description: 'Verter toda el agua de forma enérgica para asegurar humectación completa.' },
      { step: 2, label: 'Ruptura de Costra', water_g: 0, total_water_g: totalWaterG, time: '3:30 - 4:00', description: 'Romper la costra superficial con cuchara y retirar la espuma de finos.' },
      { step: 3, label: 'Filtrado / Prensado', water_g: 0, total_water_g: totalWaterG, time: '4:00 - 4:30', description: 'Colocar el émbolo en la superficie sin aplastar la cama y decantar.' }
    ];
    steps = [
      `Moler ${dose}g de café a granulometría gruesa (${jmaxObj.display} J-Max).`,
      `Verter ${totalWaterG}g de agua a ${baseTemp}°C y colocar la tapa sin bajar el émbolo.`,
      `A los 3:30 minutos, romper la costra con cuchara y limpiar impurezas flotantes.`,
      `Bajar el émbolo lentamente hasta el nivel del líquido y decantar suavemente.`
    ];
  } else if (isLightRoast && isWashed) {
    // 4-pour high extraction for light washed specialty
    const p1 = Math.round(remainingWaterG * 0.35);
    const p2 = Math.round(remainingWaterG * 0.35);
    const p3 = totalWaterG - bloomWaterG - p1 - p2;
    pours = [
      { step: 1, label: isVeryFresh ? 'Bloom Extendido (CO₂)' : 'Bloom Prolongado', water_g: bloomWaterG, total_water_g: bloomWaterG, time: bloomTimeStr, description: bloomDesc },
      { step: 2, label: '1º Vertido (Claridad)', water_g: p1, total_water_g: bloomWaterG + p1, time: isVeryFresh ? '0:50 - 1:30' : '0:45 - 1:25', description: 'Vertido continuo concéntrico desde baja altura para promover dulzor.' },
      { step: 3, label: '2º Vertido (Acidez & Notas)', water_g: p2, total_water_g: bloomWaterG + p1 + p2, time: isVeryFresh ? '1:30 - 2:15' : '1:25 - 2:10', description: 'Vertido con espiral amplia hacia las paredes sin tocar el papel.' },
      { step: 4, label: '3º Vertido Final', water_g: p3, total_water_g: totalWaterG, time: isVeryFresh ? '2:15 - 3:05' : '2:10 - 3:00', description: 'Vertido central suave de asentamiento. Ligero swirl final para cama plana.' }
    ];
    steps = [
      `Enjuagar filtro cónico con abundante agua caliente y precalentar el servidor.`,
      `Moler ${dose}g a ajuste ${jmaxObj.display} (J-Max) o ${finalFemobook} (Femobook A2).`,
      `Realizar bloom de ${isVeryFresh ? '50' : '45'} segundos con agua a ${baseTemp}°C.`,
      `Completar los 3 pulsos continuos y servir al terminar el drenado total.`
    ];
  } else {
    // 3-pour balanced pour-over
    const pulse1 = Math.round(remainingWaterG * 0.55);
    const pulse2 = totalWaterG - bloomWaterG - pulse1;
    pours = [
      { step: 1, label: isVeryFresh ? 'Bloom Extendido (CO₂)' : 'Bloom / Pre-infusión', water_g: bloomWaterG, total_water_g: bloomWaterG, time: bloomTimeStr, description: bloomDesc },
      { step: 2, label: '1º Vertido Principal', water_g: pulse1, total_water_g: bloomWaterG + pulse1, time: isVeryFresh ? '0:50 - 1:40' : '0:45 - 1:35', description: 'Vertido continuo y concéntrico sin tocar las paredes de papel.' },
      { step: 3, label: '2º Vertido Final', water_g: pulse2, total_water_g: totalWaterG, time: isVeryFresh ? '1:40 - 2:50' : '1:35 - 2:45', description: 'Vertido de asentamiento. Ligero swirl al final para aplanar la cama.' }
    ];
    steps = [
      `Enjuagar filtro de papel con agua caliente y descartar agua del servidor.`,
      `Pesar ${dose}g de café y moler en ajuste ${jmaxObj.display} (J-Max) o ${finalFemobook} (Femobook A2).`,
      `Realizar Bloom de ${isVeryFresh ? '50' : '45'} segundos asegurando saturación homogénea.`,
      `Completar los vertidos con agua a ${baseTemp}°C y servir al finalizar el drenado.`
    ];
  }

  const reasonText = reasons.length > 0 ? reasons.join('. ') : 'Calibración balanceada para extracción dulce y limpia.';

  // Complete Grinders Map
  const grinders = {
    jmax: `${jmaxObj.display} (${jmaxObj.rot} Rot. ${jmaxObj.num} Núm. ${jmaxObj.click} Clics)`,
    k_ultra: finalKUltra,
    ode_gen2: finalOde === 'No apto para espresso' ? 'No apto para espresso' : `Ajuste ${finalOde} (Muelas Planas 64mm)`,
    comandante: finalComandante,
    femobook_a2: finalFemobook,
    kingrinder_k6: finalKingrinder,
    timemore: finalTimemore,
    baratza: finalBaratza
  };

  // Resolve Active Grinder
  let activeGrinderId = 'jmax';
  if (activeGrinderRaw.includes('k_ultra') || activeGrinderRaw.includes('k-ultra') || activeGrinderRaw.includes('kmax')) {
    activeGrinderId = 'k_ultra';
  } else if (activeGrinderRaw.includes('ode')) {
    activeGrinderId = 'ode_gen2';
  } else if (activeGrinderRaw.includes('comandante')) {
    activeGrinderId = 'comandante';
  } else if (activeGrinderRaw.includes('femobook')) {
    activeGrinderId = 'femobook_a2';
  } else if (activeGrinderRaw.includes('kingrinder') || activeGrinderRaw.includes('k6')) {
    activeGrinderId = 'kingrinder_k6';
  } else if (activeGrinderRaw.includes('timemore')) {
    activeGrinderId = 'timemore';
  } else if (activeGrinderRaw.includes('baratza')) {
    activeGrinderId = 'baratza';
  }

  const grinderMeta = {
    jmax: { name: '1Zpresso J-Max', burr: 'Cónica 48mm Titanio (Bimodal)', microns: `${finalMicrons} µm` },
    k_ultra: { name: '1Zpresso K-Ultra', burr: 'Cónica 48mm Heptagonal (Bimodal Balanceado)', microns: `${finalMicrons} µm` },
    ode_gen2: { name: 'Fellow Ode Gen 2', burr: 'Plana 64mm Gen 2 (Unimodal Alta Claridad)', microns: `${finalMicrons} µm` },
    comandante: { name: 'Comandante C40 MK4', burr: 'Cónica 39mm Nitro Blade', microns: `${finalMicrons} µm` },
    femobook_a2: { name: 'Femobook A2', burr: 'Cónica 40mm', microns: `${finalMicrons} µm` },
    kingrinder_k6: { name: 'Kingrinder K6', burr: 'Cónica 48mm Heptagonal', microns: `${finalMicrons} µm` },
    timemore: { name: 'Timemore C2/C3', burr: 'Cónica 38mm', microns: `${finalMicrons} µm` },
    baratza: { name: 'Baratza Encore / ESP', burr: 'Cónica 40mm M2', microns: `${finalMicrons} µm` }
  };

  const activeGrinderDial = {
    grinder_id: activeGrinderId,
    grinder_name: grinderMeta[activeGrinderId]?.name || '1Zpresso J-Max',
    dial: grinders[activeGrinderId] || grinders.jmax,
    burr_type: grinderMeta[activeGrinderId]?.burr || 'Cónica de Especialidad',
    microns: `${finalMicrons} µm`
  };

  // Structured Multivariable Physics Analysis
  const physicsAnalysis = {
    roast_and_density: isLightRoast
      ? 'Grano denso (SHB / tueste claro): requiere mayor temperatura y molienda controlada para extraer compuestos solubles internos.'
      : (isDarkRoast
        ? 'Grano poroso y altamente soluble: menor temperatura para prevenir compuestos fenólicos amargos.'
        : 'Desarrollo equilibrado de caramelización y solubilidad estándar.'),
    degas_and_rest: daysSinceRoast !== null
      ? (daysSinceRoast < 7
        ? `Tueste fresco (${daysSinceRoast} días): alta presión de CO₂, bloom extendido para evacuar gas sin turbulencias descontroladas.`
        : (daysSinceRoast <= 30
          ? `Ventana óptima (${daysSinceRoast} días): pico aromático estabilizado.`
          : `Tueste reposado (${daysSinceRoast} días): baja presión de gas, percolación uniforme.`))
      : (isFrozen
        ? 'Congelado en Cava (-18°C): fractura criogénica uniforme con reducción de finos.'
        : 'Ventana de degustación equilibrada.'),
    burr_and_fines: activeGrinderId === 'ode_gen2'
      ? 'Muelas planas 64mm: curva unimodal con finos mínimos. Claridad aromática sobresaliente y acidez brillante.'
      : 'Muelas cónicas: distribución bimodal con pico de finos. Aporta cuerpo sedoso, dulzor denso y textura envolvente.',
    extraction_strategy: isEspresso
      ? 'Pre-infusión y rampa de presión controlada para extracción homogénea.'
      : (isPulsar
        ? 'Inmersión inicial con válvula cerrada y percolación pura no-bypass.'
        : (isAeropressGo || isAeropress
          ? 'Inmersión homogénea con sello de émbolo y prensado suave.'
          : (isLightRoast && isWashed
            ? '4 vertidos continuos de alta extracción para máxima definición de terroir.'
            : '3 vertidos calculados para dulzor y balance clásico.'))),
    frozen_dosing: isFrozen
  };

  return {
    method,
    ratio: ratioStr,
    water_total_g: totalWaterG,
    grind: `${grindDesc} (${jmaxObj.display})`,
    grind_microns: `${finalMicrons} µm`,
    grind_adjustment_reason: reasonText,
    jmax_rot: jmaxObj.rot,
    jmax_num: jmaxObj.num,
    jmax_click: jmaxObj.click,
    grinders,
    active_grinder_dial: activeGrinderDial,
    physics_analysis: physicsAnalysis,
    days_since_roast: daysSinceRoast,
    is_frozen: isFrozen,
    temperature: baseTemp,
    brew_time: brewTime,
    pours,
    steps,
    notes: `Receta calibrada por motor de extracción BeanTag: ${reasonText}`,
    _source: 'barista_fallback'
  };
}

/**
 * Deterministic Sensory Recalibration Engine
 * Adjusts recipe parameters scientifically based on user taste feedback.
 */
function computeOfflineTuning(data) {
  const method = data.method || 'V60 (Filtrado)';
  const dose = parseFloat(data.dose_in_g) || 20.0;
  const currentTemp = parseInt(data.temperature, 10) || 93;
  const currentRot = parseInt(data.jmax_rot, 10) || 2;
  const currentNum = parseInt(data.jmax_num, 10) || 4;
  const currentClick = parseInt(data.jmax_click, 10) || 5;
  const extraction = (data.sensory_extraction || '').toLowerCase();
  const batchName = data.batch_name || 'Especialidad';

  let currentTotalClicks = jMaxToClicks(currentRot, currentNum, currentClick);
  let adjustedTemp = currentTemp;
  let reason = '';
  let pourAdjustment = '';

  if (extraction.includes('sub') || extraction.includes('agrio') || extraction.includes('ácido')) {
    // Under-extracted: increase extraction yield (finer grind, higher water temp)
    currentTotalClicks = Math.max(30, currentTotalClicks - 5);
    adjustedTemp = Math.min(96, currentTemp + 2);
    reason = 'Sub-extracción detectada (acidez punzante). Afinamos 5 clics y subimos 2°C para incrementar dulzor y cuerpo.';
    pourAdjustment = 'Aumentar tiempo de pre-infusión en 10s para mejorar contacto hidrodinámico.';
  } else if (extraction.includes('sobre') || extraction.includes('amargo') || extraction.includes('seco')) {
    // Over-extracted: decrease extraction yield (coarser grind, lower water temp)
    currentTotalClicks = currentTotalClicks + 6;
    adjustedTemp = Math.max(88, currentTemp - 2);
    reason = 'Sobre-extracción detectada (amargor / astringencia). Abrimos 6 clics y reducimos 2°C para ganar claridad y suavidad.';
    pourAdjustment = 'Agitación más suave en vertidos para minimizar canalizaciones secundarias.';
  } else {
    // Balanced or body tweak
    currentTotalClicks = currentTotalClicks + 1;
    reason = 'Receta bien encaminada. Micro-ajuste barístico para maximizar limpieza en taza.';
    pourAdjustment = 'Mantener vertidos controlados en espiral continua.';
  }

  const jmaxObj = clicksToJMax(currentTotalClicks);
  const currentMicrons = currentTotalClicks <= 150
    ? Math.round(200 + ((currentTotalClicks - 90) / 55) * 180)
    : Math.round(380 + ((currentTotalClicks - 150) / 115) * 620);
  const isEsp = method.toLowerCase().includes('espresso');
  const isPulsar = method.toLowerCase().includes('pulsar');
  const isGo = method.toLowerCase().includes('go');
  const ratioMultiplier = isEsp ? 2.2 : (isGo ? 14.3 : 15.5);
  let totalWater = Math.round(dose * ratioMultiplier);
  if (isGo && totalWater > 215) totalWater = 210;
  const bloomWater = isEsp ? Math.round(dose * 0.5) : (isGo ? 40 : 60);
  const remWater = totalWater - bloomWater;

  const odeVal = micronsToOdeGen2(currentMicrons, isPulsar);
  const tunedGrinders = {
    jmax: `${jmaxObj.display} (${jmaxObj.rot} Rot. ${jmaxObj.num} Núm. ${jmaxObj.click} Clics)`,
    k_ultra: micronsToKUltra(currentMicrons),
    ode_gen2: (isEsp || odeVal === 'No apto para espresso') ? 'No apto para espresso' : `Ajuste ${odeVal} (Muelas Planas 64mm)`,
    comandante: micronsToComandante(currentMicrons),
    femobook_a2: micronsToFemobook(currentMicrons),
    kingrinder_k6: micronsToKingrinder(currentMicrons),
    timemore: micronsToTimemore(currentMicrons),
    baratza: micronsToBaratza(currentMicrons, isEsp)
  };

  const activeGrinderRaw = (data.grinder || 'jmax').toLowerCase();
  let activeGrinderId = 'jmax';
  if (activeGrinderRaw.includes('k_ultra') || activeGrinderRaw.includes('k-ultra') || activeGrinderRaw.includes('kmax')) {
    activeGrinderId = 'k_ultra';
  } else if (activeGrinderRaw.includes('ode')) {
    activeGrinderId = 'ode_gen2';
  } else if (activeGrinderRaw.includes('comandante')) {
    activeGrinderId = 'comandante';
  } else if (activeGrinderRaw.includes('femobook')) {
    activeGrinderId = 'femobook_a2';
  } else if (activeGrinderRaw.includes('kingrinder') || activeGrinderRaw.includes('k6')) {
    activeGrinderId = 'kingrinder_k6';
  } else if (activeGrinderRaw.includes('timemore')) {
    activeGrinderId = 'timemore';
  } else if (activeGrinderRaw.includes('baratza')) {
    activeGrinderId = 'baratza';
  }

  const grinderMeta = {
    jmax: { name: '1Zpresso J-Max', burr: 'Cónica 48mm Titanio' },
    k_ultra: { name: '1Zpresso K-Ultra', burr: 'Cónica 48mm Heptagonal' },
    ode_gen2: { name: 'Fellow Ode Gen 2', burr: 'Plana 64mm Gen 2' },
    comandante: { name: 'Comandante C40 MK4', burr: 'Cónica 39mm Nitro Blade' },
    femobook_a2: { name: 'Femobook A2', burr: 'Cónica 40mm' },
    kingrinder_k6: { name: 'Kingrinder K6', burr: 'Cónica 48mm Heptagonal' },
    timemore: { name: 'Timemore C2/C3', burr: 'Cónica 38mm' },
    baratza: { name: 'Baratza Encore / ESP', burr: 'Cónica 40mm M2' }
  };

  const activeGrinderDial = {
    grinder_id: activeGrinderId,
    grinder_name: grinderMeta[activeGrinderId]?.name || '1Zpresso J-Max',
    dial: tunedGrinders[activeGrinderId] || tunedGrinders.jmax,
    burr_type: grinderMeta[activeGrinderId]?.burr || 'Cónica de Especialidad',
    microns: `${currentMicrons} µm`
  };

  return {
    correction_reason: reason,
    method,
    ratio: `1:${ratioMultiplier}`,
    water_total_g: totalWater,
    grind: `Calibrado Corregido (${jmaxObj.display})`,
    grind_microns: `${currentMicrons} µm`,
    jmax_rot: jmaxObj.rot,
    jmax_num: jmaxObj.num,
    jmax_click: jmaxObj.click,
    grinders: tunedGrinders,
    active_grinder_dial: activeGrinderDial,
    temperature: adjustedTemp,
    brew_time: isGo ? '1:45 min' : '2:40 min',
    pours: [
      { step: 1, label: 'Bloom Corregido', water_g: bloomWater, total_water_g: bloomWater, time: '0:00 - 0:45', description: pourAdjustment },
      { step: 2, label: '1º Vertido Principal', water_g: Math.round(remWater * 0.6), total_water_g: bloomWater + Math.round(remWater * 0.6), time: '0:45 - 1:40', description: 'Vertido continuo en pulso medio.' },
      { step: 3, label: '2º Vertido Final', water_g: totalWater - (bloomWater + Math.round(remWater * 0.6)), total_water_g: totalWater, time: '1:40 - 2:40', description: 'Asentar cama y esperar goteo final.' }
    ],
    steps: [
      `Ajustar molino ${activeGrinderDial.grinder_name} a ${activeGrinderDial.dial}.`,
      `Fijar temperatura de agua a ${adjustedTemp}°C.`,
      `Seguir cronograma de vertidos corregido para ${batchName}.`
    ],
    notes: `Recalibración completada: ${reason}`,
    _source: 'barista_fallback'
  };
}

/**
 * Executes a Gemini prompt or multimodal request with retry on 503/429 and automatic cascading fallback across active models.
 */
async function callGeminiWithRetry(contentsOrPrompt, apiKey, initialModel, enableThinking = false) {
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
    throw new Error('No se ha configurado una clave API de Gemini válida.');
  }

  const cleanKey = apiKey.trim();
  const modelToTry = sanitizeModel(initialModel);
  
  // Cascading priority across active Google AI models
  const cascadeOrder = [
    modelToTry,
    DEFAULT_GEMINI_MODEL, // 'gemini-3.6-flash'
    FALLBACK_GEMINI_MODEL, // 'gemini-3.5-flash-lite'
    'gemini-2.5-flash'
  ];
  const models = [...new Set(cascadeOrder)];

  // Normalize contents structure (support string prompt or multimodal array)
  let contents;
  if (typeof contentsOrPrompt === 'string') {
    contents = [{ parts: [{ text: contentsOrPrompt }] }];
  } else if (Array.isArray(contentsOrPrompt)) {
    if (contentsOrPrompt.length > 0 && contentsOrPrompt[0]?.parts) {
      contents = contentsOrPrompt;
    } else {
      contents = [{ parts: contentsOrPrompt }];
    }
  } else if (contentsOrPrompt && contentsOrPrompt.parts) {
    contents = [contentsOrPrompt];
  } else {
    contents = [{ parts: [{ text: String(contentsOrPrompt || '') }] }];
  }

  let lastError = null;

  for (const currentModel of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${cleanKey}`;
    const generationConfig = { responseMimeType: 'application/json' };

    // Only inject thinkingConfig on models that explicitly support it
    if (enableThinking && (currentModel.includes('thinking') || currentModel.includes('2.5-pro'))) {
      generationConfig.thinkingConfig = { thinkingBudget: 2048 };
    }

    const payload = JSON.stringify({
      contents,
      generationConfig
    });

    // Up to 2 attempts per model (1 initial + 1 retry on 503/429)
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload
        });

        if (response.ok) {
          const data = await response.json();
          let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
          text = text.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(text);
          parsed._source = 'gemini';
          parsed._model = currentModel;
          return parsed;
        }

        const errData = await response.json().catch(() => ({}));
        const errMsg = errData.error?.message || `HTTP ${response.status} (${currentModel})`;
        console.warn(`[Gemini Attempt] Model ${currentModel} (attempt ${attempt}) returned ${response.status}: ${errMsg}`);

        // Auth or Permission Errors (401, 403, or 400 with API_KEY_INVALID): do not cascade with the same broken key
        const isKeyInvalid = response.status === 401 || response.status === 403 || 
          (response.status === 400 && (errMsg.toLowerCase().includes('api key') || errMsg.toLowerCase().includes('api_key')));
        
        if (isKeyInvalid) {
          const err = new Error(`Error de autenticación con Google AI (${response.status}): ${errMsg}`);
          err.status = response.status;
          throw err;
        }

        // 404 (Model removed/not found): immediately proceed to next model in cascade
        if (response.status === 404) {
          lastError = new Error(errMsg);
          break;
        }

        // Check if retryable (503 Service Unavailable, 429 Rate Limit)
        if ((response.status === 503 || response.status === 429) && attempt === 1) {
          console.warn(`[Gemini Retry] Rate limit or service busy on ${currentModel}. Retrying in 800ms...`);
          await new Promise(r => setTimeout(r, 800));
          continue;
        }

        lastError = new Error(errMsg);
        break; // break retry loop to try next model in cascade
      } catch (networkErr) {
        if (networkErr.status === 400 || networkErr.status === 401 || networkErr.status === 403) {
          throw networkErr;
        }
        lastError = networkErr;
        if (attempt === 1) {
          await new Promise(r => setTimeout(r, 800));
          continue;
        }
        break;
      }
    }
  }

  throw lastError || new Error('No fue posible contactar los servicios de Google AI');
}

module.exports = {
  VALID_GEMINI_MODELS,
  DEFAULT_GEMINI_MODEL,
  FALLBACK_GEMINI_MODEL,
  sanitizeModel,
  clicksToJMax,
  jMaxToClicks,
  calculateDaysSinceRoast,
  isFrozenBatch,
  micronsToJMax,
  micronsToKUltra,
  micronsToOdeGen2,
  micronsToComandante,
  micronsToFemobook,
  micronsToKingrinder,
  micronsToTimemore,
  micronsToBaratza,
  computeOfflineRecipe,
  computeOfflineTuning,
  callGeminiWithRetry
};
