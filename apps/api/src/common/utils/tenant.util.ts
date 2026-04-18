import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthUser } from '../types/auth-user.type';

/**
 * Retorna o clientId efectivo para o actor autenticado.
 * SUPER_ADMIN pode passar clientId por query/body; os restantes usam sempre o seu.
 * Lança ForbiddenException se CLIENT_ADMIN/OPERATOR não tiver clientId.
 */
export function resolveClientId(user: AuthUser, queryClientId?: string): string {
  if (user.role === Role.SUPER_ADMIN) return queryClientId ?? '';
  if (!user.clientId) throw new ForbiddenException('Utilizador sem cliente associado');
  return user.clientId;
}

/**
 * Garante que um recurso pertence ao cliente do actor.
 * SUPER_ADMIN passa sempre; os restantes validam ownership.
 */
export function assertOwnership(user: AuthUser, resourceClientId: string): void {
  if (user.role === Role.SUPER_ADMIN) return;
  if (user.clientId !== resourceClientId) throw new ForbiddenException('Acesso negado a este recurso');
}
