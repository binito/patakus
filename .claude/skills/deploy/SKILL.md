---
name: deploy
description: Deploy do Patakus em produção — build da API e da web e reinício via PM2 no Raspberry Pi. Usar sempre que for preciso publicar alterações, reiniciar os servidores, ou consultar logs/estado do PM2.
---

# Deploy — Patakus

- **Domínio:** `patakus.cafemartins.pt` (nginx com SSL wildcard)
- **API:** `patakus.cafemartins.pt/api/` → proxy para `localhost:3001`
- **Web:** `patakus.cafemartins.pt/` → proxy para `localhost:3000`
- **Servidor:** Raspberry Pi em `192.168.1.176`

## Processos em produção (PM2)

Os servidores correm em **modo produção** geridos pelo PM2, com arranque automático no boot via systemd (`pm2-jorge.service`).

Após alterações, fazer build e reiniciar com PM2 (sem pedir confirmação):

```bash
# API (NestJS)
npm run build --workspace=apps/api && pm2 restart patakus-api
```

## ⚠️ Build segura da Web (Next.js)

Antes de fazer build da web, garantir que **não há nenhum `next dev -p 3000` preso**. Isto já aconteceu e deixa o site em 500 porque `next dev` e `next build` usam a mesma pasta `apps/web/.next`; se a build mexer nessa pasta enquanto um servidor Next está a servir, ficam chunks em falta e o `patakus-web` no PM2 não consegue ficar saudável.

Sequência segura para a web:

```bash
pgrep -af "next dev|next-server|next start"
pm2 stop patakus-web
rm -rf apps/web/.next
npm run build --workspace=apps/web
pm2 restart patakus-web
```

## Comandos úteis

```bash
pm2 list                    # estado dos processos
pm2 logs patakus-web        # logs em tempo real
pm2 logs patakus-api
```

O ficheiro de configuração do PM2 está em `/home/jorge/patakus/ecosystem.config.js`.
