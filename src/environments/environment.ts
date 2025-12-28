// Environment de desarrollo (default)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  appName: 'Bills Tracker',
  version: '1.0.0',

  // Configuraciones específicas para desarrollo
  enableLogging: true,
  enableDebugMode: true,

  // URLs del API
  endpoints: {
    auth: {
      login: '/auth/login',
      logout: '/auth/logout',
      refresh: '/auth/refresh',
      register: '/users',
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
    categories: {
      list: '/categories',
      search: '/categories/search',
      create: '/categories',
      update: '/categories/:id',
      delete: '/categories/:id',
      byId: '/categories/:id',
    },
    brands: {
      list: '/brands',
      search: '/brands/search',
      create: '/brands',
      update: '/brands/:id',
      delete: '/brands/:id',
      byId: '/brands/:id',
    },
    products: {
      list: '/products',
      search: '/products/search',
      create: '/products',
      update: '/products/:id',
      delete: '/products/:id',
      byId: '/products/:id',
    },
    shops: {
      list: '/shops',
      search: '/shops/search',
      create: '/shops',
      update: '/shops/:id',
      delete: '/shops/:id',
      byId: '/shops/:id',
    },
  },

  // Configuraciones de tokens y sesión
  auth: {
    tokenKey: 'bills_tracker_token',
    userKey: 'bills_tracker_user',
    refreshTokenKey: 'bills_tracker_refresh_token',
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 horas en milisegundos
    refreshThreshold: 5 * 60 * 1000, // 5 minutos antes de expirar
  },

  // Configuraciones de la aplicación
  app: {
    defaultLanguage: 'es',
    supportedLanguages: ['es', 'en'],
    defaultTheme: 'system', // 'light', 'dark', 'system'
    enableNotifications: true,
    maxFileUploadSize: 5 * 1024 * 1024, // 5MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },
};
