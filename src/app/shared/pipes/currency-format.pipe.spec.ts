import { describe, it, expect } from 'vitest';
import { CurrencyFormatPipe } from './currency-format.pipe';

describe('CurrencyFormatPipe', () => {
  let pipe: CurrencyFormatPipe;

  beforeEach(() => {
    pipe = new CurrencyFormatPipe();
  });

  describe('transform', () => {
    it('should format integer values without cents', () => {
      expect(pipe.transform(1000)).toBe('$ 1.000');
      expect(pipe.transform(100)).toBe('$ 100');
      expect(pipe.transform(1)).toBe('$ 1');
      expect(pipe.transform(0)).toBe('$ 0');
    });

    it('should format values with decimals', () => {
      expect(pipe.transform(1234.56)).toBe('$ 1.234,56');
      expect(pipe.transform(99.99)).toBe('$ 99,99');
      expect(pipe.transform(0.5)).toBe('$ 0,50');
      expect(pipe.transform(0.01)).toBe('$ 0,01');
    });

    it('should handle large numbers', () => {
      expect(pipe.transform(1000000)).toBe('$ 1.000.000');
      expect(pipe.transform(1234567.89)).toBe('$ 1.234.567,89');
      expect(pipe.transform(999999999)).toBe('$ 999.999.999');
    });

    it('should handle negative values', () => {
      expect(pipe.transform(-100)).toBe('-$ 100');
      expect(pipe.transform(-1234.56)).toBe('-$ 1.234,56');
      expect(pipe.transform(-1000000)).toBe('-$ 1.000.000');
    });

    it('should handle zero', () => {
      expect(pipe.transform(0)).toBe('$ 0');
    });

    it('should handle null values', () => {
      expect(pipe.transform(null)).toBe('$ 0');
    });

    it('should handle undefined values', () => {
      expect(pipe.transform(undefined)).toBe('$ 0');
    });

    it('should handle NaN values', () => {
      expect(pipe.transform(NaN)).toBe('$ 0');
    });

    it('should use custom currency symbol', () => {
      expect(pipe.transform(1000, 'USD')).toBe('USD 1.000');
    });

    it('should format negative numbers', () => {
      expect(pipe.transform(-1234.56)).toBe('-$ 1.234,56');
    });

    it('should format negative numbers without decimals', () => {
      const result = pipe.transform(-5000);
      expect(result).toBe('-$ 5.000');
    });

    it('should handle very large numbers', () => {
      const result = pipe.transform(1234567.89);
      expect(result).toBe('$ 1.234.567,89');
    });

    it('should handle very small decimals', () => {
      const result = pipe.transform(0.01);
      expect(result).toBe('$ 0,01');
    });

    it('should handle custom currency symbol', () => {
      const result = pipe.transform(1000, '€');
      expect(result).toBe('€ 1.000');
    });

    it('should handle very large numbers', () => {
      const result = pipe.transform(1234567890.99);
      expect(result).toBe('$ 1.234.567.890,99');
    });
  });
});
