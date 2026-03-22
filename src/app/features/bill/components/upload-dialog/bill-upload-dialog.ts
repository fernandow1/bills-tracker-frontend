import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BillService } from '@features/bill/services/bill';
import { CurrencyService } from '@features/currency/services/currency';
import { PaymentMethodService } from '@features/payment-method/services/payment-method';
import { ShopService } from '@features/shop/services/shop';
import { AuthService } from '@features/auth/services/auth.service';

@Component({
  selector: 'app-bill-upload-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './bill-upload-dialog.html',
  styleUrl: './bill-upload-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BillUploadDialog {
  private readonly dialogRef = inject(MatDialogRef<BillUploadDialog>);
  private readonly billService = inject(BillService);
  private readonly currencyService = inject(CurrencyService);
  private readonly paymentMethodService = inject(PaymentMethodService);
  private readonly shopService = inject(ShopService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  public selectedFile = signal<File | null>(null);
  public previewUrl = signal<string | null>(null);
  public isUploading = signal<boolean>(false);
  public errorMessage = signal<string | null>(null);

  public readonly currencies = computed(() => this.currencyService.currencies ?? []);
  public readonly paymentMethods = computed(() => this.paymentMethodService.paymentMethods ?? []);
  public readonly shops = computed(() => this.shopService.searchedShops ?? []);

  public metadataForm = this.fb.group({
    purchasedAt: [new Date().toISOString().split('T')[0]],
    idShop: [null as number | null],
    idCurrency: [null as number | null],
    uuidPaymentMethod: [null as string | null],
    aiInstructions: [''],
  });

  constructor() {
    this.currencyService.loadAllCurrencies();
    this.paymentMethodService.loadAllPaymentMethods();
    this.shopService.searchShops(1, 25);
  }

  public onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  public onDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  public onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  private handleFile(file: File): void {
    if (file.type.startsWith('image/')) {
      this.selectedFile.set(file);
      this.errorMessage.set(null);

      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      this.errorMessage.set('Por favor, seleccione un archivo de imagen válido.');
      this.removeFile();
    }
  }

  public removeFile(): void {
    this.selectedFile.set(null);
    this.previewUrl.set(null);
  }

  public async upload(): Promise<void> {
    const file = this.selectedFile();
    if (!file) {
      return;
    }

    this.isUploading.set(true);
    this.errorMessage.set(null);

    try {
      const formValue = this.metadataForm.value;
      const metadata = {
        ...formValue,
        idShop: formValue.idShop ? Number(formValue.idShop) : null,
        idCurrency: formValue.idCurrency ? Number(formValue.idCurrency) : null,
        idUser: this.authService.getUserId(),
        idUserOwner: this.authService.getUserId(),
      };
      await this.billService.uploadBillImage(file, metadata);
      this.dialogRef.close({ success: true });
    } catch (error) {
      this.errorMessage.set('Error al subir la imagen. Por favor, intente nuevamente.');
      console.error('Upload error:', error);
    } finally {
      this.isUploading.set(false);
    }
  }

  public cancel(): void {
    this.dialogRef.close();
  }
}
