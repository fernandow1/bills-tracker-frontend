import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { CurrencyService } from '@features/currency/services/currency';
import { ICurrencyResponse } from '@features/currency/interfaces/currency-response.interface';
import { signal } from '@angular/core';

import { CurrencyForm } from './form';

describe('CurrencyForm', () => {
  let component: CurrencyForm;
  let fixture: ComponentFixture<CurrencyForm>;
  let mockCurrencyService: any;
  let mockDialogRef: any;
  let mockSnackBar: any;

  beforeEach(async () => {
    // Mock del servicio con todos los getters y métodos necesarios
    mockCurrencyService = {
      createdCurrency: signal<ICurrencyResponse | null>(null)(),
      createError: signal<any>(null)(),
      updatedCurrency: signal<ICurrencyResponse | null>(null)(),
      updateError: signal<any>(null)(),
      isCreatingCurrency: false,
      isUpdatingCurrency: false,
      resetCreateTrigger: vi.fn(),
      resetUpdateTrigger: vi.fn(),
      createCurrency: vi.fn(),
      updateCurrency: vi.fn(),
    };

    mockDialogRef = {
      close: vi.fn(),
    };

    mockSnackBar = {
      open: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CurrencyForm],
      providers: [
        provideNoopAnimations(),
        { provide: CurrencyService, useValue: mockCurrencyService },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: MAT_DIALOG_DATA, useValue: null },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CurrencyForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize in create mode by default', () => {
      expect(component.isEditMode).toBe(false);
      expect(component.currencyId).toBeUndefined();
    });

    it('should call resetCreateTrigger and resetUpdateTrigger on init', () => {
      expect(mockCurrencyService.resetCreateTrigger).toHaveBeenCalled();
      expect(mockCurrencyService.resetUpdateTrigger).toHaveBeenCalled();
    });

    it('should initialize form with empty values', () => {
      expect(component.currencyModel()).toEqual({
        code: '',
        name: '',
        symbol: '',
      });
    });
  });

  describe('Form Validations - Code Field', () => {
    it('should be invalid when code is empty', () => {
      component.currencyModel.update((val) => ({ ...val, code: '' }));
      component.currencyForm().markAsTouched();
      expect(component.currencyForm().invalid()).toBe(true);
    });

    it('should be invalid when code has less than 3 characters', () => {
      component.currencyModel.update((val) => ({ ...val, code: 'US' }));
      expect(component.currencyForm().invalid()).toBe(true);
    });

    it('should be invalid when code has more than 3 characters', () => {
      component.currencyModel.update((val) => ({ ...val, code: 'USDD' }));
      expect(component.currencyForm().invalid()).toBe(true);
    });

    it('should be invalid when code contains numbers', () => {
      component.currencyModel.update((val) => ({ ...val, code: 'US1' }));
      expect(component.currencyForm().invalid()).toBe(true);
    });

    it('should be invalid when code contains special characters', () => {
      component.currencyModel.update((val) => ({ ...val, code: 'U$D' }));
      expect(component.currencyForm().invalid()).toBe(true);
    });

    it('should be valid when code has exactly 3 letters with valid form', () => {
      component.currencyModel.set({
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
      });
      expect(component.currencyForm().valid()).toBe(true);
    });

    it('should accept lowercase letters (will be normalized by backend)', () => {
      component.currencyModel.set({
        code: 'usd',
        name: 'US Dollar',
        symbol: '$',
      });
      expect(component.currencyForm().valid()).toBe(true);
    });
  });

  describe('Form Validations - Name Field', () => {
    it('should be invalid when name is empty', () => {
      component.currencyModel.update((val) => ({ ...val, name: '' }));
      component.currencyForm().markAsTouched();
      expect(component.currencyForm().invalid()).toBe(true);
    });

    it('should be invalid when name has less than 3 characters', () => {
      component.currencyModel.update((val) => ({ ...val, name: 'US' }));
      expect(component.currencyForm().invalid()).toBe(true);
    });

    it('should be invalid when name exceeds 50 characters', () => {
      const longName = 'A'.repeat(51);
      component.currencyModel.update((val) => ({ ...val, name: longName }));
      expect(component.currencyForm().invalid()).toBe(true);
    });

    it('should be valid when name has between 3 and 50 characters', () => {
      component.currencyModel.set({
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
      });
      expect(component.currencyForm().valid()).toBe(true);
    });

    it('should accept names with special characters', () => {
      component.currencyModel.set({
        code: 'ARS',
        name: 'Dólar Estadounidense',
        symbol: '$',
      });
      expect(component.currencyForm().valid()).toBe(true);
    });
  });

  describe('Form Validations - Symbol Field', () => {
    it('should be invalid when symbol is empty', () => {
      component.currencyModel.update((val) => ({ ...val, symbol: '' }));
      component.currencyForm().markAsTouched();
      expect(component.currencyForm().invalid()).toBe(true);
    });

    it('should be invalid when symbol exceeds 5 characters', () => {
      component.currencyModel.update((val) => ({ ...val, symbol: 'TOOLONG' }));
      expect(component.currencyForm().invalid()).toBe(true);
    });

    it('should be valid with single character symbols', () => {
      component.currencyModel.set({
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
      });
      expect(component.currencyForm().valid()).toBe(true);
    });

    it('should be valid with multi-character symbols', () => {
      component.currencyModel.set({
        code: 'AUD',
        name: 'Australian Dollar',
        symbol: 'US$',
      });
      expect(component.currencyForm().valid()).toBe(true);
    });

    it('should accept unicode symbols', () => {
      component.currencyModel.set({
        code: 'EUR',
        name: 'Euro',
        symbol: '€',
      });
      expect(component.currencyForm().valid()).toBe(true);
    });
  });

  describe('Form State', () => {
    it('should be invalid when all fields are empty', () => {
      expect(component.currencyForm().invalid()).toBe(true);
    });

    it('should be valid when all fields have correct data', () => {
      component.currencyModel.set({
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
      });
      expect(component.currencyForm().valid()).toBe(true);
    });

    it('should mark form as touched when submitting invalid form', () => {
      const markAsTouchedSpy = vi.spyOn(component.currencyForm(), 'markAsTouched');
      component.onSubmit();
      expect(markAsTouchedSpy).toHaveBeenCalled();
    });
  });

  describe('Create Mode - onSubmit', () => {
    beforeEach(() => {
      component.currencyModel.set({
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
      });
    });

    it('should not submit if form is invalid', () => {
      component.currencyModel.update((val) => ({ ...val, code: '' }));
      component.onSubmit();
      expect(mockCurrencyService.createCurrency).not.toHaveBeenCalled();
    });

    it('should call createCurrency with form data', () => {
      component.onSubmit();
      expect(mockCurrencyService.createCurrency).toHaveBeenCalledWith({
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
      });
    });

    it('should not call updateCurrency in create mode', () => {
      component.onSubmit();
      expect(mockCurrencyService.updateCurrency).not.toHaveBeenCalled();
    });
  });

  describe('Edit Mode', () => {
    const mockDialogData: ICurrencyResponse = {
      id: '123',
      code: 'EUR',
      name: 'Euro',
      symbol: '€',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };

    beforeEach(async () => {
      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [CurrencyForm],
        providers: [
          provideNoopAnimations(),
          { provide: CurrencyService, useValue: mockCurrencyService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MatSnackBar, useValue: mockSnackBar },
          { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(CurrencyForm);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should initialize in edit mode with dialog data', () => {
      expect(component.isEditMode).toBe(true);
      expect(component.currencyId).toBe('123');
    });

    it('should initialize form with existing data', () => {
      expect(component.currencyModel()).toEqual({
        code: 'EUR',
        name: 'Euro',
        symbol: '€',
      });
    });

    it('should call updateCurrency with id and form data', () => {
      component.currencyModel.update((val) => ({ ...val, name: 'Euro Updated' }));
      component.onSubmit();
      expect(mockCurrencyService.updateCurrency).toHaveBeenCalledWith('123', {
        code: 'EUR',
        name: 'Euro Updated',
        symbol: '€',
      });
    });

    it('should not call createCurrency in edit mode', () => {
      component.onSubmit();
      expect(mockCurrencyService.createCurrency).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should return false when not creating or updating', () => {
      mockCurrencyService.isCreatingCurrency = false;
      mockCurrencyService.isUpdatingCurrency = false;
      expect(component.isLoading).toBe(false);
    });

    it('should return true when creating currency', () => {
      mockCurrencyService.isCreatingCurrency = true;
      mockCurrencyService.isUpdatingCurrency = false;
      expect(component.isLoading).toBe(true);
    });

    it('should return true when updating currency', () => {
      mockCurrencyService.isCreatingCurrency = false;
      mockCurrencyService.isUpdatingCurrency = true;
      expect(component.isLoading).toBe(true);
    });

    it('should return true when both creating and updating', () => {
      mockCurrencyService.isCreatingCurrency = true;
      mockCurrencyService.isUpdatingCurrency = true;
      expect(component.isLoading).toBe(true);
    });
  });

  describe('Success Effects - Create', () => {
    it('should show success message when currency is created', async () => {
      const mockCreated: ICurrencyResponse = {
        id: '1',
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      mockCurrencyService.createdCurrency = signal(mockCreated)();

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [CurrencyForm],
        providers: [
          provideNoopAnimations(),
          { provide: CurrencyService, useValue: mockCurrencyService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MatSnackBar, useValue: mockSnackBar },
          { provide: MAT_DIALOG_DATA, useValue: null },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(CurrencyForm);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Moneda creada exitosamente',
        'Cerrar',
        expect.objectContaining({ duration: 3000 })
      );
    });

    it('should close dialog when currency is created', async () => {
      const mockCreated: ICurrencyResponse = {
        id: '1',
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      mockCurrencyService.createdCurrency = signal(mockCreated)();

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [CurrencyForm],
        providers: [
          provideNoopAnimations(),
          { provide: CurrencyService, useValue: mockCurrencyService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MatSnackBar, useValue: mockSnackBar },
          { provide: MAT_DIALOG_DATA, useValue: null },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(CurrencyForm);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(mockDialogRef.close).toHaveBeenCalledWith(mockCreated);
    });
  });

  describe('Error Effects - Create', () => {
    it('should show error message when create fails', async () => {
      mockCurrencyService.createError = signal({ message: 'Error' })();

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [CurrencyForm],
        providers: [
          provideNoopAnimations(),
          { provide: CurrencyService, useValue: mockCurrencyService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MatSnackBar, useValue: mockSnackBar },
          { provide: MAT_DIALOG_DATA, useValue: null },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(CurrencyForm);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Error al crear la moneda',
        'Cerrar',
        expect.objectContaining({ duration: 5000 })
      );
    });
  });

  describe('Success Effects - Update', () => {
    it('should show success message when currency is updated', async () => {
      const mockUpdated: ICurrencyResponse = {
        id: '1',
        code: 'USD',
        name: 'US Dollar Updated',
        symbol: '$',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02',
      };

      mockCurrencyService.updatedCurrency = signal(mockUpdated)();

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [CurrencyForm],
        providers: [
          provideNoopAnimations(),
          { provide: CurrencyService, useValue: mockCurrencyService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MatSnackBar, useValue: mockSnackBar },
          { provide: MAT_DIALOG_DATA, useValue: null },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(CurrencyForm);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Moneda actualizada exitosamente',
        'Cerrar',
        expect.objectContaining({ duration: 3000 })
      );
    });

    it('should close dialog when currency is updated', async () => {
      const mockUpdated: ICurrencyResponse = {
        id: '1',
        code: 'USD',
        name: 'US Dollar Updated',
        symbol: '$',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02',
      };

      mockCurrencyService.updatedCurrency = signal(mockUpdated)();

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [CurrencyForm],
        providers: [
          provideNoopAnimations(),
          { provide: CurrencyService, useValue: mockCurrencyService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MatSnackBar, useValue: mockSnackBar },
          { provide: MAT_DIALOG_DATA, useValue: null },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(CurrencyForm);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(mockDialogRef.close).toHaveBeenCalledWith(mockUpdated);
    });
  });

  describe('Error Effects - Update', () => {
    it('should show error message when update fails', async () => {
      mockCurrencyService.updateError = signal({ message: 'Error' })();

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [CurrencyForm],
        providers: [
          provideNoopAnimations(),
          { provide: CurrencyService, useValue: mockCurrencyService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MatSnackBar, useValue: mockSnackBar },
          { provide: MAT_DIALOG_DATA, useValue: null },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(CurrencyForm);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Error al actualizar la moneda',
        'Cerrar',
        expect.objectContaining({ duration: 5000 })
      );
    });
  });
});
