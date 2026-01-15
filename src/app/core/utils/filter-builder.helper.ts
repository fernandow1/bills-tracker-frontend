import { Filter, FilterOperator, FILTER_OPERATOR_MAP } from '@core/utils/filter-operators.types';

/**
 * Construye una cadena de filtro en formato: campo.operador.valor
 * Ejemplo: idShop.in.1,2,3 o name.eq.John
 *
 * @param filter Objeto de filtro con campo, operador y valor
 * @returns String en formato campo.operador.valor
 *
 * @example
 * // Filtro IN
 * buildFilterString({ field: 'idShop', operator: FilterOperator.IN, value: [1, 2, 3] })
 * // Resultado: "idShop.in.1,2,3"
 *
 * @example
 * // Filtro EQUALS
 * buildFilterString({ field: 'name', operator: FilterOperator.EQUALS, value: 'John' })
 * // Resultado: "name.eq.John"
 *
 * @example
 * // Filtro LIKE
 * buildFilterString({ field: 'email', operator: FilterOperator.LIKE, value: '@gmail.com' })
 * // Resultado: "email.like.@gmail.com"
 */
export function buildFilterString(filter: Filter): string {
  const { field, operator, value } = filter;
  const operatorStr = FILTER_OPERATOR_MAP[operator];

  // Manejar valores null para operadores IS_NULL e IS_NOT_NULL
  if (operator === FilterOperator.IS_NULL || operator === FilterOperator.IS_NOT_NULL) {
    return `${field}.${operatorStr}`;
  }

  // Validar que el valor no sea null para otros operadores
  if (value === null || value === undefined) {
    throw new Error(`Filter value cannot be null or undefined for operator ${operatorStr}`);
  }

  // Manejar arrays (IN, NOT_IN, BETWEEN)
  if (Array.isArray(value)) {
    if (value.length === 0) {
      throw new Error(`Filter value array cannot be empty for operator ${operatorStr}`);
    }
    const valueStr = value.join(',');
    return `${field}.${operatorStr}.${valueStr}`;
  }

  // Manejar valores simples
  return `${field}.${operatorStr}.${value}`;
}

/**
 * Construye múltiples cadenas de filtro desde un array de filtros
 *
 * @param filters Array de filtros
 * @returns Array de strings en formato campo.operador.valor
 *
 * @example
 * const filters = [
 *   { field: 'idShop', operator: FilterOperator.IN, value: [1, 2, 3] },
 *   { field: 'status', operator: FilterOperator.EQUALS, value: 'active' }
 * ];
 * buildFilterStrings(filters)
 * // Resultado: ["idShop.in.1,2,3", "status.eq.active"]
 */
export function buildFilterStrings(filters: Filter[]): string[] {
  return filters.map((filter) => buildFilterString(filter));
}

/**
 * Construye un objeto de parámetros con filtros en una sola cadena
 * Útil para pasar directamente a buildHttpParams
 *
 * @param filters Array de filtros
 * @param filterKey Nombre de la key para los filtros (default: 'filter')
 * @param logicalOperator Operador lógico entre filtros: 'and' o 'or' (default: 'and')
 * @returns Objeto con los filtros como una sola cadena
 *
 * @example
 * const filters = [
 *   { field: 'idShop', operator: FilterOperator.IN, value: [1, 2, 3] },
 *   { field: 'status', operator: FilterOperator.EQUALS, value: 'active' }
 * ];
 * buildFilterParams(filters)
 * // Resultado: { filter: "idShop.in.1,2,3.and.status.eq.active" }
 *
 * @example
 * // Con operador OR
 * buildFilterParams(filters, 'filter', 'or')
 * // Resultado: { filter: "idShop.in.1,2,3.or.status.eq.active" }
 */
export function buildFilterParams(
  filters: Filter[],
  filterKey = 'filter',
  logicalOperator: 'or' | 'and' = 'and',
): Record<string, string> {
  if (filters.length === 0) {
    return {};
  }

  const separator = `.${logicalOperator}.`;
  const filterStrings = buildFilterStrings(filters);
  return { [filterKey]: filterStrings.join(separator) };
}

/**
 * Helper para crear filtros de forma más concisa
 * El operador por defecto es EQUALS
 *
 * @param field Campo a filtrar
 * @param value Valor del filtro
 * @param operator Operador (opcional, default: EQUALS)
 * @returns Objeto Filter
 *
 * @example
 * createFilter('name', 'John')
 * // Resultado: { field: 'name', operator: FilterOperator.EQUALS, value: 'John' }
 *
 * @example
 * createFilter('idShop', [1, 2, 3], FilterOperator.IN)
 * // Resultado: { field: 'idShop', operator: FilterOperator.IN, value: [1, 2, 3] }
 */
export function createFilter(
  field: string,
  value: Filter['value'],
  operator: FilterOperator = FilterOperator.EQUALS,
): Filter {
  return { field, operator, value };
}
