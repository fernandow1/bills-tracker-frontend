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
      register: '/users',
      forgotPassword: '/auth/forgot-password',
      resetPassword: '/auth/reset-password',
      profile: '/auth/profile',
    },
    bills: {
      base: '/bills',
      list: '/bills/search',
      create: '/bills',
      update: '/bills/:id',
      delete: '/bills/:id',
      categories: '/bills/categories',
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
    currencies: {
      list: '/currencies',
      search: '/currencies/search',
      create: '/currencies',
      update: '/currencies/:id',
      delete: '/currencies/:id',
      byId: '/currencies/:id',
    },
    paymentMethods: {
      list: '/payment-methods',
      search: '/payment-methods/search',
      create: '/payment-methods',
      update: '/payment-methods/:id',
      delete: '/payment-methods/:id',
      byId: '/payment-methods/:id',
    },
    users: {
      list: '/users',
      search: '/users/search',
      create: '/users',
      update: '/users/:id',
      delete: '/users/:id',
      byId: '/users/:id',
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
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },
};
