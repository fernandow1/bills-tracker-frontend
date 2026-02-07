/**
 * Interfaz genérica para parámetros de búsqueda paginada
 * @template TFilters Tipo de los filtros específicos de cada entidad
 */
export interface SearchParams<TFilters = Record<string, unknown>> {
  page: number;
  pageSize: number;
  filters?: TFilters;
}
