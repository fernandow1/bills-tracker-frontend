/**
 * Nueva estructura de error del backend (formato simplificado)
 */
export interface ErrorResponse {
  status: number;
  title: string;
  detail: string;
  errors?: ValidationError[];
  path?: string;
  timestamp?: string;
}

/**
 * Error de validación simplificado
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * @deprecated Use ValidationError instead
 * Error de validación con constraints (legacy)
 */
export interface LegacyValidationError extends ValidationError {
  constraints?: Record<string, string>;
}

/**
 * @deprecated Use ErrorResponse instead
 * Estructura de error legacy del backend
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
 * @deprecated Use ErrorResponse instead
 * Error formateado para el frontend (legacy)
 */
export interface FormattedError {
  status: number;
  title: string;
  message: string;
  details?: string[];
  validationErrors?: Map<string, string[]>;
  originalError?: unknown;
}
