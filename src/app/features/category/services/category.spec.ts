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

    // Mock successful response for categoriesResource that loads automatically
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

    // Setup default mock responses
    configService.buildApiUrl.mockReturnValue('http://localhost:3000/api/categories');

    // Clear the initial fetch call from categoriesResource
    vi.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createCategory', () => {
    it('should trigger category creation and set loading state', () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockCategoryResponse),
        status: 201,
        statusText: 'Created',
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      service.createCategory(mockCategoryData);

      // Assert
      expect(service.isCreatingCategory).toBe(true);
    });

    it('should call fetch with correct parameters', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockCategoryResponse),
        status: 201,
        statusText: 'Created',
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      service.createCategory(mockCategoryData);

      // Wait for async operation
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockCategoryData),
      });
    });

    it('should handle successful response', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockCategoryResponse),
        status: 201,
        statusText: 'Created',
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      service.createCategory(mockCategoryData);

      // Wait for async operation and resource update
      await vi.waitFor(() => {
        expect(service.createdCategory).toEqual(mockCategoryResponse);
      });

      // Assert
      expect(service.isCreatingCategory).toBe(false);
      expect(service.createError).toBeFalsy();
    });

    it('should handle HTTP error responses', async () => {
      // Arrange
      const errorResponse = { message: 'Category already exists' };
      const mockResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: vi.fn().mockResolvedValue(errorResponse),
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      service.createCategory(mockCategoryData);

      // Wait for async operation
      await vi.waitFor(() => {
        expect(service.createError).toBeTruthy();
      });

      // Assert - Don't access createdCategory when in error state
      expect(service.isCreatingCategory).toBe(false);
      expect(service.createError).toBeTruthy();
    });

    it('should handle network errors', async () => {
      // Arrange
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValue(networkError);

      // Act
      service.createCategory(mockCategoryData);

      // Wait for async operation
      await vi.waitFor(() => {
        expect(service.createError).toBeTruthy();
      });

      // Assert - Don't access createdCategory when in error state
      expect(service.isCreatingCategory).toBe(false);
      expect(service.createError).toBeTruthy();
    });
  });

  describe('resetCreateTrigger', () => {
    it('should prevent subsequent requests when trigger is reset', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockCategoryResponse),
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Act - First, set some data and wait for it to complete
      service.createCategory(mockCategoryData);
      await vi.waitFor(() => {
        expect(service.createdCategory).toEqual(mockCategoryResponse);
      });

      service.resetCreateTrigger();

      // Clear previous fetch calls
      mockFetch.mockClear();

      // Wait a bit to see if any requests are made after reset
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert - No fetch should have been called after reset
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should allow new requests after reset', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockCategoryResponse),
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Act - Create, wait for completion, reset, then create again
      service.createCategory(mockCategoryData);
      await vi.waitFor(() => {
        expect(service.createdCategory).toEqual(mockCategoryResponse);
      });

      service.resetCreateTrigger();

      // Clear fetch calls from first creation
      mockFetch.mockClear();

      // Create again after reset
      service.createCategory(mockCategoryData);

      // Wait for the new request
      await vi.waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      // Assert - New request should be made
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/categories',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockCategoryData),
        })
      );
    });
  });

  describe('resource states', () => {
    it('should return correct loading state', async () => {
      // Setup mock response
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockCategoryResponse),
      };
      mockFetch.mockResolvedValue(mockResponse);

      // After triggering creation, should be loading
      service.createCategory(mockCategoryData);
      expect(service.isCreatingCategory).toBe(true);

      // Wait for completion
      await vi.waitFor(() => {
        expect(service.isCreatingCategory).toBe(false);
      });

      // Clean up - reset the trigger
      service.resetCreateTrigger();
    });

    it('should not make request when no category data is set', async () => {
      // Arrange - Trigger should already be null from beforeEach, mocks already cleared
      // However, the service itself was created in beforeEach which triggers categoriesResource
      // So we expect that call to have happened already and been cleared

      // Act - Don't set any category data or call any methods
      // Just wait to see if any new requests are made
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert - Since we cleared mocks in beforeEach after service creation,
      // and we didn't trigger any actions here, no new fetches should occur
      // But if categoriesResource is reactive and reloads, we might see calls
      // In that case, we should at least verify no POST requests were made
      const callCount = mockFetch.mock.calls.length;
      if (callCount > 0) {
        // If there were calls, make sure none of them are POST (create) requests
        const postCalls = mockFetch.mock.calls.filter((call) => {
          const options = call[1] as RequestInit | undefined;
          return options?.method === 'POST';
        });
        expect(postCalls.length).toBe(0);
      } else {
        // Ideally no calls at all
        expect(mockFetch).not.toHaveBeenCalled();
      }
    });
  });

  describe('ConfigService integration', () => {
    it('should have access to ConfigService', () => {
      // Assert - Check that the service has access to ConfigService
      expect(configService).toBeDefined();
      expect(configService.buildApiUrl).toBeDefined();
      expect(configService.categoryEndpoints).toBeDefined();
    });
  });
});
