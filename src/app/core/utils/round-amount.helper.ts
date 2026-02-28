/**
 * Redondea un valor numérico a la cantidad de decimales indicada (por defecto 2).
 * Usa Number.EPSILON para evitar errores de punto flotante (ej.: 1.005 → 1.01).
 *
 * @param value - El valor a redondear
 * @param decimals - Cantidad de decimales (por defecto 2)
 * @returns El valor redondeado
 */
export function roundAmount(value: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
