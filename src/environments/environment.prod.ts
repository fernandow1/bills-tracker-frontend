// Environment de producción
export const environment = {
  production: true,
  apiUrl: 'https://api.billstracker.com/api', // URL de producción
  appName: 'Bills Tracker',
  version: '1.0.0',

  // Configuraciones específicas para producción
  enableLogging: false,
  enableDebugMode: false,

  // URLs del API (mismas que desarrollo, cambiaría la base URL)
  endpoints: {
    auth: {
      login: '/auth/login',
      logout: '/auth/logout',
      refresh: '/auth/refresh',
      register: '/auth/register',
      forgotPassword: '/auth/forgot-password',
      resetPassword: '/auth/reset-password',
      profile: '/auth/profile',
    },
    bills: {
      base: '/bills',
      list: '/bills',
      create: '/bills',
      update: '/bills/:id',
      delete: '/bills/:id',
      categories: '/bills/categories',
    },
    users: {
      profile: '/users/profile',
      update: '/users/profile',
      preferences: '/users/preferences',
    },
  },

  // Configuraciones de tokens y sesión
  auth: {
    tokenKey: 'bills_tracker_token',
    userKey: 'bills_tracker_user',
    refreshTokenKey: 'bills_tracker_refresh_token',
    sessionTimeout: 8 * 60 * 60 * 1000, // 8 horas en producción
    refreshThreshold: 10 * 60 * 1000, // 10 minutos antes de expirar
  },

  // Configuraciones de la aplicación
  app: {
    defaultLanguage: 'es',
    supportedLanguages: ['es', 'en'],
    defaultTheme: 'system',
    enableNotifications: true,
    maxFileUploadSize: 10 * 1024 * 1024, // 10MB en producción
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
};
