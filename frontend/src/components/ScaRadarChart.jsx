import React from 'react';

export default function ScaRadarChart({ 
  sweetness = 7, 
  acidity = 8, 
  body = 6, 
  aroma = 8, 
  balance = 7, 
  size = 240 
}) {
  const center = size / 2;
  const radius = (size / 2) - 35;
  const totalAxes = 5;

  const values = [
    { label: 'Dulzor', val: Math.min(Math.max(sweetness, 1), 10) },
    { label: 'Acidez', val: Math.min(Math.max(acidity, 1), 10) },
    { label: 'Cuerpo', val: Math.min(Math.max(body, 1), 10) },
    { label: 'Aroma', val: Math.min(Math.max(aroma, 1), 10) },
    { label: 'Balance', val: Math.min(Math.max(balance, 1), 10) }
  ];

  // Calculate coordinates for a point given axis index (0..4) and value (1..10)
  const getCoordinates = (index, value) => {
    const angle = (Math.PI * 2 / totalAxes) * index - Math.PI / 2;
    const r = (radius * (value / 10));
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Concentric polygon grid points (levels 2, 4, 6, 8, 10)
  const levels = [2, 4, 6, 8, 10];
  const gridPolygons = levels.map((lvl) => {
    return Array.from({ length: totalAxes }).map((_, i) => {
      const { x, y } = getCoordinates(i, lvl);
      return `${x},${y}`;
    }).join(' ');
  });

  // Target value polygon points
  const dataPoints = values.map((item, i) => {
    const { x, y } = getCoordinates(i, item.val);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '14px',
      background: 'var(--bg-card, #ECFDF5)',
      borderRadius: '20px',
      border: '1.5px solid var(--border-color, #A7F3D0)',
      boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
      margin: '14px 0'
    }}>
      <div style={{
        fontSize: '12px',
        fontWeight: '900',
        color: 'var(--color-text, #064E3B)',
        marginBottom: '6px',
        fontFamily: 'var(--font-heading)',
        letterSpacing: '0.5px',
        textTransform: 'uppercase'
      }}>
        📊 Perfil Sensorial SCA
      </div>

      <svg width={size} height={size} style={{ overflow: 'visible' }}>
        {/* Background Concentric Grid Lines */}
        {gridPolygons.map((points, idx) => (
          <polygon
            key={idx}
            points={points}
            fill="none"
            stroke="var(--border-color, #A7F3D0)"
            strokeWidth="1"
            strokeDasharray={idx === levels.length - 1 ? 'none' : '2,2'}
            opacity={0.7}
          />
        ))}

        {/* Radar Axis Lines */}
        {values.map((_, i) => {
          const { x, y } = getCoordinates(i, 10);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="var(--border-color, #A7F3D0)"
              strokeWidth="1"
            />
          );
        })}

        {/* Data Polygon Fill */}
        <polygon
          points={dataPoints}
          fill="var(--color-crimson, #059669)"
          fillOpacity="0.25"
          stroke="var(--color-crimson, #059669)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Data Vertices Dots */}
        {values.map((item, i) => {
          const { x, y } = getCoordinates(i, item.val);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="4.5"
              fill="var(--color-honey, #E9C46A)"
              stroke="var(--color-crimson, #059669)"
              strokeWidth="2"
            />
          );
        })}

        {/* Axis Labels */}
        {values.map((item, i) => {
          const { x, y } = getCoordinates(i, 11.5);
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{
                fontSize: '10px',
                fontWeight: '800',
                fill: 'var(--color-text, #064E3B)',
                fontFamily: 'var(--font-heading)'
              }}
            >
              {item.label} ({item.val})
            </text>
          );
        })}
      </svg>
    </div>
  );
}
