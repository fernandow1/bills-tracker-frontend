import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Field, form, maxLength, minLength, pattern, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { IUserResponse } from '@features/user/interfaces';
import { MatSnackBar } from '@angular/material/snack-bar';
import { IUserData } from '@features/user/interfaces/user-data.interface';
import { UserService } from '@features/user/services/user.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    Field,
  ],
  templateUrl: './user-form.html',
  styleUrl: './user-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserForm {
  private readonly userService = inject(UserService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<UserForm>, { optional: true });
  private readonly dialogData = inject<IUserResponse | null>(MAT_DIALOG_DATA, {
    optional: true,
  });

  public readonly isEditMode = !!this.dialogData;
  public userId = this.dialogData?.id;

  public userModel = signal<IUserData>({
    name: this.dialogData?.name || '',
    email: this.dialogData?.email || '',
    username: this.dialogData?.username || '',
    password: '',
  });

  public userForm = form<IUserData>(this.userModel, (schemaPath) => {
    required(schemaPath.name, { message: 'El nombre es obligatorio' });
    minLength(schemaPath.name, 3, { message: 'El nombre debe tener al menos 3 caracteres' });
    maxLength(schemaPath.name, 100, { message: 'El nombre no puede exceder 100 caracteres' });

    required(schemaPath.username, { message: 'El username es obligatorio' });
    minLength(schemaPath.username, 3, { message: 'El username debe tener al menos 3 caracteres' });
    maxLength(schemaPath.username, 50, { message: 'El username no puede exceder 50 caracteres' });

    required(schemaPath.email, { message: 'El email es obligatorio' });
    pattern(schemaPath.email, /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
      message: 'Email inválido',
    });

    // Password solo es requerido en modo creación
    if (!this.isEditMode && schemaPath.password) {
      required(schemaPath.password, { message: 'La contraseña es obligatoria' });
      minLength(schemaPath.password, 6, {
        message: 'La contraseña debe tener al menos 6 caracteres',
      });
    }
  });

  // Computed signals para el template (evitar llamadas a funciones)
  // Name y username muestran errores siempre (son requeridos)
  public nameInvalid = computed(() => this.userForm.name().invalid());
  public nameErrors = computed(() => this.userForm.name().errors());

  public usernameInvalid = computed(() => this.userForm.username().invalid());
  public usernameErrors = computed(() => this.userForm.username().errors());

  public emailInvalid = computed(() => this.userForm.email().invalid());
  public emailErrors = computed(() => this.userForm.email().errors());

  // Password solo muestra errores cuando es dirty o touched (opcional)
  public showPasswordErrors = computed(() => {
    const field = this.userForm.password?.();
    return field ? field.invalid() && field.dirty() : false;
  });
  public passwordErrors = computed(() => this.userForm.password?.()?.errors() ?? []);

  public formInvalid = computed(() => this.userForm().invalid());

  constructor() {
    // Resetear triggers al inicializar el componente
    this.userService.resetCreateTrigger();
    this.userService.resetUpdateTrigger();

    effect((): void => {
      const createdUser = this.userService.createdUser;
      const createError = this.userService.createError;

      if (createdUser) {
        this.snackBar.open('Usuario creado exitosamente', 'Cerrar', {
          duration: 3000,
          panelClass: 'success-snackbar',
        });
        this.resetForm();
        this.userService.resetCreateTrigger();

        if (this.dialogRef) {
          this.dialogRef.close(createdUser);
        }
      }

      if (createError) {
        this.snackBar.open(`Error al crear el usuario: ${createError}`, 'Cerrar', {
          duration: 5000,
          panelClass: 'error-snackbar',
        });
        this.userService.resetCreateTrigger();
      }
    });

    effect((): void => {
      const updatedUser = this.userService.updatedUser;
      const updateError = this.userService.updateError;

      if (updatedUser) {
        this.snackBar.open('Usuario actualizado exitosamente', 'Cerrar', {
          duration: 3000,
          panelClass: 'success-snackbar',
        });
        this.resetForm();
        this.userService.resetUpdateTrigger();

        if (this.dialogRef) {
          this.dialogRef.close(updatedUser);
        }
      }

      if (updateError) {
        this.snackBar.open(`Error al actualizar el usuario: ${updateError}`, 'Cerrar', {
          duration: 5000,
          panelClass: 'error-snackbar',
        });
        this.userService.resetUpdateTrigger();
      }
    });
  }

  public onSubmit(): void {
    if (this.userForm().invalid()) {
      this.userForm().markAsTouched();
      return;
    }

    const userData: IUserData = this.userForm().value();

    // Eliminar password si está vacío
    if (!userData.password) {
      delete userData.password;
    }

    if (this.isEditMode && this.userId) {
      this.userService.updateUser(this.userId, userData);
    } else {
      this.userService.createUser(userData);
    }
  }

  public get isLoading(): boolean {
    return this.userService.isCreatingUser || this.userService.isUpdatingUser;
  }

  private resetForm(): void {
    this.userModel.set({
      name: '',
      email: '',
      username: '',
      password: '',
    });
    this.userForm().reset();
  }

  public onCancel(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }
}
