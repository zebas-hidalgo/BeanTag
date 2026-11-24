import React, { createContext, useContext } from 'react';
import { useTimemoreScale } from '../utils/timemoreScale';

const TimemoreScaleContext = createContext(null);

export function TimemoreScaleProvider({ children }) {
  const scale = useTimemoreScale();
  return (
    <TimemoreScaleContext.Provider value={scale}>
      {children}
    </TimemoreScaleContext.Provider>
  );
}

export function useSharedTimemoreScale() {
  const ctx = useContext(TimemoreScaleContext);
  if (!ctx) {
    throw new Error('useSharedTimemoreScale must be used within TimemoreScaleProvider');
  }
  return ctx;
}
