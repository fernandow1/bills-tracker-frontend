import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración de Playwright para tests E2E
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  /* Tiempo máximo por test */
  timeout: 30 * 1000,
  /* Configuración de espera por assertions */
  expect: {
    timeout: 5000,
  },
  /* Ejecutar tests en paralelo */
  fullyParallel: true,
  /* Fallar el build en CI si dejaste test.only */
  forbidOnly: !!process.env.CI,
  /* Reintentar tests fallidos en CI */
  retries: process.env.CI ? 2 : 0,
  /* Workers en paralelo */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter - html para desarrollo, list para CI */
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'html',

  /* Configuración compartida para todos los proyectos */
  use: {
    /* URL base para usar en page.goto('/') */
    baseURL: 'http://localhost:4200',
    /* Ignorar políticas de CSP para permitir mocks de API */
    bypassCSP: true,
    /* Trace solo cuando falla */
    trace: 'on-first-retry',
    /* Screenshot solo en fallos */
    screenshot: 'only-on-failure',
  },

  /* Configurar proyectos para diferentes navegadores */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    // WebKit deshabilitado por tests flaky
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Tests en mobile viewports */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  /* Servidor de desarrollo - levantar Angular antes de los tests */
  webServer: {
    command: 'npm start',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
