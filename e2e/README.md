# Playwright E2E Testing Strategy

Este directorio contiene la suite de pruebas End-to-End (E2E) optimizada para Bills Tracker. Hemos rediseñado la estrategia para que los tests sean rápidos, deterministas y fáciles de mantener.

## 🚀 Estrategia de Pruebas

Para maximizar la eficiencia y evitar la fragilidad típica de los tests E2E, utilizamos las siguientes técnicas:

### 1. Bypass de Autenticación (Login Rápido)
No realizamos el flujo de Login por UI en cada test. En su lugar, inyectamos directamente el estado de la sesión en el `localStorage` mediante `page.addInitScript`.
- **Beneficio**: Ahorra ~5-10 segundos por cada test.
- **Implementación**: Generamos un token JWT estructurado con fecha de expiración futura para engañar al `TokenService` de Angular.

### 2. Mocking de API y Configuración
Aislamos completamente el frontend del backend real:
- **`config.json`**: Interceptamos la petición al archivo de configuración para forzar la URL del API a `localhost:3000`. Esto evita que la app intente conectarse a producción durante los tests.
- **Endpoints del API**: Utilizamos `page.route` para interceptar las llamadas al API y devolver datos controlados. Esto permite probar casos de éxito, error y estados de carga (usando delays) sin depender de una base de datos real.

### 3. Bypass de CSP (Content Security Policy)
Para permitir que el frontend (en `localhost:4200`) se comunique con el API mockeado (en `localhost:3000`) sin violar las políticas de seguridad, hemos habilitado `bypassCSP: true` en `playwright.config.ts`.

## 📂 Estructura de Tests

```
e2e/
└── payment-methods/
    └── payment-method.spec.ts  # Ejemplo de referencia (CRUD completo)
```

## 🛠️ Ejecución Local

```bash
# Ejecutar tests con 1 worker (recomendado para estabilidad local)
npm run test:e2e -- --workers=1

# Abrir la UI interactiva de Playwright
npm run test:e2e:ui
```

## 🏗️ Integración Continua (CI/CD)

Los tests se ejecutan automáticamente en Jenkins mediante el stage `Test E2E`.
- **Entorno**: Se instalan los navegadores y sus dependencias necesarias.
- **Reportes**: Playwright genera un reporte HTML que puede ser consultado en caso de fallo.

## 💡 Mejores Prácticas
- **Selectores**: Usa `page.getByRole`, `page.getByLabel` o `page.getByText`. Evita clases CSS que puedan cambiar.
- **Aislamiento**: Cada test debe ser independiente. Usa `test.beforeEach` para preparar el estado.
- **Sincronización**: Playwright tiene auto-waiting, pero para componentes complejos de Material, a veces es necesario esperar a que un elemento específico (como una celda de tabla) sea visible.
