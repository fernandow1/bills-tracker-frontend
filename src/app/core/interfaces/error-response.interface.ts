/**
 * Estructura de error estándar del backend
 */
export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp?: string;
  path?: string;
  validationErrors?: ValidationError[];
}

/**
 * Error de validación de DTO
 */
export interface ValidationError {
  field: string;
  message: string;
  constraints?: Record<string, string>;
}

/**
 * Error formateado para el frontend
 */
export interface FormattedError {
  status: number;
  title: string;
  message: string;
  details?: string[];
  validationErrors?: Map<string, string[]>;
  originalError?: unknown;
}
