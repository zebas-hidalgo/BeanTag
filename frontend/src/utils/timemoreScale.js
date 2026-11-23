import { useState, useEffect, useCallback } from 'react';

/**
 * Timemore BLE Smart Scale Engine (Timemore Black Mirror Dot TES017, Basic 2 TES006, and Black Mirror Nano/Standard)
 *
 * Supports two direct BLE transports (zero bridge):
 *  A. Native iOS / Android App via Capacitor (@capacitor-community/bluetooth-le -> CoreBluetooth on iPhone)
 *  B. Web Bluetooth API (navigator.bluetooth on Chrome / Edge / Bluefy)
 *
 * Protocols supported:
 * 1. Timemore Dot / Basic 2 Protocol:
 *    - SERVICE_UUID: 0xfff0 ('0000fff0-0000-1000-8000-00805f9b34fb')
 *    - CHAR_UUID (Notify): 0xfff1 ('0000fff1-0000-1000-8000-00805f9b34fb')
 *    - CMD_UUID  (Write):  0xfff2 ('0000fff2-0000-1000-8000-00805f9b34fb')
 *    - Frame: [0xA5, 0x5A, opcode, cmdId, lenMsb, lenLsb, ...data, crcMsb, crcLsb] (CRC-16/IBM)
 * 2. Timemore Standard / Nano Protocol:
 *    - SERVICE_UUID: 0x181d ('0000181d-0000-1000-8000-00805f9b34fb')
 *    - CHAR_UUID (Notify): 0x2a9d ('00002a9d-0000-1000-8000-00805f9b34fb')
 *    - CMD_UUID  (Write):  '553f4e49-bf21-4468-9c6c-0e4fb5b17697'
 */

export const DOT_SERVICE_UUID = '0000fff0-0000-1000-8000-00805f9b34fb';
export const DOT_NOTIFY_UUID = '0000fff1-0000-1000-8000-00805f9b34fb';
export const DOT_CMD_UUID = '0000fff2-0000-1000-8000-00805f9b34fb';

export const LEGACY_SERVICE_UUID = '0000181d-0000-1000-8000-00805f9b34fb';
export const LEGACY_NOTIFY_UUID = '00002a9d-0000-1000-8000-00805f9b34fb';
export const LEGACY_CMD_UUID = '553f4e49-bf21-4468-9c6c-0e4fb5b17697';

export function isCapacitorNative() {
  return Boolean(
    typeof window !== 'undefined' &&
    window.Capacitor &&
    typeof window.Capacitor.isNativePlatform === 'function' &&
    window.Capacitor.isNativePlatform()
  );
}

/**
 * Compute CRC-16/IBM (initial 0xFFFF, polynomial 0xA001 reflected) used by Timemore Dot & Basic 2
 */
export function crc16Ibm(data) {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x0001) !== 0) {
        crc = (crc >> 1) ^ 0xa001;
      } else {
        crc >>= 1;
      }
    }
  }
  return crc & 0xffff;
}

/**
 * Build a binary command frame for Timemore Dot / Basic 2
 * @param {number} opcode - typically 0x03
 * @param {number} cmdId  - 0x0d (Tare), 0x02 (Timer), 0x06 (Unit), 0x08 (Mode)
 * @param {Uint8Array|number[]} data
 * @returns {Uint8Array}
 */
export function buildTimemoreDotCommand(opcode, cmdId, data = []) {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const len = bytes.length;
  const payload = new Uint8Array(6 + len);
  payload[0] = 0xa5;
  payload[1] = 0x5a;
  payload[2] = opcode & 0xff;
  payload[3] = cmdId & 0xff;
  payload[4] = (len >> 8) & 0xff;
  payload[5] = len & 0xff;
  if (len > 0) {
    payload.set(bytes, 6);
  }
  const crc = crc16Ibm(payload);
  const frame = new Uint8Array(8 + len);
  frame.set(payload, 0);
  frame[6 + len] = (crc >> 8) & 0xff;
  frame[7 + len] = crc & 0xff;
  return frame;
}

/**
 * Parse incoming binary notification from Timemore Dot / Basic 2 (0xFFF1)
 * Supports concatenated frames in a single BLE MTU packet.
 * @param {Uint8Array} rawBytes
 * @returns {{ weightG?: number, battery?: number }}
 */
export function parseTimemoreDotPacket(rawBytes) {
  const result = {};
  if (!rawBytes || rawBytes.length < 8) return result;

  let offset = 0;
  while (offset <= rawBytes.length - 8) {
    if (rawBytes[offset] !== 0xa5 || rawBytes[offset + 1] !== 0x5a) {
      offset++;
      continue;
    }

    const opcode = rawBytes[offset + 2];
    const cmdId = rawBytes[offset + 3];
    const dataLen = (rawBytes[offset + 4] << 8) | rawBytes[offset + 5];
    const availableData = rawBytes.length - (offset + 6);
    if (dataLen > availableData) {
      break;
    }

    const data = rawBytes.slice(offset + 6, offset + 6 + dataLen);

    if (opcode === 0x01 || opcode === 0x02) {
      if (cmdId === 0x01 && data.length >= 4) {
        // Signed 32-bit big-endian weight in tenths of a gram (0.1g)
        const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
        const rawWeight = view.getInt32(0, false);
        result.weightG = Math.round(rawWeight) / 10;
      } else if (cmdId === 0x05 && data.length >= 2) {
        result.battery = data[1];
      }
    }

    offset += Math.max(8, 6 + dataLen + 2);
  }

  return result;
}

/**
 * Parse incoming binary notification from Legacy Timemore Black Mirror (0x2A9D)
 * @param {Uint8Array} rawBytes
 * @returns {{ weightG?: number }}
 */
export function parseTimemoreLegacyPacket(rawBytes) {
  if (!rawBytes || rawBytes.length < 3) return {};
  const slice = rawBytes.slice(1, 3);
  const view = new DataView(slice.buffer, slice.byteOffset, slice.byteLength);
  const rawWeight = view.getInt16(0, true);
  return { weightG: Math.round(rawWeight) / 10 };
}

// --- Singleton BLE Scale State Manager ---
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const scaleStore = {
  connected: false,
  connecting: false,
  deviceName: '',
  protocol: 'dot', // 'dot' | 'legacy'
  transport: 'web', // 'capacitor' | 'web'
  weightG: 0.0,
  flowRate: 0.0,
  battery: null,
  error: null,
  device: null,
  nativeDeviceId: null,
  nativeBleClient: null,
  notifyChar: null,
  cmdChar: null,
  weightHistory: [], // [{ t, w }] for rolling flow rate (g/s)
  listeners: new Set()
};

function notifyListeners() {
  const snapshot = {
    connected: scaleStore.connected,
    connecting: scaleStore.connecting,
    deviceName: scaleStore.deviceName,
    protocol: scaleStore.protocol,
    transport: scaleStore.transport,
    weightG: scaleStore.weightG,
    flowRate: scaleStore.flowRate,
    battery: scaleStore.battery,
    error: scaleStore.error
  };
  scaleStore.listeners.forEach((fn) => {
    try { fn(snapshot); } catch (e) {}
  });
}

function updateWeightSample(newWeightG) {
  const now = Date.now();
  const cleanWeight = Number.isFinite(newWeightG) ? Math.round(newWeightG * 10) / 10 : 0;
  scaleStore.weightG = cleanWeight;

  // Rolling 900ms window to compute smooth flow rate (g/s)
  scaleStore.weightHistory.push({ t: now, w: cleanWeight });
  const cutoff = now - 900;
  while (scaleStore.weightHistory.length > 2 && scaleStore.weightHistory[0].t < cutoff) {
    scaleStore.weightHistory.shift();
  }

  if (scaleStore.weightHistory.length >= 2) {
    const oldest = scaleStore.weightHistory[0];
    const newest = scaleStore.weightHistory[scaleStore.weightHistory.length - 1];
    const dtSec = (newest.t - oldest.t) / 1000;
    if (dtSec >= 0.15) {
      const dw = newest.w - oldest.w;
      const rawFlow = dw / dtSec;
      const nextFlow = rawFlow > 0.15 ? Math.min(40, Math.round(rawFlow * 10) / 10) : 0.0;
      scaleStore.flowRate = nextFlow;
    }
  } else {
    scaleStore.flowRate = 0.0;
  }
}

function processIncomingDataView(dataView) {
  if (!dataView) return;
  const bytes = new Uint8Array(dataView.buffer, dataView.byteOffset, dataView.byteLength);

  if (scaleStore.protocol === 'dot') {
    const parsed = parseTimemoreDotPacket(bytes);
    if (parsed.weightG !== undefined) {
      updateWeightSample(parsed.weightG);
    }
    if (parsed.battery !== undefined) {
      scaleStore.battery = parsed.battery;
    }
  } else {
    const parsed = parseTimemoreLegacyPacket(bytes);
    if (parsed.weightG !== undefined) {
      updateWeightSample(parsed.weightG);
    }
  }
  notifyListeners();
}

function handleCharacteristicValueChanged(event) {
  processIncomingDataView(event?.target?.value);
}

function handleGattDisconnected() {
  scaleStore.connected = false;
  scaleStore.connecting = false;
  scaleStore.notifyChar = null;
  scaleStore.cmdChar = null;
  scaleStore.nativeDeviceId = null;
  scaleStore.flowRate = 0.0;
  scaleStore.weightHistory = [];
  notifyListeners();
}

async function writeScaleCommand(bytes) {
  if (scaleStore.transport === 'capacitor' && scaleStore.nativeBleClient && scaleStore.nativeDeviceId) {
    const serviceUuid = scaleStore.protocol === 'dot' ? DOT_SERVICE_UUID : LEGACY_SERVICE_UUID;
    const cmdUuid = scaleStore.protocol === 'dot' ? DOT_CMD_UUID : LEGACY_CMD_UUID;
    const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    try {
      await scaleStore.nativeBleClient.writeWithoutResponse(scaleStore.nativeDeviceId, serviceUuid, cmdUuid, dataView);
      return true;
    } catch (e1) {
      try {
        await scaleStore.nativeBleClient.write(scaleStore.nativeDeviceId, serviceUuid, cmdUuid, dataView);
        return true;
      } catch (e2) {
        console.warn('[TimemoreBLE Native] write command failed:', e2);
        return false;
      }
    }
  }

  if (!scaleStore.cmdChar) return false;
  try {
    if (typeof scaleStore.cmdChar.writeValueWithoutResponse === 'function') {
      await scaleStore.cmdChar.writeValueWithoutResponse(bytes);
    } else {
      await scaleStore.cmdChar.writeValue(bytes);
    }
    return true;
  } catch (err) {
    try {
      await scaleStore.cmdChar.writeValue(bytes);
      return true;
    } catch (e2) {
      console.warn('[TimemoreBLE Web] write command failed:', e2);
      return false;
    }
  }
}

async function connectViaCapacitorNative() {
  const { BleClient } = await import('@capacitor-community/bluetooth-le');
  await BleClient.initialize({ androidNeverForLocation: true });

  const device = await BleClient.requestDevice({
    optionalServices: [DOT_SERVICE_UUID, LEGACY_SERVICE_UUID]
  });

  if (scaleStore.nativeDeviceId && scaleStore.nativeDeviceId !== device.deviceId) {
    try { await BleClient.disconnect(scaleStore.nativeDeviceId); } catch (e) {}
  }

  await BleClient.connect(device.deviceId, () => handleGattDisconnected());

  let protocol = 'dot';
  try {
    await BleClient.startNotifications(
      device.deviceId,
      DOT_SERVICE_UUID,
      DOT_NOTIFY_UUID,
      (value) => processIncomingDataView(value)
    );
    protocol = 'dot';
  } catch (dotErr) {
    await BleClient.startNotifications(
      device.deviceId,
      LEGACY_SERVICE_UUID,
      LEGACY_NOTIFY_UUID,
      (value) => processIncomingDataView(value)
    );
    protocol = 'legacy';
  }

  scaleStore.transport = 'capacitor';
  scaleStore.nativeBleClient = BleClient;
  scaleStore.nativeDeviceId = device.deviceId;
  scaleStore.deviceName = device.name || 'Timemore Dot';
  scaleStore.protocol = protocol;
  scaleStore.connected = true;
  scaleStore.connecting = false;
  scaleStore.error = null;
  scaleStore.weightHistory = [];
  notifyListeners();

  if (protocol === 'dot') {
    await sleep(350);
    await writeScaleCommand(buildTimemoreDotCommand(0x03, 0x06, [0x00]));
    await sleep(150);
    await writeScaleCommand(buildTimemoreDotCommand(0x03, 0x08, [0x01, 0x00]));
  }
  return true;
}

export async function connectTimemoreScale() {
  scaleStore.connecting = true;
  scaleStore.error = null;
  notifyListeners();

  try {
    // 1. Direct Native iOS / Android CoreBluetooth via Capacitor
    if (isCapacitorNative()) {
      return await connectViaCapacitorNative();
    }

    // 2. Web Bluetooth API (Desktop / Android Chrome / Bluefy)
    if (typeof navigator === 'undefined' || !navigator.bluetooth) {
      const isIOS = /iPad|iPhone|iPod/.test(navigator?.userAgent || '');
      const msg = isIOS
        ? 'En iPhone usa la App nativa BeanTag iOS (Capacitor) para conectar directo por Bluetooth con tu Timemore Dot.'
        : 'Tu navegador no soporta Web Bluetooth. Usa Chrome, Edge o la App nativa BeanTag iOS.';
      scaleStore.error = msg;
      scaleStore.connecting = false;
      notifyListeners();
      throw new Error(msg);
    }

    let device;
    try {
      device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [DOT_SERVICE_UUID] },
          { services: [0xfff0] },
          { services: [LEGACY_SERVICE_UUID] },
          { services: [0x181d] },
          { namePrefix: 'Timemore' },
          { namePrefix: 'TIMEMORE' },
          { namePrefix: 'DOT' },
          { namePrefix: 'Dot' },
          { namePrefix: 'dot' },
          { namePrefix: 'TES' }
        ],
        optionalServices: [DOT_SERVICE_UUID, LEGACY_SERVICE_UUID, 0xfff0, 0x181d]
      });
    } catch (filterErr) {
      if (filterErr && filterErr.name === 'NotFoundError') {
        throw new Error('Selección de balanza cancelada.');
      }
      device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [DOT_SERVICE_UUID, LEGACY_SERVICE_UUID, 0xfff0, 0x181d]
      });
    }

    if (scaleStore.device && scaleStore.device !== device) {
      try {
        scaleStore.device.removeEventListener('gattserverdisconnected', handleGattDisconnected);
        if (scaleStore.device.gatt?.connected) scaleStore.device.gatt.disconnect();
      } catch (e) {}
    }

    device.addEventListener('gattserverdisconnected', handleGattDisconnected);
    const server = await device.gatt.connect();

    let service = null;
    let protocol = 'dot';
    try {
      service = await server.getPrimaryService(DOT_SERVICE_UUID);
      protocol = 'dot';
    } catch (e1) {
      try {
        service = await server.getPrimaryService(0xfff0);
        protocol = 'dot';
      } catch (e2) {
        try {
          service = await server.getPrimaryService(LEGACY_SERVICE_UUID);
          protocol = 'legacy';
        } catch (e3) {
          service = await server.getPrimaryService(0x181d);
          protocol = 'legacy';
        }
      }
    }

    let notifyChar = null;
    let cmdChar = null;

    if (protocol === 'dot') {
      try {
        notifyChar = await service.getCharacteristic(DOT_NOTIFY_UUID);
      } catch (e) {
        notifyChar = await service.getCharacteristic(0xfff1);
      }
      try {
        cmdChar = await service.getCharacteristic(DOT_CMD_UUID);
      } catch (e) {
        try { cmdChar = await service.getCharacteristic(0xfff2); } catch (e2) {}
      }
    } else {
      try {
        notifyChar = await service.getCharacteristic(LEGACY_NOTIFY_UUID);
      } catch (e) {
        notifyChar = await service.getCharacteristic(0x2a9d);
      }
      try {
        cmdChar = await service.getCharacteristic(LEGACY_CMD_UUID);
      } catch (e) {}
    }

    await notifyChar.startNotifications();
    notifyChar.addEventListener('characteristicvaluechanged', handleCharacteristicValueChanged);

    scaleStore.transport = 'web';
    scaleStore.device = device;
    scaleStore.deviceName = device.name || 'Timemore Dot';
    scaleStore.protocol = protocol;
    scaleStore.notifyChar = notifyChar;
    scaleStore.cmdChar = cmdChar;
    scaleStore.connected = true;
    scaleStore.connecting = false;
    scaleStore.error = null;
    scaleStore.weightHistory = [];
    notifyListeners();

    if (protocol === 'dot' && cmdChar) {
      await sleep(350);
      await writeScaleCommand(buildTimemoreDotCommand(0x03, 0x06, [0x00]));
      await sleep(150);
      await writeScaleCommand(buildTimemoreDotCommand(0x03, 0x08, [0x01, 0x00]));
    }

    return true;
  } catch (err) {
    scaleStore.connecting = false;
    scaleStore.connected = false;
    scaleStore.error = err?.message || 'No se pudo conectar con la Timemore Dot.';
    notifyListeners();
    throw err;
  }
}

export async function disconnectTimemoreScale() {
  try {
    if (scaleStore.transport === 'capacitor' && scaleStore.nativeBleClient && scaleStore.nativeDeviceId) {
      const serviceUuid = scaleStore.protocol === 'dot' ? DOT_SERVICE_UUID : LEGACY_SERVICE_UUID;
      const notifyUuid = scaleStore.protocol === 'dot' ? DOT_NOTIFY_UUID : LEGACY_NOTIFY_UUID;
      try { await scaleStore.nativeBleClient.stopNotifications(scaleStore.nativeDeviceId, serviceUuid, notifyUuid); } catch (e) {}
      try { await scaleStore.nativeBleClient.disconnect(scaleStore.nativeDeviceId); } catch (e) {}
      return;
    }
    if (scaleStore.notifyChar) {
      scaleStore.notifyChar.removeEventListener('characteristicvaluechanged', handleCharacteristicValueChanged);
      try { await scaleStore.notifyChar.stopNotifications(); } catch (e) {}
    }
    if (scaleStore.device?.gatt?.connected) {
      scaleStore.device.gatt.disconnect();
    }
  } finally {
    handleGattDisconnected();
  }
}

export async function tareTimemoreScale() {
  scaleStore.weightG = 0.0;
  scaleStore.flowRate = 0.0;
  scaleStore.weightHistory = [];
  notifyListeners();

  if (!scaleStore.connected) return false;
  if (scaleStore.protocol === 'dot') {
    const cmd = buildTimemoreDotCommand(0x03, 0x0d, []);
    return writeScaleCommand(cmd);
  }
  return writeScaleCommand(new Uint8Array([0x00]));
}

export async function sendTimemoreTimerCommand(action) {
  if (!scaleStore.connected) return false;
  if (scaleStore.protocol === 'dot') {
    const state = action === 'start' ? 0x01 : action === 'stop' ? 0x02 : action === 'reset' ? 0x03 : 0;
    if (!state) return false;
    const cmd = buildTimemoreDotCommand(0x03, 0x02, [state]);
    return writeScaleCommand(cmd);
  }
  const byte = action === 'start' ? 0x08 : action === 'stop' ? 0x09 : action === 'reset' ? 0x0a : 0;
  if (!byte) return false;
  return writeScaleCommand(new Uint8Array([byte]));
}

/**
 * React hook to subscribe to the live Timemore Dot BLE Scale state across any component
 */
export function useTimemoreScale() {
  const [state, setState] = useState(() => ({
    connected: scaleStore.connected,
    connecting: scaleStore.connecting,
    deviceName: scaleStore.deviceName,
    protocol: scaleStore.protocol,
    transport: scaleStore.transport,
    weightG: scaleStore.weightG,
    flowRate: scaleStore.flowRate,
    battery: scaleStore.battery,
    error: scaleStore.error
  }));

  useEffect(() => {
    scaleStore.listeners.add(setState);
    return () => {
      scaleStore.listeners.delete(setState);
    };
  }, []);

  const connect = useCallback(async () => connectTimemoreScale(), []);
  const disconnect = useCallback(async () => disconnectTimemoreScale(), []);
  const tare = useCallback(async () => tareTimemoreScale(), []);
  const startScaleTimer = useCallback(async () => sendTimemoreTimerCommand('start'), []);
  const stopScaleTimer = useCallback(async () => sendTimemoreTimerCommand('stop'), []);
  const resetScaleTimer = useCallback(async () => sendTimemoreTimerCommand('reset'), []);

  const isSupported = isCapacitorNative() || (typeof navigator !== 'undefined' && Boolean(navigator.bluetooth));

  return {
    ...state,
    isSupported,
    connect,
    disconnect,
    tare,
    startScaleTimer,
    stopScaleTimer,
    resetScaleTimer
  };
}
