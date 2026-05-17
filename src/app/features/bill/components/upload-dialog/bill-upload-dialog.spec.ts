import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { BillUploadDialog } from './bill-upload-dialog';
import { BillService } from '@features/bill/services/bill';
import { CurrencyService } from '@features/currency/services/currency';
import { PaymentMethodService } from '@features/payment-method/services/payment-method';
import { ShopService } from '@features/shop/services/shop';
import { AuthService } from '@features/auth/services/auth.service';

describe('BillUploadDialog', () => {
  let component: BillUploadDialog;
  let fixture: ComponentFixture<BillUploadDialog>;

  // Mocks
  const mockDialogRef = {
    close: vi.fn(),
  };

  const mockResourceStatus = signal('idle');

  const mockBillService = {
    uploadBillImage: vi.fn(),
    extractImageResource: {
      status: mockResourceStatus,
    },
  };

  const mockCurrencyService = {
    loadAllCurrencies: vi.fn(),
    get currencies() {
      return [];
    },
  };

  const mockPaymentMethodService = {
    loadAllPaymentMethods: vi.fn(),
    get paymentMethods() {
      return [];
    },
  };

  const mockShopService = {
    searchShops: vi.fn(),
    get searchedShops() {
      return [];
    },
  };

  const mockAuthService = {
    getUserId: vi.fn().mockReturnValue('mock-user-id'),
  };

  beforeEach(async () => {
    // Definimos getters dinámicos para properties computados
    Object.defineProperty(mockCurrencyService, 'currencies', { value: [] });
    Object.defineProperty(mockPaymentMethodService, 'paymentMethods', { value: [] });
    Object.defineProperty(mockShopService, 'searchedShops', { value: [] });

    await TestBed.configureTestingModule({
      imports: [BillUploadDialog, ReactiveFormsModule, BrowserAnimationsModule],
      providers: [
        FormBuilder,
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: BillService, useValue: mockBillService },
        { provide: CurrencyService, useValue: mockCurrencyService },
        { provide: PaymentMethodService, useValue: mockPaymentMethodService },
        { provide: ShopService, useValue: mockShopService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BillUploadDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.clearAllMocks();
    mockResourceStatus.set('idle');
  });

  describe('Initialization', () => {
    it('debe crear el componente', () => {
      expect(component).toBeTruthy();
    });

    it('debe llamar a los metodos de inicializacion de servicios', () => {
      expect(mockCurrencyService.loadAllCurrencies).toHaveBeenCalled();
      expect(mockPaymentMethodService.loadAllPaymentMethods).toHaveBeenCalled();
      expect(mockShopService.searchShops).toHaveBeenCalledWith(1, 25);
    });

    it('debe inicializar el formulario por defecto', () => {
      expect(component.metadataForm).toBeDefined();
      expect(component.metadataForm.get('purchasedAt')?.value).toBeTruthy();
    });
  });

  describe('onFileSelected', () => {
    it('debe setear un archivo valido (imagen) y limpiar el error', () => {
      const file = new File([''], 'test.png', { type: 'image/png' });
      const mockEvent = {
        target: { files: [file] },
      } as unknown as Event;

      component.onFileSelected(mockEvent);

      expect(component.selectedFile()).toBe(file);
      expect(component.errorMessage()).toBeNull();
    });

    it('debe mostrar error si el archivo no es imagen', () => {
      const file = new File([''], 'test.pdf', { type: 'application/pdf' });
      const mockEvent = {
        target: { files: [file] },
      } as unknown as Event;

      component.onFileSelected(mockEvent);

      expect(component.selectedFile()).toBeNull();
      expect(component.errorMessage()).toBe('Por favor, seleccione un archivo de imagen válido.');
    });
  });

  describe('onDrop', () => {
    it('debe procesar el archivo soltado valido', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const mockEvent = {
        preventDefault: vi.fn(),
        dataTransfer: { files: [file] },
      } as unknown as DragEvent;

      component.onDrop(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(component.selectedFile()).toBe(file);
      expect(component.errorMessage()).toBeNull();
    });
  });

  describe('removeFile', () => {
    it('debe limpiar el archivo y su previsualizacion', () => {
      component.selectedFile.set(new File([''], 'test.png', { type: 'image/png' }));
      component.previewUrl.set('data:image/png;base64,...');

      component.removeFile();

      expect(component.selectedFile()).toBeNull();
      expect(component.previewUrl()).toBeNull();
    });
  });

  describe('upload', () => {
    it('no debe hacer nada si no hay archivo seleccionado', () => {
      component.selectedFile.set(null);
      component.upload();

      expect(mockBillService.uploadBillImage).not.toHaveBeenCalled();
    });

    it('debe subir la imagen con la metadata correcta y cerrar modal al completarse', () => {
      const file = new File([''], 'test.png', { type: 'image/png' });
      component.selectedFile.set(file);

      component.metadataForm.patchValue({
        idShop: 10,
        idCurrency: 5,
        uuidPaymentMethod: 'abc-123',
        aiInstructions: 'test instruction',
      });

      component.upload();

      expect(component.isUploading()).toBe(true);
      expect(mockBillService.uploadBillImage).toHaveBeenCalledWith(
        file,
        expect.objectContaining({
          idShop: 10,
          idCurrency: 5,
          idUser: 'mock-user-id',
          idUserOwner: 'mock-user-id',
          uuidPaymentMethod: 'abc-123',
          aiInstructions: 'test instruction',
        }),
      );

      // Simulamos que el recurso de carga se resolvio exitosamente
      mockResourceStatus.set('resolved');
      fixture.detectChanges(); // Ejecuta los efectos (flushEffects)

      expect(component.isUploading()).toBe(false);
      expect(mockDialogRef.close).toHaveBeenCalledWith({ success: true });
    });

    it('debe setear error si la subida falla', () => {
      const file = new File([''], 'test.png', { type: 'image/png' });
      component.selectedFile.set(file);

      component.upload();

      expect(component.isUploading()).toBe(true);

      // Simulamos que el recurso falla
      mockResourceStatus.set('error');
      fixture.detectChanges();

      expect(component.isUploading()).toBe(false);
      expect(mockDialogRef.close).not.toHaveBeenCalled();
      expect(component.errorMessage()).toBe(
        'Error al subir la imagen. Por favor, intente nuevamente.',
      );
    });
  });

  describe('cancel', () => {
    it('debe cerrar el dialog', () => {
      component.cancel();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });
});
