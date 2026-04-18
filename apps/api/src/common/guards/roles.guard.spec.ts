import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { Role } from '@prisma/client';

function mockContext(userRole: Role | null, handlerRoles?: Role[], classRoles?: Role[]): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user: userRole ? { role: userRole } : undefined }),
    }),
  } as any;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('permite acesso quando não há roles definidos', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(mockContext(Role.OPERATOR))).toBe(true);
  });

  it('permite acesso quando o utilizador tem o role correto', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.SUPER_ADMIN]);
    expect(guard.canActivate(mockContext(Role.SUPER_ADMIN))).toBe(true);
  });

  it('bloqueia acesso quando o utilizador não tem o role necessário', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.SUPER_ADMIN]);
    expect(guard.canActivate(mockContext(Role.OPERATOR))).toBe(false);
  });

  it('permite acesso quando um dos vários roles aceites corresponde', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.SUPER_ADMIN, Role.CLIENT_ADMIN]);
    expect(guard.canActivate(mockContext(Role.CLIENT_ADMIN))).toBe(true);
  });

  it('bloqueia OPERATOR quando apenas SUPER_ADMIN e CLIENT_ADMIN são aceites', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.SUPER_ADMIN, Role.CLIENT_ADMIN]);
    expect(guard.canActivate(mockContext(Role.OPERATOR))).toBe(false);
  });
});
