// --- BEANTAG FAMOUS BARISTA RECIPES & LEGENDARY TECHNIQUES ---

/**
 * Helper to calculate calibrated settings for all 8 supported grinders based on target microns (D50).
 *
 * @param {number} microns - Target median particle diameter in micrometers (D50)
 * @param {boolean} isEspresso - Flag for espresso brewing method
 * @param {boolean} isPulsar - Flag for NextLevel Pulsar no-bypass brewer
 * @returns {Object} Complete calibrated settings for all 8 grinders:
 *   - jmax: { rot, num, click, text }
 *   - femobook: { clicks, text }
 *   - k_ultra: { dial, clicks, text }
 *   - ode_gen2: { dial, text }
 *   - comandante: { clicks, text }
 *   - kingrinder: { clicks, text }
 *   - timemore: { clicks, text }
 *   - baratza: { step, text }
 */
export function get8GrinderSettingsForMicrons(microns, isEspresso = false, isPulsar = false) {
  let safeM = Math.max(180, Math.min(1300, Number(microns) || 720));
  if (isPulsar && safeM < 740) {
    safeM = 760; // Safeguard against clogging no-bypass filter
  }

  // 1. 1Zpresso J-Max (8.8 µm/click, 90 clicks/rot, 10 clicks/num)
  let jmaxClicks;
  if (safeM <= 320) {
    jmaxClicks = Math.round(90 + ((safeM - 180) / 140) * 45);
  } else if (safeM <= 620) {
    jmaxClicks = Math.round(135 + ((safeM - 320) / 300) * 50);
  } else if (safeM <= 780) {
    jmaxClicks = Math.round(185 + ((safeM - 620) / 160) * 37);
  } else {
    jmaxClicks = Math.round(222 + ((safeM - 780) / 370) * 63);
  }
  const clampedJmax = Math.max(70, Math.min(330, jmaxClicks));
  const jmaxRot = Math.floor(clampedJmax / 90);
  const jmaxRem = clampedJmax % 90;
  const jmaxNum = Math.floor(jmaxRem / 10);
  const jmaxClick = jmaxRem % 10;
  const jmax = {
    rot: jmaxRot,
    num: jmaxNum,
    click: jmaxClick,
    text: `${jmaxRot}.${jmaxNum}.${jmaxClick} (~${safeM} µm)`
  };

  // 2. Femobook A2 (18 µm/click, 40 clicks/rot)
  let femoClicks;
  if (safeM <= 320) {
    femoClicks = Math.round(8 + ((safeM - 180) / 140) * 6);
  } else if (safeM <= 620) {
    femoClicks = Math.round(14 + ((safeM - 320) / 300) * 36);
  } else if (safeM <= 780) {
    femoClicks = Math.round(50 + ((safeM - 620) / 160) * 18);
  } else {
    femoClicks = Math.round(68 + ((safeM - 780) / 370) * 28);
  }
  const clampedFemo = Math.max(6, Math.min(120, femoClicks));
  const femoRot = (clampedFemo / 40).toFixed(1);
  const femobook = {
    clicks: clampedFemo,
    text: `${clampedFemo} clics (~${femoRot} Rot.)`
  };

  // 3. 1Zpresso K-Ultra (20 µm/click, dial 2.0 to 13.0)
  let kDial;
  if (safeM <= 320) {
    kDial = 2.5 + ((safeM - 180) / 140) * 1.7;
  } else if (safeM <= 620) {
    kDial = 4.2 + ((safeM - 320) / 300) * 2.0;
  } else if (safeM <= 780) {
    kDial = 6.2 + ((safeM - 620) / 160) * 2.0;
  } else {
    kDial = 8.2 + ((safeM - 780) / 370) * 3.0;
  }
  const clampedKDial = Math.max(2.0, Math.min(13.0, kDial));
  const roundedKDial = Math.round(clampedKDial * 10) / 10;
  const kUltraClicks = Math.round(roundedKDial * 10);
  const k_ultra = {
    dial: roundedKDial,
    clicks: kUltraClicks,
    text: `${roundedKDial.toFixed(1)} (${kUltraClicks} clics)`
  };

  // 4. Fellow Ode Gen 2 (64mm Flat Burrs, 1.0 to 11.0, filter only)
  let ode_gen2;
  if (isEspresso || safeM < 450) {
    ode_gen2 = {
      dial: 'No apto para espresso',
      text: 'No apto para espresso'
    };
  } else {
    let odeVal;
    if (safeM <= 620) {
      odeVal = 1.1 + ((safeM - 450) / 170) * 1.5;
    } else if (safeM <= 780) {
      odeVal = 2.6 + ((safeM - 620) / 160) * 2.0;
    } else {
      odeVal = 4.6 + ((safeM - 780) / 370) * 4.0;
    }
    const clampedOde = Math.max(1.0, Math.min(11.0, odeVal));
    const intPart = Math.floor(clampedOde);
    const frac = clampedOde - intPart;
    const sub = frac < 0.33 ? 0 : (frac < 0.66 ? 1 : 2);
    const dialStr = `${intPart}.${sub}`;
    ode_gen2 = {
      dial: dialStr,
      text: `Ajuste ${dialStr} (Muelas Planas 64mm)`
    };
  }

  // 5. Comandante C40 MK3/MK4 (30 µm/click)
  let comClicks;
  if (safeM <= 320) {
    comClicks = Math.round(8 + ((safeM - 180) / 140) * 5);
  } else if (safeM <= 620) {
    comClicks = Math.round(13 + ((safeM - 320) / 300) * 4);
  } else if (safeM <= 780) {
    comClicks = Math.round(17 + ((safeM - 620) / 160) * 8);
  } else {
    comClicks = Math.round(25 + ((safeM - 780) / 370) * 8);
  }
  const clampedCom = Math.max(6, Math.min(45, comClicks));
  const comandante = {
    clicks: clampedCom,
    text: `${clampedCom} clics`
  };

  // 6. Kingrinder K6 (16 µm/click, 60 clicks/rot)
  let kingClicks;
  if (safeM <= 320) {
    kingClicks = Math.round(18 + ((safeM - 180) / 140) * 20);
  } else if (safeM <= 620) {
    kingClicks = Math.round(38 + ((safeM - 320) / 300) * 36);
  } else if (safeM <= 780) {
    kingClicks = Math.round(74 + ((safeM - 620) / 160) * 28);
  } else {
    kingClicks = Math.round(102 + ((safeM - 780) / 370) * 40);
  }
  const clampedKing = Math.max(12, Math.min(180, kingClicks));
  const kingRot = Math.floor(clampedKing / 60);
  const kingRem = clampedKing % 60;
  const kingrinder = {
    clicks: clampedKing,
    text: `${clampedKing} clics (${kingRot} Rot. ${kingRem} Clics)`
  };

  // 7. Timemore C2/C3 (S2C Burrs)
  let timeClicks;
  if (safeM <= 320) {
    timeClicks = Math.round(7 + ((safeM - 180) / 140) * 2);
  } else if (safeM <= 620) {
    timeClicks = Math.round(9 + ((safeM - 320) / 300) * 5);
  } else if (safeM <= 780) {
    timeClicks = Math.round(14 + ((safeM - 620) / 160) * 5);
  } else {
    timeClicks = Math.round(19 + ((safeM - 780) / 370) * 7);
  }
  const clampedTime = Math.max(6, Math.min(34, timeClicks));
  const timemore = {
    clicks: clampedTime,
    text: `${clampedTime} clics`
  };

  // 8. Baratza Encore / Encore ESP
  let baratzaStep;
  let baratzaText;
  if (isEspresso || safeM <= 320) {
    baratzaStep = Math.max(6, Math.min(16, Math.round(8 + ((safeM - 180) / 140) * 6)));
    baratzaText = `ESP Ajuste ${baratzaStep} (Pasos micro 8-14)`;
  } else {
    let classicStep;
    if (safeM <= 620) {
      classicStep = Math.round(10 + ((safeM - 320) / 300) * 4);
    } else if (safeM <= 780) {
      classicStep = Math.round(14 + ((safeM - 620) / 160) * 4);
    } else {
      classicStep = Math.round(18 + ((safeM - 780) / 370) * 10);
    }
    baratzaStep = Math.max(8, Math.min(40, classicStep));
    const espFilterStep = Math.min(40, baratzaStep + 10);
    baratzaText = `Ajuste ${baratzaStep} (ESP: ${espFilterStep})`;
  }
  const baratza = {
    step: baratzaStep,
    text: baratzaText
  };

  return {
    jmax,
    femobook,
    k_ultra,
    ode_gen2,
    comandante,
    kingrinder,
    timemore,
    baratza
  };
}

export const FAMOUS_RECIPES = [
  {
    id: 'tetsu-4-6',
    name: 'Tetsu Kasuya 4:6',
    author: 'Tetsu Kasuya (Campeón Mundial WBrC 2016)',
    method: 'V60 (Filtrado)',
    description: 'El 40% del agua ajusta el balance acidez/dulzor y el 60% la intensidad.',
    ratio: '1:15',
    ratioVal: 15,
    defaultDose: 20,
    temperature: 92,
    brewTime: '3:30 min',
    grind: 'Gruesa (Tetsu 4:6)',
    grindMicrons: 950,
    grinderSettings: {
      ...get8GrinderSettingsForMicrons(950),
      jmax: { rot: 2, num: 7, click: 0, text: '2.7.0 (~950 µm)' },
      femobook: { clicks: 81, text: '81 clics (~2.0 Rot.)' },
      comandante: { clicks: 29, text: '29 clics' }
    },
    calculatePours: (dose) => {
      const totalWater = Math.round(dose * 15);
      const singlePour = Math.round(totalWater / 5);
      return [
        { step: 1, label: '1º Vertido (Acidez/Dulzura)', water_g: singlePour, total_water_g: singlePour, time: '0:00 - 0:45', description: 'Vertido en espiral desde el centro. Esperar drenaje completo.' },
        { step: 2, label: '2º Vertido (Cuerpo)', water_g: singlePour, total_water_g: singlePour * 2, time: '0:45 - 1:30', description: 'Segundo 20% para fijar el dulzor de base.' },
        { step: 3, label: '3º Vertido (Intensidad 1)', water_g: singlePour, total_water_g: singlePour * 3, time: '1:30 - 2:15', description: 'Primer tercio del 60% de fuerza.' },
        { step: 4, label: '4º Vertido (Intensidad 2)', water_g: singlePour, total_water_g: singlePour * 4, time: '2:15 - 3:00', description: 'Segundo pulso de fuerza.' },
        { step: 5, label: '5º Vertido Final', water_g: totalWater - (singlePour * 4), total_water_g: totalWater, time: '3:00 - 3:30', description: 'Último vertido y dejar drenar por completo.' }
      ];
    },
    steps: [
      'Moler 20g de café en granulometría gruesa (evita sobre-extracción).',
      'Verter 5 pulsos exactos de agua cada 45 segundos permitiendo drenaje.',
      'Los 2 primeros vertidos (40%) definen sabor; los 3 últimos (60%) la fuerza.',
      'Servir y disfrutar una taza limpia, dulce y con acidez balanceada.'
    ],
    notes: 'Taza con claridad cristalina, acidez brillante y dulzura residual sedosa.'
  },
  {
    id: 'turbo-shot',
    name: 'Turbo Shot Espresso (6 Bar)',
    author: 'Prof. Christopher Hendon & Lance Hedrick',
    method: 'Espresso',
    description: 'Extracción rápida a baja presión (6 bar) con molienda gruesa para mayor rendimiento y cero astringencia.',
    ratio: '1:3',
    ratioVal: 3,
    defaultDose: 18,
    temperature: 93,
    brewTime: '15s - 18s',
    grind: 'Espresso Grueso (Turbo Shot)',
    grindMicrons: 360,
    grinderSettings: {
      ...get8GrinderSettingsForMicrons(360, true),
      jmax: { rot: 1, num: 4, click: 5, text: '1.4.5 (~360 µm)' },
      femobook: { clicks: 19, text: '19 clics (~360 µm)' },
      comandante: { clicks: 12, text: '12 clics' }
    },
    calculatePours: (dose) => {
      const output = Math.round(dose * 3);
      return [
        { step: 1, label: 'Pre-infusión Rápida', water_g: 5, total_water_g: 5, time: '0s - 3s', description: 'Saturación rápida a 2-3 bar.' },
        { step: 2, label: 'Extracción Turbo 6 Bar', water_g: output - 5, total_water_g: output, time: '3s - 16s', description: `Flujo continuo y rápido hasta alcanzar ${output}g en taza.` }
      ];
    },
    steps: [
      'Moler sensiblemente más grueso que un espresso tradicional 9 bar.',
      'Presión fijada a 6 bar (o perfil de flujo abierto en máquinas manuales).',
      'Ratio 1:3 (18g entrada -> 54g salida en 15 a 18 segundos).',
      'Mayor porcentaje de extracción (EY > 22%) sin compuestos amargos.'
    ],
    notes: 'Taza jugosa, ultra-frutal, vibrante y con dulzura pronunciada.'
  },
  {
    id: 'aeropress-champion',
    name: 'AeroPress Campeón Mundial',
    author: 'Wendelien van Bunnik (World AeroPress Champion)',
    method: 'AeroPress',
    description: 'Método invertido con dosis alta (concentrado) y dilución bypass en taza.',
    ratio: '1:8.6 + Bypass',
    ratioVal: 8.6,
    defaultDose: 30,
    temperature: 85,
    brewTime: '1:30 min',
    grind: 'Gruesa (AeroPress Inverted)',
    grindMicrons: 900,
    grinderSettings: {
      ...get8GrinderSettingsForMicrons(900),
      jmax: { rot: 2, num: 6, click: 0, text: '2.6.0 (~900 µm)' },
      femobook: { clicks: 77, text: '77 clics (~1.9 Rot.)' },
      comandante: { clicks: 28, text: '28 clics' }
    },
    calculatePours: (dose) => {
      return [
        { step: 1, label: 'Infusión Invertida (Concentrado)', water_g: 100, total_water_g: 100, time: '0:00 - 0:30', description: 'Verter 100g de agua a 85°C sobre 30g de café y remover 20 veces.' },
        { step: 2, label: 'Prensado Suave', water_g: 0, total_water_g: 100, time: '0:30 - 1:00', description: 'Colocar tapa con filtro enjuagado, voltear y prensar suavemente durante 30s.' },
        { step: 3, label: 'Bypass en Taza (+120g Agua)', water_g: 120, total_water_g: 220, time: '1:00 - 1:30', description: 'Añadir 120g de agua caliente directamente a la taza para diluir el concentrado.' }
      ];
    },
    steps: [
      'AeroPress en posición invertida con 30g de café molido grueso.',
      'Verter 100g de agua a 85°C y agitar vigorosamente durante 10 segundos.',
      'Voltear a los 30 segundos y prensar hasta escuchar el silbido de aire.',
      'Añadir 100g - 120g de agua caliente a la taza para el balance perfecto.'
    ],
    notes: 'Cuerpo sedoso, explosión aromática dulce y acidez aterciopelada.'
  },
  {
    id: 'aeropress-go-travel',
    name: 'AeroPress Go Travel Compact',
    author: 'Alan Adler & Especialidad Barista',
    method: 'AeroPress Go',
    description: 'Receta optimizada para la cámara compacta (máx 220ml) de la AeroPress Go. Taza sedosa, dulce y sin amargor.',
    ratio: '1:14.3',
    ratioVal: 14.3,
    defaultDose: 14,
    temperature: 90,
    brewTime: '1:45 min',
    grind: 'Medio-Fina (AeroPress Go)',
    grindMicrons: 560,
    grinderSettings: {
      ...get8GrinderSettingsForMicrons(560),
      jmax: { rot: 1, num: 8, click: 5, text: '1.8.5 (~560 µm)' },
      femobook: { clicks: 43, text: '43 clics (~1.1 Rot.)' },
      comandante: { clicks: 16, text: '16 clics' }
    },
    calculatePours: (dose) => {
      const totalWater = Math.min(210, Math.round(dose * 14.3));
      const bloom = Math.min(45, Math.round(dose * 2.8));
      return [
        { step: 1, label: 'Saturación / Bloom Inicial', water_g: bloom, total_water_g: bloom, time: '0:00 - 0:30', description: 'Verter agua a 90°C y remover 3 veces con la paleta.' },
        { step: 2, label: 'Llenado Cámara Compacta', water_g: totalWater - bloom, total_water_g: totalWater, time: '0:30 - 1:15', description: `Completar hasta ${totalWater}g (límite cámara Go). Colocar émbolo para crear vacío.` },
        { step: 3, label: 'Prensado Suave', water_g: 0, total_water_g: totalWater, time: '1:15 - 1:45', description: 'Presionar lentamente durante 30 segundos hasta escuchar el primer silbido.' }
      ];
    },
    steps: [
      'Colocar filtro de papel en la tapa de la AeroPress Go y enjuagar con agua caliente.',
      'Añadir 14g de café recién molido a granulometría medio-fina (1.8.5 en J-Max).',
      'Verter agua a 90°C en dos fases respetando el límite de la cámara compacta.',
      'Colocar émbolo en la parte superior para retener el líquido por vacío.',
      'A 1:15 min, prensar suave y uniformemente durante 30 segundos hasta 1:45 min.'
    ],
    notes: 'Taza con balance sobresaliente, textura jugosa, acidez cítrica redonda y dulzor de caramelo.'
  },
  {
    id: 'scott-rao-pulsar-mini',
    name: 'Scott Rao Pulsar Mini',
    author: 'Scott Rao (Consultor & Autor)',
    method: 'NextLevel Pulsar Mini',
    description: 'Inmersión inicial con válvula cerrada y WWDT suave, seguida de percolación continua con tapa de dispersión.',
    ratio: '1:16.67',
    ratioVal: 16.67,
    defaultDose: 18,
    temperature: 94,
    brewTime: '3:30 - 3:45 min',
    grind: 'Media No-Bypass (Rao)',
    grindMicrons: 800,
    grinderSettings: {
      ...get8GrinderSettingsForMicrons(800, false, true),
      jmax: { rot: 2, num: 4, click: 5, text: '2.4.5 (~800 µm)' },
      femobook: { clicks: 70, text: '70 clics (~1.8 Rot.)' },
      comandante: { clicks: 25, text: '25 clics' }
    },
    calculatePours: (dose) => {
      const totalWater = Math.round(dose * (300 / 18));
      const bloom = Math.round(dose * (60 / 18));
      const pour1 = Math.round(dose * (120 / 18));
      const pour2 = totalWater - bloom - pour1;
      return [
        {
          step: 1,
          label: 'Bloom e Inmersión + WWDT (Válvula Cerrada)',
          water_g: bloom,
          total_water_g: bloom,
          time: '0:00 - 0:45',
          valve: 'closed',
          description: `Con válvula cerrada, verter ${bloom}g de agua a 94°C y realizar agitación suave con aguja WWDT para saturar homogéneamente sin compactar.`
        },
        {
          step: 2,
          label: '1º Vertido de Percolación (Válvula Abierta)',
          water_g: pour1,
          total_water_g: bloom + pour1,
          time: '0:45 - 2:00',
          valve: 'open',
          description: `Abrir válvula por completo y verter ${pour1}g a través de la tapa de dispersión manteniendo un nivel suave sobre la cama.`
        },
        {
          step: 3,
          label: '2º Vertido Final (Válvula Abierta)',
          water_g: pour2,
          total_water_g: totalWater,
          time: '2:00 - 3:45',
          valve: 'open',
          description: `Verter los últimos ${pour2}g hasta alcanzar ${totalWater}g y dejar drenar completamente hasta cama plana.`
        }
      ];
    },
    steps: [
      'Cerrar la válvula completamente y colocar filtro de papel humedecido en el Pulsar Mini.',
      'Añadir 18g de café molido medio (~800 µm) y nivelar con cuidado.',
      'Verter 60g de agua a 94°C y hacer WWDT suave por 15s para desgasificación uniforme sin compactar.',
      'A los 0:45 abrir la válvula por completo y verter 120g sobre la tapa de dispersión (hasta 180g).',
      'A los 2:00 verter los últimos 120g hasta 300g y esperar a que el lecho drene completamente con lecho plano.'
    ],
    notes: 'Protocolo estándar Rao sin bypass: taza limpia, balance acidez-dulzor sobresaliente y reproducibilidad perfecta.'
  }
];
