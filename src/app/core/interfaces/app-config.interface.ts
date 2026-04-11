export interface AppConfig {
  api: {
    baseUrl: string;
  };
  mapbox: {
    accessToken: string;
    defaultCenter: {
      lng: number;
      lat: number;
    };
    defaultZoom: number;
    style: string;
  };
}

export interface Environment {
  production: boolean;
  apiUrl: string;
  appName: string;
  version: string;
  enableLogging: boolean;
  enableDebugMode: boolean;
  endpoints: {
    auth: {
      login: string;
      logout: string;
      refresh: string;
      register: string;
      forgotPassword: string;
      resetPassword: string;
      profile: string;
    };
    bills: {
      base: string;
      list: string;
      create: string;
      update: string;
      delete: string;
      categories: string;
      upload: string;
    };
    categories: {
      list: string;
      search: string;
      create: string;
      update: string;
      delete: string;
      byId: string;
    };
    brands: {
      list: string;
      search: string;
      create: string;
      update: string;
      delete: string;
      byId: string;
    };
    products: {
      list: string;
      search: string;
      create: string;
      update: string;
      delete: string;
      byId: string;
    };
    shops: {
      list: string;
      search: string;
      create: string;
      update: string;
      delete: string;
      byId: string;
    };
    currencies: {
      list: string;
      search: string;
      create: string;
      update: string;
      delete: string;
      byId: string;
    };
    paymentMethods: {
      list: string;
      search: string;
      create: string;
      update: string;
      delete: string;
      byId: string;
    };
    users: {
      list: string;
      search: string;
      create: string;
      update: string;
      delete: string;
      byId: string;
    };
  };
  auth: {
    tokenKey: string;
    userKey: string;
    refreshTokenKey: string;
    sessionTimeout: number;
    refreshThreshold: number;
  };
  app: {
    defaultLanguage: string;
    supportedLanguages: string[];
    defaultTheme: string;
    enableNotifications: boolean;
    maxFileUploadSize: number;
    allowedImageTypes: string[];
  };
  mapbox: {
    accessToken: string;
    defaultCenter: [number, number];
    defaultZoom: number;
    style: string;
  };
}
