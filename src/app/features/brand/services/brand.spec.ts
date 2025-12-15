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
  brandEndpoints: {
    create: '/brands',
    list: '/brands',
    update: '/brands/:id',
    delete: '/brands/:id',
    byId: '/brands/:id',
  },
  authConfig: {
    tokenKey: 'bills_tracker_token',
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
    createdAt: '2025-12-14T00:00:00Z',
    updatedAt: '2025-12-14T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => 'mock-token'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });

    // Mock successful response for brandsResource that loads automatically
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

    // Setup default mock responses
    configService.buildApiUrl.mockReturnValue('http://localhost:3000/api/brands');

    // Clear the initial fetch call from brandsResource
    vi.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createBrand', () => {
    it('should trigger brand creation and set loading state', () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockBrandResponse),
        status: 201,
        statusText: 'Created',
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      service.createBrand(mockBrandData);

      // Assert
      expect(service.isCreatingBrand).toBe(true);
    });

    it('should call fetch with correct parameters including auth header', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockBrandResponse),
        status: 201,
        statusText: 'Created',
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      service.createBrand(mockBrandData);

      // Wait for async operation
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/brands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-token',
        },
        body: JSON.stringify(mockBrandData),
      });
    });

    it('should handle successful response', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockBrandResponse),
        status: 201,
        statusText: 'Created',
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      service.createBrand(mockBrandData);

      // Wait for async operation and resource update
      await vi.waitFor(() => {
        expect(service.createdBrand).toEqual(mockBrandResponse);
      });

      // Assert
      expect(service.isCreatingBrand).toBe(false);
      expect(service.createError).toBeFalsy();
    });

    it('should handle HTTP error responses', async () => {
      // Arrange
      const errorResponse = { message: 'Brand already exists' };
      const mockResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: vi.fn().mockResolvedValue(errorResponse),
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      service.createBrand(mockBrandData);

      // Wait for async operation
      await vi.waitFor(() => {
        expect(service.createError).toBeTruthy();
      });

      // Assert
      expect(service.isCreatingBrand).toBe(false);
      expect(service.createError).toBeTruthy();
    });

    it('should handle network errors', async () => {
      // Arrange
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValue(networkError);

      // Act
      service.createBrand(mockBrandData);

      // Wait for async operation
      await vi.waitFor(() => {
        expect(service.createError).toBeTruthy();
      });

      // Assert
      expect(service.isCreatingBrand).toBe(false);
      expect(service.createError).toBeTruthy();
    });
  });

  describe('updateBrand', () => {
    it('should trigger brand update and set loading state', () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockBrandResponse),
        status: 200,
        statusText: 'OK',
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      service.updateBrand('123', mockBrandData);

      // Assert
      expect(service.isUpdatingBrand).toBe(true);
    });

    it('should call fetch with correct parameters including auth header', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockBrandResponse),
        status: 200,
        statusText: 'OK',
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      service.updateBrand('123', mockBrandData);

      // Wait for async operation
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/brands/123', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-token',
        },
        body: JSON.stringify(mockBrandData),
      });
    });

    it('should handle successful response', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockBrandResponse),
        status: 200,
        statusText: 'OK',
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      service.updateBrand('123', mockBrandData);

      // Wait for async operation and resource update
      await vi.waitFor(() => {
        expect(service.updatedBrand).toEqual(mockBrandResponse);
      });

      // Assert
      expect(service.isUpdatingBrand).toBe(false);
      expect(service.updateError).toBeFalsy();
    });

    it('should handle HTTP error responses', async () => {
      // Arrange
      const errorResponse = { message: 'Brand not found' };
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: vi.fn().mockResolvedValue(errorResponse),
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      service.updateBrand('123', mockBrandData);

      // Wait for async operation
      await vi.waitFor(() => {
        expect(service.updateError).toBeTruthy();
      });

      // Assert
      expect(service.isUpdatingBrand).toBe(false);
      expect(service.updateError).toBeTruthy();
    });
  });

  describe('resetCreateTrigger', () => {
    it('should prevent subsequent requests when trigger is reset', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockBrandResponse),
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Act - First, set some data and wait for it to complete
      service.createBrand(mockBrandData);
      await vi.waitFor(() => {
        expect(service.createdBrand).toEqual(mockBrandResponse);
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
        json: vi.fn().mockResolvedValue(mockBrandResponse),
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Act - Create, wait for completion, reset, then create again
      service.createBrand(mockBrandData);
      await vi.waitFor(() => {
        expect(service.createdBrand).toEqual(mockBrandResponse);
      });

      service.resetCreateTrigger();

      // Clear fetch calls from first creation
      mockFetch.mockClear();

      // Create again after reset
      service.createBrand(mockBrandData);

      // Wait for the new request
      await vi.waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      // Assert - New request should be made
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/brands',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockBrandData),
        })
      );
    });
  });

  describe('resetUpdateTrigger', () => {
    it('should prevent subsequent update requests when trigger is reset', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockBrandResponse),
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Act - First, update and wait for it to complete
      service.updateBrand('123', mockBrandData);
      await vi.waitFor(() => {
        expect(service.updatedBrand).toEqual(mockBrandResponse);
      });

      service.resetUpdateTrigger();

      // Clear previous fetch calls
      mockFetch.mockClear();

      // Wait a bit to see if any requests are made after reset
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert - No fetch should have been called after reset
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('resource states', () => {
    it('should return correct loading state for creation', async () => {
      // Setup mock response
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockBrandResponse),
      };
      mockFetch.mockResolvedValue(mockResponse);

      // After triggering creation, should be loading
      service.createBrand(mockBrandData);
      expect(service.isCreatingBrand).toBe(true);

      // Wait for completion
      await vi.waitFor(() => {
        expect(service.isCreatingBrand).toBe(false);
      });

      // Clean up - reset the trigger
      service.resetCreateTrigger();
    });

    it('should return correct loading state for update', async () => {
      // Setup mock response
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockBrandResponse),
      };
      mockFetch.mockResolvedValue(mockResponse);

      // After triggering update, should be loading
      service.updateBrand('123', mockBrandData);
      expect(service.isUpdatingBrand).toBe(true);

      // Wait for completion
      await vi.waitFor(() => {
        expect(service.isUpdatingBrand).toBe(false);
      });

      // Clean up - reset the trigger
      service.resetUpdateTrigger();
    });

    it('should not make request when no brand data is set', async () => {
      // Act - Don't set any brand data or call any methods
      // Just wait to see if any new requests are made
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
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

  describe('getAuthHeaders', () => {
    it('should include Authorization header when token exists', () => {
      // Arrange - token is mocked in beforeEach
      const headers = service['getAuthHeaders']();

      // Assert
      expect(headers).toHaveProperty('Content-Type', 'application/json');
      expect(headers).toHaveProperty('Authorization', 'Bearer mock-token');
    });

    it('should not include Authorization header when token is null', () => {
      // Arrange - Mock localStorage to return null
      (window.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);

      const headers = service['getAuthHeaders']();

      // Assert
      expect(headers).toHaveProperty('Content-Type', 'application/json');
      expect(headers).not.toHaveProperty('Authorization');
    });
  });

  describe('ConfigService integration', () => {
    it('should have access to ConfigService', () => {
      // Assert - Check that the service has access to ConfigService
      expect(configService).toBeDefined();
      expect(configService.buildApiUrl).toBeDefined();
      expect(configService.brandEndpoints).toBeDefined();
    });
  });

  describe('reloadBrands', () => {
    it('should reload brands resource', () => {
      // Arrange
      const reloadSpy = vi.spyOn(service.brandsResource, 'reload');

      // Act
      service.reloadBrands();

      // Assert
      expect(reloadSpy).toHaveBeenCalled();
    });
  });
});
