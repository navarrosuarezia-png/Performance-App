import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAppContext } from '@/context/AppContext';
import { SHIFTS, HOUR_BLOCKS, getCurrentShift, INCIDENT_CATEGORIES, PRIORITIES } from '@/lib/constants';
import { calcHL, calcGLY, formatHL, formatGLY, formatNumber, getGLYColor, cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { GLYGauge } from '@/components/GLYGauge';
import { ProductionChart } from '@/components/ProductionChart';
import { linesApi, skusApi, hourlyLogsApi, incidentsApi } from '@/lib/api';
import {
  Clock, Factory, Beer, Save, AlertTriangle, CheckCircle, Plus, ChevronDown, ChevronUp, X, Camera
} from 'lucide-react';
import { ReportGeneratorModal } from '@/components/ReportGeneratorModal';

export default function HourlyLogPage() {
  const { user } = useAuth();
  const { selectedLine, setSelectedLine, selectedShift, setSelectedShift, selectedDate, setSelectedDate } = useAppContext();
  const [lines, setLines] = useState([]);
  const [skus, setSkus] = useState([]);
  const [selectedHour, setSelectedHour] = useState(null);
  const [selectedSku, setSelectedSku] = useState(null);
  const [bottlesProduced, setBottlesProduced] = useState('');
  const [notes, setNotes] = useState('');
  const [savedLogs, setSavedLogs] = useState({});
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [targetHlOverride, setTargetHlOverride] = useState('');

  // Incident form state
  const [incidentCategory, setIncidentCategory] = useState('mecanica');
  const [incidentDowntime, setIncidentDowntime] = useState('');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [incidentPriority, setIncidentPriority] = useState('media');

  // Cargar líneas y SKUs
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [linesData, skusData] = await Promise.all([linesApi.getAll(), skusApi.getAll()]);
        setLines(linesData);
        setSkus(skusData);
        if (!selectedLine && linesData.length > 0) setSelectedLine(linesData[0]);
        if (skusData.length > 0) setSelectedSku(skusData[0]);
      } catch (err) {
        console.error("Failed to load initial data:", err);
      }
    };
    loadInitialData();
  }, []);

  // Cargar registros del turno
  useEffect(() => {
    if (!selectedLine || !selectedDate || !selectedShift) return;
    const loadLogs = async () => {
      try {
        const logsData = await hourlyLogsApi.getByShift(selectedDate, selectedLine.id, selectedShift);
        const logsMap = {};
        logsData.forEach(log => {
          // log.hour_start comes as '07:00:00' from postgres, we need '07:00'
          const hourBlock = log.hour_start.substring(0, 5);
          const logKey = `${selectedDate}-${hourBlock}`;
          const sku = skus.find(s => s.id === log.sku_id);
          const gly = selectedLine.nominal_speed_bph ? (log.bottles_produced / selectedLine.nominal_speed_bph) * 100 : 0;
          const hl = log.bottles_produced * (sku?.bottle_volume_liters || 0) / 100;
          
          logsMap[logKey] = {
            id: log.id,
            bottles: log.bottles_produced,
            hl,
            gly,
            sku: sku?.code,
            hour: { start: hourBlock },
            notes: log.notes,
          };
        });
        setSavedLogs(logsMap);
      } catch (err) {
        console.error("Failed to load logs:", err);
      }
    };
    if (skus.length > 0) loadLogs();
  }, [selectedLine, selectedDate, selectedShift, skus]);

  const line = selectedLine || lines[0] || {};
  const hourBlocks = HOUR_BLOCKS[selectedShift] || [];
  const shiftInfo = SHIFTS.find((s) => s.number === selectedShift);

  // HL Programado por hora: usa el override del usuario si existe, sino el de la línea
  const effectiveTargetHl = targetHlOverride !== '' ? parseFloat(targetHlOverride) || 0 : Number(line.target_hl_per_hour || 0);

  // Crear un objeto line con el target override para pasar al chart
  const lineWithTarget = { ...line, target_hl_per_hour: effectiveTargetHl };

  // Calcular métricas en tiempo real
  const bottles = parseInt(bottlesProduced) || 0;
  const bottleVol = selectedSku?.bottle_volume_liters || line.bottle_volume_liters;
  const realHL = calcHL(bottles, bottleVol);
  const glyPct = calcGLY(bottles, line.nominal_speed_bph);

  // Calcular acumulados del turno
  const shiftTotalBottles = Object.values(savedLogs).reduce((sum, log) => sum + (log.bottles || 0), 0) + bottles;
  const shiftTotalHL = Object.values(savedLogs).reduce((sum, log) => sum + (log.hl || 0), 0) + realHL;
  const loggedCount = Object.keys(savedLogs).length;
  const shiftAvgGLY = loggedCount > 0
    ? (Object.values(savedLogs).reduce((sum, log) => sum + (log.gly || 0), 0) + glyPct) / (loggedCount + (bottles > 0 ? 1 : 0))
    : glyPct;

  const handleSave = async () => {
    if (!selectedHour || !bottles || !selectedLine || !selectedSku) return;
    setSaving(true);

    try {
      const logKey = `${selectedDate}-${selectedHour.start}`;
      const isUpdate = !!savedLogs[logKey]?.id;
      
      const logData = {
        line_id: selectedLine.id,
        date: selectedDate,
        shift: selectedShift,
        hour_block: selectedHour.start,
        sku_id: selectedSku.id,
        bottles_produced: bottles,
        target_hl: effectiveTargetHl,
        operator_id: user.id,
        notes: notes || null
      };

      let savedLog;
      if (isUpdate) {
        savedLog = await hourlyLogsApi.update(savedLogs[logKey].id, logData);
      } else {
        savedLog = await hourlyLogsApi.create(logData);
      }

      if (showIncidentForm && incidentDescription) {
        await incidentsApi.create({
          hourly_log_id: savedLog.id,
          category: incidentCategory,
          downtime_minutes: parseInt(incidentDowntime) || 0,
          priority: incidentPriority,
          description: incidentDescription,
          reported_by: user.id
        });
      }

      setSavedLogs((prev) => ({
        ...prev,
        [logKey]: {
          id: savedLog.id,
          bottles,
          hl: realHL,
          gly: glyPct,
          sku: selectedSku.code,
          hour: selectedHour,
          notes,
          hasIncident: showIncidentForm && incidentDescription,
        },
      }));

      // Reset
      setBottlesProduced('');
      setNotes('');
      setShowIncidentForm(false);
      setIncidentDescription('');
      setIncidentDowntime('');
      setSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      console.error(err);
      setSaving(false);
      alert('Error al guardar el registro: ' + err.message);
    }
  };

  return (
    <div className="py-4 space-y-4">
      {/* Header with Title and Report Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Registro de Producción</h2>
        <Button 
          onClick={() => setShowReportModal(true)} 
          icon={Camera}
          variant="secondary"
          className="bg-brand-600/20 text-brand-400 hover:bg-brand-600/30 border border-brand-500/30"
        >
          Crear Reporte
        </Button>
      </div>

      {/* Header con controles */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Selector de fecha */}
        <div className="flex-1">
          <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1 block">Fecha</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full rounded-xl bg-surface-2 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          />
        </div>

        {/* Selector de línea */}
        <div className="flex-1">
          <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1 block">Línea</label>
          <div className="flex gap-2">
            {lines.map((l) => (
              <button
                key={l.id}
                onClick={() => setSelectedLine(l)}
                className={cn(
                  'flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all duration-200',
                  line.id === l.id
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/25'
                    : 'bg-surface-2 text-slate-400 border border-slate-700 hover:bg-surface-3'
                )}
              >
                {l.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selector de turno */}
      <div>
        <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1 block">Turno</label>
        <div className="flex gap-2">
          {SHIFTS.map((s) => (
            <button
              key={s.number}
              onClick={() => setSelectedShift(s.number)}
              className={cn(
                'flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-200 flex flex-col items-center gap-0.5',
                selectedShift === s.number
                  ? 'text-white shadow-lg'
                  : 'bg-surface-2 text-slate-400 border border-slate-700 hover:bg-surface-3'
              )}
              style={selectedShift === s.number ? { backgroundColor: s.color, boxShadow: `0 10px 25px ${s.color}40` } : {}}
            >
              <span className="font-semibold">{s.label}</span>
              <span className="text-[10px] opacity-75">{s.start} - {s.end}</span>
            </button>
          ))}
        </div>
      </div>

      {/* HL Programado por hora (editable) */}
      <div>
        <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1 block">HL Programado / Hora</label>
        <div className="relative">
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            value={targetHlOverride}
            onChange={(e) => setTargetHlOverride(e.target.value)}
            placeholder={String(line.target_hl_per_hour || 0)}
            className="w-full rounded-xl bg-surface-2 border border-slate-700 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all pr-20"
          />
          {targetHlOverride !== '' && (
            <button
              onClick={() => setTargetHlOverride('')}
              className="absolute right-2 top-1.5 text-[10px] font-bold px-2 py-1 bg-surface-3 text-slate-300 rounded hover:text-white transition-colors"
            >
              Reset
            </button>
          )}
        </div>
        <p className="text-[10px] text-slate-600 mt-0.5">
          {targetHlOverride !== '' 
            ? `Usando meta personalizada: ${effectiveTargetHl} HL/h` 
            : `Meta de línea: ${line.target_hl_per_hour || 0} HL/h`}
        </p>
      </div>

      {/* Resumen del turno */}
      <Card glow>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider">Acumulado {shiftInfo?.label}</p>
            <div className="flex items-baseline gap-4 mt-1">
              <div>
                <span className="text-2xl font-bold text-white">{formatHL(shiftTotalHL)}</span>
                <span className="text-xs text-slate-500 ml-1">HL</span>
              </div>
              <div>
                <span className="text-lg font-semibold text-slate-300">{formatNumber(shiftTotalBottles)}</span>
                <span className="text-xs text-slate-500 ml-1">bot.</span>
              </div>
            </div>
          </div>
          <GLYGauge value={shiftAvgGLY} size="sm" label="GLY Turno" />
        </div>
      </Card>

      {/* Gráfico de productividad por hora (como en el Excel HORA HORA L3) */}
      <ProductionChart
        hourBlocks={hourBlocks}
        savedLogs={savedLogs}
        line={lineWithTarget}
        selectedDate={selectedDate}
        selectedSku={selectedSku}
      />

      {/* Bloques horarios */}
      <div>
        <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-2 block">
          <Clock className="w-3 h-3 inline mr-1" />
          Seleccionar hora
        </label>
        <div className="grid grid-cols-4 gap-2">
          {hourBlocks.map((block) => {
            const logKey = `${selectedDate}-${block.start}`;
            const isLogged = savedLogs[logKey];
            const isSelected = selectedHour?.start === block.start;

            return (
              <button
                key={block.start}
                onClick={() => {
                  setSelectedHour(block);
                  if (isLogged) {
                    setBottlesProduced(String(isLogged.bottles));
                  } else {
                    setBottlesProduced('');
                  }
                }}
                className={cn(
                  'relative py-3 px-2 rounded-xl text-center transition-all duration-200 font-medium',
                  isSelected
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30 scale-105'
                    : isLogged
                    ? 'bg-emerald-900/30 border border-emerald-500/30 text-emerald-400'
                    : 'bg-surface-2 border border-slate-700 text-slate-300 hover:bg-surface-3'
                )}
              >
                <span className="text-sm">{block.start}</span>
                {isLogged && (
                  <CheckCircle className="absolute top-1 right-1 w-3 h-3 text-emerald-400" />
                )}
                {isLogged && (
                  <p className="text-[9px] mt-0.5 opacity-75">{formatHL(isLogged.hl)} HL</p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Formulario de registro */}
      {selectedHour && (
        <Card className="border-brand-500/20">
          <CardHeader>
            <CardTitle icon={Factory}>
              Registro {selectedHour.start} - {selectedHour.end}
            </CardTitle>
          </CardHeader>

          <div className="space-y-4">
            {/* SKU Selector */}
            <div>
              <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">Producto (SKU)</label>
              <div className="flex flex-wrap gap-2">
                {skus.map((sku) => (
                  <button
                    key={sku.id}
                    onClick={() => setSelectedSku(sku)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                      selectedSku?.id === sku.id
                        ? 'bg-brand-600 text-white'
                        : 'bg-surface-2 text-slate-400 border border-slate-700 hover:bg-surface-3'
                    )}
                  >
                    {sku.code}
                  </button>
                ))}
              </div>
              {selectedSku && (
                <p className="text-[10px] text-slate-500 mt-1">{selectedSku.description} · {selectedSku.bottle_volume_liters}L</p>
              )}
            </div>

            {/* Input botellas - GRANDE para mobile */}
            <div>
              <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">
                <Beer className="w-3 h-3 inline mr-1" />
                Botellas producidas
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={bottlesProduced}
                onChange={(e) => setBottlesProduced(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl bg-surface-2 border border-slate-700 px-4 py-4 text-3xl font-bold text-center text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
              />
            </div>

            {/* Métricas calculadas en tiempo real */}
            {bottles > 0 && (
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-surface-2 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-500">HL Real</p>
                  <p className="text-lg font-bold text-white">{formatHL(realHL)}</p>
                </div>
                <div className="bg-surface-2 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-500">GLY</p>
                  <p className="text-lg font-bold" style={{ color: getGLYColor(glyPct) }}>
                    {formatGLY(glyPct)}
                  </p>
                </div>
                <div className="bg-surface-2 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-500">Cajas</p>
                  <p className="text-lg font-bold text-white">{formatNumber(Math.floor(bottles / 12))}</p>
                </div>
              </div>
            )}

            {/* Notas */}
            <div>
              <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">Notas (opcional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Observaciones del bloque horario..."
                className="w-full rounded-xl bg-surface-2 border border-slate-700 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none transition-all"
              />
            </div>

            {/* Toggle incidencia */}
            <button
              onClick={() => setShowIncidentForm(!showIncidentForm)}
              className={cn(
                'w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all',
                showIncidentForm
                  ? 'bg-red-500/10 border-red-500/30 text-red-400'
                  : 'bg-surface-2 border-slate-700 text-slate-400 hover:bg-surface-3'
              )}
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <AlertTriangle className="w-4 h-4" />
                Registrar Incidencia
              </span>
              {showIncidentForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {/* Formulario de incidencia */}
            {showIncidentForm && (
              <div className="space-y-3 bg-red-500/5 rounded-xl p-4 border border-red-500/10">
                {/* Categoría */}
                <div>
                  <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">Categoría</label>
                  <div className="flex flex-wrap gap-2">
                    {INCIDENT_CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => setIncidentCategory(cat.value)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                          incidentCategory === cat.value
                            ? 'text-white'
                            : 'bg-surface-2 text-slate-400 border border-slate-700'
                        )}
                        style={incidentCategory === cat.value ? { backgroundColor: cat.color } : {}}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Minutos de paro */}
                <div>
                  <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">Minutos de paro</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={incidentDowntime}
                    onChange={(e) => setIncidentDowntime(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl bg-surface-2 border border-slate-700 px-4 py-2.5 text-lg font-bold text-center text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                </div>

                {/* Prioridad */}
                <div>
                  <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">Prioridad</label>
                  <div className="flex gap-2">
                    {PRIORITIES.map((p) => (
                      <button
                        key={p.value}
                        onClick={() => setIncidentPriority(p.value)}
                        className={cn(
                          'flex-1 py-1.5 rounded-lg text-xs font-medium transition-all',
                          incidentPriority === p.value
                            ? 'text-white'
                            : 'bg-surface-2 text-slate-400 border border-slate-700'
                        )}
                        style={incidentPriority === p.value ? { backgroundColor: p.color } : {}}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Descripción */}
                <div>
                  <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">Descripción</label>
                  <textarea
                    value={incidentDescription}
                    onChange={(e) => setIncidentDescription(e.target.value)}
                    rows={3}
                    placeholder="Describa la falla, causa raíz y acción correctiva..."
                    className="w-full rounded-xl bg-surface-2 border border-slate-700 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
                  />
                </div>
              </div>
            )}

            {/* Botón guardar */}
            <Button
              onClick={handleSave}
              loading={saving}
              disabled={!bottles}
              icon={showSuccess ? CheckCircle : Save}
              variant={showSuccess ? 'success' : 'primary'}
              size="lg"
              className="w-full"
            >
              {showSuccess ? '¡Guardado!' : 'Guardar Registro'}
            </Button>
          </div>
        </Card>
      )}

      <ReportGeneratorModal 
        isOpen={showReportModal} 
        onClose={() => setShowReportModal(false)}
        selectedDate={selectedDate}
        selectedLine={line}
        skus={skus}
      />
    </div>
  );
}
