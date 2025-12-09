import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MatSnackBar } from '@angular/material/snack-bar';

import { CategoryForm } from './category-form';
import { CategoryService, ICategoryResponse } from '@features/category/services/category';

// Mock del CategoryService
const mockCategoryService = {
  createdCategory: null as ICategoryResponse | null,
  createError: null as Error | null,
  updatedCategory: null as ICategoryResponse | null,
  updateError: null as Error | null,
  isCreatingCategory: false,
  isUpdatingCategory: false,
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  resetCreateTrigger: vi.fn(),
  resetUpdateTrigger: vi.fn(),
};

// Mock del MatSnackBar
const mockSnackBar = {
  open: vi.fn(),
};

describe('CategoryForm', () => {
  let component: CategoryForm;
  let fixture: ComponentFixture<CategoryForm>;
  let categoryService: typeof mockCategoryService;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset mocks
    mockCategoryService.createdCategory = null;
    mockCategoryService.createError = null;
    mockCategoryService.updatedCategory = null;
    mockCategoryService.updateError = null;
    mockCategoryService.isCreatingCategory = false;
    mockCategoryService.isUpdatingCategory = false;

    await TestBed.configureTestingModule({
      imports: [CategoryForm],
      providers: [
        { provide: CategoryService, useValue: mockCategoryService },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryForm);
    component = fixture.componentInstance;
    categoryService = TestBed.inject(CategoryService) as any as typeof mockCategoryService;

    fixture.detectChanges();
  });

  describe('Component Creation and Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with empty form model', () => {
      expect(component.categoryModel()).toEqual({
        name: '',
        description: '',
      });
    });

    it('should inject CategoryService', () => {
      expect(component['categoryService']).toBeDefined();
    });

    it('should inject MatSnackBar', () => {
      expect(component['snackBar']).toBeDefined();
    });
  });

  describe('Form Validation', () => {
    it('should validate form state correctly', () => {
      // Set empty name - should be invalid
      component.categoryModel.set({
        name: '',
        description: '',
      });

      const form = component.categoryForm();
      form.markAsTouched();

      expect(form.invalid()).toBe(true);
    });

    it('should be valid with correct data', () => {
      component.categoryModel.set({
        name: 'Valid Name',
        description: 'Valid description',
      });

      const form = component.categoryForm();
      expect(form.valid()).toBe(true);
    });

    it('should validate minimum length for name', () => {
      component.categoryModel.set({
        name: 'ab',
        description: '',
      });

      const form = component.categoryForm();
      form.markAsTouched();

      expect(form.invalid()).toBe(true);
    });

    it('should validate maximum length for name', () => {
      const longName = 'a'.repeat(51);
      component.categoryModel.set({
        name: longName,
        description: '',
      });

      const form = component.categoryForm();
      form.markAsTouched();

      expect(form.invalid()).toBe(true);
    });

    it('should validate maximum length for description', () => {
      const longDescription = 'a'.repeat(201);
      component.categoryModel.set({
        name: 'Valid Name',
        description: longDescription,
      });

      const form = component.categoryForm();
      form.markAsTouched();

      expect(form.invalid()).toBe(true);
    });
  });
  describe('onSubmit Method', () => {
    it('should not submit when form is invalid', () => {
      // Set invalid data
      component.categoryModel.set({
        name: '', // Invalid - required
        description: '',
      });

      component.onSubmit();

      expect(categoryService.createCategory).not.toHaveBeenCalled();
    });

    it('should mark form as touched when invalid', () => {
      component.categoryModel.set({
        name: '', // Invalid - required
        description: '',
      });

      const form = component.categoryForm();
      const markAsTouchedSpy = vi.spyOn(form, 'markAsTouched');

      component.onSubmit();

      expect(markAsTouchedSpy).toHaveBeenCalled();
    });

    it('should call CategoryService.createCategory when form is valid', () => {
      component.categoryModel.set({
        name: 'Test Category',
        description: 'Test Description',
      });

      component.onSubmit();

      expect(categoryService.createCategory).toHaveBeenCalledWith({
        name: 'Test Category',
        description: 'Test Description',
      });
    });
  });

  describe('Loading State', () => {
    it('should return false when service is not creating category', () => {
      categoryService.isCreatingCategory = false;

      expect(component.isLoading).toBe(false);
    });

    it('should return true when service is creating category', () => {
      categoryService.isCreatingCategory = true;

      expect(component.isLoading).toBe(true);
    });
  });

  describe('resetForm Method', () => {
    it('should reset categoryModel to initial state', () => {
      // Fill the model with data
      component.categoryModel.set({
        name: 'Test Name',
        description: 'Test Description',
      });

      // Call private method
      component['resetForm']();

      expect(component.categoryModel()).toEqual({
        name: '',
        description: '',
      });
    });

    it('should reset form controls', () => {
      const form = component.categoryForm();
      component.categoryModel.set({
        name: 'Test Name',
        description: 'Test Description',
      });

      const resetSpy = vi.spyOn(form, 'reset');

      // Call private method
      component['resetForm']();

      expect(resetSpy).toHaveBeenCalled();
    });
  });

  describe('Service Integration', () => {
    it('should have access to CategoryService methods', () => {
      expect(component['categoryService']).toBeDefined();
      expect(typeof component['categoryService'].createCategory).toBe('function');
      expect(typeof component['categoryService'].resetCreateTrigger).toBe('function');
    });

    it('should have access to MatSnackBar methods', () => {
      expect(component['snackBar']).toBeDefined();
      expect(typeof component['snackBar'].open).toBe('function');
    });

    it('should use CategoryService properties for loading state', () => {
      categoryService.isCreatingCategory = false;
      expect(component.isLoading).toBe(false);

      categoryService.isCreatingCategory = true;
      expect(component.isLoading).toBe(true);
    });
  });

  describe('Form Integration', () => {
    it('should reflect model changes in form value', () => {
      component.categoryModel.set({
        name: 'New Name',
        description: 'New Description',
      });

      const form = component.categoryForm();

      expect(form.value()).toEqual({
        name: 'New Name',
        description: 'New Description',
      });
    });

    it('should maintain form-model synchronization', () => {
      const testData = {
        name: 'Category Name',
        description: 'Category Description',
      };

      component.categoryModel.set(testData);

      const formValue = component.categoryForm().value();
      const modelValue = component.categoryModel();

      expect(formValue).toEqual(modelValue);
      expect(formValue).toEqual(testData);
    });
  });

  describe('Component Template Integration', () => {
    it('should render mat-dialog-title', () => {
      const compiled = fixture.debugElement.nativeElement;
      const title = compiled.querySelector('h2[mat-dialog-title]');

      expect(title).not.toBeNull();
      expect(title.textContent).toContain('Nueva Categoría');
    });

    it('should render form with name input field', () => {
      const compiled = fixture.debugElement.nativeElement;
      const formFields = compiled.querySelectorAll('mat-form-field');
      const nameInput = compiled.querySelector('input[matinput]');
      const nameLabels = compiled.querySelectorAll('mat-label');

      expect(formFields.length).toBeGreaterThan(0);
      expect(nameInput).not.toBeNull();
      expect(nameLabels.length).toBeGreaterThan(0);
      expect(nameLabels[0].textContent).toContain('Nombre');
    });

    it('should render form with description textarea', () => {
      const compiled = fixture.debugElement.nativeElement;
      const textarea = compiled.querySelector('textarea[matinput]');

      expect(textarea).not.toBeNull();
      expect(textarea.getAttribute('rows')).toBe('3');
      expect(textarea.getAttribute('placeholder')).toContain('Describe brevemente');
    });

    it('should render submit button with correct text', () => {
      const compiled = fixture.debugElement.nativeElement;
      const button = compiled.querySelector('button[mat-raised-button][color="primary"]');

      expect(button).not.toBeNull();
      expect(button.textContent).toContain('Crear Categoría');
    });

    it('should show loading state and text when creating category', () => {
      categoryService.isCreatingCategory = true;
      fixture.detectChanges();

      expect(component.isLoading).toBe(true);
    });

    it('should disable submit button when form is invalid', () => {
      component.categoryModel.set({ name: '', description: '' });
      const form = component.categoryForm();
      form.markAsTouched();
      fixture.detectChanges();

      const compiled = fixture.debugElement.nativeElement;
      const button = compiled.querySelector('button[mat-raised-button][color="primary"]');

      expect(button).not.toBeNull();
      expect(button.disabled).toBe(true);
    });

    it('should enable submit button when form is valid', () => {
      component.categoryModel.set({ name: 'Valid Name', description: 'Valid description' });
      fixture.detectChanges();

      const compiled = fixture.debugElement.nativeElement;
      const button = compiled.querySelector('button[mat-raised-button][color="primary"]');

      expect(button).not.toBeNull();
      expect(button.disabled).toBe(false);
    });

    it('should display error messages when form is invalid and touched', () => {
      component.categoryModel.set({ name: '', description: '' });
      const form = component.categoryForm();
      form.markAsTouched();
      fixture.detectChanges();

      const compiled = fixture.debugElement.nativeElement;
      const errors = compiled.querySelectorAll('mat-error');

      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
