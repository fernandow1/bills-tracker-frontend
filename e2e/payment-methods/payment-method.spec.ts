import { test, expect } from '@playwright/test';

/**
 * Tests E2E para el módulo de Métodos de Pago
 */
test.describe('Payment Method Management', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);

    // Diagnóstico
    page.on('console', (msg) => console.log(`[BROWSER ${msg.type()}] ${msg.text()}`));

    // 1. Inyectar sesión
    await page.addInitScript(() => {
      const payload = {
        sub: '1',
        username: 'testuser',
        exp: Math.floor(Date.now() / 1000) + 60 * 60,
        iat: Math.floor(Date.now() / 1000),
      };
      const base64UrlEncode = (obj: unknown) =>
        btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      const fakeToken = `${base64UrlEncode({ alg: 'HS256', typ: 'JWT' })}.${base64UrlEncode(payload)}.signature`;

      window.localStorage.setItem('bills_tracker_token', fakeToken);
      window.localStorage.setItem(
        'bills_tracker_user',
        JSON.stringify({ id: '1', username: 'testuser' }),
      );
      window.localStorage.setItem('bills_tracker_refresh_token', 'fake-refresh-token');
    });

    // 2. Mock de config.json
    await page.route('**/config.json', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          api: { baseUrl: 'http://localhost:3000' },
          mapbox: { accessToken: 'fake-token' },
        }),
      });
    });

    // 3. Mock base de la API
    await page.route('**/api/payment-methods*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              uuid: 'pm-1',
              name: 'Efectivo',
              description: 'Test',
              createdAt: '2026-01-01T10:00:00Z',
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    // 4. Ir a la página
    await page.goto('/payment-methods');
    await page.waitForLoadState('networkidle');
  });

  test.describe('List View', () => {
    test('should display the list with correct columns', async ({ page }) => {
      // Esperar a que aparezca una celda de datos (esto garantiza que la tabla es visible)
      await expect(page.getByRole('cell', { name: 'Efectivo' })).toBeVisible({ timeout: 15000 });

      await expect(page.getByRole('columnheader', { name: 'Nombre' })).toBeVisible();
      await expect(page.locator('table.payment-method-table')).toBeVisible();
    });

    test('should show loading spinner on reload', async ({ page }) => {
      await page.route('**/api/payment-methods*', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await route.fulfill({ status: 200, body: JSON.stringify([]) });
      });

      await page.reload();
      const spinner = page.locator('mat-spinner');
      await expect(spinner).toBeVisible();
      await expect(spinner).not.toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Create Payment Method', () => {
    test('should create a new payment method successfully', async ({ page }) => {
      // Esperar a que la tabla cargue antes de intentar clickear el botón "Nuevo"
      await expect(page.getByRole('cell', { name: 'Efectivo' })).toBeVisible();

      await page.getByRole('button', { name: /nuevo método de pago/i }).click();

      await page.getByLabel('Nombre').fill('Nuevo Método');
      await page.getByLabel('Descripción').fill('Prueba');

      await page.route('**/api/payment-methods', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 201,
            body: JSON.stringify({
              uuid: 'new-123',
              name: 'Nuevo',
              description: 'Prueba',
              createdAt: '2026-01-01T10:00:00Z',
            }),
          });
        }
      });

      await page.getByRole('button', { name: 'Crear' }).click();
      await expect(page.locator('mat-dialog-container')).not.toBeVisible();
    });
  });

  test.describe('Update Payment Method', () => {
    test('should update an existing payment method', async ({ page }) => {
      await expect(page.getByRole('cell', { name: 'Efectivo' })).toBeVisible();

      // Click editar (usando icono)
      await page.locator('button mat-icon:has-text("edit")').first().click();
      await page.getByLabel('Nombre').fill('Editado');

      await page.route('**/api/payment-methods/pm-1', async (route) => {
        if (route.request().method() === 'PATCH') {
          await route.fulfill({
            status: 200,
            body: JSON.stringify({
              uuid: 'pm-1',
              name: 'Editado',
              description: 'Test',
              createdAt: '2026-01-01T10:00:00Z',
            }),
          });
        }
      });

      await page.getByRole('button', { name: 'Actualizar' }).click();
      await expect(page.locator('mat-dialog-container')).not.toBeVisible();
    });
  });
});
