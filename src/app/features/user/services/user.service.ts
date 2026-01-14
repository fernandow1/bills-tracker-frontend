import { Injectable, signal, resource, inject } from '@angular/core';
import { ConfigService } from '@core/services/config.service';
import { AuthService } from '@features/auth/services/auth.service';
import { ErrorHandlerService } from '@core/services/error-handler.service';
import { AuthFetchHelper } from '@core/utils/auth-fetch.helper';
import { IUserResponse, IUserData } from '@features/user/interfaces';
import { Pagination } from '@core/interfaces/pagination.interface';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly configService = new ConfigService();
  private readonly authService = inject(AuthService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly authFetch = new AuthFetchHelper(this.authService, this.errorHandler);

  /**
   * Obtiene los headers con autenticación para fetch
   */
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem(this.configService.authConfig.tokenKey);
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Signal para controlar carga de usuarios
  private loadUsersTrigger = signal<boolean>(false);

  // Signal para controlar cuándo crear un usuario
  private createUserTrigger = signal<IUserData | null>(null);

  // Signal para controlar cuándo actualizar un usuario
  private updateUserTrigger = signal<{ id: string; data: IUserData } | null>(null);

  // Resource para cargar usuarios
  public usersResource = resource({
    loader: async () => {
      if (!this.loadUsersTrigger()) {
        return null;
      }
      const response = await this.authFetch.fetch(
        this.configService.buildApiUrl(this.configService.usersEndpoints.list),
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error de red' }));
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        Object.assign(error, {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        throw error;
      }

      return (await response.json()) as Pagination<IUserResponse>;
    },
  });

  // Resource para crear usuario (POST)
  public createUserResource = resource({
    loader: async () => {
      const userData = this.createUserTrigger();

      if (!userData) {
        return null;
      }

      const response = await this.authFetch.fetch(
        this.configService.buildApiUrl(this.configService.usersEndpoints.create),
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(userData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error de red' }));
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        Object.assign(error, {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        throw error;
      }

      return (await response.json()) as IUserResponse;
    },
  });

  // Resource para actualizar usuario (PUT)
  public updateUserResource = resource({
    loader: async () => {
      const updateData = this.updateUserTrigger();

      if (!updateData) {
        return null;
      }

      const response = await this.authFetch.fetch(
        this.configService.buildApiUrl(
          this.configService.usersEndpoints.update.replace(':id', updateData.id)
        ),
        {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(updateData.data),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error de red' }));
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        Object.assign(error, {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        throw error;
      }

      return (await response.json()) as IUserResponse;
    },
  });

  /**
   * Cargar todos los usuarios
   */
  public loadAllUsers(): void {
    this.loadUsersTrigger.set(true);
    this.usersResource.reload();
  }

  /**
   * Obtiene la lista de usuarios
   */
  public get users(): IUserResponse[] {
    const result = this.usersResource.value();
    if (!result) {
      return [];
    }
    return result.data || [];
  }

  /**
   * Obtiene el estado de carga
   */
  public get isLoadingUsers(): boolean {
    return this.usersResource.status() === 'loading';
  }

  /**
   * Obtiene errores de carga
   */
  public get usersError(): Error | undefined {
    return this.usersResource.error();
  }

  /**
   * Recarga la lista de usuarios
   */
  public reloadUsers(): void {
    this.usersResource.reload();
  }

  /**
   * Crea un nuevo usuario
   * @param userData Datos del usuario a crear
   */
  public createUser(userData: IUserData): void {
    this.createUserTrigger.set(userData);
    this.createUserResource.reload();
  }

  /**
   * Resetea el trigger de creación
   */
  public resetCreateTrigger(): void {
    this.createUserTrigger.set(null);
  }

  /**
   * Actualiza un usuario existente
   * @param id ID del usuario a actualizar
   * @param userData Datos actualizados del usuario
   */
  public updateUser(id: string, userData: IUserData): void {
    this.updateUserTrigger.set({ id, data: userData });
    this.updateUserResource.reload();
  }

  /**
   * Resetea el trigger de actualización
   */
  public resetUpdateTrigger(): void {
    this.updateUserTrigger.set(null);
  }

  /**
   * Obtiene el estado de creación
   */
  public get isCreatingUser(): boolean {
    return this.createUserResource.status() === 'loading';
  }

  /**
   * Obtiene el error de creación
   */
  public get createError(): Error | undefined {
    if (this.createUserTrigger() === null) {
      return undefined;
    }
    return this.createUserResource.error();
  }

  /**
   * Obtiene el usuario creado
   */
  public get createdUser(): IUserResponse | null | undefined {
    if (this.createUserTrigger() === null) {
      return null;
    }
    return this.createUserResource.value() as IUserResponse | null | undefined;
  }

  /**
   * Obtiene el estado de actualización
   */
  public get isUpdatingUser(): boolean {
    return this.updateUserResource.status() === 'loading';
  }

  /**
   * Obtiene el error de actualización
   */
  public get updateError(): Error | undefined {
    if (this.updateUserTrigger() === null) {
      return undefined;
    }
    return this.updateUserResource.error();
  }

  /**
   * Obtiene el usuario actualizado
   */
  public get updatedUser(): IUserResponse | null | undefined {
    if (this.updateUserTrigger() === null) {
      return null;
    }
    return this.updateUserResource.value() as IUserResponse | null | undefined;
  }
}
