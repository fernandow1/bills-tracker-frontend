# Playwright E2E Tests

Este directorio contiene los tests E2E (end-to-end) para la aplicación Bills Tracker.

## Estructura

```
e2e/
├── categories/         # Tests del módulo de categorías
│   └── category.spec.ts
├── auth/              # Tests de autenticación (TODO)
└── ...                # Otros módulos
```

## Ejecutar Tests

```bash
# Ejecutar todos los tests E2E
npm run test:e2e

# Ejecutar con UI interactiva (recomendado para desarrollo)
npm run test:e2e:ui

# Ejecutar con navegador visible (headed mode)
npm run test:e2e:headed

# Ejecutar en modo debug
npm run test:e2e:debug

# Ver el reporte HTML de la última ejecución
npm run test:e2e:report
```

## Ejecutar tests específicos

```bash
# Solo tests de categorías
npx playwright test categories

# Un archivo específico
npx playwright test e2e/categories/category.spec.ts

# Un test específico por nombre
npx playwright test -g "should create a new category"

# Solo en Chromium
npx playwright test --project=chromium
```

## Configuración

La configuración está en `playwright.config.ts` en la raíz del proyecto.

### Características clave:

- ✅ Multi-navegador (Chromium, Firefox, WebKit)
- ✅ Auto-inicia el servidor de desarrollo Angular
- ✅ Screenshots en fallos
- ✅ Trace para debugging
- ✅ Tests paralelos
- ✅ Reintentos automáticos en CI

## Tips para escribir tests

1. **Usa selectores semánticos**: Prefiere roles y texto visible sobre clases CSS

   ```typescript
   page.getByRole('button', { name: 'Crear' });
   page.getByLabel('Nombre');
   page.getByText('Categoría creada');
   ```

2. **Auto-waiting**: Playwright espera automáticamente

   ```typescript
   await page.click('button'); // Espera a que sea clickeable
   await expect(element).toBeVisible(); // Espera a que sea visible
   ```

3. **Mock de APIs**: Para tests aislados

   ```typescript
   await page.route('**/api/categories', route => {
     route.fulfill({ body: JSON.stringify([...]) });
   });
   ```

4. **Usa Page Objects** para tests complejos (crear cuando sea necesario)

## TODO

- [ ] Ajustar selectores según la UI real
- [ ] Agregar tests de autenticación
- [ ] Tests de navegación completa
- [ ] Tests de responsive design
- [ ] Tests de accessibility
