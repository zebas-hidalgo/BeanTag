import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { confirmDialog } from '../utils/confirmDialog';
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

import { parseTimeToSeconds, formatTime, parseStages } from '../utils/brewStages.js';
import { useTimemoreScale } from '../utils/timemoreScale.js';
import BrewDiagnostic from './brew/BrewDiagnostic';

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
      return typeof localStorage !== 'undefined' ? localStorage.getItem('beantag-voice-enabled') === 'true' : false; // KISS: voz apagada salvo que el usuario la active
    } catch (_) {
      return false;
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

  // Timemore Dot BLE Smart Scale
  const scale = useTimemoreScale();
  const [autoStartOnPour, setAutoStartOnPour] = useState(true);
  const [syncStepsWithWeight, setSyncStepsWithWeight] = useState(true);
  const autoStartedPourRef = useRef(false);
  const taredReadyRef = useRef(false);

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

  // Suggested flow rate & live pour pacing for active stage
  const { suggestedFlowRate, liveTargetWaterG, isPouringActiveWindow } = useMemo(() => {
    const prevTotal = currentStageIndex > 0 ? (stages[currentStageIndex - 1]?.total_water_g || 0) : 0;
    if (!currentStage || currentStage.water_g <= 0) {
      return {
        suggestedFlowRate: null,
        liveTargetWaterG: currentStage?.total_water_g || prevTotal,
        isPouringActiveWindow: false
      };
    }
    const pourDuration = Math.max(10, Math.min(currentStage.duration, Math.round(currentStage.duration * 0.55)));
    const stageElapsed = Math.max(0, elapsedSeconds - (currentStage.startSec || 0));
    const ratio = Math.max(0, Math.min(1, stageElapsed / pourDuration));
    const currentG = Math.round(prevTotal + currentStage.water_g * ratio);
    return {
      suggestedFlowRate: (currentStage.water_g / pourDuration).toFixed(1),
      liveTargetWaterG: currentG,
      isPouringActiveWindow: stageElapsed < pourDuration
    };
  }, [currentStage, currentStageIndex, stages, elapsedSeconds]);

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
      autoStartedPourRef.current = false;
      taredReadyRef.current = false;
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
      if (scale.connected) scale.stopScaleTimer();
    } else {
      setIsActive(true);
      if (scale.connected) scale.startScaleTimer();
      if (elapsedSeconds < 1 && !isMuted && isVoiceEnabled && stages[0]) {
        speakBaristaGuidance(getStageSpeechText(0, stages[0]));
      }
    }
  }, [isActive, elapsedSeconds, isMuted, isVoiceEnabled, stages, getStageSpeechText, scale]);

  // Auto-Start Timer when Timemore Dot detects water pour (>= 0.8g after being near 0g)
  useEffect(() => {
    if (!isOpen || viewMode !== 'timer' || !scale.connected || !autoStartOnPour || isActive || elapsedSeconds > 0) {
      return;
    }
    if (Math.abs(scale.weightG) <= 0.4) {
      taredReadyRef.current = true;
      return;
    }
    if (taredReadyRef.current && !autoStartedPourRef.current && scale.weightG >= 0.8) {
      autoStartedPourRef.current = true;
      handleTogglePlay();
    }
  }, [isOpen, viewMode, scale.connected, scale.weightG, autoStartOnPour, isActive, elapsedSeconds, handleTogglePlay]);

  // Sync active step & timer when live weight crosses into the next pouring stage (+3g hysteresis)
  useEffect(() => {
    if (!isOpen || viewMode !== 'timer' || !scale.connected || !syncStepsWithWeight || !isActive) {
      return;
    }
    const nextIdx = currentStageIndex + 1;
    if (nextIdx >= stages.length) return;
    const nextStage = stages[nextIdx];
    if (!currentStage || currentStage.total_water_g <= 0 || !nextStage || nextStage.water_g <= 0) {
      return;
    }
    if (scale.weightG >= currentStage.total_water_g + 3.0) {
      setElapsedSeconds(nextStage.startSec);
      baseElapsedRef.current = nextStage.startSec;
      startTimestampRef.current = Date.now();
      lastBeepSecRef.current = null;
      prevStageIndexRef.current = nextIdx;
      if (!isMuted) {
        playPhaseChime();
        if (isVoiceEnabled) {
          speakBaristaGuidance(getStageSpeechText(nextIdx, nextStage));
        }
      }
    }
  }, [
    isOpen,
    viewMode,
    scale.connected,
    scale.weightG,
    syncStepsWithWeight,
    isActive,
    currentStageIndex,
    currentStage,
    stages,
    isMuted,
    isVoiceEnabled,
    getStageSpeechText
  ]);

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
    if (scale.connected) scale.stopScaleTimer();
    if (!isMuted) {
      playSuccessChime();
      if (isVoiceEnabled) {
        speakBaristaGuidance('Extracción completada. Evaluando resultados en bitácora.');
      }
    }
    setViewMode('diagnostic');
  }, [isMuted, isVoiceEnabled, scale]);

  // Handler: Reset Timer
  const handleResetTimer = useCallback(() => {
    setIsActive(false);
    cancelSpeech();
    setElapsedSeconds(0);
    baseElapsedRef.current = 0;
    startTimestampRef.current = null;
    lastBeepSecRef.current = null;
    prevStageIndexRef.current = 0;
    autoStartedPourRef.current = false;
    taredReadyRef.current = Math.abs(scale.weightG) <= 0.4;
    if (scale.connected) scale.resetScaleTimer();
  }, [scale]);

  // Handler: Safe Close
  const handleCloseModal = useCallback(async () => {
    cancelSpeech();
    if (isActive) {
      if (await confirmDialog('¿Deseas salir del asistente de extracción? El tiempo en curso se perderá.', { okText: 'Salir' })) {
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

  // Handler: Save the brew to the log. Called with the feedback chosen in one tap.
  const handleSaveTuned = async (fbOverride = null) => {
    const fb = fbOverride || feedback;
    const corr = fbOverride
      ? computeSensoryCorrection(activeGrinderId, currentDialText, currentWaterTemp, fb)
      : sensoryCorrection;
    if (typeof onSaveTunedRecipe !== 'function') {
      onClose();
      return null;
    }

    const TASTE_WORD = { sour: 'Ácido', balanced: 'Bien', bitter: 'Amargo' };
    const FLOW_WORD = { fast: 'rápido', on_time: 'a tiempo', slow: 'lento' };
    const BODY_WORD = { thin: 'aguado', balanced: 'sedoso', astringent: 'áspero' };
    const EXTRACTION = { sour: 'Sub', balanced: 'En Punto', bitter: 'Sobre' };

    try {
      setIsSaving(true);
      const tunedData = {
        recipeId: recipe?.id,
        batchId: batch?.id,
        method: recipe?.method || 'Filtro',
        dose_in_g: recipe?.dose_in_g || 15,
        water_total_g: recipe?.water_total_g || stages[stages.length - 1]?.total_water_g || 250,
        ratio: recipe?.ratio || '1:15',
        temperature: corr.newTemp,
        brew_time: formatTime(elapsedSeconds),
        grind: corr.newGrindText,
        rating: corr.rating,
        sensory_extraction: EXTRACTION[fb.taste] || 'En Punto',
        notes: `Sabor ${TASTE_WORD[fb.taste] || fb.taste}, caudal ${FLOW_WORD[fb.flow] || fb.flow}, cuerpo ${BODY_WORD[fb.body] || fb.body}. ${corr.explanation || ''}`.trim(),
        feedback: fb,
        correction: corr,
        actualBrewTimeSec: Math.round(elapsedSeconds)
      };

      const result = await onSaveTunedRecipe(tunedData);
      setSaveSuccess(true);
      return { ...(result || { success: true }), correction: corr };
    } catch (err) {
      console.error('Error al guardar la extracción:', err);
      return null;
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
      role="dialog"
      aria-modal="true"
      aria-label="Guía de extracción"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--bg-canvas)',
        color: 'var(--color-text)',
        zIndex: 'var(--z-modal)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        fontFamily: 'var(--font-body)'
      }}
    >
      {/* 🧭 Top Bar / Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'calc(14px + env(safe-area-inset-top, 0px)) 18px 14px 18px',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-header)',
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
              borderRadius: 'var(--r-control)',
              backgroundColor: 'var(--color-crimson)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--on-accent)',
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
                color: 'var(--color-text)',
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
                color: 'var(--color-text-muted)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {batch?.origin || batch?.name || 'Receta'} • {recipe?.dose_in_g || 15}g café • {recipe?.temperature || 93}°C
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
              background: isVoiceEnabled ? 'var(--barista-accent-mint-bg)' : 'var(--barista-bg-subtle)',
              border: isVoiceEnabled ? '1px solid var(--barista-accent-mint-text)' : '1px solid var(--border-color)',
              color: isVoiceEnabled ? 'var(--barista-accent-mint-text)' : 'var(--color-text-muted)',
              borderRadius: 'var(--r-control)',
              padding: '8px 10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 700,
              minHeight: '36px',
              transition: 'var(--transition-ui)'
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
              background: isMuted ? 'var(--barista-accent-danger-bg)' : 'var(--barista-bg-subtle)',
              border: isMuted ? '1px solid var(--barista-accent-danger)' : '1px solid var(--border-color)',
              color: isMuted ? 'var(--barista-accent-danger-text)' : 'var(--color-text)',
              borderRadius: 'var(--r-control)',
              padding: '8px 10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 600,
              minHeight: '36px',
              transition: 'var(--transition-ui)'
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
              background: 'var(--barista-bg-subtle)',
              border: '1px solid var(--border-color)',
              color: 'var(--color-text-muted)',
              borderRadius: 'var(--r-control)',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '36px',
              minHeight: '36px',
              transition: 'var(--transition-ui)'
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
          backgroundColor: 'var(--segmented-bg)',
          position: 'relative'
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${globalProgress}%`,
            backgroundColor: 'var(--color-crimson)',
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
            {/* Minimalist Hero: Time & Weight Stacked Cockpit */}
            <div
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '14px',
                margin: '10px 0 18px'
              }}
            >
              {/* Time Block */}
              <div style={{ width: '100%', textAlign: 'center' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    marginBottom: '2px',
                    padding: '0 4px'
                  }}
                >
                  <span>Tiempo</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>Total {formatTime(totalBrewDuration)}</span>
                </div>
                <div
                  className="barista-timer font-mono text-7xl md:text-8xl font-black tracking-tight"
                  style={{
                    fontFamily: 'var(--font-metric)',
                    fontSize: scale.connected ? 'clamp(4.0rem, 17vw, 5.8rem)' : 'clamp(4.6rem, 18vw, 6.8rem)',
                    fontWeight: '700',
                    letterSpacing: '-0.04em',
                    lineHeight: 0.96,
                    fontVariantNumeric: 'tabular-nums',
                    color: 'var(--text-primary)'
                  }}
                >
                  {formatTime(elapsedSeconds)}
                </div>
              </div>

              {/* Weight Block (prominent, full-width when scale connected) */}
              {scale.connected && (() => {
                const targetWater = currentStage?.total_water_g || 0;
                const reached = targetWater > 0 && scale.weightG >= targetWater - 0.5;
                const totalRecipeWater = stages[stages.length - 1]?.total_water_g || targetWater || 1;
                const overallWaterPct = Math.min(100, Math.max(0, (scale.weightG / Math.max(1, totalRecipeWater)) * 100));
                return (
                  <div
                    style={{
                      width: '100%',
                      paddingTop: '14px',
                      borderTop: '1px solid var(--border-color)',
                      textAlign: 'center'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '10px',
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'var(--text-muted)',
                        marginBottom: '2px',
                        padding: '0 4px'
                      }}
                    >
                      <span>Peso en balanza</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>
                        {targetWater > 0 ? `Meta ${targetWater}g` : 'Libre'} · {scale.flowRate.toFixed(1)} ml/s
                      </span>
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-metric)',
                        fontSize: 'clamp(4.2rem, 18vw, 6.0rem)',
                        fontWeight: '700',
                        letterSpacing: '-0.04em',
                        lineHeight: 0.96,
                        fontVariantNumeric: 'tabular-nums',
                        color: reached ? 'var(--barista-accent-mint-text)' : 'var(--color-crimson)'
                      }}
                    >
                      {scale.weightG.toFixed(1)}
                      <span style={{ fontSize: '0.35em', fontWeight: 700, marginLeft: '4px', opacity: 0.85 }}>g</span>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: '3px',
                        borderRadius: '999px',
                        backgroundColor: 'var(--segmented-bg)',
                        overflow: 'hidden',
                        marginTop: '10px'
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${overallWaterPct}%`,
                          backgroundColor: reached ? 'var(--barista-accent-mint)' : 'var(--color-crimson)',
                          transition: 'width 150ms linear, background-color 200ms ease'
                        }}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Slim Scale Toolbar */}
            <div
              style={{
                width: '100%',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                padding: '7px 12px',
                marginBottom: '12px',
                borderRadius: 'var(--r-pill)',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                boxSizing: 'border-box'
              }}
            >
              {scale.connected ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: 'var(--barista-accent-mint-text)' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--barista-accent-mint)' }} />
                    <span>{scale.deviceName || 'Timemore'}</span>
                    {scale.battery !== null && (
                      <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.75 }}>{scale.battery}%</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                    {!isActive && elapsedSeconds === 0 && (
                      <button
                        type="button"
                        onClick={() => setAutoStartOnPour((v) => !v)}
                        title="Inicia el cronómetro automáticamente al detectar que viertes agua (> 0.8 g)"
                        style={{
                          padding: '3px 9px',
                          borderRadius: 'var(--r-pill)',
                          border: autoStartOnPour ? '1px solid var(--color-crimson)' : '1px solid var(--border-color)',
                          background: autoStartOnPour ? 'var(--accent-bg)' : 'transparent',
                          color: autoStartOnPour ? 'var(--color-crimson)' : 'var(--color-text-muted)',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        ⚡ Auto {autoStartOnPour ? 'ON' : 'OFF'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSyncStepsWithWeight((v) => !v)}
                      title="Sincroniza automáticamente el paso activo y el tiempo cuando el peso entra en la siguiente fase"
                      style={{
                        padding: '3px 9px',
                        borderRadius: 'var(--r-pill)',
                        border: syncStepsWithWeight ? '1px solid var(--barista-accent-mint-text)' : '1px solid var(--border-color)',
                        background: syncStepsWithWeight ? 'var(--barista-accent-mint-bg)' : 'transparent',
                        color: syncStepsWithWeight ? 'var(--barista-accent-mint-text)' : 'var(--color-text-muted)',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      ⚖️ Sincro {syncStepsWithWeight ? 'ON' : 'OFF'}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await scale.tare();
                        taredReadyRef.current = true;
                        autoStartedPourRef.current = false;
                      }}
                      style={{
                        padding: '3px 10px',
                        borderRadius: 'var(--r-pill)',
                        border: '1px solid var(--border-strong)',
                        background: 'var(--bg-subtle)',
                        color: 'var(--color-text)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Tarar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    <Scale size={13} />
                    <span>Balanza Bluetooth</span>
                  </div>
                  <button
                    type="button"
                    disabled={scale.connecting}
                    onClick={() => scale.connect().catch(() => {})}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--r-pill)',
                      border: 'none',
                      background: 'var(--color-crimson)',
                      color: 'var(--on-accent)',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {scale.connecting ? 'Conectando…' : 'Conectar'}
                  </button>
                </>
              )}
            </div>

            {/* Live Voice Coach Guidance Banner (only shown when voice is active) */}
            {isVoiceEnabled && (
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: 'var(--barista-accent-mint-bg)',
                  border: '1px solid var(--barista-accent-mint-text)',
                  borderRadius: 'var(--r-control)',
                  padding: '8px 12px',
                  marginBottom: '10px',
                  boxSizing: 'border-box'
                }}
              >
                <Mic size={14} color="var(--barista-accent-mint-text)" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.3 }}>
                  {getStageSpeechText(currentStageIndex, currentStage)}
                </div>
              </div>
            )}

            {/* Compact Active Step Card */}
            <div
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-card)',
                borderRadius: 'var(--r-tile)',
                border: '1px solid var(--border-color)',
                padding: '12px 14px',
                boxSizing: 'border-box',
                marginBottom: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              {/* Top row: Phase + Valve + Remaining Seconds */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-crimson)' }}>
                    Paso {currentStageIndex + 1}/{stages.length} · {currentStage.title || currentStage.label}
                  </span>
                  {currentStage?.valve && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        padding: '2px 7px',
                        borderRadius: 'var(--r-pill)',
                        fontSize: '10px',
                        fontWeight: 700,
                        backgroundColor: currentStage.valve === 'closed'
                          ? 'var(--valve-closed-bg)'
                          : (currentStage.valve === 'half' ? 'var(--valve-half-bg)' : 'var(--valve-open-bg)'),
                        color: currentStage.valve === 'closed'
                          ? 'var(--valve-closed)'
                          : (currentStage.valve === 'half' ? 'var(--valve-half)' : 'var(--valve-open)')
                      }}
                    >
                      {currentStage.valve === 'closed' ? <Lock size={10} /> : (currentStage.valve === 'half' ? <Zap size={10} /> : <Unlock size={10} />)}
                      <span>{currentStage.valve === 'closed' ? 'Cerrada' : (currentStage.valve === 'half' ? '50%' : 'Abierta')}</span>
                    </span>
                  )}
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: stageRemainingSec <= 3 && isActive ? 'var(--barista-accent-danger)' : 'var(--color-text-muted)'
                  }}
                >
                  -{stageRemainingSec}s
                </span>
              </div>

              {/* Middle row: Target water + Live scale delta */}
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>
                  Hasta {currentStage.total_water_g}g{' '}
                  <span style={{ fontSize: '13px', color: 'var(--color-crimson)' }}>(+{currentStage.water_g}g)</span>
                </div>
                {scale.connected && currentStage?.total_water_g > 0 ? (() => {
                  const remainingG = Math.max(0, currentStage.total_water_g - scale.weightG);
                  const reached = remainingG <= 1.0;
                  return (
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: reached ? 'var(--barista-accent-mint-text)' : 'var(--color-text-muted)'
                      }}
                    >
                      {reached ? '✓ Listo' : `Faltan ${remainingG.toFixed(1)}g`}
                    </span>
                  );
                })() : (
                  suggestedFlowRate && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      ~{suggestedFlowRate} ml/s
                    </span>
                  )
                )}
              </div>

              {currentStage?.description && (
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: 1.35 }}>
                  {currentStage.description}
                </div>
              )}

              {/* Slim Progress Bars (Time + Water when scale connected) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {scale.connected && currentStage?.total_water_g > 0 && (() => {
                  const prevWater = currentStageIndex > 0 ? (stages[currentStageIndex - 1]?.total_water_g || 0) : 0;
                  const span = Math.max(1, currentStage.total_water_g - prevWater);
                  const waterPct = Math.min(100, Math.max(0, ((scale.weightG - prevWater) / span) * 100));
                  const reached = currentStage.total_water_g - scale.weightG <= 1.0;
                  return (
                    <div style={{ width: '100%', height: '4px', borderRadius: 'var(--r-xs)', backgroundColor: 'var(--segmented-bg)', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${waterPct}%`,
                          backgroundColor: reached ? 'var(--barista-accent-mint)' : 'var(--color-crimson)',
                          transition: 'width 150ms linear, background-color 200ms ease'
                        }}
                      />
                    </div>
                  );
                })()}
                <div style={{ width: '100%', height: '4px', borderRadius: 'var(--r-xs)', backgroundColor: 'var(--segmented-bg)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${stageProgress}%`,
                      backgroundColor: stageRemainingSec <= 3 && isActive ? 'var(--barista-accent-danger)' : 'var(--text-muted)',
                      opacity: 0.7,
                      transition: 'width 250ms linear, background-color 200ms ease'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Compact Stages Stepper Pills */}
            <div
              style={{
                width: '100%',
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                paddingBottom: '8px',
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
                      flex: '0 0 auto',
                      padding: '5px 10px',
                      borderRadius: 'var(--r-pill)',
                      backgroundColor: isCurrent ? 'var(--barista-instr-bg)' : (isPast ? 'var(--barista-accent-mint-bg)' : 'var(--bg-card)'),
                      border: isCurrent ? '1.5px solid var(--color-crimson)' : (isPast ? '1px solid var(--barista-accent-mint)' : '1px solid var(--border-color)'),
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: isCurrent ? 'var(--color-crimson)' : (isPast ? 'var(--barista-accent-mint-text)' : 'var(--color-text-muted)'),
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <span>{idx + 1}. {stg.label}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.85 }}>+{stg.water_g}g</span>
                    {isPast && <CheckCircle2 size={11} color="var(--barista-accent-mint)" />}
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
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: isActive ? 'var(--valve-closed)' : 'var(--accent-terracotta)',
                    color: 'var(--on-accent)',
                    fontSize: '16px',
                    fontWeight: '600',
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '0.02em',
                    border: 'none',
                    cursor: 'pointer',
                    minHeight: '56px',
                    height: '56px',
                    boxShadow: isActive ? '0 4px 16px rgba(239, 68, 68, 0.35)' : '0 4px 16px rgba(188, 84, 73, 0.35)',
                    transition: 'var(--transition-ui)'
                  }}
                >
                  {isActive ? (
                    <>
                      <Pause size={22} />
                      <span>Pausar</span>
                    </>
                  ) : (
                    <>
                      <Play size={22} fill="currentColor" />
                      <span>{elapsedSeconds > 0 ? 'Reanudar' : 'Empezar'}</span>
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
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1.5px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontWeight: '600',
                    fontFamily: 'var(--font-display)',
                    cursor: 'pointer',
                    minHeight: '56px',
                    height: '56px',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'var(--transition-ui)'
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
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    color: elapsedSeconds === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
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
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--barista-accent-mint-bg)',
                    border: '1.5px solid var(--valve-open)',
                    color: 'var(--valve-open)',
                    fontSize: '13px',
                    fontWeight: '600',
                    minHeight: '48px',
                    height: '48px',
                    cursor: 'pointer',
                    transition: 'var(--transition-ui)'
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>Terminar</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <BrewDiagnostic
            elapsedSeconds={elapsedSeconds}
            recipe={recipe}
            batch={batch}
            waterG={stages[stages.length - 1]?.total_water_g || recipe?.water_total_g || 250}
            feedback={feedback}
            setFeedback={setFeedback}
            onSave={handleSaveTuned}
            isSaving={isSaving}
            onBackToTimer={() => setViewMode('timer')}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}
