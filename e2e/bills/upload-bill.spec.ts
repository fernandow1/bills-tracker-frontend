import { test, expect } from '@playwright/test';

/**
 * Tests E2E para el módulo de Facturas (Carga con Imagen y Metadatos)
 *
 * Estos tests verifican el flujo completo de:
 * 1. Apertura del modal de carga de factura.
 * 2. Carga correcta de listas desplegables (Tiendas, Monedas, Métodos de Pago).
 * 3. Adjuntar archivo de imagen válido.
 * 4. Envío exitoso del payload al backend.
 * 5. Manejo de estado visual (deshabilitación de botones y spinners).
 */

test.describe('Bill Upload Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login inicial
    await page.goto('/auth/login');

    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'test-token-bills',
          user: {
            id: 'user-test',
            username: 'testuser',
            email: 'test@example.com',
          },
        }),
      });
    });

    await page.getByLabel('Usuario').fill('testuser');
    await page.getByLabel('Contraseña').fill('password123');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();

    await page.waitForURL(/.*dashboard|bills/, { timeout: 5000 });

    // Mock para la ruta de listado de bills básico para evitar errores al cargar la vista
    await page.route('**/api/bills/search*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ count: 0, data: [] }),
      });
    });

    // Mock endpoints de dependencias del modal
    await page.route('**/api/shops/search*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: 1,
          data: [{ id: 1, name: 'Tienda Test' }]
        }),
      });
    });

    await page.route('**/api/currencies*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, name: 'Dólar', code: 'USD' }
        ]),
      });
    });

    await page.route('**/api/payment-methods*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { uuid: 'pm-123', name: 'Tarjeta de Crédito' }
        ]),
      });
    });

    await page.goto('/bills');
  });

  test('should open the upload modal and display required elements', async ({ page }) => {
    await page.getByRole('button', { name: /subir imagen/i }).click();

    // Verificar modal visible
    const dialog = page.locator('mat-dialog-container');
    await expect(dialog).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Subir Factura' })).toBeVisible();

    // Verificar inputs y selectores
    await expect(page.getByLabel('Fecha de Compra')).toBeVisible();
    await expect(page.locator('mat-select[formControlName="idShop"]')).toBeVisible();
    await expect(page.locator('mat-select[formControlName="idCurrency"]')).toBeVisible();
    await expect(page.locator('mat-select[formControlName="uuidPaymentMethod"]')).toBeVisible();
    await expect(page.getByLabel('Notas adicionales (opcional)')).toBeVisible();

    // Verificar botón de subida deshabilitado sin archivo
    const uploadButton = page.getByRole('button', { name: 'Subir', exact: true });
    await expect(uploadButton).toBeDisabled();
  });

  test('should successfully attach an image, fill metadata, and upload', async ({ page }) => {
    await page.getByRole('button', { name: /subir imagen/i }).click();

    // Llenar datos de los dropdowns (Shop, Currency, Payment Method)
    await page.locator('mat-select[formControlName="idShop"]').focus();
    await page.locator('mat-select[formControlName="idShop"]').press('Enter');
    await page.getByRole('option', { name: 'Tienda Test' }).click();

    await page.locator('mat-select[formControlName="idCurrency"]').focus();
    await page.locator('mat-select[formControlName="idCurrency"]').press('Enter');
    await page.getByRole('option', { name: 'Dólar (USD)' }).click();

    await page.locator('mat-select[formControlName="uuidPaymentMethod"]').focus();
    await page.locator('mat-select[formControlName="uuidPaymentMethod"]').press('Enter');
    await page.getByRole('option', { name: 'Tarjeta de Crédito' }).click();

    // Llenar nota
    await page.getByLabel('Notas adicionales (opcional)').fill('Nota E2E');

    // Adjuntar archivo (reemplazar con un archivo en buffer simulado)
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'factura.png',
      mimeType: 'image/png',
      buffer: Buffer.from('89504E470D0A1A0A', 'hex') // Minimal valid mock image buffer
    });

    // Verificar que se activa la vista previa y se habilita el botón
    await expect(page.locator('.image-preview')).toBeVisible();
    const uploadButton = page.getByRole('button', { name: 'Subir', exact: true });
    await expect(uploadButton).toBeEnabled();

    // Interceptar la solicitud real de subida verificando multipart
    let isMultipartUpload = false;
    await page.route('**/api/bills/extract-image*', async (route) => {
      const isPost = route.request().method() === 'POST';
      const isMultipart = route.request().headers()['content-type']?.includes('multipart/form-data');
      if (isPost && isMultipart) {
        isMultipartUpload = true;
      }
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Imagen procesada',
        }),
      });
    });

    // Subir la imagen
    await uploadButton.click();

    // Verificar cierre de modal tras éxito
    await expect(page.locator('mat-dialog-container')).not.toBeVisible({ timeout: 5000 });

    // Verificar que se usó el formato esperado (usando expect externo al interceptor)
    expect(isMultipartUpload).toBeTruthy();
  });

  test('should handle upload errors properly and maintain modal open', async ({ page }) => {
    await page.getByRole('button', { name: /subir imagen/i }).click();

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'factura_error.png',
      mimeType: 'image/png',
      buffer: Buffer.from('89504E470D0A1A0A', 'hex')
    });

    await page.route('**/api/bills/extract-image*', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Validation Failed' }),
      });
    });

    await page.getByRole('button', { name: 'Subir', exact: true }).click();

    // El error debe mostrarse y el modal NO debe cerrarse
    await expect(page.locator('.error-message')).toHaveText(/Error al subir la imagen/i);
    await expect(page.locator('mat-dialog-container')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Subir', exact: true })).toBeEnabled(); // Reactivado tras error
  });
});
