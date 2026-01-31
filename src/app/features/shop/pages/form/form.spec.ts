import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { ShopForm } from './form';
import { ShopService } from '../../services/shop';
import { IShopResponse } from '../../interfaces/shop-response.interface';
import { environment } from '../../../../../environments/environment';

describe('ShopForm - MapBox Integration', () => {
  let component: ShopForm;
  let fixture: ComponentFixture<ShopForm>;
  let shopService: ShopService;

  const mockDialogRef = {
    close: vi.fn(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: null },
        { provide: MatDialogRef, useValue: mockDialogRef },
      ],
    });

    shopService = TestBed.inject(ShopService);
    fixture = TestBed.createComponent(ShopForm);
    component = fixture.componentInstance;
  });

  describe('hasValidCoordinates', () => {
    it('debe retornar true cuando ambas coordenadas son válidas', () => {
      vi.spyOn(shopService, 'isValidCoordinate').mockReturnValue(true);

      component.shopModel.update((model) => ({
        ...model,
        latitude: -34.6037,
        longitude: -58.3816,
      }));

      expect(component.hasValidCoordinates()).toBe(true);
    });

    it('debe retornar false cuando los campos son undefined', () => {
      expect(component.hasValidCoordinates()).toBe(false);
    });

    it('debe retornar false cuando las coordenadas son inválidas', () => {
      vi.spyOn(shopService, 'isValidCoordinate').mockReturnValue(false);

      component.shopModel.update((model) => ({
        ...model,
        latitude: 100, // Fuera de rango
        longitude: -58.3816,
      }));

      expect(component.hasValidCoordinates()).toBe(false);
    });
  });

  describe('markerLngLat', () => {
    it('debe retornar [lng, lat] para coordenadas numéricas válidas', () => {
      vi.spyOn(shopService, 'isValidCoordinate').mockReturnValue(true);

      component.shopModel.update((model) => ({
        ...model,
        latitude: -34.6037,
        longitude: -58.3816,
      }));

      expect(component.markerLngLat()).toEqual([-58.3816, -34.6037]);
    });

    it('debe retornar [lng, lat] para coordenadas string válidas', () => {
      vi.spyOn(shopService, 'isValidCoordinate').mockReturnValue(true);

      component.shopModel.update((model) => ({
        ...model,
        latitude: '-34.6037',
        longitude: '-58.3816',
      }));

      expect(component.markerLngLat()).toEqual([-58.3816, -34.6037]);
    });

    it('debe retornar null cuando los campos son undefined', () => {
      expect(component.markerLngLat()).toBeNull();
    });

    it('debe retornar null cuando las coordenadas son inválidas', () => {
      vi.spyOn(shopService, 'isValidCoordinate').mockReturnValue(false);

      component.shopModel.update((model) => ({
        ...model,
        latitude: 100,
        longitude: -58.3816,
      }));

      expect(component.markerLngLat()).toBeNull();
    });
  });

  describe('onMapClick', () => {
    it('debe actualizar el modelo con las coordenadas del click', () => {
      const mockEvent = {
        lngLat: {
          lng: -58.3816,
          lat: -34.6037,
        },
      } as any;

      component.onMapClick(mockEvent);

      expect(component.shopModel().latitude).toBe(-34.6037);
      expect(component.shopModel().longitude).toBe(-58.3816);
    });
  });

  describe('Renderizado e Inicialización del Mapa', () => {
    describe('Propiedades del mapa', () => {
      it('debe configurar las propiedades del mapa correctamente', () => {
        expect(component.mapStyle).toBe(environment.mapbox.style);
        expect(component.mapAccessToken).toBe(environment.mapbox.accessToken);
        expect(component.mapZoom()).toBe(environment.mapbox.defaultZoom);
      });
    });

    describe('Centro del mapa', () => {
      it('debe centrar el mapa en coordenadas válidas de dialogData', () => {
        vi.spyOn(shopService, 'isValidCoordinate').mockReturnValue(true);

        const dialogData: IShopResponse = {
          id: '1',
          name: 'Test Shop',
          description: 'Test Description',
          latitude: -34.6037,
          longitude: -58.3816,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            { provide: MAT_DIALOG_DATA, useValue: dialogData },
            { provide: MatDialogRef, useValue: mockDialogRef },
          ],
        });

        const newFixture = TestBed.createComponent(ShopForm);
        const newComponent = newFixture.componentInstance;

        expect(newComponent.mapCenter()).toEqual([-58.3816, -34.6037]);
      });

      it('debe usar el centro por defecto sin dialogData', () => {
        expect(component.mapCenter()).toEqual(environment.mapbox.defaultCenter);
      });

      it('debe usar el centro por defecto con coordenadas inválidas', () => {
        vi.spyOn(shopService, 'isValidCoordinate').mockReturnValue(false);

        const dialogData: IShopResponse = {
          id: '1',
          name: 'Test Shop',
          description: 'Test Description',
          latitude: 100,
          longitude: 200,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            { provide: MAT_DIALOG_DATA, useValue: dialogData },
            { provide: MatDialogRef, useValue: mockDialogRef },
          ],
        });

        const newFixture = TestBed.createComponent(ShopForm);
        const newComponent = newFixture.componentInstance;

        expect(newComponent.mapCenter()).toEqual(environment.mapbox.defaultCenter);
      });

      it('debe usar el centro por defecto con coordenadas incompletas', () => {
        const dialogData: IShopResponse = {
          id: '1',
          name: 'Test Shop',
          description: 'Test Description',
          latitude: -34.6037,
          longitude: undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            { provide: MAT_DIALOG_DATA, useValue: dialogData },
            { provide: MatDialogRef, useValue: mockDialogRef },
          ],
        });

        const newFixture = TestBed.createComponent(ShopForm);
        const newComponent = newFixture.componentInstance;

        expect(newComponent.mapCenter()).toEqual(environment.mapbox.defaultCenter);
      });
    });

    describe('Estado del marcador', () => {
      it('debe inicializar markerPosition con coordenadas válidas', () => {
        vi.spyOn(shopService, 'isValidCoordinate').mockReturnValue(true);

        const dialogData: IShopResponse = {
          id: '1',
          name: 'Test Shop',
          description: 'Test Description',
          latitude: -34.6037,
          longitude: -58.3816,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            { provide: MAT_DIALOG_DATA, useValue: dialogData },
            { provide: MatDialogRef, useValue: mockDialogRef },
          ],
        });

        const newFixture = TestBed.createComponent(ShopForm);
        const newComponent = newFixture.componentInstance;

        // markerPosition es privado, pero podemos verificar que markerLngLat retorna el valor correcto
        expect(newComponent.markerLngLat()).toEqual([-58.3816, -34.6037]);
      });

      it('markerPosition debe ser null sin coordenadas válidas', () => {
        expect(component.markerLngLat()).toBeNull();
      });
    });
  });
});
