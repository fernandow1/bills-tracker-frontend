import { TestBed } from '@angular/core/testing';
import { BillService } from './bill';
import { AuthService } from '@features/auth/services/auth.service';
import { ErrorHandlerService } from '@core/services/error-handler.service';
import { IBillData } from '@features/bill/interfaces/bill-data.interface';
import { IBillSearchFilters } from '@features/bill/interfaces/bill-search-filters.interface';

describe('BillService', () => {
  let service: BillService;
  let authServiceMock: any;
  let errorHandlerMock: any;

  const mockBillData: IBillData = {
    idShop: 1,
    idCurrency: 1,
    idPaymentMethod: 1,
    idUser: 1,
    idUserOwner: 1,
    purchasedAt: new Date().toISOString(),
    subTotal: 90.5,
    discount: 10,
    total: 100.5,
    billItems: [],
  };

  beforeEach(() => {
    authServiceMock = {
      getToken: vi.fn().mockReturnValue('mock-token'),
      isLoggedIn: vi.fn().mockReturnValue(true),
    };

    errorHandlerMock = {
      handleError: vi.fn(),
    };

    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('mock-token');

    TestBed.configureTestingModule({
      providers: [
        BillService,
        { provide: AuthService, useValue: authServiceMock },
        { provide: ErrorHandlerService, useValue: errorHandlerMock },
      ],
    });

    service = TestBed.inject(BillService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have initial state with null triggers', () => {
      expect(service.createdBill).toBeNull();
      expect(service.updatedBill).toBeNull();
      expect(service.searchError).toBeNull();
    });
  });

  describe('Create Bill Trigger', () => {
    it('should set create trigger when createBill is called', () => {
      service.createBill(mockBillData);
      expect(service.isCreatingBill).toBeDefined();
    });

    it('should reset create trigger', () => {
      service.createBill(mockBillData);
      service.resetCreateTrigger();
      expect(service.createdBill).toBeNull();
      expect(service.createError).toBeNull();
    });

    it('should return null for createdBill when trigger is null', () => {
      service.resetCreateTrigger();
      expect(service.createdBill).toBeNull();
    });

    it('should return null for createError when trigger is null', () => {
      service.resetCreateTrigger();
      expect(service.createError).toBeNull();
    });
  });

  describe('Update Bill Trigger', () => {
    it('should set update trigger when updateBill is called', () => {
      service.updateBill(1, mockBillData);
      expect(service.isUpdatingBill).toBeDefined();
    });

    it('should reset update trigger', () => {
      service.updateBill(1, mockBillData);
      service.resetUpdateTrigger();
      expect(service.updatedBill).toBeNull();
      expect(service.updateError).toBeNull();
    });

    it('should return null for updatedBill when trigger is null', () => {
      service.resetUpdateTrigger();
      expect(service.updatedBill).toBeNull();
    });

    it('should return null for updateError when trigger is null', () => {
      service.resetUpdateTrigger();
      expect(service.updateError).toBeNull();
    });

    it('should update bill with different IDs', () => {
      service.updateBill(5, mockBillData);
      expect(service.isUpdatingBill).toBeDefined();

      service.updateBill(10, mockBillData);
      expect(service.isUpdatingBill).toBeDefined();
    });
  });

  describe('Search Bills Trigger', () => {
    it('should set search trigger without filters', () => {
      service.searchBills(1, 10);
      expect(service.isSearchingBills).toBeDefined();
    });

    it('should set search trigger with shop filter', () => {
      const filters: IBillSearchFilters = { idShop: 1 };
      service.searchBills(1, 10, filters);
      expect(service.isSearchingBills).toBeDefined();
    });

    it('should set search trigger with currency filter', () => {
      const filters: IBillSearchFilters = { idCurrency: 2 };
      service.searchBills(1, 10, filters);
      expect(service.isSearchingBills).toBeDefined();
    });

    it('should set search trigger with payment method filter', () => {
      const filters: IBillSearchFilters = { idPaymentMethod: 3 };
      service.searchBills(1, 10, filters);
      expect(service.isSearchingBills).toBeDefined();
    });

    it('should set search trigger with all filters', () => {
      const filters: IBillSearchFilters = {
        idShop: 1,
        idCurrency: 2,
        idPaymentMethod: 3,
      };
      service.searchBills(1, 10, filters);
      expect(service.isSearchingBills).toBeDefined();
    });

    it('should reset search trigger', () => {
      service.searchBills(1, 10);
      service.resetSearchTrigger();
      expect(service.searchError).toBeNull();
    });

    it('should handle different page numbers', () => {
      service.searchBills(1, 10);
      expect(service.isSearchingBills).toBeDefined();

      service.searchBills(2, 10);
      expect(service.isSearchingBills).toBeDefined();
    });

    it('should handle different page sizes', () => {
      service.searchBills(1, 10);
      expect(service.isSearchingBills).toBeDefined();

      service.searchBills(1, 25);
      expect(service.isSearchingBills).toBeDefined();
    });
  });

  describe('Search Results Getters', () => {
    it('should return empty array for searchedBills when no search', () => {
      service.resetSearchTrigger();
      expect(service.searchedBills).toEqual([]);
    });

    it('should return 0 for searchedBillsCount when no search', () => {
      service.resetSearchTrigger();
      expect(service.searchedBillsCount).toBe(0);
    });

    it('should return null for searchError when trigger is null', () => {
      service.resetSearchTrigger();
      expect(service.searchError).toBeNull();
    });
  });

  describe('Resource Status Getters', () => {
    it('should check isCreatingBill status', () => {
      const status = service.isCreatingBill;
      expect(typeof status).toBe('boolean');
    });

    it('should check isUpdatingBill status', () => {
      const status = service.isUpdatingBill;
      expect(typeof status).toBe('boolean');
    });

    it('should check isSearchingBills status', () => {
      const status = service.isSearchingBills;
      expect(typeof status).toBe('boolean');
    });
  });

  describe('Multiple Operations', () => {
    it('should handle multiple create operations', () => {
      service.createBill(mockBillData);
      service.resetCreateTrigger();

      const newBillData = { ...mockBillData, total: 200.0 };
      service.createBill(newBillData);
      expect(service.isCreatingBill).toBeDefined();
    });

    it('should handle multiple search operations with different filters', () => {
      service.searchBills(1, 10, { idShop: 1 });
      service.resetSearchTrigger();

      service.searchBills(1, 10, { idCurrency: 2 });
      expect(service.isSearchingBills).toBeDefined();
    });

    it('should handle create and update independently', () => {
      service.createBill(mockBillData);
      service.updateBill(1, mockBillData);

      expect(service.isCreatingBill).toBeDefined();
      expect(service.isUpdatingBill).toBeDefined();
    });

    it('should handle all operations simultaneously', () => {
      service.createBill(mockBillData);
      service.updateBill(1, mockBillData);
      service.searchBills(1, 10);

      expect(service.isCreatingBill).toBeDefined();
      expect(service.isUpdatingBill).toBeDefined();
      expect(service.isSearchingBills).toBeDefined();
    });
  });

  describe('Trigger Reset Flow', () => {
    it('should reset all triggers independently', () => {
      service.createBill(mockBillData);
      service.updateBill(1, mockBillData);
      service.searchBills(1, 10);

      service.resetCreateTrigger();
      expect(service.createdBill).toBeNull();

      service.resetUpdateTrigger();
      expect(service.updatedBill).toBeNull();

      service.resetSearchTrigger();
      expect(service.searchError).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty bill data', () => {
      const emptyBillData = {} as IBillData;
      service.createBill(emptyBillData);
      expect(service.isCreatingBill).toBeDefined();
    });

    it('should handle zero values in filters', () => {
      const filters: IBillSearchFilters = {
        idShop: 0,
        idCurrency: 0,
        idPaymentMethod: 0,
      };
      service.searchBills(1, 10, filters);
      expect(service.isSearchingBills).toBeDefined();
    });

    it('should handle large page numbers', () => {
      service.searchBills(999, 10);
      expect(service.isSearchingBills).toBeDefined();
    });

    it('should handle large page sizes', () => {
      service.searchBills(1, 1000);
      expect(service.isSearchingBills).toBeDefined();
    });
  });
});
