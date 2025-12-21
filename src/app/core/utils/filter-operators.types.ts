/**
 * Operadores disponibles para filtros de búsqueda
 */
export enum FilterOperator {
  /** Igualdad exacta (=) */
  EQUALS = 'eq',
  /** Diferente de (!=) */
  NOT_EQUALS = 'ne',
  /** Mayor que (>) */
  GREATER_THAN = 'gt',
  /** Mayor o igual que (>=) */
  GREATER_THAN_OR_EQUAL = 'gte',
  /** Menor que (<) */
  LESS_THAN = 'lt',
  /** Menor o igual que (<=) */
  LESS_THAN_OR_EQUAL = 'lte',
  /** Contiene (LIKE) */
  LIKE = 'like',
  /** No contiene (NOT LIKE) */
  NOT_LIKE = 'nlike',
  /** Empieza con */
  STARTS_WITH = 'starts',
  /** Termina con */
  ENDS_WITH = 'ends',
  /** Está en la lista (IN) */
  IN = 'in',
  /** No está en la lista (NOT IN) */
  NOT_IN = 'nin',
  /** Es nulo (IS NULL) */
  IS_NULL = 'null',
  /** No es nulo (IS NOT NULL) */
  IS_NOT_NULL = 'nnull',
  /** Entre dos valores (BETWEEN) */
  BETWEEN = 'between',
}

/**
 * Mapa de operadores con sus símbolos
 */
export const FILTER_OPERATOR_MAP: Record<FilterOperator, string> = {
  [FilterOperator.EQUALS]: 'eq',
  [FilterOperator.NOT_EQUALS]: 'ne',
  [FilterOperator.GREATER_THAN]: 'gt',
  [FilterOperator.GREATER_THAN_OR_EQUAL]: 'gte',
  [FilterOperator.LESS_THAN]: 'lt',
  [FilterOperator.LESS_THAN_OR_EQUAL]: 'lte',
  [FilterOperator.LIKE]: 'like',
  [FilterOperator.NOT_LIKE]: 'nlike',
  [FilterOperator.STARTS_WITH]: 'starts',
  [FilterOperator.ENDS_WITH]: 'ends',
  [FilterOperator.IN]: 'in',
  [FilterOperator.NOT_IN]: 'nin',
  [FilterOperator.IS_NULL]: 'null',
  [FilterOperator.IS_NOT_NULL]: 'nnull',
  [FilterOperator.BETWEEN]: 'between',
};

/**
 * Tipo para definir un filtro
 */
export interface Filter {
  /** Campo a filtrar */
  field: string;
  /** Operador a aplicar */
  operator: FilterOperator;
  /** Valor del filtro (puede ser único o múltiple) */
  value: string | number | boolean | (string | number | boolean)[] | null;
}

/**
 * Tipo simplificado para definir filtros
 */
export type FilterInput = Omit<Filter, 'operator'> & {
  operator?: FilterOperator;
};
