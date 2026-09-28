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
  Sliders
} from 'lucide-react';
import {
  playCountdownBeep,
  playPhaseChime,
  playSuccessChime,
  requestScreenWakeLock,
  releaseScreenWakeLock,
  getAudioContext
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
 * Resolves or decomposes brewing stages from recipe.pours or standard default curves.
 */
function parseStages(recipe) {
  if (Array.isArray(recipe?.pours) && recipe.pours.length > 0) {
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

      const stepWater = parseFloat(p.water_g || p.water) || 0;
      const totalWater = p.total_water_g !== undefined
        ? parseFloat(p.total_water_g)
        : (runningWater + stepWater);
      runningWater = totalWater;

      // Extract valve configuration
      let valve = p.valve;
      if (!valve) {
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

  // Derive default stages (Bloom, Pulso 1, Pulso 2, Caída) from brew_time and water_total_g
  const dose = parseFloat(recipe?.dose_in_g) || 15;
  const ratioNum = parseFloat(String(recipe?.ratio || '').replace('1:', '')) || 15;
  const totalWater = parseFloat(recipe?.water_total_g) || Math.round(dose * ratioNum) || 250;
  const totalBrewSec = parseTimeToSeconds(recipe?.brew_time) || 180;

  const bloomSec = Math.min(45, Math.max(30, Math.round(totalBrewSec * 0.25)));
  const bloomWater = Math.round(dose * 3) || Math.round(totalWater * 0.2);
  const remainingWater = Math.max(0, totalWater - bloomWater);
  const pour1Water = Math.round(remainingWater * 0.5);
  const pour2Water = remainingWater - pour1Water;

  const pour1Sec = Math.round(totalBrewSec * 0.35);
  const pour2Sec = Math.round(totalBrewSec * 0.25);
  const finalSec = Math.max(15, totalBrewSec - (bloomSec + pour1Sec + pour2Sec));

  const isPulsar = String(recipe?.method || '').toLowerCase().includes('pulsar');

  return [
    {
      step: 1,
      label: 'Bloom & Pre-infusión',
      description: 'Saturación homogénea del lecho para desgasificar CO2 atrapado.',
      water_g: bloomWater,
      total_water_g: bloomWater,
      startSec: 0,
      endSec: bloomSec,
      duration: bloomSec,
      valve: isPulsar ? 'closed' : undefined
    },
    {
      step: 2,
      label: '1º Vertido (Extracción)',
      description: 'Vertido continuo en espirales concéntricas para extraer notas dulces y acidez viva.',
      water_g: pour1Water,
      total_water_g: bloomWater + pour1Water,
      startSec: bloomSec,
      endSec: bloomSec + pour1Sec,
      duration: pour1Sec,
      valve: isPulsar ? 'half' : undefined
    },
    {
      step: 3,
      label: '2º Vertido (Desarrollo)',
      description: 'Vertido centrado para equilibrar la intensidad y redondear la textura.',
      water_g: pour2Water,
      total_water_g: totalWater,
      startSec: bloomSec + pour1Sec,
      endSec: bloomSec + pour1Sec + pour2Sec,
      duration: pour2Sec,
      valve: isPulsar ? 'open' : undefined
    },
    {
      step: 4,
      label: 'Caída Final & Drenaje',
      description: 'Dejar drenar la columna de agua hasta formar un lecho de café completamente plano.',
      water_g: 0,
      total_water_g: totalWater,
      startSec: bloomSec + pour1Sec + pour2Sec,
      endSec: totalBrewSec,
      duration: finalSec,
      valve: isPulsar ? 'open' : undefined
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
    if (!isActive) return;

    startTimestampRef.current = Date.now();
    baseElapsedRef.current = elapsedSeconds;

    const interval = setInterval(() => {
      const now = Date.now();
      const delta = (now - startTimestampRef.current) / 1000;
      const currentElapsed = baseElapsedRef.current + delta;

      if (currentElapsed >= totalBrewDuration) {
        setElapsedSeconds(totalBrewDuration);
        setIsActive(false);
        if (!isMuted) playSuccessChime();
        setViewMode('diagnostic');
        clearInterval(interval);
        return;
      }

      setElapsedSeconds(currentElapsed);
    }, 250);

    return () => clearInterval(interval);
  }, [isActive, totalBrewDuration, isMuted]);

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

  // 5. Audio: Stage Transition Chime
  useEffect(() => {
    if (!isActive) {
      prevStageIndexRef.current = currentStageIndex;
      return;
    }

    if (currentStageIndex > prevStageIndexRef.current) {
      if (!isMuted) {
        playPhaseChime();
      }
      lastBeepSecRef.current = null;
    }
    prevStageIndexRef.current = currentStageIndex;
  }, [currentStageIndex, isActive, isMuted]);

  // Handler: Start / Resume / Pause
  const handleTogglePlay = useCallback(() => {
    getAudioContext(); // Prime Web Audio context on user gesture
    if (isActive) {
      setIsActive(false);
    } else {
      setIsActive(true);
    }
  }, [isActive]);

  // Handler: Skip forward to next stage
  const handleNextStage = useCallback(() => {
    if (currentStageIndex < stages.length - 1) {
      const nextStage = stages[currentStageIndex + 1];
      setElapsedSeconds(nextStage.startSec);
      baseElapsedRef.current = nextStage.startSec;
      startTimestampRef.current = Date.now();
      lastBeepSecRef.current = null;
      if (!isMuted) playPhaseChime();
    } else {
      setIsActive(false);
      if (!isMuted) playSuccessChime();
      setViewMode('diagnostic');
    }
  }, [currentStageIndex, stages, isMuted]);

  // Handler: Terminate extraction immediately
  const handleFinishExtraction = useCallback(() => {
    setIsActive(false);
    if (!isMuted) playSuccessChime();
    setViewMode('diagnostic');
  }, [isMuted]);

  // Handler: Reset Timer
  const handleResetTimer = useCallback(() => {
    setIsActive(false);
    setElapsedSeconds(0);
    baseElapsedRef.current = 0;
    startTimestampRef.current = null;
    lastBeepSecRef.current = null;
    prevStageIndexRef.current = 0;
  }, []);

  // Handler: Safe Close
  const handleCloseModal = useCallback(() => {
    if (isActive) {
      if (typeof window !== 'undefined' && window.confirm('¿Deseas salir del asistente de extracción? El tiempo en curso se perderá.')) {
        setIsActive(false);
        onClose();
      }
    } else {
      onClose();
    }
  }, [isActive, onClose]);

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
        backgroundColor: '#090D16',
        color: '#FFFFFF',
        zIndex: 11000,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        fontFamily: 'var(--font-body, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)'
      }}
    >
      {/* 🧭 Top Bar / Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 20
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#D97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '14px',
              color: '#FFFFFF',
              boxShadow: '0 0 12px rgba(217, 119, 6, 0.4)'
            }}
          >
            ☕
          </div>
          <div style={{ minWidth: 0 }}>
            <h2
              style={{
                margin: 0,
                fontSize: '15px',
                fontWeight: 700,
                color: '#F8FAFC',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {recipe?.method || 'V60 (Filtrado)'}
            </h2>
            <div
              style={{
                fontSize: '12px',
                color: '#94A3B8',
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
          {/* Mute Toggle */}
          <button
            type="button"
            onClick={() => setIsMuted(prev => !prev)}
            aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
            title={isMuted ? 'Activar alertas sonoras' : 'Silenciar alertas'}
            style={{
              background: isMuted ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.08)',
              border: isMuted ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.12)',
              color: isMuted ? '#F87171' : '#E2E8F0',
              borderRadius: '8px',
              padding: '8px 10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 600,
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
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#94A3B8',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
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
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          position: 'relative'
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${globalProgress}%`,
            backgroundColor: '#D97706',
            boxShadow: '0 0 10px rgba(217, 119, 6, 0.7)',
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
            {/* Giant Monospace Timer */}
            <div style={{ textAlign: 'center', margin: '8px 0 16px' }}>
              <div
                className="font-mono text-7xl md:text-8xl font-black text-white tracking-tight"
                style={{
                  fontFamily: 'var(--font-mono, "SF Mono", "JetBrains Mono", Menlo, monospace)',
                  fontSize: 'clamp(4.2rem, 16vw, 6.5rem)',
                  fontWeight: 900,
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                  textShadow: '0 0 40px rgba(255, 255, 255, 0.15)'
                }}
              >
                {formatTime(elapsedSeconds)}
              </div>
              <div
                style={{
                  fontSize: '13px',
                  color: '#94A3B8',
                  marginTop: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Clock size={14} />
                <span>Meta Total: {formatTime(totalBrewDuration)}</span>
              </div>
            </div>

            {/* Active Stage Card */}
            <div
              style={{
                width: '100%',
                backgroundColor: 'rgba(30, 41, 59, 0.7)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                padding: '20px',
                boxSizing: 'border-box',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
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
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#D97706',
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
                      className="bg-red-500/20 text-red-400 border border-red-500/40"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        fontSize: '11.5px',
                        fontWeight: 800,
                        letterSpacing: '0.04em'
                      }}
                    >
                      <Lock size={14} />
                      <span>🔒 VÁLVULA CERRADA (100%)</span>
                    </div>
                  )}
                  {currentStage.valve === 'half' && (
                    <div
                      className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 animate-pulse"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        fontSize: '11.5px',
                        fontWeight: 800,
                        letterSpacing: '0.04em'
                      }}
                    >
                      <Zap size={14} />
                      <span>⚡ VÁLVULA AL 45-50% DE FLUJO</span>
                    </div>
                  )}
                  {currentStage.valve === 'open' && (
                    <div
                      className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        fontSize: '11.5px',
                        fontWeight: 800,
                        letterSpacing: '0.04em'
                      }}
                    >
                      <Unlock size={14} />
                      <span>🔓 VÁLVULA 100% ABIERTA</span>
                    </div>
                  )}
                </div>
              )}

              {/* Stage Description */}
              {currentStage?.description && (
                <p
                  style={{
                    fontSize: '13px',
                    color: '#CBD5E1',
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
                <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                  Objetivo de Agua
                </div>
                <div
                  style={{
                    fontSize: '26px',
                    fontWeight: 800,
                    color: '#FFFFFF',
                    fontFamily: 'var(--font-mono, monospace)'
                  }}
                >
                  Verter hasta {currentStage.total_water_g}g{' '}
                  <span style={{ fontSize: '18px', color: '#D97706', fontWeight: 700 }}>
                    (+{currentStage.water_g}g)
                  </span>
                </div>
                {suggestedFlowRate ? (
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#38BDF8',
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
                        background: 'rgba(56, 189, 248, 0.15)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        padding: '1px 7px',
                        borderRadius: '4px'
                      }}
                    >
                      ~{suggestedFlowRate} ml/s
                    </span>
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic', marginTop: '2px' }}>
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
                  <span style={{ color: '#94A3B8' }}>Paso {currentStageIndex + 1}/{stages.length}</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      color: stageRemainingSec <= 3 && isActive ? '#EF4444' : '#F8FAFC',
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
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${stageProgress}%`,
                      backgroundColor: stageRemainingSec <= 3 && isActive ? '#EF4444' : '#38BDF8',
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
                      backgroundColor: isCurrent ? 'rgba(217, 119, 6, 0.18)' : (isPast ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.04)'),
                      border: isCurrent ? '1px solid #D97706' : (isPast ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)'),
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      transition: 'all 200ms ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: isCurrent ? '#F59E0B' : (isPast ? '#34D399' : '#64748B') }}>
                        #{idx + 1}
                      </span>
                      {isPast && <CheckCircle2 size={12} color="#34D399" />}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: isCurrent ? '#FFFFFF' : '#CBD5E1',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {stg.label}
                    </div>
                    <div style={{ fontSize: '10px', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)' }}>
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
                    padding: '16px 20px',
                    borderRadius: '12px',
                    backgroundColor: isActive ? '#EF4444' : '#D97706',
                    color: '#FFFFFF',
                    fontSize: '16px',
                    fontWeight: 800,
                    letterSpacing: '0.02em',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: isActive ? '0 0 20px rgba(239, 68, 68, 0.4)' : '0 0 20px rgba(217, 119, 6, 0.4)',
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
                    padding: '16px 14px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.16)',
                    color: '#F8FAFC',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
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
                    borderRadius: '10px',
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: elapsedSeconds === 0 ? 'rgba(255, 255, 255, 0.25)' : '#94A3B8',
                    fontSize: '13px',
                    fontWeight: 600,
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
                    borderRadius: '10px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    color: '#34D399',
                    fontSize: '13px',
                    fontWeight: 700,
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
                  backgroundColor: 'rgba(217, 119, 6, 0.15)',
                  border: '1px solid rgba(217, 119, 6, 0.3)',
                  color: '#F59E0B',
                  fontSize: '12px',
                  fontWeight: 700,
                  marginBottom: '6px'
                }}
              >
                <Sparkles size={14} />
                <span>Extracción Finalizada</span>
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '2px 0 6px', color: '#FFFFFF' }}>
                ☕ Diagnóstico Barista & Calibración Fina
              </h2>
              <div style={{ fontSize: '13px', color: '#94A3B8' }}>
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
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    fontSize: '12px',
                    color: '#E2E8F0',
                    fontFamily: 'var(--font-mono, monospace)'
                  }}
                >
                  ⏱️ Tiempo Medido: <strong>{formatTime(elapsedSeconds)}</strong>
                </span>
                <span
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    fontSize: '12px',
                    color: '#E2E8F0',
                    fontFamily: 'var(--font-mono, monospace)'
                  }}
                >
                  💧 Agua: <strong>{stages[stages.length - 1]?.total_water_g || recipe?.water_total_g || 250}g</strong>
                </span>
                <span
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    fontSize: '12px',
                    color: '#E2E8F0',
                    fontFamily: 'var(--font-mono, monospace)'
                  }}
                >
                  ⚖️ Dosis: <strong>{recipe?.dose_in_g || 15}g</strong>
                </span>
              </div>
            </div>

            {/* 3-Tap Sensory Evaluation Form */}
            <div
              style={{
                backgroundColor: 'rgba(30, 41, 59, 0.7)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              {/* 1. Sabor */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#CBD5E1', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  1. Sabor Dominante en Taza
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {[
                    { key: 'sour', label: '🍋 Agrio / Punzante', desc: 'Sub-extraído' },
                    { key: 'balanced', label: '✨ Dulce / Balanceado', desc: 'Punto Dulce' },
                    { key: 'bitter', label: '☕ Amargo / Seco', desc: 'Sobre-extraído' }
                  ].map(item => {
                    const isSelected = feedback.taste === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setFeedback(prev => ({ ...prev, taste: item.key }))}
                        style={{
                          padding: '10px 6px',
                          borderRadius: '10px',
                          border: isSelected
                            ? (item.key === 'balanced' ? '2px solid #10B981' : '2px solid #F59E0B')
                            : '1px solid rgba(255, 255, 255, 0.1)',
                          backgroundColor: isSelected
                            ? (item.key === 'balanced' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)')
                            : 'rgba(255, 255, 255, 0.04)',
                          color: isSelected ? '#FFFFFF' : '#94A3B8',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '2px',
                          transition: 'all 150ms ease'
                        }}
                      >
                        <span style={{ fontSize: '12px', fontWeight: 700 }}>{item.label}</span>
                        <span style={{ fontSize: '10px', color: isSelected ? '#F8FAFC' : '#64748B' }}>{item.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Caudal */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#CBD5E1', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  2. Caudal y Tiempo de Drenaje
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {[
                    { key: 'fast', label: '⏩ Drenó muy rápido', desc: '< Tiempo meta' },
                    { key: 'on_time', label: '🎯 A tiempo (±15s)', desc: 'Tiempo previsto' },
                    { key: 'slow', label: '🛑 Lento o atascado', desc: '> +30s meta' }
                  ].map(item => {
                    const isSelected = feedback.flow === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setFeedback(prev => ({ ...prev, flow: item.key }))}
                        style={{
                          padding: '10px 6px',
                          borderRadius: '10px',
                          border: isSelected
                            ? (item.key === 'on_time' ? '2px solid #10B981' : '2px solid #F59E0B')
                            : '1px solid rgba(255, 255, 255, 0.1)',
                          backgroundColor: isSelected
                            ? (item.key === 'on_time' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)')
                            : 'rgba(255, 255, 255, 0.04)',
                          color: isSelected ? '#FFFFFF' : '#94A3B8',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '2px',
                          transition: 'all 150ms ease'
                        }}
                      >
                        <span style={{ fontSize: '12px', fontWeight: 700 }}>{item.label}</span>
                        <span style={{ fontSize: '10px', color: isSelected ? '#F8FAFC' : '#64748B' }}>{item.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Cuerpo */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#CBD5E1', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  3. Textura y Cuerpo en Boca
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {[
                    { key: 'thin', label: '💧 Aguado / Hueco', desc: 'Falta solubilidad' },
                    { key: 'balanced', label: '🍯 Sedoso / Balanceado', desc: 'Densidad ideal' },
                    { key: 'astringent', label: '🍂 Áspero / Astringente', desc: 'Seco al paladar' }
                  ].map(item => {
                    const isSelected = feedback.body === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setFeedback(prev => ({ ...prev, body: item.key }))}
                        style={{
                          padding: '10px 6px',
                          borderRadius: '10px',
                          border: isSelected
                            ? (item.key === 'balanced' ? '2px solid #10B981' : '2px solid #F59E0B')
                            : '1px solid rgba(255, 255, 255, 0.1)',
                          backgroundColor: isSelected
                            ? (item.key === 'balanced' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)')
                            : 'rgba(255, 255, 255, 0.04)',
                          color: isSelected ? '#FFFFFF' : '#94A3B8',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '2px',
                          transition: 'all 150ms ease'
                        }}
                      >
                        <span style={{ fontSize: '12px', fontWeight: 700 }}>{item.label}</span>
                        <span style={{ fontSize: '10px', color: isSelected ? '#F8FAFC' : '#64748B' }}>{item.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 🎯 Real-Time Recommendation Banner */}
            <div
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                borderRadius: '16px',
                border: '1px solid rgba(217, 119, 6, 0.4)',
                padding: '18px',
                boxShadow: '0 0 30px rgba(217, 119, 6, 0.15)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                      ? 'rgba(16, 185, 129, 0.2)'
                      : (sensoryCorrection.diagnosis === 'sub-extracted' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)'),
                    color: sensoryCorrection.diagnosis === 'balanced'
                      ? '#34D399'
                      : (sensoryCorrection.diagnosis === 'sub-extracted' ? '#FBBF24' : '#F87171')
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
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '10px',
                    padding: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>
                    <Sliders size={14} color="#D97706" />
                    <span>Molino ({activeGrinderConfig?.name || 'Dial'})</span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF', marginTop: '4px', wordBreak: 'break-word' }}>
                    {sensoryCorrection.newGrindText}
                  </div>
                  <div style={{ fontSize: '11.5px', marginTop: '2px', fontWeight: 700, color: sensoryCorrection.clickDelta > 0 ? '#34D399' : (sensoryCorrection.clickDelta < 0 ? '#FBBF24' : '#94A3B8') }}>
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
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '10px',
                    padding: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>
                    <Thermometer size={14} color="#38BDF8" />
                    <span>Temperatura de Agua</span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF', marginTop: '4px' }}>
                    {sensoryCorrection.newTemp}°C
                  </div>
                  <div style={{ fontSize: '11.5px', marginTop: '2px', fontWeight: 700, color: sensoryCorrection.tempDelta > 0 ? '#FBBF24' : (sensoryCorrection.tempDelta < 0 ? '#38BDF8' : '#94A3B8') }}>
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
                  backgroundColor: 'rgba(217, 119, 6, 0.08)',
                  border: '1px solid rgba(217, 119, 6, 0.25)',
                  borderRadius: '10px',
                  padding: '12px',
                  fontSize: '12.5px',
                  lineHeight: '1.45',
                  color: '#FDE68A'
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
                  backgroundColor: saveSuccess ? '#10B981' : '#D97706',
                  color: '#FFFFFF',
                  fontSize: '15px',
                  fontWeight: 800,
                  border: 'none',
                  cursor: isSaving || saveSuccess ? 'default' : 'pointer',
                  boxShadow: '0 0 20px rgba(217, 119, 6, 0.4)',
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
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#CBD5E1',
                    fontSize: '13px',
                    fontWeight: 600,
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
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#94A3B8',
                    fontSize: '13px',
                    fontWeight: 600,
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
