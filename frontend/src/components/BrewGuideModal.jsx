import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  CheckCircle2,
  Volume2,
  VolumeX,
  X,
  RotateCcw,
  Sparkles,
  Lock,
  Unlock,
  Zap,
  Thermometer,
  Clock,
  Sliders,
  Coffee,
  Scale,
  Flame,
  Target,
  Timer,
  FastForward,
  Droplet,
  Trophy,
  Mic,
  MicOff
} from 'lucide-react';
import {
  playCountdownBeep,
  playPhaseChime,
  playSuccessChime,
  requestScreenWakeLock,
  releaseScreenWakeLock,
  getAudioContext,
  speakBaristaGuidance,
  cancelSpeech,
  primeSpeechSynthesis
} from '../utils/baristaAudio.js';
import { computeSensoryCorrection } from '../utils/sensoryTuner.js';
import { getGrinderConfig } from '../utils/grinders.js';

/**
 * Parses time expressions such as "0:45", "3:30 min", "45s", or raw numbers to seconds.
 */
function parseTimeToSeconds(timeStr) {
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
function formatTime(totalSec) {
  const s = Math.max(0, Math.floor(totalSec));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Resolves or decomposes brewing stages strictly aligned with the extraction method.
 */
function parseStages(recipe) {
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
        label: 'Bloom e Inmersión (🔒 Válvula CERRADA)',
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
        label: '1º Vertido Percolación (⚡ Válvula MEDIA 50%)',
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
        label: '2º Vertido & Caída Final (🔓 Válvula 100% ABIERTA)',
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

/**
 * Fullscreen Interactive Barista Guide Modal Component
 */
export default function BrewGuideModal({
  isOpen,
  onClose,
  recipe,
  batch,
  onSaveTunedRecipe
}) {
  // Navigation & View Mode
  const [viewMode, setViewMode] = useState('timer'); // 'timer' | 'diagnostic'
  const [isMuted, setIsMuted] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(() => {
    try {
      return typeof localStorage !== 'undefined' ? localStorage.getItem('beantag-voice-enabled') !== 'false' : true;
    } catch (_) {
      return true;
    }
  });

  const handleToggleVoice = useCallback(() => {
    setIsVoiceEnabled(prev => {
      const nextVal = !prev;
      try {
        localStorage.setItem('beantag-voice-enabled', String(nextVal));
      } catch (_) {}
      if (!nextVal) {
        cancelSpeech();
      } else {
        primeSpeechSynthesis();
        speakBaristaGuidance('Voz del barista activada.');
      }
      return nextVal;
    });
  }, []);

  // Timer State
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);

  // Sensory Feedback State (3-Tap)
  const [feedback, setFeedback] = useState({
    taste: 'balanced',
    flow: 'on_time',
    body: 'balanced'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Timing & Audio Tracking Refs
  const startTimestampRef = useRef(null);
  const baseElapsedRef = useRef(0);
  const lastBeepSecRef = useRef(null);
  const prevStageIndexRef = useRef(0);
  const sentinelRef = useRef(null);

  // Parse Recipe Stages
  const stages = useMemo(() => parseStages(recipe), [recipe]);
  const totalBrewDuration = useMemo(() => {
    if (!stages.length) return 180;
    return stages[stages.length - 1].endSec || stages.reduce((acc, s) => acc + s.duration, 0);
  }, [stages]);

  // Current active stage
  const currentStageIndex = useMemo(() => {
    if (!stages.length) return 0;
    const idx = stages.findIndex(s => elapsedSeconds < s.endSec);
    return idx !== -1 ? idx : stages.length - 1;
  }, [stages, elapsedSeconds]);

  const currentStage = stages[currentStageIndex] || stages[0];

  // Stage remaining seconds
  const stageRemainingSec = useMemo(() => {
    if (!currentStage) return 0;
    return Math.max(0, Math.ceil(currentStage.endSec - elapsedSeconds));
  }, [currentStage, elapsedSeconds]);

  // Suggested flow rate for active stage
  const suggestedFlowRate = useMemo(() => {
    if (!currentStage || currentStage.water_g <= 0) return null;
    const pourDuration = Math.max(10, Math.min(currentStage.duration, Math.round(currentStage.duration * 0.55)));
    return (currentStage.water_g / pourDuration).toFixed(1);
  }, [currentStage]);

  // Dynamic Real-time Voice Coach instruction generator
  const getStageSpeechText = useCallback((stageIndex, stage) => {
    if (!stage) return '';
    const m = (recipe?.method || '').toLowerCase();
    const isPulsar = m.includes('pulsar');
    const isAero = m.includes('aero');
    const isEspresso = m.includes('espresso');

    if (stageIndex === 0) {
      if (isPulsar) {
        return `Iniciando extracción. Válvula de control cerrada. Vierte ${stage.water_g} gramos en el dispersor para el bloom.`;
      }
      if (isAero) {
        return `Iniciando preparación. Vierte ${stage.water_g} gramos para pre-infusión y satura homogéneamente.`;
      }
      if (isEspresso) {
        return `Iniciando pre-infusión suave a baja presión.`;
      }
      return `Iniciando extracción. Vierte ${stage.water_g} gramos en espiral suave para el bloom.`;
    }

    if (isPulsar) {
      if (stage.valve === 'half') {
        return `Etapa ${stage.step}: abre la válvula al cincuenta por ciento. Vierte ${stage.water_g} gramos hasta alcanzar ${stage.total_water_g} gramos.`;
      }
      if (stage.valve === 'open') {
        return `Etapa ${stage.step}: abre la válvula por completo. Caída final y drenaje libre.`;
      }
    }

    if (stage.water_g <= 0) {
      return `Etapa ${stage.step}: ${stage.label || 'Caída final'}. Deja drenar libremente la columna de agua hasta formar cama plana.`;
    }

    return `Etapa ${stage.step}: ${stage.label || 'Vertido'}. Vierte ${stage.water_g} gramos hasta llegar a ${stage.total_water_g} gramos.`;
  }, [recipe]);

  // Grinder resolution for sensory tuner
  const activeGrinderId = useMemo(() => {
    const rawId = (
      recipe?.active_grinder_dial?.grinder_id ||
      recipe?.active_grinder_id ||
      batch?.grinder ||
      recipe?.grinder ||
      (typeof localStorage !== 'undefined' ? localStorage.getItem('default-grinder') : '') ||
      'femobook'
    ).toLowerCase();

    if (rawId.includes('femo')) return 'femobook';
    if (rawId.includes('jmax') || rawId.includes('j-max')) return 'jmax';
    if (rawId.includes('k_ultra') || rawId.includes('k-ultra') || rawId.includes('kultra')) return 'k_ultra';
    if (rawId.includes('ode')) return 'ode_gen2';
    if (rawId.includes('comandante') || rawId.includes('c40')) return 'comandante';
    if (rawId.includes('kingrinder') || rawId.includes('k6')) return 'kingrinder';
    if (rawId.includes('timemore') || rawId.includes('c2') || rawId.includes('c3')) return 'timemore';
    if (rawId.includes('baratza') || rawId.includes('encore') || rawId.includes('esp')) return 'baratza';
    return 'femobook';
  }, [recipe, batch]);

  const currentDialText = useMemo(() => {
    if (recipe?.active_grinder_dial?.dial_text) return recipe.active_grinder_dial.dial_text;
    if (recipe?.grinders && recipe.grinders[activeGrinderId]) return recipe.grinders[activeGrinderId];
    if (recipe?.grinderSettings && recipe.grinderSettings[activeGrinderId]?.text) return recipe.grinderSettings[activeGrinderId].text;
    if (recipe?.grind) return recipe.grind;

    switch (activeGrinderId) {
      case 'jmax': return '2.4.0';
      case 'k_ultra': return '8.0';
      case 'ode_gen2': return '4.2';
      case 'comandante': return '23 clics';
      case 'kingrinder': return '92 clics (~1.32)';
      case 'timemore': return '17 clics';
      case 'baratza': return 'Ajuste 15';
      default: return '68 clics (~1.7 Rot.)';
    }
  }, [recipe, activeGrinderId]);

  const currentWaterTemp = useMemo(() => {
    if (recipe?.temperature) {
      const num = parseInt(recipe.temperature, 10);
      if (Number.isFinite(num) && num > 0) return num;
    }
    return 93;
  }, [recipe]);

  // Compute live sensory correction
  const sensoryCorrection = useMemo(() => {
    return computeSensoryCorrection(activeGrinderId, currentDialText, currentWaterTemp, feedback);
  }, [activeGrinderId, currentDialText, currentWaterTemp, feedback]);

  const activeGrinderConfig = useMemo(() => {
    return getGrinderConfig(activeGrinderId);
  }, [activeGrinderId]);

  // 1. Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setViewMode('timer');
      setElapsedSeconds(0);
      setIsActive(false);
      baseElapsedRef.current = 0;
      startTimestampRef.current = null;
      lastBeepSecRef.current = null;
      prevStageIndexRef.current = 0;
      setFeedback({ taste: 'balanced', flow: 'on_time', body: 'balanced' });
      setSaveSuccess(false);
      setIsSaving(false);
    } else {
      setIsActive(false);
    }
  }, [isOpen]);

  // 2. Screen Wake Lock & Tab Visibility
  useEffect(() => {
    if (!isOpen) {
      if (sentinelRef.current) {
        releaseScreenWakeLock(sentinelRef.current);
        sentinelRef.current = null;
      }
      return;
    }

    let isMounted = true;

    const acquireLock = async () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        const sentinel = await requestScreenWakeLock();
        if (isMounted && sentinel) {
          sentinelRef.current = sentinel;
          if (typeof sentinel.addEventListener === 'function') {
            sentinel.addEventListener('release', () => {
              if (sentinelRef.current === sentinel) {
                sentinelRef.current = null;
              }
            });
          }
        }
      }
    };

    acquireLock();

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && !sentinelRef.current) {
        acquireLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (sentinelRef.current) {
        releaseScreenWakeLock(sentinelRef.current);
        sentinelRef.current = null;
      }
    };
  }, [isOpen]);

  // 3. Extraction High-Precision Timer (Interval runs every 250ms with Date.now() drift compensation)
  useEffect(() => {
    if (!isActive || !isOpen) return;

    startTimestampRef.current = Date.now();
    baseElapsedRef.current = elapsedSeconds;

    const interval = setInterval(() => {
      const now = Date.now();
      const delta = (now - startTimestampRef.current) / 1000;
      const currentElapsed = baseElapsedRef.current + delta;

      if (currentElapsed >= totalBrewDuration) {
        setElapsedSeconds(totalBrewDuration);
        setIsActive(false);
        if (!isMuted) {
          playSuccessChime();
          if (isVoiceEnabled) {
            speakBaristaGuidance('Extracción finalizada. Buen provecho con tu café.');
          }
        }
        setViewMode('diagnostic');
        clearInterval(interval);
        return;
      }

      setElapsedSeconds(currentElapsed);
    }, 250);

    return () => clearInterval(interval);
  }, [isActive, isOpen, totalBrewDuration, isMuted, isVoiceEnabled]);

  // 4. Audio: 3-2-1 Countdown Beeps
  useEffect(() => {
    if (!isActive) return;

    if (stageRemainingSec === 3 || stageRemainingSec === 2 || stageRemainingSec === 1) {
      if (lastBeepSecRef.current !== stageRemainingSec) {
        lastBeepSecRef.current = stageRemainingSec;
        if (!isMuted) {
          playCountdownBeep();
        }
      }
    } else {
      lastBeepSecRef.current = null;
    }
  }, [stageRemainingSec, isActive, isMuted]);

  // 5. Audio & Voice: Stage Transition
  useEffect(() => {
    if (!isActive) {
      prevStageIndexRef.current = currentStageIndex;
      return;
    }

    if (currentStageIndex > prevStageIndexRef.current) {
      if (!isMuted) {
        playPhaseChime();
        if (isVoiceEnabled && stages[currentStageIndex]) {
          speakBaristaGuidance(getStageSpeechText(currentStageIndex, stages[currentStageIndex]));
        }
      }
      lastBeepSecRef.current = null;
    }
    prevStageIndexRef.current = currentStageIndex;
  }, [currentStageIndex, isActive, isMuted, isVoiceEnabled, stages, getStageSpeechText]);

  // Handler: Start / Resume / Pause
  const handleTogglePlay = useCallback(() => {
    if (navigator.vibrate) navigator.vibrate(12);
    getAudioContext(); // Prime Web Audio context on user gesture
    primeSpeechSynthesis(); // Prime Web Speech API on user gesture
    if (isActive) {
      setIsActive(false);
      cancelSpeech();
    } else {
      setIsActive(true);
      if (elapsedSeconds < 1 && !isMuted && isVoiceEnabled && stages[0]) {
        speakBaristaGuidance(getStageSpeechText(0, stages[0]));
      }
    }
  }, [isActive, elapsedSeconds, isMuted, isVoiceEnabled, stages, getStageSpeechText]);

  // Handler: Skip forward to next stage
  const handleNextStage = useCallback(() => {
    if (navigator.vibrate) navigator.vibrate(16);
    if (currentStageIndex < stages.length - 1) {
      const nextIdx = currentStageIndex + 1;
      const nextStage = stages[nextIdx];
      setElapsedSeconds(nextStage.startSec);
      baseElapsedRef.current = nextStage.startSec;
      startTimestampRef.current = Date.now();
      lastBeepSecRef.current = null;
      if (!isMuted) {
        playPhaseChime();
        if (isVoiceEnabled) {
          speakBaristaGuidance(getStageSpeechText(nextIdx, nextStage));
        }
      }
    } else {
      setIsActive(false);
      if (!isMuted) {
        playSuccessChime();
        if (isVoiceEnabled) {
          speakBaristaGuidance('Extracción finalizada. Buen provecho con tu café.');
        }
      }
      setViewMode('diagnostic');
    }
  }, [currentStageIndex, stages, isMuted, isVoiceEnabled, getStageSpeechText]);

  // Handler: Terminate extraction immediately
  const handleFinishExtraction = useCallback(() => {
    setIsActive(false);
    cancelSpeech();
    if (!isMuted) {
      playSuccessChime();
      if (isVoiceEnabled) {
        speakBaristaGuidance('Extracción completada. Evaluando resultados en bitácora.');
      }
    }
    setViewMode('diagnostic');
  }, [isMuted, isVoiceEnabled]);

  // Handler: Reset Timer
  const handleResetTimer = useCallback(() => {
    setIsActive(false);
    cancelSpeech();
    setElapsedSeconds(0);
    baseElapsedRef.current = 0;
    startTimestampRef.current = null;
    lastBeepSecRef.current = null;
    prevStageIndexRef.current = 0;
  }, []);

  // Handler: Safe Close
  const handleCloseModal = useCallback(() => {
    cancelSpeech();
    if (isActive) {
      if (typeof window !== 'undefined' && window.confirm('¿Deseas salir del asistente de extracción? El tiempo en curso se perderá.')) {
        setIsActive(false);
        onClose();
      }
    } else {
      onClose();
    }
  }, [isActive, onClose]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleCloseModal]);

  // Handler: Save Tuned Recipe
  const handleSaveTuned = async () => {
    if (typeof onSaveTunedRecipe !== 'function') {
      onClose();
      return;
    }

    try {
      setIsSaving(true);
      const tunedData = {
        recipeId: recipe?.id,
        batchId: batch?.id,
        method: recipe?.method || 'Filtro',
        dose_in_g: recipe?.dose_in_g || 15,
        water_total_g: recipe?.water_total_g || stages[stages.length - 1]?.total_water_g || 250,
        ratio: recipe?.ratio || '1:15',
        temperature: sensoryCorrection.newTemp,
        brew_time: formatTime(elapsedSeconds),
        grind: sensoryCorrection.newGrindText,
        notes: `Calibración Sensorial: Sabor ${feedback.taste}, Caudal ${feedback.flow}, Cuerpo ${feedback.body}. ${sensoryCorrection.explanation}`,
        feedback,
        correction: sensoryCorrection,
        actualBrewTimeSec: Math.round(elapsedSeconds)
      };

      await onSaveTunedRecipe(tunedData);
      setSaveSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Error al guardar receta afinada:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  // Global & Stage Progress percentages
  const globalProgress = Math.min(100, Math.max(0, (elapsedSeconds / Math.max(1, totalBrewDuration)) * 100));
  const stageElapsed = Math.max(0, elapsedSeconds - (currentStage?.startSec || 0));
  const stageProgress = currentStage?.duration ? Math.min(100, Math.max(0, (stageElapsed / currentStage.duration) * 100)) : 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--bg-canvas, #F2F2F7)',
        color: 'var(--color-text, #000000)',
        zIndex: 11000,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        fontFamily: 'var(--font-body, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif)'
      }}
    >
      {/* 🧭 Top Bar / Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color, rgba(60, 60, 67, 0.12))',
          backgroundColor: 'var(--bg-header, rgba(242, 242, 247, 0.85))',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          position: 'sticky',
          top: 0,
          zIndex: 20
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              backgroundColor: 'var(--color-crimson, #BC5449)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 2px 8px rgba(188, 84, 73, 0.35)',
              flexShrink: 0
            }}
          >
            <Coffee size={18} strokeWidth={2.4} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2
              style={{
                margin: 0,
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--color-text, #000000)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontFamily: 'var(--font-heading)'
              }}
            >
              {recipe?.method || 'V60 (Filtrado)'}
            </h2>
            <div
              style={{
                fontSize: '12px',
                color: 'var(--color-text-muted, #8E8E93)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {batch?.origin || batch?.name || 'Receta Especial'} • {recipe?.dose_in_g || 15}g café • {recipe?.temperature || 93}°C
            </div>
          </div>
        </div>

        {/* Right Header Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Voice Coach Toggle */}
          <button
            type="button"
            onClick={handleToggleVoice}
            aria-label={isVoiceEnabled ? 'Desactivar voz del barista' : 'Activar voz del barista'}
            title={isVoiceEnabled ? 'Guía de voz en tiempo real: Activada' : 'Guía de voz en tiempo real: Silenciada'}
            style={{
              background: isVoiceEnabled ? 'var(--barista-accent-mint-bg, #D1FAE5)' : 'var(--barista-bg-subtle, rgba(118, 118, 128, 0.12))',
              border: isVoiceEnabled ? '1px solid var(--barista-accent-mint-text, #059669)' : '1px solid var(--border-color, rgba(60, 60, 67, 0.12))',
              color: isVoiceEnabled ? 'var(--barista-accent-mint-text, #065F46)' : 'var(--color-text-muted, #8E8E93)',
              borderRadius: '8px',
              padding: '8px 10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 700,
              minHeight: '36px',
              transition: 'all 150ms ease'
            }}
          >
            {isVoiceEnabled ? <Mic size={16} /> : <MicOff size={16} />}
            <span>{isVoiceEnabled ? 'Voz' : 'Mudo'}</span>
          </button>

          {/* Mute Toggle */}
          <button
            type="button"
            onClick={() => setIsMuted(prev => !prev)}
            aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
            title={isMuted ? 'Activar alertas sonoras' : 'Silenciar alertas'}
            style={{
              background: isMuted ? 'var(--barista-accent-danger-bg, #FEE2E2)' : 'var(--barista-bg-subtle, rgba(118, 118, 128, 0.12))',
              border: isMuted ? '1px solid var(--barista-accent-danger, #EF4444)' : '1px solid var(--border-color, rgba(60, 60, 67, 0.12))',
              color: isMuted ? 'var(--barista-accent-danger-text, #991B1B)' : 'var(--color-text, #000000)',
              borderRadius: '8px',
              padding: '8px 10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 600,
              minHeight: '36px',
              transition: 'all 150ms ease'
            }}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            <span style={{ display: 'none' }}>{isMuted ? 'Mudo' : 'Audio'}</span>
          </button>

          {/* Close Modal */}
          <button
            type="button"
            onClick={handleCloseModal}
            aria-label="Cerrar Asistente"
            style={{
              background: 'var(--barista-bg-subtle, rgba(118, 118, 128, 0.12))',
              border: '1px solid var(--border-color, rgba(60, 60, 67, 0.12))',
              color: 'var(--color-text-muted, #8E8E93)',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '36px',
              minHeight: '36px',
              transition: 'all 150ms ease'
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Global Extraction Progress Bar */}
      <div
        style={{
          width: '100%',
          height: '4px',
          backgroundColor: 'var(--segmented-bg, rgba(118, 118, 128, 0.15))',
          position: 'relative'
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${globalProgress}%`,
            backgroundColor: 'var(--color-crimson, #BC5449)',
            boxShadow: '0 0 10px rgba(188, 84, 73, 0.5)',
            transition: 'width 250ms linear'
          }}
        />
      </div>

      {/* 📱 Main Content Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px 16px calc(24px + env(safe-area-inset-bottom))',
          maxWidth: '680px',
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box'
        }}
      >
        {viewMode === 'timer' ? (
          /* ============================================================== */
          /* ⏱️ VIEW 1: EXTRACTION TIMER VIEW                             */
          /* ============================================================== */
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Giant Monospace Timer with Glanceability at 1m */}
            <div style={{ textAlign: 'center', margin: '8px 0 16px' }}>
              <div
                className="barista-timer font-mono text-7xl md:text-8xl font-black tracking-tight"
                style={{
                  fontFamily: 'var(--font-metric, var(--font-mono, monospace))',
                  fontSize: 'clamp(4.2rem, 15vw, 6.5rem)',
                  fontWeight: 900,
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                  color: 'var(--text-primary, var(--color-text, #000000))'
                }}
              >
                {formatTime(elapsedSeconds)}
              </div>
              <div
                style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary, var(--color-text-muted, #8E8E93))',
                  marginTop: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontFamily: 'var(--font-display, sans-serif)'
                }}
              >
                <Clock size={14} />
                <span>Meta Total: {formatTime(totalBrewDuration)}</span>
              </div>
            </div>

            {/* Live Voice Coach Guidance Banner */}
            <div
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: isVoiceEnabled ? 'var(--barista-accent-mint-bg, rgba(16, 185, 129, 0.12))' : 'var(--barista-bg-subtle, rgba(118, 118, 128, 0.08))',
                border: isVoiceEnabled ? '1.5px solid var(--barista-accent-mint-text, #10B981)' : '1px dashed var(--border-color, rgba(60, 60, 67, 0.18))',
                borderRadius: '14px',
                padding: '12px 16px',
                marginBottom: '16px',
                boxSizing: 'border-box',
                transition: 'all 200ms ease',
                boxShadow: isVoiceEnabled ? '0 2px 8px rgba(16, 185, 129, 0.12)' : 'none'
              }}
            >
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                backgroundColor: isVoiceEnabled ? 'var(--barista-accent-mint-text, #059669)' : 'var(--barista-bg-subtle, rgba(118, 118, 128, 0.2))',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {isVoiceEnabled ? <Mic size={18} /> : <MicOff size={18} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  color: isVoiceEnabled ? 'var(--barista-accent-mint-text, #065F46)' : 'var(--color-text-muted)'
                }}>
                  {isVoiceEnabled ? '🗣️ Asistente de Voz del Barista' : 'Voz Silenciada (Pulsa el botón superior para activar)'}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.4, marginTop: '2px' }}>
                  {getStageSpeechText(currentStageIndex, currentStage)}
                </div>
              </div>
            </div>

            {/* Active Stage Card */}
            <div
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-card, #FFFFFF)',
                borderRadius: '16px',
                border: '1px solid var(--border-color, rgba(60, 60, 67, 0.12))',
                padding: '20px',
                boxSizing: 'border-box',
                boxShadow: 'var(--card-shadow, 0 4px 20px -2px rgba(0, 0, 0, 0.05))',
                marginBottom: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              {/* Stage Counter & Title */}
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--color-crimson, #BC5449)',
                  marginBottom: '4px'
                }}
              >
                Fase {currentStageIndex + 1} de {stages.length}: {currentStage.title || currentStage.label}
              </div>

              {/* Dynamic Valve Badge */}
              {currentStage?.valve && (
                <div style={{ margin: '8px 0 10px' }}>
                  {currentStage.valve === 'closed' && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                        backgroundColor: 'var(--valve-closed-bg, rgba(239, 68, 68, 0.15))',
                        color: 'var(--valve-closed, #EF4444)',
                        border: '1.5px solid var(--valve-closed, #EF4444)',
                        boxShadow: '0 2px 8px rgba(239, 68, 68, 0.2)'
                      }}
                    >
                      <Lock size={15} />
                      <span>🔒 VÁLVULA CERRADA (Bloom / Inmersión)</span>
                    </div>
                  )}
                  {currentStage.valve === 'half' && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                        backgroundColor: 'var(--valve-half-bg, rgba(217, 119, 6, 0.15))',
                        color: 'var(--valve-half, #D97706)',
                        border: '1.5px solid var(--valve-half, #D97706)',
                        boxShadow: '0 2px 8px rgba(217, 119, 6, 0.2)'
                      }}
                    >
                      <Zap size={15} />
                      <span>⚡ VÁLVULA 50% MEDIA (Caudal Regulado)</span>
                    </div>
                  )}
                  {currentStage.valve === 'open' && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                        backgroundColor: 'var(--valve-open-bg, rgba(16, 185, 129, 0.15))',
                        color: 'var(--valve-open, #10B981)',
                        border: '1.5px solid var(--valve-open, #10B981)',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)'
                      }}
                    >
                      <Unlock size={15} />
                      <span>🔓 VÁLVULA 100% ABIERTA (Drawdown / Percolación)</span>
                    </div>
                  )}
                </div>
              )}

              {/* Stage Description */}
              {currentStage?.description && (
                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--barista-text-secondary, var(--color-text-muted, #475569))',
                    textAlign: 'center',
                    margin: '4px 0 14px',
                    lineHeight: '1.45',
                    maxWidth: '480px'
                  }}
                >
                  {currentStage.description}
                </p>
              )}

              {/* Target Cumulative Water & Suggested Flow Rate */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  margin: '6px 0 12px'
                }}
              >
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted, #8E8E93)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                  Objetivo de Agua
                </div>
                <div
                  style={{
                    fontSize: '26px',
                    fontWeight: 800,
                    color: 'var(--color-text, #000000)',
                    fontFamily: 'var(--font-mono, monospace)'
                  }}
                >
                  Verter hasta {currentStage.total_water_g}g{' '}
                  <span style={{ fontSize: '18px', color: 'var(--color-crimson, #BC5449)', fontWeight: 700 }}>
                    (+{currentStage.water_g}g)
                  </span>
                </div>
                {suggestedFlowRate ? (
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--barista-accent-honey-text, #92400E)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      marginTop: '2px',
                      fontWeight: 600
                    }}
                  >
                    <span>Caudal sugerido:</span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono, monospace)',
                        background: 'var(--barista-accent-honey-bg, #FEF3C7)',
                        border: '1px solid var(--barista-instr-border, #FDE68A)',
                        color: 'var(--barista-accent-honey-text, #92400E)',
                        padding: '1px 7px',
                        borderRadius: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                    >
                      <Droplet size={11} color="var(--barista-accent-honey, #D97706)" />
                      ~{suggestedFlowRate} ml/s
                    </span>
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted, #8E8E93)', fontStyle: 'italic', marginTop: '2px' }}>
                    Drenaje libre hacia lecho plano
                  </div>
                )}
              </div>

              {/* Stage Countdown & Mini Progress Bar */}
              <div style={{ width: '100%', marginTop: '8px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '12px',
                    fontWeight: 700,
                    marginBottom: '6px'
                  }}
                >
                  <span style={{ color: 'var(--color-text-muted, #8E8E93)' }}>Paso {currentStageIndex + 1}/{stages.length}</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      color: stageRemainingSec <= 3 && isActive ? 'var(--barista-accent-danger, #EF4444)' : 'var(--color-text, #000000)',
                      fontSize: '13px',
                      fontWeight: 800
                    }}
                  >
                    Quedan {stageRemainingSec}s
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '6px',
                    borderRadius: '3px',
                    backgroundColor: 'var(--segmented-bg, rgba(118, 118, 128, 0.15))',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${stageProgress}%`,
                      backgroundColor: stageRemainingSec <= 3 && isActive ? 'var(--barista-accent-danger, #EF4444)' : 'var(--color-crimson, #BC5449)',
                      transition: 'width 250ms linear, background-color 200ms ease'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Stages Stepper Timeline */}
            <div
              style={{
                width: '100%',
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                paddingBottom: '12px',
                scrollbarWidth: 'none',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {stages.map((stg, idx) => {
                const isPast = idx < currentStageIndex;
                const isCurrent = idx === currentStageIndex;
                return (
                  <div
                    key={idx}
                    style={{
                      flex: '1 1 0',
                      minWidth: '95px',
                      padding: '8px',
                      borderRadius: '8px',
                      backgroundColor: isCurrent ? 'var(--barista-instr-bg, #FFFBEB)' : (isPast ? 'var(--barista-accent-mint-bg, #D1FAE5)' : 'var(--bg-card, #FFFFFF)'),
                      border: isCurrent ? '1.5px solid var(--color-crimson, #BC5449)' : (isPast ? '1px solid var(--barista-accent-mint, #10B981)' : '1px solid var(--border-color, rgba(60, 60, 67, 0.12))'),
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      transition: 'all 200ms ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: isCurrent ? 'var(--color-crimson, #BC5449)' : (isPast ? 'var(--barista-accent-mint-text, #065F46)' : 'var(--color-text-muted, #8E8E93)') }}>
                        #{idx + 1}
                      </span>
                      {isPast && <CheckCircle2 size={12} color="var(--barista-accent-mint, #10B981)" />}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: isCurrent ? 'var(--color-text, #000000)' : (isPast ? 'var(--barista-accent-mint-text, #065F46)' : 'var(--color-text-muted, #8E8E93)'),
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {stg.label}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted, #8E8E93)', fontFamily: 'var(--font-mono, monospace)' }}>
                      +{stg.water_g}g ({formatTime(stg.duration)})
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Giant Barista Touch Controls */}
            <div
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                marginTop: '12px'
              }}
            >
              {/* Primary Play/Pause Row */}
              <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  style={{
                    flex: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    padding: '14px 20px',
                    borderRadius: 'var(--radius-lg, 14px)',
                    backgroundColor: isActive ? 'var(--valve-closed, #EF4444)' : 'var(--accent-terracotta, #BC5449)',
                    color: '#FFFFFF',
                    fontSize: '16px',
                    fontWeight: 800,
                    fontFamily: 'var(--font-display, sans-serif)',
                    letterSpacing: '0.02em',
                    border: 'none',
                    cursor: 'pointer',
                    minHeight: '56px',
                    height: '56px',
                    boxShadow: isActive ? '0 4px 16px rgba(239, 68, 68, 0.35)' : '0 4px 16px rgba(188, 84, 73, 0.35)',
                    transition: 'all 180ms ease'
                  }}
                >
                  {isActive ? (
                    <>
                      <Pause size={22} />
                      <span>Pausar</span>
                    </>
                  ) : (
                    <>
                      <Play size={22} fill="#FFFFFF" />
                      <span>{elapsedSeconds > 0 ? 'Reanudar' : 'Iniciar Extracción'}</span>
                    </>
                  )}
                </button>

                {/* Siguiente Fase Button */}
                <button
                  type="button"
                  onClick={handleNextStage}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-lg, 14px)',
                    backgroundColor: 'var(--bg-surface, var(--bg-card, #FFFFFF))',
                    border: '1.5px solid var(--border-subtle, rgba(60, 60, 67, 0.12))',
                    color: 'var(--text-primary, #000000)',
                    fontSize: '14px',
                    fontWeight: 800,
                    fontFamily: 'var(--font-display, sans-serif)',
                    cursor: 'pointer',
                    minHeight: '56px',
                    height: '56px',
                    boxShadow: 'var(--shadow-sm, 0 2px 6px rgba(0, 0, 0, 0.04))',
                    transition: 'all 180ms ease'
                  }}
                >
                  <SkipForward size={18} />
                  <span>Siguiente</span>
                </button>
              </div>

              {/* Secondary Actions Row */}
              <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                <button
                  type="button"
                  onClick={handleResetTimer}
                  disabled={elapsedSeconds === 0}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md, 10px)',
                    backgroundColor: 'var(--bg-elevated, rgba(118, 118, 128, 0.12))',
                    border: '1px solid var(--border-subtle, rgba(60, 60, 67, 0.12))',
                    color: elapsedSeconds === 0 ? 'var(--text-muted, #8E8E93)' : 'var(--text-primary, #000000)',
                    fontSize: '13px',
                    fontWeight: 700,
                    minHeight: '48px',
                    height: '48px',
                    opacity: elapsedSeconds === 0 ? 0.5 : 1,
                    cursor: elapsedSeconds === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  <RotateCcw size={15} />
                  <span>Reiniciar</span>
                </button>

                <button
                  type="button"
                  onClick={handleFinishExtraction}
                  style={{
                    flex: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md, 10px)',
                    backgroundColor: 'var(--barista-accent-mint-bg, rgba(16, 185, 129, 0.15))',
                    border: '1.5px solid var(--valve-open, #10B981)',
                    color: 'var(--valve-open, #065F46)',
                    fontSize: '13px',
                    fontWeight: 800,
                    minHeight: '48px',
                    height: '48px',
                    cursor: 'pointer',
                    transition: 'all 180ms ease'
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>Terminar Extracción</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* ☕ VIEW 2: POST-BREW SENSORY DIAGNOSTIC VIEW                   */
          /* ============================================================== */
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', margin: '4px 0 8px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  backgroundColor: 'var(--barista-accent-honey-bg, #FEF3C7)',
                  border: '1px solid var(--barista-instr-border, #FDE68A)',
                  color: 'var(--barista-accent-honey-text, #92400E)',
                  fontSize: '12px',
                  fontWeight: 700,
                  marginBottom: '6px'
                }}
              >
                <Sparkles size={14} />
                <span>Extracción Finalizada</span>
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '2px 0 6px', color: 'var(--color-text, #000000)', fontFamily: 'var(--font-heading)' }}>
                <Coffee size={22} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                Diagnóstico Barista & Calibración Fina
              </h2>
              <div style={{ fontSize: '13px', color: 'var(--color-text-muted, #8E8E93)' }}>
                {batch?.origin || batch?.name || 'Origen'} • {recipe?.method || 'Filtro'}
              </div>

              {/* Extraction Metrics Pills */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                  marginTop: '10px'
                }}
              >
                <span
                  style={{
                    backgroundColor: 'var(--bg-card, #FFFFFF)',
                    border: '1px solid var(--border-color, rgba(60, 60, 67, 0.12))',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    color: 'var(--color-text, #000000)',
                    fontFamily: 'var(--font-mono, monospace)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Timer size={13} color="var(--barista-accent-honey, #D97706)" />
                  Tiempo Medido: <strong>{formatTime(elapsedSeconds)}</strong>
                </span>
                <span
                  style={{
                    backgroundColor: 'var(--bg-card, #FFFFFF)',
                    border: '1px solid var(--border-color, rgba(60, 60, 67, 0.12))',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    color: 'var(--color-text, #000000)',
                    fontFamily: 'var(--font-mono, monospace)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Droplet size={13} color="var(--color-crimson, #BC5449)" />
                  Agua: <strong>{stages[stages.length - 1]?.total_water_g || recipe?.water_total_g || 250}g</strong>
                </span>
                <span
                  style={{
                    backgroundColor: 'var(--bg-card, #FFFFFF)',
                    border: '1px solid var(--border-color, rgba(60, 60, 67, 0.12))',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    color: 'var(--color-text, #000000)',
                    fontFamily: 'var(--font-mono, monospace)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Scale size={13} color="var(--barista-accent-honey, #D97706)" />
                  Dosis: <strong>{recipe?.dose_in_g || 15}g</strong>
                </span>
              </div>
            </div>

            {/* 3-Tap Sensory Evaluation Form */}
            <div
              style={{
                backgroundColor: 'var(--bg-card, #FFFFFF)',
                borderRadius: '16px',
                border: '1px solid var(--border-color, rgba(60, 60, 67, 0.12))',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                boxShadow: 'var(--card-shadow, 0 4px 20px -2px rgba(0, 0, 0, 0.05))'
              }}
            >
              {/* 1. Sabor */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--color-text, #000000)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  1. Sabor Dominante en Taza
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {[
                    { key: 'sour', label: 'Agrio / Punzante', desc: 'Sub-extraído', icon: Flame, iconColor: '#EF4444' },
                    { key: 'balanced', label: 'Dulce / Balanceado', desc: 'Punto Dulce', icon: Trophy, iconColor: '#10B981' },
                    { key: 'bitter', label: 'Amargo / Seco', desc: 'Sobre-extraído', icon: Coffee, iconColor: '#D97706' }
                  ].map(item => {
                    const isSelected = feedback.taste === item.key;
                    const ItemIcon = item.icon;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setFeedback(prev => ({ ...prev, taste: item.key }))}
                        style={{
                          padding: '12px 6px',
                          borderRadius: '10px',
                          border: isSelected
                            ? (item.key === 'balanced' ? '2px solid var(--barista-accent-mint, #10B981)' : '2px solid var(--barista-accent-honey, #D97706)')
                            : '1px solid var(--border-color, rgba(60, 60, 67, 0.12))',
                          backgroundColor: isSelected
                            ? (item.key === 'balanced' ? 'var(--barista-accent-mint-bg, #D1FAE5)' : 'var(--barista-accent-honey-bg, #FEF3C7)')
                            : 'var(--barista-bg-subtle, rgba(118, 118, 128, 0.06))',
                          color: isSelected
                            ? (item.key === 'balanced' ? 'var(--barista-accent-mint-text, #065F46)' : 'var(--barista-accent-honey-text, #92400E)')
                            : 'var(--color-text, #000000)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '3px',
                          minHeight: '64px',
                          transition: 'all 150ms ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ItemIcon size={14} color={item.iconColor} />
                          <span style={{ fontSize: '11.5px', fontWeight: 700 }}>{item.label}</span>
                        </div>
                        <span style={{ fontSize: '10px', color: isSelected ? 'inherit' : 'var(--color-text-muted, #8E8E93)' }}>{item.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Caudal */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--color-text, #000000)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  2. Caudal y Tiempo de Drenaje
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {[
                    { key: 'fast', label: 'Drenó muy rápido', desc: '< Tiempo meta', icon: FastForward, iconColor: '#3B82F6' },
                    { key: 'on_time', label: 'A tiempo (±15s)', desc: 'Tiempo previsto', icon: Target, iconColor: '#10B981' },
                    { key: 'slow', label: 'Lento o atascado', desc: '> +30s meta', icon: Clock, iconColor: '#EF4444' }
                  ].map(item => {
                    const isSelected = feedback.flow === item.key;
                    const ItemIcon = item.icon;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setFeedback(prev => ({ ...prev, flow: item.key }))}
                        style={{
                          padding: '12px 6px',
                          borderRadius: '10px',
                          border: isSelected
                            ? (item.key === 'on_time' ? '2px solid var(--barista-accent-mint, #10B981)' : '2px solid var(--barista-accent-honey, #D97706)')
                            : '1px solid var(--border-color, rgba(60, 60, 67, 0.12))',
                          backgroundColor: isSelected
                            ? (item.key === 'on_time' ? 'var(--barista-accent-mint-bg, #D1FAE5)' : 'var(--barista-accent-honey-bg, #FEF3C7)')
                            : 'var(--barista-bg-subtle, rgba(118, 118, 128, 0.06))',
                          color: isSelected
                            ? (item.key === 'on_time' ? 'var(--barista-accent-mint-text, #065F46)' : 'var(--barista-accent-honey-text, #92400E)')
                            : 'var(--color-text, #000000)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '3px',
                          minHeight: '64px',
                          transition: 'all 150ms ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ItemIcon size={14} color={item.iconColor} />
                          <span style={{ fontSize: '11.5px', fontWeight: 700 }}>{item.label}</span>
                        </div>
                        <span style={{ fontSize: '10px', color: isSelected ? 'inherit' : 'var(--color-text-muted, #8E8E93)' }}>{item.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Cuerpo */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--color-text, #000000)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  3. Textura y Cuerpo en Boca
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {[
                    { key: 'thin', label: 'Aguado / Hueco', desc: 'Falta solubilidad', icon: Droplet, iconColor: '#06B6D4' },
                    { key: 'balanced', label: 'Sedoso / Balanceado', desc: 'Densidad ideal', icon: Sparkles, iconColor: '#10B981' },
                    { key: 'astringent', label: 'Áspero / Astringente', desc: 'Seco al paladar', icon: Scale, iconColor: '#D97706' }
                  ].map(item => {
                    const isSelected = feedback.body === item.key;
                    const ItemIcon = item.icon;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setFeedback(prev => ({ ...prev, body: item.key }))}
                        style={{
                          padding: '12px 6px',
                          borderRadius: '10px',
                          border: isSelected
                            ? (item.key === 'balanced' ? '2px solid var(--barista-accent-mint, #10B981)' : '2px solid var(--barista-accent-honey, #D97706)')
                            : '1px solid var(--border-color, rgba(60, 60, 67, 0.12))',
                          backgroundColor: isSelected
                            ? (item.key === 'balanced' ? 'var(--barista-accent-mint-bg, #D1FAE5)' : 'var(--barista-accent-honey-bg, #FEF3C7)')
                            : 'var(--barista-bg-subtle, rgba(118, 118, 128, 0.06))',
                          color: isSelected
                            ? (item.key === 'balanced' ? 'var(--barista-accent-mint-text, #065F46)' : 'var(--barista-accent-honey-text, #92400E)')
                            : 'var(--color-text, #000000)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '3px',
                          minHeight: '64px',
                          transition: 'all 150ms ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ItemIcon size={14} color={item.iconColor} />
                          <span style={{ fontSize: '11.5px', fontWeight: 700 }}>{item.label}</span>
                        </div>
                        <span style={{ fontSize: '10px', color: isSelected ? 'inherit' : 'var(--color-text-muted, #8E8E93)' }}>{item.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 🎯 Real-Time Recommendation Banner */}
            <div
              style={{
                backgroundColor: 'var(--bg-card, #FFFFFF)',
                borderRadius: '16px',
                border: '1.5px solid var(--color-crimson, #BC5449)',
                padding: '18px',
                boxShadow: 'var(--card-shadow, 0 4px 20px -2px rgba(0, 0, 0, 0.05))'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-crimson, #BC5449)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} />
                  Recomendación para tu siguiente taza:
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    backgroundColor: sensoryCorrection.diagnosis === 'balanced'
                      ? 'var(--barista-accent-mint-bg, #D1FAE5)'
                      : 'var(--barista-accent-danger-bg, #FEE2E2)',
                    color: sensoryCorrection.diagnosis === 'balanced'
                      ? 'var(--barista-accent-mint-text, #065F46)'
                      : 'var(--barista-accent-danger-text, #991B1B)',
                    border: sensoryCorrection.diagnosis === 'balanced'
                      ? '1px solid var(--barista-accent-mint, #10B981)'
                      : '1px solid var(--barista-accent-danger, #EF4444)'
                  }}
                >
                  {sensoryCorrection.diagnosis === 'balanced' ? '⭐ Extracción En Punto' : (sensoryCorrection.diagnosis === 'sub-extracted' ? '⚠️ Sub-extracción' : '⚠️ Sobre-extracción')}
                </span>
              </div>

              {/* Tuning Badges Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '12px' }}>
                {/* Dial Tuning Card */}
                <div
                  style={{
                    backgroundColor: 'var(--barista-bg-subtle, rgba(118, 118, 128, 0.06))',
                    borderRadius: '10px',
                    padding: '12px',
                    border: '1px solid var(--border-color, rgba(60, 60, 67, 0.12))'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-text-muted, #8E8E93)', fontWeight: 600 }}>
                    <Sliders size={14} color="var(--color-crimson, #BC5449)" />
                    <span>Molino ({activeGrinderConfig?.name || 'Dial'})</span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-text, #000000)', marginTop: '4px', wordBreak: 'break-word' }}>
                    {sensoryCorrection.newGrindText}
                  </div>
                  <div style={{ fontSize: '11.5px', marginTop: '2px', fontWeight: 700, color: sensoryCorrection.clickDelta > 0 ? 'var(--barista-accent-mint-text, #065F46)' : (sensoryCorrection.clickDelta < 0 ? 'var(--barista-accent-honey-text, #92400E)' : 'var(--color-text-muted, #8E8E93)') }}>
                    {sensoryCorrection.clickDelta > 0
                      ? `+${sensoryCorrection.clickDelta} clics (Más gruesa)`
                      : (sensoryCorrection.clickDelta < 0
                        ? `${sensoryCorrection.clickDelta} clics (Más fina)`
                        : 'Sin variación')}
                  </div>
                </div>

                {/* Temperature Tuning Card */}
                <div
                  style={{
                    backgroundColor: 'var(--barista-bg-subtle, rgba(118, 118, 128, 0.06))',
                    borderRadius: '10px',
                    padding: '12px',
                    border: '1px solid var(--border-color, rgba(60, 60, 67, 0.12))'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-text-muted, #8E8E93)', fontWeight: 600 }}>
                    <Thermometer size={14} color="var(--color-crimson, #BC5449)" />
                    <span>Temperatura de Agua</span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-text, #000000)', marginTop: '4px' }}>
                    {sensoryCorrection.newTemp}°C
                  </div>
                  <div style={{ fontSize: '11.5px', marginTop: '2px', fontWeight: 700, color: sensoryCorrection.tempDelta > 0 ? 'var(--barista-accent-honey-text, #92400E)' : (sensoryCorrection.tempDelta < 0 ? 'var(--barista-accent-cryo, #0284C7)' : 'var(--color-text-muted, #8E8E93)') }}>
                    {sensoryCorrection.tempDelta > 0
                      ? `+${sensoryCorrection.tempDelta}°C (Mayor extracción)`
                      : (sensoryCorrection.tempDelta < 0
                        ? `${sensoryCorrection.tempDelta}°C (Menor amargor)`
                        : 'Sin variación')}
                  </div>
                </div>
              </div>

              {/* Barista Explanation Box */}
              <div
                style={{
                  backgroundColor: 'var(--barista-instr-bg, #FFFBEB)',
                  border: '1px solid var(--barista-instr-border, #FDE68A)',
                  borderRadius: '10px',
                  padding: '12px',
                  fontSize: '12.5px',
                  lineHeight: '1.45',
                  color: 'var(--barista-instr-text, #92400E)'
                }}
              >
                {sensoryCorrection.explanation}
              </div>
            </div>

            {/* Diagnostic Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={handleSaveTuned}
                disabled={isSaving || saveSuccess}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: saveSuccess ? 'var(--barista-accent-mint, #10B981)' : 'var(--color-crimson, #BC5449)',
                  color: '#FFFFFF',
                  fontSize: '15px',
                  fontWeight: 800,
                  border: 'none',
                  cursor: isSaving || saveSuccess ? 'default' : 'pointer',
                  minHeight: '50px',
                  boxShadow: '0 4px 16px rgba(188, 84, 73, 0.35)',
                  transition: 'all 200ms ease'
                }}
              >
                <Sparkles size={18} />
                <span>
                  {saveSuccess ? '✓ ¡Receta Afinada Guardada!' : (isSaving ? 'Guardando calibración...' : 'Guardar como Receta Afinada')}
                </span>
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setViewMode('timer')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--bg-card, #FFFFFF)',
                    border: '1px solid var(--border-color, rgba(60, 60, 67, 0.12))',
                    color: 'var(--color-text, #000000)',
                    fontSize: '13px',
                    fontWeight: 600,
                    minHeight: '44px',
                    cursor: 'pointer'
                  }}
                >
                  Volver al Cronómetro
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--border-color, rgba(60, 60, 67, 0.12))',
                    color: 'var(--color-text-muted, #8E8E93)',
                    fontSize: '13px',
                    fontWeight: 600,
                    minHeight: '44px',
                    cursor: 'pointer'
                  }}
                >
                  Finalizar sin Guardar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
