/// <reference types="vite/client" />

interface ImportMetaEnv {
  // API Configuration
  readonly VITE_API_URL: string;

  // MapBox Configuration
  readonly VITE_MAPBOX_ACCESS_TOKEN: string;
  readonly VITE_MAPBOX_DEFAULT_CENTER_LNG: string;
  readonly VITE_MAPBOX_DEFAULT_CENTER_LAT: string;
  readonly VITE_MAPBOX_DEFAULT_ZOOM: string;
  readonly VITE_MAPBOX_STYLE: string;

  // App Configuration
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_ENABLE_LOGGING: string;
  readonly VITE_ENABLE_DEBUG_MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
