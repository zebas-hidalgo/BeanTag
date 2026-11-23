import React from 'react';

const baseProps = (size = 16, className = '', style = {}) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  className,
  style,
  'aria-hidden': 'true',
});

/** V60 ribbed conical dripper */
export function V60Icon({ size = 16, className = '', style }) {
  return (
    <svg {...baseProps(size, className, style)}>
      <path d="M4 5h16l-6.5 11h-3L4 5z" />
      <path d="M8.5 5l3 9" />
      <path d="M15.5 5l-3 9" />
      <path d="M7 19h10" />
      <path d="M18.5 7.5a2.5 2.5 0 0 1 0 5H16" />
    </svg>
  );
}

/** NextLevel Pulsar Mini (cylindrical brewer with valve base) */
export function PulsarIcon({ size = 16, className = '', style }) {
  return (
    <svg {...baseProps(size, className, style)}>
      <rect x="6" y="4" width="12" height="12" rx="1.5" />
      <path d="M5 7h14" />
      <path d="M9 16v3h6v-3" />
      <path d="M7 19h10" />
      <circle cx="12" cy="17.5" r="0.8" fill="currentColor" />
    </svg>
  );
}

/** AeroPress / AeroPress Go (chamber + plunger) */
export function AeroPressIcon({ size = 16, className = '', style }) {
  return (
    <svg {...baseProps(size, className, style)}>
      <path d="M8 3h8" />
      <path d="M10 3v5" />
      <path d="M14 3v5" />
      <rect x="7" y="8" width="10" height="9" rx="1" />
      <path d="M6 17h12" />
      <path d="M9 17v3h6v-3" />
    </svg>
  );
}

/** Chemex hourglass carafe with wood collar */
export function ChemexIcon({ size = 16, className = '', style }) {
  return (
    <svg {...baseProps(size, className, style)}>
      <path d="M6 4h12l-4 7 4.5 7.5a1.5 1.5 0 0 1-1.3 2.5H6.8a1.5 1.5 0 0 1-1.3-2.5L10 11 6 4z" />
      <path d="M9.5 10.5h5v2h-5z" />
    </svg>
  );
}

/** Espresso portafilter */
export function EspressoIcon({ size = 16, className = '', style }) {
  return (
    <svg {...baseProps(size, className, style)}>
      <path d="M3 8h9v4a4.5 4.5 0 0 1-9 0V8z" />
      <path d="M12 9.5h8.5a1.5 1.5 0 0 1 0 3H12" />
      <path d="M6.5 16.5v3" />
      <path d="M8.5 16.5v3" />
    </svg>
  );
}

/** French Press plunger carafe */
export function FrenchPressIcon({ size = 16, className = '', style }) {
  return (
    <svg {...baseProps(size, className, style)}>
      <path d="M12 3v9" />
      <path d="M9.5 3h5" />
      <path d="M7 12h10" />
      <rect x="7" y="6" width="10" height="14" rx="1.5" />
      <path d="M17 9h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
      <path d="M6 20h12" />
    </svg>
  );
}

/** Origami geometric dripper */
export function OrigamiIcon({ size = 16, className = '', style }) {
  return (
    <svg {...baseProps(size, className, style)}>
      <path d="M4 6l4 10h8l4-10-4 2-4-2-4 2-4-2z" />
      <path d="M8 8l2 8" />
      <path d="M16 8l-2 8" />
      <path d="M12 6v10" />
      <path d="M7 19h10" />
    </svg>
  );
}

/** Hario Switch (immersion cone + valve lever) */
export function SwitchIcon({ size = 16, className = '', style }) {
  return (
    <svg {...baseProps(size, className, style)}>
      <path d="M4 5h16l-6 10h-4L4 5z" />
      <path d="M8 15v3h8v-3" />
      <path d="M16 16.5h3.5" />
      <circle cx="20" cy="16.5" r="1" fill="currentColor" />
      <path d="M6 19h12" />
    </svg>
  );
}

/** Hand Grinder (crank + body) */
export function HandGrinderIcon({ size = 16, className = '', style }) {
  return (
    <svg {...baseProps(size, className, style)}>
      <path d="M12 3v3" />
      <path d="M12 3h6v2" />
      <rect x="8.5" y="6" width="7" height="14" rx="1.5" />
      <path d="M8.5 14h7" />
    </svg>
  );
}

/** Electric Grinder (hopper + body + chute) */
export function ElectricGrinderIcon({ size = 16, className = '', style }) {
  return (
    <svg {...baseProps(size, className, style)}>
      <path d="M7 4h10l-1.5 4h-7L7 4z" />
      <rect x="7.5" y="8" width="9" height="10" rx="1.5" />
      <path d="M10 13h4" />
      <path d="M6 20h12" />
    </svg>
  );
}

/** Precision Coffee Scale */
export function CoffeeScaleIcon({ size = 16, className = '', style }) {
  return (
    <svg {...baseProps(size, className, style)}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <rect x="6" y="8.5" width="12" height="5" rx="1" />
      <path d="M7 16.5h2" />
      <path d="M15 16.5h2" />
    </svg>
  );
}

/** Specialty Coffee Bean */
export function CoffeeBeanIcon({ size = 16, className = '', style }) {
  return (
    <svg {...baseProps(size, className, style)}>
      <ellipse cx="12" cy="12" rx="6.5" ry="9" transform="rotate(-25 12 12)" />
      <path d="M8.5 4.5c2 3.5 0 6.5 2 9.5s4 4.5 5 5.5" />
    </svg>
  );
}

/**
 * Dynamic Brew Method Icon resolver
 */
export function MethodIcon({ method, size = 16, className = '', style }) {
  const m = String(method || '').toLowerCase();
  if (m.includes('pulsar')) return <PulsarIcon size={size} className={className} style={style} />;
  if (m.includes('switch')) return <SwitchIcon size={size} className={className} style={style} />;
  if (m.includes('origami')) return <OrigamiIcon size={size} className={className} style={style} />;
  if (m.includes('aeropress')) return <AeroPressIcon size={size} className={className} style={style} />;
  if (m.includes('chemex')) return <ChemexIcon size={size} className={className} style={style} />;
  if (m.includes('espresso')) return <EspressoIcon size={size} className={className} style={style} />;
  if (m.includes('prensa') || m.includes('french')) return <FrenchPressIcon size={size} className={className} style={style} />;
  return <V60Icon size={size} className={className} style={style} />;
}
