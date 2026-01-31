import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Field, form, maxLength, min, max, minLength, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MapComponent, MarkerComponent } from 'ngx-mapbox-gl';
import type { MapMouseEvent } from 'mapbox-gl';
import { environment } from '../../../../../environments/environment';
import { IShopData } from '@features/shop/interfaces/shop-data.interface';
import { IShopResponse } from '@features/shop/interfaces/shop-response.interface';
import { ShopService } from '@features/shop/services/shop';

@Component({
  selector: 'app-shop-form',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MapComponent,
    MarkerComponent,
    Field,
  ],
  templateUrl: './form.html',
  styleUrl: './form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShopForm {
  private readonly shopService = inject(ShopService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<ShopForm>, { optional: true });
  private readonly dialogData = inject<IShopResponse | null>(MAT_DIALOG_DATA, {
    optional: true,
  });

  public readonly isEditMode = !!this.dialogData;
  public shopId = this.dialogData?.id;

  public shopModel = signal<IShopData>({
    name: this.dialogData?.name || '',
    description: this.dialogData?.description || '',
    latitude: this.dialogData?.latitude,
    longitude: this.dialogData?.longitude,
  });

  public shopForm = form<IShopData>(this.shopModel, (schemaPath) => {
    required(schemaPath.name, { message: 'El nombre de la tienda es obligatorio' });
    minLength(schemaPath.name, 3, { message: 'El nombre debe tener al menos 3 caracteres' });
    maxLength(schemaPath.name, 255, { message: 'El nombre no puede exceder 100 caracteres' });
    maxLength(schemaPath.description, 255, {
      message: 'La descripción no puede exceder 255 caracteres',
    });

    // Validaciones opcionales para latitud (solo si se proporciona un valor)
    if (schemaPath.latitude) {
      min(schemaPath.latitude, -90, { message: 'La latitud debe ser mayor o igual a -90' });
      max(schemaPath.latitude, 90, { message: 'La latitud debe ser menor o igual a 90' });
    }

    // Validaciones opcionales para longitud (solo si se proporciona un valor)
    if (schemaPath.longitude) {
      min(schemaPath.longitude, -180, { message: 'La longitud debe ser mayor o igual a -180' });
      max(schemaPath.longitude, 180, { message: 'La longitud debe ser menor o igual a 180' });
    }
  });

  // ================================================
  // CONFIGURACIÓN DE MAPBOX
  // ================================================

  public readonly mapStyle = environment.mapbox.style;
  public readonly mapAccessToken = environment.mapbox.accessToken;
  public mapZoom = signal<number>(environment.mapbox.defaultZoom);
  public mapCenter = signal<[number, number]>(environment.mapbox.defaultCenter);

  // Estado del marcador en el mapa
  private markerPosition = signal<[number, number] | null>(null);

  // Computed signal para determinar si las coordenadas son válidas
  public hasValidCoordinates = computed(() => {
    const latField = this.shopForm.latitude?.();
    const lngField = this.shopForm.longitude?.();

    if (!latField || !lngField) {
      return false;
    }

    const lat = latField.value();
    const lng = lngField.value();
    return (
      this.shopService.isValidCoordinate(lat, -90, 90) &&
      this.shopService.isValidCoordinate(lng, -180, 180)
    );
  });

  // Computed signal para la posición del marcador (usado en el template)
  public markerLngLat = computed<[number, number] | null>(() => {
    const latField = this.shopForm.latitude?.();
    const lngField = this.shopForm.longitude?.();

    if (!latField || !lngField) {
      return null;
    }

    const lat = latField.value();
    const lng = lngField.value();

    if (
      !this.shopService.isValidCoordinate(lat, -90, 90) ||
      !this.shopService.isValidCoordinate(lng, -180, 180)
    ) {
      return null;
    }

    const numLat = typeof lat === 'string' ? parseFloat(lat) : lat;
    const numLng = typeof lng === 'string' ? parseFloat(lng) : lng;

    if (isNaN(numLat!) || isNaN(numLng!)) {
      return null;
    }

    return [numLng!, numLat!];
  });

  constructor() {
    // Inicializar mapa con coordenadas existentes si están disponibles
    if (this.dialogData?.latitude && this.dialogData?.longitude) {
      const lat = this.dialogData.latitude;
      const lng = this.dialogData.longitude;

      if (
        this.shopService.isValidCoordinate(lat, -90, 90) &&
        this.shopService.isValidCoordinate(lng, -180, 180)
      ) {
        const numLat = typeof lat === 'string' ? parseFloat(lat) : lat;
        const numLng = typeof lng === 'string' ? parseFloat(lng) : lng;

        if (!isNaN(numLat) && !isNaN(numLng)) {
          this.markerPosition.set([numLng, numLat]);
          this.mapCenter.set([numLng, numLat]);
        }
      }
    }

    // Resetear triggers al inicializar el componente
    this.shopService.resetCreateTrigger();
    this.shopService.resetUpdateTrigger();

    // Effect para manejar la respuesta de creación
    effect((): void => {
      const createdShop = this.shopService.createdShop;
      const createError = this.shopService.createError;

      if (createdShop) {
        this.snackBar.open('Tienda creada exitosamente', 'Cerrar', {
          duration: 3000,
          panelClass: 'success-snackbar',
        });
        this.resetForm();
        this.shopService.resetCreateTrigger();

        if (this.dialogRef) {
          this.dialogRef.close(createdShop);
        }
      }

      if (createError) {
        this.snackBar.open('Error al crear la tienda', 'Cerrar', {
          duration: 5000,
          panelClass: 'error-snackbar',
        });
        this.shopService.resetCreateTrigger();
      }
    });

    // Effect para manejar la respuesta de actualización
    effect((): void => {
      const updatedShop = this.shopService.updatedShop;
      const updateError = this.shopService.updateError;

      if (updatedShop) {
        this.snackBar.open('Tienda actualizada exitosamente', 'Cerrar', {
          duration: 3000,
          panelClass: 'success-snackbar',
        });
        this.resetForm();
        this.shopService.resetUpdateTrigger();

        if (this.dialogRef) {
          this.dialogRef.close(updatedShop);
        }
      }

      if (updateError) {
        this.snackBar.open('Error al actualizar la tienda', 'Cerrar', {
          duration: 5000,
          panelClass: 'error-snackbar',
        });
        this.shopService.resetUpdateTrigger();
      }
    });

    // Effect para sincronizar cambios del formulario al mapa
    effect(() => {
      const lat = this.shopForm.latitude?.()?.value();
      const lng = this.shopForm.longitude?.()?.value();

      if (
        this.shopService.isValidCoordinate(lat, -90, 90) &&
        this.shopService.isValidCoordinate(lng, -180, 180)
      ) {
        const numLat = typeof lat === 'string' ? parseFloat(lat) : lat;
        const numLng = typeof lng === 'string' ? parseFloat(lng) : lng;

        if (!isNaN(numLat!) && !isNaN(numLng!)) {
          this.markerPosition.set([numLng!, numLat!]);
          this.mapCenter.set([numLng!, numLat!]);
        }
      } else {
        this.markerPosition.set(null);
      }
    });
  }

  public onSubmit(): void {
    if (this.shopForm().invalid()) {
      this.shopForm().markAsTouched();
      return;
    }

    const shopData: IShopData = this.shopForm().value();

    if (this.isEditMode && this.shopId) {
      this.shopService.updateShop(this.shopId, shopData);
    } else {
      this.shopService.createShop(shopData);
    }
  }

  public get isLoading(): boolean {
    return this.shopService.isCreatingShop || this.shopService.isUpdatingShop;
  }

  // ================================================
  // MÉTODOS DE MAPBOX
  // ================================================

  /**
   * Maneja el click en el mapa para seleccionar una ubicación
   */
  public onMapClick(event: MapMouseEvent): void {
    const { lng, lat } = event.lngLat;

    // Actualizar el formulario con las nuevas coordenadas
    // El effect se encargará de actualizar el marcador automáticamente
    this.shopModel.update((model) => ({
      ...model,
      latitude: lat,
      longitude: lng,
    }));
  }

  private resetForm(): void {
    this.shopModel.set({
      name: '',
      description: '',
      latitude: undefined,
      longitude: undefined,
    });
    this.shopForm().reset();
    this.markerPosition.set(null);
    this.mapCenter.set(environment.mapbox.defaultCenter);
  }
}
