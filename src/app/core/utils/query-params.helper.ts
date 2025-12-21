import { HttpParams } from '@angular/common/http';

/**
 * Convierte un objeto plano en HttpParams válidos para peticiones HTTP
 * @param params Objeto con parámetros donde la key es string y el valor es desconocido
 * @returns HttpParams listo para usar en peticiones
 *
 * @example
 * const params = buildHttpParams({ page: 1, limit: 10, search: 'test' });
 * // Resultado: HttpParams con page=1&limit=10&search=test
 */
export function buildHttpParams(params: Record<string, unknown>): HttpParams {
  let httpParams = new HttpParams();

  Object.entries(params).forEach(([key, value]) => {
    // Omitir valores null, undefined o vacíos
    if (value === null || value === undefined || value === '') {
      return;
    }

    // Manejar arrays
    if (Array.isArray(value)) {
      // Si el array está vacío, omitir
      if (value.length === 0) {
        return;
      }
      // Agregar cada elemento del array como un parámetro separado
      value.forEach((item) => {
        httpParams = httpParams.append(key, String(item));
      });
      return;
    }

    // Manejar objetos (convertir a JSON)
    if (typeof value === 'object') {
      httpParams = httpParams.set(key, JSON.stringify(value));
      return;
    }

    // Manejar booleanos, números y strings
    httpParams = httpParams.set(key, String(value));
  });

  return httpParams;
}

/**
 * Convierte HttpParams a un objeto plano
 * @param httpParams HttpParams a convertir
 * @returns Objeto plano con los parámetros
 *
 * @example
 * const params = new HttpParams().set('page', '1').set('limit', '10');
 * const obj = paramsToObject(params);
 * // Resultado: { page: '1', limit: '10' }
 */
export function paramsToObject(httpParams: HttpParams): Record<string, string | string[]> {
  const obj: Record<string, string | string[]> = {};

  httpParams.keys().forEach((key) => {
    const values = httpParams.getAll(key);
    if (values && values.length > 1) {
      obj[key] = values;
    } else if (values && values.length === 1) {
      obj[key] = values[0];
    }
  });

  return obj;
}
