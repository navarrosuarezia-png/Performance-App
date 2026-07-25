import { useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Download, Share2, X, Camera } from 'lucide-react';
import { SHIFTS, HOUR_BLOCKS } from '@/lib/constants';
import { hourlyLogsApi, incidentsApi } from '@/lib/api';
import { ProductionChart } from '@/components/ProductionChart';
import { calcGLY, calcHL, formatHL, formatNumber, getGLYColor } from '@/lib/utils';
import { GLYGauge } from '@/components/GLYGauge';

export function ReportGeneratorModal({ isOpen, onClose, selectedDate, selectedLine, skus }) {
  const [scope, setScope] = useState('shift'); // 'hour', 'shift', 'day'
  const [selectedShift, setSelectedShift] = useState(1);
  const [selectedHour, setSelectedHour] = useState('07:00');
  
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  
  const reportRef = useRef(null);

  if (!isOpen) return null;

  const handleGenerateData = async () => {
    setGenerating(true);
    setReportData(null);
    try {
      let logs = [];
      let incs = [];
      
      if (scope === 'day') {
        logs = await hourlyLogsApi.getByDateAndLine(selectedDate, selectedLine.id);
        incs = await incidentsApi.getByFilters({ date: selectedDate, line_id: selectedLine.id });
      } else if (scope === 'shift') {
        logs = await hourlyLogsApi.getByShift(selectedDate, selectedLine.id, selectedShift);
        incs = await incidentsApi.getByFilters({ date: selectedDate, line_id: selectedLine.id, shift: selectedShift });
      } else if (scope === 'hour') {
        // Find shift of this hour
        let shiftFound = 1;
        for (const s of SHIFTS) {
          if (HOUR_BLOCKS[s.number].some(h => h.start === selectedHour)) {
            shiftFound = s.number;
            break;
          }
        }
        const shiftLogs = await hourlyLogsApi.getByShift(selectedDate, selectedLine.id, shiftFound);
        logs = shiftLogs.filter(l => l.hour_start && l.hour_start.startsWith(selectedHour));
        
        const shiftIncs = await incidentsApi.getByFilters({ date: selectedDate, line_id: selectedLine.id, shift: shiftFound });
        incs = shiftIncs.filter(i => i.hour_start && i.hour_start.startsWith(selectedHour));
      }

      // Process logs for chart and table
      const logsMap = {};
      let totalBottles = 0;
      let totalHL = 0;
      
      logs.forEach(log => {
        const hourBlock = log.hour_start ? log.hour_start.substring(0, 5) : '';
        const sku = skus.find(s => s.id === log.sku_id);
        const hl = log.bottles_produced * (sku?.bottle_volume_liters || 0) / 100;
        const gly = selectedLine.nominal_speed_bph ? (log.bottles_produced / selectedLine.nominal_speed_bph) * 100 : 0;
        
        logsMap[`${selectedDate}-${hourBlock}`] = {
          id: log.id,
          bottles: log.bottles_produced,
          hl,
          gly,
          sku: sku?.code,
          hour: { start: hourBlock }
        };
        totalBottles += log.bottles_produced;
        totalHL += hl;
      });

      const avgGLY = logs.length > 0 ? calcGLY(totalBottles / logs.length, selectedLine.nominal_speed_bph) : 0;

      let hourBlocksForChart = [];
      if (scope === 'day') {
        hourBlocksForChart = [...HOUR_BLOCKS[1], ...HOUR_BLOCKS[2], ...HOUR_BLOCKS[3]];
      } else if (scope === 'shift') {
        hourBlocksForChart = HOUR_BLOCKS[selectedShift];
      } else {
        // Find which shift the hour belongs to so we can show the context of the whole shift in the chart
        let shiftFound = 1;
        for (const s of SHIFTS) {
          if (HOUR_BLOCKS[s.number].some(h => h.start === selectedHour)) {
            shiftFound = s.number;
            break;
          }
        }
        hourBlocksForChart = HOUR_BLOCKS[shiftFound];
      }

      setReportData({
        logs,
        logsMap,
        incidents: incs,
        totalBottles,
        totalHL,
        avgGLY,
        hourBlocksForChart,
        title: scope === 'day' 
          ? `Reporte Diario - ${selectedDate}` 
          : scope === 'shift' 
            ? `Reporte Turno ${selectedShift} - ${selectedDate}`
            : `Reporte Hora ${selectedHour} - ${selectedDate}`
      });
      
      // Allow React to render the off-screen element before capturing
      setTimeout(async () => {
        if (!reportRef.current) return;
        try {
          const dataUrl = await toPng(reportRef.current, { cacheBust: true, backgroundColor: '#0f172a' });
          setPreviewImageUrl(dataUrl);
        } catch (err) {
          console.error("Error generating snapshot:", err);
        } finally {
          setGenerating(false);
        }
      }, 300);

    } catch (err) {
      console.error(err);
      alert("Error generando el reporte");
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!previewImageUrl) return;
    const link = document.createElement('a');
    link.download = `Reporte_${selectedLine.name}_${selectedDate}.png`;
    link.href = previewImageUrl;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface-1 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Camera className="w-5 h-5 text-brand-400" />
            Crear Reporte Exportable
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-surface-2 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 md:p-6 flex-1 overflow-y-auto space-y-6">
          {/* Controles de Configuración */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-surface-2/50 p-4 rounded-xl border border-slate-700/50">
            <div className="md:col-span-1">
              <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-2 block">Alcance del Reporte</label>
              <select 
                value={scope} 
                onChange={(e) => setScope(e.target.value)}
                className="w-full rounded-xl bg-surface-2 border border-slate-700 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              >
                <option value="day">Día Entero</option>
                <option value="shift">Turno Completo</option>
                <option value="hour">Hora Específica</option>
              </select>
            </div>
            
            {scope === 'shift' && (
              <div>
                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-2 block">Seleccionar Turno</label>
                <select 
                  value={selectedShift} 
                  onChange={(e) => setSelectedShift(Number(e.target.value))}
                  className="w-full rounded-xl bg-surface-2 border border-slate-700 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                >
                  {SHIFTS.map(s => (
                    <option key={s.number} value={s.number}>{s.label} ({s.start}-{s.end})</option>
                  ))}
                </select>
              </div>
            )}

            {scope === 'hour' && (
              <div>
                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-2 block">Seleccionar Hora</label>
                <input 
                  type="time" 
                  value={selectedHour}
                  onChange={(e) => setSelectedHour(e.target.value)}
                  className="w-full rounded-xl bg-surface-2 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                />
              </div>
            )}
            
            <div className="md:col-span-2 flex items-end">
              <Button 
                onClick={handleGenerateData} 
                loading={generating}
                className="w-full bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/25"
              >
                Generar Vista Previa
              </Button>
            </div>
          </div>

          {/* Report Preview */}
          {reportData && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-brand-500/10 p-4 rounded-xl border border-brand-500/20">
                <p className="text-sm text-brand-300 flex-1">
                  Revisa la vista previa. Si todo está correcto, descarga la imagen para compartirla.
                </p>
                <Button 
                  onClick={handleDownload} 
                  icon={Download} 
                  variant="success" 
                  size="lg" 
                  className="w-full sm:w-auto shadow-lg shadow-emerald-500/20"
                  disabled={!previewImageUrl || generating}
                >
                  {generating ? 'Generando...' : 'Descargar Captura'}
                </Button>
              </div>

              <div className="bg-slate-900/50 p-2 md:p-6 rounded-xl border border-slate-700 flex justify-center">
                {generating ? (
                   <div className="py-20 flex flex-col items-center justify-center space-y-4">
                     <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
                     <p className="text-slate-400 font-medium animate-pulse">Procesando reporte...</p>
                   </div>
                ) : previewImageUrl ? (
                   <img 
                     src={previewImageUrl} 
                     alt="Report Preview" 
                     className="w-full max-w-[800px] h-auto object-contain rounded-xl shadow-2xl border border-slate-700 mx-auto" 
                   />
                ) : null}
              </div>
              
              {/* Off-screen actual report DOM for html-to-image */}
              <div className="fixed top-[-9999px] left-[-9999px] opacity-0 pointer-events-none">
                <div ref={reportRef} className="p-8 bg-[#0f172a] text-white w-[800px] rounded-xl relative border border-slate-800 shrink-0">
                  {/* Header Reporte */}
                  <div className="flex justify-between items-end border-b border-slate-700 pb-4 mb-6">
                    <div>
                      <h1 className="text-3xl font-black text-brand-400">PERFORMANCE APP</h1>
                      <h2 className="text-xl font-bold mt-1 text-slate-200">{reportData.title}</h2>
                      <p className="text-slate-400 mt-1">Línea: {selectedLine.name}</p>
                    </div>
                    <div className="flex gap-6 items-center text-right">
                      <div>
                        <p className="text-3xl font-bold text-white">{formatHL(reportData.totalHL)} HL</p>
                        <p className="text-slate-400">{formatNumber(reportData.totalBottles)} botellas</p>
                      </div>
                      <div className="hidden sm:block">
                        <GLYGauge value={reportData.avgGLY} size="sm" label="GLY Prom." />
                      </div>
                    </div>
                  </div>

                  {/* Chart */}
                  <div className="mb-6 bg-surface-1 p-4 rounded-xl border border-slate-800">
                    <h3 className="text-sm font-bold mb-4 text-slate-300 uppercase tracking-wider">Rendimiento (Meta vs Real)</h3>
                    <div className="min-h-[400px]">
                       <ProductionChart 
                         hourBlocks={reportData.hourBlocksForChart}
                         savedLogs={reportData.logsMap}
                         line={selectedLine}
                         selectedDate={selectedDate}
                         hideHeader={true}
                         hideTable={false}
                       />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {/* Tabla de Incidencias */}
                    <div className="bg-surface-1 rounded-xl border border-slate-800 overflow-hidden">
                      <h3 className="text-sm font-bold p-4 bg-surface-2 border-b border-slate-700 text-slate-300 uppercase tracking-wider">Problemas y Percances</h3>
                      <div className="p-4 space-y-3">
                        {reportData.incidents.length === 0 ? (
                          <p className="text-slate-500 text-sm text-center">No se registraron incidencias en este periodo.</p>
                        ) : (
                          reportData.incidents.map(inc => (
                            <div key={inc.id} className="flex gap-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-bold text-red-400">{inc.hour_start ? inc.hour_start.substring(0,5) : ''}</span>
                                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-800 text-slate-300">
                                    {inc.category}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-200">{inc.description}</p>
                              </div>
                              <div className="flex flex-col items-center justify-center bg-red-500/20 px-4 rounded-md">
                                <span className="text-xl font-bold text-red-400">{inc.downtime_minutes}</span>
                                <span className="text-[10px] text-red-300/70 uppercase">Min</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Watermark/Footer */}
                  <div className="mt-8 pt-4 border-t border-slate-800 text-center text-slate-500 text-xs">
                    Generado automáticamente por Performance App • {new Date().toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
