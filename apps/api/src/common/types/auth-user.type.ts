import { Role } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  clientId: string | null;
  name: string;
  active: boolean;
}
