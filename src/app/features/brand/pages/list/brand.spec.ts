import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { Brand } from './brand';
import { BrandService } from '@features/brand/services/brand';
import { IBrandResponse } from '@features/brand/interfaces/brand-response.interface';

describe('Brand List Component', () => {
  let component: Brand;
  let fixture: ComponentFixture<Brand>;
  let mockBrandService: any;
  let dialog: MatDialog;

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

  beforeEach(async () => {
    mockBrandService = {
      brands: mockBrands,
      isLoadingBrands: false,
      brandsError: undefined,
      loadAllBrands: vi.fn(),
      reloadBrands: vi.fn(),
      resetCreateTrigger: vi.fn(),
      resetUpdateTrigger: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [Brand],
      providers: [{ provide: BrandService, useValue: mockBrandService }],
    }).compileComponents();

    fixture = TestBed.createComponent(Brand);
    component = fixture.componentInstance;
    dialog = TestBed.inject(MatDialog);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Rendering States', () => {
    it('should display loading spinner when isLoading is true', async () => {
      // Create new test module with loading state
      mockBrandService.isLoadingBrands = true;
      mockBrandService.brands = [];

      const testFixture = TestBed.createComponent(Brand);
      testFixture.detectChanges();
      await testFixture.whenStable();

      const compiled = testFixture.nativeElement;
      const spinner = compiled.querySelector('mat-spinner');
      const loadingText = compiled.querySelector('.loading-container p');

      expect(spinner).toBeTruthy();
      expect(loadingText?.textContent).toContain('Cargando marcas...');
    });

    it('should display error message when hasError is true', async () => {
      mockBrandService.brandsError = 'Error loading brands';
      mockBrandService.isLoadingBrands = false;
      mockBrandService.brands = [];

      const testFixture = TestBed.createComponent(Brand);
      testFixture.detectChanges();
      await testFixture.whenStable();

      const compiled = testFixture.nativeElement;
      const errorIcon = compiled.querySelector('.error-container mat-icon');
      const errorText = compiled.querySelector('.error-container p');

      expect(errorIcon).toBeTruthy();
      expect(errorIcon?.textContent).toContain('error');
      expect(errorText).toBeTruthy();
      expect(errorText?.textContent).toContain('Error al cargar las marcas');
    });

    it('should display empty state when brands array is empty', async () => {
      mockBrandService.brands = [];
      mockBrandService.isLoadingBrands = false;
      mockBrandService.brandsError = undefined;

      const testFixture = TestBed.createComponent(Brand);
      testFixture.detectChanges();
      await testFixture.whenStable();

      const compiled = testFixture.nativeElement;
      const emptyIcon = compiled.querySelector('.empty-container mat-icon');
      const emptyText = compiled.querySelector('.empty-container p');

      expect(emptyIcon).toBeTruthy();
      expect(emptyIcon?.textContent).toContain('inbox');
      expect(emptyText).toBeTruthy();
      expect(emptyText?.textContent).toContain('No hay marcas registradas');
    });

    it('should display table with brands when data is available', async () => {
      mockBrandService.brands = mockBrands;
      mockBrandService.isLoadingBrands = false;
      mockBrandService.brandsError = undefined;
      fixture.detectChanges();
      await fixture.whenStable();

      const compiled = fixture.nativeElement;
      const table = compiled.querySelector('table');
      const rows = compiled.querySelectorAll('tr.mat-mdc-row');

      expect(table).toBeTruthy();
      expect(rows.length).toBe(2);
    });

    it('should display brand data correctly in table', async () => {
      mockBrandService.brands = mockBrands;
      fixture.detectChanges();
      await fixture.whenStable();

      const compiled = fixture.nativeElement;
      const firstRow = compiled.querySelector('tr.mat-mdc-row');

      expect(firstRow?.textContent).toContain('Brand 1');
    });

    it('should display all table columns', async () => {
      mockBrandService.brands = mockBrands;
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
      mockBrandService.isLoadingBrands = true;

      const testFixture = TestBed.createComponent(Brand);
      testFixture.detectChanges();
      await testFixture.whenStable();

      const compiled = testFixture.nativeElement;
      const reloadButton = compiled.querySelectorAll('.page-actions button')[1];

      expect(reloadButton?.hasAttribute('disabled')).toBe(true);
    });

    it('should display edit and delete buttons for each brand', async () => {
      mockBrandService.brands = mockBrands;
      fixture.detectChanges();
      await fixture.whenStable();

      const compiled = fixture.nativeElement;
      const actionButtons = compiled.querySelectorAll('td button');

      // 2 brands * 2 buttons each = 4 buttons
      expect(actionButtons.length).toBe(4);
    });

    it('should have edit button with correct icon', async () => {
      mockBrandService.brands = mockBrands;
      fixture.detectChanges();
      await fixture.whenStable();

      const compiled = fixture.nativeElement;
      const editButton = compiled.querySelector('td button[title="Editar"]');
      const editIcon = editButton?.querySelector('mat-icon');

      expect(editIcon?.textContent).toContain('edit');
    });

    it('should have delete button with correct icon', async () => {
      mockBrandService.brands = mockBrands;
      fixture.detectChanges();
      await fixture.whenStable();

      const compiled = fixture.nativeElement;
      const deleteButton = compiled.querySelector('td button[title="Eliminar"]');
      const deleteIcon = deleteButton?.querySelector('mat-icon');

      expect(deleteIcon?.textContent).toContain('delete');
    });
  });

  describe('Component Methods', () => {
    it('should return brands from service', () => {
      expect(component.brands).toEqual(mockBrands);
    });

    it('should return isLoading from service', () => {
      mockBrandService.isLoadingBrands = true;
      expect(component.isLoading).toBe(true);
    });

    it('should return hasError from service', () => {
      mockBrandService.brandsError = 'Error';
      expect(component.hasError).toBe(true);

      mockBrandService.brandsError = undefined;
      expect(component.hasError).toBe(false);
    });

    it('should disable reload when cooldown is active', () => {
      component['reloadCooldown'].set(true);
      expect(component.isReloadDisabled).toBe(true);
    });

    it('should disable reload when loading', () => {
      mockBrandService.isLoadingBrands = true;
      expect(component.isReloadDisabled).toBe(true);
    });
  });

  describe('Dialog Interactions', () => {
    it('should open create dialog when openCreateDialog is called', () => {
      vi.spyOn(dialog, 'open').mockReturnValue({
        afterClosed: () => of(null),
      } as any);

      expect(() => component.openCreateDialog()).not.toThrow();
    });

    it('should open edit dialog with brand data', () => {
      vi.spyOn(dialog, 'open').mockReturnValue({
        afterClosed: () => of(null),
      } as any);

      const brand = mockBrands[0];
      expect(() => component.openEditDialog(brand)).not.toThrow();
    });
  });

  describe('Reload Functionality', () => {
    it('should call service reloadBrands when reload is triggered', () => {
      component.reload();

      expect(mockBrandService.reloadBrands).toHaveBeenCalled();
    });

    it('should activate cooldown after reload', () => {
      component.reload();

      expect(component.isReloadDisabled).toBe(true);
    });

    it('should deactivate cooldown after timeout', async () => {
      component.reload();
      expect(component.isReloadDisabled).toBe(true);

      await new Promise((resolve) => setTimeout(resolve, 2100)); // Slightly more than COOLDOWN_TIME

      expect(component.isReloadDisabled).toBe(false);
    });

    it('should not reload if cooldown is active', () => {
      component['reloadCooldown'].set(true);
      mockBrandService.reloadBrands.mockClear();

      component.reload();

      expect(mockBrandService.reloadBrands).not.toHaveBeenCalled();
    });
  });

  describe('Component Properties', () => {
    it('should have correct displayedColumns', () => {
      expect(component.displayedColumns).toEqual(['name', 'createdAt', 'actions']);
    });

    it('should return empty array if service brands is undefined', () => {
      mockBrandService.brands = null;
      expect(component.brands).toEqual([]);
    });
  });
});
