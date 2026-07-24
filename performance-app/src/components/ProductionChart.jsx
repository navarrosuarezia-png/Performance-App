import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Line, ComposedChart, Area
} from 'recharts';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { BarChart3 } from 'lucide-react';
import { formatHL, formatGLY, formatNumber, getGLYColor } from '@/lib/utils';

/**
 * Gráfico de productividad hora a hora — réplica del Excel "HORA HORA L3"
 * Muestra barras de HL Real por hora + línea de HL Programados + línea de GLY%
 */
export function ProductionChart({ hourBlocks, savedLogs, line, selectedDate, selectedSku, hideHeader = false, hideTable = false }) {
  const chartData = useMemo(() => {
    let hlAccReal = 0;
    let hlAccProgrammed = 0;
    let glySum = 0;
    let glyCount = 0;

    return hourBlocks.map((block) => {
      const logKey = `${selectedDate}-${block.start}`;
      const log = savedLogs[logKey];

      const bottles = log?.bottles || 0;
      const bottleVol = selectedSku?.bottle_volume_liters || line?.bottle_volume_liters || 0;
      const realHL = bottles > 0 ? (bottles * bottleVol) / 100 : 0;
      const plannedHL = Number(line?.target_hl_per_hour || 0);
      const gly = (line?.nominal_speed_bph > 0) ? (bottles / line.nominal_speed_bph) * 100 : 0;

      hlAccReal += realHL;
      hlAccProgrammed += plannedHL;

      if (bottles > 0) {
        glySum += gly;
        glyCount += 1;
      }

      return {
        hour: block.start,
        realHL: Number(realHL.toFixed(2)),
        plannedHL: Number(plannedHL.toFixed(2)),
        hlAccReal: Number(hlAccReal.toFixed(2)),
        hlAccProgrammed: Number(hlAccProgrammed.toFixed(2)),
        gly: Number(gly.toFixed(1)),
        glyAcc: glyCount > 0 ? Number((glySum / glyCount).toFixed(1)) : 0,
        bottles,
        sku: log?.sku || '—',
        hasData: bottles > 0,
      };
    });
  }, [hourBlocks, savedLogs, line, selectedDate, selectedSku]);

  const hasAnyData = chartData.some((d) => d.hasData);

  // Tooltip personalizado con estilo glassmorphism
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="glass rounded-xl p-3 shadow-xl border border-slate-700/50 min-w-[180px]">
        <p className="text-xs font-semibold text-brand-400 mb-2">{label} hrs</p>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Botellas</span>
            <span className="font-semibold text-white">{formatNumber(data.bottles)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">HL Real</span>
            <span className="font-semibold text-emerald-400">{formatHL(data.realHL)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">HL Meta</span>
            <span className="font-semibold text-slate-300">{formatHL(data.plannedHL)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">GLY Hora</span>
            <span className="font-semibold" style={{ color: getGLYColor(data.gly) }}>
              {formatGLY(data.gly)}
            </span>
          </div>
          <hr className="border-slate-700" />
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">HL Ac. Real</span>
            <span className="font-semibold text-brand-400">{formatHL(data.hlAccReal)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">HL Ac. Prog.</span>
            <span className="font-semibold text-slate-400">{formatHL(data.hlAccProgrammed)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      {!hideHeader && (
        <CardHeader>
          <CardTitle icon={BarChart3}>Producción por Hora — HL Real vs Meta</CardTitle>
        </CardHeader>
      )}

      {!hasAnyData ? (
        <div className="h-52 flex flex-col items-center justify-center text-slate-500 gap-2">
          <BarChart3 className="w-8 h-8 opacity-30" />
          <p className="text-sm">Registra producción para ver el gráfico</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Gráfico principal: Barras de HL Real vs Línea de Meta */}
          <div className="h-56 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.4)" vertical={false} />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => v.toFixed(0)}
                />
                <Tooltip content={<CustomTooltip />} />

                {/* Línea de meta HL por hora */}
                <ReferenceLine
                  y={line.target_hl_per_hour}
                  stroke="#f59e0b"
                  strokeDasharray="6 3"
                  strokeWidth={1.5}
                  label={{
                    value: `Meta: ${line.target_hl_per_hour} HL`,
                    position: 'right',
                    fill: '#f59e0b',
                    fontSize: 9,
                  }}
                />

                {/* Barras de HL Real por hora */}
                <Bar
                  dataKey="realHL"
                  name="HL Real"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                  fill="url(#barGradient)"
                  isAnimationActive={false}
                />

                {/* Gradiente para las barras */}
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico secundario: Acumulados HL Real vs Programado */}
          <div>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">
              HL Acumulados — Real vs Programado
            </p>
            <div className="h-40 md:h-48">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.3)" vertical={false} />
                  <XAxis
                    dataKey="hour"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)}
                  />
                  <Tooltip content={<CustomTooltip />} />

                  {/* Área de HL Acumulados Programados (fondo) */}
                  <Area
                    type="monotone"
                    dataKey="hlAccProgrammed"
                    name="HL Ac. Prog."
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="6 3"
                    fill="rgba(245, 158, 11, 0.05)"
                    isAnimationActive={false}
                  />

                  {/* Línea de HL Acumulados Reales */}
                  <Area
                    type="monotone"
                    dataKey="hlAccReal"
                    name="HL Ac. Real"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fill="rgba(59, 130, 246, 0.1)"
                    dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#60a5fa', strokeWidth: 2, stroke: '#1e40af' }}
                    isAnimationActive={false}
                  />

                  <defs>
                    <linearGradient id="accRealGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabla resumen por hora (como en el Excel) */}
          {!hideTable && (
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <table className="w-full text-xs min-w-[500px]">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left py-2 px-3 text-slate-500 font-medium">Hora</th>
                    <th className="text-left py-2 px-3 text-slate-500 font-medium">SKU</th>
                    <th className="text-right py-2 px-3 text-slate-500 font-medium">Botellas</th>
                    <th className="text-right py-2 px-3 text-slate-500 font-medium">HL Real</th>
                    <th className="text-right py-2 px-3 text-slate-500 font-medium">HL Meta</th>
                    <th className="text-right py-2 px-3 text-slate-500 font-medium">GLY %</th>
                    <th className="text-right py-2 px-3 text-slate-500 font-medium">HL Ac.Real</th>
                    <th className="text-right py-2 px-3 text-slate-500 font-medium">HL Ac.Prog</th>
                    <th className="text-right py-2 px-3 text-slate-500 font-medium">GLY Ac.</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((row) => (
                    <tr
                      key={row.hour}
                      className={`border-b border-slate-800/50 transition-colors ${
                        row.hasData ? 'hover:bg-surface-2' : 'opacity-40'
                      }`}
                    >
                      <td className="py-2 px-3 font-medium text-slate-300">{row.hour}</td>
                      <td className="py-2 px-3 text-slate-400 text-xs">{row.hasData ? row.sku : '—'}</td>
                      <td className="py-2 px-3 text-right text-white font-semibold tabular-nums">
                        {row.hasData ? formatNumber(row.bottles) : '—'}
                      </td>
                      <td className="py-2 px-3 text-right text-emerald-400 font-semibold tabular-nums">
                        {row.hasData ? formatHL(row.realHL) : '—'}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-400 tabular-nums">
                        {formatHL(row.plannedHL)}
                      </td>
                      <td className="py-2 px-3 text-right font-semibold tabular-nums"
                          style={{ color: row.hasData ? getGLYColor(row.gly) : '#475569' }}>
                        {row.hasData ? formatGLY(row.gly) : '—'}
                      </td>
                      <td className="py-2 px-3 text-right text-brand-400 font-semibold tabular-nums">
                        {row.hlAccReal > 0 ? formatHL(row.hlAccReal) : '—'}
                      </td>
                      <td className="py-2 px-3 text-right text-amber-400/70 tabular-nums">
                        {formatHL(row.hlAccProgrammed)}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums"
                          style={{ color: row.glyAcc > 0 ? getGLYColor(row.glyAcc) : '#475569' }}>
                        {row.glyAcc > 0 ? formatGLY(row.glyAcc) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Leyenda */}
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-brand-500" />
              <span className="text-[10px] text-slate-400">HL Real</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-amber-500" style={{ borderTop: '2px dashed #f59e0b' }} />
              <span className="text-[10px] text-slate-400">Meta HL/hora</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-brand-500" />
              <span className="text-[10px] text-slate-400">HL Ac. Real</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-amber-500 border-t-2 border-dashed border-amber-500" />
              <span className="text-[10px] text-slate-400">HL Ac. Programado</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
