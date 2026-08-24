// --- BEANTAG FAMOUS BARISTA RECIPES & LEGENDARY TECHNIQUES ---

export const FAMOUS_RECIPES = [
  {
    id: 'tetsu-4-6',
    name: 'Tetsu Kasuya 4:6',
    author: 'Tetsu Kasuya (Campeón Mundial WBrC 2016)',
    badge: '🏆 WBrC Champion',
    method: 'V60 (Filtrado)',
    description: 'El 40% del agua ajusta el balance acidez/dulzor y el 60% la intensidad.',
    ratio: '1:15',
    ratioVal: 15,
    defaultDose: 20,
    temperature: 92,
    brewTime: '3:30 min',
    grind: 'Gruesa (Tetsu 4:6)',
    grindMicrons: 2200,
    grinderSettings: {
      jmax: { rot: 2, num: 7, click: 0, text: '2.7.0 (~2200 µm)' },
      femobook: { clicks: 75, text: '75 clics (1.85 Rot.)' },
      comandante: { clicks: 28, text: '28 clics' }
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
    id: 'hoffmann-v60',
    name: 'James Hoffmann Ultimate V60',
    author: 'James Hoffmann (Campeón Mundial WBC & Autor)',
    badge: '☕ Técnica Hoffmann',
    method: 'V60 (Filtrado)',
    description: 'Técnica de alta retención térmica, remolino suave y extracción uniforme con cama plana.',
    ratio: '1:16.6',
    ratioVal: 16.6,
    defaultDose: 20,
    temperature: 96,
    brewTime: '3:15 min',
    grind: 'Medio-Fina (Hoffmann)',
    grindMicrons: 1800,
    grinderSettings: {
      jmax: { rot: 2, num: 3, click: 5, text: '2.3.5 (~1800 µm)' },
      femobook: { clicks: 56, text: '56 clics (1.4 Rot.)' },
      comandante: { clicks: 21, text: '21 clics' }
    },
    calculatePours: (dose) => {
      const totalWater = Math.round(dose * 16.6); // ~330g para 20g
      const bloomWater = Math.round(dose * 3);    // ~60g
      const pour60 = Math.round(totalWater * 0.6); // ~200g
      return [
        { step: 1, label: 'Bloom + Swirl (Remolino)', water_g: bloomWater, total_water_g: bloomWater, time: '0:00 - 0:45', description: `Verter ${bloomWater}g (3x dosis) y hacer un remolino suave para mojar todo el café.` },
        { step: 2, label: 'Vertido Rápido al 60%', water_g: pour60 - bloomWater, total_water_g: pour60, time: '0:45 - 1:15', description: `Verter en espirales continuas hasta alcanzar ${pour60}g en 30 segundos.` },
        { step: 3, label: 'Vertido Suave al 100%', water_g: totalWater - pour60, total_water_g: totalWater, time: '1:15 - 1:45', description: `Verter suavemente en el centro hasta ${totalWater}g.` },
        { step: 4, label: 'Remolino Final & Asentado', water_g: 0, total_water_g: totalWater, time: '1:45 - 3:15', description: 'Remover suavemente con cuchara 1 vuelta, dar un leve remolino al dripper y dejar drenar cama plana.' }
      ];
    },
    steps: [
      'Agua recién hervida (95-98°C para tuestes claros de especialidad).',
      'Bloom con 3x peso del café y remolino inmediato para saturación total.',
      'Verter el 60% del agua antes del 1:15 para mantener alta temperatura.',
      'Remolino final para lograr una cama de café completamente plana.'
    ],
    notes: 'Máxima extracción con acidez integrada, gran cuerpo y sin canalizaciones.'
  },
  {
    id: 'ten-pours',
    name: '10 Vertidos (Micro-Extracción)',
    author: 'Técnica Osmótica de Extracción de Alta Densidad',
    badge: '💧 10 Vertidos Micro',
    method: 'V60 (Filtrado)',
    description: '10 pulsos pequeños y continuos para una dulzura acaramelada y cuerpo envolvente.',
    ratio: '1:15',
    ratioVal: 15,
    defaultDose: 20,
    temperature: 90,
    brewTime: '2:45 min',
    grind: 'Media (Osmotic Sweetness)',
    grindMicrons: 1980,
    grinderSettings: {
      jmax: { rot: 2, num: 4, click: 5, text: '2.4.5 (~1980 µm)' },
      femobook: { clicks: 60, text: '60 clics (1.5 Rot.)' },
      comandante: { clicks: 23, text: '23 clics' }
    },
    calculatePours: (dose) => {
      const totalWater = Math.round(dose * 15);
      const stepWater = Math.round(totalWater / 10);
      const pours = [];
      for (let i = 1; i <= 10; i++) {
        const cumWater = i === 10 ? totalWater : stepWater * i;
        const currentPour = i === 10 ? totalWater - (stepWater * 9) : stepWater;
        const startSec = (i - 1) * 15;
        const endSec = i * 15;
        const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
        pours.push({
          step: i,
          label: `Pulso #${i} (+${currentPour}g)`,
          water_g: currentPour,
          total_water_g: cumWater,
          time: `${formatTime(startSec)} - ${formatTime(endSec)}`,
          description: i === 1 ? 'Bloom inicial en el centro.' : `Pulso concéntrico rápido de ${currentPour}g.`
        });
      }
      return pours;
    },
    steps: [
      'Molienda media uniforme a temperatura controlada (90°C).',
      'Realizar 10 micro-vertidos cada 15 segundos sin dejar que la cama se seque.',
      'Mantener un flujo constante y central para generar flujo osmótico.',
      'Extracción suave que resalta notas de caramelo, miel y frutos maduros.'
    ],
    notes: 'Dulzura excepcional, textura densa y balance aterciopelado.'
  },
  {
    id: 'lance-hedrick-v60',
    name: 'Lance Hedrick 1-2 Pour',
    author: 'Lance Hedrick (Entrenador & WBC Judge)',
    badge: '🔥 Alta Claridad',
    method: 'V60 (Filtrado)',
    description: 'Bloom prolongado de 1 minuto + 1 o 2 vertidos de alta agitación para máxima separación de notas.',
    ratio: '1:16',
    ratioVal: 16,
    defaultDose: 20,
    temperature: 94,
    brewTime: '2:50 min',
    grind: 'Media (Lance Agitation)',
    grindMicrons: 1900,
    grinderSettings: {
      jmax: { rot: 2, num: 4, click: 0, text: '2.4.0 (~1900 µm)' },
      femobook: { clicks: 58, text: '58 clics (1.45 Rot.)' },
      comandante: { clicks: 22, text: '22 clics' }
    },
    calculatePours: (dose) => {
      const totalWater = Math.round(dose * 16);
      const bloom = Math.round(dose * 3); // 60g
      const pour1 = Math.round((totalWater - bloom) / 2);
      return [
        { step: 1, label: 'Bloom Prolongado (60s)', water_g: bloom, total_water_g: bloom, time: '0:00 - 1:00', description: 'Bloom profundo de 1 minuto completo para desgasificación absoluta.' },
        { step: 2, label: 'Vertido Central de Alta Agitación', water_g: pour1, total_water_g: bloom + pour1, time: '1:00 - 1:45', description: 'Vertido rápido desde buena altura generando turbulencia controlada.' },
        { step: 3, label: 'Vertido Suave Final', water_g: totalWater - (bloom + pour1), total_water_g: totalWater, time: '1:45 - 2:50', description: 'Vertido bajo cerca de la superficie para calmar la cama y drenar.' }
      ];
    },
    steps: [
      'Dejar que el bloom actúe 1 minuto completo para eliminar todo el CO₂.',
      'Verter con agitación alta para suspender las partículas de café.',
      'Finalizar con vertido bajo para no arrastrar finos al papel.',
      'Excelente para cafés geishas, lavados etíopes y procesos experimentales.'
    ],
    notes: 'Claridad floral exquisita, separación nítida de notas y postgusto largo.'
  },
  {
    id: 'turbo-shot',
    name: 'Turbo Shot Espresso (6 Bar)',
    author: 'Prof. Christopher Hendon & Lance Hedrick',
    badge: '⚡ Turbo 6 Bar',
    method: 'Espresso',
    description: 'Extracción rápida a baja presión (6 bar) con molienda gruesa para mayor rendimiento y cero astringencia.',
    ratio: '1:3',
    ratioVal: 3,
    defaultDose: 18,
    temperature: 93,
    brewTime: '15s - 18s',
    grind: 'Espresso Grueso (Turbo Shot)',
    grindMicrons: 1350,
    grinderSettings: {
      jmax: { rot: 1, num: 5, click: 5, text: '1.5.5 (~1350 µm)' },
      femobook: { clicks: 12, text: '12 clics' },
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
    badge: '🥇 Campeón AeroPress',
    method: 'AeroPress',
    description: 'Método invertido con dosis alta (concentrado) y dilución bypass en taza.',
    ratio: '1:8.6 + Bypass',
    ratioVal: 8.6,
    defaultDose: 30,
    temperature: 85,
    brewTime: '1:30 min',
    grind: 'Gruesa (AeroPress Inverted)',
    grindMicrons: 2050,
    grinderSettings: {
      jmax: { rot: 2, num: 6, click: 0, text: '2.6.0 (~2050 µm)' },
      femobook: { clicks: 70, text: '70 clics (1.75 Rot.)' },
      comandante: { clicks: 26, text: '26 clics' }
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
  }
];
