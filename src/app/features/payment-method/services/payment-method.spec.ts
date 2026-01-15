import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PaymentMethodService } from './payment-method';
import { ConfigService } from '@core/services/config.service';
import { IPaymentMethodData } from '@features/payment-method/interfaces/payment-method-data.interface';
import { IPaymentMethodResponse } from '@features/payment-method/interfaces/payment-method-response.interface';

// Mock del fetch global
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

// Mock del ConfigService
const mockConfigService = {
  buildApiUrl: vi.fn(),
  paymentMethodEndpoints: {
    create: '/payment-methods',
    list: '/payment-methods',
    update: '/payment-methods/:id',
    delete: '/payment-methods/:id',
    byId: '/payment-methods/:id',
  },
  authConfig: {
    tokenKey: 'bills_tracker_token',
  },
};

describe('PaymentMethodService', () => {
  let service: PaymentMethodService;
  let configService: ReturnType<typeof vi.mocked<ConfigService>>;

  const mockPaymentMethodData: IPaymentMethodData = {
    name: 'Credit Card',
    description: 'Visa/Mastercard',
  };

  const mockPaymentMethodResponse: IPaymentMethodResponse = {
    id: 1,
    name: 'Credit Card',
    description: 'Visa/Mastercard',
    createdAt: '2025-12-14T00:00:00Z',
    updatedAt: '2025-12-14T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock localStorage using Storage.prototype spies
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('mock-token');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'clear').mockImplementation(() => {});

    // Mock successful response for allPaymentMethodsResource
    mockFetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([]),
      status: 200,
      statusText: 'OK',
    });

    TestBed.configureTestingModule({
      providers: [PaymentMethodService, { provide: ConfigService, useValue: mockConfigService }],
    });

    service = TestBed.inject(PaymentMethodService);
    configService = TestBed.inject(ConfigService) as ReturnType<typeof vi.mocked<ConfigService>>;

    // Setup default mock responses
    configService.buildApiUrl.mockReturnValue('http://localhost:3000/api/payment-methods');

    // Clear the initial fetch call
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadAllPaymentMethods', () => {
    it('should trigger payment methods loading', () => {
      // Act
      service.loadAllPaymentMethods();

      // Assert - después de llamar loadAllPaymentMethods, paymentMethods no debería ser null
      expect(service.paymentMethods).not.toBeNull();
    });
  });

  describe('paymentMethods getter', () => {
    it('should return null if not loaded', () => {
      // Assert
      expect(service.paymentMethods).toBeNull();
    });

    it('should return payment methods after loading', async () => {
      // Arrange
      const mockPaymentMethods = [mockPaymentMethodResponse];
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockPaymentMethods),
        status: 200,
        statusText: 'OK',
      });

      // Act
      service.loadAllPaymentMethods();

      // Wait for async operation
      await vi.waitFor(() => {
        expect(service.paymentMethods).toEqual(mockPaymentMethods);
      });
    });
  });

  describe('isLoadingPaymentMethods', () => {
    it('should return loading state', async () => {
      // Wait for initial load to complete
      await vi.waitFor(() => {
        expect(service.isLoadingPaymentMethods).toBe(false);
      });
    });
  });

  describe('paymentMethodsError', () => {
    it('should return null if not loaded', () => {
      // Assert
      expect(service.paymentMethodsError).toBeNull();
    });

    it('should return error when loading fails', async () => {
      // Arrange
      const errorResponse = { message: 'Network error' };
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: vi.fn().mockResolvedValue(errorResponse),
      });

      // Act
      service.loadAllPaymentMethods();

      // Wait for async operation
      await vi.waitFor(() => {
        expect(service.paymentMethodsError).toBeTruthy();
      });
    });
  });

  describe('reloadPaymentMethods', () => {
    it('should reload payment methods resource', async () => {
      // Arrange
      const mockPaymentMethods = [mockPaymentMethodResponse];
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockPaymentMethods),
        status: 200,
        statusText: 'OK',
      });

      // Act
      service.reloadPaymentMethods();

      // Wait for async operation
      await vi.waitFor(() => {
        expect(service.paymentMethods).toEqual(mockPaymentMethods);
      });
    });

    it('should set trigger if not already set', () => {
      // Arrange
      const reloadSpy = vi.spyOn(service['allPaymentMethodsResource'], 'reload');

      // Act
      service.reloadPaymentMethods();

      // Assert
      expect(reloadSpy).toHaveBeenCalled();
    });
  });

  describe('createPaymentMethod', () => {
    it('should create a payment method successfully', async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockPaymentMethodResponse),
        status: 201,
        statusText: 'Created',
      });

      // Act
      const result = await service.createPaymentMethod(mockPaymentMethodData);

      // Assert
      expect(result).toEqual(mockPaymentMethodResponse);
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/payment-methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-token',
        },
        body: JSON.stringify(mockPaymentMethodData),
      });
    });

    it('should throw error when creation fails', async () => {
      // Arrange
      const errorResponse = { message: 'Payment method already exists' };
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: vi.fn().mockResolvedValue(errorResponse),
      });

      // Act & Assert
      await expect(service.createPaymentMethod(mockPaymentMethodData)).rejects.toThrow();
    });

    it('should handle network errors during creation', async () => {
      // Arrange
      mockFetch.mockRejectedValue(new Error('Network error'));

      // Act & Assert
      await expect(service.createPaymentMethod(mockPaymentMethodData)).rejects.toThrow(
        'Network error',
      );
    });
  });

  describe('updatePaymentMethod', () => {
    it('should update a payment method successfully', async () => {
      // Arrange
      const updatedData: IPaymentMethodData = {
        name: 'Updated Credit Card',
        description: 'Updated description',
      };
      const updatedResponse: IPaymentMethodResponse = {
        ...mockPaymentMethodResponse,
        ...updatedData,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(updatedResponse),
        status: 200,
        statusText: 'OK',
      });

      // Act
      const result = await service.updatePaymentMethod(1, updatedData);

      // Assert
      expect(result).toEqual(updatedResponse);
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/payment-methods/1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-token',
        },
        body: JSON.stringify(updatedData),
      });
    });

    it('should throw error when update fails', async () => {
      // Arrange
      const errorResponse = { message: 'Payment method not found' };
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: vi.fn().mockResolvedValue(errorResponse),
      });

      // Act & Assert
      await expect(service.updatePaymentMethod(1, mockPaymentMethodData)).rejects.toThrow();
    });

    it('should handle network errors during update', async () => {
      // Arrange
      mockFetch.mockRejectedValue(new Error('Network error'));

      // Act & Assert
      await expect(service.updatePaymentMethod(1, mockPaymentMethodData)).rejects.toThrow(
        'Network error',
      );
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
      expect(configService.paymentMethodEndpoints).toBeDefined();
    });
  });
});
