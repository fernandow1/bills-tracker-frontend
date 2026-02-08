import { Role } from '@features/auth/enums/role.enum';

export interface IUserData {
  name: string;
  email: string;
  username: string;
  password?: string; // Opcional para edición
  role: Role;
}
