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

- **Domínio:** `patakus.cafemartins.pt` (nginx com SSL wildcard)
- **API:** `patakus.cafemartins.pt/api/` → proxy para `localhost:3001`
- **Web:** `patakus.cafemartins.pt/` → proxy para `localhost:3000`
- **Servidor:** Raspberry Pi em `192.168.1.176`

### Processos em produção (PM2)

Os servidores correm em **modo produção** geridos pelo PM2, com arranque automático no boot via systemd (`pm2-jorge.service`).

Após alterações, fazer build e reiniciar com PM2 (sem pedir confirmação):
```bash
# API (NestJS)
npm run build --workspace=apps/api && pm2 restart patakus-api

# Web (Next.js) — SEMPRE com NODE_ENV=production para evitar build corrompido
NODE_ENV=production npm run build --workspace=apps/web && pm2 restart patakus-web
```

Comandos úteis:
```bash
pm2 list                    # estado dos processos
pm2 logs patakus-web        # logs em tempo real
pm2 logs patakus-api
```

O ficheiro de configuração do PM2 está em `/home/jorge/patakus/ecosystem.config.js`.

## Stack

| Camada | Tecnologia |
|---|---|
| API | NestJS, Prisma ORM, MariaDB, JWT, class-validator |
| Web dashboard | Next.js 14 App Router, Tailwind CSS, TanStack Query, Zustand |
| Web mobile (`/app/`) | Next.js 14, Tailwind CSS, TanStack Query, react-hot-toast |
| Auth | JWT guardado em localStorage; `useAuthStore` (Zustand) |

## Estrutura web — interfaces

### Dashboard (desktop) — `apps/web/src/app/(dashboard)/`
- Sidebar colapsável com grupos (`Sidebar.tsx`)
- Páginas: dashboard, users, clients, areas, checklists, anomalies, consumables, orders, products, temperature, registos/*

### Mobile PWA — `apps/web/src/app/app/`
- Layout: header fixo + barra de navegação inferior
- Nav: Início, Checklists, Anomalias, Consumíveis, Registos
- Padrão de página: tabs "Histórico / Novo Registo" com bottom-sheet ou formulário inline
- Toast notifications (`react-hot-toast`) em vez de alerts
- Páginas: page.tsx (home), checklists/, anomalias/, consumiveis/, temperaturas/, registos/*

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

## Base de dados (Prisma)

Modelos principais: `User`, `Client`, `Area`, `ChecklistTemplate`, `ChecklistTask`, `ChecklistEntry`, `ChecklistTaskResult`, `AnomalyReport`, `AnomalyPhoto`, `ConsumableStock`, `ConsumableReport`, `Consumption`, `TemperatureEquipment`, `TemperatureRecord`, `Order`, `OrderItem`, `Product`

Modelos HACCP: `EntradaRecord`, `HigienizacaoRecord`, `DesinfecaoRecord`, `OleoFrituraRecord`

Migrations em: `apps/api/prisma/migrations/`

## Roles

- `SUPER_ADMIN` — acesso total, vê todos os clientes
- `ADMIN` — acesso total ao seu cliente
- `OPERATOR` — acesso operacional (registos, checklists, anomalias)
