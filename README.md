# Patakus

Sistema de gestão HACCP e operacional para restauração.

## 🚀 Visão Geral

Patakus é um monorepo (Turborepo + npm workspaces) que integra uma API robusta e uma interface web adaptativa (PWA) para gestão de segurança alimentar e operações em restaurantes.

### Arquitetura
- **`apps/api`**: NestJS + Prisma + MariaDB.
- **`apps/web`**: Next.js 14 App Router (Dashboard Desktop e PWA Mobile).
- **`packages/types`**: Tipagens partilhadas entre frontend e backend.

> ⚠️ **Nota Importante:** A experiência móvel é servida através da PWA em `apps/web/src/app/app/`. O diretório `apps/mobile` é legado e não está em uso.

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| **API** | NestJS, Prisma ORM, MariaDB, JWT, class-validator, Winston |
| **Web Dashboard** | Next.js 14, Tailwind CSS, TanStack Query, Zustand, Recharts |
| **Mobile PWA** | Next.js 14 (Mobile-first), Tailwind CSS, react-hot-toast |
| **Infra** | Turborepo, Nginx (Proxy Reverso), Docker (opcional) |

## 📱 Estrutura de Interfaces

O roteamento no `apps/web` é segmentado por dispositivo:
- **Desktop/Gestão:** `/(dashboard)/` - Portal completo de administração.
- **Operacional/Mobile:** `/app/` - Interface otimizada para telemóveis e tablets (PWA).

### Registos HACCP Implementados
- **R1:** Registo de Entradas
- **R2:** Controlo de Temperaturas
- **R3:** Higienização das Instalações
- **R4:** Desinfeção de Vegetais
- **R6:** Gestão de Óleos de Fritura Usados

## ⚙️ Configuração e Instalação

### Pré-requisitos
- Node.js (v20+)
- MariaDB / MySQL
- npm

### Instalação
```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp apps/api/.env.example apps/api/.env
# Edite o .env com as suas credenciais de BD
```

### Desenvolvimento
```bash
# Executar todos os apps em modo dev
npm run dev

# Executar apenas a API
npm run dev --workspace=apps/api

# Executar apenas o Web
npm run dev --workspace=apps/web
```

### Base de Dados
```bash
cd apps/api
npx prisma migrate dev
npx prisma generate
npm run seed
```

## 🔒 Roles e Permissões
- **SUPER_ADMIN:** Acesso global a todos os clientes e definições.
- **ADMIN:** Gestão total do seu cliente específico.
- **OPERATOR:** Acesso operacional focado em registos, checklists e anomalias.

## 🌐 Deploy
O projeto está configurado para correr atrás de um proxy Nginx:
- **Portal:** `patakus.cafemartins.pt`
- **API:** `patakus.cafemartins.pt/api/`

---
Desenvolvido para **Café Martins**.
