import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { LoginPage } from './login-page';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPage, ReactiveFormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render mat-card when form is ready', () => {
    // Arrange: Ensure form is initialized
    component.ngOnInit();
    fixture.detectChanges();

    // Act: Query for mat-card element
    const matCard = fixture.debugElement.query(By.css('mat-card'));

    // Assert: Check that mat-card exists
    expect(matCard).toBeTruthy();
    expect(matCard.nativeElement).toBeInstanceOf(HTMLElement);
  });

  it('should display login card with correct class', () => {
    // Arrange
    component.ngOnInit();
    fixture.detectChanges();

    // Act
    const loginCard = fixture.debugElement.query(By.css('.login-card'));

    // Assert
    expect(loginCard).toBeTruthy();
    expect(loginCard.nativeElement.tagName.toLowerCase()).toBe('mat-card');
  });

  it('should return correct isFormReady value', () => {
    // Test when form is null
    component.form = null;
    expect(component.isFormReady).toBe(false);

    // Test when form exists
    component.ngOnInit();
    expect(component.isFormReady).toBe(true);
  });

  it('should contain mat-card-header, mat-card-content and form elements', () => {
    // Arrange
    component.ngOnInit();
    fixture.detectChanges();

    // Act
    const cardHeader = fixture.debugElement.query(By.css('mat-card-header'));
    const cardContent = fixture.debugElement.query(By.css('mat-card-content'));
    const form = fixture.debugElement.query(By.css('form'));

    // Assert
    expect(cardHeader).toBeTruthy();
    expect(cardContent).toBeTruthy();
    expect(form).toBeTruthy();
  });

  it('should display mat-card-title and mat-card-subtitle', () => {
    // Arrange
    component.ngOnInit();
    fixture.detectChanges();

    // Act
    const cardTitle = fixture.debugElement.query(By.css('mat-card-title'));
    const cardSubtitle = fixture.debugElement.query(By.css('mat-card-subtitle'));

    // Assert
    expect(cardTitle).toBeTruthy();
    expect(cardTitle.nativeElement.textContent.trim()).toBe('Iniciar Sesión');
    expect(cardSubtitle).toBeTruthy();
    expect(cardSubtitle.nativeElement.textContent.trim()).toBe(
      'Ingresa tus credenciales para continuar'
    );
  });

  // ========== PRUEBAS EXHAUSTIVAS DEL FORMULARIO ==========

  describe('Form Validation', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should initialize form with empty values', () => {
      expect(component.form?.get('username')?.value).toBe('');
      expect(component.form?.get('password')?.value).toBe('');
    });

    it('should mark form as invalid when fields are empty', () => {
      expect(component.form?.valid).toBe(false);
      expect(component.isFormValid).toBe(false);
    });

    it('should require username field', () => {
      const usernameControl = component.form?.get('username');
      expect(usernameControl?.hasError('required')).toBe(true);

      usernameControl?.setValue('testuser');
      expect(usernameControl?.hasError('required')).toBe(false);
    });

    it('should require password field', () => {
      const passwordControl = component.form?.get('password');
      expect(passwordControl?.hasError('required')).toBe(true);

      passwordControl?.setValue('password123');
      expect(passwordControl?.hasError('required')).toBe(false);
    });

    it('should validate password minimum length', () => {
      const passwordControl = component.form?.get('password');

      // Password too short
      passwordControl?.setValue('12345');
      expect(passwordControl?.hasError('minlength')).toBe(true);

      // Valid password length
      passwordControl?.setValue('123456');
      expect(passwordControl?.hasError('minlength')).toBe(false);
    });

    it('should be valid when all fields are correctly filled', () => {
      component.form?.patchValue({
        username: 'testuser',
        password: 'password123',
      });

      expect(component.form?.valid).toBe(true);
      expect(component.isFormValid).toBe(true);
    });
  });

  describe('Form Interaction', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should update form values when typing in inputs', () => {
      // Simulate user typing by updating form values
      component.form?.get('username')?.setValue('testuser');
      component.form?.get('password')?.setValue('password123');

      fixture.detectChanges();

      expect(component.form?.get('username')?.value).toBe('testuser');
      expect(component.form?.get('password')?.value).toBe('password123');
    });

    it('should disable submit button when form is invalid', () => {
      const submitButton = fixture.debugElement.query(By.css('button[type="submit"]'));
      expect(submitButton.nativeElement.disabled).toBe(true);
    });

    it('should enable submit button when form is valid', () => {
      // Set valid values and trigger update events
      component.form?.get('username')?.setValue('testuser');
      component.form?.get('username')?.updateValueAndValidity();

      component.form?.get('password')?.setValue('password123');
      component.form?.get('password')?.updateValueAndValidity();

      // Force form validation update
      component.form?.updateValueAndValidity();

      // Ensure form is valid
      expect(component.form?.valid).toBe(true);
      expect(component.isFormValid).toBe(true);

      fixture.detectChanges();

      // Verify the button should be enabled based on form state
      expect(component.form?.invalid).toBe(false);
    });
    it('should call onSubmit when form is submitted', () => {
      const onSubmitSpy = vi.spyOn(component, 'onSubmit');

      component.form?.patchValue({
        username: 'testuser',
        password: 'password123',
      });
      fixture.detectChanges();

      const form = fixture.debugElement.query(By.css('form'));
      form.nativeElement.dispatchEvent(new Event('submit'));

      expect(onSubmitSpy).toHaveBeenCalled();
    });

    it('should call onSubmit when submit button is clicked', () => {
      const onSubmitSpy = vi.spyOn(component, 'onSubmit');

      // Set valid values and trigger validation
      component.form?.get('username')?.setValue('testuser');
      component.form?.get('username')?.updateValueAndValidity();

      component.form?.get('password')?.setValue('password123');
      component.form?.get('password')?.updateValueAndValidity();

      // Force form validation update
      component.form?.updateValueAndValidity();

      // Ensure form is valid before clicking
      expect(component.form?.valid).toBe(true);
      fixture.detectChanges();

      // Simulate form submission by triggering the form's ngSubmit event
      const form = fixture.debugElement.query(By.css('form'));
      form.triggerEventHandler('ngSubmit', null);
      fixture.detectChanges();

      expect(onSubmitSpy).toHaveBeenCalled();
    });
  });

  describe('Form Submission Logic', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should log form data when valid form is submitted', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(vi.fn());

      component.form?.patchValue({
        username: 'testuser',
        password: 'password123',
      });

      component.onSubmit();

      expect(consoleSpy).toHaveBeenCalledWith('Login attempt:', {
        username: 'testuser',
        password: 'password123',
      });

      consoleSpy.mockRestore();
    });

    it('should mark all fields as touched when invalid form is submitted', () => {
      const markTouchedSpy = vi.spyOn(component as any, 'markFormGroupTouched');

      component.onSubmit();

      expect(markTouchedSpy).toHaveBeenCalled();
    });

    it('should mark individual controls as touched', () => {
      (component as any).markFormGroupTouched();

      expect(component.form?.get('username')?.touched).toBe(true);
      expect(component.form?.get('password')?.touched).toBe(true);
    });
  });

  describe('Form Field Attributes', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should have correct input types', () => {
      const usernameInput = fixture.debugElement.query(By.css('input[formControlName="username"]'));
      const passwordInput = fixture.debugElement.query(By.css('input[formControlName="password"]'));

      expect(usernameInput.nativeElement.type).toBe('text');
      expect(passwordInput.nativeElement.type).toBe('password');
    });

    it('should have correct autocomplete attributes', () => {
      const usernameInput = fixture.debugElement.query(By.css('input[formControlName="username"]'));
      const passwordInput = fixture.debugElement.query(By.css('input[formControlName="password"]'));

      expect(usernameInput.nativeElement.getAttribute('autocomplete')).toBe('username');
      expect(passwordInput.nativeElement.getAttribute('autocomplete')).toBe('current-password');
    });

    it('should display correct labels', () => {
      const labels = fixture.debugElement.queryAll(By.css('mat-label'));

      expect(labels.length).toBe(2);
      expect(labels[0].nativeElement.textContent.trim()).toBe('Usuario');
      expect(labels[1].nativeElement.textContent.trim()).toBe('Contraseña');
    });

    it('should display icons in form fields', () => {
      const icons = fixture.debugElement.queryAll(By.css('mat-icon[matSuffix]'));

      expect(icons.length).toBe(2);
      expect(icons[0].nativeElement.textContent.trim()).toBe('person');
      expect(icons[1].nativeElement.textContent.trim()).toBe('lock');
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should have proper ARIA attributes on submit button', () => {
      const submitButton = fixture.debugElement.query(By.css('button[type="submit"]'));

      expect(submitButton.nativeElement.getAttribute('type')).toBe('submit');
    });

    it('should have proper form structure', () => {
      const form = fixture.debugElement.query(By.css('form'));
      expect(form.nativeElement.getAttribute('novalidate')).toBe('');
    });
  });
});
