// Pure helpers for the brew guide: time parsing and stage building (no React).
/**
 * Parses time expressions such as "0:45", "3:30 min", "45s", or raw numbers to seconds.
 */
export function parseTimeToSeconds(timeStr) {
  if (!timeStr) return 0;
  if (typeof timeStr === 'number') return timeStr;
  const str = String(timeStr).trim().toLowerCase();

  const colonMatch = str.match(/(\d+):(\d+)/);
  if (colonMatch) {
    return parseInt(colonMatch[1], 10) * 60 + parseInt(colonMatch[2], 10);
  }

  const secMatch = str.match(/(\d+)\s*(?:s|seg)/);
  if (secMatch) {
    return parseInt(secMatch[1], 10);
  }

  const minMatch = str.match(/(\d+(?:\.\d+)?)\s*min/);
  if (minMatch) {
    return Math.round(parseFloat(minMatch[1]) * 60);
  }

  const num = parseInt(str, 10);
  return Number.isFinite(num) ? num : 0;
}

/**
 * Formats total seconds into MM:SS string.
 */
export function formatTime(totalSec) {
  const s = Math.max(0, Math.floor(totalSec));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Resolves or decomposes brewing stages strictly aligned with the extraction method.
 */
export function parseStages(recipe) {
  const mLower = String(recipe?.method || '').toLowerCase();
  const isEspresso = mLower.includes('espresso');
  const isPulsar = mLower.includes('pulsar');
  const isAeroPress = mLower.includes('aeropress') || mLower.includes('go');
  const isFrench = mLower.includes('prensa') || mLower.includes('french');

  // Verify if existing recipe.pours matches the current method
  const hasValidMethodPours = Array.isArray(recipe?.pours) && recipe.pours.length > 0 && (() => {
    if (isEspresso) {
      return recipe.pours.length <= 3 && !recipe.pours.some(p => String(p.label || '').toLowerCase().includes('bloom'));
    }
    if (isPulsar) {
      return recipe.pours.some(p => p.valve || String(p.label || '').toLowerCase().includes('válvula') || String(p.description || '').toLowerCase().includes('válvula'));
    }
    if (isAeroPress) {
      return recipe.pours.some(p => String(p.label || p.description || '').toLowerCase().includes('prensa') || String(p.label || p.description || '').toLowerCase().includes('inmersi'));
    }
    if (isFrench) {
      return recipe.pours.some(p => String(p.label || p.description || '').toLowerCase().includes('costra') || String(p.label || p.description || '').toLowerCase().includes('émbolo'));
    }
    return true;
  })();

  if (hasValidMethodPours) {
    let runningWater = 0;
    let runningTime = 0;

    return recipe.pours.map((p, idx) => {
      let startSec = 0;
      let endSec = 0;
      let duration = 0;

      if (typeof p.duration === 'number' && p.duration > 0) {
        duration = p.duration;
        startSec = runningTime;
        endSec = startSec + duration;
      } else if (p.time && String(p.time).includes('-')) {
        const parts = String(p.time).split('-');
        const parsedStart = parseTimeToSeconds(parts[0]);
        const parsedEnd = parseTimeToSeconds(parts[1]);
        if (parsedEnd > parsedStart) {
          startSec = parsedStart;
          endSec = parsedEnd;
          duration = endSec - startSec;
        } else {
          duration = Math.max(10, parsedEnd || 30);
          startSec = runningTime;
          endSec = startSec + duration;
        }
      } else if (p.time) {
        const parsed = parseTimeToSeconds(p.time);
        if (parsed > runningTime) {
          startSec = runningTime;
          endSec = parsed;
          duration = endSec - startSec;
        } else {
          duration = Math.max(10, parsed || 30);
          startSec = runningTime;
          endSec = startSec + duration;
        }
      } else {
        duration = 45;
        startSec = runningTime;
        endSec = startSec + duration;
      }

      runningTime = endSec;

      const parsedStep = parseFloat(p.water_g || p.water);
      const totalWater = p.total_water_g !== undefined
        ? parseFloat(p.total_water_g)
        : (runningWater + (Number.isFinite(parsedStep) ? parsedStep : 0));
      const stepWater = Number.isFinite(parsedStep) ? parsedStep : Math.max(0, totalWater - runningWater);
      runningWater = totalWater;

      // Extract valve configuration
      let valve = p.valve;
      if (!valve && isPulsar) {
        valve = idx === 0 ? 'closed' : (idx === 1 ? 'half' : 'open');
      } else if (!valve) {
        const textToScan = `${p.label || ''} ${p.description || ''}`.toLowerCase();
        if (textToScan.includes('cerrad') || textToScan.includes('inmersi') || textToScan.includes('closed')) {
          valve = 'closed';
        } else if (textToScan.includes('media') || textToScan.includes('45%') || textToScan.includes('50%') || textToScan.includes('half')) {
          valve = 'half';
        } else if (textToScan.includes('abiert') || textToScan.includes('percolaci') || textToScan.includes('open')) {
          valve = 'open';
        }
      }

      return {
        step: p.step || idx + 1,
        label: p.label || p.title || `Fase ${idx + 1}`,
        description: p.description || '',
        water_g: stepWater,
        total_water_g: totalWater,
        startSec,
        endSec,
        duration: Math.max(5, duration),
        valve
      };
    });
  }

  // Compute method-specific brewing curves
  const dose = parseFloat(recipe?.dose_in_g) || (isEspresso || isPulsar ? 18 : (isAeroPress ? 14 : 15));
  const ratioNum = parseFloat(String(recipe?.ratio || '').replace('1:', '')) || (isEspresso ? 2.0 : (isPulsar ? 16.67 : (isAeroPress ? 14.3 : 15.0)));
  const totalWater = parseFloat(recipe?.water_total_g) || Math.round(dose * ratioNum) || (isEspresso ? 36 : 250);
  const totalBrewSec = parseTimeToSeconds(recipe?.brew_time) || (isEspresso ? 28 : (isAeroPress ? 105 : (isFrench ? 300 : (isPulsar ? 210 : 180))));

  // 1. ESPRESSO (Pre-infusión 2-3 bar -> Rampa 9 bar -> Corte)
  if (isEspresso) {
    const preinfusionSec = Math.min(8, Math.max(4, Math.round(totalBrewSec * 0.2)));
    const extractionSec = Math.max(15, totalBrewSec - preinfusionSec);
    return [
      {
        step: 1,
        label: 'Pre-infusión (2-3 Bar)',
        description: 'Baja presión suave para saturar homogéneamente la pastilla y evitar canalización.',
        water_g: 2,
        total_water_g: 2,
        startSec: 0,
        endSec: preinfusionSec,
        duration: preinfusionSec
      },
      {
        step: 2,
        label: 'Extracción Principal (9 Bar)',
        description: 'Presión constante en cola de ratón con crema densa hasta rendimiento objetivo.',
        water_g: Math.max(0, totalWater - 2),
        total_water_g: totalWater,
        startSec: preinfusionSec,
        endSec: totalBrewSec,
        duration: extractionSec
      }
    ];
  }

  // 2. NEXTLEVEL PULSAR MINI (3 Fases Canónicas de Válvula)
  if (isPulsar) {
    const bloomWater = Math.round(dose * (60 / 18)) || Math.round(totalWater * 0.2);
    const remainingWater = Math.max(0, totalWater - bloomWater);
    const pulse1Water = Math.round(dose * (120 / 18)) || Math.round(remainingWater * 0.5);
    const pulse2Water = Math.max(0, remainingWater - pulse1Water);

    const bloomSec = 45;
    const pulse1Sec = 60; // 0:45 a 1:45 (60s)
    const pulse2Sec = Math.max(45, totalBrewSec - (bloomSec + pulse1Sec));

    return [
      {
        step: 1,
        label: 'Bloom e Inmersión (Válvula CERRADA)',
        description: 'Verter con tapa de dispersión y válvula cerrada para desgasificar CO₂ sin fugas.',
        water_g: bloomWater,
        total_water_g: bloomWater,
        startSec: 0,
        endSec: bloomSec,
        duration: bloomSec,
        valve: 'closed'
      },
      {
        step: 2,
        label: '1º Vertido Percolación (Válvula MEDIA 50%)',
        description: 'Abrir válvula al 50% (~2-2.5 ml/s) manteniendo la columna de agua estable.',
        water_g: pulse1Water,
        total_water_g: bloomWater + pulse1Water,
        startSec: bloomSec,
        endSec: bloomSec + pulse1Sec,
        duration: pulse1Sec,
        valve: 'half'
      },
      {
        step: 3,
        label: '2º Vertido & Caída Final (Válvula 100% ABIERTA)',
        description: 'Verter el agua restante y abrir válvula al 100% para un drenaje completo y limpio.',
        water_g: pulse2Water,
        total_water_g: totalWater,
        startSec: bloomSec + pulse1Sec,
        endSec: totalBrewSec,
        duration: pulse2Sec,
        valve: 'open'
      }
    ];
  }

  // 3. AEROPRESS / AEROPRESS GO (Inmersión, Agitación, Vacío, Prensado)
  if (isAeroPress) {
    const pourSec = 15;
    const stirSec = 15;
    const steepSec = Math.max(30, totalBrewSec - (pourSec + stirSec + 30));
    const pressSec = 30;

    return [
      {
        step: 1,
        label: 'Vertido Rápido de Inmersión',
        description: 'Verter todo el agua rápidamente sobre el café para una saturación instantánea.',
        water_g: totalWater,
        total_water_g: totalWater,
        startSec: 0,
        endSec: pourSec,
        duration: pourSec
      },
      {
        step: 2,
        label: 'Agitación Activa (Turbulencia)',
        description: 'Remover vigorosamente en cruz con la espátula para disolver grumos.',
        water_g: 0,
        total_water_g: totalWater,
        startSec: pourSec,
        endSec: pourSec + stirSec,
        duration: stirSec
      },
      {
        step: 3,
        label: 'Inmersión & Sello de Vacío',
        description: 'Colocar el émbolo en la parte superior para frenar el goteo y reposar.',
        water_g: 0,
        total_water_g: totalWater,
        startSec: pourSec + stirSec,
        endSec: pourSec + stirSec + steepSec,
        duration: steepSec
      },
      {
        step: 4,
        label: 'Prensado Suave y Constante',
        description: 'Presionar suavemente hacia abajo durante 30s hasta el primer siseo de aire.',
        water_g: 0,
        total_water_g: totalWater,
        startSec: pourSec + stirSec + steepSec,
        endSec: totalBrewSec,
        duration: pressSec
      }
    ];
  }

  // 4. PRENSA FRANCESA (Inmersión Total, Romper Costra, Prensa)
  if (isFrench) {
    const pourSec = 30;
    const steepSec = 210; // Hasta 4:00
    const crustSec = 60;  // 4:00 - 5:00
    const plungeSec = Math.max(30, totalBrewSec - (pourSec + steepSec + crustSec));

    return [
      {
        step: 1,
        label: 'Vertido Total y Saturación',
        description: 'Verter el 100% del agua enérgicamente humectando todo el lecho de molienda gruesa.',
        water_g: totalWater,
        total_water_g: totalWater,
        startSec: 0,
        endSec: pourSec,
        duration: pourSec
      },
      {
        step: 2,
        label: 'Inmersión y Reposo',
        description: 'Colocar la tapa sin bajar el émbolo y dejar infusionar en reposo total.',
        water_g: 0,
        total_water_g: totalWater,
        startSec: pourSec,
        endSec: pourSec + steepSec,
        duration: steepSec
      },
      {
        step: 3,
        label: 'Romper Costra & Desespumar',
        description: 'Romper la costra superficial con dos cucharas y retirar la espuma e impurezas flotantes.',
        water_g: 0,
        total_water_g: totalWater,
        startSec: pourSec + steepSec,
        endSec: pourSec + steepSec + crustSec,
        duration: crustSec
      },
      {
        step: 4,
        label: 'Prensado Superficial y Servido',
        description: 'Bajar el émbolo solo hasta el nivel del líquido sin comprimir la torta de café.',
        water_g: 0,
        total_water_g: totalWater,
        startSec: pourSec + steepSec + crustSec,
        endSec: totalBrewSec,
        duration: plungeSec
      }
    ];
  }

  // 5. V60, CHEMEX, KALITA (Filtrados / Pour-Over Estándar)
  const bloomSec = Math.min(45, Math.max(30, Math.round(totalBrewSec * 0.25)));
  const bloomWater = Math.min(65, Math.round(dose * 3)) || Math.round(totalWater * 0.2);
  const remainingWater = Math.max(0, totalWater - bloomWater);
  const pour1Water = Math.round(remainingWater * 0.55);
  const pour2Water = Math.max(0, remainingWater - pour1Water);

  const pour1Sec = Math.round(totalBrewSec * 0.35);
  const pour2Sec = Math.round(totalBrewSec * 0.25);
  const finalSec = Math.max(15, totalBrewSec - (bloomSec + pour1Sec + pour2Sec));

  return [
    {
      step: 1,
      label: 'Bloom & Pre-infusión',
      description: 'Humectación total en espiral suave asegurando desgasificación homogénea de CO₂.',
      water_g: bloomWater,
      total_water_g: bloomWater,
      startSec: 0,
      endSec: bloomSec,
      duration: bloomSec
    },
    {
      step: 2,
      label: '1º Vertido Principal',
      description: 'Espirales concéntricas desde el centro a 4-5 g/s para extraer dulzor y acidez viva.',
      water_g: pour1Water,
      total_water_g: bloomWater + pour1Water,
      startSec: bloomSec,
      endSec: bloomSec + pour1Sec,
      duration: pour1Sec
    },
    {
      step: 3,
      label: '2º Vertido de Desarrollo',
      description: 'Vertido centrado y suave para equilibrar concentración y redondear el cuerpo.',
      water_g: pour2Water,
      total_water_g: totalWater,
      startSec: bloomSec + pour1Sec,
      endSec: bloomSec + pour1Sec + pour2Sec,
      duration: pour2Sec
    },
    {
      step: 4,
      label: 'Caída Final & Drenaje',
      description: 'Drenaje por gravedad hasta formar una cama de café completamente plana y uniforme.',
      water_g: 0,
      total_water_g: totalWater,
      startSec: bloomSec + pour1Sec + pour2Sec,
      endSec: totalBrewSec,
      duration: finalSec
    }
  ];
}
