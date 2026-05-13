// EduTrack – ProgressRing: animated SVG circle progress
import { useState, useEffect } from 'react';

export default function ProgressRing({
  percent     = 0,
  size        = 140,
  strokeWidth = 10,
  color       = '#4F46E5',
  label       = 'Overall Progress',
  textColor   = 'white',
}) {
  const radius       = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const t = setTimeout(() => {
      setOffset(circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference);
    }, 300);
    return () => clearTimeout(t);
  }, [percent, circumference]);

  return (
    <svg width={size} height={size} aria-label={`${percent}% ${label}`}>
      {/* Background circle */}
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        strokeWidth={strokeWidth}
        stroke="rgba(255,255,255,0.2)"
        fill="none"
      />
      {/* Progress arc */}
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        strokeWidth={strokeWidth}
        stroke={color}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
      />
      {/* Center percent text */}
      <text
        x="50%" y="46%" textAnchor="middle" dominantBaseline="middle"
        fontSize={size / 4.5} fontWeight="bold" fill={textColor}
      >
        {percent}%
      </text>
      <text
        x="50%" y="65%" textAnchor="middle" dominantBaseline="middle"
        fontSize={size / 12} fill={textColor} opacity="0.8"
      >
        {label}
      </text>
    </svg>
  );
}
