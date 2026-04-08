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
const manifestPath = path.join(__dirname, '..', 'public', 'manifest.webmanifest');

try {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log('✅ config.json generated successfully');
  console.log('📍 Location:', configPath);

  // Actualizar manifest.webmanifest dinámicamente si existe
  if (fs.existsSync(manifestPath)) {
    const rawManifest = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(rawManifest);

    // Sobreescribir con variables de entorno o usar valores por defecto
    manifest.name = process.env['PWA_APP_NAME'] || 'Bills Tracker';
    manifest.short_name = process.env['PWA_SHORT_NAME'] || 'Bills';
    manifest.theme_color = process.env['PWA_THEME_COLOR'] || '#1976d2';
    manifest.background_color = process.env['PWA_BACKGROUND_COLOR'] || '#ffffff';

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log('✅ manifest.webmanifest updated successfully from environment variables');
  }

  // Actualizar vercel.json dinámicamente si existe
  const vercelPath = path.join(__dirname, '..', 'vercel.json');
  if (fs.existsSync(vercelPath)) {
    const rawVercel = fs.readFileSync(vercelPath, 'utf8');
    let vercelConfig = JSON.parse(rawVercel);
    const apiUrl = process.env['API_BASE_URL'] || 'http://localhost:3000';

    if (vercelConfig.headers) {
      vercelConfig.headers.forEach((headerRule) => {
        if (headerRule.headers) {
          headerRule.headers.forEach((header) => {
            if (header.key === 'Content-Security-Policy') {
              // Reemplazar el connect-src con la URL de la API actual
              header.value = header.value.replace(
                /connect-src 'self' [^;]+;/,
                `connect-src 'self' ${apiUrl};`
              );
            }
          });
        }
      });
    }

    fs.writeFileSync(vercelPath, JSON.stringify(vercelConfig, null, 2));
    console.log('✅ vercel.json updated successfully with API_BASE_URL in CSP');
  }
} catch (error) {
  console.error('❌ Error generating config files:', error);
  process.exit(1);
}
