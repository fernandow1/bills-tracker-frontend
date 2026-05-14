import { Injectable, signal, resource, inject } from '@angular/core';
import { ConfigService } from '@core/services/config.service';
import { HttpFetchAdapter } from '@core/adapters/http-fetch.adapter';
import { IUserResponse, IUserData } from '@features/user/interfaces';
import { Pagination } from '@core/interfaces/pagination.interface';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly configService = new ConfigService();
  private readonly http = inject(HttpFetchAdapter);

  // Signal para controlar carga de usuarios
  private loadUsersTrigger = signal<boolean>(false);

  // Signal para controlar cuándo crear un usuario
  private createUserTrigger = signal<IUserData | null>(null);

  // Signal para controlar cuándo actualizar un usuario
  private updateUserTrigger = signal<{ id: string; data: IUserData } | null>(null);

  // Resource para cargar usuarios
  public usersResource = resource({
    loader: async ({ abortSignal }) => {
      if (!this.loadUsersTrigger()) {
        return null;
      }
      const url = this.configService.buildApiUrl(this.configService.usersEndpoints.list);
      return this.http.get<Pagination<IUserResponse>>(url, { signal: abortSignal });
    },
  });

  // Resource para crear usuario (POST)
  public createUserResource = resource({
    loader: async ({ abortSignal }) => {
      const userData = this.createUserTrigger();

      if (!userData) {
        return null;
      }

      const url = this.configService.buildApiUrl(this.configService.usersEndpoints.create);
      return this.http.post<IUserResponse>(url, userData, { signal: abortSignal });
    },
  });

  // Resource para actualizar usuario (PUT)
  public updateUserResource = resource({
    loader: async ({ abortSignal }) => {
      const updateData = this.updateUserTrigger();

      if (!updateData) {
        return null;
      }

      const url = this.configService.buildApiUrl(
        this.configService.usersEndpoints.update.replace(':id', updateData.id),
      );
      return this.http.put<IUserResponse>(url, updateData.data, { signal: abortSignal });
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
