import { clsx } from 'clsx';

// Merge class names
export function cn(...inputs) {
  return clsx(inputs);
}

// Calcular Hectolitros (HL) a partir de botellas y volumen
export function calcHL(bottles, bottleVolumeLiters) {
  if (!bottles || !bottleVolumeLiters) return 0;
  return Number(((bottles * bottleVolumeLiters) / 100).toFixed(3));
}

// Calcular GLY % (Gross Line Yield)
export function calcGLY(bottles, nominalSpeed) {
  if (!bottles || !nominalSpeed || nominalSpeed === 0) return 0;
  return Number(((bottles / nominalSpeed) * 100).toFixed(2));
}

// Formatear número como HL
export function formatHL(value) {
  if (value == null) return '0.000';
  return Number(value).toFixed(3);
}

// Formatear GLY como porcentaje
export function formatGLY(value) {
  if (value == null) return '0.00%';
  return `${Number(value).toFixed(2)}%`;
}

// Formatear número con separador de miles
export function formatNumber(num) {
  if (num == null) return '0';
  return new Intl.NumberFormat('es-PE').format(num);
}

// Obtener color según el GLY%
export function getGLYColor(gly) {
  if (gly >= 85) return '#22c55e'; // verde
  if (gly >= 70) return '#f59e0b'; // ámbar
  if (gly >= 50) return '#f97316'; // naranja
  return '#ef4444'; // rojo
}

// Formatear fecha en español
export function formatDate(date) {
  return new Date(date).toLocaleDateString('es-PE', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Formatear hora
export function formatTime(time) {
  if (!time) return '';
  return time.substring(0, 5);
}
