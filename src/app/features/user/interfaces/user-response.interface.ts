import { IUserData } from '@features/user/interfaces/user-data.interface';

export interface IUserResponse extends IUserData {
  id: string;
  createdAt: string;
  updatedAt: string;
}
