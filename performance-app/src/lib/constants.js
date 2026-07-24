// Definición de turnos
export const SHIFTS = [
  { number: 1, label: 'Turno 1', start: '07:00', end: '15:00', color: '#f59e0b' },
  { number: 2, label: 'Turno 2', start: '15:00', end: '23:00', color: '#3b82f6' },
  { number: 3, label: 'Turno 3', start: '23:00', end: '07:00', color: '#8b5cf6' },
];

// Bloques horarios por turno
export const HOUR_BLOCKS = {
  1: [
    { start: '07:00', end: '08:00' },
    { start: '08:00', end: '09:00' },
    { start: '09:00', end: '10:00' },
    { start: '10:00', end: '11:00' },
    { start: '11:00', end: '12:00' },
    { start: '12:00', end: '13:00' },
    { start: '13:00', end: '14:00' },
    { start: '14:00', end: '15:00' },
  ],
  2: [
    { start: '15:00', end: '16:00' },
    { start: '16:00', end: '17:00' },
    { start: '17:00', end: '18:00' },
    { start: '18:00', end: '19:00' },
    { start: '19:00', end: '20:00' },
    { start: '20:00', end: '21:00' },
    { start: '21:00', end: '22:00' },
    { start: '22:00', end: '23:00' },
  ],
  3: [
    { start: '23:00', end: '00:00' },
    { start: '00:00', end: '01:00' },
    { start: '01:00', end: '02:00' },
    { start: '02:00', end: '03:00' },
    { start: '03:00', end: '04:00' },
    { start: '04:00', end: '05:00' },
    { start: '05:00', end: '06:00' },
    { start: '06:00', end: '07:00' },
  ],
};

// Categorías de incidencias
export const INCIDENT_CATEGORIES = [
  { value: 'mecanica', label: 'Mecánica', icon: 'Wrench', color: '#f59e0b' },
  { value: 'electrica', label: 'Eléctrica', icon: 'Zap', color: '#3b82f6' },
  { value: 'insumos', label: 'Insumos', icon: 'Package', color: '#22c55e' },
  { value: 'operativa', label: 'Operativa', icon: 'Users', color: '#8b5cf6' },
  { value: 'servicios', label: 'Servicios', icon: 'Settings', color: '#06b6d4' },
  { value: 'calidad', label: 'Calidad', icon: 'Shield', color: '#ec4899' },
  { value: 'otra', label: 'Otra', icon: 'AlertCircle', color: '#94a3b8' },
];

// Prioridades de incidencias
export const PRIORITIES = [
  { value: 'baja', label: 'Baja', color: '#22c55e' },
  { value: 'media', label: 'Media', color: '#f59e0b' },
  { value: 'alta', label: 'Alta', color: '#f97316' },
  { value: 'critica', label: 'Crítica', color: '#ef4444' },
];

// Determinar turno actual basado en la hora
export function getCurrentShift() {
  const hour = new Date().getHours();
  if (hour >= 7 && hour < 15) return 1;
  if (hour >= 15 && hour < 23) return 2;
  return 3;
}

// Determinar bloque horario actual
export function getCurrentHourBlock() {
  const now = new Date();
  const hour = now.getHours().toString().padStart(2, '0');
  return `${hour}:00`;
}
