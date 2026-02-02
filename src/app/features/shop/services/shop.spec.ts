import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';

import { ShopService } from './shop';
import { IShopData } from '../interfaces/shop-data.interface';

describe('ShopService', () => {
  let service: ShopService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ShopService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Coordinate Mapper', () => {
    it('should convert undefined latitude to null when creating shop', () => {
      const shopData: IShopData = {
        name: 'Test Shop',
        description: 'Test Description',
        latitude: NaN,
        longitude: NaN,
      };

      // Spy on the private trigger to verify the mapped data
      const triggerSpy = vi.spyOn(service['createShopTrigger'], 'set');

      service.createShop(shopData);

      expect(triggerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: null,
          longitude: null,
        }),
      );
    });

    it('should convert empty string coordinates to null', () => {
      const shopData: IShopData = {
        name: 'Test Shop',
        description: 'Test Description',
        latitude: '',
        longitude: '',
      };

      const triggerSpy = vi.spyOn(service['createShopTrigger'], 'set');

      service.createShop(shopData);

      expect(triggerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: null,
          longitude: null,
        }),
      );
    });

    it('should preserve valid number coordinates', () => {
      const shopData: IShopData = {
        name: 'Test Shop',
        description: 'Test Description',
        latitude: 45.5,
        longitude: -73.6,
      };

      const triggerSpy = vi.spyOn(service['createShopTrigger'], 'set');

      service.createShop(shopData);

      expect(triggerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: 45.5,
          longitude: -73.6,
        }),
      );
    });

    it('should convert valid string coordinates to numbers', () => {
      const shopData: IShopData = {
        name: 'Test Shop',
        description: 'Test Description',
        latitude: '45.5',
        longitude: '-73.6',
      };

      const triggerSpy = vi.spyOn(service['createShopTrigger'], 'set');

      service.createShop(shopData);

      expect(triggerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: 45.5,
          longitude: -73.6,
        }),
      );
    });

    it('should preserve zero as a valid coordinate', () => {
      const shopData: IShopData = {
        name: 'Test Shop',
        description: 'Test Description',
        latitude: 0,
        longitude: 0,
      };

      const triggerSpy = vi.spyOn(service['createShopTrigger'], 'set');

      service.createShop(shopData);

      expect(triggerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: 0,
          longitude: 0,
        }),
      );
    });

    it('should convert string zero to number zero', () => {
      const shopData: IShopData = {
        name: 'Test Shop',
        description: 'Test Description',
        latitude: '0',
        longitude: '0',
      };

      const triggerSpy = vi.spyOn(service['createShopTrigger'], 'set');

      service.createShop(shopData);

      expect(triggerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: 0,
          longitude: 0,
        }),
      );
    });

    it('should convert NaN to null', () => {
      const shopData: IShopData = {
        name: 'Test Shop',
        description: 'Test Description',
        latitude: NaN,
        longitude: NaN,
      };

      const triggerSpy = vi.spyOn(service['createShopTrigger'], 'set');

      service.createShop(shopData);

      expect(triggerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: null,
          longitude: null,
        }),
      );
    });

    it('should convert Infinity to null', () => {
      const shopData: IShopData = {
        name: 'Test Shop',
        description: 'Test Description',
        latitude: Infinity,
        longitude: -Infinity,
      };

      const triggerSpy = vi.spyOn(service['createShopTrigger'], 'set');

      service.createShop(shopData);

      expect(triggerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: null,
          longitude: null,
        }),
      );
    });

    it('should convert invalid string coordinates to null', () => {
      const shopData: IShopData = {
        name: 'Test Shop',
        description: 'Test Description',
        latitude: 'invalid',
        longitude: 'not-a-number',
      };

      const triggerSpy = vi.spyOn(service['createShopTrigger'], 'set');

      service.createShop(shopData);

      expect(triggerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: null,
          longitude: null,
        }),
      );
    });

    it('should handle mixed valid and invalid coordinates', () => {
      const shopData: IShopData = {
        name: 'Test Shop',
        description: 'Test Description',
        latitude: 45.5,
        longitude: NaN,
      };

      const triggerSpy = vi.spyOn(service['createShopTrigger'], 'set');

      service.createShop(shopData);

      expect(triggerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: 45.5,
          longitude: null,
        }),
      );
    });

    it('should apply mapper when updating shop', () => {
      const shopData: IShopData = {
        name: 'Updated Shop',
        description: 'Updated Description',
        latitude: '40.7',
        longitude: '',
      };

      const triggerSpy = vi.spyOn(service['updateShopTrigger'], 'set');

      service.updateShop(123, shopData);

      expect(triggerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 123,
          data: expect.objectContaining({
            latitude: 40.7,
            longitude: null,
          }),
        }),
      );
    });

    it('should handle negative coordinates correctly', () => {
      const shopData: IShopData = {
        name: 'Test Shop',
        description: 'Test Description',
        latitude: -90,
        longitude: -180,
      };

      const triggerSpy = vi.spyOn(service['createShopTrigger'], 'set');

      service.createShop(shopData);

      expect(triggerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: -90,
          longitude: -180,
        }),
      );
    });

    it('should handle decimal coordinates with many digits', () => {
      const shopData: IShopData = {
        name: 'Test Shop',
        description: 'Test Description',
        latitude: 45.123456,
        longitude: -73.987654,
      };

      const triggerSpy = vi.spyOn(service['createShopTrigger'], 'set');

      service.createShop(shopData);

      expect(triggerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: 45.123456,
          longitude: -73.987654,
        }),
      );
    });
  });

  describe('isValidCoordinate', () => {
    describe('Casos válidos', () => {
      it('debe retornar true para coordenada numérica válida dentro del rango', () => {
        expect(service.isValidCoordinate(-34.6037, -90, 90)).toBe(true);
        expect(service.isValidCoordinate(-58.3816, -180, 180)).toBe(true);
      });

      it('debe retornar true para coordenada string válida dentro del rango', () => {
        expect(service.isValidCoordinate('-34.6037', -90, 90)).toBe(true);
        expect(service.isValidCoordinate('-58.3816', -180, 180)).toBe(true);
      });

      it('debe retornar true para coordenadas en los límites exactos', () => {
        expect(service.isValidCoordinate(-90, -90, 90)).toBe(true);
        expect(service.isValidCoordinate(90, -90, 90)).toBe(true);
        expect(service.isValidCoordinate(-180, -180, 180)).toBe(true);
        expect(service.isValidCoordinate(180, -180, 180)).toBe(true);
      });

      it('debe retornar true para coordenada cero', () => {
        expect(service.isValidCoordinate(0, -90, 90)).toBe(true);
        expect(service.isValidCoordinate('0', -180, 180)).toBe(true);
      });

      it('debe retornar true para coordenadas decimales con muchos dígitos', () => {
        expect(service.isValidCoordinate(45.123456, -90, 90)).toBe(true);
        expect(service.isValidCoordinate('-73.987654', -180, 180)).toBe(true);
      });

      it('debe retornar true para coordenadas negativas válidas', () => {
        expect(service.isValidCoordinate(-45.5, -90, 90)).toBe(true);
        expect(service.isValidCoordinate('-73.6', -180, 180)).toBe(true);
      });
    });

    describe('Casos inválidos', () => {
      it('debe retornar false para valores undefined', () => {
        expect(service.isValidCoordinate(undefined, -90, 90)).toBe(false);
      });

      it('debe retornar false para valores null', () => {
        expect(service.isValidCoordinate(null as any, -90, 90)).toBe(false);
      });

      it('debe retornar false para string vacío', () => {
        expect(service.isValidCoordinate('', -90, 90)).toBe(false);
      });

      it('debe retornar false para coordenadas que exceden el máximo', () => {
        expect(service.isValidCoordinate(91, -90, 90)).toBe(false);
        expect(service.isValidCoordinate(181, -180, 180)).toBe(false);
      });

      it('debe retornar false para coordenadas que exceden el mínimo', () => {
        expect(service.isValidCoordinate(-91, -90, 90)).toBe(false);
        expect(service.isValidCoordinate(-181, -180, 180)).toBe(false);
      });

      it('debe retornar false para valores NaN', () => {
        expect(service.isValidCoordinate(NaN, -90, 90)).toBe(false);
      });

      it('debe retornar false para strings no numéricos', () => {
        expect(service.isValidCoordinate('abc', -90, 90)).toBe(false);
        expect(service.isValidCoordinate('invalid', -180, 180)).toBe(false);
        expect(service.isValidCoordinate('not-a-number', -90, 90)).toBe(false);
      });

      it('debe retornar false para valores Infinity', () => {
        expect(service.isValidCoordinate(Infinity, -90, 90)).toBe(false);
        expect(service.isValidCoordinate(-Infinity, -90, 90)).toBe(false);
      });
    });
  });
});
