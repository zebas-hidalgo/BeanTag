/**
 * Sensory Correction Engine for BeanTag V3.0 (Barista Mode)
 * Deterministic micro-adjustments for grind dials and water temperature
 * based on post-extraction sensory feedback (Taste, Flow, Body).
 */

import { getGrinderConfig } from './grinders.js';

/**
 * Evaluates sensory feedback dimensions and produces a diagnosis and rating score.
 * 
 * @param {Object} feedback
 * @param {'sour'|'balanced'|'bitter'} [feedback.taste]
 * @param {'fast'|'on_time'|'slow'} [feedback.flow]
 * @param {'thin'|'balanced'|'astringent'} [feedback.body]
 * @returns {{ diagnosis: 'sub-extracted'|'over-extracted'|'balanced', rating: number, score: number, defects: number }}
 */
export function evaluateDiagnosis(feedback = {}) {
  let score = 0;
  let defects = 0;

  if (feedback.taste === 'sour') {
    score -= 2;
    defects++;
  } else if (feedback.taste === 'bitter') {
    score += 2;
    defects++;
  }

  if (feedback.flow === 'fast') {
    score -= 1;
    defects++;
  } else if (feedback.flow === 'slow') {
    score += 1;
    defects++;
  }

  if (feedback.body === 'thin') {
    score -= 1;
    defects++;
  } else if (feedback.body === 'astringent') {
    score += 1;
    defects++;
  }

  let diagnosis = 'balanced';
  if (score < 0) {
    diagnosis = 'sub-extracted';
  } else if (score > 0) {
    diagnosis = 'over-extracted';
  }

  let rating = 5;
  if (diagnosis !== 'balanced') {
    rating = defects >= 2 ? 3 : 4;
  }

  return { diagnosis, rating, score, defects };
}

/**
 * Computes deterministic physical corrections for the next brew.
 *
 * @param {string} grinderId - Active grinder ID (e.g. 'femobook', 'jmax', 'k_ultra', etc.)
 * @param {string|number} currentDialText - Current dial setting string or value
 * @param {number|string} currentTemp - Current brew water temperature in °C
 * @param {Object} feedback - Sensory feedback object
 * @returns {{
 *   newGrindText: string,
 *   newTemp: number,
 *   clickDelta: number,
 *   tempDelta: number,
 *   diagnosis: 'sub-extracted'|'over-extracted'|'balanced',
 *   rating: number,
 *   explanation: string
 * }}
 */
export function computeSensoryCorrection(grinderId, currentDialText, currentTemp, feedback = {}) {
  const { diagnosis, rating } = evaluateDiagnosis(feedback);

  // Parse temperature safely
  const rawTemp = typeof currentTemp === 'number'
    ? currentTemp
    : parseInt(String(currentTemp || '').replace(/[^\d]/g, ''), 10);
  const temp = Number.isFinite(rawTemp) && rawTemp > 0 ? rawTemp : 93;

  let tempDelta = 0;
  let explanation = '';

  if (diagnosis === 'sub-extracted') {
    tempDelta = 1;
    explanation = 'El agua atravesó el lecho sin disolver suficientes azúcares y componentes dulces internos. Cerramos la molienda e incrementamos temperatura (+1°C) para mayor solubilidad y cuerpo.';
  } else if (diagnosis === 'over-extracted') {
    tempDelta = -1;
    explanation = 'El lecho acumuló excesiva resistencia hidráulica o los microfinos restringieron el flujo, extrayendo taninos y notas amargas pesadas. Abrimos la molienda y reducimos temperatura (-1°C) para restaurar fluidez y dulzor limpio.';
  } else {
    tempDelta = 0;
    explanation = '¡Extracción impecable! Esta receta ha alcanzado el equilibrio óptimo de dulzor, acidez y claridad para este lote.';
  }

  const newTemp = temp + tempDelta;

  // Resolve grinder config
  const grinderConfig = getGrinderConfig(grinderId);
  const gId = grinderConfig ? grinderConfig.id : 'jmax';
  const dialStr = String(currentDialText != null ? currentDialText : '').trim();

  let clickDelta = 0;
  let newGrindText = dialStr;

  switch (gId) {
    case 'jmax': {
      // Format: rot.num.click (e.g. "2.4.2" or "J-Max: 2.4.2")
      const clean = dialStr.replace(/^.*?J-Max:?\s*/i, '');
      const jmaxMatch = clean.match(/(\d+)\.(\d+)\.(\d+)/);
      let rot = 2, num = 4, click = 0;
      if (jmaxMatch) {
        rot = parseInt(jmaxMatch[1], 10);
        num = parseInt(jmaxMatch[2], 10);
        click = parseInt(jmaxMatch[3], 10);
      }
      const totalClicks = (rot * 90) + (num * 10) + click;
      let delta = 0;
      if (diagnosis === 'sub-extracted') {
        delta = -10;
      } else if (diagnosis === 'over-extracted') {
        delta = 10;
      }
      clickDelta = delta;
      const newTotalClicks = Math.max(0, totalClicks + delta);
      const newRot = Math.floor(newTotalClicks / 90);
      const rem = newTotalClicks % 90;
      const newNum = Math.floor(rem / 10);
      const newClick = rem % 10;
      const formatted = `${newRot}.${newNum}.${newClick}`;
      newGrindText = dialStr.includes('J-Max:') ? `J-Max: ${formatted}` : formatted;
      break;
    }

    case 'k_ultra': {
      // Format: 8.0 or "K-Ultra: 8.0 (80 clics)"
      const clean = dialStr.replace(/^.*?(?:1Zpresso\s*)?K-Ultra:?\s*/i, '');
      const kMatch = clean.match(/(\d+(?:\.\d+)?)/);
      const currentVal = kMatch ? parseFloat(kMatch[1]) : 8.0;
      let deltaClicks = 0;
      let dialDelta = 0;
      if (diagnosis === 'sub-extracted') {
        deltaClicks = -2;
        dialDelta = -0.2;
      } else if (diagnosis === 'over-extracted') {
        deltaClicks = 2;
        dialDelta = 0.2;
      }
      clickDelta = deltaClicks;
      const newVal = parseFloat(Math.max(2.0, Math.min(13.0, currentVal + dialDelta)).toFixed(1));
      if (dialStr.includes('clic')) {
        const prefix = dialStr.includes('1Zpresso K-Ultra:') ? '1Zpresso K-Ultra: ' : (dialStr.includes('K-Ultra:') ? 'K-Ultra: ' : '');
        newGrindText = `${prefix}${newVal.toFixed(1)} (${Math.round(newVal * 10)} clics)`;
      } else if (dialStr.includes('1Zpresso K-Ultra:')) {
        newGrindText = `1Zpresso K-Ultra: ${newVal.toFixed(1)}`;
      } else if (dialStr.includes('K-Ultra:')) {
        newGrindText = `K-Ultra: ${newVal.toFixed(1)}`;
      } else {
        newGrindText = `${newVal.toFixed(1)}`;
      }
      break;
    }

    case 'ode_gen2': {
      // Format: 4.2 or "Ode Gen 2: Ajuste 4.2" or "Fellow Ode Gen 2: Ajuste 4.2"
      const clean = dialStr.replace(/^.*?(?:(?:Fellow\s*)?Ode(?:\s*Gen\s*2)?:?\s*(?:Ajuste\s*)?|Ajuste\s*)/i, '');
      const odeMatch = clean.match(/(\d+(?:\.\d+)?)/);
      const currentVal = odeMatch ? parseFloat(odeMatch[1]) : 4.2;
      let deltaClicks = 0;
      let dialDelta = 0;
      if (diagnosis === 'sub-extracted') {
        deltaClicks = -2;
        dialDelta = -0.2;
      } else if (diagnosis === 'over-extracted') {
        deltaClicks = 2;
        dialDelta = 0.2;
      }
      clickDelta = deltaClicks;
      const newVal = parseFloat(Math.max(1.0, Math.min(11.0, currentVal + dialDelta)).toFixed(1));
      if (dialStr.includes('Fellow Ode Gen 2: Ajuste')) {
        newGrindText = `Fellow Ode Gen 2: Ajuste ${newVal.toFixed(1)}`;
      } else if (dialStr.includes('Fellow Ode Gen 2:')) {
        newGrindText = `Fellow Ode Gen 2: ${newVal.toFixed(1)}`;
      } else if (dialStr.includes('Ode Gen 2: Ajuste')) {
        newGrindText = `Ode Gen 2: Ajuste ${newVal.toFixed(1)}`;
      } else if (dialStr.includes('Ode Gen 2:')) {
        newGrindText = `Ode Gen 2: ${newVal.toFixed(1)}`;
      } else if (dialStr.includes('Ajuste')) {
        newGrindText = `Ajuste ${newVal.toFixed(1)}`;
      } else {
        newGrindText = `${newVal.toFixed(1)}`;
      }
      break;
    }

    case 'comandante': {
      // Format: "23 clics" or "Comandante: 23 clics" or "23"
      const clean = dialStr.replace(/^.*?Comandante(?:\s*C40)?:?\s*/i, '');
      const comMatch = clean.match(/(\d+)/);
      const currentClicks = comMatch ? parseInt(comMatch[1], 10) : 23;
      let deltaClicks = 0;
      if (diagnosis === 'sub-extracted') {
        deltaClicks = -2;
      } else if (diagnosis === 'over-extracted') {
        deltaClicks = 2;
      }
      clickDelta = deltaClicks;
      const newClicks = Math.max(6, Math.min(45, currentClicks + deltaClicks));
      if (dialStr.includes('Comandante C40:')) {
        newGrindText = `Comandante C40: ${newClicks} clics`;
      } else if (dialStr.includes('Comandante:')) {
        newGrindText = `Comandante: ${newClicks} clics`;
      } else if (dialStr.includes('clic')) {
        newGrindText = `${newClicks} clics`;
      } else {
        newGrindText = `${newClicks}`;
      }
      break;
    }

    case 'femobook': {
      // Format: "68 clics (~1.7 Rot.)" or "Femobook A2: 68 clics (~1.7 Rot.)"
      const clean = dialStr.replace(/^.*?Femobook(?:\s*A2)?:?\s*/i, '');
      const femoMatch = clean.match(/(\d+)\s*clic/i) || clean.match(/(\d+)/);
      const currentClicks = femoMatch ? parseInt(femoMatch[1], 10) : 68;
      let deltaClicks = 0;
      if (diagnosis === 'sub-extracted') {
        deltaClicks = -2;
      } else if (diagnosis === 'over-extracted') {
        deltaClicks = 2;
      }
      clickDelta = deltaClicks;
      const newClicks = Math.max(4, Math.min(120, currentClicks + deltaClicks));
      const rotStr = (Math.round((newClicks / 40) * 10) / 10).toFixed(1);
      const prefix = dialStr.includes('Femobook A2:') ? 'Femobook A2: ' : (dialStr.includes('Femobook:') ? 'Femobook: ' : '');

      if (dialStr.includes('Rot') || dialStr.includes('~')) {
        newGrindText = `${prefix}${newClicks} clics (~${rotStr} Rot.)`;
      } else if (dialStr.includes('clic')) {
        newGrindText = `${prefix}${newClicks} clics`;
      } else {
        newGrindText = `${newClicks}`;
      }
      break;
    }

    case 'kingrinder': {
      // Format: "92 clics" or "Kingrinder K6: 92 clics (~1.32)"
      const clean = dialStr.replace(/^.*?Kingrinder(?:\s*K6)?:?\s*/i, '');
      const kingMatch = clean.match(/(\d+)\s*clic/i) || clean.match(/(\d+)/);
      const currentClicks = kingMatch ? parseInt(kingMatch[1], 10) : 92;
      let deltaClicks = 0;
      if (diagnosis === 'sub-extracted') {
        deltaClicks = -2;
      } else if (diagnosis === 'over-extracted') {
        deltaClicks = 2;
      }
      clickDelta = deltaClicks;
      const newClicks = Math.max(12, Math.min(180, currentClicks + deltaClicks));
      const prefix = dialStr.includes('Kingrinder K6:') ? 'Kingrinder K6: ' : (dialStr.includes('Kingrinder:') ? 'Kingrinder: ' : '');

      if (dialStr.includes('~')) {
        const rot = Math.floor(newClicks / 60);
        const sub = newClicks % 60;
        newGrindText = `${prefix}${newClicks} clics (~${rot}.${sub})`;
      } else if (dialStr.includes('clic')) {
        newGrindText = `${prefix}${newClicks} clics`;
      } else {
        newGrindText = `${newClicks}`;
      }
      break;
    }

    case 'timemore': {
      // Format: "17 clics" or "Timemore: 17 clics"
      const clean = dialStr.replace(/^.*?Timemore(?:\s*C[23])?:?\s*/i, '');
      const timeMatch = clean.match(/(\d+)/);
      const currentClicks = timeMatch ? parseInt(timeMatch[1], 10) : 17;
      let deltaClicks = 0;
      if (diagnosis === 'sub-extracted') {
        deltaClicks = -2;
      } else if (diagnosis === 'over-extracted') {
        deltaClicks = 2;
      }
      clickDelta = deltaClicks;
      const newClicks = Math.max(6, Math.min(36, currentClicks + deltaClicks));
      const prefix = dialStr.includes('Timemore C2:') ? 'Timemore C2: ' : (dialStr.includes('Timemore C3:') ? 'Timemore C3: ' : (dialStr.includes('Timemore:') ? 'Timemore: ' : ''));
      if (prefix) {
        newGrindText = `${prefix}${newClicks} clics`;
      } else if (dialStr.includes('clic')) {
        newGrindText = `${newClicks} clics`;
      } else {
        newGrindText = `${newClicks}`;
      }
      break;
    }

    case 'baratza': {
      // Format: "15" or "Baratza: Ajuste 15"
      const clean = dialStr.replace(/^.*?(?:Baratza(?:\s*(?:Encore|ESP))?:?\s*(?:Ajuste\s*)?|Ajuste\s*)/i, '');
      const barMatch = clean.match(/(\d+)/);
      const currentStep = barMatch ? parseInt(barMatch[1], 10) : 15;
      let deltaStep = 0;
      if (diagnosis === 'sub-extracted') {
        deltaStep = -1;
      } else if (diagnosis === 'over-extracted') {
        deltaStep = 1;
      }
      clickDelta = deltaStep;
      const newStep = Math.max(1, Math.min(40, currentStep + deltaStep));
      if (dialStr.includes('Baratza: Ajuste')) {
        newGrindText = `Baratza: Ajuste ${newStep}`;
      } else if (dialStr.includes('Baratza Encore: Ajuste')) {
        newGrindText = `Baratza Encore: Ajuste ${newStep}`;
      } else if (dialStr.includes('Baratza:')) {
        newGrindText = `Baratza: ${newStep}`;
      } else if (dialStr.includes('Ajuste')) {
        newGrindText = `Ajuste ${newStep}`;
      } else {
        newGrindText = `${newStep}`;
      }
      break;
    }

    default: {
      newGrindText = dialStr;
      clickDelta = 0;
      break;
    }
  }

  return {
    newGrindText,
    newTemp,
    clickDelta,
    tempDelta,
    diagnosis,
    rating,
    explanation
  };
}
