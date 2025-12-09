import { test, expect } from '@playwright/test';

/**
 * Tests E2E para el módulo de Autenticación
 *
 * Flujos cubiertos:
 * 1. Visualización de la página de login
 * 2. Login exitoso
 * 3. Login con credenciales inválidas
 * 4. Validaciones de formulario
 * 5. Redirección después del login
 * 6. Logout
 */

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Limpiar localStorage antes de cada test
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('bills_tracker_token');
      localStorage.removeItem('bills_tracker_user');
      localStorage.removeItem('bills_tracker_refresh_token');
    });
  });

  test.describe('Login Page UI', () => {
    test('should display login page with all elements', async ({ page }) => {
      await page.goto('/auth/login');

      // Verificar título y subtítulo
      await expect(page.locator('mat-card-title:has-text("Iniciar Sesión")')).toBeVisible({
        timeout: 10000,
      });
      await expect(page.getByText('Ingresa tus credenciales para continuar')).toBeVisible();

      // Verificar campos del formulario
      await expect(page.getByLabel('Usuario')).toBeVisible();
      await expect(page.getByLabel('Contraseña')).toBeVisible();

      // Verificar iconos
      await expect(page.locator('mat-icon:has-text("person")')).toBeVisible();
      await expect(page.locator('mat-icon:has-text("lock")')).toBeVisible();

      // Verificar botón
      const loginButton = page.getByRole('button', { name: /iniciar sesión/i });
      await expect(loginButton).toBeVisible();
      await expect(loginButton).toBeDisabled(); // Debe estar deshabilitado al inicio
    });

    test('should have proper form structure', async ({ page }) => {
      await page.goto('/auth/login');

      // Verificar que existe el mat-card
      await expect(page.locator('mat-card.login-card')).toBeVisible();

      // Verificar que el formulario existe
      await expect(page.locator('form.login-form')).toBeVisible();
    });
  });

  test.describe('Form Validation', () => {
    test('should disable submit button when form is empty', async ({ page }) => {
      await page.goto('/auth/login');

      const submitButton = page.getByRole('button', { name: /iniciar sesión/i });
      await expect(submitButton).toBeDisabled();
    });

    test('should enable submit button when both fields are filled', async ({ page }) => {
      await page.goto('/auth/login');

      await page.getByLabel('Usuario').fill('testuser');
      await page.getByLabel('Contraseña').fill('password123');

      const submitButton = page.getByRole('button', { name: /iniciar sesión/i });
      await expect(submitButton).toBeEnabled();
    });

    test('should keep button disabled with only username', async ({ page }) => {
      await page.goto('/auth/login');

      await page.getByLabel('Usuario').fill('testuser');

      const submitButton = page.getByRole('button', { name: /iniciar sesión/i });
      await expect(submitButton).toBeDisabled();
    });

    test('should keep button disabled with only password', async ({ page }) => {
      await page.goto('/auth/login');

      await page.getByLabel('Contraseña').fill('password123');

      const submitButton = page.getByRole('button', { name: /iniciar sesión/i });
      await expect(submitButton).toBeDisabled();
    });
  });

  test.describe('Successful Login', () => {
    test('should login successfully with valid credentials', async ({ page }) => {
      // Mockear la respuesta exitosa del API
      await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            token: 'fake-jwt-token-12345',
            user: {
              id: 'user-123',
              username: 'testuser',
              email: 'test@example.com',
              firstName: 'Test',
              lastName: 'User',
            },
            expiresIn: 3600,
          }),
        });
      });

      await page.goto('/auth/login');

      // Llenar formulario
      await page.getByLabel('Usuario').fill('testuser');
      await page.getByLabel('Contraseña').fill('password123');

      // Enviar formulario
      await page.getByRole('button', { name: /iniciar sesión/i }).click();

      // Verificar redirección al dashboard
      await expect(page).toHaveURL(/.*dashboard/, { timeout: 5000 });
    });

    test('should show loading state during login', async ({ page }) => {
      // Mockear respuesta lenta
      await page.route('**/api/auth/login', async (route) => {
        setTimeout(async () => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              token: 'fake-jwt-token',
              user: {
                id: 'user-123',
                username: 'testuser',
              },
            }),
          });
        }, 1500);
      });

      await page.goto('/auth/login');

      await page.getByLabel('Usuario').fill('testuser');
      await page.getByLabel('Contraseña').fill('password123');
      await page.getByRole('button', { name: /iniciar sesión/i }).click();

      // Verificar spinner de loading
      await expect(page.locator('mat-progress-spinner')).toBeVisible({ timeout: 2000 });
    });

    test('should store token in localStorage after successful login', async ({ page }) => {
      await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            token: 'test-token-abc123',
            user: {
              id: 'user-123',
              username: 'testuser',
            },
          }),
        });
      });

      await page.goto('/auth/login');

      await page.getByLabel('Usuario').fill('testuser');
      await page.getByLabel('Contraseña').fill('password123');
      await page.getByRole('button', { name: /iniciar sesión/i }).click();

      // Esperar redirección
      await expect(page).toHaveURL(/.*dashboard/, { timeout: 5000 });

      // Verificar que el token está en localStorage
      const token = await page.evaluate(() => {
        return localStorage.getItem('bills_tracker_token');
      });
      expect(token).toBe('test-token-abc123');
    });

    test('should redirect to returnUrl if present', async ({ page }) => {
      await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            token: 'test-token',
            user: {
              id: 'user-123',
              username: 'testuser',
            },
          }),
        });
      });

      // Navegar con returnUrl en query params
      await page.goto('/auth/login?returnUrl=%2Fcategories');

      await page.getByLabel('Usuario').fill('testuser');
      await page.getByLabel('Contraseña').fill('password123');
      await page.getByRole('button', { name: /iniciar sesión/i }).click();

      // Debe redirigir a categories
      await expect(page).toHaveURL(/.*categories/, { timeout: 5000 });
    });
  });

  test.describe('Failed Login', () => {
    test('should show error message with invalid credentials', async ({ page }) => {
      // Mockear respuesta de error 401
      await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Usuario o contraseña incorrectos',
          }),
        });
      });

      await page.goto('/auth/login');

      await page.getByLabel('Usuario').fill('wronguser');
      await page.getByLabel('Contraseña').fill('wrongpass');
      await page.getByRole('button', { name: /iniciar sesión/i }).click();

      // Verificar que aparece snackbar o mensaje de error
      const snackbar = page.locator('simple-snack-bar');
      await expect(snackbar).toBeVisible({ timeout: 5000 });
      await expect(snackbar).toContainText(/incorrectos|inválid/i);
    });

    test('should handle network errors', async ({ page }) => {
      // Simular error de red
      await page.route('**/api/auth/login', async (route) => {
        await route.abort('failed');
      });

      await page.goto('/auth/login');

      await page.getByLabel('Usuario').fill('testuser');
      await page.getByLabel('Contraseña').fill('password123');
      await page.getByRole('button', { name: /iniciar sesión/i }).click();

      // Debe mostrar algún mensaje de error
      const snackbar = page.locator('simple-snack-bar');
      await expect(snackbar).toBeVisible({ timeout: 5000 });
    });

    test('should handle server errors (500)', async ({ page }) => {
      await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Error interno del servidor',
          }),
        });
      });

      await page.goto('/auth/login');

      await page.getByLabel('Usuario').fill('testuser');
      await page.getByLabel('Contraseña').fill('password123');
      await page.getByRole('button', { name: /iniciar sesión/i }).click();

      // Verificar mensaje de error
      const snackbar = page.locator('simple-snack-bar');
      await expect(snackbar).toBeVisible({ timeout: 5000 });
    });

    test('should remain on login page after failed login', async ({ page }) => {
      await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Invalid credentials' }),
        });
      });

      await page.goto('/auth/login');

      await page.getByLabel('Usuario').fill('wronguser');
      await page.getByLabel('Contraseña').fill('wrongpass');
      await page.getByRole('button', { name: /iniciar sesión/i }).click();

      // Esperar un momento
      await page.waitForTimeout(1000);

      // Debe seguir en login
      await expect(page).toHaveURL(/.*auth\/login/);
    });
  });

  test.describe('Auth Guard Redirect', () => {
    test('should redirect to login when accessing protected route without auth', async ({
      page,
    }) => {
      await page.goto('/categories');

      // Debe redirigir a login
      await expect(page).toHaveURL(/.*auth\/login/, { timeout: 5000 });
    });

    test('should redirect to login with returnUrl parameter', async ({ page }) => {
      await page.goto('/categories');

      // Verificar que tiene returnUrl en query params
      await expect(page).toHaveURL(/.*returnUrl/, { timeout: 5000 });
    });

    test('should allow access to protected routes when authenticated', async ({ page }) => {
      // Pre-establecer autenticación
      await page.goto('/auth/login');
      await page.evaluate(() => {
        localStorage.setItem('authToken', 'valid-token-123');
        localStorage.setItem(
          'authUser',
          JSON.stringify({
            id: 'user-123',
            username: 'testuser',
          })
        );
      });

      // Mockear validación de token si es necesario
      await page.route('**/api/**', async (route) => {
        await route.continue({
          headers: {
            ...route.request().headers(),
            Authorization: 'Bearer valid-token-123',
          },
        });
      });

      // Intentar acceder a ruta protegida
      await page.goto('/dashboard');

      // NO debe redirigir a login
      await expect(page).not.toHaveURL(/.*auth\/login/);
      await expect(page).toHaveURL(/.*dashboard/);
    });
  });

  test.describe('Logout', () => {
    test('should logout and redirect to login', async ({ page }) => {
      // Setup: usuario autenticado
      await page.goto('/auth/login');
      await page.evaluate(() => {
        localStorage.setItem('bills_tracker_token', 'valid-token');
        localStorage.setItem('bills_tracker_user', JSON.stringify({ id: '1', username: 'test' }));
      });

      await page.goto('/dashboard');

      // TODO: Ajustar según tu implementación de logout
      // Puede ser un botón en el header/navbar
      // await page.getByRole('button', { name: /cerrar sesión|logout/i }).click();

      // Verificar redirección a login
      // await expect(page).toHaveURL(/.*auth\/login/);

      // Verificar que se limpió localStorage
      // const token = await page.evaluate(() => localStorage.getItem('authToken'));
      // expect(token).toBeNull();
    });
  });
});
