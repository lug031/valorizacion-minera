import { todayIsoDatePeru } from './peru-datetime';

/** Fecha calendario de hoy en Perú (YYYY-MM-DD). */
export function todayIsoDate(now: Date = new Date()): string {
  return todayIsoDatePeru(now);
}
