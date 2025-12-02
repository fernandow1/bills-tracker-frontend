import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach } from 'vitest';

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
});
