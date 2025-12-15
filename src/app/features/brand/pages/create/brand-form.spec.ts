import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MatSnackBar } from '@angular/material/snack-bar';

import { BrandForm } from './brand-form';
import { BrandService } from '@features/brand/services/brand';
import { IBrandResponse } from '@features/brand/interfaces/brand-response.interface';

// Mock del BrandService
const mockBrandService = {
  createdBrand: null as IBrandResponse | null,
  createError: null as Error | null,
  updatedBrand: null as IBrandResponse | null,
  updateError: null as Error | null,
  isCreatingBrand: false,
  isUpdatingBrand: false,
  brandsError: null as Error | null,
  createBrand: vi.fn(),
  updateBrand: vi.fn(),
  resetCreateTrigger: vi.fn(),
  resetUpdateTrigger: vi.fn(),
};

// Mock del MatSnackBar
const mockSnackBar = {
  open: vi.fn(),
};

describe('BrandForm', () => {
  let component: BrandForm;
  let fixture: ComponentFixture<BrandForm>;
  let brandService: typeof mockBrandService;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset mocks
    mockBrandService.createdBrand = null;
    mockBrandService.createError = null;
    mockBrandService.updatedBrand = null;
    mockBrandService.updateError = null;
    mockBrandService.brandsError = null;
    mockBrandService.isCreatingBrand = false;
    mockBrandService.isUpdatingBrand = false;

    await TestBed.configureTestingModule({
      imports: [BrandForm],
      providers: [
        { provide: BrandService, useValue: mockBrandService },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BrandForm);
    component = fixture.componentInstance;
    brandService = TestBed.inject(BrandService) as any as typeof mockBrandService;

    fixture.detectChanges();
  });

  describe('Component Creation and Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with empty form model', () => {
      expect(component.brandModel()).toEqual({
        name: '',
      });
    });

    it('should inject BrandService', () => {
      expect(component['brandService']).toBeDefined();
    });

    it('should inject MatSnackBar', () => {
      expect(component['snackBar']).toBeDefined();
    });
  });

  describe('Form Validation', () => {
    it('should validate form state correctly', () => {
      // Set empty name - should be invalid
      component.brandModel.set({
        name: '',
      });

      const form = component.brandForm();
      form.markAsTouched();

      expect(form.invalid()).toBe(true);
    });

    it('should be valid with correct data', () => {
      component.brandModel.set({
        name: 'Valid Name',
      });

      const form = component.brandForm();
      expect(form.valid()).toBe(true);
    });

    it('should validate minimum length for name', () => {
      component.brandModel.set({
        name: 'ab',
      });

      const form = component.brandForm();
      form.markAsTouched();

      expect(form.invalid()).toBe(true);
    });

    it('should validate maximum length for name', () => {
      const longName = 'a'.repeat(51);
      component.brandModel.set({
        name: longName,
      });

      const form = component.brandForm();
      form.markAsTouched();

      expect(form.invalid()).toBe(true);
    });
  });

  describe('onSubmit Method', () => {
    it('should not submit when form is invalid', () => {
      // Set invalid data
      component.brandModel.set({
        name: '', // Invalid - required
      });

      component.onSubmit();

      expect(brandService.createBrand).not.toHaveBeenCalled();
    });

    it('should mark form as touched when invalid', () => {
      component.brandModel.set({
        name: '', // Invalid - required
      });

      const form = component.brandForm();
      const markAsTouchedSpy = vi.spyOn(form, 'markAsTouched');

      component.onSubmit();

      expect(markAsTouchedSpy).toHaveBeenCalled();
    });

    it('should call BrandService.createBrand when form is valid', () => {
      component.brandModel.set({
        name: 'Test Brand',
      });

      component.onSubmit();

      expect(brandService.createBrand).toHaveBeenCalledWith({
        name: 'Test Brand',
      });
    });
  });

  describe('Loading State', () => {
    it('should return false when service is not creating brand', () => {
      brandService.isCreatingBrand = false;

      expect(component.isLoading).toBe(false);
    });

    it('should return true when service is creating brand', () => {
      brandService.isCreatingBrand = true;

      expect(component.isLoading).toBe(true);
    });

    it('should return true when service is updating brand', () => {
      brandService.isUpdatingBrand = true;

      expect(component.isLoading).toBe(true);
    });
  });

  describe('resetForm Method', () => {
    it('should reset brandModel to initial state', () => {
      // Fill the model with data
      component.brandModel.set({
        name: 'Test Name',
      });

      // Call private method
      component['resetForm']();

      expect(component.brandModel()).toEqual({
        name: '',
      });
    });

    it('should reset form controls', () => {
      const form = component.brandForm();
      component.brandModel.set({
        name: 'Test Name',
      });

      const resetSpy = vi.spyOn(form, 'reset');

      // Call private method
      component['resetForm']();

      expect(resetSpy).toHaveBeenCalled();
    });
  });

  describe('Service Integration', () => {
    it('should have access to BrandService methods', () => {
      expect(component['brandService']).toBeDefined();
      expect(typeof component['brandService'].createBrand).toBe('function');
      expect(typeof component['brandService'].resetCreateTrigger).toBe('function');
    });

    it('should have access to MatSnackBar methods', () => {
      expect(component['snackBar']).toBeDefined();
      expect(typeof component['snackBar'].open).toBe('function');
    });

    it('should use BrandService properties for loading state', () => {
      brandService.isCreatingBrand = false;
      expect(component.isLoading).toBe(false);

      brandService.isCreatingBrand = true;
      expect(component.isLoading).toBe(true);
    });
  });

  describe('Form Integration', () => {
    it('should reflect model changes in form value', () => {
      component.brandModel.set({
        name: 'New Name',
      });

      const form = component.brandForm();

      expect(form.value()).toEqual({
        name: 'New Name',
      });
    });

    it('should maintain form-model synchronization', () => {
      const testData = {
        name: 'Brand Name',
      };

      component.brandModel.set(testData);

      const formValue = component.brandForm().value();
      const modelValue = component.brandModel();

      expect(formValue).toEqual(modelValue);
      expect(formValue).toEqual(testData);
    });
  });

  describe('Component Template Integration', () => {
    it('should render mat-dialog-title', () => {
      const compiled = fixture.debugElement.nativeElement;
      const title = compiled.querySelector('h2[mat-dialog-title]');

      expect(title).not.toBeNull();
      expect(title.textContent).toContain('New Brand');
    });

    it('should render form with name input field', () => {
      const compiled = fixture.debugElement.nativeElement;
      const formFields = compiled.querySelectorAll('mat-form-field');
      const nameInput = compiled.querySelector('input[matinput]');
      const nameLabels = compiled.querySelectorAll('mat-label');

      expect(formFields.length).toBeGreaterThan(0);
      expect(nameInput).not.toBeNull();
      expect(nameLabels.length).toBeGreaterThan(0);
      expect(nameLabels[0].textContent).toContain('Brand Name');
    });

    it('should render submit button with correct text', () => {
      const compiled = fixture.debugElement.nativeElement;
      const button = compiled.querySelector('button[mat-raised-button][color="primary"]');

      expect(button).not.toBeNull();
      expect(button.textContent).toContain('Create Brand');
    });

    it('should show loading state when creating brand', () => {
      brandService.isCreatingBrand = true;
      fixture.detectChanges();

      expect(component.isLoading).toBe(true);
    });

    it('should disable submit button when form is invalid', () => {
      component.brandModel.set({ name: '' });
      const form = component.brandForm();
      form.markAsTouched();
      fixture.detectChanges();

      const compiled = fixture.debugElement.nativeElement;
      const button = compiled.querySelector('button[mat-raised-button][color="primary"]');

      expect(button).not.toBeNull();
      expect(button.disabled).toBe(true);
    });

    it('should enable submit button when form is valid', () => {
      component.brandModel.set({ name: 'Valid Name' });
      fixture.detectChanges();

      const compiled = fixture.debugElement.nativeElement;
      const button = compiled.querySelector('button[mat-raised-button][color="primary"]');

      expect(button).not.toBeNull();
      expect(button.disabled).toBe(false);
    });

    it('should display error messages when form is invalid and touched', () => {
      component.brandModel.set({ name: '' });
      const form = component.brandForm();
      form.markAsTouched();
      fixture.detectChanges();

      const compiled = fixture.debugElement.nativeElement;
      const errors = compiled.querySelectorAll('mat-error');

      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Edit Mode', () => {
    it('should call BrandService.updateBrand when in edit mode', () => {
      // Simulate edit mode
      component['brandId'] = '123';
      Object.defineProperty(component, 'isEditMode', { get: () => true });

      component.brandModel.set({
        name: 'Updated Brand',
      });

      component.onSubmit();

      expect(brandService.updateBrand).toHaveBeenCalledWith('123', {
        name: 'Updated Brand',
      });
    });
  });
});
