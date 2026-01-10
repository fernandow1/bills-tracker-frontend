// Environment de desarrollo (default)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  appName: 'Bills Tracker',
  version: '1.0.0',

  // Configuraciones específicas para desarrollo
  enableLogging: true,
  enableDebugMode: true,

  // URLs del API
  endpoints: {
    auth: {
      login: '/api/auth/login',
      logout: '/api/auth/logout',
      refresh: '/api/auth/refresh',
      register: '/api/users',
      forgotPassword: '/api/auth/forgot-password',
      resetPassword: '/api/auth/reset-password',
      profile: '/api/auth/profile',
    },
    bills: {
      base: '/api/bills',
      list: '/api/bills/search',
      create: '/api/bills',
      update: '/api/bills/:id',
      delete: '/api/bills/:id',
      categories: '/api/bills/categories',
    },
    categories: {
      list: '/api/categories',
      search: '/api/categories/search',
      create: '/api/categories',
      update: '/api/categories/:id',
      delete: '/api/categories/:id',
      byId: '/api/categories/:id',
    },
    brands: {
      list: '/api/brands',
      search: '/api/brands/search',
      create: '/api/brands',
      update: '/api/brands/:id',
      delete: '/api/brands/:id',
      byId: '/api/brands/:id',
    },
    products: {
      list: '/api/products',
      search: '/api/products/search',
      create: '/api/products',
      update: '/api/products/:id',
      delete: '/api/products/:id',
      byId: '/api/products/:id',
    },
    shops: {
      list: '/api/shops',
      search: '/api/shops/search',
      create: '/api/shops',
      update: '/api/shops/:id',
      delete: '/api/shops/:id',
      byId: '/api/shops/:id',
    },
    currencies: {
      list: '/api/currencies',
      search: '/api/currencies/search',
      create: '/api/currencies',
      update: '/api/currencies/:id',
      delete: '/api/currencies/:id',
      byId: '/api/currencies/:id',
    },
    paymentMethods: {
      list: '/api/payment-methods',
      search: '/api/payment-methods/search',
      create: '/api/payment-methods',
      update: '/api/payment-methods/:id',
      delete: '/api/payment-methods/:id',
      byId: '/api/payment-methods/:id',
    },
    users: {
      list: '/api/users',
      search: '/api/users/search',
      create: '/api/users',
      update: '/api/users/:id',
      delete: '/api/users/:id',
      byId: '/api/users/:id',
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
