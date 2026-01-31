import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Cargar configuración desde config.json antes de bootstrap
fetch('/config.json')
  .then((response) => {
    if (!response.ok) {
      throw new Error(`Failed to load config.json: ${response.statusText}`);
    }
    return response.json();
  })
  .then((config) => {
    // Guardar config en window para acceso global
    (window as any).__APP_CONFIG__ = config;
    console.log('✅ Configuration loaded successfully');

    // Bootstrap de Angular
    return bootstrapApplication(App, appConfig);
  })
  .catch((err) => {
    console.error('❌ Failed to initialize application:', err);

    // Mostrar error al usuario de forma segura (sin innerHTML)
    const container = document.createElement('div');
    container.style.cssText =
      'display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;';

    const content = document.createElement('div');
    content.style.textAlign = 'center';

    const title = document.createElement('h1');
    title.textContent = '⚠️ Configuration Error';

    const message = document.createElement('p');
    message.textContent = 'Failed to load application configuration.';

    const hint = document.createElement('p');
    hint.style.color = '#666';
    hint.textContent = 'Please check the console for more details.';

    content.appendChild(title);
    content.appendChild(message);
    content.appendChild(hint);
    container.appendChild(content);

    document.body.innerHTML = ''; // Limpiar body
    document.body.appendChild(container);
  });
