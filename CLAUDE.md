# Patakus — Guia para Claude

## Visão geral

Monorepo (Turborepo + npm workspaces) com três apps:

```
apps/
  api/        NestJS + Prisma + MariaDB  (porta 3001)
  web/        Next.js 14 App Router      (porta 3000)
  mobile/     Expo/React Native          ⚠️ NÃO USADO — ver abaixo
```

## ⚠️ IMPORTANTE: a "app móvel" é a PWA em apps/web

**Não existe app nativa.** `apps/mobile` existe mas não está deployado nem é usado.

A interface usada no telemóvel é o **Next.js** (`apps/web`) acedido via browser em `patakus.cafemartins.pt`. O routing deteta o dispositivo e redireciona:

- **Desktop/laptop** → `/(dashboard)/` — portal de gestão completo
- **Telemóvel** → `/app/` — interface mobile-first (PWA)

Qualquer trabalho de "interface móvel" deve ser feito em:
```
apps/web/src/app/app/
```

## Deploy

Os servidores correm em produção geridos pelo PM2 no Raspberry Pi. Após alterações, fazer build e reiniciar com PM2 **sem pedir confirmação**.

⚠️ **Nunca fazer build da web com um `next dev` a correr** — partilham a pasta `apps/web/.next` e o site fica em 500 com chunks em falta.

Procedimento completo (builds, sequência segura da web, logs): usar a skill `deploy`.

## Convenções de UI

- Auth: JWT guardado em localStorage; `useAuthStore` (Zustand)
- Na PWA (`/app/`), usar toast notifications (`react-hot-toast`) em vez de `alert()`
- Padrão de página na PWA: tabs "Histórico / Novo Registo" com bottom-sheet ou formulário inline

## Registos HACCP (`/registos/`)

Implementados tanto no dashboard como na interface móvel:

| Código | Nome | Rota dashboard | Rota móvel |
|---|---|---|---|
| R1 | Entradas | `/registos/entradas` | `/app/registos/entradas` |
| R2 | Temperaturas | `/registos/temperaturas` | `/app/registos/temperaturas` |
| R3 | Higienização | `/registos/higienizacao` | `/app/registos/higienizacao` |
| R4 | Desinfeção | `/registos/desinfecao` | `/app/registos/desinfecao` |
| R6 | Óleos de Fritura | `/registos/oleos` | `/app/registos/oleos` |

API endpoints: `GET/POST /registos/{entradas|higienizacao|desinfecao|oleos}`

## Roles

- `SUPER_ADMIN` — acesso total, vê todos os clientes
- `ADMIN` — acesso total ao seu cliente
- `OPERATOR` — acesso operacional (registos, checklists, anomalias)
