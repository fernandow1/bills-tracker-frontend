/**
 * @fileoverview Utilidades centralizadas para manejo de parámetros HTTP y filtros
 *
 * Este módulo exporta todas las utilidades necesarias para:
 * - Convertir objetos a HttpParams
 * - Construir filtros con operadores (ej: idShop.in.1,2,3)
 * - Trabajar con operadores de filtrado
 */

// Query Params helpers
export { buildHttpParams, paramsToObject } from './query-params.helper';

// Filter builders
export {
  buildFilterString,
  buildFilterStrings,
  buildFilterParams,
  createFilter,
} from './filter-builder.helper';

// Filter types and operators
export {
  FilterOperator,
  FILTER_OPERATOR_MAP,
  type Filter,
  type FilterInput,
} from './filter-operators.types';
