# Auditoria de Segurança — OWASP TOP 10
**Data:** 2026-05-05  
**Aplicação:** Pataku's (Monorepo: NestJS API + Next.js Web)  
**Escopo:** Análise de vulnerabilidades críticas OWASP TOP 10

---

## 📋 Sumário Executivo

A aplicação Pataku's implementa **muitos controles de segurança fundamentais** mas existem **5 vulnerabilidades críticas e 3 questões de design** que requerem atenção imediata.

| Severidade | Contagem | Status |
|---|---|---|
| 🔴 **Crítico** | 2 | Requer fix urgente |
| 🟠 **Alto** | 3 | Requer atenção |
| 🟡 **Médio** | 3 | Requer investigação |
| 🟢 **Baixo/Info** | 2 | Para monitorar |

---

## 🔴 1. Broken Access Control (A01:2021)

### ✅ Implementado Corretamente
- **Tenant isolation**: `assertOwnership()` valida que CLIENT_ADMIN só acede seus dados
- **Role-based access**: `RolesGuard` + `@Roles()` decorador em todos os endpoints críticos
- **Authorization checks**: Serviços validam ownership antes de operações (ex: `areas.service.ts:51`)

### ⚠️ **VULNERABILIDADE CRÍTICA: Shares Públicas Sem Limites**

**Ficheiro:** `apps/api/src/shares/shares.service.ts:27-46`

```typescript
async getPublicShare(id: string) {
  const share = await this.prisma.reportShare.findUnique({ where: { id } });
  // ❌ Nenhuma validação de proprietário — qualquer um acede dados de qualquer cliente!
  return { type: share.type, label: share.label, ... };
}
```

**Impacto:**
- Um atacante pode bruteforce IDs de shares para aceder relatórios sensíveis de qualquer cliente
- Os dados retornados incluem nomes de operadores, áreas, equipamentos — informações sensíveis

**Recomendação:** Adicionar um `access_token` ou HMAC ao URL da share

```typescript
// Opção 1: Share token aleatório (RECOMENDADO)
async create(dto, actor) {
  const accessToken = randomBytes(32).toString('hex'); // Único, não-previsível
  return this.prisma.reportShare.create({
    data: { ...dto, accessToken, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  });
}

// Opção 2: Validação de HMAC (se quiser URLs curtas)
async getPublicShare(id: string, signature: string) {
  const share = await this.prisma.reportShare.findUnique({ where: { id } });
  const expectedSig = createHmac('sha256', process.env.SHARE_SECRET).update(id).digest('hex');
  if (signature !== expectedSig) throw new ForbiddenException();
  return this.fetchData(...);
}
```

---

### ⚠️ **VULNERABILIDADE ALTA: RolesGuard Não Valida Ownership**

**Ficheiro:** `apps/api/src/common/guards/roles.guard.ts`

```typescript
canActivate(context: ExecutionContext): boolean {
  const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', ...);
  if (!requiredRoles) return true; // ⚠️ Se @Roles() não está definido, passa!
  return requiredRoles.includes(user.role);
  // ❌ Apenas valida role, NÃO valida que o recurso pertence ao cliente do user
}
```

**Problemas:**
1. `@Roles()` é opcional — se esquecerem decorador, endpoint fica aberto
2. Um CLIENT_ADMIN de um cliente consegue aceder áreas/checklists de outro cliente se souber o ID

**Exemplo vulnerável:**

```typescript
// apps/api/src/areas/areas.controller.ts:45-52
@Get(':id')
@Roles(Role.SUPER_ADMIN, Role.CLIENT_ADMIN)
findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
  // ✅ Chama areas.service.findOne(id, actor) que valida ownership
  return this.findOne(id, user);
}
```

Isto está **correto** porque o serviço valida. Mas o problema é se alguém esquecer validar no serviço.

**Recomendação:** Criar um guard que combina autorização de role + ownership:

```typescript
@Injectable()
export class ResourceOwnershipGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', ...);
    const { user, params } = context.switchToHttp().getRequest();

    // Se há @Roles, valida
    if (requiredRoles && !requiredRoles.includes(user.role)) return false;

    // Se não tem clientId (SUPER_ADMIN), passa
    if (user.role === Role.SUPER_ADMIN) return true;

    // Se tem ID de recurso, valida ownership
    const { id } = params;
    if (!id) return true; // Sem ID específico (ex: GET /areas), será filtrado pelo serviço

    // Buscar clientId do recurso
    const resource = await this.getResourceClientId(context.switchToHttp().getRequest().path, id);
    return resource?.clientId === user.clientId;
  }

  // Mapear rotas para queries de ownership
  private getResourceClientId(path: string, id: string) {
    if (path.includes('/areas')) return this.prisma.area.findUnique({ where: { id } });
    if (path.includes('/users')) return this.prisma.user.findUnique({ where: { id } });
    // ... etc
  }
}
```

---

## 🔴 2. Cryptographic Failures (A02:2021)

### ✅ Implementado Corretamente
- **Senhas**: Bcryptjs com salt automático (`auth.service.ts:25`)
- **JWT**: Secret validation em bootstrap (`main.ts:24-27`)
- **Tokens**: Refresh tokens são hashed com SHA256 antes de armazenar (`auth.service.ts:10-12`)
- **CORS**: `sameSite: 'strict'` em todos os cookies (`auth.controller.ts:28`)

### ⚠️ **VULNERABILIDADE ALTA: Access Token em Memória É Vulnerável a XSS**

**Ficheiro:** `apps/web/src/lib/auth.ts`

```typescript
let _accessToken: string | null = null; // ❌ Armazenado em variável global JS
export function setAccessToken(token: string) {
  _accessToken = token; // Acessível via DevTools se XSS acontecer
}
```

**Contexto:** O comentário diz que isto é para evitar XSS via localStorage, mas:
1. Uma XSS consegue ler qualquer variável JS (via `window`, debugging, etc.)
2. A proteção é apenas teórica se houver XSS

**Recomendação:** Implementar CSP headers para mitigar XSS:

```typescript
// apps/api/src/main.ts
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Tailwind precisa, migrar para CSS modules
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'", 'sentry.io'], // Se usar Sentry
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
}));
```

---

### 🟡 **MÉDIO: Refresh Token Rotation Não Invalida Token Antigo Imediatamente**

**Ficheiro:** `apps/api/src/auth/auth.service.ts:31-45`

```typescript
async refresh(rawRefreshToken: string) {
  const tokenHash = hashToken(rawRefreshToken);
  const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
  // ... validações ...
  await this.prisma.refreshToken.delete({ where: { id: stored.id } }); // ✅ Delete old
  return this.issueTokens(stored.user); // ✅ Issue new
}
```

**Status:** Isto está **correto** — token antigo é deletado imediatamente. ✅

Mas o `ACCESS_TOKEN_TTL = '15m'` significa que mesmo após logout, se um token foi comprometido:
- Será válido durante 15 minutos
- A app não revoga tokens — apenas expira por TTL

**Recomendação para futuro:** Implementar token revocation list (se necessário):

```typescript
// Adicionar ao Prisma
model RevokedToken {
  id String @id
  expiresAt DateTime
}

// No logout
await this.prisma.revokedToken.create({
  data: { id: jti, expiresAt: new Date(Date.now() + 15 * 60 * 1000) },
});

// No JWT strategy validation
const isRevoked = await this.prisma.revokedToken.findUnique({ where: { id: payload.jti } });
if (isRevoked) throw new UnauthorizedException();
```

---

## 🟠 3. Injection (A03:2021)

### ✅ Implementado Corretamente
- **SQL Injection**: Prisma ORM usa parameterized queries — **não há construção de SQL strings**
- **Apenas 1 raw query**: `health/health.controller.ts:10` — `SELECT 1` hardcoded, seguro ✅
- **Class-validator**: Validação de DTO em todos os endpoints

### 🟡 **MÉDIO: CSRF Protection Poderia Ser Mais Robusta**

**Ficheiro:** `apps/api/src/common/guards/csrf.guard.ts:23-43`

```typescript
canActivate(context: ExecutionContext): boolean {
  const req = context.switchToHttp().getRequest<Request>();
  if (SAFE_METHODS.has(req.method)) return true; // ✅ GET/HEAD exempt
  
  const cookieToken = req.cookies?.csrf_token as string | undefined;
  const headerToken = req.headers['x-csrf-token'] as string | undefined;
  
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    throw new ForbiddenException('Token CSRF inválido');
  }
  return true;
}
```

**Problemas:**
1. ✅ Double-submit pattern está implementado corretamente
2. ✅ `sameSite: 'strict'` previne CSRF mesmo sem header
3. ⚠️ MAS: Se a app tiver qualquer endpoint que faz redirect (ex: OAuth), CSRF pode ser bypassado

**Status:** Baixa prioridade para agora, mas monitor se adicionar OAuth

---

## 🟠 4. Insecure Design (A04:2021)

### ⚠️ **VULNERABILIDADE ALTA: Sem Rate Limiting em Endpoints Críticos**

**Ficheiro:** `apps/api/src/app.module.ts:34`

```typescript
ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]) // Global: 120 req/min
```

**Endpoints protegidos:**
- ✅ Login: `@Throttle({ default: { limit: 30, ttl: 60000 } })` — **30 req/min** (bom)
- ✅ Invite accept: `@Throttle({ default: { limit: 5, ttl: 60000 } })` — **5 req/min** (bom)

**Endpoints sem proteção específica (usam global 120/min):**
- ❌ `POST /auth/refresh` — pode ser bruteforcado para comprometer sessões
- ❌ `POST /areas` — um atacante com token pode criar milhares de áreas
- ❌ `POST /anomalies` — spam de anomalias

**Recomendação:**

```typescript
// apps/api/src/auth/auth.controller.ts
@Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 refreshes/min
@Post('refresh')
async refresh(@Req() req, @Res() res) { ... }

// apps/api/src/anomalies/anomalies.controller.ts (se existir)
@Throttle({ default: { limit: 50, ttl: 60000 } }) // 50 anomalias/min
@Post()
async create(@Body() dto) { ... }
```

---

### 🟡 **MÉDIO: Sem Auditoria/Logging de Ações Sensíveis**

**Ficheiro:** `apps/api/src/app.module.ts:35-57`

```typescript
// Logging configurado para erros e requests, mas:
// ❌ Sem auditoria de quem alterou dados sensíveis
// ❌ Sem log de falhas de autenticação (senha errada)
// ❌ Sem log de operações de borracho/delete
```

**Recomendação:** Adicionar audit log:

```typescript
// apps/api/src/common/services/audit.service.ts
@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(action: string, resourceType: string, resourceId: string, actor: AuthUser, details?: any) {
    await this.prisma.auditLog.create({
      data: { action, resourceType, resourceId, userId: actor.id, details, timestamp: new Date() },
    });
  }
}

// Usar em serviços críticos:
async deactivate(id: string, actor: AuthUser) {
  const area = await this.findOne(id, actor);
  const result = await this.prisma.area.update({ ... });
  await this.audit.log('DEACTIVATE_AREA', 'Area', id, actor);
  return result;
}
```

---

## 🟠 5. Security Misconfiguration (A05:2021)

### ✅ Implementado Corretamente
- **Helmet.js**: Ativa headers de segurança (`main.ts:33`)
- **Validação JWT_SECRET**: Rejeita secrets conhecidos (`main.ts:14-27`)
- **CORS configurado**: Apenas domínios allowlisted (`main.ts:39-47`)
- **Cookies HttpOnly**: Refresh token não acessível por JS (`auth.controller.ts:25`)

### ⚠️ **VULNERABILIDADE ALTA: Swagger Exposto em Produção**

**Ficheiro:** `apps/api/src/main.ts:49-62`

```typescript
// Swagger — apenas fora de produção (ou se SWAGGER_ENABLED=true)
if (!IS_PRODUCTION || process.env.SWAGGER_ENABLED === 'true') {
  SwaggerModule.setup('docs', app, document, { ... });
  // ⚠️ Se SWAGGER_ENABLED=true em produção, expõe toda a API!
}
```

**Impacto:**
- Swagger mostra todos os endpoints, parâmetros, modelos
- Um atacante consegue descobrir endpoints privados/escondidos
- Facilita reconnaissance

**Recomendação:**

```typescript
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

if (!IS_PRODUCTION) {
  // Swagger NUNCA em produção, independentemente de env var
  const config = new DocumentBuilder().setTitle("Pataku's API").build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  console.log(`Swagger disponível em http://localhost:${process.env.PORT}/docs`);
}
```

---

## 🟡 6. Vulnerable & Outdated Components (A06:2021)

### ✅ Status das Dependências

```bash
# API (NestJS)
@nestjs/core               ^10.4.15  ✅ Recente
@nestjs/jwt                ^10.2.0   ✅ Atualizado
@prisma/client             ^5.22.0   ✅ Atualizado
passport-jwt               ^4.0.1    ✅ Atualizado
bcryptjs                   ^2.4.3    ✅ Seguro
helmet                     ^8.1.0    ✅ Recente
class-validator            ^0.14.1   ✅ Atualizado

# Web (Next.js)
next                       ^14.2.29  ✅ Recente
react                      ^18.3.1   ✅ Atualizado
zustand                    ^5.0.2    ✅ Atualizado
```

**Recomendação:** Rodar `npm audit` periodicamente:

```bash
npm audit --workspaces
# Se houver vulnerabilidades médias/altas:
npm update @package/name
```

---

## 🟢 7. Identification & Authentication Failures (A07:2021)

### ✅ Implementado Corretamente
- **Bcryptjs**: Senhas hasheadas com salt (`auth.service.ts:25`)
- **JWT + Refresh tokens**: Sistema bom (`auth.service.ts:57-88`)
- **HttpOnly cookies**: Refresh token protegido (`auth.controller.ts:23-30`)
- **Token rotation**: Refresh invalida token antigo (`auth.service.ts:42-44`)

### 🟡 **MÉDIO: Sem Proteção contra Força Bruta em Email**

**Ficheiro:** `apps/api/src/auth/auth.controller.ts:51-61`

```typescript
@Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 tentativas/minuto
@Post('login')
async login(@Body() dto: LoginDto) {
  const user = await this.authService.login(dto.email, dto.password);
  // ⚠️ 30 tentativas/minuto = um atacante consegue testar ~430k combos/dia
  // Melhor seria: 5 tentativas/minuto ou account lockout
}
```

**Recomendação:**

```typescript
@Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 tentativas/minuto
@Post('login')
async login(@Body() dto: LoginDto) {
  // Opcionalmente, adicionar account lockout:
  const attempts = await this.prisma.loginAttempt.count({
    where: { email: dto.email, createdAt: { gte: new Date(Date.now() - 900000) } },
  });
  if (attempts > 3) {
    await this.sendSecurityAlert(dto.email);
    throw new TooManyRequestsException('Demasiadas tentativas. Tente mais tarde.');
  }
  // ... rest of login logic
}
```

---

## 🟢 8. Software & Data Integrity Failures (A08:2021)

### ✅ Status

| Aspecto | Status | Notas |
|---|---|---|
| Dependências assinadas | ⚠️ Não verificado | npm permite assinatura, não obrigatória |
| CI/CD pipeline | ⚠️ Não visible | Verificar se há proteção de branch |
| Deploy validation | ⚠️ Não automatizado | Verificar se há testes antes deploy |
| Database migrations | ✅ Controlled | Prisma migrations |

---

## 🟢 9. Logging & Monitoring Failures (A09:2021)

### ✅ Implementado
- **Winston logger**: Configurado em `app.module.ts:35-57`
- **Erro logs**: Ficheiro `logs/error.log`
- **Combined logs**: Ficheiro `logs/combined.log`
- **Sentry integration**: Importa `@sentry/nestjs` (verificar se ativado)

### 🟡 **MÉDIO: Sem Alertas de Atividade Anómala**

**Recomendação para futuro:**
- Alertar se: 10+ login failures, 100+ operações/min (DDoS), deploy de código suspeito
- Implementar metrics/dashboards em Grafana ou similar

---

## 🟢 10. Server-Side Request Forgery (SSRF) (A10:2021)

### ✅ Status
- **Não há HTTP clients internos** que façam requests a URLs customizadas
- **Shares**: Apenas fazem queries internas ao DB, não requests externas
- **Sem webhooks/callbacks**: Sem risco de SSRF

---

## 📋 Resumo de Remediação

| Vulnerabilidade | Severidade | Prazo | Owner |
|---|---|---|---|
| Shares sem acesso controlado | 🔴 Crítico | Imediato | Backend |
| Access token em memória XSS | 🔴 Crítico | 1-2 dias | Frontend |
| Rate limiting em `/refresh` | 🟠 Alto | 1 dia | Backend |
| Swagger em produção | 🟠 Alto | 1 dia | Backend |
| Audit logging | 🟡 Médio | 1 semana | Backend |
| Força bruta login | 🟡 Médio | 3 dias | Backend |

---

## 🔧 Próximos Passos Recomendados

1. **Hoje:** Desabilitar Swagger em produção (1 linha de código)
2. **Hoje:** Aumentar rate limiting em `/refresh` para 10 req/min
3. **Amanhã:** Proteger shares públicas com `accessToken`
4. **Esta semana:** Implementar audit logging
5. **Próxima week:** Implementar account lockout após 3 tentativas erradas

---

## Contactos para Dúvidas

- **Segurança:** Contactar Equipa Segurança
- **OWASP Reference:** https://owasp.org/Top10/

---

**Auditado por:** Claude Code  
**Data:** 2026-05-05  
**Próxima review:** 2026-06-05
