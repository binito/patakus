import { createParamDecorator, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthUser } from '../types/auth-user.type';

/**
 * Extrai o clientId efectivo do pedido.
 * - SUPER_ADMIN: usa ?clientId da query (pode ser undefined)
 * - Outros: usa sempre user.clientId; lança ForbiddenException se não tiver
 */
export const TenantId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest();
  const user: AuthUser = request.user;
  if (user.role === Role.SUPER_ADMIN) return request.query?.clientId ?? '';
  if (!user.clientId) throw new ForbiddenException('Utilizador sem cliente associado');
  return user.clientId;
});
