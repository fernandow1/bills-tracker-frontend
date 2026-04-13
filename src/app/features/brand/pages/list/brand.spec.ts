import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { Brand } from './brand';
import { IBrandResponse } from '@features/brand/interfaces/brand-response.interface';
import { BRAND_FACADE } from '@features/brand/facades/brand.facade';

describe('Brand List Component', () => {
  let component: Brand;
  let fixture: ComponentFixture<Brand>;
  let facade: any;

  const mockBrands: IBrandResponse[] = [
    {
      id: '1',
      name: 'Brand 1',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: '2',
      name: 'Brand 2',
      createdAt: '2024-01-02T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
    },
  ];

  // Mock del BRAND_FACADE basado en signals
  const mockBrandFacade = {
    brands: signal<IBrandResponse[]>(mockBrands),
    totalItems: signal(50),
    isLoading: signal(false),
    hasError: signal(false),
    searchBrands: vi.fn(),
    resetTriggers: vi.fn(),
    handleSuccess: vi.fn(),
    handleError: vi.fn(),
    isSaving: signal(false),
    createdBrand: signal(null),
    updatedBrand: signal(null),
    createError: signal(null),
    updateError: signal(null),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset signal states
    mockBrandFacade.brands.set(mockBrands);
    mockBrandFacade.totalItems.set(50);
    mockBrandFacade.isLoading.set(false);
    mockBrandFacade.hasError.set(false);

    await TestBed.configureTestingModule({
      imports: [Brand, NoopAnimationsModule],
      providers: [{ provide: BRAND_FACADE, useValue: mockBrandFacade }],
    }).compileComponents();

    fixture = TestBed.createComponent(Brand);
    component = fixture.componentInstance;
    facade = TestBed.inject(BRAND_FACADE);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Rendering States', () => {
    it('should display loading spinner when isLoading is true', async () => {
      mockBrandFacade.isLoading.set(true);
      mockBrandFacade.brands.set([]);

      fixture.detectChanges();
      await fixture.whenStable();

      const compiled = fixture.nativeElement;
      const spinner = compiled.querySelector('mat-spinner');
      const loadingText = compiled.querySelector('.loading-container p');

      expect(spinner).toBeTruthy();
      expect(loadingText?.textContent).toContain('Cargando marcas...');
    });

    it('should display error message when hasError is true', async () => {
      mockBrandFacade.hasError.set(true);
      mockBrandFacade.isLoading.set(false);
      mockBrandFacade.brands.set([]);

      fixture.detectChanges();
      await fixture.whenStable();

      const compiled = fixture.nativeElement;
      const errorIcon = compiled.querySelector('.error-container mat-icon');
      const errorText = compiled.querySelector('.error-container p');

      expect(errorIcon).toBeTruthy();
      expect(errorIcon?.textContent).toContain('error');
      expect(errorText).toBeTruthy();
      expect(errorText?.textContent).toContain('Error al cargar las marcas');
    });

    it('should display empty state when brands array is empty', async () => {
      mockBrandFacade.brands.set([]);
      mockBrandFacade.isLoading.set(false);
      mockBrandFacade.hasError.set(false);

      fixture.detectChanges();
      await fixture.whenStable();

      const compiled = fixture.nativeElement;
      const emptyIcon = compiled.querySelector('.empty-container mat-icon');
      const emptyText = compiled.querySelector('.empty-container p');

      expect(emptyIcon).toBeTruthy();
      expect(emptyIcon?.textContent).toContain('inbox');
      expect(emptyText).toBeTruthy();
      expect(emptyText?.textContent).toContain('No hay marcas registradas');
    });

    it('should display table with brands when data is available', async () => {
      mockBrandFacade.brands.set(mockBrands);
      mockBrandFacade.isLoading.set(false);
      mockBrandFacade.hasError.set(false);
      fixture.detectChanges();
      await fixture.whenStable();

      const compiled = fixture.nativeElement;
      const table = compiled.querySelector('table');
      const rows = compiled.querySelectorAll('tr.mat-mdc-row');

      expect(table).toBeTruthy();
      expect(rows.length).toBe(2);
    });

    it('should display brand data correctly in table', async () => {
      mockBrandFacade.brands.set(mockBrands);
      fixture.detectChanges();
      await fixture.whenStable();

      const compiled = fixture.nativeElement;
      const firstRow = compiled.querySelector('tr.mat-mdc-row');

      expect(firstRow?.textContent).toContain('Brand 1');
    });

    it('should display all table columns', async () => {
      mockBrandFacade.brands.set(mockBrands);
      fixture.detectChanges();
      await fixture.whenStable();

      const compiled = fixture.nativeElement;
      const headers = compiled.querySelectorAll('th.mat-mdc-header-cell');

      expect(headers.length).toBe(3);
      expect(headers[0]?.textContent).toContain('Nombre');
      expect(headers[1]?.textContent).toContain('Fecha de Creación');
      expect(headers[2]?.textContent).toContain('Acciones');
    });
  });

  describe('Action Buttons', () => {
    it('should display create and reload buttons', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      const compiled = fixture.nativeElement;
      const buttons = compiled.querySelectorAll('.page-actions button');

      expect(buttons.length).toBe(2);
      expect(buttons[0]?.textContent).toContain('Nueva Marca');
      expect(buttons[1]?.textContent).toContain('Actualizar');
    });

    it('should disable reload button when loading', async () => {
      mockBrandFacade.isLoading.set(true);
      fixture.detectChanges();
      await fixture.whenStable();

      const compiled = fixture.nativeElement;
      const reloadButton = compiled.querySelectorAll('.page-actions button')[1];

      expect(reloadButton?.hasAttribute('disabled')).toBe(true);
    });

    it('should display edit and delete buttons for each brand', async () => {
      mockBrandFacade.brands.set(mockBrands);
      fixture.detectChanges();
      await fixture.whenStable();

      const compiled = fixture.nativeElement;
      const actionButtons = compiled.querySelectorAll('td button');

      // 2 brands * 2 buttons each = 4 buttons
      expect(actionButtons.length).toBe(4);
    });
  });

  describe('Component Methods', () => {
    it('should return brands from facade', () => {
      expect(component.brands()).toEqual(mockBrands);
    });

    it('should return isLoading from facade', () => {
      mockBrandFacade.isLoading.set(true);
      expect(component.isLoading()).toBe(true);
    });

    it('should return hasError from facade', () => {
      mockBrandFacade.hasError.set(true);
      expect(component.hasError()).toBe(true);

      mockBrandFacade.hasError.set(false);
      expect(component.hasError()).toBe(false);
    });

    it('should disable reload when cooldown is active', () => {
      component['reloadCooldown'].set(true);
      expect(component.isReloadDisabled).toBe(true);
    });

    it('should disable reload when loading', () => {
      mockBrandFacade.isLoading.set(true);
      expect(component.isReloadDisabled).toBe(true);
    });
  });

  describe('Dialog Interactions', () => {
    it('should open create dialog when openCreateDialog is called', () => {
      // Espiar el prototipo para asegurar la captura en componentes standalone
      const openSpy = vi.spyOn(MatDialog.prototype, 'open').mockReturnValue({
        afterClosed: () => of(null),
      } as any);

      component.openCreateDialog();
      expect(openSpy).toHaveBeenCalled();
      openSpy.mockRestore();
    });

    it('should open edit dialog with brand data', () => {
      const openSpy = vi.spyOn(MatDialog.prototype, 'open').mockReturnValue({
        afterClosed: () => of(null),
      } as any);

      const brand = mockBrands[0];
      component.openEditDialog(brand);
      expect(openSpy).toHaveBeenCalled();
      openSpy.mockRestore();
    });
  });

  describe('Reload Functionality', () => {
    it('should call facade searchBrands when reload is triggered', () => {
      component.reload();

      expect(facade.searchBrands).toHaveBeenCalledWith(1, 10);
    });

    it('should activate cooldown after reload', () => {
      component.reload();

      expect(component.isReloadDisabled).toBe(true);
    });

    it('should deactivate cooldown after timeout', async () => {
      component.reload();
      expect(component.isReloadDisabled).toBe(true);

      await new Promise((resolve) => setTimeout(resolve, 2100));

      expect(component.isReloadDisabled).toBe(false);
    });

    it('should not reload if cooldown is active', () => {
      component['reloadCooldown'].set(true);
      facade.searchBrands.mockClear();

      component.reload();

      expect(facade.searchBrands).not.toHaveBeenCalled();
    });
  });

  describe('Component Properties', () => {
    it('should have correct displayedColumns', () => {
      expect(component.displayedColumns).toEqual(['name', 'createdAt', 'actions']);
    });

    it('should have default pagination values', () => {
      expect(component.currentPage).toBe(1);
      expect(component.pageSize).toBe(10);
      expect(component.pageSizeOptions).toEqual([5, 10, 25, 50]);
    });
  });

  describe('Pagination', () => {
    it('should call searchBrands on page change', () => {
      const event: PageEvent = { pageIndex: 1, pageSize: 10, length: 100 };
      facade.searchBrands.mockClear();

      component.onPageChange(event);

      expect(component.currentPage).toBe(2);
      expect(facade.searchBrands).toHaveBeenCalledWith(2, 10);
    });

    it('should update pageSize on page change', () => {
      const event: PageEvent = { pageIndex: 0, pageSize: 25, length: 100 };
      facade.searchBrands.mockClear();

      component.onPageChange(event);

      expect(component.pageSize).toBe(25);
      expect(facade.searchBrands).toHaveBeenCalledWith(1, 25);
    });

    it('should return totalItems from facade', () => {
      mockBrandFacade.totalItems.set(50);
      expect(component.totalItems()).toBe(50);
    });
  });
});
