import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CategoryService, ICategoryResponse } from './category';
import { ConfigService } from '@core/services/config.service';
import { ICategoryData } from '@features/category/interfaces/category-data.interface';

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
  categoryEndpoints: {
    create: '/categories',
    list: '/categories',
    update: '/categories/:id',
    delete: '/categories/:id',
    byId: '/categories/:id',
  },
};

describe('CategoryService', () => {
  let service: CategoryService;
  let configService: ReturnType<typeof vi.mocked<ConfigService>>;

  const mockCategoryData: ICategoryData = {
    name: 'Test Category',
    description: 'Test Description',
  };

  const mockCategoryResponse: ICategoryResponse = {
    id: '123',
    name: 'Test Category',
    description: 'Test Description',
    createdAt: '2025-12-07T00:00:00Z',
    updatedAt: '2025-12-07T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful response by default
    mockFetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([]),
      status: 200,
      statusText: 'OK',
    });

    TestBed.configureTestingModule({
      providers: [CategoryService, { provide: ConfigService, useValue: mockConfigService }],
    });

    service = TestBed.inject(CategoryService);
    configService = TestBed.inject(ConfigService) as ReturnType<typeof vi.mocked<ConfigService>>;

    configService.buildApiUrl.mockReturnValue('http://localhost:3000/api/categories');
    vi.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createCategory', () => {
    it('should set loading state when creating', () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockCategoryResponse),
      });

      service.createCategory(mockCategoryData);

      expect(service.isCreatingCategory).toBe(true);
    });

    it('should return created category on success', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockCategoryResponse),
      });

      service.createCategory(mockCategoryData);

      await vi.waitFor(() => {
        expect(service.createdCategory).toEqual(mockCategoryResponse);
      });

      expect(service.isCreatingCategory).toBe(false);
      expect(service.createError).toBeFalsy();
    });

    it('should set error state on failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: vi.fn().mockResolvedValue({ message: 'Error' }),
      });

      service.createCategory(mockCategoryData);

      await vi.waitFor(() => {
        expect(service.createError).toBeTruthy();
      });

      expect(service.isCreatingCategory).toBe(false);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      service.createCategory(mockCategoryData);

      await vi.waitFor(() => {
        expect(service.createError).toBeTruthy();
      });

      expect(service.isCreatingCategory).toBe(false);
    });
  });

  describe('resetCreateTrigger', () => {
    it('should allow creating again after reset', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockCategoryResponse),
      });

      service.createCategory(mockCategoryData);
      await vi.waitFor(() => {
        expect(service.createdCategory).toEqual(mockCategoryResponse);
      });

      service.resetCreateTrigger();
      expect(service.createdCategory).toBeNull();
    });
  });

  describe('resource states', () => {
    it('should transition from loading to idle', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockCategoryResponse),
      });

      service.createCategory(mockCategoryData);
      expect(service.isCreatingCategory).toBe(true);

      await vi.waitFor(() => {
        expect(service.isCreatingCategory).toBe(false);
      });
    });
  });

  describe('ConfigService integration', () => {
    it('should have access to ConfigService', () => {
      expect(configService).toBeDefined();
      expect(configService.buildApiUrl).toBeDefined();
      expect(configService.categoryEndpoints).toBeDefined();
    });
  });
});
