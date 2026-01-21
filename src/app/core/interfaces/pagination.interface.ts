export interface Pagination<T> {
  count: number; // Total de registros que coinciden con los filtros (no solo los de la página actual)
  data: T[]; // Registros de la página actual
}
