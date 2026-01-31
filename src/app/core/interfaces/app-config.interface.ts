export interface AppConfig {
  mapbox: {
    accessToken: string;
    defaultCenter: {
      lng: number;
      lat: number;
    };
    defaultZoom: number;
    style: string;
  };
  api: {
    baseUrl: string;
  };
}
