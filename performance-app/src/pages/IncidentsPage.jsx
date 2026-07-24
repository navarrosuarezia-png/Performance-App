import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { AlertTriangle, Filter, Search, Calendar, Clock } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { incidentsApi, linesApi } from '@/lib/api';
import { SHIFTS, INCIDENT_CATEGORIES, PRIORITIES } from '@/lib/constants';
import { cn } from '@/lib/utils';

export default function IncidentsPage() {
  const { selectedDate, setSelectedDate, selectedLine, setSelectedLine } = useAppContext();
  const [lines, setLines] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterDate, setFilterDate] = useState(selectedDate || new Date().toISOString().split('T')[0]);
  const [filterShift, setFilterShift] = useState('all');
  const [filterHour, setFilterHour] = useState('');

  // Load lines if not present
  useEffect(() => {
    const loadLines = async () => {
      try {
        const linesData = await linesApi.getAll();
        setLines(linesData);
        if (!selectedLine && linesData.length > 0) {
          setSelectedLine(linesData[0]);
        }
      } catch (error) {
        console.error("Error fetching lines:", error);
      }
    };
    loadLines();
  }, [selectedLine, setSelectedLine]);

  useEffect(() => {
    const fetchIncidents = async () => {
      setLoading(true);
      try {
        const params = {};
        if (filterDate) {
          params.date = filterDate;
        }
        if (selectedLine && selectedLine.id !== 'all') {
          params.line_id = selectedLine.id;
        }
        if (filterShift !== 'all') {
          params.shift = filterShift;
        }
        
        const data = await incidentsApi.getByFilters(params);
        
        // Filter by hour locally since it's easy and fast
        let filteredData = data;
        if (filterHour) {
          filteredData = data.filter(inc => inc.hour_start && inc.hour_start.startsWith(filterHour));
        }
        
        setIncidents(filteredData);
      } catch (error) {
        console.error("Error fetching incidents:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchIncidents();
  }, [filterDate, selectedLine, filterShift, filterHour]);

  const formatDate = (dateVal) => {
    if (!dateVal) return '';
    const cleanDate = typeof dateVal === 'string' ? dateVal.split('T')[0] : '';
    if (cleanDate) {
      const parts = cleanDate.split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return String(dateVal);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const getCategoryLabel = (val) => INCIDENT_CATEGORIES.find(c => c.value === val)?.label || val;
  const getCategoryColor = (val) => INCIDENT_CATEGORIES.find(c => c.value === val)?.color || '#64748b';
  const getPriorityLabel = (val) => PRIORITIES.find(p => p.value === val)?.label || val;
  const getPriorityColor = (val) => PRIORITIES.find(p => p.value === val)?.color || '#64748b';

  return (
    <div className="py-4 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-xl font-bold">Historial de Incidencias</h2>
          <p className="text-sm text-slate-400">
            {filterDate 
              ? `Consulta y filtrado de problemas registrados el día ${formatDate(filterDate)}`
              : 'Consulta y filtrado de problemas registrados en todas las fechas'}
          </p>
        </div>
        
        {/* Selector de línea */}
        <div className="w-full sm:w-64">
          <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1 block">Línea</label>
          <div className="flex gap-2">
            {lines.map((l) => (
              <button
                key={l.id}
                onClick={() => setSelectedLine(l)}
                className={cn(
                  'flex-1 py-1.5 px-3 rounded-xl text-xs font-medium transition-all duration-200',
                  selectedLine?.id === l.id
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

      {/* Filtros */}
      <Card glow className="border-brand-500/20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Filtro por Fecha */}
          <div>
            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-2 block">Filtrar por Fecha</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => {
                  setFilterDate(e.target.value);
                  if (e.target.value) {
                    setSelectedDate(e.target.value);
                  }
                }}
                className="flex-1 rounded-xl bg-surface-2 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              />
              <button
                type="button"
                onClick={() => {
                  setFilterDate(todayStr);
                  setSelectedDate(todayStr);
                }}
                className={cn(
                  'px-3 py-2 rounded-xl text-xs font-medium border transition-colors whitespace-nowrap',
                  filterDate === todayStr
                    ? 'bg-brand-600 text-white border-brand-500 shadow-md'
                    : 'bg-surface-2 text-slate-300 border-slate-700 hover:bg-surface-3'
                )}
                title="Seleccionar la fecha de hoy"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => setFilterDate('')}
                className={cn(
                  'px-3 py-2 rounded-xl text-xs font-medium border transition-colors whitespace-nowrap',
                  filterDate === ''
                    ? 'bg-brand-600 text-white border-brand-500 shadow-md'
                    : 'bg-surface-2 text-slate-300 border-slate-700 hover:bg-surface-3'
                )}
                title="Ver incidencias de todas las fechas"
              >
                Todas
              </button>
            </div>
          </div>

          {/* Filtro por Turno */}
          <div>
            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-2 block">Filtrar por Turno</label>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterShift('all')}
                className={cn(
                  'flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all duration-200',
                  filterShift === 'all'
                    ? 'bg-brand-600 text-white shadow-lg'
                    : 'bg-surface-2 text-slate-400 border border-slate-700 hover:bg-surface-3'
                )}
              >
                Todos
              </button>
              {SHIFTS.map((s) => (
                <button
                  key={s.number}
                  onClick={() => setFilterShift(s.number)}
                  className={cn(
                    'flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all duration-200',
                    filterShift === s.number
                      ? 'text-white shadow-lg'
                      : 'bg-surface-2 text-slate-400 border border-slate-700 hover:bg-surface-3'
                  )}
                  style={filterShift === s.number ? { backgroundColor: s.color } : {}}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filtro por Hora Específica */}
          <div>
            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-2 block">Filtrar por Hora Específica</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="time"
                value={filterHour}
                onChange={(e) => setFilterHour(e.target.value)}
                className="w-full rounded-xl bg-surface-2 border border-slate-700 pl-10 pr-12 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              />
              {filterHour && (
                <button 
                  onClick={() => setFilterHour('')}
                  className="absolute right-3 top-2 text-xs font-bold px-2 py-1 bg-surface-3 text-slate-300 rounded hover:text-white"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Lista de incidencias */}
      <Card>
        <CardHeader>
          <CardTitle icon={AlertTriangle}>
            Resultados ({incidents.length})
          </CardTitle>
        </CardHeader>
        
        {loading ? (
          <div className="h-48 flex items-center justify-center text-slate-500">Cargando incidencias...</div>
        ) : incidents.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-slate-500 gap-2">
            <Filter className="w-8 h-8 opacity-20" />
            <p>No se encontraron incidencias para los filtros seleccionados.</p>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {incidents.map((inc) => (
              <div key={inc.id} className="p-4 rounded-xl bg-surface-2 border border-slate-700 flex flex-col sm:flex-row gap-4 hover:border-slate-500 transition-colors">
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span 
                      className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-white"
                      style={{ backgroundColor: getCategoryColor(inc.category) }}
                    >
                      {getCategoryLabel(inc.category)}
                    </span>
                    <span 
                      className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-white"
                      style={{ backgroundColor: getPriorityColor(inc.priority) }}
                    >
                      {getPriorityLabel(inc.priority)}
                    </span>
                    <span className="text-xs font-bold text-slate-400 ml-auto flex items-center gap-2 bg-surface-3 px-3 py-1 rounded-full">
                      {inc.production_date && (
                        <>
                          <Calendar className="w-3 h-3 text-brand-400" />
                          <span>{formatDate(inc.production_date)}</span>
                          <span className="text-slate-600">•</span>
                        </>
                      )}
                      <Clock className="w-3 h-3 text-brand-400" />
                      T{inc.shift_number} • {inc.hour_start ? inc.hour_start.substring(0,5) : ''}
                    </span>
                  </div>
                  <p className="text-sm text-slate-200 bg-surface-1 p-3 rounded-lg border border-slate-700/50 leading-relaxed">
                    {inc.description}
                  </p>
                </div>
                <div className="sm:w-32 flex flex-col justify-center items-center p-3 rounded-lg bg-surface-3 border border-slate-700">
                  <span className="text-3xl font-black text-white">{inc.downtime_minutes}</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Minutos de Paro</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

