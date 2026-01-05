import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '@features/user/services/user.service';
import { IUserResponse } from '@features/user/interfaces';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { UserForm } from '@features/user/pages/form/user-form';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
  ],
  templateUrl: './user-list.html',
  styleUrl: './user-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserList {
  public readonly displayedColumns: string[] = [
    'name',
    'email',
    'username',
    'createdAt',
    'actions',
  ];

  private readonly service = inject(UserService);
  private readonly dialog = inject(MatDialog);
  private reloadCooldown = signal<boolean>(false);
  private readonly COOLDOWN_TIME = 2000; // 2 segundos

  constructor() {
    // Cargar todos los usuarios al iniciar el componente
    this.service.loadAllUsers();
  }

  public get users(): IUserResponse[] {
    return this.service.users;
  }

  public get isLoading(): boolean {
    return this.service.isLoadingUsers;
  }

  public get hasError(): boolean {
    return !!this.service.usersError;
  }

  public get isReloadDisabled(): boolean {
    return this.reloadCooldown() || this.isLoading;
  }

  public reload(): void {
    if (this.reloadCooldown()) {
      return;
    }

    this.service.reloadUsers();
    this.reloadCooldown.set(true);

    setTimeout(() => {
      this.reloadCooldown.set(false);
    }, this.COOLDOWN_TIME);
  }

  public openCreateDialog(): void {
    const dialogRef = this.dialog.open(UserForm, {
      width: '600px',
      disableClose: true,
      data: null, // null para modo creación
    });

    dialogRef.afterClosed().subscribe((result): void => {
      if (result) {
        // Si se creó un usuario, recargar la lista
        this.service.reloadUsers();
      }
    });
  }

  public openEditDialog(user: IUserResponse): void {
    const dialogRef = this.dialog.open(UserForm, {
      width: '600px',
      disableClose: true,
      data: user, // pasar el usuario para modo edición
    });

    dialogRef.afterClosed().subscribe((result): void => {
      if (result) {
        // Si se editó un usuario, recargar la lista
        this.service.reloadUsers();
      }
    });
  }
}
