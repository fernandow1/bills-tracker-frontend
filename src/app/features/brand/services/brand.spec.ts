import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BrandService } from './brand';
import { ConfigService } from '@core/services/config.service';
import { IBrandData } from '@features/brand/interfaces/brand-data.interface';
import { IBrandResponse } from '@features/brand/interfaces/brand-response.interface';

// Mock del fetch global
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

// Mock del ConfigService
const mockConfigService = {
  buildApiUrl: vi.fn(),
  authConfig: {
    tokenKey: 'token',
    userKey: 'user',
  },
  brandEndpoints: {
    create: '/brands',
    list: '/brands',
    update: '/brands/:id',
    delete: '/brands/:id',
    byId: '/brands/:id',
    search: '/brands/search',
  },
};

describe('BrandService', () => {
  let service: BrandService;
  let configService: ReturnType<typeof vi.mocked<ConfigService>>;

  const mockBrandData: IBrandData = {
    name: 'Test Brand',
  };

  const mockBrandResponse: IBrandResponse = {
    id: '123',
    name: 'Test Brand',
    createdAt: '2025-12-07T00:00:00Z',
    updatedAt: '2025-12-07T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockFetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([]),
      status: 200,
      statusText: 'OK',
    });

    TestBed.configureTestingModule({
      providers: [BrandService, { provide: ConfigService, useValue: mockConfigService }],
    });

    service = TestBed.inject(BrandService);
    configService = TestBed.inject(ConfigService) as ReturnType<typeof vi.mocked<ConfigService>>;

    configService.buildApiUrl.mockReturnValue('http://localhost:3000/api/brands');
    vi.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createBrand', () => {
    it('should set loading state when creating', () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockBrandResponse),
      });

      service.createBrand(mockBrandData);

      expect(service.isCreatingBrand).toBe(true);
    });

    it('should return created brand on success', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockBrandResponse),
      });

      service.createBrand(mockBrandData);

      await vi.waitFor(() => {
        expect(service.createdBrand).toEqual(mockBrandResponse);
      });

      expect(service.isCreatingBrand).toBe(false);
      expect(service.createError).toBeFalsy();
    });

    it('should set error state on failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: vi.fn().mockResolvedValue({ message: 'Error' }),
      });

      service.createBrand(mockBrandData);

      await vi.waitFor(() => {
        expect(service.createError).toBeTruthy();
      });

      expect(service.isCreatingBrand).toBe(false);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      service.createBrand(mockBrandData);

      await vi.waitFor(() => {
        expect(service.createError).toBeTruthy();
      });

      expect(service.isCreatingBrand).toBe(false);
    });
  });

  describe('updateBrand', () => {
    it('should set loading state when updating', () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockBrandResponse),
      });

      service.updateBrand('123', mockBrandData);

      expect(service.isUpdatingBrand).toBe(true);
    });

    it('should return updated brand on success', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockBrandResponse),
      });

      service.updateBrand('123', mockBrandData);

      await vi.waitFor(() => {
        expect(service.updatedBrand).toEqual(mockBrandResponse);
      });

      expect(service.isUpdatingBrand).toBe(false);
      expect(service.updateError).toBeFalsy();
    });

    it('should set error state on failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: vi.fn().mockResolvedValue({ message: 'Error' }),
      });

      service.updateBrand('123', mockBrandData);

      await vi.waitFor(() => {
        expect(service.updateError).toBeTruthy();
      });

      expect(service.isUpdatingBrand).toBe(false);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      service.updateBrand('123', mockBrandData);

      await vi.waitFor(() => {
        expect(service.updateError).toBeTruthy();
      });

      expect(service.isUpdatingBrand).toBe(false);
    });
  });

  describe('resetCreateTrigger', () => {
    it('should reset created brand to null', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockBrandResponse),
      });

      service.createBrand(mockBrandData);
      await vi.waitFor(() => {
        expect(service.createdBrand).toEqual(mockBrandResponse);
      });

      service.resetCreateTrigger();
      expect(service.createdBrand).toBeNull();
    });
  });

  describe('resetUpdateTrigger', () => {
    it('should reset updated brand to null', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockBrandResponse),
      });

      service.updateBrand('123', mockBrandData);
      await vi.waitFor(() => {
        expect(service.updatedBrand).toEqual(mockBrandResponse);
      });

      service.resetUpdateTrigger();
      expect(service.updatedBrand).toBeNull();
    });
  });
});
