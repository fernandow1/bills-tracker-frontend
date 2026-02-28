import { describe, expect, it } from 'vitest';
import { roundAmount } from './round-amount.helper';

describe('roundAmount', () => {
  describe('Valores básicos', () => {
    it('debe retornar el mismo valor si es un entero', () => {
      expect(roundAmount(10)).toBe(10);
    });

    it('debe retornar cero sin modificación', () => {
      expect(roundAmount(0)).toBe(0);
    });

    it('debe retornar el valor sin cambio si ya tiene 2 decimales exactos', () => {
      expect(roundAmount(1.25)).toBe(1.25);
    });
  });

  describe('Redondeo estándar', () => {
    it('debe redondear hacia arriba cuando el dígito siguiente es >= 5', () => {
      expect(roundAmount(1.005)).toBe(1.01);
    });

    it('debe redondear hacia abajo cuando el dígito siguiente es < 5', () => {
      expect(roundAmount(1.004)).toBe(1);
    });

    it('debe redondear correctamente valores negativos', () => {
      expect(roundAmount(-2.555)).toBe(-2.55);
    });
  });

  describe('Errores de punto flotante', () => {
    it('debe eliminar decimales extra por error de punto flotante', () => {
      // Ejemplo: 0.1 + 0.2 = 0.30000000000000004 en JS
      expect(roundAmount(0.1 + 0.2)).toBe(0.3);
    });

    it('debe manejar correctamente valores con muchos decimales', () => {
      expect(roundAmount(1.2000000001)).toBe(1.2);
    });

    it('debe manejar multiplicaciones con error flotante', () => {
      // 3 items de 0.1: 0.1 * 3 = 0.30000000000000004
      expect(roundAmount(0.1 * 3)).toBe(0.3);
    });
  });

  describe('Cantidad de decimales personalizada', () => {
    it('debe redondear a 0 decimales si se especifica 0', () => {
      expect(roundAmount(2.6, 0)).toBe(3);
    });

    it('debe redondear a 4 decimales si se especifica 4', () => {
      expect(roundAmount(1.12345, 4)).toBe(1.1235);
    });

    it('debe redondear a 1 decimal si se especifica 1', () => {
      expect(roundAmount(3.75, 1)).toBe(3.8);
    });
  });

  describe('Casos extremos', () => {
    it('debe manejar valores grandes correctamente', () => {
      expect(roundAmount(999999.999)).toBe(1000000);
    });

    it('debe manejar valores muy pequeños que redondean a 0', () => {
      expect(roundAmount(0.001)).toBe(0);
    });
  });
});
