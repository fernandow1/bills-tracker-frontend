import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfigService } from './config.service';

describe('ConfigService', () => {
  let service: ConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConfigService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('API Configuration', () => {
    it('should return apiUrl', () => {
      expect(service.apiUrl).toBeDefined();
      expect(typeof service.apiUrl).toBe('string');
    });

    it('should return authEndpoints', () => {
      expect(service.authEndpoints).toBeDefined();
      expect(service.authEndpoints).toHaveProperty('login');
      expect(service.authEndpoints).toHaveProperty('logout');
      expect(service.authEndpoints).toHaveProperty('refresh');
    });

    it('should return billsEndpoints', () => {
      expect(service.billsEndpoints).toBeDefined();
      expect(service.billsEndpoints).toHaveProperty('create');
      expect(service.billsEndpoints).toHaveProperty('list');
    });

    it('should return usersEndpoints', () => {
      expect(service.usersEndpoints).toBeDefined();
    });

    it('should return categoryEndpoints', () => {
      expect(service.categoryEndpoints).toBeDefined();
      expect(service.categoryEndpoints).toHaveProperty('create');
      expect(service.categoryEndpoints).toHaveProperty('list');
    });

    it('should return brandEndpoints', () => {
      expect(service.brandEndpoints).toBeDefined();
      expect(service.brandEndpoints).toHaveProperty('create');
      expect(service.brandEndpoints).toHaveProperty('list');
    });

    it('should return productEndpoints', () => {
      expect(service.productEndpoints).toBeDefined();
      expect(service.productEndpoints).toHaveProperty('create');
      expect(service.productEndpoints).toHaveProperty('list');
    });

    it('should return shopEndpoints', () => {
      expect(service.shopEndpoints).toBeDefined();
      expect(service.shopEndpoints).toHaveProperty('create');
      expect(service.shopEndpoints).toHaveProperty('list');
    });

    it('should return currencyEndpoints', () => {
      expect(service.currencyEndpoints).toBeDefined();
      expect(service.currencyEndpoints).toHaveProperty('list');
    });

    it('should return paymentMethodEndpoints', () => {
      expect(service.paymentMethodEndpoints).toBeDefined();
      expect(service.paymentMethodEndpoints).toHaveProperty('create');
      expect(service.paymentMethodEndpoints).toHaveProperty('list');
    });

    it('should return authConfig', () => {
      expect(service.authConfig).toBeDefined();
      expect(service.authConfig).toHaveProperty('tokenKey');
      expect(service.authConfig).toHaveProperty('userKey');
    });
  });

  describe('buildApiUrl', () => {
    it('should build complete API URL', () => {
      const endpoint = '/test';
      const result = service.buildApiUrl(endpoint);

      expect(result).toContain(service.apiUrl);
      expect(result).toContain(endpoint);
      expect(result).toBe(`${service.apiUrl}${endpoint}`);
    });

    it('should handle endpoints with leading slash', () => {
      const result = service.buildApiUrl('/api/test');
      expect(result).toContain('/api/test');
    });

    it('should handle endpoints without leading slash', () => {
      const result = service.buildApiUrl('api/test');
      expect(result).toContain('api/test');
    });
  });

  describe('Static logging methods', () => {
    beforeEach(() => {
      vi.spyOn(console, 'log').mockImplementation(() => {});
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    it('should log messages with ConfigService.log', () => {
      ConfigService.log('Test message', 'arg1', 'arg2');

      // El log podría o no ejecutarse dependiendo de enableLogging
      // Solo verificamos que no arroje error
      expect(console.log).toHaveBeenCalledTimes(1);
    });

    it('should log errors with ConfigService.error', () => {
      const error = new Error('Test error');
      ConfigService.error('Error message', error);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('ERROR'),
        'Error message',
        error,
      );
    });

    it('should log warnings with ConfigService.warn', () => {
      ConfigService.warn('Warning message', 'detail');

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('WARN'),
        'Warning message',
        'detail',
      );
    });

    it('should handle error without error object', () => {
      ConfigService.error('Error message');

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('ERROR'),
        'Error message',
        undefined,
      );
    });

    it('should handle log with multiple arguments', () => {
      ConfigService.log('Message', 1, true, { key: 'value' });

      expect(console.log).toHaveBeenCalled();
    });

    it('should handle warn with multiple arguments', () => {
      ConfigService.warn('Warning', 'detail1', 'detail2');

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('WARN'),
        'Warning',
        'detail1',
        'detail2',
      );
    });
  });
});
