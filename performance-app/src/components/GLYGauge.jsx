import { cn } from '@/lib/utils';
import { getGLYColor, formatGLY } from '@/lib/utils';

export function GLYGauge({ value = 0, size = 'md', label = 'GLY' }) {
  const radius = size === 'sm' ? 36 : size === 'lg' ? 60 : 48;
  const strokeWidth = size === 'sm' ? 5 : size === 'lg' ? 8 : 6;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.min(100, Math.max(0, value));
  const offset = circumference - (clampedValue / 100) * circumference;
  const color = getGLYColor(value);
  const viewBoxSize = (radius + strokeWidth) * 2;
  const center = radius + strokeWidth;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: viewBoxSize, height: viewBoxSize }}>
        <svg width={viewBoxSize} height={viewBoxSize} className="-rotate-90">
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(51, 65, 85, 0.5)"
            strokeWidth={strokeWidth}
          />
          {/* Value arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
            style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn(
              'font-bold tabular-nums',
              size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : 'text-lg'
            )}
            style={{ color }}
          >
            {formatGLY(value)}
          </span>
        </div>
      </div>
      <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</span>
    </div>
  );
}
