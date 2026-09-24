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

  // Extract numeric altitude (e.g. "1850m", "1,900 msnm" -> 1850)
  const altitudeMatch = String(rawAltitude).replace(/,/g, '').match(/\d{3,4}/);
  const altitudeMeters = altitudeMatch ? parseInt(altitudeMatch[0], 10) : 1500;

  // 1. Method base parameters
  let ratioStr = '1:15';
  let ratioMultiplier = 15;
  let baseJMaxClicks = 225; // 2.4.5 = 2*90 + 4*10 + 5 = 225 clicks
  let baseFemobookClicks = 60; // 1.5 rot
  let baseComandanteClicks = 23;
  let baseTimemoreClicks = 17;
  let baseBaratzaSetting = 15;
  let baseTemp = 93;
  let brewTime = '2:45 min';
  let grindDesc = 'Medio-Fino';
  let grindMicrons = '1980 µm';

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
    baseJMaxClicks = 125; // 1.3.5
    baseFemobookClicks = 7;
    baseComandanteClicks = 9;
    baseTimemoreClicks = 8;
    baseBaratzaSetting = 5;
    baseTemp = isLightRoast ? 94 : (isDarkRoast ? 90 : 92);
    brewTime = isLightRoast ? '30s' : '26s';
    grindDesc = 'Espresso Fino';
    grindMicrons = '1100 µm';
  } else if (isPulsar) {
    ratioMultiplier = (isLightRoast && isWashed) ? 16.6 : 16.0;
    ratioStr = `1:${ratioMultiplier}`;
    baseJMaxClicks = 210; // 2.3.0
    baseFemobookClicks = 54;
    baseComandanteClicks = 21;
    baseTimemoreClicks = 15;
    baseBaratzaSetting = 13;
    baseTemp = isLightRoast ? 95 : 93;
    brewTime = '3:20 min';
    grindDesc = 'Medio No-Bypass';
    grindMicrons = '1850 µm';
  } else if (isAeropressGo) {
    // AeroPress Go compact chamber (max ~220ml water)
    ratioMultiplier = isLightRoast ? 14.5 : (isDarkRoast ? 13.0 : 14.3);
    ratioStr = `1:${ratioMultiplier}`;
    baseJMaxClicks = 165; // 1.8.5
    baseFemobookClicks = 36;
    baseComandanteClicks = 15;
    baseTimemoreClicks = 13;
    baseBaratzaSetting = 11;
    baseTemp = isLightRoast ? 92 : (isDarkRoast ? 87 : 90);
    brewTime = '1:45 min';
    grindDesc = 'Medio-Fina (AeroPress Go)';
    grindMicrons = '1650 µm';
  } else if (isAeropress) {
    ratioMultiplier = isLightRoast ? 15.0 : 14.0;
    ratioStr = `1:${ratioMultiplier}`;
    baseJMaxClicks = 175; // 1.8.5
    baseFemobookClicks = 38;
    baseComandanteClicks = 16;
    baseTimemoreClicks = 14;
    baseBaratzaSetting = 12;
    baseTemp = isLightRoast ? 92 : (isDarkRoast ? 88 : 91);
    brewTime = '2:15 min';
    grindDesc = 'Medio Fino (AeroPress)';
    grindMicrons = '1550 µm';
  } else if (isFrench) {
    ratioMultiplier = isDarkRoast ? 14.0 : 15.0;
    ratioStr = `1:${ratioMultiplier}`;
    baseJMaxClicks = 290; // 3.2.0
    baseFemobookClicks = 95;
    baseComandanteClicks = 28;
    baseTimemoreClicks = 22;
    baseBaratzaSetting = 22;
    baseTemp = isLightRoast ? 95 : 92;
    brewTime = '4:00 min';
    grindDesc = 'Grueso (Inmersión)';
    grindMicrons = '2600 µm';
  } else {
    // V60 / Pour-over adaptive ratio & temp
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

  // 2. Physical Terroir & Roast Adjustments
  let clickDeltaJMax = 0;
  let clickDeltaFemobook = 0;
  let clickDeltaComandante = 0;
  const reasons = [];

  // Roast level adjustment
  if (isLightRoast) {
    clickDeltaJMax -= 4; // Finer grind for dense bean
    clickDeltaFemobook -= 3;
    clickDeltaComandante -= 2;
    reasons.push('Tueste claro (grano denso: molienda fina y alta temp para maximizar solubilidad)');
  } else if (isDarkRoast) {
    clickDeltaJMax += 5; // Coarser grind for brittle bean
    clickDeltaFemobook += 4;
    clickDeltaComandante += 3;
    reasons.push('Tueste oscuro (grano poroso y soluble: molienda abierta y temp moderada para evitar amargor)');
  }

  // Process adjustment
  if (isNaturalOrAnaerobic) {
    clickDeltaJMax += 3; // Naturals produce more fines
    clickDeltaFemobook += 2;
    clickDeltaComandante += 1;
    reasons.push('Proceso fermentativo/natural (alta carga de azúcares y finos: molienda ligeramente abierta)');
  } else if (isWashed) {
    reasons.push('Proceso lavado (taza limpia y acidez brillante: favorece percolación continua)');
  }

  // Altitude adjustment
  if (altitudeMeters > 1700) {
    clickDeltaJMax -= 2;
    clickDeltaFemobook -= 2;
    clickDeltaComandante -= 1;
    baseTemp = Math.min(96, baseTemp + 1);
    reasons.push(`Altitud SHB (${altitudeMeters}m: densidad celular alta)`);
  }

  const finalJMaxClicks = Math.max(30, baseJMaxClicks + clickDeltaJMax);
  const finalFemobookClicks = Math.max(3, baseFemobookClicks + clickDeltaFemobook);
  const finalComandanteClicks = Math.max(6, baseComandanteClicks + clickDeltaComandante);
  const jmaxObj = clicksToJMax(finalJMaxClicks);

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
      : (isAeropressGo ? Math.min(40, Math.round(dose * 2.8)) : Math.min(65, Math.round(dose * 3))));
  const remainingWaterG = totalWaterG - bloomWaterG;

  // 3. Pour sequences
  let pours = [];
  let steps = [];

  if (isEspresso) {
    pours = [
      { step: 1, label: 'Pre-infusión Espresso', water_g: bloomWaterG, total_water_g: bloomWaterG, time: '0s - 6s', description: 'Pre-infusión suave a 2-3 bar para saturar homogéneamente la pastilla.' },
      { step: 2, label: 'Extracción Principal', water_g: remainingWaterG, total_water_g: totalWaterG, time: `6s - ${brewTime}`, description: 'Rampa de presión constante hasta alcanzar el rendimiento objetivo.' }
    ];
    steps = [
      `Distribuir uniformemente ${dose}g de café molido en portafiltro y tampear nivelado.`,
      `Ajustar molino J-Max a ${jmaxObj.display} o Femobook A2 a ${finalFemobookClicks} clics.`,
      `Iniciar extracción con pre-infusión hasta alcanzar ${totalWaterG}g en taza.`,
      `Servir inmediatamente en taza pre-calentada y evaluar balance de crema.`
    ];
  } else if (isPulsar) {
    const pulse1 = Math.round(remainingWaterG * 0.5);
    const pulse2 = totalWaterG - bloomWaterG - pulse1;
    pours = [
      { step: 1, label: 'Bloom / Válvula Cerrada', water_g: bloomWaterG, total_water_g: bloomWaterG, time: '0:00 - 0:45', description: '🔒 Válvula cerrada. Verter agua con dispersor y aplicar Wet-WDT suave.' },
      { step: 2, label: '1º Pulso / Válvula Media', water_g: pulse1, total_water_g: bloomWaterG + pulse1, time: '0:45 - 1:45', description: '⚡ Abrir válvula al 50%. Mantener nivel de agua constante.' },
      { step: 3, label: '2º Pulso / Válvula Abierta', water_g: pulse2, total_water_g: totalWaterG, time: '1:45 - 3:20', description: '🔓 Válvula al 100%. Dejar drenar por gravedad sin bypass.' }
    ];
    steps = [
      `Colocar filtro de papel enjuagado en NextLevel Pulsar Mini y cerrar la válvula de control.`,
      `Añadir ${dose}g con molienda calibrada en ${jmaxObj.display} (J-Max) o ${finalFemobookClicks} clics (Femobook).`,
      `Colocar dispersor de agua. Verter ${bloomWaterG}g a ${baseTemp}°C y dejar florecer 45s.`,
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
      `Añadir ${dose}g molidos a ajuste ${jmaxObj.display} (J-Max) o ${finalFemobookClicks} clics (Femobook A2).`,
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
      `Dosificar ${dose}g con molienda ${jmaxObj.display} (J-Max) o ${finalFemobookClicks} clics (Femobook).`,
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
      { step: 1, label: 'Bloom Prolongado', water_g: bloomWaterG, total_water_g: bloomWaterG, time: '0:00 - 0:45', description: 'Verter en espiral suave asegurando humectación completa para desgasificación.' },
      { step: 2, label: '1º Vertido (Claridad)', water_g: p1, total_water_g: bloomWaterG + p1, time: '0:45 - 1:25', description: 'Vertido continuo concéntrico desde baja altura para promover dulzor.' },
      { step: 3, label: '2º Vertido (Acidez & Notas)', water_g: p2, total_water_g: bloomWaterG + p1 + p2, time: '1:25 - 2:10', description: 'Vertido con espiral amplia hacia las paredes sin tocar el papel.' },
      { step: 4, label: '3º Vertido Final', water_g: p3, total_water_g: totalWaterG, time: '2:10 - 3:00', description: 'Vertido central suave de asentamiento. Ligero swirl final para cama plana.' }
    ];
    steps = [
      `Enjuagar filtro cónico con abundante agua caliente y precalentar el servidor.`,
      `Moler ${dose}g a ajuste ${jmaxObj.display} (J-Max) o ${finalFemobookClicks} clics (Femobook A2).`,
      `Realizar bloom de 45 segundos con agua a ${baseTemp}°C.`,
      `Completar los 3 pulsos continuos y servir al terminar el drenado total.`
    ];
  } else {
    // 3-pour balanced pour-over
    const pulse1 = Math.round(remainingWaterG * 0.55);
    const pulse2 = totalWaterG - bloomWaterG - pulse1;
    pours = [
      { step: 1, label: 'Bloom / Pre-infusión', water_g: bloomWaterG, total_water_g: bloomWaterG, time: '0:00 - 0:45', description: 'Verter en espiral suave desde el centro hacia afuera para desgasificar.' },
      { step: 2, label: '1º Vertido Principal', water_g: pulse1, total_water_g: bloomWaterG + pulse1, time: '0:45 - 1:35', description: 'Vertido continuo y concéntrico sin tocar las paredes de papel.' },
      { step: 3, label: '2º Vertido Final', water_g: pulse2, total_water_g: totalWaterG, time: '1:35 - 2:45', description: 'Vertido de asentamiento. Ligero swirl al final para aplanar la cama.' }
    ];
    steps = [
      `Enjuagar filtro de papel con agua caliente y descartar agua del servidor.`,
      `Pesar ${dose}g de café y moler en ajuste ${jmaxObj.display} (J-Max) o ${finalFemobookClicks} clics (Femobook A2).`,
      `Realizar Bloom de 45 segundos asegurando saturación homogénea.`,
      `Completar los vertidos con agua a ${baseTemp}°C y servir al finalizar el drenado.`
    ];
  }

  const reasonText = reasons.length > 0 ? reasons.join('. ') : 'Calibración balanceada para extracción dulce y limpia.';

  return {
    method,
    ratio: ratioStr,
    water_total_g: totalWaterG,
    grind: `${grindDesc} (${jmaxObj.display})`,
    grind_microns: grindMicrons,
    grind_adjustment_reason: reasonText,
    jmax_rot: jmaxObj.rot,
    jmax_num: jmaxObj.num,
    jmax_click: jmaxObj.click,
    grinders: {
      jmax: `${jmaxObj.display} (${jmaxObj.rot} Rot. ${jmaxObj.num} Núm. ${jmaxObj.click} Clics)`,
      femobook_a2: `${finalFemobookClicks} clics (~${(finalFemobookClicks / 40).toFixed(1)} Rot.)`,
      comandante: `${finalComandanteClicks} clics`,
      timemore: `${baseTimemoreClicks} clics`,
      baratza: `Ajuste ${baseBaratzaSetting}`
    },
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
  const isEsp = method.toLowerCase().includes('espresso');
  const isGo = method.toLowerCase().includes('go');
  const ratioMultiplier = isEsp ? 2.2 : (isGo ? 14.3 : 15.5);
  let totalWater = Math.round(dose * ratioMultiplier);
  if (isGo && totalWater > 215) totalWater = 210;
  const bloomWater = isEsp ? Math.round(dose * 0.5) : (isGo ? 40 : 60);
  const remWater = totalWater - bloomWater;

  return {
    correction_reason: reason,
    method,
    ratio: `1:${ratioMultiplier}`,
    water_total_g: totalWater,
    grind: `Calibrado Corregido (${jmaxObj.display})`,
    grind_microns: 'Medio-Fino Opt',
    jmax_rot: jmaxObj.rot,
    jmax_num: jmaxObj.num,
    jmax_click: jmaxObj.click,
    grinders: {
      jmax: `${jmaxObj.display} (${jmaxObj.rot} Rot. ${jmaxObj.num} Núm. ${jmaxObj.click} Clics)`,
      femobook_a2: `${Math.round(currentTotalClicks * (8.8 / 18))} clics`,
      comandante: `${Math.round(currentTotalClicks * (8.8 / 30))} clics`,
      timemore: '17 clics',
      baratza: 'Ajuste 15'
    },
    temperature: adjustedTemp,
    brew_time: isGo ? '1:45 min' : '2:40 min',
    pours: [
      { step: 1, label: 'Bloom Corregido', water_g: bloomWater, total_water_g: bloomWater, time: '0:00 - 0:45', description: pourAdjustment },
      { step: 2, label: '1º Vertido Principal', water_g: Math.round(remWater * 0.6), total_water_g: bloomWater + Math.round(remWater * 0.6), time: '0:45 - 1:40', description: 'Vertido continuo en pulso medio.' },
      { step: 3, label: '2º Vertido Final', water_g: totalWater - (bloomWater + Math.round(remWater * 0.6)), total_water_g: totalWater, time: '1:40 - 2:40', description: 'Asentar cama y esperar goteo final.' }
    ],
    steps: [
      `Ajustar molino J-Max a la posición corregida: ${jmaxObj.display}.`,
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
  computeOfflineRecipe,
  computeOfflineTuning,
  callGeminiWithRetry
};
