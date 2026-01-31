const fs = require('fs');
const path = require('path');

// Leer variables de entorno
const config = {
  mapbox: {
    accessToken: process.env['MAPBOX_ACCESS_TOKEN'] || '',
    defaultCenter: {
      lng: parseFloat(process.env['MAPBOX_CENTER_LNG'] || '-58.3816'),
      lat: parseFloat(process.env['MAPBOX_CENTER_LAT'] || '-34.6037'),
    },
    defaultZoom: parseInt(process.env['MAPBOX_ZOOM'] || '13', 10),
    style: process.env['MAPBOX_STYLE'] || 'mapbox://styles/mapbox/streets-v12',
  },
  api: {
    baseUrl: process.env['API_BASE_URL'] || 'http://localhost:3000',
  },
};

// Escribir config.json en public/
const configPath = path.join(__dirname, '..', 'public', 'config.json');

try {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log('✅ config.json generated successfully');
  console.log('📍 Location:', configPath);
} catch (error) {
  console.error('❌ Error generating config.json:', error);
  process.exit(1);
}
